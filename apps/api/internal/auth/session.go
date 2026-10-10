package auth

import (
	"errors"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
	ErrSuspended    = errors.New("account suspended")
)

type SessionService struct {
	DB  *gorm.DB
	TTL time.Duration
}

func (s *SessionService) Create(userID uuid.UUID, userAgent, ip string) (rawToken string, session *models.Session, err error) {
	raw, hash, err := NewOpaqueToken()
	if err != nil {
		return "", nil, err
	}
	session = &models.Session{
		UserID:    userID,
		TokenHash: hash,
		ExpiresAt: time.Now().UTC().Add(s.TTL),
		UserAgent: truncate(userAgent, 512),
		IP:        truncate(ip, 64),
	}
	if err := s.DB.Create(session).Error; err != nil {
		return "", nil, err
	}
	return raw, session, nil
}

func (s *SessionService) Resolve(rawToken string) (*models.User, *models.Session, error) {
	if rawToken == "" {
		return nil, nil, ErrUnauthorized
	}
	hash := HashToken(rawToken)
	var session models.Session
	err := s.DB.Where("token_hash = ? AND revoked_at IS NULL AND expires_at > ?", hash, time.Now().UTC()).
		First(&session).Error
	if err != nil {
		return nil, nil, ErrUnauthorized
	}
	var user models.User
	if err := s.DB.First(&user, "id = ?", session.UserID).Error; err != nil {
		return nil, nil, ErrUnauthorized
	}
	if user.AccountStatus == models.StatusSuspended {
		now := time.Now().UTC()
		_ = s.DB.Model(&session).Update("revoked_at", now).Error
		return nil, nil, ErrSuspended
	}
	return &user, &session, nil
}

func (s *SessionService) Revoke(rawToken string) error {
	if rawToken == "" {
		return nil
	}
	hash := HashToken(rawToken)
	now := time.Now().UTC()
	return s.DB.Model(&models.Session{}).
		Where("token_hash = ? AND revoked_at IS NULL", hash).
		Update("revoked_at", now).Error
}

func (s *SessionService) RevokeAllForUser(userID uuid.UUID) error {
	now := time.Now().UTC()
	return s.DB.Model(&models.Session{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", now).Error
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}
