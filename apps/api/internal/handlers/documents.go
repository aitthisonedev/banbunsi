package handlers

import (
	"strings"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/auth"
	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/banbunsi/banbunsi/apps/api/internal/sanitize"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DocumentHandler struct {
	DB       *gorm.DB
	Cfg      *config.Config
	Sessions *auth.SessionService
}

type translationIn struct {
	Locale         string `json:"locale"`
	Title          string `json:"title"`
	Slug           string `json:"slug"`
	Summary        string `json:"summary"`
	BodyHTML       string `json:"body_html"`
	SEOTitle       string `json:"seo_title"`
	SEODescription string `json:"seo_description"`
}

type fileIn struct {
	Label          string `json:"label"`
	FileName       string `json:"file_name"`
	Mime           string `json:"mime"`
	SizeBytes      int64  `json:"size_bytes"`
	Language       string `json:"language"`
	Version        string `json:"version"`
	DownloadAccess string `json:"download_access"`
	SortOrder      int    `json:"sort_order"`
}

type documentWriteIn struct {
	DocumentNumber string          `json:"document_number"`
	CategoryID     string          `json:"category_id"`
	ReadAccess     string          `json:"read_access"`
	Status         string          `json:"status"`
	EffectiveDate  *string         `json:"effective_date"`
	Year           int             `json:"year"`
	Tags           string          `json:"tags"`
	Translations   []translationIn `json:"translations"`
	Files          []fileIn        `json:"files"`
}

func (h *DocumentHandler) optionalUser(c *fiber.Ctx) *models.User {
	if h.Sessions == nil || h.Cfg == nil {
		return nil
	}
	raw := c.Cookies(h.Cfg.SessionCookieName)
	user, _, err := h.Sessions.Resolve(raw)
	if err != nil {
		return nil
	}
	return user
}

func (h *DocumentHandler) currentMembershipTier(user *models.User) models.MembershipTier {
	if user == nil {
		return ""
	}
	var m models.Membership
	err := h.DB.Where("user_id = ? AND is_current = ?", user.ID, true).First(&m).Error
	if err != nil {
		return models.TierMember
	}
	if m.Tier == models.TierVIP && m.Status == "active" {
		if m.EndsAt == nil || m.EndsAt.After(time.Now().UTC()) {
			return models.TierVIP
		}
	}
	return models.TierMember
}

func canReadBody(access models.ReadAccess, user *models.User, tier models.MembershipTier) bool {
	switch access {
	case models.ReadPublic:
		return true
	case models.ReadMember:
		return user != nil && user.AccountStatus == models.StatusActive
	case models.ReadVIP:
		return user != nil && tier == models.TierVIP
	default:
		return false
	}
}

func pickDocTranslation(trs []models.DocumentTranslation, locale string) *models.DocumentTranslation {
	var fallback *models.DocumentTranslation
	for i := range trs {
		if trs[i].Locale == locale {
			return &trs[i]
		}
		if trs[i].Locale == "lo" {
			fallback = &trs[i]
		}
	}
	if fallback != nil {
		return fallback
	}
	if len(trs) > 0 {
		return &trs[0]
	}
	return nil
}

func filePayload(f models.DocumentFile) fiber.Map {
	return fiber.Map{
		"id":              f.ID.String(),
		"label":           f.Label,
		"file_name":       f.FileName,
		"mime":            f.Mime,
		"size_bytes":      f.SizeBytes,
		"language":        f.Language,
		"version":         f.Version,
		"download_access": f.DownloadAccess,
		"sort_order":      f.SortOrder,
	}
}

func categoryName(cat models.Category, locale string) (slug, name string) {
	tr := pickTranslation(cat.Translations, locale)
	if tr == nil {
		return cat.Code, cat.Code
	}
	return tr.Slug, tr.Name
}

