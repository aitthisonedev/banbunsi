package seed

import (
	_ "embed"
	"encoding/json"
	"log"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

//go:embed quizzes_demo.json
var quizzesDemoJSON []byte

type quizSeedJSON struct {
	Code          string `json:"code"`
	Difficulty    string `json:"difficulty"`
	PassPercent   int    `json:"pass_percent"`
	SortOrder     int    `json:"sort_order"`
	LoTitle       string `json:"lo_title"`
	EnTitle       string `json:"en_title"`
	LoSlug        string `json:"lo_slug"`
	EnSlug        string `json:"en_slug"`
	LoCategory    string `json:"lo_category"`
	EnCategory    string `json:"en_category"`
	LoDescription string `json:"lo_description"`
	EnDescription string `json:"en_description"`
	Questions     any    `json:"questions"`
}

func seedQuizzes(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.Quiz{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	var seeds []quizSeedJSON
	if err := json.Unmarshal(quizzesDemoJSON, &seeds); err != nil {
		return err
	}

	for _, s := range seeds {
		payload, err := json.Marshal(s.Questions)
		if err != nil {
			return err
		}
		quiz := models.Quiz{
			Code:          s.Code,
			Difficulty:    s.Difficulty,
			PassPercent:   s.PassPercent,
			SortOrder:     s.SortOrder,
			IsPublished:   true,
			QuestionsJSON: datatypes.JSON(payload),
		}
		if err := db.Create(&quiz).Error; err != nil {
			return err
		}
		trs := []models.QuizTranslation{
			{
				QuizID:      quiz.ID,
				Locale:      "lo",
				Title:       s.LoTitle,
				Description: s.LoDescription,
				Category:    s.LoCategory,
				Slug:        s.LoSlug,
			},
			{
				QuizID:      quiz.ID,
				Locale:      "en",
				Title:       s.EnTitle,
				Description: s.EnDescription,
				Category:    s.EnCategory,
				Slug:        s.EnSlug,
			},
		}
		if err := db.Create(&trs).Error; err != nil {
			return err
		}
	}
	log.Printf("seeded %d quizzes", len(seeds))
	return nil
}

// ReseedQuizzes clears and reloads demo quizzes.
func ReseedQuizzes(db *gorm.DB) error {
	if err := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.QuizTranslation{}).Error; err != nil {
		return err
	}
	if err := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.Quiz{}).Error; err != nil {
		return err
	}
	return seedQuizzes(db)
}
