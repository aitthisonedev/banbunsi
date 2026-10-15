package handlers

import (
	"encoding/json"
	"testing"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/google/uuid"
)

func TestParseQuizResultRoundTrip(t *testing.T) {
	want := quizResultMeta{Correct: 4, Total: 5, Percent: 80, Passed: true}
	raw, err := json.Marshal(want)
	if err != nil {
		t.Fatal(err)
	}
	if got := parseQuizResult(string(raw)); got != want {
		t.Fatalf("got %+v, want %+v", got, want)
	}
}

func TestParseQuizResultBadMetadataGivesZeros(t *testing.T) {
	for _, raw := range []string{"", "{}", "not json"} {
		if got := parseQuizResult(raw); got != (quizResultMeta{}) {
			t.Fatalf("metadata %q: expected zero result, got %+v", raw, got)
		}
	}
}

func TestParseIDsSkipsInvalidTargets(t *testing.T) {
	valid := uuid.New()
	logs := []models.AuditLog{{TargetID: valid.String()}, {TargetID: ""}, {TargetID: "not-a-uuid"}}
	ids := parseIDs(logs)
	if len(ids) != 1 || ids[0] != valid {
		t.Fatalf("expected only %s, got %v", valid, ids)
	}
}
