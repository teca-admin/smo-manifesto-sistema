
import React, { useState, useEffect, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { EditModal, LoadingOverlay, HistoryModal, AlertToast, CancellationModal, AnularModal } from './components/Modals';
import { Manifesto, User, SMO_Sistema_DB } from './types';
import { supabase } from './supabaseClient';

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

  // Função centralizada para enviar dados ao n8n
  const sendDataToN8N = async (manifesto: any, actionType: string) => {
    const WEBHOOK_URL = "https://projeto-teste-n8n.ly7t0m.easypanel.host/webhook/Cadastro_de_Manifestos";
    const currentTimestamp = getCurrentTimestampSQL();

    const usuarioActionName = currentUser?.Nome_Completo || currentUser?.Usuario || "Sistema";

    const payloadForWebhook = {
       ...manifesto, 
       "Carimbo_Data/HR": currentTimestamp,
       "Action": actionType,
       "Usuario_Action": usuarioActionName
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadForWebhook)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP no Webhook: ${response.status}`);
    }
    
    return payloadForWebhook;
  };

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
      showAlert('error', "Erro ao carregar histórico: " + error.message);
    }
  }, []);

  // SUBSCRIPTION DO REALTIME (MANIFESTOS)
  useEffect(() => {
    if (!isLoggedIn) return;

    fetchManifestos();

    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SMO_Sistema',
        },
        (payload) => {
          console.log('Realtime change received (Manifestos):', payload);
          
          // Otimização: Atualiza o estado local diretamente com o payload para resposta instantânea
          if (payload.eventType === 'INSERT') {
            const newItem = mapDatabaseRowToManifesto(payload.new as SMO_Sistema_DB);
            setManifestos(prev => [newItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapDatabaseRowToManifesto(payload.new as SMO_Sistema_DB);
            setManifestos(prev => prev.map(m => m.id === updatedItem.id ? updatedItem : m));
          } else {
             // Para DELETE ou outros casos, faz o fetch completo por segurança
             fetchManifestos();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, fetchManifestos]);

  // ************************************************************************************************
  // 🚨 🚨 🚨 LÓGICA DE SEGURANÇA CRÍTICA - "OUVIDO NA PAREDE" (SESSION KICK) 🚨 🚨 🚨
  // ************************************************************************************************
  // ATENÇÃO: NÃO ALTERE, NÃO REMOVA E NÃO REFATORE ESTE useEffect SEM ORDEM EXPLÍCITA.
  // ESTA LÓGICA GARANTE QUE APENAS UMA SESSÃO PERMANEÇA ATIVA POR USUÁRIO.
  //
  // FUNCIONAMENTO:
  // 1. Monitora a tabela 'Cadastro_de_Perfil' no Supabase.
  // 2. Se detectar um UPDATE no ID do usuário logado, verifica a coluna 'sesson_id'.
  // 3. Se o 'sesson_id' do banco for diferente do 'sesson_id' local, significa que houve login em outro lugar.
  // 4. O sistema força o logout IMEDIATAMENTE.
  //
  // NOTA IMPORTANTE: O nome da coluna no banco é 'sesson_id' (com erro de digitação). 
  // NÃO CORRIGIR PARA 'session_id'. O CÓDIGO DEPENDE DESSA GRAFIA EXATA.
  // ************************************************************************************************
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    console.log("Monitorando sessão do usuário (ID DB):", currentUser.id);
    console.log("Token Local:", currentUser.sesson_id);

    const sessionChannel = supabase
      .channel(`user-session-monitor-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Cadastro_de_Perfil',
          filter: `id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log("Atualização de perfil detectada:", payload);
          const newUserState = payload.new as any; 
          
          // 🚨 CRÍTICO: Mapeamento da coluna 'sesson_id' (sic)
          const remoteSessionId = newUserState.sesson_id;
          const localSessionId = currentUser.sesson_id;

          if (remoteSessionId && remoteSessionId !== localSessionId) {
             console.warn("Sessão invalidada! Novo login detectado em outro dispositivo.");
             console.warn(`Remoto: ${remoteSessionId} vs Local: ${localSessionId}`);
             
             showAlert('error', "Sua conta foi conectada em outro dispositivo. Desconectando...");
             handleLogout();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, [isLoggedIn, currentUser]);
  // ************************************************************************************************
  // FIM DA LÓGICA CRÍTICA DE SEGURANÇA
  // ************************************************************************************************


  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    if (currentUser) {
      try {
        const WEBHOOK_AUTH_URL = "https://projeto-teste-n8n.ly7t0m.easypanel.host/webhook/Validar_Credenciais";
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const dataHrEnvio = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const payload = {
          usuario: currentUser.Usuario,
          senha: currentUser.Senha,
          action: "logoff", 
          status: "offline",
          session_token: currentUser.sesson_id,
          timestamp: new Date().toISOString(),
          "Data/hr do envio": dataHrEnvio,
          id: currentUser.id
        };

        const response = await fetch(WEBHOOK_AUTH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // Aguarda e processa a resposta do webhook para garantir que o ciclo completou
        const responseData = await response.text();
        console.log("Logoff processado pelo servidor:", responseData);
        
      } catch (error) {
         console.error("Erro ao registrar logoff:", error);
      } finally {
        // Delay visual curto para transição suave, mas garantindo o reset
        setTimeout(() => {
          setIsLoggedIn(false);
          setCurrentUser(null);
          setIsLoggingOut(false);
          setManifestos([]);
          setLoading(false); // IMPORTANTE: Reseta o loading para liberar a tela de login
        }, 500);
      }
    } else {
        // Fallback caso não tenha currentUser (raro)
        setIsLoggedIn(false);
        setLoading(false);
        setIsLoggingOut(false);
    }
  };

  const handleSaveNew = async (data: Omit<Manifesto, 'id' | 'status' | 'turno'>) => {
    setLoadingMsg("Registrando manifesto...");
    try {
      const nextId = generateNextId(manifestos);
      
      let turno = "3 Turno";
      if (data.dataHoraRecebido) {
          const d = new Date(data.dataHoraRecebido);
          const mins = d.getHours() * 60 + d.getMinutes();
          if (mins >= 360 && mins <= 839) turno = "1 Turno";
          else if (mins >= 840 && mins <= 1319) turno = "2 Turno";
      }

      const newManifesto: Partial<Manifesto> = {
          ...data,
          id: nextId,
          status: "Manifesto Recebido",
          turno: turno,
          usuario: currentUser?.Usuario || "Sistema"
      };

      await sendDataToN8N(newManifesto, "Registro de Dados");
      showAlert('success', "Manifesto registrado com sucesso!");
    } catch (err: any) {
      showAlert('error', "Erro ao salvar: " + err.message);
    } finally {
      setLoadingMsg(null);
    }
  };

  const handleEditSave = async (partialData: Partial<Manifesto> & { id: string, usuario: string, justificativa: string }) => {
    setLoadingMsg("Salvando alterações...");
    try {
      await sendDataToN8N(partialData, "Edição de Dados");
      showAlert('success', "Manifesto editado com sucesso!");
      setEditingId(null);
    } catch (err: any) {
      showAlert('error', "Erro ao editar: " + err.message);
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

      setLoadingMsg("Cancelando manifesto...");
      try {
          const manifest = manifestos.find(m => m.id === id);
          if (!manifest) throw new Error("Manifesto não encontrado");

          const payload = {
              id: manifest.id,
              usuario: manifest.usuario,
              justificativa: justificativa,
              status: "Manifesto Cancelado"
          };

          await sendDataToN8N(payload, "Excluir Dados");
          showAlert('success', "Manifesto cancelado com sucesso!");
      } catch (err: any) {
           showAlert('error', "Erro ao cancelar: " + err.message);
      } finally {
           setLoadingMsg(null);
      }
  };

  const handleConfirmAnular = async (justificativa: string) => {
      if (!anularId) return;
      const id = anularId;
      setAnularId(null);

      setLoadingMsg("Anulando status...");
      try {
          const manifest = manifestos.find(m => m.id === id);
          if (!manifest) throw new Error("Manifesto não encontrado");

          const payload = {
              id: manifest.id,
              usuario: manifest.usuario,
              status: "Manifesto Recebido",
              Status_Anterior: manifest.status, // Adicionado para rastreio
              justificativa: justificativa, // Nova justificativa
              "Usuario_Operação": manifest.usuarioOperacao // Adicionando Usuario_Operação ao payload
          };

          await sendDataToN8N(payload, "Anular Status");
          showAlert('success', "Status anulado com sucesso!");
      } catch (err: any) {
           showAlert('error', "Erro ao anular status: " + err.message);
      } finally {
           setLoadingMsg(null);
      }
  };

  // Função para abrir o histórico e forçar atualização dos dados
  const handleOpenHistory = async (id: string) => {
    setViewingHistoryId(id); // Abre o modal imediatamente com os dados locais
    
    // Consulta pontual ao Supabase para garantir dados frescos
    try {
      const { data, error } = await supabase
        .from('SMO_Sistema')
        .select('*')
        .eq('ID_Manifesto', id)
        .single();

      if (data && !error) {
        const freshManifesto = mapDatabaseRowToManifesto(data as SMO_Sistema_DB);
        setManifestos(prev => prev.map(m => m.id === id ? freshManifesto : m));
        console.log("Histórico atualizado com dados frescos do banco.");
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
