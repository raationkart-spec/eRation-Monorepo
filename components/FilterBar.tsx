"use client";

export type SortOption =
  | "popular"
  | "price_asc"
  | "price_desc"
  | "discount_desc"
  | "newest";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "discount_desc", label: "Discount: High to Low" },
  { value: "newest", label: "Newest" },
];

interface FilterBarProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  inStockOnly: boolean;
  onToggleInStock: () => void;
  under99: boolean;
  onToggleUnder99: () => void;
  discountedOnly: boolean;
  onToggleDiscounted: () => void;
}

export function FilterBar({
  sort,
  onSortChange,
  inStockOnly,
  onToggleInStock,
  under99,
  onToggleUnder99,
  discountedOnly,
  onToggleDiscounted,
}: FilterBarProps) {
  return (
    <div className="sticky top-14 z-30 -mx-4 mb-4 flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-2xs no-scrollbar">
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-orange-500 transition"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <Pill active={inStockOnly} onClick={onToggleInStock}>
        In stock
      </Pill>
      <Pill active={under99} onClick={onToggleUnder99}>
        Under ₹99
      </Pill>
      <Pill active={discountedOnly} onClick={onToggleDiscounted}>
        🔥 Discounted
      </Pill>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
        active
          ? "border-orange-200 bg-orange-50 text-orange-600 shadow-2xs"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
