import { useState, useMemo, useEffect, useCallback } from 'react';
import { UserPlus, Eye, Edit, Trash2, Download, Phone, Mail, MapPin, Calendar, Users as UsersIcon, CheckCircle2, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui/Card';
import { Avatar, SearchInput, Select, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { BulkUpload } from '@/components/ui/BulkUpload';
import { supabase } from '@/lib/supabase';
import type { Student } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

const statusVariant = { Active: 'success', Inactive: 'neutral', Graduated: 'info' } as const;

// ---- Supabase row types (snake_case as stored in DB) ----

interface StudentRow {
  id: string;
  roll_no: string;
  name: string;
  gender: string | null;
  dob: string | null;
  class_id: string | null;
  section: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  parent_id: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  admission_date: string | null;
  status: string;
  photo_url: string | null;
}

interface ClassRow {
  id: string;
  name: string;
  level: string;
  sections: string[];
  room: string | null;
  capacity: number;
}

interface ParentRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  occupation: string | null;
  address: string | null;
}

interface ResultRow {
  id: string;
  student_id: string;
  subject: string;
  term: string;
  total_marks: number;
  obtained_marks: number;
  grade: string | null;
}

interface FeeRow {
  id: string;
  student_id: string;
  term: string;
  amount: number;
  paid_amount: number;
  status: string;
}

interface AttendanceRow {
  id: string;
  student_id: string;
  date: string;
  status: string;
}

// ---- mappers: snake_case DB row -> camelCase UI type ----

function mapStudent(r: StudentRow): Student {
  return {
    id: r.id,
    rollNo: r.roll_no,
    name: r.name,
    gender: (r.gender as 'Male' | 'Female') ?? 'Male',
    dob: r.dob ?? '',
    classId: r.class_id ?? '',
    section: r.section ?? 'A',
    parentId: r.parent_id,
    parentName: r.parent_name,
    parentPhone: r.parent_phone,
    phone: r.phone ?? '',
    email: r.email ?? '',
    address: r.address ?? '',
    admissionDate: r.admission_date ?? '',
    status: (r.status as 'Active' | 'Inactive' | 'Graduated') ?? 'Active',
    photoUrl: r.photo_url,
  };
}

export function StudentsPage() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [showBulk, setShowBulk] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('students')
      .select('id, roll_no, name, gender, dob, class_id, section, phone, email, address, parent_id, parent_name, parent_phone, admission_date, status, photo_url')
      .order('name', { ascending: true });
    if (fetchError) {
      setError(fetchError.message);
      setStudents([]);
    } else {
      setStudents((data as StudentRow[]).map(mapStudent));
    }
    setLoading(false);
  }, []);

  const fetchClasses = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('classes')
      .select('id, name, level, sections, room, capacity')
      .order('name', { ascending: true });
    if (fetchError) {
      // non-fatal: class lookups just won't resolve
      setClasses([]);
    } else {
      setClasses(data as ClassRow[]);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [fetchStudents, fetchClasses]);

  const getClassById = useCallback((id: string) => classes.find((c) => c.id === id), [classes]);

  const filtered = useMemo(() => students.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchClass = !classFilter || s.classId === classFilter;
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  }), [students, search, classFilter, statusFilter]);

  async function handleDelete(s: Student) {
    const { error: deleteError } = await supabase.from('students').delete().eq('id', s.id);
    if (deleteError) {
      alert(`Failed to delete student: ${deleteError.message}`);
      return;
    }
    await fetchStudents();
  }

  const columns: Column<Student>[] = [
    { key: 'name', header: 'Student', sortable: true, sortValue: (r) => r.name, render: (s) => (
      <div className="flex items-center gap-3"><Avatar name={s.name} size="sm" /><div><p className="font-medium text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.rollNo}</p></div></div>) },
    { key: 'class', header: 'Class', sortable: true, sortValue: (r) => getClassById(r.classId)?.name || '', render: (s) => <span className="text-slate-600">{getClassById(s.classId)?.name || '—'} • {s.section}</span> },
    { key: 'gender', header: 'Gender', render: (s) => <span className="text-slate-600">{s.gender}</span> },
    { key: 'phone', header: 'Phone', render: (s) => <span className="text-slate-600">{s.phone || '—'}</span> },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (s) => <Badge variant={statusVariant[s.status]}>{s.status}</Badge> },
    { key: 'actions', header: '', className: 'text-right', render: (s) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); setSelected(s); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); setEditing(s); setShowForm(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${s.name}? This cannot be undone.`)) handleDelete(s); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
      </div>) },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Students" subtitle={`${filtered.length} of ${students.length} students`}
        action={<div className="flex gap-2"><button onClick={() => setShowBulk(true)} className="btn-secondary"><UploadCloud size={16} /> Bulk Upload</button><button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary"><UserPlus size={16} /> Add Student</button></div>} />

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or roll no..." className="flex-1" />
          <Select value={classFilter} onChange={setClassFilter} placeholder="All Classes" options={classes.map((c) => ({ value: c.id, label: c.name }))} className="sm:w-40" />
          <Select value={statusFilter} onChange={setStatusFilter} placeholder="All Status" options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }, { value: 'Graduated', label: 'Graduated' }]} className="sm:w-40" />
          <button className="btn-secondary"><Download size={16} /> Export</button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading students...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 mb-4"><AlertCircle size={28} /></div>
            <h3 className="text-base font-semibold text-slate-700">Failed to load students</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">{error}</p>
            <button onClick={fetchStudents} className="mt-4 btn-primary">Retry</button>
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} rowKey={(s) => s.id} onRowClick={(s) => setSelected(s)}
            emptyState={<EmptyState icon={<UsersIcon size={28} />} title="No students found" description="Try adjusting your search or filters, or add a new student." />} />
        )}
      </Card>

      {selected && <StudentDetail student={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); setShowForm(true); }} />}
      {showForm && <StudentForm student={editing} classes={classes} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={fetchStudents} />}
      {showBulk && <BulkUpload open={showBulk} onClose={() => setShowBulk(false)} onUpload={async (rows) => { await handleBulkUpload(rows); }} entityName="Students"
        templateFields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'rollNo', label: 'Roll No', required: true },
          { key: 'gender', label: 'Gender' },
          { key: 'dob', label: 'Date of Birth' },
          { key: 'classId', label: 'Class' },
          { key: 'section', label: 'Section' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'address', label: 'Address' },
          { key: 'parentName', label: 'Parent Name' },
          { key: 'parentPhone', label: 'Parent Phone' },
        ]} />}
    </div>
  );

  async function handleBulkUpload(rows: Record<string, string>[]) {
    // Map CSV camelCase keys to Supabase snake_case columns.
    // classId in the CSV may be a class name; resolve to UUID when possible.
    const classNameToId = new Map(classes.map((c) => [c.name.toLowerCase(), c.id]));
    const inserts = rows.map((row) => ({
      name: row.name || row['Name'] || '',
      roll_no: row.rollNo || row['Roll No'] || '',
      gender: row.gender || row['Gender'] || 'Male',
      dob: row.dob || row['Date of Birth'] || null,
      class_id: classNameToId.get((row.classId || row['Class'] || '').toLowerCase()) || null,
      section: row.section || row['Section'] || 'A',
      phone: row.phone || row['Phone'] || null,
      email: row.email || row['Email'] || null,
      address: row.address || row['Address'] || null,
      parent_name: row.parentName || row['Parent Name'] || null,
      parent_phone: row.parentPhone || row['Parent Phone'] || null,
      status: 'Active',
    })).filter((r) => r.name && r.roll_no);

    if (inserts.length === 0) {
      alert('No valid rows to import. Each row needs at least a Name and Roll No.');
      return;
    }

    const { error: insertError } = await supabase.from('students').insert(inserts);
    if (insertError) {
      alert(`Bulk upload failed: ${insertError.message}`);
      return;
    }
    await fetchStudents();
  }
}

function StudentDetail({ student, onClose, onEdit }: { student: Student; onClose: () => void; onEdit: () => void }) {
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [parent, setParent] = useState<ParentRow | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);

      // Fetch class, parent, results, fees, and attendance in parallel.
      const [classRes, parentRes, resultsRes, feesRes, attendanceRes] = await Promise.all([
        student.classId
          ? supabase.from('classes').select('id, name, level, sections, room, capacity').eq('id', student.classId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        student.parentId
          ? supabase.from('parents').select('id, name, phone, email, occupation, address').eq('id', student.parentId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from('results').select('id, student_id, subject, term, total_marks, obtained_marks, grade').eq('student_id', student.id),
        supabase.from('fees').select('id, student_id, term, amount, paid_amount, status').eq('student_id', student.id),
        supabase.from('attendance').select('id, student_id, date, status').eq('student_id', student.id),
      ]);

      if (cancelled) return;

      if (classRes.error || parentRes.error || resultsRes.error || feesRes.error || attendanceRes.error) {
        const msg = classRes.error?.message || parentRes.error?.message || resultsRes.error?.message || feesRes.error?.message || attendanceRes.error?.message || 'Unknown error';
        setError(msg);
      }

      setCls((classRes.data as ClassRow | null) ?? null);
      setParent((parentRes.data as ParentRow | null) ?? null);
      setResults((resultsRes.data as ResultRow[]) ?? []);
      setFees((feesRes.data as FeeRow[]) ?? []);
      setAttendanceRecords((attendanceRes.data as AttendanceRow[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [student.id, student.classId, student.parentId]);

  const present = attendanceRecords.filter((a) => a.status === 'Present').length;
  const attendanceRate = attendanceRecords.length > 0 ? Math.round((present / attendanceRecords.length) * 100) : 0;
  const avgMarks = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.total_marks > 0 ? (r.obtained_marks / r.total_marks) * 100 : 0), 0) / results.length) : 0;
  const totalPaid = fees.reduce((s, f) => s + Number(f.paid_amount), 0);
  const totalDue = fees.reduce((s, f) => s + (Number(f.amount) - Number(f.paid_amount)), 0);

  return (
    <Modal open onClose={onClose} title="Student Details" size="xl"
      footer={<><button onClick={onClose} className="btn-secondary">Close</button><button onClick={onEdit} className="btn-primary"><Edit size={16} /> Edit</button></>}>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading details...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 mb-4"><AlertCircle size={28} /></div>
          <h3 className="text-base font-semibold text-slate-700">Failed to load details</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 pb-5 border-b border-slate-100">
            <Avatar name={student.name} size="lg" />
            <div className="flex-1">
              <h3 className="text-xl font-bold font-display text-slate-900">{student.name}</h3>
              <p className="text-sm text-slate-500">{student.rollNo} • {cls?.name || '—'} • Section {student.section}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={statusVariant[student.status]}>{student.status}</Badge>
                <Badge variant="brand">{student.gender}</Badge>
                {student.parentName && <Badge variant="neutral">Parent: {student.parentName}</Badge>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-5 border-b border-slate-100">
            <div className="text-center p-3 rounded-xl bg-slate-50"><p className="text-2xl font-bold font-display text-brand-600">{attendanceRate}%</p><p className="text-xs text-slate-500 mt-0.5">Attendance</p></div>
            <div className="text-center p-3 rounded-xl bg-slate-50"><p className="text-2xl font-bold font-display text-blue-600">{avgMarks}%</p><p className="text-xs text-slate-500 mt-0.5">Avg Marks</p></div>
            <div className="text-center p-3 rounded-xl bg-slate-50"><p className="text-2xl font-bold font-display text-emerald-600">{formatCurrency(totalPaid)}</p><p className="text-xs text-slate-500 mt-0.5">Fees Paid</p></div>
            <div className="text-center p-3 rounded-xl bg-slate-50"><p className="text-2xl font-bold font-display text-rose-600">{formatCurrency(totalDue)}</p><p className="text-xs text-slate-500 mt-0.5">Fees Due</p></div>
          </div>

          <div className="py-5 border-b border-slate-100">
            <h4 className="font-semibold text-slate-900 mb-3">Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoRow icon={<Calendar size={15} />} label="Date of Birth" value={formatDate(student.dob)} />
              <InfoRow icon={<Phone size={15} />} label="Phone" value={student.phone || '—'} />
              <InfoRow icon={<Mail size={15} />} label="Email" value={student.email || '—'} />
              <InfoRow icon={<MapPin size={15} />} label="Address" value={student.address || '—'} />
              <InfoRow icon={<Calendar size={15} />} label="Admission Date" value={formatDate(student.admissionDate)} />
            </div>
          </div>

          {(parent || student.parentName) && (
            <div className="py-5 border-b border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-3">Parent / Guardian</h4>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <Avatar name={parent?.name || student.parentName || '?'} size="md" />
                <div>
                  <p className="font-medium text-slate-800">{parent?.name || student.parentName || '—'}</p>
                  <p className="text-xs text-slate-500">{parent?.occupation || ''}</p>
                  <p className="text-xs text-slate-500">{parent?.phone || student.parentPhone || '—'}{parent?.email ? ` • ${parent.email}` : ''}</p>
                </div>
              </div>
            </div>
          )}

          <div className="py-5">
            <h4 className="font-semibold text-slate-900 mb-3">Recent Results</h4>
            <div className="space-y-2">
              {results.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-sm font-medium text-slate-700">{r.subject} <span className="text-slate-400 font-normal">• {r.term}</span></span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">{r.obtained_marks}/{r.total_marks}</span>
                    {r.grade && <Badge variant={r.grade.startsWith('A') ? 'success' : r.grade === 'F' ? 'danger' : 'neutral'}>{r.grade}</Badge>}
                  </div>
                </div>
              ))}
              {results.length === 0 && <p className="text-sm text-slate-500">No results recorded yet.</p>}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2.5"><span className="text-slate-400">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-medium text-slate-800">{value}</p></div></div>;
}

interface StudentFormProps {
  student: Student | null;
  classes: ClassRow[];
  onClose: () => void;
  onSaved: () => void;
}

function StudentForm({ student, classes, onClose, onSaved }: StudentFormProps) {
  const isEdit = !!student;
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get('name') || '').trim(),
      roll_no: String(fd.get('roll_no') || '').trim(),
      gender: String(fd.get('gender') || 'Male'),
      dob: String(fd.get('dob') || '') || null,
      class_id: String(fd.get('class_id') || '') || null,
      section: String(fd.get('section') || 'A'),
      phone: String(fd.get('phone') || '') || null,
      email: String(fd.get('email') || '') || null,
      address: String(fd.get('address') || '') || null,
      parent_name: String(fd.get('parent_name') || '') || null,
      parent_phone: String(fd.get('parent_phone') || '') || null,
      admission_date: String(fd.get('admission_date') || '') || null,
      status: String(fd.get('status') || 'Active'),
    };

    if (!payload.name || !payload.roll_no) {
      setFormError('Name and Roll Number are required.');
      setSaving(false);
      return;
    }

    let result;
    if (isEdit) {
      result = await supabase.from('students').update(payload).eq('id', student!.id);
    } else {
      result = await supabase.from('students').insert(payload);
    }

    if (result.error) {
      setFormError(result.error.message);
      setSaving(false);
      return;
    }

    await onSaved();
    setSaving(false);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Student' : 'Add New Student'} subtitle={isEdit ? `Updating ${student!.name}` : 'Fill in the student details below'} size="lg"
      footer={
        <form onSubmit={handleSubmit} id="student-form" />
      }>
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-sm">
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Basic Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input name="name" className="input" defaultValue={student?.name} placeholder="e.g. Ahmed Khan" required /></div>
            <div><label className="label">Roll Number</label><input name="roll_no" className="input" defaultValue={student?.rollNo} placeholder="e.g. 1-001" required /></div>
            <div><label className="label">Gender</label><select name="gender" className="input" defaultValue={student?.gender || 'Male'}><option>Male</option><option>Female</option></select></div>
            <div><label className="label">Date of Birth</label><input type="date" name="dob" className="input" defaultValue={student?.dob} /></div>
            <div><label className="label">Status</label><select name="status" className="input" defaultValue={student?.status || 'Active'}><option>Active</option><option>Inactive</option><option>Graduated</option></select></div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Academic Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Class</label><select name="class_id" className="input" defaultValue={student?.classId || ''}><option value="">Select class...</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label">Section</label><select name="section" className="input" defaultValue={student?.section || 'A'}><option>A</option><option>B</option><option>C</option></select></div>
            <div><label className="label">Admission Date</label><input type="date" name="admission_date" className="input" defaultValue={student?.admissionDate} /></div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Phone</label><input name="phone" className="input" defaultValue={student?.phone} placeholder="0300 1234567" /></div>
            <div><label className="label">Email</label><input name="email" className="input" defaultValue={student?.email} placeholder="student@bmhs.edu.pk" /></div>
            <div className="sm:col-span-2"><label className="label">Address</label><textarea name="address" className="input" rows={2} defaultValue={student?.address} placeholder="House #, Madina Colony, Ellah Abad" /></div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Parent / Guardian</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Parent Name</label><input name="parent_name" className="input" defaultValue={student?.parentName || ''} placeholder="e.g. Khan Ahmed" /></div>
            <div><label className="label">Parent Phone</label><input name="parent_phone" className="input" defaultValue={student?.parentPhone || ''} placeholder="0301 1234567" /></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {isEdit ? 'Save Changes' : 'Add Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
