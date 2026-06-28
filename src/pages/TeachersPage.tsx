import { useState, useMemo } from 'react';
import { UserPlus, Eye, Edit, Trash2, Phone, Mail, BookOpen, Award, CheckCircle2, GraduationCap, Calendar } from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui/Card';
import { Avatar, SearchInput, Select, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { teachers, classes, getClassById, getStudentsByClass } from '@/data/mockData';
import type { Teacher } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

const statusVariant = { Active: 'success', 'On Leave': 'warning', Inactive: 'neutral' } as const;

export function TeachersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const filtered = useMemo(() => teachers.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  }), [search, statusFilter]);

  const columns: Column<Teacher>[] = [
    { key: 'name', header: 'Teacher', sortable: true, sortValue: (r) => r.name, render: (t) => (
      <div className="flex items-center gap-3"><Avatar name={t.name} size="sm" /><div><p className="font-medium text-slate-800">{t.name}</p><p className="text-xs text-slate-500">{t.employeeId}</p></div></div>) },
    { key: 'subjects', header: 'Subjects', render: (t) => <span className="text-slate-600">{t.subjects.join(', ')}</span> },
    { key: 'qualification', header: 'Qualification', render: (t) => <span className="text-slate-600">{t.qualification}</span> },
    { key: 'phone', header: 'Phone', render: (t) => <span className="text-slate-600">{t.phone}</span> },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (t) => <Badge variant={statusVariant[t.status]}>{t.status}</Badge> },
    { key: 'actions', header: '', className: 'text-right', render: (t) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); setSelected(t); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); setEditing(t); setShowForm(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
        <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
      </div>) },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Teachers" subtitle={`${filtered.length} of ${teachers.length} teaching staff`}
        action={<button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary"><UserPlus size={16} /> Add Teacher</button>} />

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or employee ID..." className="flex-1" />
          <Select value={statusFilter} onChange={setStatusFilter} placeholder="All Status" options={[{ value: 'Active', label: 'Active' }, { value: 'On Leave', label: 'On Leave' }, { value: 'Inactive', label: 'Inactive' }]} className="sm:w-40" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataTable columns={columns} data={filtered} rowKey={(t) => t.id} onRowClick={(t) => setSelected(t)}
          emptyState={<EmptyState icon={<GraduationCap size={28} />} title="No teachers found" description="Try adjusting your search or add a new teacher." />} />
      </Card>

      {selected && <TeacherDetail teacher={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); setShowForm(true); }} />}
      {showForm && <TeacherForm teacher={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}

function TeacherDetail({ teacher, onClose, onEdit }: { teacher: Teacher; onClose: () => void; onEdit: () => void }) {
  const cls = teacher.classId ? getClassById(teacher.classId) : null;
  const classStudents = teacher.classId ? getStudentsByClass(teacher.classId) : [];
  return (
    <Modal open onClose={onClose} title="Teacher Details" size="lg"
      footer={<><button onClick={onClose} className="btn-secondary">Close</button><button onClick={onEdit} className="btn-primary"><Edit size={16} /> Edit</button></>}>
      <div className="flex flex-col sm:flex-row gap-4 pb-5 border-b border-slate-100">
        <Avatar name={teacher.name} size="lg" />
        <div className="flex-1">
          <h3 className="text-xl font-bold font-display text-slate-900">{teacher.name}</h3>
          <p className="text-sm text-slate-500">{teacher.employeeId}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={statusVariant[teacher.status]}>{teacher.status}</Badge>
            <Badge variant="brand">{teacher.gender}</Badge>
            {cls && <Badge variant="info">Class Teacher: {cls.name}</Badge>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-5 border-b border-slate-100 text-sm">
        <InfoRow icon={<Mail size={15} />} label="Email" value={teacher.email} />
        <InfoRow icon={<Phone size={15} />} label="Phone" value={teacher.phone} />
        <InfoRow icon={<Award size={15} />} label="Qualification" value={teacher.qualification} />
        <InfoRow icon={<Calendar size={15} />} label="Join Date" value={formatDate(teacher.joinDate)} />
        <InfoRow icon={<BookOpen size={15} />} label="Subjects" value={teacher.subjects.join(', ')} />
        <InfoRow icon={<GraduationCap size={15} />} label="Salary" value={formatCurrency(teacher.salary)} />
      </div>
      {cls && (
        <div className="py-5">
          <h4 className="font-semibold text-slate-900 mb-3">Class Students ({classStudents.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {classStudents.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50"><Avatar name={s.name} size="sm" /><div><p className="text-sm font-medium text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.rollNo}</p></div></div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2.5"><span className="text-slate-400">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-medium text-slate-800">{value}</p></div></div>;
}

function TeacherForm({ teacher, onClose }: { teacher: Teacher | null; onClose: () => void }) {
  const isEdit = !!teacher;
  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Teacher' : 'Add New Teacher'} subtitle={isEdit ? `Updating ${teacher.name}` : 'Fill in the teacher details below'} size="lg"
      footer={<><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={onClose} className="btn-primary"><CheckCircle2 size={16} /> {isEdit ? 'Save Changes' : 'Add Teacher'}</button></>}>
      <div className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Personal Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="input" defaultValue={teacher?.name} placeholder="e.g. Mr. Imran Yousaf" /></div>
            <div><label className="label">Employee ID</label><input className="input" defaultValue={teacher?.employeeId} placeholder="e.g. EMP-001" /></div>
            <div><label className="label">Gender</label><select className="input" defaultValue={teacher?.gender}><option>Male</option><option>Female</option></select></div>
            <div><label className="label">Join Date</label><input type="date" className="input" defaultValue={teacher?.joinDate} /></div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Professional Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Qualification</label><input className="input" defaultValue={teacher?.qualification} placeholder="e.g. MA English" /></div>
            <div><label className="label">Salary (PKR)</label><input type="number" className="input" defaultValue={teacher?.salary} placeholder="35000" /></div>
            <div><label className="label">Subjects (comma separated)</label><input className="input" defaultValue={teacher?.subjects.join(', ')} placeholder="Quran, Islamiat" /></div>
            <div><label className="label">Class Teacher Of</label><select className="input" defaultValue={teacher?.classId}><option value="">None</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label">Status</label><select className="input" defaultValue={teacher?.status}><option>Active</option><option>On Leave</option><option>Inactive</option></select></div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Phone</label><input className="input" defaultValue={teacher?.phone} placeholder="0300 1234567" /></div>
            <div><label className="label">Email</label><input className="input" defaultValue={teacher?.email} placeholder="teacher@bmhs.edu.pk" /></div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
