import { useState, useMemo, useEffect, useCallback } from 'react';
import { Wallet, Download, Eye, CheckCircle2, TrendingUp, AlertCircle, Clock, Trash2, Pencil } from 'lucide-react';
import { Card, Badge, SectionHeader, StatCard } from '@/components/ui/Card';
import { Avatar, SearchInput, Select, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';

// ---- Types ----
// DB row shape (snake_case) coming from the `fees` table.
interface FeeRow {
  id: string;
  student_id: string;
  term: string;
  amount: number;
  paid_amount: number;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
  due_date: string | null;
  paid_date: string | null;
  method: string | null;
  notes: string | null;
}

interface StudentRow {
  id: string;
  name: string;
  roll_no: string;
  class_id: string | null;
}

interface ClassRow {
  id: string;
  name: string;
}

// Frontend-facing shape (camelCase) used by the UI.
interface FeeInvoice {
  id: string;
  studentId: string;
  term: string;
  amount: number;
  paidAmount: number;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
  dueDate: string | null;
  paidDate: string | null;
  method: string | null;
  notes: string | null;
}

interface Student {
  id: string;
  name: string;
  rollNo: string;
  classId: string | null;
}

interface ClassInfo {
  id: string;
  name: string;
}

const statusVariant = { Paid: 'success', Partial: 'warning', Unpaid: 'neutral', Overdue: 'danger' } as const;

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Annual'];
const METHODS: Array<FeeInvoice['method']> = ['Cash', 'Card', 'Bank', 'Online'];
const STATUSES: Array<FeeInvoice['status']> = ['Paid', 'Partial', 'Unpaid', 'Overdue'];

// ---- Mappers ----
function mapFee(r: FeeRow): FeeInvoice {
  return {
    id: r.id,
    studentId: r.student_id,
    term: r.term,
    amount: Number(r.amount),
    paidAmount: Number(r.paid_amount),
    status: r.status,
    dueDate: r.due_date,
    paidDate: r.paid_date,
    method: r.method,
    notes: r.notes,
  };
}

function mapStudent(r: StudentRow): Student {
  return { id: r.id, name: r.name, rollNo: r.roll_no, classId: r.class_id };
}

function mapClass(r: ClassRow): ClassInfo {
  return { id: r.id, name: r.name };
}

export function FeesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<FeeInvoice | null>(null);
  const [showCollect, setShowCollect] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FeeInvoice | null>(null);

  const [fees, setFees] = useState<FeeInvoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStudentById = useCallback((id: string) => students.find((s) => s.id === id), [students]);
  const getClassById = useCallback((id: string | null) => classes.find((c) => c.id === id), [classes]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [feesRes, studentsRes, classesRes] = await Promise.all([
        supabase.from('fees').select('id, student_id, term, amount, paid_amount, status, due_date, paid_date, method, notes'),
        supabase.from('students').select('id, name, roll_no, class_id'),
        supabase.from('classes').select('id, name'),
      ]);

      if (feesRes.error) throw feesRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (classesRes.error) throw classesRes.error;

      setFees((feesRes.data as FeeRow[]).map(mapFee));
      setStudents((studentsRes.data as StudentRow[]).map(mapStudent));
      setClasses((classesRes.data as ClassRow[]).map(mapClass));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fees data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => fees.filter((f) => {
    const student = getStudentById(f.studentId);
    const matchSearch = !search || student?.name.toLowerCase().includes(search.toLowerCase()) || student?.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || f.status === statusFilter;
    return matchSearch && matchStatus;
  }), [fees, search, statusFilter, getStudentById]);

  const totalCollected = fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalPending = fees.reduce((s, f) => s + (f.amount - f.paidAmount), 0);
  const overdueCount = fees.filter((f) => f.status === 'Overdue').length;
  const paidCount = fees.filter((f) => f.status === 'Paid').length;

  async function handleDelete(id: string) {
    if (!confirm('Delete this fee record? This cannot be undone.')) return;
    const { error: delError } = await supabase.from('fees').delete().eq('id', id);
    if (delError) {
      setError(delError.message);
      return;
    }
    if (selected?.id === id) setSelected(null);
    await fetchData();
  }

  function openEdit(invoice: FeeInvoice) {
    setEditing(invoice);
    setShowForm(true);
  }

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }

  const columns: Column<FeeInvoice>[] = [
    { key: 'student', header: 'Student', sortable: true, sortValue: (r) => getStudentById(r.studentId)?.name || '', render: (f) => {
      const s = getStudentById(f.studentId);
      return s ? <div className="flex items-center gap-3"><Avatar name={s.name} size="sm" /><div><p className="font-medium text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.rollNo}</p></div></div> : '—'; } },
    { key: 'class', header: 'Class', render: (f) => { const s = getStudentById(f.studentId); return s ? <span className="text-slate-600">{getClassById(s.classId)?.name}</span> : '—'; } },
    { key: 'term', header: 'Term', render: (f) => <span className="text-slate-600">{f.term}</span> },
    { key: 'amount', header: 'Amount', sortable: true, sortValue: (r) => r.amount, render: (f) => <span className="font-medium text-slate-800">{formatCurrency(f.amount)}</span> },
    { key: 'paid', header: 'Paid', render: (f) => <span className="text-emerald-600 font-medium">{formatCurrency(f.paidAmount)}</span> },
    { key: 'due', header: 'Due', render: (f) => <span className="text-rose-600 font-medium">{formatCurrency(f.amount - f.paidAmount)}</span> },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (f) => <Badge variant={statusVariant[f.status]}>{f.status}</Badge> },
    { key: 'actions', header: '', className: 'text-right', render: (f) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); setSelected(f); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" title="View"><Eye size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); openEdit(f); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit"><Pencil size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete"><Trash2 size={16} /></button>
        {f.status !== 'Paid' && <button onClick={(e) => { e.stopPropagation(); setSelected(f); setShowCollect(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors" title="Collect"><Wallet size={16} /></button>}
      </div>) },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Fees Management" subtitle="Manage fee invoices and payments"
        action={<><button className="btn-secondary"><Download size={16} /> Export</button><button onClick={openAdd} className="btn-primary"><Wallet size={16} /> Add Fee</button></>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Collected" value={formatCurrency(totalCollected)} icon={<TrendingUp size={22} />} color="brand" />
        <StatCard label="Total Pending" value={formatCurrency(totalPending)} icon={<Clock size={22} />} color="amber" />
        <StatCard label="Fully Paid" value={paidCount} icon={<CheckCircle2 size={22} />} color="brand" />
        <StatCard label="Overdue" value={overdueCount} icon={<AlertCircle size={22} />} color="rose" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student name or roll no..." className="flex-1" />
          <Select value={statusFilter} onChange={setStatusFilter} placeholder="All Status" options={STATUSES.map((s) => ({ value: s, label: s }))} className="sm:w-40" />
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 text-rose-700 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-500 hover:text-rose-700">Dismiss</button>
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="ml-3 text-sm">Loading fees...</span>
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} rowKey={(f) => f.id} onRowClick={(f) => setSelected(f)}
            emptyState={<EmptyState icon={<Wallet size={28} />} title="No fee records found" description="Try adjusting your search or filters." />} />
        )}
      </Card>

      {selected && !showCollect && !showForm && <FeeDetail invoice={selected} student={getStudentById(selected.studentId) || null} cls={getClassById(getStudentById(selected.studentId)?.classId ?? '') ?? null} onClose={() => setSelected(null)} onCollect={() => setShowCollect(true)} onEdit={() => openEdit(selected)} onDelete={() => handleDelete(selected.id)} />}
      {showCollect && selected && <CollectFee invoice={selected} student={getStudentById(selected.studentId) || null} onClose={() => { setShowCollect(false); setSelected(null); }} onSaved={fetchData} />}
      {showForm && <FeeForm editing={editing} students={students} classes={classes} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={fetchData} />}
    </div>
  );
}

