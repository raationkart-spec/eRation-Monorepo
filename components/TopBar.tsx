"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Crosshair, MapPin, Loader2, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { useCart, useLocation } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { useToast, ToastHost } from "@/components/toast";
import { SearchBar } from "./SearchBar";

const SILIGURI_PINCODES = [
  { pin: "734001", area: "Hill Cart Road, Siliguri" },
  { pin: "734003", area: "Hakim Para, Siliguri" },
  { pin: "734004", area: "Deshbandhu Para, Siliguri" },
  { pin: "734005", area: "Pradhan Nagar, Siliguri" },
  { pin: "734006", area: "Sevoke Road, Siliguri" },
  { pin: "734008", area: "Matigara, Siliguri" },
];

export function TopBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const { pincode, city, isDetecting, setPincode, detectLocation } = useLocation();
  const showToast = useToast((s) => s.show);

  const [modalOpen, setModalOpen] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const count = hydrated ? items.reduce((n, i) => n + i.quantity, 0) : 0;
  const displayPin = hydrated ? (pincode || "734001") : "734001";
  const displayCity = hydrated ? (city || "Siliguri") : "Siliguri";
  const isHome = pathname === "/";

  const handleAutoDetect = async () => {
    const res = await detectLocation();
    if (res) {
      showToast(`Location detected: ${res.pincode} (${res.city}) 🎉`);
      setModalOpen(false);
      setErrorMsg("");
    } else {
      setErrorMsg("Location access denied or timed out. Please enter your pincode manually.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(inputPin.trim())) {
      setErrorMsg("Please enter a valid 6-digit pincode");
      return;
    }
    setPincode(inputPin.trim(), "Siliguri Area");
    showToast(`Pincode set to ${inputPin.trim()} 👍`);
    setModalOpen(false);
    setInputPin("");
    setErrorMsg("");
  };

  const handleSelectPopular = (pin: string, area: string) => {
    setPincode(pin, area);
    showToast(`Pincode set to ${pin} (${area})`);
    setModalOpen(false);
    setErrorMsg("");
  };

  return (
    <>
      <header className="glass-header">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 shadow-sm">
                <span className="text-xl select-none">🛒</span>
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900">
                  QuickCart
                </span>
              </div>
            </Link>
            <div className="hidden items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-2xs font-extrabold text-orange-600 sm:flex border border-orange-200">
              <Sparkles size={12} className="text-orange-500" /> SILIGURI
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Auto Detect / Change Pincode Button */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 active:scale-95 transition shadow-xs"
            >
              <MapPin size={13} className="text-orange-500 shrink-0" />
              <span className="font-extrabold text-slate-900">{displayPin}</span>
              <span className="max-w-[75px] truncate text-2xs font-semibold text-slate-500 hidden xs:inline">
                ({displayCity})
              </span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {!isHome && (
              <Link
                href="/search"
                aria-label="Search products"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition shadow-sm"
              >
                <Search size={18} />
              </Link>
            )}

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 active:scale-95 transition shadow-sm"
            >
              <ShoppingBag size={19} />
              {count > 0 && (
                <span
                  key={count}
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 animate-bump items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-600 px-1 text-2xs font-extrabold text-white shadow-sm"
                >
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {isHome && (
          <div className="border-t border-slate-100 px-4 py-2.5">
            <SearchBar />
          </div>
        )}
      </header>

      {/* Pincode & Location Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Delivery Location</h3>
                <p className="text-2xs font-semibold text-slate-400">Delivered All Across Siliguri</p>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setErrorMsg("");
                }}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Auto Detect Location Primary CTA */}
            <button
              onClick={handleAutoDetect}
              disabled={isDetecting}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 py-3.5 px-4 text-sm font-extrabold text-white shadow-md hover:from-orange-600 hover:to-amber-700 active:scale-95 transition-all disabled:opacity-75"
            >
              {isDetecting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Detecting Location...
                </>
              ) : (
                <>
                  <Crosshair size={18} /> Auto-Detect Current Location
                </>
              )}
            </button>

            {errorMsg && (
              <p className="text-center text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-2xs font-extrabold uppercase text-slate-400 tracking-wider">or enter pincode</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Manual Pincode Input Form */}
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit pincode"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ""))}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 focus:bg-white transition"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-slate-800 active:scale-95 transition"
              >
                Apply
              </button>
            </form>

            {/* Siliguri Service Areas */}
            <div>
              <p className="mb-2 text-2xs font-extrabold uppercase tracking-wider text-slate-400">Siliguri Service Areas</p>
              <div className="grid grid-cols-2 gap-2">
                {SILIGURI_PINCODES.map((item) => (
                  <button
                    key={item.pin}
                    onClick={() => handleSelectPopular(item.pin, item.area)}
                    className="flex flex-col items-start rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 text-left hover:border-orange-300 hover:bg-orange-50/50 transition active:scale-95"
                  >
                    <span className="text-xs font-black text-slate-900">{item.pin}</span>
                    <span className="text-2xs font-medium text-slate-500 truncate w-full">{item.area}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastHost />
    </>
  );
}
