package handlers

import (
	"strings"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const (
	safeAuthMessage = "If this information can be used, we will send the next steps."
)

type API struct {
	// wired in server
}

func msg(c *fiber.Ctx, message string) error {
	return c.JSON(fiber.Map{"message": message})
}

func errJSON(c *fiber.Ctx, status int, message string) error {
	return c.Status(status).JSON(fiber.Map{"error": message})
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func localeOrDefault(v string) string {
	v = strings.ToLower(strings.TrimSpace(v))
	if v == "en" {
		return "en"
	}
	return "lo"
}

func userPayload(u *models.User, tier models.MembershipTier) fiber.Map {
	if tier == "" {
		tier = models.TierMember
	}
	return fiber.Map{
		"id":              u.ID.String(),
		"name":            u.Name,
		"email":           u.Email,
		"email_verified":  u.EmailVerified(),
		"staff_role":      u.StaffRole,
		"account_status":  u.AccountStatus,
		"membership_tier": tier,
	}
}

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}
