
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react';

interface CustomDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ 
  value, 
  onChange, 
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Sincroniza valor externo (ISO string) com o input visual
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
        const datePart = d.toLocaleDateString('pt-BR');
        const timePart = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        setInputValue(`${datePart} ${timePart}`);
      }
    } else {
      setInputValue("");
      setSelectedDate(null);
    }
  }, [value]);

  // Calcula posição do popover (Portal)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + window.scrollY, left: rect.left });
    }
  }, [isOpen]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  // Função para processar entrada manual
  const handleManualInput = (val: string) => {
    setInputValue(val);

    // Regex para validar formato DD/MM/AAAA HH:MM
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})$/;
    const match = val.match(regex);

    if (match) {
      const [_, day, month, year, hour, minute] = match;
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
        setViewDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
        onChange(parsedDate.toISOString());
      }
    }
  };

  const handleDateSelect = (day: number) => {
    const newDate = selectedDate ? new Date(selectedDate) : new Date();
    newDate.setFullYear(viewDate.getFullYear());
    newDate.setMonth(viewDate.getMonth());
    newDate.setDate(day);
    setSelectedDate(newDate);
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: number) => {
    const newDate = selectedDate ? new Date(selectedDate) : new Date();
    if (type === 'hour') newDate.setHours(val);
    else newDate.setMinutes(val);
    setSelectedDate(newDate);
    onChange(newDate.toISOString());
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-8"></div>);

    for (let d = 1; d <= totalDays; d++) {
      const isSelected = selectedDate?.getDate() === d && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
      const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
      
      days.push(
        <button
          key={d}
          onClick={() => handleDateSelect(d)}
          className={`h-8 w-full text-[10px] font-bold flex items-center justify-center transition-all border ${
            isSelected 
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md z-10' 
              : isToday
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => handleManualInput(e.target.value)}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder="DD/MM/AAAA HH:MM"
          disabled={disabled}
          className={`w-full h-10 pl-3 pr-10 border-2 text-xs font-bold transition-all outline-none ${
            disabled 
              ? 'bg-slate-100 text-slate-400 border-slate-200' 
              : isOpen 
                ? 'bg-white border-indigo-600 text-slate-900' 
                : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 focus:bg-white focus:border-indigo-600'
          }`}
        />
        <CalendarIcon 
          size={14} 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${isOpen ? 'text-indigo-600' : 'text-slate-400'}`} 
        />
      </div>

      {isOpen && createPortal(
        <div 
          className="fixed z-[10050] bg-white border-2 border-slate-800 shadow-2xl flex flex-col w-[280px] animate-fadeIn"
          style={{ top: coords.top + 4, left: coords.left }}
        >
          {/* Header Calendário */}
          <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-[10px] font-black uppercase tracking-widest">
              {months[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Grid de Dias */}
          <div className="p-3">
            <div className="grid grid-cols-7 mb-1">
              {['D','S','T','Q','Q','S','S'].map(d => (
                <div key={d} className="text-[8px] font-black text-slate-400 text-center uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100">
              {renderCalendar()}
            </div>
          </div>

          {/* Seletor de Hora */}
          <div className="border-t border-slate-100 p-3 bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={12} className="text-slate-400" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Ajuste de Horário</span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase mb-1">Hora</span>
                <div className="flex flex-col w-full border border-slate-200 bg-white rounded overflow-hidden">
                  <div className="h-20 overflow-y-auto custom-scrollbar flex flex-col items-center">
                    {Array.from({length: 24}, (_, i) => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => handleTimeChange('hour', i)}
                        className={`w-full py-1 text-[11px] font-bold transition-colors ${selectedDate?.getHours() === i ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {String(i).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-slate-300 font-bold mt-4">:</div>

              <div className="flex-1 flex flex-col items-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase mb-1">Minuto</span>
                <div className="flex flex-col w-full border border-slate-200 bg-white rounded overflow-hidden">
                  <div className="h-20 overflow-y-auto custom-scrollbar flex flex-col items-center">
                    {Array.from({length: 60}, (_, i) => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => handleTimeChange('minute', i)}
                        className={`w-full py-1 text-[11px] font-bold transition-colors ${selectedDate?.getMinutes() === i ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {String(i).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-indigo-600 text-white p-2 h-10 w-10 flex items-center justify-center rounded shadow-lg hover:bg-indigo-700 transition-all self-end"
              >
                <Check size={18} />
              </button>
            </div>
          </div>
          
          <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
        </div>,
        document.body
      )}
    </div>
  );
};
