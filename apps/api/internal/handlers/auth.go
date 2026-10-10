package handlers

import (
	"strings"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/auth"
	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/mail"
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/banbunsi/banbunsi/apps/api/internal/seed"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AuthHandler struct {
	DB       *gorm.DB
	Cfg      *config.Config
	Sessions *auth.SessionService
	Mailer   *mail.Mailer
}

type registerBody struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type tokenBody struct {
	Token string `json:"token"`
}

type emailBody struct {
	Email string `json:"email"`
}

type resetBody struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var body registerBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	name := strings.TrimSpace(body.Name)
	email := normalizeEmail(body.Email)
	if name == "" || email == "" || len(body.Password) < 8 {
		return errJSON(c, fiber.StatusBadRequest, "Name, email, and password (min 8) are required")
	}

	var existing models.User
	err := h.DB.Where("email = ?", email).First(&existing).Error
	if err == nil {
		// Enumeration-safe: pretend success
		return msg(c, safeAuthMessage)
	}
	if err != gorm.ErrRecordNotFound {
		return errJSON(c, fiber.StatusInternalServerError, "Could not register")
	}

	hash, err := auth.HashPassword(body.Password)
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not register")
	}
	user := models.User{
		Name:          name,
		Email:         email,
		PasswordHash:  hash,
		StaffRole:     models.RoleMember,
		AccountStatus: models.StatusActive,
	}
	if err := h.DB.Create(&user).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not register")
	}
	_ = seed.CreateCurrentMember(h.DB, user.ID, "registration")
	_ = h.issueVerification(user)
	_ = h.writeAudit(nil, "user.register", "user", user.ID.String(), "ok")
	return msg(c, safeAuthMessage)
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var body loginBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	email := normalizeEmail(body.Email)
	var user models.User
	if err := h.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return errJSON(c, fiber.StatusUnauthorized, "Invalid email or password")
	}
	if user.AccountStatus == models.StatusSuspended {
		return errJSON(c, fiber.StatusUnauthorized, "Account suspended")
	}
	if !auth.CheckPassword(user.PasswordHash, body.Password) {
		return errJSON(c, fiber.StatusUnauthorized, "Invalid email or password")
	}
	raw, _, err := h.Sessions.Create(user.ID, c.Get("User-Agent"), c.IP())
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not create session")
	}
	h.setSessionCookie(c, raw)
	tier := h.currentTier(user.ID)
	return c.JSON(userPayload(&user, tier))
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	raw := c.Cookies(h.Cfg.SessionCookieName)
	_ = h.Sessions.Revoke(raw)
	c.ClearCookie(h.Cfg.SessionCookieName)
	return msg(c, "Logged out")
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	tier := h.currentTier(user.ID)
	return c.JSON(userPayload(user, tier))
}

func (h *AuthHandler) VerifyEmail(c *fiber.Ctx) error {
	var body tokenBody
	if err := c.BodyParser(&body); err != nil || strings.TrimSpace(body.Token) == "" {
		return errJSON(c, fiber.StatusBadRequest, "Token is required")
	}
	hash := auth.HashToken(body.Token)
	var tok models.EmailVerificationToken
	err := h.DB.Where("token_hash = ? AND used_at IS NULL AND expires_at > ?", hash, time.Now().UTC()).First(&tok).Error
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid or expired token")
	}
	now := time.Now().UTC()
	if err := h.DB.Model(&models.User{}).Where("id = ?", tok.UserID).Update("email_verified_at", now).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not verify email")
	}
	_ = h.DB.Model(&tok).Update("used_at", now).Error
	return msg(c, "Email verified")
}

func (h *AuthHandler) ResendVerification(c *fiber.Ctx) error {
	var body emailBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	email := normalizeEmail(body.Email)
	var user models.User
	if err := h.DB.Where("email = ?", email).First(&user).Error; err == nil {
		if !user.EmailVerified() {
			_ = h.issueVerification(user)
		}
	}
	return msg(c, safeAuthMessage)
}

func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var body emailBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	email := normalizeEmail(body.Email)
	var user models.User
	if err := h.DB.Where("email = ?", email).First(&user).Error; err == nil {
		raw, hash, err := auth.NewOpaqueToken()
		if err == nil {
			tok := models.PasswordResetToken{
				UserID:    user.ID,
				TokenHash: hash,
				ExpiresAt: time.Now().UTC().Add(1 * time.Hour),
			}
			if err := h.DB.Create(&tok).Error; err == nil {
				_ = h.Mailer.SendPasswordReset(user.Email, raw)
			}
		}
	}
	return msg(c, safeAuthMessage)
}

func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var body resetBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if strings.TrimSpace(body.Token) == "" || len(body.Password) < 8 {
		return errJSON(c, fiber.StatusBadRequest, "Token and password (min 8) are required")
	}
	hash := auth.HashToken(body.Token)
	var tok models.PasswordResetToken
	err := h.DB.Where("token_hash = ? AND used_at IS NULL AND expires_at > ?", hash, time.Now().UTC()).First(&tok).Error
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid or expired token")
	}
	pwHash, err := auth.HashPassword(body.Password)
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not reset password")
	}
	now := time.Now().UTC()
	if err := h.DB.Model(&models.User{}).Where("id = ?", tok.UserID).Update("password_hash", pwHash).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not reset password")
	}
	_ = h.DB.Model(&tok).Update("used_at", now).Error
	_ = h.Sessions.RevokeAllForUser(tok.UserID)
	return msg(c, "Password updated")
}

func (h *AuthHandler) issueVerification(user models.User) error {
	raw, hash, err := auth.NewOpaqueToken()
	if err != nil {
		return err
	}
	tok := models.EmailVerificationToken{
		UserID:    user.ID,
		TokenHash: hash,
		ExpiresAt: time.Now().UTC().Add(24 * time.Hour),
	}
	if err := h.DB.Create(&tok).Error; err != nil {
		return err
	}
	return h.Mailer.SendVerification(user.Email, raw)
}

func (h *AuthHandler) setSessionCookie(c *fiber.Ctx, raw string) {
	c.Cookie(&fiber.Cookie{
		Name:     h.Cfg.SessionCookieName,
		Value:    raw,
		Path:     "/",
		HTTPOnly: true,
		Secure:   h.Cfg.SessionCookieSecure,
		SameSite: "Lax",
		MaxAge:   int(h.Cfg.SessionTTL.Seconds()),
	})
}

func (h *AuthHandler) currentTier(userID interface{}) models.MembershipTier {
	var m models.Membership
	err := h.DB.Where("user_id = ? AND is_current = ?", userID, true).First(&m).Error
	if err != nil {
		return models.TierMember
	}
	if m.Tier == models.TierVIP {
		if m.EndsAt != nil && m.EndsAt.Before(time.Now().UTC()) {
			return models.TierMember
		}
		return models.TierVIP
	}
	return models.TierMember
}

func (h *AuthHandler) writeAudit(actor *models.User, action, targetType, targetID, result string) error {
	logRow := models.AuditLog{
		Action:     action,
		TargetType: targetType,
		TargetID:   targetID,
		Result:     result,
		Metadata:   "{}",
	}
	if actor != nil {
		id := actor.ID
		logRow.ActorUserID = &id
	}
	return h.DB.Create(&logRow).Error
}
