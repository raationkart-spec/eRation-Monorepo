"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { signIn } from "next-auth/react";
import { useAuth } from "@/lib/store";

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const returnTo = params.get("returnTo") ?? "/";
  const loginWithPhone = useAuth((s) => s.loginWithPhone);

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const submit = async (code: string) => {
    if (/^\d{6}$/.test(code)) {
      loginWithPhone("+91 " + phone);
      await signIn("phone", { phone: "+91 " + phone, redirect: false });
      router.replace(returnTo);
    } else {
      setError(true);
    }
  };

  const onChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError(false);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d) && next.join("").length === 6) submit(next.join(""));
  };

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pt-6">
      <button onClick={() => router.back()} className="-ml-1 p-1">
        <ChevronLeft size={24} />
      </button>
      <h1 className="mt-4 text-2xl font-bold">Enter OTP</h1>
      <p className="mt-1 text-sm text-ink-muted">Sent to +91 {phone}</p>

      <div className="mt-6 flex gap-2">
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
            className={`h-12 w-12 rounded-md border text-center text-xl font-bold outline-none focus:border-brand ${
              error
                ? "animate-bump border-status-error"
                : "border-surface-border"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-status-error">
          Incorrect OTP, try again
        </p>
      )}

      <button
        onClick={() => submit(digits.join(""))}
        className="btn-primary mt-5 w-full"
      >
        Verify
      </button>

      <p className="mt-4 text-center text-sm text-ink-muted">
        {seconds > 0 ? (
          <>Resend code in {seconds}s</>
        ) : (
          <button
            onClick={() => setSeconds(45)}
            className="font-semibold text-brand-dark"
          >
            Resend OTP
          </button>
        )}
      </p>
      <p className="mt-4 text-center text-2xs text-ink-subtle">
        Demo mode — enter any 6 digits (e.g. 123456) to continue.
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
