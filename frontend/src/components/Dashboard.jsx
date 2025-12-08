import React, { useState, useEffect } from 'react';
// Função utilitária para formatar valores monetários no padrão brasileiro
const formatarPreco = (valor) => {
  return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [filtro, setFiltro] = useState('hoje'); // 'hoje' ou '7dias'
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
  const [vendasSemanais, setVendasSemanais] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Verificar se usuário está autenticado
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    // ...existing code...
    
    // Carregar dados sempre que o componente montar
    carregarDashboard();

    // Verificar se há flag de atualização pendente
    const flagAtualizar = localStorage.getItem('dashboard_atualizar');
    if (flagAtualizar) {
      // ...existing code...
      localStorage.removeItem('dashboard_atualizar');
      setForceUpdate(prev => prev + 1);
    }

    // Atualizar automaticamente a cada 10 segundos
    const interval = setInterval(() => {
      // ...existing code...
      carregarDashboard();
    }, 10000);

    // Listener para evento customizado de venda realizada
    const handleVendaRealizada = () => {
      // ...existing code...
      setTimeout(() => carregarDashboard(), 500);
    };

    window.addEventListener('vendaRealizada', handleVendaRealizada);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('vendaRealizada', handleVendaRealizada);
    };
  }, [navigate, filtro]);

  const carregarDashboard = async () => {
          // Função para normalizar nomes para comparação
          const normalizarNome = (nome) => {
            return nome
              .toLowerCase()
              .normalize('NFD')
              .replace(/\p{Diacritic}/gu, '')
              .replace(/\s+/g, ' ')
              .trim();
          };
    try {
      setCarregando(true);
      const token = localStorage.getItem('token');
      
      // ...existing code...

      // Buscar clientes da API
      const responseClientes = await fetch('http://localhost:3001/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let clientes = [];
      let clientesComDebito = [];
      let totalDebitos = 0;
      let clientesHoje = [];

      if (responseClientes.ok) {
        const dataClientes = await responseClientes.json();
        clientes = dataClientes.data || [];
        
        clientesHoje = clientes.filter(c => {
          const dataCriacao = new Date(c.createdAt);
          const hoje = new Date();
          return dataCriacao.toDateString() === hoje.toDateString();
        });

        clientesComDebito = clientes.filter(c => c.debito > 0);
        totalDebitos = clientesComDebito.reduce((acc, c) => acc + parseFloat(c.debito), 0);
      }

      // Buscar lançamentos financeiros
      const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
      // ...existing code...
      
      const hoje = new Date();
      const hojeFmt = hoje.toISOString().split('T')[0];
      // ...existing code...
      
      // Calcular data de início baseado no filtro
      const dataInicio = new Date();
      if (filtro === '7dias') {
        dataInicio.setDate(dataInicio.getDate() - 6); // Últimos 7 dias incluindo hoje
      }
      const dataInicioFmt = dataInicio.toISOString().split('T')[0];
      
      const lancamentosPeriodo = lancamentos.filter(l => {
        if (filtro === 'hoje') {
          return l.data === hojeFmt && l.tipo === 'receita';
        } else {
          return l.data >= dataInicioFmt && l.data <= hojeFmt && l.tipo === 'receita';
        }
      });
      const vendasPeriodo = lancamentosPeriodo.reduce((acc, l) => acc + l.valor, 0);
      
      // ...existing code...

      // Calcular vendas dos últimos 7 dias para o gráfico
      const vendasPorDia = [0, 0, 0, 0, 0, 0, 0];
      let totalVendas7Dias = 0;

      for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        const dataFmt = data.toISOString().split('T')[0];
        const vendasDia = lancamentos
          .filter(l => l.data === dataFmt && l.tipo === 'receita')
          .reduce((acc, l) => acc + l.valor, 0);
        vendasPorDia[6 - i] = vendasDia;
        totalVendas7Dias += vendasDia;
      }

      setVendasSemanais(vendasPorDia);

      // Buscar produtos com estoque baixo
      const responseStock = await fetch('http://localhost:3001/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let dataProdutos = null;

      if (responseStock.ok) {
        const data = await responseStock.json();
        dataProdutos = data; // Guardar para usar depois
        
        // ...existing code...
        
        // Transformar dados e filtrar produtos com estoque baixo
        const produtosBaixos = [];
        
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((produto, idx) => {
            // Usar 'nome' em vez de 'name' e 'variacoes' em vez de 'variations'
            const nomeProduto = produto.nome || produto.name;
            const variacoes = produto.variacoes || produto.variations;
            
            // ...existing code...
            
            // Se o produto não tem variações mas tem quantidade diretamente
            if (!variacoes || !Array.isArray(variacoes) || variacoes.length === 0) {
              const quantidade = produto.quantidade || produto.stock?.quantity || 0;
              const limiteMinimo = produto.estoque_minimo || produto.stock?.min_limit || 10;
              
              // ...existing code...
              
              if (quantidade > 0) { // Só processar se tiver quantidade definida
                let status = 'em-estoque';
                if (quantidade === 0) {
                  status = 'esgotado';
                } else if (quantidade <= limiteMinimo) {
                  status = 'estoque-baixo';
                }

                if (status === 'estoque-baixo' || status === 'esgotado') {
                  produtosBaixos.push({
                    nome: nomeProduto,
                    cor: '-',
                    quantidade: quantidade,
                    status: status
                  });
                  // ...existing code...
                }
              }
            } else if (variacoes && Array.isArray(variacoes)) {
              variacoes.forEach(variacao => {
                const quantidade = variacao.estoque?.quantidade || 0;
                const limiteMinimo = variacao.estoque?.limiteMinimo || 10;
                
                // ...existing code...
                
                let status = 'em-estoque';
                if (quantidade === 0) {
                  status = 'esgotado';
                } else if (quantidade <= limiteMinimo) {
                  status = 'estoque-baixo';
                }

                // ...existing code...

                // Adicionar apenas produtos com estoque baixo ou esgotado
                if (status === 'estoque-baixo' || status === 'esgotado') {
                  produtosBaixos.push({
                    nome: `${nomeProduto} (${variacao.tamanho || variacao.size})`,
                    cor: variacao.cor || variacao.color,
                    quantidade: quantidade,
                    status: status
                  });
                  // ...existing code...
                } else {
                  // ...existing code...
                }
              });
            }
          });
        }

        // Limitar a 5 produtos e ordenar por quantidade (menor primeiro)
        const produtosOrdenados = produtosBaixos
          .sort((a, b) => a.quantidade - b.quantidade)
          .slice(0, 5);
        
        setProdutosBaixoEstoque(produtosOrdenados);
        // ...existing code...
      }

      // Buscar produtos mais vendidos baseado nas vendas reais
      const vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
      // ...existing code...
      
      // Criar mapa de produtos para buscar imagens (usando nome normalizado)
      const produtosPorNome = {};
      if (dataProdutos && dataProdutos.data && Array.isArray(dataProdutos.data)) {
        dataProdutos.data.forEach(produto => {
          const nome = produto.nome || produto.name;
          const imagem = produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : null;
          if (nome) {
            produtosPorNome[normalizarNome(nome)] = imagem;
          }
        });
      }
      console.log('🗺️ Mapa de produtos criado:', Object.keys(produtosPorNome).length, 'produtos');
      console.log('🗺️ produtosPorNome:', produtosPorNome);
      
      // Se não houver vendas, tentar migrar dos lançamentos antigos
      if (vendas.length === 0 && lancamentos.length > 0) {
        // ...existing code...
        const vendasMigradas = [];
        
        lancamentos.forEach((lanc, index) => {
          if (lanc.tipo === 'receita' && lanc.descricao && lanc.descricao.startsWith('Venda #')) {
            // Extrair itens da descrição (ex: "Venda #0001 - 2x Produto A, 1x Produto B")
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
                    imagem: produtosPorNome[match[2]] || null
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
          // ...existing code...
        }
      }
      
      // Recarregar vendas após possível migração
      const vendasAtualizadas = JSON.parse(localStorage.getItem('vendas') || '[]');
      // ...existing code...
      
      // Contar quantidades vendidas por produto
      const vendasPorProduto = {};
      vendasAtualizadas.forEach(venda => {
        if (venda.itens && Array.isArray(venda.itens)) {
          venda.itens.forEach(item => {
            const chave = item.nome || item.produto;
            const chaveNormalizada = chave ? normalizarNome(chave) : '';
            if (chave) {
              if (!vendasPorProduto[chave]) {
                // Busca imagem usando nome normalizado
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
      // Log para análise dos nomes buscados e imagens
      Object.keys(vendasPorProduto).forEach(nome => {
        console.log(`🔍 Produto vendido: '${nome}' | Imagem encontrada:`, vendasPorProduto[nome].imagem);
        if (!vendasPorProduto[nome].imagem) {
          console.log(`⚠️ Imagem não encontrada para '${nome}'. Tente verificar se o nome está igual ao do banco.`);
        }
      });
      // Log para análise dos nomes buscados e imagens
      Object.keys(vendasPorProduto).forEach(nome => {
        console.log(`🔍 Produto vendido: '${nome}' | Imagem encontrada:`, vendasPorProduto[nome].imagem);
        if (!vendasPorProduto[nome].imagem) {
          console.log(`⚠️ Imagem não encontrada para '${nome}'. Tente verificar se o nome está igual ao do banco.`);
        }
      });

      // Converter para array e ordenar
      const produtosComVendas = Object.values(vendasPorProduto);
      const topProdutos = produtosComVendas
        .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
        .slice(0, 3);
      
      console.log('🏆 Top 3 produtos mais vendidos:', topProdutos);
      setProdutosMaisVendidos(topProdutos);

      setEstatisticas({
        vendasDia: vendasPeriodo,
        pedidosRealizados: lancamentosPeriodo.length,
        ticketMedio: lancamentosPeriodo.length > 0 ? vendasPeriodo / lancamentosPeriodo.length : 0,
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

  return (
    <div className="flex flex-row min-h-screen bg-background-light">
      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo Principal */}
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

          {/* Cards de Estatísticas - ajustar título do primeiro card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="flex items-center gap-4 bg-white px-4 py-5 rounded-xl border border-gray-200">
              <div className="text-gray-800 flex items-center justify-center rounded-full bg-center bg-no-repeat aspect-square bg-gray-100 w-10 shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-gray-800 text-2xl font-bold leading-tight">{formatarPreco(estatisticas.vendasDia)}</p>
                <p className="text-gray-500 text-sm font-normal leading-normal">
                  Vendas {filtro === 'hoje' ? 'de Hoje' : '(7 dias)'}
                </p>
              </div>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col gap-1.5 rounded-lg p-4 bg-white border border-gray-200">
              <p className="text-gray-600 text-sm font-medium leading-normal">
                Vendas {filtro === 'hoje' ? 'do Dia' : '(7 dias)'}
              </p>
              <p className="text-gray-800 text-2xl font-bold leading-tight">
                {carregando ? '...' : formatarPreco(estatisticas.vendasDia)}
              </p>
              <p className="text-green-600 text-sm font-medium leading-normal">
                {estatisticas.pedidosRealizados} pedidos
              </p>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg p-4 bg-white border border-gray-200">
              <p className="text-gray-600 text-sm font-medium leading-normal">Ticket Médio</p>
              <p className="text-gray-800 text-2xl font-bold leading-tight">
                {carregando ? '...' : formatarPreco(estatisticas.ticketMedio)}
              </p>
              <p className="text-gray-500 text-sm font-medium leading-normal">
                por pedido
              </p>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg p-4 bg-white border border-gray-200">
              <p className="text-gray-600 text-sm font-medium leading-normal">Total de Clientes</p>
              <p className="text-gray-800 text-2xl font-bold leading-tight">
                {carregando ? '...' : estatisticas.totalClientes}
              </p>
              <p className="text-green-600 text-sm font-medium leading-normal">
                +{estatisticas.novosClientes} hoje
              </p>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg p-4 bg-white border border-gray-200">
              <p className="text-gray-600 text-sm font-medium leading-normal">Débitos Pendentes</p>
              <p className="text-gray-800 text-2xl font-bold leading-tight">
                {carregando ? '...' : formatarPreco(estatisticas.totalDebitos)}
              </p>
              <p className="text-red-600 text-sm font-medium leading-normal">
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
