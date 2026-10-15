package handlers

import (
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"testing"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
)

func writePNG(t *testing.T, path string, w, h int, alpha uint8) {
	t.Helper()
	img := image.NewNRGBA(image.Rect(0, 0, w, h))
	for i := 0; i < len(img.Pix); i += 4 {
		img.Pix[i], img.Pix[i+1], img.Pix[i+2], img.Pix[i+3] = 30, 90, 200, alpha
	}
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	if err := png.Encode(f, img); err != nil {
		t.Fatal(err)
	}
}

func decodeSize(t *testing.T, path string) (int, int, string) {
	t.Helper()
	f, err := os.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	cfg, format, err := image.DecodeConfig(f)
	if err != nil {
		t.Fatal(err)
	}
	return cfg.Width, cfg.Height, format
}

func TestImageVariantResizesCoverToJPEG(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "cover.png")
	writePNG(t, src, 1200, 1600, 0xff)
	path, contentType, err := imageVariantPath(src, 480, 1, false)
	if err != nil {
		t.Fatal(err)
	}
	w, h, format := decodeSize(t, path)
	if w != 480 || h != 640 || format != "jpeg" || contentType != "image/jpeg" {
		t.Fatalf("got %dx%d %s (%s), want 480x640 jpeg", w, h, format, contentType)
	}
	srcInfo, _ := os.Stat(src)
	outInfo, _ := os.Stat(path)
	if outInfo.Size() >= srcInfo.Size() {
		t.Fatalf("variant (%d bytes) should be smaller than the original (%d bytes)", outInfo.Size(), srcInfo.Size())
	}
	again, _, err := imageVariantPath(src, 480, 1, false)
	if err != nil || again != path {
		t.Fatalf("expected the cached variant to be reused, got %q (%v)", again, err)
	}
}

func TestImageVariantKeepsTransparencyAndNeverEnlarges(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "logo.png")
	writePNG(t, src, 200, 100, 0x80)
	path, contentType, err := imageVariantPath(src, 640, 1, true)
	if err != nil {
		t.Fatal(err)
	}
	w, h, format := decodeSize(t, path)
	if w != 200 || h != 100 || format != "png" || contentType != "image/png" {
		t.Fatalf("got %dx%d %s, want the original 200x100 kept as png", w, h, format)
	}
	_ = color.White
}

func TestImageVariantFlattensTransparentCoverToJPEG(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "cover.png")
	writePNG(t, src, 960, 960, 0x80)
	path, contentType, err := imageVariantPath(src, 480, 1, false)
	if err != nil {
		t.Fatal(err)
	}
	w, h, format := decodeSize(t, path)
	if w != 480 || h != 480 || format != "jpeg" || contentType != "image/jpeg" {
		t.Fatalf("got %dx%d %s, want a 480x480 jpeg for a cover", w, h, format)
	}
}

func TestRemoveStoredImageAlsoRemovesVariants(t *testing.T) {
	root := t.TempDir()
	covers := filepath.Join(root, "covers")
	if err := os.MkdirAll(covers, 0o755); err != nil {
		t.Fatal(err)
	}
	src := filepath.Join(covers, "abc.png")
	writePNG(t, src, 800, 800, 0xff)
	variant, _, err := imageVariantPath(src, 320, 1, false)
	if err != nil {
		t.Fatal(err)
	}
	removeStoredImage(&config.Config{UploadDir: root}, "covers/abc.png", "covers")
	if _, err := os.Stat(src); !os.IsNotExist(err) {
		t.Fatal("original should be removed")
	}
	if _, err := os.Stat(variant); !os.IsNotExist(err) {
		t.Fatal("resized variant should be removed with the original")
	}
}
