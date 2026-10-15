package handlers

import (
	"fmt"
	"net/mail"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type SettingsHandler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

var (
	e164Re  = regexp.MustCompile(`^\+[1-9]\d{6,14}$`)
	colorRe = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
)

type settingsPatch struct {
	OrganizationName         *string `json:"organization_name"`
	SystemName               *string `json:"system_name"`
	Description              *string `json:"description"`
	ContactPhone             *string `json:"contact_phone"`
	Address                  *string `json:"address"`
	Website                  *string `json:"website"`
	PrimaryColor             *string `json:"primary_color"`
	SecondaryColor           *string `json:"secondary_color"`
	AccentColor              *string `json:"accent_color"`
	DefaultDocumentCategory  *string `json:"default_document_category"`
	DefaultDocumentStatus    *string `json:"default_document_status"`
	AllowedFileTypes         *string `json:"allowed_file_types"`
	MaxFileSizeBytes         *int64  `json:"max_file_size_bytes"`
	DocumentNumberFormat     *string `json:"document_number_format"`
	ApplicationTitle         *string `json:"application_title"`
	SidebarTitle             *string `json:"sidebar_title"`
	FooterText               *string `json:"footer_text"`
	DashboardTitle           *string `json:"dashboard_title"`
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

func (h *SettingsHandler) assetURL(path string) string {
	apiURL := ""
	if h.Cfg != nil {
		apiURL = h.Cfg.APIPublicURL
	}
	return fileURL(path, apiURL)
}

func (h *SettingsHandler) payload(s *models.SiteSettings) fiber.Map {
	return fiber.Map{
		"id":                          s.ID,
		"organization_name":           s.OrganizationName,
		"system_name":                 s.SystemName,
		"description":                 s.Description,
		"contact_phone":               s.ContactPhone,
		"address":                     s.Address,
		"website":                     s.Website,
		"logo_url":                    h.assetURL(s.LogoPath),
		"login_logo_url":              h.assetURL(s.LoginLogoPath),
		"system_logo_url":             h.assetURL(s.SystemLogoPath),
		"favicon_url":                 h.assetURL(s.FaviconPath),
		"default_cover_url":           h.assetURL(s.DefaultCoverPath),
		"primary_color":               s.PrimaryColor,
		"secondary_color":             s.SecondaryColor,
		"accent_color":                s.AccentColor,
		"default_document_category":   s.DefaultDocumentCategory,
		"default_document_status":     s.DefaultDocumentStatus,
		"allowed_file_types":          s.AllowedFileTypes,
		"max_file_size_bytes":         s.MaxFileSizeBytes,
		"document_number_format":      s.DocumentNumberFormat,
		"application_title":           s.ApplicationTitle,
		"sidebar_title":               s.SidebarTitle,
		"footer_text":                 s.FooterText,
		"dashboard_title":             s.DashboardTitle,
		"site_name_lo":                s.SiteNameLo,
		"site_name_en":                s.SiteNameEn,
		"timezone":                    s.Timezone,
		"contact_email":               s.ContactEmail,
		"whatsapp_number":             s.WhatsappNumber,
		"facebook_url":                s.FacebookURL,
		"tiktok_url":                  s.TiktokURL,
		"default_meta_description_lo": s.DefaultMetaDescriptionLo,
		"default_meta_description_en": s.DefaultMetaDescriptionEn,
		"default_seo_title_lo":        s.DefaultSEOTitleLo,
		"default_seo_title_en":        s.DefaultSEOTitleEn,
		"updated_at":                  s.UpdatedAt,
	}
}

func (h *SettingsHandler) PublicGet(c *fiber.Ctx) error {
	s, err := h.load()
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load settings")
	}
	return c.JSON(fiber.Map{
		"organization_name":           s.OrganizationName,
		"system_name":                 s.SystemName,
		"description":                 s.Description,
		"contact_phone":               s.ContactPhone,
		"address":                     s.Address,
		"website":                     s.Website,
		"logo_url":                    h.assetURL(s.LogoPath),
		"login_logo_url":              h.assetURL(s.LoginLogoPath),
		"system_logo_url":             h.assetURL(s.SystemLogoPath),
		"favicon_url":                 h.assetURL(s.FaviconPath),
		"default_cover_url":           h.assetURL(s.DefaultCoverPath),
		"default_document_category":   s.DefaultDocumentCategory,
		"default_document_status":     s.DefaultDocumentStatus,
		"allowed_file_types":          s.AllowedFileTypes,
		"max_file_size_bytes":         s.MaxFileSizeBytes,
		"document_number_format":      s.DocumentNumberFormat,
		"primary_color":               s.PrimaryColor,
		"secondary_color":             s.SecondaryColor,
		"accent_color":                s.AccentColor,
		"application_title":           s.ApplicationTitle,
		"sidebar_title":               s.SidebarTitle,
		"dashboard_title":             s.DashboardTitle,
		"footer_text":                 s.FooterText,
		"site_name_lo":                s.SiteNameLo,
		"site_name_en":                s.SiteNameEn,
		"timezone":                    s.Timezone,
		"contact_email":               s.ContactEmail,
		"whatsapp_number":             s.WhatsappNumber,
		"facebook_url":                s.FacebookURL,
		"tiktok_url":                  s.TiktokURL,
		"default_meta_description_lo": s.DefaultMetaDescriptionLo,
		"default_meta_description_en": s.DefaultMetaDescriptionEn,
		"default_seo_title_lo":        s.DefaultSEOTitleLo,
		"default_seo_title_en":        s.DefaultSEOTitleEn,
	})
}

func (h *SettingsHandler) AdminGet(c *fiber.Ctx) error {
	s, err := h.load()
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load settings")
	}
	return c.JSON(h.payload(s))
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
	set := func(target *string, value *string) {
		if value != nil {
			*target = strings.TrimSpace(*value)
		}
	}
	set(&s.OrganizationName, body.OrganizationName)
	set(&s.SystemName, body.SystemName)
	set(&s.Description, body.Description)
	set(&s.ContactPhone, body.ContactPhone)
	set(&s.Address, body.Address)
	set(&s.Website, body.Website)
	set(&s.PrimaryColor, body.PrimaryColor)
	set(&s.SecondaryColor, body.SecondaryColor)
	set(&s.AccentColor, body.AccentColor)
	set(&s.DefaultDocumentCategory, body.DefaultDocumentCategory)
	set(&s.DefaultDocumentStatus, body.DefaultDocumentStatus)
	set(&s.AllowedFileTypes, body.AllowedFileTypes)
	set(&s.DocumentNumberFormat, body.DocumentNumberFormat)
	set(&s.ApplicationTitle, body.ApplicationTitle)
	set(&s.SidebarTitle, body.SidebarTitle)
	set(&s.FooterText, body.FooterText)
	set(&s.DashboardTitle, body.DashboardTitle)
	set(&s.SiteNameLo, body.SiteNameLo)
	set(&s.SiteNameEn, body.SiteNameEn)
	set(&s.Timezone, body.Timezone)
	set(&s.DefaultMetaDescriptionLo, body.DefaultMetaDescriptionLo)
	set(&s.DefaultMetaDescriptionEn, body.DefaultMetaDescriptionEn)
	set(&s.DefaultSEOTitleLo, body.DefaultSEOTitleLo)
	set(&s.DefaultSEOTitleEn, body.DefaultSEOTitleEn)
	if body.ContactEmail != nil {
		email := normalizeEmail(*body.ContactEmail)
		if email != "" {
			if _, err := mail.ParseAddress(email); err != nil {
				return errJSON(c, fiber.StatusBadRequest, "Contact email is not a valid email address")
			}
		}
		s.ContactEmail = email
	}
	if body.WhatsappNumber != nil {
		number := strings.ReplaceAll(strings.TrimSpace(*body.WhatsappNumber), " ", "")
		if number != "" && !e164Re.MatchString(number) {
			return errJSON(c, fiber.StatusBadRequest, "WhatsApp number must be in international format, e.g. +8562012345678")
		}
		s.WhatsappNumber = number
	}
	if body.FacebookURL != nil {
		if err := validateOptionalHTTPS(*body.FacebookURL); err != nil {
			return errJSON(c, fiber.StatusBadRequest, "Facebook URL must be a full https:// address")
		}
		s.FacebookURL = strings.TrimSpace(*body.FacebookURL)
	}
	if body.TiktokURL != nil {
		if err := validateOptionalHTTPS(*body.TiktokURL); err != nil {
			return errJSON(c, fiber.StatusBadRequest, "TikTok URL must be a full https:// address")
		}
		s.TiktokURL = strings.TrimSpace(*body.TiktokURL)
	}
	if body.Website != nil {
		if err := validateOptionalHTTPS(*body.Website); err != nil {
			return errJSON(c, fiber.StatusBadRequest, "Website must be a full https:// address")
		}
	}
	if message := settingsLengthError(s); message != "" {
		return errJSON(c, fiber.StatusBadRequest, message)
	}
	for _, color := range []*string{body.PrimaryColor, body.SecondaryColor, body.AccentColor} {
		if color != nil && strings.TrimSpace(*color) != "" && !colorRe.MatchString(strings.TrimSpace(*color)) {
			return errJSON(c, fiber.StatusBadRequest, "Colors must use #RRGGBB format")
		}
	}
	if body.DefaultDocumentStatus != nil && s.DefaultDocumentStatus != "draft" && s.DefaultDocumentStatus != "published" && s.DefaultDocumentStatus != "archived" {
		return errJSON(c, fiber.StatusBadRequest, "Invalid default document status")
	}
	if body.AllowedFileTypes != nil {
		allowed, err := normalizeAllowedFileTypes(s.AllowedFileTypes)
		if err != nil {
			return errJSON(c, fiber.StatusBadRequest, "Allowed file types contain unsupported extensions")
		}
		s.AllowedFileTypes = allowed
	}
	if body.MaxFileSizeBytes != nil {
		if *body.MaxFileSizeBytes < 1 || *body.MaxFileSizeBytes > 14<<20 {
			return errJSON(c, fiber.StatusBadRequest, "Maximum file size must be between 1 byte and 14 MiB")
		}
		s.MaxFileSizeBytes = *body.MaxFileSizeBytes
	}
	if body.Timezone != nil {
		if _, err := time.LoadLocation(s.Timezone); err != nil {
			return errJSON(c, fiber.StatusBadRequest, "Invalid timezone")
		}
	}
	if s.SiteNameLo == "" || s.SiteNameEn == "" || s.Timezone == "" {
		return errJSON(c, fiber.StatusBadRequest, "Site names and timezone are required")
	}
	if err := h.DB.Save(s).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not save settings")
	}
	return c.JSON(h.payload(s))
}

