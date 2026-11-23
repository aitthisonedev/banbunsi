package handlers

import (
	"bytes"
	"context"
	"errors"
	"image"
	"image/png"
	"io"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/storage"
	"github.com/gofiber/fiber/v2"
)

type memoryStore struct {
	files   map[string][]byte
	failure error
	reads   int
}

func (m *memoryStore) Put(_ context.Context, key string, body io.ReadSeeker, _ int64, _ string) error {
	if m.failure != nil {
		return m.failure
	}
	b, err := io.ReadAll(body)
	if err == nil {
		m.files[key] = b
	}
	return err
}
func (m *memoryStore) Open(_ context.Context, key string) (*storage.Object, error) {
	m.reads++
	if m.failure != nil {
		return nil, m.failure
	}
	b, ok := m.files[key]
	if !ok {
		return nil, os.ErrNotExist
	}
	return &storage.Object{Body: io.NopCloser(bytes.NewReader(b)), Size: int64(len(b))}, nil
}
func (m *memoryStore) Delete(_ context.Context, key string) error {
	if m.failure != nil {
		return m.failure
	}
	delete(m.files, key)
	return nil
}

func TestR2DocumentUploadAndLegacyFallback(t *testing.T) {
	store := &memoryStore{files: map[string][]byte{}}
	cfg := &config.Config{UploadDir: t.TempDir(), ObjectStore: store}
	key, size, _, err := storeDocumentStream(cfg, "notes.txt", strings.NewReader("important document"), 100, "txt")
	if err != nil || size != 18 {
		t.Fatalf("upload: size=%d err=%v", size, err)
	}
	if _, err := os.Stat(filepath.Join(cfg.UploadDir, key)); !errors.Is(err, os.ErrNotExist) {
		t.Fatal("document staging file retained after successful R2 upload")
	}
	obj, err := openStoredObject(cfg, key)
	if err != nil {
		t.Fatal(err)
	}
	body, err := io.ReadAll(obj.Body)
	obj.Body.Close()
	if err != nil || string(body) != "important document" {
		t.Fatal("R2 contents differ")
	}
	legacy := "documents/legacy.txt"
	if err := os.WriteFile(filepath.Join(cfg.UploadDir, legacy), []byte("legacy"), 0o600); err != nil {
		t.Fatal(err)
	}
	obj, err = openStoredObject(cfg, legacy)
	if err != nil {
		t.Fatal(err)
	}
	body, _ = io.ReadAll(obj.Body)
	obj.Body.Close()
	if string(body) != "legacy" {
		t.Fatal("legacy fallback lost data")
	}
	store.failure = errors.New("access denied")
	if _, err := openStoredObject(cfg, legacy); err == nil {
		t.Fatal("storage failure was hidden by local fallback")
	}
	if _, _, _, err := storeDocumentStream(cfg, "failed.txt", strings.NewReader("hello"), 100, "txt"); err == nil {
		t.Fatal("failed R2 upload was reported successful")
	}
	store.failure = nil
	removeStoredObject(cfg, key)
	if _, ok := store.files[key]; ok {
		t.Fatal("deleted file remains in R2")
	}
}

func TestR2PublicImagesRestoreWithoutExposingDocuments(t *testing.T) {
	store := &memoryStore{files: map[string][]byte{"documents/private.txt": []byte("private")}}
	cfg := &config.Config{UploadDir: t.TempDir(), ObjectStore: store}
	var encoded bytes.Buffer
	if err := png.Encode(&encoded, image.NewRGBA(image.Rect(0, 0, 4, 4))); err != nil {
		t.Fatal(err)
	}
	key, err := storeDocumentCover(cfg, bytes.NewReader(encoded.Bytes()), int64(encoded.Len()))
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(store.files[key], encoded.Bytes()) {
		t.Fatal("image not saved in R2")
	}
	if err := os.Remove(filepath.Join(cfg.UploadDir, key)); err != nil {
		t.Fatal(err)
	}
	app := fiber.New()
	app.Get("/uploads/covers/:name", CachePublicImage(cfg, "covers"))
	app.Static("/uploads/covers", filepath.Join(cfg.UploadDir, "covers"))
	app.Get("/uploads/documents/:name", CachePublicImage(cfg, "documents"))
	response, err := app.Test(httptest.NewRequest("GET", "/uploads/"+key, nil))
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(response.Body)
	response.Body.Close()
	if response.StatusCode != 200 || !bytes.Equal(body, encoded.Bytes()) {
		t.Fatal("remote image was not restored")
	}
	reads := store.reads
	response, err = app.Test(httptest.NewRequest("GET", "/uploads/documents/private.txt", nil))
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if response.StatusCode != 404 || store.reads != reads {
		t.Fatal("public route accessed protected document storage")
	}
}

func TestR2LegacyBase64Upload(t *testing.T) {
	store := &memoryStore{files: map[string][]byte{}}
	cfg := &config.Config{UploadDir: t.TempDir(), ObjectStore: store}
	key, err := storeDocumentUpload(cfg, "notes.txt", "text/plain", "data:text/plain;base64,"+base64String("hello"))
	if err != nil || string(store.files[key]) != "hello" {
		t.Fatalf("base64 upload: %v", err)
	}
}
