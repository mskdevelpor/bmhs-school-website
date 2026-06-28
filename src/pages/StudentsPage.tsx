import { useState, useMemo } from 'react';
import { UserPlus, Eye, Edit, Trash2, Download, Phone, Mail, MapPin, Calendar, Droplet, Users as UsersIcon, CheckCircle2, UploadCloud } from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui/Card';
import { Avatar, SearchInput, Select, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { BulkUpload } from '@/components/ui/BulkUpload';
import { students, classes, getClassById, getParentById, getResultsByStudent, getFeesByStudent, getAttendanceByStudent, SCHOOL } from '@/data/mockData';
import type { Student } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

const statusVariant = { Active: 'success', Inactive: 'neutral', Graduated: 'info' } as const;

export function StudentsPage() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [showBulk, setShowBulk] = useState(false);

  const filtered = useMemo(() => students.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchClass = !classFilter || s.classId === classFilter;
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  }), [search, classFilter, statusFilter]);

  const columns: Column<Student>[] = [
    { key: 'name', header: 'Student', sortable: true, sortValue: (r) => r.name, render: (s) => (
      <div className="flex items-center gap-3"><Avatar name={s.name} size="sm" /><div><p className="font-medium text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.rollNo}</p></div></div>) },
    { key: 'class', header: 'Class', sortable: true, sortValue: (r) => getClassById(r.classId)?.name || '', render: (s) => <span className="text-slate-600">{getClassById(s.classId)?.name} • {s.section}</span> },
    { key: 'gender', header: 'Gender', render: (s) => <span className="text-slate-600">{s.gender}</span> },
    { key: 'phone', header: 'Phone', render: (s) => <span className="text-slate-600">{s.phone}</span> },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (s) => <Badge variant={statusVariant[s.status]}>{s.status}</Badge> },
    { key: 'actions', header: '', className: 'text-right', render: (s) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); setSelected(s); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); setEditing(s); setShowForm(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
        <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
      </div>) },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Students" subtitle={`${filtered.length} of ${students.length} students • Session ${SCHOOL.currentSession}`}
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
        <DataTable columns={columns} data={filtered} rowKey={(s) => s.id} onRowClick={(s) => setSelected(s)}
          emptyState={<EmptyState icon={<UsersIcon size={28} />} title="No students found" description="Try adjusting your search or filters, or add a new student." />} />
      </Card>

      {selected && <StudentDetail student={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); setShowForm(true); }} />}
      {showForm && <StudentForm student={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}
      {showBulk && <BulkUpload open={showBulk} onClose={() => setShowBulk(false)} onUpload={() => {}} entityName="Students"
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
}

function StudentDetail({ student, onClose, onEdit }: { student: Student; onClose: () => void; onEdit: () => void }) {
  const cls = getClassById(student.classId);
  const parent = getParentById(student.parentId);
  const results = getResultsByStudent(student.id);
  const fees = getFeesByStudent(student.id);
  const attendanceRecords = getAttendanceByStudent(student.id);
  const present = attendanceRecords.filter((a) => a.status === 'Present').length;
  const attendanceRate = attendanceRecords.length > 0 ? Math.round((present / attendanceRecords.length) * 100) : 0;
  const avgMarks = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.marks, 0) / results.length) : 0;
  const totalPaid = fees.reduce((s, f) => s + f.paid, 0);
  const totalDue = fees.reduce((s, f) => s + (f.amount - f.paid), 0);

  return (
    <Modal open onClose={onClose} title="Student Details" size="xl"
      footer={<><button onClick={onClose} className="btn-secondary">Close</button><button onClick={onEdit} className="btn-primary"><Edit size={16} /> Edit</button></>}>
      <div className="flex flex-col sm:flex-row gap-4 pb-5 border-b border-slate-100">
        <Avatar name={student.name} size="lg" />
        <div className="flex-1">
          <h3 className="text-xl font-bold font-display text-slate-900">{student.name}</h3>
          <p className="text-sm text-slate-500">{student.rollNo} • {cls?.name} • Section {student.section}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={statusVariant[student.status]}>{student.status}</Badge>
            <Badge variant="brand">{student.gender}</Badge>
            <Badge variant="neutral">Blood: {student.bloodGroup}</Badge>
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
          <InfoRow icon={<Droplet size={15} />} label="Blood Group" value={student.bloodGroup} />
          <InfoRow icon={<Phone size={15} />} label="Phone" value={student.phone} />
          <InfoRow icon={<Mail size={15} />} label="Email" value={student.email} />
          <InfoRow icon={<MapPin size={15} />} label="Address" value={student.address} />
          <InfoRow icon={<Calendar size={15} />} label="Admission Date" value={formatDate(student.admissionDate)} />
        </div>
      </div>

      {parent && (
        <div className="py-5 border-b border-slate-100">
          <h4 className="font-semibold text-slate-900 mb-3">Parent / Guardian</h4>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Avatar name={parent.name} size="md" />
            <div><p className="font-medium text-slate-800">{parent.name}</p><p className="text-xs text-slate-500">{parent.relation} • {parent.occupation}</p><p className="text-xs text-slate-500">{parent.phone} • {parent.email}</p></div>
          </div>
        </div>
      )}

      <div className="py-5">
        <h4 className="font-semibold text-slate-900 mb-3">Recent Results</h4>
        <div className="space-y-2">
          {results.slice(0, 5).map((r) => {
            const subject = getClassById(r.subjectId);
            return (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm font-medium text-slate-700">Subject {r.subjectId}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">{r.marks}/100</span>
                  <Badge variant={r.grade.startsWith('A') ? 'success' : r.grade === 'F' ? 'danger' : 'neutral'}>{r.grade}</Badge>
                </div>
              </div>
            );
          })}
          {results.length === 0 && <p className="text-sm text-slate-500">No results recorded yet.</p>}
        </div>
      </div>
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2.5"><span className="text-slate-400">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-medium text-slate-800">{value}</p></div></div>;
}

