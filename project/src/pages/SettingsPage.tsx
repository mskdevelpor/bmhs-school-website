import { useState } from 'react';
import { School, Save, User, Bell, Shield, Database } from 'lucide-react';
import { Card, SectionHeader, Badge } from '@/components/ui/Card';
import { SCHOOL } from '@/data/mockData';
import { cn } from '@/lib/utils';

type Tab = 'general' | 'profile' | 'notifications' | 'security' | 'integrations';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <School size={18} /> },
  { id: 'profile', label: 'Profile', icon: <User size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  { id: 'integrations', label: 'Integrations', icon: <Database size={18} /> },
];

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general');

  return (
    <div className="space-y-5">
      <SectionHeader title="Settings" subtitle="Manage school configuration and preferences" />

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Tabs sidebar */}
        <Card className="p-2 lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                  tab === t.id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50')}>
                <span className={tab === t.id ? 'text-brand-600' : 'text-slate-400'}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {tab === 'general' && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">School Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">School Name</label><input className="input" defaultValue={SCHOOL.name} /></div>
                <div><label className="label">Short Name</label><input className="input" defaultValue={SCHOOL.shortName} /></div>
                <div><label className="label">Address</label><input className="input" defaultValue={SCHOOL.address} /></div>
                <div><label className="label">Phone</label><input className="input" defaultValue={SCHOOL.phone} /></div>
                <div><label className="label">Email</label><input className="input" defaultValue={SCHOOL.email} /></div>
                <div><label className="label">Current Session</label><input className="input" defaultValue={SCHOOL.currentSession} placeholder="Auto-calculated" /></div>
                <div><label className="label">Current Term</label><input className="input" defaultValue={SCHOOL.currentTerm} placeholder="Auto-calculated" /></div>
                <div><label className="label">Established</label><input className="input" defaultValue={String(SCHOOL.established)} /></div>
                <div><label className="label">Website</label><input className="input" defaultValue={SCHOOL.website} /></div>
                <div className="sm:col-span-2"><label className="label">Affiliation</label><input className="input" defaultValue={SCHOOL.affiliation} /></div>
              </div>
              <p className="mt-3 text-xs text-slate-400">Session and Term auto-calculate based on current date. Academic year starts in April.</p>
              <div className="mt-5"><button className="btn-primary"><Save size={16} /> Save Changes</button></div>
            </Card>
          )}

          {tab === 'profile' && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Principal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Principal Name</label><input className="input" defaultValue={SCHOOL.principal} /></div>
                <div><label className="label">Principal Phone</label><input className="input" defaultValue={SCHOOL.principalPhone} /></div>
              </div>
              <h3 className="font-semibold text-slate-900 mt-6 mb-4">Admin Account</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Admin Name</label><input className="input" defaultValue="Admin User" /></div>
                <div><label className="label">Admin Email</label><input className="input" defaultValue="admin@bmhs.edu.pk" /></div>
              </div>
              <div className="mt-5"><button className="btn-primary"><Save size={16} /> Save Changes</button></div>
            </Card>
          )}

          {tab === 'notifications' && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: 'Email notifications for new admissions', desc: 'Get notified when a new student is admitted' },
                  { label: 'SMS alerts for fee payments', desc: 'Send SMS to parents when fees are received' },
                  { label: 'Attendance reminders', desc: 'Daily reminder to mark attendance' },
                  { label: 'Result notifications', desc: 'Notify parents when results are published' },
                  { label: 'Announcement alerts', desc: 'Send alerts for new announcements' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div><p className="text-sm font-medium text-slate-800">{item.label}</p><p className="text-xs text-slate-500 mt-0.5">{item.desc}</p></div>
                    <ToggleSwitch defaultOn={i % 2 === 0} />
                  </div>
                ))}
              </div>
              <div className="mt-5"><button className="btn-primary"><Save size={16} /> Save Preferences</button></div>
            </Card>
          )}

          {tab === 'security' && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div><label className="label">Current Password</label><input type="password" className="input" placeholder="••••••••" /></div>
                <div><label className="label">New Password</label><input type="password" className="input" placeholder="••••••••" /></div>
                <div><label className="label">Confirm Password</label><input type="password" className="input" placeholder="••••••••" /></div>
              </div>
              <div className="mt-5"><button className="btn-primary"><Save size={16} /> Update Password</button></div>
            </Card>
          )}

          {tab === 'integrations' && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Backend Integration</h3>
              <p className="text-sm text-slate-500 mb-4">Connect a backend service to enable real data, authentication, and notifications. The frontend design will not change when you connect a backend.</p>
              <div className="space-y-3">
                <IntegrationRow name="Supabase" description="Database, Auth, and Edge Functions" status="Not Connected" />
                <IntegrationRow name="Firebase" description="Database, Auth, and Cloud Messaging" status="Not Connected" />
                <IntegrationRow name="SMS Gateway" description="Send SMS notifications to parents" status="Not Connected" />
                <IntegrationRow name="Email Service" description="Send email notifications" status="Not Connected" />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ defaultOn }: { defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => setOn(!on)} className={cn('relative w-11 h-6 rounded-full transition-colors', on ? 'bg-brand-600' : 'bg-slate-300')}>
      <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', on ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}

function IntegrationRow({ name, description, status }: { name: string; description: string; status: string }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
      <div><p className="text-sm font-semibold text-slate-800">{name}</p><p className="text-xs text-slate-500 mt-0.5">{description}</p></div>
      <div className="flex items-center gap-3">
        <Badge variant="neutral">{status}</Badge>
        <button className="btn-secondary text-xs px-3 py-1.5">Connect</button>
      </div>
    </div>
  );
}
