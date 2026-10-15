package handlers

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/auth"
	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/banbunsi/banbunsi/apps/api/internal/sanitize"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	_ "golang.org/x/image/webp"
	"gorm.io/gorm"
)

const (
	maxDocumentCoverBytes  = 2 << 20
	maxDocumentCoverSide   = 8000
	maxDocumentCoverPixels = 40_000_000
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
	ID             string `json:"id"`
	Label          string `json:"label"`
	FileName       string `json:"file_name"`
	Mime           string `json:"mime"`
	SizeBytes      int64  `json:"size_bytes"`
	Language       string `json:"language"`
	Version        string `json:"version"`
	DownloadAccess string `json:"download_access"`
	SortOrder      int    `json:"sort_order"`
	FileData       string `json:"file_data"`
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

func fileURL(storagePath string, apiPublicURL string) string {
	trimmed := strings.TrimSpace(storagePath)
	if trimmed == "" {
		return ""
	}
	clean := filepath.ToSlash(filepath.Clean(filepath.FromSlash(trimmed)))
	if apiPublicURL == "" {
		return "/uploads/" + strings.TrimPrefix(clean, "/")
	}
	return strings.TrimRight(apiPublicURL, "/") + "/uploads/" + strings.TrimPrefix(clean, "/")
}

func filePayload(f models.DocumentFile, apiPublicURL string) fiber.Map {
	downloadURL := "/api/v1/documents/files/" + f.ID.String()
	if apiPublicURL != "" {
		downloadURL = strings.TrimRight(apiPublicURL, "/") + downloadURL
	}
	return fiber.Map{
		"id":              f.ID.String(),
		"label":           f.Label,
		"file_name":       f.FileName,
		"file_url":        downloadURL,
		"mime":            f.Mime,
		"size_bytes":      f.SizeBytes,
		"language":        f.Language,
		"version":         f.Version,
		"download_access": f.DownloadAccess,
		"sort_order":      f.SortOrder,
	}
}

func documentUploadPath(cfg *config.Config, storedPath string) (string, error) {
	if cfg == nil {
		return "", fmt.Errorf("upload config missing")
	}
	cleanPath := filepath.Clean(filepath.FromSlash(storedPath))
	if filepath.IsAbs(cleanPath) || !strings.HasPrefix(cleanPath, "documents"+string(os.PathSeparator)) {
		return "", fmt.Errorf("invalid document file path")
	}
	root, err := filepath.Abs(cfg.UploadDir)
	if err != nil {
		return "", fmt.Errorf("invalid upload root")
	}
	absPath, err := filepath.Abs(filepath.Join(root, cleanPath))
	if err != nil {
		return "", fmt.Errorf("invalid document file path")
	}
	relative, err := filepath.Rel(root, absPath)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(os.PathSeparator)) {
		return "", fmt.Errorf("invalid document file path")
	}
	return absPath, nil
}

