"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { signIn, signUp } from "@/lib/auth/client";
import { analytics } from "@/lib/analytics";
import { Spinner } from "@/components/tools/Spinner";
import {
  PlinyMark,
  IconArrow,
  IconMail,
  IconLock,
  IconEye,
  IconShield,
  IconGoogle,
} from "@/components/shared/icons";

type Mode = "signin" | "signup";

/** 0 = empty, 1 = weak, 2 = fair, 3 = strong. */
function passwordScore(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  return Math.min(score, 3);
}

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string>();

  const score = passwordScore(password);
  const strengthLabel = [t("strengthWeak"), t("strengthWeak"), t("strengthMedium"), t("strengthStrong")][score];
  const strengthColor = score >= 3 ? "#34D399" : score === 2 ? "#FBBC05" : "#F43F5E";

  async function onGoogle() {
    setError(undefined);
    setGoogleLoading(true);
    if (isSignup) analytics.signupCompleted("google");
    const { error: err } = await signIn.social({
      provider: "google",
      callbackURL: `/${locale}/dashboard`,
    });
    if (err) {
      setError(err.message ?? t("errorGeneric"));
      setGoogleLoading(false);
    }
    // On success the browser is redirected to Google — no further handling here.
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (isSignup && password.length < 8) {
      setError(t("errorTooShort"));
      return;
    }

    setLoading(true);
    const res = isSignup
      ? await signUp.email({ email, password, name: email.split("@")[0] })
      : await signIn.email({ email, password });

    if (res.error) {
      setError(res.error.message ?? t("errorGeneric"));
      setLoading(false);
      return;
    }
    if (isSignup) analytics.signupCompleted("email");
    router.push("/dashboard");
  }

  return (
    <section
      className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-5 py-16"
      style={{
        backgroundImage:
          "radial-gradient(60% 50% at 20% 30%, rgba(107,92,231,0.12) 0%, rgba(107,92,231,0) 60%), radial-gradient(50% 50% at 80% 70%, rgba(244,114,182,0.06) 0%, rgba(0,0,0,0) 60%)",
      }}
    >
      {/* Trust strip */}
      <div
        className="absolute left-0 right-0 top-4 mx-auto hidden max-w-[420px] items-center justify-center gap-3.5 text-[12.5px] sm:flex"
        style={{ color: "var(--text-3)" }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="pp-dot" style={{ color: "#34D399" }} /> {t("noTracking")}
        </span>
        <span>·</span>
        <span className="inline-flex items-center gap-1.5">
          <IconShield size={12} color="#34D399" sw={1.8} /> {t("gdpr")}
        </span>
      </div>

      <div
        className="pp-card w-full max-w-[420px]"
        style={{ padding: 36, borderRadius: 20 }}
      >
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <PlinyMark size={32} color="var(--text)" />
            <span
              className="font-[family-name:var(--font-display)] text-[19px] font-bold tracking-[-0.02em]"
            >
              PlinyPDF
            </span>
          </Link>
        </div>

        <h1 className="mb-2 text-center text-[26px] tracking-[-0.025em]">
          {isSignup ? t("signupTitle") : t("signinTitle")}
        </h1>
        <p className="mb-7 text-center text-[13.5px]" style={{ color: "var(--text-2)" }}>
          {isSignup ? t("signupSub") : t("signinSub")}
        </p>

        {/* Google */}
        <button
          type="button"
          onClick={onGoogle}
          disabled={googleLoading || loading}
          className="pp-related flex w-full items-center justify-center gap-2.5 rounded-[10px] py-3 text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--bg)", border: "1px solid var(--line-2)", color: "var(--text)" }}
        >
          {googleLoading ? <Spinner /> : <IconGoogle size={18} />}
          {t("google")}
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <hr className="pp-hr flex-1" />
          <span className="pp-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--text-3)" }}>
            {t("or")}
          </span>
          <hr className="pp-hr flex-1" />
        </div>

        <form onSubmit={onSubmit}>
          {/* Email */}
          <div className="mb-3">
            <label className="mb-1.5 block text-[12.5px]" style={{ color: "var(--text-2)" }}>
              {t("emailLabel")}
            </label>
            <div className="relative">
              <IconMail
                size={15}
                color="var(--text-3)"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                className="pp-input"
                type="email"
                required
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-[18px]">
            <div className="mb-1.5 flex justify-between">
              <label className="text-[12.5px]" style={{ color: "var(--text-2)" }}>
                {t("passwordLabel")}
              </label>
              {!isSignup && (
                <span className="text-[12px]" style={{ color: "var(--text-3)" }}>
                  {t("forgot")}
                </span>
              )}
            </div>
            <div className="relative">
              <IconLock
                size={15}
                color="var(--text-3)"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                className="pp-input"
                type={showPw ? "text" : "password"}
                required
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder={isSignup ? t("passwordPlaceholderSignup") : t("passwordPlaceholderSignin")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 36, paddingRight: 38 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: 0,
                  color: "var(--text-3)",
                  padding: 4,
                  cursor: "pointer",
                }}
              >
                <IconEye size={15} />
              </button>
            </div>
            {isSignup && password.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[11.5px]">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 60,
                      height: 3,
                      borderRadius: 2,
                      background: i < score ? strengthColor : "var(--line-2)",
                    }}
                  />
                ))}
                <span className="pp-mono ml-1" style={{ color: strengthColor }}>
                  {strengthLabel}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div
              className="mb-4 rounded-lg px-3.5 py-2.5 text-[13px]"
              style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", color: "#FDA4AF" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="pp-btn pp-btn-lg w-full justify-center disabled:opacity-70"
          >
            {loading ? (
              <>
                <Spinner /> {t("processing")}
              </>
            ) : (
              <>
                {isSignup ? t("signupCta") : t("signinCta")} <IconArrow size={15} />
              </>
            )}
          </button>
        </form>

        {isSignup && (
          <p className="mt-3.5 text-center text-[11.5px] leading-relaxed" style={{ color: "var(--text-3)" }}>
            {t("terms")}
          </p>
        )}

        <hr className="pp-hr" style={{ margin: "24px 0 18px" }} />

        <div className="text-center text-[13px]" style={{ color: "var(--text-2)" }}>
          {isSignup ? (
            <>
              {t("haveAccount")}{" "}
              <Link href="/login" style={{ color: "#BFB5FF" }}>
                {t("signinLink")}
              </Link>
            </>
          ) : (
            <>
              {t("noAccount")}{" "}
              <Link href="/signup" style={{ color: "#BFB5FF" }}>
                {t("signupLink")}
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
