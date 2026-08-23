"use client";
import { useCatalog } from "@/lib/store";
import { BannerCarousel } from "@/components/BannerCarousel";
import { CategoryChip } from "@/components/CategoryChip";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/misc";
import { HomeSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import { QuickStories } from "@/components/QuickStories";
import { BuyItAgain } from "@/components/BuyItAgain";
import { FlashDeals } from "@/components/FlashDeals";
import { ChefsChoiceBundle } from "@/components/ChefsChoiceBundle";

export default function HomePage() {
  const hydrated = useHydrated();
  const categories = useCatalog((s) => s.categories);
  const banners = useCatalog((s) => s.banners);
  const products = useCatalog((s) => s.products);

  const activeCats = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const sections = activeCats
    .map((cat) => ({
      category: cat,
      products: products.filter(
        (p) => p.categorySlug === cat.slug && p.isFeatured && p.isActive
      ),
    }))
    .filter((s) => s.products.length > 0);

  if (!hydrated) return <HomeSkeleton />;

  return (
    <div className="content-in space-y-6">
      <QuickStories />

      <BannerCarousel banners={banners} />

      <div className="no-scrollbar -mx-4 -mt-3 flex gap-1 overflow-x-auto px-4 pb-1">
        {activeCats.map((c) => (
          <CategoryChip key={c.id} category={c} />
        ))}
      </div>

      <BuyItAgain />

      <FlashDeals />

      <ChefsChoiceBundle />

      {sections.map((section) => (
        <section key={section.category.id}>
          <SectionHeader
            title={section.category.name}
            href={`/category/${section.category.slug}`}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {section.products.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}

      {/* Storefront Footer */}
      <footer className="mt-8 border-t border-slate-100 pt-6 pb-4 text-center text-xs text-slate-400">
        <p className="font-bold text-slate-600">QuickCart • Siliguri</p>
        <p className="mt-1 text-2xs">Daily groceries & essentials delivered fast across Siliguri.</p>
        <div className="mt-3 flex items-center justify-center gap-4 text-2xs font-semibold">
          <a href="/terms" className="text-slate-500 underline hover:text-orange-500">
            Terms of Service
          </a>
          <span>•</span>
          <a href="/privacy" className="text-slate-500 underline hover:text-orange-500">
            Privacy Policy
          </a>
        </div>
        <p className="mt-3 text-[10px] text-slate-300">© 2026 QuickCart. All rights reserved.</p>
      </footer>
    </div>
  );
}
