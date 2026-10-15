package handlers

import (
	"sort"
	"strings"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AdminHandler struct {
	DB *gorm.DB
}

// downloadAuditAction is recorded in audit_logs for every successful file download.
const downloadAuditAction = "document.download"

// dashboardSeriesDays is how far back the daily series go (the longest range the dashboard offers).
const dashboardSeriesDays = 366

type dayCount struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

type dashboardActivity struct {
	Type  string    `json:"type"`
	Title string    `json:"title"`
	User  string    `json:"user,omitempty"`
	At    time.Time `json:"at"`
	Link  string    `json:"link,omitempty"`
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

	// Additional fields for the dashboard overview; the fields above keep their meaning.
	var users, quizzes, categories, downloads int64
	_ = h.DB.Model(&models.User{}).Count(&users)
	_ = h.DB.Model(&models.Quiz{}).Count(&quizzes)
	_ = h.DB.Model(&models.Category{}).Count(&categories)
	_ = h.DB.Model(&models.AuditLog{}).Where("action = ?", downloadAuditAction).Count(&downloads)

	loc := h.siteLocation()
	since := time.Now().In(loc).AddDate(0, 0, -dashboardSeriesDays)
	var firstDownload *time.Time
	var first models.AuditLog
	if err := h.DB.Where("action = ?", downloadAuditAction).Order("created_at ASC").First(&first).Error; err == nil {
		firstDownload = &first.CreatedAt
	}

	locale := c.Query("locale", "lo")
	if locale != "en" {
		locale = "lo"
	}

	return c.JSON(fiber.Map{
		"articles":          0,
		"documents":         documents,
		"members":           members,
		"active_vip":        activeVIP,
		"pending_review":    pending,
		"download_requests": 0,

		"users":                   users,
		"quizzes":                 quizzes,
		"categories":              categories,
		"downloads":               downloads,
		"downloads_tracked_since": firstDownload,
		"timezone":                loc.String(),
		"series": fiber.Map{
			"documents": h.dailyCounts(h.DB.Model(&models.Document{}), "created_at", loc, since),
			"users":     h.dailyCounts(h.DB.Model(&models.User{}), "created_at", loc, since),
			"vip": h.dailyCounts(h.DB.Model(&models.Membership{}).
				Where("tier = ? AND is_current = ? AND status = ?", models.TierVIP, true, "active"), "starts_at", loc, since),
			"quizzes":   h.dailyCounts(h.DB.Model(&models.Quiz{}), "created_at", loc, since),
			"downloads": h.dailyCounts(h.DB.Model(&models.AuditLog{}).Where("action = ?", downloadAuditAction), "created_at", loc, since),
		},
		"recent_activity": h.recentActivity(locale, 8),
	})
}

// siteLocation is the timezone from Settings (used to group counts by calendar day), or UTC.
func (h *AdminHandler) siteLocation() *time.Location {
	var settings models.SiteSettings
	if err := h.DB.Select("timezone").First(&settings, 1).Error; err == nil {
		if loc, err := time.LoadLocation(strings.TrimSpace(settings.Timezone)); err == nil && settings.Timezone != "" {
			return loc
		}
	}
	return time.UTC
}

// dailyCounts groups rows of query by calendar day (in loc) of column, for days on or after since.
// Only days with at least one row are returned.
func (h *AdminHandler) dailyCounts(query *gorm.DB, column string, loc *time.Location, since time.Time) []dayCount {
	day := "to_char(" + column + " AT TIME ZONE '" + strings.ReplaceAll(loc.String(), "'", "") + "', 'YYYY-MM-DD')"
	rows := []dayCount{}
	if err := query.Select(day+" AS date, count(*) AS count").
		Where(column+" >= ?", since).
		Group("date").Order("date").Scan(&rows).Error; err != nil {
		return []dayCount{}
	}
	return rows
}

// recentActivity lists the newest documents, categories, quizzes and member registrations.
// Records do not store who created content, so only registrations carry a user name.
func (h *AdminHandler) recentActivity(locale string, limit int) []dashboardActivity {
	items := []dashboardActivity{}

	var docs []models.Document
	_ = h.DB.Preload("Translations").Order("created_at DESC").Limit(limit).Find(&docs).Error
	for _, d := range docs {
		title := d.DocumentNumber
		if tr := pickDocTranslation(d.Translations, locale); tr != nil && tr.Title != "" {
			title = tr.Title
		}
		items = append(items, dashboardActivity{Type: "document", Title: title, At: d.CreatedAt, Link: "/admin/documents/" + d.ID.String()})
	}

	var cats []models.Category
	_ = h.DB.Preload("Translations").Order("created_at DESC").Limit(limit).Find(&cats).Error
	for _, cat := range cats {
		title := cat.Code
		if tr := pickTranslation(cat.Translations, locale); tr != nil && tr.Name != "" {
			title = tr.Name
		}
		items = append(items, dashboardActivity{Type: "category", Title: title, At: cat.CreatedAt, Link: "/admin/categories/" + cat.ID.String()})
	}

	var quizzes []models.Quiz
	_ = h.DB.Preload("Translations").Order("created_at DESC").Limit(limit).Find(&quizzes).Error
	for _, q := range quizzes {
		title := q.Code
		if tr := pickQuizTranslation(q.Translations, locale); tr != nil && tr.Title != "" {
			title = tr.Title
		}
		items = append(items, dashboardActivity{Type: "quiz", Title: title, At: q.CreatedAt, Link: "/admin/quizzes/" + q.ID.String()})
	}

	var users []models.User
	_ = h.DB.Where("staff_role = ?", models.RoleMember).Order("created_at DESC").Limit(limit).Find(&users).Error
	for _, u := range users {
		name := strings.TrimSpace(u.Name)
		if name == "" {
			name = u.Email
		}
		items = append(items, dashboardActivity{Type: "member", Title: name, User: name, At: u.CreatedAt, Link: "/admin/members"})
	}

	sort.SliceStable(items, func(i, j int) bool { return items[i].At.After(items[j].At) })
	if len(items) > limit {
		items = items[:limit]
	}
	return items
}
