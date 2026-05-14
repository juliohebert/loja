import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Search, Filter, X, ChevronLeft, ChevronRight, ArrowUp, ClipboardList, Phone, RotateCcw, Package, CheckCircle, Truck, Clock, XCircle, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import CarrinhoCompras from './CarrinhoCompras';
import { getApiUrl } from '../config/api';
import { aplicarTemaNoDOM } from '../hooks/useTemaSistema';

const CatalogoPublico = () => {
  const { slug } = useParams(); // Capturar slug da URL
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [badgeAnimado, setBadgeAnimado] = useState(false);
  const [mostrarTopo, setMostrarTopo] = useState(false);
  const [totalProdutos, setTotalProdutos] = useState(0);
  
  // Filtros
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [ordem, setOrdem] = useState('recentes');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  // Meus Pedidos
  const [meusPedidosAberto, setMeusPedidosAberto] = useState(false);
  const [telefoneBusca, setTelefoneBusca] = useState('');
  const [pedidosCliente, setPedidosCliente] = useState([]);
  const [buscandoPedidos, setBuscandoPedidos] = useState(false);
  const [pedidosBuscados, setPedidosBuscados] = useState(false);
  const [pedidoExpandido, setPedidoExpandido] = useState(null);
  const telefoneRef = useRef(null);
  
  // Configurações da loja
  const [config, setConfig] = useState({
    nome_loja: 'Loja',
    logo_url: '',
    telefone_whatsapp: '',
    instagram_usuario: ''
  });

  const tenantId = localStorage.getItem('currentTenantId') || 'default';

  // Montar URL base da API baseado no slug
  const getApiUrlCatalogo = (endpoint) => {
    if (slug) {
      return getApiUrl(`catalogo/${slug}/${endpoint}`);
    }
    return getApiUrl(`catalogo/${endpoint}`);
  };

  // Aplicar tema salvo imediatamente (evita flash de tema padrão)
  useEffect(() => {
    const chave = `catalogo_tema_${slug || tenantId}`;
    const temaSalvo = localStorage.getItem(chave);
    if (temaSalvo) aplicarTemaNoDOM(temaSalvo);
  }, []);

  // Carregar configurações da loja
  useEffect(() => {
    const carregarConfiguracoes = async () => {
      try {
        const url = slug 
          ? getApiUrl(`catalogo/${slug}/configuracoes`)
          : getApiUrl('catalogo/configuracoes');
          
        const headers = slug ? {} : { 'x-tenant-id': tenantId };
        
        const response = await fetch(url, { headers });
        const data = await response.json();
        if (data.success) {
          setConfig(data.data);
          const temaId = data.data.tema_selecionado || 'padrao';
          // Salvar tema no localStorage para próximo carregamento
          const chave = `catalogo_tema_${slug || tenantId}`;
          localStorage.setItem(chave, temaId);
          aplicarTemaNoDOM(temaId);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    carregarConfiguracoes();
  }, [tenantId, slug]);

  // Carregar produtos
  useEffect(() => {
    const carregarProdutos = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limite: '20',
          pagina: pagina.toString(),
          ordem
        });
        
        if (busca) params.append('busca', busca);
        if (categoriaFiltro) params.append('categoria', categoriaFiltro);

        const url = slug
          ? `${getApiUrl(`catalogo/${slug}/produtos`)}?${params}`
          : `${getApiUrl('catalogo/produtos')}?${params}`;
          
        const headers = slug ? {} : { 'x-tenant-id': tenantId };

        const response = await fetch(url, { headers });
        
        const data = await response.json();
        if (data.success) {
          setProdutos(data.data);
          setTotalPaginas(data.pagination.total_paginas);
          setTotalProdutos(data.pagination.total ?? data.data.length);
          
          // Extrair categorias únicas
          const cats = [...new Set(data.data.map(p => p.categoria).filter(Boolean))];
          setCategorias(cats);
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarProdutos();
  }, [busca, categoriaFiltro, ordem, pagina, tenantId, slug]);

  // Adicionar ao carrinho
  const adicionarAoCarrinho = (produto, variacao) => {
    const itemExistente = carrinho.find(
      item => item.produto_id === produto.id && 
              item.tamanho === variacao.tamanho && 
              item.cor === variacao.cor
    );

    if (itemExistente) {
      setCarrinho(carrinho.map(item =>
        item.produto_id === produto.id && 
        item.tamanho === variacao.tamanho && 
        item.cor === variacao.cor
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCarrinho([...carrinho, {
        produto_id: produto.id,
        nome: produto.nome,
        marca: produto.marca,
        tamanho: variacao.tamanho,
        cor: variacao.cor,
        quantidade: 1,
        preco_unitario: produto.preco_venda,
        imagem_url: produto.imagens?.[0] || null
      }]);
    }
    setCarrinhoAberto(true);
    setBadgeAnimado(true);
    setTimeout(() => setBadgeAnimado(false), 600);
  };

  // Remover do carrinho
  const removerDoCarrinho = (index) => {
    setCarrinho(carrinho.filter((_, i) => i !== index));
  };

  // Atualizar quantidade
  const atualizarQuantidade = (index, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(index);
      return;
    }
    setCarrinho(carrinho.map((item, i) =>
      i === index ? { ...item, quantidade: novaQuantidade } : item
    ));
  };

  // Buscar pedidos pelo telefone
  const buscarMeusPedidos = async () => {
    const telefone = telefoneBusca.replace(/\D/g, '');
    if (telefone.length < 8) return;
    setBuscandoPedidos(true);
    setPedidosBuscados(false);
    setPedidosCliente([]);
    try {
      const url = slug
        ? getApiUrl(`catalogo/${slug}/pedidos/consulta?telefone=${encodeURIComponent(telefoneBusca)}`)
        : getApiUrl(`catalogo/pedidos/consulta?telefone=${encodeURIComponent(telefoneBusca)}`);
      const headers = slug ? {} : { 'x-tenant-id': tenantId };
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setPedidosCliente(data.data);
      }
    } catch (e) {
      console.error('Erro ao buscar pedidos:', e);
    } finally {
      setBuscandoPedidos(false);
      setPedidosBuscados(true);
    }
  };

  // Comprar novamente — adiciona itens do pedido ao carrinho
  const comprarNovamente = (pedido) => {
    const novoCarrinho = [...carrinho];
    pedido.items.forEach(item => {
      const idx = novoCarrinho.findIndex(
        i => i.produto_id === item.produto_id &&
             i.tamanho === (item.tamanho || '') &&
             i.cor === (item.cor || '')
      );
      if (idx >= 0) {
        novoCarrinho[idx] = { ...novoCarrinho[idx], quantidade: novoCarrinho[idx].quantidade + (item.quantidade || 1) };
      } else {
        novoCarrinho.push({
          produto_id: item.produto_id,
          variacao_id: item.variacao_id || null,
          nome: item.nome,
          tamanho: item.tamanho || '',
          cor: item.cor || '',
          quantidade: item.quantidade || 1,
          preco_unitario: parseFloat(item.preco_unitario),
          imagem_url: item.imagem_url || null
        });
      }
    });
    setCarrinho(novoCarrinho);
    setMeusPedidosAberto(false);
    setTimeout(() => setCarrinhoAberto(true), 150);
  };

  // Limpar filtros
  const limparFiltros = () => {
    setBusca('');
    setCategoriaFiltro('');
    setOrdem('recentes');
    setPagina(1);
  };

  // Detectar scroll para botão "Voltar ao topo"
  useEffect(() => {
    const onScroll = () => setMostrarTopo(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Limpar tema ao desmontar o catálogo
  useEffect(() => {
    return () => aplicarTemaNoDOM('padrao');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {config.logo_url ? (
                <img 
                  src={config.logo_url.startsWith('http') ? config.logo_url : `${getApiUrl('')}${config.logo_url}`}
                  alt={config.nome_loja} 
                  className="h-10 max-w-[200px] object-contain" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <h1 
                className="text-2xl font-bold text-primary" 
                style={{ display: config.logo_url ? 'none' : 'block' }}
              >
                {config.nome_loja}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {config.instagram_usuario && (
                <a
                  href={`https://www.instagram.com/${config.instagram_usuario.replace(/^@/, '')}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                  </svg>
                  <span className="hidden sm:inline">@{config.instagram_usuario.replace(/^@/, '')}</span>
                </a>
              )}
              {config.telefone_whatsapp && (
                <a
                  href={`https://wa.me/55${config.telefone_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Vim pelo catálogo e tenho uma dúvida.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-green-500 transition-colors"
                  aria-label="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.532 5.848L.057 23.75a.5.5 0 0 0 .612.612l5.902-1.475A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.691-.5-5.241-1.376l-.375-.214-3.882.97.989-3.881-.228-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  <span className="hidden sm:inline">Dúvidas?</span>
                </a>
              )}
              <button
                onClick={() => { setMeusPedidosAberto(true); setPedidosBuscados(false); setPedidosCliente([]); setTelefoneBusca(''); setTimeout(() => telefoneRef.current?.focus(), 100); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
              >
                <ClipboardList size={16} />
                Consultar Pedidos
              </button>
              <button
                onClick={() => setCarrinhoAberto(true)}
                className="relative p-2 text-gray-700 hover:text-primary transition-colors"
              >
                <ShoppingCart size={24} />
                {carrinho.length > 0 && (
                  <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-transform duration-150 ${badgeAnimado ? 'scale-150' : 'scale-100'}`}>
                    {carrinho.reduce((acc, item) => acc + item.quantidade, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 space-y-3">
          {/* Linha 1: Busca + Ordenação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
            <div className="sm:w-44">
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="recentes">Mais recentes</option>
                <option value="menor_preco">Menor preço</option>
                <option value="maior_preco">Maior preço</option>
                <option value="nome">Nome A-Z</option>
              </select>
            </div>
          </div>

          {/* Linha 2: Chips de categoria */}
          {categorias.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => { setCategoriaFiltro(''); setPagina(1); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  !categoriaFiltro ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary'
                }`}
              >
                Todas
              </button>
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategoriaFiltro(cat === categoriaFiltro ? '' : cat); setPagina(1); }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border capitalize ${
                    categoriaFiltro === cat ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary'
                  }`}
                >
                  {cat}
                  {categoriaFiltro === cat && <X size={11} />}
                </button>
              ))}
            </div>
          )}

          {/* Limpar filtros — só aparece para busca ou ordenação diferente da padrão */}
          {(busca || ordem !== 'recentes') && (
            <button
              onClick={limparFiltros}
              className="text-sm text-gray-500 hover:text-primary flex items-center gap-1.5"
            >
              <X size={14} />
              Limpar tudo
            </button>
          )}
        </div>

        {/* Grid de Produtos */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse flex flex-col">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-4 space-y-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded-full w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-1/2"></div>
                  <div className="h-9 bg-gray-200 rounded-lg mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-200 mb-4">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">Nenhum produto encontrado</p>
            <p className="text-gray-400 text-sm mt-1">Tente outros filtros ou termos de busca</p>
            {(busca || categoriaFiltro) && (
              <button onClick={limparFiltros} className="mt-4 text-primary hover:underline text-sm font-medium">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Contador de resultados */}
            <p className="text-sm text-gray-500 mb-4">
              {totalProdutos > 0
                ? `${totalProdutos} produto${totalProdutos !== 1 ? 's' : ''} encontrado${totalProdutos !== 1 ? 's' : ''}`
                : `${produtos.length} produto${produtos.length !== 1 ? 's' : ''}`}
              {(busca || categoriaFiltro) && <span className="text-primary font-medium"> (filtrado)</span>}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {produtos.map(produto => (
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
                  onAdicionarAoCarrinho={adicionarAoCarrinho}
                />
              ))}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
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

      {/* Botão flutuante do carrinho */}
      {carrinho.length > 0 && (
        <button
          onClick={() => setCarrinhoAberto(true)}
          className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-primary text-white font-semibold px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${badgeAnimado ? 'scale-110' : 'scale-100'}`}
        >
          <div className="relative">
            <ShoppingCart size={20} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center leading-none">
              {carrinho.reduce((acc, item) => acc + item.quantidade, 0)}
            </span>
          </div>
          <span className="text-sm">
            R$ {carrinho.reduce((acc, item) => acc + item.preco_unitario * item.quantidade, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </button>
      )}

      {/* Botão Voltar ao topo */}
      {mostrarTopo && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 z-50 bg-white text-gray-700 border border-gray-200 p-3 rounded-full shadow-md hover:shadow-lg hover:bg-gray-50 transition-all"
          aria-label="Voltar ao topo"
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* Botão WhatsApp flutuante */}
      {config.telefone_whatsapp && (
        <a
          href={`https://wa.me/55${config.telefone_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Vim pelo catálogo e tenho uma dúvida.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
          aria-label="Falar no WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.532 5.848L.057 23.75a.5.5 0 0 0 .612.612l5.902-1.475A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.691-.5-5.241-1.376l-.375-.214-3.882.97.989-3.881-.228-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          <span className="text-sm">Dúvidas?</span>
        </a>
      )}

      {/* Instagram Section */}
      {config.instagram_usuario && (
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 py-10 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-white">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Nos siga no Instagram</p>
                <p className="text-white text-xl font-bold">@{config.instagram_usuario.replace(/^@/, '')}</p>
                <p className="text-white/70 text-xs mt-0.5">Acompanhe novidades, lançamentos e stories</p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={`https://www.instagram.com/stories/${config.instagram_usuario.replace(/^@/, '')}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white text-pink-600 font-semibold px-5 py-2.5 rounded-full hover:bg-pink-50 transition-colors shadow-md text-sm"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <polygon points="10,8 16,12 10,16" fill="currentColor"/>
                </svg>
                Ver Stories
              </a>
              <a
                href={`https://www.instagram.com/${config.instagram_usuario.replace(/^@/, '')}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/40 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-white/30 transition-colors text-sm"
              >
                Seguir
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Meus Pedidos */}
      {meusPedidosAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-8 pb-4 px-4" onClick={(e) => { if (e.target === e.currentTarget) setMeusPedidosAberto(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ClipboardList size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-gray-900">Consultar Pedidos</h2>
              </div>
              <button onClick={() => setMeusPedidosAberto(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"><X size={18} /></button>
            </div>

            {/* Busca por telefone */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">Consulte seus pedidos informando o número de telefone usado no pedido.</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={telefoneRef}
                    type="tel"
                    value={telefoneBusca}
                    onChange={(e) => setTelefoneBusca(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarMeusPedidos()}
                    placeholder="(84) 99999-9999"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <button
                  onClick={buscarMeusPedidos}
                  disabled={buscandoPedidos || telefoneBusca.replace(/\D/g, '').length < 8}
                  className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                >
                  {buscandoPedidos ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Search size={15} />}
                  Buscar
                </button>
              </div>
            </div>

            {/* Resultados */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {buscandoPedidos && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <span className="animate-spin inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
                  <p className="text-sm text-gray-500">Buscando seus pedidos...</p>
                </div>
              )}

              {!buscandoPedidos && pedidosBuscados && pedidosCliente.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <Package size={40} className="text-gray-300" />
                  <p className="text-gray-500 font-medium">Nenhum pedido encontrado</p>
                  <p className="text-gray-400 text-sm">Verifique se o número de telefone está correto.</p>
                </div>
              )}

              {!buscandoPedidos && !pedidosBuscados && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <ClipboardList size={40} className="text-gray-200" />
                  <p className="text-gray-400 text-sm">Digite seu telefone para consultar seus pedidos.</p>
                </div>
              )}

              {!buscandoPedidos && pedidosCliente.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 font-medium mb-2">{pedidosCliente.length} pedido{pedidosCliente.length !== 1 ? 's' : ''} encontrado{pedidosCliente.length !== 1 ? 's' : ''}</p>
                  {pedidosCliente.map(pedido => (
                    <PedidoClienteCard
                      key={pedido.id}
                      pedido={pedido}
                      expandido={pedidoExpandido === pedido.id}
                      onToggle={() => setPedidoExpandido(pedidoExpandido === pedido.id ? null : pedido.id)}
                      onComprarNovamente={() => comprarNovamente(pedido)}
                      whatsapp={config.telefone_whatsapp}
                      enderecoLoja={config.endereco_loja}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Carrinho Sidebar */}
      <CarrinhoCompras
        aberto={carrinhoAberto}
        onFechar={() => setCarrinhoAberto(false)}
        itens={carrinho}
        onRemoverItem={removerDoCarrinho}
        onAtualizarQuantidade={atualizarQuantidade}
        configuracoes={config}
        slug={slug}
        onLimparCarrinho={() => setCarrinho([])}
      />
    </div>
  );
};

// Componente Card de Pedido do Cliente
const STATUS_CONFIG = {
  novo:        { label: 'Novo',        color: 'bg-blue-100 text-blue-700',    icon: Clock },
  processando: { label: 'Em preparo',  color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  separacao:   { label: 'Separando',   color: 'bg-orange-100 text-orange-700', icon: Package },
  enviado:     { label: 'Enviado',     color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  entregue:    { label: 'Entregue',    color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  cancelado:   { label: 'Cancelado',   color: 'bg-red-100 text-red-600',      icon: XCircle },
};

const FORMA_PAGAMENTO_LABEL = {
  pix: 'Pix', dinheiro: 'Dinheiro', credito: 'Cartão de Crédito', debito: 'Cartão de Débito'
};

const PedidoClienteCard = ({ pedido, expandido, onToggle, onComprarNovamente, whatsapp, enderecoLoja }) => {
  const st = STATUS_CONFIG[pedido.status] || STATUS_CONFIG.novo;
  const StatusIcon = st.icon;
  const dataFormatada = new Date(pedido.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const total = parseFloat(pedido.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Cabeçalho do card */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">{pedido.numero_pedido}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                <StatusIcon size={11} />
                {st.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{dataFormatada} · {pedido.items?.length || 0} item{(pedido.items?.length || 0) !== 1 ? 's' : ''} · R$ {total}</p>
          </div>
        </div>
        {expandido ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>

      {/* Detalhes expandidos */}
      {expandido && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-3">
          {/* Itens */}
          <div className="space-y-1.5">
            {pedido.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {item.imagem_url ? (
                  <img src={item.imagem_url} alt={item.nome} className="w-9 h-9 object-cover rounded-lg shrink-0" onError={(e) => e.target.style.display = 'none'} />
                ) : (
                  <div className="w-9 h-9 bg-gray-200 rounded-lg shrink-0 flex items-center justify-center"><Package size={14} className="text-gray-400" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{item.nome}</p>
                  <p className="text-xs text-gray-500">{[item.tamanho, item.cor].filter(Boolean).join(' · ')} · {item.quantidade}x R$ {parseFloat(item.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Info pagamento/entrega */}
          <div className="flex flex-col gap-1 pt-1 border-t border-gray-200">
            <div className="flex gap-3 text-xs text-gray-500">
              {pedido.forma_pagamento && <span>{FORMA_PAGAMENTO_LABEL[pedido.forma_pagamento] || pedido.forma_pagamento}</span>}
              {pedido.tipo_entrega && (
                <span className="capitalize">
                  {pedido.tipo_entrega === 'retirada' ? '🏪 Retirada na loja' : '🚚 Entrega'}
                </span>
              )}
            </div>
            {pedido.tipo_entrega === 'retirada' && enderecoLoja && (
              <p className="text-xs text-gray-400">📍 {enderecoLoja}</p>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            {pedido.tipo_entrega === 'retirada' && enderecoLoja && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoLoja)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-blue-300 text-blue-600 hover:bg-blue-50 text-sm font-semibold rounded-xl transition-all"
                title={enderecoLoja}
              >
                <MapPin size={14} />
                <span className="hidden sm:inline">Ver no mapa</span>
              </a>
            )}
            {pedido.status !== 'cancelado' && pedido.items?.length > 0 && (
              <button
                onClick={onComprarNovamente}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
              >
                <RotateCcw size={14} />
                Comprar novamente
              </button>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostaria de falar sobre meu pedido ${pedido.numero_pedido}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-all"
                title="Falar com a loja sobre este pedido"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.532 5.848L.057 23.75a.5.5 0 0 0 .612.612l5.902-1.475A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.691-.5-5.241-1.376l-.375-.214-3.882.97.989-3.881-.228-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                <span className="hidden sm:inline">Falar com a loja</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Card de Produto
const ProdutoCard = ({ produto, onAdicionarAoCarrinho }) => {
  const [variacaoSelecionada, setVariacaoSelecionada] = useState(null);
  const [mostrarVariacoes, setMostrarVariacoes] = useState(false);
  const [imagemAtual, setImagemAtual] = useState(0);

  const variacoesComEstoque = produto.variacoes?.filter(
    v => v.estoque?.quantidade > 0
  ) || [];

  const imagens = produto.imagens || [];
  const temMultiplasImagens = imagens.length > 1;

  const proximaImagem = (e) => {
    e.stopPropagation();
    setImagemAtual((prev) => (prev + 1) % imagens.length);
  };

  const imagemAnterior = (e) => {
    e.stopPropagation();
    setImagemAtual((prev) => (prev - 1 + imagens.length) % imagens.length);
  };

  const irParaImagem = (index) => {
    setImagemAtual(index);
  };

  const handleAdicionar = () => {
    if (variacoesComEstoque.length === 0) return;

    if (variacoesComEstoque.length === 1) {
      onAdicionarAoCarrinho(produto, variacoesComEstoque[0]);
    } else {
      setMostrarVariacoes(true);
    }
  };

  const selecionarVariacao = (variacao) => {
    onAdicionarAoCarrinho(produto, variacao);
    setMostrarVariacoes(false);
    setVariacaoSelecionada(null);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
        {/* Imagem com Carrossel */}
        <div className="relative h-64 bg-gray-100 overflow-hidden">
          {imagens.length > 0 ? (
            <>
              <img
                src={imagens[imagemAtual]}
                alt={`${produto.nome} - ${imagemAtual + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Botões de navegação - aparecem apenas se houver múltiplas imagens */}
              {temMultiplasImagens && (
                <>
                  {/* Botão Anterior */}
                  <button
                    onClick={imagemAnterior}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Botão Próximo */}
                  <button
                    onClick={proximaImagem}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Indicadores de página (dots) */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imagens.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          irParaImagem(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === imagemAtual 
                            ? 'bg-white w-6' 
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                        aria-label={`Ir para imagem ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Contador de imagens */}
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {imagemAtual + 1}/{imagens.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart size={48} />
            </div>
          )}
          
          {!produto.estoque_disponivel && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                Esgotado
              </span>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Nome e marca */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1 capitalize">
              {produto.nome}
            </h3>
            {produto.marca && produto.marca.toLowerCase() !== 'sem marca' && (
              <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                {produto.marca}
              </span>
            )}
          </div>

          {/* Preço */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-gray-400 font-medium">R$</span>
            <span className="text-2xl font-bold text-primary leading-none">
              {parseFloat(produto.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Estoque baixo */}
          {produto.total_estoque > 0 && produto.total_estoque <= 5 && (
            <p className={`text-xs font-medium flex items-center gap-1 ${produto.total_estoque <= 2 ? 'text-red-500' : 'text-orange-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${produto.total_estoque <= 2 ? 'bg-red-400' : 'bg-orange-400'}`}></span>
              Apenas {produto.total_estoque} em estoque
            </p>
          )}

          {/* Botão */}
          <button
            onClick={handleAdicionar}
            disabled={!produto.estoque_disponivel}
            className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium mt-auto"
          >
            <ShoppingCart size={16} />
            {produto.estoque_disponivel ? 'Adicionar ao Carrinho' : 'Esgotado'}
          </button>
        </div>
      </div>

      {/* Modal de Seleção de Variação */}
      {mostrarVariacoes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Selecione uma opção</h3>
              <button
                onClick={() => setMostrarVariacoes(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-2">
              {variacoesComEstoque.map((variacao, idx) => (
                <button
                  key={idx}
                  onClick={() => selecionarVariacao(variacao)}
                  className="w-full text-left p-3 border border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium capitalize">{variacao.cor}</span>
                      {' - '}
                      <span className="text-gray-600">{variacao.tamanho}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {variacao.estoque?.quantidade} disponíveis
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CatalogoPublico;
