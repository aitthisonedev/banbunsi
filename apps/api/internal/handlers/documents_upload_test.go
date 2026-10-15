package handlers

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/png"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/google/uuid"
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

func TestStoreDocumentUploadEnforcesConfiguredPolicy(t *testing.T) {
	cfg := &config.Config{UploadDir: t.TempDir()}
	payload := "data:text/plain;base64," + base64String("safe text")
	if _, err := storeDocumentUploadWithPolicy(cfg, "notes.txt", "text/plain", payload, 100, "pdf"); err == nil {
		t.Fatal("expected disallowed file type to be rejected")
	}
	if _, err := storeDocumentUploadWithPolicy(cfg, "notes.txt", "text/plain", payload, 4, "txt"); err == nil {
		t.Fatal("expected oversized file to be rejected")
	}
	path, err := storeDocumentUploadWithPolicy(cfg, "notes.txt", "text/plain", payload, 100, "txt")
	if err != nil || !strings.HasPrefix(path, "documents/") {
		t.Fatalf("expected allowed file to be stored, path=%q err=%v", path, err)
	}
}

func TestDocumentUploadPathRejectsTraversal(t *testing.T) {
	root := t.TempDir()
	if _, err := documentUploadPath(&config.Config{UploadDir: root}, "documents/example.pdf"); err != nil {
		t.Fatalf("expected valid document path, got %v", err)
	}
	for _, path := range []string{"../avatars/avatar.png", "documents/../../etc/passwd", "/etc/passwd"} {
		if _, err := documentUploadPath(&config.Config{UploadDir: root}, path); err == nil {
			t.Errorf("expected path %q to be rejected", path)
		}
	}
}

func TestFilePayloadDoesNotExposeStoragePath(t *testing.T) {
	file := models.DocumentFile{ID: uuid.New(), StoragePath: "documents/private.pdf"}
	payload := filePayload(file, "")
	if _, exists := payload["storage_path"]; exists {
		t.Fatal("file payload exposed the internal storage path")
	}
	if payload["file_url"] != "/api/v1/documents/files/"+file.ID.String() {
		t.Fatalf("unexpected protected download URL: %v", payload["file_url"])
	}
}

func TestStoreDocumentCoverValidatesAndStoresImage(t *testing.T) {
	tmpDir := t.TempDir()
	var encoded bytes.Buffer
	if err := png.Encode(&encoded, image.NewRGBA(image.Rect(0, 0, 4, 4))); err != nil {
		t.Fatal(err)
	}

	path, err := storeDocumentCover(&config.Config{UploadDir: tmpDir}, bytes.NewReader(encoded.Bytes()), int64(encoded.Len()))
	if err != nil {
		t.Fatalf("storeDocumentCover returned error: %v", err)
	}
	if !strings.HasPrefix(path, "covers/") || filepath.Ext(path) != ".png" {
		t.Fatalf("unexpected cover path: %q", path)
	}
	if _, err := os.Stat(filepath.Join(tmpDir, filepath.FromSlash(path))); err != nil {
		t.Fatalf("stored cover missing: %v", err)
	}
}

func TestStoreDocumentCoverRejectsInvalidAndOversizedImages(t *testing.T) {
	cfg := &config.Config{UploadDir: t.TempDir()}
	if _, err := storeDocumentCover(cfg, strings.NewReader("not an image"), int64(len("not an image"))); err == nil {
		t.Fatal("expected invalid image to be rejected")
	}
	if _, err := storeDocumentCover(cfg, strings.NewReader(""), maxDocumentCoverBytes+1); err == nil {
		t.Fatal("expected oversized image to be rejected")
	}
}

func base64String(s string) string {
	return base64.StdEncoding.EncodeToString([]byte(s))
}
