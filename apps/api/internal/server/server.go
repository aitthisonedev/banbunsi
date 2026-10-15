package server

import (
	"path/filepath"
	"strings"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/auth"
	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/handlers"
	"github.com/banbunsi/banbunsi/apps/api/internal/mail"
	"github.com/banbunsi/banbunsi/apps/api/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/gorm"
)

func New(cfg *config.Config, db *gorm.DB) *fiber.App {
	_ = handlers.EnsureUploadDir(cfg)
	proxyHeader := ""
	if !cfg.IsDev() {
		proxyHeader = "X-Real-IP"
	}
	app := fiber.New(fiber.Config{
		AppName:      "BAN BUNSI API",
		ErrorHandler: errorHandler,
		BodyLimit:    20 * 1024 * 1024,
		ProxyHeader:  proxyHeader,
	})
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Join(cfg.CORSOrigins, ","),
		AllowHeaders:     "Origin, Content-Type, Accept",
		AllowMethods:     "GET,POST,PATCH,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
	}))
	app.Use(middleware.CSRF(cfg))
	app.Use("/uploads", func(c *fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		return c.Next()
	})
	app.Static("/uploads/avatars", filepath.Join(cfg.UploadDir, "avatars"))
	app.Static("/uploads/covers", filepath.Join(cfg.UploadDir, "covers"))
	app.Static("/uploads/branding", filepath.Join(cfg.UploadDir, "branding"))

	sessions := &auth.SessionService{DB: db, TTL: cfg.SessionTTL}
	mailer := mail.New(cfg)
	authH := &handlers.AuthHandler{DB: db, Cfg: cfg, Sessions: sessions, Mailer: mailer}
	accountH := &handlers.AccountHandler{DB: db, Cfg: cfg}
	catH := &handlers.CategoryHandler{DB: db}
	setH := &handlers.SettingsHandler{DB: db, Cfg: cfg}
	adminH := &handlers.AdminHandler{DB: db}
	docH := &handlers.DocumentHandler{DB: db, Cfg: cfg, Sessions: sessions}
	quizH := &handlers.QuizHandler{DB: db}

	v1 := app.Group("/api/v1")
	v1.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	loginLimiter := limiter.New(limiter.Config{Max: 10, Expiration: 15 * time.Minute})
	registrationLimiter := limiter.New(limiter.Config{Max: 5, Expiration: 15 * time.Minute})
	recoveryLimiter := limiter.New(limiter.Config{Max: 5, Expiration: 15 * time.Minute})
	v1.Post("/auth/register", registrationLimiter, authH.Register)
	v1.Post("/auth/login", loginLimiter, authH.Login)
	v1.Post("/auth/logout", authH.Logout)
	v1.Get("/auth/google", authH.GoogleAuth)
	v1.Get("/auth/google/callback", authH.GoogleCallback)
	v1.Post("/auth/google/dev-callback", authH.GoogleDevCallback)
	v1.Post("/auth/verify-email", recoveryLimiter, authH.VerifyEmail)
	v1.Post("/auth/resend-verification", recoveryLimiter, authH.ResendVerification)
	v1.Post("/auth/forgot-password", recoveryLimiter, authH.ForgotPassword)
	v1.Post("/auth/reset-password", recoveryLimiter, authH.ResetPassword)
	v1.Get("/auth/me", middleware.Session(cfg, sessions), authH.Me)

	account := v1.Group("/account", middleware.Session(cfg, sessions))
	account.Patch("/profile", accountH.PatchProfile)
	account.Post("/avatar", accountH.UploadAvatar)
	account.Delete("/avatar", accountH.DeleteAvatar)
	account.Post("/password", accountH.ChangePassword)
	account.Post("/unlink-google", accountH.UnlinkGoogle)

	v1.Get("/categories", catH.PublicList)
	v1.Get("/settings/public", setH.PublicGet)
	v1.Get("/documents", docH.PublicList)
	v1.Get("/documents/:slug", docH.PublicGet)
	v1.Get("/documents/files/:id", docH.DownloadFile)
	v1.Get("/quizzes", quizH.PublicList)
	v1.Get("/quizzes/:slug", quizH.PublicGet)
	v1.Post("/quizzes/:slug/submit", quizH.PublicSubmit)

	membersH := &handlers.MembersHandler{DB: db, Sessions: sessions}

	admin := v1.Group("/admin", middleware.Session(cfg, sessions), middleware.RequireStaff())
	admin.Get("/dashboard", adminH.Dashboard)
	admin.Get("/categories", catH.AdminList)
	admin.Get("/categories/:id", catH.AdminGet)
	admin.Post("/categories", catH.AdminCreate)
	admin.Patch("/categories/:id", catH.AdminUpdate)
	admin.Delete("/categories/:id", catH.AdminDelete)
	admin.Get("/documents", docH.AdminList)
	admin.Get("/documents/:id", docH.AdminGet)
	admin.Post("/documents", docH.AdminCreate)
	admin.Patch("/documents/:id", docH.AdminUpdate)
	admin.Delete("/documents/:id", docH.AdminDelete)
	admin.Post("/documents/:id/cover", docH.AdminUploadCover)
	admin.Delete("/documents/:id/cover", docH.AdminDeleteCover)
	admin.Delete("/documents/:id/files/:fileID", docH.AdminDeleteFile)
	admin.Get("/quizzes", quizH.AdminList)
	admin.Get("/quizzes/:id", quizH.AdminGet)
	admin.Post("/quizzes", quizH.AdminCreate)
	admin.Patch("/quizzes/:id", quizH.AdminUpdate)
	admin.Delete("/quizzes/:id", quizH.AdminDelete)

	adminPlus := admin.Group("", middleware.RequireAdmin())
	adminPlus.Get("/members", membersH.List)
	adminPlus.Patch("/members/:id", membersH.PatchUser)
	adminPlus.Post("/members/:id/vip", membersH.PatchVIP)

	adminSettings := admin.Group("/settings", middleware.RequireAdmin())
	adminSettings.Get("/", setH.AdminGet)
	adminSettings.Patch("/", setH.AdminPatch)
	adminSettings.Post("/assets/:kind", setH.UploadAsset)
	adminSettings.Delete("/assets/:kind", setH.DeleteAsset)

	return app
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{"error": err.Error()})
}
