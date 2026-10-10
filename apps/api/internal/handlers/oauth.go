package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/banbunsi/banbunsi/apps/api/internal/models"
	"github.com/banbunsi/banbunsi/apps/api/internal/seed"
	"github.com/gofiber/fiber/v2"
)

type OAuthState struct {
	Mode      string `json:"mode"`    // "login", "register", "link"
	Next      string `json:"next"`    // redirect URL
	Locale    string `json:"locale"`  // "lo" or "en"
	UserID    string `json:"user_id"` // if link mode
	Nonce     string `json:"nonce"`
	CreatedAt int64  `json:"created_at"`
}

type GoogleTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token,omitempty"`
	IDToken      string `json:"id_token,omitempty"`
}

type GoogleUserInfo struct {
	Sub           string `json:"sub"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
}

type devGoogleBody struct {
	State   string `json:"state"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Sub     string `json:"sub"`
	Picture string `json:"picture"`
}

func (h *AuthHandler) GoogleAuth(c *fiber.Ctx) error {
	mode := strings.ToLower(strings.TrimSpace(c.Query("mode", "login")))
	if mode != "register" && mode != "link" {
		mode = "login"
	}
	locale := localeOrDefault(c.Query("locale", "lo"))
	next := c.Query("next")
	if next == "" {
		next = fmt.Sprintf("/%s/account", locale)
	}

	userID := ""
	if mode == "link" {
		// Check session
		raw := c.Cookies(h.Cfg.SessionCookieName)
		if raw == "" {
			return c.Redirect(fmt.Sprintf("/%s/auth/login?next=%s", locale, url.QueryEscape(next)))
		}
		u, session, err := h.Sessions.Resolve(raw)
		if err != nil || session == nil || u == nil {
			return c.Redirect(fmt.Sprintf("/%s/auth/login?next=%s", locale, url.QueryEscape(next)))
		}
		userID = u.ID.String()
	}

	nonceBytes := make([]byte, 16)
	_, _ = rand.Read(nonceBytes)
	nonce := base64.RawURLEncoding.EncodeToString(nonceBytes)

	stateObj := OAuthState{
		Mode:      mode,
		Next:      next,
		Locale:    locale,
		UserID:    userID,
		Nonce:     nonce,
		CreatedAt: time.Now().Unix(),
	}
	stateJSON, err := json.Marshal(stateObj)
	if err != nil {
		return errJSON(c, fiber.StatusInternalServerError, "Could not initialize oauth")
	}
	stateEncoded := base64.RawURLEncoding.EncodeToString(stateJSON)

	c.Cookie(&fiber.Cookie{
		Name:     "bb_oauth_state",
		Value:    stateEncoded,
		Path:     "/",
		HTTPOnly: true,
		Secure:   h.Cfg.SessionCookieSecure,
		SameSite: "Lax",
		MaxAge:   600,
	})

	// If Google Client ID and Secret are configured, use real Google OAuth
	if h.Cfg.GoogleClientID != "" && h.Cfg.GoogleClientSecret != "" {
		authURL := fmt.Sprintf(
			"https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s&prompt=select_account",
			url.QueryEscape(h.Cfg.GoogleClientID),
			url.QueryEscape(h.Cfg.GoogleRedirectURI),
			url.QueryEscape("openid email profile"),
			url.QueryEscape(stateEncoded),
		)
		return c.Redirect(authURL)
	}

	// Dev simulation mode
	devURL := fmt.Sprintf(
		"%s/%s/auth/google-dev?mode=%s&next=%s&state=%s",
		h.Cfg.AppPublicURL,
		locale,
		mode,
		url.QueryEscape(next),
		url.QueryEscape(stateEncoded),
	)
	return c.Redirect(devURL)
}

