import {
  Users, GraduationCap, Wallet, CalendarCheck, TrendingUp,
  ArrowRight, Megaphone, Award, Clock,
} from 'lucide-react';
import { Card, StatCard, Badge } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Common';
import {
  students, teachers, feeInvoices, attendance, announcements, classes,
  examResults, SCHOOL,
} from '@/data/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DashboardProps { onNavigate: (path: string) => void; }

export function Dashboard({ onNavigate }: DashboardProps) {
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const activeStudents = students.filter((s) => s.status === 'Active').length;
  const totalRevenue = feeInvoices.reduce((sum, f) => sum + f.paid, 0);
  const pendingFees = feeInvoices.filter((f) => f.status !== 'Paid').reduce((sum, f) => sum + (f.amount - f.paid), 0);
  const attendanceRate = attendance.length > 0 ? Math.round((attendance.filter((a) => a.status === 'Present').length / attendance.length) * 100) : 0;

  const studentAverages = students.slice(0, 24).map((s) => {
    const results = examResults.filter((r) => r.studentId === s.id);
    const avg = results.length > 0 ? results.reduce((sum, r) => sum + r.marks, 0) / results.length : 0;
    return { student: s, avg };
  }).sort((a, b) => b.avg - a.avg).slice(0, 5);

  const classDist = classes.map((c) => ({ name: c.name, count: students.filter((s) => s.classId === c.id).length }));

  const feeBreakdown = {
    paid: feeInvoices.filter((f) => f.status === 'Paid').length,
    partial: feeInvoices.filter((f) => f.status === 'Partial').length,
    unpaid: feeInvoices.filter((f) => f.status === 'Unpaid').length,
    overdue: feeInvoices.filter((f) => f.status === 'Overdue').length,
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const attendanceTrend = weekDays.map((day, i) => ({ day, rate: 80 + Math.round(Math.sin(i * 0.8) * 8 + 8) }));
  const maxRate = Math.max(...attendanceTrend.map((t) => t.rate));

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
        <StatCard label="Total Students" value={totalStudents} icon={<Users size={22} />} trend={{ value: `${activeStudents} active`, up: true }} color="brand" />
        <StatCard label="Total Teachers" value={totalTeachers} icon={<GraduationCap size={22} />} trend={{ value: 'All assigned', up: true }} color="blue" />
        <StatCard label="Fees Collected" value={formatCurrency(totalRevenue)} icon={<Wallet size={22} />} trend={{ value: `${formatCurrency(pendingFees)} pending`, up: false }} color="amber" />
        <StatCard label="Attendance Rate" value={`${attendanceRate}%`} icon={<CalendarCheck size={22} />} trend={{ value: 'This week', up: true }} color="rose" />
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
            <Badge variant="success"><TrendingUp size={12} /> {attendanceRate}% avg</Badge>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {attendanceTrend.map((t) => (
              <div key={t.day} className="flex-1 flex flex-col items-center gap-2">
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
              { label: 'Paid', count: feeBreakdown.paid, color: 'bg-emerald-500', text: 'text-emerald-600' },
              { label: 'Partial', count: feeBreakdown.partial, color: 'bg-amber-500', text: 'text-amber-600' },
              { label: 'Unpaid', count: feeBreakdown.unpaid, color: 'bg-slate-400', text: 'text-slate-500' },
              { label: 'Overdue', count: feeBreakdown.overdue, color: 'bg-rose-500', text: 'text-rose-600' },
            ].map((item) => {
              const pct = feeInvoices.length > 0 ? (item.count / feeInvoices.length) * 100 : 0;
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
              <span className="text-lg font-bold font-display text-slate-900">{Math.round((feeBreakdown.paid / feeInvoices.length) * 100)}%</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-1">Students by Class</h3>
          <p className="text-sm text-slate-500 mb-5">Distribution across all classes</p>
          <div className="space-y-3">
            {classDist.map((c) => {
              const maxCount = Math.max(...classDist.map((d) => d.count));
              return (
                <div key={c.name} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-700 w-20">{c.name}</span>
                  <div className="flex-1 h-7 bg-slate-50 rounded-lg overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-lg flex items-center justify-end pr-2 transition-all duration-500" style={{ width: `${(c.count / maxCount) * 100}%` }}>
                      <span className="text-xs font-semibold text-white">{c.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="font-semibold text-slate-900">Top Performers</h3><p className="text-sm text-slate-500">By average marks</p></div>
            <Award size={20} className="text-amber-500" />
          </div>
          <div className="space-y-3">
            {studentAverages.map((item, i) => (
              <div key={item.student.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                <Avatar name={item.student.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.student.name}</p>
                  <p className="text-xs text-slate-500">{item.student.rollNo}</p>
                </div>
                <span className="text-sm font-bold text-brand-600">{Math.round(item.avg)}%</span>
              </div>
            ))}
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
            {announcements.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="p-2 rounded-lg bg-brand-50 text-brand-600 flex-shrink-0"><Megaphone size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                    {a.priority === 'High' && <Badge variant="danger">High</Badge>}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{a.body}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(a.date)} • {a.author}</p>
                </div>
              </div>
            ))}
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
