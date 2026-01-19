
import React, { useEffect, useState } from 'react';
import { Manifesto } from '../types';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { CustomSelect } from './CustomSelect';
import { UserPlus } from 'lucide-react';

interface EditModalProps {
  data: Manifesto;
  onClose: () => void;
  onSave: (data: Partial<Manifesto> & { id: string, usuario: string, justificativa: string }) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ data, onClose, onSave }) => {
  const [formData, setFormData] = React.useState({
    ...data
  });
  const [justificativa, setJustificativa] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSave = () => {
    if (justificativa.length < 5) { setErrorMsg("Justificativa obrigatória."); return; }
    onSave({ id: data.id, usuario: data.usuario, justificativa, cia: formData.cia });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md border border-zinc-300 shadow-2xl flex flex-col">
        <div className="bg-zinc-900 text-white p-3 text-[11px] font-bold uppercase tracking-widest">
          Editar Registro: {data.id}
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold text-zinc-400 uppercase">Companhia</label>
              <CustomSelect value={formData.cia} onChange={v => setFormData({...formData, cia: v})} />
            </div>
            <div>
              <label className="text-[9px] font-bold text-zinc-400 uppercase">Status</label>
              <div className="h-9 px-2 bg-zinc-50 border border-zinc-200 flex items-center text-xs font-bold text-zinc-500">{data.status}</div>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold text-zinc-400 uppercase">Justificativa da Alteração</label>
            <textarea value={justificativa} onChange={e => setJustificativa(e.target.value)} className="w-full h-20 p-2 border border-zinc-300 text-xs outline-none focus:border-zinc-900 resize-none" />
          </div>
          {errorMsg && <p className="text-[10px] font-bold text-red-600">{errorMsg}</p>}
        </div>
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex gap-2">
          <button onClick={onClose} className="flex-1 h-9 border border-zinc-300 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-100 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="flex-1 h-9 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors">Confirmar Edição</button>
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
  const [name, setName] = useState('');
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    if (!name.trim()) {
      setError(true);
      return;
    }
    onConfirm(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm border-2 border-slate-800 shadow-2xl flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex items-center gap-3">
          <UserPlus size={18} className="text-indigo-400" />
          <h3 className="text-[11px] font-black uppercase tracking-widest">Atribuir Responsável</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Manifesto Alvo</label>
            <div className="h-10 px-3 bg-slate-50 border border-slate-200 flex items-center text-xs font-bold text-slate-400 font-mono-tech">{manifestoId}</div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Nome do Responsável</label>
            <input 
              autoFocus
              type="text" 
              value={name}
              onChange={(e) => { setName(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder="DIGITE O NOME COMPLETO"
              className={`w-full h-10 px-3 bg-white border-2 text-xs font-bold uppercase tracking-tight outline-none transition-all ${error ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-indigo-600'}`}
            />
            {error && <p className="text-[9px] font-bold text-red-600 uppercase">Campo Obrigatório</p>}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 border-2 border-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors">Cancelar</button>
          <button onClick={handleConfirm} className="flex-1 h-10 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100">Atribuir Puxe</button>
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

export const HistoryModal: React.FC<{ data: Manifesto, onClose: () => void }> = ({ data, onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
    <div className="bg-white w-full max-w-2xl border border-zinc-300 shadow-2xl flex flex-col">
      <div className="bg-zinc-900 text-white p-3 text-[11px] font-bold uppercase tracking-widest flex justify-between">
        <span>LOG DETALHADO: {data.id}</span>
        <button onClick={onClose}>X</button>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <h5 className="text-[10px] font-bold text-zinc-400 uppercase border-b border-zinc-100 pb-1">Identificação</h5>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Status:</span><span className="font-bold">{data.status}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Companhia:</span><span className="font-bold uppercase">{data.cia}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Usuário Origem:</span><span className="font-bold">{data.usuario}</span></div>
        </div>
        <div className="flex flex-col gap-2">
          <h5 className="text-[10px] font-bold text-zinc-400 uppercase border-b border-zinc-100 pb-1">Cronologia</h5>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Puxado:</span><span className="font-bold">{data.dataHoraPuxado || '---'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Recebido:</span><span className="font-bold">{data.dataHoraRecebido || '---'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-zinc-500">Finalizado:</span><span className="font-bold">{data.carimboDataHR || '---'}</span></div>
        </div>
      </div>
      <div className="p-4 border-t border-zinc-200">
        <button onClick={onClose} className="w-full h-9 bg-zinc-100 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">Fechar Detalhes</button>
      </div>
    </div>
  </div>
);

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
