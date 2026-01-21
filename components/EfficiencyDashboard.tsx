
import React, { useMemo, useState } from 'react';
import { Manifesto } from '../types';
import { BarChart3, Clock, TrendingUp, Award, Timer, Target, Calendar, Filter } from 'lucide-react';
import { CustomDateTimePicker } from './CustomDateTimePicker';

interface EfficiencyDashboardProps {
  manifestos: Manifesto[];
}

export const EfficiencyDashboard: React.FC<EfficiencyDashboardProps> = ({ manifestos }) => {
  // CONFIGURAÇÃO DE DATAS PADRÃO (HOJE)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
  });

  // LÓGICA DE PARSING: Robusta para ISO e BR
  const parseAnyDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr || dateStr === '---' || dateStr === '') return null;
    
    try {
      const directDate = new Date(dateStr);
      if (!isNaN(directDate.getTime())) return directDate;

      const parts = dateStr.split(/[\/\s,:]+/);
      if (parts.length >= 5) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const hour = parseInt(parts[3], 10);
        const minute = parseInt(parts[4], 10);
        const d = new Date(year, month, day, hour, minute);
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    } catch { return null; }
  };

  // FILTRAGEM DOS MANIFESTOS PELO PERÍODO SELECIONADO
  const filteredManifestos = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    return manifestos.filter(m => {
      // Consideramos a data de Recebido ou Puxado como referência para o período
      const mDate = parseAnyDate(m.dataHoraRecebido) || parseAnyDate(m.dataHoraPuxado);
      if (!mDate) return false;
      return mDate >= start && mDate <= end;
    });
  }, [manifestos, dateRange]);

  const formatMinutes = (min: number) => {
    if (min <= 0) return "0m";
    if (min < 60) return `${Math.round(min)}m`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return `${h}h ${m}m`;
  };

  // 1. PRODUTIVIDADE OPERACIONAL (RANKING) - BASEADO NO FILTRO
  const stats = useMemo(() => {
    const cadastros: Record<string, number> = {};
    const atribuicoes: Record<string, number> = {};
    filteredManifestos.forEach(m => {
      if (m.status === 'Manifesto Entregue' || m.status === 'Manifesto Finalizado') {
        if (m.usuario) cadastros[m.usuario] = (cadastros[m.usuario] || 0) + 1;
        if (m.usuarioResponsavel) atribuicoes[m.usuarioResponsavel] = (atribuicoes[m.usuarioResponsavel] || 0) + 1;
      }
    });
    return {
      cadastroRank: Object.entries(cadastros).sort((a, b) => b[1] - a[1]).slice(0, 10),
      atribuicaoRank: Object.entries(atribuicoes).sort((a, b) => b[1] - a[1]).slice(0, 10)
    };
  }, [filteredManifestos]);

  // 2. INDICADORES DE TEMPO (SLA MÉDIO) - BASEADO NO FILTRO
  const slaStats = useMemo(() => {
    let totalEspera = 0, countEspera = 0;
    let totalPuxada = 0, countPuxada = 0;
    let totalLiberacao = 0, countLiberacao = 0;
    filteredManifestos.forEach(m => {
      const recebido = parseAnyDate(m.dataHoraRecebido);
      const iniciado = parseAnyDate(m.dataHoraIniciado);
      const completo = parseAnyDate(m.dataHoraCompleto);
      const entregue = parseAnyDate(m.dataHoraEntregue);
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
  }, [filteredManifestos]);

  // 3. VOLUME HORA A HORA - BASEADO NO FILTRO
  const hourlyStats = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hours[i] = 0;
    
    filteredManifestos.forEach(m => {
      const d = parseAnyDate(m.dataHoraRecebido) || parseAnyDate(m.dataHoraPuxado);
      if (d) {
        const hour = d.getHours();
        hours[hour]++;
      }
    });
    return Object.entries(hours).map(([h, count]) => ({ hour: parseInt(h), count }));
  }, [filteredManifestos]);

  const maxHourlyCount = useMemo(() => {
    const counts = hourlyStats.map(h => h.count);
    return Math.max(...counts, 1);
  }, [hourlyStats]);

  return (
    <div className="flex flex-col gap-4 animate-fadeIn h-[calc(100vh-140px)] overflow-hidden">
      
      {/* HEADER FIXO COM FILTRO DE DATA */}
      <div className="bg-[#0f172a] border-2 border-slate-800 p-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-500 rounded">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">EFICIÊNCIA OPERACIONAL</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Analytics Dashboard v2.5</p>
          </div>
        </div>

        {/* ÁREA DE FILTROS SINALIZADA */}
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 border border-slate-700">
              <div className="flex flex-col">
                 <label className="text-[7px] font-black text-slate-500 uppercase ml-1 mb-0.5 tracking-widest">Data Início</label>
                 <div className="w-36">
                    <CustomDateTimePicker 
                      value={dateRange.start} 
                      onChange={(val) => setDateRange(prev => ({ ...prev, start: val }))} 
                    />
                 </div>
              </div>
              <div className="w-px h-6 bg-slate-700 mx-1 self-end mb-1"></div>
              <div className="flex flex-col">
                 <label className="text-[7px] font-black text-slate-500 uppercase ml-1 mb-0.5 tracking-widest">Data Fim</label>
                 <div className="w-36">
                    <CustomDateTimePicker 
                      value={dateRange.end} 
                      onChange={(val) => setDateRange(prev => ({ ...prev, end: val }))} 
                    />
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700">
              <Timer size={14} className="text-indigo-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Sync</span>
           </div>
        </div>
      </div>

      {/* GRUPO SUPERIOR (RANKINGS E SLA) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-2 border-b bg-slate-50 flex items-center gap-2 shrink-0">
             <Award size={14} className="text-indigo-600" />
             <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Ranking Cadastro</h3>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-start space-y-2.5 overflow-y-auto custom-scrollbar">
            {stats.cadastroRank.length === 0 ? (
              <div className="flex flex-col items-center py-10 opacity-30">
                <p className="text-[10px] text-slate-400 font-black uppercase italic">Sem Cargas No Período</p>
              </div>
            ) : (
              stats.cadastroRank.map(([name, count], idx) => (
                <div key={name} className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black w-4.5 h-4.5 flex items-center justify-center bg-slate-100 text-slate-400 rounded-sm">{idx + 1}</span>
                      <span className="text-[10px] font-black text-slate-600 uppercase truncate max-w-[140px]">{name}</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-indigo-600 font-mono-tech">{count}</span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase">UN</span>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-2 border-b bg-slate-50 flex items-center gap-2 shrink-0">
             <Target size={14} className="text-emerald-600" />
             <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Ranking Atribuição</h3>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-start space-y-2.5 overflow-y-auto custom-scrollbar">
            {stats.atribuicaoRank.length === 0 ? (
              <div className="flex flex-col items-center py-10 opacity-30">
                <p className="text-[10px] text-slate-400 font-black uppercase italic">Sem Registros Atribuídos</p>
              </div>
            ) : (
              stats.atribuicaoRank.map(([name, count], idx) => (
                <div key={name} className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black w-4.5 h-4.5 flex items-center justify-center bg-slate-100 text-slate-400 rounded-sm">{idx + 1}</span>
                      <span className="text-[10px] font-black text-slate-600 uppercase truncate max-w-[140px]">{name}</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-emerald-600 font-mono-tech">{count}</span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase">UN</span>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 border-2 border-slate-800 shadow-sm text-white flex flex-col justify-start p-6 h-full space-y-6">
           <div className="flex items-center justify-between border-l-2 border-blue-500 pl-4">
              <div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SLA Médio Espera</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Rec ➔ Ini</p>
              </div>
              <p className="text-xl font-black text-blue-400 font-mono-tech leading-none">{formatMinutes(slaStats.avgEspera)}</p>
           </div>
           <div className="flex items-center justify-between border-l-2 border-amber-500 pl-4">
              <div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SLA Médio Puxe</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Ini ➔ Com</p>
              </div>
              <p className="text-xl font-black text-amber-400 font-mono-tech leading-none">{formatMinutes(slaStats.avgPuxada)}</p>
           </div>
           <div className="flex items-center justify-between border-l-2 border-emerald-500 pl-4">
              <div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SLA Médio Entrega</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Com ➔ Ent</p>
              </div>
              <p className="text-xl font-black text-emerald-400 font-mono-tech leading-none">{formatMinutes(slaStats.avgLiberacao)}</p>
           </div>
        </div>
      </div>

      {/* GRUPO INFERIOR (FLUXO HORÁRIO) */}
      <div className="bg-white border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-3 border-b bg-slate-50 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-slate-600" />
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Fluxo de Recebimento Horário</h3>
           </div>
           <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 uppercase">
             {filteredManifestos.length} Manifestos no Período
           </span>
        </div>
        
        <div className="flex-1 flex flex-col justify-end p-4 px-10 min-h-0 pt-10">
           <div className="flex-1 flex items-end gap-1 px-2 relative border-b-2 border-slate-100 w-full mb-2">
              {hourlyStats.map(h => (
                <div key={h.hour} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                   <div 
                      className="relative w-full max-w-[28px] flex flex-col items-center" 
                      style={{ height: `${(h.count / maxHourlyCount) * 70}%` }}
                   >
                      {h.count > 0 && (
                        <span className="absolute -top-6 text-[10px] font-black text-slate-900 font-mono-tech whitespace-nowrap">
                          {h.count}
                        </span>
                      )}
                      <div 
                        className={`w-full h-full transition-all duration-700 ease-out rounded-t-sm shadow-sm ${
                          h.count > 0 ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-slate-50'
                        }`}
                      ></div>
                   </div>
                   <span className={`text-[10px] font-black font-mono leading-none mt-1.5 ${h.count > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {String(h.hour).padStart(2, '0')}
                   </span>
                </div>
              ))}
           </div>
        </div>

        <div className="p-3 bg-slate-50 border-t flex items-center justify-between px-6 shrink-0">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Volume Operacional</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 bg-slate-100 rounded-sm border border-slate-200"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Sem Registro</span>
              </div>
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-tighter">
              Amostra baseada em pico de {maxHourlyCount} manifestos/h no período.
           </p>
        </div>
      </div>

    </div>
  );
};
