package handlers

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/auth"
	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const maxAvatarBytes = 2 << 20 // 2 MiB

type AccountHandler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

type profileBody struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
}

type passwordBody struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (h *AccountHandler) PatchProfile(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	var body profileBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	first := strings.TrimSpace(body.FirstName)
	last := strings.TrimSpace(body.LastName)
	phone := strings.TrimSpace(body.Phone)
	if first == "" {
		return errJSON(c, fiber.StatusBadRequest, "First name is required")
	}
	if len(first) > 100 || len(last) > 100 {
		return errJSON(c, fiber.StatusBadRequest, "Name is too long")
	}
	if len(phone) > 32 {
		return errJSON(c, fiber.StatusBadRequest, "Phone is too long")
	}
	display := models.DisplayName(first, last)
	updates := map[string]interface{}{
		"first_name": first,
		"last_name":  last,
		"phone":      phone,
		"name":       display,
	}
	if err := h.DB.Model(user).Updates(updates).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not update profile")
	}
	user.FirstName = first
	user.LastName = last
	user.Phone = phone
	user.Name = display
	tier, endsAt := h.membershipInfo(user.ID)
	return c.JSON(userPayload(user, tier, endsAt))
}

func (h *AccountHandler) UploadAvatar(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	file, err := c.FormFile("avatar")
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Avatar file is required")
	}
	if file.Size <= 0 || file.Size > maxAvatarBytes {
		return errJSON(c, fiber.StatusBadRequest, "Avatar must be 1 byte–2MB")
	}
	ext, ok := avatarExt(file.Filename, file.Header.Get("Content-Type"))
	if !ok {
		return errJSON(c, fiber.StatusBadRequest, "Avatar must be JPEG, PNG, or WebP")
	}

	dir := filepath.Join(h.Cfg.UploadDir, "avatars")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not store avatar")
	}
	rel := filepath.ToSlash(filepath.Join("avatars", user.ID.String()+ext))
	abs := filepath.Join(h.Cfg.UploadDir, filepath.FromSlash(rel))

	src, err := file.Open()
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not read avatar")
	}
	defer src.Close()

	tmp := abs + ".tmp"
	out, err := os.OpenFile(tmp, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not store avatar")
	}
	written, copyErr := io.Copy(out, io.LimitReader(src, maxAvatarBytes+1))
	closeErr := out.Close()
	if copyErr != nil || closeErr != nil || written > maxAvatarBytes {
		_ = os.Remove(tmp)
		return errJSON(c, fiber.StatusBadRequest, "Avatar must be 1 byte–2MB")
	}
	if err := os.Rename(tmp, abs); err != nil {
		_ = os.Remove(tmp)
		return errJSON(c, fiber.StatusInternalServerError, "Could not store avatar")
	}

	if user.AvatarPath != "" && user.AvatarPath != rel {
		_ = os.Remove(filepath.Join(h.Cfg.UploadDir, filepath.FromSlash(user.AvatarPath)))
	}
	if err := h.DB.Model(user).Update("avatar_path", rel).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not update avatar")
	}
	user.AvatarPath = rel
	tier, endsAt := h.membershipInfo(user.ID)
	return c.JSON(userPayload(user, tier, endsAt))
}

func (h *AccountHandler) DeleteAvatar(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	if user.AvatarPath != "" {
		_ = os.Remove(filepath.Join(h.Cfg.UploadDir, filepath.FromSlash(user.AvatarPath)))
	}
	if err := h.DB.Model(user).Update("avatar_path", "").Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not remove avatar")
	}
	user.AvatarPath = ""
	tier, endsAt := h.membershipInfo(user.ID)
	return c.JSON(userPayload(user, tier, endsAt))
}

func (h *AccountHandler) ChangePassword(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	var body passwordBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if len(body.NewPassword) < 8 {
		return errJSON(c, fiber.StatusBadRequest, "New password must be at least 8 characters")
	}
	if len(user.PasswordHash) > 0 {
		if !auth.CheckPassword(user.PasswordHash, body.CurrentPassword) {
			return errJSON(c, fiber.StatusUnauthorized, "Current password is incorrect")
		}
	}
	hash, err := auth.HashPassword(body.NewPassword)
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not update password")
	}
	if err := h.DB.Model(user).Update("password_hash", hash).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not update password")
	}
	return msg(c, "Password updated")
}

func (h *AccountHandler) UnlinkGoogle(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	if user.GoogleID == "" {
		return errJSON(c, fiber.StatusBadRequest, "Google is not linked to this account")
	}
	if len(user.PasswordHash) == 0 {
		return errJSON(c, fiber.StatusBadRequest, "Cannot unlink Google because no password has been set. Please set a password first.")
	}
	updates := map[string]interface{}{
		"google_id":    "",
		"google_email": "",
	}
	if err := h.DB.Model(user).Updates(updates).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not unlink Google account")
	}
	user.GoogleID = ""
	user.GoogleEmail = ""
	tier, endsAt := h.membershipInfo(user.ID)
	return c.JSON(userPayload(user, tier, endsAt))
}

func (h *AccountHandler) membershipInfo(userID uuid.UUID) (models.MembershipTier, *time.Time) {
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

func avatarExt(filename, contentType string) (string, bool) {
	ct := strings.ToLower(strings.TrimSpace(contentType))
	switch {
	case strings.Contains(ct, "jpeg"), strings.Contains(ct, "jpg"):
		return ".jpg", true
	case strings.Contains(ct, "png"):
		return ".png", true
	case strings.Contains(ct, "webp"):
		return ".webp", true
	}
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		return ".jpg", true
	case ".png":
		return ".png", true
	case ".webp":
		return ".webp", true
	default:
		return "", false
	}
}

// EnsureUploadDir creates the upload root (called from server boot).
func EnsureUploadDir(cfg *config.Config) error {
	if err := os.MkdirAll(filepath.Join(cfg.UploadDir, "avatars"), 0o755); err != nil {
		return fmt.Errorf("upload dir: %w", err)
	}
	return nil
}
