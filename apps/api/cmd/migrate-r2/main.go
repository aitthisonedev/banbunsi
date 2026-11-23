// migrate-r2 copies original uploads to a private R2 bucket. It never deletes local
// files or updates database rows; existing paths remain valid on both backends.
package main

import (
	"context"
	"crypto/sha256"
	"errors"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"mime"
	"os"
	"path/filepath"
	"strings"

	"github.com/banbunsi/banbunsi/apps/api/internal/storage"
)

func main() {
	apply := flag.Bool("apply", false, "copy missing files and verify every remote file; default is a dry run")
	root := flag.String("uploads", "/var/lib/banbunsi/uploads", "original uploads directory")
	flag.Parse()
	var store storage.Store
	if *apply {
		var err error
		store, err = storage.NewR2(os.Getenv("R2_ACCOUNT_ID"), os.Getenv("R2_BUCKET"), os.Getenv("R2_ACCESS_KEY_ID"), os.Getenv("R2_SECRET_ACCESS_KEY"))
		if err != nil {
			log.Fatal(err)
		}
	}
	count := 0
	var total int64
	err := filepath.WalkDir(*root, func(name string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			if strings.HasPrefix(entry.Name(), ".") && name != *root {
				return filepath.SkipDir
			}
			return nil
		}
		if !entry.Type().IsRegular() {
			return fmt.Errorf("refusing non-regular upload: %s", name)
		}
		key, err := filepath.Rel(*root, name)
		if err != nil {
			return err
		}
		key = filepath.ToSlash(key)
		if err := storage.ValidateKey(key); err != nil {
			return fmt.Errorf("unexpected upload path %s: %w", key, err)
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if *apply {
			if err := copyVerified(store, name, key, info.Size()); err != nil {
				return fmt.Errorf("%s: %w", key, err)
			}
		}
		count++
		total += info.Size()
		return nil
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Files: %d; bytes: %d; applied: %t; local files preserved\n", count, total, *apply)
}

func copyVerified(store storage.Store, local, key string, size int64) error {
	f, err := os.Open(local)
	if err != nil {
		return err
	}
	defer f.Close()
	hash := sha256.New()
	if _, err := io.Copy(hash, f); err != nil {
		return err
	}
	expected := fmt.Sprintf("%x", hash.Sum(nil))
	obj, err := store.Open(context.Background(), key)
	if errors.Is(err, os.ErrNotExist) {
		if _, err := f.Seek(0, io.SeekStart); err != nil {
			return err
		}
		contentType := mime.TypeByExtension(filepath.Ext(key))
		if contentType == "" {
			contentType = "application/octet-stream"
		}
		if err := store.Put(context.Background(), key, f, size, contentType); err != nil {
			return err
		}
		obj, err = store.Open(context.Background(), key)
	}
	if err != nil {
		return err
	}
	defer obj.Body.Close()
	hash.Reset()
	n, err := io.Copy(hash, obj.Body)
	if err != nil {
		return err
	}
	if n != size || fmt.Sprintf("%x", hash.Sum(nil)) != expected {
		return fmt.Errorf("remote content differs; existing object was not overwritten, local file preserved")
	}
	return nil
}
