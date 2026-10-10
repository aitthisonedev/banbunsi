package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReadAccess string

const (
	ReadPublic ReadAccess = "public"
	ReadMember ReadAccess = "member"
	ReadVIP    ReadAccess = "vip"
)

type DocStatus string

const (
	DocDraft     DocStatus = "draft"
	DocPublished DocStatus = "published"
	DocArchived  DocStatus = "archived"
)

type DownloadAccess string

const (
	DownloadMember DownloadAccess = "member"
	DownloadVIP    DownloadAccess = "vip"
)

type Document struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	DocumentNumber string         `gorm:"size:64;uniqueIndex;not null" json:"document_number"`
	CategoryID     uuid.UUID      `gorm:"type:uuid;index;not null" json:"category_id"`
	ReadAccess     ReadAccess     `gorm:"size:16;not null;default:public" json:"read_access"`
	Status         DocStatus      `gorm:"size:16;not null;default:draft;index" json:"status"`
	PublishedAt    *time.Time     `json:"published_at,omitempty"`
	EffectiveDate  *time.Time     `gorm:"type:date" json:"effective_date,omitempty"`
	Year           int            `gorm:"index" json:"year"`
	Tags           string         `gorm:"size:500" json:"tags"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	Category     Category              `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Translations []DocumentTranslation `gorm:"foreignKey:DocumentID" json:"translations,omitempty"`
	Files        []DocumentFile        `gorm:"foreignKey:DocumentID" json:"files,omitempty"`
}

func (d *Document) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

type DocumentTranslation struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	DocumentID     uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_doc_locale;not null" json:"document_id"`
	Locale         string    `gorm:"size:8;uniqueIndex:idx_doc_locale;uniqueIndex:idx_doc_slug_locale;not null" json:"locale"`
	Title          string    `gorm:"size:300;not null" json:"title"`
	Slug           string    `gorm:"size:220;not null;uniqueIndex:idx_doc_slug_locale" json:"slug"`
	Summary        string    `gorm:"size:2000" json:"summary"`
	BodyHTML       string    `gorm:"type:text" json:"body_html"`
	SEOTitle       string    `gorm:"size:255" json:"seo_title"`
	SEODescription string    `gorm:"size:500" json:"seo_description"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (t *DocumentTranslation) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

type DocumentFile struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	DocumentID     uuid.UUID      `gorm:"type:uuid;index;not null" json:"document_id"`
	Label          string         `gorm:"size:200;not null" json:"label"`
	FileName       string         `gorm:"size:255;not null" json:"file_name"`
	Mime           string         `gorm:"size:120;not null" json:"mime"`
	SizeBytes      int64          `gorm:"not null;default:0" json:"size_bytes"`
	Language       string         `gorm:"size:8" json:"language"`
	Version        string         `gorm:"size:64" json:"version"`
	DownloadAccess DownloadAccess `gorm:"size:16;not null;default:member" json:"download_access"`
	SortOrder      int            `gorm:"not null;default:0" json:"sort_order"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

func (f *DocumentFile) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}