func (h *DocumentHandler) listItem(doc models.Document, locale string, includeBody bool, user *models.User, tier models.MembershipTier) fiber.Map {
	tr := pickDocTranslation(doc.Translations, locale)
	catSlug, catName := categoryName(doc.Category, locale)
	item := fiber.Map{
		"id":              doc.ID.String(),
		"document_number": doc.DocumentNumber,
		"category_id":     doc.CategoryID.String(),
		"category_slug":   catSlug,
		"category_name":   catName,
		"read_access":     doc.ReadAccess,
		"status":          doc.Status,
		"year":            doc.Year,
		"tags":            doc.Tags,
		"published_at":    doc.PublishedAt,
		"effective_date":  doc.EffectiveDate,
		"updated_at":      doc.UpdatedAt,
	}
	if tr != nil {
		item["title"] = tr.Title
		item["slug"] = tr.Slug
		item["summary"] = tr.Summary
		item["seo_title"] = tr.SEOTitle
		item["seo_description"] = tr.SEODescription
		if includeBody && canReadBody(doc.ReadAccess, user, tier) {
			item["body_html"] = tr.BodyHTML
			item["body_available"] = true
		} else {
			item["body_available"] = canReadBody(doc.ReadAccess, user, tier)
			if !canReadBody(doc.ReadAccess, user, tier) {
				item["body_available"] = false
			}
		}
	}
	files := make([]fiber.Map, 0, len(doc.Files))
	for _, f := range doc.Files {
		files = append(files, filePayload(f))
	}
	item["files"] = files
	return item
}

func (h *DocumentHandler) PublicList(c *fiber.Ctx) error {
	locale := localeOrDefault(c.Query("locale"))
	q := strings.TrimSpace(c.Query("q"))
	category := strings.TrimSpace(c.Query("category"))
	year := c.QueryInt("year", 0)
	page := c.QueryInt("page", 1)
	if page < 1 {
		page = 1
	}
	perPage := c.QueryInt("per_page", 20)
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	dbq := h.DB.Model(&models.Document{}).
		Where("status = ?", models.DocPublished).
		Preload("Translations").
		Preload("Files", func(db *gorm.DB) *gorm.DB { return db.Order("sort_order ASC") }).
		Preload("Category.Translations")

	if year > 0 {
		dbq = dbq.Where("year = ?", year)
	}
	if category != "" {
		dbq = dbq.Where(
			`EXISTS (
				SELECT 1 FROM category_translations ct
				WHERE ct.category_id = documents.category_id
				  AND ct.slug = ? AND ct.locale = ?
			)`,
			category, locale,
		)
	}
	if q != "" {
		like := "%" + q + "%"
		dbq = dbq.Where(
			`documents.document_number ILIKE ? OR documents.tags ILIKE ? OR EXISTS (
				SELECT 1 FROM document_translations dt
				WHERE dt.document_id = documents.id
				  AND (dt.title ILIKE ? OR dt.summary ILIKE ?)
			)`,
			like, like, like, like,
		)
	}

	var total int64
	if err := dbq.Count(&total).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load documents")
	}

	var docs []models.Document
	if err := dbq.Order("COALESCE(documents.published_at, documents.created_at) DESC").
		Offset((page - 1) * perPage).Limit(perPage).
		Find(&docs).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load documents")
	}

	user := h.optionalUser(c)
	tier := h.currentMembershipTier(user)
	items := make([]fiber.Map, 0, len(docs))
	for _, d := range docs {
		items = append(items, h.listItem(d, locale, false, user, tier))
	}
	return c.JSON(fiber.Map{
		"items":    items,
		"total":    total,
		"page":     page,
		"per_page": perPage,
	})
}

