"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { useAuth } from "@/lib/store";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") ?? "/";
  const loginWithGoogle = useAuth((s) => s.loginWithGoogle);
  const [phone, setPhone] = useState("");

  const valid = /^[6-9]\d{9}$/.test(phone);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="text-center">
        <span className="text-5xl">🛒</span>
        <h1 className="mt-3 text-2xl font-bold text-brand-dark">QuickCart</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Sign in to continue shopping
        </p>
      </div>

      <div className="mt-8">
        <label className="text-sm font-medium">Phone number</label>
        <div className="mt-1 flex items-center rounded-md border border-surface-border bg-white px-3">
          <span className="text-base font-medium text-ink-muted">+91</span>
          <input
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="98765 43210"
            className="w-full bg-transparent px-2 py-3 text-base outline-none"
          />
        </div>
        <button
          disabled={!valid}
          onClick={() =>
            router.push(
              `/verify?phone=${phone}&returnTo=${encodeURIComponent(returnTo)}`
            )
          }
          className="btn-primary mt-3 w-full disabled:opacity-50"
        >
          Send OTP
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
          Demo mode — no real SMS is sent. Any 6-digit code works on the next
          screen.
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
