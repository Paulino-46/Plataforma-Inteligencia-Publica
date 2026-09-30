'use client';

import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Ocupa mais colunas no grid (ex: "lg:col-span-2"). */
  className?: string;
  loading?: boolean;
  empty?: boolean;
  emptyLabel?: string;
  children: ReactNode;
}

/** Cartão padrão (glassmorphism) que envolve cada gráfico da Dashboard. */
export default function ChartCard({
  title,
  subtitle,
  icon,
  className = '',
  loading = false,
  empty = false,
  emptyLabel = 'Sem dados disponíveis.',
  children,
}: ChartCardProps) {
  return (
    <div
      className={`bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl ${className}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-cyan-400">{icon}</span>}
        <h4 className="text-white font-semibold">{title}</h4>
      </div>
      {subtitle && <p className="text-xs text-slate-500 mb-4">{subtitle}</p>}

      {loading ? (
        <div className="h-56 bg-slate-800/40 rounded-2xl animate-pulse" />
      ) : empty ? (
        <div className="h-56 flex items-center justify-center">
          <p className="text-slate-500 italic text-sm">{emptyLabel}</p>
        </div>
      ) : (
        <div className="h-56 w-full">{children}</div>
      )}
    </div>
  );
}
