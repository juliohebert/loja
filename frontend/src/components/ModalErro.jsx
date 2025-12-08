import React from 'react';
import Modal from './Modal';

const ModalErro = ({ 
  isOpen, 
  onClose, 
  titulo, 
  mensagem, 
  textoBotao = 'Tentar Novamente',
  onRetry 
}) => {
  const handleClick = () => {
    if (onRetry) {
      onRetry();
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center justify-center p-8 text-center sm:p-10">
        {/* Ícone de Erro */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6 animate-shake">
          <svg 
            className="w-12 h-12 text-red-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        {/* Título e Mensagem */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <h2 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">
            {titulo || 'Ocorreu um Erro!'}
          </h2>
          {mensagem && (
            <p className="text-sm text-slate-600 max-w-xs">
              {mensagem}
            </p>
          )}
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {onRetry && (
            <button 
              onClick={onClose}
              className="flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-slate-200 text-slate-900 text-base font-bold leading-normal tracking-wide transition-all hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 active:scale-95"
            >
              <span className="truncate">Cancelar</span>
            </button>
          )}
          <button 
            onClick={handleClick}
            className="flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-red-600 text-white text-base font-bold leading-normal tracking-wide transition-all hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-95"
          >
            <span className="truncate">{textoBotao}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalErro;
