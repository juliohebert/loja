import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ isOpen, onClose, tipo = 'sucesso', mensagem, duracao = 3000 }) => {
  useEffect(() => {
    if (isOpen && duracao > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duracao);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duracao, onClose]);

  if (!isOpen) return null;

  const tipoConfig = {
    sucesso: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      progress: 'bg-green-500'
    },
    erro: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      progress: 'bg-red-500'
    },
    aviso: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      progress: 'bg-yellow-500'
    }
  };

  const config = tipoConfig[tipo] || tipoConfig.sucesso;

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slideInRight">
      <div className={`${config.bg} ${config.border} border rounded-lg shadow-lg overflow-hidden min-w-[320px] max-w-md`}>
        <div className="p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${config.text}`}>
              {mensagem}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${config.text} hover:opacity-70 transition-opacity`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {duracao > 0 && (
          <div className="h-1 bg-gray-200">
            <div 
              className={`h-full ${config.progress} animate-shrink`}
              style={{ animationDuration: `${duracao}ms` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;