func (h *DocumentHandler) PublicGet(c *fiber.Ctx) error {
	locale := localeOrDefault(c.Query("locale"))
	slug := strings.TrimSpace(c.Params("slug"))
	if slug == "" {
		return errJSON(c, fiber.StatusBadRequest, "Missing slug")
	}

	var tr models.DocumentTranslation
	if err := h.DB.Where("slug = ? AND locale = ?", slug, locale).First(&tr).Error; err != nil {
		// try other locale slug then prefer requested locale translation on same doc
		if err := h.DB.Where("slug = ?", slug).First(&tr).Error; err != nil {
			return errJSON(c, fiber.StatusNotFound, "Document not found")
		}
	}

	var doc models.Document
	if err := h.DB.Preload("Translations").
		Preload("Files", func(db *gorm.DB) *gorm.DB { return db.Order("sort_order ASC") }).
		Preload("Category.Translations").
		Where("id = ? AND status = ?", tr.DocumentID, models.DocPublished).
		First(&doc).Error; err != nil {
		return errJSON(c, fiber.StatusNotFound, "Document not found")
	}

	user := h.optionalUser(c)
	tier := h.currentMembershipTier(user)
	return c.JSON(h.listItem(doc, locale, true, user, tier))
}

func (h *DocumentHandler) AdminList(c *fiber.Ctx) error {
	locale := localeOrDefault(c.Query("locale"))
	status := strings.TrimSpace(c.Query("status"))
	q := strings.TrimSpace(c.Query("q"))
	page := c.QueryInt("page", 1)
	if page < 1 {
		page = 1
	}
	perPage := c.QueryInt("per_page", 50)
	if perPage < 1 || perPage > 100 {
		perPage = 50
	}

	dbq := h.DB.Model(&models.Document{}).
		Preload("Translations").
		Preload("Files", func(db *gorm.DB) *gorm.DB { return db.Order("sort_order ASC") }).
		Preload("Category.Translations")

	if status != "" {
		dbq = dbq.Where("status = ?", status)
	}
	if q != "" {
		like := "%" + q + "%"
		dbq = dbq.Joins("LEFT JOIN document_translations ON document_translations.document_id = documents.id").
			Where("documents.document_number ILIKE ? OR document_translations.title ILIKE ?", like, like).
			Distinct()
	}

	var total int64
	if err := dbq.Count(&total).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load documents")
	}
	var docs []models.Document
	if err := dbq.Order("updated_at DESC").Offset((page - 1) * perPage).Limit(perPage).Find(&docs).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not load documents")
	}

	user := c.Locals("user").(*models.User)
	tier := h.currentMembershipTier(user)
	items := make([]fiber.Map, 0, len(docs))
	for _, d := range docs {
		item := h.listItem(d, locale, true, user, tier)
		item["translations"] = d.Translations
		items = append(items, item)
	}
	return c.JSON(fiber.Map{"items": items, "total": total, "page": page, "per_page": perPage})
}

func (h *DocumentHandler) AdminGet(c *fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	var doc models.Document
	if err := h.DB.Preload("Translations").
		Preload("Files", func(db *gorm.DB) *gorm.DB { return db.Order("sort_order ASC") }).
		Preload("Category.Translations").
		First(&doc, "id = ?", id).Error; err != nil {
		return errJSON(c, fiber.StatusNotFound, "Document not found")
	}
	user := c.Locals("user").(*models.User)
	tier := h.currentMembershipTier(user)
	item := h.listItem(doc, localeOrDefault(c.Query("locale")), true, user, tier)
	item["translations"] = doc.Translations
	return c.JSON(item)
}

func normalizeReadAccess(v string) models.ReadAccess {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "member":
		return models.ReadMember
	case "vip":
		return models.ReadVIP
	default:
		return models.ReadPublic
	}
}

func normalizeDownloadAccess(v string) models.DownloadAccess {
	if strings.ToLower(strings.TrimSpace(v)) == "vip" {
		return models.DownloadVIP
	}
	return models.DownloadMember
}

func normalizeDocStatus(v string) models.DocStatus {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "published":
		return models.DocPublished
	case "archived":
		return models.DocArchived
	default:
		return models.DocDraft
	}
}

