
import React from 'react';
import { Manifesto, User } from '../types';
import { Play, CheckCircle2, Clock, Plane, ShieldAlert, UserCheck, UserPlus } from 'lucide-react';

interface OperationalDashboardProps {
  manifestos: Manifesto[];
  onAction: (id: string, action: string, fields?: any) => void;
  currentUser: User;
  onOpenAssign: (id: string) => void;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ manifestos, onAction, currentUser, onOpenAssign }) => {
  const filtered = manifestos.filter(m => m.status !== 'Manifesto Cancelado' && m.status !== 'Manifesto Entregue');

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Manifesto Iniciado':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Manifesto Recebido':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Manifesto Finalizado':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white border-2 border-slate-200 panel-shadow animate-fadeIn">
      <div className="bg-slate-900 px-6 py-3 border-b-2 border-slate-800 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-red-600">
             <Plane size={18} />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Fluxo de Pátio WFS - Operação em Tempo Real</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase">Live Queue</span>
          </div>
          <div className="px-3 py-1 bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
            FILA: {filtered.length}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Manifesto ID', 'Status Operacional', 'CIA', 'Responsável', 'Execução'].map(h => (
                <th key={h} className="text-left py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-300">
                    <ShieldAlert size={48} className="opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Operações Zeradas</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(m => (
                <tr key={m.id} className={`group hover:bg-slate-50 transition-colors ${m.status === 'Manifesto Iniciado' ? 'bg-amber-50/20' : ''}`}>
                  <td className="py-4 px-6 text-sm font-bold text-slate-900 font-mono-tech">{m.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 border text-[9px] font-black uppercase tracking-tight ${getStatusStyle(m.status)}`}>
                        {m.status === 'Manifesto Recebido' ? 'Aguardando' : m.status.replace('Manifesto ', '')}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase">{m.cia}</td>
                  <td className="py-4 px-6">
                    {m.usuarioResponsavel ? (
                      <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-tighter">
                        <UserCheck size={14} />
                        {m.usuarioResponsavel}
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter italic">Pendente Atribuição</div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      {m.status === 'Manifesto Recebido' && !m.usuarioResponsavel && (
                        <button 
                          onClick={() => onOpenAssign(m.id)}
                          className="bg-indigo-600 text-white px-5 py-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-md shadow-indigo-100"
                        >
                          <UserPlus size={14} /> Atribuir Puxe
                        </button>
                      )}
                      
                      {m.status === 'Manifesto Recebido' && m.usuarioResponsavel && (
                        <button 
                          onClick={() => onAction(m.id, 'Manifesto Iniciado', { Manifesto_Iniciado: new Date().toLocaleString('pt-BR') })}
                          className="bg-red-600 text-white px-5 py-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-md shadow-red-100"
                        >
                          <Play size={14} className="fill-current" /> Iniciar Carga
                        </button>
                      )}

                      {m.status === 'Manifesto Iniciado' && (
                        <button 
                          onClick={() => onAction(m.id, 'Manifesto Finalizado', { Manifesto_Completo: new Date().toLocaleString('pt-BR') })}
                          className="bg-emerald-600 text-white px-5 py-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-md shadow-emerald-100"
                        >
                          <CheckCircle2 size={14} /> Finalizar Operação
                        </button>
                      )}
                      
                      {m.status === 'Manifesto Finalizado' && (
                        <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                          <Clock size={14} /> Pendente Auditoria CIA
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
