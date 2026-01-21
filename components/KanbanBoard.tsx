
import React from 'react';
import { Manifesto } from '../types';
import { Box, Play, CheckCircle2, UserCheck, Plane, Clock, AlertCircle } from 'lucide-react';

interface KanbanBoardProps {
  manifestos: Manifesto[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ manifestos }) => {
  // Lógica de filtragem para cada coluna do Kanban
  const columns = [
    {
      id: 'recebido',
      title: 'Manifesto Recebido',
      icon: <Box size={16} className="text-blue-500" />,
      items: manifestos.filter(m => m.status === 'Manifesto Recebido'),
      color: 'border-blue-500'
    },
    {
      id: 'iniciado',
      title: 'Manifesto Iniciado',
      icon: <Play size={16} className="text-amber-500" />,
      items: manifestos.filter(m => m.status === 'Manifesto Iniciado'),
      color: 'border-amber-500'
    },
    {
      id: 'finalizado',
      title: 'Manifesto Finalizado',
      icon: <CheckCircle2 size={16} className="text-emerald-500" />,
      items: manifestos.filter(m => 
        m.status === 'Manifesto Finalizado' && 
        (!m.dataHoraRepresentanteCIA || m.dataHoraRepresentanteCIA === '---' || m.dataHoraRepresentanteCIA === '')
      ),
      color: 'border-emerald-500'
    },
    {
      id: 'assinatura',
      title: 'Assinatura Representante',
      icon: <UserCheck size={16} className="text-indigo-500" />,
      items: manifestos.filter(m => 
        m.status === 'Manifesto Finalizado' && 
        (m.dataHoraRepresentanteCIA && m.dataHoraRepresentanteCIA !== '---' && m.dataHoraRepresentanteCIA !== '')
      ),
      color: 'border-indigo-500'
    },
    {
      id: 'entregue',
      title: 'Manifesto Entregue',
      icon: <Plane size={16} className="text-slate-500" />,
      items: manifestos.filter(m => m.status === 'Manifesto Entregue').slice(0, 20), // Limitamos os últimos entregues no Kanban
      color: 'border-slate-500'
    }
  ];

  const getTimeOnly = (isoStr: string | undefined) => {
    if (!isoStr || isoStr === '---' || isoStr === '') return '--:--';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return '--:--'; }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn h-[calc(100vh-140px)]">
      {/* Header do Board */}
      <div className="bg-[#0f172a] border-2 border-slate-800 p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Fluxo Situacional do Manifesto</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase">Visão em tempo real da linha de produção</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Monitoramento Ativo</span>
          </div>
        </div>
      </div>

      {/* Grid do Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <div className="flex h-full gap-4 min-w-[1400px]">
          {columns.map(col => (
            <div key={col.id} className="flex-1 flex flex-col bg-slate-100/50 border-t-4 border-slate-200 min-w-[280px]">
              <div className={`p-4 bg-white border-x-2 border-b-2 ${col.color.replace('border-', 'border-t-')} flex items-center justify-between shadow-sm shrink-0`}>
                <div className="flex items-center gap-2">
                  {col.icon}
                  <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">{col.title}</h3>
                </div>
                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{col.items.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar border-x-2 border-slate-200/50">
                {col.items.length === 0 ? (
                  <div className="h-20 border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <p className="text-[9px] font-bold text-slate-300 uppercase italic">Vazio</p>
                  </div>
                ) : (
                  col.items.map(m => (
                    <div key={m.id} className="bg-white border border-slate-200 p-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group relative">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-black text-slate-900 font-mono-tech tracking-tighter">{m.id}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                          m.cia === 'LATAM' ? 'bg-indigo-50 text-indigo-600' :
                          m.cia === 'AZUL' ? 'bg-blue-50 text-blue-600' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {m.cia}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between">
                           <span className="text-[8px] font-bold text-slate-400 uppercase">Turno:</span>
                           <span className="text-[9px] font-black text-slate-600 uppercase italic">{m.turno}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[8px] font-bold text-slate-400 uppercase">Início Log:</span>
                           <span className="text-[9px] font-bold font-mono text-slate-500">{getTimeOnly(m.dataHoraPuxado)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[8px] font-black text-slate-500">
                               {m.usuarioResponsavel ? m.usuarioResponsavel.charAt(0) : '?'}
                            </div>
                            <span className="text-[8px] font-black text-slate-400 uppercase truncate max-w-[80px]">
                               {m.usuarioResponsavel || 'Sem Responsável'}
                            </span>
                         </div>
                         <div className="flex items-center gap-1 text-[9px] font-black text-indigo-500">
                            <Clock size={10} />
                            <span>{getTimeOnly(m.carimboDataHR)}</span>
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import { Activity } from 'lucide-react';
