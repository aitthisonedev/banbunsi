package seed

import (
	"log"
	"strings"
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
	if err := backfillUserNames(db); err != nil {
		return err
	}
	if err := seedDemoAccounts(db, cfg); err != nil {
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
				CategoryID:  cat.ID,
				Locale:      "lo",
				Name:        c.LoName,
				Description: c.LoName,
				Slug:        c.LoSlug,
				SEOTitle:    c.LoName + " | BAN BUNSI",
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

type demoAccount struct {
	Email    string
	Password string
	Name     string
	Role     models.StaffRole
	Tier     models.MembershipTier
	Notes    string
}

func backfillUserNames(db *gorm.DB) error {
	var users []models.User
	if err := db.Where("first_name = ? AND name <> ?", "", "").Find(&users).Error; err != nil {
		return err
	}
	for _, u := range users {
		if err := db.Model(&u).Updates(map[string]interface{}{
			"first_name": u.Name,
			"last_name":  "",
		}).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedDemoAccounts(db *gorm.DB, cfg *config.Config) error {
	accounts := []demoAccount{
		{
			Email:    cfg.OwnerEmail,
			Password: cfg.OwnerPassword,
			Name:     cfg.OwnerName,
			Role:     models.RoleOwner,
			Tier:     models.TierMember,
			Notes:    "seeded owner/admin",
		},
		{
			Email:    "user@gmail.com",
			Password: "user123",
			Name:     "Demo User",
			Role:     models.RoleMember,
			Tier:     models.TierMember,
			Notes:    "seeded general member",
		},
		{
			Email:    "vip@gmail.com",
			Password: "vip1123",
			Name:     "Demo VIP",
			Role:     models.RoleMember,
			Tier:     models.TierVIP,
			Notes:    "seeded VIP member",
		},
	}
	if !cfg.IsDev() {
		// Production creates the owner once, never demo members or password resets.
		accounts = accounts[:1]
	}
	for _, a := range accounts {
		if !cfg.IsDev() {
			var count int64
			if err := db.Model(&models.User{}).Where("email = ?", strings.ToLower(strings.TrimSpace(a.Email))).Count(&count).Error; err != nil {
				return err
			}
			if count > 0 {
				continue
			}
		}
		if err := upsertDemoAccount(db, a); err != nil {
			return err
		}
	}
	return nil
}

func upsertDemoAccount(db *gorm.DB, a demoAccount) error {
	email := strings.ToLower(strings.TrimSpace(a.Email))
	if email == "" || a.Password == "" {
		return nil
	}
	hash, err := auth.HashPassword(a.Password)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	var user models.User
	err = db.Where("email = ?", email).First(&user).Error
	first, last := splitName(a.Name)
	if err == gorm.ErrRecordNotFound {
		user = models.User{
			Name:            a.Name,
			FirstName:       first,
			LastName:        last,
			Email:           email,
			PasswordHash:    hash,
			EmailVerifiedAt: &now,
			StaffRole:       a.Role,
			AccountStatus:   models.StatusActive,
		}
		if err := db.Create(&user).Error; err != nil {
			return err
		}
		log.Printf("seeded account: %s (%s / %s)", email, a.Role, a.Tier)
	} else if err != nil {
		return err
	} else {
		// Keep edited profile fields; only refresh auth/role for demo logins.
		updates := map[string]interface{}{
			"password_hash":     hash,
			"staff_role":        a.Role,
			"account_status":    models.StatusActive,
			"email_verified_at": now,
		}
		if user.FirstName == "" {
			updates["first_name"] = first
			updates["last_name"] = last
			updates["name"] = a.Name
		}
		if err := db.Model(&user).Updates(updates).Error; err != nil {
			return err
		}
		log.Printf("updated demo account: %s (%s / %s)", email, a.Role, a.Tier)
	}
	return EnsureCurrentMembership(db, user.ID, a.Tier, a.Notes)
}

func splitName(full string) (first, last string) {
	full = strings.TrimSpace(full)
	if full == "" {
		return "", ""
	}
	parts := strings.Fields(full)
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func CreateCurrentMember(db *gorm.DB, userID uuid.UUID, notes string) error {
	return EnsureCurrentMembership(db, userID, models.TierMember, notes)
}

func EnsureCurrentMembership(db *gorm.DB, userID uuid.UUID, tier models.MembershipTier, notes string) error {
	var m models.Membership
	err := db.Where("user_id = ? AND is_current = ?", userID, true).First(&m).Error
	if err == nil {
		if m.Tier == tier && m.Status == "active" {
			return nil
		}
		return db.Model(&m).Updates(map[string]interface{}{
			"tier":    tier,
			"status":  "active",
			"notes":   notes,
			"ends_at": nil,
		}).Error
	}
	if err != gorm.ErrRecordNotFound {
		return err
	}
	m = models.Membership{
		UserID:    userID,
		Tier:      tier,
		Status:    "active",
		IsCurrent: true,
		StartsAt:  time.Now().UTC(),
		Notes:     notes,
	}
	return db.Create(&m).Error
}
