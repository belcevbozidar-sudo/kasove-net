import { StarIcon } from "./Icons";

export default function StarRating({
  rating,
  reviewCount,
  size = "sm",
}: {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
}) {
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex text-accent-lime">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            className={`${starSize} ${i < Math.round(rating) ? "" : "text-surface-3"}`}
          />
        ))}
      </div>
      <span className="text-xs text-text-muted">
        {rating.toFixed(1)}
        {typeof reviewCount === "number" ? ` (${reviewCount})` : ""}
      </span>
    </div>
  );
}
