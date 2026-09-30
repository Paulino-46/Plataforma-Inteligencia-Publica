import {
  dadosApi,
  antenasPorTecnologia,
  concentracaoPorMunicipio,
  concentracaoPorPeriodo,
  topFluxos,
  assinantesPorAgeGroup,
  assinantesPorIncome,
  assinantesPorMobilidade,
  type AntenasStats,
  type AssinantesStats,
  type ConcentracaoStats,
  type FluxoViasStats,
  type ODStats,
  type CategoryDatum,
} from "./dadosService";

export interface ReportMetric {
  label: string;
  value: string;
}

export interface ReportSection {
  title: string;
  columns: [string, string];
  rows: Array<[string, string | number]>;
}

export type ReportStatus = "Disponível" | "Sem dados";

export interface AnalyticalReport {
  id: string;
  name: string;
  description: string;
  recordCount: number;
  status: ReportStatus;
  metrics: ReportMetric[];
  sections: ReportSection[];
  generatedAt: string;
}

export interface ReportsOverview {
  kpis: {
    totalAntenas: number;
    totalAssinantes: number;
    totalMobilidade: number;
  };
  reports: AnalyticalReport[];
}

const nf = new Intl.NumberFormat("pt-PT");
const fmt = (n: number) => nf.format(n);

function status(n: number): ReportStatus {
  return n > 0 ? "Disponível" : "Sem dados";
}

function catToRows(data: CategoryDatum[], topN = 12): Array<[string, string]> {
  return data.slice(0, topN).map((d) => [d.label, fmt(d.value)]);
}

