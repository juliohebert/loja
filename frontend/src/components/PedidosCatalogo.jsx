import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Edit2, X, Package, TrendingUp, Calendar, ShoppingBag, ChevronDown, ChevronRight, MessageCircle } from 'lucide-react';
import { getAuthHeaders, getApiUrl } from '../config/api';
import Sidebar from './Sidebar';

const PedidosCatalogo = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState(null);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  
  // Filtros
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [origemFiltro, setOrigemFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pedidosExpandidos, setPedidosExpandidos] = useState([]);

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'novo', label: 'Novo', color: 'blue' },
    { value: 'processando', label: 'Processando', color: 'yellow' },
    { value: 'separacao', label: 'Em Separação', color: 'purple' },
    { value: 'enviado', label: 'Enviado', color: 'indigo' },
    { value: 'entregue', label: 'Entregue', color: 'green' },
    { value: 'cancelado', label: 'Cancelado', color: 'red' }
  ];

  const origemOptions = [
    { value: '', label: 'Todas as origens' },
    { value: 'catalogo', label: 'Catálogo Online' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'loja_fisica', label: 'Loja Física' }
  ];

  // Carregar pedidos
  useEffect(() => {
    carregarPedidos();
  }, [statusFiltro, origemFiltro, dataInicio, dataFim, busca, pagina]);

  // Carregar estatísticas
  useEffect(() => {
    carregarEstatisticas();
  }, [dataInicio, dataFim]);

  const carregarPedidos = async () => {
    console.log('🔍 Carregando pedidos...');
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limite: '20',
        pagina: pagina.toString()
      });
      
      if (busca) params.append('busca', busca);
      if (statusFiltro) params.append('status', statusFiltro);
      if (origemFiltro) params.append('origem', origemFiltro);
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);

      const response = await fetch(
        `${getApiUrl('pedidos-catalogo')}?${params}`,
        { headers: getAuthHeaders() }
      );
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Data received:', data);
      
      if (data.success) {
        setPedidos(data.data);
        setTotalPaginas(data.pagination.total_paginas);
        console.log('✅ Pedidos carregados:', data.data.length);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);

      const response = await fetch(
        `${getApiUrl('pedidos-catalogo/estatisticas')}?${params}`,
        { headers: getAuthHeaders() }
      );
      
      const data = await response.json();
      if (data.success) {
        setEstatisticas(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const atualizarStatusPedido = async (pedidoId, novoStatus, observacoes = '', pedidoCompleto = null) => {
    try {
      // Se está aceitando o pedido (novo -> processando), redirecionar para PDV com os itens
      if (novoStatus === 'processando') {
        const pedidoParaConverter = pedidoCompleto || pedidos.find(p => p.id === pedidoId);
        if (pedidoParaConverter) {
          abrirPDVComPedido(pedidoParaConverter, pedidoId, observacoes);
          return;
        }
      }

      const response = await fetch(
        getApiUrl(`pedidos-catalogo/${pedidoId}/status`),
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: novoStatus, observacoes })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        carregarPedidos();
        carregarEstatisticas();
        if (pedidoSelecionado?.id === pedidoId) {
          setPedidoSelecionado(data.data);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido.');
    }
  };

  const abrirPDVComPedido = async (pedido, pedidoId, observacoes = '') => {
    try {
      // Preparar itens no formato do PDV
      const itensPDV = pedido.items.map(item => ({
        id: item.produto_id,
        variacaoId: item.variacao_id,
        nome: item.nome,
        cor: item.cor,
        tamanho: item.tamanho,
        quantidade: item.quantidade,
        preco: parseFloat(item.preco_unitario),
        subtotal: item.quantidade * parseFloat(item.preco_unitario),
        imagem: item.imagem_url || null
      }));

      // Atualizar status do pedido para "processando"
      const response = await fetch(
        getApiUrl(`pedidos-catalogo/${pedidoId}/status`),
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: 'processando', observacoes })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        // Armazenar dados no sessionStorage para o PDV
        sessionStorage.setItem('pedidoCatalogoItens', JSON.stringify(itensPDV));
        sessionStorage.setItem('pedidoCatalogoInfo', JSON.stringify({
          cliente_nome: pedido.cliente_nome,
          cliente_telefone: pedido.cliente_telefone,
          numero_pedido: pedido.numero_pedido,
          observacoes: pedido.observacoes || ''
        }));
        
        // Redirecionar para o PDV
        navigate('/vendas');
      }
    } catch (error) {
      console.error('Erro ao abrir PDV:', error);
      alert('Erro ao abrir PDV com o pedido.');
    }
  };

  const visualizarDetalhes = async (pedido) => {
    setPedidoSelecionado(pedido);
    setModalDetalhes(true);
  };

  const limparFiltros = () => {
    setBusca('');
    setStatusFiltro('');
    setOrigemFiltro('');
    setDataInicio('');
    setDataFim('');
    setPagina(1);
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.color || 'gray';
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.label || status;
  };

  const abrirWhatsApp = (telefone, nomePedido, numeroPedido) => {
    // Limpar formatação do telefone (remover espaços, parênteses, hífens)
    const telefoneFormatado = telefone.replace(/\D/g, '');
    
    // Adicionar código do Brasil se não tiver
    const telefoneCompleto = telefoneFormatado.startsWith('55') 
      ? telefoneFormatado 
      : `55${telefoneFormatado}`;
    
    // Mensagem padrão
    const mensagem = encodeURIComponent(
      `Olá ${nomePedido}! Aqui é da loja. Estou entrando em contato sobre o seu pedido #${numeroPedido}.`
    );
    
    // Abrir WhatsApp em nova aba
    window.open(`https://wa.me/${telefoneCompleto}?text=${mensagem}`, '_blank');
  };

  const togglePedidoExpandido = (pedidoId) => {
    setPedidosExpandidos(prev => 
      prev.includes(pedidoId) 
        ? prev.filter(id => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  console.log('🎨 Renderizando PedidosCatalogo', { loading, pedidos: pedidos.length, estatisticas });

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <main className="main-content">
        <div className="p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pedidos do Catálogo</h1>
              <p className="text-gray-600 mt-1">Gerencie as solicitações de compra recebidas</p>
            </div>
          </div>

        {/* Estatísticas */}
        {estatisticas && estatisticas.por_status && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Pedidos</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.total_pedidos || 0}</p>
                </div>
                <ShoppingBag className="text-primary" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {(estatisticas.valor_total || 0).toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="text-green-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {(estatisticas.ticket_medio || 0).toFixed(2)}
                  </p>
                </div>
                <Package className="text-blue-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Novos Pedidos</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {estatisticas.por_status?.novo || 0}
                  </p>
                </div>
                <Calendar className="text-yellow-600" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Busca */}
            <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por número, cliente ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Origem */}
          <div>
            <select
              value={origemFiltro}
              onChange={(e) => setOrigemFiltro(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {origemOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Data Início */}
          <div>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {(busca || statusFiltro || origemFiltro || dataInicio || dataFim) && (
          <button
            onClick={limparFiltros}
            className="mt-4 text-sm text-gray-600 hover:text-primary flex items-center gap-2"
          >
            <X size={16} />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum pedido encontrado</p>
            <p className="text-sm mt-2">Os pedidos do catálogo aparecerão aqui</p>
          </div>
        ) : (
          <>
            {/* Versão Desktop - Tabela */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Origem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidos.map(pedido => {
                    const isExpanded = pedidosExpandidos.includes(pedido.id);
                    return (
                      <React.Fragment key={pedido.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <button
                              onClick={() => togglePedidoExpandido(pedido.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title={isExpanded ? 'Ocultar itens' : 'Ver itens'}
                            >
                              {isExpanded ? (
                                <ChevronDown size={18} className="text-gray-600" />
                              ) : (
                                <ChevronRight size={18} className="text-gray-600" />
                              )}
                            </button>
                          </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-primary">
                          {pedido.numero_pedido}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{pedido.cliente_nome}</p>
                          <p className="text-sm text-gray-500">{pedido.cliente_telefone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${getStatusColor(pedido.status)}-100 text-${getStatusColor(pedido.status)}-800`}>
                          {getStatusLabel(pedido.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {pedido.origem === 'catalogo' && 'Catálogo Online'}
                        {pedido.origem === 'whatsapp' && 'WhatsApp'}
                        {pedido.origem === 'loja_fisica' && 'Loja Física'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        R$ {parseFloat(pedido.valor_total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          {pedido.status === 'novo' && (
                            <button
                              onClick={() => atualizarStatusPedido(pedido.id, 'processando', 'Pedido aceito pela loja', pedido)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                              title="Aceitar Pedido e Criar Venda"
                            >
                              Aceitar
                            </button>
                          )}
                          {pedido.status === 'processando' && (
                            <button
                              onClick={() => abrirPDVComPedido(pedido, pedido.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center gap-1"
                              title="Finalizar no PDV"
                            >
                              <ShoppingBag size={14} />
                              PDV
                            </button>
                          )}
                          <button
                            onClick={() => abrirWhatsApp(pedido.cliente_telefone, pedido.cliente_nome, pedido.numero_pedido)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle size={18} />
                          </button>
                          <button
                            onClick={() => visualizarDetalhes(pedido)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Ver Detalhes"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Linha expandida com os itens */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan="8" className="px-6 py-4">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-gray-700 mb-3">Itens do Pedido:</h4>
                            <div className="grid gap-3">
                              {pedido.items.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm">
                                  {item.imagem_url && (
                                    <img
                                      src={item.imagem_url}
                                      alt={item.nome}
                                      className="w-16 h-16 object-cover rounded border"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{item.nome}</p>
                                    <div className="flex gap-3 text-sm text-gray-600 mt-1">
                                      <span className="flex items-center gap-1">
                                        <span className="font-medium">Cor:</span> {item.cor}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <span className="font-medium">Tamanho:</span> {item.tamanho}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <span className="font-medium">Qtd:</span> {item.quantidade}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-600">
                                      R$ {parseFloat(item.preco_unitario).toFixed(2)} un.
                                    </p>
                                    <p className="font-semibold text-primary">
                                      R$ {(item.quantidade * parseFloat(item.preco_unitario)).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t">
                              <span className="text-sm text-gray-600">
                                Total de itens: <span className="font-semibold">{pedido.items.length}</span>
                              </span>
                              <span className="text-lg font-bold text-primary">
                                Total: R$ {parseFloat(pedido.valor_total).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Versão Mobile - Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {pedidos.map(pedido => {
                const isExpanded = pedidosExpandidos.includes(pedido.id);
                return (
                  <div key={pedido.id} className="p-4">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-primary">
                            {pedido.numero_pedido}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${getStatusColor(pedido.status)}-100 text-${getStatusColor(pedido.status)}-800`}>
                            {getStatusLabel(pedido.status)}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">{pedido.cliente_nome}</p>
                        <p className="text-sm text-gray-500">{pedido.cliente_telefone}</p>
                      </div>
                    </div>

                    {/* Info do Pedido */}
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">Origem:</span>
                        <p className="font-medium text-gray-900">
                          {pedido.origem === 'catalogo' && 'Catálogo'}
                          {pedido.origem === 'whatsapp' && 'WhatsApp'}
                          {pedido.origem === 'loja_fisica' && 'Loja'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Data:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Valor Total:</span>
                        <p className="text-lg font-bold text-primary">
                          R$ {parseFloat(pedido.valor_total).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Botão Ver Itens */}
                    <button
                      onClick={() => togglePedidoExpandido(pedido.id)}
                      className="w-full py-2 mb-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium text-gray-700"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronDown size={16} />
                          Ocultar Itens
                        </>
                      ) : (
                        <>
                          <ChevronRight size={16} />
                          Ver Itens ({pedido.items.length})
                        </>
                      )}
                    </button>

                    {/* Itens Expandidos */}
                    {isExpanded && (
                      <div className="mb-3 space-y-2 bg-gray-50 p-3 rounded-lg">
                        {pedido.items.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-2 flex gap-2">
                            {item.imagem_url && (
                              <img
                                src={item.imagem_url}
                                alt={item.nome}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.nome}</p>
                              <p className="text-xs text-gray-600">
                                {item.cor} · {item.tamanho} · Qtd: {item.quantidade}
                              </p>
                              <p className="text-sm font-semibold text-primary">
                                R$ {(item.quantidade * parseFloat(item.preco_unitario)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2">
                      {pedido.status === 'novo' && (
                        <button
                          onClick={() => atualizarStatusPedido(pedido.id, 'processando', 'Pedido aceito pela loja', pedido)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          Aceitar
                        </button>
                      )}
                      {pedido.status === 'processando' && (
                        <button
                          onClick={() => abrirPDVComPedido(pedido, pedido.id)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <ShoppingBag size={14} />
                          PDV
                        </button>
                      )}
                      <button
                        onClick={() => abrirWhatsApp(pedido.cliente_telefone, pedido.cliente_nome, pedido.numero_pedido)}
                        className="px-3 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button
                        onClick={() => visualizarDetalhes(pedido)}
                        className="px-3 py-2 text-primary bg-primary/10 rounded-lg hover:bg-primary/20"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                <span className="text-gray-600">
                  Página {pagina} de {totalPaginas}
                </span>
                
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Detalhes */}
      {modalDetalhes && pedidoSelecionado && (
        <ModalDetalhesPedido
          pedido={pedidoSelecionado}
          onFechar={() => {
            setModalDetalhes(false);
            setPedidoSelecionado(null);
          }}
          onAtualizarStatus={atualizarStatusPedido}
          statusOptions={statusOptions}
        />
      )}
        </div>
      </main>
    </div>
  );
};

// Modal de Detalhes do Pedido
const ModalDetalhesPedido = ({ pedido, onFechar, onAtualizarStatus, statusOptions }) => {
  const [novoStatus, setNovoStatus] = useState(pedido.status);
  const [observacoes, setObservacoes] = useState(pedido.observacoes || '');
  const [salvando, setSalvando] = useState(false);

  const handleSalvarStatus = async () => {
    setSalvando(true);
    await onAtualizarStatus(pedido.id, novoStatus, observacoes);
    setSalvando(false);
    onFechar();
  };

  const statusEditaveis = statusOptions.filter(s => 
    s.value && s.value !== 'entregue' && s.value !== 'cancelado'
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            Pedido {pedido.numero_pedido}
          </h2>
          <button
            onClick={onFechar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Dados do Cliente */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Dados do Cliente</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><span className="font-medium">Nome:</span> {pedido.cliente_nome}</p>
              <p><span className="font-medium">Telefone:</span> {pedido.cliente_telefone}</p>
              {pedido.cliente_email && (
                <p><span className="font-medium">E-mail:</span> {pedido.cliente_email}</p>
              )}
              {pedido.cliente_endereco && (
                <p><span className="font-medium">Endereço:</span> {pedido.cliente_endereco}</p>
              )}
            </div>
          </div>

          {/* Itens do Pedido */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Itens do Pedido</h3>
            <div className="space-y-3">
              {pedido.items.map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 flex gap-4">
                  {item.imagem_url && (
                    <img
                      src={item.imagem_url}
                      alt={item.nome}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-sm text-gray-600">
                      {item.cor} - {item.tamanho}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.quantidade} x R$ {parseFloat(item.preco_unitario).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      R$ {(item.quantidade * parseFloat(item.preco_unitario)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totais */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {parseFloat(pedido.subtotal).toFixed(2)}</span>
            </div>
            {pedido.desconto > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto:</span>
                <span>- R$ {parseFloat(pedido.desconto).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-primary">R$ {parseFloat(pedido.valor_total).toFixed(2)}</span>
            </div>
          </div>

          {/* Atualizar Status */}
          {pedido.status !== 'entregue' && pedido.status !== 'cancelado' && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Gerenciar Pedido</h3>
              
              {/* Ações Rápidas */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {pedido.status === 'novo' && (
                  <>
                    <button
                      onClick={() => {
                        setNovoStatus('processando');
                        setObservacoes('Pedido aceito e em processamento');
                      }}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      ✓ Aceitar Pedido
                    </button>
                    <button
                      onClick={() => {
                        setNovoStatus('cancelado');
                        setObservacoes('Pedido cancelado');
                      }}
                      className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      ✕ Recusar
                    </button>
                  </>
                )}
                {pedido.status === 'processando' && (
                  <>
                    <button
                      onClick={() => abrirPDVComPedido(pedido, pedido.id)}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={18} />
                      Finalizar no PDV
                    </button>
                    <button
                      onClick={() => {
                        setNovoStatus('separacao');
                        setObservacoes('Pedido em separação');
                      }}
                      className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                    >
                      📦 Iniciar Separação
                    </button>
                  </>
                )}
                {pedido.status === 'separacao' && (
                  <button
                    onClick={() => {
                      setNovoStatus('enviado');
                      setObservacoes('Pedido enviado para entrega');
                    }}
                    className="col-span-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    🚚 Marcar como Enviado
                  </button>
                )}
                {pedido.status === 'enviado' && (
                  <button
                    onClick={() => {
                      setNovoStatus('entregue');
                      setObservacoes('Pedido entregue ao cliente');
                    }}
                    className="col-span-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    ✓ Confirmar Entrega
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status do Pedido
                  </label>
                  <select
                    value={novoStatus}
                    onChange={(e) => setNovoStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {statusEditaveis.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Adicione observações sobre o pedido..."
                  />
                </div>

                <button
                  onClick={handleSalvarStatus}
                  disabled={salvando || novoStatus === pedido.status}
                  className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {salvando ? 'Salvando...' : 'Atualizar Status'}
                </button>
              </div>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Origem:</span> {pedido.origem}</p>
            <p><span className="font-medium">Data:</span> {new Date(pedido.criado_em).toLocaleString('pt-BR')}</p>
            {pedido.observacoes && (
              <p><span className="font-medium">Observações:</span> {pedido.observacoes}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidosCatalogo;