func (h *DocumentHandler) DownloadFile(c *fiber.Ctx) error {
	fileID, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid file id")
	}
	var file models.DocumentFile
	if err := h.DB.First(&file, "id = ?", fileID).Error; err != nil {
		return errJSON(c, fiber.StatusNotFound, "File not found")
	}
	var doc models.Document
	if err := h.DB.First(&doc, "id = ?", file.DocumentID).Error; err != nil {
		return errJSON(c, fiber.StatusNotFound, "File not found")
	}
	user := h.optionalUser(c)
	if user == nil || user.AccountStatus != models.StatusActive {
		return errJSON(c, fiber.StatusUnauthorized, "Sign in to download this file")
	}
	if doc.Status != models.DocPublished && !user.IsStaff() {
		return errJSON(c, fiber.StatusNotFound, "File not found")
	}
	if !user.IsStaff() {
		tier := h.currentMembershipTier(user)
		if file.DownloadAccess == models.DownloadVIP && tier != models.TierVIP {
			return errJSON(c, fiber.StatusForbidden, "VIP membership required")
		}
	}
	absPath, err := documentUploadPath(h.Cfg, file.StoragePath)
	if err != nil {
		return errJSON(c, fiber.StatusNotFound, "File not found")
	}
	source, err := os.Open(absPath)
	if err != nil {
		return errJSON(c, fiber.StatusNotFound, "File not found")
	}
	// The body is streamed after this handler returns and fasthttp closes the file when done,
	// so it is only closed here on the early-return error paths.
	info, err := source.Stat()
	if err != nil || info.IsDir() {
		_ = source.Close()
		return errJSON(c, fiber.StatusNotFound, "File not found")
	}
	var sniff [512]byte
	read, readErr := source.Read(sniff[:])
	if readErr != nil && readErr != io.EOF {
		_ = source.Close()
		return errJSON(c, fiber.StatusInternalServerError, "Could not read file")
	}
	if _, err := source.Seek(0, io.SeekStart); err != nil {
		_ = source.Close()
		return errJSON(c, fiber.StatusInternalServerError, "Could not read file")
	}
	c.Set(fiber.HeaderContentType, http.DetectContentType(sniff[:read]))
	c.Set(fiber.HeaderContentDisposition, mime.FormatMediaType("attachment", map[string]string{"filename": filepath.Base(file.FileName)}))
	c.Set("X-Content-Type-Options", "nosniff")
	return c.SendStream(source, int(info.Size()))
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
	apiPublicURL := ""
	if h.Cfg != nil {
		apiPublicURL = h.Cfg.APIPublicURL
	}
	item := fiber.Map{
		"id":              doc.ID.String(),
		"document_number": doc.DocumentNumber,
		"category_id":     doc.CategoryID.String(),
		"cover_image_url": fileURL(doc.CoverImagePath, apiPublicURL),
		"category_slug":   catSlug,
		"category_name":   catName,
		"read_access":     doc.ReadAccess,
		"status":          doc.Status,
		"year":            doc.Year,
		"tags":            doc.Tags,
		"created_at":      doc.CreatedAt,
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
			item["body_html"] = sanitize.HTML(tr.BodyHTML)
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
		files = append(files, filePayload(f, apiPublicURL))
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
	category := strings.TrimSpace(c.Query("category"))
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
		if status != string(models.DocDraft) && status != string(models.DocPublished) && status != string(models.DocArchived) {
			return errJSON(c, fiber.StatusBadRequest, "Invalid document status")
		}
		dbq = dbq.Where("status = ?", status)
	}
	if year := c.QueryInt("year", 0); year > 0 {
		dbq = dbq.Where("documents.year = ?", year)
	}
	if category != "" {
		dbq = dbq.Where(`EXISTS (
			SELECT 1 FROM category_translations ct
			WHERE ct.category_id = documents.category_id AND ct.slug = ?
		)`, category)
	}
	if q != "" {
		like := "%" + q + "%"
		dbq = dbq.Where(`documents.document_number ILIKE ? OR documents.tags ILIKE ? OR EXISTS (
			SELECT 1 FROM document_translations dt
			WHERE dt.document_id = documents.id AND (dt.title ILIKE ? OR dt.summary ILIKE ?)
		) OR EXISTS (
			SELECT 1 FROM category_translations ct
			WHERE ct.category_id = documents.category_id AND ct.name ILIKE ?
		)`, like, like, like, like, like)
	}
	for _, bound := range []struct {
		name string
		cmp  string
		end  bool
	}{{"updated_after", ">=", false}, {"updated_before", "<", true}} {
		value := strings.TrimSpace(c.Query(bound.name))
		if value == "" {
			continue
		}
		date, err := time.Parse("2006-01-02", value)
		if err != nil {
			return errJSON(c, fiber.StatusBadRequest, "Invalid update date")
		}
		if bound.end {
			date = date.Add(24 * time.Hour)
		}
		dbq = dbq.Where("documents.updated_at "+bound.cmp+" ?", date)
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
	var existingFiles []models.DocumentFile
	if err := tx.Where("document_id = ?", docID).Find(&existingFiles).Error; err != nil {
		return err
	}
	existingByID := make(map[uuid.UUID]*models.DocumentFile, len(existingFiles))
	for index := range existingFiles {
		existingByID[existingFiles[index].ID] = &existingFiles[index]
	}
	for i, f := range files {
		var existing *models.DocumentFile
		if strings.TrimSpace(f.ID) != "" {
			fileID, err := parseUUID(f.ID)
			if err != nil || existingByID[fileID] == nil {
				return fmt.Errorf("invalid document file id")
			}
			existing = existingByID[fileID]
		}
		fileName := strings.TrimSpace(f.FileName)
		storagePath := ""
		if existing != nil {
			storagePath = existing.StoragePath
			if fileName == "" {
				fileName = existing.FileName
			}
		}
		if strings.TrimSpace(f.FileData) != "" {
			if h.Cfg == nil {
				return fmt.Errorf("upload config missing")
			}
			maxBytes := int64(14 << 20)
			allowedTypes := "pdf,doc,docx,xls,xlsx,csv,txt,zip,jpg,jpeg,png,webp"
			var settings models.SiteSettings
			if err := tx.First(&settings, 1).Error; err == nil {
				if settings.MaxFileSizeBytes > 0 {
					maxBytes = settings.MaxFileSizeBytes
				}
				if strings.TrimSpace(settings.AllowedFileTypes) != "" {
					allowedTypes = settings.AllowedFileTypes
				}
			} else if err != gorm.ErrRecordNotFound {
				return err
			}
			stored, err := storeDocumentUploadWithPolicy(h.Cfg, fileName, f.Mime, f.FileData, maxBytes, allowedTypes)
			if err != nil {
				return err
			}
			if stored != "" {
				storagePath = stored
				if fileName == "" {
					fileName = filepath.Base(filepath.FromSlash(stored))
				}
			}
		}
		if fileName == "" && storagePath == "" {
			continue
		}
		label := strings.TrimSpace(f.Label)
		if label == "" {
			label = fileName
		}
		row := models.DocumentFile{
			ID: func() uuid.UUID {
				if existing != nil {
					return existing.ID
				}
				return uuid.Nil
			}(),
			DocumentID:     docID,
			Label:          label,
			FileName:       fileName,
			StoragePath:    storagePath,
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
		if err := tx.Save(&row).Error; err != nil {
			return err
		}
	}
	return nil
}

func storeDocumentUpload(cfg *config.Config, fileName, mimeType, data string) (string, error) {
	return storeDocumentUploadWithPolicy(cfg, fileName, mimeType, data, 14<<20, "pdf,doc,docx,xls,xlsx,csv,txt,zip,jpg,jpeg,png,webp")
}

func storeDocumentUploadWithPolicy(cfg *config.Config, fileName, mimeType, data string, maxBytes int64, allowedTypes string) (string, error) {
	trimmed := strings.TrimSpace(data)
	if trimmed == "" {
		return "", nil
	}
	if cfg == nil {
		return "", fmt.Errorf("upload config missing")
	}
	contentType := strings.TrimSpace(mimeType)
	encoded := trimmed
	if strings.Contains(trimmed, ";base64,") {
		encoded = trimmed[strings.Index(trimmed, ";base64,")+len(";base64,"):]
	} else if strings.HasPrefix(trimmed, "data:") {
		parts := strings.SplitN(trimmed, ",", 2)
		if len(parts) != 2 {
			return "", fmt.Errorf("invalid file payload")
		}
		if strings.Contains(parts[0], ";base64") {
			encoded = parts[1]
		} else {
			return "", fmt.Errorf("only base64 file uploads are supported")
		}
	}
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		decoded, err = base64.RawStdEncoding.DecodeString(encoded)
		if err != nil {
			return "", fmt.Errorf("invalid file payload: %w", err)
		}
	}
	if len(decoded) == 0 {
		return "", fmt.Errorf("uploaded file is empty")
	}
	if maxBytes <= 0 || int64(len(decoded)) > maxBytes {
		return "", fmt.Errorf("uploaded file exceeds the configured size limit")
	}
	if err := os.MkdirAll(filepath.Join(cfg.UploadDir, "documents"), 0o755); err != nil {
		return "", fmt.Errorf("could not create upload dir: %w", err)
	}
	baseName := filepath.Base(strings.TrimSpace(fileName))
	if baseName == "." || baseName == "" || baseName == "/" {
		if contentType == "" {
			contentType = "application/octet-stream"
		}
		switch {
		case strings.Contains(contentType, "pdf"):
			baseName = "document.pdf"
		case strings.Contains(contentType, "word") || strings.Contains(contentType, "msword"):
			baseName = "document.docx"
		case strings.Contains(contentType, "excel"):
			baseName = "document.xlsx"
		case strings.Contains(contentType, "zip"):
			baseName = "document.zip"
		default:
			baseName = "document.bin"
		}
	}
	if ext := strings.ToLower(filepath.Ext(baseName)); ext == "" {
		switch {
		case strings.Contains(contentType, "pdf"):
			baseName += ".pdf"
		case strings.Contains(contentType, "json"):
			baseName += ".json"
		case strings.Contains(contentType, "csv"):
			baseName += ".csv"
		case strings.Contains(contentType, "html"):
			baseName += ".html"
		case strings.Contains(contentType, "xml"):
			baseName += ".xml"
		case strings.Contains(contentType, "text"):
			baseName += ".txt"
		}
	}
	allowed, err := normalizeAllowedFileTypes(allowedTypes)
	if err != nil {
		return "", fmt.Errorf("configured file types are invalid")
	}
	if !strings.Contains(","+allowed+",", ","+strings.TrimPrefix(strings.ToLower(filepath.Ext(baseName)), ".")+",") {
		return "", fmt.Errorf("file type is not allowed")
	}
	fileID := uuid.NewString()
	nameWithID := fileID + "_" + filepath.Base(baseName)
	rel := filepath.ToSlash(filepath.Join("documents", nameWithID))
	abs := filepath.Join(cfg.UploadDir, filepath.FromSlash(rel))
	if err := os.WriteFile(abs, decoded, 0o644); err != nil {
		return "", fmt.Errorf("could not store upload: %w", err)
	}
	return rel, nil
}

