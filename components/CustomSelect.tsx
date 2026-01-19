
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { CIAS } from '../types';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  onChange, 
  placeholder = "---",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + window.scrollY, left: rect.left, width: rect.width });
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className={`h-10 px-3 border-2 flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
          disabled 
            ? 'bg-slate-100 text-slate-400 border-slate-200' 
            : isOpen 
              ? 'bg-white border-indigo-600 text-slate-900' 
              : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="uppercase">{value || placeholder}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && createPortal(
        <div 
          className="fixed z-[10050] bg-white border-2 border-slate-800 shadow-2xl overflow-y-auto animate-fadeIn"
          style={{ top: coords.top + 4, left: coords.left, width: coords.width, maxHeight: '240px' }} 
        >
          {CIAS.map(cia => (
            <div 
              key={cia}
              onClick={() => { onChange(cia); setIsOpen(false); }}
              className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${
                value === cia 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cia}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};
