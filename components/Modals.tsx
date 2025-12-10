import React, { useEffect, useState } from 'react';
import { Manifesto, ManifestoEvent } from '../types';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { CustomSelect } from './CustomSelect';
import { AlertTriangle, ArrowRight, History, ArrowLeft } from 'lucide-react';

interface EditModalProps {
  data: Manifesto;
  onClose: () => void;
  // Alterado para aceitar um objeto parcial (somente o que mudou)
  onSave: (data: Partial<Manifesto> & { id: string, usuario: string, justificativa: string }) => void;
}

const getStatusClass = (status: string) => {
  const s = status ? status.toLowerCase().replace(/\s+/g, '-') : '';
  switch (s) {
    case 'manifesto-cancelado': return 'bg-gradient-to-br from-[#6c757d] to-[#495057]';
    case 'manifesto-recebido': return 'bg-gradient-to-br from-[#ff6c00] to-[#ff8c00]';
    case 'manifesto-iniciado': return 'bg-gradient-to-br from-[#fbbc04] to-[#ffd700]';
    case 'manifesto-disponível': return 'bg-gradient-to-br from-[#0c343d] to-[#1a5766]';
    case 'manifesto-em-conferência': return 'bg-gradient-to-br from-[#50284f] to-[#6d3a6c]';
    case 'manifesto-completo': return 'bg-gradient-to-br from-[#0a53a8] to-[#0d6efd]';
    case 'manifesto-pendente': return 'bg-gradient-to-br from-[#db091b] to-[#ff3547]';
    case 'manifesto-entregue': return 'bg-gradient-to-br from-[#137333] to-[#198754]';
    default: return 'bg-gradient-to-br from-[#ff6c00] to-[#ff8c00]';
  }
};

