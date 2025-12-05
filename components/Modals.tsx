
import React from 'react';
import { Manifesto } from '../types';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { CustomSelect } from './CustomSelect';
import { AlertTriangle } from 'lucide-react';

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

  const handleSave = () => {
    // Validações de campos vazios
    if (!formData.cia) {
      alert("O campo CIA é obrigatório!");
      return;
    }
    if (!formData.dataHoraPuxado) {
      alert("O campo Data/Hora (Manifesto Puxado) é obrigatório!");
      return;
    }
    if (!formData.dataHoraRecebido) {
      alert("O campo Data/Hora (Manifesto Recebido) é obrigatório!");
      return;
    }
    if (formData.cargasINH === '') {
      alert("O campo Cargas IN/H é obrigatório!");
      return;
    }
    if (formData.cargasIZ === '') {
      alert("O campo Cargas IZ é obrigatório!");
      return;
    }
    if (justificativa.length < 10) {
      alert("A justificativa é obrigatória e deve ter no mínimo 10 caracteres.");
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
               onChange={(val) => setFormData({...formData, cia: val})}
               placeholder="Selecione a CIA"
            />
          </div>
          <div>
             <label className="block mb-[6px] font-semibold text-[13px] text-[#333]">Data/Hora (Manifesto Puxado):</label>
             <CustomDateTimePicker 
               value={formData.dataHoraPuxado} 
               onChange={(val) => setFormData({...formData, dataHoraPuxado: val})}
               placeholder="dd/mm/aaaa --:--"
             />
          </div>
          <div>
             <label className="block mb-[6px] font-semibold text-[13px] text-[#333]">Data/Hora (Manifesto Recebido):</label>
             <CustomDateTimePicker 
               value={formData.dataHoraRecebido} 
               onChange={(val) => setFormData({...formData, dataHoraRecebido: val})}
               placeholder="dd/mm/aaaa --:--"
             />
          </div>
          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block mb-[6px] font-semibold text-[13px] text-[#333]">Cargas IN/H:</label>
                <input 
                  type="number" 
                  value={formData.cargasINH} 
                  onChange={e => setFormData({...formData, cargasINH: e.target.value})} 
                  className="w-full p-[10px_12px] border-2 border-[#e0e0e0] rounded-[8px] text-[13px] text-gray-900 bg-white" 
                />
             </div>
             <div className="flex-1">
                <label className="block mb-[6px] font-semibold text-[13px] text-[#333]">Cargas IZ:</label>
                <input 
                  type="number" 
                  value={formData.cargasIZ} 
                  onChange={e => setFormData({...formData, cargasIZ: e.target.value})} 
                  className="w-full p-[10px_12px] border-2 border-[#e0e0e0] rounded-[8px] text-[13px] text-gray-900 bg-white" 
                />
             </div>
          </div>
          <div>
            <label className="block mb-[6px] font-semibold text-[13px] text-[#333]">Justificativa (obrigatória - mín. 10 caracteres):</label>
            <textarea 
              value={justificativa}
              onChange={e => setJustificativa(e.target.value)}
              placeholder="Digite o motivo da edição..." 
              className="w-full h-[90px] p-[10px_12px] border-2 border-[#e0e0e0] rounded-[8px] text-[13px] resize-y focus:outline-none focus:border-[#690c76] focus:shadow-[0_0_0_3px_rgba(105,12,118,0.1)] transition-all text-gray-900 bg-white"
            ></textarea>
          </div>
        </div>

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
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ data, onClose }) => {
  
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

  const renderSimpleRow = (label: string, value: string | undefined) => {
    const hasValue = !!value;
    return (
       <div className="flex justify-between py-[8px] border-b border-[#f0f0f0]">
          <span className="text-[#555] text-[13px] font-medium">{label}:</span>
          {hasValue ? (
             <span className="text-[#333] text-[13px] font-bold">{formatDate(value)}</span>
          ) : (
             <span className="text-[#db091b] text-[13px] font-medium italic opacity-70">Não registrado</span>
          )}
       </div>
    );
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/85 z-[10000] flex items-center justify-center backdrop-blur-sm animate-fadeIn">
      <div className="bg-white p-[0] rounded-[20px] min-w-[500px] max-w-[600px] max-h-[90vh] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-slideInUp border-2 border-[#690c76] flex flex-col">
        
        {/* Header */}
        <div className="p-[25px] text-center border-b border-[#eee]">
          <h3 className="text-[#690c76] text-[22px] font-bold m-0">Histórico Completo do Manifesto</h3>
        </div>
        
        {/* Content Scrollable */}
        <div className="p-[25px] overflow-y-auto custom-scrollbar">
           
           {/* Card Principal */}
           <div className="bg-white border-2 border-[#690c76] rounded-[12px] p-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-[20px] pb-[10px] border-b-2 border-[#690c76]">
                 <div className="flex items-center gap-2">
                    <span className="text-[18px]">📋</span>
                    <h4 className="text-[#690c76] text-[15px] font-bold m-0">Manifesto Original</h4>
                 </div>
                 <span className="bg-[#690c76] text-white p-[4px_10px] rounded-[6px] text-[12px] font-bold tracking-wide">{data.id}</span>
              </div>

              {/* Informações Básicas */}
              <div className="mb-[25px]">
                 <h5 className="text-[#690c76] text-[13px] mb-[12px] font-bold uppercase tracking-wider">Informações Básicas</h5>
                 <div className="flex justify-between py-[8px] border-b border-[#f0f0f0]">
                    <span className="text-[#666] text-[13px]">Usuário Sistema:</span>
                    <span className="text-[#333] text-[13px] font-bold">{data.usuario}</span>
                 </div>
                 <div className="flex justify-between py-[8px] border-b border-[#f0f0f0]">
                    <span className="text-[#666] text-[13px]">Usuário Operação:</span>
                    <span className="text-[#333] text-[13px] font-bold">{data.usuarioOperacao || "Não informado"}</span>
                 </div>
                 <div className="flex justify-between py-[8px] border-b border-[#f0f0f0]">
                    <span className="text-[#666] text-[13px]">CIA:</span>
                    <span className="text-[#333] text-[13px] font-bold">{data.cia}</span>
                 </div>
                 <div className="flex justify-between py-[8px] border-b border-[#f0f0f0]">
                    <span className="text-[#666] text-[13px]">Turno:</span>
                    <span className="text-[#333] text-[13px] font-bold">{data.turno}</span>
                 </div>
                 <div className="flex justify-between py-[8px] border-b border-[#f0f0f0]">
                    <span className="text-[#666] text-[13px]">Status Atual:</span>
                    <span className={`p-[2px_8px] rounded-[6px] text-white text-[12px] font-bold shadow-sm uppercase tracking-wide ${getStatusClass(data.status)}`}>
                        {data.status}
                    </span>
                 </div>
              </div>

              {/* Cargas */}
              <div className="mb-[25px]">
                 <h5 className="text-[#690c76] text-[13px] mb-[12px] font-bold uppercase tracking-wider">Cargas</h5>
                 <div className="flex justify-between py-[8px] border-b border-[#f0f0f0]">
                    <span className="text-[#666] text-[13px]">Cargas (IN/H):</span>
                    <span className="text-[#333] text-[13px] font-bold">{data.cargasINH}</span>
                 </div>
                 <div className="flex justify-between py-[8px] border-b border-[#f0f0f0]">
                    <span className="text-[#666] text-[13px]">Cargas (IZ):</span>
                    <span className="text-[#333] text-[13px] font-bold">{data.cargasIZ}</span>
                 </div>
              </div>

              {/* Timeline */}
              <div>
                 <h5 className="text-[#690c76] text-[13px] mb-[12px] font-bold uppercase tracking-wider">Timeline</h5>
                 
                 <div className="flex justify-between py-[8px] border-b border-[#f0f0f0]">
                    <span className="text-[#555] text-[13px] font-medium">Manifesto Puxado:</span>
                    <span className="text-[#333] text-[13px] font-bold">{formatDate(data.dataHoraPuxado)}</span>
                 </div>
                 <div className="flex justify-between py-[8px] border-b border-[#f0f0f0]">
                    <span className="text-[#555] text-[13px] font-medium">Manifesto Recebido:</span>
                    <span className="text-[#333] text-[13px] font-bold">{formatDate(data.dataHoraRecebido)}</span>
                 </div>
                 
                 {/* Exibição direta das colunas do banco, independente do status atual */}
                 {renderSimpleRow("Manifesto Iniciado", data.dataHoraIniciado)}
                 {renderSimpleRow("Manifesto Disponível", data.dataHoraDisponivel)}
                 {renderSimpleRow("Manifesto em Conferência", data.dataHoraConferencia)}
                 {renderSimpleRow("Manifesto Pendente", data.dataHoraPendente)}
                 {renderSimpleRow("Manifesto Completo", data.dataHoraCompleto)}
              </div>
           </div>

        </div>

        {/* Footer */}
        <div className="p-[20px] border-t border-[#eee] bg-[#f9f9f9]">
           <button onClick={onClose} className="w-full bg-gradient-to-br from-[#690c76] to-[#4d0557] text-white border-none p-[12px] rounded-[8px] cursor-pointer font-semibold text-[14px] shadow-[0_4px_15px_rgba(105,12,118,0.3)] hover:-translate-y-[1px] transition-all uppercase tracking-wide">
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
                placeholder="Motivo do cancelamento..."
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
