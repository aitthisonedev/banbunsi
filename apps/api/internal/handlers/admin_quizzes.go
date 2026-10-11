package handlers

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type quizTranslationIn struct {
	Locale      string `json:"locale"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Slug        string `json:"slug"`
}

type quizAdminBody struct {
	Code          string                   `json:"code"`
	Difficulty    string                   `json:"difficulty"`
	PassPercent   int                      `json:"pass_percent"`
	SortOrder     int                      `json:"sort_order"`
	IsPublished   *bool                    `json:"is_published"`
	Questions     quizQuestionsByLocale    `json:"questions"`
	Translations  []quizTranslationIn      `json:"translations"`
}

func (h *QuizHandler) AdminList(c *fiber.Ctx) error {
	locale := localeOrDefault(c.Query("locale"))
	var quizzes []models.Quiz
	if err := h.DB.Preload("Translations").Order("sort_order ASC").Find(&quizzes).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load quizzes")
	}
	items := make([]fiber.Map, 0, len(quizzes))
	for _, q := range quizzes {
		tr := pickQuizTranslation(q.Translations, locale)
		title, slug := q.Code, q.Code
		if tr != nil {
			title, slug = tr.Title, tr.Slug
		}
		qs, _ := questionsForLocale(q.QuestionsJSON, locale)
		items = append(items, fiber.Map{
			"id":             q.ID.String(),
			"code":           q.Code,
			"title":          title,
			"slug":           slug,
			"difficulty":     q.Difficulty,
			"pass_percent":   q.PassPercent,
			"sort_order":     q.SortOrder,
			"is_published":   q.IsPublished,
			"question_count": len(qs),
		})
	}
	return c.JSON(fiber.Map{"items": items})
}

func (h *QuizHandler) AdminGet(c *fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	var quiz models.Quiz
	if err := h.DB.Preload("Translations").First(&quiz, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errJSON(c, fiber.StatusNotFound, "Quiz not found")
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not load quiz")
	}
	return c.JSON(adminQuizJSON(&quiz))
}

func (h *QuizHandler) AdminCreate(c *fiber.Ctx) error {
	var body quizAdminBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	code := strings.ToLower(strings.TrimSpace(body.Code))
	if code == "" || len(body.Translations) == 0 {
		return errJSON(c, fiber.StatusBadRequest, "Code and translations are required")
	}
	qJSON, err := encodeQuestions(body.Questions)
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid questions JSON")
	}
	published := false
	if body.IsPublished != nil {
		published = *body.IsPublished
	}
	pass := body.PassPercent
	if pass <= 0 {
		pass = 60
	}
	diff := strings.TrimSpace(body.Difficulty)
	if diff == "" {
		diff = "easy"
	}
	quiz := models.Quiz{
		Code:          code,
		Difficulty:    diff,
		PassPercent:   pass,
		SortOrder:     body.SortOrder,
		IsPublished:   published,
		QuestionsJSON: qJSON,
	}
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&quiz).Error; err != nil {
			return err
		}
		return replaceQuizTranslations(tx, quiz.ID, body.Translations)
	})
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, err.Error())
	}
	_ = h.DB.Preload("Translations").First(&quiz, "id = ?", quiz.ID)
	return c.Status(fiber.StatusCreated).JSON(adminQuizJSON(&quiz))
}

func (h *QuizHandler) AdminUpdate(c *fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	var body quizAdminBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	var quiz models.Quiz
	if err := h.DB.First(&quiz, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errJSON(c, fiber.StatusNotFound, "Quiz not found")
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not load quiz")
	}
	code := strings.ToLower(strings.TrimSpace(body.Code))
	if code == "" {
		code = quiz.Code
	}
	pass := body.PassPercent
	if pass <= 0 {
		pass = quiz.PassPercent
	}
	diff := strings.TrimSpace(body.Difficulty)
	if diff == "" {
		diff = quiz.Difficulty
	}
	updates := map[string]interface{}{
		"code":         code,
		"difficulty":   diff,
		"pass_percent": pass,
		"sort_order":   body.SortOrder,
	}
	if body.IsPublished != nil {
		updates["is_published"] = *body.IsPublished
	}
	if body.Questions != nil {
		qJSON, err := encodeQuestions(body.Questions)
		if err != nil {
			return errJSON(c, fiber.StatusBadRequest, "Invalid questions JSON")
		}
		updates["questions_json"] = qJSON
	}
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&quiz).Updates(updates).Error; err != nil {
			return err
		}
		if len(body.Translations) > 0 {
			return replaceQuizTranslations(tx, quiz.ID, body.Translations)
		}
		return nil
	})
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, err.Error())
	}
	_ = h.DB.Preload("Translations").First(&quiz, "id = ?", quiz.ID)
	return c.JSON(adminQuizJSON(&quiz))
}

func (h *QuizHandler) AdminDelete(c *fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	res := h.DB.Delete(&models.Quiz{}, "id = ?", id)
	if res.Error != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not delete quiz")
	}
	if res.RowsAffected == 0 {
		return errJSON(c, fiber.StatusNotFound, "Quiz not found")
	}
	return msg(c, "Quiz deleted")
}

func encodeQuestions(q quizQuestionsByLocale) (datatypes.JSON, error) {
	if q == nil {
		q = quizQuestionsByLocale{}
	}
	raw, err := json.Marshal(q)
	if err != nil {
		return nil, err
	}
	return datatypes.JSON(raw), nil
}

func replaceQuizTranslations(tx *gorm.DB, quizID uuid.UUID, trs []quizTranslationIn) error {
	if err := tx.Where("quiz_id = ?", quizID).Delete(&models.QuizTranslation{}).Error; err != nil {
		return err
	}
	rows := make([]models.QuizTranslation, 0, len(trs))
	for _, tr := range trs {
		locale := localeOrDefault(tr.Locale)
		title := strings.TrimSpace(tr.Title)
		slug := strings.TrimSpace(tr.Slug)
		if title == "" || slug == "" {
			return fmt.Errorf("quiz translation title and slug are required")
		}
		rows = append(rows, models.QuizTranslation{
			QuizID:      quizID,
			Locale:      locale,
			Title:       title,
			Description: strings.TrimSpace(tr.Description),
			Category:    strings.TrimSpace(tr.Category),
			Slug:        slug,
		})
	}
	return tx.Create(&rows).Error
}

func adminQuizJSON(quiz *models.Quiz) fiber.Map {
	var questions quizQuestionsByLocale
	_ = json.Unmarshal(quiz.QuestionsJSON, &questions)
	if questions == nil {
		questions = quizQuestionsByLocale{}
	}
	trs := make([]fiber.Map, 0, len(quiz.Translations))
	for _, tr := range quiz.Translations {
		trs = append(trs, fiber.Map{
			"locale":      tr.Locale,
			"title":       tr.Title,
			"description": tr.Description,
			"category":    tr.Category,
			"slug":        tr.Slug,
		})
	}
	return fiber.Map{
		"id":           quiz.ID.String(),
		"code":         quiz.Code,
		"difficulty":   quiz.Difficulty,
		"pass_percent": quiz.PassPercent,
		"sort_order":   quiz.SortOrder,
		"is_published": quiz.IsPublished,
		"questions":    questions,
		"translations": trs,
	}
}