func storeDocumentCover(cfg *config.Config, source io.Reader, size int64) (string, error) {
	return storeImageAsset(cfg, "covers", source, size)
}

func storeImageAsset(cfg *config.Config, directory string, source io.Reader, size int64) (string, error) {
	if directory != "covers" && directory != "branding" {
		return "", fmt.Errorf("invalid image storage directory")
	}
	if cfg == nil || size <= 0 || size > maxDocumentCoverBytes {
		return "", fmt.Errorf("image must be between 1 byte and 2 MiB")
	}
	data, err := io.ReadAll(io.LimitReader(source, maxDocumentCoverBytes+1))
	if err != nil || len(data) == 0 || len(data) > maxDocumentCoverBytes {
		return "", fmt.Errorf("could not read the image")
	}
	imageConfig, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("the file is not a valid JPEG, PNG, or WebP image")
	}
	if imageConfig.Width < 1 || imageConfig.Height < 1 || imageConfig.Width > maxDocumentCoverSide || imageConfig.Height > maxDocumentCoverSide || int64(imageConfig.Width)*int64(imageConfig.Height) > maxDocumentCoverPixels {
		return "", fmt.Errorf("image dimensions are too large (max 8000 px per side)")
	}
	extension := map[string]string{"jpeg": ".jpg", "png": ".png", "webp": ".webp"}[format]
	if extension == "" {
		return "", fmt.Errorf("image must be JPEG, PNG, or WebP")
	}
	if err := os.MkdirAll(filepath.Join(cfg.UploadDir, directory), 0o755); err != nil {
		return "", fmt.Errorf("could not create image directory")
	}
	relativePath := filepath.ToSlash(filepath.Join(directory, uuid.NewString()+extension))
	absolutePath := filepath.Join(cfg.UploadDir, filepath.FromSlash(relativePath))
	if err := os.WriteFile(absolutePath, data, 0o644); err != nil {
		return "", fmt.Errorf("could not store the image")
	}
	return relativePath, nil
}

