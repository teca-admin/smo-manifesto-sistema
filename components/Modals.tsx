
import React, { useEffect, useState, useRef } from 'react';
import { Manifesto, Funcionario, OperationalLog } from '../types';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { CustomSelect } from './CustomSelect';
import { UserPlus, Search, UserCheck, Loader2, X, Clock, Calendar, Database, ClipboardEdit, CheckCircle2, User as UserIcon, MapPin, Activity, Plane, History, MessageSquareQuote, FileText, UserCircle } from 'lucide-react';
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
    if (justificativa.trim().length < 5) { 
      setErrorMsg("Justificativa obrigatória para auditoria (mín. 5 caracteres)."); 
      return; 
    }
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
    // AJUSTADO: items-start + pt-[5vh] para modais grandes
    <div className="fixed inset-0 bg-slate-900/60 z-[10000] flex items-start justify-center p-4 pt-[5vh] animate-fadeIn backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-xl border-2 border-slate-900 shadow-2xl flex flex-col mb-10">
        <div className="bg-slate-900 text-white p-4 text-[11px] font-black uppercase tracking-widest flex justify-between items-center shrink-0">
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
              <div className="h-10 px-3 bg-slate-50 border-2 border-slate-100 flex items-center text-[10px] font-black text-slate-400 uppercase">
                {data.status}
              </div>
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

          <div className="space-y-1.5 border-t border-slate-100 pt-6">
            <label className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <MessageSquareQuote size={14} className="text-indigo-600" /> Justificativa da Alteração
            </label>
            <textarea 
              value={justificativa} 
              onChange={e => {
                setJustificativa(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }} 
              placeholder="Descreva o motivo desta alteração manual para o log de auditoria..."
              className={`w-full h-24 p-3 bg-slate-50 border-2 text-xs font-bold outline-none transition-all resize-none ${errorMsg ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-slate-900 focus:bg-white'}`} 
            />
            {errorMsg && <p className="text-[9px] font-black text-red-600 uppercase italic">{errorMsg}</p>}
          </div>
        </div>

        <div className="p-5 bg-slate-50 border-t-2 border-slate-100 flex gap-4">
          <button onClick={onClose} className="flex-1 h-12 border-2 border-slate-300 text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all text-slate-500">Cancelar</button>
          <button onClick={handleSave} className="flex-1 h-12 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">Salvar</button>
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
    // AJUSTADO: items-start + pt-[15vh] para modais médios. 
    // Garante que o calendário tenha espaço total para abrir para baixo.
    <div className="fixed inset-0 bg-slate-900/60 z-[10000] flex items-start justify-center p-4 pt-[15vh] animate-fadeIn backdrop-blur-sm">
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
    // AJUSTADO: items-start + pt-[10vh]
    <div className="fixed inset-0 bg-slate-900/80 z-[10000] flex items-start justify-center p-4 pt-[10vh] animate-fadeIn backdrop-blur-sm">
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
  const [logs, setLogs] = useState<OperationalLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    const fetchFullHistory = async () => {
      setLoadingLogs(true);
      try {
        const { data: logData, error } = await supabase
          .from('SMO_Operacional')
          .select('*')
          .eq('ID_Manifesto', data.id)
          .order('id', { ascending: false });
        
        if (!error && logData) {
          setLogs(logData.map(l => ({
            id: l.id,
            idManifesto: l.ID_Manifesto,
            acao: l.Ação,
            usuario: l.Usuario,
            justificativa: l.Justificativa,
            createdAtBR: l.Created_At_BR
          })));
        }
      } catch (err) {
        console.error("Erro ao buscar histórico:", err);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchFullHistory();
  }, [data.id]);

  const formatTime = (iso: string | undefined) => {
    if (!iso || iso === '---' || iso === '') return 'Pendente';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('pt-BR');
    } catch { return iso; }
  };

  const timelineSteps = [
    { label: 'Manifesto Puxado', time: data.dataHoraPuxado, icon: Database },
    { label: 'Manifesto Recebido', time: data.dataHoraRecebido, icon: MapPin },
    { label: 'Início da Operação', time: data.dataHoraIniciado, icon: Activity },
    { label: 'Operação Finalizada', time: data.dataHoraCompleto, icon: CheckCircle2 },
    { label: 'Assinatura Representante', time: data.dataHoraRepresentanteCIA, icon: Clock },
    { label: 'Manifesto Entregue', time: data.dataHoraEntregue, icon: Plane }
  ];

  return (
    // AJUSTADO: items-start + pt-[2vh] para relatórios gigantes
    <div className="fixed inset-0 bg-slate-900/60 z-[10000] flex items-start justify-center p-4 pt-[2vh] animate-fadeIn backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl border-2 border-slate-900 shadow-2xl flex flex-col max-h-[95vh] mb-4">
        {/* HEADER */}
        <div className="bg-[#0f172a] text-white p-5 flex items-center justify-between border-b-2 border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-indigo-600">
                <Search size={20} className="text-white" />
             </div>
             <div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.2em]">Rastreabilidade e Log de Auditoria</h3>
                <p className="text-[10px] font-bold text-slate-400 font-mono">MANIFESTO ID: {data.id}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          
          {/* PAINEL DE METADADOS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">CIA Aérea</p>
                <p className="text-xs font-black text-slate-800 uppercase">{data.cia}</p>
             </div>
             <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Turno</p>
                <p className="text-xs font-black text-slate-800 uppercase">{data.turno}</p>
             </div>
             <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Operador Atribuído</p>
                <p className="text-xs font-black text-slate-800 uppercase">{data.usuarioResponsavel || '---'}</p>
             </div>
             <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Status Final</p>
                <span className="text-[9px] font-black text-indigo-700 uppercase">{data.status}</span>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* COLUNA ESQUERDA: LINHA DO TEMPO AUTOMÁTICA */}
            <div className="lg:col-span-5 space-y-6">
               <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Clock size={14} className="text-slate-400" /> Fluxo Temporal
               </h4>
               
               <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  {timelineSteps.map((step, idx) => {
                    const hasDate = step.time && step.time !== '---' && step.time !== '';
                    return (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-[30px] top-0 p-1 rounded-full border-2 bg-white z-10 ${hasDate ? 'border-indigo-600 text-indigo-600' : 'border-slate-100 text-slate-300'}`}>
                          <step.icon size={12} />
                        </div>
                        <div className="flex flex-col">
                           <span className={`text-[10px] font-black uppercase tracking-tight ${hasDate ? 'text-slate-800' : 'text-slate-300'}`}>{step.label}</span>
                           <span className={`text-[10px] font-bold font-mono mt-0.5 ${hasDate ? 'text-slate-500' : 'text-transparent'}`}>
                              {formatTime(step.time)}
                           </span>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>

            {/* COLUNA DIREITA: LOG DE ATIVIDADES DETALHADO */}
            <div className="lg:col-span-7 space-y-6">
               <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  <History size={14} className="text-indigo-600" /> Histórico de Auditoria (Logs)
               </h4>

               <div className="bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden min-h-[400px]">
                  {loadingLogs ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-300 gap-3">
                       <Loader2 size={32} className="animate-spin" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando registros...</span>
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-300">
                       <FileText size={48} className="opacity-10 mb-2" />
                       <span className="text-[9px] font-bold uppercase italic">Sem registros de log para este manifesto.</span>
                    </div>
                  ) : (
                    <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                       {logs.map((log) => (
                         <div key={log.id} className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm hover:border-indigo-200 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-2">
                                  <UserCircle size={14} className="text-slate-400" />
                                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{log.usuario}</span>
                               </div>
                               <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{log.createdAtBR}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1.5">
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                                  log.acao.includes('Edição') ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                  log.acao.includes('Recebido') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  log.acao.includes('Cancelado') ? 'bg-red-50 text-red-600 border-red-100' :
                                  'bg-slate-50 text-slate-600 border-slate-100'
                               } uppercase`}>
                                  {log.acao}
                               </span>
                            </div>
                            {log.justificativa && (
                               <div className="mt-2 p-2 bg-indigo-50/50 border-l-4 border-indigo-400">
                                  <p className="text-[10px] font-bold text-slate-700 italic">
                                     "{log.justificativa}"
                                  </p>
                               </div>
                            )}
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base de Dados: <span className="font-black text-slate-900">Hostinger SMO v2.5</span></p>
          <button onClick={onClose} className="h-11 px-10 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl">Fechar Relatório</button>
        </div>
      </div>
    </div>
  );
};

export const CancellationModal: React.FC<{ onConfirm: () => void, onClose: () => void }> = ({ onConfirm, onClose }) => (
  // AJUSTADO: pt-[15vh]
  <div className="fixed inset-0 bg-black/60 z-[10000] flex items-start justify-center p-4 pt-[15vh] animate-fadeIn">
    <div className="bg-white w-full max-w-xs border-t-4 border-red-600 shadow-2xl p-6 flex flex-col items-center">
      <div className="p-3 bg-red-100 text-red-600 rounded-full mb-4">
         <X size={24} />
      </div>
      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 mb-2">CANCELAR MANIFESTO?</h3>
      <p className="text-[10px] font-bold text-zinc-500 text-center mb-6 uppercase tracking-tighter">Esta ação é irreversível e o item deixará de ser monitorado pela base ativa.</p>
      <div className="flex gap-2 w-full">
        <button onClick={onClose} className="flex-1 h-10 border-2 border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 transition-all">Sair</button>
        <button onClick={onConfirm} className="flex-1 h-10 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg">Confirmar</button>
      </div>
    </div>
  </div>
);

export const AlertToast: React.FC<{ type: 'success' | 'error', msg: string }> = ({ type, msg }) => (
  <div className={`fixed bottom-4 right-4 text-white px-4 py-3 shadow-2xl font-bold text-[10px] uppercase tracking-widest z-[10001] animate-slideInUp ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
    {msg}
  </div>
);
