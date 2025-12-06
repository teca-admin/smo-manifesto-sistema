import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, Clock } from 'lucide-react';

interface CustomDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "dd/mm/aaaa --:--",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); // For navigation
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [inputValue, setInputValue] = useState(""); // State for manual input
  
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Generate stable IDs for the time lists so scroll buttons always work
  const hoursListId = useMemo(() => `hours-list-${Math.random().toString(36).substr(2, 9)}`, []);
  const minutesListId = useMemo(() => `minutes-list-${Math.random().toString(36).substr(2, 9)}`, []);

  // Helper to format Date to dd/mm/yyyy hh:mm
  const formatDateDisplay = (date: Date | null) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Initialize from props
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setViewDate(d);
        setInputValue(formatDateDisplay(d));
      } else {
        setInputValue("");
      }
    } else {
      setSelectedDate(null);
      setInputValue("");
    }
  }, [value]);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      
      // Fix: 'zoom' does not exist on type 'CSSStyleDeclaration'. Cast to any.
      const zoom = parseFloat((window.getComputedStyle(document.body) as any).zoom) || 1;

      setCoords({
        top: (rect.bottom + scrollY) / zoom + 5,
        left: (rect.left + scrollX) / zoom
      });
    }
  }, [isOpen]);

  // Handle outside click & scroll/resize interactions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside input container AND outside popover
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // On click outside, validate what was typed
        validateInput();
      }
    };

    const handleScrollOrResize = (e: Event) => {
      // Check if the scroll event target is within the popover (e.g. scrolling time list)
      if (isOpen && popoverRef.current && e.target instanceof Node && popoverRef.current.contains(e.target)) {
        return;
      }
      // If it's a window resize or a scroll outside, close it
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, inputValue]);

  const updateParent = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const isoString = `${year}-${month}-${day}T${hours}:${minutes}`;
    onChange(isoString);
    setInputValue(formatDateDisplay(date));
  };

  // --- MANUAL INPUT HANDLING ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Simple Masking Logic for dd/mm/yyyy hh:mm
    const digits = val.replace(/\D/g, '');
    let formatted = "";
    if (digits.length > 0) formatted += digits.substring(0, 2);
    if (digits.length >= 3) formatted += '/' + digits.substring(2, 4);
    if (digits.length >= 5) formatted += '/' + digits.substring(4, 8);
    if (digits.length >= 9) formatted += ' ' + digits.substring(8, 10);
    if (digits.length >= 11) formatted += ':' + digits.substring(10, 12);

    setInputValue(formatted);

    // Real-time parsing if complete
    if (formatted.length === 16) {
      const parts = formatted.split(/[\/\s:]/); // Split by / space :
      if (parts.length === 5) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const h = parseInt(parts[3], 10);
        const min = parseInt(parts[4], 10);
        
        const dateObj = new Date(y, m, d, h, min);
        // Basic check if valid date
        if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() === y && dateObj.getMonth() === m) {
           setSelectedDate(dateObj);
           setViewDate(dateObj);
           const year = dateObj.getFullYear();
           const month = String(dateObj.getMonth() + 1).padStart(2, '0');
           const day = String(dateObj.getDate()).padStart(2, '0');
           const hours = String(dateObj.getHours()).padStart(2, '0');
           const minutes = String(dateObj.getMinutes()).padStart(2, '0');
           onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
        }
      }
    }
  };

  const validateInput = () => {
    if (!inputValue.trim()) {
      clearDate();
      return;
    }
    
    const parts = inputValue.split(/[\/\s:]/);
    let valid = false;
    if (parts.length === 5) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const h = parseInt(parts[3], 10);
      const min = parseInt(parts[4], 10);
      
      const dateObj = new Date(y, m, d, h, min);
      if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() === y) {
        valid = true;
        setSelectedDate(dateObj);
        updateParent(dateObj);
      }
    }

    if (!valid) {
      if (selectedDate) {
        setInputValue(formatDateDisplay(selectedDate));
      } else {
        setInputValue("");
        onChange("");
      }
    }
  };

  const handleInputBlur = () => {
    validateInput();
  };

  // --- CALENDAR LOGIC ---

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (selectedDate) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    } else {
      const now = new Date();
      newDate.setHours(now.getHours());
      newDate.setMinutes(now.getMinutes());
    }
    setSelectedDate(newDate);
    updateParent(newDate);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: number) => {
    let newDate = selectedDate ? new Date(selectedDate) : new Date();
    if (!selectedDate) {
       newDate.setFullYear(viewDate.getFullYear());
       newDate.setMonth(viewDate.getMonth());
       newDate.setDate(new Date().getDate()); 
    }
    if (type === 'hours') newDate.setHours(val);
    else newDate.setMinutes(val);
    setSelectedDate(newDate);
    updateParent(newDate);
  };

  const setToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setViewDate(now);
    updateParent(now);
    setIsOpen(false);
  };

  const clearDate = () => {
    setSelectedDate(null);
    setInputValue("");
    onChange("");
    setIsOpen(false);
  };

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const scrollList = (id: string, amount: number) => {
    const el = document.getElementById(id);
    if(el) el.scrollBy({ top: amount, behavior: 'smooth' });
  };

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); 
  
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Area with Manual Input */}
      <div 
        className={`
          flex items-center justify-between w-full p-[8px_12px] border-2 rounded-[8px] text-[13px] bg-white transition-all
          ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'hover:border-[#690c76]'}
          ${isOpen ? 'border-[#690c76] shadow-[0_0_0_3px_rgba(105,12,118,0.1)]' : 'border-[#e0e0e0]'}
        `}
        onClick={() => {
           if (!disabled && !isOpen) {
             setIsOpen(true);
             setTimeout(() => inputRef.current?.focus(), 50);
           }
        }}
      >
        <input 
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 w-full bg-transparent border-none outline-none text-gray-900 font-medium placeholder-gray-400 text-[13px]"
          maxLength={16}
        />
        
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 ml-2">
           {inputValue && !disabled && (
             <X 
               size={14} 
               className="text-gray-400 hover:text-[#dc3545] cursor-pointer" 
               onClick={(e) => { e.stopPropagation(); clearDate(); }}
             />
           )}
           <CalendarIcon size={14} className="text-[#690c76] cursor-pointer" onClick={(e) => {
             e.stopPropagation();
             if(!disabled) setIsOpen(!isOpen);
           }} />
        </div>
      </div>

      {/* Popover via Portal */}
      {isOpen && createPortal(
        <div 
          ref={popoverRef}
          className="absolute z-[10050] bg-white border border-gray-200 rounded-[12px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-0 w-[320px] flex overflow-hidden animate-slideIn-novo"
          style={{ top: coords.top, left: coords.left, height: '320px' }} 
        >
          {/* Calendar Section */}
          <div className="flex-1 p-4 border-r border-gray-200 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 text-gray-900 shrink-0">
              <span className="font-bold capitalize text-sm">
                {months[viewDate.getMonth()]} de {viewDate.getFullYear()}
              </span>
              <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft size={16} /></button>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2 shrink-0">
              {['D','S','T','Q','Q','S','S'].map(d => (
                <div key={d} className="text-center text-[10px] text-gray-500 font-bold">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1 overflow-y-auto custom-scrollbar content-start">
              {days.map((day, idx) => (
                <div key={idx} className="aspect-square flex items-center justify-center">
                  {day ? (
                    <button
                      onClick={() => handleDayClick(day)}
                      className={`
                        w-8 h-8 rounded text-[13px] flex items-center justify-center transition-all
                        ${selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getFullYear() === viewDate.getFullYear()
                          ? 'bg-[#0d6efd] text-white font-bold shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      {day}
                    </button>
                  ) : <div />}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-auto pt-3 border-t border-gray-200 shrink-0">
              <button onClick={clearDate} className="text-[12px] text-gray-500 hover:text-gray-800">Limpar</button>
              <button onClick={setToday} className="text-[12px] text-[#0d6efd] font-bold hover:text-[#3d8bfd]">Hoje</button>
            </div>
          </div>

          {/* Time Section */}
          <div className="w-[90px] bg-gray-50 flex flex-col h-full shrink-0">
            <div className="p-2 text-center border-b border-gray-200 shrink-0">
              <Clock size={16} className="text-gray-400 mx-auto mb-1" />
              <div className="text-[10px] text-gray-500">Hora</div>
            </div>
            
            <div className="flex justify-around border-b border-gray-200 py-1 shrink-0 bg-gray-50">
              <button onClick={() => scrollList(hoursListId, -40)} className="p-1 hover:bg-gray-200 rounded"><ChevronUp size={14} className="text-gray-500 hover:text-gray-800"/></button>
              <button onClick={() => scrollList(minutesListId, -40)} className="p-1 hover:bg-gray-200 rounded"><ChevronUp size={14} className="text-gray-500 hover:text-gray-800"/></button>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
               <div id={hoursListId} className="flex-1 overflow-y-auto custom-scrollbar border-r border-gray-200 scroll-smooth">
                  <div className="py-1">
                    {Array.from({length: 24}).map((_, h) => (
                      <button 
                          key={h}
                          onClick={() => handleTimeChange('hours', h)}
                          className={`w-full py-2 text-[12px] text-center hover:bg-gray-200 ${selectedDate?.getHours() === h ? 'bg-[#0d6efd] text-white font-bold' : 'text-gray-500'}`}
                      >
                          {String(h).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
               </div>
               <div id={minutesListId} className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                  <div className="py-1">
                    {Array.from({length: 12}).map((_, i) => {
                      const m = i * 5; 
                      return (
                      <button 
                          key={m}
                          onClick={() => handleTimeChange('minutes', m)}
                          className={`w-full py-2 text-[12px] text-center hover:bg-gray-200 ${selectedDate && Math.abs(selectedDate.getMinutes() - m) < 5 ? 'bg-[#0d6efd] text-white font-bold' : 'text-gray-500'}`}
                      >
                          {String(m).padStart(2, '0')}
                      </button>
                    )})}
                  </div>
               </div>
            </div>

            <div className="flex justify-around border-t border-gray-200 py-1 shrink-0 bg-gray-50">
               <button onClick={() => scrollList(hoursListId, 40)} className="p-1 hover:bg-gray-200 rounded"><ChevronDown size={14} className="text-gray-500 hover:text-gray-800"/></button>
               <button onClick={() => scrollList(minutesListId, 40)} className="p-1 hover:bg-gray-200 rounded"><ChevronDown size={14} className="text-gray-500 hover:text-gray-800"/></button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};