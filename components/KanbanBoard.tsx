
import React, { useState, useEffect } from 'react';
import { Manifesto } from '../types';
import { Box, Play, CheckCircle2, UserCheck, Plane, Clock, Activity, Timer } from 'lucide-react';

interface KanbanBoardProps {
  manifestos: Manifesto[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ manifestos }) => {
  // Estado para forçar re-renderização a cada segundo para os cronômetros
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Lógica de filtragem para cada coluna do Kanban
  const columns = [
    {
      id: 'recebido',
      title: 'Recebido',
      icon: <Box size={16} className="text-blue-500" />,
      items: manifestos.filter(m => m.status === 'Manifesto Recebido' && !m.usuarioResponsavel),
      color: 'border-blue-500',
      bgColor: 'bg-blue-50/30'
    },
    {
      id: 'iniciado',
      title: 'Iniciado',
      icon: <Play size={16} className="text-amber-500" />,
      items: manifestos.filter(m => m.status === 'Manifesto Iniciado' || (m.status === 'Manifesto Recebido' && m.usuarioResponsavel)),
      color: 'border-amber-500',
      bgColor: 'bg-amber-50/30'
    },
    {
      id: 'finalizado',
      title: 'Finalizado',
      icon: <CheckCircle2 size={16} className="text-emerald-500" />,
      items: manifestos.filter(m => 
        m.status === 'Manifesto Finalizado' && 
        (!m.dataHoraRepresentanteCIA || m.dataHoraRepresentanteCIA === '---' || m.dataHoraRepresentanteCIA === '')
      ),
      color: 'border-emerald-500',
      bgColor: 'bg-emerald-50/30'
    },
    {
      id: 'assinatura',
      title: 'Assinatura',
      icon: <UserCheck size={16} className="text-indigo-500" />,
      items: manifestos.filter(m => 
        m.status === 'Manifesto Finalizado' && 
        (m.dataHoraRepresentanteCIA && m.dataHoraRepresentanteCIA !== '---' && m.dataHoraRepresentanteCIA !== '')
      ),
      color: 'border-indigo-500',
      bgColor: 'bg-indigo-50/30'
    },
    {
      id: 'entregue',
      title: 'Entregue',
      icon: <Plane size={16} className="text-slate-500" />,
      items: manifestos.filter(m => m.status === 'Manifesto Entregue').slice(0, 15),
      color: 'border-slate-500',
      bgColor: 'bg-slate-50/50'
    }
  ];

  const parseBRDate = (brStr: string | undefined): Date | null => {
    if (!brStr || brStr === '---' || brStr === '') return null;
    try {
      // Formato esperado: "DD/MM/YYYY HH:MM:SS" ou "DD/MM/YYYY, HH:MM:SS"
      const parts = brStr.split(/[\/\s,:]+/);
      if (parts.length < 5) return null;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const hour = parseInt(parts[3], 10);
      const minute = parseInt(parts[4], 10);
      const second = parts[5] ? parseInt(parts[5], 10) : 0;

      const date = new Date(year, month, day, hour, minute, second);
      return isNaN(date.getTime()) ? null : date;
    } catch { return null; }
  };

  const getElapsedTime = (lastUpdateStr: string | undefined) => {
    const startDate = parseBRDate(lastUpdateStr);
    if (!startDate) return '00:00:00';

    const now = new Date();
    const diff = Math.max(0, now.getTime() - startDate.getTime());

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return [hours, minutes, seconds].map(v => String(v).padStart(2, '0')).join(':');
  };

  const getTimeOnly = (isoStr: string | undefined) => {
    if (!isoStr || isoStr === '---' || isoStr === '') return '--:--';
    const d = parseBRDate(isoStr);
    if (!d) return '--:--';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn h-[calc(100vh-120px)] overflow-hidden">
      <div className="bg-[#0f172a] border-2 border-slate-800 p-4 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-600 rounded">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Painel de Controle de Fluxo (Dashboard)</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monitoramento unificado em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync</span>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-hidden">
        {columns.map(col => (
          <div key={col.id} className={`flex flex-col border-t-4 ${col.color} bg-white panel-shadow overflow-hidden`}>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                {col.icon}
                <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-tighter">{col.title}</h3>
              </div>
              <span className="text-[11px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {col.items.length}
              </span>
            </div>

            <div className={`flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar ${col.bgColor}`}>
              {col.items.length === 0 ? (
                <div className="h-full flex items-center justify-center opacity-10 grayscale">
                   <Box size={40} className="text-slate-300" />
                </div>
              ) : (
                col.items.map(m => (
                  <div key={m.id} className="bg-white border border-slate-200 p-3 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group">
                    
                    {/* BARRA DE SLA DEDICADA: Agora no topo */}
                    <div className="mb-2.5 px-2 py-1.5 bg-slate-900 rounded-sm flex items-center justify-between">
                       <div className="flex items-center gap-1.5">
                          <Timer size={11} className="text-indigo-400" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tempo em Status</span>
                       </div>
                       <span className="text-[11px] font-bold font-mono-tech text-white tracking-widest">
                          {getElapsedTime(m.carimboDataHR)}
                       </span>
                    </div>

                    {/* HEADER: ID e CIA (Movido para baixo da barra de SLA) */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[13px] font-black text-slate-900 font-mono-tech tracking-tighter">{m.id}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                        m.cia === 'LATAM' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        m.cia === 'AZUL' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        'bg-slate-50 text-slate-600 border border-slate-100'
                      }`}>
                        {m.cia}
                      </span>
                    </div>
                    
                    {/* GRID DE INFORMAÇÕES SECUNDÁRIAS */}
                    <div className="grid grid-cols-2 gap-3 mb-3 px-1">
                      <div className="flex flex-col">
                         <span className="text-[9px] font-bold text-slate-400 uppercase">Turno</span>
                         <span className="text-[10px] font-black text-slate-600 uppercase italic truncate">{m.turno}</span>
                      </div>
                      <div className="flex flex-col text-right">
                         <span className="text-[9px] font-bold text-slate-400 uppercase">Início Log</span>
                         <span className="text-[10px] font-bold font-mono text-slate-500">{getTimeOnly(m.dataHoraPuxado)}</span>
                      </div>
                    </div>

                    {/* FOOTER: RESPONSÁVEL E ÚLTIMA ATUALIZAÇÃO */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                       <div className="flex items-center gap-2 max-w-[70%]">
                          <div className="w-5 h-5 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                             {m.usuarioResponsavel ? m.usuarioResponsavel.charAt(0) : '?'}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase truncate">
                             {m.usuarioResponsavel || 'Vago'}
                          </span>
                       </div>
                       <div className="flex items-center gap-1 text-[11px] font-black text-indigo-500 shrink-0">
                          <Clock size={12} />
                          <span className="font-mono-tech">{getTimeOnly(m.carimboDataHR)}</span>
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
  );
};
