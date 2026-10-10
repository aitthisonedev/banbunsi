package sanitize

import (
	"regexp"
	"strings"
)

var (
	reScript  = regexp.MustCompile(`(?is)<script\b[\s\S]*?</script>`)
	reStyle   = regexp.MustCompile(`(?is)<style\b[\s\S]*?</style>`)
	reIframe  = regexp.MustCompile(`(?is)<iframe\b[\s\S]*?</iframe>`)
	reObject  = regexp.MustCompile(`(?is)<object\b[\s\S]*?</object>`)
	reEmbed   = regexp.MustCompile(`(?is)<embed\b[\s\S]*?</embed>`)
	reLink    = regexp.MustCompile(`(?is)<link\b[^>]*/?>`)
	reMeta    = regexp.MustCompile(`(?is)<meta\b[^>]*/?>`)
	reVoidRem = regexp.MustCompile(`(?i)<(script|style|iframe|object|embed)\b[^>]*/?>`)
	reOnAttr  = regexp.MustCompile(`(?i)\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)`)
	reJSHref  = regexp.MustCompile(`(?i)(href|src)\s*=\s*"\s*javascript:[^"]*"`)
	reJSHref2 = regexp.MustCompile(`(?i)(href|src)\s*=\s*'\s*javascript:[^']*'`)
)

// HTML strips script/style/iframe and event handlers from CMS HTML.
func HTML(in string) string {
	if strings.TrimSpace(in) == "" {
		return ""
	}
	out := reScript.ReplaceAllString(in, "")
	out = reStyle.ReplaceAllString(out, "")
	out = reIframe.ReplaceAllString(out, "")
	out = reObject.ReplaceAllString(out, "")
	out = reEmbed.ReplaceAllString(out, "")
	out = reLink.ReplaceAllString(out, "")
	out = reMeta.ReplaceAllString(out, "")
	out = reVoidRem.ReplaceAllString(out, "")
	out = reOnAttr.ReplaceAllString(out, "")
	out = reJSHref.ReplaceAllString(out, `$1="#"`)
	out = reJSHref2.ReplaceAllString(out, `$1="#"`)
	return out
}
