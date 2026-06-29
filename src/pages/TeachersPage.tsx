import { useState, useMemo, useEffect, useCallback } from 'react';
import { UserPlus, Eye, Edit, Trash2, Phone, Mail, BookOpen, Award, CheckCircle2, GraduationCap, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui/Card';
import { Avatar, SearchInput, Select, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { supabase } from '@/lib/supabase';
import type { Teacher } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

type TeacherStatus = 'Active' | 'On Leave' | 'Inactive';

const statusVariant: Record<TeacherStatus, 'success' | 'warning' | 'neutral'> = {
  Active: 'success',
  'On Leave': 'warning',
  Inactive: 'neutral',
};

// Raw row shape returned by Supabase (snake_case).
interface TeacherRow {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  phone: string | null;
  email: string | null;
  address: string | null;
  qualification: string | null;
  subjects: string[] | null;
  class_id: string | null;
  join_date: string | null;
  salary: number | null;
  status: TeacherStatus;
  photo_url: string | null;
}

interface ClassRow {
  id: string;
  name: string;
}

interface StudentRow {
  id: string;
  name: string;
  roll_no: string | null;
}

function mapTeacher(r: TeacherRow): Teacher {
  return {
    id: r.id,
    name: r.name,
    gender: r.gender,
    phone: r.phone ?? '',
    email: r.email ?? '',
    address: r.address ?? '',
    subjects: r.subjects ?? [],
    classId: r.class_id ?? undefined,
    qualification: r.qualification ?? '',
    joinDate: r.join_date ?? '',
    salary: Number(r.salary ?? 0),
    status: r.status,
    photoUrl: r.photo_url ?? null,
  };
}

export function TeachersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('teachers')
      .select('id, name, gender, phone, email, address, qualification, subjects, class_id, join_date, salary, status, photo_url')
      .order('name', { ascending: true });
    if (err) {
      setError(err.message);
      return;
    }
    setError(null);
    setTeachers((data as TeacherRow[]).map(mapTeacher));
  }, []);

  const fetchClasses = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('classes')
      .select('id, name')
      .order('name', { ascending: true });
    if (err) {
      setError(err.message);
      return;
    }
    setClasses((data as ClassRow[]) ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTeachers(), fetchClasses()]);
    setLoading(false);
  }, [fetchTeachers, fetchClasses]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => teachers.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.qualification.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  }), [teachers, search, statusFilter]);

  async function handleDelete(teacher: Teacher) {
    if (!confirm(`Delete teacher "${teacher.name}"? This cannot be undone.`)) return;
    const { error: err } = await supabase.from('teachers').delete().eq('id', teacher.id);
    if (err) {
      alert(`Failed to delete: ${err.message}`);
      return;
    }
    await fetchTeachers();
  }

  const columns: Column<Teacher>[] = [
    { key: 'name', header: 'Teacher', sortable: true, sortValue: (r) => r.name, render: (t) => (
      <div className="flex items-center gap-3"><Avatar name={t.name} size="sm" /><div><p className="font-medium text-slate-800">{t.name}</p><p className="text-xs text-slate-500">{t.qualification || '—'}</p></div></div>) },
    { key: 'subjects', header: 'Subjects', render: (t) => <span className="text-slate-600">{t.subjects.length ? t.subjects.join(', ') : '—'}</span> },
    { key: 'qualification', header: 'Qualification', render: (t) => <span className="text-slate-600">{t.qualification || '—'}</span> },
    { key: 'phone', header: 'Phone', render: (t) => <span className="text-slate-600">{t.phone || '—'}</span> },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (t) => <Badge variant={statusVariant[t.status]}>{t.status}</Badge> },
    { key: 'actions', header: '', className: 'text-right', render: (t) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); setSelected(t); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); setEditing(t); setShowForm(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(t); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
      </div>) },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Teachers" subtitle={`${filtered.length} of ${teachers.length} teaching staff`}
        action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary"><UserPlus size={16} /> Add Teacher</button>} />

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or qualification..." className="flex-1" />
          <Select value={statusFilter} onChange={setStatusFilter} placeholder="All Status" options={[{ value: 'Active', label: 'Active' }, { value: 'On Leave', label: 'On Leave' }, { value: 'Inactive', label: 'Inactive' }]} className="sm:w-40" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="ml-2 text-sm">Loading teachers...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 mb-4"><AlertCircle size={28} /></div>
            <h3 className="text-base font-semibold text-slate-700">Failed to load teachers</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">{error}</p>
            <button onClick={loadAll} className="btn-secondary mt-4">Retry</button>
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} rowKey={(t) => t.id} onRowClick={(t) => setSelected(t)}
            emptyState={<EmptyState icon={<GraduationCap size={28} />} title="No teachers found" description="Try adjusting your search or add a new teacher." />} />
        )}
      </Card>

      {selected && <TeacherDetail teacher={selected} classes={classes} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); setShowForm(true); }} />}
      {showForm && <TeacherForm teacher={editing} classes={classes} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={fetchTeachers} />}
    </div>
  );
}

