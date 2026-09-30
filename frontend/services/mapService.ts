// services/mapService.ts
// Fornece os pontos do Mapa Dinâmico. Tenta consumir a API (/api/mapa) e,
// enquanto esse endpoint não existir no backend, usa dados-semente locais.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export type MapStatus = "Online" | "Manutenção" | "Offline";

export interface MapLocation {
  id: number | string;
  name: string;
  lat: number;
  lng: number;
  status: MapStatus;
  detail?: string;
}

// Locais de referência em Angola (usados como fallback até a API existir).
const SEED_LOCATIONS: MapLocation[] = [
  { id: 1, name: "Luanda Central", lat: -8.83833, lng: 13.23444, status: "Online", detail: "Hub principal — cobertura 92%" },
  { id: 2, name: "Benguela Hub", lat: -12.5763, lng: 13.4055, status: "Online", detail: "Estação costeira — cobertura 78%" },
  { id: 3, name: "Huambo Station", lat: -12.7761, lng: 15.7392, status: "Manutenção", detail: "Em manutenção programada" },
  { id: 4, name: "Lubango Norte", lat: -14.9177, lng: 13.4925, status: "Online", detail: "Antena setorial L-24" },
  { id: 5, name: "Cabinda Litoral", lat: -5.55, lng: 12.2, status: "Offline", detail: "Sem sinal — em diagnóstico" },
  { id: 6, name: "Malanje Este", lat: -9.5402, lng: 16.341, status: "Online", detail: "Projeto Alfa — 85% concluído" },
];

/** Centro padrão do mapa (Angola). */
export const DEFAULT_CENTER: [number, number] = [-11.2027, 17.8739];

/** Busca os pontos do mapa, com fallback para os dados-semente. */
export async function getMapLocations(): Promise<MapLocation[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/mapa`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const list: any[] = body.regioes;
    if (!Array.isArray(list) || list.length === 0) return SEED_LOCATIONS;
    return list.map((r, i) => ({
      id: i + 1,
      name: r.regiao,
      lat: r.lat,
      lng: r.lng,
      status:
        r.cobertura_rede === 'Excelente' || r.cobertura_rede === 'Boa'
          ? 'Online'
          : r.cobertura_rede === 'Regular'
            ? 'Manutenção'
            : 'Offline',
      detail: r.indicadores ? JSON.stringify(r.indicadores) : undefined,
    })) as MapLocation[];
  } catch {
    // Endpoint ainda não implementado ou indisponível → usa dados locais.
    console.error('getMapLocations — erro ao buscar API /mapa, usando fallback');
    return SEED_LOCATIONS;
  }
}

export default { getMapLocations, DEFAULT_CENTER };