func removeDocumentCover(cfg *config.Config, relativePath string) {
	removeStoredImage(cfg, relativePath, "covers")
}

func removeStoredImage(cfg *config.Config, relativePath, directory string) {
	if cfg == nil {
		return
	}
	cleanPath := filepath.Clean(filepath.FromSlash(relativePath))
	if cleanPath == directory || !strings.HasPrefix(cleanPath, directory+string(os.PathSeparator)) {
		return
	}
	root, err := filepath.Abs(cfg.UploadDir)
	if err != nil {
		return
	}
	absolutePath, err := filepath.Abs(filepath.Join(root, cleanPath))
	if err != nil {
		return
	}
	relativeToRoot, err := filepath.Rel(root, absolutePath)
	if err != nil || relativeToRoot == ".." || strings.HasPrefix(relativeToRoot, ".."+string(os.PathSeparator)) {
		return
	}
	_ = os.Remove(absolutePath)
	// Remove the resized copies made by ImageVariant as well.
	base := strings.TrimSuffix(filepath.Base(absolutePath), filepath.Ext(absolutePath))
	if variants, err := filepath.Glob(filepath.Join(filepath.Dir(absolutePath), ".variants", base+"-*")); err == nil {
		for _, variant := range variants {
			_ = os.Remove(variant)
		}
	}
}

