'use client';

type TrendPoint = {
  label: string;
  revenue: number;
  invoiceCount: number;
};

interface DashboardTrendChartProps {
  title: string;
  subtitle: string;
  color: string;
  points: TrendPoint[];
  isDemo?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardTrendChart({
  title,
  subtitle,
  color,
  points,
  isDemo = false,
}: DashboardTrendChartProps) {
  const chartWidth = 640;
  const chartHeight = 220;
  const paddingX = 24;
  const paddingY = 18;
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 1);
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const hasPoints = points.length > 0;
  const hasRevenueData = points.some((point) => point.revenue > 0);
  const path = points
    .map((point, index) => {
      const x =
        paddingX +
        (index * innerWidth) / Math.max(points.length - 1, 1);
      const y =
        chartHeight -
        paddingY -
        (point.revenue / maxRevenue) * innerHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const areaPath = path
    ? `${path} L ${paddingX + innerWidth} ${chartHeight - paddingY} L ${paddingX} ${chartHeight - paddingY} Z`
    : '';
  const totalRevenue = points.reduce((sum, point) => sum + point.revenue, 0);
  const totalInvoices = points.reduce((sum, point) => sum + point.invoiceCount, 0);
  const peakPoint = points.reduce((best, current) =>
    current.revenue > best.revenue ? current : best,
  points[0] ?? { label: '-', revenue: 0, invoiceCount: 0 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            {isDemo ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200">
                Demo
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>
        <div className="grid grid-cols-3 gap-2 text-xs md:text-sm">
          <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
            <div className="text-slate-500 dark:text-slate-400">Revenue</div>
            <div className="mt-1 font-semibold text-slate-900 dark:text-white">
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
            <div className="text-slate-500 dark:text-slate-400">Invoice</div>
            <div className="mt-1 font-semibold text-slate-900 dark:text-white">
              {totalInvoices}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
            <div className="text-slate-500 dark:text-slate-400">Puncak</div>
            <div className="mt-1 font-semibold text-slate-900 dark:text-white">
              {peakPoint.label}
            </div>
          </div>
        </div>

      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-[220px] w-full"
            role="img"
            aria-label={title}
          >
            {[0, 1, 2, 3].map((index) => {
              const y = paddingY + (index * innerHeight) / 3;
              return (
                <line
                  key={index}
                  x1={paddingX}
                  y1={y}
                  x2={paddingX + innerWidth}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="4 6"
                />
              );
            })}

            {hasPoints && areaPath ? (
              <path d={areaPath} fill={color} fillOpacity="0.12" />
            ) : null}
            {hasPoints ? (
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {hasPoints
              ? points.map((point, index) => {
                  const x =
                    paddingX +
                    (index * innerWidth) / Math.max(points.length - 1, 1);
                  const y =
                    chartHeight -
                    paddingY -
                    (point.revenue / maxRevenue) * innerHeight;

                  return (
                    <g key={`${point.label}-${index}`}>
                      <circle cx={x} cy={y} r="4.5" fill={color} />
                      <title>{`${point.label} - ${formatCurrency(point.revenue)} - ${point.invoiceCount} invoice`}</title>
                    </g>
                  );
                })
              : null}

            {!hasRevenueData ? (
              <text
                x={chartWidth / 2}
                y={chartHeight / 2}
                textAnchor="middle"
                className="fill-slate-400 text-sm dark:fill-slate-500"
              >
                {isDemo
                  ? 'Menampilkan data demo untuk preview grafik'
                  : 'Belum ada data revenue pada periode ini'}
              </text>
            ) : null}
          </svg>

          <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(42px,1fr))] gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            {points.map((point) => (
              <div key={point.label} className="truncate text-center">
                {point.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
