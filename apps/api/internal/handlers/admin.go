package handlers

import (
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AdminHandler struct {
	DB *gorm.DB
}

func (h *AdminHandler) Dashboard(c *fiber.Ctx) error {
	var members int64
	_ = h.DB.Model(&models.User{}).Where("staff_role = ?", models.RoleMember).Count(&members)
	var activeVIP int64
	_ = h.DB.Model(&models.Membership{}).
		Where("is_current = ? AND tier = ? AND status = ?", true, models.TierVIP, "active").
		Count(&activeVIP)
	var documents int64
	_ = h.DB.Model(&models.Document{}).Count(&documents)
	var pending int64
	_ = h.DB.Model(&models.Document{}).Where("status = ?", models.DocDraft).Count(&pending)

	return c.JSON(fiber.Map{
		"articles":          0,
		"documents":         documents,
		"members":           members,
		"active_vip":        activeVIP,
		"pending_review":    pending,
		"download_requests": 0,
	})
}
