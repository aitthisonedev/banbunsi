package db

import (
	"fmt"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(databaseURL string, isDev bool) (*gorm.DB, error) {
	logLevel := logger.Warn
	if isDev {
		logLevel = logger.Info
	}
	gdb, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("connect postgres: %w", err)
	}
	return gdb, nil
}

func AutoMigrate(gdb *gorm.DB) error {
	return gdb.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.EmailVerificationToken{},
		&models.PasswordResetToken{},
		&models.Category{},
		&models.CategoryTranslation{},
		&models.SiteSettings{},
		&models.Membership{},
		&models.AuditLog{},
	)
}
