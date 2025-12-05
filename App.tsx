
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { EditModal, LoadingOverlay, HistoryModal, AlertToast, CancellationModal, AnularModal } from './components/Modals';
import { Manifesto, User, SMO_Sistema_DB } from './types';
import { supabase, DB_SCHEMA } from './supabaseClient';

// ------------------------------------------------------------------
// CONFIGURAÇÃO N8N (AÇÕES)
// ------------------------------------------------------------------
const N8N_WEBHOOK_SAVE = 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/Cadastro_de_Manifestos';
const N8N_WEBHOOK_EDIT = 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/Cadastro_de_Manifestos';
const N8N_WEBHOOK_CANCEL = 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/Cadastro_de_Manifestos';
const N8N_WEBHOOK_LOGOUT = 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/Validar_Credenciais';
// ------------------------------------------------------------------

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [manifestos, setManifestos] = useState<Manifesto[]>([]);
  
  // Ref para guardar o usuário atual sem causar re-renders no listener de eventos
  const currentUserRef = useRef<User | null>(null);
  
  // Atualiza a ref sempre que o state mudar
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  
  // Modal States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [cancellationId, setCancellationId] = useState<string | null>(null);
  const [anularId, setAnularId] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [alert, setAlert] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  
  // Estado para controle de erro no Realtime
  const [realtimeConnectionError, setRealtimeConnectionError] = useState(false);

  const getCurrentTimestampSQL = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const generateNextId = (currentList: Manifesto[]) => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); 
    const prefix = `MAO - ${year}`; 
    
    let maxSeq = 0;

    currentList.forEach(m => {
      if (m.id && m.id.startsWith(prefix)) {
        const seqString = m.id.substring(8); 
        const seq = parseInt(seqString, 10);
        
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${prefix}${nextSeq.toString().padStart(7, '0')}`;
  };

  const showAlert = (type: 'success' | 'error', msg: string) => {
     setAlert({ type, msg });
     setTimeout(() => setAlert(null), 4000);
  };

  const mapDatabaseRowToManifesto = (item: SMO_Sistema_DB): Manifesto => ({
    id: item.ID_Manifesto,
    usuario: item.Usuario_Sistema,
    cia: item.CIA,
    dataHoraPuxado: item.Manifesto_Puxado,
    dataHoraRecebido: item.Manifesto_Recebido,
    cargasINH: item["Cargas_(IN/H)"],
    cargasIZ: item["Cargas_(IZ)"],
    status: item.Status,
    turno: item.Turno,
    carimboDataHR: item["Carimbo_Data/HR"],
    usuarioOperacao: item["Usuario_Operação"],
    dataHoraIniciado: item.Manifesto_Iniciado,
    dataHoraDisponivel: item.Manifesto_Disponivel,
    dataHoraConferencia: item["Manifesto_em_Conferência"],
    dataHoraPendente: item.Manifesto_Pendente,
    dataHoraCompleto: item.Manifesto_Completo
  });

  const fetchManifestos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('SMO_Sistema')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedManifestos = (data as SMO_Sistema_DB[]).map(mapDatabaseRowToManifesto);
        setManifestos(mappedManifestos);
      }
    } catch (error: any) {
      console.error("Erro ao buscar manifestos:", error);
      // Não mostra alerta se for erro de conexão no polling para não floodar a tela
      if (!error.message?.includes('Failed to fetch')) {
         showAlert('error', "Erro ao carregar histórico: " + error.message);
      }
    }
  }, []);

  // SUBSCRIPTION DO REALTIME (MANIFESTOS)
  useEffect(() => {
    if (!isLoggedIn) return;

    fetchManifestos();

    const channel = supabase
      .channel('manifestos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: DB_SCHEMA,
          table: 'SMO_Sistema',
        },
        (payload) => {
          console.log('⚡ Realtime Update (Manifestos):', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const newItem = mapDatabaseRowToManifesto(payload.new as SMO_Sistema_DB);
            setManifestos(prev => [newItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapDatabaseRowToManifesto(payload.new as SMO_Sistema_DB);
            setManifestos(prev => prev.map(m => m.id === updatedItem.id ? updatedItem : m));
          } else {
             fetchManifestos();
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log("✅ Conectado ao Realtime de Manifestos.");
          setRealtimeConnectionError(false);
        } else if (status === 'CHANNEL_ERROR') {
          console.error("❌ Erro no canal de Manifestos:", err);
          // Ativa o fallback de polling
          setRealtimeConnectionError(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, fetchManifestos]);

  // Fallback Polling quando Realtime falha
  useEffect(() => {
    if (isLoggedIn && realtimeConnectionError) {
      console.log("⚠️ Realtime indisponível. Ativando polling (5s)...");
      const interval = setInterval(() => {
        fetchManifestos();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, realtimeConnectionError, fetchManifestos]);

  // ************************************************************************************************
  // 🚨 SISTEMA DE SEGURANÇA HÍBRIDO (EVENT-DRIVEN + REALTIME) 🚨
  // ************************************************************************************************
  
  // Função que verifica o banco DE VERDADE (HTTP request, não websocket)
  const verifySessionIntegrity = async () => {
     const user = currentUserRef.current;
     if (!user) return;

     // console.log("🔍 Verificando integridade da sessão (Trigger por Interação)...");

     const { data, error } = await supabase
       .from('Cadastro_de_Perfil')
       .select('sesson_id')
       .eq('id', user.id)
       .single();

     if (error) {
       // Se der erro de rede, não derruba imediatamente para não ser chato,
       // mas loga o erro.
       console.error("⚠️ Erro ao verificar sessão:", error.message);
       return;
     }

     if (data && data.sesson_id !== user.sesson_id) {
        console.error("⛔ SESSÃO DUPLICADA DETECTADA. DESCONECTANDO.");
        setIsLoggedIn(false);
        setCurrentUser(null);
        setManifestos([]);
        setLoading(false); // CRÍTICO: Reseta o loading para a tela de login não travar
        // Usando window.alert pois bloqueia a thread e força atenção
        window.alert("Sua conta foi conectada em outro dispositivo. Você foi desconectado.");
     }
  };

  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    // 1. REALTIME (Plano A - Rápido, mas pode falhar em Self-Hosted)
    const sessionChannel = supabase
      .channel(`security-check-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: DB_SCHEMA, 
          table: 'Cadastro_de_Perfil',
        },
        (payload) => {
          const newData = payload.new as any;
          if (String(newData.id) === String(currentUser.id)) {
             if (newData.sesson_id !== currentUser.sesson_id) {
                console.warn("⚡ Realtime detectou quebra de sessão.");
                setIsLoggedIn(false);
                setCurrentUser(null);
                setManifestos([]);
                setLoading(false); // CRÍTICO: Reseta o loading para a tela de login não travar
                window.alert("Sua conta foi conectada em outro dispositivo.");
             }
          }
        }
      )
      .subscribe();

    // 2. CHECK POR INTERAÇÃO (Plano B - "Sentinela")
    // Verifica a sessão sempre que o usuário "toca" no sistema (foco, clique).
    // Isso NÃO É UM TIMER. Só roda se o usuário estiver ativo.
    
    const handleInteraction = () => verifySessionIntegrity();

    window.addEventListener('focus', handleInteraction); // Quando volta pra aba
    window.addEventListener('click', handleInteraction); // Quando clica em qualquer lugar
    document.addEventListener('visibilitychange', handleInteraction); // Quando muda de aba

    // Check inicial ao montar
    verifySessionIntegrity();

    return () => {
      supabase.removeChannel(sessionChannel);
      window.removeEventListener('focus', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      document.removeEventListener('visibilitychange', handleInteraction);
    };
  }, [isLoggedIn, currentUser]); 


  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setLoading(false); // CRÍTICO: Reseta o loading ao logar com sucesso
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    if (currentUser) {
      try {
        if (N8N_WEBHOOK_LOGOUT) {
           await fetch(N8N_WEBHOOK_LOGOUT, {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({ 
                action: 'logoff', 
                usuario: currentUser.Usuario,
                senha: currentUser.Senha, 
                id: currentUser.id,
                sesson_id: currentUser.sesson_id
             })
           });
        }
      } catch (error) {
         console.error("Erro ao solicitar logoff:", error);
      } finally {
        setTimeout(() => {
          setIsLoggedIn(false);
          setCurrentUser(null);
          setIsLoggingOut(false);
          setManifestos([]);
          setLoading(false);
        }, 500);
      }
    } else {
        setIsLoggedIn(false);
        setLoading(false);
        setIsLoggingOut(false);
    }
  };

  const handleSaveNew = async (data: Omit<Manifesto, 'id' | 'status' | 'turno'>) => {
    // Check de segurança antes de salvar
    await verifySessionIntegrity();
    if (!currentUserRef.current) return; // Se caiu a sessão, para tudo

    setLoadingMsg("Enviando para o n8n...");
    try {
      const nextId = generateNextId(manifestos);
      const currentTimestamp = getCurrentTimestampSQL();
      
      let turno = "3 Turno";
      if (data.dataHoraRecebido) {
          const d = new Date(data.dataHoraRecebido);
          const mins = d.getHours() * 60 + d.getMinutes();
          if (mins >= 360 && mins <= 839) turno = "1 Turno";
          else if (mins >= 840 && mins <= 1319) turno = "2 Turno";
      }

      // CORREÇÃO: Alinhando chaves do JSON com o esperado pelo n8n ("Edit Fields Normal")
      const payload = {
          id: nextId, // n8n espera "id"
          usuario: currentUser?.Usuario || "Sistema", // n8n espera "usuario"
          cia: data.cia,
          dataHoraPuxado: data.dataHoraPuxado, // n8n espera "dataHoraPuxado"
          dataHoraRecebido: data.dataHoraRecebido, // n8n espera "dataHoraRecebido"
          cargasINH: data.cargasINH, // n8n espera "cargasINH"
          cargasIZ: data.cargasIZ, // n8n espera "cargasIZ"
          status: "Manifesto Recebido",
          turno: turno,
          'Carimbo_Data/HR': currentTimestamp, // n8n espera "Carimbo_Data/HR"
          Action: "Registro de Dados", // ESSENCIAL para o Switch do n8n
          Usuario_Action: currentUser?.Usuario || "Sistema",
          justificativa: "Cadastro Inicial"
      };

      const response = await fetch(N8N_WEBHOOK_SAVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Erro na comunicação com n8n");

      showAlert('success', "Manifesto enviado para processamento!");
      
      // REFRESH: Garante espelhamento dos dados imediatamante
      await fetchManifestos();

    } catch (err: any) {
      console.error(err);
      showAlert('error', "Erro ao salvar via n8n: " + err.message);
    } finally {
      setLoadingMsg(null);
    }
  };

  const handleEditSave = async (partialData: Partial<Manifesto> & { id: string, usuario: string, justificativa: string }) => {
    await verifySessionIntegrity();
    if (!currentUserRef.current) return;

    setLoadingMsg("Enviando edição ao n8n...");
    try {
      // CORREÇÃO: Alinhando payload para edição
      const payload = {
         id: partialData.id,
         usuario: currentUser?.Usuario, // Quem está editando
         // Mapeando campos parciais se existirem
         cia: partialData.cia,
         dataHoraPuxado: partialData.dataHoraPuxado,
         dataHoraRecebido: partialData.dataHoraRecebido,
         cargasINH: partialData.cargasINH,
         cargasIZ: partialData.cargasIZ,
         
         justificativa: partialData.justificativa,
         Action: "Edição de Dados", // ESSENCIAL para o Switch do n8n
         Usuario_Action: currentUser?.Usuario,
         'Carimbo_Data/HR': getCurrentTimestampSQL()
      };

      const response = await fetch(N8N_WEBHOOK_EDIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Erro na comunicação com n8n");

      showAlert('success', "Edição enviada com sucesso!");
      setEditingId(null);
      
      // REFRESH: Garante espelhamento dos dados imediatamante
      await fetchManifestos();

    } catch (err: any) {
      console.error(err);
      showAlert('error', "Erro ao editar via n8n: " + err.message);
    } finally {
      setLoadingMsg(null);
    }
  };

  const handleAction = async (action: string, id: string) => {
     if (action === 'cancelar') {
         setCancellationId(id);
         return;
     }
     if (action === 'anular') {
         setAnularId(id);
         return;
     }
  };

  const handleConfirmCancellation = async (justificativa: string) => {
      await verifySessionIntegrity();
      if (!currentUserRef.current) return;

      if (!cancellationId) return;
      const id = cancellationId;
      setCancellationId(null);

      setLoadingMsg("Processando cancelamento...");
      try {
          // CORREÇÃO: Alinhando payload para cancelamento
          const payload = {
             Action: "Excluir Dados", // ESSENCIAL para o Switch do n8n (caminho Cancelar Manifesto)
             id: id,
             usuario: currentUser?.Usuario,
             Usuario_Action: currentUser?.Usuario,
             justificativa: justificativa,
             'Carimbo_Data/HR': getCurrentTimestampSQL()
          };

          const response = await fetch(N8N_WEBHOOK_CANCEL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("Erro na comunicação com n8n");

          showAlert('success', "Solicitação de cancelamento enviada!");

          // REFRESH: Garante espelhamento dos dados imediatamante
          await fetchManifestos();

      } catch (err: any) {
           console.error(err);
           showAlert('error', "Erro ao cancelar: " + err.message);
      } finally {
           setLoadingMsg(null);
      }
  };

  const handleConfirmAnular = async (justificativa: string) => {
      await verifySessionIntegrity();
      if (!currentUserRef.current) return;

      if (!anularId) return;
      const id = anularId;
      setAnularId(null);

      setLoadingMsg("Processando anulação...");
      try {
          // CORREÇÃO: Alinhando payload para anulação
          const payload = {
             Action: "Anular Status", // ESSENCIAL para o Switch do n8n
             id: id,
             usuario: currentUser?.Usuario,
             Usuario_Action: currentUser?.Usuario,
             justificativa: justificativa,
             'Carimbo_Data/HR': getCurrentTimestampSQL()
          };

          const response = await fetch(N8N_WEBHOOK_CANCEL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("Erro na comunicação com n8n");

          showAlert('success', "Solicitação de anulação enviada!");

          // REFRESH: Garante espelhamento dos dados imediatamante
          await fetchManifestos();

      } catch (err: any) {
           console.error(err);
           showAlert('error', "Erro ao anular: " + err.message);
      } finally {
           setLoadingMsg(null);
      }
  };

  const handleOpenHistory = async (id: string) => {
    setViewingHistoryId(id);
    
    try {
      const { data, error } = await supabase
        .from('SMO_Sistema')
        .select('*')
        .eq('ID_Manifesto', id)
        .single();

      if (data && !error) {
        const freshManifesto = mapDatabaseRowToManifesto(data as SMO_Sistema_DB);
        setManifestos(prev => prev.map(m => m.id === id ? freshManifesto : m));
      }
    } catch (error) {
       console.error("Erro ao atualizar histórico individual:", error);
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} loading={loading} setLoading={setLoading} />;
  }

  const visibleManifestos = manifestos.filter(
    m => m.status !== 'Manifesto Cancelado' && m.status !== 'Manifesto Completo'
  );

  return (
    <>
      <Dashboard 
        currentUser={currentUser!}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        manifestos={visibleManifestos}
        onSave={handleSaveNew}
        onAction={handleAction}
        openHistory={handleOpenHistory}
        openEdit={setEditingId}
        onShowAlert={showAlert}
        nextId={generateNextId(manifestos)}
      />

      {editingId && (
        <EditModal 
          data={manifestos.find(m => m.id === editingId)!} 
          onClose={() => setEditingId(null)}
          onSave={handleEditSave}
        />
      )}

      {viewingHistoryId && (
        <HistoryModal 
          data={manifestos.find(m => m.id === viewingHistoryId)!} 
          onClose={() => setViewingHistoryId(null)}
        />
      )}

      {cancellationId && (
        <CancellationModal 
          onConfirm={handleConfirmCancellation}
          onClose={() => setCancellationId(null)}
        />
      )}

      {anularId && (
        <AnularModal
          onConfirm={handleConfirmAnular}
          onClose={() => setAnularId(null)}
        />
      )}

      {loadingMsg && <LoadingOverlay msg={loadingMsg} />}
      {alert && <AlertToast type={alert.type} msg={alert.msg} />}
    </>
  );
}

export default App;
