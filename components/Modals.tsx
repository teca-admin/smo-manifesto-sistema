
import React, { useEffect, useState, useRef } from 'react';
import { Manifesto, Funcionario } from '../types';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { CustomSelect } from './CustomSelect';
import { UserPlus, Search, UserCheck, Loader2, X, Clock, Calendar, Database, ClipboardEdit, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface EditModalProps {
  data: Manifesto;
  onClose: () => void;
  onSave: (data: Partial<Manifesto> & { id: string, usuario: string, justificativa: string }) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ data, onClose, onSave }) => {
  const [formData, setFormData] = React.useState({ ...data });
  const [justificativa, setJustificativa] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSave = () => {
    if (justificativa.length < 5) { setErrorMsg("Justificativa obrigatória (mín. 5 caracteres)."); return; }
    onSave({ 
      id: data.id, 
      usuario: data.usuario, 
      justificativa, 
      cia: formData.cia,
      dataHoraRepresentanteCIA: formData.dataHoraRepresentanteCIA,
      dataHoraEntregue: formData.dataHoraEntregue,
      dataHoraPuxado: formData.dataHoraPuxado,
      dataHoraRecebido: formData.dataHoraRecebido
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[10000] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl border-2 border-slate-900 shadow-2xl flex flex-col">
        <div className="bg-slate-900 text-white p-4 text-[11px] font-black uppercase tracking-widest flex justify-between items-center">
          <div className="flex items-center gap-3">
             <ClipboardEdit size={16} className="text-indigo-400" />
             <span>EDITAR MONITORAMENTO: {data.id}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Companhia</label>
              <CustomSelect value={formData.cia} onChange={v => setFormData({...formData, cia: v})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Status Atual</label>
              <div className="h-10 px-3 bg-slate-50 border-2 border-slate-100 flex items-center text-[10px] font-black text-slate-400 uppercase">{data.status}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Manifesto Puxado</label>
              <CustomDateTimePicker value={formData.dataHoraPuxado || ''} onChange={v => setFormData({...formData, dataHoraPuxado: v})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Manifesto Recebido</label>
              <CustomDateTimePicker value={formData.dataHoraRecebido || ''} onChange={v => setFormData({...formData, dataHoraRecebido: v})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">Representante CIA</label>
              <CustomDateTimePicker value={formData.dataHoraRepresentanteCIA || ''} onChange={v => setFormData({...formData, dataHoraRepresentanteCIA: v})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Manifesto Entregue</label>
              <CustomDateTimePicker value={formData.dataHoraEntregue || ''} onChange={v => setFormData({...formData, dataHoraEntregue: v})} />
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-6">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Justificativa da Alteração</label>
            <textarea 
              value={justificativa} 
              onChange={e => setJustificativa(e.target.value)} 
              placeholder="Descreva o motivo da alteração manual..."
              className="w-full h-20 p-3 bg-slate-50 border-2 border-slate-200 text-xs font-bold outline-none focus:border-slate-900 focus:bg-white transition-all resize-none" 
            />
          </div>

          {errorMsg && <p className="text-[10px] font-black text-red-600 uppercase animate-pulse">{errorMsg}</p>}
        </div>

        <div className="p-5 bg-slate-50 border-t-2 border-slate-100 flex gap-4">
          <button onClick={onClose} className="flex-1 h-12 border-2 border-slate-300 text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all text-slate-500">Cancelar</button>
          <button onClick={handleSave} className="flex-1 h-12 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">Confirmar Edição</button>
        </div>
      </div>
    </div>
  );
};

export const ReprFillModal: React.FC<{
  manifesto: Manifesto,
  onClose: () => void,
  onConfirm: (date: string) => void
}> = ({ manifesto, onClose, onConfirm }) => {
  const [date, setDate] = useState(manifesto.dataHoraRepresentanteCIA || '');

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[10000] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm border-2 border-slate-900 shadow-2xl flex flex-col">
        <div className="bg-[#0f172a] text-white p-3 text-[10px] font-black uppercase tracking-widest flex justify-between items-center">
          <span className="flex items-center gap-2"><Clock size={14} /> REPR. CIA - {manifesto.id}</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Data e Hora da Assinatura</label>
            <CustomDateTimePicker value={date} onChange={setDate} />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-10 border-2 border-slate-200 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all">Sair</button>
            <button 
              disabled={!date}
              onClick={() => onConfirm(date)} 
              className={`flex-1 h-10 text-white text-[10px] font-black uppercase transition-all shadow-md flex items-center justify-center gap-2 ${date ? 'bg-indigo-600 hover:bg-slate-900' : 'bg-slate-200 cursor-not-allowed'}`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AssignResponsibilityModal: React.FC<{ 
  manifestoId: string, 
  onConfirm: (name: string) => void, 
  onClose: () => void 
}> = ({ manifestoId, onConfirm, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Funcionario | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFuncionarios = async () => {
      if (searchTerm.length < 2 || selected) {
        setFuncionarios([]);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('Funcionarios_WFS')
          .select('*')
          .ilike('Nome', `%${searchTerm}%`)
          .eq('Ativo', true)
          .limit(5);
        
        if (!error && data) {
          setFuncionarios(data);
        }
      } catch (err) {
        console.error("Erro na busca:", err);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchFuncionarios, 300);
    return () => clearTimeout(delay);
  }, [searchTerm, selected]);

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected.Nome);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setFuncionarios([]);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[10000] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
      <div className="bg-white w-full max-w-md border-2 border-slate-900 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.45)] flex flex-col relative">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-600">
               <UserPlus size={20} className="text-white" />
            </div>
            <h3 className="text-[12px] font-black uppercase tracking-[0.2em]">Atribuir Responsável</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Localizar Colaborador</label>
              <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">{manifestoId}</span>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search size={16} />
              </div>
              
              <input 
                autoFocus
                type="text" 
                value={selected ? selected.Nome : searchTerm}
                onChange={(e) => { 
                  setSearchTerm(e.target.value); 
                  if (selected) setSelected(null);
                }}
                placeholder="DIGITE O NOME..."
                className={`w-full h-14 pl-12 pr-4 bg-slate-50 border-2 text-[11px] font-black uppercase tracking-tight outline-none transition-all ${
                  selected 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-slate-200 focus:border-indigo-600 focus:bg-white'
                }`}
              />
              
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-600">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              )}

              {searchTerm.length >= 2 && !selected && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-900 shadow-[0_20px_40px_rgba(0,0,0,0.3)] z-[10010] animate-fadeIn">
                  {funcionarios.length > 0 ? (
                    funcionarios.map(f => (
                      <button 
                        key={f.id}
                        onClick={() => {
                          setSelected(f);
                          setSearchTerm(f.Nome);
                        }}
                        className="w-full p-4 text-left hover:bg-indigo-50 flex items-center justify-between group transition-colors border-b border-slate-100 last:border-0"
                      >
                        <div>
                          <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-700">{f.Nome}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{f.Cargo || 'OPERACIONAL'}</p>
                        </div>
                        <UserCheck size={16} className="text-slate-200 group-hover:text-indigo-400" />
                      </button>
                    ))
                  ) : (
                    !loading && (
                      <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                        Nenhum funcionário encontrado
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {selected && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 flex items-center gap-4 animate-fadeIn">
               <div className="p-2 bg-emerald-600 rounded-full text-white">
                  <UserCheck size={16} />
               </div>
               <div>
                  <p className="text-[9px] font-black text-emerald-600 uppercase">Confirmado para Atribuição</p>
                  <p className="text-[12px] font-black text-emerald-900 uppercase">{selected.Nome}</p>
               </div>
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-50 border-t-2 border-slate-100 flex gap-4 mt-auto">
          <button onClick={onClose} className="flex-1 h-12 border-2 border-slate-300 text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all text-slate-500">Voltar</button>
          <button 
            onClick={handleConfirm} 
            disabled={!selected}
            className={`flex-1 h-12 text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
              selected 
                ? 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-200' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border-none'
            }`}
          >
            Confirmar Atribuição
          </button>
        </div>
      </div>
    </div>
  );
};

export const LoadingOverlay: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="fixed inset-0 bg-white/80 z-[10002] flex flex-col items-center justify-center animate-fadeIn">
    <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 animate-spin mb-2"></div>
    <div className="text-[10px] font-bold text-zinc-900 uppercase tracking-[0.2em]">{msg}</div>
  </div>
);

export const HistoryModal: React.FC<{ data: Manifesto, onClose: () => void }> = ({ data, onClose }) => {
  const formatTime = (iso: string | undefined) => {
    if (!iso || iso === '---') return 'Pendente';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR');
    } catch { return iso; }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[10000] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl border-2 border-slate-900 shadow-2xl flex flex-col">
        <div className="bg-slate-900 text-white p-4 text-[11px] font-black uppercase tracking-widest flex justify-between items-center">
          <div className="flex items-center gap-3">
             <Calendar size={16} className="text-indigo-400" />
             <span>REGISTRO CRONOLÓGICO: {data.id}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors"><X size={18} /></button>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-slate-400 uppercase border-b-2 border-slate-50 pb-2 flex items-center gap-2">
               <Database size={14} /> Metadados de Origem
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between text-xs border-b border-slate-100 pb-1">
                <span className="font-bold text-slate-500">Status Atual:</span>
                <span className="font-black text-indigo-600 uppercase">{data.status}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-100 pb-1">
                <span className="font-bold text-slate-500">Companhia:</span>
                <span className="font-black text-slate-900 uppercase">{data.cia}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-slate-100 pb-1">
                <span className="font-bold text-slate-500">Operador:</span>
                <span className="font-black text-slate-900 uppercase">{data.usuario}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-slate-400 uppercase border-b-2 border-slate-50 pb-2 flex items-center gap-2">
               <Clock size={14} /> Linha do Tempo Operacional
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] border-b border-slate-100 pb-1">
                <span className="font-bold text-slate-500 uppercase">1. Puxado:</span>
                <span className="font-black text-slate-700 font-mono">{formatTime(data.dataHoraPuxado)}</span>
              </div>
              <div className="flex justify-between text-[10px] border-b border-slate-100 pb-1">
                <span className="font-bold text-slate-500 uppercase">2. Recebido:</span>
                <span className="font-black text-slate-700 font-mono">{formatTime(data.dataHoraRecebido)}</span>
              </div>
              <div className="flex justify-between text-[10px] border-b border-slate-100 pb-1">
                <span className="font-bold text-indigo-600 uppercase">3. Repr. CIA:</span>
                <span className="font-black text-indigo-700 font-mono">{formatTime(data.dataHoraRepresentanteCIA)}</span>
              </div>
              <div className="flex justify-between text-[10px] border-b border-slate-100 pb-1">
                <span className="font-bold text-emerald-600 uppercase">4. Entregue:</span>
                <span className="font-black text-emerald-700 font-mono">{formatTime(data.dataHoraEntregue)}</span>
              </div>
              <div className="flex justify-between text-[10px] pt-1">
                <span className="font-bold text-slate-400 uppercase">Última Modif:</span>
                <span className="font-black text-slate-400 font-mono">{data.carimboDataHR || '---'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="w-full h-11 bg-white border-2 border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">Fechar Auditoria de Log</button>
        </div>
      </div>
    </div>
  );
};

export const CancellationModal: React.FC<{ onConfirm: () => void, onClose: () => void }> = ({ onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
    <div className="bg-white w-full max-w-xs border-t-4 border-red-600 shadow-2xl p-6 flex flex-col items-center">
      <h3 className="text-sm font-bold text-zinc-900 mb-2">Confirmar Cancelamento?</h3>
      <p className="text-[10px] text-zinc-500 text-center mb-6">Esta ação é irreversível e será registrada no log de auditoria.</p>
      <div className="flex gap-2 w-full">
        <button onClick={onClose} className="flex-1 h-9 border border-zinc-300 text-[10px] font-bold uppercase">Voltar</button>
        <button onClick={onConfirm} className="flex-1 h-9 bg-red-600 text-white text-[10px] font-bold uppercase">Confirmar</button>
      </div>
    </div>
  </div>
);

export const AnularModal: React.FC<{ onConfirm: () => void, onClose: () => void }> = ({ onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
    <div className="bg-white w-full max-w-xs border-t-4 border-amber-500 shadow-2xl p-6 flex flex-col items-center">
      <h3 className="text-sm font-bold text-zinc-900 mb-2">Anular Status Atual?</h3>
      <p className="text-[10px] text-zinc-500 text-center mb-6">O manifesto retornará ao estado de "Recebido".</p>
      <div className="flex gap-2 w-full">
        <button onClick={onClose} className="flex-1 h-9 border border-zinc-300 text-[10px] font-bold uppercase">Voltar</button>
        <button onClick={onConfirm} className="flex-1 h-9 bg-amber-500 text-white text-[10px] font-bold uppercase">Anular</button>
      </div>
    </div>
  </div>
);

export const AlertToast: React.FC<{ type: 'success' | 'error', msg: string }> = ({ type, msg }) => (
  <div className={`fixed bottom-4 right-4 text-white px-4 py-3 shadow-2xl font-bold text-[10px] uppercase tracking-widest z-[10001] animate-slideInUp ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
    {msg}
  </div>
);
