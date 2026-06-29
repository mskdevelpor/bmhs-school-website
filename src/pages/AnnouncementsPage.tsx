import { useState, useMemo, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Eye, Edit, Trash2, CheckCircle2, Users, GraduationCap, UserCog, Send, MessageSquare, Bell, Loader2, AlertCircle } from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui/Card';
import { Select, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { SCHOOL } from '@/data/mockData';
import type { Announcement } from '@/types';
import { formatDate } from '@/lib/utils';

const priorityVariant = { High: 'danger', Normal: 'info', Low: 'neutral' } as const;
const audienceIcon = { All: Users, Teachers: GraduationCap, Parents: UserCog, Students: Users };

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  audience: 'All' | 'Teachers' | 'Parents' | 'Students';
  priority: 'Low' | 'Normal' | 'High';
  status: 'Active' | 'Draft' | 'Expired';
  date: string;
  expiry_date: string | null;
  created_by: string;
  created_at: string;
};

const mapRow = (r: AnnouncementRow): Announcement => ({
  id: r.id,
  title: r.title,
  content: r.content,
  category: r.category,
  audience: r.audience,
  priority: r.priority,
  status: r.status,
  date: r.date,
  expiryDate: r.expiry_date,
  createdBy: r.created_by,
  createdAt: r.created_at,
});

const emptyForm = {
  title: '',
  content: '',
  audience: 'All' as Announcement['audience'],
  priority: 'Normal' as Announcement['priority'],
  category: 'General',
  status: 'Active' as Announcement['status'],
  date: new Date().toISOString().slice(0, 10),
  expiryDate: '',
};

export function AnnouncementsPage() {
  const [audienceFilter, setAudienceFilter] = useState('');
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [data, setData] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('announcements')
      .select('id, title, content, category, audience, priority, status, date, expiry_date, created_by, created_at')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setData((rows as AnnouncementRow[]).map(mapRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const filtered = useMemo(() => data.filter((a) => !audienceFilter || a.audience === audienceFilter), [data, audienceFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({
      title: a.title,
      content: a.content,
      audience: a.audience,
      priority: a.priority,
      category: a.category || 'General',
      status: a.status || 'Active',
      date: a.date ? a.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      expiryDate: a.expiryDate ? a.expiryDate.slice(0, 10) : '',
    });
    setSelected(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      audience: form.audience,
      priority: form.priority,
      status: form.status,
      date: form.date,
      expiry_date: form.expiryDate || null,
    };
    let err: { message: string } | null = null;
    if (editing) {
      const { error: e } = await supabase.from('announcements').update(payload).eq('id', editing.id);
      err = e;
    } else {
      const { error: e } = await supabase.from('announcements').insert(payload);
      err = e;
    }
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setShowForm(false);
    setEditing(null);
    await fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error: err } = await supabase.from('announcements').delete().eq('id', id);
    setDeletingId(null);
    if (err) {
      setError(err.message);
      return;
    }
    if (selected?.id === id) setSelected(null);
    await fetchAnnouncements();
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Announcements & Messages" subtitle={`${filtered.length} announcements • ${SCHOOL.currentSession}`}
        action={<div className="flex gap-2"><button onClick={() => setShowMessage(true)} className="btn-secondary"><MessageSquare size={16} /> Send Message</button><button onClick={openCreate} className="btn-primary"><Plus size={16} /> New Announcement</button></div>} />

      <Card className="p-4">
        <Select value={audienceFilter} onChange={setAudienceFilter} placeholder="All Audiences"
          options={[{ value: 'All', label: 'All' }, { value: 'Teachers', label: 'Teachers' }, { value: 'Parents', label: 'Parents' }, { value: 'Students', label: 'Students' }]} className="max-w-xs" />
      </Card>

      {error && (
        <Card className="p-4">
          <div className="flex items-start gap-3 text-rose-700 bg-rose-50 rounded-xl p-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Failed to load announcements</p>
              <p className="text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-10">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading announcements…</span>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-5"><EmptyState icon={<Megaphone size={28} />} title="No announcements" description="Create a new announcement to notify parents, teachers, or students." /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((a) => {
            const Icon = audienceIcon[a.audience] || Megaphone;
            return (
              <Card key={a.id} hover className="p-5 cursor-pointer" >
                <div onClick={() => setSelected(a)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600"><Megaphone size={18} /></div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{a.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(a.date)} • {a.createdBy || 'Admin'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant={priorityVariant[a.priority]}>{a.priority}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{a.content}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500"><Icon size={12} /> {a.audience}</span>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setSelected(a); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(a); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }} disabled={deletingId === a.id} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50">
                        {deletingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.title} size="md"
          footer={<><button onClick={() => setSelected(null)} className="btn-secondary">Close</button><button onClick={() => openEdit(selected)} className="btn-primary"><Edit size={16} /> Edit</button></>}>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={priorityVariant[selected.priority]}>{selected.priority}</Badge>
            <Badge variant="brand">{selected.audience}</Badge>
            <span className="text-xs text-slate-500">{formatDate(selected.date)}</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{selected.content}</p>
          <p className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">Posted by: {selected.createdBy || 'Admin'}</p>
        </Modal>
      )}

      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Edit Announcement' : 'New Announcement'} subtitle={editing ? 'Update announcement details' : 'Create a new announcement'} size="md"
          footer={<><button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} {editing ? 'Save Changes' : 'Publish'}</button></>}>
          <div className="space-y-4">
            <div><label className="label">Title</label><input className="input" placeholder="Announcement title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className="label">Message</label><textarea className="input" rows={4} placeholder="Write your announcement..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Audience</label>
                <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as Announcement['audience'] })}>
                  <option>All</option><option>Teachers</option><option>Parents</option><option>Students</option>
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Announcement['priority'] })}>
                  <option>Normal</option><option>High</option><option>Low</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="label">Expiry Date</label><input type="date" className="input" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
            </div>
          </div>
        </Modal>
      )}

      {showMessage && (
        <Modal open onClose={() => setShowMessage(false)} title="Send Message" subtitle="Send a direct message to students, parents, or teachers" size="md"
          footer={<><button onClick={() => setShowMessage(false)} className="btn-secondary">Cancel</button><button onClick={() => setShowMessage(false)} className="btn-primary"><Send size={16} /> Send Message</button></>}>
          <div className="space-y-4">
            <div>
              <label className="label">Send To</label>
              <select className="input">
                <option>All Students</option>
                <option>All Parents</option>
                <option>All Teachers</option>
                <option>Specific Class — Class 1</option>
                <option>Specific Class — Class 2</option>
                <option>Specific Class — Class 3</option>
                <option>Specific Student</option>
              </select>
            </div>
            <div>
              <label className="label">Message Channel</label>
              <div className="grid grid-cols-3 gap-2">
                <button className="btn-secondary text-xs justify-center"><Bell size={14} /> In-App</button>
                <button className="btn-secondary text-xs justify-center"><MessageSquare size={14} /> SMS</button>
                <button className="btn-secondary text-xs justify-center bg-green-50 border-green-200 text-green-700"><Send size={14} /> WhatsApp</button>
              </div>
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input" placeholder="Message subject" />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea className="input" rows={4} placeholder="Type your message here..." />
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-xs text-blue-700">
              <p className="font-medium mb-1">Note:</p>
              <p>When backend (Supabase) is connected, messages will be delivered to selected recipients. SMS requires a separate SMS gateway (jazz, telenor, etc.).</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
