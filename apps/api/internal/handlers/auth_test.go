package handlers

import "testing"

func TestRegisterNames(t *testing.T) {
	cases := []struct {
		body        registerBody
		first, last string
	}{
		{registerBody{FirstName: " Somsak ", LastName: " Xayavong "}, "Somsak", "Xayavong"},
		{registerBody{FirstName: "ສົມສັກ", LastName: "ໄຊຍະວົງ", Name: "ignored"}, "ສົມສັກ", "ໄຊຍະວົງ"},
		{registerBody{FirstName: "Somsak"}, "Somsak", ""},
		{registerBody{Name: " John Doe "}, "John Doe", ""}, // older clients send one name field
		{registerBody{LastName: "Xayavong"}, "", "Xayavong"},
		{registerBody{}, "", ""},
	}
	for _, tc := range cases {
		first, last := registerNames(tc.body)
		if first != tc.first || last != tc.last {
			t.Errorf("registerNames(%+v) = %q, %q; want %q, %q", tc.body, first, last, tc.first, tc.last)
		}
	}
}
