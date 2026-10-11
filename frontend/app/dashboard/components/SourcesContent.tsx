'use client';

import { useMemo, useState } from 'react';
import {
  BsShuffle,
  BsGlobe2,
  BsLink45Deg,
  BsServer,
  BsGraphUpArrow,
  BsDatabaseCheck,
  BsBroadcast,
  BsBuildingCheck,
  BsMap,
  BsArrowRight,
  BsFileBarGraph,
  BsCheckCircleFill,
  BsCashCoin,
  BsExclamationTriangle,
} from 'react-icons/bs';
import { dadosApi } from '@/services/dadosService';

interface Source {
  id: string;
  name: string;
  category: string;
  url: string;
  scope: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  glow: string;
  description: string;
}

type Indicadores = Record<string, string | number>;

interface CrossedSourceData {
  fonte: string;
  url: string;
  indicadores: Indicadores;
}

const SOURCES: Source[] = [
  {
    id: 'ine',
    name: 'INE Angola',
    category: 'Demografia, Emprego & Censo',
    url: 'https://www.ine.gov.ao/',
    scope: 'Angola',
    icon: <BsBuildingCheck size={22} />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    glow: 'shadow-cyan-500/10',
    description: 'Instituto Nacional de Estatística de Angola. Fornece dados demográficos oficiais, censos populacionais e taxas de emprego/alfabetização.',
  },
  {
    id: 'inacom',
    name: 'INACOM',
    category: 'Telecomunicações & Cobertura Móvel',
    url: 'https://www.inacom.gov.ao/',
    scope: 'Angola',
    icon: <BsBroadcast size={22} />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    glow: 'shadow-blue-500/10',
    description: 'Instituto Angolano das Comunicações. Autoridade reguladora de telecomunicações, responsável pelas métricas de penetração e cobertura móvel.',
  },
  {
    id: 'opencellid',
    name: 'OpenCelliD',
    category: 'Bancos de Dados de Torres',
    url: 'https://opencellid.org/',
    scope: 'Global',
    icon: <BsServer size={22} />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    glow: 'shadow-purple-500/10',
    description: 'A maior base de dados aberta de torres de celular do mundo. Útil para mapear e estimar a mobilidade urbana e o sinal de rede 3G/4G/5G.',
  },
  {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    category: 'Dados Geoespaciais & Mapas',
    url: 'https://www.openstreetmap.org/',
    scope: 'Global',
    icon: <BsMap size={22} />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    glow: 'shadow-emerald-500/10',
    description: 'Dados de mapeamento colaborativo global. Inclui limites administrativos de Angola, províncias, distritos urbanos e malha rodoviária nacional.',
  },
  {
    id: 'worldbank',
    name: 'Banco Mundial',
    category: 'Indicadores Socioeconómicos',
    url: 'https://data.worldbank.org/country/angola',
    scope: 'Internacional',
    icon: <BsCashCoin size={22} />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    glow: 'shadow-amber-500/10',
    description: 'Dados globais de desenvolvimento. Inclui PIB per capita de Angola, taxas de acesso a eletricidade, população urbana e índice de capital humano.',
  },
];

// Lookup by normalized name so we can match a source's metadata (icon/color)
// to whatever the API returns in `fonte`, without re-scanning the array on every render.
const SOURCE_BY_NAME = new Map(SOURCES.map((s) => [s.name.toLowerCase(), s]));

const SUMMARY_STATS = [
  {
    id: 'inclusao-digital',
    title: 'Inclusão Digital',
    subtitle: 'Acesso à internet da população',
    value: '64.5%',
    percent: 64.5,
    color: 'cyan',
    target: 'Meta: 75% até 2026',
    delta: '↑ 8.2%',
    deltaPositive: true,
  },
  {
    id: 'torres-de-sinal',
    title: 'Torres de Sinal',
    subtitle: 'Cobertura 4G/5G nacional',
    value: '78.2%',
    percent: 78.2,
    color: 'purple',
    target: 'Meta: 85% até 2026',
    delta: '↑ 5.6%',
    deltaPositive: true,
  },
  {
    id: 'alfabetizacao',
    title: 'Alfabetização',
    subtitle: 'População alfabetizada (15+)',
    value: '71.3%',
    percent: 71.3,
    color: 'emerald',
    target: 'Meta: 80% até 2030',
    delta: '↑ 3.4%',
    deltaPositive: true,
  },
  {
    id: 'pib-per-capita',
    title: 'PIB per Capita',
    subtitle: 'Crescimento anual',
    value: '2.8%',
    percent: 45,
    color: 'amber',
    target: 'Meta: 4.0% até 2026',
    delta: '↓ -1.2%',
    deltaPositive: false,
  },
] as const;

