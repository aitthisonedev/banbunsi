package handlers

import (
	"encoding/base64"
	"encoding/json"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/gofiber/fiber/v2"
)

func TestSafeRedirectURL(t *testing.T) {
	const local = "http://localhost:3000"
	const production = "https://banbunsi.com"
	tests := []struct {
		name, next, locale, origin, want string
	}{
		{"local account", "/lo/account", "lo", local, local + "/lo/account"},
		{"default account", "", "lo", local, local + "/lo/account"},
		{"query and fragment", "/en/account?tab=profile#name", "en", local, local + "/en/account?tab=profile#name"},
		{"absolute frontend URL", local + "/lo/account", "lo", local, local + "/lo/account"},
		{"production account", "/lo/account", "lo", production, production + "/lo/account"},
		{"production default", "", "en", production, production + "/en/account"},
		{"API origin rejected", "http://localhost:8080/lo/account", "lo", local, local + "/lo/account"},
		{"external origin rejected", "https://example.com/account", "lo", production, production + "/lo/account"},
		{"origin prefix rejected", production + ".example.com/account", "lo", production, production + "/lo/account"},
		{"network path rejected", "//example.com/account", "lo", local, local + "/lo/account"},
		{"backslash rejected", "/\\example.com/account", "lo", local, local + "/lo/account"},
		{"malformed URL rejected", "/%zz", "lo", local, local + "/lo/account"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := safeRedirectURL(tt.next, tt.locale, tt.origin); got != tt.want {
				t.Fatalf("got %q, want %q", got, tt.want)
			}
		})
	}
}

func TestGoogleFrontendRedirects(t *testing.T) {
	stateJSON, err := json.Marshal(OAuthState{Locale: "lo", Next: "/lo/account"})
	if err != nil {
		t.Fatal(err)
	}
	state := base64.RawURLEncoding.EncodeToString(stateJSON)
	tests := []struct {
		name, path, wantPath, wantError string
	}{
		{"cancelled callback", "/api/v1/auth/google/callback?error=access_denied&state=" + state, "/lo/account", "google_cancelled"},
		{"invalid callback", "/api/v1/auth/google/callback", "/lo/account", "invalid_state"},
		{"link without session", "/api/v1/auth/google?mode=link&locale=lo", "/lo/auth/login", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &AuthHandler{Cfg: &config.Config{AppPublicURL: "http://localhost:3000", SessionCookieName: "bb_session"}}
			app := fiber.New()
			app.Get("/api/v1/auth/google", h.GoogleAuth)
			app.Get("/api/v1/auth/google/callback", h.GoogleCallback)
			resp, err := app.Test(httptest.NewRequest("GET", "http://localhost:8080"+tt.path, nil))
			if err != nil {
				t.Fatal(err)
			}
			defer resp.Body.Close()
			location, err := url.Parse(resp.Header.Get("Location"))
			if err != nil {
				t.Fatal(err)
			}
			if resp.StatusCode != fiber.StatusFound || location.Scheme != "http" || location.Host != "localhost:3000" || location.Path != tt.wantPath || location.Query().Get("error") != tt.wantError {
				t.Fatalf("unexpected redirect: status=%d location=%s", resp.StatusCode, location)
			}
		})
	}
}
