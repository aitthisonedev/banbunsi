package server

import (
	"strings"

	"github.com/banbunsi/banbunsi/apps/api/internal/auth"
	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/handlers"
	"github.com/banbunsi/banbunsi/apps/api/internal/mail"
	"github.com/banbunsi/banbunsi/apps/api/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/gorm"
)

func New(cfg *config.Config, db *gorm.DB) *fiber.App {
	_ = handlers.EnsureUploadDir(cfg)
	app := fiber.New(fiber.Config{
		AppName:      "BAN BUNSI API",
		ErrorHandler: errorHandler,
		BodyLimit:    4 * 1024 * 1024,
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
	app.Static("/uploads", cfg.UploadDir)

	sessions := &auth.SessionService{DB: db, TTL: cfg.SessionTTL}
	mailer := mail.New(cfg)
	authH := &handlers.AuthHandler{DB: db, Cfg: cfg, Sessions: sessions, Mailer: mailer}
	accountH := &handlers.AccountHandler{DB: db, Cfg: cfg}
	catH := &handlers.CategoryHandler{DB: db}
	setH := &handlers.SettingsHandler{DB: db}
	adminH := &handlers.AdminHandler{DB: db}
	docH := &handlers.DocumentHandler{DB: db, Cfg: cfg, Sessions: sessions}
	quizH := &handlers.QuizHandler{DB: db}

	v1 := app.Group("/api/v1")
	v1.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	v1.Post("/auth/register", authH.Register)
	v1.Post("/auth/login", authH.Login)
	v1.Post("/auth/logout", authH.Logout)
	v1.Post("/auth/verify-email", authH.VerifyEmail)
	v1.Post("/auth/resend-verification", authH.ResendVerification)
	v1.Post("/auth/forgot-password", authH.ForgotPassword)
	v1.Post("/auth/reset-password", authH.ResetPassword)
	v1.Get("/auth/me", middleware.Session(cfg, sessions), authH.Me)

	account := v1.Group("/account", middleware.Session(cfg, sessions))
	account.Patch("/profile", accountH.PatchProfile)
	account.Post("/avatar", accountH.UploadAvatar)
	account.Delete("/avatar", accountH.DeleteAvatar)
	account.Post("/password", accountH.ChangePassword)

	v1.Get("/categories", catH.PublicList)
	v1.Get("/settings/public", setH.PublicGet)
	v1.Get("/documents", docH.PublicList)
	v1.Get("/documents/:slug", docH.PublicGet)
	v1.Get("/quizzes", quizH.PublicList)
	v1.Get("/quizzes/:slug", quizH.PublicGet)
	v1.Post("/quizzes/:slug/submit", quizH.PublicSubmit)

	admin := v1.Group("/admin", middleware.Session(cfg, sessions), middleware.RequireStaff())
	admin.Get("/dashboard", adminH.Dashboard)
	admin.Get("/categories", catH.AdminList)
	admin.Get("/documents", docH.AdminList)
	admin.Get("/documents/:id", docH.AdminGet)
	admin.Post("/documents", docH.AdminCreate)
	admin.Patch("/documents/:id", docH.AdminUpdate)
	admin.Delete("/documents/:id", docH.AdminDelete)

	adminSettings := admin.Group("/settings", middleware.RequireAdmin())
	adminSettings.Get("/", setH.AdminGet)
	adminSettings.Patch("/", setH.AdminPatch)

	return app
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{"error": err.Error()})
}
