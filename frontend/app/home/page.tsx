import Link from "next/link";

const stats = [
  { value: "120+", label: "Indicadores monitorizados" },
  { value: "18", label: "Regiões em análise" },
  { value: "4x", label: "Mais rapidez na tomada de decisão" },
];

const capabilities = [
  {
    title: "Mapa interativo",
    description: "Visualize regiões, antenas e iniciativas com contexto geográfico e demográfico.",
  },
  {
    title: "Indicadores de impacto",
    description: "Compare métricas de emprego, saúde e formação em tempo real.",
  },
  {
    title: "Relatórios prontos",
    description: "Gere resumos e evidências para apoiar a comunicação com parceiros e gestores.",
  },
  {
    title: "Dados públicos conectados",
    description: "Integre fontes e serviços relevantes num único painel de decisão.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),linear-gradient(180deg,_#020817_0%,_#020b1d_100%)] text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-6 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_70px_rgba(14,116,144,0.15)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-lg font-black text-cyan-300 ring-1 ring-cyan-400/30">
              B
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">Bit App</p>
              <p className="text-sm text-slate-400">Plataforma de inteligência pública</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
            <Link href="/dashboard/map" className="transition hover:text-white">Mapa</Link>
            <Link href="/dashboard/reports" className="transition hover:text-white">Relatórios</Link>
          </nav>
        </header>

        <section className="mt-10 grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:pt-6">
          <div className="space-y-7">
            <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              Inteligência para impacto social
            </span>

            <div className="space-y-5">
              <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Transforme dados públicos em decisões mais rápidas e inteligentes.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Conectamos indicadores de emprego, saúde mental, mentoria e formação em uma interface clara para apoiar projetos sociais, gestores e instituições.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-7 py-3 text-sm font-bold text-slate-950 shadow-[0_16px_35px_rgba(34,211,238,0.35)] transition hover:-translate-y-0.5 hover:bg-cyan-400"
              >
                Acessar Dashboard
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/5 px-7 py-3 text-sm font-bold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/10"
              >
                Entrar no sistema
              </Link>
            </div>

            <div className="grid gap-4 pt-2 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-slate-950 p-6 shadow-[0_25px_80px_rgba(14,165,233,0.18)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-300">Visent + Bit App</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Dashboard de dados</h2>
              </div>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                MVP
              </span>
            </div>

            <div className="mt-7 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-slate-900/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">Mapa</p>
                <p className="mt-2 text-base font-medium text-slate-100">
                  Navegue por regiões para identificar áreas com maior potencial de impacto.
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-slate-900/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">AI Query</p>
                <p className="mt-2 text-base font-medium text-slate-100">
                  Faça perguntas sobre os dados e receba respostas rápidas para apoiar decisões.
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-slate-900/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">Relatórios</p>
                <p className="mt-2 text-base font-medium text-slate-100">
                  Produza resumos, compare indicadores e acompanhe progresso de iniciativas.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-[30px] border border-white/10 bg-slate-900/40 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-8">
          <div className="mb-7 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-300">O que você pode fazer</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Uma visão clara para cada decisão.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-white/4 p-5 transition hover:border-cyan-500/30 hover:bg-white/6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20">
                  •
                </div>
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-10 rounded-[26px] border border-white/10 bg-slate-950/60 p-6 text-center text-sm text-slate-300">
          <p>
            Pronto para começar? Use o botão <span className="font-semibold text-white">Acessar Dashboard</span> para explorar o MVP do Bit App.
          </p>
        </footer>
      </main>
    </div>
  );
}
