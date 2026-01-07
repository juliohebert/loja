import { useState } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import CheckoutModal from './CheckoutModal';

const CarrinhoCompras = ({ 
  aberto, 
  onFechar, 
  itens, 
  onRemoverItem, 
  onAtualizarQuantidade,
  configuracoes 
}) => {
  const [checkoutAberto, setCheckoutAberto] = useState(false);

  // Calcular totais
  const subtotal = itens.reduce((acc, item) => 
    acc + (parseFloat(item.preco_unitario) * item.quantidade), 0
  );
  
  const desconto = 0; // Pode ser implementado depois
  const total = subtotal - desconto;

  const handleFinalizarCompra = () => {
    if (itens.length === 0) return;
    setCheckoutAberto(true);
  };

  const handleCheckoutConcluido = () => {
    setCheckoutAberto(false);
    onFechar();
  };

  if (!aberto) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onFechar}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingBag size={24} />
            Carrinho
            {itens.length > 0 && (
              <span className="text-sm text-gray-500">
                ({itens.reduce((acc, item) => acc + item.quantidade, 0)} itens)
              </span>
            )}
          </h2>
          <button
            onClick={onFechar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-4">
          {itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingBag size={64} className="mb-4 opacity-50" />
              <p className="text-lg">Seu carrinho está vazio</p>
              <p className="text-sm mt-2">Adicione produtos para continuar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {itens.map((item, index) => (
                <ItemCarrinho
                  key={index}
                  item={item}
                  onRemover={() => onRemoverItem(index)}
                  onAtualizarQuantidade={(novaQuantidade) => 
                    onAtualizarQuantidade(index, novaQuantidade)
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer - Resumo e Ações */}
        {itens.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Resumo de Valores */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-gray-600">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              
              {desconto > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Desconto</span>
                  <span>- R$ {desconto.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xl font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botão Finalizar */}
            <button
              onClick={handleFinalizarCompra}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>

      {/* Modal de Checkout */}
      <CheckoutModal
        aberto={checkoutAberto}
        onFechar={() => setCheckoutAberto(false)}
        itens={itens}
        subtotal={subtotal}
        desconto={desconto}
        total={total}
        configuracoes={configuracoes}
        onConcluido={handleCheckoutConcluido}
      />
    </>
  );
};

// Componente de Item do Carrinho
const ItemCarrinho = ({ item, onRemover, onAtualizarQuantidade }) => {
  const totalItem = parseFloat(item.preco_unitario) * item.quantidade;

  return (
    <div className="flex gap-3 bg-gray-50 p-3 rounded-lg">
      {/* Imagem */}
      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
        {item.imagem_url ? (
          <img
            src={item.imagem_url}
            alt={item.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingBag size={24} />
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{item.nome}</h3>
        <p className="text-sm text-gray-600">
          {item.cor} - {item.tamanho}
        </p>
        {item.marca && (
          <p className="text-xs text-gray-500">{item.marca}</p>
        )}
        
        <div className="flex items-center justify-between mt-2">
          {/* Controles de Quantidade */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg">
            <button
              onClick={() => onAtualizarQuantidade(item.quantidade - 1)}
              className="p-1 hover:bg-gray-100 rounded-l-lg transition-colors"
            >
              <Minus size={16} />
            </button>
            
            <span className="px-3 font-medium">{item.quantidade}</span>
            
            <button
              onClick={() => onAtualizarQuantidade(item.quantidade + 1)}
              className="p-1 hover:bg-gray-100 rounded-r-lg transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Preço */}
          <div className="text-right">
            <p className="font-semibold text-primary">
              R$ {totalItem.toFixed(2)}
            </p>
            {item.quantidade > 1 && (
              <p className="text-xs text-gray-500">
                R$ {parseFloat(item.preco_unitario).toFixed(2)} cada
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botão Remover */}
      <button
        onClick={onRemover}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
        title="Remover item"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default CarrinhoCompras;
