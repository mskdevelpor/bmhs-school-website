import { useState, useMemo } from 'react';
import { Wallet, Download, Eye, CheckCircle2, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { Card, Badge, SectionHeader, StatCard } from '@/components/ui/Card';
import { Avatar, SearchInput, Select, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { feeInvoices, students, getStudentById, getClassById, SCHOOL } from '@/data/mockData';
import type { FeeInvoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusVariant = { Paid: 'success', Partial: 'warning', Unpaid: 'neutral', Overdue: 'danger' } as const;

export function FeesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<FeeInvoice | null>(null);
  const [showCollect, setShowCollect] = useState(false);

  const filtered = useMemo(() => feeInvoices.filter((f) => {
    const student = getStudentById(f.studentId);
    const matchSearch = !search || student?.name.toLowerCase().includes(search.toLowerCase()) || student?.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || f.status === statusFilter;
    return matchSearch && matchStatus;
  }), [search, statusFilter]);

  const totalCollected = feeInvoices.reduce((s, f) => s + f.paid, 0);
  const totalPending = feeInvoices.reduce((s, f) => s + (f.amount - f.paid), 0);
  const overdueCount = feeInvoices.filter((f) => f.status === 'Overdue').length;
  const paidCount = feeInvoices.filter((f) => f.status === 'Paid').length;

  const columns: Column<FeeInvoice>[] = [
    { key: 'student', header: 'Student', sortable: true, sortValue: (r) => getStudentById(r.studentId)?.name || '', render: (f) => {
      const s = getStudentById(f.studentId);
      return s ? <div className="flex items-center gap-3"><Avatar name={s.name} size="sm" /><div><p className="font-medium text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.rollNo}</p></div></div> : '—'; } },
    { key: 'class', header: 'Class', render: (f) => { const s = getStudentById(f.studentId); return s ? <span className="text-slate-600">{getClassById(s.classId)?.name}</span> : '—'; } },
    { key: 'term', header: 'Term', render: (f) => <span className="text-slate-600">{f.term}</span> },
    { key: 'amount', header: 'Amount', sortable: true, sortValue: (r) => r.amount, render: (f) => <span className="font-medium text-slate-800">{formatCurrency(f.amount)}</span> },
    { key: 'paid', header: 'Paid', render: (f) => <span className="text-emerald-600 font-medium">{formatCurrency(f.paid)}</span> },
    { key: 'due', header: 'Due', render: (f) => <span className="text-rose-600 font-medium">{formatCurrency(f.amount - f.paid)}</span> },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (f) => <Badge variant={statusVariant[f.status]}>{f.status}</Badge> },
    { key: 'actions', header: '', className: 'text-right', render: (f) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); setSelected(f); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={16} /></button>
        {f.status !== 'Paid' && <button onClick={(e) => { e.stopPropagation(); setSelected(f); setShowCollect(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"><Wallet size={16} /></button>}
      </div>) },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Fees Management" subtitle={`${SCHOOL.currentTerm} • Session ${SCHOOL.currentSession}`}
        action={<><button className="btn-secondary"><Download size={16} /> Export</button><button onClick={() => setShowCollect(true)} className="btn-primary"><Wallet size={16} /> Collect Fee</button></>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Collected" value={formatCurrency(totalCollected)} icon={<TrendingUp size={22} />} color="brand" />
        <StatCard label="Total Pending" value={formatCurrency(totalPending)} icon={<Clock size={22} />} color="amber" />
        <StatCard label="Fully Paid" value={paidCount} icon={<CheckCircle2 size={22} />} color="brand" />
        <StatCard label="Overdue" value={overdueCount} icon={<AlertCircle size={22} />} color="rose" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student name or roll no..." className="flex-1" />
          <Select value={statusFilter} onChange={setStatusFilter} placeholder="All Status" options={[{ value: 'Paid', label: 'Paid' }, { value: 'Partial', label: 'Partial' }, { value: 'Unpaid', label: 'Unpaid' }, { value: 'Overdue', label: 'Overdue' }]} className="sm:w-40" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataTable columns={columns} data={filtered} rowKey={(f) => f.id} onRowClick={(f) => setSelected(f)}
          emptyState={<EmptyState icon={<Wallet size={28} />} title="No fee records found" description="Try adjusting your search or filters." />} />
      </Card>

      {selected && !showCollect && <FeeDetail invoice={selected} onClose={() => setSelected(null)} onCollect={() => setShowCollect(true)} />}
      {showCollect && selected && <CollectFee invoice={selected} onClose={() => { setShowCollect(false); setSelected(null); }} />}
      {showCollect && !selected && <CollectFee onClose={() => setShowCollect(false)} />}
    </div>
  );
}

function FeeDetail({ invoice, onClose, onCollect }: { invoice: FeeInvoice; onClose: () => void; onCollect: () => void }) {
  const student = getStudentById(invoice.studentId);
  const cls = student ? getClassById(student.classId) : null;
  return (
    <Modal open onClose={onClose} title="Fee Invoice Details" size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Close</button>{invoice.status !== 'Paid' && <button onClick={onCollect} className="btn-primary"><Wallet size={16} /> Collect Payment</button>}</>}>
      {student && (
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <Avatar name={student.name} size="md" />
          <div><p className="font-semibold text-slate-800">{student.name}</p><p className="text-sm text-slate-500">{student.rollNo} • {cls?.name}</p></div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 py-5">
        <div className="p-4 rounded-xl bg-slate-50"><p className="text-xs text-slate-500">Total Amount</p><p className="text-xl font-bold font-display text-slate-900 mt-1">{formatCurrency(invoice.amount)}</p></div>
        <div className="p-4 rounded-xl bg-emerald-50"><p className="text-xs text-emerald-600">Paid</p><p className="text-xl font-bold font-display text-emerald-700 mt-1">{formatCurrency(invoice.paid)}</p></div>
        <div className="p-4 rounded-xl bg-rose-50"><p className="text-xs text-rose-600">Remaining</p><p className="text-xl font-bold font-display text-rose-700 mt-1">{formatCurrency(invoice.amount - invoice.paid)}</p></div>
        <div className="p-4 rounded-xl bg-slate-50"><p className="text-xs text-slate-500">Status</p><p className="mt-1"><Badge variant={statusVariant[invoice.status]}>{invoice.status}</Badge></p></div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Term</span><span className="font-medium text-slate-800">{invoice.term}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span className="font-medium text-slate-800">{formatDate(invoice.dueDate)}</span></div>
        {invoice.method && <div className="flex justify-between"><span className="text-slate-500">Payment Method</span><span className="font-medium text-slate-800">{invoice.method}</span></div>}
        {invoice.paidDate && <div className="flex justify-between"><span className="text-slate-500">Paid Date</span><span className="font-medium text-slate-800">{formatDate(invoice.paidDate)}</span></div>}
      </div>
    </Modal>
  );
}

function CollectFee({ invoice, onClose }: { invoice?: FeeInvoice; onClose: () => void }) {
  const student = invoice ? getStudentById(invoice.studentId) : null;
  const remaining = invoice ? invoice.amount - invoice.paid : 0;
  return (
    <Modal open onClose={onClose} title="Collect Fee Payment" subtitle={student ? `${student.name} • ${student.rollNo}` : 'Select a student to collect fee'} size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={onClose} className="btn-primary"><CheckCircle2 size={16} /> Record Payment</button></>}>
      <div className="space-y-4">
        {!invoice && <div><label className="label">Select Student</label><select className="input"><option value="">Choose student...</option>{students.slice(0, 10).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>)}</select></div>}
        {invoice && (
          <div className="p-4 rounded-xl bg-slate-50 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total Amount</span><span className="font-semibold">{formatCurrency(invoice.amount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Already Paid</span><span className="font-semibold text-emerald-600">{formatCurrency(invoice.paid)}</span></div>
            <div className="flex justify-between pt-2 border-t border-slate-200"><span className="font-medium text-slate-700">Remaining</span><span className="font-bold text-rose-600">{formatCurrency(remaining)}</span></div>
          </div>
        )}
        <div><label className="label">Payment Amount</label><input type="number" className="input" defaultValue={remaining || ''} placeholder="Enter amount" /></div>
        <div><label className="label">Payment Method</label><select className="input"><option>Cash</option><option>Bank</option><option>Online</option><option>Card</option></select></div>
        <div><label className="label">Date</label><input type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} /></div>
        <div><label className="label">Remarks (optional)</label><textarea className="input" rows={2} placeholder="Any notes..." /></div>
      </div>
    </Modal>
  );
}
