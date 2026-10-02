export function CandidateSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Stage Controller Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs">
        <div className="grid grid-cols-3 items-center gap-2">
          <div className="flex justify-start">
            <div className="h-8 w-24 bg-slate-100 rounded-xl" />
          </div>
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="h-5 w-24 bg-slate-200 rounded" />
            <div className="flex gap-1.5 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-slate-200" />
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <div className="h-8 w-24 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Candidates Grid Skeleton for current stage */}
      <div className="bg-slate-50/75 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="h-3.5 w-20 bg-slate-100 rounded" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200/70 p-3.5 space-y-2.5 shadow-2xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-28 bg-slate-200 rounded" />
                  <div className="h-2.5 w-36 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <div className="h-2.5 w-24 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
