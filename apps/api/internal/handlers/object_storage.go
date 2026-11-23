package handlers

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"mime"
	"os"
	"path/filepath"
	"strings"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/storage"
	"github.com/gofiber/fiber/v2"
)

// persistObject uploads a fully validated local staging file before its path is saved
// to the database. Small public images retain a local cache for resizing.
func persistObject(cfg *config.Config, key string, keepLocal bool) error {
	if cfg == nil || cfg.ObjectStore == nil {
		return nil
	}
	if err := storage.ValidateKey(key); err != nil {
		return err
	}
	local := filepath.Join(cfg.UploadDir, filepath.FromSlash(key))
	f, err := os.Open(local)
	if err != nil {
		return err
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		return err
	}
	contentType := mime.TypeByExtension(filepath.Ext(key))
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	if err := cfg.ObjectStore.Put(context.Background(), key, f, info.Size(), contentType); err != nil {
		return fmt.Errorf("could not store file in R2; please try again")
	}
	if !keepLocal {
		_ = os.Remove(local)
	}
	return nil
}

func openStoredObject(cfg *config.Config, key string) (*storage.Object, error) {
	if err := storage.ValidateKey(key); err != nil {
		return nil, err
	}
	if cfg.ObjectStore != nil {
		obj, err := cfg.ObjectStore.Open(context.Background(), key)
		if err == nil {
			return obj, nil
		}
		// Old uploads remain readable while migration is in progress. Do not mask
		// authentication errors or an R2 outage as a missing file.
		if !errors.Is(err, os.ErrNotExist) {
			return nil, err
		}
	}
	f, err := os.Open(filepath.Join(cfg.UploadDir, filepath.FromSlash(key)))
	if err != nil {
		return nil, err
	}
	info, err := f.Stat()
	if err != nil || info.IsDir() {
		f.Close()
		return nil, os.ErrNotExist
	}
	return &storage.Object{Body: f, Size: info.Size()}, nil
}

func removeStoredObject(cfg *config.Config, key string) {
	if cfg == nil || storage.ValidateKey(key) != nil {
		return
	}
	if cfg.ObjectStore != nil {
		if err := cfg.ObjectStore.Delete(context.Background(), key); err != nil {
			log.Printf("object deletion deferred for %s", key)
			return
		}
	}
	_ = os.Remove(filepath.Join(cfg.UploadDir, filepath.FromSlash(key)))
}

// CachePublicImage restores only public image folders, never protected documents.
// Atomic rename ensures concurrent image requests cannot see partial downloads.
func CachePublicImage(cfg *config.Config, directory string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if cfg.ObjectStore == nil {
			return c.Next()
		}
		if directory != "covers" && directory != "branding" && directory != "avatars" {
			return c.SendStatus(404)
		}
		name := c.Params("name")
		key := directory + "/" + name
		if strings.Contains(name, "/") || storage.ValidateKey(key) != nil {
			return c.SendStatus(404)
		}
		local := filepath.Join(cfg.UploadDir, directory, name)
		if info, err := os.Stat(local); err == nil && !info.IsDir() {
			return c.Next()
		}
		obj, err := cfg.ObjectStore.Open(c.UserContext(), key)
		if errors.Is(err, os.ErrNotExist) {
			return c.SendStatus(404)
		}
		if err != nil {
			return c.SendStatus(502)
		}
		defer obj.Body.Close()
		if obj.Size <= 0 || obj.Size > maxDocumentCoverBytes {
			return c.SendStatus(404)
		}
		if err := os.MkdirAll(filepath.Dir(local), 0o755); err != nil {
			return c.SendStatus(500)
		}
		tmp, err := os.CreateTemp(filepath.Dir(local), ".r2-*")
		if err != nil {
			return c.SendStatus(500)
		}
		defer os.Remove(tmp.Name())
		n, copyErr := io.Copy(tmp, io.LimitReader(obj.Body, maxDocumentCoverBytes+1))
		closeErr := tmp.Close()
		if copyErr != nil || closeErr != nil || n != obj.Size {
			return c.SendStatus(502)
		}
		if err := os.Rename(tmp.Name(), local); err != nil {
			return c.SendStatus(500)
		}
		return c.Next()
	}
}

type bufferedReadCloser struct {
	io.Reader
	io.Closer
}
