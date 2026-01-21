
import React, { useState, useEffect } from 'react';
import { Manifesto, User, Funcionario } from '../types';
import { Play, CheckCircle2, Clock, Plane, ShieldAlert, UserCheck, UserPlus, UserMinus, Search, Loader2, LogOut, ArrowRight, User as UserIcon, Box, ListFilter } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface OperationalDashboardProps {
  manifestos: Manifesto[];
  onAction: (id: string, action: string, fields?: any, operatorName?: string) => void;
  onOpenAssign: (id: string) => void;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ manifestos, onAction }) => {
  const [activeOperator, setActiveOperator] = useState<Funcionario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros de dados unificados para a visão do operador logado
  const availablePool = manifestos.filter(m => m.status === 'Manifesto Recebido' && !m.usuarioResponsavel);
  const myActiveLoads = manifestos.filter(m => 
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
      try {
        const { data } = await supabase.from('Funcionarios_WFS').select('*').ilike('Nome', `%${searchTerm}%`).eq('Ativo', true).limit(5);
        if (data) setSuggestions(data);
      } catch (e) {
        console.error("Erro ao buscar funcionários", e);
      } finally {
        setLoading(false);
      }
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

  // TELA DE ACESSO AO TERMINAL (GATE)
  if (!activeOperator) {
    return (
      <div className="max-w-xl mx-auto mt-20 animate-fadeIn">
        <div className="bg-white border-2 border-slate-900 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] p-10 flex flex-col items-center text-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
          
          <div className="p-5 bg-slate-900 mb-8 rounded-full border-4 border-slate-100">
            <UserIcon size={36} className="text-white" />
          </div>
          
          <h2 className="text-xl font-black uppercase tracking-[0.2em] text-slate-900 mb-2">Terminal Operacional</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-10 tracking-widest">Identifique-se para gerenciar cargas e manifestos</p>
          
          <div className="w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              autoFocus
              type="text" 
              placeholder="DIGITE SEU NOME PARA ACESSAR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-16 pl-14 pr-4 bg-slate-50 border-2 border-slate-200 text-xs font-black uppercase tracking-[0.1em] outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
            />
            
            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-600" size={18} />}

            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-900 shadow-2xl z-[100] animate-fadeIn">
                {suggestions.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => { setActiveOperator(s); setSearchTerm(''); }}
                    className="w-full p-5 text-left hover:bg-indigo-50 flex items-center justify-between border-b border-slate-100 last:border-0 group transition-colors"
                  >
                    <div>
                      <p className="text-[12px] font-black uppercase text-slate-800 group-hover:text-indigo-700">{s.Nome}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{s.Cargo || 'OPERADOR LOGÍSTICO'}</p>
                    </div>
                    <div className="p-2 rounded-full bg-slate-50 group-hover:bg-indigo-100 transition-colors">
                      <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-12 flex items-center gap-2 text-slate-300">
             <div className="h-px w-8 bg-slate-200"></div>
             <span className="text-[8px] font-black uppercase tracking-widest">WFS Ground Handling Services</span>
             <div className="h-px w-8 bg-slate-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      
      {/* HEADER DE STATUS DO OPERADOR */}
      <div className="bg-[#0f172a] border-2 border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between shadow-xl">
        <div className="flex items-center gap-5">
           <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xl font-black text-white rounded shadow-lg">
                {activeOperator.Nome.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-[#0f172a] rounded-full"></div>
           </div>
           <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-0.5">Terminal Ativo</p>
              <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">{activeOperator.Nome}</h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Status: Conectado e Operacional</p>
           </div>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="h-10 px-4 bg-slate-800 border border-slate-700 flex items-center gap-3">
             <Box size={14} className="text-slate-400" />
             <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Atribuições: {myActiveLoads.length}</span>
          </div>
          <button 
            onClick={() => setActiveOperator(null)} 
            className="h-10 px-6 bg-red-600/10 hover:bg-red-600 border border-red-600/30 hover:border-red-600 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <LogOut size={14} /> Sair do Terminal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* SEÇÃO 1: POOL DE CARGAS (DISPONÍVEIS) - COLUNA ESTREITA */}
        <div className="xl:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <ListFilter size={16} className="text-indigo-600" /> Pool de Cargas
            </h3>
            <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{availablePool.length} Disponíveis</span>
          </div>

          <div className="bg-white border-2 border-slate-200 panel-shadow overflow-hidden">
            {availablePool.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                 <ShieldAlert size={32} className="text-slate-100 mb-2" />
                 <p className="text-[9px] font-black text-slate-300 uppercase italic">Nenhuma carga aguardando puxe no sistema</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {availablePool.map(m => (
                  <div key={m.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-black text-slate-900 font-mono-tech leading-none mb-1 group-hover:text-indigo-600 transition-colors">{m.id}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{m.cia} • Recebido</p>
                    </div>
                    <button 
                      onClick={() => onAction(m.id, 'Manifesto Recebido', { "Usuario_Operação": activeOperator.Nome }, activeOperator.Nome)}
                      className="p-2 bg-slate-900 text-white hover:bg-indigo-600 transition-all shadow-md group-hover:scale-110"
                      title="Puxar para meu terminal"
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO 2: MINHA OPERAÇÃO ATIVA - COLUNA LARGA */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <Box size={16} className="text-emerald-600" /> Terminal Ativo
            </h3>
            <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Minhas Operações</span>
          </div>

          {myActiveLoads.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center">
               <ShieldAlert size={48} className="text-slate-200 mb-4" />
               <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Sem Cargas Atribuídas</h4>
               <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Puxe uma carga do Pool ao lado para iniciar o trabalho</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myActiveLoads.map(m => (
                <div key={m.id} className={`bg-white border-2 p-6 flex flex-col md:flex-row items-center justify-between gap-8 transition-all relative overflow-hidden ${m.status === 'Manifesto Iniciado' ? 'border-amber-400 shadow-xl' : 'border-slate-200 shadow-sm'}`}>
                   <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${m.status === 'Manifesto Iniciado' ? 'bg-amber-400' : m.status === 'Manifesto Finalizado' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>

                   <div className="flex flex-wrap items-center gap-8 flex-1">
                      <div className="min-w-[140px]">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga ID</p>
                         <p className="text-2xl font-black text-slate-900 font-mono-tech tracking-tighter leading-none">{m.id}</p>
                      </div>
                      <div className="h-10 w-px bg-slate-100 hidden md:block"></div>
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Voo / CIA</p>
                         <p className="text-sm font-black text-slate-700 uppercase">{m.cia}</p>
                      </div>
                      <div className="h-10 w-px bg-slate-100 hidden md:block"></div>
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                         <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-tight border-2 inline-block ${getStatusStyle(m.status)}`}>
                            {m.status.replace('Manifesto ', '')}
                         </span>
                      </div>
                   </div>

                   <div className="flex gap-3 w-full md:w-auto">
                      {m.status === 'Manifesto Recebido' && (
                        <>
                          <button 
                            onClick={() => onAction(m.id, 'Manifesto Recebido', { "Usuario_Operação": null }, activeOperator.Nome)}
                            className="h-14 px-4 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 border-2 border-slate-200 hover:border-red-200 transition-all flex items-center justify-center gap-2 group"
                            title="Remover Atribuição"
                          >
                            <UserMinus size={18} />
                          </button>
                          <button 
                            onClick={() => onAction(m.id, 'Manifesto Iniciado', { Manifesto_Iniciado: new Date().toLocaleString('pt-BR') }, activeOperator.Nome)}
                            className="flex-1 md:flex-none h-14 px-8 bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-lg shadow-red-100"
                          >
                            <Play size={18} className="fill-current" /> Iniciar
                          </button>
                        </>
                      )}

                      {m.status === 'Manifesto Iniciado' && (
                        <button 
                          onClick={() => onAction(m.id, 'Manifesto Finalizado', { Manifesto_Completo: new Date().toLocaleString('pt-BR') }, activeOperator.Nome)}
                          className="flex-1 md:flex-none h-14 px-8 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-lg shadow-emerald-100"
                        >
                          <CheckCircle2 size={18} /> Finalizar
                        </button>
                      )}

                      {m.status === 'Manifesto Finalizado' && (
                        <div className="flex-1 md:flex-none h-14 px-8 bg-slate-100 border-2 border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-3">
                          <Clock size={18} /> PENDENTE CIA
                        </div>
                      )}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
