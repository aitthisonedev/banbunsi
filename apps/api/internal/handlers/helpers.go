package handlers

import (
	"strings"
	"time"

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

func userPayload(u *models.User, tier models.MembershipTier, endsAt *time.Time) fiber.Map {
	if tier == "" {
		tier = models.TierMember
	}
	first := u.FirstName
	last := u.LastName
	if first == "" && u.Name != "" {
		first = u.Name
	}
	avatarURL := ""
	if u.AvatarPath != "" {
		if strings.HasPrefix(u.AvatarPath, "http://") || strings.HasPrefix(u.AvatarPath, "https://") {
			avatarURL = u.AvatarPath
		} else {
			avatarURL = "/uploads/" + strings.TrimPrefix(u.AvatarPath, "/")
		}
	}
	var ends any
	if endsAt != nil {
		ends = endsAt.UTC().Format(time.RFC3339)
	}
	return fiber.Map{
		"id":                 u.ID.String(),
		"name":               u.Name,
		"first_name":         first,
		"last_name":          last,
		"phone":              u.Phone,
		"avatar_url":         avatarURL,
		"email":              u.Email,
		"email_verified":     u.EmailVerified(),
		"staff_role":         u.StaffRole,
		"account_status":     u.AccountStatus,
		"membership_tier":    tier,
		"membership_ends_at": ends,
		"google_id":          u.GoogleID,
		"google_email":       u.GoogleEmail,
		"has_google":         u.GoogleID != "",
		"has_password":       len(u.PasswordHash) > 0,
	}
}

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}