// settingsLengthError reports the first text field that exceeds its database column size,
// so admins get a clear message instead of a generic save failure.
func settingsLengthError(s *models.SiteSettings) string {
	limits := []struct {
		label string
		value string
		max   int
	}{
		{"Organization name", s.OrganizationName, 200},
		{"System name", s.SystemName, 200},
		{"Description", s.Description, 1000},
		{"Phone", s.ContactPhone, 32},
		{"Address", s.Address, 500},
		{"Website", s.Website, 500},
		{"Document numbering format", s.DocumentNumberFormat, 120},
		{"Application title", s.ApplicationTitle, 200},
		{"Sidebar title", s.SidebarTitle, 200},
		{"Footer text", s.FooterText, 500},
		{"Dashboard title", s.DashboardTitle, 200},
		{"Site name (Lao)", s.SiteNameLo, 200},
		{"Site name (English)", s.SiteNameEn, 200},
		{"Contact email", s.ContactEmail, 320},
		{"Facebook URL", s.FacebookURL, 500},
		{"TikTok URL", s.TiktokURL, 500},
		{"Meta description (Lao)", s.DefaultMetaDescriptionLo, 500},
		{"Meta description (English)", s.DefaultMetaDescriptionEn, 500},
		{"SEO title (Lao)", s.DefaultSEOTitleLo, 255},
		{"SEO title (English)", s.DefaultSEOTitleEn, 255},
	}
	for _, limit := range limits {
		if utf8.RuneCountInString(limit.value) > limit.max {
			return fmt.Sprintf("%s must be %d characters or fewer", limit.label, limit.max)
		}
	}
	return ""
}