const STAT_COLOR_CLASSES: Record<string, { text: string; bar: string }> = {
  cyan: { text: 'text-cyan-400', bar: 'bg-cyan-500' },
  purple: { text: 'text-purple-400', bar: 'bg-purple-500' },
  emerald: { text: 'text-emerald-400', bar: 'bg-emerald-500' },
  amber: { text: 'text-amber-400', bar: 'bg-amber-500' },
};

const INITIAL_CROSSED_DATA: CrossedSourceData[] = [
  {
    fonte: 'INE Angola',
    url: 'https://www.ine.gov.ao/',
    indicadores: {
      Populacao: '37.2M',
      Taxa_de_alfabetizacao: '71.3%',
      Taxa_de_emprego: '61.2%',
    },
  },
  {
    fonte: 'INACOM',
    url: 'https://www.inacom.gov.ao/',
    indicadores: {
      Cobertura_4G: '78.2%',
      Assinantes_moveis: '26.4M',
      Penetracao_movel: '92.1%',
    },
  },
  {
    fonte: 'OpenCelliD',
    url: 'https://opencellid.org/',
    indicadores: {
      Torres_registadas: '4,856',
      Torres_ativas: '4,102',
      Tecnologias: '2G, 3G, 4G, 5G',
    },
  },
  {
    fonte: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    indicadores: {
      Vias_mapeadas: '287K km',
      Edificios: '1.2M',
      Atualizacao: 'Diária',
    },
  },
  {
    fonte: 'Banco Mundial',
    url: 'https://data.worldbank.org/country/angola',
    indicadores: {
      PIB_per_capita: '$2,512',
      Acesso_a_eletricidade: '57%',
      Indice_de_capital_humano: '0.46',
    },
  },
];

