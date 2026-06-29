import { useState, useEffect, useCallback, useMemo } from 'react';
import { BookOpen, Plus, Users, GraduationCap, Eye, Edit, Trash2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui/Card';
import { Avatar, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import type { ClassInfo, Teacher } from '@/types';

// Raw row shapes returned by Supabase (snake_case).
interface ClassRow {
  id: string;
  name: string;
  level: string;
  sections: string[] | null;
  class_teacher_id: string | null;
  room: string | null;
  capacity: number;
  sort_order: number;
}

interface TeacherRow {
  id: string;
  name: string;
  qualification: string | null;
}

interface StudentRow {
  id: string;
  name: string;
  roll_no: string | null;
}

interface SubjectRow {
  id: string;
  name: string;
  code: string | null;
  teacher_id: string | null;
  full_marks: number;
}

function mapClass(r: ClassRow): ClassInfo {
  return {
    id: r.id,
    name: r.name,
    level: r.level,
    sections: r.sections ?? [],
    classTeacherId: r.class_teacher_id ?? null,
    room: r.room ?? '',
    capacity: r.capacity,
    sortOrder: r.sort_order,
  };
}

function mapTeacher(r: TeacherRow): Teacher {
  return {
    id: r.id,
    name: r.name,
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    subjects: [],
    classId: undefined,
    qualification: r.qualification ?? '',
    joinDate: '',
    salary: 0,
    status: 'Active',
    photoUrl: null,
  };
}

const LEVELS = ['Pre-Primary', 'Primary', 'Middle', 'Secondary'] as const;
type Level = (typeof LEVELS)[number];

interface FormState {
  name: string;
  level: Level;
  room: string;
  capacity: string;
  classTeacherId: string;
  sections: string;
  sortOrder: string;
}

export function ClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClassInfo | null>(null);

  const fetchClasses = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('classes')
      .select('id, name, level, sections, class_teacher_id, room, capacity, sort_order')
      .order('sort_order', { ascending: true });
    if (err) {
      setError(err.message);
      return;
    }
    setError(null);
    setClasses((data as ClassRow[]).map(mapClass));
  }, []);

  const fetchTeachers = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('teachers')
      .select('id, name, qualification')
      .order('name', { ascending: true });
    if (err) {
      setError(err.message);
      return;
    }
    setTeachers((data as TeacherRow[]).map(mapTeacher));
  }, []);

  const fetchStudentCounts = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('students')
      .select('class_id');
    if (err) {
      return;
    }
    const counts: Record<string, number> = {};
    for (const row of (data as { class_id: string | null }[]) ?? []) {
      if (row.class_id) {
        counts[row.class_id] = (counts[row.class_id] ?? 0) + 1;
      }
    }
    setStudentCounts(counts);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchClasses(), fetchTeachers(), fetchStudentCounts()]);
    setLoading(false);
  }, [fetchClasses, fetchTeachers, fetchStudentCounts]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const teacherMap = useMemo(() => {
    const m = new Map<string, Teacher>();
    for (const t of teachers) m.set(t.id, t);
    return m;
  }, [teachers]);

  const cls = selectedClass ? classes.find((c) => c.id === selectedClass) ?? null : null;
  const classTeacher = cls?.classTeacherId ? teacherMap.get(cls.classTeacherId) ?? null : null;

  async function handleDelete(c: ClassInfo) {
    if (!confirm(`Delete class "${c.name}"? This cannot be undone.`)) return;
    const { error: err } = await supabase.from('classes').delete().eq('id', c.id);
    if (err) {
      alert(`Failed to delete: ${err.message}`);
      return;
    }
    await fetchClasses();
    await fetchStudentCounts();
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Classes & Subjects" subtitle={`${classes.length} classes`}
        action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary"><Plus size={16} /> Add Class</button>} />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={24} className="animate-spin" />
          <span className="ml-2 text-sm">Loading classes...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 mb-4"><AlertCircle size={28} /></div>
          <h3 className="text-base font-semibold text-slate-700">Failed to load classes</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">{error}</p>
          <button onClick={loadAll} className="btn-secondary mt-4">Retry</button>
        </div>
      ) : classes.length === 0 ? (
        <Card className="p-0">
          <EmptyState icon={<BookOpen size={28} />} title="No classes found" description="Add your first class to get started." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {classes.map((c) => {
            const studentCount = studentCounts[c.id] ?? 0;
            const teacher = c.classTeacherId ? teacherMap.get(c.classTeacherId) ?? null : null;
            return (
              <Card key={c.id} hover className="p-5 cursor-pointer">
                <div onClick={() => setSelectedClass(c.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600"><BookOpen size={20} /></div>
                    <Badge variant="brand">{c.level}</Badge>
                  </div>
                  <h3 className="font-bold font-display text-slate-900">{c.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Room {c.room} • Capacity {c.capacity}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-slate-600"><Users size={14} /> {studentCount} students</span>
                    {teacher && <span className="flex items-center gap-1.5 text-slate-600"><GraduationCap size={14} /> {teacher.name.split(' ').slice(-1)[0]}</span>}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedClass(c.id); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setEditing(c); setShowForm(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(c); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Class detail modal */}
      {cls && (
        <ClassDetail
          cls={cls}
          classTeacher={classTeacher}
          teacherMap={teacherMap}
          onClose={() => setSelectedClass(null)}
          onEdit={() => { setEditing(cls); setSelectedClass(null); setShowForm(true); }}
        />
      )}

      {showForm && (
        <ClassForm
          cls={editing}
          teachers={teachers}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={async () => { await fetchClasses(); await fetchStudentCounts(); }}
        />
      )}
    </div>
  );
}

function ClassDetail({ cls, classTeacher, teacherMap, onClose, onEdit }: {
  cls: ClassInfo;
  classTeacher: Teacher | null;
  teacherMap: Map<string, Teacher>;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingDetail(true);
    Promise.all([
      supabase.from('subjects').select('id, name, code, teacher_id, full_marks').eq('class_id', cls.id).order('name', { ascending: true }),
      supabase.from('students').select('id, name, roll_no').eq('class_id', cls.id).order('roll_no', { ascending: true }),
    ]).then(([subjRes, stuRes]) => {
      if (!active) return;
      if (subjRes.error) {
        setSubjects([]);
      } else {
        setSubjects((subjRes.data as SubjectRow[]) ?? []);
      }
      if (stuRes.error) {
        setStudents([]);
      } else {
        setStudents((stuRes.data as StudentRow[]) ?? []);
      }
      setLoadingDetail(false);
    });
    return () => { active = false; };
  }, [cls.id]);

  return (
    <Modal open onClose={onClose} title={cls.name} subtitle={`Room ${cls.room} • Sections: ${cls.sections.join(', ') || '—'}`} size="lg"
      footer={<><button onClick={onClose} className="btn-secondary">Close</button><button onClick={onEdit} className="btn-primary"><Edit size={16} /> Edit</button></>}>
      {classTeacher && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-5">
          <Avatar name={classTeacher.name} size="md" />
          <div><p className="font-medium text-slate-800">{classTeacher.name}</p><p className="text-sm text-slate-500">Class Teacher • {classTeacher.qualification || '—'}</p></div>
        </div>
      )}

      <h4 className="font-semibold text-slate-900 mb-3">Subjects ({loadingDetail ? '…' : subjects.length})</h4>
      {loadingDetail ? (
        <div className="flex items-center justify-center py-6 text-slate-400 mb-5">
          <Loader2 size={20} className="animate-spin" />
          <span className="ml-2 text-sm">Loading subjects...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          {subjects.length > 0 ? subjects.map((s) => {
            const teacher = s.teacher_id ? teacherMap.get(s.teacher_id) : null;
            return (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div><p className="text-sm font-medium text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.code || '—'} • {teacher?.name || 'Unassigned'}</p></div>
                <Badge variant="neutral">{s.full_marks} marks</Badge>
              </div>
            );
          }) : <p className="text-sm text-slate-500">No subjects assigned yet.</p>}
        </div>
      )}

      <h4 className="font-semibold text-slate-900 mb-3">Students ({loadingDetail ? '…' : students.length})</h4>
      {loadingDetail ? (
        <div className="flex items-center justify-center py-6 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="ml-2 text-sm">Loading students...</span>
        </div>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-500">No students enrolled in this class.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {students.slice(0, 10).map((s) => (
            <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
              <Avatar name={s.name} size="sm" />
              <div><p className="text-sm font-medium text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.roll_no || '—'}</p></div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function ClassForm({ cls, teachers, onClose, onSaved }: {
  cls: ClassInfo | null;
  teachers: Teacher[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const isEdit = !!cls;
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => ({
    name: cls?.name ?? '',
    level: (cls?.level as Level) ?? 'Primary',
    room: cls?.room ?? '',
    capacity: cls ? String(cls.capacity) : '30',
    classTeacherId: cls?.classTeacherId ?? '',
    sections: cls?.sections.join(', ') ?? '',
    sortOrder: cls ? String(cls.sortOrder) : '0',
  }));

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Class name is required.');
      setSaving(false);
      return;
    }

    const capacityNum = form.capacity === '' ? 30 : Number(form.capacity);
    if (Number.isNaN(capacityNum)) {
      setFormError('Capacity must be a valid number.');
      setSaving(false);
      return;
    }

    const sortOrderNum = form.sortOrder === '' ? 0 : Number(form.sortOrder);
    if (Number.isNaN(sortOrderNum)) {
      setFormError('Sort order must be a valid number.');
      setSaving(false);
      return;
    }

    const sections = form.sections
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      level: form.level,
      room: form.room.trim() || null,
      capacity: capacityNum,
      class_teacher_id: form.classTeacherId || null,
      sections,
      sort_order: sortOrderNum,
    };

    let err: { message: string } | null = null;
    if (isEdit && cls) {
      const { error: updateErr } = await supabase.from('classes').update(payload).eq('id', cls.id);
      err = updateErr;
    } else {
      const { error: insertErr } = await supabase.from('classes').insert(payload);
      err = insertErr;
    }

    if (err) {
      setFormError(err.message);
      setSaving(false);
      return;
    }

    await onSaved();
    setSaving(false);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Class' : 'Add New Class'} subtitle={isEdit ? `Updating ${cls.name}` : 'Create a new class'} size="md"
      footer={<><button onClick={onClose} className="btn-secondary" disabled={saving}>Cancel</button><button type="submit" form="class-form" className="btn-primary" disabled={saving}><CheckCircle2 size={16} /> {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Class'}</button></>}>
      <form id="class-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        <div><label className="label">Class Name</label><input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Class 9" /></div>
        <div><label className="label">Level</label><select className="input" value={form.level} onChange={(e) => update('level', e.target.value as Level)}>{LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Room</label><input className="input" value={form.room} onChange={(e) => update('room', e.target.value)} placeholder="e.g. 3-01" /></div>
          <div><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={(e) => update('capacity', e.target.value)} placeholder="30" /></div>
        </div>
        <div><label className="label">Class Teacher</label><select className="input" value={form.classTeacherId} onChange={(e) => update('classTeacherId', e.target.value)}><option value="">Select teacher...</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        <div><label className="label">Sections (comma separated)</label><input className="input" value={form.sections} onChange={(e) => update('sections', e.target.value)} placeholder="A, B" /></div>
        <div><label className="label">Sort Order</label><input type="number" className="input" value={form.sortOrder} onChange={(e) => update('sortOrder', e.target.value)} placeholder="0" /></div>
      </form>
    </Modal>
  );
}
