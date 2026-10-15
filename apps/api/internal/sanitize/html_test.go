package sanitize

import (
	"strings"
	"testing"
)

func TestHTMLRemovesActiveMarkup(t *testing.T) {
	input := `<p onclick="run()">Text</p><a href=javascript:alert(1) onmouseover="run()">bad</a><svg onload="run()"><script>run()</script></svg>`
	output := strings.ToLower(HTML(input))
	for _, unsafe := range []string{"onclick", "onmouseover", "javascript:", "<script", "<svg", "onload", "alert(1)"} {
		if strings.Contains(output, unsafe) {
			t.Errorf("sanitized HTML retained %q: %s", unsafe, output)
		}
	}
	if !strings.Contains(output, "<p>text</p>") {
		t.Fatalf("expected safe paragraph to remain, got %s", output)
	}
}

func TestHTMLKeepsSafeFormattingAndLinks(t *testing.T) {
	output := HTML(`<h2>Heading</h2><p><strong>Text</strong> <a href="https://example.com">link</a></p>`)
	if !strings.Contains(output, "<h2>Heading</h2>") || !strings.Contains(output, "<strong>Text</strong>") || !strings.Contains(output, `href="https://example.com"`) {
		t.Fatalf("expected safe document formatting to remain, got %s", output)
	}
}
