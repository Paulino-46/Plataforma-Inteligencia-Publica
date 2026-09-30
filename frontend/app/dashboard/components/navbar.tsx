'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    // Recupera os dados do usuário salvos no login
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Erro ao carregar dados do usuário no Navbar:", error);
      }
    }
  }, []);

  // Mapeamento de rotas para nomes amigáveis
  const getPageName = () => {
    switch (pathname) {
      case '/dashboard/map': return 'Mapa';
      case '/dashboard/reports': return 'Relatórios';
      case '/dashboard/aiquery': return 'Busca IA';
      default: return 'Dashboard';
    }
  };

  return (
    <nav className="fixed top-0 left-0 md:left-64 right-0 z-30 border-b border-slate-800/60 bg-slate-950/95 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between pl-16 pr-6 md:px-8">
        {/* Localização / Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium tracking-wide">
          <span className="text-slate-500 hidden sm:inline">Portal</span>
          <span className="text-slate-700 hidden sm:inline">/</span>
          <span className="text-white font-bold">{getPageName()}</span>
        </div>

        {/* Lado Direito: Ações e Perfil */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Status Rápido do Usuário */}
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{user?.name || 'Usuário'}</p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Online</p>
              </div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-blue-400 font-bold text-xs shadow-inner">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;