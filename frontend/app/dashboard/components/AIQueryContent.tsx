'use client';

import { useState, useEffect, useRef } from 'react';
import {
  BsRobot,
  BsSend,
  BsMagic,
  BsCpu,
  BsLightbulb,
  BsLightningCharge,
  BsTerminal
} from 'react-icons/bs';
import { askAI, type ChatMessage } from '@/services/aiService';

interface UIMessage extends ChatMessage {
  timestamp: string;
}

export default function AIQueryContent() {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      role: 'ai',
      content: 'Olá! Sou o assistente BiT Core. Como posso ajudar na análise de dados hoje?',
      timestamp: 'Sistema Ativo'
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Consulta o Agente de AI no backend, com streaming incremental token-a-token.
  const runAIQuery = async (userText: string, history: ChatMessage[]) => {
    setIsTyping(true);
    let currentText = '';

    const applyChunk = (chunk: string) => {
      currentText += chunk;
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'ai', content: currentText + ' ▌', timestamp: 'Processando...' },
      ]);
    };

    try {
      const full = await askAI(userText, { history, onToken: applyChunk });
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'ai', content: full || currentText, timestamp: 'Gerado agora' },
      ]);
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: 'ai',
          content: 'Não foi possível obter resposta do Agente de AI. Tenta novamente.',
          timestamp: 'Erro',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isTyping) return;

    const currentQuery = query;
    const history: ChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
    const userMessage: UIMessage = { role: 'user', content: currentQuery, timestamp: 'Enviado' };

    setMessages(prev => [...prev, userMessage, { role: 'ai', content: '', timestamp: 'Pensando...' }]);
    setQuery('');
    void runAIQuery(currentQuery, history);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestions = [
    "Qual cluster tem maior concentração de pessoas mas pior cobertura de rede?",
    "Quais regiões têm maior fluxo de pessoas no horário de trabalho?",
    "Qual o tempo médio de deslocamento entre os clusters?"
  ];

  return (
    <div className="pt-4 px-4 pb-0 sm:pt-8 sm:px-8 sm:pb-0 h-[calc(100vh-64px)] flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Informativo */}
      <div className="flex items-center justify-between bg-slate-900/40 border border-white/10 p-4 rounded-3xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
            <BsRobot size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-white font-bold tracking-tight">BiT AI Assistant</h2>
            <p className="text-[10px] text-cyan-500/60 font-mono uppercase tracking-widest flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" /> Neural Engine v4.0.2
            </p>
          </div>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Latência</p>
            <p className="text-xs text-emerald-400 font-mono">24ms</p>
          </div>
          <div className="text-right border-l border-white/10 pl-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Modelo</p>
            <p className="text-xs text-blue-400 font-mono">command-r-plus-08-2024</p>
          </div>
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar 
        [&::-webkit-scrollbar]:w-2 
        [&::-webkit-scrollbar-track]:bg-transparent 
        [&::-webkit-scrollbar-thumb]:bg-slate-950 
        [&::-webkit-scrollbar-thumb]:rounded-full
        [scrollbar-width:thin] 
        [scrollbar-color:theme(colors.slate.950)_transparent]"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
          >
            <div className={`max-w-[85%] md:max-w-[70%] group relative`}>
              <div className={`p-4 rounded-2xl border backdrop-blur-xl transition-all ${
                msg.role === 'user' 
                  ? 'bg-blue-600/20 border-blue-500/30 text-white rounded-tr-none' 
                  : 'bg-slate-900/60 border-white/10 text-slate-200 rounded-tl-none'
              }`}>
                <p className={`text-sm leading-relaxed ${msg.role === 'ai' ? 'font-light' : 'font-medium'}`}>
                  {msg.content}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
                    {msg.timestamp}
                  </span>
                  {msg.role === 'ai' && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <BsMagic className="text-cyan-500 cursor-pointer hover:scale-110" size={12} title="Refinar" />
                      <BsTerminal className="text-slate-500 cursor-pointer hover:scale-110" size={12} title="Ver Logs" />
                    </div>
                  )}
                </div>
              </div>
              {msg.role === 'ai' && <div className="absolute -left-2 top-0 w-1 h-full bg-cyan-500/50 blur-sm rounded-full" />}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Sugestões e Input */}
      <div className="space-y-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button 
              key={i}
              title={s}
              onClick={() => { setQuery(s); }}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30 transition-all flex items-center gap-2"
            >
              <BsLightbulb size={10} /> {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-400/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center bg-slate-900 border border-white/20 rounded-2xl p-2 backdrop-blur-2xl">
            <div className="pl-4 text-slate-500">
              <BsCpu size={20} className={isTyping ? 'animate-spin' : ''} />
            </div>
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isTyping ? "Aguarde o processamento..." : "Pergunte algo sobre os dados (ex: 'Qual a região com mais projetos?')"}
              disabled={isTyping}
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm text-white placeholder:text-slate-600"
            />
            <button 
              type="submit"
              disabled={!query.trim() || isTyping}
              aria-label="Enviar consulta"
              title="Enviar consulta"
              className="h-10 w-10 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90"
            >
              <BsSend size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
