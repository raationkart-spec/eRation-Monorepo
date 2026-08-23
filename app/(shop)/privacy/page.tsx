import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, FileText, Mail } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | QuickCart",
  description: "QuickCart Privacy Policy and Google User Data usage guidelines.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white px-4 py-8 text-slate-800">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700"
        >
          <ArrowLeft size={16} /> Back to Store
        </Link>
        <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-2xs font-extrabold text-orange-600">
          Last Updated: August 2026
        </span>
      </div>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <ShieldCheck size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500">
            QuickCart Grocery Delivery • Siliguri, West Bengal
          </p>
        </div>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-slate-600">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Overview</h2>
          <p>
            QuickCart (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website (<strong>https://quickcart-nu-nine.vercel.app</strong>) or use our mobile application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Information We Collect</h2>
          <p>When you create an account or place an order, we may collect the following:</p>
          <ul className="list-disc space-y-1.5 pl-5 text-xs">
            <li><strong>Personal Information:</strong> Name, email address, phone number, and delivery addresses in Siliguri.</li>
            <li><strong>Google OAuth Data:</strong> If you sign in via Google OAuth, we receive basic profile info (email address, full name, and profile picture avatar) solely to authenticate and identify your account.</li>
            <li><strong>Order History & Preferences:</strong> Details of the items you purchase, tokens earned, and delivery notes.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. How We Use Your Information</h2>
          <p>We use the collected information for:</p>
          <ul className="list-disc space-y-1.5 pl-5 text-xs">
            <li>Processing, packing, and delivering your grocery orders across Siliguri.</li>
            <li>Account authentication, OTP verification, and secure session management.</li>
            <li>Sending critical order confirmations and delivery status notifications.</li>
            <li>Improving our service catalog, app speed, and inventory management.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Google User Data & Security</h2>
          <p>
            QuickCart adheres strictly to the Google API Services User Data Policy. We never sell, rent, or trade your Google user data to third parties or advertising networks. All sensitive credentials and tokens are securely transmitted using HTTPS encryption and stored using industry-standard protocols.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Data Retention & Account Deletion</h2>
          <p>
            We retain your data only for as long as necessary to fulfill your grocery orders and maintain your account. You have the right to request deletion of your account and personal data at any time by contacting us.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Mail size={16} className="text-orange-500" /> Contact Us
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            If you have questions about this policy, contact our support team at:{" "}
            <a href="mailto:support@quickcart.com" className="font-semibold text-orange-600 underline">
              support@quickcart.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
