import React, { useState } from 'react';

/**
 * Componente de Imagem com Fallback
 * 
 * Exibe imagens do Cloudinary com fallback automático para backup
 * caso a imagem principal não carregue.
 * 
 * Props:
 * - src: URL da imagem principal (Cloudinary)
 * - backup: URL/base64 da imagem backup (thumbnail do banco)
 * - alt: Texto alternativo
 * - className: Classes CSS
 */
export default function ImageWithFallback({ src, backup, alt = 'Imagem do produto', className = '' }) {
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [backupFalhou, setBackupFalhou] = useState(false);

  const handleError = () => {
    if (!imagemFalhou && backup) {
      // Primeira tentativa falhou, usar backup
      console.warn('⚠️ Imagem do Cloudinary falhou, usando backup:', src);
      setImagemFalhou(true);
    } else if (imagemFalhou && !backupFalhou) {
      // Backup também falhou
      console.error('❌ Backup também falhou');
      setBackupFalhou(true);
    }
  };

  // Se ambos falharam, mostrar placeholder
  if (backupFalhou || (!src && !backup)) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
        <div className="text-center p-4">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Imagem indisponível</p>
        </div>
      </div>
    );
  }

  // Determinar qual imagem usar
  const imagemAtual = imagemFalhou && backup ? backup : src;

  return (
    <div className="relative">
      <img 
        src={imagemAtual}
        alt={alt}
        className={className}
        onError={handleError}
        loading="lazy"
      />
      {/* Badge indicando que está usando backup */}
      {imagemFalhou && backup && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
          Modo backup
        </div>
      )}
    </div>
  );
}
