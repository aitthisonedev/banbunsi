package handlers

import (
	"net/mail"
	"net/url"
	"regexp"
	"strings"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type SettingsHandler struct {
	DB *gorm.DB
}

var e164Re = regexp.MustCompile(`^\+[1-9]\d{6,14}$`)

func (h *SettingsHandler) PublicGet(c *fiber.Ctx) error {
	s, err := h.load()
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load settings")
	}
	return c.JSON(fiber.Map{
		"site_name_lo":                 s.SiteNameLo,
		"site_name_en":                 s.SiteNameEn,
		"timezone":                     s.Timezone,
		"contact_email":                s.ContactEmail,
		"whatsapp_number":              s.WhatsappNumber,
		"facebook_url":                 s.FacebookURL,
		"tiktok_url":                   s.TiktokURL,
		"default_meta_description_lo":  s.DefaultMetaDescriptionLo,
		"default_meta_description_en":  s.DefaultMetaDescriptionEn,
	})
}

func (h *SettingsHandler) AdminGet(c *fiber.Ctx) error {
	s, err := h.load()
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load settings")
	}
	return c.JSON(s)
}

type settingsPatch struct {
	SiteNameLo               *string `json:"site_name_lo"`
	SiteNameEn               *string `json:"site_name_en"`
	Timezone                 *string `json:"timezone"`
	ContactEmail             *string `json:"contact_email"`
	WhatsappNumber           *string `json:"whatsapp_number"`
	FacebookURL              *string `json:"facebook_url"`
	TiktokURL                *string `json:"tiktok_url"`
	DefaultMetaDescriptionLo *string `json:"default_meta_description_lo"`
	DefaultMetaDescriptionEn *string `json:"default_meta_description_en"`
	DefaultSEOTitleLo        *string `json:"default_seo_title_lo"`
	DefaultSEOTitleEn        *string `json:"default_seo_title_en"`
}

func (h *SettingsHandler) AdminPatch(c *fiber.Ctx) error {
	var body settingsPatch
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}
	s, err := h.load()
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load settings")
	}
	if body.SiteNameLo != nil {
		s.SiteNameLo = strings.TrimSpace(*body.SiteNameLo)
	}
	if body.SiteNameEn != nil {
		s.SiteNameEn = strings.TrimSpace(*body.SiteNameEn)
	}
	if body.Timezone != nil {
		s.Timezone = strings.TrimSpace(*body.Timezone)
	}
	if body.ContactEmail != nil {
		email := normalizeEmail(*body.ContactEmail)
		if _, err := mail.ParseAddress(email); err != nil {
			return errJSON(c, fiber.StatusBadRequest, "Invalid contact email")
		}
		s.ContactEmail = email
	}
	if body.WhatsappNumber != nil {
		num := strings.ReplaceAll(strings.TrimSpace(*body.WhatsappNumber), " ", "")
		if !e164Re.MatchString(num) {
			return errJSON(c, fiber.StatusBadRequest, "WhatsApp number must be E.164 (e.g. +8562058444184)")
		}
		s.WhatsappNumber = num
	}
	if body.FacebookURL != nil {
		u := strings.TrimSpace(*body.FacebookURL)
		if err := validateHTTPS(u); err != nil {
			return errJSON(c, fiber.StatusBadRequest, "Facebook URL must be https")
		}
		s.FacebookURL = u
	}
	if body.TiktokURL != nil {
		u := strings.TrimSpace(*body.TiktokURL)
		if err := validateHTTPS(u); err != nil {
			return errJSON(c, fiber.StatusBadRequest, "TikTok URL must be https")
		}
		s.TiktokURL = u
	}
	if body.DefaultMetaDescriptionLo != nil {
		s.DefaultMetaDescriptionLo = strings.TrimSpace(*body.DefaultMetaDescriptionLo)
	}
	if body.DefaultMetaDescriptionEn != nil {
		s.DefaultMetaDescriptionEn = strings.TrimSpace(*body.DefaultMetaDescriptionEn)
	}
	if body.DefaultSEOTitleLo != nil {
		s.DefaultSEOTitleLo = strings.TrimSpace(*body.DefaultSEOTitleLo)
	}
	if body.DefaultSEOTitleEn != nil {
		s.DefaultSEOTitleEn = strings.TrimSpace(*body.DefaultSEOTitleEn)
	}
	if s.SiteNameLo == "" || s.SiteNameEn == "" || s.Timezone == "" {
		return errJSON(c, fiber.StatusBadRequest, "Site names and timezone are required")
	}
	if err := h.DB.Save(s).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not save settings")
	}
	return c.JSON(s)
}

func (h *SettingsHandler) load() (*models.SiteSettings, error) {
	var s models.SiteSettings
	if err := h.DB.First(&s, 1).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func validateHTTPS(raw string) error {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" || u.Host == "" {
		return fiber.ErrBadRequest
	}
	return nil
}
