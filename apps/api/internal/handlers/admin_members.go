package handlers

import (
	"strings"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/auth"
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MembersHandler struct {
	DB       *gorm.DB
	Sessions *auth.SessionService
}

type memberRoleBody struct {
	StaffRole     string `json:"staff_role"`
	AccountStatus string `json:"account_status"`
}

type vipBody struct {
	Action   string  `json:"action"` // approve | renew | cancel
	StartsAt *string `json:"starts_at"`
	EndsAt   *string `json:"ends_at"`
	Notes    string  `json:"notes"`
}

func (h *MembersHandler) List(c *fiber.Ctx) error {
	q := strings.TrimSpace(c.Query("q"))
	dbq := h.DB.Model(&models.User{}).Order("created_at DESC")
	if q != "" {
		like := "%" + strings.ToLower(q) + "%"
		dbq = dbq.Where("lower(email) LIKE ? OR lower(name) LIKE ?", like, like)
	}
	var users []models.User
	if err := dbq.Limit(200).Find(&users).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load members")
	}
	items := make([]fiber.Map, 0, len(users))
	for _, u := range users {
		tier, endsAt := h.membershipInfo(u.ID)
		payload := userPayload(&u, tier, endsAt)
		items = append(items, fiber.Map{
			"id":                 payload["id"],
			"name":               payload["name"],
			"email":              payload["email"],
			"avatar_url":         payload["avatar_url"],
			"staff_role":         payload["staff_role"],
			"account_status":     payload["account_status"],
			"email_verified":     payload["email_verified"],
			"membership_tier":    payload["membership_tier"],
			"membership_ends_at": payload["membership_ends_at"],
			"created_at":         u.CreatedAt.UTC().Format(time.RFC3339),
		})
	}
	return c.JSON(fiber.Map{"items": items})
}

func (h *MembersHandler) PatchUser(c *fiber.Ctx) error {
	actor := c.Locals("user").(*models.User)
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	if id == actor.ID {
		return errJSON(c, fiber.StatusBadRequest, "Cannot change your own role or status here")
	}
	var body memberRoleBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	var user models.User
	if err := h.DB.First(&user, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errJSON(c, fiber.StatusNotFound, "User not found")
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not load user")
	}
	if user.StaffRole == models.RoleOwner && actor.StaffRole != models.RoleOwner {
		return errJSON(c, fiber.StatusForbidden, "Only owner can modify another owner")
	}
	updates := map[string]interface{}{}
	if body.StaffRole != "" {
		role := models.StaffRole(strings.ToLower(strings.TrimSpace(body.StaffRole)))
		switch role {
		case models.RoleMember, models.RoleEditor, models.RoleAdmin:
			updates["staff_role"] = role
		case models.RoleOwner:
			if actor.StaffRole != models.RoleOwner {
				return errJSON(c, fiber.StatusForbidden, "Only owner can assign owner")
			}
			updates["staff_role"] = role
		default:
			return errJSON(c, fiber.StatusBadRequest, "Invalid staff_role")
		}
	}
	if body.AccountStatus != "" {
		st := models.AccountStatus(strings.ToLower(strings.TrimSpace(body.AccountStatus)))
		if st != models.StatusActive && st != models.StatusSuspended {
			return errJSON(c, fiber.StatusBadRequest, "Invalid account_status")
		}
		updates["account_status"] = st
	}
	if len(updates) == 0 {
		return errJSON(c, fiber.StatusBadRequest, "No changes")
	}
	if err := h.DB.Model(&user).Updates(updates).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not update user")
	}
	if st, ok := updates["account_status"].(models.AccountStatus); ok && st == models.StatusSuspended {
		_ = h.Sessions.RevokeAllForUser(user.ID)
	}
	_ = h.DB.First(&user, "id = ?", user.ID)
	tier, endsAt := h.membershipInfo(user.ID)
	var ends any
	if endsAt != nil {
		ends = endsAt.UTC().Format(time.RFC3339)
	}
	return c.JSON(fiber.Map{
		"id":                 user.ID.String(),
		"name":               user.Name,
		"email":              user.Email,
		"staff_role":         user.StaffRole,
		"account_status":     user.AccountStatus,
		"membership_tier":    tier,
		"membership_ends_at": ends,
	})
}

func (h *MembersHandler) PatchVIP(c *fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	var body vipBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	action := strings.ToLower(strings.TrimSpace(body.Action))
	if action != "approve" && action != "renew" && action != "cancel" {
		return errJSON(c, fiber.StatusBadRequest, "Invalid action")
	}
	var user models.User
	if err := h.DB.First(&user, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errJSON(c, fiber.StatusNotFound, "User not found")
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not load user")
	}

	now := time.Now().UTC()
	startsAt := now
	if body.StartsAt != nil && strings.TrimSpace(*body.StartsAt) != "" {
		t, err := time.Parse(time.RFC3339, strings.TrimSpace(*body.StartsAt))
		if err != nil {
			return errJSON(c, fiber.StatusBadRequest, "Invalid starts_at")
		}
		startsAt = t.UTC()
	}
	var endsAt *time.Time
	if body.EndsAt != nil && strings.TrimSpace(*body.EndsAt) != "" {
		t, err := time.Parse(time.RFC3339, strings.TrimSpace(*body.EndsAt))
		if err != nil {
			return errJSON(c, fiber.StatusBadRequest, "Invalid ends_at")
		}
		tt := t.UTC()
		endsAt = &tt
	}

	err = h.DB.Transaction(func(tx *gorm.DB) error {
		// close current memberships
		if err := tx.Model(&models.Membership{}).
			Where("user_id = ? AND is_current = ?", user.ID, true).
			Updates(map[string]interface{}{"is_current": false, "status": "ended"}).Error; err != nil {
			return err
		}
		tier := models.TierMember
		status := "active"
		notes := strings.TrimSpace(body.Notes)
		if action == "approve" || action == "renew" {
			tier = models.TierVIP
			if notes == "" {
				notes = action + " VIP"
			}
		} else {
			tier = models.TierMember
			endsAt = nil
			if notes == "" {
				notes = "VIP cancelled"
			}
		}
		m := models.Membership{
			UserID:    user.ID,
			Tier:      tier,
			Status:    status,
			IsCurrent: true,
			StartsAt:  startsAt,
			EndsAt:    endsAt,
			Notes:     notes,
		}
		return tx.Create(&m).Error
	})
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not update VIP")
	}
	tier, ends := h.membershipInfo(user.ID)
	var endsOut any
	if ends != nil {
		endsOut = ends.UTC().Format(time.RFC3339)
	}
	return c.JSON(fiber.Map{
		"id":                 user.ID.String(),
		"membership_tier":    tier,
		"membership_ends_at": endsOut,
	})
}

func (h *MembersHandler) membershipInfo(userID uuid.UUID) (models.MembershipTier, *time.Time) {
	var m models.Membership
	err := h.DB.Where("user_id = ? AND is_current = ?", userID, true).First(&m).Error
	if err != nil {
		return models.TierMember, nil
	}
	if m.Tier == models.TierVIP {
		if m.EndsAt != nil && m.EndsAt.Before(time.Now().UTC()) {
			return models.TierMember, m.EndsAt
		}
		return models.TierVIP, m.EndsAt
	}
	return models.TierMember, m.EndsAt
}
