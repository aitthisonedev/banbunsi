package handlers

import (
	"encoding/json"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type QuizHandler struct {
	DB *gorm.DB
}

type quizQuestionJSON struct {
	ID              string `json:"id"`
	Prompt          string `json:"prompt"`
	Options         []struct {
		ID    string `json:"id"`
		Label string `json:"label"`
	} `json:"options"`
	CorrectOptionID string `json:"correct_option_id"`
	Explanation     string `json:"explanation"`
}

type quizQuestionsByLocale map[string][]quizQuestionJSON

type quizListItem struct {
	ID           string `json:"id"`
	Slug         string `json:"slug"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	Category     string `json:"category"`
	Difficulty   string `json:"difficulty"`
	PassPercent  int    `json:"pass_percent"`
	QuestionCount int   `json:"question_count"`
}

type quizPublicQuestion struct {
	ID      string `json:"id"`
	Prompt  string `json:"prompt"`
	Options []struct {
		ID    string `json:"id"`
		Label string `json:"label"`
	} `json:"options"`
}

type quizDetail struct {
	ID          string               `json:"id"`
	Slug        string               `json:"slug"`
	Title       string               `json:"title"`
	Description string               `json:"description"`
	Category    string               `json:"category"`
	Difficulty  string               `json:"difficulty"`
	PassPercent int                  `json:"pass_percent"`
	Questions   []quizPublicQuestion `json:"questions"`
}

func (h *QuizHandler) PublicList(c *fiber.Ctx) error {
	locale := localeOrDefault(c.Query("locale"))
	var quizzes []models.Quiz
	if err := h.DB.Preload("Translations").
		Where("is_published = ?", true).
		Order("sort_order ASC").
		Find(&quizzes).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load quizzes")
	}

	items := make([]quizListItem, 0, len(quizzes))
	for _, q := range quizzes {
		tr := pickQuizTranslation(q.Translations, locale)
		if tr == nil {
			continue
		}
		qs, _ := questionsForLocale(q.QuestionsJSON, locale)
		items = append(items, quizListItem{
			ID:            q.ID.String(),
			Slug:          tr.Slug,
			Title:         tr.Title,
			Description:   tr.Description,
			Category:      tr.Category,
			Difficulty:    q.Difficulty,
			PassPercent:   q.PassPercent,
			QuestionCount: len(qs),
		})
	}
	return c.JSON(fiber.Map{"items": items})
}

func (h *QuizHandler) PublicGet(c *fiber.Ctx) error {
	locale := localeOrDefault(c.Query("locale"))
	slug := c.Params("slug")
	if slug == "" {
		return errJSON(c, fiber.StatusBadRequest, "Missing slug")
	}

	quiz, tr, err := h.findBySlug(slug, locale)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return errJSON(c, fiber.StatusNotFound, "Quiz not found")
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not load quiz")
	}

	qs, err := questionsForLocale(quiz.QuestionsJSON, locale)
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load quiz questions")
	}

	publicQs := make([]quizPublicQuestion, 0, len(qs))
	for _, q := range qs {
		publicQs = append(publicQs, quizPublicQuestion{
			ID:      q.ID,
			Prompt:  q.Prompt,
			Options: q.Options,
		})
	}

	return c.JSON(quizDetail{
		ID:          quiz.ID.String(),
		Slug:        tr.Slug,
		Title:       tr.Title,
		Description: tr.Description,
		Category:    tr.Category,
		Difficulty:  quiz.Difficulty,
		PassPercent: quiz.PassPercent,
		Questions:   publicQs,
	})
}

type quizSubmitBody struct {
	Answers map[string]string `json:"answers"`
}

func (h *QuizHandler) PublicSubmit(c *fiber.Ctx) error {
	locale := localeOrDefault(c.Query("locale"))
	slug := c.Params("slug")
	if slug == "" {
		return errJSON(c, fiber.StatusBadRequest, "Missing slug")
	}

	var body quizSubmitBody
	if err := c.BodyParser(&body); err != nil || body.Answers == nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid answers")
	}

	quiz, tr, err := h.findBySlug(slug, locale)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return errJSON(c, fiber.StatusNotFound, "Quiz not found")
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not load quiz")
	}

	qs, err := questionsForLocale(quiz.QuestionsJSON, locale)
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load quiz questions")
	}

	details := make([]fiber.Map, 0, len(qs))
	correct := 0
	for _, q := range qs {
		selected := body.Answers[q.ID]
		isCorrect := selected == q.CorrectOptionID
		if isCorrect {
			correct++
		}
		details = append(details, fiber.Map{
			"question_id":  q.ID,
			"prompt":       q.Prompt,
			"selected_id":  selected,
			"correct_id":   q.CorrectOptionID,
			"is_correct":   isCorrect,
			"explanation":  q.Explanation,
			"options":      q.Options,
		})
	}
	total := len(qs)
	percent := 0
	if total > 0 {
		percent = (correct * 100) / total
	}
	passed := percent >= quiz.PassPercent

	return c.JSON(fiber.Map{
		"slug":         tr.Slug,
		"correct":      correct,
		"total":        total,
		"percent":      percent,
		"passed":       passed,
		"pass_percent": quiz.PassPercent,
		"details":      details,
	})
}

func (h *QuizHandler) findBySlug(slug, locale string) (*models.Quiz, *models.QuizTranslation, error) {
	var tr models.QuizTranslation
	err := h.DB.Where("slug = ? AND locale = ?", slug, locale).First(&tr).Error
	if err != nil {
		// try other locale slug, then load preferred translation
		err = h.DB.Where("slug = ?", slug).First(&tr).Error
		if err != nil {
			return nil, nil, err
		}
	}
	var quiz models.Quiz
	if err := h.DB.Preload("Translations").Where("id = ? AND is_published = ?", tr.QuizID, true).First(&quiz).Error; err != nil {
		return nil, nil, err
	}
	preferred := pickQuizTranslation(quiz.Translations, locale)
	if preferred == nil {
		preferred = &tr
	}
	return &quiz, preferred, nil
}

func pickQuizTranslation(items []models.QuizTranslation, locale string) *models.QuizTranslation {
	var fallback *models.QuizTranslation
	for i := range items {
		if items[i].Locale == locale {
			return &items[i]
		}
		if items[i].Locale == "en" {
			fallback = &items[i]
		}
	}
	if fallback != nil {
		return fallback
	}
	if len(items) > 0 {
		return &items[0]
	}
	return nil
}

func questionsForLocale(raw []byte, locale string) ([]quizQuestionJSON, error) {
	var byLocale quizQuestionsByLocale
	if err := json.Unmarshal(raw, &byLocale); err != nil {
		return nil, err
	}
	if qs, ok := byLocale[locale]; ok && len(qs) > 0 {
		return qs, nil
	}
	if qs, ok := byLocale["en"]; ok {
		return qs, nil
	}
	for _, qs := range byLocale {
		return qs, nil
	}
	return []quizQuestionJSON{}, nil
}
