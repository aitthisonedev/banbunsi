import { Suspense } from "react";
import { LoadingState } from "@/components/ui";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <LoadingState label="…" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
