"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKey, SignIn, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { ErrorState } from "@/components/ui/states";
import { api } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  useEffect(() => {
    if (searchParams.get("session_expired") === "true") {
      setShowExpiredModal(true);
    }
  }, [searchParams]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.login(email, password);
      router.push("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-aside">
        <div className="brand-lockup">
          <span className="brand-mark">eV</span>
          <span>
            <span className="brand-name">e-VerifyMet</span>
            <span className="brand-subtitle">Legal metrology</span>
          </span>
        </div>
        <div className="auth-statement">
          <div className="eyebrow">Trusted operational records</div>
          <h1>Evidence you can stand behind.</h1>
          <p>One secure workspace for the regulated instruments and decisions that keep measurement fair.</p>
        </div>
        <div className="auth-detail">
          <div><strong>01</strong>Identity-first access</div>
          <div><strong>02</strong>Role-aware workspace</div>
          <div><strong>03</strong>Audit-ready history</div>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-form-card">
          <LockKey size={25} weight="duotone" color="var(--accent)" />
          <h1>Sign in</h1>
          <p>Use your e-VerifyMet account to continue to the secure workspace.</p>
          {error ? <ErrorState message={error} /> : null}
          <form className="auth-form" onSubmit={submit}>
            <Field label="Email address">
              <TextInput type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Password">
              <TextInput type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            <Button type="submit" disabled={loading} icon={<SignIn size={18} />}>
              {loading ? "Signing in…" : "Sign in securely"}
            </Button>
          </form>
          <p style={{ marginTop: 20, fontSize: 12, color: "var(--ink-faint)" }}>Public certificate verification is available without an account.</p>
        </div>
      </section>

      {showExpiredModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "var(--surface)", padding: "32px", borderRadius: "var(--radius-md)", maxWidth: "400px", width: "100%", display: "grid", gap: "20px", textAlign: "center", boxShadow: "var(--shadow)" }}>
            <WarningCircle size={48} color="var(--accent)" style={{ margin: "0 auto" }} />
            <div>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Session Expired</h2>
              <p style={{ margin: "8px 0 0", fontSize: "14px", color: "var(--ink-muted)" }}>
                Your security session has timed out. Please sign in again to continue to your workspace.
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowExpiredModal(false)} style={{ minHeight: "44px" }}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
