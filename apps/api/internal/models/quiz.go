package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Quiz struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Code         string         `gorm:"size:64;uniqueIndex;not null" json:"code"`
	Difficulty   string         `gorm:"size:16;not null;default:easy" json:"difficulty"`
	PassPercent  int            `gorm:"not null;default:60" json:"pass_percent"`
	SortOrder    int            `gorm:"not null;default:0" json:"sort_order"`
	IsPublished  bool           `gorm:"not null;default:true;index" json:"is_published"`
	QuestionsJSON datatypes.JSON `gorm:"type:jsonb;not null" json:"-"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Translations []QuizTranslation `gorm:"foreignKey:QuizID" json:"translations,omitempty"`
}

func (q *Quiz) BeforeCreate(tx *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}

type QuizTranslation struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	QuizID      uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_quiz_locale;not null" json:"quiz_id"`
	Locale      string    `gorm:"size:8;uniqueIndex:idx_quiz_locale;not null" json:"locale"`
	Title       string    `gorm:"size:240;not null" json:"title"`
	Description string    `gorm:"size:1000" json:"description"`
	Category    string    `gorm:"size:120;not null" json:"category"`
	Slug        string    `gorm:"size:220;not null;index" json:"slug"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (t *QuizTranslation) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
