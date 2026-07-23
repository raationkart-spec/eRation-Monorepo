// Reusable skeleton loaders. Rendered on the server + first client paint so the
// user always sees structured placeholders instantly (never a blank screen),
// then real content fades in.

export function Skel({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-muted ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-surface-border bg-white p-2">
      <Skel className="aspect-square w-full rounded-md" />
      <Skel className="mt-2 h-3.5 w-3/4" />
      <Skel className="mt-2 h-3 w-1/3" />
      <Skel className="mt-3 h-8 w-full" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-4">
      <Skel className="h-40 w-full rounded-xl" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
            <Skel className="h-16 w-16 rounded-2xl" />
            <Skel className="h-2.5 w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skel className="h-5 w-40" />
        <ProductGridSkeleton count={4} />
      </div>
      <div className="space-y-2">
        <Skel className="h-5 w-32" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div>
      <Skel className="h-7 w-52" />
      <Skel className="mt-2 h-4 w-24" />
      <div className="my-4 flex gap-2">
        <Skel className="h-8 w-28" />
        <Skel className="h-8 w-20" />
      </div>
      <ProductGridSkeleton count={6} />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div>
      <Skel className="h-4 w-16" />
      <Skel className="mt-2 aspect-square w-full rounded-xl" />
      <Skel className="mt-4 h-6 w-2/3" />
      <Skel className="mt-2 h-4 w-20" />
      <Skel className="mt-3 h-7 w-32" />
      <Skel className="mt-4 h-9 w-40 rounded-md" />
      <Skel className="mt-6 h-4 w-full" />
      <Skel className="mt-2 h-4 w-5/6" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skel className="h-7 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skel key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-surface-muted">
      <div className="flex items-center gap-3 border-b border-surface-border bg-white px-4 py-3">
        <Skel className="h-6 w-6 rounded-full" />
        <Skel className="h-5 w-24" />
      </div>
      <div className="space-y-2 p-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skel key={i} className="h-20 w-full rounded-lg" />
        ))}
        <Skel className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function AdminTableSkeleton() {
  return (
    <div>
      <Skel className="h-7 w-40" />
      <Skel className="mt-4 h-10 w-full max-w-sm rounded-lg" />
      <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skel key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div>
      <Skel className="h-7 w-40" />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skel key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skel className="mt-6 h-56 w-full rounded-xl" />
    </div>
  );
}
