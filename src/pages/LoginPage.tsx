import { useState } from 'react';
import { School, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { SCHOOL } from '@/data/mockData';

interface LoginPageProps { onNavigate: (path: string) => void; }

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('admin');

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="relative flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="BMS" className="w-14 h-14 rounded-xl object-cover bg-white/90 p-1" />
            <div>
              <h1 className="text-2xl font-bold font-display">{SCHOOL.name}</h1>
              <p className="text-brand-100 text-sm">{SCHOOL.address}</p>
            </div>
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold font-display leading-tight">School Management System</h2>
          <p className="mt-4 text-brand-100 text-lg max-w-md">{SCHOOL.tagline}</p>
          <div className="mt-8 space-y-3">
            {['Student & Teacher Management', 'Attendance & Fee Tracking', 'Results & Report Cards', 'Announcements & Notifications'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-brand-50">
                <div className="w-5 h-5 rounded-full bg-brand-400/30 flex items-center justify-center"><ArrowRight size={12} /></div>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-white/10">
            <p className="text-sm text-brand-100">Principal: <span className="font-semibold text-white">{SCHOOL.principal}</span></p>
            <p className="text-sm text-brand-100">Contact: <span className="font-semibold text-white">{SCHOOL.principalPhone}</span></p>
            <p className="text-sm text-brand-100 mt-2">Affiliated with <span className="font-semibold text-white">{SCHOOL.affiliation}</span></p>
            <p className="text-sm text-brand-100">Website: <span className="font-semibold text-white">{SCHOOL.website}</span></p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src="/logo.png" alt="BMS" className="w-12 h-12 rounded-xl object-cover" />
            <div><h1 className="text-xl font-bold font-display text-slate-900">{SCHOOL.name}</h1><p className="text-xs text-slate-500">{SCHOOL.address}</p></div>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold font-display text-slate-900">Welcome Back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue</p>

            {/* Role selector */}
            <div className="mt-6 grid grid-cols-4 gap-2">
              {['admin', 'teacher', 'parent', 'student'].map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium capitalize transition-all ${role === r ? 'bg-brand-600 text-white shadow-soft' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                  {r}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" className="input pl-10" placeholder="admin@bmhs.edu.pk" defaultValue="admin@bmhs.edu.pk" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="••••••••" defaultValue="password" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" /> Remember me
                </label>
                <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">Forgot password?</button>
              </div>
              <button onClick={() => onNavigate('/dashboard')} className="btn-primary w-full py-3">
                Sign In <ArrowRight size={16} />
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Demo mode — no authentication required. Click Sign In to explore the system.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} {SCHOOL.name}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
