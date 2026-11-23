package storage

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func TestR2SignedPrivateRoundTrip(t *testing.T) {
	files := map[string]string{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.Header.Get("Authorization"), "AWS4-HMAC-SHA256 ") {
			t.Error("unsigned object request")
		}
		if !strings.HasPrefix(r.URL.Path, "/banbunsi/documents/") {
			t.Error("wrong bucket or key")
		}
		switch r.Method {
		case "PUT":
			body, _ := io.ReadAll(r.Body)
			files[r.URL.Path] = string(body)
		case "GET":
			if value, ok := files[r.URL.Path]; ok {
				io.WriteString(w, value)
			} else {
				w.Header().Set("Content-Type", "application/xml")
				w.WriteHeader(404)
				io.WriteString(w, "<Error><Code>NoSuchKey</Code></Error>")
			}
		case "DELETE":
			delete(files, r.URL.Path)
			w.WriteHeader(204)
		default:
			t.Errorf("unexpected method %s", r.Method)
		}
	}))
	defer srv.Close()
	store := &R2{bucket: "banbunsi", client: s3.NewFromConfig(aws.Config{
		Region: "auto", Credentials: credentials.NewStaticCredentialsProvider("test", "test", ""),
		RequestChecksumCalculation: aws.RequestChecksumCalculationWhenRequired,
		ResponseChecksumValidation: aws.ResponseChecksumValidationWhenRequired,
	}, func(o *s3.Options) { o.BaseEndpoint = aws.String(srv.URL); o.UsePathStyle = true })}
	ctx := context.Background()
	key := "documents/ບັນຊີ notes.txt"
	if err := store.Put(ctx, key, strings.NewReader("hello"), 5, "text/plain"); err != nil {
		t.Fatal(err)
	}
	obj, err := store.Open(ctx, key)
	if err != nil {
		t.Fatal(err)
	}
	b, _ := io.ReadAll(obj.Body)
	obj.Body.Close()
	if string(b) != "hello" || obj.Size != 5 {
		t.Fatalf("wrong object: %q size %d", b, obj.Size)
	}
	if err := store.Delete(ctx, key); err != nil {
		t.Fatal(err)
	}
	if _, err := store.Open(ctx, key); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("missing file error: %v", err)
	}
}

func TestStorageKeyBoundaries(t *testing.T) {
	for _, key := range []string{"", "../secret", "documents/../secret", "/documents/a.pdf", "documents/a/b", "avatars/.secret", "documents/", "other/a", "documents/a\\b"} {
		if err := ValidateKey(key); err == nil {
			t.Errorf("accepted %q", key)
		}
	}
	for _, key := range []string{"documents/a.pdf", "covers/a.png", "branding/a.png", "avatars/a.jpg"} {
		if err := ValidateKey(key); err != nil {
			t.Errorf("rejected %q: %v", key, err)
		}
	}
}
