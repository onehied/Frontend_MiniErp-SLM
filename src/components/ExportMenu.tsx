'use client';

import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ExportMenuProps {
  onExport: (format: 'excel' | 'pdf') => void;
}

export default function ExportMenu({ onExport }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) {
        return;
      }

      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        <Download size={15} />
        Export
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <button
            type="button"
            onClick={() => {
              onExport('excel');
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => {
              onExport('pdf');
              setOpen(false);
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <FileText size={15} className="text-rose-600" />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