func normalizeAllowedFileTypes(raw string) (string, error) {
	allowed := map[string]bool{
		"pdf": true, "doc": true, "docx": true, "xls": true, "xlsx": true,
		"csv": true, "txt": true, "zip": true, "jpg": true, "jpeg": true,
		"png": true, "webp": true,
	}
	seen := map[string]bool{}
	for _, extension := range strings.Split(strings.ToLower(raw), ",") {
		extension = strings.TrimPrefix(strings.TrimSpace(extension), ".")
		if extension == "" {
			continue
		}
		if !allowed[extension] {
			return "", fiber.ErrBadRequest
		}
		seen[extension] = true
	}
	if len(seen) == 0 {
		return "", fiber.ErrBadRequest
	}
	values := make([]string, 0, len(seen))
	for extension := range seen {
		values = append(values, extension)
	}
	sort.Strings(values)
	return strings.Join(values, ","), nil
}

func validateOptionalHTTPS(raw string) error {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	return validateHTTPS(raw)
}

func (h *SettingsHandler) assetColumn(kind string) (string, *string, error) {
	s, err := h.load()
	if err != nil {
		return "", nil, err
	}
	switch kind {
	case "logo":
		return "logo_path", &s.LogoPath, nil
	case "login-logo":
		return "login_logo_path", &s.LoginLogoPath, nil
	case "system-logo":
		return "system_logo_path", &s.SystemLogoPath, nil
	case "favicon":
		return "favicon_path", &s.FaviconPath, nil
	case "default-cover":
		return "default_cover_path", &s.DefaultCoverPath, nil
	default:
		return "", nil, fiber.ErrNotFound
	}
}

