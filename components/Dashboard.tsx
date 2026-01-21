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
  const [showHistory, setShowHistory] = useState(false);

  // FILTRO: Apenas manifestos em andamento
  const manifestosEmAndamento = manifestos.filter(m => 
    m.status !== 'Manifesto Entregue' && m.status !== 'Manifesto Cancelado'
  );

  // FILTRO: Histórico (Entregues ou Cancelados)
  const historicoManifestos = manifestos.filter(m => 
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
    // Configuração de Colunas e Larguras (Escala 100%)
    
    // 1. BASE ATIVA (8 Colunas) - Coluna "Entregue" Removida
    const activeHeaders = ['ID Operacional', 'Status Atual', 'Companhia', 'Puxado', 'Recebido', 'Repr. CIA', 'Turno', 'Ação'];
    const activeWidths = ['14%', '16%', '11%', '14%', '14%', '14%', '9%', '8%'];
    
    // 2. ARQUIVO/HISTÓRICO (9 Colunas) - Mantém "Entregue"
    const historyHeaders = ['ID Operacional', 'Status Atual', 'Companhia', 'Puxado', 'Recebido', 'Repr. CIA', 'Entregue', 'Turno', 'Ação'];
    const historyWidths = ['12%', '14%', '9%', '12%', '12%', '12%', '12%', '9%', '8%'];

    const headers = isHistory ? historyHeaders : activeHeaders;
    const columnWidths = isHistory ? historyWidths : activeWidths;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-100/50 border-b border-slate-200">
              {headers.map((h, idx, arr) => (
                <th 
                  key={h} 
                  style={{ width: columnWidths[idx] }}
                  className={`${idx === arr.length - 1 ? 'text-right' : 'text-left'} py-3 px-5 text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={isHistory ? 9 : 8} className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                  {isHistory ? "Nenhum histórico registrado hoje." : "Nenhum manifesto em andamento no momento."}
                </td>
              </tr>
            ) : (
              data.map(m => {
                const canFillRepr = m.status === 'Manifesto Finalizado';
                const hasReprDate = m.dataHoraRepresentanteCIA && m.dataHoraRepresentanteCIA !== '---' && m.dataHoraRepresentanteCIA !== '';

                return (
                  <tr key={m.id} className={`group hover:bg-indigo-50/40 transition-colors ${isHistory ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    {/* Coluna 1: ID */}
                    <td style={{ width: columnWidths[0] }} className="py-3 px-5 text-xs font-bold text-slate-900 font-mono-tech tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis">{m.id}</td>
                    
                    {/* Coluna 2: Status */}
                    <td style={{ width: columnWidths[1] }} className="py-3 px-5 whitespace-nowrap overflow-hidden">
                      <span className={`px-2.5 py-1 border text-[9px] font-black uppercase tracking-tight inline-block ${getStatusClass(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    
                    {/* Coluna 3: CIA */}
                    <td style={{ width: columnWidths[2] }} className="py-3 px-5 text-[10px] font-black text-slate-600 uppercase tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis">{m.cia}</td>
                    
                    {/* Coluna 4: Puxado */}
                    <td style={{ width: columnWidths[3] }} className="py-3 px-5 text-[10px] font-bold text-slate-500 font-mono-tech tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatDisplayDate(m.dataHoraPuxado)}
                    </td>
                    
                    {/* Coluna 5: Recebido */}
                    <td style={{ width: columnWidths[4] }} className="py-3 px-5 text-[10px] font-bold text-slate-500 font-mono-tech tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatDisplayDate(m.dataHoraRecebido)}
                    </td>
                    
                    {/* Coluna 6: Repr CIA */}
                    <td 
                      style={{ width: columnWidths[5] }}
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
                    
                    {/* Coluna 7: Entregue (Apenas Histórico) */}
                    {isHistory && (
                      <td style={{ width: columnWidths[6] }} className="py-3 px-5 text-[10px] font-bold font-mono-tech tracking-tight whitespace-nowrap overflow-hidden text-ellipsis text-emerald-600">
                        {formatDisplayDate(m.dataHoraEntregue)}
                      </td>
                    )}

                    {/* Coluna 8/7: Turno */}
                    <td style={{ width: columnWidths[isHistory ? 7 : 6] }} className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                      {m.turno}
                    </td>

                    {/* Coluna 9/8: Ação */}
                    <td style={{ width: columnWidths[isHistory ? 8 : 7] }} className="py-3 px-5 text-right">
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

      {/* BASE DE DADOS ATIVA - SEM COLUNA ENTREGUE */}
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

      {/* ARQUIVO / HISTÓRICO CONCLUÍDO - COM COLUNA ENTREGUE */}
      <div className="bg-white border-2 border-slate-200 panel-shadow overflow-hidden">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="w-full bg-slate-100/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Archive size={14} className="text-slate-400" /> Arquivo de Manifestos Concluídos
            </h3>
            <div className="h-4 w-[1px] bg-slate-300" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">Itens Processados: {historicoManifestos.length}</span>
          </div>
          {showHistory ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
        </button>
        {showHistory && renderTable(historicoManifestos, true)}
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
              
              {!historicoManifestos.find(hm => hm.id === menuOpenId) && (
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
                  <button onClick={() => { openEdit(menuOpenId); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest transition-colors"><Edit3 size={14} className="text-blue-400"/> Editar</button>
                  <div className="h-[1px] bg-slate-100 my-1" />
                  <button onClick={() => { onAction('cancelar', menuOpenId); setMenuOpenId(null); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest transition-colors"><XCircle size={14} className="text-red-400"/> CANCELAR MANIFESTO</button>
                </>
              )}
            </div>
         </div>, document.body
      )}
    </div>
  );
};