func (h *DocumentHandler) AdminUploadCover(c *fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	var doc models.Document
	if err := h.DB.First(&doc, "id = ?", id).Error; err != nil {
		return errJSON(c, fiber.StatusNotFound, "Document not found")
	}
	file, err := c.FormFile("cover")
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Cover image is required")
	}
	source, err := file.Open()
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Could not read cover image")
	}
	defer source.Close()
	newPath, err := storeDocumentCover(h.Cfg, source, file.Size)
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, err.Error())
	}
	previousPath := doc.CoverImagePath
	if err := h.DB.Model(&doc).Update("cover_image_path", newPath).Error; err != nil {
		removeDocumentCover(h.Cfg, newPath)
		return errJSON(c, fiber.StatusInternalServerError, "Could not save cover image")
	}
	removeDocumentCover(h.Cfg, previousPath)
	return c.JSON(fiber.Map{"cover_image_url": fileURL(newPath, h.Cfg.APIPublicURL)})
}

func (h *DocumentHandler) AdminDeleteCover(c *fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid id")
	}
	var doc models.Document
	if err := h.DB.First(&doc, "id = ?", id).Error; err != nil {
		return errJSON(c, fiber.StatusNotFound, "Document not found")
	}
	previousPath := doc.CoverImagePath
	if err := h.DB.Model(&doc).Update("cover_image_path", "").Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not remove cover image")
	}
	removeDocumentCover(h.Cfg, previousPath)
	return c.JSON(fiber.Map{"cover_image_url": ""})
}

// headCapture keeps the first 512 bytes written to it, for content-type detection.
type headCapture struct{ buf []byte }

func (h *headCapture) Write(p []byte) (int, error) {
	if room := 512 - len(h.buf); room > 0 {
		if len(p) < room {
			room = len(p)
		}
		h.buf = append(h.buf, p[:room]...)
	}
	return len(p), nil
}

