import { useState, useMemo } from 'react';
import { UserPlus, Eye, Edit, Phone, Mail, MapPin, Briefcase, Users as UsersIcon, CheckCircle2 } from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui/Card';
import { Avatar, SearchInput, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { parents, getStudentById, getClassById } from '@/data/mockData';
import type { Parent } from '@/types';

export function ParentsPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Parent | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => parents.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)), [search]);

  const columns: Column<Parent>[] = [
    { key: 'name', header: 'Parent', sortable: true, sortValue: (r) => r.name, render: (p) => (
      <div className="flex items-center gap-3"><Avatar name={p.name} size="sm" /><div><p className="font-medium text-slate-800">{p.name}</p><p className="text-xs text-slate-500">{p.relation}</p></div></div>) },
    { key: 'occupation', header: 'Occupation', render: (p) => <span className="text-slate-600">{p.occupation}</span> },
    { key: 'phone', header: 'Phone', render: (p) => <span className="text-slate-600">{p.phone}</span> },
    { key: 'email', header: 'Email', render: (p) => <span className="text-slate-600">{p.email}</span> },
    { key: 'children', header: 'Children', render: (p) => <Badge variant="brand">{p.studentIds.length} enrolled</Badge> },
    { key: 'actions', header: '', className: 'text-right', render: (p) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); setSelected(p); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={16} /></button>
        <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
      </div>) },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Parents & Guardians" subtitle={`${filtered.length} of ${parents.length} parents`}
        action={<button onClick={() => setShowForm(true)} className="btn-primary"><UserPlus size={16} /> Add Parent</button>} />
      <Card className="p-4"><SearchInput value={search} onChange={setSearch} placeholder="Search by name or phone..." className="max-w-md" /></Card>
      <Card className="overflow-hidden">
        <DataTable columns={columns} data={filtered} rowKey={(p) => p.id} onRowClick={(p) => setSelected(p)}
          emptyState={<EmptyState icon={<UsersIcon size={28} />} title="No parents found" description="Try adjusting your search or add a new parent." />} />
      </Card>
      {selected && <ParentDetail parent={selected} onClose={() => setSelected(null)} />}
      {showForm && <ParentForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function ParentDetail({ parent, onClose }: { parent: Parent; onClose: () => void }) {
  const children = parent.studentIds.map((id) => getStudentById(id)).filter(Boolean);
  return (
    <Modal open onClose={onClose} title="Parent Details" size="md" footer={<button onClick={onClose} className="btn-secondary">Close</button>}>
      <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
        <Avatar name={parent.name} size="lg" />
        <div><h3 className="text-xl font-bold font-display text-slate-900">{parent.name}</h3><Badge variant="brand" className="mt-1">{parent.relation}</Badge></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-5 border-b border-slate-100 text-sm">
        <InfoRow icon={<Phone size={15} />} label="Phone" value={parent.phone} />
        <InfoRow icon={<Mail size={15} />} label="Email" value={parent.email} />
        <InfoRow icon={<Briefcase size={15} />} label="Occupation" value={parent.occupation} />
        <InfoRow icon={<MapPin size={15} />} label="Address" value={parent.address} />
      </div>
      <div className="py-5">
        <h4 className="font-semibold text-slate-900 mb-3">Children ({children.length})</h4>
        <div className="space-y-2">
          {children.map((c) => c && (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <Avatar name={c.name} size="sm" />
              <div className="flex-1"><p className="text-sm font-medium text-slate-800">{c.name}</p><p className="text-xs text-slate-500">{c.rollNo} • {getClassById(c.classId)?.name}</p></div>
              <Badge variant={c.status === 'Active' ? 'success' : 'neutral'}>{c.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2.5"><span className="text-slate-400">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-medium text-slate-800">{value}</p></div></div>;
}

function ParentForm({ onClose }: { onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Add New Parent" subtitle="Fill in the parent/guardian details" size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={onClose} className="btn-primary"><CheckCircle2 size={16} /> Add Parent</button></>}>
      <div className="space-y-4">
        <div><label className="label">Full Name</label><input className="input" placeholder="e.g. Ahmed Khan" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Relation</label><select className="input"><option>Father</option><option>Mother</option><option>Guardian</option></select></div>
          <div><label className="label">Occupation</label><input className="input" placeholder="e.g. Engineer" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Phone</label><input className="input" placeholder="0300 1234567" /></div>
          <div><label className="label">Email</label><input className="input" placeholder="parent@example.com" /></div>
        </div>
        <div><label className="label">Address</label><textarea className="input" rows={2} placeholder="House #, Madina Colony, Ellah Abad" /></div>
      </div>
    </Modal>
  );
}
