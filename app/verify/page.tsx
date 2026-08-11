"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import { useAuth } from "@/lib/store";

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const rawReturnTo = params.get("returnTo") ?? "/";
  const returnTo = rawReturnTo === "/account" ? "/" : rawReturnTo;
  const loginWithEmail = useAuth((s) => s.loginWithEmail);

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const submit = async (code: string) => {
    if (!/^\d{6}$/.test(code) || verifying) return;
    setVerifying(true);
    setError("");

    try {
      const res = await signIn("email-otp", {
        email,
        otp: code,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid or expired OTP code. Please try again.");
      } else {
        loginWithEmail(email);
        router.replace(returnTo);
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP");
    } finally {
      setVerifying(false);
    }
  };

  const resendOtp = async () => {
    setSeconds(45);
    setError("");
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // fallback
    }
  };

  const onChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError("");
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d) && next.join("").length === 6) submit(next.join(""));
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-slate-900 font-sans antialiased">
      {/* Top Hero Header */}
      <div
        className="relative h-[320px] w-full overflow-hidden"
        style={{ clipPath: "ellipse(120% 80% at 50% 0%)" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-slate-950" />
        
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/30"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="text-xl font-black text-white">QuickCart</span>
          <div className="w-10" />
        </div>
      </div>

      {/* Verification Card */}
      <div className="relative z-10 -mt-24 flex flex-1 flex-col items-center rounded-t-3xl border-t border-white/20 bg-white/95 px-6 pb-8 pt-8 shadow-2xl backdrop-blur-xl">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Verify your Email</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Enter 6-digit code sent to <span className="font-bold text-slate-900">{email}</span>
          </p>
        </div>

        <div className="mt-8 flex gap-2 sm:gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digits[i] && i > 0)
                  inputs.current[i - 1]?.focus();
              }}
              className={`h-12 w-11 sm:h-14 sm:w-12 rounded-xl border text-center text-xl font-black outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 ${
                error
                  ? "border-red-500 bg-red-50 text-red-900"
                  : "border-slate-300 bg-white text-slate-900"
              }`}
            />
          ))}
        </div>

        {error && <p className="mt-3 text-xs font-bold text-red-600">{error}</p>}

        <button
          disabled={verifying}
          onClick={() => submit(digits.join(""))}
          className="mt-6 flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-orange-700 disabled:opacity-50 active:scale-95"
        >
          {verifying ? "Verifying..." : "Verify & Continue"} <ArrowRight size={18} />
        </button>

        <p className="mt-4 text-center text-sm font-medium text-slate-600">
          {seconds > 0 ? (
            <>Resend code in <span className="font-bold text-slate-900">{seconds}s</span></>
          ) : (
            <button
              onClick={resendOtp}
              className="font-bold text-orange-600 hover:underline"
            >
              Resend OTP Code
            </button>
          )}
        </p>

        <p className="mt-4 text-center text-2xs font-medium text-slate-500">
          Check spam folder if email isn&apos;t in inbox. Demo code <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-800">123456</code> also works.
        </p>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
