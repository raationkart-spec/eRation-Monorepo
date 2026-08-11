"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const rawReturnTo = params.get("returnTo") ?? "/";
  const returnTo = rawReturnTo === "/account" ? "/" : rawReturnTo;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  const handleSendOtp = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      router.push(
        `/verify?email=${encodeURIComponent(email.trim())}&returnTo=${encodeURIComponent(returnTo)}`
      );
    } catch (err: any) {
      setError(err.message || "Failed to send OTP email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="text-center">
        <span className="text-5xl">🛒</span>
        <h1 className="mt-3 text-2xl font-bold text-brand-dark">QuickCart</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Sign in with your email to continue shopping
        </p>
      </div>

      <div className="mt-8">
        <label className="text-sm font-medium">Email address</label>
        <div className="mt-1 flex items-center rounded-md border border-surface-border bg-white px-3 focus-within:border-brand">
          <Mail size={18} className="text-ink-subtle" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
            placeholder="name@example.com"
            className="w-full bg-transparent px-2 py-3 text-base outline-none"
          />
        </div>

        {error && <p className="mt-2 text-xs text-status-error">{error}</p>}

        <button
          disabled={!valid || loading}
          onClick={handleSendOtp}
          className="btn-primary mt-3 w-full disabled:opacity-50"
        >
          {loading ? "Sending OTP..." : "Send OTP via Email"}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-surface-border" />
          <span className="text-xs text-ink-subtle">or</span>
          <div className="h-px flex-1 bg-surface-border" />
        </div>

        <button
          onClick={() => {
            signIn("google", { callbackUrl: returnTo });
          }}
          className="btn-secondary w-full"
        >
          <span className="text-base">🇬</span> Continue with Google
        </button>

        <p className="mt-6 text-center text-2xs text-ink-subtle">
          A 6-digit OTP will be sent to your email address. Demo code `123456` also works.
        </p>
        <p className="mt-2 text-center text-2xs text-ink-subtle">
          By continuing you agree to our Terms &amp; Privacy Policy.
        </p>

        <div className="mt-6 border-t border-surface-border pt-4 text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted"
          >
            <ShieldCheck size={15} /> Admin login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
