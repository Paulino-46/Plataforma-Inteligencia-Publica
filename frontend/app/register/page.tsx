'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userService, UserRequest } from '@/services/userService';

interface FormData extends UserRequest {
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  organisation?: string;
  country?: string;
  general?: string;
}

const INITIAL: FormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'VIEWER',
  organisation: '',
  country: '',
};

export default function RegisterUserForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.name.trim())         e.name = 'Nome é obrigatório';
    if (!form.email.trim())        e.email = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (!form.organisation?.trim()) e.organisation = 'Organização é obrigatória';
    if (!form.country?.trim())      e.country = 'País é obrigatório';
    if (!form.password)             e.password = 'Senha é obrigatória';
    else if (form.password.length < 6) e.password = 'Senha deve ter pelo menos 6 caracteres';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Senhas não coincidem';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...payload } = form;
      await userService.create(payload);
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl shadow-cyan-500/10 p-10 max-w-md w-full text-center">
          <div className="mb-4 text-cyan-400">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Conta criada com sucesso!</h2>
          <p className="text-slate-400 mb-4">
            Será redirecionado para a página de login em breve...
          </p>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
            Clique aqui se não for redirecionado automaticamente
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 py-12">
      <div className="bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl shadow-cyan-500/10 p-10 max-w-4xl w-full">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Novo Cadastro</p>
          <h1 className="text-3xl font-semibold text-white mt-4">Cadastro</h1>
          <p className="text-slate-400 mt-3 text-sm">Crie a sua conta para começar</p>
        </div>

        {/* Erro geral */}
        {errors.general && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
            <p className="text-rose-200 text-sm">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

          {/* Nome */}
          <Field label="Nome Completo" htmlFor="name" error={errors.name}>
            <input
              id="name" name="name" type="text"
              value={form.name} onChange={handleChange} disabled={loading}
              placeholder="João Silva"
              className={input(!!errors.name)}
            />
          </Field>

          {/* Email */}
          <Field label="Email" htmlFor="email" error={errors.email}>
            <input
              id="email" name="email" type="email"
              value={form.email} onChange={handleChange} disabled={loading}
              placeholder="seu.email@example.com"
              className={input(!!errors.email)}
            />
          </Field>

          {/* Organização */}
          <Field label="Organização" htmlFor="organisation" error={errors.organisation}>
            <input
              id="organisation" name="organisation" type="text"
              value={form.organisation} onChange={handleChange} disabled={loading}
              placeholder="Ex: Ministério das Telecomunicações"
              className={input(!!errors.organisation)}
            />
          </Field>

          {/* País */}
          <Field label="País" htmlFor="country" error={errors.country}>
            <input
              id="country" name="country" type="text"
              value={form.country} onChange={handleChange} disabled={loading}
              placeholder="Ex: Angola"
              className={input(!!errors.country)}
            />
          </Field>

          {/* Perfil */}
          <Field label="Tipo de Utilizador" htmlFor="role">
            <select
              id="role"
              name="role"
              aria-label="Tipo de utilizador"
              value={form.role} onChange={handleChange} disabled={loading}
              className={input(false) + ' appearance-none'}
            >
              <option value="VIEWER"  className="bg-slate-900">Visualizador (Viewer)</option>
              <option value="ANALYST" className="bg-slate-900">Analista (Analyst)</option>
              <option value="MANAGER" className="bg-slate-900">Gestor (Manager)</option>
              <option value="ADMIN"   className="bg-slate-900">Administrador (Admin)</option>
            </select>
          </Field>

          {/* Espaço vazio na grelha para manter alinhamento */}
          <div className="hidden md:block" />

          {/* Password */}
          <Field label="Senha" htmlFor="password" error={errors.password}>
            <input
              id="password" name="password" type="password"
              value={form.password} onChange={handleChange} disabled={loading}
              placeholder="Mínimo 6 caracteres"
              className={input(!!errors.password)}
            />
          </Field>

          {/* Confirmar Password */}
          <Field label="Confirmar Senha" htmlFor="confirmPassword" error={errors.confirmPassword}>
            <input
              id="confirmPassword" name="confirmPassword" type="password"
              value={form.confirmPassword} onChange={handleChange} disabled={loading}
              placeholder="Confirme a sua senha"
              className={input(!!errors.confirmPassword)}
            />
          </Field>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-950 font-bold py-4 rounded-2xl transition-all duration-200 ease-in-out transform hover:scale-[1.01] active:scale-95 disabled:scale-100 shadow-lg shadow-cyan-500/20 mt-4"
          >
            {loading ? 'A criar conta...' : 'Cadastrar'}
          </button>
        </form>

        <p className="text-center text-slate-400 mt-8 text-sm">
          Já tem uma conta?{' '}
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function input(hasError: boolean) {
  return `w-full px-4 py-3 rounded-2xl border bg-slate-950/80 text-slate-100 outline-none transition focus:ring-2 focus:ring-cyan-400/20 ${
    hasError ? 'border-rose-500' : 'border-slate-700 focus:border-cyan-400'
  }`;
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      {children}
      {error && <p className="text-rose-400 text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
}