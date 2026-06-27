export default function ActivityLogsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-11 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="mb-4 h-12 animate-pulse rounded-xl bg-slate-200 last:mb-0 dark:bg-slate-800"
          />
        ))}
      </div>
    </div>
  );
}
