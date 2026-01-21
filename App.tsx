
import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { OperationalDashboard } from './components/OperationalDashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { EfficiencyDashboard } from './components/EfficiencyDashboard';
import { EditModal, LoadingOverlay, HistoryModal, AlertToast, CancellationModal, AssignResponsibilityModal, ReprFillModal } from './components/Modals';
import { Manifesto, User, SMO_Sistema_DB } from './types';
import { supabase } from './supabaseClient';
import { LayoutGrid, Plane, LogOut, Terminal, Activity, ShieldCheck, Columns, BarChart3 } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'sistema' | 'operacional' | 'fluxo' | 'eficiencia'>('sistema');
  const [manifestos, setManifestos] = useState<Manifesto[]>([]);
  const [nextId, setNextId] = useState<string>('Automático');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fillingReprId, setFillingReprId] = useState<string | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [cancellationId, setCancellationId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [alert, setAlert] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  
  const [activeOperatorName, setActiveOperatorName] = useState<string | null>(null);

  const getCurrentTimestampBR = () => new Date().toLocaleString('pt-BR');

  const getTurnoAtual = () => {
    const hora = new Date().getHours();
    if (hora >= 6 && hora < 14) return '1º TURNO';
    if (hora >= 14 && hora < 22) return '2º TURNO';
    return '3º TURNO';
  };

  const fetchNextId = useCallback(async () => {
      const year = new Date().getFullYear().toString().slice(-2); 
      const prefix = `MAO-${year}`;
      try {
        const { data } = await supabase
          .from('SMO_Sistema')
          .select('ID_Manifesto')
          .ilike('ID_Manifesto', `${prefix}%`)
          .order('ID_Manifesto', { ascending: false })
          .limit(1);
        let nextSeq = 1;
        if (data && data.length > 0) {
            const lastId = data[0].ID_Manifesto;
            const lastSeq = parseInt(lastId.substring(prefix.length), 10);
            if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
        }
        const newId = `${prefix}${nextSeq.toString().padStart(7, '0')}`;
        setNextId(newId);
        return newId;
      } catch (err) { return 'Erro ID'; }
  }, []);

  const showAlert = (type: 'success' | 'error', msg: string) => {
     setAlert({ type, msg });
     setTimeout(() => setAlert(null), 4000);
  };

  const fetchManifestos = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('SMO_Sistema').select('*').order('id', { ascending: false }).limit(200);
      if (error) throw error;
      if (data) {
        setManifestos(data.map((item: SMO_Sistema_DB) => ({
          id: item.ID_Manifesto,
          usuario: item.Usuario_Sistema,
          cia: item.CIA,
          dataHoraPuxado: item.Manifesto_Puxado,
          dataHoraRecebido: item.Manifesto_Recebido,
          dataHoraRepresentanteCIA: item.Representante_CIA,
          dataHoraEntregue: item.Manifesto_Entregue,
          status: item.Status,
          turno: item.Turno,
          carimboDataHR: item["Carimbo_Data/HR"],
          usuarioAcao: item["Usuario_Ação"],
          usuarioResponsavel: item["Usuario_Operação"], 
          dataHoraIniciado: item.Manifesto_Iniciado,
          dataHoraDisponivel: item.Manifesto_Disponivel,
          dataHoraConferencia: item["Manifesto_em_Conferência"],
          dataHoraPendente: item.Manifesto_Pendente,
          dataHoraCompleto: item.Manifesto_Completo
        })));
      }
    } catch (error) { console.error(error); }
  }, []);

  useEffect(() => {
    fetchManifestos();
    fetchNextId();
    const interval = setInterval(fetchManifestos, 5000);
    return () => clearInterval(interval);
  }, [fetchManifestos, fetchNextId]);

  const updateStatus = async (id: string, status: string, fields: any = {}, operatorName?: string) => {
    if (status === 'Manifesto Entregue') {
      const target = manifestos.find(m => m.id === id);
      const signature = target?.dataHoraRepresentanteCIA || fields?.Representante_CIA;
      if (!signature || signature === '---' || signature === '') {
        showAlert('error', 'BLOQUEIO: Assinatura Repr. CIA é obrigatória para entrega.');
        return;
      }
    }

    setLoadingMsg("Processando...");
    try {
      const user = operatorName || activeOperatorName || "Sistema";
      const now = getCurrentTimestampBR();
      
      const updateData = { 
        Status: status, 
        "Carimbo_Data/HR": now, 
        "Usuario_Ação": user, 
        ...fields 
      };
      
      if (status === 'Manifesto Entregue') {
        updateData.Manifesto_Entregue = now;
      }

      const { error } = await supabase.from('SMO_Sistema').update(updateData).eq('ID_Manifesto', id);
      if (error) throw error;
      
      await supabase.from('SMO_Operacional').insert({ 
        ID_Manifesto: id, 
        "Ação": status, 
        Usuario: user, 
        "Created_At_BR": now 
      });
      
      showAlert('success', `Status: ${status}`);
      fetchManifestos();
    } catch (err: any) { 
      showAlert('error', err.message); 
    } finally { 
      setLoadingMsg(null); 
    }
  };

  const handleSaveEdit = async (data: any) => {
    setLoadingMsg("Salvando Alterações...");
    try {
      const user = activeOperatorName || "Sistema";
      const { error } = await supabase.from('SMO_Sistema').update({
        CIA: data.cia,
        Manifesto_Puxado: data.dataHoraPuxado,
        Manifesto_Recebido: data.dataHoraRecebido,
        Representante_CIA: data.dataHoraRepresentanteCIA,
        Manifesto_Entregue: data.dataHoraEntregue,
        "Carimbo_Data/HR": getCurrentTimestampBR(),
        "Usuario_Ação": user
      }).eq('ID_Manifesto', data.id);

      if (error) throw error;

      await supabase.from('SMO_Operacional').insert({ 
        ID_Manifesto: data.id, 
        "Ação": "Edição de Monitoramento", 
        Usuario: user, 
        Justificativa: data.justificativa,
        "Created_At_BR": getCurrentTimestampBR() 
      });

      showAlert('success', 'Monitoramento Atualizado');
      setEditingId(null);
      fetchManifestos();
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setLoadingMsg(null);
    }
  };

  const handleSaveReprDate = async (id: string, date: string) => {
    setLoadingMsg("Atualizando Representante...");
    try {
      const user = activeOperatorName || "Sistema";
      const { error } = await supabase.from('SMO_Sistema').update({
        Representante_CIA: date,
        "Carimbo_Data/HR": getCurrentTimestampBR(),
        "Usuario_Ação": user
      }).eq('ID_Manifesto', id);

      if (error) throw error;

      await supabase.from('SMO_Operacional').insert({ 
        ID_Manifesto: id, 
        "Ação": "Registro Representante CIA", 
        Usuario: user, 
        "Created_At_BR": getCurrentTimestampBR() 
      });

      showAlert('success', 'Data do Representante Salva');
      setFillingReprId(null);
      fetchManifestos();
    } catch (err: any) {
      showAlert('error', err.message);
    } finally {
      setLoadingMsg(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] custom-scrollbar">
      <header className="bg-[#0f172a] text-white border-b-2 border-slate-800 shadow-2xl shrink-0">
        <div className="flex items-center justify-between h-16 px-8">
          <div className="flex items-center gap-4 h-full">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600">
                <Terminal size={18} className="text-white" />
              </div>
              <h1 className="text-sm font-black tracking-[0.15em] uppercase">SMO <span className="text-indigo-400 font-normal">v2.5</span></h1>
            </div>
            
            <div className="h-8 w-[1px] bg-slate-700 mx-2" />
            
            <nav className="flex h-full">
              <button 
                onClick={() => setActiveTab('sistema')} 
                className={`group flex items-center gap-2 px-5 h-16 text-[9px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'sistema' ? 'border-indigo-500 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
              >
                <LayoutGrid size={13} className={activeTab === 'sistema' ? 'text-indigo-400' : 'text-slate-500'} />
                CADASTRO
              </button>
              <button 
                onClick={() => setActiveTab('operacional')} 
                className={`group flex items-center gap-2 px-5 h-16 text-[9px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'operacional' ? 'border-red-500 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
              >
                <Plane size={13} className={activeTab === 'operacional' ? 'text-red-400' : 'text-slate-500'} />
                PUXE
              </button>
              <button 
                onClick={() => setActiveTab('fluxo')} 
                className={`group flex items-center gap-2 px-5 h-16 text-[9px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'fluxo' ? 'border-emerald-500 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
              >
                <Columns size={13} className={activeTab === 'fluxo' ? 'text-emerald-400' : 'text-slate-500'} />
                FLUXO
              </button>
              <button 
                onClick={() => setActiveTab('eficiencia')} 
                className={`group flex items-center gap-2 px-5 h-16 text-[9px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'eficiencia' ? 'border-indigo-400 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
              >
                <BarChart3 size={13} className={activeTab === 'eficiencia' ? 'text-indigo-300' : 'text-slate-500'} />
                EFICIÊNCIA
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-slate-800 border border-slate-700">
              <Activity size={14} className="text-emerald-400" />
              <div className="text-left leading-none">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Sistema Operacional</p>
                <p className="text-[10px] font-bold text-slate-200">Online</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Terminal Livre</p>
              <p className="text-[11px] font-bold text-slate-100 uppercase">Acesso Direto</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-[1700px] mx-auto space-y-6">
          {activeTab === 'sistema' ? (
            <Dashboard 
              manifestos={manifestos}
              onSave={async (d, operatorName) => {
                setLoadingMsg("Registrando...");
                const id = await fetchNextId();
                const turno = getTurnoAtual();
                const { error } = await supabase.from('SMO_Sistema').insert({
                  ID_Manifesto: id, 
                  Usuario_Sistema: operatorName, 
                  CIA: d.cia, 
                  Manifesto_Puxado: d.dataHoraPuxado, 
                  Manifesto_Recebido: d.dataHoraRecebido,
                  Status: "Manifesto Recebido", 
                  Turno: turno, 
                  "Carimbo_Data/HR": getCurrentTimestampBR(), 
                  "Usuario_Ação": operatorName
                });
                if (error) showAlert('error', error.message);
                else { 
                  showAlert('success', `Registro Concluído (${turno})`); 
                  fetchManifestos(); 
                }
                setLoadingMsg(null);
              }}
              onAction={(act, id) => {
                if (act === 'entregar') updateStatus(id, 'Manifesto Entregue');
                else if (act === 'cancelar') setCancellationId(id);
              }}
              openHistory={setViewingHistoryId}
              openEdit={setEditingId}
              onOpenReprFill={setFillingReprId}
              onShowAlert={showAlert}
              nextId={nextId}
              onOperatorChange={setActiveOperatorName}
            />
          ) : activeTab === 'operacional' ? (
            <OperationalDashboard 
              manifestos={manifestos} 
              onAction={(id, status, fields, operatorName) => {
                updateStatus(id, status, fields, operatorName);
              }} 
              onOpenAssign={setAssignId => setAssigningId(setAssignId)}
            />
          ) : activeTab === 'fluxo' ? (
            <KanbanBoard manifestos={manifestos} />
          ) : (
            <EfficiencyDashboard manifestos={manifestos} />
          )}
        </div>
      </main>

      {editingId && (
        <EditModal 
          data={manifestos.find(m => m.id === editingId)!} 
          onClose={() => setEditingId(null)} 
          onSave={(data) => {
            handleSaveEdit(data);
          }} 
        />
      )}
      {fillingReprId && (
        <ReprFillModal
          manifesto={manifestos.find(m => m.id === fillingReprId)!}
          onClose={() => setFillingReprId(null)}
          onConfirm={(date) => handleSaveReprDate(fillingReprId, date)}
        />
      )}
      {viewingHistoryId && <HistoryModal data={manifestos.find(m => m.id === viewingHistoryId)!} onClose={() => setViewingHistoryId(null)} />}
      {cancellationId && <CancellationModal onConfirm={() => {
        updateStatus(cancellationId, 'Manifesto Cancelado');
        setCancellationId(null);
      }} onClose={() => setCancellationId(null)} />}
      {assigningId && (
        <AssignResponsibilityModal 
          manifestoId={assigningId} 
          onConfirm={(name) => {
            updateStatus(assigningId, 'Manifesto Recebido', { "Usuario_Operação": name });
            setAssigningId(null);
          }} 
          onClose={() => setAssigningId(null)} 
        />
      )}
      {loadingMsg && <LoadingOverlay msg={loadingMsg} />}
      {alert && <AlertToast type={alert.type} msg={alert.msg} />}
    </div>
  );
}

export default App;
