package handlers

import (
	"encoding/base64"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
)

func TestStoreDocumentUpload(t *testing.T) {
	tmpDir := t.TempDir()
	cfg := &config.Config{UploadDir: tmpDir}

	path, err := storeDocumentUpload(cfg, "sample.txt", "text/plain", "data:text/plain;base64,"+base64String("hello world"))
	if err != nil {
		t.Fatalf("storeDocumentUpload returned error: %v", err)
	}
	if path == "" || !strings.HasPrefix(path, "documents/") {
		t.Fatalf("unexpected stored path: %q", path)
	}
	full := filepath.Join(tmpDir, filepath.FromSlash(path))
	data, err := os.ReadFile(full)
	if err != nil {
		t.Fatalf("stored file missing: %v", err)
	}
	if string(data) != "hello world" {
		t.Fatalf("stored file contents mismatch: %q", string(data))
	}
}

func base64String(s string) string {
	return base64.StdEncoding.EncodeToString([]byte(s))
}
