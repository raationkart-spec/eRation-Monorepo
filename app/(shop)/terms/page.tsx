import Link from "next/link";
import { FileText, ArrowLeft, CheckCircle2, AlertCircle, ShoppingBag, Shield } from "lucide-react";

export const metadata = {
  title: "Terms of Service | QuickCart",
  description: "QuickCart grocery delivery terms of service and user agreements.",
};

export default function TermsPage() {
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
          <FileText size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-500">
            QuickCart Grocery Delivery • Siliguri, West Bengal
          </p>
        </div>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-slate-600">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the QuickCart website, mobile application, or ordering services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Service Eligibility & Delivery Area</h2>
          <p>
            QuickCart provides grocery and daily essentials delivery exclusively within designated serviceable pincodes in <strong>Siliguri, West Bengal</strong>. We reserve the right to verify delivery addresses before accepting and dispatching orders.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Accounts & Authentication</h2>
          <p>
            You may create an account via Email OTP or Google OAuth. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Orders, Pricing & Payments</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-xs">
            <li>All prices listed are in Indian Rupees (INR) and include applicable taxes unless stated otherwise.</li>
            <li>We strive to ensure accurate pricing and product descriptions; however, in the event of an inadvertent technical or inventory error, we reserve the right to cancel or adjust affected items.</li>
            <li>Payment may be completed via supported online payment gateways or Cash on Delivery (COD) where available.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Returns, Replacements & Refunds</h2>
          <p>
            Customer satisfaction is our priority. If you receive damaged, expired, or incorrect grocery items, please report it via our support contact within 24 hours of delivery. Eligible items will be replaced or refunded promptly.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">6. Modifications to the Service</h2>
          <p>
            QuickCart reserves the right to modify or discontinue any feature, delivery slot, or promotion at any time without prior notice.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <h3 className="text-xs font-bold text-slate-800">Questions or Support?</h3>
          <p className="mt-1 text-xs text-slate-500">
            For any queries regarding these Terms, please reach out to us at{" "}
            <a href="mailto:support@quickcart.com" className="font-semibold text-orange-600 underline">
              support@quickcart.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
