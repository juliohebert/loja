import React from 'react';
import Modal from './Modal';

const ModalConfirmacao = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  titulo, 
  mensagem, 
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  tipo = 'warning' // 'warning', 'danger', 'info'
}) => {
  const tipoConfig = {
    warning: {
      bgIcon: 'bg-yellow-100',
      colorIcon: 'text-yellow-500',
      bgBotao: 'bg-yellow-600 hover:bg-yellow-700',
      ringBotao: 'focus:ring-yellow-500'
    },
    danger: {
      bgIcon: 'bg-red-100',
      colorIcon: 'text-red-500',
      bgBotao: 'bg-red-600 hover:bg-red-700',
      ringBotao: 'focus:ring-red-500'
    },
    info: {
      bgIcon: 'bg-blue-100',
      colorIcon: 'text-blue-500',
      bgBotao: 'bg-blue-600 hover:bg-blue-700',
      ringBotao: 'focus:ring-blue-500'
    },
    success: {
      bgIcon: 'bg-green-100',
      colorIcon: 'text-green-500',
      bgBotao: 'bg-green-600 hover:bg-green-700',
      ringBotao: 'focus:ring-green-500'
    }
  };

  const config = tipoConfig[tipo] || tipoConfig.warning;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center justify-center p-8 text-center sm:p-10">
        {/* Ícone */}
        <div className={`flex h-20 w-20 items-center justify-center rounded-full ${config.bgIcon} mb-6`}>
          {tipo === 'danger' && (
            <svg 
              className={`w-12 h-12 ${config.colorIcon}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
              />
            </svg>
          )}
          {tipo === 'warning' && (
            <svg 
              className={`w-12 h-12 ${config.colorIcon}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          )}
          {tipo === 'info' && (
            <svg 
              className={`w-12 h-12 ${config.colorIcon}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          )}
          {tipo === 'success' && (
            <svg 
              className={`w-12 h-12 ${config.colorIcon}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          )}
        </div>

        {/* Título e Mensagem */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <h2 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">
            {titulo}
          </h2>
          {mensagem && (
            <p className="text-sm text-slate-600 max-w-xs">
              {mensagem}
            </p>
          )}
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button 
            onClick={onClose}
            className="flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-slate-200 text-slate-900 text-base font-bold leading-normal tracking-wide transition-all hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 active:scale-95"
          >
            <span className="truncate">{textoBotaoCancelar}</span>
          </button>
          <button 
            onClick={handleConfirm}
            className={`flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 ${config.bgBotao} text-white text-base font-bold leading-normal tracking-wide transition-all focus:outline-none focus:ring-2 ${config.ringBotao} focus:ring-offset-2 active:scale-95`}
          >
            <span className="truncate">{textoBotaoConfirmar}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalConfirmacao;
