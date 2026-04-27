function SkeletonCard() {
  return (
    <div className="neu p-5">
      <div className="flex items-center justify-between">
        <div className="shimmer h-6 w-28" />
        <div className="shimmer h-6 w-14" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="shimmer h-7 w-11/12" />
        <div className="shimmer h-7 w-4/5" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="shimmer h-3 w-full" />
        <div className="shimmer h-3 w-10/12" />
        <div className="shimmer h-3 w-7/12" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="shimmer h-12" />
        <div className="shimmer h-12" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <div className="shimmer h-9 w-24 rounded-lg" />
        <div className="shimmer h-9 w-28 rounded-lg" />
        <div className="shimmer h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={`skeleton-${index}`} />
      ))}
    </div>
  );
}
