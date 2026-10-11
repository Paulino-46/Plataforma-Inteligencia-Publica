const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

/* ------------------------------------------------------------------ */
/* Tipos espelhando os schemas do backend                              */
/* ------------------------------------------------------------------ */

export interface AntenasStats {
  total: number;
  por_tecnologia: Record<string, number>;
  por_municipio: Record<string, number>;
  por_cluster: Record<string, number>;
}

export interface AssinantesStats {
  total: number;
  por_idade: Record<string, number>;
  por_renda: Record<string, number>;
  por_mobilidade: Record<string, number>;
  por_cluster: Record<string, number>;
  por_municipio: Record<string, number>;
}

export interface ConcentracaoStats {
  total_usuarios: number;
  total_sessoes: number;
  total_download_gb: number;
  total_upload_gb: number;
  total_chamadas: number;
  total_mensagens: number;
  congestionamento_medio: number | null;
  drop_medio: number | null;
  por_cluster: Record<string, number>;
  por_municipio: Record<string, number>;
  por_periodo: Record<string, number>;
}

export interface CategoryDatum {
  label: string;
  value: number;
}

export interface FluxoViasStats {
  total_usuarios: number;
  total_transicoes: number;
  dist_media_km: number | null;
  por_periodo: Record<string, number>;
  por_cluster_origem: Record<string, number>;
  por_cluster_destino: Record<string, number>;
  top_fluxos: CategoryDatum[];
}

export interface ODStats {
  total_usuarios: number;
  total_viagens: number;
  dist_media_km: number | null;
  total_mesmo_cluster: number;
  total_diferente_cluster: number;
  por_periodo: Record<string, number>;
  por_cluster_origem: Record<string, number>;
  por_cluster_destino: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/* Fetch com fallback para stats objects                               */
/* ------------------------------------------------------------------ */

// Timeout generoso: alguns endpoints devolvem a tabela inteira (ex.: assinantes
// pode chegar a dezenas de MB). Evita que um pedido fique pendurado para sempre,
// sem cortar os que demoram legitimamente. Ver mensagem ao backend sobre
// endpoints agregados para eliminar estes payloads gigantes.
const FETCH_TIMEOUT_MS = 120_000;

async function fetchStats<T>(path: string): Promise<T | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/dados/${path}`, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const dadosApi = {
  antenasStats: () => fetchStats<AntenasStats>("antenas"),
  assinantesStats: () => fetchStats<AssinantesStats>("assinantes"),
  concStats: () => fetchStats<ConcentracaoStats>("tensor_concentracao"),
  fluxoViasStats: () => fetchStats<FluxoViasStats>("tensor_fluxovias"),
  odStats: () => fetchStats<ODStats>("tensorod"),
  cruzamento: (fontes: string, regiao?: string) =>
    fetchStats<any[]>(`cruzamento?fontes=${encodeURIComponent(fontes)}${regiao ? `&regiao=${encodeURIComponent(regiao)}` : ""}`),
};


/* ------------------------------------------------------------------ */
/* Helper: dict → CategoryDatum[]                                      */
/* ------------------------------------------------------------------ */

function dictToCategory(dict: Record<string, number>): CategoryDatum[] {
  return Object.entries(dict)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

const PERIODO_ORDER = ["madrugada", "manha", "manhã", "tarde", "noite"];

function orderPeriodo(data: CategoryDatum[]): CategoryDatum[] {
  return [...data].sort((a, b) => {
    const ia = PERIODO_ORDER.indexOf(a.label.toLowerCase());
    const ib = PERIODO_ORDER.indexOf(b.label.toLowerCase());
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

/* ------------------------------------------------------------------ */
/* Agregações — agora a partir de stats objects do backend            */
/* ------------------------------------------------------------------ */

export function antenasPorTecnologia(stats: AntenasStats | null): CategoryDatum[] {
  if (!stats) return [];
  return dictToCategory(stats.por_tecnologia);
}

export function concentracaoPorMunicipio(
  stats: ConcentracaoStats | null,
  topN = 8
): CategoryDatum[] {
  if (!stats) return [];
  return dictToCategory(stats.por_municipio).slice(0, topN);
}

export function concentracaoPorPeriodo(stats: ConcentracaoStats | null): CategoryDatum[] {
  if (!stats) return [];
  return orderPeriodo(dictToCategory(stats.por_periodo));
}

export function topFluxos(stats: FluxoViasStats | null): CategoryDatum[] {
  if (!stats) return [];
  return stats.top_fluxos;
}

export function assinantesPorAgeGroup(stats: AssinantesStats | null): CategoryDatum[] {
  if (!stats) return [];
  return Object.entries(stats.por_idade).map(([label, value]) => ({ label, value }));
}

export function assinantesPorIncome(stats: AssinantesStats | null): CategoryDatum[] {
  if (!stats) return [];
  return dictToCategory(stats.por_renda);
}

export function assinantesPorMobilidade(stats: AssinantesStats | null): CategoryDatum[] {
  if (!stats) return [];
  return dictToCategory(stats.por_mobilidade);
}

export default dadosApi;
