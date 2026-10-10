package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StaffRole string

const (
	RoleMember StaffRole = "member"
	RoleEditor StaffRole = "editor"
	RoleAdmin  StaffRole = "admin"
	RoleOwner  StaffRole = "owner"
)

type AccountStatus string

const (
	StatusActive    AccountStatus = "active"
	StatusSuspended AccountStatus = "suspended"
)

type MembershipTier string

const (
	TierMember MembershipTier = "member"
	TierVIP    MembershipTier = "vip"
)

type User struct {
	ID              uuid.UUID     `gorm:"type:uuid;primaryKey" json:"id"`
	Name            string        `gorm:"size:200;not null" json:"name"`
	Email           string        `gorm:"size:320;uniqueIndex;not null" json:"email"`
	PasswordHash    string        `gorm:"size:255;not null" json:"-"`
	EmailVerifiedAt *time.Time    `json:"email_verified_at,omitempty"`
	StaffRole       StaffRole     `gorm:"size:32;not null;default:member" json:"staff_role"`
	AccountStatus   AccountStatus `gorm:"size:32;not null;default:active" json:"account_status"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (u *User) EmailVerified() bool {
	return u.EmailVerifiedAt != nil
}

func (u *User) IsStaff() bool {
	return u.StaffRole == RoleEditor || u.StaffRole == RoleAdmin || u.StaffRole == RoleOwner
}

func (u *User) IsAdminPlus() bool {
	return u.StaffRole == RoleAdmin || u.StaffRole == RoleOwner
}

type Session struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID  `gorm:"type:uuid;index;not null"`
	TokenHash string     `gorm:"size:64;uniqueIndex;not null"`
	ExpiresAt time.Time  `gorm:"index;not null"`
	RevokedAt *time.Time `gorm:"index"`
	UserAgent string     `gorm:"size:512"`
	IP        string     `gorm:"size:64"`
	CreatedAt time.Time
	User      User `gorm:"constraint:OnDelete:CASCADE"`
}

func (s *Session) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

type EmailVerificationToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;index;not null"`
	TokenHash string    `gorm:"size:64;uniqueIndex;not null"`
	ExpiresAt time.Time `gorm:"not null"`
	UsedAt    *time.Time
	CreatedAt time.Time
}

func (t *EmailVerificationToken) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

type PasswordResetToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;index;not null"`
	TokenHash string    `gorm:"size:64;uniqueIndex;not null"`
	ExpiresAt time.Time `gorm:"not null"`
	UsedAt    *time.Time
	CreatedAt time.Time
}

func (t *PasswordResetToken) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

type Category struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Code      string         `gorm:"size:64;uniqueIndex;not null" json:"code"`
	ParentID  *uuid.UUID     `gorm:"type:uuid;index" json:"parent_id,omitempty"`
	SortOrder int            `gorm:"not null;default:0" json:"sort_order"`
	IsActive  bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Translations []CategoryTranslation `gorm:"foreignKey:CategoryID" json:"translations,omitempty"`
	Children     []Category            `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type CategoryTranslation struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	CategoryID      uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_cat_locale;not null" json:"category_id"`
	Locale          string    `gorm:"size:8;uniqueIndex:idx_cat_locale;not null" json:"locale"`
	Name            string    `gorm:"size:200;not null" json:"name"`
	Description     string    `gorm:"size:1000" json:"description"`
	Slug            string    `gorm:"size:220;not null" json:"slug"`
	SEOTitle        string    `gorm:"size:255" json:"seo_title"`
	SEODescription  string    `gorm:"size:500" json:"seo_description"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (t *CategoryTranslation) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

type SiteSettings struct {
	ID                         uint   `gorm:"primaryKey" json:"id"`
	SiteNameLo                 string `gorm:"size:200;not null" json:"site_name_lo"`
	SiteNameEn                 string `gorm:"size:200;not null" json:"site_name_en"`
	Timezone                   string `gorm:"size:64;not null" json:"timezone"`
	ContactEmail               string `gorm:"size:320;not null" json:"contact_email"`
	WhatsappNumber             string `gorm:"size:32;not null" json:"whatsapp_number"`
	FacebookURL                string `gorm:"size:500;not null" json:"facebook_url"`
	TiktokURL                  string `gorm:"size:500;not null" json:"tiktok_url"`
	DefaultMetaDescriptionLo   string `gorm:"size:500" json:"default_meta_description_lo"`
	DefaultMetaDescriptionEn   string `gorm:"size:500" json:"default_meta_description_en"`
	DefaultSEOTitleLo          string `gorm:"size:255" json:"default_seo_title_lo"`
	DefaultSEOTitleEn          string `gorm:"size:255" json:"default_seo_title_en"`
	UpdatedAt                  time.Time `json:"updated_at"`
}

type Membership struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;index;not null" json:"user_id"`
	Tier      MembershipTier `gorm:"size:32;not null" json:"tier"`
	Status    string         `gorm:"size:32;not null;default:active" json:"status"`
	IsCurrent bool           `gorm:"not null;default:false;index" json:"is_current"`
	StartsAt  time.Time      `gorm:"not null" json:"starts_at"`
	EndsAt    *time.Time     `json:"ends_at,omitempty"`
	Notes     string         `gorm:"size:1000" json:"notes"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

func (m *Membership) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type AuditLog struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	ActorUserID *uuid.UUID `gorm:"type:uuid;index" json:"actor_user_id,omitempty"`
	Action      string    `gorm:"size:120;not null;index" json:"action"`
	TargetType  string    `gorm:"size:120;not null" json:"target_type"`
	TargetID    string    `gorm:"size:120" json:"target_id"`
	Result      string    `gorm:"size:64;not null" json:"result"`
	Metadata    string    `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	CreatedAt   time.Time `gorm:"index" json:"created_at"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