func (h *AuthHandler) GoogleCallback(c *fiber.Ctx) error {
	stateCookie := c.Cookies("bb_oauth_state")
	stateParam := c.Query("state")

	var state OAuthState
	rawState := stateParam
	if rawState == "" {
		rawState = stateCookie
	}
	if rawState != "" {
		if decoded, err := base64.RawURLEncoding.DecodeString(rawState); err == nil {
			_ = json.Unmarshal(decoded, &state)
		}
	}

	locale := localeOrDefault(state.Locale)
	nextURL := safeRedirectURL(state.Next, locale, h.Cfg.AppPublicURL)

	if errParam := c.Query("error"); errParam != "" {
		c.ClearCookie("bb_oauth_state")
		return c.Redirect(withParam(nextURL, "error", "google_cancelled"))
	}

	code := c.Query("code")
	if code == "" || stateCookie == "" || stateCookie != stateParam {
		c.ClearCookie("bb_oauth_state")
		return c.Redirect(withParam(nextURL, "error", "invalid_state"))
	}

	// Exchange authorization code for token
	tokenURL := "https://oauth2.googleapis.com/token"
	form := url.Values{
		"code":          {code},
		"client_id":     {h.Cfg.GoogleClientID},
		"client_secret": {h.Cfg.GoogleClientSecret},
		"redirect_uri":  {h.Cfg.GoogleRedirectURI},
		"grant_type":    {"authorization_code"},
	}

	resp, err := http.PostForm(tokenURL, form)
	if err != nil {
		return c.Redirect(withParam(nextURL, "error", "token_exchange_failed"))
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return c.Redirect(withParam(nextURL, "error", "token_exchange_rejected"))
	}

	var tokResp GoogleTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokResp); err != nil || tokResp.AccessToken == "" {
		return c.Redirect(withParam(nextURL, "error", "invalid_token_response"))
	}

	// Fetch user info with access token
	userInfoReq, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	if err != nil {
		return c.Redirect(withParam(nextURL, "error", "userinfo_request_failed"))
	}
	userInfoReq.Header.Set("Authorization", "Bearer "+tokResp.AccessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	userResp, err := client.Do(userInfoReq)
	if err != nil {
		return c.Redirect(withParam(nextURL, "error", "userinfo_failed"))
	}
	defer userResp.Body.Close()

	if userResp.StatusCode < 200 || userResp.StatusCode >= 300 {
		return c.Redirect(withParam(nextURL, "error", "userinfo_rejected"))
	}

	var gUser GoogleUserInfo
	bodyBytes, err := io.ReadAll(userResp.Body)
	if err != nil || json.Unmarshal(bodyBytes, &gUser) != nil {
		return c.Redirect(withParam(nextURL, "error", "invalid_userinfo_json"))
	}

	return h.processGoogleUser(c, &state, &gUser)
}

func (h *AuthHandler) GoogleDevCallback(c *fiber.Ctx) error {
	if !h.Cfg.IsDev() {
		return errJSON(c, fiber.StatusForbidden, "Dev mode only")
	}

	var body devGoogleBody
	if err := c.BodyParser(&body); err != nil {
		return errJSON(c, fiber.StatusBadRequest, "Invalid request body")
	}

	stateCookie := c.Cookies("bb_oauth_state")
	var state OAuthState
	rawState := body.State
	if rawState == "" {
		rawState = stateCookie
	}
	if rawState != "" {
		if decoded, err := base64.RawURLEncoding.DecodeString(rawState); err == nil {
			_ = json.Unmarshal(decoded, &state)
		}
	}

	gUser := GoogleUserInfo{
		Sub:           body.Sub,
		Email:         body.Email,
		Name:          body.Name,
		GivenName:     body.Name,
		Picture:       body.Picture,
		EmailVerified: true,
	}
	if gUser.Sub == "" {
		gUser.Sub = "google-mock-" + base64.RawURLEncoding.EncodeToString([]byte(body.Email))
	}

	return h.processGoogleUser(c, &state, &gUser)
}