export const EditModal: React.FC<EditModalProps> = ({ data, onClose, onSave }) => {
  // Initialize numeric fields as strings to handle empty state validation
  const [formData, setFormData] = React.useState({
    ...data,
    cargasINH: data.cargasINH.toString(),
    cargasIZ: data.cargasIZ.toString()
  });
  const [justificativa, setJustificativa] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Check if editing is restricted based on status (case insensitive)
  const statusNormalized = data.status?.toLowerCase().trim() || '';
  const isRestricted = statusNormalized === 'manifesto disponível' || statusNormalized === 'manifesto em conferência';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    setErrorMsg(null);

    // Validações de campos vazios
    if (!formData.cia) {
      setErrorMsg("O campo CIA é obrigatório!");
      return;
    }
    if (!formData.dataHoraPuxado) {
      setErrorMsg("O campo Data/Hora (Manifesto Puxado) é obrigatório!");
      return;
    }
    if (!formData.dataHoraRecebido) {
      setErrorMsg("O campo Data/Hora (Manifesto Recebido) é obrigatório!");
      return;
    }
    if (formData.cargasINH === '') {
      setErrorMsg("O campo Cargas IN/H é obrigatório!");
      return;
    }
    if (formData.cargasIZ === '') {
      setErrorMsg("O campo Cargas IZ é obrigatório!");
      return;
    }
    if (justificativa.length < 10) {
      setErrorMsg("A justificativa é obrigatória e deve ter no mínimo 10 caracteres.");
      return;
    }

    // Lógica para detectar mudanças
    const changes: Partial<Manifesto> = {};

    if (formData.cia !== data.cia) {
      changes.cia = formData.cia;
    }
    if (formData.dataHoraPuxado !== data.dataHoraPuxado) {
      changes.dataHoraPuxado = formData.dataHoraPuxado;
    }
    if (formData.dataHoraRecebido !== data.dataHoraRecebido) {
      changes.dataHoraRecebido = formData.dataHoraRecebido;
    }
    if (Number(formData.cargasINH) !== data.cargasINH) {
      changes.cargasINH = Number(formData.cargasINH);
    }
    if (Number(formData.cargasIZ) !== data.cargasIZ) {
      changes.cargasIZ = Number(formData.cargasIZ);
    }

    // Se nada mudou, avisa o usuário (opcional, mas evita requests inúteis)
    if (Object.keys(changes).length === 0) {
      const confirmNoChanges = window.confirm("Nenhuma informação foi alterada. Deseja salvar apenas a justificativa?");
      if (!confirmNoChanges) return;
    }

    // Envia apenas Identificadores Obrigatórios + Justificativa + Campos Alterados
    onSave({ 
      id: data.id,          // Obrigatório para saber qual editar
      usuario: data.usuario,// Obrigatório (quem criou o manifesto)
      justificativa,        // Obrigatório
      ...changes            // Espalha apenas os campos que mudaram
    });
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/85 z-[10000] flex items-center justify-center backdrop-blur-sm animate-fadeIn">
      <div className="bg-white p-[35px] rounded-[20px] min-w-[450px] max-w-[500px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-slideInUp">
        <h3 className="text-[#690c76] mb-[25px] text-[20px] text-center font-bold">Editar Manifesto</h3>
        
        <div className="bg-[#f8f9fa] p-[15px] rounded-[10px] mb-[25px] border-l-[4px] border-[#690c76]">
           <div className="flex justify-between mb-2"><span className="text-[#666] text-[13px]">ID:</span><strong className="text-[#690c76] text-[13px]">{data.id}</strong></div>
           <div className="flex justify-between mb-2"><span className="text-[#666] text-[13px]">Usuário:</span><strong className="text-[13px]">{data.usuario}</strong></div>
           <div className="flex justify-between"><span className="text-[#666] text-[13px]">Status Atual:</span><strong className="text-[13px]">{data.status}</strong></div>
        </div>

        <div className="flex flex-col gap-[18px]">
          <div>
            <label className="block mb-[6px] font-semibold text-[13px] text-[#333]">CIA:</label>
            <CustomSelect 
               value={formData.cia} 
               onChange={(val) => { setFormData({...formData, cia: val}); if(errorMsg) setErrorMsg(null); }}
               placeholder="Selecione a CIA"
               disabled={isRestricted}
            />
          </div>
          <div>
             <label className="block mb-[6px] font-semibold text-[13px] text-[#333]">Data/Hora (Manifesto Puxado):</label>
             <CustomDateTimePicker 
               value={formData.dataHoraPuxado} 
               onChange={(val) => { setFormData({...formData, dataHoraPuxado: val}); if(errorMsg) setErrorMsg(null); }}
               placeholder="dd/mm/aaaa --:--"
               disabled={isRestricted}
             />
          </div>
          <div>
             <label className="block mb-[6px] font-semibold text-[13px] text-[#333]">Data/Hora (Manifesto Recebido):</label>
             <CustomDateTimePicker 
               value={formData.dataHoraRecebido} 
               onChange={(val) => { setFormData({...formData, dataHoraRecebido: val}); if(errorMsg) setErrorMsg(null); }}
               placeholder="dd/mm/aaaa --:--"
               disabled={isRestricted}
             />
          </div>
          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block mb-[6px] font-semibold text-[13px] text-[#333]">Cargas IN/H:</label>
                <input 
                  type="number" 
                  value={formData.cargasINH} 
                  onChange={e => { setFormData({...formData, cargasINH: e.target.value}); if(errorMsg) setErrorMsg(null); }}
                  className="w-full p-[10px_12px] border-2 border-[#e0e0e0] rounded-[8px] text-[13px] text-gray-900 bg-white" 
                />
             </div>
             <div className="flex-1">
                <label className="block mb-[6px] font-semibold text-[13px] text-[#333]">Cargas IZ:</label>
                <input 
                  type="number" 
                  value={formData.cargasIZ} 
                  onChange={e => { setFormData({...formData, cargasIZ: e.target.value}); if(errorMsg) setErrorMsg(null); }}
                  className="w-full p-[10px_12px] border-2 border-[#e0e0e0] rounded-[8px] text-[13px] text-gray-900 bg-white" 
                />
             </div>
          </div>
          <div>
            <label className="block mb-[6px] font-semibold text-[13px] text-[#333]">Justificativa (obrigatória - mín. 10 caracteres):</label>
            <textarea 
              value={justificativa}
              onChange={e => { setJustificativa(e.target.value); if(errorMsg) setErrorMsg(null); }}
              placeholder="Digite o motivo da edição..." 
              className={`w-full h-[90px] p-[10px_12px] border-2 ${errorMsg && errorMsg.includes('justificativa') ? 'border-[#dc3545]' : 'border-[#e0e0e0]'} rounded-[8px] text-[13px] resize-y focus:outline-none focus:border-[#690c76] focus:shadow-[0_0_0_3px_rgba(105,12,118,0.1)] transition-all text-gray-900 bg-white`}
            ></textarea>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-[15px] p-[10px_12px] bg-[#dc3545]/10 border border-[#dc3545]/20 rounded-[8px] flex items-center gap-[8px] text-[#dc3545] text-[13px] font-semibold animate-fadeInScale">
             <AlertTriangle size={16} className="shrink-0" />
             <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex gap-[12px] mt-[25px]">
          <button onClick={onClose} className="flex-1 bg-[#6c757d] text-white border-none p-[12px] rounded-[8px] font-semibold text-[14px] cursor-pointer hover:bg-[#5a6268] transition-all">Cancelar</button>
          <button 
            onClick={handleSave} 
            className="flex-1 bg-gradient-to-br from-[#690c76] to-[#4d0557] text-white border-none p-[12px] rounded-[8px] font-semibold text-[14px] cursor-pointer shadow-[0_4px_15px_rgba(105,12,118,0.3)] hover:-translate-y-[1px] transition-all"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

export const LoadingOverlay: React.FC<{ msg: string }> = ({ msg }) => (
  <div className="fixed top-0 left-0 w-full h-full bg-black/80 z-[10002] flex flex-col items-center justify-center text-white text-[16pt] backdrop-blur-[5px] animate-fadeIn">
    <div className="border-[4px] border-white/30 border-t-[#ee2536] rounded-full w-[50px] h-[50px] animate-spin-custom mb-[20px]"></div>
    <div>{msg}</div>
  </div>
);

// Interface atualizada para receber o Manifesto completo
interface HistoryModalProps {
  data: Manifesto;
  events?: ManifestoEvent[];
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ data, events = [], onClose }) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Função auxiliar para formatar datas no padrão BR
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Não registrado";
    const safeDate = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(safeDate);
    if (isNaN(d.getTime())) return dateStr;
    
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
  };

  const renderRow = (label: string, value: string | undefined, isStatus: boolean = false) => {
    const hasValue = !!value && value !== "Não registrado";
    return (
       <div className="flex justify-between items-center py-[8px] border-b border-[#f0f0f0] last:border-0 hover:bg-gray-50 px-2 -mx-2 rounded transition-colors">
          <span className="text-[#555] text-[13px] font-medium">{label}:</span>
          {isStatus ? (
             <span className={`p-[2px_8px] rounded-[6px] text-white text-[11px] font-bold shadow-sm uppercase tracking-wide ${getStatusClass(value || '')}`}>
                {value}
             </span>
          ) : (
             <span className={`text-[13px] font-bold text-right ${hasValue ? 'text-[#333]' : 'text-[#db091b] opacity-70 italic'}`}>
                {hasValue ? value : "Não registrado"}
             </span>
          )}
       </div>
    );
  };
  
  const renderTimelineRow = (label: string, value: string | undefined) => {
     return renderRow(label, value ? formatDate(value) : undefined);
  };

  // Helper para comparar eventos e gerar diffs
  const getEventDiff = (currentEvent: ManifestoEvent, index: number) => {
    if (index === 0) return null; // Primeiro evento não tem anterior para comparar
    
    const prevEvent = events[index - 1];
    const diffs: { field: string, old: string | number, new: string | number }[] = [];
    
    // Lista de campos que queremos monitorar mudanças
    const monitoredFields: (keyof ManifestoEvent)[] = ['CIA', 'Cargas_(IN/H)', 'Cargas_(IZ)', 'Manifesto_Puxado', 'Manifesto_Recebido'];
    
    const fieldLabels: Record<string, string> = {
        'CIA': 'CIA',
        'Cargas_(IN/H)': 'Cargas IN/H',
        'Cargas_(IZ)': 'Cargas IZ',
        'Manifesto_Puxado': 'Data Puxado',
        'Manifesto_Recebido': 'Data Recebido'
    };

    monitoredFields.forEach(key => {
        const val1 = prevEvent[key];
        const val2 = currentEvent[key];
        
        // Compara valores (convertendo para string para facilitar)
        if (String(val1) !== String(val2)) {
            // Se for data, formata
            let oldVal = val1;
            let newVal = val2;
            
            if (key.includes('Manifesto_')) {
               oldVal = formatDate(String(val1));
               newVal = formatDate(String(val2));
            }

            diffs.push({
                field: fieldLabels[key] || key,
                old: oldVal as string | number,
                new: newVal as string | number
            });
        }
    });

    return diffs.length > 0 ? diffs : null;
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/85 z-[10000] flex items-center justify-center backdrop-blur-sm animate-fadeIn p-4 overflow-y-auto">
      {/* Modal Container: 
          - Removemos min-w-[800px] fixo para usar max-w-[1000px] responsivo
          - Removemos overflow e scrollbars desnecessários
      */}
      <div className="bg-white rounded-[20px] w-full max-w-[1000px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-slideInUp border-2 border-[#007bff] flex flex-col relative my-8">
        
        {/* Header */}
        <div className="p-[20px] text-center border-b border-[#eee]">
          <div className="flex justify-center items-center gap-3">
             <span className="text-[20px]">📋</span>
             <div className="flex items-center gap-2">
                <span className={`p-[4px_10px] rounded-[6px] text-white text-[12px] font-bold shadow-sm uppercase tracking-wide ${getStatusClass(data.status || '')}`}>
                    {data.status}
                </span>
                <span className="bg-[#007bff] text-white p-[5px_12px] rounded-[8px] text-[13px] font-bold tracking-wide">{data.id}</span>
             </div>
          </div>
          <h3 className="text-[#007bff] text-[18px] font-bold mt-2">Histórico Completo</h3>
        </div>
        
        {/* Content Scrollable */}
        <div className="p-[30px] overflow-y-auto max-h-[70vh] custom-scrollbar">
           
           {/* Card Principal - Snapshot Atual */}
           <div className="bg-white border-2 border-[#007bff] rounded-[12px] p-[25px] shadow-sm mb-6">
              <h4 className="text-[#007bff] text-[15px] font-bold mb-4 flex items-center gap-2">
                 <History size={18} /> Estado Atual do Manifesto
              </h4>

              {/* Grid Layout - 2 Colunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Coluna 1: Informações + Cargas - Organizado em lista única para alinhar bordas */}
                <div className="flex flex-col gap-3">
                  <h5 className="text-[#007bff] text-[13px] font-bold uppercase tracking-wider border-b border-[#007bff]/20 pb-2 text-center">Informações</h5>
                  <div className="flex flex-col">
                     {renderRow("Usuário Sistema", data.usuario)}
                     {renderRow("Usuário Operação", data.usuarioOperacao)}
                     {renderRow("Usuário Ação", data.usuarioAcao)}
                     {renderRow("Turno", data.turno)}
                     {renderRow("CIA", data.cia)}
                     {renderRow("Cargas (IN/H)", String(data.cargasINH))}
                     {renderRow("Cargas (IZ)", String(data.cargasIZ))}
                  </div>
                </div>

                {/* Coluna 2: Timeline Operacional */}
                <div className="flex flex-col gap-3">
                   <h5 className="text-[#007bff] text-[13px] font-bold uppercase tracking-wider border-b border-[#007bff]/20 pb-2 text-center">Timeline Operacional</h5>
                   <div className="flex flex-col">
                      {renderTimelineRow("Manifesto Puxado", data.dataHoraPuxado)}
                      {renderTimelineRow("Manifesto Recebido", data.dataHoraRecebido)}
                      
                      <div className="my-1 border-t border-dashed border-gray-200 opacity-50"></div>

                      {renderTimelineRow("Manifesto Iniciado", data.dataHoraIniciado)}
                      {renderTimelineRow("Manifesto Disponível", data.dataHoraDisponivel)}
                      {renderTimelineRow("Manifesto Em Conferência", data.dataHoraConferencia)}
                      {renderTimelineRow("Manifesto Pendente", data.dataHoraPendente)}
                      {renderTimelineRow("Manifesto Completo", data.dataHoraCompleto)}
                   </div>
                </div>

              </div>
           </div>

           {/* Seção de Eventos / Log de Alterações */}
           {events.length > 0 && (
             <div className="bg-gray-50 border border-gray-200 rounded-[12px] p-[25px]">
                <h4 className="text-[#007bff] text-[15px] font-bold mb-6 flex items-center gap-2">
                   Registro de Alterações
                </h4>
                
                <div className="relative border-l-2 border-[#007bff]/30 ml-3 space-y-8">
                   {events.map((event, index) => {
                      const isEdit = event.Ação === "Edição de Dados";
                      const diffs = isEdit ? getEventDiff(event, index) : null;
                      
                      return (
                        <div key={event.id} className="relative pl-8">
                           {/* Dot */}
                           <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                              isEdit ? 'bg-orange-500' : 
                              event.Ação.includes('Cancel') || event.Ação.includes('Excluir') ? 'bg-red-500' :
                              event.Ação.includes('Registro') ? 'bg-green-500' : 'bg-[#007bff]'
                           }`}></div>

                           {/* Content Card */}
                           <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                              <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-2">
                                 <span className="font-bold text-[#333] text-sm">{event.Ação}</span>
                                 <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {formatDate(event["Carimbo_Data/HR"])}
                                 </span>
                              </div>
                              
                              <div className="text-xs text-gray-600 mb-2">
                                 <strong className="text-[#007bff]">Usuário Ação:</strong> {event["Usuario_Ação"] || event.Usuario_Action || event.Usuario_Sistema}
                              </div>
                              
                              {event.Justificativa && (
                                 <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100 mb-3">
                                    "{event.Justificativa}"
                                 </div>
                              )}

                              {/* Diff View (Se houver alterações detectadas) */}
                              {diffs && (
                                 <div className="mt-3">
                                    <h6 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Alterações Realizadas</h6>
                                    <div className="grid gap-2">
                                       {diffs.map((diff, i) => (
                                          <div key={i} className="flex items-center text-xs bg-orange-50 border border-orange-100 p-2 rounded">
                                             <span className="font-semibold text-gray-700 w-[100px] shrink-0">{diff.field}:</span>
                                             <span className="text-red-500 line-through mr-2 opacity-70 truncate max-w-[120px]" title={String(diff.old)}>
                                                {diff.old}
                                             </span>
                                             <ArrowRight size={12} className="text-gray-400 mx-1 shrink-0" />
                                             <span className="text-green-600 font-bold truncate max-w-[120px]" title={String(diff.new)}>
                                                {diff.new}
                                             </span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>
           )}

        </div>

        {/* Footer */}
        <div className="p-[15px] border-t border-[#eee] bg-[#f9f9f9] rounded-b-[20px] flex justify-center">
           {/* Botão reduzido e centralizado */}
           <button onClick={onClose} className="w-full max-w-[300px] bg-gradient-to-br from-[#007bff] to-[#0056b3] text-white border-none p-[10px] rounded-[8px] cursor-pointer font-semibold text-[14px] shadow-[0_4px_15px_rgba(0,123,255,0.3)] hover:-translate-y-[1px] transition-all uppercase tracking-wide">
             Fechar
           </button>
        </div>
      </div>
    </div>
  );
};

export const CancellationModal: React.FC<{ onConfirm: (justificativa: string) => void, onClose: () => void }> = ({ onConfirm, onClose }) => {
  const [step, setStep] = React.useState<'confirm' | 'justify'>('confirm');
  const [justificativa, setJustificativa] = React.useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleConfirmStep = () => {
    setStep('justify');
  };

  const handleFinalSubmit = () => {
    if (!justificativa.trim()) {
       alert("Por favor, informe o motivo do cancelamento.");
       return;
    }
    onConfirm(justificativa);
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/85 z-[10000] flex items-center justify-center backdrop-blur-sm animate-fadeIn">
      <div className="bg-white p-[30px] rounded-[24px] min-w-[320px] max-w-[400px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-fadeInScale flex flex-col items-center text-center border-t-[6px] border-[#dc3545]">
        
        {step === 'confirm' ? (
          <>
            <div className="w-[70px] h-[70px] bg-[#dc3545]/10 rounded-full flex items-center justify-center mb-[20px] animate-pulse-dot">
              <AlertTriangle size={36} className="text-[#dc3545]" />
            </div>

            <h3 className="text-[#333] text-[22px] font-bold mb-[12px]">Tem certeza?</h3>
            
            <p className="text-gray-500 text-[14px] mb-[30px] leading-relaxed px-[10px]">
              Você está prestes a cancelar este manifesto. Esta ação é irreversível e ficará registrada.
            </p>
            
            <div className="flex gap-[12px] w-full">
              <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 border-none p-[14px] rounded-[12px] font-semibold text-[14px] cursor-pointer hover:bg-gray-200 transition-all">
                Voltar
              </button>
              <button 
                onClick={handleConfirmStep} 
                className="flex-1 bg-gradient-to-br from-[#dc3545] to-[#b02a37] text-white border-none p-[14px] rounded-[12px] font-semibold text-[14px] cursor-pointer shadow-[0_4px_15px_rgba(220,53,69,0.3)] hover:-translate-y-[1px] transition-all"
              >
                Sim, cancelar
              </button>
            </div>
          </>
        ) : (
          <div className="w-full animate-slideIn-novo">
             <h3 className="text-[#333] text-[20px] font-bold mb-[15px]">Justificativa</h3>
             <p className="text-gray-500 text-[13px] mb-[15px] text-left">
               Informe o motivo do cancelamento para prosseguir:
             </p>
             <textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Motivo da cancelamento..."
                className="w-full h-[100px] p-[12px] border-2 border-[#e0e0e0] rounded-[12px] text-[14px] resize-none focus:outline-none focus:border-[#dc3545] focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)] transition-all mb-[20px] bg-gray-50 text-gray-900"
                autoFocus
             />
             <div className="flex gap-[12px] w-full">
              <button onClick={() => setStep('confirm')} className="flex-1 bg-gray-100 text-gray-700 border-none p-[14px] rounded-[12px] font-semibold text-[14px] cursor-pointer hover:bg-gray-200 transition-all">
                Voltar
              </button>
              <button 
                onClick={handleFinalSubmit} 
                className="flex-1 bg-gradient-to-br from-[#dc3545] to-[#b02a37] text-white border-none p-[14px] rounded-[12px] font-semibold text-[14px] cursor-pointer shadow-[0_4px_15px_rgba(220,53,69,0.3)] hover:-translate-y-[1px] transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AnularModal: React.FC<{ onConfirm: (justificativa: string) => void, onClose: () => void }> = ({ onConfirm, onClose }) => {
  const [step, setStep] = React.useState<'confirm' | 'justify'>('confirm');
  const [justificativa, setJustificativa] = React.useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleConfirmStep = () => {
    setStep('justify');
  };

  const handleFinalSubmit = () => {
    if (!justificativa.trim()) {
       alert("Por favor, informe o motivo da anulação.");
       return;
    }
    onConfirm(justificativa);
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/85 z-[10000] flex items-center justify-center backdrop-blur-sm animate-fadeIn">
      <div className="bg-white p-[30px] rounded-[24px] min-w-[320px] max-w-[400px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-fadeInScale flex flex-col items-center text-center border-t-[6px] border-[#ff6c00]">
        
        {step === 'confirm' ? (
          <>
            <div className="w-[70px] h-[70px] bg-[#ff6c00]/10 rounded-full flex items-center justify-center mb-[20px] animate-pulse-dot">
              <AlertTriangle size={36} className="text-[#ff6c00]" />
            </div>

            <h3 className="text-[#333] text-[22px] font-bold mb-[12px]">Tem certeza?</h3>
            
            <p className="text-gray-500 text-[14px] mb-[30px] leading-relaxed px-[10px]">
              Deseja realmente anular o status atual? O manifesto voltará para <strong>Manifesto Recebido</strong>.
            </p>
            
            <div className="flex gap-[12px] w-full">
              <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 border-none p-[14px] rounded-[12px] font-semibold text-[14px] cursor-pointer hover:bg-gray-200 transition-all">
                Não, voltar
              </button>
              <button 
                onClick={handleConfirmStep} 
                className="flex-1 bg-gradient-to-br from-[#ff6c00] to-[#e65c00] text-white border-none p-[14px] rounded-[12px] font-semibold text-[14px] cursor-pointer shadow-[0_4px_15px_rgba(255,108,0,0.3)] hover:-translate-y-[1px] transition-all"
              >
                Sim, anular
              </button>
            </div>
          </>
        ) : (
          <div className="w-full animate-slideIn-novo">
             <h3 className="text-[#333] text-[20px] font-bold mb-[15px]">Justificativa</h3>
             <p className="text-gray-500 text-[13px] mb-[15px] text-left">
               Informe o motivo da anulação para prosseguir:
             </p>
             <textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Motivo da anulação..."
                className="w-full h-[100px] p-[12px] border-2 border-[#e0e0e0] rounded-[12px] text-[14px] resize-none focus:outline-none focus:border-[#ff6c00] focus:shadow-[0_0_0_3px_rgba(255,108,0,0.1)] transition-all mb-[20px] bg-gray-50 text-gray-900"
                autoFocus
             />
             <div className="flex gap-[12px] w-full">
              <button onClick={() => setStep('confirm')} className="flex-1 bg-gray-100 text-gray-700 border-none p-[14px] rounded-[12px] font-semibold text-[14px] cursor-pointer hover:bg-gray-200 transition-all">
                Voltar
              </button>
              <button 
                onClick={handleFinalSubmit} 
                className="flex-1 bg-gradient-to-br from-[#ff6c00] to-[#e65c00] text-white border-none p-[14px] rounded-[12px] font-semibold text-[14px] cursor-pointer shadow-[0_4px_15px_rgba(255,108,0,0.3)] hover:-translate-y-[1px] transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DeliveryModal: React.FC<{ 
  data: Manifesto; 
  onConfirm: (type: 'Parcial' | 'Completa', quantities?: { inh: number, iz: number }, justificativa?: string) => void; 
  onClose: () => void 
}> = ({ data, onConfirm, onClose }) => {
  const [step, setStep] = useState<'select' | 'form' | 'justify'>('select');
  const [inhInput, setInhInput] = useState('');
  const [izInput, setIzInput] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePartialSubmit = () => {
    const inh = Number(inhInput);
    const iz = Number(izInput);

    if (inhInput === '' || izInput === '') {
       setErrorMsg("Preencha todos os campos.");
       return;
    }
    if (isNaN(inh) || isNaN(iz)) {
       setErrorMsg("Valores inválidos.");
       return;
    }
    if (inh < 0 || iz < 0) {
       setErrorMsg("Valores não podem ser negativos.");
       return;
    }
    if (inh === 0 && iz === 0) {
       setErrorMsg("Pelo menos uma carga deve ser entregue.");
       return;
    }
    
    // Valida se não está tentando entregar mais do que existe
    if (inh > data.cargasINH) {
       setErrorMsg(`Cargas IN/H não pode ser maior que o total (${data.cargasINH}).`);
       return;
    }
    if (iz > data.cargasIZ) {
       setErrorMsg(`Cargas IZ não pode ser maior que o total (${data.cargasIZ}).`);
       return;
    }

    onConfirm('Parcial', { inh, iz });
  };

  const handleJustifySubmit = () => {
    if (!justificativa.trim()) {
      setErrorMsg("A justificativa é obrigatória.");
      return;
    }
    if (justificativa.length < 5) {
      setErrorMsg("Justificativa muito curta.");
      return;
    }
    onConfirm('Completa', undefined, justificativa);
  };

  // Normaliza o status para comparação segura
  const isPending = data.status?.trim() === 'Manifesto Pendente';
  const isPartialDisabled = true; // Force disabled as requested

  const handleCompleteClick = () => {
    if (isPending) {
      setStep('justify');
    } else {
      onConfirm('Completa');
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/85 z-[10000] flex items-center justify-center backdrop-blur-sm animate-fadeIn">
      <div className="bg-white p-[30px] rounded-[24px] min-w-[400px] max-w-[600px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-fadeInScale flex flex-col items-center text-center border-t-[6px] border-[#28a745]">
        
        <div className="w-[70px] h-[70px] bg-[#28a745]/10 rounded-full flex items-center justify-center mb-[20px] animate-pulse-dot">
          <span className="text-[30px]">✅</span> 
        </div>

        <h3 className="text-[#333] text-[22px] font-bold mb-[12px]">Entregar Manifesto</h3>
        
        {step === 'select' && (
          <>
            <p className="text-gray-500 text-[14px] mb-[30px] leading-relaxed px-[10px]">
              Selecione o tipo de entrega para registrar no sistema.
            </p>
            
            <div className="flex gap-[12px] w-full">
              <button 
                onClick={() => !isPartialDisabled && !isPending && setStep('form')} 
                disabled={isPartialDisabled || isPending}
                className={`flex-1 p-[14px] rounded-[12px] font-bold text-[14px] transition-all uppercase tracking-wide
                  ${(isPartialDisabled || isPending) 
                    ? 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-60' 
                    : 'bg-white border-2 border-[#ffc107] text-[#ffc107] cursor-pointer hover:bg-[#ffc107] hover:text-black'}
                `}
                title={(isPartialDisabled || isPending) ? "Opção temporariamente desabilitada" : ""}
              >
                Parcial
              </button>
              <button 
                onClick={handleCompleteClick} 
                className="flex-1 bg-gradient-to-br from-[#28a745] to-[#218838] text-white border-none p-[14px] rounded-[12px] font-bold text-[14px] cursor-pointer shadow-[0_4px_15px_rgba(40,167,69,0.3)] hover:-translate-y-[1px] transition-all uppercase tracking-wide"
              >
                {isPending ? 'Parcial' : 'Completa'}
              </button>
            </div>
            
            <button 
                onClick={onClose} 
                className="mt-[20px] w-full bg-gray-100 text-gray-600 border-none p-[12px] rounded-[12px] font-bold text-[13px] cursor-pointer hover:bg-gray-200 transition-all uppercase tracking-wide"
            >
                Cancelar
            </button>
          </>
        )}

        {step === 'form' && (
          <div className="w-full animate-slideIn-novo text-left">
             <div className="bg-gray-50 border border-gray-200 rounded-[12px] p-4 mb-5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 border-b border-gray-200 pb-2">Quantidade Total (Disponível)</div>
                <div className="flex justify-between items-center mb-1">
                   <span className="text-sm text-gray-600">Cargas (IN/H):</span>
                   <span className="text-sm font-bold text-[#333]">{data.cargasINH}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm text-gray-600">Cargas (IZ):</span>
                   <span className="text-sm font-bold text-[#333]">{data.cargasIZ}</span>
                </div>
             </div>

             <div className="mb-5">
                <div className="text-xs font-bold text-[#28a745] uppercase tracking-wide mb-3">Quantidade Parcialmente Entregue</div>
                
                <div className="flex gap-3">
                   <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Entregue IN/H</label>
                      <input 
                         type="number"
                         min="0"
                         max={data.cargasINH}
                         value={inhInput}
                         onChange={(e) => { 
                            let val = e.target.value;
                            const num = Number(val);
                            if (val !== '' && num > data.cargasINH) {
                               val = String(data.cargasINH);
                            }
                            if (val !== '' && num < 0) {
                               val = '0';
                            }
                            setInhInput(val); 
                            setErrorMsg(null); 
                         }}
                         className="w-full p-[10px] border-2 border-gray-200 rounded-[8px] text-sm focus:border-[#ffc107] outline-none text-center font-bold text-gray-800 bg-white"
                         placeholder="0"
                      />
                   </div>
                   <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Entregue IZ</label>
                      <input 
                         type="number"
                         min="0"
                         max={data.cargasIZ}
                         value={izInput}
                         onChange={(e) => { 
                            let val = e.target.value;
                            const num = Number(val);
                            if (val !== '' && num > data.cargasIZ) {
                               val = String(data.cargasIZ);
                            }
                            if (val !== '' && num < 0) {
                               val = '0';
                            }
                            setIzInput(val); 
                            setErrorMsg(null); 
                         }}
                         className="w-full p-[10px] border-2 border-gray-200 rounded-[8px] text-sm focus:border-[#ffc107] outline-none text-center font-bold text-gray-800 bg-white"
                         placeholder="0"
                      />
                   </div>
                </div>
             </div>

             {errorMsg && (
                <div className="mb-4 text-xs text-red-500 font-bold bg-red-50 p-2 rounded border border-red-100 flex items-center gap-1">
                   <AlertTriangle size={12} /> {errorMsg}
                </div>
             )}

             <div className="flex gap-[12px] w-full mt-2">
                <button 
                   onClick={() => setStep('select')} 
                   className="flex items-center justify-center gap-2 flex-1 bg-gray-100 text-gray-600 border-none p-[12px] rounded-[12px] font-bold text-[13px] cursor-pointer hover:bg-gray-200 transition-all"
                >
                   <ArrowLeft size={14} /> Voltar
                </button>
                <button 
                   onClick={handlePartialSubmit} 
                   className="flex-1 bg-gradient-to-br from-[#28a745] to-[#218838] text-white border-none p-[12px] rounded-[12px] font-bold text-[13px] cursor-pointer shadow-[0_4px_15px_rgba(40,167,69,0.3)] hover:-translate-y-[1px] transition-all uppercase tracking-wide"
                >
                   Confirmar Entrega
                </button>
             </div>
          </div>
        )}

        {step === 'justify' && (
          <div className="w-full animate-slideIn-novo text-left">
            <h4 className="text-[#333] text-[16px] font-bold mb-[10px] text-center">
              Justificativa Obrigatória
            </h4>
            <p className="text-gray-500 text-[13px] mb-[15px] text-center">
              Para manifestos pendentes, é necessário justificar a entrega completa.
            </p>
            
            <textarea 
              value={justificativa}
              onChange={e => { setJustificativa(e.target.value); if(errorMsg) setErrorMsg(null); }}
              placeholder="Descreva o motivo..." 
              className={`w-full h-[100px] p-[12px] border-2 ${errorMsg ? 'border-[#dc3545]' : 'border-[#e0e0e0]'} rounded-[12px] text-[14px] resize-none focus:outline-none focus:border-[#28a745] transition-all mb-[15px] bg-gray-50 text-gray-900`}
              autoFocus
            ></textarea>

            {errorMsg && (
              <div className="mb-4 text-xs text-red-500 font-bold bg-red-50 p-2 rounded border border-red-100 flex items-center gap-1 justify-center">
                  <AlertTriangle size={12} /> {errorMsg}
              </div>
            )}

            <div className="flex gap-[12px] w-full mt-2">
                <button 
                   onClick={() => setStep('select')} 
                   className="flex items-center justify-center gap-2 flex-1 bg-gray-100 text-gray-600 border-none p-[12px] rounded-[12px] font-bold text-[13px] cursor-pointer hover:bg-gray-200 transition-all"
                >
                   <ArrowLeft size={14} /> Voltar
                </button>
                <button 
                   onClick={handleJustifySubmit} 
                   className="flex-1 bg-gradient-to-br from-[#28a745] to-[#218838] text-white border-none p-[12px] rounded-[12px] font-bold text-[13px] cursor-pointer shadow-[0_4px_15px_rgba(40,167,69,0.3)] hover:-translate-y-[1px] transition-all uppercase tracking-wide"
                >
                   Confirmar
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AlertToast: React.FC<{ type: 'success' | 'error', msg: string }> = ({ type, msg }) => {
   const colorClass = type === 'success' 
      ? 'bg-gradient-to-br from-[#28a745] to-[#20c997] border-l-[#155724] shadow-[0_8px_32px_rgba(40,167,69,0.4)]' 
      : 'bg-gradient-to-br from-[#dc3545] to-[#c82333] border-l-[#721c24] shadow-[0_8px_32px_rgba(220,53,69,0.4)]';

   return (
      <div className={`fixed top-[20px] right-[20px] text-white p-[16px_24px] rounded-[12px] font-bold text-[14px] z-[10001] flex items-center gap-[12px] min-w-[300px] border-l-[5px] animate-slideIn-novo ${colorClass}`}>
         {msg}
      </div>
   );
};