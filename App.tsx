import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { EditModal, LoadingOverlay, HistoryModal, AlertToast, CancellationModal, AnularModal, DeliveryModal } from './components/Modals';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { Manifesto, User, SMO_Sistema_DB, ManifestoEvent } from './types';
import { supabase, DB_SCHEMA, PERFORMANCE_SCHEMA } from './supabaseClient';

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
  const [nextId, setNextId] = useState<string>('Automático'); // Estado para o próximo ID
  
  // Ref para guardar o usuário atual sem causar re-renders no listener de eventos
  const currentUserRef = useRef<User | null>(null);
  
  // Atualiza a ref sempre que o state mudar
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  
  // Modal States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [historyEvents, setHistoryEvents] = useState<ManifestoEvent[]>([]); // Estado para eventos do histórico
  const [cancellationId, setCancellationId] = useState<string | null>(null);
  const [anularId, setAnularId] = useState<string | null>(null);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [alert, setAlert] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  
  // Helper para disparar eventos de performance (Apenas Operacionais)
  const trackPerformanceAction = (type: 'cadastro' | 'edicao' | 'cancelamento' | 'anulacao') => {
    try {
      window.dispatchEvent(new CustomEvent('smo-action', { detail: { type } }));
    } catch (e) {
      console.error("Erro ao rastrear ação:", e);
    }
  };

  // Função para logar Login/Logoff DIRETAMENTE no banco (Sem depender do componente Monitor)
  const logDirectSystemAction = async (action: 'login' | 'logoff', user: User) => {
      const now = new Date();
      const horaLocal = String(now.getHours()).padStart(2, '0');
      const timestampLocalISO = now.toISOString();
      
      // Calcula Data Local para Fuso Horário
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dataLocal = `${year}-${month}-${day}`;

      try {
          await supabase
            .schema(PERFORMANCE_SCHEMA)
            .rpc('registrar_metricas', {
              p_reqs: 0,
              p_n8n: 0, 
              p_banda: 0,
              p_usuario: user.Usuario,
              p_hora: horaLocal,
              p_timestamp_iso: timestampLocalISO,
              p_cadastro: 0,
              p_edicao: 0,
              p_cancelamento: 0,
              p_anulacao: 0,
              p_login: action === 'login' ? 1 : 0,
              p_logoff: action === 'logoff' ? 1 : 0,
              p_data_local: dataLocal // Adicionado suporte a Fuso
            });
      } catch (e) {
          console.error(`Falha ao registrar ${action}:`, e);
      }
  };

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

  const formatForN8N = (dateStr?: string) => {
    if (!dateStr) return undefined;
    // Garante formato compatível com SQL removendo o 'T' ISO
    return dateStr.replace('T', ' ');
  };

  // Lógica local de fallback (caso o banco falhe)
  const generateNextIdLocal = (currentList: Manifesto[], prefix: string) => {
    let maxSeq = 0;
    currentList.forEach(m => {
      // Validate ID format: Prefix + exactly 7 digits (Total length = prefix length + 7)
      // This prevents issues where IDs like 'MAO25...' (badly generated) mess up the sequence
      if (m.id && m.id.startsWith(prefix) && m.id.length === (prefix.length + 7)) {
        // CORRIGIDO: Remove prefixo para extrair apenas a parte sequencial
        const sequencePart = m.id.substring(prefix.length);
        const match = sequencePart.match(/^(\d+)$/);
        if (match) {
           const seq = parseInt(match[1], 10);
           if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
           }
        }
      }
    });
    const nextSeq = maxSeq + 1;
    return `${prefix}${nextSeq.toString().padStart(7, '0')}`;
  };

  // NOVA LÓGICA: Busca o maior ID diretamente do banco para garantir precisão
  // independente da lista de 100 itens carregada na tela.
  const fetchNextId = useCallback(async () => {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2); 
      // PADRÃO SOLICITADO: MAO + HIFEN + ANO + SEQUENCIA (Ex: MAO-250000001)
      const prefix = `MAO-${year}`;

      try {
        // Busca os ÚLTIMOS IDs criados na tabela de EVENTOS (Histórico completo)
        // Aumentado limit para 20 para pular eventuais IDs malformados no topo (Ex: 2525...)
        const { data, error } = await supabase
          .from('SMO_Sistema_Eventos') // <--- CORRIGIDO: Consulta a tabela de Eventos
          .select('ID_Manifesto')
          .ilike('ID_Manifesto', `${prefix}%`) // like "MAO-25%"
          .order('ID_Manifesto', { ascending: false }) // Pega o maior
          .limit(20);
        
        if (error) throw error;

        let maxSeq = 0;

        if (data && data.length > 0) {
            for (const row of data) {
                const id = row.ID_Manifesto;
                
                // Strict validation: Must be prefix + 7 digits (Total 13 chars for MAO-25)
                // This avoids capturing IDs that are malformed or from old formats
                if (id && id.startsWith(prefix) && id.length === (prefix.length + 7)) {
                    const sequencePart = id.substring(prefix.length);
                    const match = sequencePart.match(/^(\d+)$/);

                    if (match) {
                        const seq = parseInt(match[1], 10);
                        if (seq > maxSeq) {
                             maxSeq = seq;
                             break; // Encontrou o maior ID válido
                        }
                    }
                }
            }
        }
        
        // Incrementa e formata
        const nextSeq = maxSeq + 1;
        const newId = `${prefix}${nextSeq.toString().padStart(7, '0')}`;
        
        setNextId(newId);
        return newId;

      } catch (err) {
        console.error("Erro ao calcular próximo ID via banco, usando fallback local:", err);
        // Fallback para a lista local em caso de erro de rede
        const localId = generateNextIdLocal(manifestos, prefix);
        setNextId(localId);
        return localId;
      }
  }, [manifestos]);

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
    // Atualizado para buscar prioritariamente da coluna com acento
    usuarioAcao: item["Usuario_Ação"] || item.Usuario_Action, 
    dataHoraIniciado: item.Manifesto_Iniciado,
    dataHoraDisponivel: item.Manifesto_Disponivel,
    dataHoraConferencia: item["Manifesto_em_Conferência"],
    dataHoraPendente: item.Manifesto_Pendente,
    dataHoraCompleto: item.Manifesto_Completo
  });

  // Função que verifica o banco DE VERDADE (HTTP request)
  const verifySessionIntegrity = useCallback(async () => {
     const user = currentUserRef.current;
     if (!user) return;

     const { data, error } = await supabase
       .from('Cadastro_de_Perfil')
       .select('sesson_id')
       .eq('id', user.id)
       .single();

     if (error) {
       console.error("⚠️ Erro ao verificar sessão:", error.message || JSON.stringify(error));
       return;
     }

     if (data && data.sesson_id !== user.sesson_id) {
        console.error("⛔ SESSÃO DUPLICADA DETECTADA. DESCONECTANDO.");
        setIsLoggedIn(false);
        setCurrentUser(null);
        setManifestos([]);
        setLoading(false);
        window.alert("Sua conta foi conectada em outro dispositivo. Você foi desconectado.");
     }
  }, []);

  const fetchManifestos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('SMO_Sistema') // <--- CORRIGIDO: Consulta a tabela principal do Frontend
        .select('*')
        .order('id', { ascending: false })
        .limit(100); // 🚨 LIMITANDO A 100 REGISTROS PARA OTIMIZAÇÃO

      if (error) throw error;

      if (data) {
        const mappedManifestos = (data as SMO_Sistema_DB[]).map(mapDatabaseRowToManifesto);
        setManifestos(mappedManifestos);
      }
    } catch (error: any) {
      console.error("Erro ao buscar manifestos:", error);
      if (!error.message?.includes('Failed to fetch')) {
         // Não mostramos alerta visual para erro de fetch no polling para não spammar o usuário
         console.warn("Falha silenciosa no polling:", error.message || JSON.stringify(error));
      }
    }
  }, []);

  // ************************************************************************************************
  // 🔄 SISTEMA DE POLLING (ATUALIZAÇÃO A CADA 1 SEGUNDO)
  // ************************************************************************************************
  useEffect(() => {
    if (!isLoggedIn) return;

    // 1. Carga Inicial
    fetchManifestos();
    fetchNextId(); // Calcula ID inicial

    // 2. Configura o intervalo de 1 segundo (1000ms)
    const intervalId = setInterval(() => {
      fetchManifestos();
      fetchNextId(); // Atualiza ID periodicamente também
    }, 1000);

    // 3. Listeners Locais de Segurança (Verifica sessão ao interagir)
    const handleInteraction = () => verifySessionIntegrity();
    window.addEventListener('focus', handleInteraction);
    window.addEventListener('click', handleInteraction);
    document.addEventListener('visibilitychange', handleInteraction);

    return () => {
      clearInterval(intervalId); // Limpa o intervalo ao desmontar/deslogar
      window.removeEventListener('focus', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      document.removeEventListener('visibilitychange', handleInteraction);
    };
  }, [isLoggedIn, fetchManifestos, fetchNextId, verifySessionIntegrity]);


  const handleLoginSuccess = async (user: User) => {
    // 1. Registra Login Imediatamente (Bypass Monitor)
    await logDirectSystemAction('login', user);
    
    // 2. Atualiza Estados
    setCurrentUser(user);
    setIsLoggedIn(true);
    setLoading(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    // 1. Registra Logoff Imediatamente (Bypass Monitor)
    if (currentUser) {
        await logDirectSystemAction('logoff', currentUser);
    }

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
    await verifySessionIntegrity();
    if (!currentUserRef.current) return;

    setLoadingMsg("Enviando...");
    try {
      // Garante que temos o ID mais atualizado possível antes de salvar
      const calculatedId = await fetchNextId();
      const currentTimestamp = getCurrentTimestampSQL();
      
      let turno = "3 Turno";
      if (data.dataHoraRecebido) {
          const d = new Date(data.dataHoraRecebido);
          const mins = d.getHours() * 60 + d.getMinutes();
          if (mins >= 360 && mins <= 839) turno = "1 Turno";
          else if (mins >= 840 && mins <= 1319) turno = "2 Turno";
      }

      const payload = {
          id: calculatedId,
          ID_Manifesto: calculatedId, // Campo adicional solicitado explicitamente
          usuario: currentUser?.Usuario || "Sistema",
          cia: data.cia,
          dataHoraPuxado: formatForN8N(data.dataHoraPuxado),
          dataHoraRecebido: formatForN8N(data.dataHoraRecebido),
          cargasINH: data.cargasINH,
          cargasIZ: data.cargasIZ,
          status: "Manifesto Recebido",
          turno: turno,
          'Carimbo_Data/HR': currentTimestamp,
          Action: "Registro de Dados",
          // Alterado para usar Nome Completo
          Usuario_Action: currentUser?.Nome_Completo || currentUser?.Usuario || "Sistema",
          justificativa: "Cadastro Inicial"
      };

      const response = await fetch(N8N_WEBHOOK_SAVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Erro na comunicação com servidor");

      showAlert('success', "Manifesto enviado para processamento!");
      trackPerformanceAction('cadastro');
      
      // Fetch imediato para feedback rápido e atualizar ID
      await fetchManifestos();
      await fetchNextId();

    } catch (err: any) {
      console.error(err);
      showAlert('error', "Erro ao salvar: " + err.message);
    } finally {
      setLoadingMsg(null);
    }
  };

  const handleEditSave = async (partialData: Partial<Manifesto> & { id: string, usuario: string, justificativa: string }) => {
    await verifySessionIntegrity();
    if (!currentUserRef.current) return;

    setLoadingMsg("Processando edição...");
    try {
      const payload = {
         id: partialData.id,
         usuario: currentUser?.Usuario,
         cia: partialData.cia,
         dataHoraPuxado: formatForN8N(partialData.dataHoraPuxado),
         dataHoraRecebido: formatForN8N(partialData.dataHoraRecebido),
         cargasINH: partialData.cargasINH,
         cargasIZ: partialData.cargasIZ,
         Manifesto_Puxado: formatForN8N(partialData.dataHoraPuxado),
         Manifesto_Recebido: formatForN8N(partialData.dataHoraRecebido),
         justificativa: partialData.justificativa,
         Action: "Edição de Dados",
         Usuario_Action: currentUser?.Nome_Completo || currentUser?.Usuario,
         'Carimbo_Data/HR': getCurrentTimestampSQL()
      };

      const response = await fetch(N8N_WEBHOOK_EDIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Erro na comunicação com servidor");

      showAlert('success', "Edição enviada com sucesso!");
      trackPerformanceAction('edicao');
      setEditingId(null);
      await fetchManifestos();

    } catch (err: any) {
      console.error(err);
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
     if (action === 'entregar') {
         setDeliveryId(id);
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
          const payload = {
             Action: "Excluir Dados",
             id: id,
             usuario: currentUser?.Usuario,
             Usuario_Action: currentUser?.Nome_Completo || currentUser?.Usuario,
             justificativa: justificativa,
             'Carimbo_Data/HR': getCurrentTimestampSQL()
          };

          const response = await fetch(N8N_WEBHOOK_CANCEL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("Erro na comunicação com servidor");

          showAlert('success', "Solicitação de cancelamento enviada!");
          trackPerformanceAction('cancelamento');
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
          const payload = {
             Action: "Anular Status",
             id: id,
             usuario: currentUser?.Usuario,
             Usuario_Action: currentUser?.Nome_Completo || currentUser?.Usuario,
             justificativa: justificativa,
             'Carimbo_Data/HR': getCurrentTimestampSQL()
          };

          const response = await fetch(N8N_WEBHOOK_CANCEL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("Erro na comunicação com servidor");

          showAlert('success', "Solicitação de anulação enviada!");
          trackPerformanceAction('anulacao');
          await fetchManifestos();

      } catch (err: any) {
           console.error(err);
           showAlert('error', "Erro ao anular: " + err.message);
      } finally {
           setLoadingMsg(null);
      }
  };

  const handleConfirmDelivery = async (type: 'Parcial' | 'Completa', quantities?: { inh: number, iz: number }) => {
      await verifySessionIntegrity();
      if (!currentUserRef.current) return;

      if (!deliveryId) return;
      
      const currentManifesto = manifestos.find(m => m.id === deliveryId);
      const id = deliveryId;
      setDeliveryId(null);

      setLoadingMsg(`Registrando Entrega ${type}...`);
      try {
          const payload = {
             Action: type === 'Completa' ? "Entrega Completa" : "Entrega Parcial",
             id: id,
             usuario: currentUser?.Usuario,
             Usuario_Action: currentUser?.Nome_Completo || currentUser?.Usuario,
             'Carimbo_Data/HR': getCurrentTimestampSQL(),
             // Adiciona quantidades entregues se fornecidas (Parcial), ou usa o total (Completa)
             Entregue_INH: quantities ? quantities.inh : (currentManifesto?.cargasINH || 0),
             Entregue_IZ: quantities ? quantities.iz : (currentManifesto?.cargasIZ || 0)
          };

          const response = await fetch(N8N_WEBHOOK_CANCEL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("Erro na comunicação com servidor");

          showAlert('success', `Manifesto marcado como Entregue (${type})!`);
          trackPerformanceAction('edicao'); 
          await fetchManifestos();

      } catch (err: any) {
           console.error(err);
           showAlert('error', "Erro ao registrar entrega: " + err.message);
      } finally {
           setLoadingMsg(null);
      }
  };

  const handleOpenHistory = async (id: string) => {
    setViewingHistoryId(id);
    setHistoryEvents([]); // Limpa eventos anteriores

    // 1. Atualiza dados do manifesto principal (Snapshot Atual)
    try {
      const { data, error } = await supabase
        .from('SMO_Sistema') // <--- CORRIGIDO: Consulta a tabela principal
        .select('*')
        .eq('ID_Manifesto', id)
        .single();

      if (data && !error) {
        const freshManifesto = mapDatabaseRowToManifesto(data as SMO_Sistema_DB);
        setManifestos(prev => prev.map(m => m.id === id ? freshManifesto : m));
      }
    } catch (error) {
       console.error("Erro ao atualizar manifesto individual:", error);
    }

    // 2. Busca histórico de eventos (Tabela SMO_Sistema_Eventos)
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('SMO_Sistema_Eventos')
        .select('*')
        .eq('ID_Manifesto', id)
        .order('id', { ascending: true }); // Ordem cronológica para montar a timeline

      if (!eventsError && eventsData) {
        setHistoryEvents(eventsData as ManifestoEvent[]);
      } else if (eventsError) {
        console.error("Erro ao buscar histórico de eventos:", eventsError);
      }
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} loading={loading} setLoading={setLoading} />;
  }

  return (
    <>
      <Dashboard 
        currentUser={currentUser!}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        manifestos={manifestos}
        onSave={handleSaveNew}
        onAction={handleAction}
        openHistory={handleOpenHistory}
        openEdit={setEditingId}
        onShowAlert={showAlert}
        nextId={nextId} // Passa o ID calculado via banco
      />

      <PerformanceMonitor 
        manifestos={manifestos} 
        isLoggedIn={isLoggedIn} 
        currentUser={currentUser}
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
          events={historyEvents} // Passa os eventos carregados
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
      
      {deliveryId && (
        <DeliveryModal
          data={manifestos.find(m => m.id === deliveryId)!}
          onConfirm={handleConfirmDelivery}
          onClose={() => setDeliveryId(null)}
        />
      )}

      {loadingMsg && <LoadingOverlay msg={loadingMsg} />}
      {alert && <AlertToast type={alert.type} msg={alert.msg} />}
    </>
  );
}

export default App;