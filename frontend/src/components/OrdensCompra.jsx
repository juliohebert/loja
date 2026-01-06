// Função utilitária para formatar valores monetários no padrão brasileiro
const formatarPreco = (valor) => {
  return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getAuthHeaders } from '../utils/auth';
import ModalSucesso from './ModalSucesso';
import ModalErro from './ModalErro';
import ModalConfirmacao from './ModalConfirmacao';
import ModalSelecaoVariacao from './ModalSelecaoVariacao';
import { ShoppingCart, Plus, Package, Truck, CheckCircle, XCircle, Eye, Calendar, DollarSign, Trash2 } from 'lucide-react';
import API_URL from '../config/apiUrl';

const OrdensCompra = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  
  const [modalSucesso, setModalSucesso] = useState({ isOpen: false, mensagem: '' });
  const [modalErro, setModalErro] = useState({ isOpen: false, mensagem: '' });
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, mensagem: '', onConfirm: null });
  const [modalProduto, setModalProduto] = useState({ isOpen: false });
  const [pedidoDetalhes, setPedidoDetalhes] = useState(null);
  
  const [formulario, setFormulario] = useState({
    supplierId: '',
    dataPedido: new Date().toISOString().split('T')[0],
    dataPrevisaoEntrega: '',
    observacoes: '',
    formaPagamento: 'dinheiro',
    frete: 0,
    desconto: 0
  });
  
  const [itens, setItens] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    carregarDados();
  }, [navigate]);

  const carregarDados = async () => {
    try {
      const headers = getAuthHeaders();
      
      const [pedidosRes, fornecedoresRes, produtosRes] = await Promise.all([
        fetch(API_URL + '/api/purchase-orders', { headers }),
        fetch(API_URL + '/api/suppliers?ativo=true', { headers }),
        fetch(API_URL + '/api/products', { headers })
      ]);

      const pedidosData = await pedidosRes.json();
      const fornecedoresData = await fornecedoresRes.json();
      const produtosData = await produtosRes.json();

      setPedidos(pedidosData.data || []);
      setFornecedores(fornecedoresData.data || []);
      setProdutos(produtosData.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setModalErro({ isOpen: true, mensagem: 'Erro ao carregar dados' });
    } finally {
      setCarregando(false);
    }
  };

  const handleAdicionarProduto = (produto, variacao) => {
    const itemExistente = itens.find(i => i.variationId === variacao.id);
    
    if (itemExistente) {
      setItens(itens.map(i => 
        i.variationId === variacao.id 
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
      ));
    } else {
      setItens([...itens, {
        productId: produto.id,
        variationId: variacao.id,
        nome: produto.nome,
        tamanho: variacao.tamanho,
        cor: variacao.cor,
        quantidade: 1,
        precoCompra: 0,
        subtotal: 0
      }]);
    }
    setModalProduto({ isOpen: false });
  };

  const handleQuantidadeChange = (variationId, novaQuantidade) => {
    setItens(itens.map(item => {
      if (item.variationId === variationId) {
        const quantidade = Math.max(1, parseInt(novaQuantidade) || 1);
        return {
          ...item,
          quantidade,
          subtotal: quantidade * parseFloat(item.precoCompra || 0)
        };
      }
      return item;
    }));
  };

  const handlePrecoChange = (variationId, novoPreco) => {
    setItens(itens.map(item => {
      if (item.variationId === variationId) {
        const preco = parseFloat(novoPreco) || 0;
        return {
          ...item,
          precoCompra: preco,
          subtotal: item.quantidade * preco
        };
      }
      return item;
    }));
  };

  const handleRemoverItem = (variationId) => {
    setItens(itens.filter(i => i.variationId !== variationId));
  };

  const calcularTotais = () => {
    const subtotal = itens.reduce((acc, item) => acc + item.subtotal, 0);
    const frete = parseFloat(formulario.frete) || 0;
    const desconto = parseFloat(formulario.desconto) || 0;
    const total = subtotal + frete - desconto;
    return { subtotal, frete, desconto, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formulario.supplierId) {
      setModalErro({ isOpen: true, mensagem: 'Selecione um fornecedor' });
      return;
    }
    
    if (itens.length === 0) {
      setModalErro({ isOpen: true, mensagem: 'Adicione pelo menos um produto' });
      return;
    }

    const fornecedor = fornecedores.find(f => f.id === parseInt(formulario.supplierId));
    const dataPrevisao = formulario.dataPrevisaoEntrega || calcularDataPrevisao(fornecedor?.prazoEntregaDias || 0);

    const { subtotal, total } = calcularTotais();
    
    const payload = {
      ...formulario,
      supplierId: parseInt(formulario.supplierId),
      dataPrevisaoEntrega: dataPrevisao,
      itens: itens.map(item => ({
        productId: item.productId,
        variationId: item.variationId,
        quantidade: item.quantidade,
        precoCompra: item.precoCompra
      })),
      subtotal,
      total,
      status: 'pendente'
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_URL + '/api/purchase-orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Falha ao criar pedido');

      setModalSucesso({ isOpen: true, mensagem: 'Pedido criado com sucesso!' });
      limparFormulario();
      setMostrarFormulario(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      setModalErro({ isOpen: true, mensagem: 'Erro ao criar pedido' });
    }
  };

  const calcularDataPrevisao = (diasEntrega) => {
    const data = new Date();
    data.setDate(data.getDate() + diasEntrega);
    return data.toISOString().split('T')[0];
  };

  const handleReceberPedido = (pedido) => {
    setModalConfirmacao({
      isOpen: true,
      mensagem: `Confirmar recebimento do pedido ${pedido.numeroPedido}? O estoque será atualizado automaticamente.`,
      onConfirm: () => confirmarRecebimento(pedido)
    });
  };

  const confirmarRecebimento = async (pedido) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/purchase-orders/${pedido.id}/receive`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dataEntrega: new Date().toISOString().split('T')[0],
          itensRecebidos: pedido.itens.map(item => ({
            variationId: item.variationId,
            quantidadeRecebida: item.quantidade
          }))
        })
      });

      if (!response.ok) throw new Error('Falha ao receber pedido');

      setModalSucesso({ isOpen: true, mensagem: 'Pedido recebido! Estoque atualizado.' });
      carregarDados();
    } catch (error) {
      console.error('Erro ao receber pedido:', error);
      setModalErro({ isOpen: true, mensagem: 'Erro ao receber pedido' });
    }
  };

  const handleCancelarPedido = (pedido) => {
    setModalConfirmacao({
      isOpen: true,
      mensagem: `Deseja cancelar o pedido ${pedido.numeroPedido}?`,
      onConfirm: () => confirmarCancelamento(pedido.id)
    });
  };

  const confirmarCancelamento = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/purchase-orders/${id}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Falha ao cancelar pedido');

      setModalSucesso({ isOpen: true, mensagem: 'Pedido cancelado com sucesso!' });
      carregarDados();
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      setModalErro({ isOpen: true, mensagem: 'Erro ao cancelar pedido' });
    }
  };

  const limparFormulario = () => {
    setFormulario({
      supplierId: '',
      dataPedido: new Date().toISOString().split('T')[0],
      dataPrevisaoEntrega: '',
      observacoes: '',
      formaPagamento: 'dinheiro',
      frete: 0,
      desconto: 0
    });
    setItens([]);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pendente: 'bg-yellow-100 text-yellow-800',
      aprovado: 'bg-blue-100 text-blue-800',
      em_transito: 'bg-purple-100 text-purple-800',
      recebido: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    const labels = {
      pendente: 'Pendente',
      aprovado: 'Aprovado',
      em_transito: 'Em Trânsito',
      recebido: 'Recebido',
      cancelado: 'Cancelado'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const pedidosFiltrados = filtroStatus === 'todos' 
    ? pedidos 
    : pedidos.filter(p => p.status === filtroStatus);

  const { subtotal, frete, desconto, total } = calcularTotais();

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      
      <main className="main-content content-with-hamburger">
        <div className="container-mobile">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Ordens de Compra</h1>
              <p className="text-gray-600">Gestão de pedidos aos fornecedores</p>
            </div>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nova Ordem
            </button>
          </div>

          {mostrarFormulario && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Nova Ordem de Compra</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fornecedor *</label>
                    <select
                      value={formulario.supplierId}
                      onChange={(e) => {
                        const fornecedor = fornecedores.find(f => f.id === parseInt(e.target.value));
                        setFormulario({
                          ...formulario,
                          supplierId: e.target.value,
                          dataPrevisaoEntrega: fornecedor ? calcularDataPrevisao(fornecedor.prazoEntregaDias) : ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione...</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.nomeFantasia || f.nome} {f.prazoEntregaDias > 0 && `(${f.prazoEntregaDias} dias)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data do Pedido</label>
                    <input
                      type="date"
                      value={formulario.dataPedido}
                      onChange={(e) => setFormulario({ ...formulario, dataPedido: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Previsão de Entrega</label>
                    <input
                      type="date"
                      value={formulario.dataPrevisaoEntrega}
                      onChange={(e) => setFormulario({ ...formulario, dataPrevisaoEntrega: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                    <select
                      value={formulario.formaPagamento}
                      onChange={(e) => setFormulario({ ...formulario, formaPagamento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="boleto">Boleto</option>
                      <option value="transferencia">Transferência</option>
                      <option value="cartao">Cartão</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-semibold text-gray-700">Produtos</h3>
                    <button
                      type="button"
                      onClick={() => setModalProduto({ isOpen: true })}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Produto
                    </button>
                  </div>

                  {itens.length > 0 ? (
                    <div className="space-y-2">
                      {itens.map((item) => (
                        <div key={item.variationId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.nome}</p>
                            <p className="text-sm text-gray-600">
                              {item.tamanho} - {item.cor}
                            </p>
                          </div>
                          <input
                            type="number"
                            value={item.quantidade}
                            onChange={(e) => handleQuantidadeChange(item.variationId, e.target.value)}
                            min="1"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            placeholder="Qtd"
                          />
                          <span className="text-gray-600">×</span>
                          <input
                            type="number"
                            value={item.precoCompra}
                            onChange={(e) => handlePrecoChange(item.variationId, e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-28 px-2 py-1 border border-gray-300 rounded"
                            placeholder="R$ 0,00"
                          />
                          <span className="text-gray-600">=</span>
                          <span className="font-semibold text-gray-900 w-28 text-right">
                            {formatarPreco(item.subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoverItem(item.variationId)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">Nenhum produto adicionado</p>
                  )}
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Frete</label>
                      <input
                        type="number"
                        value={formulario.frete}
                        onChange={(e) => setFormulario({ ...formulario, frete: e.target.value })}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Desconto</label>
                      <input
                        type="number"
                        value={formulario.desconto}
                        onChange={(e) => setFormulario({ ...formulario, desconto: e.target.value })}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal:</span>
                      <span>{formatarPreco(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Frete:</span>
                      <span>{formatarPreco(frete)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Desconto:</span>
                      <span>- {formatarPreco(desconto)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                      <span>Total:</span>
                      <span>{formatarPreco(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                  <textarea
                    value={formulario.observacoes}
                    onChange={(e) => setFormulario({ ...formulario, observacoes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      limparFormulario();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Criar Pedido
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filtros */}
          <div className="flex gap-2 mb-6">
            {['todos', 'pendente', 'em_transito', 'recebido', 'cancelado'].map(status => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filtroStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status === 'todos' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Lista de Pedidos */}
          {carregando ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando pedidos...</p>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-500">Crie sua primeira ordem de compra</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pedidosFiltrados.map((pedido) => (
                <div key={pedido.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{pedido.numeroPedido}</h3>
                        {getStatusBadge(pedido.status)}
                      </div>
                      <p className="text-gray-600">{pedido.fornecedor?.nomeFantasia || pedido.fornecedor?.nome}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatarPreco(parseFloat(pedido.total))}</p>
                      <p className="text-sm text-gray-500">{pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Data do Pedido</p>
                      <p className="font-medium text-gray-900">
                        {new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Previsão de Entrega</p>
                      <p className="font-medium text-gray-900">
                        {pedido.dataPrevisaoEntrega ? new Date(pedido.dataPrevisaoEntrega).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pagamento</p>
                      <p className="font-medium text-gray-900 capitalize">{pedido.formaPagamento}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end border-t pt-4">
                    <button
                      onClick={() => setPedidoDetalhes(pedido)}
                      className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                      Detalhes
                    </button>
                    {pedido.status !== 'recebido' && pedido.status !== 'cancelado' && (
                      <>
                        <button
                          onClick={() => handleReceberPedido(pedido)}
                          className="flex items-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Receber
                        </button>
                        <button
                          onClick={() => handleCancelarPedido(pedido)}
                          className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Detalhes */}
      {pedidoDetalhes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{pedidoDetalhes.numeroPedido}</h2>
                <button
                  onClick={() => setPedidoDetalhes(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Produtos</h3>
                <div className="space-y-2">
                  {pedidoDetalhes.itens.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.productId}</p>
                        <p className="text-sm text-gray-600">Qtd: {item.quantidade}</p>
                      </div>
                      <p className="font-semibold">{formatarPreco(item.quantidade * item.precoCompra)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {pedidoDetalhes.observacoes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Observações</h3>
                  <p className="text-gray-700">{pedidoDetalhes.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ModalSelecaoVariacao
        isOpen={modalProduto.isOpen}
        onClose={() => setModalProduto({ isOpen: false })}
        produtos={produtos}
        onConfirmar={handleAdicionarProduto}
      />

      <ModalSucesso
        isOpen={modalSucesso.isOpen}
        onClose={() => setModalSucesso({ isOpen: false, mensagem: '' })}
        mensagem={modalSucesso.mensagem}
      />
      <ModalErro
        isOpen={modalErro.isOpen}
        onClose={() => setModalErro({ isOpen: false, mensagem: '' })}
        mensagem={modalErro.mensagem}
      />
      <ModalConfirmacao
        isOpen={modalConfirmacao.isOpen}
        onClose={() => setModalConfirmacao({ isOpen: false, mensagem: '', onConfirm: null })}
        onConfirm={() => {
          modalConfirmacao.onConfirm();
          setModalConfirmacao({ isOpen: false, mensagem: '', onConfirm: null });
        }}
        mensagem={modalConfirmacao.mensagem}
      />
    </div>
  );
};

export default OrdensCompra;