// storeDocumentStream copies an uploaded document file to uploads/documents without holding it
// in memory. The size limit is enforced while copying (not only from the declared size), and the
// extension must be one of the allowed types. Returns the stored path, size and detected type.
func storeDocumentStream(cfg *config.Config, fileName string, source io.Reader, maxBytes int64, allowedTypes string) (string, int64, string, error) {
	if cfg == nil {
		return "", 0, "", fmt.Errorf("upload config missing")
	}
	baseName := filepath.Base(strings.TrimSpace(fileName))
	if baseName == "." || baseName == ".." || baseName == "/" || baseName == "" {
		return "", 0, "", fmt.Errorf("the file needs a name")
	}
	allowed, err := normalizeAllowedFileTypes(allowedTypes)
	if err != nil {
		return "", 0, "", fmt.Errorf("configured file types are invalid")
	}
	ext := strings.TrimPrefix(strings.ToLower(filepath.Ext(baseName)), ".")
	if ext == "" || !strings.Contains(","+allowed+",", ","+ext+",") {
		return "", 0, "", fmt.Errorf("file type .%s is not allowed (allowed: %s)", ext, strings.ReplaceAll(allowed, ",", ", "))
	}
	if err := os.MkdirAll(filepath.Join(cfg.UploadDir, "documents"), 0o755); err != nil {
		return "", 0, "", fmt.Errorf("could not create upload directory")
	}
	rel := filepath.ToSlash(filepath.Join("documents", uuid.NewString()+"_"+baseName))
	abs := filepath.Join(cfg.UploadDir, filepath.FromSlash(rel))
	out, err := os.OpenFile(abs, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0o644)
	if err != nil {
		return "", 0, "", fmt.Errorf("could not store the file")
	}
	head := &headCapture{}
	written, copyErr := io.Copy(out, io.LimitReader(io.TeeReader(source, head), maxBytes+1))
	closeErr := out.Close()
	switch {
	case copyErr != nil || closeErr != nil:
		_ = os.Remove(abs)
		return "", 0, "", fmt.Errorf("the upload was interrupted; please try again")
	case written == 0:
		_ = os.Remove(abs)
		return "", 0, "", fmt.Errorf("the file is empty")
	case written > maxBytes:
		_ = os.Remove(abs)
		return "", 0, "", fmt.Errorf("the file is larger than the %s limit", formatMegabytes(maxBytes))
	}
	return rel, written, http.DetectContentType(head.buf), nil
}

func formatMegabytes(n int64) string {
	mb := float64(n) / (1 << 20)
	if mb == float64(int64(mb)) {
		return fmt.Sprintf("%d MB", int64(mb))
	}
	return fmt.Sprintf("%.1f MB", mb)
}

// documentUploadLimits returns the per-file size limit (Settings, capped by MAX_UPLOAD_MB) and allowed types.
func (h *DocumentHandler) documentUploadLimits() (int64, string) {
	maxBytes := int64(14 << 20)
	allowedTypes := "pdf,doc,docx,xls,xlsx,csv,txt,zip,jpg,jpeg,png,webp"
	var settings models.SiteSettings
	if err := h.DB.First(&settings, 1).Error; err == nil {
		if settings.MaxFileSizeBytes > 0 {
			maxBytes = settings.MaxFileSizeBytes
		}
		if strings.TrimSpace(settings.AllowedFileTypes) != "" {
			allowedTypes = settings.AllowedFileTypes
		}
	}
	if h.Cfg != nil && h.Cfg.MaxUploadBytes > 0 && maxBytes > h.Cfg.MaxUploadBytes {
		maxBytes = h.Cfg.MaxUploadBytes
	}
	return maxBytes, allowedTypes
}