export default function SourcesContent() {
  const [selected, setSelected] = useState<string[]>(['ine', 'inacom']);
  const [crossing, setCrossing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crossedData, setCrossedData] = useState<CrossedSourceData[] | null>(INITIAL_CROSSED_DATA);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSelect(id);
    }
  };

  const handleCrossData = async () => {
    setCrossing(true);
    setError(null);
    try {
      const queryStr = selected.join(',');
      const res = await dadosApi.cruzamento(queryStr);
      if (res) setCrossedData(res);
    } catch (err) {
      console.error('Erro ao cruzar fontes:', err);
      setError('Não foi possível cruzar as fontes selecionadas. Tenta novamente.');
    } finally {
      setCrossing(false);
    }
  };

  // Only show rows for sources the user currently has selected, so the table
  // stays in sync with the checkboxes above instead of always listing all 5 fontes.
  const displayedData = useMemo(() => {
    if (!crossedData) return [];
    return crossedData.filter((item) => {
      const meta = SOURCE_BY_NAME.get(item.fonte.toLowerCase());
      return meta ? selected.includes(meta.id) : true;
    });
  }, [crossedData, selected]);

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-purple-900/20 border border-purple-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BsShuffle size={120} className="text-purple-400 animate-pulse" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-purple-500 animate-ping" />
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-purple-400">Cruzamento de Fontes</h2>
          </div>
          <h3 className="text-3xl font-extrabold text-white leading-tight">
            Indicadores Combinados de Angola
          </h3>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Selecione as fontes oficiais e internacionais abaixo para cruzar métricas demográficas, cobertura móvel de telecomunicações, malhas geoespaciais e indicadores de desenvolvimento socioeconómico de Angola.
          </p>
        </div>
      </div>

      {/* Grid de Seleção de Fontes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SOURCES.map((source) => {
          const isSelected = selected.includes(source.id);
          return (
            <div
              key={source.id}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`${source.name} — ${isSelected ? 'selecionado' : 'disponível'}`}
              tabIndex={0}
              onClick={() => toggleSelect(source.id)}
              onKeyDown={(e) => handleCardKeyDown(e, source.id)}
              className={`relative overflow-hidden cursor-pointer border rounded-2xl p-5 backdrop-blur-md transition-all duration-300 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 ${
                isSelected
                  ? 'bg-slate-900/90 border-purple-500/50 shadow-lg shadow-purple-500/5'
                  : 'bg-slate-900/30 border-white/5 hover:border-white/10 hover:bg-slate-900/50'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-full ${source.bgColor} ${source.color} ${source.glow} shadow-lg`}>
                    {source.icon}
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                    isSelected
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-white/5 text-slate-400 border-white/5'
                  }`}>
                    {isSelected && <BsCheckCircleFill size={10} />}
                    {isSelected ? 'Selecionado' : 'Disponível'}
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-lg">{source.name}</h4>
                  <p className={`text-xs font-semibold ${source.color}`}>{source.category}</p>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{source.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <BsLink45Deg size={14} /> Aceder a URL
                </a>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  {source.scope === 'Angola' ? <span>🇦🇴</span> : <BsGlobe2 size={10} />}
                  {source.scope}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ação de Cruzamento */}
      <div className="flex flex-col items-center justify-center pt-2 space-y-2">
        <button
          onClick={handleCrossData}
          disabled={selected.length === 0 || crossing}
          className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl flex items-center gap-3 transition-all duration-300 active:scale-95 shadow-lg shadow-purple-500/20 disabled:opacity-40 disabled:pointer-events-none"
        >
          {crossing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              Cruzando Fontes de Angola...
            </>
          ) : (
            <>
              <BsShuffle size={18} />
              Cruzar Fontes Mapeadas
            </>
          )}
        </button>
        {selected.length === 0 && (
          <span className="text-xs text-slate-500">Selecione pelo menos uma fonte para iniciar o cruzamento</span>
        )}
        {error && (
          <span className="text-xs text-rose-400 flex items-center gap-1.5">
            <BsExclamationTriangle size={12} /> {error}
          </span>
        )}
      </div>

      {/* Resultados do Cruzamento com Gráficos */}
      {displayedData.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* Resultados do Cruzamento (Esquerda) */}
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                <BsFileBarGraph className="text-purple-400" size={20} />
                <h4 className="text-white font-bold">Resultados do Cruzamento</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SUMMARY_STATS.map((stat) => {
                  const classes = STAT_COLOR_CLASSES[stat.color];
                  return (
                    <div key={stat.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                      <div className="text-xs font-medium text-slate-300">{stat.title}</div>
                      <div className="text-[11px] text-slate-400">{stat.subtitle}</div>
                      <div className={`text-3xl font-extrabold font-mono ${classes.text}`}>{stat.value}</div>
                      <div className="relative w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/10">
                        <div className={`${classes.bar} h-full rounded-full`} style={{ width: `${stat.percent}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{stat.target}</span>
                        <span className={stat.deltaPositive ? 'text-emerald-400' : 'text-rose-400'}>{stat.delta}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Distribuição Populacional Donut */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-left w-full">
                  <div className="text-xs font-bold text-slate-300">Distribuição Populacional</div>
                  <div className="text-[11px] text-slate-400">Por área de residência</div>
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Urbana: <span className="font-mono font-bold">46.8%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Rural: <span className="font-mono font-bold">53.2%</span>
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="8" className="text-slate-950" fill="transparent" />
                    <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="8" className="text-cyan-400 transition-all duration-1000" fill="transparent" strokeDasharray={238} strokeDashoffset={238 - (238 * 46.8) / 100} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold font-mono text-cyan-400">46.8%</span>
                    <span className="text-[9px] text-slate-500">Urbana</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Dados atualizados em tempo real através das APIs das fontes selecionadas
              </div>
            </div>

            {/* Metadados das APIs (Direita) */}
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                <BsDatabaseCheck className="text-purple-400" size={20} />
                <h4 className="text-white font-bold">Metadados das APIs</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/15 text-slate-400">
                      <th className="py-2.5 font-semibold">Fonte</th>
                      <th className="py-2.5 font-semibold">URL</th>
                      <th className="py-2.5 font-semibold">Principais Métricas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {displayedData.map((item) => {
                      const sourceMeta = SOURCE_BY_NAME.get(item.fonte.toLowerCase());
                      return (
                        <tr key={item.fonte} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-full ${sourceMeta?.bgColor || 'bg-purple-500/15'} ${sourceMeta?.color || 'text-purple-400'}`}>
                                {sourceMeta?.icon || <BsGraphUpArrow size={14} />}
                              </div>
                              {item.fonte}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                            >
                              {item.url.replace('https://', '')} <BsArrowRight size={10} />
                            </a>
                          </td>
                          <td className="py-3.5">
                            <div className="text-[11px] text-slate-300 font-mono space-y-1">
                              {Object.entries(item.indicadores || {}).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-1.5">
                                  <BsCheckCircleFill size={10} className="text-emerald-400 shrink-0" />
                                  <span className="text-slate-400">{key.replace(/_/g, ' ')}:</span>
                                  <span className="text-white font-bold">{String(val)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {crossedData && displayedData.length === 0 && (
        <div className="text-center text-xs text-slate-500 py-6 border border-dashed border-white/10 rounded-2xl">
          Nenhuma fonte selecionada corresponde aos dados já cruzados. Seleciona uma fonte acima ou clica em "Cruzar Fontes Mapeadas".
        </div>
      )}
    </div>
  );
}