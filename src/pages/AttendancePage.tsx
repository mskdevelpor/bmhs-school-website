import { useState, useMemo } from 'react';
import { CalendarCheck, Check, X, Clock, Save, Download, Users as UsersIcon } from 'lucide-react';
import { Card, Badge, SectionHeader, StatCard } from '@/components/ui/Card';
import { Avatar, Select, EmptyState } from '@/components/ui/Common';
import { classes, getStudentsByClass, attendance, getClassById } from '@/data/mockData';
import { formatDate, cn } from '@/lib/utils';

type Status = 'Present' | 'Absent' | 'Late' | 'Leave';
const statusConfig: Record<Status, { icon: React.ReactNode; color: string; bg: string }> = {
  Present: { icon: <Check size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  Absent: { icon: <X size={16} />, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  Late: { icon: <Clock size={16} />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  Leave: { icon: <CalendarCheck size={16} />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
};

export function AttendancePage() {
  const [classId, setClassId] = useState(classes[0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [marks, setMarks] = useState<Record<string, Status>>({});

  const classStudents = useMemo(() => getStudentsByClass(classId), [classId]);
  const cls = getClassById(classId);

  const todayAttendance = attendance.filter((a) => a.classId === classId);
  const presentCount = todayAttendance.filter((a) => a.status === 'Present').length;
  const absentCount = todayAttendance.filter((a) => a.status === 'Absent').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'Late').length;
  const rate = todayAttendance.length > 0 ? Math.round((presentCount / todayAttendance.length) * 100) : 0;

  function setStatus(studentId: string, status: Status) {
    setMarks((m) => ({ ...m, [studentId]: status }));
  }

  function markAll(status: Status) {
    const all: Record<string, Status> = {};
    classStudents.forEach((s) => { all[s.id] = status; });
    setMarks(all);
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Attendance" subtitle="Mark and track daily student attendance"
        action={<button className="btn-secondary"><Download size={16} /> Export Report</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Attendance Rate" value={`${rate}%`} icon={<CalendarCheck size={22} />} color="brand" />
        <StatCard label="Present" value={presentCount} icon={<Check size={22} />} color="brand" />
        <StatCard label="Absent" value={absentCount} icon={<X size={22} />} color="rose" />
        <StatCard label="Late" value={lateCount} icon={<Clock size={22} />} color="amber" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={classId} onChange={setClassId} options={classes.map((c) => ({ value: c.id, label: c.name }))} className="sm:w-48" />
          <div className="flex-1">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <button onClick={() => markAll('Present')} className="btn-secondary"><Check size={16} /> Mark All Present</button>
          <button className="btn-primary"><Save size={16} /> Save Attendance</button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">{cls?.name} — {formatDate(date)}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{classStudents.length} students</p>
        </div>
        {classStudents.length === 0 ? (
          <EmptyState icon={<UsersIcon size={28} />} title="No students in this class" description="Select a different class to mark attendance." />
        ) : (
          <div className="divide-y divide-slate-50">
            {classStudents.map((s) => {
              const current = marks[s.id] || 'Present';
              return (
                <div key={s.id} className="flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors">
                  <Avatar name={s.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.rollNo}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {(['Present', 'Absent', 'Late', 'Leave'] as Status[]).map((st) => {
                      const cfg = statusConfig[st];
                      const active = current === st;
                      return (
                        <button key={st} onClick={() => setStatus(s.id, st)}
                          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                            active ? `${cfg.bg} ${cfg.color}` : 'border-slate-200 text-slate-400 hover:bg-slate-50')}>
                          {cfg.icon} {st}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent attendance summary */}
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Recent Attendance Summary</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header py-3 px-4">Date</th>
                <th className="table-header py-3 px-4">Class</th>
                <th className="table-header py-3 px-4">Present</th>
                <th className="table-header py-3 px-4">Absent</th>
                <th className="table-header py-3 px-4">Rate</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set(attendance.map((a) => a.date))).slice(0, 7).map((d) => {
                const dayRecords = attendance.filter((a) => a.date === d);
                const present = dayRecords.filter((a) => a.status === 'Present').length;
                const absent = dayRecords.filter((a) => a.status === 'Absent').length;
                const r = dayRecords.length > 0 ? Math.round((present / dayRecords.length) * 100) : 0;
                return (
                  <tr key={d} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="table-cell">{formatDate(d)}</td>
                    <td className="table-cell">All Classes</td>
                    <td className="table-cell"><Badge variant="success">{present}</Badge></td>
                    <td className="table-cell"><Badge variant="danger">{absent}</Badge></td>
                    <td className="table-cell"><span className="font-semibold text-brand-600">{r}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
