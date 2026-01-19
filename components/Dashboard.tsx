
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Manifesto, User } from '../types';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { CustomSelect } from './CustomSelect';
import { Search, History, Edit3, XCircle, Undo2, CheckSquare, Plus, Database, Filter, Clock, Edit } from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  manifestos: Manifesto[];
  onSave: (m: any) => void;
  onAction: (action: string, id: string) => void;
  openHistory: (id: string) => void;
  openEdit: (id: string) => void;
  onOpenReprFill: (id: string) => void;
  onShowAlert: (type: 'success' | 'error', msg: string) => void;
  nextId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  manifestos, onSave, onAction, openHistory, openEdit, onOpenReprFill, onShowAlert
}) => {
  const [formData, setFormData] = useState({ 
    cia: '', 
    dataHoraPuxado: '', 
    dataHoraRecebido: ''
  });
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const formatDisplayDate = (isoStr: string | undefined) => {
    if (!isoStr || isoStr === '---' || isoStr === '') return '---';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      return isoStr;
    }
  };

  const getStatusClass = (status: string) => {
    const s = status || '';
    switch (s) {
      case 'Manifesto Recebido':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Manifesto Iniciado':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Manifesto Finalizado':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Manifesto Entregue':
        return 'bg-slate-100 text-slate-500 border-slate-200 opacity-75';
      case 'Manifesto Cancelado':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* PAINEL DE CADASTRO SIMPLIFICADO */}
      <div className="bg-white border-2 border-slate-200 panel-shadow">
        <div className="bg-slate-50 px-5 py-2.5 border-b-2 border-slate-200 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <Plus size={14} className="text-indigo-600" /> Registro de Novo Manifesto
          </h3>
          <span className="text-[9px] font-bold text-slate-400 uppercase">Input Terminal v2.5</span>
        </div>
        <div className="p-4 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Companhia Aérea</label>
              <CustomSelect value={formData.cia} onChange={v => setFormData({...formData, cia: v})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Manifesto Puxado</label>
              <CustomDateTimePicker value={formData.dataHoraPuxado} onChange={v => setFormData({...formData, dataHoraPuxado: v})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Manifesto Recebido</label>
              <CustomDateTimePicker value={formData.dataHoraRecebido} onChange={v => setFormData({...formData, dataHoraRecebido: v})} />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={() => {
                if (!formData.cia || !formData.dataHoraPuxado) return onShowAlert('error', 'Campos Obrigatórios Pendentes');
                onSave(formData);
                setFormData({ cia: '', dataHoraPuxado: '', dataHoraRecebido: '' });
              }}
              className="w-full md:w-[250px] h-10 bg-[#0f172a] hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-100/50"
            >
              Confirmar Registro
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-200 panel-shadow overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b-2 border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <Database size={14} className="text-slate-500" /> Base de Dados Operacional
            </h3>
            <div className="h-4 w-[1px] bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-slate-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Filtros: Todos os Registros</span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase">Total: {manifestos.length} Itens</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200">
                {['ID Operacional', 'Status Atual', 'Companhia', 'Puxado', 'Recebido', 'Repr. CIA', 'Entregue', 'Turno', 'Auditoria'].map(h => (
                  <th key={h} className="text-left py-3 px-5 text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {manifestos.map(m => {
                const canFillRepr = m.status === 'Manifesto Finalizado';
                
                return (
                  <tr key={m.id} className="group hover:bg-indigo-50/40 transition-colors">
                    <td className="py-3 px-5 text-xs font-bold text-slate-900 font-mono-tech tracking-tighter whitespace-nowrap">{m.id}</td>
                    <td className="py-3 px-5">
                      <span className={`px-2.5 py-1 border text-[9px] font-black uppercase tracking-tight whitespace-nowrap ${getStatusClass(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-[10px] font-black text-slate-600 uppercase tracking-tighter whitespace-nowrap">{m.cia}</td>
                    <td className="py-3 px-5 text-[10px] font-bold text-slate-500 font-mono-tech tracking-tight whitespace-nowrap">
                      {formatDisplayDate(m.dataHoraPuxado)}
                    </td>
                    <td className="py-3 px-5 text-[10px] font-bold text-slate-500 font-mono-tech tracking-tight whitespace-nowrap">
                      {formatDisplayDate(m.dataHoraRecebido)}
                    </td>
                    <td 
                      onClick={() => m.status === 'Manifesto Finalizado' && onOpenReprFill(m.id)}
                      className={`py-3 px-5 text-[10px] font-bold font-mono-tech tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        canFillRepr 
                          ? 'text-indigo-600 cursor-pointer hover:bg-indigo-100/60 bg-indigo-50/30 font-black' 
                          : 'text-indigo-500'
                      }`}
                    >
                      {formatDisplayDate(m.dataHoraRepresentanteCIA)}
                      {canFillRepr && (!m.dataHoraRepresentanteCIA || m.dataHoraRepresentanteCIA === '---') && <Edit size={10} className="text-indigo-400 animate-pulse" />}
                    </td>
                    <td className="py-3 px-5 text-[10px] font-bold text-emerald-600 font-mono-tech tracking-tight whitespace-nowrap">
                      {formatDisplayDate(m.dataHoraEntregue)}
                    </td>
                    <td className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{m.turno}</td>
                    <td className="py-3 px-5 text-right">
                      <button 
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPos({ top: rect.bottom + window.scrollY, left: rect.left });
                          setMenuOpenId(m.id);
                        }} 
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 transition-all border border-transparent hover:border-indigo-200"
                      >
                        <History size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {menuOpenId && createPortal(
         <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpenId(null)}>
            <div 
               className="absolute bg-white border-2 border-slate-800 shadow-2xl min-w-[200px] py-1.5 animate-fadeIn"
               style={{ top: menuPos.top + 4, left: menuPos.left - 180 }}
               onClick={e => e.stopPropagation()}
            >
              <div className="px-4 py-1 border-b border-slate-100 mb-1">
                 <p className="text-[8px] font-black text-slate-400 uppercase">Ações Rápidas</p>
              </div>
              <button onClick={() => { openHistory(menuOpenId); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest"><Search size={14} className="text-slate-400"/> Detalhes Log</button>
              <button onClick={() => { onAction('entregar', menuOpenId); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest"><CheckSquare size={14} className="text-emerald-400"/> Concluir Auditoria</button>
              <button onClick={() => { onAction('anular', menuOpenId); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest"><Undo2 size={14} className="text-amber-400"/> Reverter Status</button>
              <button onClick={() => { openEdit(menuOpenId); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest"><Edit3 size={14} className="text-blue-400"/> Editar / Monitoramento</button>
              <div className="h-[1px] bg-slate-100 my-1" />
              <button onClick={() => { onAction('cancelar', menuOpenId); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest"><XCircle size={14} className="text-red-400"/> Cancelar Item</button>
            </div>
         </div>, document.body
      )}
    </div>
  );
};
