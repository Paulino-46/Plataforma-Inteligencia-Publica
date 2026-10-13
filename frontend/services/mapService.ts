// services/mapService.ts
// Fornece os pontos reais do Mapa Dinâmico a partir da API.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://plataforma-inteligencia-publica.onrender.com";
const API_BASE = `${API_URL.replace(/\/+$/, "").replace(/\/api$/, "")}/api`;

export type MapStatus = "Online" | "Manutenção" | "Offline" | "Referência";

export interface MapLocation {
  id: number | string;
  name: string;
  lat: number;
  lng: number;
  status: MapStatus;
  detail?: string;
  source?: string;
}

export interface MapData {
  locations: MapLocation[];
  warnings: string[];
}

/** Centro padrão do mapa (Angola). */
export const DEFAULT_CENTER: [number, number] = [-11.2027, 17.8739];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Busca e valida os pontos reais do mapa. */
export async function getMapLocations(): Promise<MapData> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/mapa`, { headers });
    if (!res.ok) throw new Error(`A API do mapa respondeu com HTTP ${res.status}.`);

    const body: unknown = await res.json();
    if (!isRecord(body) || !Array.isArray(body.regioes)) {
      throw new Error("A resposta da API do mapa tem um formato inválido.");
    }

    const locations = body.regioes.flatMap((region, index): MapLocation[] => {
      if (!isRecord(region)) return [];
      const {
        regiao,
        lat,
        lng,
        cobertura_rede: coverage,
        indicadores,
        fonte,
      } = region;
      if (
        typeof regiao !== "string" ||
        typeof lat !== "number" ||
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90 ||
        typeof lng !== "number" ||
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180
      ) {
        return [];
      }

      const detail = isRecord(indicadores)
        ? Object.entries(indicadores)
            .filter(([, value]) => value !== null && value !== undefined)
            .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`)
            .join(" · ")
        : undefined;

      return [{
        id: index + 1,
        name: regiao,
        lat,
        lng,
        status:
          coverage === "Referência geográfica"
            ? "Referência"
            : coverage === "Excelente" || coverage === "Boa"
            ? "Online"
            : coverage === "Regular"
              ? "Manutenção"
              : "Offline",
        detail,
        source: typeof fonte === "string" ? fonte : undefined,
      }];
    });

    return {
      locations,
      warnings: Array.isArray(body.avisos)
        ? body.avisos.filter((warning): warning is string => typeof warning === "string")
        : [],
    };
  } catch (error) {
    console.error("Falha ao carregar os dados reais do mapa:", error);
    throw error;
  }
}

export default { getMapLocations, DEFAULT_CENTER };
