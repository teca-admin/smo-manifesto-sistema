
import React, { useState, useEffect, useRef } from 'react';
import { Manifesto, User, Funcionario } from '../types';
import { Play, CheckCircle2, Clock, Plane, ShieldAlert, UserCheck, UserPlus, Search, Loader2, LogOut, ArrowRight, User as UserIcon } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface OperationalDashboardProps {
  manifestos: Manifesto[];
  onAction: (id: string, action: string, fields?: any) => void;
  currentUser: User;
  onOpenAssign: (id: string) => void;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ manifestos, onAction, currentUser }) => {
  const [activeOperator, setActiveOperator] = useState<Funcionario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'public' | 'private'>('public');

  // Filtros de dados
  const publicQueue = manifestos.filter(m => m.status === 'Manifesto Recebido' && !m.usuarioResponsavel);
  const myLoads = manifestos.filter(m => 
    m.usuarioResponsavel === activeOperator?.Nome && 
    (m.status === 'Manifesto Iniciado' || m.status === 'Manifesto Recebido' || m.status === 'Manifesto Finalizado')
  );

  // Lógica de Busca de Operador
  useEffect(() => {
    const searchOperator = async () => {
      if (searchTerm.length < 2 || activeOperator) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      const { data } = await supabase.from('Funcionarios_WFS').select('*').ilike('Nome', `%${searchTerm}%`).eq('Ativo', true).limit(5);
      if (data) setSuggestions(data);
      setLoading(false);
    };
    const delay = setTimeout(searchOperator, 300);
    return () => clearTimeout(delay);
  }, [searchTerm, activeOperator]);

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Manifesto Iniciado': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Manifesto Recebido': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Manifesto Finalizado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // TELA DE IDENTIFICAÇÃO (LOGIN OPERACIONAL)
  if (view === 'private' && !activeOperator) {
    return (
      <div className="max-w-md mx-auto mt-12 animate-fadeIn">
        <div className="bg-white border-2 border-slate-900 shadow-2xl p-8 flex flex-col items-center text-center">
          <div className="p-4 bg-indigo-600 mb-6">
            <UserIcon size={40} className="text-white" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 mb-2">Identificação de Operador</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-8 leading-relaxed">Para acessar suas cargas e finalizar operações, localize seu nome na base WFS.</p>
          
          <div className="w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              autoFocus
              type="text" 
              placeholder="BUSCAR NOME..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-slate-200 text-xs font-black uppercase tracking-widest outline-none focus:border-indigo-600 transition-all"
            />
            
            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-600" size={18} />}

            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-900 shadow-2xl z-50">
                {suggestions.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => { setActiveOperator(s); setSearchTerm(''); }}
                    className="w-full p-4 text-left hover:bg-indigo-50 flex items-center justify-between border-b border-slate-100 last:border-0 group"
                  >
                    <div>
                      <p className="text-[11px] font-black uppercase text-slate-800 group-hover:text-indigo-600">{s.Nome}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{s.Cargo || 'Operador Pátio'}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-200 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button onClick={() => setView('public')} className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Voltar para Fila Geral</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* CABEÇALHO DE NAVEGAÇÃO OPERACIONAL */}
      <div className="bg-slate-900 border-2 border-slate-900 flex flex-col md:flex-row items-stretch overflow-hidden">
        <button 
          onClick={() => setView('public')}
          className={`flex-1 p-5 flex items-center justify-center gap-4 transition-all border-b-4 md:border-b-0 md:border-r-2 border-slate-800 ${view === 'public' ? 'bg-slate-800 border-indigo-500' : 'hover:bg-slate-800/50 border-transparent'}`}
        >
          <div className="p-2 bg-slate-700">
            <Plane size={20} className={view === 'public' ? 'text-indigo-400' : 'text-slate-400'} />
          </div>
          <div className="text-left">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global</p>
            <p className="text-[11px] font-black text-white uppercase tracking-widest">Fila de Espera <span className="text-indigo-400 ml-2">[{publicQueue.length}]</span></p>
          </div>
        </button>

        <button 
          onClick={() => setView('private')}
          className={`flex-1 p-5 flex items-center justify-center gap-4 transition-all border-b-4 md:border-b-0 ${view === 'private' ? 'bg-slate-800 border-emerald-500' : 'hover:bg-slate-800/50 border-transparent'}`}
        >
          <div className="p-2 bg-slate-700">
            <UserCheck size={20} className={view === 'private' ? 'text-emerald-400' : 'text-slate-400'} />
          </div>
          <div className="text-left">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Privado</p>
            <p className="text-[11px] font-black text-white uppercase tracking-widest">Meu Terminal <span className="text-emerald-400 ml-2">[{myLoads.length}]</span></p>
          </div>
        </button>

        {activeOperator && (
          <div className="bg-slate-800 px-6 flex items-center justify-between border-l-2 border-slate-700 min-w-[300px]">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                 {activeOperator.Nome.charAt(0)}
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Operador Logado</p>
                  <p className="text-[10px] font-black text-white uppercase tracking-tight">{activeOperator.Nome}</p>
               </div>
            </div>
            <button onClick={() => { setActiveOperator(null); setView('public'); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* TELA 1: FILA DE ESPERA (PÚBLICA) */}
      {view === 'public' && (
        <div className="bg-white border-2 border-slate-200 panel-shadow overflow-hidden">
          <div className="bg-slate-50 px-6 py-3 border-b-2 border-slate-200 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <Plane size={14} className="text-slate-400" /> Manifestos Aguardando Puxe
            </h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Atualização em Tempo Real</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {['Manifesto ID', 'Cia', 'Status', 'Ação'].map(h => (
                    <th key={h} className="text-left py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {publicQueue.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-300">
                        <ShieldAlert size={48} className="opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sem Manifestos na Fila</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  publicQueue.map(m => (
                    <tr key={m.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-5 px-6 text-sm font-bold text-slate-900 font-mono-tech">{m.id}</td>
                      <td className="py-5 px-6 text-[10px] font-black text-slate-600 uppercase">{m.cia}</td>
                      <td className="py-5 px-6">
                        <span className="px-2.5 py-1 border-2 border-blue-100 bg-blue-50 text-blue-600 text-[9px] font-black uppercase">Aguardando</span>
                      </td>
                      <td className="py-5 px-6">
                        <button 
                          onClick={() => {
                            if (!activeOperator) setView('private');
                            else onAction(m.id, 'Manifesto Recebido', { "Usuario_Operação": activeOperator.Nome });
                          }}
                          className="bg-slate-900 text-white px-5 py-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all"
                        >
                          <UserPlus size={14} /> {activeOperator ? 'Puxar para mim' : 'Identificar para Puxar'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TELA 2: MEU TERMINAL (PRIVADO) */}
      {view === 'private' && activeOperator && (
        <div className="space-y-6">
          <div className="bg-emerald-600 p-4 text-white flex items-center justify-between border-2 border-emerald-700 shadow-lg">
             <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20">
                   <UserCheck size={24} />
                </div>
                <div>
                   <h4 className="text-[11px] font-black uppercase tracking-[0.15em]">Terminal de Trabalho Ativo</h4>
                   <p className="text-[10px] font-bold text-emerald-100 uppercase">Apenas suas cargas atribuídas são visíveis aqui</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-black uppercase text-emerald-200">Operador</p>
                <p className="text-lg font-black uppercase tracking-tighter">{activeOperator.Nome}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myLoads.length === 0 ? (
              <div className="bg-white border-2 border-slate-200 p-20 flex flex-col items-center justify-center text-center">
                 <ShieldAlert size={60} className="text-slate-100 mb-4" />
                 <h3 className="text-lg font-black text-slate-900 uppercase">Nenhuma Carga Atribuída</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase max-w-xs mt-2">Vá até a Fila de Espera para puxar novos manifestos para o seu terminal.</p>
                 <button onClick={() => setView('public')} className="mt-8 h-12 px-8 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all">Ver Fila Global</button>
              </div>
            ) : (
              myLoads.map(m => (
                <div key={m.id} className={`bg-white border-2 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${m.status === 'Manifesto Iniciado' ? 'border-amber-400 shadow-[0_10px_30px_-10px_rgba(251,191,36,0.3)]' : 'border-slate-200'}`}>
                   <div className="flex items-center gap-8 flex-1">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID do Manifesto</p>
                         <p className="text-2xl font-black text-slate-900 font-mono-tech tracking-tighter">{m.id}</p>
                      </div>
                      <div className="h-10 w-[2px] bg-slate-100" />
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Companhia</p>
                         <p className="text-sm font-black text-slate-700 uppercase">{m.cia}</p>
                      </div>
                      <div className="h-10 w-[2px] bg-slate-100" />
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                         <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-tight border-2 ${getStatusStyle(m.status)}`}>
                            {m.status.replace('Manifesto ', '')}
                         </span>
                      </div>
                   </div>

                   <div className="flex gap-3">
                      {m.status === 'Manifesto Recebido' && (
                        <button 
                          onClick={() => onAction(m.id, 'Manifesto Iniciado', { Manifesto_Iniciado: new Date().toLocaleString('pt-BR') })}
                          className="h-14 px-8 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-900 transition-all shadow-lg shadow-red-100"
                        >
                          <Play size={18} className="fill-current" /> Iniciar Carga
                        </button>
                      )}

                      {m.status === 'Manifesto Iniciado' && (
                        <button 
                          onClick={() => onAction(m.id, 'Manifesto Finalizado', { Manifesto_Completo: new Date().toLocaleString('pt-BR') })}
                          className="h-14 px-8 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-900 transition-all shadow-lg shadow-emerald-100"
                        >
                          <CheckCircle2 size={18} /> Finalizar Operação
                        </button>
                      )}

                      {m.status === 'Manifesto Finalizado' && (
                        <div className="h-14 px-8 bg-slate-100 border-2 border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-3">
                          <Clock size={18} /> Aguardando Auditoria CIA
                        </div>
                      )}
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
