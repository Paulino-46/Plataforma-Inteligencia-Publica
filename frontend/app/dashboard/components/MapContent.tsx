'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  BsPinMap,
  BsSearch,
  BsLayers,
  BsInfoCircle,
  BsExclamationTriangle,
} from 'react-icons/bs';
import {
  getMapLocations,
  DEFAULT_CENTER,
  type MapLocation,
  type MapStatus,
} from '@/services/mapService';

// Leaflet depende de `window`, por isso o mapa é carregado só no cliente.
const LeafletMap = dynamic(() => import('./map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">
      A carregar o mapa…
    </div>
  ),
});

const STATUS_STYLE: Record<MapStatus, string> = {
  Online: 'bg-emerald-500',
  Manutenção: 'bg-amber-500',
  Offline: 'bg-red-500',
};

export default function MapContent() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [focus, setFocus] = useState<[number, number] | null>(null);

  useEffect(() => {
    let alive = true;
    getMapLocations()
      .then((data) => {
        if (!alive) return;
        setLocations(data);
        setError(null);
      })
      .catch(() => alive && setError('Não foi possível carregar os pontos do mapa.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) => l.name.toLowerCase().includes(q));
  }, [locations, search]);

  // Ao pesquisar, foca no primeiro resultado.
  useEffect(() => {
    if (search.trim() && filtered.length > 0) {
      setFocus([filtered[0].lat, filtered[0].lng]);
    }
  }, [search, filtered]);

  const onlineCount = locations.filter((l) => l.status === 'Online').length;

  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col animate-in fade-in zoom-in-95 duration-700">
      {/* Header com Filtros e Pesquisa */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <BsPinMap className="text-cyan-400 shrink-0" />
            Mapa Dinâmico
          </h1>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm">
            Monitoramento geográfico de infraestruturas e projetos · {onlineCount}/{locations.length} online
          </p>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-none">
            <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar região..."
              className="bg-slate-900/60 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 w-full lg:w-64 transition-all"
            />
          </div>
          <button
            aria-label="Camadas do mapa"
            title="Camadas do mapa"
            className="p-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-lg"
          >
            <BsLayers size={18} />
          </button>
        </div>
      </div>

      {/* Viewport do Mapa */}
      <div className="flex-1 min-h-[500px] relative rounded-3xl border border-white/10 bg-slate-950/50 overflow-hidden shadow-2xl z-0">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <BsExclamationTriangle className="text-amber-400" size={32} />
            <p className="text-slate-300 text-sm">{error}</p>
          </div>
        ) : loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm animate-pulse">
            A carregar os pontos…
          </div>
        ) : (
          <LeafletMap locations={filtered} center={DEFAULT_CENTER} focus={focus} />
        )}

        {/* Painel Lateral de Legenda e Status (Desktop) */}
        {!loading && !error && (
          <div className="absolute top-6 left-6 w-64 hidden lg:block z-[500]">
            <div className="bg-slate-900/85 border border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Status da Rede
                </span>
                <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {filtered.length === 0 && (
                  <p className="text-xs text-slate-500 italic">Nenhuma região encontrada.</p>
                )}
                {filtered.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setFocus([loc.lat, loc.lng])}
                    className="w-full flex items-center justify-between group/item text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[loc.status]} group-hover/item:scale-150 transition-transform shrink-0`}
                      />
                      <span className="text-sm text-slate-300 group-hover/item:text-white transition-colors truncate">
                        {loc.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium shrink-0 ml-2">{loc.status}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                <BsInfoCircle size={12} className="text-cyan-400 shrink-0" />
                <span>Clique numa região para centrar o mapa.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
