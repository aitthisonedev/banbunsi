package seed

import (
	"log"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type docSeed struct {
	Number   string
	CatCode  string
	Access   models.ReadAccess
	Year     int
	Tags     string
	LoTitle  string
	EnTitle  string
	LoSlug   string
	EnSlug   string
	LoSum    string
	EnSum    string
	LoBody   string
	EnBody   string
	FileName string
	FileDL   models.DownloadAccess
}

func seedDocuments(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.Document{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
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

	// Seed uses English for both locales so this file stays ASCII-safe.
	// Staff can edit Lao copy via admin CRUD.
	seeds := []docSeed{
		{
			Number: "BB-TAX-2026-001", CatCode: "tax", Access: models.ReadPublic, Year: 2026, Tags: "tax,form",
			LoTitle: "Income tax form", EnTitle: "Income tax form",
			LoSlug: "income-tax-form-lo", EnSlug: "income-tax-form",
			LoSum: "Basic individual income tax form.", EnSum: "Basic individual income tax form.",
			LoBody: "<p>This document explains how to complete the income tax form.</p>",
			EnBody: "<p>This document explains how to complete the income tax form.</p>",
			FileName: "income-tax-form.pdf", FileDL: models.DownloadMember,
		},
		{
			Number: "BB-ACC-2026-002", CatCode: "accounting", Access: models.ReadPublic, Year: 2026, Tags: "accounting,guide",
			LoTitle: "Basic accounting guide", EnTitle: "Basic accounting guide",
			LoSlug: "basic-accounting-guide-lo", EnSlug: "basic-accounting-guide",
			LoSum: "Introduction to basic accounting principles.", EnSum: "Introduction to basic accounting principles.",
			LoBody: "<p>Overview of debit-credit basics and financial statements.</p>",
			EnBody: "<p>Overview of debit-credit basics and financial statements.</p>",
			FileName: "basic-accounting.pdf", FileDL: models.DownloadMember,
		},
		{
			Number: "BB-LAW-2026-003", CatCode: "law", Access: models.ReadMember, Year: 2026, Tags: "law,enterprise",
			LoTitle: "Enterprise law summary", EnTitle: "Enterprise law summary",
			LoSlug: "enterprise-law-summary-lo", EnSlug: "enterprise-law-summary",
			LoSum: "Member summary of enterprise law.", EnSum: "Member summary of enterprise law.",
			LoBody: "<p>Full summary available to verified members.</p>",
			EnBody: "<p>Full summary available to verified members.</p>",
			FileName: "enterprise-law.pdf", FileDL: models.DownloadMember,
		},
		{
			Number: "BB-FIN-2026-004", CatCode: "finance", Access: models.ReadPublic, Year: 2025, Tags: "finance,cashflow",
			LoTitle: "Cash flow management", EnTitle: "Cash flow management",
			LoSlug: "cash-flow-management-lo", EnSlug: "cash-flow-management",
			LoSum: "How SMEs track cash flow.", EnSum: "How SMEs track cash flow.",
			LoBody: "<p>Steps to plan and monitor cash flow.</p>",
			EnBody: "<p>Steps to plan and monitor cash flow.</p>",
			FileName: "cash-flow.pdf", FileDL: models.DownloadMember,
		},
		{
			Number: "BB-AUD-2026-005", CatCode: "audit", Access: models.ReadPublic, Year: 2026, Tags: "audit,checklist",
			LoTitle: "Internal audit checklist", EnTitle: "Internal audit checklist",
			LoSlug: "internal-audit-checklist-lo", EnSlug: "internal-audit-checklist",
			LoSum: "Checklist for accounting teams.", EnSum: "Checklist for accounting teams.",
			LoBody: "<p>Use this checklist before the annual review.</p>",
			EnBody: "<p>Use this checklist before the annual review.</p>",
			FileName: "audit-checklist.pdf", FileDL: models.DownloadMember,
		},
		{
			Number: "BB-VIP-2026-006", CatCode: "tax", Access: models.ReadVIP, Year: 2026, Tags: "tax,vip",
			LoTitle: "Advanced tax guide (VIP)", EnTitle: "Advanced tax guide (VIP)",
			LoSlug: "advanced-tax-guide-vip-lo", EnSlug: "advanced-tax-guide-vip",
			LoSum: "VIP document - public summary only.", EnSum: "VIP document - public summary only.",
			LoBody: "<p>Detailed VIP content.</p>",
			EnBody: "<p>Detailed VIP content.</p>",
			FileName: "advanced-tax-vip.pdf", FileDL: models.DownloadVIP,
		},
		{
			Number: "BB-DUT-2026-007", CatCode: "duties", Access: models.ReadPublic, Year: 2026, Tags: "duties,customs",
			LoTitle: "Customs duties guide", EnTitle: "Customs duties guide",
			LoSlug: "customs-duties-guide-lo", EnSlug: "customs-duties-guide",
			LoSum: "Basics of customs duties.", EnSum: "Basics of customs duties.",
			LoBody: "<p>Explains duty types and required paperwork.</p>",
			EnBody: "<p>Explains duty types and required paperwork.</p>",
			FileName: "customs-duties.pdf", FileDL: models.DownloadMember,
		},
		{
			Number: "BB-KNW-2026-008", CatCode: "knowledge", Access: models.ReadPublic, Year: 2026, Tags: "faq,start",
			LoTitle: "Getting started with BAN BUNSI", EnTitle: "Getting started with BAN BUNSI",
			LoSlug: "getting-started-ban-bunsi-lo", EnSlug: "getting-started-ban-bunsi",
			LoSum: "How to search and download documents.", EnSum: "How to search and download documents.",
			LoBody: "<p>Search from the home page or categories, then sign in to download.</p>",
			EnBody: "<p>Search from the home page or categories, then sign in to download.</p>",
			FileName: "getting-started.pdf", FileDL: models.DownloadMember,
		},
	}

	for _, s := range seeds {
		catID, ok := cats[s.CatCode]
		if !ok {
			continue
		}
		doc := models.Document{
			DocumentNumber: s.Number,
			CategoryID:     catID,
			ReadAccess:     s.Access,
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
				Summary: s.LoSum, BodyHTML: s.LoBody, SEOTitle: s.LoTitle + " | BAN BUNSI",
			},
			{
				DocumentID: doc.ID, Locale: "en", Title: s.EnTitle, Slug: s.EnSlug,
				Summary: s.EnSum, BodyHTML: s.EnBody, SEOTitle: s.EnTitle + " | BAN BUNSI",
			},
		}
		if err := db.Create(&trs).Error; err != nil {
			return err
		}
		file := models.DocumentFile{
			DocumentID:     doc.ID,
			Label:          s.EnTitle,
			FileName:       s.FileName,
			Mime:           "application/pdf",
			SizeBytes:      240000,
			Language:       "lo",
			Version:        "1.0",
			DownloadAccess: s.FileDL,
			SortOrder:      0,
		}
		if err := db.Create(&file).Error; err != nil {
			return err
		}
	}
	log.Printf("seeded %d documents", len(seeds))
	return nil
}
