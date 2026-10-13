package middleware

import (
	"strings"

	"github.com/banbunsi/banbunsi/apps/api/internal/auth"
	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
)

func Session(cfg *config.Config, sessions *auth.SessionService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		raw := c.Cookies(cfg.SessionCookieName)
		user, session, err := sessions.Resolve(raw)
		if err == auth.ErrSuspended {
			c.ClearCookie(cfg.SessionCookieName)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Account suspended"})
		}
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}
		c.Locals("user", user)
		c.Locals("session", session)
		return c.Next()
	}
}

func RequireStaff() fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, ok := c.Locals("user").(*models.User)
		if !ok || !user.IsStaff() {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
		}
		return c.Next()
	}
}

func RequireAdmin() fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, ok := c.Locals("user").(*models.User)
		if !ok || !user.IsAdminPlus() {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
		}
		return c.Next()
	}
}

func CSRF(cfg *config.Config) fiber.Handler {
	trusted := map[string]struct{}{}
	for _, o := range cfg.CSRFTrustedOrigins {
		trusted[strings.TrimRight(o, "/")] = struct{}{}
	}
	return func(c *fiber.Ctx) error {
		method := c.Method()
		if method == fiber.MethodGet || method == fiber.MethodHead || method == fiber.MethodOptions {
			return c.Next()
		}
		origin := strings.TrimRight(c.Get("Origin"), "/")
		if origin == "" {
			// non-browser clients (curl) allowed in Foundation
			return c.Next()
		}
		if _, ok := trusted[origin]; !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Invalid origin"})
		}
		return c.Next()
	}
}
