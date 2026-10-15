package sanitize

import (
	"strings"

	"github.com/microcosm-cc/bluemonday"
)

var documentPolicy = func() *bluemonday.Policy {
	policy := bluemonday.UGCPolicy()
	policy.AllowElements(
		"div", "span", "h1", "h2", "h3", "h4", "table", "thead", "tbody",
		"tr", "th", "td", "hr", "u", "s", "del", "ins",
	)
	policy.AllowAttrs("colspan", "rowspan").OnElements("td", "th")
	policy.AllowAttrs("scope").OnElements("th")
	policy.AllowURLSchemes("http", "https", "mailto")
	policy.RequireNoFollowOnLinks(true)
	return policy
}()

func HTML(in string) string {
	if strings.TrimSpace(in) == "" {
		return ""
	}
	return documentPolicy.Sanitize(in)
}
