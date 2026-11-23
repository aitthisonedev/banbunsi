package main

import (
	"bytes"
	"context"
	"io"
	"os"
	"path/filepath"
	"testing"

	"github.com/banbunsi/banbunsi/apps/api/internal/storage"
)

type migrationStore struct {
	data []byte
	puts int
}

func (m *migrationStore) Open(context.Context, string) (*storage.Object, error) {
	if m.data == nil {
		return nil, os.ErrNotExist
	}
	return &storage.Object{Body: io.NopCloser(bytes.NewReader(m.data)), Size: int64(len(m.data))}, nil
}
func (m *migrationStore) Put(_ context.Context, _ string, src io.ReadSeeker, _ int64, _ string) error {
	m.puts++
	var err error
	m.data, err = io.ReadAll(src)
	return err
}
func (m *migrationStore) Delete(context.Context, string) error { panic("migration must never delete") }

func TestMigrationCopiesVerifiesAndPreservesOriginals(t *testing.T) {
	local := filepath.Join(t.TempDir(), "source.txt")
	if err := os.WriteFile(local, []byte("original"), 0o600); err != nil {
		t.Fatal(err)
	}
	store := &migrationStore{}
	for i := 0; i < 2; i++ {
		if err := copyVerified(store, local, "documents/source.txt", 8); err != nil {
			t.Fatal(err)
		}
	}
	if store.puts != 1 {
		t.Fatal("migration unnecessarily rewrote the object")
	}
	store.data = []byte("conflict")
	if err := copyVerified(store, local, "documents/source.txt", 8); err == nil {
		t.Fatal("conflicting object was accepted")
	}
	if store.puts != 1 || string(store.data) != "conflict" {
		t.Fatal("existing object was overwritten")
	}
	data, err := os.ReadFile(local)
	if err != nil || string(data) != "original" {
		t.Fatal("original file was changed")
	}
}
