package handlers

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	maxCoverBytes = 5 << 20  // 5MB
	maxDocBytes   = 25 << 20 // 25MB
)

type AdminUploadHandler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

type uploadResult struct {
	Kind      string `json:"kind"`
	Path      string `json:"path"`
	URL       string `json:"url"`
	FileName  string `json:"file_name"`
	Mime      string `json:"mime"`
	SizeBytes int64  `json:"size_bytes"`
}

func (h *AdminUploadHandler) Upload(c *fiber.Ctx) error {
	kind := strings.ToLower(strings.TrimSpace(c.FormValue("kind")))
	if kind == "" {
		kind = "document"
	}
	file, err := c.FormFile("file")
	if err != nil {
		return errJSON(c, fiber.StatusBadRequest, "File is required")
	}

	var (
		maxBytes int64
		subdir   string
		ext      string
		ok       bool
		mime     = file.Header.Get("Content-Type")
	)

	switch kind {
	case "cover", "image":
		kind = "cover"
		maxBytes = maxCoverBytes
		subdir = "covers"
		ext, ok = imageExt(file.Filename, mime)
		if !ok {
			return errJSON(c, fiber.StatusBadRequest, "Cover must be JPEG, PNG, or WebP")
		}
	case "document", "file":
		kind = "document"
		maxBytes = maxDocBytes
		subdir = "documents"
		ext, ok = documentExt(file.Filename, mime)
		if !ok {
			return errJSON(c, fiber.StatusBadRequest, "Document must be PDF, Word, Excel, or plain text")
		}
	default:
		return errJSON(c, fiber.StatusBadRequest, "kind must be cover or document")
	}

	if file.Size <= 0 || file.Size > maxBytes {
		return errJSON(c, fiber.StatusBadRequest, fmt.Sprintf("File must be 1 byte–%dMB", maxBytes>>20))
	}

	dir := filepath.Join(h.Cfg.UploadDir, subdir)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not store file")
	}

	name := uuid.New().String() + ext
	rel := filepath.ToSlash(filepath.Join(subdir, name))
	abs := filepath.Join(h.Cfg.UploadDir, filepath.FromSlash(rel))

	src, err := file.Open()
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not read file")
	}
	defer src.Close()

	tmp := abs + ".tmp"
	out, err := os.OpenFile(tmp, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not store file")
	}
	written, copyErr := io.Copy(out, io.LimitReader(src, maxBytes+1))
	closeErr := out.Close()
	if copyErr != nil || closeErr != nil || written > maxBytes {
		_ = os.Remove(tmp)
		return errJSON(c, fiber.StatusBadRequest, "File too large")
	}
	if err := os.Rename(tmp, abs); err != nil {
		_ = os.Remove(tmp)
		return errJSON(c, fiber.StatusInternalServerError, "Could not store file")
	}

	if mime == "" {
		mime = mimeFromExt(ext)
	}

	original := filepath.Base(file.Filename)
	if original == "" || original == "." {
		original = name
	}

	return c.Status(fiber.StatusCreated).JSON(uploadResult{
		Kind:      kind,
		Path:      rel,
		URL:       "/uploads/" + rel,
		FileName:  original,
		Mime:      mime,
		SizeBytes: written,
	})
}

func (h *AdminUploadHandler) ListLibrary(c *fiber.Ctx) error {
	kind := strings.ToLower(strings.TrimSpace(c.Query("kind", "cover")))
	items := []fiber.Map{}

	if kind == "cover" || kind == "image" {
		// Brand library paths served by the Next.js public folder (frontend).
		brand := []string{
			"/brand/categories/cat-accounting.jpg",
			"/brand/categories/cat-finance.jpg",
			"/brand/categories/cat-tax.jpg",
			"/brand/categories/cat-duties.jpg",
			"/brand/categories/cat-audit.jpg",
			"/brand/categories/cat-law.jpg",
			"/images/hero-default.jpeg",
			"/brand/hero-financial-advisor.jpeg",
		}
		for _, p := range brand {
			items = append(items, fiber.Map{
				"path": p,
				"url":  p,
				"kind": "cover",
				"source": "brand",
			})
		}

		coverDir := filepath.Join(h.Cfg.UploadDir, "covers")
		entries, err := os.ReadDir(coverDir)
		if err == nil {
			for _, e := range entries {
				if e.IsDir() {
					continue
				}
				name := e.Name()
				ext := strings.ToLower(filepath.Ext(name))
				if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
					continue
				}
				rel := filepath.ToSlash(filepath.Join("covers", name))
				items = append(items, fiber.Map{
					"path":   rel,
					"url":    "/uploads/" + rel,
					"kind":   "cover",
					"source": "upload",
				})
			}
		}
	}

	if kind == "document" || kind == "file" {
		docDir := filepath.Join(h.Cfg.UploadDir, "documents")
		entries, err := os.ReadDir(docDir)
		if err == nil {
			for _, e := range entries {
				if e.IsDir() {
					continue
				}
				info, err := e.Info()
				if err != nil {
					continue
				}
				name := e.Name()
				rel := filepath.ToSlash(filepath.Join("documents", name))
				items = append(items, fiber.Map{
					"path":       rel,
					"url":        "/uploads/" + rel,
					"file_name":  name,
					"size_bytes": info.Size(),
					"mime":       mimeFromExt(filepath.Ext(name)),
					"kind":       "document",
					"source":     "upload",
					"updated_at": info.ModTime().UTC().Format(time.RFC3339),
				})
			}
		}
	}

	return c.JSON(fiber.Map{"items": items})
}

func imageExt(filename, contentType string) (string, bool) {
	ct := strings.ToLower(strings.TrimSpace(contentType))
	switch {
	case strings.Contains(ct, "jpeg"), strings.Contains(ct, "jpg"):
		return ".jpg", true
	case strings.Contains(ct, "png"):
		return ".png", true
	case strings.Contains(ct, "webp"):
		return ".webp", true
	}
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		return ".jpg", true
	case ".png":
		return ".png", true
	case ".webp":
		return ".webp", true
	default:
		return "", false
	}
}

func documentExt(filename, contentType string) (string, bool) {
	ct := strings.ToLower(strings.TrimSpace(contentType))
	switch {
	case strings.Contains(ct, "pdf"):
		return ".pdf", true
	case strings.Contains(ct, "msword"):
		return ".doc", true
	case strings.Contains(ct, "wordprocessingml"):
		return ".docx", true
	case strings.Contains(ct, "ms-excel"), strings.Contains(ct, "spreadsheetml"):
		if strings.Contains(ct, "spreadsheetml") {
			return ".xlsx", true
		}
		return ".xls", true
	case strings.Contains(ct, "text/plain"):
		return ".txt", true
	}
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".rtf", ".odt":
		return ext, true
	default:
		return "", false
	}
}

func mimeFromExt(ext string) string {
	switch strings.ToLower(ext) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".pdf":
		return "application/pdf"
	case ".doc":
		return "application/msword"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".xls":
		return "application/vnd.ms-excel"
	case ".xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case ".txt":
		return "text/plain"
	default:
		return "application/octet-stream"
	}
}
