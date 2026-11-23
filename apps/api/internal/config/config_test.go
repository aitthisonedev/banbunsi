package config

import "testing"

func TestR2ConfigurationFailsClosed(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("R2_ENABLED", "true")
	t.Setenv("R2_ACCOUNT_ID", "44c8a5e1988d62b0ca0c55095924c385")
	t.Setenv("R2_BUCKET", "banbunsi")
	t.Setenv("R2_ACCESS_KEY_ID", "test-key")
	t.Setenv("R2_SECRET_ACCESS_KEY", "")
	if _, err := Load(); err == nil {
		t.Fatal("incomplete R2 credentials were accepted")
	}
	t.Setenv("R2_SECRET_ACCESS_KEY", "test-secret")
	if cfg, err := Load(); err != nil || cfg.ObjectStore == nil {
		t.Fatalf("R2 not configured: %v", err)
	}
	t.Setenv("R2_ENABLED", "false")
	if cfg, err := Load(); err != nil || cfg.ObjectStore != nil {
		t.Fatalf("local storage changed: %v", err)
	}
	t.Setenv("R2_ENABLED", "invalid")
	if _, err := Load(); err == nil {
		t.Fatal("invalid R2_ENABLED was accepted")
	}
}

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
