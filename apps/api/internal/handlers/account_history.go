package handlers

import (
	"encoding/json"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// accountHistoryLimit is how many recent entries the account history lists return.
const accountHistoryLimit = 50

type downloadHistoryItem struct {
	At             time.Time `json:"at"`
	FileID         string    `json:"file_id"`
	FileLabel      string    `json:"file_label"`
	FileName       string    `json:"file_name"`
	DocumentTitle  string    `json:"document_title"`
	DocumentSlug   string    `json:"document_slug"`
	DocumentNumber string    `json:"document_number"`
}

type quizHistoryItem struct {
	At        time.Time `json:"at"`
	QuizTitle string    `json:"quiz_title"`
	QuizSlug  string    `json:"quiz_slug"`
	quizResultMeta
}

// userAuditLogs returns the user's newest audit entries for one action.
func (h *AccountHandler) userAuditLogs(userID uuid.UUID, action string) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := h.DB.Where("actor_user_id = ? AND action = ?", userID, action).
		Order("created_at DESC").Limit(accountHistoryLimit).Find(&logs).Error
	return logs, err
}

// parseIDs keeps the target ids that are valid UUIDs (audit entries store them as text).
func parseIDs(logs []models.AuditLog) []uuid.UUID {
	ids := make([]uuid.UUID, 0, len(logs))
	for _, l := range logs {
		if id, err := uuid.Parse(l.TargetID); err == nil {
			ids = append(ids, id)
		}
	}
	return ids
}

// parseQuizResult reads the score stored with a quiz.submit entry; unreadable metadata gives zeros.
func parseQuizResult(metadata string) quizResultMeta {
	var meta quizResultMeta
	_ = json.Unmarshal([]byte(metadata), &meta)
	return meta
}

// Downloads lists the signed-in user's file downloads (recorded by DownloadFile), newest first.
// A file or document deleted since then is still listed, with the details that remain.
func (h *AccountHandler) Downloads(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	locale := localeOrDefault(c.Query("locale"))
	logs, err := h.userAuditLogs(user.ID, downloadAuditAction)
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load downloads")
	}

	files := map[string]models.DocumentFile{}
	if ids := parseIDs(logs); len(ids) > 0 {
		var rows []models.DocumentFile
		_ = h.DB.Where("id IN ?", ids).Find(&rows).Error
		for _, f := range rows {
			files[f.ID.String()] = f
		}
	}
	docIDs := []uuid.UUID{}
	for _, f := range files {
		docIDs = append(docIDs, f.DocumentID)
	}
	docs := map[uuid.UUID]models.Document{}
	if len(docIDs) > 0 {
		var rows []models.Document
		_ = h.DB.Preload("Translations").Where("id IN ?", docIDs).Find(&rows).Error
		for _, d := range rows {
			docs[d.ID] = d
		}
	}

	items := make([]downloadHistoryItem, 0, len(logs))
	for _, l := range logs {
		item := downloadHistoryItem{At: l.CreatedAt, FileID: l.TargetID}
		if f, ok := files[l.TargetID]; ok {
			item.FileLabel, item.FileName = f.Label, f.FileName
			if d, ok := docs[f.DocumentID]; ok {
				item.DocumentNumber = d.DocumentNumber
				// Only published documents get a link; drafts and archived ones are listed without one.
				if tr := pickDocTranslation(d.Translations, locale); tr != nil {
					item.DocumentTitle = tr.Title
					if d.Status == models.DocPublished {
						item.DocumentSlug = tr.Slug
					}
				}
			}
		}
		items = append(items, item)
	}
	return c.JSON(fiber.Map{"items": items})
}

// QuizHistory lists the signed-in user's quiz results (recorded by PublicSubmit), newest first.
func (h *AccountHandler) QuizHistory(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	locale := localeOrDefault(c.Query("locale"))
	logs, err := h.userAuditLogs(user.ID, quizSubmitAuditAction)
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load quiz history")
	}

	quizzes := map[string]models.Quiz{}
	if ids := parseIDs(logs); len(ids) > 0 {
		var rows []models.Quiz
		_ = h.DB.Preload("Translations").Where("id IN ?", ids).Find(&rows).Error
		for _, q := range rows {
			quizzes[q.ID.String()] = q
		}
	}

	items := make([]quizHistoryItem, 0, len(logs))
	for _, l := range logs {
		item := quizHistoryItem{At: l.CreatedAt, quizResultMeta: parseQuizResult(l.Metadata)}
		if q, ok := quizzes[l.TargetID]; ok {
			if tr := pickQuizTranslation(q.Translations, locale); tr != nil {
				item.QuizTitle = tr.Title
				if q.IsPublished {
					item.QuizSlug = tr.Slug
				}
			}
		}
		items = append(items, item)
	}
	return c.JSON(fiber.Map{"items": items})
}
