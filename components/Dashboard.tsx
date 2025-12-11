import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Manifesto, User } from '../types';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { CustomSelect } from './CustomSelect';

interface DashboardProps {
  currentUser: User;
  onLogout: () => void;
  isLoggingOut: boolean;
  manifestos: Manifesto[];
  onSave: (m: Omit<Manifesto, 'id' | 'status' | 'turno'>) => void;
  onAction: (action: string, id: string) => void;
  openHistory: (id: string) => void;
  openEdit: (id: string) => void;
  onShowAlert: (type: 'success' | 'error', msg: string) => void;
  nextId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  currentUser, onLogout, isLoggingOut, manifestos, onSave, onAction, openHistory, openEdit, onShowAlert, nextId
}) => {
  const [formData, setFormData] = useState({
    usuario: currentUser.Usuario,
    cia: '',
    dataHoraPuxado: '',
    dataHoraRecebido: '',
    cargasINH: '',
    cargasIZ: '',
  });

  const [generatedId, setGeneratedId] = useState('Automático');
  const [calculatedTurno, setCalculatedTurno] = useState('Automático');
  const [statusBtnText, setStatusBtnText] = useState('Automático');

  // Updated column widths to be proportional and fill the screen
  const colWidths = [
    "w-[9%] min-w-[100px]", // Usuário
    "w-[9%] min-w-[90px]",   // CIA
    "w-[13%] min-w-[150px]", // Data/Hora (Puxado)
    "w-[13%] min-w-[150px]", // Data/Hora (Recebido)
    "w-[9%] min-w-[80px]",   // Cargas (IN/H)
    "w-[9%] min-w-[80px]",   // Cargas (IZ)
    "w-[10%] min-w-[130px]", // Status
    "w-[10%] min-w-[130px]", // ID Manifesto
    "w-[9%] min-w-[90px]",   // Turno
    "w-[9%] min-w-[70px]"    // Ação
  ];

  // Helper to format date for Table (No comma)
  const formatDateTable = (dateStr: string) => {
    if (!dateStr) return "";
    const safeDateStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(safeDateStr);
    if (isNaN(d.getTime())) return dateStr;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  useEffect(() => {
    if (!formData.dataHoraRecebido) {
      setCalculatedTurno('Automático');
      return;
    }
    const date = new Date(formData.dataHoraRecebido);
    if (isNaN(date.getTime())) {
      setCalculatedTurno('Automático');
      return;
    }
    const mins = date.getHours() * 60 + date.getMinutes();
    if (mins >= 360 && mins <= 839) setCalculatedTurno("1 Turno");
    else if (mins >= 840 && mins <= 1319) setCalculatedTurno("2 Turno");
    else setCalculatedTurno("3 Turno");
  }, [formData.dataHoraRecebido]);

  useEffect(() => {
    if (formData.cia) {
      setGeneratedId(nextId);
      setStatusBtnText("Manifesto Recebido");
    } else {
      setGeneratedId("Automático");
      setStatusBtnText("Automático");
    }
  }, [formData.cia, nextId]);

  const handleSave = async () => {
    if (!formData.cia || !formData.dataHoraPuxado || !formData.dataHoraRecebido || !formData.cargasINH || !formData.cargasIZ) {
      onShowAlert('error', "Preencha todos os campos antes de salvar!"); 
      return;
    }
    onSave({
      usuario: currentUser.Usuario,
      cia: formData.cia,
      dataHoraPuxado: formData.dataHoraPuxado,
      dataHoraRecebido: formData.dataHoraRecebido,
      cargasINH: Number(formData.cargasINH),
      cargasIZ: Number(formData.cargasIZ),
    });
    setFormData({ ...formData, cia: '', dataHoraPuxado: '', dataHoraRecebido: '', cargasINH: '', cargasIZ: '' });
  };

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

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number, align: 'center' | 'right', verticalAlign: 'top' | 'bottom'} | null>(null);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (menuOpenId === id) {
      setMenuOpenId(null);
    } else {
      const button = e.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;

      // Compensate for body zoom
      const zoom = parseFloat((window.getComputedStyle(document.body) as any).zoom) || 1;
      
      // Use visualViewport for more accurate edge detection with zoom
      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;

      // Determine if we are near the right edge
      const distRight = viewportWidth - rect.right;
      const isRightEdge = distRight < 250;

      // Check if button is near bottom of viewport
      const spaceBelow = viewportHeight - rect.bottom;
      // Assume menu height approx 220px. If less space, open upwards.
      const showAbove = spaceBelow < 220;

      // Apply zoom correction to coordinates
      // We divide by zoom because the absolute positioned element will be scaled up by the body zoom
      setMenuPosition({
          top: showAbove ? ((rect.top + scrollY) / zoom - 5) : ((rect.bottom + scrollY) / zoom + 5),
          left: isRightEdge ? ((rect.right + scrollX) / zoom) : ((rect.left + scrollX + (rect.width / 2)) / zoom),
          align: isRightEdge ? 'right' : 'center',
          verticalAlign: showAbove ? 'bottom' : 'top'
      });
      setMenuOpenId(id);
    }
  };

  const handleMenuAction = (action: () => void) => {
    setMenuOpenId(null);
    action();
  };

  useEffect(() => {
    const closeMenu = () => setMenuOpenId(null);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('click', closeMenu);
    window.addEventListener('scroll', closeMenu, true); 
    window.addEventListener('resize', closeMenu);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div>
      <div className="sticky top-0 z-[100] flex flex-col md:flex-row items-center justify-center p-[20px] md:p-[25px_20px] bg-gradient-to-br from-black via-[#4d0770] to-[#2c0040] text-white text-[16pt] md:text-[20pt] font-bold text-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] border-b-[3px] border-white/10">
        SMO - Sistema de Manifesto Operacional
        <div className="relative md:absolute md:right-[20px] mt-[15px] md:mt-0 flex flex-col md:flex-row items-center gap-[15px]">
          <span className="bg-white/20 p-[8px_20px] rounded-[20px] text-[13px] font-semibold border-2 border-white/30">
            {currentUser.Nome_Completo}
          </span>
          <button 
            onClick={onLogout}
            disabled={isLoggingOut}
            className={`bg-gradient-to-br from-[#dc3545] to-[#c82333] border-none text-white p-[8px_16px] rounded-[8px] cursor-pointer font-semibold text-[12px] shadow-[0_2px_10px_rgba(220,53,69,0.3)] hover:-translate-y-[1px] hover:shadow-[0_4px_15px_rgba(220,53,69,0.4)] transition-all ${isLoggingOut ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {isLoggingOut ? "⚡ Saindo..." : "Sair"}
          </button>
          <button className="bg-gradient-to-br from-[#007bff] to-[#0056b3] border-none text-white p-[8px_16px] rounded-[8px] cursor-pointer font-semibold text-[12px] shadow-[0_2px_10px_rgba(0,123,255,0.3)] hover:-translate-y-[1px] hover:shadow-[0_4px_15px_rgba(0,123,255,0.4)] transition-all">
            📊 Relatórios
          </button>
        </div>
      </div>

      <div className="w-[98%] mx-auto my-[30px] flex flex-col gap-[30px]">
        
        <div className="bg-white p-[30px_12px] md:p-[30px] shadow-sm rounded-none md:rounded-lg animate-fadeInUp">
          <div className="text-[18pt] text-[#590b64] font-bold border-b-[3px] border-[#590b64] pb-[12px] mb-[25px]">
            Cadastro de Manifestos
          </div>
          
          <div className="overflow-x-auto rounded-[10px] shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
            <table className="w-full border-collapse text-[12px] table-fixed">
              <thead>
                <tr>
                  {['Usuário', 'CIA', 'Data/Hora (Manifesto Puxado)', 'Data/Hora (Manifesto Recebido)', 'Cargas (IN/H)', 'Cargas (IZ)', 'Status', 'ID Manifesto', 'Turno', 'Ação'].map((h, i) => (
                    <th key={i} className={`bg-[#50284f] text-white p-[12px_2px] text-center font-semibold border-r border-white/20 whitespace-normal ${i === 9 ? 'border-r-0' : ''} ${colWidths[i]}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white/80 hover:bg-[#ee2536]/5">
                  <td className={`p-[10px] border border-[#e8e8e8] text-center ${colWidths[0]}`}>
                    <input type="text" value={formData.usuario} disabled className="bg-[#f8f9fa] text-gray-900 cursor-not-allowed w-full p-[10px_12px] border-2 border-[#dee2e6] rounded-[8px] text-[12px]" />
                  </td>
                  <td className={`p-[10px] border border-[#e8e8e8] text-center ${colWidths[1]}`}>
                    <div className="w-full mx-auto">
                      <CustomSelect 
                        value={formData.cia} 
                        onChange={(val) => setFormData({...formData, cia: val})}
                        placeholder="Selecione"
                      />
                    </div>
                  </td>
                  <td className={`p-[10px] border border-[#e8e8e8] text-center ${colWidths[2]}`}>
                    <div className="w-full mx-auto">
                      <CustomDateTimePicker 
                        value={formData.dataHoraPuxado} 
                        onChange={(val) => setFormData({...formData, dataHoraPuxado: val})}
                        placeholder="dd/mm/aaaa --:--" 
                      />
                    </div>
                  </td>
                  <td className={`p-[10px] border border-[#e8e8e8] text-center ${colWidths[3]}`}>
                    <div className="w-full mx-auto">
                      <CustomDateTimePicker 
                        value={formData.dataHoraRecebido} 
                        onChange={(val) => setFormData({...formData, dataHoraRecebido: val})}
                        placeholder="dd/mm/aaaa --:--"
                      />
                    </div>
                  </td>
                  <td className={`p-[10px] border border-[#e8e8e8] text-center ${colWidths[4]}`}>
                    <input type="number" min="0" value={formData.cargasINH} onChange={(e) => setFormData({...formData, cargasINH: e.target.value})} className="w-full p-[10px_12px] border-2 border-[#dee2e6] rounded-[8px] text-[12px] bg-white text-gray-900 focus:outline-none focus:border-[#690c76] focus:shadow-[0_0_0_3px_rgba(105,12,118,0.1)] transition-all" />
                  </td>
                  <td className={`p-[10px] border border-[#e8e8e8] text-center ${colWidths[5]}`}>
                    <input type="number" min="0" value={formData.cargasIZ} onChange={(e) => setFormData({...formData, cargasIZ: e.target.value})} className="w-full p-[10px_12px] border-2 border-[#dee2e6] rounded-[8px] text-[12px] bg-white text-gray-900 focus:outline-none focus:border-[#690c76] focus:shadow-[0_0_0_3px_rgba(105,12,118,0.1)] transition-all" />
                  </td>
                  <td className={`p-[10px] border border-[#e8e8e8] text-center ${colWidths[6]}`}>
                    <button disabled className="bg-gradient-to-br from-[#6c757d] to-[#495057] text-white border-none rounded-[8px] cursor-default w-full text-[12px] font-semibold p-[7px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] truncate">{statusBtnText}</button>
                  </td>
                  <td className={`p-[10px] border border-[#e8e8e8] text-center ${colWidths[7]}`}>
                    <button disabled className="bg-gradient-to-br from-[#6c757d] to-[#495057] text-white border-none rounded-[8px] cursor-default w-full text-[12px] font-semibold p-[7px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] truncate">{generatedId}</button>
                  </td>
                  <td className={`p-[10px] border border-[#e8e8e8] text-center ${colWidths[8]}`}>
                    <button disabled className="bg-gradient-to-br from-[#6c757d] to-[#495057] text-white border-none rounded-[8px] cursor-default w-full text-[12px] font-semibold p-[7px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] truncate">{calculatedTurno}</button>
                  </td>
                  <td className={`p-[10px] border border-[#e8e8e8] text-center ${colWidths[9]}`}>
                    <button onClick={handleSave} className="bg-gradient-to-br from-[#690c76] to-[#4d0557] text-white border-none p-[8px_7px] rounded-[8px] cursor-pointer w-full font-semibold text-[12px] shadow-[0_2px_10px_rgba(105,12,118,0.3)] hover:-translate-y-[1px] hover:shadow-[0_4px_15px_rgba(105,12,118,0.4)] transition-all">Salvar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-[30px_12px] md:p-[30px] shadow-sm rounded-none md:rounded-lg animate-fadeInUp">
          <div className="text-[18pt] text-[#590b64] font-bold border-b-[3px] border-[#590b64] pb-[12px] mb-[25px]">
            Histórico de Manifestos
          </div>

          <div className="overflow-x-auto rounded-[10px] shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
            <table className="w-full border-collapse text-[12px] table-fixed">
              <thead>
                <tr>
                  {['Usuário', 'CIA', 'Data/Hora (Puxado)', 'Data/Hora (Recebido)', 'Cargas (IN/H)', 'Cargas (IZ)', 'Status', 'ID Manifesto', 'Turno', 'Ação'].map((h, i) => (
                    <th key={i} className={`bg-[#50284f] text-white p-[12px_2px] text-center font-semibold border-r border-white/20 whitespace-normal ${i === 9 ? 'border-r-0' : ''} ${colWidths[i]}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {manifestos.map((m) => (
                  <tr key={m.id} className={`hover:bg-[#ee2536]/5 transition-colors ${m.isDuplicata ? 'bg-[#db091b]/5 border-l-[4px] border-[#db091b]' : 'bg-white/80'}`}>
                    <td className={`p-[10px] border border-[#e8e8e8] text-center text-gray-900 font-semibold truncate ${colWidths[0]}`}>{m.usuario}</td>
                    <td className={`p-[10px] border border-[#e8e8e8] text-center text-gray-900 font-semibold truncate ${colWidths[1]}`}>{m.cia}</td>
                    <td className={`p-[10px] border border-[#e8e8e8] text-center whitespace-nowrap text-gray-900 font-semibold truncate ${colWidths[2]}`}>{formatDateTable(m.dataHoraPuxado)}</td>
                    <td className={`p-[10px] border border-[#e8e8e8] text-center whitespace-nowrap text-gray-900 font-semibold truncate ${colWidths[3]}`}>{formatDateTable(m.dataHoraRecebido)}</td>
                    <td className={`p-[10px] border border-[#e8e8e8] text-center text-gray-900 font-semibold truncate ${colWidths[4]}`}>{m.cargasINH}</td>
                    <td className={`p-[10px] border border-[#e8e8e8] text-center text-gray-900 font-semibold truncate ${colWidths[5]}`}>{m.cargasIZ}</td>
                    <td className={`p-[10px] border border-[#e8e8e8] text-center ${colWidths[6]}`}>
                      <span className={`inline-block w-full p-[5px_2px] rounded-[6px] text-white text-[11px] font-bold shadow-sm uppercase tracking-wide truncate ${getStatusClass(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className={`p-[10px] border border-[#e8e8e8] text-center font-semibold text-gray-900 truncate ${colWidths[7]}`}>
                      {m.isDuplicata ? `🔄 ${m.id}` : m.id}
                    </td>
                    <td className={`p-[10px] border border-[#e8e8e8] text-center font-semibold text-gray-900 truncate ${colWidths[8]}`}>{m.turno}</td>
                    <td className={`p-[10px] border border-[#e8e8e8] text-center relative ${colWidths[9]}`}>
                      <button 
                        onClick={(e) => toggleMenu(e, m.id)}
                        className="bg-gradient-to-br from-[#690c76] to-[#4d0557] text-white border-none p-[6px_12px] rounded-[6px] cursor-pointer text-[12px] font-semibold transition-all shadow-[0_2px_8px_rgba(105,12,118,0.3)] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(105,12,118,0.4)] w-full"
                      >
                        Opções
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Options Menu (Portal) - Z-Index changed to 9999 to be below modals (10000) */}
      {menuOpenId && menuPosition && createPortal(
         <div 
            className={`absolute bg-white border-2 border-[#690c76] rounded-[8px] shadow-[0_8px_25px_rgba(0,0,0,0.15)] z-[9999] min-w-[200px] py-[8px] font-sans animate-fadeIn 
            ${menuPosition.align === 'right' ? '-translate-x-full' : '-translate-x-1/2'} 
            ${menuPosition.verticalAlign === 'bottom' ? '-translate-y-full' : ''}`}
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onClick={(e) => e.stopPropagation()}
         >
            <button onClick={() => handleMenuAction(() => openHistory(menuOpenId))} className="block w-full px-[16px] py-[10px] text-left text-[13px] text-[#007bff] font-medium hover:bg-[#690c76]/10 hover:text-[#690c76] border-b border-[#f0f0f0] transition-colors">📋 Histórico do Manifesto</button>
            
            {(() => {
              const currentM = manifestos.find(m => m.id === menuOpenId);
              // Updated to include 'Manifesto Pendente'
              const canEntregar = currentM && (currentM.status === 'Manifesto Completo' || currentM.status === 'Manifesto Pendente');
              
              return (
                <button 
                  disabled={!canEntregar} 
                  onClick={() => canEntregar && handleMenuAction(() => onAction('entregar', menuOpenId))} 
                  className={`block w-full px-[16px] py-[10px] text-left text-[13px] font-medium border-b border-[#f0f0f0] transition-colors ${
                     canEntregar 
                       ? 'text-[#137333] hover:bg-[#137333]/10 hover:text-[#0f5b28] cursor-pointer' 
                       : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ✅ Entregar Manifesto
                </button>
              );
            })()}
            
            {(() => {
              const currentM = manifestos.find(m => m.id === menuOpenId);
              // Enable for any status EXCEPT 'Manifesto Recebido'
              // Explicitly ensuring 'Manifesto Iniciado' and 'Manifesto Pendente' are allowed per user request
              const canAnular = currentM && (
                  currentM.status?.trim() !== 'Manifesto Recebido' || 
                  currentM.status === 'Manifesto Iniciado' ||
                  currentM.status === 'Manifesto Pendente'
              );
              
              return (
                <button 
                  disabled={!canAnular} 
                  onClick={() => canAnular && handleMenuAction(() => onAction('anular', menuOpenId))} 
                  className={`block w-full px-[16px] py-[10px] text-left text-[13px] font-medium border-b border-[#f0f0f0] transition-colors ${
                    canAnular 
                      ? 'text-[#ff6c00] hover:bg-[#ff6c00]/10 hover:text-[#e65c00] cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ↩️ Anular Status
                </button>
              );
            })()}
            
            {(() => {
              const currentM = manifestos.find(m => m.id === menuOpenId);
              // Somente permite editar se o status for 'Manifesto Recebido', 'Manifesto Iniciado', 'Manifesto Disponível' ou 'Manifesto Em Conferência'
              // Normaliza para lowercase para evitar problemas de case sensitivity
              const status = currentM?.status?.toLowerCase().trim() || '';
              const allowedStatuses = [
                'manifesto recebido', 
                'manifesto iniciado', 
                'manifesto disponível', 
                'manifesto em conferência'
              ];
              const canEdit = allowedStatuses.includes(status);
              
              return (
                <button 
                  disabled={!canEdit}
                  onClick={() => canEdit && handleMenuAction(() => openEdit(menuOpenId))} 
                  className={`block w-full px-[16px] py-[10px] text-left text-[13px] font-medium border-b border-[#f0f0f0] transition-colors ${
                    canEdit 
                      ? 'text-[#db091b] hover:bg-[#db091b]/10 hover:text-[#b30715] cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ✏️ Editar Manifesto
                </button>
              );
            })()}

            <button onClick={() => handleMenuAction(() => onAction('cancelar', menuOpenId))} className="block w-full px-[16px] py-[10px] text-left text-[13px] text-[#dc3545] font-medium hover:bg-[#dc3545]/10 hover:text-[#a02834] transition-colors">❌ Cancelar Manifesto</button>
         </div>,
         document.body
      )}
    </div>
  );
};