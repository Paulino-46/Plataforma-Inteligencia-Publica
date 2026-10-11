'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { 
  BsGrid, 
  BsMap, 
  BsGraphUp, 
  BsRobot, 
  BsPerson, 
  BsCircleFill, 
  BsBoxArrowRight, 
  BsThreeDotsVertical,
  BsShuffle
} from 'react-icons/bs'

export default function Sidebar() {
  const pathname = usePathname() || ''
  const [isOpen, setIsOpen] = useState(false) // Inicialmente fechado no mobile
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState<{ name: string, role: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Efeito para abrir a sidebar por padrão apenas em desktop
  useEffect(() => {
    if (window.innerWidth >= 768) setIsOpen(true)
  }, [])

  // Carrega os dados do usuário logado
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Erro ao carregar usuário na Sidebar:", error)
      }
    }
  }, [])

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <BsGrid size={20} />,
    },
    {
      label: 'Mapa',
      href: '/dashboard/map',
      icon: <BsMap size={20} />,
    },
    {
      label: 'Relatórios',
      href: '/dashboard/reports',
      icon: <BsGraphUp size={20} />,
    },
    {
      label: 'Busca IA',
      href: '/dashboard/aiquery',
      icon: <BsRobot size={20} />,
    },
    {
      label: 'Fontes Angola',
      href: '/dashboard/sources',
      icon: <BsShuffle size={20} />,
    },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Botão Toggle para Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Alternar Menu"
        title="Alternar Menu"
        className="fixed z-40 p-2 m-2 md:hidden bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-0'
        } md:w-64 overflow-hidden`}
      >
        <div className="flex h-16 items-center px-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20 font-semibold text-sm">
              PN
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Portal</p>
              <h1 className="text-base font-semibold text-white">Dashboard</h1>
            </div>
          </div>
        </div>

        <nav className="p-4 mt-12 space-y-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform hover:translate-x-2 ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/10'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span 
                className={`transition-all duration-500 ${
                  isActive(item.href) ? 'scale-110 text-white' : 'text-slate-500 group-hover:text-blue-400 group-hover:scale-110'
                }`}
              >
                {item.icon}
              </span>
              <span className="font-semibold tracking-wide text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/60 bg-slate-900" ref={menuRef}>
          <div className="relative">
            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 w-full mb-3 bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="p-2 space-y-1">
                  <Link 
                    href="/home"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 rounded-xl transition-all"
                  >
                    <BsPerson size={18} className="text-slate-400" />
                    <span>Perfil</span>
                  </Link>
                  <button 
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 rounded-xl transition-all"
                  >
                    <BsCircleFill size={8} className="text-emerald-500 ml-1" />
                    <span>Status</span>
                  </button>
                  <div className="h-px bg-slate-700/50 mx-2 my-1" />
                  <Link 
                    href="/"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  >
                    <BsBoxArrowRight size={18} />
                    <span>Sair</span>
                  </Link>
                </div>
              </div>
            )}

            {/* User Card */}
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`flex items-center gap-3 rounded-2xl border transition-all duration-300 px-3 py-3 w-full group ${
                isUserMenuOpen 
                  ? 'bg-slate-800 border-slate-700 shadow-lg' 
                  : 'bg-slate-800/40 border-slate-800/50 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-300 ring-1 ring-cyan-500/30 font-bold text-sm shrink-0 shadow-inner">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate leading-tight">{user?.name || 'Usuário'}</p>
                <p className="text-[11px] text-slate-500 font-medium truncate uppercase tracking-wider leading-none mt-1">{user?.role || 'Administrador'}</p>
              </div>
              <BsThreeDotsVertical 
                className={`text-slate-500 group-hover:text-slate-300 transition-all duration-300 ${isUserMenuOpen ? 'rotate-90 text-white' : ''}`} 
              />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay para Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
        />
      )}
    </>
  )
}
