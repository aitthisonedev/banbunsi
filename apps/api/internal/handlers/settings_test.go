package handlers

import "testing"

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
