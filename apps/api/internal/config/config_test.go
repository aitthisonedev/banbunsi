package config

import "testing"

func TestProductionConfiguration(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("OWNER_EMAIL", "owner@example.com")
	t.Setenv("OWNER_PASSWORD", "a-long-test-password")
	t.Setenv("SESSION_COOKIE_SECURE", "")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if !cfg.SessionCookieSecure {
		t.Fatal("production cookies must default to Secure")
	}
	t.Setenv("SESSION_COOKIE_SECURE", "false")
	cfg, err = Load()
	if err != nil || cfg.SessionCookieSecure {
		t.Fatalf("explicit HTTP deployment override was not applied: %v", err)
	}
	t.Setenv("SESSION_COOKIE_SECURE", "invalid")
	if _, err = Load(); err == nil {
		t.Fatal("invalid cookie configuration must fail startup")
	}
}

func TestProductionRejectsDemoCredentials(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("SESSION_COOKIE_SECURE", "true")
	t.Setenv("OWNER_EMAIL", "owner@example.com")
	t.Setenv("OWNER_PASSWORD", "admin123")
	if _, err := Load(); err == nil {
		t.Fatal("production must reject the default demo password")
	}
	t.Setenv("OWNER_PASSWORD", "a-long-test-password")
	t.Setenv("OWNER_EMAIL", "")
	if _, err := Load(); err == nil {
		t.Fatal("production must require an explicit owner email")
	}
}
