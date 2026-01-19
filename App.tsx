
import React, { useState, useEffect, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { OperationalDashboard } from './components/OperationalDashboard';
import { EditModal, LoadingOverlay, HistoryModal, AlertToast, CancellationModal, AnularModal, AssignResponsibilityModal } from './components/Modals';
import { Manifesto, User, SMO_Sistema_DB } from './types';
import { supabase } from './supabaseClient';
import { LayoutGrid, Plane, LogOut, Terminal, Activity } from 'lucide-react';
import { PerformanceMonitor } from './components/PerformanceMonitor';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'sistema' | 'operacional'>('sistema');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [manifestos, setManifestos] = useState<Manifesto[]>([]);
  const [nextId, setNextId] = useState<string>('Automático');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [cancellationId, setCancellationId] = useState<string | null>(null);
  const [anularId, setAnularId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [alert, setAlert] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  
  const getCurrentTimestampBR = () => new Date().toLocaleString('pt-BR');

  // Função para calcular o Turno dinamicamente
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
      const { data, error } = await supabase.from('SMO_Sistema').select('*').order('id', { ascending: false }).limit(100);
      if (error) throw error;
      if (data) {
        setManifestos(data.map((item: SMO_Sistema_DB) => ({
          id: item.ID_Manifesto,
          usuario: item.Usuario_Sistema,
          cia: item.CIA,
          dataHoraPuxado: item.Manifesto_Puxado,
          dataHoraRecebido: item.Manifesto_Recebido,
          status: item.Status,
          turno: item.Turno,
          carimboDataHR: item["Carimbo_Data/HR"],
          usuarioAcao: item["Usuario_Ação"],
          usuarioResponsavel: item["Usuario_Operação"], // Mapeando o campo responsável
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
    if (!isLoggedIn) return;
    fetchManifestos();
    fetchNextId();
    const interval = setInterval(fetchManifestos, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn, fetchManifestos, fetchNextId]);

  const updateStatus = async (id: string, status: string, fields: any = {}) => {
    setLoadingMsg("Processando...");
    try {
      const user = currentUser?.Nome_Completo || "Sistema";
      const { error } = await supabase.from('SMO_Sistema').update({ 
        Status: status, "Carimbo_Data/HR": getCurrentTimestampBR(), "Usuario_Ação": user, ...fields 
      }).eq('ID_Manifesto', id);
      if (error) throw error;
      await supabase.from('SMO_Operacional').insert({ ID_Manifesto: id, "Ação": status, Usuario: user, "Created_At_BR": getCurrentTimestampBR() });
      showAlert('success', `Status: ${status}`);
      fetchManifestos();
    } catch (err: any) { showAlert('error', err.message); } finally { setLoadingMsg(null); }
  };

  if (!isLoggedIn) return <LoginScreen onLoginSuccess={(u) => { setCurrentUser(u); setIsLoggedIn(true); }} loading={false} setLoading={() => {}} />;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] custom-scrollbar">
      {/* Header Industrial Comando */}
      <header className="bg-[#0f172a] text-white border-b-2 border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between h-16 px-8">
          <div className="flex items-center gap-6 h-full">
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
                className={`group flex items-center gap-2 px-6 h-16 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'sistema' ? 'border-indigo-500 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
              >
                <LayoutGrid size={14} className={activeTab === 'sistema' ? 'text-indigo-400' : 'text-slate-500'} />
                Cadastro de Manifesto
              </button>
              <button 
                onClick={() => setActiveTab('operacional')} 
                className={`group flex items-center gap-2 px-6 h-16 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'operacional' ? 'border-red-500 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
              >
                <Plane size={14} className={activeTab === 'operacional' ? 'text-red-400' : 'text-slate-500'} />
                Puxe de Manifesto
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
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Auth: {currentUser?.Usuario}</p>
              <p className="text-[11px] font-bold text-slate-100 uppercase">{currentUser?.Nome_Completo}</p>
            </div>

            <button onClick={() => window.location.reload()} className="p-2.5 bg-slate-800 hover:bg-red-600 transition-colors border border-slate-700 hover:border-red-500 text-slate-400 hover:text-white group">
              <LogOut size={16} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-[1700px] mx-auto space-y-6">
          {activeTab === 'sistema' ? (
            <Dashboard 
              currentUser={currentUser!}
              manifestos={manifestos}
              onSave={async (d) => {
                setLoadingMsg("Registrando...");
                const id = await fetchNextId();
                const turno = getTurnoAtual(); // Calcula o turno aqui
                const { error } = await supabase.from('SMO_Sistema').insert({
                  ID_Manifesto: id, 
                  Usuario_Sistema: currentUser?.Usuario, 
                  CIA: d.cia, 
                  Manifesto_Puxado: d.dataHoraPuxado, 
                  Manifesto_Recebido: d.dataHoraRecebido,
                  Status: "Manifesto Recebido", 
                  Turno: turno, 
                  "Carimbo_Data/HR": getCurrentTimestampBR(), 
                  "Usuario_Ação": currentUser?.Nome_Completo
                });
                if (error) showAlert('error', error.message);
                else { showAlert('success', `Registro Concluído (${turno})`); fetchManifestos(); }
                setLoadingMsg(null);
              }}
              onAction={(act, id) => {
                if (act === 'entregar') updateStatus(id, 'Manifesto Entregue');
                else if (act === 'cancelar') setCancellationId(id);
                else if (act === 'anular') setAnularId(id);
              }}
              openHistory={setViewingHistoryId}
              openEdit={setEditingId}
              onShowAlert={showAlert}
              nextId={nextId}
            />
          ) : (
            <OperationalDashboard 
              manifestos={manifestos} 
              onAction={updateStatus} 
              currentUser={currentUser!} 
              onOpenAssign={setAssignId => setAssigningId(setAssignId)}
            />
          )}
        </div>
      </main>

      <PerformanceMonitor isLoggedIn={isLoggedIn} currentUser={currentUser} manifestos={manifestos} />

      {editingId && <EditModal data={manifestos.find(m => m.id === editingId)!} onClose={() => setEditingId(null)} onSave={() => {}} />}
      {viewingHistoryId && <HistoryModal data={manifestos.find(m => m.id === viewingHistoryId)!} onClose={() => setViewingHistoryId(null)} />}
      {cancellationId && <CancellationModal onConfirm={() => updateStatus(cancellationId, 'Manifesto Cancelado')} onClose={() => setCancellationId(null)} />}
      {anularId && <AnularModal onConfirm={() => updateStatus(anularId, 'Manifesto Recebido')} onClose={() => setAnularId(null)} />}
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
