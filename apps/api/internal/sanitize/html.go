package sanitize

import (
	"regexp"
	"strings"
)

var (
	reBlockTags = regexp.MustCompile(`(?is)<(script|style|iframe|object|embed|link|meta)[\s\S]*?</\1>`)
	reVoidTags  = regexp.MustCompile(`(?i)<(script|style|iframe|object|embed|link|meta)\b[^>]*/?>`)
	reOnAttr    = regexp.MustCompile(`(?i)\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)`)
	reJSURL     = regexp.MustCompile(`(?i)(href|src)\s*=\s*("|')\s*javascript:[^"']*\2`)
)

// HTML strips script/style/iframe and event handlers from CMS HTML.
func HTML(in string) string {
	if strings.TrimSpace(in) == "" {
		return ""
	}
	out := reBlockTags.ReplaceAllString(in, "")
	out = reVoidTags.ReplaceAllString(out, "")
	out = reOnAttr.ReplaceAllString(out, "")
	out = reJSURL.ReplaceAllString(out, `$1="#"`)
	return out
}
