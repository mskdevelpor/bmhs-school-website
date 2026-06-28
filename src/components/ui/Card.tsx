import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps { children: ReactNode; className?: string; hover?: boolean; }
export function Card({ children, className, hover }: CardProps) {
  return <div className={cn('card', hover && 'card-hover', className)}>{children}</div>;
}

interface StatCardProps {
  label: string; value: string | number; icon: ReactNode;
  trend?: { value: string; up: boolean }; color?: 'brand' | 'blue' | 'amber' | 'rose' | 'slate';
}
const colorMap = {
  brand: 'bg-brand-50 text-brand-600', blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
};
export function StatCard({ label, value, icon, trend, color = 'brand' }: StatCardProps) {
  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold font-display text-slate-900">{value}</p>
          {trend && (
            <p className={cn('mt-2 text-xs font-medium flex items-center gap-1', trend.up ? 'text-emerald-600' : 'text-rose-500')}>
              {trend.up ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', colorMap[color])}>{icon}</div>
      </div>
    </Card>
  );
}

interface BadgeProps { children: ReactNode; variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand'; className?: string; }
const badgeMap = {
  success: 'bg-emerald-50 text-emerald-700', warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700', info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-slate-100 text-slate-600', brand: 'bg-brand-50 text-brand-700',
};
export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return <span className={cn('badge', badgeMap[variant], className)}>{children}</span>;
}

interface SectionHeaderProps { title: string; subtitle?: string; action?: ReactNode; }
export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
