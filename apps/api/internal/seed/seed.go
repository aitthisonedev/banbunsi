package seed

import (
	"log"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/auth"
	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type categorySeed struct {
	Code   string
	Order  int
	LoName string
	EnName string
	LoSlug string
	EnSlug string
}

var categories = []categorySeed{
	{Code: "accounting", Order: 1, LoName: "ການບັນຊີ", EnName: "Accounting", LoSlug: "kan-banchi", EnSlug: "accounting"},
	{Code: "finance", Order: 2, LoName: "ການເງິນ", EnName: "Finance", LoSlug: "kan-ngen", EnSlug: "finance"},
	{Code: "tax", Order: 3, LoName: "ພາສີ", EnName: "Tax", LoSlug: "phasi", EnSlug: "tax"},
	{Code: "duties", Order: 4, LoName: "ອາກອນ", EnName: "Duties", LoSlug: "akon", EnSlug: "duties"},
	{Code: "audit", Order: 5, LoName: "ການກວດສອບ", EnName: "Auditing", LoSlug: "kan-kuatsop", EnSlug: "auditing"},
	{Code: "law", Order: 6, LoName: "ກົດໝາຍ", EnName: "Law", LoSlug: "kotmai", EnSlug: "law"},
	{Code: "knowledge", Order: 7, LoName: "ຂໍ້ມູນຄວາມຮູ້ອື່ນໆ", EnName: "Other Knowledge", LoSlug: "khwamhu-un", EnSlug: "other-knowledge"},
	{Code: "sme", Order: 8, LoName: "ທຸລະກິດຂະໜາດນ້ອຍ", EnName: "Small Business", LoSlug: "thurakit-noy", EnSlug: "small-business"},
}

func Run(db *gorm.DB, cfg *config.Config) error {
	if err := seedSettings(db); err != nil {
		return err
	}
	if err := seedCategories(db); err != nil {
		return err
	}
	if err := seedOwner(db, cfg); err != nil {
		return err
	}
	if err := seedDocuments(db); err != nil {
		return err
	}
	if err := seedQuizzes(db); err != nil {
		return err
	}
	return nil
}

func seedSettings(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.SiteSettings{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	settings := models.SiteSettings{
		ID:                       1,
		SiteNameLo:               "BAN BUNSI",
		SiteNameEn:               "BAN BUNSI",
		Timezone:                 "Asia/Vientiane",
		ContactEmail:             "banbunsi26@gmail.com",
		WhatsappNumber:           "+8562058444184",
		FacebookURL:              "https://www.facebook.com/profile.php?id=100080330433345",
		TiktokURL:                "https://www.tiktok.com/@banaccounting",
		DefaultMetaDescriptionLo: "Knowledge center for accounting, finance, tax, and law (Lao).",
		DefaultMetaDescriptionEn: "Knowledge center for accounting, finance, tax, and law.",
		DefaultSEOTitleLo:        "BAN BUNSI",
		DefaultSEOTitleEn:        "BAN BUNSI — Accounting Knowledge Center",
	}
	return db.Create(&settings).Error
}

func seedCategories(db *gorm.DB) error {
	for _, c := range categories {
		var existing models.Category
		err := db.Where("code = ?", c.Code).First(&existing).Error
		if err == nil {
			continue
		}
		if err != gorm.ErrRecordNotFound {
			return err
		}
		cat := models.Category{
			Code:      c.Code,
			SortOrder: c.Order,
			IsActive:  true,
		}
		if err := db.Create(&cat).Error; err != nil {
			return err
		}
		trs := []models.CategoryTranslation{
			{
				CategoryID: cat.ID,
				Locale:     "lo",
				Name:       c.LoName,
				Description: c.LoName,
				Slug:       c.LoSlug,
				SEOTitle:   c.LoName + " | BAN BUNSI",
			},
			{
				CategoryID:  cat.ID,
				Locale:      "en",
				Name:        c.EnName,
				Description: c.EnName,
				Slug:        c.EnSlug,
				SEOTitle:    c.EnName + " | BAN BUNSI",
			},
		}
		if err := db.Create(&trs).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedOwner(db *gorm.DB, cfg *config.Config) error {
	email := cfg.OwnerEmail
	var user models.User
	err := db.Where("email = ?", email).First(&user).Error
	if err == nil {
		return nil
	}
	if err != gorm.ErrRecordNotFound {
		return err
	}
	hash, err := auth.HashPassword(cfg.OwnerPassword)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	user = models.User{
		Name:            cfg.OwnerName,
		Email:           email,
		PasswordHash:    hash,
		EmailVerifiedAt: &now,
		StaffRole:       models.RoleOwner,
		AccountStatus:   models.StatusActive,
	}
	if err := db.Create(&user).Error; err != nil {
		return err
	}
	if err := CreateCurrentMember(db, user.ID, "seeded owner"); err != nil {
		return err
	}
	log.Printf("seeded owner account: %s", email)
	return nil
}

func CreateCurrentMember(db *gorm.DB, userID uuid.UUID, notes string) error {
	var count int64
	if err := db.Model(&models.Membership{}).Where("user_id = ? AND is_current = ?", userID, true).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	m := models.Membership{
		UserID:    userID,
		Tier:      models.TierMember,
		Status:    "active",
		IsCurrent: true,
		StartsAt:  time.Now().UTC(),
		Notes:     notes,
	}
	return db.Create(&m).Error
}
