function SkeletonCard() {
  return (
    <div className="surface overflow-hidden p-5">
      <div className="shimmer h-4 w-2/5 rounded-full" />
      <div className="mt-4 space-y-2">
        <div className="shimmer h-5 w-11/12 rounded-lg" />
        <div className="shimmer h-5 w-4/5 rounded-lg" />
      </div>
      <div className="mt-5 space-y-2">
        <div className="shimmer h-3 w-full rounded-lg" />
        <div className="shimmer h-3 w-10/12 rounded-lg" />
        <div className="shimmer h-3 w-7/12 rounded-lg" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="shimmer h-9 rounded-xl" />
        <div className="shimmer h-9 rounded-xl" />
        <div className="shimmer h-9 rounded-xl" />
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={`skeleton-${index}`} />
      ))}
    </div>
  );
}