func parseDatePtr(s *string) (*time.Time, error) {
	if s == nil || strings.TrimSpace(*s) == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", strings.TrimSpace(*s))
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (h *DocumentHandler) validateWrite(in *documentWriteIn, requireTranslations bool) (uuid.UUID, string) {
	in.DocumentNumber = strings.TrimSpace(in.DocumentNumber)
	if in.DocumentNumber == "" {
		return uuid.Nil, "document_number is required"
	}
	catID, err := parseUUID(in.CategoryID)
	if err != nil {
		return uuid.Nil, "Invalid category_id"
	}
	var cat models.Category
	if err := h.DB.First(&cat, "id = ?", catID).Error; err != nil {
		return uuid.Nil, "Category not found"
	}
	if requireTranslations && len(in.Translations) == 0 {
		return uuid.Nil, "translations required"
	}
	for _, tr := range in.Translations {
		loc := localeOrDefault(tr.Locale)
		if strings.TrimSpace(tr.Title) == "" || strings.TrimSpace(tr.Slug) == "" {
			return uuid.Nil, "Each translation needs title and slug (" + loc + ")"
		}
	}
	return catID, ""
}

func (h *DocumentHandler) replaceTranslations(tx *gorm.DB, docID uuid.UUID, trs []translationIn) error {
	if err := tx.Where("document_id = ?", docID).Delete(&models.DocumentTranslation{}).Error; err != nil {
		return err
	}
	for _, tr := range trs {
		row := models.DocumentTranslation{
			DocumentID:     docID,
			Locale:         localeOrDefault(tr.Locale),
			Title:          strings.TrimSpace(tr.Title),
			Slug:           strings.TrimSpace(tr.Slug),
			Summary:        strings.TrimSpace(tr.Summary),
			BodyHTML:       sanitize.HTML(tr.BodyHTML),
			SEOTitle:       strings.TrimSpace(tr.SEOTitle),
			SEODescription: strings.TrimSpace(tr.SEODescription),
		}
		if err := tx.Create(&row).Error; err != nil {
			return err
		}
	}
	return nil
}

func (h *DocumentHandler) replaceFiles(tx *gorm.DB, docID uuid.UUID, files []fileIn) error {
	if err := tx.Where("document_id = ?", docID).Delete(&models.DocumentFile{}).Error; err != nil {
		return err
	}
	for i, f := range files {
		if strings.TrimSpace(f.FileName) == "" {
			continue
		}
		label := strings.TrimSpace(f.Label)
		if label == "" {
			label = f.FileName
		}
		row := models.DocumentFile{
			DocumentID:     docID,
			Label:          label,
			FileName:       strings.TrimSpace(f.FileName),
			Mime:           strings.TrimSpace(f.Mime),
			SizeBytes:      f.SizeBytes,
			Language:       localeOrDefault(f.Language),
			Version:        strings.TrimSpace(f.Version),
			DownloadAccess: normalizeDownloadAccess(f.DownloadAccess),
			SortOrder:      f.SortOrder,
		}
		if row.Mime == "" {
			row.Mime = "application/octet-stream"
		}
		if row.SortOrder == 0 {
			row.SortOrder = i
		}
		if err := tx.Create(&row).Error; err != nil {
			return err
		}
	}
	return nil
}

func (h *DocumentHandler) loadAdminJSON(c *fiber.Ctx, id uuid.UUID, status int) error {
	var doc models.Document
	if err := h.DB.Preload("Translations").
		Preload("Files", func(db *gorm.DB) *gorm.DB { return db.Order("sort_order ASC") }).
		Preload("Category.Translations").
		First(&doc, "id = ?", id).Error; err != nil {
		return errJSON(c, fiber.StatusNotFound, "Document not found")
	}
	user := c.Locals("user").(*models.User)
	tier := h.currentMembershipTier(user)
	item := h.listItem(doc, localeOrDefault(c.Query("locale")), true, user, tier)
	item["translations"] = doc.Translations
	return c.Status(status).JSON(item)
}

func (h *DocumentHandler) AdminCreate(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	var in documentWriteIn
	if err := c.BodyParser(&in); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid body")
	}
	catID, msg := h.validateWrite(&in, true)
	if msg != "" {
		return errJSON(c, fiber.StatusBadRequest, msg)
	}

	status := normalizeDocStatus(in.Status)
	if !user.IsAdminPlus() {
		status = models.DocDraft
	}
	eff, err := parseDatePtr(in.EffectiveDate)
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid effective_date")
	}
	year := in.Year
	if year == 0 && eff != nil {
		year = eff.Year()
	}

	doc := models.Document{
		DocumentNumber: in.DocumentNumber,
		CategoryID:     catID,
		ReadAccess:     normalizeReadAccess(in.ReadAccess),
		Status:         status,
		EffectiveDate:  eff,
		Year:           year,
		Tags:           strings.TrimSpace(in.Tags),
	}
	if status == models.DocPublished {
		now := time.Now().UTC()
		doc.PublishedAt = &now
	}

	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&doc).Error; err != nil {
			return err
		}
		if err := h.replaceTranslations(tx, doc.ID, in.Translations); err != nil {
			return err
		}
		return h.replaceFiles(tx, doc.ID, in.Files)
	})
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return errJSON(c, fiber.StatusConflict, "Document number or slug already exists")
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not create document")
	}
	return h.loadAdminJSON(c, doc.ID, fiber.StatusCreated)
}

