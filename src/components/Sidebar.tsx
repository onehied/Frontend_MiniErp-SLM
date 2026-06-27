'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import BrandLogo from './BrandLogo';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  UserCog,
  History,
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);

  useEffect(() => {
    const updateByScreen = () => {
      setCollapsed(window.innerWidth < 1024);
    };

    updateByScreen();
    window.addEventListener('resize', updateByScreen);
    return () => window.removeEventListener('resize', updateByScreen);
  }, []);

  const mainMenus = useMemo(
    () => [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'USER'] },
      { href: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'USER'] },
      { href: '/invoices', label: 'Invoices', icon: FileText, roles: ['ADMIN', 'USER'] },
    ],
    [],
  );

  const settingsMenus = useMemo(
    () => [
      { href: '/users', label: 'User', icon: UserCog, roles: ['ADMIN'] },
      { href: '/roles', label: 'Hak Akses', icon: Shield, roles: ['ADMIN'] },
      { href: '/activity_logs', label: 'Activity Logs', icon: History, roles: ['ADMIN'] },
    ],
    [],
  );

  const userRoles = user?.roles ?? [];
  const visibleMainMenus = mainMenus.filter((menu) =>
    menu.roles.some((role) => userRoles.includes(role)),
  );
  const visibleSettingsMenus = settingsMenus.filter((menu) =>
    menu.roles.some((role) => userRoles.includes(role)),
  );

  return (
    <aside
      className={`flex flex-col min-h-screen bg-[#0F172A] text-slate-100 py-6 shadow-soft transition-all duration-500 ease-out ${
        collapsed ? 'w-24 px-4' : 'w-72 px-6'
      }`}
    >
      <div className="mb-8">
        <div className={`flex items-center ${collapsed ? 'justify-center gap-4' : 'justify-between gap-3'} transition-all duration-300`}>
          <BrandLogo compact={collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 transition"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {!collapsed && (
          <p className="px-4 pb-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">Main Menu</p>
        )}

        {visibleMainMenus.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="tooltip-trigger flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-100 hover:bg-slate-800 transition"
              data-tooltip={collapsed ? item.label : ''}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {visibleSettingsMenus.length > 0 && (
          <div className="pt-3">
            {!collapsed ? (
              <button
                type="button"
                onClick={() => setSettingsOpen((prev) => !prev)}
                className="mb-2 flex w-full items-center justify-between rounded-xl px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300 hover:bg-slate-800"
              >
                <span>Setting</span>
                {settingsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            ) : null}

            {collapsed ? (
              visibleSettingsMenus.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="tooltip-trigger flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-100 hover:bg-slate-800 transition"
                    data-tooltip={item.label}
                  >
                    <Icon size={18} />
                  </Link>
                );
              })
            ) : (
              <div
                className={`grid transition-all duration-300 ease-out ${
                  settingsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-1">
                    {visibleSettingsMenus.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="tooltip-trigger flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-100 hover:bg-slate-800 transition"
                          data-tooltip={collapsed ? item.label : ''}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}
