'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryDatum } from '@/services/dadosService';

/* Paleta alinhada ao tema dark/cyan da dashboard. */
export const PALETTE = [
  '#22d3ee', // cyan-400
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
];

const AXIS = { fontSize: 11, fill: '#94a3b8' };
const GRID = '#1e293b';

/** Tooltip escuro consistente. */
function darkTooltip() {
  return {
    contentStyle: {
      background: 'rgba(15,23,42,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      color: '#e2e8f0',
      fontSize: 12,
    },
    labelStyle: { color: '#94a3b8' },
    cursor: { fill: 'rgba(255,255,255,0.04)' },
  };
}

interface CategoryChartProps {
  data: CategoryDatum[];
  /** Eixo de categoria na vertical (bom para labels longas). */
  horizontal?: boolean;
  color?: string;
}

/** Gráfico de barras a partir de [{label, value}]. */
export function CategoryBarChart({ data, horizontal = false, color = PALETTE[0] }: CategoryChartProps) {
  const tt = darkTooltip();
  return (
    <ResponsiveContainer width="100%" height="100%">
      {horizontal ? (
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip {...tt} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={color} />
        </BarChart>
      ) : (
        <BarChart data={data} margin={{ left: -16, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip {...tt} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

/** Gráfico de linha (ex: distribuição por período). */
export function CategoryLineChart({ data, color = PALETTE[0] }: CategoryChartProps) {
  const tt = darkTooltip();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip {...tt} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Gráfico de pizza/donut a partir de [{label, value}]. */
export function CategoryPieChart({ data }: CategoryChartProps) {
  const tt = darkTooltip();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={45}
          outerRadius={75}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip {...tt} />
        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          iconType="circle"
          wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