func (h *DocumentHandler) AdminUpdate(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	var doc models.Document
	if err := h.DB.First(&doc, "id = ?", id).Error; err != nil {
		return errJSON(c, fiber.StatusNotFound, "Document not found")
	}
	if !user.IsAdminPlus() && doc.Status == models.DocPublished {
		return errJSON(c, fiber.StatusForbidden, "Editors cannot edit published documents")
	}

	var in documentWriteIn
	if err := c.BodyParser(&in); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid body")
	}
	catID, msg := h.validateWrite(&in, len(in.Translations) > 0)
	if msg != "" {
		return errJSON(c, fiber.StatusBadRequest, msg)
	}

	status := doc.Status
	if in.Status != "" {
		next := normalizeDocStatus(in.Status)
		if next != doc.Status && !user.IsAdminPlus() {
			return errJSON(c, fiber.StatusForbidden, "Only admin can change status")
		}
		status = next
	}
	eff, err := parseDatePtr(in.EffectiveDate)
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid effective_date")
	}
	year := in.Year
	if year == 0 {
		year = doc.Year
	}

	err = h.DB.Transaction(func(tx *gorm.DB) error {
		doc.DocumentNumber = in.DocumentNumber
		doc.CategoryID = catID
		doc.ReadAccess = normalizeReadAccess(in.ReadAccess)
		doc.Status = status
		doc.Tags = strings.TrimSpace(in.Tags)
		doc.Year = year
		if in.EffectiveDate != nil {
			doc.EffectiveDate = eff
		}
		if status == models.DocPublished && doc.PublishedAt == nil {
			now := time.Now().UTC()
			doc.PublishedAt = &now
		}
		if err := tx.Save(&doc).Error; err != nil {
			return err
		}
		if len(in.Translations) > 0 {
			if err := h.replaceTranslations(tx, doc.ID, in.Translations); err != nil {
				return err
			}
		}
		if in.Files != nil {
			if err := h.replaceFiles(tx, doc.ID, in.Files); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return errJSON(c, fiber.StatusConflict, "Document number or slug already exists")
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not update document")
	}
	return h.loadAdminJSON(c, doc.ID, fiber.StatusOK)
}

func (h *DocumentHandler) AdminDelete(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	if !user.IsAdminPlus() {
		return errJSON(c, fiber.StatusForbidden, "Only admin can delete documents")
	}
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	res := h.DB.Delete(&models.Document{}, "id = ?", id)
	if res.Error != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not delete document")
	}
	if res.RowsAffected == 0 {
		return errJSON(c, fiber.StatusNotFound, "Document not found")
	}
	return msg(c, "Deleted")
}
