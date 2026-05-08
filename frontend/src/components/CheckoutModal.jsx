import { useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft, Loader, MapPin, Store } from 'lucide-react';
import { getApiUrl } from '../config/api';

const FORMAS_PAGAMENTO = [
  { id: 'pix', label: 'Pix', icon: '⚡' },
  { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
  { id: 'credito', label: 'Crédito', icon: '💳' },
  { id: 'debito', label: 'Débito', icon: '🏧' },
];

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
  const [etapa, setEtapa] = useState(1); // 1: resumo, 2: dados, 3: sucesso
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [numeroPedido, setNumeroPedido] = useState('');
  
  const [formData, setFormData] = useState({
    cliente_nome: '',
    cliente_telefone: '',
    cliente_email: '',
    tipo_entrega: 'retirada',
    cliente_endereco: '',
    forma_pagamento: '',
    observacoes: ''
  });

  const [errosValidacao, setErrosValidacao] = useState({});

  const tenantId = localStorage.getItem('currentTenantId') || 'default';

  const formatarTelefone = (valor) => {
    const digits = valor.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const novoValor = name === 'cliente_telefone' ? formatarTelefone(value) : value;
    setFormData(prev => ({ ...prev, [name]: novoValor }));
    if (errosValidacao[name]) {
      setErrosValidacao(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarEtapa2 = () => {
    const erros = {};
    if (!formData.cliente_nome.trim()) erros.cliente_nome = 'Nome é obrigatório';
    const digits = formData.cliente_telefone.replace(/\D/g, '');
    if (!digits) erros.cliente_telefone = 'Telefone é obrigatório';
    else if (digits.length < 10) erros.cliente_telefone = 'Telefone inválido';
    if (formData.cliente_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.cliente_email))
      erros.cliente_email = 'E-mail inválido';
    if (formData.tipo_entrega === 'entrega' && !formData.cliente_endereco.trim())
      erros.cliente_endereco = 'Endereço é obrigatório para entrega';
    if (!formData.forma_pagamento) erros.forma_pagamento = 'Selecione a forma de pagamento';
    setErrosValidacao(erros);
    return Object.keys(erros).length === 0;
  };

  const confirmarPedido = async () => {
    if (!validarEtapa2()) return;
    setLoading(true);
    setErro('');
    try {
      const pedido = { ...formData, items: itens, origem: 'catalogo' };
      const url = slug ? getApiUrl(`catalogo/${slug}/pedidos`) : getApiUrl('catalogo/pedidos');
      const headers = { 'Content-Type': 'application/json' };
      if (!slug) headers['x-tenant-id'] = tenantId;

      const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(pedido) });
      const data = await response.json();

      if (data.success) {
        setNumeroPedido(data.data.numero_pedido);

        // Salvar + abrir WhatsApp se configurado
        if (configuracoes.telefone_whatsapp) {
          const fpNome = { pix: 'Pix', dinheiro: 'Dinheiro', credito: 'Cartão de Crédito', debito: 'Cartão de Débito' };
          let msg = `*Novo Pedido - ${configuracoes.nome_loja}*\n`;
          msg += `*Pedido:* ${data.data.numero_pedido}\n\n`;
          msg += `*Cliente:* ${formData.cliente_nome}\n`;
          msg += `*Telefone:* ${formData.cliente_telefone}\n`;
          if (formData.cliente_email) msg += `*E-mail:* ${formData.cliente_email}\n`;
          msg += `*Entrega:* ${formData.tipo_entrega === 'retirada' ? 'Retirada na loja' : 'Entrega'}\n`;
          if (formData.tipo_entrega === 'entrega') msg += `*Endereço:* ${formData.cliente_endereco}\n`;
          msg += `*Pagamento:* ${fpNome[formData.forma_pagamento]}\n`;
          msg += `\n*Itens:*\n`;
          itens.forEach(item => {
            msg += `• ${item.quantidade}x ${item.nome} (${item.cor} · ${item.tamanho}) — R$ ${(item.quantidade * parseFloat(item.preco_unitario)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
          });
          msg += `\n*Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`;
          if (formData.observacoes) msg += `\n\n*Obs:* ${formData.observacoes}`;
          const tel = configuracoes.telefone_whatsapp.replace(/\D/g, '');
          window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        }

        setEtapa(3);
      } else {
        setErro(data.message || 'Erro ao criar pedido');
      }
    } catch (error) {
      console.error('Erro ao confirmar pedido:', error);
      setErro('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const resetarFormulario = () => {
    setFormData({ cliente_nome: '', cliente_telefone: '', cliente_email: '', tipo_entrega: 'retirada', cliente_endereco: '', forma_pagamento: '', observacoes: '' });
    setErrosValidacao({});
    setEtapa(1);
    setErro('');
    setNumeroPedido('');
  };

  const handleFechar = () => {
    if (loading) return;
    if (etapa === 3) onConcluido();
    resetarFormulario();
    onFechar();
  };

  const getImagemUrl = (item) => {
    if (!item.imagem_url) return null;
    if (item.imagem_url.startsWith('http')) return item.imagem_url;
    return `${getApiUrl('')}${item.imagem_url}`;
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-xl z-10">
          <div className="flex items-center gap-2">
            {etapa === 2 && (
              <button onClick={() => setEtapa(1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold">
              {etapa === 1 ? 'Revisar Pedido' : etapa === 2 ? 'Seus Dados' : 'Pedido Confirmado!'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {etapa < 3 && (
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full transition-colors ${etapa >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
                <div className={`w-8 h-0.5 transition-colors ${etapa >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
                <div className={`w-2 h-2 rounded-full transition-colors ${etapa >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
              </div>
            )}
            <button onClick={handleFechar} disabled={loading} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-5">

          {/* ETAPA 1: Resumo dos produtos */}
          {etapa === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {itens.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    {getImagemUrl(item) ? (
                      <img
                        src={getImagemUrl(item)}
                        alt={item.nome}
                        className="w-16 h-16 object-cover rounded-lg shrink-0 bg-gray-100"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0 flex items-center justify-center text-gray-400 text-xs text-center leading-tight">
                        Sem<br/>foto
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm capitalize truncate">{item.nome}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.cor} · {item.tamanho}</p>
                      <p className="text-xs text-gray-400">{item.quantidade}x R$ {parseFloat(item.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <p className="font-semibold text-sm shrink-0 text-primary">
                      R$ {(item.quantidade * parseFloat(item.preco_unitario)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total</span>
                <span className="text-primary">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <button
                onClick={() => setEtapa(2)}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                Continuar <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* ETAPA 2: Dados + Pagamento */}
          {etapa === 2 && (
            <div className="space-y-4">
              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {erro}
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo <span className="text-red-500">*</span></label>
                <input type="text" name="cliente_nome" value={formData.cliente_nome} onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition ${errosValidacao.cliente_nome ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="João Silva" />
                {errosValidacao.cliente_nome && <p className="text-red-500 text-xs mt-1">{errosValidacao.cliente_nome}</p>}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Telefone <span className="text-red-500">*</span></label>
                <input type="tel" name="cliente_telefone" value={formData.cliente_telefone} onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition ${errosValidacao.cliente_telefone ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="(11) 98765-4321" />
                {errosValidacao.cliente_telefone && <p className="text-red-500 text-xs mt-1">{errosValidacao.cliente_telefone}</p>}
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
                <input type="email" name="cliente_email" value={formData.cliente_email} onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition ${errosValidacao.cliente_email ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="joao@email.com" />
                {errosValidacao.cliente_email && <p className="text-red-500 text-xs mt-1">{errosValidacao.cliente_email}</p>}
              </div>

              {/* Entrega / Retirada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entrega <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipo_entrega: 'retirada', cliente_endereco: '' }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${formData.tipo_entrega === 'retirada' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <Store size={16} /> Retirar na loja
                  </button>
                  <button type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipo_entrega: 'entrega' }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${formData.tipo_entrega === 'entrega' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <MapPin size={16} /> Entrega
                  </button>
                </div>
              </div>

              {/* Endereço da loja (retirada) */}
              {formData.tipo_entrega === 'retirada' && configuracoes.endereco_loja && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                  <MapPin size={15} className="shrink-0 mt-0.5" />
                  <span>{configuracoes.endereco_loja}</span>
                </div>
              )}

              {/* Endereço (só para entrega) */}
              {formData.tipo_entrega === 'entrega' && (
                <div className="space-y-2">
                  {(configuracoes.mensagem_entrega || configuracoes.telefone_whatsapp) && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
                      <span className="shrink-0 mt-0.5">ℹ️</span>
                      <span>{configuracoes.mensagem_entrega || `Consulte o valor da entrega para o seu bairro pelo WhatsApp.`}</span>
                    </div>
                  )}
                  <label className="block text-sm font-medium text-gray-700">Seu endereço <span className="text-red-500">*</span></label>
                  <textarea name="cliente_endereco" value={formData.cliente_endereco} onChange={handleChange} rows={2}
                    className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none ${errosValidacao.cliente_endereco ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Rua, número, bairro, cidade..." />
                  {errosValidacao.cliente_endereco && <p className="text-red-500 text-xs mt-1">{errosValidacao.cliente_endereco}</p>}
                </div>
              )}

              {/* Forma de pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de pagamento <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAS_PAGAMENTO.map(fp => (
                    <button key={fp.id} type="button"
                      onClick={() => { setFormData(prev => ({ ...prev, forma_pagamento: fp.id })); setErrosValidacao(prev => ({ ...prev, forma_pagamento: '' })); }}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${formData.forma_pagamento === fp.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      <span>{fp.icon}</span> {fp.label}
                    </button>
                  ))}
                </div>
                {errosValidacao.forma_pagamento && <p className="text-red-500 text-xs mt-1">{errosValidacao.forma_pagamento}</p>}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
                <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                  placeholder="Alguma informação adicional..." />
              </div>

              <button onClick={confirmarPedido} disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <><Loader size={18} className="animate-spin" /> Confirmando...</>
                ) : (
                  <><Check size={18} /> Confirmar Pedido{configuracoes.telefone_whatsapp ? ' + WhatsApp' : ''}</>
                )}
              </button>
            </div>
          )}

          {/* ETAPA 3: Sucesso */}
          {etapa === 3 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check size={40} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Pedido confirmado!</h3>
                <p className="text-gray-500 text-sm">Pedido <span className="font-semibold text-primary">{numeroPedido}</span> registrado com sucesso.</p>
                {configuracoes.telefone_whatsapp && (
                  <p className="text-gray-400 text-xs mt-2">O WhatsApp da loja foi aberto para finalizar os detalhes.</p>
                )}
              </div>
              <button onClick={handleFechar}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Voltar ao catálogo
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
