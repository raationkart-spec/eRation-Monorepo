import Link from "next/link";
import type { Category } from "@/lib/types";
import { ProductImage } from "./ProductImage";

export function CategoryChip({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex w-[76px] shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95"
    >
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-2xs group-hover:border-orange-300 group-hover:shadow-sm transition-all">
        {category.imageUrl ? (
          <ProductImage
            imageUrl={category.imageUrl}
            emoji={category.emoji}
            alt={category.name}
            className="h-full w-full"
          />
        ) : (
          <span className="text-3xl select-none">{category.emoji}</span>
        )}
      </div>
      <span className="text-center text-2xs font-semibold leading-tight text-slate-700 group-hover:text-orange-600 transition-colors">
        {category.name}
      </span>
    </Link>
  );
}
