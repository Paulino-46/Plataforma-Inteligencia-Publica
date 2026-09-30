'use client';

import { useEffect, useState } from 'react';
import {
  BsPeople,
  BsCheckCircle,
  BsPersonPlus,
  BsShieldLock,
  BsExclamationTriangle,
  BsClockHistory,
  BsBroadcastPin,
  BsGraphUp,
  BsClock,
  BsArrowLeftRight,
  BsPersonBadge,
  BsCashStack,
  BsSignpost,
} from 'react-icons/bs';
import { getDashboardStats, type DashboardStats } from '@/services/dashboardService';
import {
  dadosApi,
  antenasPorTecnologia,
  concentracaoPorMunicipio,
  concentracaoPorPeriodo,
  topFluxos,
  assinantesPorAgeGroup,
  assinantesPorIncome,
  assinantesPorMobilidade,
  type CategoryDatum,
} from '@/services/dadosService';
import ChartCard from './charts/ChartCard';
import { CategoryBarChart, CategoryLineChart, CategoryPieChart } from './charts/Charts';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/* Agregações dos dados de domínio para os gráficos. */
interface DomainCharts {
  antenasTecnologia: CategoryDatum[];
  concMunicipio: CategoryDatum[];
  concPeriodo: CategoryDatum[];
  fluxos: CategoryDatum[];
  ageGroup: CategoryDatum[];
  income: CategoryDatum[];
  mobilidade: CategoryDatum[];
}

const EMPTY_DOMAIN: DomainCharts = {
  antenasTecnologia: [],
  concMunicipio: [],
  concPeriodo: [],
  fluxos: [],
  ageGroup: [],
  income: [],
  mobilidade: [],
};

