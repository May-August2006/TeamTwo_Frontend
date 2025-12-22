/** @format */

export const UnitCardSkeleton = () => (
  <div className="bg-white border border-stone-200 rounded-xl shadow-sm animate-pulse">
    <div className="h-44 bg-stone-200 rounded-t-xl" />
    <div className="p-5 space-y-3">
      <div className="h-4 w-1/2 bg-stone-200 rounded" />
      <div className="h-3 w-3/4 bg-stone-200 rounded" />
      <div className="h-3 w-2/3 bg-stone-200 rounded" />
      <div className="flex gap-2 mt-4">
        <div className="h-8 flex-1 bg-stone-200 rounded" />
        <div className="h-8 flex-1 bg-stone-200 rounded" />
      </div>
    </div>
  </div>
);
