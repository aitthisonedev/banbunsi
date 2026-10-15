package handlers

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"strings"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/gofiber/fiber/v2"
	xdraw "golang.org/x/image/draw"
)

// Widths the website asks for (thumbnails, cards, detail pages). Anything else gets the original,
// so the cache cannot be filled with arbitrary sizes.
var imageVariantWidths = map[int]bool{160: true, 320: true, 480: true, 640: true, 960: true, 1280: true}

// imageVariantFormat is part of cached file names; bump it when the resizing output changes.
const imageVariantFormat = 3

// ImageVariant serves a resized copy of an uploaded cover or branding image when "?w=" is one of
// imageVariantWidths, e.g. /uploads/covers/<id>.png?w=480. Variants are generated once into a
// ".variants" folder next to the originals; without "?w=" the request falls through to the
// static file server. Upload names are unique, so variants can be cached by browsers for a year.
func ImageVariant(cfg *config.Config, directory string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		width := c.QueryInt("w")
		if width == 0 {
			return c.Next()
		}
		if !imageVariantWidths[width] {
			return c.Next()
		}
		name := filepath.Base(c.Params("name"))
		if name == "." || name == "/" || strings.HasPrefix(name, ".") {
			return c.Next()
		}
		source := filepath.Join(cfg.UploadDir, directory, name)
		info, err := os.Stat(source)
		if err != nil || info.IsDir() {
			return c.Next()
		}
		// Covers always sit on a solid card, so they are flattened to compact JPEG; branding images
		// (logos, favicon) keep their transparency.
		variant, contentType, err := imageVariantPath(source, width, info.ModTime().Unix(), directory != "covers")
		if err != nil {
			// Unreadable or unsupported image: serve the original instead of failing.
			return c.Next()
		}
		c.Set(fiber.HeaderCacheControl, "public, max-age=31536000, immutable")
		c.Set(fiber.HeaderContentType, contentType)
		c.Set("X-Content-Type-Options", "nosniff")
		return c.SendFile(variant)
	}
}

// imageVariantPath returns the cached variant for source at width, creating it if needed.
func imageVariantPath(source string, width int, version int64, keepTransparency bool) (string, string, error) {
	dir := filepath.Join(filepath.Dir(source), ".variants")
	base := strings.TrimSuffix(filepath.Base(source), filepath.Ext(source))
	for _, ext := range []string{".jpg", ".png"} {
		candidate := filepath.Join(dir, fmt.Sprintf("%s-%d-%d-v%d%s", base, width, version, imageVariantFormat, ext))
		if _, err := os.Stat(candidate); err == nil {
			return candidate, variantContentType(ext), nil
		}
	}
	data, err := os.ReadFile(source)
	if err != nil {
		return "", "", err
	}
	config, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil || config.Width < 1 || config.Height < 1 || config.Width > maxDocumentCoverSide || config.Height > maxDocumentCoverSide {
		return "", "", fmt.Errorf("unsupported image")
	}
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return "", "", err
	}
	bounds := img.Bounds()
	target := width
	if bounds.Dx() < target {
		target = bounds.Dx() // never enlarge
	}
	height := bounds.Dy() * target / bounds.Dx()
	if height < 1 {
		height = 1
	}
	resized := image.NewRGBA(image.Rect(0, 0, target, height))
	xdraw.CatmullRom.Scale(resized, resized.Bounds(), img, bounds, xdraw.Src, nil)

	// Decide on the source: resampling can soften alpha at the edges of an opaque image.
	ext := ".jpg"
	if keepTransparency && hasTransparency(img) {
		ext = ".png" // keep transparent logos transparent
	}
	var out bytes.Buffer
	if ext == ".png" {
		err = (&png.Encoder{CompressionLevel: png.BestCompression}).Encode(&out, resized)
	} else {
		flat := image.NewRGBA(resized.Bounds())
		xdraw.Draw(flat, flat.Bounds(), &image.Uniform{C: color.White}, image.Point{}, xdraw.Src)
		xdraw.Draw(flat, flat.Bounds(), resized, image.Point{}, xdraw.Over)
		err = jpeg.Encode(&out, flat, &jpeg.Options{Quality: 82})
	}
	if err != nil {
		return "", "", err
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", "", err
	}
	final := filepath.Join(dir, fmt.Sprintf("%s-%d-%d-v%d%s", base, width, version, imageVariantFormat, ext))
	tmp, err := os.CreateTemp(dir, ".tmp-*")
	if err != nil {
		return "", "", err
	}
	if _, err := tmp.Write(out.Bytes()); err != nil {
		tmp.Close()
		os.Remove(tmp.Name())
		return "", "", err
	}
	tmp.Close()
	_ = os.Chmod(tmp.Name(), 0o644)
	// Rename is atomic, so concurrent requests never see a half-written file.
	if err := os.Rename(tmp.Name(), final); err != nil {
		os.Remove(tmp.Name())
		return "", "", err
	}
	return final, variantContentType(ext), nil
}

// hasTransparency reports whether any pixel of the source image is not fully opaque.
func hasTransparency(img image.Image) bool {
	if opaque, ok := img.(interface{ Opaque() bool }); ok {
		return !opaque.Opaque()
	}
	bounds := img.Bounds()
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			if _, _, _, a := img.At(x, y).RGBA(); a != 0xffff {
				return true
			}
		}
	}
	return false
}

func variantContentType(ext string) string {
	if ext == ".png" {
		return "image/png"
	}
	return "image/jpeg"
}
