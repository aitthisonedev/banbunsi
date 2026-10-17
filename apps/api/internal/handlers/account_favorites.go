package handlers

import (
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type favoriteItem struct {
	At             time.Time `json:"at"`
	DocumentID     string    `json:"document_id"`
	DocumentTitle  string    `json:"document_title"`
	DocumentSlug   string    `json:"document_slug"`
	DocumentNumber string    `json:"document_number"`
}

// Favorites lists the signed-in user's saved documents, newest first.
func (h *AccountHandler) Favorites(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	locale := localeOrDefault(c.Query("locale"))

	var rows []models.DocumentFavorite
	if err := h.DB.Where("user_id = ?", user.ID).
		Order("created_at DESC").
		Limit(accountHistoryLimit).
		Find(&rows).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load favorites")
	}

	docIDs := make([]uuid.UUID, 0, len(rows))
	for _, r := range rows {
		docIDs = append(docIDs, r.DocumentID)
	}
	docs := map[uuid.UUID]models.Document{}
	if len(docIDs) > 0 {
		var list []models.Document
		_ = h.DB.Preload("Translations").Where("id IN ?", docIDs).Find(&list).Error
		for _, d := range list {
			docs[d.ID] = d
		}
	}

	items := make([]favoriteItem, 0, len(rows))
	for _, r := range rows {
		item := favoriteItem{
			At:         r.CreatedAt,
			DocumentID: r.DocumentID.String(),
		}
		if d, ok := docs[r.DocumentID]; ok {
			item.DocumentNumber = d.DocumentNumber
			if tr := pickDocTranslation(d.Translations, locale); tr != nil {
				item.DocumentTitle = tr.Title
				if d.Status == models.DocPublished {
					item.DocumentSlug = tr.Slug
				}
			}
		}
		items = append(items, item)
	}
	return c.JSON(fiber.Map{"items": items})
}

// AddFavorite saves a published document to the signed-in user's favorites.
func (h *AccountHandler) AddFavorite(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	docID, err := uuid.Parse(c.Params("documentId"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid document id")
	}

	var doc models.Document
	if err := h.DB.Where("id = ? AND status = ?", docID, models.DocPublished).First(&doc).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errJSON(c, fiber.StatusNotFound, "Document not found")
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not load document")
	}

	var existing models.DocumentFavorite
	err = h.DB.Where("user_id = ? AND document_id = ?", user.ID, doc.ID).First(&existing).Error
	if err == nil {
		return c.JSON(fiber.Map{"favorited": true})
	}
	if err != gorm.ErrRecordNotFound {
		return errJSON(c, fiber.StatusInternalServerError, "Could not save favorite")
	}

	fav := models.DocumentFavorite{UserID: user.ID, DocumentID: doc.ID}
	if err := h.DB.Create(&fav).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not save favorite")
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"favorited": true})
}

// RemoveFavorite removes a document from the signed-in user's favorites.
func (h *AccountHandler) RemoveFavorite(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	docID, err := uuid.Parse(c.Params("documentId"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid document id")
	}

	res := h.DB.Where("user_id = ? AND document_id = ?", user.ID, docID).
		Delete(&models.DocumentFavorite{})
	if res.Error != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not remove favorite")
	}
	return c.JSON(fiber.Map{"favorited": false})
}
