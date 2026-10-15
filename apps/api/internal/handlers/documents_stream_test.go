package handlers

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
)

func storedFiles(t *testing.T, dir string) []os.DirEntry {
	t.Helper()
	entries, err := os.ReadDir(filepath.Join(dir, "documents"))
	if err != nil && !os.IsNotExist(err) {
		t.Fatal(err)
	}
	return entries
}

func TestStoreDocumentStreamStoresLargeFile(t *testing.T) {
	dir := t.TempDir()
	cfg := &config.Config{UploadDir: dir}
	content := append([]byte("%PDF-1.7\n"), bytes.Repeat([]byte("x"), 20<<20)...)

	rel, size, detected, err := storeDocumentStream(cfg, "Annual report.pdf", bytes.NewReader(content), 25<<20, "pdf,docx")
	if err != nil {
		t.Fatalf("expected a 20 MB file within a 25 MB limit to be stored, got %v", err)
	}
	if size != int64(len(content)) {
		t.Fatalf("unexpected stored size %d", size)
	}
	if detected != "application/pdf" {
		t.Fatalf("unexpected detected type %q", detected)
	}
	info, err := os.Stat(filepath.Join(dir, filepath.FromSlash(rel)))
	if err != nil || info.Size() != int64(len(content)) {
		t.Fatalf("stored file missing or wrong size: %v", err)
	}
	if !strings.HasPrefix(rel, "documents/") || !strings.HasSuffix(rel, "_Annual report.pdf") {
		t.Fatalf("unexpected stored path %q", rel)
	}
}

func TestStoreDocumentStreamRejectsOversizedWithoutLeftovers(t *testing.T) {
	dir := t.TempDir()
	cfg := &config.Config{UploadDir: dir}
	_, _, _, err := storeDocumentStream(cfg, "big.pdf", bytes.NewReader(bytes.Repeat([]byte("x"), (10<<20)+1)), 10<<20, "pdf")
	if err == nil || !strings.Contains(err.Error(), "10 MB") {
		t.Fatalf("expected a size error mentioning the limit, got %v", err)
	}
	if left := storedFiles(t, dir); len(left) != 0 {
		t.Fatalf("expected no partial file to remain, found %d", len(left))
	}
}

func TestStoreDocumentStreamRejectsBadInput(t *testing.T) {
	dir := t.TempDir()
	cfg := &config.Config{UploadDir: dir}
	cases := map[string]struct {
		name    string
		content string
	}{
		"disallowed extension": {"script.html", "<script>"},
		"no extension":         {"README", "text"},
		"empty file":           {"empty.pdf", ""},
		"path traversal name":  {"../", "x"},
	}
	for label, tc := range cases {
		if _, _, _, err := storeDocumentStream(cfg, tc.name, strings.NewReader(tc.content), 1<<20, "pdf,docx"); err == nil {
			t.Errorf("%s: expected rejection", label)
		}
	}
	if left := storedFiles(t, dir); len(left) != 0 {
		t.Fatalf("expected no files to remain, found %d", len(left))
	}
}