export default function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [domain, setDomain] = useState<DomainCharts>(EMPTY_DOMAIN);
  const [loading, setLoading] = useState(true);
  // Loading por fonte de dados: cada gráfico revela-se assim que os seus dados
  // chegam, sem esperar pelos payloads mais pesados (ex.: assinantes ~33 MB).
  const [srcLoading, setSrcLoading] = useState({
    antenas: true,
    conc: true,
    fluxos: true,
    assinantes: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    getDashboardStats()
      .then((data) => {
        if (!alive) return;
        setStats(data);
        setError(null);
      })
      .catch(() => alive && setError('Não foi possível carregar os dados de utilizadores.'))
      .finally(() => alive && setLoading(false));

    // Dados de domínio — carregados de forma independente (progressiva) para
    // que os gráficos rápidos apareçam já e os pesados não bloqueiem a página.
    const pAntenas = dadosApi
      .antenasStats()
      .then((antenas) => {
        if (!alive) return;
        setDomain((d) => ({ ...d, antenasTecnologia: antenasPorTecnologia(antenas) }));
      })
      .finally(() => alive && setSrcLoading((s) => ({ ...s, antenas: false })));

    const pConc = dadosApi
      .concStats()
      .then((conc) => {
        if (!alive) return;
        setDomain((d) => ({
          ...d,
          concMunicipio: concentracaoPorMunicipio(conc),
          concPeriodo: concentracaoPorPeriodo(conc),
        }));
      })
      .finally(() => alive && setSrcLoading((s) => ({ ...s, conc: false })));

    const pFluxos = dadosApi
      .fluxoViasStats()
      .then((fluxos) => {
        if (!alive) return;
        setDomain((d) => ({ ...d, fluxos: topFluxos(fluxos) }));
      })
      .finally(() => alive && setSrcLoading((s) => ({ ...s, fluxos: false })));

    // Assinantes — só arranca depois dos leves, para não competir por largura de banda.
    Promise.allSettled([pAntenas, pConc, pFluxos]).then(() => {
      if (!alive) return;
      dadosApi
        .assinantesStats()
        .then((assinantes) => {
          if (!alive) return;
          setDomain((d) => ({
            ...d,
            ageGroup: assinantesPorAgeGroup(assinantes),
            income: assinantesPorIncome(assinantes),
            mobilidade: assinantesPorMobilidade(assinantes),
          }));
        })
        .finally(() => alive && setSrcLoading((s) => ({ ...s, assinantes: false })));
    });

    return () => {
      alive = false;
    };
  }, []);

  const cards = stats
    ? [
        {
          id: 1,
          label: 'Utilizadores Totais',
          value: stats.totalUsers,
          icon: <BsPeople size={18} />,
          color: 'text-blue-400',
          barColor: 'bg-blue-500',
          glow: 'shadow-blue-500/20',
        },
        {
          id: 2,
          label: 'Utilizadores Ativos',
          value: stats.activeUsers,
          icon: <BsCheckCircle size={18} />,
          color: 'text-emerald-400',
          barColor: 'bg-emerald-500',
          glow: 'shadow-emerald-500/20',
        },
        {
          id: 3,
          label: 'Novos este mês',
          value: stats.newThisMonth,
          icon: <BsPersonPlus size={18} />,
          color: 'text-amber-400',
          barColor: 'bg-amber-500',
          glow: 'shadow-amber-500/20',
        },
        {
          id: 4,
          label: 'Funções (roles)',
          value: stats.byRole.length,
          icon: <BsShieldLock size={18} />,
          color: 'text-purple-400',
          barColor: 'bg-purple-500',
          glow: 'shadow-purple-500/20',
        },
      ]
    : [];

  const roleData: CategoryDatum[] = stats
    ? stats.byRole.map((r) => ({ label: r.role, value: r.count }))
    : [];

  return (
    <div className="px-4 sm:px-8 pb-8 pt-4 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Banner de erro (não bloqueia o resto) */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <BsExclamationTriangle className="text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200">{error}</p>
        </div>
      )}

      {/* ============ SECÇÃO: UTILIZADORES ============ */}
      <section className="space-y-4 sm:space-y-6">
        {/* Grid de Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[92px] bg-slate-900/50 border border-white/10 rounded-xl animate-pulse"
                />
              ))
            : cards.map((stat) => (
                <div
                  key={stat.id}
                  className={`relative group overflow-hidden bg-slate-900/50 border border-white/20 p-4 rounded-xl backdrop-blur-xl transition-all hover:bg-slate-800/60 hover:border-white/30 shadow-xl ${stat.glow}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg bg-white/5 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                      {stat.icon}
                    </div>
                    <p className="text-slate-400 text-[0.65rem] font-medium tracking-wide uppercase">{stat.label}</p>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">{stat.value}</h3>
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.barColor} opacity-70 group-hover:opacity-100 transition-opacity`} />
                </div>
              ))}
        </div>

        {/* Distribuição por função + Atividade recente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard
            title="Distribuição por Função"
            subtitle="Utilizadores agrupados por role"
            icon={<BsShieldLock />}
            className="lg:col-span-2"
            loading={loading}
            empty={roleData.length === 0}
            emptyLabel="Sem dados de utilizadores."
          >
            <CategoryBarChart data={roleData} />
          </ChartCard>

          {/* Atividade recente */}
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-2 mb-5">
              <BsClockHistory className="text-cyan-400" />
              <h4 className="text-white font-semibold">Atividade Recente</h4>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-800/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : stats && stats.recentUsers.length > 0 ? (
              <ul className="space-y-3">
                {stats.recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-1 ring-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200 truncate">{u.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono shrink-0">{formatDate(u.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic text-sm">Sem atividade recente.</p>
            )}
          </div>
        </div>
      </section>

      {/* ============ SECÇÃO: MOBILIDADE / TELECOM ============ */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2">
          <BsBroadcastPin className="text-cyan-400" />
          <h3 className="text-white font-bold tracking-tight">Mobilidade & Rede</h3>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Visent Coreview</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard
            title="Concentração por Município"
            subtitle="Utilizadores únicos (top 8)"
            icon={<BsGraphUp />}
            className="lg:col-span-2"
            loading={srcLoading.conc}
            empty={domain.concMunicipio.length === 0}
          >
            <CategoryBarChart data={domain.concMunicipio} horizontal />
          </ChartCard>

          <ChartCard
            title="Antenas por Tecnologia"
            subtitle="Distribuição da rede"
            icon={<BsBroadcastPin />}
            loading={srcLoading.antenas}
            empty={domain.antenasTecnologia.length === 0}
          >
            <CategoryPieChart data={domain.antenasTecnologia} />
          </ChartCard>

          <ChartCard
            title="Atividade por Período"
            subtitle="Utilizadores ao longo do dia"
            icon={<BsClock />}
            loading={srcLoading.conc}
            empty={domain.concPeriodo.length === 0}
          >
            <CategoryLineChart data={domain.concPeriodo} />
          </ChartCard>

          <ChartCard
            title="Principais Fluxos (OD)"
            subtitle="Origem → destino por transições"
            icon={<BsArrowLeftRight />}
            className="lg:col-span-2"
            loading={srcLoading.fluxos}
            empty={domain.fluxos.length === 0}
          >
            <CategoryBarChart data={domain.fluxos} horizontal color="#a855f7" />
          </ChartCard>
        </div>
      </section>

      {/* ============ SECÇÃO: ASSINANTES (DEMOGRAFIA) ============ */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2">
          <BsPersonBadge className="text-cyan-400" />
          <h3 className="text-white font-bold tracking-tight">Assinantes</h3>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Demografia</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard
            title="Faixa Etária"
            subtitle="Assinantes por age group"
            icon={<BsPeople />}
            loading={srcLoading.assinantes}
            empty={domain.ageGroup.length === 0}
          >
            <CategoryBarChart data={domain.ageGroup} />
          </ChartCard>

          <ChartCard
            title="Cluster de Rendimento"
            subtitle="Assinantes por income cluster"
            icon={<BsCashStack />}
            loading={srcLoading.assinantes}
            empty={domain.income.length === 0}
          >
            <CategoryPieChart data={domain.income} />
          </ChartCard>

          <ChartCard
            title="Padrão de Mobilidade"
            subtitle="Assinantes por mobility pattern"
            icon={<BsSignpost />}
            loading={srcLoading.assinantes}
            empty={domain.mobilidade.length === 0}
          >
            <CategoryBarChart data={domain.mobilidade} color="#10b981" />
          </ChartCard>
        </div>
      </section>
    </div>
  );
}
