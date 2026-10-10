package seed

import (
	_ "embed"
	"encoding/json"
	"log"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

//go:embed documents_demo.json
var documentsDemoJSON []byte

type docSeedJSON struct {
	Number      string `json:"number"`
	CatCode     string `json:"cat_code"`
	Access      string `json:"access"`
	Year        int    `json:"year"`
	Tags        string `json:"tags"`
	LoTitle     string `json:"lo_title"`
	EnTitle     string `json:"en_title"`
	LoSlug      string `json:"lo_slug"`
	EnSlug      string `json:"en_slug"`
	LoSum       string `json:"lo_sum"`
	EnSum       string `json:"en_sum"`
	LoBody      string `json:"lo_body"`
	EnBody      string `json:"en_body"`
	FileName    string `json:"file_name"`
	FileDL      string `json:"file_dl"`
	FileLabelLo string `json:"file_label_lo"`
	FileLabelEn string `json:"file_label_en"`
}

// ReseedDocuments clears and reloads demo documents.
func ReseedDocuments(db *gorm.DB) error {
	if err := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.DocumentFile{}).Error; err != nil {
		return err
	}
	if err := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.DocumentTranslation{}).Error; err != nil {
		return err
	}
	if err := db.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Delete(&models.Document{}).Error; err != nil {
		return err
	}
	return seedDocuments(db)
}

func loadDocSeeds() ([]docSeedJSON, error) {
	var seeds []docSeedJSON
	if err := json.Unmarshal(documentsDemoJSON, &seeds); err != nil {
		return nil, err
	}
	return seeds, nil
}

func seedDocuments(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.Document{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	seeds, err := loadDocSeeds()
	if err != nil {
		return err
	}

	cats := map[string]uuid.UUID{}
	var all []models.Category
	if err := db.Find(&all).Error; err != nil {
		return err
	}
	for _, c := range all {
		cats[c.Code] = c.ID
	}

	now := time.Now().UTC()
	eff := time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC)

	for _, s := range seeds {
		catID, ok := cats[s.CatCode]
		if !ok {
			continue
		}
		access := models.ReadPublic
		switch s.Access {
		case "member":
			access = models.ReadMember
		case "vip":
			access = models.ReadVIP
		}
		dl := models.DownloadMember
		if s.FileDL == "vip" {
			dl = models.DownloadVIP
		}
		doc := models.Document{
			DocumentNumber: s.Number,
			CategoryID:     catID,
			ReadAccess:     access,
			Status:         models.DocPublished,
			PublishedAt:    &now,
			EffectiveDate:  &eff,
			Year:           s.Year,
			Tags:           s.Tags,
		}
		if err := db.Create(&doc).Error; err != nil {
			return err
		}
		trs := []models.DocumentTranslation{
			{
				DocumentID: doc.ID, Locale: "lo", Title: s.LoTitle, Slug: s.LoSlug,
				Summary: s.LoSum, BodyHTML: s.LoBody, SEOTitle: s.LoTitle + " | BAN BUNSI", SEODescription: s.LoSum,
			},
			{
				DocumentID: doc.ID, Locale: "en", Title: s.EnTitle, Slug: s.EnSlug,
				Summary: s.EnSum, BodyHTML: s.EnBody, SEOTitle: s.EnTitle + " | BAN BUNSI", SEODescription: s.EnSum,
			},
		}
		if err := db.Create(&trs).Error; err != nil {
			return err
		}
		files := []models.DocumentFile{
			{
				DocumentID: doc.ID, Label: s.FileLabelLo, FileName: s.FileName,
				Mime: "application/pdf", SizeBytes: 256000, Language: "lo",
				Version: "1.0", DownloadAccess: dl, SortOrder: 0,
			},
			{
				DocumentID: doc.ID, Label: s.FileLabelEn, FileName: "en-" + s.FileName,
				Mime: "application/pdf", SizeBytes: 248000, Language: "en",
				Version: "1.0", DownloadAccess: dl, SortOrder: 1,
			},
		}
		if err := db.Create(&files).Error; err != nil {
			return err
		}
	}
	log.Printf("seeded %d demo documents", len(seeds))
	return nil
}
