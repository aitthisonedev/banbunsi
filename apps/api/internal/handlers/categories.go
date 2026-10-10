package handlers

import (
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type CategoryHandler struct {
	DB *gorm.DB
}

type categoryNode struct {
	ID          string         `json:"id"`
	Code        string         `json:"code"`
	Slug        string         `json:"slug"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	SortOrder   int            `json:"sort_order"`
	IsActive    bool           `json:"is_active"`
	Children    []categoryNode `json:"children"`
}

func (h *CategoryHandler) PublicList(c *fiber.Ctx) error {
	return h.list(c, true)
}

func (h *CategoryHandler) AdminList(c *fiber.Ctx) error {
	return h.list(c, false)
}

func (h *CategoryHandler) list(c *fiber.Ctx, activeOnly bool) error {
	locale := localeOrDefault(c.Query("locale"))
	q := h.DB.Preload("Translations").Order("sort_order ASC")
	if activeOnly {
		q = q.Where("is_active = ?", true)
	}
	var cats []models.Category
	if err := q.Find(&cats).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load categories")
	}

	byParent := map[string][]models.Category{}
	roots := make([]models.Category, 0)
	for _, cat := range cats {
		if cat.ParentID == nil {
			roots = append(roots, cat)
			continue
		}
		key := cat.ParentID.String()
		byParent[key] = append(byParent[key], cat)
	}

	items := make([]categoryNode, 0, len(roots))
	for _, root := range roots {
		node := toNode(root, locale)
		for _, child := range byParent[root.ID.String()] {
			node.Children = append(node.Children, toNode(child, locale))
		}
		if node.Children == nil {
			node.Children = []categoryNode{}
		}
		items = append(items, node)
	}
	return c.JSON(fiber.Map{"items": items})
}

func toNode(cat models.Category, locale string) categoryNode {
	tr := pickTranslation(cat.Translations, locale)
	node := categoryNode{
		ID:        cat.ID.String(),
		Code:      cat.Code,
		SortOrder: cat.SortOrder,
		IsActive:  cat.IsActive,
		Children:  []categoryNode{},
	}
	if tr != nil {
		node.Name = tr.Name
		node.Description = tr.Description
		node.Slug = tr.Slug
	} else {
		node.Name = cat.Code
		node.Slug = cat.Code
	}
	return node
}

func pickTranslation(trs []models.CategoryTranslation, locale string) *models.CategoryTranslation {
	var fallback *models.CategoryTranslation
	for i := range trs {
		if trs[i].Locale == locale {
			return &trs[i]
		}
		if trs[i].Locale == "lo" {
			fallback = &trs[i]
		}
	}
	return fallback
}
