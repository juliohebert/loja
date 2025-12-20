import React, { useState, useRef, useEffect } from 'react';

/**
 * CustomSelect - Dropdown estilizado para seleção de itens
 * Props:
 * - options: [{ value, label }]
 * - value: valor selecionado
 * - onChange: função chamada ao selecionar
 * - placeholder: texto quando nada selecionado
 * - disabled: desabilita o select
 */
const CustomSelect = ({ options, value, onChange, placeholder = 'Selecione...', disabled = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(opt => opt.value === value);

  return (
    <div ref={ref} className={`relative w-full ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <button
        type="button"
        className={`flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${open ? 'ring-2 ring-primary/50' : ''}`}
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
      >
        <span className={selected ? '' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`w-5 h-5 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg animate-fadeIn">
          {options.length === 0 && (
            <li className="px-4 py-3 text-slate-400 text-base">Nenhum item encontrado</li>
          )}
          {options.map(opt => (
            <li
              key={opt.value}
              className={`px-4 py-3 cursor-pointer text-base hover:bg-primary/10 hover:text-primary transition-colors ${value === opt.value ? 'bg-primary/10 text-primary font-bold' : 'text-slate-800'}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
