package seed

import (
	"os"
	"testing"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Run against a disposable PostgreSQL database with TEST_DATABASE_URL set.
// All tables live in a transaction-local schema, which is rolled back.
func TestSeedCategoriesRespectsDeletedCategories(t *testing.T) {
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
	schema := "seed_test_" + uuid.New().String()
	if err := tx.Exec(`CREATE SCHEMA "` + schema + `"`).Error; err != nil {
		t.Fatal(err)
	}
	if err := tx.Exec(`SET LOCAL search_path TO "` + schema + `"`).Error; err != nil {
		t.Fatal(err)
	}
	if err := tx.AutoMigrate(&models.Category{}, &models.CategoryTranslation{}); err != nil {
		t.Fatal(err)
	}
	if err := seedCategories(tx); err != nil {
		t.Fatal(err)
	}
	var deleted models.Category
	if err := tx.Where("code = ?", "knowledge").First(&deleted).Error; err != nil {
		t.Fatal(err)
	}
	if err := tx.Delete(&deleted).Error; err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 2; i++ {
		if err := seedCategories(tx); err != nil {
			t.Fatalf("restart seed failed: %v", err)
		}
	}
	var count int64
	if err := tx.Unscoped().Model(&models.Category{}).Count(&count).Error; err != nil {
		t.Fatal(err)
	}
	if count != int64(len(categories)) {
		t.Fatalf("category count changed: %d", count)
	}
	var after models.Category
	if err := tx.Unscoped().First(&after, "id = ?", deleted.ID).Error; err != nil {
		t.Fatal(err)
	}
	if !after.DeletedAt.Valid {
		t.Fatal("deleted category was restored")
	}
	if err := tx.Model(&models.CategoryTranslation{}).Where("category_id = ?", deleted.ID).Count(&count).Error; err != nil {
		t.Fatal(err)
	}
	if count != 2 {
		t.Fatalf("translations changed: %d", count)
	}
}
