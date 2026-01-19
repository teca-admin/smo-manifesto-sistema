
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Server, Database, AlertTriangle, ShieldCheck, X, Zap, List, RefreshCw, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, User, Users, CalendarDays, BarChart2, PlusCircle, Edit, XCircle, RotateCcw, LogIn, LogOut, CalendarRange } from 'lucide-react';
import { Manifesto, PerformanceLogDB, User as UserType } from '../types';
import { supabase, PERFORMANCE_SCHEMA } from '../supabaseClient';
import { canAccessPerformanceMonitor } from '../accessRules';

interface PerformanceMonitorProps {
  manifestos: Manifesto[]; 
  isLoggedIn: boolean;
  currentUser: UserType | null;
}

// Extensão da interface para incluir o campo novo
// Fixed: Using properties already present in PerformanceLogDB or adding new ones specific to the UI state
interface ExtendedPerformanceLog extends PerformanceLogDB {
  // Histórico diário para gráfico mensal
  dailyHistory?: ExtendedPerformanceLog[]; 
}

/*
  =====================================================================================
  ⚠️ IMPORTANTE: ATUALIZAÇÃO DE SQL NECESSÁRIA PARA SUPORTE A FUSO HORÁRIO
  
  Rode este script no Supabase SQL Editor para corrigir o problema onde
  o horário UTC do servidor grava dados no "dia seguinte":

  DROP FUNCTION IF EXISTS public.registrar_metricas;

  CREATE OR REPLACE FUNCTION public.registrar_metricas(
    p_reqs int, p_n8n int, p_banda numeric, p_usuario text, p_hora text, p_timestamp_iso timestamptz,
    p_cadastro int default 0, p_edicao int default 0, p_cancelamento int default 0, p_anulacao int default 0,
    p_login int default 0, p_logoff int default 0,
    p_data_local date default null
  ) returns void as $$
  declare
    v_data_final date;
  begin
    v_data_final := coalesce(p_data_local, current_date);
    insert into public."Log_Performance_SMO_Sistema" (data, usuarios_unicos, detalhes_hora)
    values (v_data_final, '[]'::jsonb, '{}'::jsonb) on conflict (data) do nothing;

    update public."Log_Performance_SMO_Sistema"
    set 
      total_requisicoes = total_requisicoes + p_reqs,
      total_n8n = total_n8n + p_n8n,
      banda_mb = banda_mb + p_banda,
      ultima_atualizacao = p_timestamp_iso,
      total_cadastro = total_cadastro + p_cadastro,
      total_edicao = total_edicao + p_edicao,
      total_cancelamento = total_cancelamento + p_cancelamento,
      total_anulacao = total_anulacao + p_anulacao,
      total_login = total_login + p_login,
      total_logoff = total_logoff + p_logoff,
      usuarios_unicos = case when usuarios_unicos @> to_jsonb(p_usuario) then usuarios_unicos else usuarios_unicos || to_jsonb(p_usuario) end,
      detalhes_hora = jsonb_set(coalesce(detalhes_hora, '{}'::jsonb), array[p_hora], to_jsonb(coalesce((detalhes_hora->>p_hora)::int, 0) + p_reqs))
    where data = v_data_final;
  end;
  $$ language plpgsql;

  grant execute on function public.registrar_metricas to anon, authenticated, service_role;
  =====================================================================================
*/

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ manifestos, isLoggedIn, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Helper to get local date string YYYY-MM-DD
  const getLocalDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateStr());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day'); 
  
  // Define isToday early for use in render
  // Note: strict check might be affected if user crosses midnight, but re-render fixes it
  const isToday = selectedDate === getLocalDateStr();
  
  // --- STATES DE DADOS ---
  const [stats, setStats] = useState<ExtendedPerformanceLog | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // --- REALTIME COUNTERS (Sessão Local) ---
  const [requestCountSession, setRequestCountSession] = useState(0); 
  const [updateTrigger, setUpdateTrigger] = useState(0); // Used to force UI refresh on actions
  
  // --- BUFFER (Para envio ao BD) ---
  const bufferReqs = useRef(0);
  const bufferN8N = useRef(0); // General counter
  const bufferBanda = useRef(0);
  // Specific Action Buffers
  const bufferActions = useRef({
    cadastro: 0,
    edicao: 0,
    cancelamento: 0,
    anulacao: 0,
    login: 0,  // Mantido para compatibilidade, mas não usado via eventos
    logoff: 0  // Mantido para compatibilidade, mas não usado via eventos
  });
  
  const hasAccess = isLoggedIn && canAccessPerformanceMonitor(currentUser);

  // ==============================================================================
  // 0. LISTENER DE EVENTOS DE AÇÃO (Cadastro, Edição, etc.)
  // Login e Logoff agora são geridos pelo App.tsx diretamente
  // ==============================================================================
  useEffect(() => {
    const handleSmoAction = (e: any) => {
       const type = e.detail?.type;
       // Filtra apenas ações operacionais (Login/Logoff são ignorados aqui)
       if (type && ['cadastro', 'edicao', 'cancelamento', 'anulacao'].includes(type)) {
          // Incrementa buffer específico
          if (bufferActions.current.hasOwnProperty(type)) {
              bufferActions.current[type as keyof typeof bufferActions.current]++;
          }
          // Incrementa contador geral de N8N
          bufferN8N.current++;
          
          // Force immediate re-render of UI
          setUpdateTrigger(prev => prev + 1);
       }
    };

    window.addEventListener('smo-action', handleSmoAction);
    return () => window.removeEventListener('smo-action', handleSmoAction);
  }, []);

  // ==============================================================================
  // 1. LÓGICA DE COLETA (LOCAL)
  // ==============================================================================
  useEffect(() => {
    if (!hasAccess) return;

    const timer = setInterval(() => {
      // Incrementa contadores locais
      setRequestCountSession(prev => prev + 1);
      bufferReqs.current += 1;
      // Banda estimada: 100 linhas JSON ~ 30KB = 0.03 MB
      bufferBanda.current += 0.03;
    }, 1000);

    return () => clearInterval(timer);
  }, [hasAccess]);

  // ==============================================================================
  // 2. LÓGICA DE SINCRONIZAÇÃO (ENVIO AO BANCO) - A CADA 30s
  // ==============================================================================
  useEffect(() => {
    if (!hasAccess || !currentUser) return;

    const syncToCloud = async () => {
       // Verifica se tem algo para enviar (qualquer buffer)
       const hasData = bufferReqs.current > 0 || bufferN8N.current > 0 || (Object.values(bufferActions.current) as number[]).some(v => v > 0);

       if (!hasData) return;

       setIsSyncing(true);
       
       // Snapshot dos valores
       const reqsToSend = bufferReqs.current;
       const n8nToSend = bufferN8N.current;
       const bandaToSend = bufferBanda.current;
       const actionsToSend = { ...bufferActions.current };

       // Zera buffers
       bufferReqs.current = 0;
       bufferN8N.current = 0;
       bufferBanda.current = 0;
       bufferActions.current = { cadastro: 0, edicao: 0, cancelamento: 0, anulacao: 0, login: 0, logoff: 0 };

       const now = new Date();
       const horaLocal = String(now.getHours()).padStart(2, '0');
       const timestampLocalISO = now.toISOString();

       // Calcula a Data Local no formato YYYY-MM-DD para forçar a gravação no dia correto (Fuso Horário)
       const year = now.getFullYear();
       const month = String(now.getMonth() + 1).padStart(2, '0');
       const day = String(now.getDate()).padStart(2, '0');
       const dataLocal = `${year}-${month}-${day}`;

       try {
         const { error } = await supabase
            .schema(PERFORMANCE_SCHEMA)
            .rpc('registrar_metricas', {
                p_reqs: reqsToSend,
                p_n8n: n8nToSend,
                p_banda: bandaToSend,
                p_usuario: currentUser.Usuario || 'Anon',
                p_hora: horaLocal,
                p_timestamp_iso: timestampLocalISO,
                // Novos parâmetros de ações
                p_cadastro: actionsToSend.cadastro,
                p_edicao: actionsToSend.edicao,
                p_cancelamento: actionsToSend.cancelamento,
                p_anulacao: actionsToSend.anulacao,
                p_login: 0, // Login gerido pelo App.tsx
                p_logoff: 0, // Logoff gerido pelo App.tsx
                // Novo parâmetro de Data Local
                p_data_local: dataLocal
            });

         if (error) {
            console.error("❌ Erro Sync:", error.message);
            // Devolve ao buffer em caso de erro
            bufferReqs.current += reqsToSend;
            bufferN8N.current += n8nToSend;
            bufferBanda.current += bandaToSend;
            bufferActions.current.cadastro += actionsToSend.cadastro;
            bufferActions.current.edicao += actionsToSend.edicao;
            bufferActions.current.cancelamento += actionsToSend.cancelamento;
            bufferActions.current.anulacao += actionsToSend.anulacao;
         } else {
            if (isOpen && selectedDate === getLocalDateStr() && viewMode === 'day') {
                fetchStats(selectedDate, 'day');
            }
         }
       } catch (err) {
         console.error("❌ Falha Sync:", err);
       } finally {
         setIsSyncing(false);
       }
    };

    const syncInterval = setInterval(syncToCloud, 30000); // 30 segundos
    return () => clearInterval(syncInterval);
  }, [hasAccess, currentUser, isOpen, selectedDate, viewMode]);


  // ==============================================================================
  // 3. FETCH DOS DADOS (LEITURA DO BANCO)
  // ==============================================================================
  const fetchStats = useCallback(async (dateStr: string, mode: 'day' | 'week' | 'month') => {
     setLoadingStats(true);
     setErrorMsg(null);
     try {
        if (mode === 'day') {
            // Busca Dia Único
            const { data, error } = await supabase
               .schema(PERFORMANCE_SCHEMA) 
               .from('Log_Performance_SMO_Sistema')
               .select('*')
               .eq('data', dateStr)
               .single();

            if (error && error.code !== 'PGRST116') throw error;
            setStats(data ? data as ExtendedPerformanceLog : null);

        } else {
            // Configura Range (Semana ou Mês)
            let startRange, endRange;
            
            if (mode === 'week') {
                const curr = new Date(dateStr + 'T00:00:00Z'); // Force UTC interpretation
                const day = curr.getUTCDay();
                const diff = curr.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
                
                const monday = new Date(curr);
                monday.setUTCDate(diff);
                const sunday = new Date(monday);
                sunday.setUTCDate(monday.getUTCDate() + 6);
                
                startRange = monday.toISOString().split('T')[0];
                endRange = sunday.toISOString().split('T')[0];
            } else {
                const curr = new Date(dateStr + 'T00:00:00Z');
                const first = new Date(Date.UTC(curr.getUTCFullYear(), curr.getUTCMonth(), 1));
                const last = new Date(Date.UTC(curr.getUTCFullYear(), curr.getUTCMonth() + 1, 0));
                
                startRange = first.toISOString().split('T')[0];
                endRange = last.toISOString().split('T')[0];
            }

            const { data, error } = await supabase
               .schema(PERFORMANCE_SCHEMA)
               .from('Log_Performance_SMO_Sistema')
               .select('*')
               .gte('data', startRange)
               .lte('data', endRange)
               .order('data', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                // Agrega os dados do período (Semana ou Mês)
                const list = data as unknown as ExtendedPerformanceLog[];
                const aggregated: ExtendedPerformanceLog = {
                    data: mode === 'week' ? 'Semana' : dateStr.substring(0, 7), 
                    total_requisicoes: list.reduce((acc, curr) => acc + (curr.total_requisicoes || 0), 0),
                    total_n8n: list.reduce((acc, curr) => acc + (curr.total_n8n || 0), 0),
                    banda_mb: list.reduce((acc, curr) => acc + (curr.banda_mb || 0), 0),
                    usuarios_unicos: [...new Set(list.flatMap((curr) => curr.usuarios_unicos || []))] as string[],
                    ultima_atualizacao: list.reduce((latest, curr) => (!latest || (curr.ultima_atualizacao && curr.ultima_atualizacao > latest) ? (curr.ultima_atualizacao || '') : latest), ''),
                    
                    // Acumuladores de ações
                    total_cadastro: list.reduce((acc, curr) => acc + (curr.total_cadastro || 0), 0),
                    total_edicao: list.reduce((acc, curr) => acc + (curr.total_edicao || 0), 0),
                    total_cancelamento: list.reduce((acc, curr) => acc + (curr.total_cancelamento || 0), 0),
                    total_anulacao: list.reduce((acc, curr) => acc + (curr.total_anulacao || 0), 0),
                    total_login: list.reduce((acc, curr) => acc + (curr.total_login || 0), 0),
                    total_logoff: list.reduce((acc, curr) => acc + (curr.total_logoff || 0), 0),
                    
                    // Mantém histórico diário para o gráfico
                    dailyHistory: list
                };
                setStats(aggregated);
            } else {
                setStats(null);
            }
        }
     } catch (err: any) {
        console.error("Erro fetch:", err);
        if (!err.message?.includes('Failed to fetch')) {
             setErrorMsg(err.message || "Erro ao buscar dados.");
        }
     } finally {
        setLoadingStats(false);
     }
  }, []);

  useEffect(() => {
     if (isOpen) {
        fetchStats(selectedDate, viewMode);
     }
  }, [isOpen, selectedDate, viewMode, fetchStats]);


  // ==============================================================================
  // 4. HELPERS VISUAIS
  // ==============================================================================
  
  const navigateDate = (direction: number) => {
      const d = new Date(selectedDate);
      if (viewMode === 'day') {
          d.setDate(d.getDate() + direction);
      } else if (viewMode === 'week') {
          d.setDate(d.getDate() + (direction * 7));
      } else {
          d.setMonth(d.getMonth() + direction);
          d.setDate(1); 
      }
      setSelectedDate(d.toISOString().split('T')[0]);
  };

  // --- FORMATAÇÃO DE DISPLAY DO DATE RANGE (USADO NO HEADER E BREAKDOWN) ---
  const getDisplayRangeInfo = () => {
      if (viewMode === 'day') {
          const d = new Date(selectedDate);
          const userTimezoneOffset = d.getTimezoneOffset() * 60000;
          const adjustedDate = new Date(d.getTime() + userTimezoneOffset);
          const dateStr = adjustedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          return { label: dateStr, suffix: isToday ? 'HOJE' : '' };
      } else if (viewMode === 'month') {
          const d = new Date(selectedDate);
          const userTimezoneOffset = d.getTimezoneOffset() * 60000;
          const adjustedDate = new Date(d.getTime() + userTimezoneOffset);
          return { label: adjustedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase(), suffix: '' };
      } else {
          // Semana: Calcula Intervalo
          const curr = new Date(selectedDate + 'T00:00:00Z');
          const day = curr.getUTCDay();
          const diff = curr.getUTCDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(curr);
          monday.setUTCDate(diff);
          const sunday = new Date(monday);
          sunday.setUTCDate(monday.getUTCDate() + 6);

          const fmt = (dt: Date) => {
              const localDt = new Date(dt.getTime() + dt.getTimezoneOffset() * 60000); 
              return localDt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          }
          return { label: `${fmt(monday)} A ${fmt(sunday)}`, suffix: '' };
      }
  };

  // --- RENDERIZADORES DE GRÁFICO ---

  // 1. Gráfico de Polling (Linha/Barra simples) - Modo DIA
  const renderHourlyChart = () => {
    if (!stats?.detalhes_hora) return <div className="text-gray-500 text-xs py-8 text-center flex items-center justify-center gap-2"><BarChart2 size={16}/> Aguardando dados de polling...</div>;

    const labels = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0'));
    const values = Object.values(stats.detalhes_hora) as number[];
    // AJUSTE: Removemos o limite mínimo de 10 para 1. Agora o gráfico sobe proporcionalmente mesmo com poucos dados.
    const maxVal = Math.max(...values, 1);

    return (
      <div className="flex items-end justify-between h-[120px] gap-[2px] mt-4 border-b border-gray-700 pb-2">
        {labels.map(label => {
          const val = stats.detalhes_hora?.[label] || 0;
          const heightPct = (val / maxVal) * 100;
          const isZero = val === 0;
          const showLabel = Number(label) % 3 === 0;

          return (
            <div key={label} className="flex-1 flex flex-col items-center group relative min-w-[3px]">
               {val > 0 && <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-[#690c76] text-white text-[10px] p-1.5 rounded whitespace-nowrap shadow-lg">{label}h: <strong>{val}</strong> reqs</div>}
               <div 
                 className={`w-full rounded-t-sm transition-all duration-500 hover:bg-white ${isZero ? 'bg-gray-800 h-[2px]' : 'bg-gradient-to-t from-[#690c76] to-[#a020f0]'}`}
                 style={{ height: isZero ? '2px' : `${Math.max(heightPct, 5)}%` }}
               ></div>
               {showLabel && <span className="text-[8px] text-gray-500 mt-1">{label}</span>}
            </div>
          );
        })}
      </div>
    );
  };

  // 2. Gráfico de Ações (Stacked Bar) - Modo SEMANA e MÊS
  const renderAggregatedChart = () => {
    if (!stats?.dailyHistory || stats.dailyHistory.length === 0) return <div className="text-gray-500 text-xs py-8 text-center flex items-center justify-center gap-2"><CalendarDays size={16}/> Sem dados históricos no período.</div>;

    let labels: { label: string, fullDate: string }[] = [];

    if (viewMode === 'month') {
         const y = new Date(selectedDate).getFullYear();
         const m = new Date(selectedDate).getMonth();
         const daysInMonth = new Date(y, m + 1, 0).getDate();
         labels = Array.from({length: daysInMonth}, (_, i) => {
             const d = i + 1;
             const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
             return { label: String(d).padStart(2,'0'), fullDate: dateStr };
         });
    } else { // week
         const curr = new Date(selectedDate + 'T00:00:00Z');
         const day = curr.getUTCDay();
         const diff = curr.getUTCDate() - day + (day === 0 ? -6 : 1);
         const monday = new Date(curr);
         monday.setUTCDate(diff);
         
         labels = Array.from({length: 7}, (_, i) => {
             const d = new Date(monday);
             d.setUTCDate(d.getUTCDate() + i);
             const dateStr = d.toISOString().split('T')[0];
             const label = String(d.getUTCDate()).padStart(2, '0');
             return { label, fullDate: dateStr };
         });
    }
    
    // Calcula max para escala
    let maxTotalActions = 0;
    stats.dailyHistory.forEach(day => {
        const total = (day.total_cadastro||0) + (day.total_edicao||0) + (day.total_cancelamento||0) + (day.total_anulacao||0);
        if (total > maxTotalActions) maxTotalActions = total;
    });
    // AJUSTE: Removemos o limite mínimo de 5 para 1. Agora o gráfico sobe proporcionalmente mesmo com poucos dados.
    maxTotalActions = Math.max(maxTotalActions, 1); 

    return (
      <div className="flex items-end justify-between h-[120px] gap-[2px] mt-4 border-b border-gray-700 pb-2">
         {labels.map(item => {
             // Encontra dados do dia
             const dayData = stats.dailyHistory?.find(d => d.data === item.fullDate);
             
             const cad = dayData?.total_cadastro || 0;
             const edit = dayData?.total_edicao || 0;
             const cancel = dayData?.total_cancelamento || 0;
             const anul = dayData?.total_anulacao || 0;
             const total = cad + edit + cancel + anul;

             const showLabel = viewMode === 'week' ? true : (Number(item.label) % 5 === 0 || item.label === '01');

             return (
                 <div key={item.fullDate} className="flex-1 flex flex-col items-center group relative min-w-[5px]">
                     {total > 0 && (
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex z-10 bg-gray-800 text-white text-[10px] p-2 rounded flex-col gap-1 shadow-xl border border-gray-700 min-w-[100px]">
                           <div className="font-bold border-b border-gray-600 pb-1 mb-1">Dia {item.label}</div>
                           <div className="flex justify-between gap-2 text-blue-400"><span>Cadastro:</span> <span>{cad}</span></div>
                           <div className="flex justify-between gap-2 text-orange-400"><span>Edição:</span> <span>{edit}</span></div>
                           <div className="flex justify-between gap-2 text-red-400"><span>Cancel:</span> <span>{cancel}</span></div>
                           <div className="flex justify-between gap-2 text-yellow-400"><span>Anular:</span> <span>{anul}</span></div>
                        </div>
                     )}
                     
                     {/* Stacked Bars */}
                     <div className="w-full flex flex-col-reverse bg-gray-800/30 rounded-t-sm overflow-hidden relative" style={{height: `${(total/maxTotalActions)*100}%`}}>
                         {/* Barra invisível de tamanho mínimo para facilitar o hover em valores baixos */}
                         <div className="absolute w-full h-[10px] bottom-0 z-0 opacity-0 group-hover:opacity-10 bg-white/10 pointer-events-none"></div>

                         {cad > 0 && <div style={{height: `${(cad/total)*100}%`}} className="bg-blue-500 w-full"></div>}
                         {edit > 0 && <div style={{height: `${(edit/total)*100}%`}} className="bg-orange-500 w-full"></div>}
                         {anul > 0 && <div style={{height: `${(anul/total)*100}%`}} className="bg-yellow-500 w-full"></div>}
                         {cancel > 0 && <div style={{height: `${(cancel/total)*100}%`}} className="bg-red-500 w-full"></div>}
                     </div>
                     
                     {/* Se zero */}
                     {total === 0 && <div className="w-full h-[2px] bg-gray-800"></div>}

                     {showLabel && <span className="text-[8px] text-gray-500 mt-1">{item.label}</span>}
                 </div>
             )
         })}
      </div>
    );
  };

  // 3. Card de Breakdown de Ações
  const renderActionBreakdown = () => {
    // Dados para exibir (Dia, Semana ou Mês)
    const d = stats || {} as ExtendedPerformanceLog;
    
    // Calcula valores baseados no histórico diário se estiver em modo agregado,
    // para garantir consistência visual estrita com o gráfico.
    let displayStats = {
      total_cadastro: d.total_cadastro || 0,
      total_edicao: d.total_edicao || 0,
      total_cancelamento: d.total_cancelamento || 0,
      total_anulacao: d.total_anulacao || 0,
      total_login: d.total_login || 0,
      total_logoff: d.total_logoff || 0
    };

    // FIX: Include local buffer if viewing 'day' and today
    // This makes the UI responsive to user actions immediately
    if (viewMode === 'day' && isToday) {
        displayStats.total_cadastro += bufferActions.current.cadastro;
        displayStats.total_edicao += bufferActions.current.edicao;
        displayStats.total_cancelamento += bufferActions.current.cancelamento;
        displayStats.total_anulacao += bufferActions.current.anulacao;
    }

    const actions = [
       { label: 'Cadastros', count: displayStats.total_cadastro, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: PlusCircle },
       { label: 'Edições', count: displayStats.total_edicao, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Edit },
       { label: 'Cancelamentos', count: displayStats.total_cancelamento, color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
       { label: 'Anulações', count: displayStats.total_anulacao, color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: RotateCcw },
       { label: 'Logins', count: displayStats.total_login, color: 'text-green-500', bg: 'bg-green-500/10', icon: LogIn },
       { label: 'Logoffs', count: displayStats.total_logoff, color: 'text-gray-400', bg: 'bg-gray-500/10', icon: LogOut },
    ];

    return (
       <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
          {actions.map((act, i) => (
             <div key={i} className={`flex flex-col items-center justify-center p-3 rounded-xl border border-[#333] ${act.bg}`}>
                <act.icon size={20} className={`mb-1 ${act.color}`} />
                <span className="text-2xl font-bold text-white">{act.count}</span>
                <span className={`text-[10px] uppercase font-bold ${act.color}`}>{act.label}</span>
             </div>
          ))}
       </div>
    );
  };

  if (!hasAccess) return null;

  // Calculos Visuais
  // isToday is already defined at top of component

  const displayReqs = (stats?.total_requisicoes || 0) + (isToday && viewMode === 'day' ? requestCountSession : 0);
  
  // Status do Servidor
  let serverStatus = 'Excelente';
  let statusColor = 'text-green-400';
  if (displayReqs > 500000) { serverStatus = 'Moderado'; statusColor = 'text-yellow-400'; }
  if (displayReqs > 1000000) { serverStatus = 'Crítico'; statusColor = 'text-red-500'; }

  // Deduplicação de Usuários para Exibição
  const uniqueUsers = Array.isArray(stats?.usuarios_unicos) ? [...new Set(stats?.usuarios_unicos)] : [];

  const displayInfo = getDisplayRangeInfo();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9998] flex items-center gap-2 p-3 rounded-full shadow-[0_0_20px_rgba(105,12,118,0.6)] transition-all hover:scale-105 border border-white/20 bg-[#690c76] text-white animate-fadeIn"
      >
        <Activity size={20} />
        <span className="text-xs font-bold hidden md:inline">Gestão de Performance</span>
        {isSyncing && <RefreshCw size={12} className="animate-spin" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fadeIn">
           <div className="bg-[#0f0f0f] text-white w-full max-w-[1100px] h-[95vh] rounded-2xl shadow-2xl border border-[#333] flex flex-col overflow-hidden">
              
              {/* HEADER DE GESTÃO */}
              <div className="p-5 border-b border-[#333] bg-[#141414] flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-[#690c76] to-[#400040] rounded-xl shadow-[0_0_15px_rgba(105,12,118,0.5)]">
                       <Server size={24} className="text-white" />
                    </div>
                    <div>
                       <h2 className="text-xl font-bold tracking-tight text-white">Central de Inteligência <span className="text-[#d63384]">KVM 2</span></h2>
                       <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1 text-green-400"><ShieldCheck size={12} /> Hostinger Protegido</span>
                          <span>|</span>
                          <span className="flex items-center gap-1"><Database size={12} /> {PERFORMANCE_SCHEMA}</span>
                       </div>
                    </div>
                 </div>

                 {/* CONTROLES (DATA E VISUALIZAÇÃO) */}
                 <div className="flex gap-4">
                    {/* Toggle Dia/Semana/Mês */}
                    <div className="bg-[#202020] p-1 rounded-lg border border-[#333] flex items-center">
                        <button 
                            onClick={() => setViewMode('day')}
                            className={`p-2 px-3 rounded-md text-xs font-bold transition-all ${viewMode === 'day' ? 'bg-[#690c76] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            DIA
                        </button>
                        <button 
                            onClick={() => setViewMode('week')}
                            className={`p-2 px-3 rounded-md text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-[#690c76] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            SEMANA
                        </button>
                        <button 
                            onClick={() => setViewMode('month')}
                            className={`p-2 px-3 rounded-md text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-[#690c76] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            MÊS
                        </button>
                    </div>

                    {/* Seletor de Data */}
                    <div className="flex items-center gap-2 bg-[#202020] p-1 rounded-lg border border-[#333]">
                        <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-[#333] rounded-md text-gray-400 hover:text-white transition-colors"><ChevronLeft size={18} /></button>
                        <div className="flex items-center gap-2 px-3 font-mono text-sm font-bold text-gray-200 min-w-[140px] justify-center">
                            {viewMode === 'day' && <CalendarIcon size={14} className="text-[#690c76]" />}
                            {viewMode === 'week' && <CalendarRange size={14} className="text-[#690c76]" />}
                            {viewMode === 'month' && <CalendarDays size={14} className="text-[#690c76]" />}
                            
                            {displayInfo.label}
                            {displayInfo.suffix && <span className="bg-[#690c76] text-[9px] px-1.5 rounded text-white ml-1">{displayInfo.suffix}</span>}
                        </div>
                        <button onClick={() => navigateDate(1)} disabled={isToday && viewMode === 'day'} className={`p-2 rounded-md transition-colors ${isToday && viewMode === 'day' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#333] text-gray-400 hover:text-white'}`}><ChevronRight size={18} /></button>
                    </div>
                 </div>

                 <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-900/20 hover:text-red-500 rounded-full transition-colors">
                    <X size={24} />
                 </button>
              </div>

              {/* BODY SCROLLABLE */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f0f0f] p-6">
                 
                 {loadingStats ? (
                     <div className="flex h-full items-center justify-center text-gray-500 gap-2">
                        <RefreshCw className="animate-spin" /> Carregando dados...
                     </div>
                 ) : (
                    <>
                        {/* ALERTAS */}
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-900/10 border border-red-900/30 rounded-xl text-red-300 flex items-center gap-3 text-sm">
                                <AlertTriangle size={18} /> {errorMsg}
                            </div>
                        )}

                        {/* KPIS PRINCIPAIS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            {/* KPI 1 - REQS OU GRÁFICO DE AÇÕES */}
                            <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-[#333] relative overflow-hidden flex flex-col">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><Activity size={150} /></div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">
                                            {viewMode === 'day' ? 'Carga de Leitura (Polling)' : 'Execuções por Período'}
                                        </h3>
                                        {viewMode === 'day' && (
                                            <div className="text-3xl font-mono font-bold text-white flex items-end gap-2">
                                                {displayReqs.toLocaleString()} 
                                                <span className="text-xs font-normal text-gray-500 mb-1">reqs</span>
                                            </div>
                                        )}
                                    </div>
                                    {viewMode === 'day' && (
                                        <div className={`text-xs px-2 py-1 rounded font-bold border ${statusColor.replace('text', 'border')} bg-black/40 ${statusColor}`}>
                                            {serverStatus}
                                        </div>
                                    )}
                                </div>
                                {/* GRÁFICO DINÂMICO */}
                                <div className="mt-auto">
                                    {viewMode === 'day' ? renderHourlyChart() : renderAggregatedChart()}
                                </div>
                            </div>

                            {/* KPI 2 - N8N */}
                            <div className="p-5 rounded-2xl bg-[#141414] border border-[#333]">
                                <div className="flex items-center gap-2 mb-3 text-blue-400">
                                    <Zap size={18} />
                                    <h3 className="text-xs font-bold uppercase">Escritas (N8N)</h3>
                                </div>
                                <div className="text-3xl font-mono font-bold text-white mb-2">
                                    {(stats?.total_n8n || 0).toLocaleString()}
                                </div>
                                <div className="w-full bg-[#333] h-1.5 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(((stats?.total_n8n || 0) / 5000) * 100, 100)}%` }}></div>
                                </div>
                                <p className="text-[10px] text-gray-500">Capacidade diária recomendada: 5.000 ações</p>
                            </div>

                            {/* KPI 3 - USUÁRIOS */}
                            <div className="p-5 rounded-2xl bg-[#141414] border border-[#333]">
                                <div className="flex items-center gap-2 mb-3 text-[#d63384]">
                                    <Users size={18} />
                                    <h3 className="text-xs font-bold uppercase">Usuários Ativos</h3>
                                </div>
                                <div className="text-3xl font-mono font-bold text-white mb-4">
                                    {uniqueUsers.length}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {uniqueUsers.map((u: string, i: number) => (
                                        <span key={i} className="text-[10px] bg-[#333] text-gray-300 px-2 py-1 rounded border border-[#444] truncate max-w-[80px]" title={u}>
                                            {u.split(' ')[0]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* DETALHAMENTO DE AÇÕES E BANDA */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* BREAKDOWN DE AÇÕES */}
                            <div className="md:col-span-2 bg-[#141414] border border-[#333] rounded-2xl overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                        <List size={16} /> 
                                        {viewMode === 'day' 
                                            ? 'Detalhamento de Execuções' 
                                            : `Detalhamento de Execuções (${displayInfo.label})`
                                        }
                                    </h3>
                                </div>
                                {renderActionBreakdown()}
                            </div>

                            {/* BANDA E UPDATE INFO */}
                            <div className="flex flex-col gap-4">
                                <div className="p-5 rounded-2xl bg-[#141414] border border-[#333] flex-1">
                                    <div className="flex items-center gap-2 mb-2 text-purple-400">
                                        <Database size={18} />
                                        <h3 className="text-xs font-bold uppercase">Tráfego de Rede</h3>
                                    </div>
                                    <div className="text-3xl font-mono font-bold text-white">
                                        {Number(stats?.banda_mb || 0).toFixed(2)} <span className="text-lg text-gray-500">MB</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2">Transferência de dados JSON compactados.</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#141414] border border-[#333] text-xs text-gray-500">
                                    <div className="flex justify-between mb-2">
                                        <span>Última Sincronização:</span>
                                        <span className="text-gray-300">{stats?.ultima_atualizacao ? new Date(stats.ultima_atualizacao).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pendente'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Próximo Sync:</span>
                                        <span className="text-gray-300 flex items-center gap-1">
                                            {isSyncing ? <RefreshCw size={10} className="animate-spin text-green-500" /> : <Clock size={10} />} Auto (30s)
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </>
                 )}
              </div>
           </div>
        </div>
      )}
    </>
  );
};
