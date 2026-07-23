"use client";
import { useCatalog } from "@/lib/store";
import { BannerCarousel } from "@/components/BannerCarousel";
import { CategoryChip } from "@/components/CategoryChip";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/misc";
import { HomeSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";

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
    <div className="content-in space-y-1">
      <BannerCarousel banners={banners} />

      <div className="no-scrollbar -mx-4 mt-4 flex gap-1 overflow-x-auto px-4 pb-1">
        {activeCats.map((c) => (
          <CategoryChip key={c.id} category={c} />
        ))}
      </div>

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
    </div>
  );
}