function TeacherDetail({ teacher, classes, onClose, onEdit }: { teacher: Teacher; classes: ClassRow[]; onClose: () => void; onEdit: () => void }) {
  const cls = teacher.classId ? classes.find((c) => c.id === teacher.classId) : null;
  const [classStudents, setClassStudents] = useState<StudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    let active = true;
    if (!teacher.classId) {
      setClassStudents([]);
      return;
    }
    setLoadingStudents(true);
    supabase
      .from('students')
      .select('id, name, roll_no')
      .eq('class_id', teacher.classId)
      .order('roll_no', { ascending: true })
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) {
          setClassStudents([]);
        } else {
          setClassStudents((data as StudentRow[]) ?? []);
        }
        setLoadingStudents(false);
      });
    return () => { active = false; };
  }, [teacher.classId]);

  return (
    <Modal open onClose={onClose} title="Teacher Details" size="lg"
      footer={<><button onClick={onClose} className="btn-secondary">Close</button><button onClick={onEdit} className="btn-primary"><Edit size={16} /> Edit</button></>}>
      <div className="flex flex-col sm:flex-row gap-4 pb-5 border-b border-slate-100">
        <Avatar name={teacher.name} size="lg" />
        <div className="flex-1">
          <h3 className="text-xl font-bold font-display text-slate-900">{teacher.name}</h3>
          <p className="text-sm text-slate-500">{teacher.qualification || '—'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={statusVariant[teacher.status]}>{teacher.status}</Badge>
            <Badge variant="brand">{teacher.gender}</Badge>
            {cls && <Badge variant="info">Class Teacher: {cls.name}</Badge>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-5 border-b border-slate-100 text-sm">
        <InfoRow icon={<Mail size={15} />} label="Email" value={teacher.email || '—'} />
        <InfoRow icon={<Phone size={15} />} label="Phone" value={teacher.phone || '—'} />
        <InfoRow icon={<Award size={15} />} label="Qualification" value={teacher.qualification || '—'} />
        <InfoRow icon={<Calendar size={15} />} label="Join Date" value={teacher.joinDate ? formatDate(teacher.joinDate) : '—'} />
        <InfoRow icon={<BookOpen size={15} />} label="Subjects" value={teacher.subjects.length ? teacher.subjects.join(', ') : '—'} />
        <InfoRow icon={<GraduationCap size={15} />} label="Salary" value={formatCurrency(teacher.salary)} />
      </div>
      {cls && (
        <div className="py-5">
          <h4 className="font-semibold text-slate-900 mb-3">Class Students ({loadingStudents ? '…' : classStudents.length})</h4>
          {loadingStudents ? (
            <div className="flex items-center justify-center py-6 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="ml-2 text-sm">Loading students...</span>
            </div>
          ) : classStudents.length === 0 ? (
            <p className="text-sm text-slate-500">No students assigned to this class.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {classStudents.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50"><Avatar name={s.name} size="sm" /><div><p className="text-sm font-medium text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.roll_no || '—'}</p></div></div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2.5"><span className="text-slate-400">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-medium text-slate-800">{value}</p></div></div>;
}

interface FormState {
  name: string;
  gender: 'Male' | 'Female';
  phone: string;
  email: string;
  address: string;
  qualification: string;
  subjects: string;
  classId: string;
  joinDate: string;
  salary: string;
  status: TeacherStatus;
  photoUrl: string;
}

function TeacherForm({ teacher, classes, onClose, onSaved }: { teacher: Teacher | null; classes: ClassRow[]; onClose: () => void; onSaved: () => void | Promise<void> }) {
  const isEdit = !!teacher;
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => ({
    name: teacher?.name ?? '',
    gender: teacher?.gender ?? 'Male',
    phone: teacher?.phone ?? '',
    email: teacher?.email ?? '',
    address: teacher?.address ?? '',
    qualification: teacher?.qualification ?? '',
    subjects: teacher?.subjects.join(', ') ?? '',
    classId: teacher?.classId ?? '',
    joinDate: teacher?.joinDate ?? new Date().toISOString().split('T')[0],
    salary: teacher ? String(teacher.salary) : '',
    status: teacher?.status ?? 'Active',
    photoUrl: teacher?.photoUrl ?? '',
  }));

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const subjects = form.subjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const salaryNum = form.salary === '' ? 0 : Number(form.salary);
    if (form.salary !== '' && Number.isNaN(salaryNum)) {
      setFormError('Salary must be a valid number.');
      setSaving(false);
      return;
    }
    if (!form.name.trim()) {
      setFormError('Name is required.');
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      gender: form.gender,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      qualification: form.qualification.trim() || null,
      subjects,
      class_id: form.classId || null,
      join_date: form.joinDate || null,
      salary: salaryNum,
      status: form.status,
      photo_url: form.photoUrl.trim() || null,
    };

    let err: { message: string } | null = null;
    if (isEdit && teacher) {
      const { error: updateErr } = await supabase.from('teachers').update(payload).eq('id', teacher.id);
      err = updateErr;
    } else {
      const { error: insertErr } = await supabase.from('teachers').insert(payload);
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
    <Modal open onClose={onClose} title={isEdit ? 'Edit Teacher' : 'Add New Teacher'} subtitle={isEdit ? `Updating ${teacher.name}` : 'Fill in the teacher details below'} size="lg"
      footer={<><button onClick={onClose} className="btn-secondary" disabled={saving}>Cancel</button><button type="submit" form="teacher-form" className="btn-primary" disabled={saving}><CheckCircle2 size={16} /> {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Teacher'}</button></>}>
      <form id="teacher-form" onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Personal Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Mr. Imran Yousaf" /></div>
            <div><label className="label">Gender</label><select className="input" value={form.gender} onChange={(e) => update('gender', e.target.value as 'Male' | 'Female')}><option>Male</option><option>Female</option></select></div>
            <div><label className="label">Join Date</label><input type="date" className="input" value={form.joinDate} onChange={(e) => update('joinDate', e.target.value)} /></div>
            <div><label className="label">Photo URL</label><input className="input" value={form.photoUrl} onChange={(e) => update('photoUrl', e.target.value)} placeholder="https://..." /></div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Professional Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Qualification</label><input className="input" value={form.qualification} onChange={(e) => update('qualification', e.target.value)} placeholder="e.g. MA English" /></div>
            <div><label className="label">Salary (PKR)</label><input type="number" className="input" value={form.salary} onChange={(e) => update('salary', e.target.value)} placeholder="35000" /></div>
            <div><label className="label">Subjects (comma separated)</label><input className="input" value={form.subjects} onChange={(e) => update('subjects', e.target.value)} placeholder="Quran, Islamiat" /></div>
            <div><label className="label">Class Teacher Of</label><select className="input" value={form.classId} onChange={(e) => update('classId', e.target.value)}><option value="">None</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => update('status', e.target.value as TeacherStatus)}><option>Active</option><option>On Leave</option><option>Inactive</option></select></div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="0300 1234567" /></div>
            <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="teacher@bmhs.edu.pk" /></div>
            <div className="sm:col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="House 12, Madina Colony, Ellah Abad" /></div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
