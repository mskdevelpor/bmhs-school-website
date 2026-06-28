import { useState, useMemo } from 'react';
import { Megaphone, Plus, Eye, Edit, Trash2, CheckCircle2, Users, GraduationCap, UserCog, Send, MessageSquare, Bell } from 'lucide-react';
import { Card, Badge, SectionHeader } from '@/components/ui/Card';
import { Select, EmptyState } from '@/components/ui/Common';
import { Modal } from '@/components/ui/Modal';
import { announcements, SCHOOL } from '@/data/mockData';
import type { Announcement } from '@/types';
import { formatDate } from '@/lib/utils';

const priorityVariant = { High: 'danger', Normal: 'info', Low: 'neutral' } as const;
const audienceIcon = { All: Users, Teachers: GraduationCap, Parents: UserCog, Students: Users };

export function AnnouncementsPage() {
  const [audienceFilter, setAudienceFilter] = useState('');
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const filtered = useMemo(() => announcements.filter((a) => !audienceFilter || a.audience === audienceFilter), [audienceFilter]);

  return (
    <div className="space-y-5">
      <SectionHeader title="Announcements & Messages" subtitle={`${filtered.length} announcements • ${SCHOOL.currentSession}`}
        action={<div className="flex gap-2"><button onClick={() => setShowMessage(true)} className="btn-secondary"><MessageSquare size={16} /> Send Message</button><button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> New Announcement</button></div>} />

      <Card className="p-4">
        <Select value={audienceFilter} onChange={setAudienceFilter} placeholder="All Audiences"
          options={[{ value: 'All', label: 'All' }, { value: 'Teachers', label: 'Teachers' }, { value: 'Parents', label: 'Parents' }, { value: 'Students', label: 'Students' }]} className="max-w-xs" />
      </Card>

      {filtered.length === 0 ? (
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
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(a.date)} • {a.author}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant={priorityVariant[a.priority]}>{a.priority}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{a.body}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500"><Icon size={12} /> {a.audience}</span>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setSelected(a); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={14} /></button>
                      <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                      <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
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
          footer={<><button onClick={() => setSelected(null)} className="btn-secondary">Close</button><button className="btn-primary"><Edit size={16} /> Edit</button></>}>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={priorityVariant[selected.priority]}>{selected.priority}</Badge>
            <Badge variant="brand">{selected.audience}</Badge>
            <span className="text-xs text-slate-500">{formatDate(selected.date)}</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{selected.body}</p>
          <p className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">Posted by: {selected.author}</p>
        </Modal>
      )}

      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title="New Announcement" subtitle="Create a new announcement" size="md"
          footer={<><button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button onClick={() => setShowForm(false)} className="btn-primary"><CheckCircle2 size={16} /> Publish</button></>}>
          <div className="space-y-4">
            <div><label className="label">Title</label><input className="input" placeholder="Announcement title" /></div>
            <div><label className="label">Message</label><textarea className="input" rows={4} placeholder="Write your announcement..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Audience</label><select className="input"><option>All</option><option>Teachers</option><option>Parents</option><option>Students</option></select></div>
              <div><label className="label">Priority</label><select className="input"><option>Normal</option><option>High</option><option>Low</option></select></div>
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
