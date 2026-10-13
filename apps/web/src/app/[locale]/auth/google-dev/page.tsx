"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { FormField } from "@/components/ui";
import { isLocale } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function GoogleDevSandboxPage() {
  const params = useParams();
  const search = useSearchParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();

  const mode = search.get("mode") || "login";
  const nextPath = search.get("next") || `/${locale}/account`;
  const state = search.get("state") || "";

  const [name, setName] = useState("Google User");
  const [email, setEmail] = useState("banbunsi.tester@gmail.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const modeTitle =
    mode === "link"
      ? locale === "lo"
        ? "ເຊື່ອມຕໍ່ບັນຊີ Google (Dev Sandbox)"
        : "Link Google Account (Dev Sandbox)"
      : mode === "register"
        ? locale === "lo"
          ? "ລົງທະບຽນດ້ວຍ Google (Dev Sandbox)"
          : "Register with Google (Dev Sandbox)"
        : locale === "lo"
          ? "ເຂົ້າສູ່ລະບົບດ້ວຍ Google (Dev Sandbox)"
          : "Sign in with Google (Dev Sandbox)";

  const modeLead =
    locale === "lo"
      ? "ລະບົບທົດສອບ Google OAuth ທ້ອງຖິ່ນ (ຈຳລອງການຢືນຢັນຕົວຕົນຈາກ Google)"
      : "Local Google OAuth Simulator (Used when GOOGLE_CLIENT_ID is not configured in .env)";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/google/dev-callback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          state,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          sub: `google-${btoa(email.trim().toLowerCase())
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 24)}`,
          picture: "https://lh3.googleusercontent.com/a/ACg8ocIS0mock=s96-c",
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      // Check if redirect response or success
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      // If we got success, navigate to next
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Development authorization failed",
      );
      setLoading(false);
    }
  }

  return (
    <AuthPanel
      locale={locale}
      activeTab="login"
      title={modeTitle}
      lead={modeLead}
      footer={
        <p className="auth-footer-prompt">
          <span>{locale === "lo" ? "ກັບຄືນ" : "Go back"} </span>
          <Link className="auth-footer-link" href={`/${locale}/auth/login`}>
            {locale === "lo" ? "ໜ້າເຂົ້າສູ່ລະບົບ" : "Sign in page"}
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="auth-form">
        <div
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "10px",
            background: "rgba(66, 133, 244, 0.08)",
            border: "1px solid rgba(66, 133, 244, 0.25)",
            fontSize: "0.86rem",
            lineHeight: 1.5,
            color: "var(--bb-text)",
            marginBottom: "0.5rem",
          }}
        >
          <p
            style={{ margin: "0 0 0.35rem", fontWeight: 700, color: "#4285f4" }}
          >
            🛠️ Google OAuth Local Sandbox
          </p>
          <p style={{ margin: 0, opacity: 0.9 }}>
            {locale === "lo"
              ? "ເມື່ອທ່ານເພີ່ມ GOOGLE_CLIENT_ID ແລະ GOOGLE_CLIENT_SECRET ໃນໄຟລ໌ .env, ລະບົບຈະເຊື່ອມຕໍ່ກັບ Google Cloud ຕົວຈິງໂດຍອັດຕະໂນມັດ."
              : "When you add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env, this will connect to the real Google Cloud OAuth dialog."}
          </p>
        </div>

        <FormField
          label={locale === "lo" ? "ຊື່ບັນຊີ Google" : "Google Account Name"}
          htmlFor="dev-name"
        >
          <input
            id="dev-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>

        <FormField
          label={locale === "lo" ? "ອີເມວ Google" : "Google Email"}
          htmlFor="dev-email"
        >
          <input
            id="dev-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>

        {error ? (
          <div className="auth-alert auth-alert--error" role="alert">
            <span>{error}</span>
          </div>
        ) : null}

        <button
          className="auth-submit-btn"
          disabled={loading}
          type="submit"
          style={{
            background: "#4285f4",
            borderColor: "#4285f4",
            color: "#ffffff",
          }}
        >
          {loading ? (
            <span>
              {locale === "lo" ? "ກຳລັງຢືນຢັນ..." : "Simulating OAuth..."}
            </span>
          ) : (
            <span>
              {mode === "link"
                ? locale === "lo"
                  ? "ເຊື່ອມຕໍ່ບັນຊີ Google ນີ້"
                  : "Connect this Google Account"
                : locale === "lo"
                  ? "ຢືນຢັນການເຂົ້າສູ່ລະບົບດ້ວຍ Google"
                  : "Simulate Google Authorization"}
            </span>
          )}
        </button>
      </form>
    </AuthPanel>
  );
}
