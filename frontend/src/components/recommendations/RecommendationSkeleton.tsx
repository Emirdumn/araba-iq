"use client";

export function RecommendationSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[#d1d5db]/40 bg-white overflow-hidden animate-pulse"
        >
          <div className="h-20 bg-[#2563eb]/6" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-[#e5e7eb] rounded w-3/4" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-14 bg-[#e5e7eb] rounded-lg" />
              <div className="h-14 bg-[#e5e7eb] rounded-lg" />
              <div className="h-14 bg-[#e5e7eb] rounded-lg" />
            </div>
            <div className="h-24 bg-[#f4f5f7] rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
