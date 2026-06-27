'use client';

export default function RouteLoading({
  title = 'Memuat halaman',
}: {
  title?: string;
}) {
  return (
    <div className="flex h-screen">
      <div className="hidden w-72 bg-slate-900 lg:block" />
      <main className="flex-1 overflow-auto bg-white dark:bg-slate-950">
        <div className="container py-6 md:py-8">
          <div className="mb-6 h-8 w-56 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="mb-4 text-sm font-medium text-slate-500">{title}</div>
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </main>
    </div>
  );
}
