
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getAuthHeaders } from '../utils/auth';
import API_URL from '../config/apiUrl';

// Função utilitária para formatar valores monetários no padrão brasileiro
const formatarPreco = (valor) => {
  return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};

const Dashboard = () => {
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [diasRestantes, setDiasRestantes] = useState(14);
  const [filtro, setFiltro] = useState('hoje');
  const [carregando, setCarregando] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    vendasDia: 0,
    pedidosRealizados: 0,
    ticketMedio: 0,
    novosClientes: 0,
    totalClientes: 0,
    clientesComDebito: 0,
    totalDebitos: 0,
    vendas7Dias: 0
  });
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState([]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se deve mostrar o modal de trial
  useEffect(() => {
    const lojaInfo = JSON.parse(localStorage.getItem('lojaInfo') || '{}');
    if (lojaInfo.isInTrial && location.state?.showTrialModal) {
      setShowTrialModal(true);
      const diasRestantesCalc = Math.ceil((new Date(lojaInfo.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));
      setDiasRestantes(diasRestantesCalc > 0 ? diasRestantesCalc : 0);
      // Limpar o state para não mostrar novamente
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Carregar dados do dashboard
  useEffect(() => {
    carregarDashboard();
  }, [filtro]);

  // Atualizar dashboard quando uma venda for realizada
  useEffect(() => {
    const handleVendaRealizada = () => {
      carregarDashboard();
    };

    // Escutar evento customizado de venda realizada
    window.addEventListener('vendaRealizada', handleVendaRealizada);

    // Também verificar mudanças no localStorage
    const interval = setInterval(() => {
      const dashboardAtualizar = localStorage.getItem('dashboard_atualizar');
      if (dashboardAtualizar) {
        carregarDashboard();
        localStorage.removeItem('dashboard_atualizar');
      }
    }, 1000);

    return () => {
      window.removeEventListener('vendaRealizada', handleVendaRealizada);
      clearInterval(interval);
    };
  }, []);

  const normalizarNome = (nome) => {
    return nome?.toLowerCase().trim() || '';
  };

  const carregarDashboard = async () => {
    setCarregando(true);
    try {
      console.log('📊 [DASHBOARD] Carregando dados do dashboard...');
      
      // Buscar vendas da API
      let vendas = [];
      try {
        const responseVendas = await fetch(API_URL + '/api/sales', {
          headers: getAuthHeaders()
        });
        
        if (responseVendas.ok) {
          const dataVendas = await responseVendas.json();
          vendas = dataVendas.data || [];
          console.log('✅ [DASHBOARD] Vendas carregadas da API:', vendas.length);
        } else {
          console.warn('⚠️ [DASHBOARD] Falha ao buscar vendas da API, usando localStorage como fallback');
          vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
        }
      } catch (error) {
        console.error('❌ [DASHBOARD] Erro ao buscar vendas da API:', error);
        vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
      }

      // Buscar clientes da API
      let clientes = [];
      try {
        const responseClientes = await fetch(API_URL + '/api/customers', {
          headers: getAuthHeaders()
        });
        
        if (responseClientes.ok) {
          const dataClientes = await responseClientes.json();
          clientes = dataClientes.data || [];
          console.log('✅ [DASHBOARD] Clientes carregados da API:', clientes.length);
        } else {
          console.warn('⚠️ [DASHBOARD] Falha ao buscar clientes da API, usando localStorage como fallback');
          clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
        }
      } catch (error) {
        console.error('❌ [DASHBOARD] Erro ao buscar clientes da API:', error);
        clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
      }

      // Buscar produtos da API
      let produtos = [];
      try {
        const responseProdutos = await fetch(API_URL + '/api/products', {
          headers: getAuthHeaders()
        });
        if (responseProdutos.ok) {
          const dataProdutos = await responseProdutos.json();
          const produtosAPI = dataProdutos.data || [];
          
          // Extrair todas as variações de todos os produtos
          produtosAPI.forEach(prod => {
            if (prod.variacoes && Array.isArray(prod.variacoes) && prod.variacoes.length > 0) {
              // Adicionar cada variação como um produto separado
              prod.variacoes.forEach(variacao => {
                const quantidade = variacao.estoque?.quantidade || 0;
                produtos.push({
                  name: `${prod.nome} - ${variacao.cor}`,
                  quantity: quantidade,
                  minLimit: prod.estoque_minimo || 5,
                  images: prod.imagens
                });
              });
            }
          });
          
          console.log('✅ [DASHBOARD] Produtos/Variantes carregados:', produtos.length);
        }
      } catch (error) {
        console.warn('⚠️ [DASHBOARD] Erro ao buscar produtos:', error);
      }

      // Carregar lançamentos do localStorage
      const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');

      // Criar mapa de produtos por nome normalizado para buscar imagens
      const produtosPorNome = {};
      produtos.forEach(prod => {
        const nomeNormalizado = normalizarNome(prod.name);
        if (prod.images && prod.images[0]) {
          produtosPorNome[nomeNormalizado] = prod.images[0];
        }
      });

      // Migração: se não há vendas mas há lançamentos de receita, migrar
      if (vendas.length === 0 && lancamentos.length > 0) {
        const vendasMigradas = [];
        
        lancamentos.forEach((lanc, index) => {
          if (lanc.tipo === 'receita' && lanc.descricao && lanc.descricao.startsWith('Venda #')) {
            const descricaoParts = lanc.descricao.split(' - ');
            if (descricaoParts.length > 1) {
              const itensTexto = descricaoParts[1];
              const itensArray = itensTexto.split(', ').map(itemTexto => {
                const match = itemTexto.match(/(\d+)x\s+(.+)/);
                if (match) {
                  return {
                    nome: match[2],
                    produto: match[2],
                    sku: 'N/A',
                    quantidade: parseInt(match[1]),
                    preco: lanc.valor / parseInt(match[1]),
                    imagem: produtosPorNome[normalizarNome(match[2])] || null
                  };
                }
                return null;
              }).filter(item => item !== null);
              
              if (itensArray.length > 0) {
                vendasMigradas.push({
                  id: lanc.id,
                  numeroVenda: index + 1,
                  itens: itensArray,
                  formaPagamento: lanc.formaPagamento || 'Não informado',
                  subtotal: lanc.valor,
                  desconto: 0,
                  total: lanc.valor,
                  troco: 0,
                  vendedor: 'Sistema',
                  data: lanc.data,
                  dataHora: lanc.dataHora || lanc.data,
                  timestamp: lanc.id
                });
              }
            }
          }
        });
        
        if (vendasMigradas.length > 0) {
          localStorage.setItem('vendas', JSON.stringify(vendasMigradas));
          vendas = vendasMigradas;
        }
      }

      // Filtrar por período
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

      // Filtrar vendas por data (usar campo 'data' ou 'criado_em' da API)
      const vendasFiltradas = vendas.filter(venda => {
        // Tentar usar campo 'data' primeiro, depois 'criadoEm'
        let dataVenda;
        if (venda.data) {
          const [ano, mes, dia] = venda.data.split('-').map(Number);
          dataVenda = new Date(ano, mes - 1, dia);
        } else if (venda.criadoEm) {
          dataVenda = new Date(venda.criadoEm);
          dataVenda.setHours(0, 0, 0, 0);
        } else if (venda.dataHora) {
          dataVenda = new Date(venda.dataHora);
          dataVenda.setHours(0, 0, 0, 0);
        } else {
          return false;
        }

        if (filtro === 'hoje') {
          return dataVenda >= hoje && dataVenda < amanha;
        } else {
          return dataVenda >= seteDiasAtras;
        }
      });

      console.log(`📊 [DASHBOARD] Total de vendas: ${vendas.length}, Filtradas (${filtro}): ${vendasFiltradas.length}`);

      // Calcular total das vendas filtradas
      const totalVendasFiltradas = vendasFiltradas.reduce((acc, venda) => acc + (parseFloat(venda.total) || 0), 0);

      // Vendas dos últimos 7 dias (sempre calcular para o gráfico)
      const vendas7Dias = vendas.filter(venda => {
        let dataVenda;
        if (venda.data) {
          const [ano, mes, dia] = venda.data.split('-').map(Number);
          dataVenda = new Date(ano, mes - 1, dia);
        } else if (venda.criadoEm) {
          dataVenda = new Date(venda.criadoEm);
          dataVenda.setHours(0, 0, 0, 0);
        } else if (venda.dataHora) {
          dataVenda = new Date(venda.dataHora);
          dataVenda.setHours(0, 0, 0, 0);
        } else {
          return false;
        }
        return dataVenda >= seteDiasAtras;
      });
      const totalVendas7Dias = vendas7Dias.reduce((acc, venda) => acc + (parseFloat(venda.total) || 0), 0);

      const lancamentosPeriodo = lancamentos.filter(lanc => {
        // Converter data string para Date no fuso local
        const [ano, mes, dia] = lanc.data.split('-').map(Number);
        const dataLanc = new Date(ano, mes - 1, dia);
        
        if (filtro === 'hoje') {
          return dataLanc >= hoje && dataLanc < amanha && lanc.tipo === 'receita';
        } else {
          return dataLanc >= seteDiasAtras && lanc.tipo === 'receita';
        }
      });

      const vendasPeriodo = lancamentosPeriodo.reduce((acc, lanc) => acc + (lanc.valor || 0), 0);

      // Clientes - usar criadoEm ao invés de dataCadastro
      const clientesHoje = clientes.filter(c => {
        if (!c.criadoEm) return false;
        const dataCad = new Date(c.criadoEm);
        dataCad.setHours(0, 0, 0, 0);
        return dataCad >= hoje && dataCad < amanha;
      });

      const clientesComDebito = clientes.filter(c => (parseFloat(c.debito) || 0) > 0);
      const totalDebitos = clientesComDebito.reduce((acc, c) => acc + (parseFloat(c.debito) || 0), 0);

      // Produtos com baixo estoque
      const alertasEstoque = produtos.filter(prod => {
        const qtd = prod.quantity || 0;
        const limite = prod.minLimit || 5;
        return qtd <= limite;
      }).map(prod => ({
        nome: prod.name,
        quantidade: prod.quantity || 0,
        status: (prod.quantity || 0) === 0 ? 'esgotado' : 'baixo'
      }));
      
      console.log('DEBUG ALERTAS ESTOQUE:', {
        totalProdutos: produtos.length,
        produtosComAlerta: alertasEstoque.length,
        alertas: alertasEstoque,
        produtosCompletos: produtos.map(p => ({
          name: p.name,
          quantity: p.quantity,
          minLimit: p.minLimit
        }))
      });
      
      setProdutosBaixoEstoque(alertasEstoque);

      // Produtos mais vendidos (usar TODAS as vendas, não apenas filtradas)
      const vendasPorProduto = {};
      vendas.forEach(venda => {
        if (venda.itens && Array.isArray(venda.itens)) {
          venda.itens.forEach(item => {
            const chave = item.nome || item.produto;
            const chaveNormalizada = normalizarNome(chave);
            if (chave) {
              if (!vendasPorProduto[chave]) {
                let imagemEncontrada = null;
                if (item.imagem && item.imagem.trim() !== '') {
                  imagemEncontrada = item.imagem;
                } else if (item.imagens && item.imagens[0] && item.imagens[0].trim() !== '') {
                  imagemEncontrada = item.imagens[0];
                } else if (produtosPorNome[chaveNormalizada] && produtosPorNome[chaveNormalizada].trim() !== '') {
                  imagemEncontrada = produtosPorNome[chaveNormalizada];
                }
                vendasPorProduto[chave] = {
                  nome: chave,
                  sku: item.sku || 'N/A',
                  imagem: imagemEncontrada,
                  quantidadeVendida: 0
                };
              }
              vendasPorProduto[chave].quantidadeVendida += item.quantidade || 0;
            }
          });
        }
      });

      const produtosComVendas = Object.values(vendasPorProduto);
      const topProdutos = produtosComVendas
        .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
        .slice(0, 3);
      
      setProdutosMaisVendidos(topProdutos);

      console.log('📊 [DASHBOARD] Estatísticas:', {
        vendasDia: totalVendasFiltradas,
        pedidosRealizados: vendasFiltradas.length,
        ticketMedio: vendasFiltradas.length > 0 ? totalVendasFiltradas / vendasFiltradas.length : 0,
        vendas7Dias: totalVendas7Dias
      });

      setEstatisticas({
        vendasDia: totalVendasFiltradas, // Usar vendas da API
        pedidosRealizados: vendasFiltradas.length, // Quantidade de vendas filtradas
        ticketMedio: vendasFiltradas.length > 0 ? totalVendasFiltradas / vendasFiltradas.length : 0,
        novosClientes: clientesHoje.length,
        totalClientes: clientes.length,
        clientesComDebito: clientesComDebito.length,
        totalDebitos,
        vendas7Dias: totalVendas7Dias
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setCarregando(false);
    }
  };

  // Modal de 14 dias gratuitos
  const renderTrialModal = () => (
    <Modal isOpen={showTrialModal} onClose={() => setShowTrialModal(false)} size="md">
      <div className="p-6 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-primary">Bem-vindo(a) ao período gratuito!</h2>
        <p className="text-gray-700 dark:text-gray-200 text-center mb-4">
          Você tem <span className="font-semibold">{diasRestantes} dias</span> de acesso gratuito ao sistema.<br/>
          Aproveite todas as funcionalidades sem restrições!
        </p>
        <p className="text-gray-500 text-sm text-center mb-4">
          Ao final do período, você poderá escolher um plano e assinar o software para continuar utilizando normalmente.
        </p>
        <button
          className="mt-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition"
          onClick={() => setShowTrialModal(false)}
        >
          Entendi
        </button>
      </div>
    </Modal>
  );

  return (
    <div className="flex flex-row min-h-screen bg-background-light">
      {renderTrialModal()}
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col w-full">
          {/* Cabeçalho */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <p className="text-gray-800 text-2xl font-bold leading-tight tracking-tight">Dashboard Principal</p>
              <p className="text-gray-500 text-sm font-normal leading-normal">
                Visão geral do seu negócio {filtro === 'hoje' ? 'hoje' : 'nos últimos 7 dias'}.
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setFiltro('hoje')}
                className={`flex items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 text-sm font-medium leading-normal transition-colors ${
                  filtro === 'hoje' 
                    ? 'bg-primary text-white' 
                    : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'
                }`}
              >
                Hoje
              </button>
              <button 
                onClick={() => setFiltro('7dias')}
                className={`flex items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 text-sm font-medium leading-normal transition-colors ${
                  filtro === '7dias' 
                    ? 'bg-primary text-white' 
                    : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'
                }`}
              >
                Últimos 7 dias
              </button>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card 1 */}
            <div className="flex items-center gap-4 bg-white px-4 py-5 rounded-xl border border-gray-200 min-w-0">
              <div className="text-gray-800 flex items-center justify-center rounded-full bg-center bg-no-repeat aspect-square bg-gray-100 w-12 h-12 shrink-0">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-gray-800 text-xl sm:text-2xl font-bold leading-tight truncate">{formatarPreco(estatisticas.vendasDia)}</p>
                <p className="text-gray-500 text-xs sm:text-sm font-normal leading-normal truncate">
                  Vendas {filtro === 'hoje' ? 'de Hoje' : '(7 dias)'}
                </p>
              </div>
            </div>
            {/* Card 2 */}
            <div className="flex flex-col gap-1.5 rounded-lg p-4 bg-white border border-gray-200 min-w-0">
              <p className="text-gray-600 text-xs sm:text-sm font-medium leading-normal truncate">Ticket Médio</p>
              <p className="text-gray-800 text-xl sm:text-2xl font-bold leading-tight truncate">
                {carregando ? '...' : formatarPreco(estatisticas.ticketMedio)}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm font-medium leading-normal truncate">
                por pedido
              </p>
            </div>
            {/* Card 3 */}
            <div className="flex flex-col gap-1.5 rounded-lg p-4 bg-white border border-gray-200 min-w-0">
              <p className="text-gray-600 text-xs sm:text-sm font-medium leading-normal truncate">Total de Clientes</p>
              <p className="text-gray-800 text-xl sm:text-2xl font-bold leading-tight truncate">
                {carregando ? '...' : estatisticas.totalClientes}
              </p>
              <p className="text-green-600 text-xs sm:text-sm font-medium leading-normal truncate">
                +{estatisticas.novosClientes} hoje
              </p>
            </div>
            {/* Card 4 */}
            <div className="flex flex-col gap-1.5 rounded-lg p-4 bg-white border border-gray-200 min-w-0">
              <p className="text-gray-600 text-xs sm:text-sm font-medium leading-normal truncate">Débitos Pendentes</p>
              <p className="text-gray-800 text-xl sm:text-2xl font-bold leading-tight truncate">
                {carregando ? '...' : formatarPreco(estatisticas.totalDebitos)}
              </p>
              <p className="text-red-600 text-xs sm:text-sm font-medium leading-normal truncate">
                {estatisticas.clientesComDebito} clientes
              </p>
            </div>
          </div>

          {/* Gráfico e Alertas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Gráfico de Desempenho */}
            <div className="lg:col-span-2 flex flex-col gap-3 rounded-lg border border-gray-200 p-4 bg-white">
              <div className="flex flex-col">
                <p className="text-gray-800 text-base font-semibold leading-normal">Desempenho de Vendas</p>
                <div className="flex gap-1 items-baseline">
                  <p className="text-gray-800 text-2xl font-bold leading-tight truncate">
                    {carregando ? '...' : formatarPreco(estatisticas.vendas7Dias)}
                  </p>
                  <p className="text-gray-500 text-sm font-normal leading-normal">/ últimos 7 dias</p>
                </div>
              </div>
              <div className="flex min-h-[120px] flex-1 flex-col gap-3 py-2">
                <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="-3 0 478 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z" fill="url(#paint0_linear)"></path>
                  <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#135bec" strokeLinecap="round" strokeWidth="3"></path>
                  <defs>
                    <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear" x1="236" x2="236" y1="1" y2="149">
                      <stop stopColor="#135bec" stopOpacity="0.2"></stop>
                      <stop offset="1" stopColor="#135bec" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex justify-around">
                  <p className="text-gray-500 text-xs font-medium tracking-wide">Seg</p>
                  <p className="text-gray-500 text-xs font-medium tracking-wide">Ter</p>
                  <p className="text-gray-500 text-xs font-medium tracking-wide">Qua</p>
                  <p className="text-gray-500 text-xs font-medium tracking-wide">Qui</p>
                  <p className="text-gray-500 text-xs font-medium tracking-wide">Sex</p>
                  <p className="text-gray-500 text-xs font-medium tracking-wide">Sáb</p>
                  <p className="text-gray-500 text-xs font-medium tracking-wide">Dom</p>
                </div>
              </div>
            </div>

            {/* Alertas de Estoque */}
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 bg-white">
              <h2 className="text-gray-800 text-base font-semibold leading-tight">Alertas de Estoque</h2>
              <div className="flex flex-col gap-2.5 min-h-[240px] max-h-[320px] overflow-y-auto">
                {carregando ? (
                  <p className="text-gray-500 text-sm">Carregando...</p>
                ) : produtosBaixoEstoque.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum alerta de estoque</p>
                ) : (
                  produtosBaixoEstoque.map((produto, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <p className="text-gray-800 font-medium text-sm">{produto.nome}</p>
                        <p className="text-gray-500 text-xs">
                          {produto.quantidade === 0 ? 'Esgotado' : `Apenas ${produto.quantidade} em estoque`}
                        </p>
                      </div>
                      <span className={`${
                        produto.status === 'esgotado' 
                          ? 'text-red-600 bg-red-500/10' 
                          : 'text-orange-500 bg-orange-500/10'
                      } rounded-full px-2 py-0.5 text-xs font-medium`}>
                        {produto.status === 'esgotado' ? 'Esgotado' : 'Baixo'}
                      </span>
                    </div>
                  ))
                )}
                <button 
                  onClick={() => navigate('/estoque')}
                  className="w-full text-center text-primary text-sm font-semibold py-2 rounded-lg hover:bg-primary/5"
                >
                  Ver todos
                </button>
              </div>
            </div>
          </div>

          {/* Acesso Rápido e Produtos Mais Vendidos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Acesso Rápido */}
            <div className="flex flex-col gap-3">
              <h2 className="text-gray-800 text-base font-semibold leading-tight">Acesso Rápido</h2>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate('/vendas')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-white border border-gray-200 hover:border-primary hover:shadow-sm transition-all"
                >
                  <svg className="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9.83-3.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4h-.01l-1.1 2-2.76 5H8.53l-.13-.27L6.16 6l-.95-2-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25z"/>
                  </svg>
                  <p className="text-gray-800 text-xs font-semibold">Nova Venda</p>
                </button>
                <button 
                  onClick={() => navigate('/products')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-white border border-gray-200 hover:border-primary hover:shadow-sm transition-all"
                >
                  <svg className="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                  </svg>
                  <p className="text-gray-800 text-xs font-semibold">Adicionar Produto</p>
                </button>
                <button 
                  onClick={() => navigate('/vendas')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-white border border-gray-200 hover:border-primary hover:shadow-sm transition-all"
                >
                  <svg className="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM15 20H6c-.55 0-1-.45-1-1v-1h10v2zm4-1c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14z"/>
                    <path d="M9 7h6v2H9zm7 0h2v2h-2zm-7 3h6v2H9zm7 0h2v2h-2z"/>
                  </svg>
                  <p className="text-gray-800 text-xs font-semibold">Gerenciar Pedidos</p>
                </button>
                <button 
                  onClick={() => navigate('/relatorios')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-white border border-gray-200 hover:border-primary hover:shadow-sm transition-all"
                >
                  <svg className="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
                  </svg>
                  <p className="text-gray-800 text-xs font-semibold">Ver Relatórios</p>
                </button>
              </div>
            </div>

            {/* Produtos Mais Vendidos */}
            <div className="lg:col-span-2 flex flex-col gap-3 rounded-lg border border-gray-200 p-4 bg-white">
              <h2 className="text-gray-800 text-base font-semibold leading-tight">Produtos Mais Vendidos</h2>
              <div className="flex flex-col gap-2.5 max-h-[140px] overflow-y-auto">
                {carregando ? (
                  <p className="text-gray-500 text-sm">Carregando...</p>
                ) : produtosMaisVendidos.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhuma venda registrada ainda</p>
                ) : (
                  produtosMaisVendidos.map((produto, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {produto.imagem ? (
                          <img src={produto.imagem} alt={produto.nome} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium text-sm truncate">{produto.nome}</p>
                        <p className="text-gray-500 text-xs">SKU: {produto.sku}</p>
                      </div>
                      <p className="text-gray-800 font-semibold text-sm flex-shrink-0">{produto.quantidadeVendida} un.</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;