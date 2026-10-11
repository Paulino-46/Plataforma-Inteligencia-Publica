'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BsFileEarmarkBarGraph,
  BsDownload,
  BsMagic,
  BsActivity,
  BsCheck2Circle,
  BsClockHistory,
  BsArrowRepeat,
  BsCpu,
  BsBroadcastPin,
  BsPeople,
  BsGraphUp,
} from 'react-icons/bs';
import { loadReports, REPORT_ORDER, type AnalyticalReport } from '@/services/reportsService';
import { askAI } from '@/services/aiService';
import { generateReportPdf } from '@/lib/pdf';

const INSIGHT_PROMPT =
  'Com base nos dados disponíveis, escreve um resumo executivo muito curto ' +
  '(máximo 3 frases) sobre o estado atual da rede, mobilidade e assinantes. ' +
  'Se não houver dados, diz isso de forma clara.';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-PT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

interface Kpis {
  totalAntenas?: number;
  totalAssinantes?: number;
  totalMobilidade?: number;
}

export default function ReportsContent() {
  const [reportsMap, setReportsMap] = useState<Record<string, AnalyticalReport>>({});
  const [kpis, setKpis] = useState<Kpis>({});
  const [syncing, setSyncing] = useState(false);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(true);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const loadData = useCallback(() => {
    setSyncing(true);
    setReportsMap({});
    setKpis({});
    loadReports({
      onKpis: (partial) => aliveRef.current && setKpis((k) => ({ ...k, ...partial })),
      onReport: (r) => aliveRef.current && setReportsMap((m) => ({ ...m, [r.id]: r })),
      onSettled: () => aliveRef.current && setSyncing(false),
    });
  }, []);

  const generateInsight = useCallback(async () => {
    setInsightLoading(true);
    setInsight('');
    try {
      let acc = '';
      await askAI(INSIGHT_PROMPT, {
        onToken: (chunk) => {
          acc += chunk;
          if (aliveRef.current) setInsight(acc.replace(/▌/g, '').trim());
        },
      });
      if (!acc.trim() && aliveRef.current) setInsight('Sem resumo disponível de momento.');
    } catch {
      if (aliveRef.current) setInsight('Não foi possível gerar o resumo executivo agora.');
    } finally {
      if (aliveRef.current) setInsightLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    void generateInsight();
  }, [loadData, generateInsight]);

  const fmtKpi = (n?: number) => (n != null ? n.toLocaleString('pt-PT') : '…');
  const stats = [
    {
      label: 'Antenas / ERBs',
      value: fmtKpi(kpis.totalAntenas),
      icon: <BsBroadcastPin />,
      color: 'text-blue-400',
      barColor: 'bg-blue-500',
      glow: 'shadow-blue-500/20',
    },
    {
      label: 'Assinantes',
      value: fmtKpi(kpis.totalAssinantes),
      icon: <BsPeople />,
      color: 'text-cyan-400',
      barColor: 'bg-cyan-500',
      glow: 'shadow-cyan-500/20',
    },
    {
      label: 'Registos de Mobilidade',
      value: fmtKpi(kpis.totalMobilidade),
      icon: <BsGraphUp />,
      color: 'text-emerald-400',
      barColor: 'bg-emerald-500',
      glow: 'shadow-emerald-500/20',
    },
  ];

  const handleDownload = (report: AnalyticalReport) => {
    generateReportPdf(report, { insight: insight || undefined });
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header com IA em Tempo Real */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-blue-900/20 border border-cyan-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BsCpu size={120} className="text-cyan-400 animate-pulse" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-cyan-500 animate-ping" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">Live AI Insight</h2>
            </div>

            <h3 className="text-2xl font-bold text-white max-w-md leading-tight">
              Resumo Executivo Gerado Automaticamente
            </h3>

            <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[92px]">
              <p className="text-slate-300 text-sm leading-relaxed italic">
                {insightLoading && !insight
                  ? 'A gerar resumo a partir dos dados…'
                  : insight
                    ? `"${insight}"`
                    : 'Sem resumo disponível.'}
              </p>
              <div className="flex items-center gap-4 pt-2 text-[10px] font-mono text-cyan-500/60 uppercase">
                <span>Fonte: dataset Vísent CDRView</span>
                <button
                  type="button"
                  onClick={() => void generateInsight()}
                  disabled={insightLoading}
                  className="flex items-center gap-1 hover:text-cyan-400 disabled:opacity-40 transition-colors"
                  title="Regenerar resumo"
                >
                  <BsArrowRepeat className={insightLoading ? 'animate-spin' : ''} /> Regenerar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Stats Lateral */}
        <div className="flex flex-col gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
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
      </div>

      {/* Lista de Relatórios */}
      <div className="bg-slate-900/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <BsActivity className="text-blue-400" />
            <h4 className="text-white font-semibold">Repositório de Relatórios</h4>
          </div>
          <button
            type="button"
            title="Recarregar dados dos relatórios"
            onClick={() => loadData()}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <BsArrowRepeat className={syncing ? 'animate-spin' : ''} /> {syncing ? 'A sincronizar…' : 'Sincronizar Agora'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4 font-bold">Documento</th>
                <th className="px-6 py-4 font-bold">Gerado</th>
                <th className="px-6 py-4 font-bold">Registos</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {REPORT_ORDER.map((id) => {
                const report = reportsMap[id];

                // Ainda a carregar esta fonte → linha placeholder.
                if (!report) {
                  return (
                    <tr key={id} className="animate-pulse">
                      <td className="px-6 py-4" colSpan={5}>
                        <div className="flex items-center gap-3 text-slate-500 text-sm">
                          <BsClockHistory className="animate-spin" /> A carregar dados…
                        </div>
                      </td>
                    </tr>
                  );
                }

                const semDados = report.recordCount === 0;
                return (
                  <tr key={id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                          <BsFileEarmarkBarGraph size={18} />
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                            {report.name}
                          </span>
                          <span className="block text-[11px] text-slate-500">{report.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {formatDate(report.generatedAt)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {report.recordCount.toLocaleString('pt-PT')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {semDados ? (
                          <span className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <BsClockHistory /> Sem dados
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                            <BsCheck2Circle /> {report.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="Regenerar resumo com IA"
                          onClick={() => void generateInsight()}
                          disabled={insightLoading}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all disabled:opacity-40"
                        >
                          <BsMagic size={16} />
                        </button>
                        <button
                          type="button"
                          title={semDados ? 'Sem dados para exportar' : 'Download PDF'}
                          onClick={() => handleDownload(report)}
                          disabled={semDados}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <BsDownload size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.3em]">
            Dados: dataset Vísent CDRView // Exportação PDF client-side
          </p>
        </div>
      </div>
    </div>
  );
}
