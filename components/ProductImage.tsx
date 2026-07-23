import clsx from "clsx";

// Emoji-based product image placeholder (no R2 in demo mode).
export function ProductImage({
  emoji,
  className,
  size = "text-5xl",
}: {
  emoji: string;
  className?: string;
  size?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center bg-surface-muted",
        className
      )}
    >
      <span className={clsx(size, "select-none")}>{emoji}</span>
    </div>
  );
}
