package handlers

import (
	"fmt"
	"strings"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type categoryTranslationIn struct {
	Locale      string `json:"locale"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Slug        string `json:"slug"`
	SEOTitle    string `json:"seo_title"`
}

type categoryBody struct {
	Code         string                  `json:"code"`
	SortOrder    int                     `json:"sort_order"`
	IsActive     *bool                   `json:"is_active"`
	Translations []categoryTranslationIn `json:"translations"`
}

func (h *CategoryHandler) AdminGet(c *fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	var cat models.Category
	if err := h.DB.Preload("Translations").First(&cat, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errJSON(c, fiber.StatusNotFound, "Category not found")
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not load category")
	}
	return c.JSON(adminCategoryJSON(&cat))
}

func (h *CategoryHandler) AdminCreate(c *fiber.Ctx) error {
	var body categoryBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	code := strings.ToLower(strings.TrimSpace(body.Code))
	if code == "" || len(body.Translations) == 0 {
		return errJSON(c, fiber.StatusBadRequest, "Code and translations are required")
	}
	active := true
	if body.IsActive != nil {
		active = *body.IsActive
	}
	cat := models.Category{
		Code:      code,
		SortOrder: body.SortOrder,
		IsActive:  active,
	}
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&cat).Error; err != nil {
			return err
		}
		return h.replaceCategoryTranslations(tx, cat.ID, body.Translations)
	})
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, err.Error())
	}
	_ = h.DB.Preload("Translations").First(&cat, "id = ?", cat.ID)
	return c.Status(fiber.StatusCreated).JSON(adminCategoryJSON(&cat))
}

func (h *CategoryHandler) AdminUpdate(c *fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	var body categoryBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	var cat models.Category
	if err := h.DB.First(&cat, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errJSON(c, fiber.StatusNotFound, "Category not found")
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not load category")
	}
	code := strings.ToLower(strings.TrimSpace(body.Code))
	if code == "" {
		code = cat.Code
	}
	updates := map[string]interface{}{
		"code":       code,
		"sort_order": body.SortOrder,
	}
	if body.IsActive != nil {
		updates["is_active"] = *body.IsActive
	}
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&cat).Updates(updates).Error; err != nil {
			return err
		}
		if len(body.Translations) > 0 {
			return h.replaceCategoryTranslations(tx, cat.ID, body.Translations)
		}
		return nil
	})
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, err.Error())
	}
	_ = h.DB.Preload("Translations").First(&cat, "id = ?", cat.ID)
	return c.JSON(adminCategoryJSON(&cat))
}

func (h *CategoryHandler) AdminDelete(c *fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	var docs int64
	_ = h.DB.Model(&models.Document{}).Where("category_id = ?", id).Count(&docs)
	if docs > 0 {
		return errJSON(c, fiber.StatusBadRequest, "Category still has documents")
	}
	res := h.DB.Delete(&models.Category{}, "id = ?", id)
	if res.Error != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not delete category")
	}
	if res.RowsAffected == 0 {
		return errJSON(c, fiber.StatusNotFound, "Category not found")
	}
	return msg(c, "Category deleted")
}

func (h *CategoryHandler) replaceCategoryTranslations(tx *gorm.DB, categoryID uuid.UUID, trs []categoryTranslationIn) error {
	if err := tx.Where("category_id = ?", categoryID).Delete(&models.CategoryTranslation{}).Error; err != nil {
		return err
	}
	rows := make([]models.CategoryTranslation, 0, len(trs))
	for _, tr := range trs {
		locale := localeOrDefault(tr.Locale)
		name := strings.TrimSpace(tr.Name)
		slug := strings.TrimSpace(tr.Slug)
		if name == "" || slug == "" {
			return fmt.Errorf("translation name and slug are required")
		}
		rows = append(rows, models.CategoryTranslation{
			CategoryID:  categoryID,
			Locale:      locale,
			Name:        name,
			Description: strings.TrimSpace(tr.Description),
			Slug:        slug,
			SEOTitle:    strings.TrimSpace(tr.SEOTitle),
		})
	}
	return tx.Create(&rows).Error
}

func adminCategoryJSON(cat *models.Category) fiber.Map {
	trs := make([]fiber.Map, 0, len(cat.Translations))
	for _, tr := range cat.Translations {
		trs = append(trs, fiber.Map{
			"locale":      tr.Locale,
			"name":        tr.Name,
			"description": tr.Description,
			"slug":        tr.Slug,
			"seo_title":   tr.SEOTitle,
		})
	}
	return fiber.Map{
		"id":           cat.ID.String(),
		"code":         cat.Code,
		"sort_order":   cat.SortOrder,
		"is_active":    cat.IsActive,
		"translations": trs,
	}
}
