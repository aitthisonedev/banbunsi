package mail

import (
	"fmt"
	"log"
	"net/smtp"
	"strings"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
)

type Mailer struct {
	cfg *config.Config
}

func New(cfg *config.Config) *Mailer {
	return &Mailer{cfg: cfg}
}

func (m *Mailer) Send(to, subject, body string) error {
	if m.cfg.SMTPHost == "" {
		log.Printf("[mail:console] to=%s subject=%q\n%s\n", to, subject, body)
		return nil
	}
	addr := fmt.Sprintf("%s:%d", m.cfg.SMTPHost, m.cfg.SMTPPort)
	msg := strings.Join([]string{
		"From: " + m.cfg.SMTPFrom,
		"To: " + to,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		body,
	}, "\r\n")
	return smtp.SendMail(addr, nil, m.cfg.SMTPFrom, []string{to}, []byte(msg))
}

func (m *Mailer) SendVerification(to, token string) error {
	link := fmt.Sprintf("%s/lo/auth/verify?token=%s", m.cfg.AppPublicURL, token)
	body := fmt.Sprintf("Verify your BAN BUNSI email:\n\n%s\n\nIf you did not register, ignore this message.", link)
	return m.Send(to, "Verify your BAN BUNSI email", body)
}

func (m *Mailer) SendPasswordReset(to, token string) error {
	link := fmt.Sprintf("%s/lo/auth/reset-password?token=%s", m.cfg.AppPublicURL, token)
	body := fmt.Sprintf("Reset your BAN BUNSI password:\n\n%s\n\nIf you did not request this, ignore this message.", link)
	return m.Send(to, "Reset your BAN BUNSI password", body)
}
