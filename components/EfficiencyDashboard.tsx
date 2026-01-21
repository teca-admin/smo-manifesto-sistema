
import React, { useMemo } from 'react';
import { Manifesto } from '../types';
import { BarChart3, Users, Clock, TrendingUp, Award, Timer, Target } from 'lucide-react';

interface EfficiencyDashboardProps {
  manifestos: Manifesto[];
}

export const EfficiencyDashboard: React.FC<EfficiencyDashboardProps> = ({ manifestos }) => {
  
  const parseBRDate = (brStr: string | undefined): Date | null => {
    if (!brStr || brStr === '---' || brStr === '') return null;
    try {
      // Split flexível para aceitar DD/MM/YYYY HH:MM:SS ou variações
      const parts = brStr.split(/[\/\s,:]+/);
      if (parts.length < 5) return null;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const hour = parseInt(parts[3], 10);
      const minute = parseInt(parts[4], 10);
      
      const d = new Date(year, month, day, hour, minute);
      return isNaN(d.getTime()) ? null : d;
    } catch { return null; }
  };

  const formatMinutes = (min: number) => {
    if (min <= 0) return "0m";
    if (min < 60) return `${Math.round(min)}m`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return `${h}h ${m}m`;
  };

  // 1. PRODUTIVIDADE OPERACIONAL (RANKING)
  const stats = useMemo(() => {
    const cadastros: Record<string, number> = {};
    const atribuicoes: Record<string, number> = {};

    manifestos.forEach(m => {
      if (m.status === 'Manifesto Entregue' || m.status === 'Manifesto Finalizado') {
        if (m.usuario) cadastros[m.usuario] = (cadastros[m.usuario] || 0) + 1;
        if (m.usuarioResponsavel) atribuicoes[m.usuarioResponsavel] = (atribuicoes[m.usuarioResponsavel] || 0) + 1;
      }
    });

    return {
      cadastroRank: Object.entries(cadastros).sort((a, b) => b[1] - a[1]).slice(0, 5),
      atribuicaoRank: Object.entries(atribuicoes).sort((a, b) => b[1] - a[1]).slice(0, 5)
    };
  }, [manifestos]);

  // 2. INDICADORES DE TEMPO (SLA MÉDIO)
  const slaStats = useMemo(() => {
    let totalEspera = 0, countEspera = 0; // Recebido -> Iniciado
    let totalPuxada = 0, countPuxada = 0; // Iniciado -> Completo
    let totalLiberacao = 0, countLiberacao = 0; // Completo -> Entregue

    manifestos.forEach(m => {
      const recebido = parseBRDate(m.dataHoraRecebido);
      const iniciado = parseBRDate(m.dataHoraIniciado);
      const completo = parseBRDate(m.dataHoraCompleto);
      const entregue = parseBRDate(m.dataHoraEntregue);

      if (recebido && iniciado) {
        const diff = (iniciado.getTime() - recebido.getTime()) / 60000;
        if (diff > 0) { totalEspera += diff; countEspera++; }
      }
      if (iniciado && completo) {
        const diff = (completo.getTime() - iniciado.getTime()) / 60000;
        if (diff > 0) { totalPuxada += diff; countPuxada++; }
      }
      if (completo && entregue) {
        const diff = (entregue.getTime() - completo.getTime()) / 60000;
        if (diff > 0) { totalLiberacao += diff; countLiberacao++; }
      }
    });

    return {
      avgEspera: countEspera > 0 ? totalEspera / countEspera : 0,
      avgPuxada: countPuxada > 0 ? totalPuxada / countPuxada : 0,
      avgLiberacao: countLiberacao > 0 ? totalLiberacao / countLiberacao : 0
    };
  }, [manifestos]);

  // 3. VOLUME HORA A HORA (Baseado no set atual de dados)
  const hourlyStats = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hours[i] = 0;

    manifestos.forEach(m => {
      // Usamos a data de Recebido para tabular o volume de entrada
      const d = parseBRDate(m.dataHoraRecebido);
      if (d) {
        const hour = d.getHours();
        hours[hour]++;
      }
    });

    return Object.entries(hours).map(([h, count]) => ({ hour: parseInt(h), count }));
  }, [manifestos]);

  // Cálculo proporcional: O topo do gráfico é sempre o maior valor encontrado (pico)
  const maxHourlyCount = useMemo(() => {
    const counts = hourlyStats.map(h => h.count);
    return Math.max(...counts, 1); // Fallback para 1 para evitar divisão por zero
  }, [hourlyStats]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-10">
      
      {/* HEADER EFICIÊNCIA */}
      <div className="bg-[#0f172a] border-2 border-slate-800 p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500 rounded">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">EFICIÊNCIA OPERACIONAL (BI)</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Análise de Desempenho e Lead Time Logístico</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700">
           <Timer size={14} className="text-indigo-400" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sync Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RANKING CADASTRO */}
        <div className="bg-white border-2 border-slate-200 panel-shadow flex flex-col">
          <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
             <Award size={18} className="text-indigo-600" />
             <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Operador de Cadastro</h3>
          </div>
          <div className="p-4 flex-1 space-y-4">
            {stats.cadastroRank.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic text-center py-10">Aguardando dados...</p>
            ) : (
              stats.cadastroRank.map(([name, count], idx) => (
                <div key={name} className="flex items-center justify-between group">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-400 rounded-sm">{idx + 1}</span>
                      <span className="text-[11px] font-black text-slate-600 uppercase truncate max-w-[150px]">{name}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-[12px] font-black text-indigo-600 font-mono-tech">{count}</span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase">Unid</span>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RANKING ATRIBUIÇÃO */}
        <div className="bg-white border-2 border-slate-200 panel-shadow flex flex-col">
          <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
             <Target size={18} className="text-emerald-600" />
             <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Operador Atribuído</h3>
          </div>
          <div className="p-4 flex-1 space-y-4">
            {stats.atribuicaoRank.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic text-center py-10">Aguardando dados...</p>
            ) : (
              stats.atribuicaoRank.map(([name, count], idx) => (
                <div key={name} className="flex items-center justify-between group">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-400 rounded-sm">{idx + 1}</span>
                      <span className="text-[11px] font-black text-slate-600 uppercase truncate max-w-[150px]">{name}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-[12px] font-black text-emerald-600 font-mono-tech">{count}</span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase">Unid</span>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* INDICADORES DE LEAD TIME */}
        <div className="bg-slate-900 border-2 border-slate-800 panel-shadow text-white flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center gap-3">
             <Clock size={18} className="text-indigo-400" />
             <h3 className="text-[11px] font-black uppercase tracking-widest">Métricas de SLA (Lead Time)</h3>
          </div>
          <div className="p-6 space-y-8 flex-1 flex flex-col justify-center">
             <div className="flex items-center justify-between border-l-2 border-blue-500 pl-4">
                <div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Espera p/ Início</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Recebido ➔ Iniciado</p>
                </div>
                <p className="text-xl font-black text-blue-400 font-mono-tech">{formatMinutes(slaStats.avgEspera)}</p>
             </div>
             <div className="flex items-center justify-between border-l-2 border-amber-500 pl-4">
                <div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tempo de Operação</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Iniciado ➔ Completo</p>
                </div>
                <p className="text-xl font-black text-amber-400 font-mono-tech">{formatMinutes(slaStats.avgPuxada)}</p>
             </div>
             <div className="flex items-center justify-between border-l-2 border-emerald-500 pl-4">
                <div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tempo de Liberação</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Completo ➔ Entregue</p>
                </div>
                <p className="text-xl font-black text-emerald-400 font-mono-tech">{formatMinutes(slaStats.avgLiberacao)}</p>
             </div>
          </div>
        </div>

      </div>

      {/* GRÁFICO DE VOLUME HORÁRIO (PROPORCIONAL AO PICO) */}
      <div className="bg-white border-2 border-slate-200 panel-shadow overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <TrendingUp size={18} className="text-slate-600" />
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Fluxo de Recebimento por Hora</h3>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase">
                Amostra: {manifestos.length} Manifestos Analisados
              </span>
           </div>
        </div>
        
        <div className="p-8 pt-12">
           <div className="h-64 flex items-end gap-1.5 md:gap-3 px-4 relative border-b-2 border-slate-100">
              {/* Linhas de Grade de fundo para escala visual */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
                 <div className="border-t border-slate-900 w-full h-px"></div>
                 <div className="border-t border-slate-900 w-full h-px"></div>
                 <div className="border-t border-slate-900 w-full h-px"></div>
              </div>

              {hourlyStats.map(h => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                   {/* Tooltip de valor (Sempre visível se houver valor) */}
                   {h.count > 0 && (
                      <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-300">
                         <span className="text-[11px] font-black text-slate-900 font-mono-tech">{h.count}</span>
                         <div className="w-px h-2 bg-slate-200"></div>
                      </div>
                   )}

                   {/* A Barra Proporcional */}
                   <div 
                      className={`w-full max-w-[32px] transition-all duration-700 ease-out rounded-t-sm shadow-sm ${
                        h.count > 0 ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-slate-50'
                      }`}
                      style={{ height: `${(h.count / maxHourlyCount) * 100}%` }}
                   >
                   </div>

                   {/* Label de Hora */}
                   <span className={`text-[9px] font-black mt-2 font-mono ${h.count > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {String(h.hour).padStart(2, '0')}
                   </span>
                </div>
              ))}
           </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Volume Recebido</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-slate-100 rounded-sm border border-slate-200"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sem Movimentação</span>
              </div>
           </div>
           <p className="text-[9px] font-bold text-slate-400 uppercase italic">
              A escala do gráfico é ajustada automaticamente baseada no pico de {maxHourlyCount} {maxHourlyCount === 1 ? 'manifesto' : 'manifestos'}/hora.
           </p>
        </div>
      </div>

    </div>
  );
};
