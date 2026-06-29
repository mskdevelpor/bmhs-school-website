import { type ReactNode } from 'react';
import { cn, initials, avatarColor } from '@/lib/utils';

interface AvatarProps { name: string; size?: 'sm' | 'md' | 'lg'; className?: string; }
const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return <div className={cn('flex items-center justify-center rounded-full font-semibold flex-shrink-0', avatarColor(name), sizeMap[size], className)}>{initials(name)}</div>;
}

interface EmptyStateProps { icon: ReactNode; title: string; description?: string; action?: ReactNode; }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface SearchInputProps { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; }
export function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pl-10" />
    </div>
  );
}

interface SelectProps { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string; className?: string; }
export function Select({ value, onChange, options, placeholder, className }: SelectProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cn('input cursor-pointer', className)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
