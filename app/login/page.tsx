"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const rawReturnTo = params.get("returnTo") ?? "/";
  const returnTo = rawReturnTo === "/account" ? "/" : rawReturnTo;

  const [showEmailInput, setShowEmailInput] = useState(false);
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
    <main className="relative flex h-screen max-h-screen w-full flex-col justify-between overflow-hidden bg-slate-950 font-sans antialiased">
      {/* Hero Section with Arch Ellipse Clip taking ~58% of viewport */}
      <div
        className="relative h-[58vh] w-full shrink-0 overflow-hidden"
        style={{ clipPath: "ellipse(120% 80% at 50% 0%)" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80')",
          }}
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-slate-950/90" />

        {/* Brand Header Badge */}
        <div className="absolute inset-x-0 top-0 flex flex-col items-center justify-start pt-10">
          <span className="rounded-full bg-white/20 px-3.5 py-1 text-2xs font-extrabold tracking-widest text-white backdrop-blur-md border border-white/20 shadow-sm">
            ⚡ DELIVERED ALL ACROSS SILIGURI
          </span>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow-md">
            QuickCart
          </h1>
        </div>
      </div>

      {/* Bottom Sheet Card - Perfectly Proportioned without excess white gap */}
      <div className="relative z-10 -mt-10 flex flex-1 flex-col items-center justify-between rounded-t-3xl border-t border-white/20 bg-slate-900/95 px-6 pb-6 pt-6 shadow-2xl backdrop-blur-2xl text-white">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-2xl xs:text-3xl font-extrabold leading-tight text-white">
            Groceries delivered <br />
            <span className="font-black text-orange-500">across Siliguri.</span>
          </h2>
          <p className="mt-1.5 text-xs xs:text-sm font-medium leading-relaxed text-slate-300">
            Freshness delivered right to your doorstep in Siliguri. Sign in to start shopping.
          </p>
        </div>

        {/* CTA Section */}
        <div className="w-full max-w-sm space-y-2.5 my-auto pt-3">
          {/* Google Sign-in Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: returnTo })}
            className="group flex w-full items-center justify-center gap-3 rounded-full border border-slate-700 bg-white py-3.5 text-sm font-bold text-slate-900 shadow-md transition-all duration-200 hover:bg-slate-100 active:scale-95"
          >
            <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {!showEmailInput ? (
            <button
              onClick={() => setShowEmailInput(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all duration-200 hover:from-orange-600 hover:to-amber-700 active:scale-95"
            >
              <Mail size={18} /> Login using Email
            </button>
          ) : (
            <div className="space-y-2 transition-all">
              <div className="flex items-center rounded-full border border-orange-500/80 bg-slate-800/80 px-4 focus-within:ring-2 focus-within:ring-orange-500">
                <Mail size={18} className="text-orange-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  placeholder="Enter your email address"
                  className="w-full bg-transparent px-3 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              {error && <p className="px-3 text-xs font-semibold text-red-400">{error}</p>}

              <button
                disabled={!valid || loading}
                onClick={handleSendOtp}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 py-3 text-sm font-extrabold text-white shadow-md transition-all duration-200 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 active:scale-95"
              >
                {loading ? "Sending OTP..." : "Get OTP Code"} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="w-full text-center pt-2">
          <p className="text-2xs font-medium text-slate-400">
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </p>

          <div className="mt-2 pt-2 border-t border-slate-800">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-2xs font-extrabold text-slate-400 hover:text-white transition"
            >
              <ShieldCheck size={13} /> Admin Access
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
