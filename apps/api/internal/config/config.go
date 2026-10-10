package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL         string
	APIAddr             string
	AppEnv              string
	AppPublicURL        string
	APIPublicURL        string
	CORSOrigins         []string
	CSRFTrustedOrigins  []string
	SessionCookieName   string
	SessionCookieSecure bool
	SessionTTL          time.Duration
	OwnerEmail          string
	OwnerPassword       string
	OwnerName           string
	UploadDir           string
	SMTPHost            string
	SMTPPort            int
	SMTPFrom            string
}

func Load() (*Config, error) {
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load(".env")

	ttlHours := envInt("SESSION_TTL_HOURS", 168)
	cfg := &Config{
		DatabaseURL:        env("DATABASE_URL", "postgres://banbunsi@localhost:5432/banbunsi?sslmode=disable"),
		APIAddr:            env("API_ADDR", ":8080"),
		AppEnv:             env("APP_ENV", "development"),
		AppPublicURL:       strings.TrimRight(env("APP_PUBLIC_URL", "http://localhost:3000"), "/"),
		APIPublicURL:       strings.TrimRight(env("API_PUBLIC_URL", "http://localhost:8080"), "/"),
		CORSOrigins:        splitCSV(env("CORS_ORIGINS", "http://localhost:3000")),
		CSRFTrustedOrigins: splitCSV(env("CSRF_TRUSTED_ORIGINS", "http://localhost:3000")),
		SessionCookieName:  env("SESSION_COOKIE_NAME", "bb_session"),
		SessionTTL:         time.Duration(ttlHours) * time.Hour,
		OwnerEmail:         strings.ToLower(strings.TrimSpace(env("OWNER_EMAIL", "banbunsi26@gmail.com"))),
		OwnerPassword:      env("OWNER_PASSWORD", "admin123"),
		OwnerName:          env("OWNER_NAME", "BAN BUNSI Admin"),
		UploadDir:          env("UPLOAD_DIR", "uploads"),
		SMTPHost:           env("SMTP_HOST", ""),
		SMTPPort:           envInt("SMTP_PORT", 1025),
		SMTPFrom:           env("SMTP_FROM", "noreply@banbunsi.local"),
	}
	cfg.SessionCookieSecure = !cfg.IsDev()
	if value := os.Getenv("SESSION_COOKIE_SECURE"); value != "" {
		secure, err := strconv.ParseBool(value)
		if err != nil {
			return nil, fmt.Errorf("SESSION_COOKIE_SECURE must be true or false: %w", err)
		}
		cfg.SessionCookieSecure = secure
	}
	if !cfg.IsDev() {
		if strings.TrimSpace(os.Getenv("OWNER_EMAIL")) == "" || len(os.Getenv("OWNER_PASSWORD")) < 12 {
			return nil, fmt.Errorf("production requires OWNER_EMAIL and an OWNER_PASSWORD of at least 12 characters")
		}
	}
	return cfg, nil
}

func (c *Config) IsDev() bool {
	return c.AppEnv == "development" || c.AppEnv == "dev" || c.AppEnv == "local"
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
