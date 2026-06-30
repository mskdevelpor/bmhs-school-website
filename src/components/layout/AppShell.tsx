import { type ReactNode, useState } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, UserCog, CalendarCheck,
  Wallet, ClipboardList, BookOpen, CalendarDays, Megaphone, Settings,
  Menu, Bell, ChevronDown, LogOut, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCHOOL } from '@/data/mockData';
import { Avatar } from '@/components/ui/Common';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/types';

interface NavItem { path: string; label: string; icon: ReactNode; badge?: string; }

const ALL_NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: 'Overview', items: [{ path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> }] },
  {
    title: 'People',
    items: [
      { path: '/students', label: 'Students', icon: <Users size={18} />, badge: '48' },
      { path: '/teachers', label: 'Teachers', icon: <GraduationCap size={18} />, badge: '8' },
      { path: '/parents', label: 'Parents', icon: <UserCog size={18} /> },
    ],
  },
  {
    title: 'Academics',
    items: [
      { path: '/attendance', label: 'Attendance', icon: <CalendarCheck size={18} /> },
      { path: '/results', label: 'Results & Exams', icon: <ClipboardList size={18} /> },
      { path: '/classes', label: 'Classes & Subjects', icon: <BookOpen size={18} /> },
      { path: '/timetable', label: 'Timetable', icon: <CalendarDays size={18} /> },
    ],
  },
  {
    title: 'Administration',
    items: [
      { path: '/fees', label: 'Fees', icon: <Wallet size={18} /> },
      { path: '/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
      { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
    ],
  },
];

const ROLE_NAV: Record<Role, string[]> = {
  admin: ['/dashboard', '/students', '/teachers', '/parents', '/attendance', '/results', '/classes', '/timetable', '/fees', '/announcements', '/settings'],
  teacher: ['/dashboard', '/attendance', '/results', '/timetable', '/announcements'],
  parent: ['/dashboard', '/results', '/fees', '/announcements'],
  student: ['/dashboard', '/results', '/timetable', '/announcements'],
};

function getNavGroups(role: Role) {
  const allowed = ROLE_NAV[role];
  return ALL_NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => allowed.includes(i.path)) })).filter((g) => g.items.length > 0);
}

interface AppShellProps { currentPath: string; onNavigate: (path: string) => void; children: ReactNode; }

export function AppShell({ currentPath, onNavigate, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navGroups = user ? getNavGroups(user.role) : [];

  const pageTitle = (() => {
    for (const g of navGroups) for (const i of g.items) if (currentPath === i.path) return i.label;
    return 'Dashboard';
  })();

  function handleNav(path: string) { onNavigate(path); setMobileOpen(false); }
  function handleLogout() { logout(); onNavigate('/login'); setProfileOpen(false); }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-slate-200">
        <SidebarContent currentPath={currentPath} onNav={handleNav} />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white border-r border-slate-200 animate-slide-in">
            <SidebarContent currentPath={currentPath} onNav={handleNav} />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"><Menu size={20} /></button>
              <h2 className="text-lg font-bold font-display text-slate-900">{pageTitle}</h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700">
                <Phone size={14} />
                <span className="text-sm font-medium">{SCHOOL.principalPhone}</span>
              </div>
              <button className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>
              <div className="relative">
                <button onClick={() => setProfileOpen((o) => !o)} className="flex items-center gap-2 p-1.5 pr-2 rounded-xl hover:bg-slate-100 transition-colors">
                  <Avatar name={user?.name || 'User'} size="sm" />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-slate-800 leading-tight capitalize">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 leading-tight capitalize">{user?.role || ''}</p>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-pop border border-slate-200 py-1.5 z-20 animate-scale-in">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                      {user?.role === 'admin' && <button onClick={() => { handleNav('/settings'); setProfileOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"><Settings size={16} /> Settings</button>}
                      <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"><LogOut size={16} /> Sign out</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto animate-fade-in">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ currentPath, onNav }: { currentPath: string; onNav: (p: string) => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100">
        <img src="/logo.png" alt="BMS Logo" className="w-10 h-10 rounded-lg object-cover" />
        <div>
          <p className="font-bold font-display text-slate-900 leading-tight text-sm">{SCHOOL.shortName}</p>
          <p className="text-xs text-slate-500 leading-tight">{SCHOOL.name}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = currentPath === item.path;
                return (
                  <button key={item.path} onClick={() => onNav(item.path)} className={cn('sidebar-link w-full', active && 'sidebar-link-active')}>
                    <span className={cn(active ? 'text-brand-600' : 'text-slate-400')}>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500')}>{item.badge}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
          <p className="text-sm font-semibold">{SCHOOL.principal}</p>
          <p className="text-xs text-brand-100 mt-0.5">Principal</p>
          <p className="text-xs text-brand-100 mt-1 flex items-center gap-1"><Phone size={11} /> {SCHOOL.principalPhone}</p>
        </div>
      </div>
    </>
  );
}