func (h *SettingsHandler) UploadAsset(c *fiber.Ctx) error {
	column, current, err := h.assetColumn(c.Params("kind"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Unsupported branding asset")
	}
	file, err := c.FormFile("asset")
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Image asset is required")
	}
	source, err := file.Open()
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Could not read image asset")
	}
	defer source.Close()
	path, err := storeImageAsset(h.Cfg, "branding", source, file.Size)
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, err.Error())
	}
	oldPath := *current
	if err := h.DB.Model(&models.SiteSettings{}).Where("id = ?", 1).Update(column, path).Error; err != nil {
		removeStoredImage(h.Cfg, path, "branding")
		return errJSON(c, fiber.StatusInternalServerError, "Could not update image asset")
	}
	removeStoredImage(h.Cfg, oldPath, "branding")
	s, err := h.load()
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load settings")
	}
	return c.JSON(h.payload(s))
}

func (h *SettingsHandler) DeleteAsset(c *fiber.Ctx) error {
	column, current, err := h.assetColumn(c.Params("kind"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Unsupported branding asset")
	}
	oldPath := *current
	if err := h.DB.Model(&models.SiteSettings{}).Where("id = ?", 1).Update(column, "").Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not remove image asset")
	}
	removeStoredImage(h.Cfg, oldPath, "branding")
	s, err := h.load()
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load settings")
	}
	return c.JSON(h.payload(s))
}

func (h *SettingsHandler) load() (*models.SiteSettings, error) {
	var settings models.SiteSettings
	if err := h.DB.First(&settings, 1).Error; err != nil {
		return nil, err
	}
	return &settings, nil
}

func validateHTTPS(raw string) error {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" || u.Host == "" || u.User != nil {
		return fiber.ErrBadRequest
	}
	return nil
}
