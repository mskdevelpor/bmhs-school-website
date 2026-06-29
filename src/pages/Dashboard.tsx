import { useEffect, useState } from 'react';
import {
  Users, GraduationCap, Wallet, CalendarCheck, TrendingUp,
  ArrowRight, Megaphone, Award, Clock, AlertCircle, Loader2,
} from 'lucide-react';
import { Card, StatCard, Badge } from '@/components/ui/Card';
import { SCHOOL } from '@/data/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface DashboardProps { onNavigate: (path: string) => void; }

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalClasses: number;
  feesCollected: number;
  feesPending: number;
  feeBreakdown: { paid: number; partial: number; unpaid: number; overdue: number };
  feeTotal: number;
  attendanceRate: number;
  attendanceTrend: { day: string; rate: number }[];
  classDist: { name: string; count: number }[];
  recentAnnouncements: {
    id: string; title: string; content: string; priority: string;
    date: string; created_by: string | null;
  }[];
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        // 1. Total active students count
        const { count: totalStudents, error: studentsErr } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });
        if (studentsErr) throw studentsErr;

        const { count: activeStudents, error: activeStudentsErr } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Active');
        if (activeStudentsErr) throw activeStudentsErr;

        // 2. Total active teachers count
        const { count: totalTeachers, error: teachersErr } = await supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Active');
        if (teachersErr) throw teachersErr;

        // 3. Total classes count
        const { count: totalClasses, error: classesErr } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });
        if (classesErr) throw classesErr;

        // 4. Fees stats — fetch all fee records for aggregation
        const { data: feesData, error: feesErr } = await supabase
          .from('fees')
          .select('amount, paid_amount, status');
        if (feesErr) throw feesErr;

        const fees = feesData ?? [];
        const feesCollected = fees.reduce((sum, f) => sum + Number(f.paid_amount), 0);
        const feesPending = fees.reduce((sum, f) => sum + (Number(f.amount) - Number(f.paid_amount)), 0);
        const feeBreakdown = {
          paid: fees.filter((f) => f.status === 'Paid').length,
          partial: fees.filter((f) => f.status === 'Partial').length,
          unpaid: fees.filter((f) => f.status === 'Unpaid').length,
          overdue: fees.filter((f) => f.status === 'Overdue').length,
        };

        // 5. Recent announcements (last 5)
        const { data: announcementsData, error: announcementsErr } = await supabase
          .from('announcements')
          .select('id, title, content, priority, date, created_by')
          .order('date', { ascending: false })
          .limit(5);
        if (announcementsErr) throw announcementsErr;

        // 6. Attendance for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const startDateStr = sevenDaysAgo.toISOString().split('T')[0];

        const { data: attendanceData, error: attendanceErr } = await supabase
          .from('attendance')
          .select('date, status')
          .gte('date', startDateStr);
        if (attendanceErr) throw attendanceErr;

        const attendanceRecords = attendanceData ?? [];
        const presentCount = attendanceRecords.filter((a) => a.status === 'Present').length;
        const attendanceRate = attendanceRecords.length > 0
          ? Math.round((presentCount / attendanceRecords.length) * 100)
          : 0;

        // Build weekly attendance trend (group by date)
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayMap = new Map<string, { present: number; total: number }>();
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          dayMap.set(key, { present: 0, total: 0 });
        }
        attendanceRecords.forEach((a) => {
          const key = a.date;
          if (dayMap.has(key)) {
            const entry = dayMap.get(key)!;
            entry.total += 1;
            if (a.status === 'Present') entry.present += 1;
          }
        });
        const attendanceTrend = Array.from(dayMap.entries()).map(([dateKey, val]) => {
          const d = new Date(dateKey + 'T00:00:00');
          return {
            day: weekDays[d.getDay()],
            rate: val.total > 0 ? Math.round((val.present / val.total) * 100) : 0,
          };
        });

        // 7. Students by class distribution
        const { data: studentsByClass, error: distErr } = await supabase
          .from('students')
          .select('class_id');
        if (distErr) throw distErr;

        const { data: classesData, error: classesDataErr } = await supabase
          .from('classes')
          .select('id, name')
          .order('sort_order', { ascending: true });
        if (classesDataErr) throw classesDataErr;

        const countByClass = new Map<string, number>();
        (studentsByClass ?? []).forEach((s) => {
          const cid = s.class_id;
          if (cid) countByClass.set(cid, (countByClass.get(cid) ?? 0) + 1);
        });
        const classDist = (classesData ?? []).map((c) => ({
          name: c.name,
          count: countByClass.get(c.id) ?? 0,
        }));

        if (cancelled) return;

        setStats({
          totalStudents: totalStudents ?? 0,
          activeStudents: activeStudents ?? 0,
          totalTeachers: totalTeachers ?? 0,
          totalClasses: totalClasses ?? 0,
          feesCollected,
          feesPending,
          feeBreakdown,
          feeTotal: fees.length,
          attendanceRate,
          attendanceTrend,
          classDist,
          recentAnnouncements: (announcementsData ?? []).map((a) => ({
            id: a.id,
            title: a.title,
            content: a.content,
            priority: a.priority,
            date: a.date,
            created_by: a.created_by,
          })),
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading dashboard…</p>
      </div>
    );
  }

  // --- Error state ---
  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Unable to load dashboard</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md">{error ?? 'Unknown error occurred'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 btn bg-brand-600 text-white hover:bg-brand-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const maxRate = Math.max(...stats.attendanceTrend.map((t) => t.rate), 1);
  const maxClassCount = Math.max(...stats.classDist.map((d) => d.count), 1);
  const collectionRate = stats.feeTotal > 0
    ? Math.round((stats.feeBreakdown.paid / stats.feeTotal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="p-6 sm:p-8 relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute right-12 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <img src="/logo.png" alt="BMS" className="w-12 h-12 rounded-xl object-cover bg-white/90 p-0.5" />
              <div>
                <p className="text-brand-100 text-sm font-medium">Welcome back, Admin</p>
                <h1 className="text-2xl sm:text-3xl font-bold font-display">{SCHOOL.name}</h1>
              </div>
            </div>
            <p className="mt-2 text-brand-100 text-sm max-w-lg">{SCHOOL.tagline} — Session {SCHOOL.currentSession}, {SCHOOL.currentTerm}</p>
            <p className="mt-1 text-brand-100 text-xs">{SCHOOL.address} • Affiliated with {SCHOOL.affiliation}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => onNavigate('/students')} className="btn bg-white text-brand-700 hover:bg-brand-50"><Users size={16} /> View Students</button>
              <button onClick={() => onNavigate('/attendance')} className="btn bg-brand-500/30 text-white border border-white/20 hover:bg-brand-500/40"><CalendarCheck size={16} /> Mark Attendance</button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.totalStudents} icon={<Users size={22} />} trend={{ value: `${stats.activeStudents} active`, up: true }} color="brand" />
        <StatCard label="Total Teachers" value={stats.totalTeachers} icon={<GraduationCap size={22} />} trend={{ value: `${stats.totalClasses} classes`, up: true }} color="blue" />
        <StatCard label="Fees Collected" value={formatCurrency(stats.feesCollected)} icon={<Wallet size={22} />} trend={{ value: `${formatCurrency(stats.feesPending)} pending`, up: false }} color="amber" />
        <StatCard label="Attendance Rate" value={`${stats.attendanceRate}%`} icon={<CalendarCheck size={22} />} trend={{ value: 'Last 7 days', up: true }} color="rose" />
      </div>

      {/* PEF Affiliation Banner */}
      <Card className="overflow-hidden border-0 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
            <Award className="text-amber-400" size={32} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h3 className="text-lg font-bold font-display text-amber-400">Affiliated with Punjab Education Foundation (PEF)</h3>
              <Badge variant="success" className="bg-amber-400/20 text-amber-300 border-amber-400/30">Recognized</Badge>
            </div>
            <p className="mt-1 text-sm text-emerald-100">{SCHOOL.name} is a PEF-affiliated institution providing quality education under the Punjab Education Foundation program. Established {SCHOOL.established}.</p>
          </div>
          <div className="flex-shrink-0 text-center sm:text-right">
            <p className="text-3xl font-bold font-display text-amber-400">PEF</p>
            <p className="text-xs text-emerald-200">Govt. of Punjab</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="font-semibold text-slate-900">Weekly Attendance</h3><p className="text-sm text-slate-500">Last 7 days attendance rate</p></div>
            <Badge variant="success"><TrendingUp size={12} /> {stats.attendanceRate}% avg</Badge>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {stats.attendanceTrend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div className="w-full bg-gradient-to-t from-brand-500 to-brand-400 rounded-t-lg transition-all duration-500 hover:from-brand-600 hover:to-brand-500 relative group" style={{ height: `${(t.rate / maxRate) * 100}%` }}>
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">{t.rate}%</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium">{t.day}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Fee Status</h3>
          <p className="text-sm text-slate-500 mb-5">Current term collection</p>
          <div className="space-y-3">
            {[
              { label: 'Paid', count: stats.feeBreakdown.paid, color: 'bg-emerald-500', text: 'text-emerald-600' },
              { label: 'Partial', count: stats.feeBreakdown.partial, color: 'bg-amber-500', text: 'text-amber-600' },
              { label: 'Unpaid', count: stats.feeBreakdown.unpaid, color: 'bg-slate-400', text: 'text-slate-500' },
              { label: 'Overdue', count: stats.feeBreakdown.overdue, color: 'bg-rose-500', text: 'text-rose-600' },
            ].map((item) => {
              const pct = stats.feeTotal > 0 ? (item.count / stats.feeTotal) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                    <span className={`text-sm font-semibold ${item.text}`}>{item.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Collection Rate</span>
              <span className="text-lg font-bold font-display text-slate-900">{collectionRate}%</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-1">Students by Class</h3>
          <p className="text-sm text-slate-500 mb-5">Distribution across all classes</p>
          <div className="space-y-3">
            {stats.classDist.map((c, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700 w-20">{c.name}</span>
                <div className="flex-1 h-7 bg-slate-50 rounded-lg overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-lg flex items-center justify-end pr-2 transition-all duration-500" style={{ width: `${(c.count / maxClassCount) * 100}%` }}>
                    <span className="text-xs font-semibold text-white">{c.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="font-semibold text-slate-900">Recent Announcements</h3><p className="text-sm text-slate-500">Latest updates</p></div>
            <Megaphone size={20} className="text-brand-500" />
          </div>
          <div className="space-y-3">
            {stats.recentAnnouncements.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No announcements yet</p>
            ) : (
              stats.recentAnnouncements.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="p-2 rounded-lg bg-brand-50 text-brand-600 flex-shrink-0"><Megaphone size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                      {a.priority === 'High' && <Badge variant="danger">High</Badge>}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{a.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(a.date)} • {a.created_by ?? 'Administration'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900">Recent Announcements</h3>
            <button onClick={() => onNavigate('/announcements')} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">View all <ArrowRight size={14} /></button>
          </div>
          <div className="space-y-3">
            {stats.recentAnnouncements.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No announcements yet</p>
            ) : (
              stats.recentAnnouncements.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="p-2 rounded-lg bg-brand-50 text-brand-600 flex-shrink-0"><Megaphone size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                      {a.priority === 'High' && <Badge variant="danger">High</Badge>}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{a.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(a.date)} • {a.created_by ?? 'Administration'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 mb-5">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Add Student', icon: Users, path: '/students' },
              { label: 'Mark Attendance', icon: CalendarCheck, path: '/attendance' },
              { label: 'Collect Fees', icon: Wallet, path: '/fees' },
              { label: 'Add Announcement', icon: Megaphone, path: '/announcements' },
              { label: 'View Timetable', icon: Clock, path: '/timetable' },
            ].map((action) => (
              <button key={action.label} onClick={() => onNavigate(action.path)} className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors group">
                <span className="p-2 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors"><action.icon size={16} /></span>
                {action.label}
                <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-brand-500" />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
