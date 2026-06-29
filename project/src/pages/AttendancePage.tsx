import { useState, useMemo, useEffect, useCallback } from 'react';
import { CalendarCheck, Check, X, Clock, Save, Download, Users as UsersIcon, Loader2, AlertCircle } from 'lucide-react';
import { Card, Badge, SectionHeader, StatCard } from '@/components/ui/Card';
import { Avatar, Select, EmptyState } from '@/components/ui/Common';
import { supabase } from '@/lib/supabase';
import { formatDate, cn } from '@/lib/utils';

type Status = 'Present' | 'Absent' | 'Late' | 'Leave';
const statusConfig: Record<Status, { icon: React.ReactNode; color: string; bg: string }> = {
  Present: { icon: <Check size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  Absent: { icon: <X size={16} />, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  Late: { icon: <Clock size={16} />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  Leave: { icon: <CalendarCheck size={16} />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
};

// ---- Supabase row types (snake_case as stored in DB) ----

interface StudentRow {
  id: string;
  roll_no: string;
  name: string;
  class_id: string | null;
  section: string | null;
  status: string;
}

interface ClassRow {
  id: string;
  name: string;
  level: string;
  sections: string[];
  room: string | null;
  capacity: number;
}

interface AttendanceRow {
  id: string;
  student_id: string;
  class_id: string | null;
  date: string;
  status: string;
  notes: string | null;
}

// ---- mappers: snake_case DB row -> camelCase UI type ----

interface Student {
  id: string;
  rollNo: string;
  name: string;
  classId: string;
  section: string;
  status: string;
}

function mapStudent(r: StudentRow): Student {
  return {
    id: r.id,
    rollNo: r.roll_no,
    name: r.name,
    classId: r.class_id ?? '',
    section: r.section ?? 'A',
    status: r.status,
  };
}

export function AttendancePage() {
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('students')
      .select('id, roll_no, name, class_id, section, status')
      .order('name', { ascending: true });
    if (fetchError) {
      setError(fetchError.message);
      setStudents([]);
    } else {
      setStudents((data as StudentRow[]).map(mapStudent));
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('classes')
      .select('id, name, level, sections, room, capacity')
      .order('name', { ascending: true });
    if (fetchError) {
      setClasses([]);
    } else {
      setClasses(data as ClassRow[]);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('attendance')
      .select('id, student_id, class_id, date, status, notes')
      .order('date', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
      setAttendance([]);
    } else {
      setAttendance(data as AttendanceRow[]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchStudents(), fetchClasses(), fetchAttendance()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchStudents, fetchClasses, fetchAttendance]);

  // Default to the first class once classes are loaded.
  useEffect(() => {
    if (!classId && classes.length > 0) {
      setClassId(classes[0].id);
    }
  }, [classId, classes]);

  const classStudents = useMemo(
    () => students.filter((s) => s.classId === classId),
    [students, classId],
  );
  const cls = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);

  // Seed marks from existing attendance whenever class or date changes.
  useEffect(() => {
    const existing = attendance.filter(
      (a) => a.class_id === classId && a.date === date,
    );
    const seeded: Record<string, Status> = {};
    existing.forEach((a) => {
      seeded[a.student_id] = a.status as Status;
    });
    setMarks(seeded);
  }, [classId, date, attendance]);

  const todayAttendance = useMemo(
    () => attendance.filter((a) => a.class_id === classId && a.date === date),
    [attendance, classId, date],
  );
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

  async function saveAttendance() {
    setSaving(true);
    setSaveError(null);

    // Build upsert rows from current marks for the selected class + date.
    const rows = classStudents
      .filter((s) => marks[s.id])
      .map((s) => ({
        student_id: s.id,
        class_id: classId,
        date,
        status: marks[s.id],
        notes: null,
      }));

    if (rows.length === 0) {
      setSaveError('No attendance marks to save.');
      setSaving(false);
      return;
    }

    // Upsert by the (student_id, date, class_id) combination. For each student
    // we either insert a new row or update the existing one for this date.
    const results = await Promise.all(
      rows.map((row) =>
        supabase
          .from('attendance')
          .upsert(row, { onConflict: 'student_id,date,class_id' })
          .select('id, student_id, class_id, date, status, notes')
          .maybeSingle(),
      ),
    );

    const firstError = results.find((r) => r.error)?.error;
    if (firstError) {
      setSaveError(firstError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    await fetchAttendance();
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <SectionHeader title="Attendance" subtitle="Mark and track daily student attendance" />
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading attendance...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <SectionHeader title="Attendance" subtitle="Mark and track daily student attendance" />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 mb-4"><AlertCircle size={28} /></div>
          <h3 className="text-base font-semibold text-slate-700">Failed to load attendance</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); Promise.all([fetchStudents(), fetchClasses(), fetchAttendance()]).finally(() => setLoading(false)); }} className="mt-4 btn-primary">Retry</button>
        </div>
      </div>
    );
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
          <button onClick={saveAttendance} disabled={saving} className="btn-primary inline-flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Attendance
          </button>
        </div>
        {saveError && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-sm">
            <AlertCircle size={16} />
            <span>{saveError}</span>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">{cls?.name ?? '—'} — {formatDate(date)}</h3>
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
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-500">No attendance records yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
