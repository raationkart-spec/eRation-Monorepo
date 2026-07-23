import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryChip({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="flex w-[72px] shrink-0 flex-col items-center gap-1.5"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-3xl">
        {category.emoji}
      </div>
      <span className="text-center text-2xs font-medium leading-tight text-ink-muted">
        {category.name}
      </span>
    </Link>
  );
}
