"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { userService } from "@/services/userService";

export default function LoginUserPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Preencha e-mail e senha para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      const { token, user } = await userService.login({ email, password });

      if (token) {
        localStorage.setItem("token", token);
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      let message = "Erro inesperado. Tente novamente.";

      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch")) {
          message = "Não foi possível conectar ao servidor.";
        } else {
          try {
            const json = JSON.parse(err.message);
            message = json.message ?? err.message;
          } catch {
            message = err.message;
          }
        }
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-10 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Acesso do utilizador</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Entrar na sua conta</h1>
          <p className="mt-3 text-sm text-slate-400">
            Use o seu e-mail e senha para aceder ao painel do Bit App.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="seu@exemplo.com"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
            />
            <div className="flex justify-end mt-2">
              <Link href="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                Esqueceu a senha?
              </Link>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
              <p className="text-sm text-rose-200">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition-all duration-200 hover:bg-cyan-400 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-cyan-500/20 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                A autenticar...
              </span>
            ) : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Não tem conta?{" "}
          <Link href="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}