'use client';

import { EllipsisVertical, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface TableActionItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
}

interface TableActionsMenuProps {
  actions: TableActionItem[];
}

export default function TableActionsMenu({ actions }: TableActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="tooltip-trigger inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-label="Open row actions"
        data-tooltip="Buka menu aksi"
      >
        <EllipsisVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-full top-0 z-30 mr-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
                className={`tooltip-trigger flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800 ${action.className || 'text-slate-700 dark:text-slate-100'}`}
                data-tooltip={action.label}
              >
                <Icon size={15} />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
