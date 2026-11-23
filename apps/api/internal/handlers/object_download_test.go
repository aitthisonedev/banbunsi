package handlers

import (
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/auth"
	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	appdb "github.com/banbunsi/banbunsi/apps/api/internal/db"
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestR2DownloadEnforcesMembershipBeforeOpeningObject(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	defer sqlDB.Close()
	tx := db.Begin()
	if tx.Error != nil {
		t.Fatal(tx.Error)
	}
	defer tx.Rollback()
	schema := "download_test_" + uuid.NewString()
	if err := tx.Exec(`CREATE SCHEMA "` + schema + `"`).Error; err != nil {
		t.Fatal(err)
	}
	if err := tx.Exec(`SET LOCAL search_path TO "` + schema + `"`).Error; err != nil {
		t.Fatal(err)
	}
	if err := appdb.AutoMigrate(tx); err != nil {
		t.Fatal(err)
	}
	category := models.Category{Code: "test", IsActive: true}
	if err := tx.Create(&category).Error; err != nil {
		t.Fatal(err)
	}
	doc := models.Document{DocumentNumber: "TEST", CategoryID: category.ID, Status: models.DocPublished}
	if err := tx.Create(&doc).Error; err != nil {
		t.Fatal(err)
	}
	file := models.DocumentFile{DocumentID: doc.ID, FileName: "private.pdf", StoragePath: "documents/private.pdf", DownloadAccess: models.DownloadVIP}
	if err := tx.Create(&file).Error; err != nil {
		t.Fatal(err)
	}
	member := models.User{Email: "member@example.test", AccountStatus: models.StatusActive, StaffRole: models.RoleMember}
	if err := tx.Create(&member).Error; err != nil {
		t.Fatal(err)
	}
	sessions := &auth.SessionService{DB: tx, TTL: time.Hour}
	token, _, err := sessions.Create(member.ID, "test", "127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	store := &memoryStore{files: map[string][]byte{file.StoragePath: []byte("%PDF-1.4\nprivate document")}}
	cfg := &config.Config{UploadDir: t.TempDir(), ObjectStore: store, SessionCookieName: "test_session"}
	h := &DocumentHandler{DB: tx, Cfg: cfg, Sessions: sessions}
	app := fiber.New()
	app.Get("/files/:id", h.DownloadFile)
	request := func(cookie bool, want int) *http.Response {
		t.Helper()
		req := httptest.NewRequest("GET", "/files/"+file.ID.String()+"?preview=1", nil)
		if cookie {
			req.AddCookie(&http.Cookie{Name: "test_session", Value: token})
		}
		resp, err := app.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		if resp.StatusCode != want {
			resp.Body.Close()
			t.Fatalf("status %d, want %d", resp.StatusCode, want)
		}
		return resp
	}
	request(false, 401).Body.Close()
	request(true, 403).Body.Close()
	if store.reads != 0 {
		t.Fatal("unauthorized request opened private R2 object")
	}
	membership := models.Membership{UserID: member.ID, Tier: models.TierVIP, Status: "active", IsCurrent: true, StartsAt: time.Now()}
	if err := tx.Create(&membership).Error; err != nil {
		t.Fatal(err)
	}
	response := request(true, 200)
	body, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil || string(body) != string(store.files[file.StoragePath]) {
		t.Fatal("streamed download lost bytes")
	}
	if response.Header.Get("Cache-Control") != "private, no-store" || !strings.HasPrefix(response.Header.Get("Content-Disposition"), "inline;") {
		t.Fatal("private preview headers missing")
	}
	if err := tx.Model(&doc).Update("status", models.DocDraft).Error; err != nil {
		t.Fatal(err)
	}
	reads := store.reads
	request(true, 404).Body.Close()
	if store.reads != reads {
		t.Fatal("draft document opened by non-staff member")
	}
}