func (h *AuthHandler) processGoogleUser(c *fiber.Ctx, state *OAuthState, gUser *GoogleUserInfo) error {
	locale := localeOrDefault(state.Locale)
	nextURL := safeRedirectURL(state.Next, locale, h.Cfg.AppPublicURL)

	c.ClearCookie("bb_oauth_state")

	email := normalizeEmail(gUser.Email)
	sub := strings.TrimSpace(gUser.Sub)
	if sub == "" || email == "" {
		return c.Redirect(withParam(nextURL, "error", "missing_google_profile"))
	}

	if state.Mode == "link" {
		var currentUser *models.User
		if state.UserID != "" {
			uid, err := parseUUID(state.UserID)
			if err == nil {
				var u models.User
				if err := h.DB.First(&u, "id = ?", uid).Error; err == nil {
					currentUser = &u
				}
			}
		}
		if currentUser == nil {
			if raw := c.Cookies(h.Cfg.SessionCookieName); raw != "" {
				if u, session, err := h.Sessions.Resolve(raw); err == nil && session != nil {
					currentUser = u
				}
			}
		}
		if currentUser == nil {
			return c.Redirect(fmt.Sprintf("/%s/auth/login?error=unauthorized&next=%s", locale, url.QueryEscape(nextURL)))
		}

		// Check if another account already has this Google ID
		var conflict models.User
		if err := h.DB.Where("google_id = ? AND id != ?", sub, currentUser.ID).First(&conflict).Error; err == nil {
			return c.Redirect(withParam(nextURL, "error", "google_already_linked"))
		}

		currentUser.GoogleID = sub
		currentUser.GoogleEmail = email
		if currentUser.AvatarPath == "" && gUser.Picture != "" {
			currentUser.AvatarPath = gUser.Picture
		}
		if err := h.DB.Save(currentUser).Error; err != nil {
			return c.Redirect(withParam(nextURL, "error", "link_failed"))
		}
		_ = h.writeAudit(currentUser, "user.link_google", "user", currentUser.ID.String(), "ok")
		return c.Redirect(withParam(nextURL, "success", "google_linked"))
	}

	// Login / Register mode
	var user models.User
	// 1. Search by GoogleID
	err := h.DB.Where("google_id = ?", sub).First(&user).Error
	if err == nil {
		if user.AccountStatus == models.StatusSuspended {
			return c.Redirect(fmt.Sprintf("/%s/auth/login?error=account_suspended", locale))
		}
		raw, _, err := h.Sessions.Create(user.ID, c.Get("User-Agent"), c.IP())
		if err != nil {
			return c.Redirect(withParam(nextURL, "error", "session_error"))
		}
		h.setSessionCookie(c, raw)
		_ = h.writeAudit(&user, "user.login.google", "user", user.ID.String(), "ok")
		return c.Redirect(nextURL)
	}

	// 2. Search by Email
	err = h.DB.Where("email = ?", email).First(&user).Error
	if err == nil {
		if user.AccountStatus == models.StatusSuspended {
			return c.Redirect(fmt.Sprintf("/%s/auth/login?error=account_suspended", locale))
		}
		user.GoogleID = sub
		user.GoogleEmail = email
		if !user.EmailVerified() {
			now := time.Now().UTC()
			user.EmailVerifiedAt = &now
		}
		if user.AvatarPath == "" && gUser.Picture != "" {
			user.AvatarPath = gUser.Picture
		}
		if err := h.DB.Save(&user).Error; err != nil {
			return c.Redirect(withParam(nextURL, "error", "update_failed"))
		}
		raw, _, err := h.Sessions.Create(user.ID, c.Get("User-Agent"), c.IP())
		if err != nil {
			return c.Redirect(withParam(nextURL, "error", "session_error"))
		}
		h.setSessionCookie(c, raw)
		_ = h.writeAudit(&user, "user.login.google_linked", "user", user.ID.String(), "ok")
		return c.Redirect(nextURL)
	}

	// 3. Register new user
	name := strings.TrimSpace(gUser.Name)
	if name == "" {
		name = strings.TrimSpace(gUser.GivenName + " " + gUser.FamilyName)
	}
	if name == "" {
		parts := strings.Split(email, "@")
		name = parts[0]
	}
	first := strings.TrimSpace(gUser.GivenName)
	if first == "" {
		first = name
	}
	last := strings.TrimSpace(gUser.FamilyName)
	now := time.Now().UTC()

	newUser := models.User{
		Name:            name,
		FirstName:       first,
		LastName:        last,
		Email:           email,
		GoogleID:        sub,
		GoogleEmail:     email,
		AvatarPath:      gUser.Picture,
		EmailVerifiedAt: &now,
		StaffRole:       models.RoleMember,
		AccountStatus:   models.StatusActive,
	}
	if err := h.DB.Create(&newUser).Error; err != nil {
		return c.Redirect(withParam(nextURL, "error", "register_failed"))
	}
	_ = seed.CreateCurrentMember(h.DB, newUser.ID, "google_register")
	_ = h.writeAudit(&newUser, "user.register.google", "user", newUser.ID.String(), "ok")

	raw, _, err := h.Sessions.Create(newUser.ID, c.Get("User-Agent"), c.IP())
	if err != nil {
		return c.Redirect(withParam(nextURL, "error", "session_error"))
	}
	h.setSessionCookie(c, raw)
	return c.Redirect(nextURL)
}

func safeRedirectURL(next, locale, appPublicURL string) string {
	next = strings.TrimSpace(next)
	if next == "" {
		return fmt.Sprintf("/%s/account", locale)
	}
	if strings.HasPrefix(next, "/") && !strings.HasPrefix(next, "//") && !strings.Contains(next, "://") {
		return next
	}
	if appPublicURL != "" && strings.HasPrefix(next, appPublicURL) {
		return next
	}
	return fmt.Sprintf("/%s/account", locale)
}

func withParam(targetURL, key, val string) string {
	u, err := url.Parse(targetURL)
	if err != nil {
		if strings.Contains(targetURL, "?") {
			return targetURL + "&" + url.QueryEscape(key) + "=" + url.QueryEscape(val)
		}
		return targetURL + "?" + url.QueryEscape(key) + "=" + url.QueryEscape(val)
	}
	q := u.Query()
	q.Set(key, val)
	u.RawQuery = q.Encode()
	return u.String()
}