function StudentForm({ student, onClose }: { student: Student | null; onClose: () => void }) {
  const isEdit = !!student;
  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Student' : 'Add New Student'} subtitle={isEdit ? `Updating ${student.name}` : 'Fill in the student details below'} size="lg"
      footer={<><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={onClose} className="btn-primary"><CheckCircle2 size={16} /> {isEdit ? 'Save Changes' : 'Add Student'}</button></>}>
      <div className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Basic Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input className="input" defaultValue={student?.name} placeholder="e.g. Ahmed Khan" /></div>
            <div><label className="label">Roll Number</label><input className="input" defaultValue={student?.rollNo} placeholder="e.g. 1-001" /></div>
            <div><label className="label">Gender</label><select className="input" defaultValue={student?.gender}><option>Male</option><option>Female</option></select></div>
            <div><label className="label">Date of Birth</label><input type="date" className="input" defaultValue={student?.dob} /></div>
            <div><label className="label">Blood Group</label><select className="input" defaultValue={student?.bloodGroup}>{['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((b) => <option key={b}>{b}</option>)}</select></div>
            <div><label className="label">Status</label><select className="input" defaultValue={student?.status}><option>Active</option><option>Inactive</option><option>Graduated</option></select></div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Academic Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Class</label><select className="input" defaultValue={student?.classId}>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label">Section</label><select className="input" defaultValue={student?.section}><option>A</option><option>B</option><option>C</option></select></div>
            <div><label className="label">Admission Date</label><input type="date" className="input" defaultValue={student?.admissionDate} /></div>
            <div><label className="label">Parent / Guardian</label><select className="input"><option>Select parent...</option></select></div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Phone</label><input className="input" defaultValue={student?.phone} placeholder="0300 1234567" /></div>
            <div><label className="label">Email</label><input className="input" defaultValue={student?.email} placeholder="student@bmhs.edu.pk" /></div>
            <div className="sm:col-span-2"><label className="label">Address</label><textarea className="input" rows={2} defaultValue={student?.address} placeholder="House #, Madina Colony, Ellah Abad" /></div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
