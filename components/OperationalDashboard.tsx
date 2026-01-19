
import React from 'react';
import { Manifesto } from '../types';
import { Play, CheckCircle2, Clock, Truck, ShieldAlert } from 'lucide-react';

interface OperationalDashboardProps {
  manifestos: Manifesto[];
  onAction: (id: string, action: string) => void;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ manifestos, onAction }) => {
  const filtered = manifestos.filter(m => m.status !== 'Manifesto Cancelado' && m.status !== 'Manifesto Entregue');

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Manifesto Iniciado': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Manifesto Recebido': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white border-2 border-slate-200 panel-shadow animate-fadeIn">
      <div className="bg-slate-900 px-6 py-3 border-b-2 border-slate-800 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-red-600">
             <Truck size={18} />
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
              {['Manifesto ID', 'Status Operacional', 'CIA', 'Execução'].map(h => (
                <th key={h} className="text-left py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-24 text-center">
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
                    <div className="flex gap-2">
                      {m.status === 'Manifesto Recebido' && (
                        <button 
                          onClick={() => onAction(m.id, 'Manifesto Iniciado')}
                          className="bg-red-600 text-white px-5 py-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-md shadow-red-100"
                        >
                          <Play size={14} className="fill-current" /> Iniciar Carga
                        </button>
                      )}
                      {m.status === 'Manifesto Iniciado' && (
                        <button 
                          onClick={() => onAction(m.id, 'Manifesto Finalizado')}
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
