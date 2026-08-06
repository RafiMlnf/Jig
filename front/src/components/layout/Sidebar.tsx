'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { canEdit, type AppRole } from '@/lib/rbac';

interface MenuItem {
  name: string;
  icon: string;
  href: string;
  badge?: number;
  /** Roles allowed to see this item. If undefined, all roles can see it. */
  allowedRoles?: AppRole[];
}

const ALL_MENU_ITEMS: MenuItem[] = [
  {
    name: 'View Data',
    icon: 'table_view',
    href: '/view-data',
    // visible to all roles
  },
  {
    name: 'Update Design',
    icon: 'design_services',
    href: '/update-design',
    allowedRoles: ['PE_JIG_FIXTURE'],               // Update → PIC only
  },
  {
    name: 'Update Abnormality',
    icon: 'report_problem',
    href: '/update-abnormality',
    allowedRoles: ['PE_JIG_FIXTURE'],               // Update → PIC only
  },
  {
    name: 'Update Inventory (F1)',
    icon: 'inventory_2',
    href: '/inventory',
    allowedRoles: ['PE_JIG_FIXTURE'],               // Update → PIC only
  },
  {
    name: 'Approval Center (F2)',
    icon: 'fact_check',
    href: '/approval-center',
    allowedRoles: ['PE_JIG_FIXTURE', 'PE_SECTION_HEAD', 'PE_DEPT_HEAD'], // NOT Tamu
  },
];

const getRoleLabel = (role?: AppRole | null) => {
  if (role === 'PE_JIG_FIXTURE') return 'Admin / PIC Jig Fixture';
  if (role === 'PE_SECTION_HEAD') return 'Section Head View';
  if (role === 'PE_DEPT_HEAD') return 'Dept Head View';
  if (role === 'TAMU') return 'Guest (View Only)';
  return 'Loading…';
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading, approvals } = useApp();
  const role = user?.role ?? null;

  // Filter menu items based on current user's role and compute badge count dynamically
  const visibleItems = ALL_MENU_ITEMS.map((item) => {
    if (item.href === '/approval-center') {
      const waitingCount = approvals.filter((a) => a.status === 'WAITING').length;
      return { ...item, badge: waitingCount };
    }
    return item;
  }).filter((item) => {
    if (isLoading) return false; // hide all until auth resolves
    if (!item.allowedRoles) return true; // no restriction → everyone
    return role !== null && item.allowedRoles.includes(role);
  });

  // "Submit Revision" footer button only for PIC
  const showSubmitBtn = !isLoading && canEdit(role);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const { logout } = useApp();

  return (
    <aside className="w-56 bg-surface-container-low border-r border-outline-variant flex flex-col h-full z-10 shrink-0">
      
      {/* Import ENOCH Font */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.cdnfonts.com/css/enoch');
      `}} />

      {/* Header */}
      <div className="p-4 border-b border-outline-variant">
        <h1 className="text-[25px] text-on-surface leading-none mb-1.5" style={{ fontFamily: "'ENOCH', sans-serif", fontWeight: 'normal' }}>
          JIG FIXTURES
        </h1>
        <p className="text-[10px] text-on-surface-variant font-semibold" style={{ fontFamily: "'Product Sans', 'Inter', sans-serif" }}>
          {isLoading ? 'Loading…' : getRoleLabel(role)}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex flex-col gap-1 px-3 py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 py-2 px-3 mx-2 rounded-lg transition-all group ${
                      isActive
                        ? 'bg-secondary-container text-on-secondary-container font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-base transition-transform ${
                        !isActive && 'group-hover:scale-110'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="font-medium text-xs flex-1">{item.name}</span>
                    {item.badge !== undefined && (
                      <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}

            {/* Guest: show view-only notice */}
            {role === 'TAMU' && (
              <li className="mx-3 mt-2 px-2 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-[9px] text-yellow-700 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[11px]">visibility</span>
                  Mode baca saja (View Only)
                </p>
              </li>
            )}
          </ul>
        )}
      </nav>

      {/* Footer Container */}
      <div className="p-3 border-t border-outline-variant mt-auto flex flex-col gap-2.5">
        {showSubmitBtn && (
          <button className="w-full py-1.5 px-3 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-opacity-90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
            <span className="material-symbols-outlined text-sm">add</span>
            Submit Revision
          </button>
        )}

        {/* User Profile and Logout */}
        <div className="flex items-center justify-between bg-surface-container-highest/20 border border-outline-variant/30 rounded-xl p-2 mt-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold shrink-0">
              {user ? getInitials(user.name) : 'PE'}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-on-surface truncate leading-none mb-1">
                {user?.name || 'Guest User'}
              </p>
              <p className="text-[8px] text-on-surface-variant truncate leading-none">
                {isLoading ? 'Loading' : getRoleLabel(role)}
              </p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-on-surface-variant hover:text-red-500 transition-colors cursor-pointer shrink-0 ml-1.5 flex items-center"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
