'use client';

export default function TableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <div
                key={`${rowIndex}-${columnIndex}`}
                className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
