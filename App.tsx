
import React, { useState, useEffect, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { EditModal, LoadingOverlay, HistoryModal, AlertToast, CancellationModal, AnularModal } from './components/Modals';
import { Manifesto, User, SMO_Sistema_DB } from './types';
import { supabase, DB_SCHEMA } from './supabaseClient';

// ------------------------------------------------------------------
// CONFIGURAÇÃO N8N (AÇÕES)
// ------------------------------------------------------------------
// URLs atualizadas conforme ambiente Easypanel
const N8N_WEBHOOK_SAVE = 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/Cadastro_de_Manifestos';
const N8N_WEBHOOK_EDIT = 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/Cadastro_de_Manifestos';
const N8N_WEBHOOK_CANCEL = 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/Cadastro_de_Manifestos'; // Usado para Cancelar e Anular
// O Logout usa o mesmo fluxo de validação de credenciais, mas com action='logoff'
const N8N_WEBHOOK_LOGOUT = 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/Validar_Credenciais';
// ------------------------------------------------------------------

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [manifestos, setManifestos] = useState<Manifesto[]>([]);
  
  // Modal States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [cancellationId, setCancellationId] = useState<string | null>(null);
  const [anularId, setAnularId] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [alert, setAlert] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  // Função auxiliar para gerar timestamp SQL
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

  // Helper function to generate next ID
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

  // Helper para mapear linha do banco para o tipo Manifesto
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
    
    // Mapeamento das colunas de datas específicas
    dataHoraIniciado: item.Manifesto_Iniciado,
    dataHoraDisponivel: item.Manifesto_Disponivel,
    dataHoraConferencia: item["Manifesto_em_Conferência"],
    dataHoraPendente: item.Manifesto_Pendente,
    dataHoraCompleto: item.Manifesto_Completo
  });

  const fetchManifestos = useCallback(async () => {
    try {
      // LEITURA CONTINUA VIA SUPABASE DIRETO (MAIS RÁPIDO QUE N8N PARA LISTAGEM)
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
      showAlert('error', "Erro ao carregar histórico: " + error.message);
    }
  }, []);

  // SUBSCRIPTION DO REALTIME (MANIFESTOS)
  useEffect(() => {
    if (!isLoggedIn) return;

    fetchManifestos();

    // Canal único para dados operacionais
    const channel = supabase
      .channel('manifestos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: DB_SCHEMA, // IMPORTANTE: Schema correto
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
        } else if (status === 'CHANNEL_ERROR') {
          console.error("❌ Erro no canal de Manifestos:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, fetchManifestos]);

  // ************************************************************************************************
  // 🚨 🚨 🚨 LÓGICA DE SEGURANÇA CRÍTICA - "OUVIDO NA PAREDE" (SESSION KICK) 🚨 🚨 🚨
  // ************************************************************************************************
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    console.log(`🔒 Iniciando monitoramento de sessão para User ID: ${currentUser.id}`);

    // 1. CHECAGEM INICIAL (Check-on-mount)
    // Garante que, se o usuário der F5 ou entrar com token velho, ele cai na hora.
    const checkCurrentSession = async () => {
       const { data, error } = await supabase
         .from('Cadastro_de_Perfil')
         .select('sesson_id')
         .eq('id', currentUser.id)
         .single();

       if (error) {
         console.error("Erro ao verificar sessão inicial:", error);
         return; 
       }

       if (data && data.sesson_id !== currentUser.sesson_id) {
          console.warn("⛔ SESSÃO INVÁLIDA DETECTADA AO INICIAR.");
          setIsLoggedIn(false);
          setCurrentUser(null);
          setManifestos([]);
          window.alert("Sua sessão expirou ou foi aberta em outro local.");
       } else {
          console.log("✅ Sessão inicial verificada e válida.");
       }
    };

    checkCurrentSession();

    // 2. MONITORAMENTO REALTIME (Plano A - SEM FILTRO DE SERVIDOR)
    // Em schemas personalizados self-hosted, filtros server-side podem falhar.
    // Solução: Receber tudo da tabela e filtrar no cliente.
    const sessionChannel = supabase
      .channel(`security-session-global`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: DB_SCHEMA, 
          table: 'Cadastro_de_Perfil',
          // REMOVIDO: filter: `id=eq.${currentUser.id}`, 
          // Motivo: Filtros server-side falham em custom schemas no self-hosted.
        },
        (payload) => {
          const newData = payload.new as any;
          
          // FILTRAGEM CLIENT-SIDE:
          // Só nos importamos se a atualização for para o NOSSO usuário
          if (String(newData.id) === String(currentUser.id)) {
             console.log("⚡ UPDATE recebido para meu usuário!", newData);
             
             const remoteSessionId = newData.sesson_id;
             const localSessionId = currentUser.sesson_id;

             // Se o ID da sessão no banco é diferente do meu local
             if (remoteSessionId && remoteSessionId !== localSessionId) {
                console.warn("⛔ SESSÃO DERRUBADA: Login detectado em outro local.");
                
                // Desconecta imediatamente
                setIsLoggedIn(false);
                setCurrentUser(null);
                setManifestos([]);
                window.alert("Sua conta foi conectada em outro dispositivo. Desconectando...");
             }
          }
        }
      )
      .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
             console.log("✅ Monitoramento de Segurança ATIVO (Modo Global).");
          } else if (status === 'CHANNEL_ERROR') {
             console.error("❌ FALHA CRÍTICA: Não foi possível conectar ao canal de segurança.", err);
          }
      });

    return () => {
      console.log("🔓 Parando monitoramento de sessão.");
      supabase.removeChannel(sessionChannel);
    };
  }, [isLoggedIn, currentUser]); 


  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    if (currentUser) {
      try {
        if (N8N_WEBHOOK_LOGOUT) {
           // Envia senha para satisfazer a query do n8n
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
         console.error("Erro ao solicitar logoff ao servidor:", error);
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

      const payload = {
          id_manifesto: nextId,
          usuario_sistema: currentUser?.Usuario || "Sistema",
          cia: data.cia,
          manifesto_puxado: data.dataHoraPuxado,
          manifesto_recebido: data.dataHoraRecebido,
          cargas_inh: data.cargasINH,
          cargas_iz: data.cargasIZ,
          status: "Manifesto Recebido",
          turno: turno,
          carimbo_data_hr: currentTimestamp
      };

      const response = await fetch(N8N_WEBHOOK_SAVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Erro na comunicação com n8n");

      showAlert('success', "Manifesto enviado para processamento!");
    } catch (err: any) {
      console.error(err);
      showAlert('error', "Erro ao salvar via n8n: " + err.message);
    } finally {
      setLoadingMsg(null);
    }
  };

  const handleEditSave = async (partialData: Partial<Manifesto> & { id: string, usuario: string, justificativa: string }) => {
    setLoadingMsg("Enviando edição ao n8n...");
    try {
      const response = await fetch(N8N_WEBHOOK_EDIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           ...partialData,
           usuario_editor: currentUser?.Usuario, 
           carimbo_atualizacao: getCurrentTimestampSQL()
        })
      });

      if (!response.ok) throw new Error("Erro na comunicação com n8n");

      showAlert('success', "Edição enviada com sucesso!");
      setEditingId(null);
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
      if (!cancellationId) return;
      const id = cancellationId;
      setCancellationId(null);

      setLoadingMsg("Processando cancelamento...");
      try {
          const response = await fetch(N8N_WEBHOOK_CANCEL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               action: 'cancelar',
               id_manifesto: id,
               usuario: currentUser?.Usuario,
               justificativa: justificativa,
               timestamp: getCurrentTimestampSQL()
            })
          });

          if (!response.ok) throw new Error("Erro na comunicação com n8n");

          showAlert('success', "Solicitação de cancelamento enviada!");
      } catch (err: any) {
           console.error(err);
           showAlert('error', "Erro ao cancelar: " + err.message);
      } finally {
           setLoadingMsg(null);
      }
  };

  const handleConfirmAnular = async (justificativa: string) => {
      if (!anularId) return;
      const id = anularId;
      setAnularId(null);

      setLoadingMsg("Processando anulação...");
      try {
          const response = await fetch(N8N_WEBHOOK_CANCEL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               action: 'anular', 
               id_manifesto: id,
               usuario: currentUser?.Usuario,
               justificativa: justificativa,
               timestamp: getCurrentTimestampSQL()
            })
          });

          if (!response.ok) throw new Error("Erro na comunicação com n8n");

          showAlert('success', "Solicitação de anulação enviada!");
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
