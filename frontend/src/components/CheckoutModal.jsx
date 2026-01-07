import { useState } from 'react';
import { X, Check, MessageCircle, Save, Loader } from 'lucide-react';
import { getApiUrl } from '../config/api';

const CheckoutModal = ({ 
  aberto, 
  onFechar, 
  itens, 
  subtotal, 
  desconto, 
  total,
  configuracoes,
  onConcluido,
  slug
}) => {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [numeroPedido, setNumeroPedido] = useState('');
  
  const [formData, setFormData] = useState({
    cliente_nome: '',
    cliente_telefone: '',
    cliente_email: '',
    cliente_endereco: '',
    observacoes: ''
  });

  const [errosValidacao, setErrosValidacao] = useState({});

  const tenantId = localStorage.getItem('currentTenantId') || 'default';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpar erro do campo ao digitar
    if (errosValidacao[name]) {
      setErrosValidacao(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const erros = {};
    
    if (!formData.cliente_nome.trim()) {
      erros.cliente_nome = 'Nome é obrigatório';
    }
    
    if (!formData.cliente_telefone.trim()) {
      erros.cliente_telefone = 'Telefone é obrigatório';
    } else if (!/^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/.test(formData.cliente_telefone.replace(/\s/g, ''))) {
      erros.cliente_telefone = 'Telefone inválido';
    }
    
    if (formData.cliente_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.cliente_email)) {
      erros.cliente_email = 'E-mail inválido';
    }
    
    setErrosValidacao(erros);
    return Object.keys(erros).length === 0;
  };

  const salvarPedido = async () => {
    if (!validarFormulario()) return;
    
    setLoading(true);
    setErro('');
    
    try {
      const pedido = {
        ...formData,
        items: itens,
        origem: 'catalogo'
      };

      // Se tem slug, usar endpoint específico do slug, senão usar x-tenant-id
      const url = slug 
        ? getApiUrl(`catalogo/${slug}/pedidos`)
        : getApiUrl('catalogo/pedidos');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Só adiciona x-tenant-id se NÃO tiver slug
      if (!slug) {
        headers['x-tenant-id'] = tenantId;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(pedido)
      });

      const data = await response.json();
      
      if (data.success) {
        setNumeroPedido(data.data.numero_pedido);
        setSucesso(true);
        setTimeout(() => {
          onConcluido();
          resetarFormulario();
        }, 3000);
      } else {
        setErro(data.message || 'Erro ao criar pedido');
      }
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      setErro('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const enviarWhatsApp = () => {
    if (!validarFormulario()) return;
    
    if (!configuracoes.telefone_whatsapp) {
      setErro('WhatsApp não configurado');
      return;
    }

    // Montar mensagem
    let mensagem = `*Novo Pedido - ${configuracoes.nome_loja}*\n\n`;
    mensagem += `*Cliente:* ${formData.cliente_nome}\n`;
    mensagem += `*Telefone:* ${formData.cliente_telefone}\n`;
    
    if (formData.cliente_email) {
      mensagem += `*E-mail:* ${formData.cliente_email}\n`;
    }
    
    if (formData.cliente_endereco) {
      mensagem += `*Endereço:* ${formData.cliente_endereco}\n`;
    }
    
    mensagem += `\n*Itens do Pedido:*\n`;
    
    itens.forEach(item => {
      mensagem += `\n• ${item.nome}\n`;
      mensagem += `  Cor: ${item.cor} | Tamanho: ${item.tamanho}\n`;
      mensagem += `  Qtd: ${item.quantidade} x R$ ${parseFloat(item.preco_unitario).toFixed(2)}\n`;
      mensagem += `  Subtotal: R$ ${(item.quantidade * parseFloat(item.preco_unitario)).toFixed(2)}\n`;
    });
    
    mensagem += `\n*Total: R$ ${total.toFixed(2)}*`;
    
    if (formData.observacoes) {
      mensagem += `\n\n*Observações:* ${formData.observacoes}`;
    }

    // Abrir WhatsApp
    const telefone = configuracoes.telefone_whatsapp.replace(/\D/g, '');
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
    
    // Fechar modal após um delay
    setTimeout(() => {
      onConcluido();
      resetarFormulario();
    }, 1000);
  };

  const resetarFormulario = () => {
    setFormData({
      cliente_nome: '',
      cliente_telefone: '',
      cliente_email: '',
      cliente_endereco: '',
      observacoes: ''
    });
    setErrosValidacao({});
    setSucesso(false);
    setErro('');
    setNumeroPedido('');
  };

  const handleFechar = () => {
    if (!loading) {
      resetarFormulario();
      onFechar();
    }
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {sucesso ? (
          // Tela de Sucesso
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pedido realizado com sucesso!
            </h2>
            <p className="text-gray-600 mb-4">
              Seu pedido <span className="font-semibold text-primary">{numeroPedido}</span> foi registrado.
            </p>
            <p className="text-sm text-gray-500">
              Entraremos em contato em breve para confirmar o pedido.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">Finalizar Pedido</h2>
              <button
                onClick={handleFechar}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Erro */}
              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {erro}
                </div>
              )}

              {/* Resumo do Pedido */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Resumo do Pedido</h3>
                <div className="space-y-2 text-sm">
                  {itens.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-gray-600">
                        {item.quantidade}x {item.nome} ({item.cor} - {item.tamanho})
                      </span>
                      <span className="font-medium">
                        R$ {(item.quantidade * parseFloat(item.preco_unitario)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Formulário */}
              <div className="space-y-4">
                <h3 className="font-semibold">Seus Dados</h3>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="cliente_nome"
                    value={formData.cliente_nome}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errosValidacao.cliente_nome ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="João Silva"
                  />
                  {errosValidacao.cliente_nome && (
                    <p className="text-red-500 text-sm mt-1">{errosValidacao.cliente_nome}</p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="cliente_telefone"
                    value={formData.cliente_telefone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errosValidacao.cliente_telefone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(11) 98765-4321"
                  />
                  {errosValidacao.cliente_telefone && (
                    <p className="text-red-500 text-sm mt-1">{errosValidacao.cliente_telefone}</p>
                  )}
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    name="cliente_email"
                    value={formData.cliente_email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errosValidacao.cliente_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="joao@email.com"
                  />
                  {errosValidacao.cliente_email && (
                    <p className="text-red-500 text-sm mt-1">{errosValidacao.cliente_email}</p>
                  )}
                </div>

                {/* Endereço */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço de entrega (opcional)
                  </label>
                  <textarea
                    name="cliente_endereco"
                    value={formData.cliente_endereco}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Rua, número, bairro, cidade..."
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações (opcional)
                  </label>
                  <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Alguma informação adicional..."
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={salvarPedido}
                  disabled={loading}
                  className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Salvar Pedido
                    </>
                  )}
                </button>

                {configuracoes.telefone_whatsapp && (
                  <button
                    onClick={enviarWhatsApp}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <MessageCircle size={20} />
                    Enviar WhatsApp
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">
                {configuracoes.telefone_whatsapp 
                  ? 'Você pode salvar o pedido no sistema ou enviar direto pelo WhatsApp'
                  : 'Seus dados serão salvos de forma segura'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