// AdminUploadFile accepts a multipart upload ("file", plus optional "file_id" to replace an
// existing file, "label", "version", "language", "download_access") and streams it to disk.
func (h *DocumentHandler) AdminUploadFile(c *fiber.Ctx) error {
	docID, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid document id")
	}
	var doc models.Document
	if err := h.DB.First(&doc, "id = ?", docID).Error; err != nil {
		return errJSON(c, fiber.StatusNotFound, "Document not found")
	}
	user := c.Locals("user").(*models.User)
	if !user.IsAdminPlus() && doc.Status == models.DocPublished {
		return errJSON(c, fiber.StatusForbidden, "Editors cannot change files on published documents")
	}
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Choose a file to upload")
	}
	maxBytes, allowedTypes := h.documentUploadLimits()
	if fileHeader.Size > maxBytes {
		return errJSON(c, fiber.StatusRequestEntityTooLarge, fmt.Sprintf("The file is larger than the %s limit set in Settings", formatMegabytes(maxBytes)))
	}

	var existing *models.DocumentFile
	if raw := strings.TrimSpace(c.FormValue("file_id")); raw != "" {
		fileID, err := parseUUID(raw)
		if err != nil {
			return errJSON(c, fiber.StatusBadRequest, "Invalid file id")
		}
		var row models.DocumentFile
		if err := h.DB.Where("id = ? AND document_id = ?", fileID, docID).First(&row).Error; err != nil {
			return errJSON(c, fiber.StatusNotFound, "File not found")
		}
		existing = &row
	}

	source, err := fileHeader.Open()
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Could not read the uploaded file")
	}
	defer source.Close()
	storedPath, size, detectedType, err := storeDocumentStream(h.Cfg, fileHeader.Filename, source, maxBytes, allowedTypes)
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, strings.ToUpper(err.Error()[:1])+err.Error()[1:])
	}

	mimeType := strings.TrimSpace(fileHeader.Header.Get("Content-Type"))
	if mimeType == "" || mimeType == "application/octet-stream" {
		mimeType = detectedType
	}
	formValue := func(key, fallback string) string {
		if value := strings.TrimSpace(c.FormValue(key)); value != "" {
			return value
		}
		return fallback
	}

	row := models.DocumentFile{DocumentID: docID}
	previousPath := ""
	if existing != nil {
		row = *existing
		previousPath = existing.StoragePath
	} else {
		var count int64
		h.DB.Model(&models.DocumentFile{}).Where("document_id = ?", docID).Count(&count)
		row.SortOrder = int(count)
		row.Version = "1.0"
		row.DownloadAccess = models.DownloadMember
	}
	row.FileName = filepath.Base(fileHeader.Filename)
	row.StoragePath = storedPath
	row.Mime = mimeType
	row.SizeBytes = size
	row.Label = formValue("label", firstNonEmpty(row.Label, row.FileName))
	row.Version = formValue("version", firstNonEmpty(row.Version, "1.0"))
	row.Language = localeOrDefault(formValue("language", row.Language))
	if access := strings.TrimSpace(c.FormValue("download_access")); access != "" {
		row.DownloadAccess = normalizeDownloadAccess(access)
	}

	if err := h.DB.Save(&row).Error; err != nil {
		if path, pathErr := documentUploadPath(h.Cfg, storedPath); pathErr == nil {
			_ = os.Remove(path)
		}
		return errJSON(c, fiber.StatusInternalServerError, "Could not save the file")
	}
	// Remove the replaced file only after the new one is recorded.
	if previousPath != "" && previousPath != storedPath {
		if path, pathErr := documentUploadPath(h.Cfg, previousPath); pathErr == nil {
			_ = os.Remove(path)
		}
	}
	apiPublicURL := ""
	if h.Cfg != nil {
		apiPublicURL = h.Cfg.APIPublicURL
	}
	status := fiber.StatusCreated
	if existing != nil {
		status = fiber.StatusOK
	}
	return c.Status(status).JSON(filePayload(row, apiPublicURL))
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func (h *DocumentHandler) AdminDeleteFile(c *fiber.Ctx) error {
	docID, err := parseUUID(c.Params("id"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid document id")
	}
	fileID, err := parseUUID(c.Params("fileID"))
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid file id")
	}
	var doc models.Document
	if err := h.DB.First(&doc, "id = ?", docID).Error; err != nil {
		return errJSON(c, fiber.StatusNotFound, "Document not found")
	}
	user := c.Locals("user").(*models.User)
	if !user.IsAdminPlus() && doc.Status == models.DocPublished {
		return errJSON(c, fiber.StatusForbidden, "Editors cannot change files on published documents")
	}
	var file models.DocumentFile
	if err := h.DB.Where("id = ? AND document_id = ?", fileID, docID).First(&file).Error; err != nil {
		return errJSON(c, fiber.StatusNotFound, "File not found")
	}
	if err := h.DB.Delete(&file).Error; err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not delete file")
	}
	if path, err := documentUploadPath(h.Cfg, file.StoragePath); err == nil {
		_ = os.Remove(path)
	}
	return msg(c, "File deleted")
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
