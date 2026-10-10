"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { clientVerifyEmail } from "@/lib/client-api";
import { isLocale } from "@/lib/i18n";

function VerifyInner() {
  const params = useParams();
  const search = useSearchParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const token = search.get("token") || "";
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    if (!token) {
      setMessage("Missing token");
      return;
    }
    clientVerifyEmail(token)
      .then((r) => setMessage(r.message))
      .catch((e) => setMessage(e instanceof Error ? e.message : "Verification failed"));
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Email verification</h1>
      <p className="mt-4 text-bb-text-muted">{message}</p>
      <a className="mt-6 inline-block text-bb-blue hover:underline" href={`/${locale}/auth/login`}>
        Sign in
      </a>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-12">Loading...</div>}>
      <VerifyInner />
    </Suspense>
  );
}
