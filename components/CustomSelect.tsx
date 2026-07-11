import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icon';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
    value, 
    onChange, 
    options, 
    placeholder = 'Select...', 
    className = '' 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const selectedOption = options.find(opt => opt.value === value);

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 4, 
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleToggle = () => {
        const nextState = !isOpen;
        if (nextState) {
            updateCoords();
        }
        setIsOpen(nextState);
    };

    useEffect(() => {
        const handleResize = () => setIsOpen(false);
        const handleScroll = (event: Event) => {
            const target = event.target as Node;
            if (dropdownRef.current && dropdownRef.current.contains(target)) {
                return;
            }
            setIsOpen(false);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true); 
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isInsideContainer = containerRef.current && containerRef.current.contains(target);
            const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);

            if (!isInsideContainer && !isInsideDropdown) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const dropdownContent = (
        <div 
            ref={dropdownRef}
            style={{ 
                position: 'absolute',
                top: coords.top, 
                left: coords.left, 
                width: coords.width,
                zIndex: 9999 
            }}
            className="max-h-[240px] overflow-y-auto bg-[#1a1825] border border-white/10 rounded-lg shadow-xl shadow-black/80 animate-in fade-in zoom-in-95 duration-100"
        >
            <div className="py-1">
                <button
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-purple-600/20 hover:text-purple-300 block truncate ${value === '' ? 'bg-purple-600/10 text-purple-300 font-medium' : 'text-slate-300'}`}
                    onClick={() => {
                        onChange('');
                        setIsOpen(false);
                    }}
                >
                    {placeholder}
                </button>

                {options.map((opt) => (
                    <button
                        key={opt.value}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-purple-600/20 hover:text-purple-300 block truncate ${value === opt.value ? 'bg-purple-600/10 text-purple-300 font-medium' : 'text-slate-300'}`}
                        onClick={() => {
                            onChange(opt.value);
                            setIsOpen(false);
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className={`relative flex-shrink-0 ${className}`} ref={containerRef}>
            <button
                className="w-full flex items-center justify-between bg-[#1a1825] text-slate-200 text-sm py-2 px-3 rounded-lg border border-white/10 outline-none hover:border-purple-500/50 focus:border-purple-500 transition-colors"
                onClick={handleToggle}
            >
                <span className="truncate mr-2 text-left flex-1 block">
                    {selectedOption ? selectedOption.label : value || placeholder}
                </span>
                <Icons.ChevronLeft size={16} className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
            </button>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
};