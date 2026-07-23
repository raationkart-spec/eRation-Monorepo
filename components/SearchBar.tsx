"use client";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2.5 shadow-card"
    >
      <Search size={18} className="text-ink-subtle" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder='Search "milk", "bananas"...'
        className="flex-1 bg-transparent text-base outline-none placeholder:text-ink-subtle"
      />
      {q && (
        <button type="button" onClick={() => setQ("")} aria-label="Clear">
          <X size={16} className="text-ink-subtle" />
        </button>
      )}
    </form>
  );
}
