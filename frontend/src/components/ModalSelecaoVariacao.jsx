// Função utilitária para formatar valores monetários no padrão brasileiro
const formatarPreco = (valor) => {
  return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};
import React, { useState } from 'react';
import { X, Package } from 'lucide-react';

const ModalSelecaoVariacao = ({ isOpen, onClose, produto, onConfirmar }) => {
  const [variacaoSelecionada, setVariacaoSelecionada] = useState(null);

  if (!isOpen || !produto) return null;

  const handleConfirmar = () => {
    if (variacaoSelecionada) {
      onConfirmar(variacaoSelecionada);
      setVariacaoSelecionada(null);
      onClose();
    }
  };

  const handleClose = () => {
    setVariacaoSelecionada(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-fadeIn"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">
            Selecione a Variação
          </h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Produto Info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
              {produto.imagem ? (
                <img 
                  src={produto.imagem} 
                  alt={produto.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">{produto.nome}</h4>
              <p className="text-lg font-bold text-primary mt-1">
                {formatarPreco(parseFloat(produto.precoVenda || produto.preco || 0))}
              </p>
            </div>
          </div>

          {/* Variações */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Escolha o tamanho e cor:
            </p>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {produto.variacoes && produto.variacoes.map((variacao) => {
                const quantidade = variacao.estoque?.quantidade ?? 0;
                return (
                <button
                  key={variacao.id}
                  onClick={() => setVariacaoSelecionada(variacao)}
                  disabled={quantidade === 0}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    quantidade === 0
                      ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                      : variacaoSelecionada?.id === variacao.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-primary hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        <span className="text-sm font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                          {variacao.tamanho}
                        </span>
                        <span className="text-sm font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                          {variacao.cor}
                        </span>
                      </div>
                      {variacao.sku && (
                        <span className="text-xs text-slate-500">
                          SKU: {variacao.sku}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${
                        quantidade === 0 
                          ? 'text-red-600' 
                          : quantidade <= 5 
                          ? 'text-orange-600' 
                          : 'text-green-600'
                      }`}>
                        {quantidade === 0 
                          ? 'Esgotado' 
                          : `${quantidade} un.`
                        }
                      </span>
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!variacaoSelecionada}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSelecaoVariacao;
