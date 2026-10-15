package handlers

import (
	"strings"
	"testing"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
)

func TestNormalizeAllowedFileTypes(t *testing.T) {
	got, err := normalizeAllowedFileTypes(" .WEBP, pdf,webp ")
	if err != nil {
		t.Fatalf("expected supported file extensions to normalize, got %v", err)
	}
	if got != "pdf,webp" {
		t.Fatalf("unexpected normalized extensions: %q", got)
	}
	if _, err := normalizeAllowedFileTypes("html"); err == nil {
		t.Fatal("expected unsupported extension to be rejected")
	}
	if _, err := normalizeAllowedFileTypes(" , "); err == nil {
		t.Fatal("expected empty extension list to be rejected")
	}
}

func TestSettingsLengthError(t *testing.T) {
	ok := &models.SiteSettings{SiteNameLo: strings.Repeat("ບ", 200), ContactPhone: "+856 20 1234 5678"}
	if message := settingsLengthError(ok); message != "" {
		t.Fatalf("expected values within limits to pass (Lao counted by character), got %q", message)
	}
	tooLong := &models.SiteSettings{ContactPhone: strings.Repeat("1", 33)}
	if message := settingsLengthError(tooLong); message != "Phone must be 32 characters or fewer" {
		t.Fatalf("unexpected message for long phone: %q", message)
	}
}