function FeeDetail({ invoice, student, cls, onClose, onCollect, onEdit, onDelete }: {
  invoice: FeeInvoice;
  student: Student | null;
  cls: ClassInfo | null;
  onClose: () => void;
  onCollect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal open onClose={onClose} title="Fee Invoice Details" size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Close</button><button onClick={onEdit} className="btn-secondary"><Pencil size={16} /> Edit</button><button onClick={onDelete} className="btn-secondary text-rose-600"><Trash2 size={16} /> Delete</button>{invoice.status !== 'Paid' && <button onClick={onCollect} className="btn-primary"><Wallet size={16} /> Collect Payment</button>}</>}>
      {student && (
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <Avatar name={student.name} size="md" />
          <div><p className="font-semibold text-slate-800">{student.name}</p><p className="text-sm text-slate-500">{student.rollNo} • {cls?.name}</p></div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 py-5">
        <div className="p-4 rounded-xl bg-slate-50"><p className="text-xs text-slate-500">Total Amount</p><p className="text-xl font-bold font-display text-slate-900 mt-1">{formatCurrency(invoice.amount)}</p></div>
        <div className="p-4 rounded-xl bg-emerald-50"><p className="text-xs text-emerald-600">Paid</p><p className="text-xl font-bold font-display text-emerald-700 mt-1">{formatCurrency(invoice.paidAmount)}</p></div>
        <div className="p-4 rounded-xl bg-rose-50"><p className="text-xs text-rose-600">Remaining</p><p className="text-xl font-bold font-display text-rose-700 mt-1">{formatCurrency(invoice.amount - invoice.paidAmount)}</p></div>
        <div className="p-4 rounded-xl bg-slate-50"><p className="text-xs text-slate-500">Status</p><p className="mt-1"><Badge variant={statusVariant[invoice.status]}>{invoice.status}</Badge></p></div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Term</span><span className="font-medium text-slate-800">{invoice.term}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span className="font-medium text-slate-800">{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</span></div>
        {invoice.method && <div className="flex justify-between"><span className="text-slate-500">Payment Method</span><span className="font-medium text-slate-800">{invoice.method}</span></div>}
        {invoice.paidDate && <div className="flex justify-between"><span className="text-slate-500">Paid Date</span><span className="font-medium text-slate-800">{formatDate(invoice.paidDate)}</span></div>}
        {invoice.notes && <div className="flex justify-between"><span className="text-slate-500">Notes</span><span className="font-medium text-slate-800 text-right max-w-[60%]">{invoice.notes}</span></div>}
      </div>
    </Modal>
  );
}

function CollectFee({ invoice, student, onClose, onSaved }: {
  invoice: FeeInvoice;
  student: Student | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const remaining = invoice.amount - invoice.paidAmount;
  const [amount, setAmount] = useState<string>(String(remaining || ''));
  const [method, setMethod] = useState<string>('Cash');
  const [paidDate, setPaidDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>(invoice.notes || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    const amt = Number(amount);
    if (!amt || amt <= 0) { setErr('Enter a valid amount'); return; }
    const newPaid = invoice.paidAmount + amt;
    if (newPaid > invoice.amount) { setErr('Payment exceeds remaining amount'); return; }
    const newStatus: FeeInvoice['status'] = newPaid >= invoice.amount ? 'Paid' : 'Partial';

    setSaving(true);
    setErr(null);
    const { error: updError } = await supabase
      .from('fees')
      .update({
        paid_amount: newPaid,
        status: newStatus,
        method,
        paid_date: paidDate,
        notes: notes || null,
      })
      .eq('id', invoice.id);

    setSaving(false);
    if (updError) { setErr(updError.message); return; }
    await onSaved();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Collect Fee Payment" subtitle={student ? `${student.name} • ${student.rollNo}` : 'Record a payment'} size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={handleSave} disabled={saving} className="btn-primary"><CheckCircle2 size={16} /> {saving ? 'Saving...' : 'Record Payment'}</button></>}>
      <div className="space-y-4">
        {err && <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm"><AlertCircle size={16} /><span>{err}</span></div>}
        <div className="p-4 rounded-xl bg-slate-50 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Total Amount</span><span className="font-semibold">{formatCurrency(invoice.amount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Already Paid</span><span className="font-semibold text-emerald-600">{formatCurrency(invoice.paidAmount)}</span></div>
          <div className="flex justify-between pt-2 border-t border-slate-200"><span className="font-medium text-slate-700">Remaining</span><span className="font-bold text-rose-600">{formatCurrency(remaining)}</span></div>
        </div>
        <div><label className="label">Payment Amount</label><input type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" /></div>
        <div><label className="label">Payment Method</label><select className="input" value={(method || '') as string} onChange={(e) => setMethod(e.target.value)}><option value="">None</option>{METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
        <div><label className="label">Date</label><input type="date" className="input" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} /></div>
        <div><label className="label">Remarks (optional)</label><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." /></div>
      </div>
    </Modal>
  );
}

function FeeForm({ editing, students, classes, onClose, onSaved }: {
  editing: FeeInvoice | null;
  students: Student[];
  classes: ClassInfo[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [studentId, setStudentId] = useState<string>(editing?.studentId || '');
  const [term, setTerm] = useState<string>(editing?.term || TERMS[0]);
  const [amount, setAmount] = useState<string>(editing ? String(editing.amount) : '');
  const [paidAmount, setPaidAmount] = useState<string>(editing ? String(editing.paidAmount) : '0');
  const [status, setStatus] = useState<FeeInvoice['status']>(editing?.status || 'Unpaid');
  const [dueDate, setDueDate] = useState<string>(editing?.dueDate || '');
  const [paidDate, setPaidDate] = useState<string>(editing?.paidDate || '');
  const [method, setMethod] = useState<string>(editing?.method || '');  const [notes, setNotes] = useState<string>(editing?.notes || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    if (!studentId) { setErr('Select a student'); return; }
    const amt = Number(amount);
    const paid = Number(paidAmount) || 0;
    if (!amt || amt <= 0) { setErr('Enter a valid amount'); return; }
    if (paid > amt) { setErr('Paid amount cannot exceed total amount'); return; }

    const payload = {
      student_id: studentId,
      term,
      amount: amt,
      paid_amount: paid,
      status,
      due_date: dueDate || null,
      paid_date: paidDate || null,
      method: method || null,
      notes: notes || null,
    };

    setSaving(true);
    setErr(null);
    let res;
    if (editing) {
      res = await supabase.from('fees').update(payload).eq('id', editing.id);
    } else {
      res = await supabase.from('fees').insert(payload);
    }
    setSaving(false);
    if (res.error) { setErr(res.error.message); return; }
    await onSaved();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={editing ? 'Edit Fee' : 'Add Fee'} size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={handleSave} disabled={saving} className="btn-primary"><CheckCircle2 size={16} /> {saving ? 'Saving...' : 'Save'}</button></>}>
      <div className="space-y-4">
        {err && <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm"><AlertCircle size={16} /><span>{err}</span></div>}
        <div>
          <label className="label">Student</label>
          <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!!editing}>
            <option value="">Choose student...</option>
            {students.map((s) => {
              const cls = classes.find((c) => c.id === s.classId);
              return <option key={s.id} value={s.id}>{s.name} ({s.rollNo}){cls ? ` • ${cls.name}` : ''}</option>;
            })}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Term</label><select className="input" value={term} onChange={(e) => setTerm(e.target.value)}>{TERMS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="label">Status</label><select className="input" value={status} onChange={(e) => setStatus(e.target.value as FeeInvoice['status'])}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Total Amount</label><input type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" /></div>
          <div><label className="label">Paid Amount</label><input type="number" className="input" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Due Date</label><input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div><label className="label">Paid Date</label><input type="date" className="input" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} /></div>
        </div>
        <div><label className="label">Payment Method</label><select className="input" value={(method || '') as string} onChange={(e) => setMethod(e.target.value)}><option value="">None</option>{METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
        <div><label className="label">Notes (optional)</label><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." /></div>
      </div>
    </Modal>
  );
}