function dictToCategory(dict: Record<string, number>): CategoryDatum[] {
  return Object.entries(dict)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function dictLen(dict: Record<string, number>): number {
  return Object.keys(dict).length;
}

/* ------------------------------------------------------------------ */
/* Builders — cada relatório é construído a partir da(s) sua(s) fonte(s) */
/* ------------------------------------------------------------------ */

function buildRedeAntenas(antenas: AntenasStats | null, now: string): AnalyticalReport {
  return {
    id: "rede-antenas",
    name: "Relatório de Rede & Antenas",
    description: "Cobertura e tecnologia das estações base (ERBs).",
    recordCount: antenas?.total ?? 0,
    status: status(antenas?.total ?? 0),
    generatedAt: now,
    metrics: [
      { label: "Antenas / ERBs", value: fmt(antenas?.total ?? 0) },
      { label: "Municípios cobertos", value: fmt(antenas ? dictLen(antenas.por_municipio) : 0) },
      { label: "Tecnologias", value: fmt(antenasPorTecnologia(antenas).length) },
    ],
    sections: [
      { title: "Antenas por tecnologia", columns: ["Tecnologia", "Nº"], rows: catToRows(antenasPorTecnologia(antenas)) },
      { title: "Antenas por município (top)", columns: ["Município", "Nº"], rows: catToRows(antenas ? dictToCategory(antenas.por_municipio) : []) },
    ],
  };
}

function buildDemografia(assinantes: AssinantesStats | null, now: string): AnalyticalReport {
  return {
    id: "demografia-assinantes",
    name: "Relatório Demográfico de Assinantes",
    description: "Distribuição de assinantes por idade, rendimento e mobilidade.",
    recordCount: assinantes?.total ?? 0,
    status: status(assinantes?.total ?? 0),
    generatedAt: now,
    metrics: [
      { label: "Assinantes", value: fmt(assinantes?.total ?? 0) },
      { label: "Faixas etárias", value: fmt(assinantesPorAgeGroup(assinantes).length) },
      { label: "Padrões de mobilidade", value: fmt(assinantesPorMobilidade(assinantes).length) },
    ],
    sections: [
      { title: "Por faixa etária", columns: ["Faixa etária", "Nº"], rows: catToRows(assinantesPorAgeGroup(assinantes)) },
      { title: "Por cluster de rendimento", columns: ["Rendimento", "Nº"], rows: catToRows(assinantesPorIncome(assinantes)) },
      { title: "Por padrão de mobilidade", columns: ["Padrão", "Nº"], rows: catToRows(assinantesPorMobilidade(assinantes)) },
    ],
  };
}

function buildConcentracao(conc: ConcentracaoStats | null, now: string): AnalyticalReport {
  return {
    id: "concentracao-rede",
    name: "Relatório de Concentração de Rede",
    description: "Utilização da rede por município e período do dia.",
    recordCount: conc?.total_usuarios ?? 0,
    status: status(conc ? dictLen(conc.por_municipio) : 0),
    generatedAt: now,
    metrics: [
      { label: "Utilizadores únicos", value: fmt(conc?.total_usuarios ?? 0) },
      { label: "Municípios", value: fmt(conc ? dictLen(conc.por_municipio) : 0) },
      { label: "Períodos", value: fmt(concentracaoPorPeriodo(conc).length) },
    ],
    sections: [
      { title: "Utilizadores por município (top)", columns: ["Município", "Utilizadores"], rows: catToRows(concentracaoPorMunicipio(conc, 12)) },
      { title: "Utilizadores por período", columns: ["Período", "Utilizadores"], rows: catToRows(concentracaoPorPeriodo(conc)) },
    ],
  };
}

function buildMobilidade(fluxos: FluxoViasStats | null, od: ODStats | null, now: string): AnalyticalReport {
  return {
    id: "mobilidade-od",
    name: "Relatório de Mobilidade (Origem-Destino)",
    description: "Principais fluxos e viagens entre zonas.",
    recordCount: (fluxos?.top_fluxos.length ?? 0) + (od?.total_viagens ?? 0),
    status: status((fluxos?.top_fluxos.length ?? 0) + (od?.total_viagens ?? 0)),
    generatedAt: now,
    metrics: [
      { label: "Fluxos em vias", value: fmt(fluxos?.top_fluxos.length ?? 0) },
      { label: "Registos OD", value: fmt(od?.total_viagens ?? 0) },
      { label: "Viagens (total)", value: fmt(od?.total_viagens ?? 0) },
    ],
    sections: [
      { title: "Top fluxos (por transições)", columns: ["Fluxo", "Transições"], rows: catToRows(topFluxos(fluxos)) },
      { title: "Viagens por cluster de origem (top)", columns: ["Origem", "Viagens"], rows: catToRows(od ? dictToCategory(od.por_cluster_origem) : []) },
    ],
  };
}

/** Ordem estável de apresentação (o mais pesado — demografia — por último). */
export const REPORT_ORDER = ["rede-antenas", "concentracao-rede", "mobilidade-od", "demografia-assinantes"];

export interface ReportsHandlers {
  onKpis?: (partial: Partial<ReportsOverview["kpis"]>) => void;
  onReport?: (report: AnalyticalReport) => void;
  onSettled?: () => void;
}

/**
 * Carrega os relatórios de forma progressiva: cada fonte é obtida de forma
 * independente e o respetivo relatório/KPI é emitido assim que fica pronto,
 * evitando que o payload pesado (assinantes) bloqueie a página.
 */
export function loadReports(h: ReportsHandlers): void {
  const now = new Date().toISOString();
  let mobilidadeAcc = 0;

  // Fontes leves primeiro (aparecem depressa).
  const leves = [
    dadosApi.antenasStats().then((antenas) => {
      h.onKpis?.({ totalAntenas: antenas?.total ?? 0 });
      h.onReport?.(buildRedeAntenas(antenas, now));
    }),

    dadosApi.concStats().then((conc) => {
      mobilidadeAcc += conc?.total_usuarios ?? 0;
      h.onKpis?.({ totalMobilidade: mobilidadeAcc });
      h.onReport?.(buildConcentracao(conc, now));
    }),

    Promise.all([dadosApi.fluxoViasStats(), dadosApi.odStats()]).then(([fluxos, od]) => {
      mobilidadeAcc += (fluxos?.total_usuarios ?? 0) + (od?.total_viagens ?? 0);
      h.onKpis?.({ totalMobilidade: mobilidadeAcc });
      h.onReport?.(buildMobilidade(fluxos, od, now));
    }),
  ];

  // Assinantes — só depois dos leves, para não competir por largura de banda.
  const pesado = Promise.allSettled(leves).then(() =>
    dadosApi.assinantesStats().then((assinantes) => {
      h.onKpis?.({ totalAssinantes: assinantes?.total ?? 0 });
      h.onReport?.(buildDemografia(assinantes, now));
    }),
  );

  Promise.allSettled([...leves, pesado]).then(() => h.onSettled?.());
}

export default { loadReports };
