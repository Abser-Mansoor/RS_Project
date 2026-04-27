function SkeletonCard() {
  return (
    <div className="neu p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <div className="shimmer h-5 w-24" />
        <div className="shimmer h-5 w-12" />
        <div className="shimmer h-5 w-8 ml-auto" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="shimmer h-6 w-10/12" />
        <div className="shimmer h-6 w-7/12" />
      </div>
      <div className="shimmer h-4 w-48 mt-2" />
      <div className="mt-4 space-y-1.5">
        <div className="shimmer h-3.5 w-full" />
        <div className="shimmer h-3.5 w-11/12" />
        <div className="shimmer h-3.5 w-8/12" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t-[2px] border-[var(--border)] pt-4">
        <div className="shimmer h-10" />
        <div className="shimmer h-10" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="shimmer h-8 w-20 rounded-lg" />
        <div className="shimmer h-8 w-24 rounded-lg" />
        <div className="shimmer h-8 w-16 rounded-lg" />
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
