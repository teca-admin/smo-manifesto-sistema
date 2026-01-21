
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Manifesto, User } from '../types';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { CustomSelect } from './CustomSelect';
import { Search, History, Edit3, XCircle, CheckSquare, Plus, Database, Filter, Edit, ChevronDown, ChevronUp, Archive } from 'lucide-react';

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
  const [showHistory, setShowHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('');

  // FILTRO: Apenas manifestos em andamento (Base Ativa)
  const manifestosEmAndamento = manifestos.filter(m => 
    m.status !== 'Manifesto Entregue' && m.status !== 'Manifesto Cancelado'
  );

  // FILTRO E LIMITAÇÃO: Arquivo (Últimos 100 com busca global)
  const allHistory = manifestos.filter(m => 
    m.status === 'Manifesto Entregue' || m.status === 'Manifesto Cancelado'
  );

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

  const filteredHistory = allHistory.filter(m => {
    const search = historyFilter.toLowerCase();
    const puxado = formatDisplayDate(m.dataHoraPuxado).toLowerCase();
    const recebido = formatDisplayDate(m.dataHoraRecebido).toLowerCase();
    const entregue = formatDisplayDate(m.dataHoraEntregue).toLowerCase();
    const repr = formatDisplayDate(m.dataHoraRepresentanteCIA).toLowerCase();

    return (
      m.id.toLowerCase().includes(search) ||
      m.cia.toLowerCase().includes(search) ||
      m.status.toLowerCase().includes(search) ||
      (m.turno && m.turno.toLowerCase().includes(search)) ||
      puxado.includes(search) ||
      recebido.includes(search) ||
      entregue.includes(search) ||
      repr.includes(search)
    );
  }).slice(0, 100);

  const getStatusClass = (status: string) => {
    const s = status || '';
    switch (s) {
      case 'Manifesto Recebido': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Manifesto Iniciado': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Manifesto Finalizado': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Manifesto Entregue': return 'bg-slate-100 text-slate-500 border-slate-200 opacity-75';
      case 'Manifesto Cancelado': return 'bg-red-50 text-red-600 border-red-200 opacity-75';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    }
  };

  const renderTable = (data: Manifesto[], isHistory: boolean = false) => {
    const activeHeaders = ['ID Operacional', 'Status Atual', 'Companhia', 'Puxado', 'Recebido', 'Repr. CIA', 'Turno', 'Ação'];
    const activeWidths = ['14%', '16%', '11%', '14%', '14%', '14%', '9%', '8%'];
    
    const historyHeaders = ['ID Operacional', 'Status Atual', 'Companhia', 'Puxado', 'Recebido', 'Repr. CIA', 'Entregue', 'Turno', 'Ação'];
    const historyWidths = ['12%', '14%', '9%', '12%', '12%', '12%', '12%', '9%', '8%'];

    const headers = isHistory ? historyHeaders : activeHeaders;
    const columnWidths = isHistory ? historyWidths : activeWidths;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          <thead className={isHistory ? "sticky top-0 z-10" : ""}>
            <tr className={`${isHistory ? 'bg-slate-200 shadow-sm' : 'bg-slate-100/50'} border-b border-slate-200`}>
              {headers.map((h, idx, arr) => (
                <th 
                  key={h} 
                  style={{ width: columnWidths[idx] }}
                  className={`${idx === arr.length - 1 ? 'text-right' : 'text-left'} py-3 px-5 text-[9px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={isHistory ? 9 : 8} className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                  {isHistory ? "Nenhum resultado encontrado no filtro." : "Nenhum manifesto em andamento no momento."}
                </td>
              </tr>
            ) : (
              data.map(m => {
                const canFillRepr = m.status === 'Manifesto Finalizado';
                const hasReprDate = m.dataHoraRepresentanteCIA && m.dataHoraRepresentanteCIA !== '---' && m.dataHoraRepresentanteCIA !== '';

                return (
                  <tr key={m.id} className={`group hover:bg-indigo-50/40 transition-colors ${isHistory ? 'opacity-70 grayscale-[0.2]' : ''}`}>
                    <td className="py-3 px-5 text-xs font-bold text-slate-900 font-mono-tech tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis">{m.id}</td>
                    
                    <td className="py-3 px-5 whitespace-nowrap overflow-hidden">
                      <span className={`px-2.5 py-1 border text-[9px] font-black uppercase tracking-tight inline-block ${getStatusClass(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    
                    <td className="py-3 px-5 text-[10px] font-black text-slate-600 uppercase tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis">{m.cia}</td>
                    
                    <td className="py-3 px-5 text-[10px] font-bold text-slate-500 font-mono-tech tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatDisplayDate(m.dataHoraPuxado)}
                    </td>
                    
                    <td className="py-3 px-5 text-[10px] font-bold text-slate-500 font-mono-tech tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatDisplayDate(m.dataHoraRecebido)}
                    </td>
                    
                    <td 
                      onClick={() => !isHistory && canFillRepr && onOpenReprFill(m.id)}
                      className={`py-3 px-5 transition-all overflow-hidden text-ellipsis ${!isHistory && canFillRepr ? 'cursor-pointer hover:bg-indigo-100/60' : ''}`}
                    >
                      <div className={`flex items-center gap-1.5 text-[10px] font-mono-tech tracking-tight whitespace-nowrap ${
                        !isHistory && canFillRepr 
                          ? 'text-indigo-600 font-black' 
                          : 'text-slate-500 font-bold'
                      }`}>
                        {formatDisplayDate(m.dataHoraRepresentanteCIA)}
                        {!isHistory && canFillRepr && !hasReprDate && <Edit size={10} className="text-indigo-400 animate-pulse" />}
                      </div>
                    </td>
                    
                    {isHistory && (
                      <td className="py-3 px-5 text-[10px] font-bold font-mono-tech tracking-tight whitespace-nowrap overflow-hidden text-ellipsis text-emerald-600">
                        {formatDisplayDate(m.dataHoraEntregue)}
                      </td>
                    )}

                    <td className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                      {m.turno}
                    </td>

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
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* PAINEL DE CADASTRO SIMPLIFICADO */}
      <div className="bg-white border-2 border-slate-200 panel-shadow">
        <div className="bg-slate-50 px-5 py-2.5 border-b-2 border-slate-200 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-sm"><Plus size={12} /></span>
            Registro de Novo Manifesto
          </h3>
          <span className="text-[9px] font-bold text-slate-400 uppercase">Input Terminal v2.5</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
            <div>
              <button 
                onClick={() => {
                  if (!formData.cia || !formData.dataHoraPuxado) return onShowAlert('error', 'Campos Obrigatórios Pendentes');
                  onSave(formData);
                  setFormData({ cia: '', dataHoraPuxado: '', dataHoraRecebido: '' });
                }}
                className="w-full h-10 bg-[#0f172a] hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-100/50"
              >
                Confirmar Registro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BASE DE DADOS ATIVA */}
      <div className="bg-white border-2 border-slate-200 panel-shadow overflow-hidden">
        <div className="bg-[#0f172a] px-5 py-3 border-b-2 border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Database size={14} className="text-indigo-400" /> Base de Dados Operacional
            </h3>
            <div className="h-4 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Filter size={12} className="text-slate-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Filtros: Em Andamento</span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase">Monitorando: {manifestosEmAndamento.length} Itens</span>
        </div>
        {renderTable(manifestosEmAndamento, false)}
      </div>

      {/* ARQUIVO DE MANIFESTOS CONCLUÍDOS */}
      <div className="bg-white border-2 border-slate-200 panel-shadow overflow-hidden transition-all duration-300">
        <div 
          onClick={() => setShowHistory(!showHistory)}
          className="w-full bg-slate-50 px-5 py-3 border-b-2 border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Archive size={14} className="text-slate-400" /> Arquivo de Manifestos Concluídos
            </h3>
            <div className="h-4 w-[1px] bg-slate-300" />
            <span className="text-[9px] font-bold text-slate-400 uppercase italic">Itens Processados: {allHistory.length}</span>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            {showHistory && (
              <div className="relative w-full md:w-80" onClick={e => e.stopPropagation()}>
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                    type="text" 
                    value={historyFilter}
                    onChange={e => setHistoryFilter(e.target.value)}
                    placeholder="BUSCAR NO ARQUIVO..."
                    className="w-full h-8 pl-10 pr-4 bg-white border-2 border-slate-200 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
                 />
              </div>
            )}
            <div className="text-slate-400">
               {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
        </div>
        
        {showHistory && (
          <>
            <div className="max-h-[440px] overflow-y-auto custom-scrollbar bg-slate-50/20 animate-fadeIn">
              {renderTable(filteredHistory, true)}
            </div>
            
            <div className="bg-slate-100 px-5 py-2.5 border-t border-slate-200 flex justify-between items-center">
               <div className="flex gap-4">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Limite de Visualização: 100 Itens</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Filtrados: {filteredHistory.length}</span>
               </div>
               <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">Clique no cabeçalho para ocultar</span>
            </div>
          </>
        )}
      </div>

      {menuOpenId && createPortal(
         <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpenId(null)}>
            <div 
               className="absolute bg-white border-2 border-slate-800 shadow-2xl min-w-[220px] py-1.5 animate-fadeIn"
               style={{ top: menuPos.top + 4, left: menuPos.left - 200 }}
               onClick={e => e.stopPropagation()}
            >
              <div className="px-4 py-1 border-b border-slate-100 mb-1">
                 <p className="text-[8px] font-black text-slate-400 uppercase">Ações Rápidas</p>
              </div>
              <button onClick={() => { openHistory(menuOpenId); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest transition-colors"><Search size={14} className="text-slate-400"/> Detalhes / Log</button>
              
              {!allHistory.find(hm => hm.id === menuOpenId) && (
                <>
                  <button 
                    onClick={() => { 
                      const selectedM = manifestos.find(m => m.id === menuOpenId);
                      const hasRepr = selectedM?.dataHoraRepresentanteCIA && selectedM.dataHoraRepresentanteCIA !== '---' && selectedM.dataHoraRepresentanteCIA !== '';
                      
                      if (!hasRepr) {
                        onShowAlert('error', 'Representante CIA Obrigatório para Entrega');
                      } else {
                        onAction('entregar', menuOpenId);
                        setMenuOpenId(null);
                      }
                    }} 
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    <CheckSquare size={14} className="text-emerald-400"/> ENTREGAR MANIFESTO
                  </button>
                  <button onClick={() => { openEdit(menuOpenId); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest transition-colors"><Edit3 size={14} className="text-indigo-400"/> Editar Registro</button>
                  <button onClick={() => { onAction('cancelar', menuOpenId); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest transition-colors"><XCircle size={14} className="text-red-400"/> Cancelar Item</button>
                </>
              )}
            </div>
         </div>,
         document.body
      )}
    </div>
  );
};
