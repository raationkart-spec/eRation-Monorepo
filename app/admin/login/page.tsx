"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { useAuth } from "@/lib/store";

export default function AdminLoginPage() {
  const router = useRouter();
  const loginAsAdmin = useAuth((s) => s.loginAsAdmin);
  const defaultEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@quickcart.com";
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email");
      return;
    }
    if (!password) {
      setError("Please enter password");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await signIn("admin", {
        email,
        password,
        redirect: false,
        redirectTo: "/admin",
        callbackUrl: "/admin",
      });
      if (res?.error) {
        setError("Invalid admin email or password");
      } else {
        loginAsAdmin(email);
        router.replace("/admin");
      }
    } catch (err: any) {
      if (err?.message?.includes("CredentialsSignin") || err?.name === "CredentialsSignin") {
        setError("Invalid admin email or password");
      } else {
        setError("Failed to sign in. Please check credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-float">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-dark">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            QuickCart Admin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Staff sign-in — authorized personnel only
          </p>
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
          placeholder="admin@quickcart.com"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="flex items-center rounded-lg border border-slate-200 px-3 focus-within:border-brand">
          <Lock size={16} className="text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="btn-primary mt-4 w-full disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in to Admin"}
        </button>

        <p className="mt-4 text-center text-2xs text-slate-400">
          Staff sign-in endpoint — authorized personnel only.
        </p>
      </div>
    </div>
  );
}
