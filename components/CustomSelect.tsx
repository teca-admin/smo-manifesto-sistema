
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
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
  placeholder = "Selecione",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      
      setCoords({
        top: rect.bottom + scrollY + 5,
        left: rect.left + scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (e: Event) => {
       if (isOpen && popoverRef.current && e.target instanceof Node && popoverRef.current.contains(e.target)) return;
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
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className={`
          flex items-center justify-between w-full p-[10px_12px] border-2 rounded-[8px] text-[13px] bg-white transition-all cursor-pointer
          ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'hover:border-[#690c76]'}
          ${isOpen ? 'border-[#690c76] shadow-[0_0_0_3px_rgba(105,12,118,0.1)]' : 'border-[#e0e0e0]'}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`${value ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 ml-2">
           {value && !disabled && (
             <X 
               size={14} 
               className="text-gray-400 hover:text-[#dc3545] cursor-pointer" 
               onClick={(e) => { e.stopPropagation(); onChange(''); }}
             />
           )}
           <ChevronDown size={16} className={`text-[#690c76] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && createPortal(
        <div 
          ref={popoverRef}
          className="absolute z-[10050] bg-white border border-gray-200 rounded-[8px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden animate-slideIn-novo flex flex-col"
          style={{ top: coords.top, left: coords.left, width: coords.width, maxHeight: '200px' }} 
        >
           <div className="overflow-y-auto custom-scrollbar p-1">
              {CIAS.map(cia => (
                 <div 
                    key={cia}
                    onClick={() => { onChange(cia); setIsOpen(false); }}
                    className={`
                       p-[10px_12px] text-[13px] rounded-[6px] cursor-pointer transition-colors mb-1 last:mb-0
                       ${value === cia ? 'bg-[#690c76] text-white font-semibold' : 'text-gray-700 hover:bg-gray-100'}
                    `}
                 >
                    {cia}
                 </div>
              ))}
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};
