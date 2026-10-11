// services/aiService.ts
// Cliente da view "Busca por AI" e do resumo executivo dos relatórios.
// Fala com o Agente de AI do backend (Cohere + dataset Vísent CDRView).
//
// CONTRATO DO BACKEND (implementado — router dados, cohere_service):
//
//   POST /api/dados
//     body: { "consulta": string, "idioma"?: string }
//     resposta (JSON): { "resposta_ia": string, "dados": [...], "fontes": [...] }
//
// A resposta é JSON não-streaming; este cliente simula a escrita token-a-token
// (via onToken) para manter o efeito "a escrever" na UI.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://plataforma-inteligencia-publica.onrender.com';
const API_BASE = `${API_URL.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;
const AI_ENDPOINT = `${API_BASE}/dados`;

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface AskOptions {
  /** Histórico da conversa (mantido por compatibilidade; o backend atual não o usa). */
  history?: ChatMessage[];
  /** Chamado a cada pedaço de texto emitido (streaming simulado). */
  onToken?: (chunk: string) => void;
  /** Permite cancelar o pedido. */
  signal?: AbortSignal;
}

/**
 * Envia a pergunta ao Agente de AI e devolve a resposta completa.
 * Emite os pedaços via `onToken` (escrita simulada) quando fornecido.
 */
export async function askAI(query: string, opts: AskOptions = {}): Promise<string> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ consulta: query, idioma: 'pt' }),
      signal: opts.signal,
    });

    if (!res.ok) {
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/";
        }
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null) {
      throw new Error('A API devolveu uma resposta inválida.');
    }
    const response = data as Record<string, unknown>;
    const answer: string =
      (typeof response.resposta_ia === 'string' && response.resposta_ia) ||
      (typeof response.answer === 'string' && response.answer) ||
      (typeof response.response === 'string' && response.response) ||
      (typeof response.content === 'string' && response.content) ||
      '';

    if (!answer) throw new Error('Resposta vazia do agente');

    // Backend não faz streaming → simulamos a escrita para manter o efeito na UI.
    if (opts.onToken) {
      await simulateStream(answer, opts);
    }
    return answer;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw err instanceof Error
      ? err
      : new Error('Não foi possível contactar o Agente de AI.');
  }
}

/** Emite um texto já conhecido em pedaços, com pequeno atraso (efeito "a escrever"). */
async function simulateStream(text: string, opts: AskOptions): Promise<void> {
  const tokens = text.split(' ');
  for (let i = 0; i < tokens.length; i++) {
    if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    await new Promise((r) => setTimeout(r, 25));
    opts.onToken?.((i === 0 ? '' : ' ') + tokens[i]);
  }
}

export default { askAI };
