"use client";

export function RecommendationSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-pulse"
        >
          <div className="h-20 bg-primary-500/[0.04]" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-white/[0.06] rounded w-3/4" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-14 bg-white/[0.04] rounded-lg" />
              <div className="h-14 bg-white/[0.04] rounded-lg" />
              <div className="h-14 bg-white/[0.04] rounded-lg" />
            </div>
            <div className="h-24 bg-white/[0.03] rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
