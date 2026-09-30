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
// Se o endpoint falhar, cai num mock local para não bloquear o frontend.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';
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

    const data = await res.json();
    const answer: string =
      data.resposta_ia ?? data.answer ?? data.response ?? data.content ?? '';

    if (!answer) throw new Error('Resposta vazia do agente');

    // Backend não faz streaming → simulamos a escrita para manter o efeito na UI.
    if (opts.onToken) {
      await simulateStream(answer, opts);
    }
    return answer;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    // Endpoint indisponível / erro → mock para não bloquear o frontend.
    return mockStream(query, opts);
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

/* ------------------------------------------------------------------ */
/* Mock de emergência (usado só se o backend falhar)                   */
/* ------------------------------------------------------------------ */

const MOCK_PREFIX = '[modo offline] ';

function buildMockAnswer(query: string): string {
  return (
    `${MOCK_PREFIX}Não foi possível contactar o Agente de AI. ` +
    `Verifica se o backend está ativo e se a COHERE_API_KEY está configurada. ` +
    `A tua pergunta foi: "${query}".`
  );
}

async function mockStream(query: string, opts: AskOptions): Promise<string> {
  const answer = buildMockAnswer(query);
  await simulateStream(answer, opts);
  return answer;
}

export default { askAI };
