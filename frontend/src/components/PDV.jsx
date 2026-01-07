import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/apiUrl';
import { FaSearch, FaShoppingBag, FaUser, FaMoneyBill, FaCreditCard, FaQrcode, FaMinus, FaPlus, FaTrash } from 'react-icons/fa';
import CustomSelect from './CustomSelect';
import Sidebar from './Sidebar';
import ModalSelecaoVariacao from './ModalSelecaoVariacao';
import { getAuthHeaders } from '../utils/auth';


const PDV = () => {
      // Estado para comprovante/modal
      const [comprovanteVenda, setComprovanteVenda] = useState(null);
      const [mostrarComprovante, setMostrarComprovante] = useState(false);
    // Função utilitária para formatar valores monetários no padrão brasileiro
    const formatarPreco = (valor) => {
      return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
    };
  const navigate = useNavigate();
  
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [desconto, setDesconto] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState('valor'); // 'valor' ou 'percentual'
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [emitirNota, setEmitirNota] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [troco, setTroco] = useState('');
  const [modalVariacao, setModalVariacao] = useState({ isOpen: false, produto: null });
  const [configExigirCaixa, setConfigExigirCaixa] = useState(false);
  const [caixaAberto, setCaixaAberto] = useState(null);
  const [mostrarModalCaixaFechado, setMostrarModalCaixaFechado] = useState(false);
  const [modalInfo, setModalInfo] = useState({ isOpen: false, tipo: 'sucesso', titulo: '', mensagem: '', subtitulo: '' });
    const [showVendaSucesso, setShowVendaSucesso] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [vendedorSelecionado, setVendedorSelecionado] = useState(null);
  // Adicionando estado para clienteSelecionado e statusFinanceiroCliente
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [statusFinanceiroCliente, setStatusFinanceiroCliente] = useState(null);
  const [creditoDisponivel, setCreditoDisponivel] = useState(0);
  const [usarCredito, setUsarCredito] = useState(false);
  const [valorCreditoUtilizado, setValorCreditoUtilizado] = useState(0);
  // Estados para débito pendente
  const [debitoPendente, setDebitoPendente] = useState(0);
  const [pagarDebito, setPagarDebito] = useState(false);
  // Adicionando estado para armazenar clientes
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const dadosUsuario = localStorage.getItem('usuario');
    if (dadosUsuario) {
      setUsuario(JSON.parse(dadosUsuario));
    }

    buscarProdutos();
    carregarConfiguracoes();
    verificarCaixaAberto();
    buscarVendedores();
    buscarClientes();
    
    // Verificar se há pedido do catálogo para carregar
    carregarPedidoCatalogo();
  }, [navigate]);
  
  // Função para carregar pedido do catálogo no PDV
  const carregarPedidoCatalogo = () => {
    const itensCatalogo = sessionStorage.getItem('pedidoCatalogoItens');
    const infoCatalogo = sessionStorage.getItem('pedidoCatalogoInfo');
    
    if (itensCatalogo && infoCatalogo) {
      try {
        const itens = JSON.parse(itensCatalogo);
        const info = JSON.parse(infoCatalogo);
        
        // Preencher carrinho com os itens do catálogo
        setCarrinho(itens);
        
        // Mostrar notificação
        setModalInfo({
          isOpen: true,
          tipo: 'info',
          titulo: '📱 Pedido do Catálogo Carregado',
          mensagem: `Pedido #${info.numero_pedido} de ${info.cliente_nome}`,
          subtitulo: `Telefone: ${info.cliente_telefone}${info.observacoes ? `\nObs: ${info.observacoes}` : ''}`
        });
        
        // Limpar sessionStorage
        sessionStorage.removeItem('pedidoCatalogoItens');
        sessionStorage.removeItem('pedidoCatalogoInfo');
      } catch (error) {
        console.error('Erro ao carregar pedido do catálogo:', error);
      }
    }
  };
  
  // Atualizar status financeiro ao selecionar cliente
  useEffect(() => {
    if (clienteSelecionado) {
      verificarStatusFinanceiroCliente(clienteSelecionado);
    } else {
      setStatusFinanceiroCliente(null);
    }
  }, [clienteSelecionado]);

  // Esconde o toast de sucesso após 3 segundos
  useEffect(() => {
    if (showVendaSucesso) {
      const timer = setTimeout(() => setShowVendaSucesso(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showVendaSucesso]);

  const carregarConfiguracoes = async () => {
    try {
      const response = await fetch(API_URL + '/api/configurations/exigir_caixa_aberto', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setConfigExigirCaixa(data.data.valorConvertido === true);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const verificarCaixaAberto = async () => {
    try {
      const response = await fetch(API_URL + '/api/cash-registers/open/current', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setCaixaAberto(data.data);
      } else if (response.status === 404) {
        // 404 é esperado quando não há caixa aberto
        setCaixaAberto(null);
      } else {
        setCaixaAberto(null);
      }
    } catch (error) {
      // Apenas logar erros reais de conexão, não 404
      if (error.name !== 'TypeError') {
        console.error('Erro ao verificar caixa:', error);
      }
      setCaixaAberto(null);
    }
  };

  const buscarVendedores = async () => {
    try {
      console.log('🔍 Buscando vendedores...');
      const response = await fetch(API_URL + '/api/users', {
        headers: getAuthHeaders()
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('👥 Todos os usuários:', result);
        
        // A API retorna { success, count, data }
        const usuarios = result.data || result;
        
        // Filtrar apenas vendedores ativos
        const vendedoresAtivos = usuarios.filter(u => u.ativo && (u.funcao === 'vendedor' || u.funcao === 'gerente' || u.funcao === 'admin'));
        console.log('✅ Vendedores ativos:', vendedoresAtivos);
        
        setVendedores(vendedoresAtivos);
        
        // Definir usuário logado como vendedor padrão
        const dadosUsuario = localStorage.getItem('usuario');
        if (dadosUsuario) {
          const user = JSON.parse(dadosUsuario);
          console.log('👤 Definindo vendedor padrão:', user.nome);
          setVendedorSelecionado(user.nome);
        }
      } else {
        console.error('❌ Erro na resposta:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar vendedores:', error);
    }
  };

  const buscarProdutos = async () => {
    try {
      setCarregando(true);
      const response = await fetch(API_URL + '/api/products', {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Falha ao buscar produtos');

      const data = await response.json();
      console.log('🔍 Dados da API:', data.data[0]); // Debug
      
      // Agrupar produtos (não mostrar variações separadas no grid)
      const produtosAgrupados = data.data.map(produto => ({
        id: produto.id,
        nome: produto.nome,
        preco: parseFloat(produto.precoVenda),
        precoVenda: parseFloat(produto.precoVenda),
        categoria: produto.categoria,
        imagem: produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : null,
        variacoes: produto.variacoes && produto.variacoes.length > 0 ? produto.variacoes.map(v => ({
          id: v.id,
          tamanho: v.tamanho,
          cor: v.cor,
          estoque: v.estoque ? {
            quantidade: v.estoque.quantidade || 0,
            id: v.estoque.id,
            limiteMinimo: v.estoque.limiteMinimo || 5
          } : null,
          stockId: v.estoque?.id,
          sku: v.sku
        })) : []
      }));
      
      console.log('✅ Produtos processados:', produtosAgrupados[0]); // Debug

      setProdutos(produtosAgrupados);
      setProdutosFiltrados(produtosAgrupados);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      alert('Erro ao carregar produtos');
    } finally {
      setCarregando(false);
    }
  };

  // Filtrar produtos por busca e categoria
  useEffect(() => {
    let resultado = produtos;

    if (categoriaAtiva !== 'Todos') {
      resultado = resultado.filter(p => p.categoria === categoriaAtiva);
    }

    if (busca) {
      resultado = resultado.filter(p => 
        p.nome.toLowerCase().includes(busca.toLowerCase())
      );
    }

    setProdutosFiltrados(resultado);
  }, [busca, categoriaAtiva, produtos]);

  // Obter categorias únicas
  const categorias = ['Todos', ...new Set(produtos.map(p => p.categoria))];

  const adicionarAoCarrinho = (produto) => {
    try {
      console.log('🛒 Tentando adicionar produto:', produto);
      console.log('📦 Variações do produto:', produto?.variacoes);
      
      // Verificar se produto existe
      if (!produto) {
        console.error('❌ Produto não definido');
        alert('Erro: Produto não encontrado');
        return;
      }
      
      // Verificar se produto tem variações
      if (!produto.variacoes || produto.variacoes.length === 0) {
        console.error('❌ Produto sem variações:', produto);
        alert('Produto sem variações cadastradas');
        return;
      }
      
      // Verificar se produto tem variações disponíveis
      const variacoesComEstoque = produto.variacoes.filter(v => {
        const quantidade = v.estoque?.quantidade || 0;
        console.log(`  - ${v.tamanho}/${v.cor}: ${quantidade} unidades`);
        return quantidade > 0;
      });
      
      console.log('✅ Variações com estoque:', variacoesComEstoque.length);
      
      if (variacoesComEstoque.length === 0) {
        alert('Produto sem estoque disponível');
        return;
      }
      
      // Se produto tem múltiplas variações ou usuário quer escolher, abrir modal
      if (variacoesComEstoque.length > 1) {
        console.log('🔄 Abrindo modal de seleção...');
        setModalVariacao({ isOpen: true, produto });
      } else if (variacoesComEstoque.length === 1) {
        console.log('➕ Adicionando variação única ao carrinho...');
        const variacao = variacoesComEstoque[0];
        adicionarVariacaoAoCarrinho(produto, variacao);
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar produto ao carrinho:', error);
      alert('Erro ao adicionar produto ao carrinho: ' + error.message);
    }
  };

  const adicionarVariacaoAoCarrinho = (produto, variacao) => {
    try {
      console.log('➕ Adicionando variação ao carrinho:', { produto, variacao });
      
      const itemExistente = carrinho.find(item => item.variacaoId === variacao.id);
      const quantidadeEstoque = variacao.estoque?.quantidade || 0;
      
      if (itemExistente) {
        if (itemExistente.quantidade >= quantidadeEstoque) {
          alert('Quantidade máxima em estoque atingida');
          return;
        }
        atualizarQuantidade(itemExistente.id, itemExistente.quantidade + 1);
      } else {
        const novoItem = {
          id: Date.now(),
          produtoId: produto.id,
          variacaoId: variacao.id,
          stockId: variacao.stockId,
          nome: produto.nome,
          tamanho: variacao.tamanho,
          cor: variacao.cor,
          preco: produto.preco,
          quantidade: 1,
          imagem: produto.imagem,
          estoqueMax: quantidadeEstoque,
          estoqueDisponivel: quantidadeEstoque
        };
        console.log('🆕 Novo item no carrinho:', novoItem);
        setCarrinho([...carrinho, novoItem]);
      }
      
      // Fechar modal se estiver aberto
      setModalVariacao({ isOpen: false, produto: null });
    } catch (error) {
      console.error('❌ Erro ao adicionar variação ao carrinho:', error);
      alert('Erro ao adicionar variação ao carrinho: ' + error.message);
    }
  };

  const atualizarQuantidade = (itemId, novaQuantidade) => {
    if (novaQuantidade < 1) return;
    
    setCarrinho(carrinho.map(item => {
      if (item.id === itemId) {
        if (novaQuantidade > item.estoqueMax) {
          alert('Quantidade máxima em estoque atingida');
          return item;
        }
        return { ...item, quantidade: novaQuantidade };
      }
      return item;
    }));
  };

  const removerDoCarrinho = (itemId) => {
    setCarrinho(carrinho.filter(item => item.id !== itemId));
  };

  const calcularSubtotal = () => {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };

  const calcularDesconto = () => {
    if (!desconto || desconto === '' || parseFloat(desconto) <= 0) {
      return 0;
    }

    const valorDesconto = parseFloat(desconto);
    const subtotal = calcularSubtotal();

    if (tipoDesconto === 'percentual') {
      // Calcular desconto percentual
      return (subtotal * valorDesconto) / 100;
    } else {
      // Desconto em valor fixo
      // Não pode ser maior que o subtotal
      return Math.min(valorDesconto, subtotal);
    }
  };

  const calcularTotal = () => {
    let total = calcularSubtotal() - calcularDesconto();
    
    // Adicionar débito pendente ao total se marcado para pagamento
    if (pagarDebito && debitoPendente > 0) {
      total += debitoPendente;
    }
    
    return total;
  };

  const calcularTotalComCredito = () => {
    const total = calcularTotal();
    return Math.max(0, total - valorCreditoUtilizado);
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      setModalInfo({
        isOpen: true,
        tipo: 'aviso',
        titulo: 'Carrinho Vazio',
        mensagem: 'Adicione produtos ao carrinho antes de finalizar a venda.',
        subtitulo: ''
      });
      return;
    }

    // Verificar se exige caixa aberto
    if (configExigirCaixa && !caixaAberto) {
      setMostrarModalCaixaFechado(true);
      return;
    }

    // Validar troco se pagamento for em dinheiro
    if (formaPagamento === 'Dinheiro' && troco) {
      if (parseFloat(troco) < calcularTotal()) {
        setModalInfo({
          isOpen: true,
          tipo: 'erro',
          titulo: 'Valor Insuficiente',
          mensagem: `O valor informado (R$ ${parseFloat(troco).toFixed(2)}) é menor que o total da venda (R$ ${calcularTotal().toFixed(2)}).`,
          subtitulo: 'Valor do troco'
        });
        return;
      }
    }

    const venda = {
      itens: carrinho,
      formaPagamento,
      subtotal: calcularSubtotal(),
      desconto: calcularDesconto(),
      total: calcularTotal(),
      troco: formaPagamento === 'Dinheiro' && troco ? (parseFloat(troco) - calcularTotal()).toFixed(2) : '0.00',
      emitirNota,
      vendedor: vendedorSelecionado || usuario?.nome || 'Sistema',
      caixaId: caixaAberto?.id,
      clienteId: clienteSelecionado || null,
      creditoUtilizado: usarCredito ? valorCreditoUtilizado : 0,
      totalPago: usarCredito ? calcularTotalComCredito() : calcularTotal()
    };
    
    // Dar baixa no estoque de cada item
    try {
      
      for (const item of carrinho) {
        if (!item.variacaoId) {
          console.error('Item sem variacaoId:', item);
          continue;
        }
        
        // Atualizar estoque usando a rota correta
        const responseEstoque = await fetch(`${API_URL}/api/products/stock/${item.variacaoId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            quantity: item.quantidade,
            operation: 'subtract'
          })
        });

        if (!responseEstoque.ok) {
          const erro = await responseEstoque.text();
          console.error(`Erro ao atualizar estoque de ${item.nome}:`, erro);
        }
      }
    } catch (error) {
      console.error('Erro ao dar baixa no estoque:', error);
    }
    
    // Registrar venda como lançamento de receita no financeiro
    await registrarVendaNoFinanceiro(venda);
    
    // Calcular troco se houver
    const valorTroco = formaPagamento === 'Dinheiro' && troco && parseFloat(troco) > calcularTotal()
      ? parseFloat(troco) - calcularTotal()
      : 0;
    
    // Criar objeto comprovante
    const comprovante = {
      itens: carrinho,
      formaPagamento,
      subtotal: calcularSubtotal(),
      desconto: calcularDesconto(),
      total: calcularTotal(),
      troco: valorTroco,
      vendedor: vendedorSelecionado || usuario?.nome || 'Sistema',
      data: new Date().toLocaleString('pt-BR')
    };


    // Salvar comprovante para opção do usuário
    setComprovanteVenda(comprovante);
    setMostrarComprovante(false);

    // Mostrar mensagem de sucesso
    setModalInfo({
      isOpen: true,
      tipo: 'sucesso',
      titulo: 'Venda Realizada!',
      mensagem: `Total: R$ ${calcularTotal().toFixed(2)}` + (valorTroco > 0 ? ` | Troco: R$ ${valorTroco.toFixed(2)}` : ''),
      subtitulo: 'Deseja gerar comprovante de venda?'
    });
    setShowVendaSucesso(true);

    limparVenda();
    buscarProdutos();
    localStorage.setItem('dashboard_atualizar', Date.now().toString());
  };

  const registrarVendaNoFinanceiro = async (venda) => {
    // Buscar lançamentos existentes
    const lancamentosSalvos = localStorage.getItem('lancamentos');
    let lancamentos = lancamentosSalvos ? JSON.parse(lancamentosSalvos) : [];
    
    // Gerar número da venda
    const vendasExistentes = lancamentos.filter(l => l.descricao.startsWith('Venda #'));
    const numeroVenda = vendasExistentes.length + 1;
    
    // Gerar descrição com itens vendidos
    const itensDescricao = venda.itens.map(item => 
      `${item.quantidade}x ${item.nome}`
    ).join(', ');
    
    // Data de hoje no formato correto
    const hoje = new Date();
    const dataHoje = hoje.toISOString().split('T')[0];
    const dataHoraCompleta = hoje.toISOString();
    
    // Montar informações financeiras relevantes (apenas desconto, crédito e débito)
    let detalhesFinanceiros = [];
    
    // Desconto
    if (venda.desconto > 0) {
      detalhesFinanceiros.push(`Desconto: R$ ${venda.desconto.toFixed(2)}`);
    }
    
    // Crédito utilizado
    if (usarCredito && valorCreditoUtilizado > 0) {
      detalhesFinanceiros.push(`Crédito usado: R$ ${valorCreditoUtilizado.toFixed(2)}`);
    }
    
    // Débito pago
    if (pagarDebito && debitoPendente > 0) {
      detalhesFinanceiros.push(`Débito pago: R$ ${debitoPendente.toFixed(2)}`);
    }
    
    // Criar lançamento de receita
    const novoLancamento = {
      id: Date.now(),
      tipo: 'receita',
      descricao: `Venda #${String(numeroVenda).padStart(4, '0')} - ${itensDescricao}`,
      valor: venda.total,
      categoria: 'Vendas',
      data: dataHoje,
      dataHora: dataHoraCompleta,
      status: 'pago',
      formaPagamento: venda.formaPagamento,
      observacoes: detalhesFinanceiros.length > 0 ? detalhesFinanceiros.join(' | ') : null
    };
    
    // Adicionar aos lançamentos
    lancamentos.push(novoLancamento);
    localStorage.setItem('lancamentos', JSON.stringify(lancamentos));

    // Preparar dados da venda para enviar ao backend
    const vendaCompleta = {
      numeroVenda: numeroVenda,
      itens: venda.itens.map(item => ({
        nome: item.nome,
        produto: item.produto,
        sku: item.sku,
        quantidade: item.quantidade,
        preco: item.preco,
        imagem: item.imagem
      })),
      formaPagamento: venda.formaPagamento,
      subtotal: venda.subtotal,
      desconto: venda.desconto,
      total: venda.total,
      troco: venda.troco,
      vendedor: venda.vendedor,
      caixaId: venda.caixaId,
      clienteId: clienteSelecionado || null,
      creditoUtilizado: usarCredito ? valorCreditoUtilizado : 0,
      debitoPago: pagarDebito ? debitoPendente : 0,
      tipoDesconto: desconto && parseFloat(desconto) > 0 ? tipoDesconto : null,
      valorDescontoOriginal: desconto && parseFloat(desconto) > 0 ? parseFloat(desconto) : null,
      observacoes: detalhesFinanceiros.length > 0 ? detalhesFinanceiros.join(' | ') : null,
      data: dataHoje,
      dataHora: dataHoraCompleta
    };

    // Salvar venda no backend (banco de dados)
    try {
      const responseSale = await fetch(API_URL + '/api/sales', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(vendaCompleta)
      });

      if (responseSale.ok) {
        const saleData = await responseSale.json();
        console.log('✅ Venda salva no banco de dados:', saleData);
      } else {
        console.error('❌ Erro ao salvar venda no banco de dados');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar venda no backend:', error);
    }

    // Se o cliente usou crédito, registrar a transação
    if (usarCredito && clienteSelecionado && valorCreditoUtilizado > 0) {
      try {
        // Buscar dados atuais do cliente
        const responseCliente = await fetch(`${API_URL}/api/customers/${clienteSelecionado}`, {
          headers: getAuthHeaders()
        });

        if (responseCliente.ok) {
          const clienteData = await responseCliente.json();

          // Registrar transação no histórico do cliente (CustomerTransaction)
          // A transação tipo 'usar-credito' vai automaticamente aumentar o débito do cliente
          const transacaoCliente = {
            tipo: 'usar-credito',
            valor: valorCreditoUtilizado,
            descricao: `Crédito utilizado em venda #${String(numeroVenda).padStart(4, '0')}`,
              data: dataHoje
            };

            console.log('📤 Enviando transação:', transacaoCliente);

            const responseTransacaoCliente = await fetch(`${API_URL}/api/customers/${clienteSelecionado}/transactions`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(transacaoCliente)
            });

            if (responseTransacaoCliente.ok) {
              console.log('✅ Transação de uso de crédito registrada no histórico do cliente');
              
              // Atualizar dados do cliente na interface após uso do crédito
              await verificarStatusFinanceiroCliente(clienteSelecionado);
            } else {
              const errorData = await responseTransacaoCliente.json();
              console.error('❌ Erro ao registrar transação no histórico do cliente:', errorData);
            }
          }
        } catch (error) {
          console.error('❌ Erro ao processar uso de crédito:', error);
        }
      }

    // Se o cliente está pagando débito pendente, registrar a transação
    if (pagarDebito && clienteSelecionado && debitoPendente > 0) {
      try {
        const transacaoPagamento = {
          tipo: 'pagar',
          valor: debitoPendente,
          descricao: `Pagamento de débito junto com venda #${String(numeroVenda).padStart(4, '0')}`,
          data: dataHoje
        };

        console.log('📤 Enviando transação de pagamento:', transacaoPagamento);

        const responseTransacaoPagamento = await fetch(`${API_URL}/api/customers/${clienteSelecionado}/transactions`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(transacaoPagamento)
        });

        if (responseTransacaoPagamento.ok) {
          console.log('✅ Pagamento de débito registrado no histórico do cliente');
          
          // Atualizar dados do cliente na interface após pagamento
          await verificarStatusFinanceiroCliente(clienteSelecionado);
        } else {
          const errorData = await responseTransacaoPagamento.json();
          console.error('❌ Erro ao registrar pagamento no histórico do cliente:', errorData);
        }
      } catch (error) {
        console.error('❌ Erro ao processar pagamento de débito:', error);
      }
    }
    
    // Disparar evento customizado para atualizar dashboard
    window.dispatchEvent(new CustomEvent('vendaRealizada', { detail: novoLancamento }));
  };

  const limparVenda = () => {
    setCarrinho([]);
    setDesconto('');
    setTipoDesconto('valor');
    setTroco('');
    setFormaPagamento('Dinheiro');
    setEmitirNota(false);
    setUsarCredito(false);
    setValorCreditoUtilizado(0);
    setPagarDebito(false);
  };

  const ImagemProduto = ({ src, alt }) => {
    const [erro, setErro] = useState(false);
    
    if (erro || !src) {
      return (
        <div className="w-full h-full aspect-square bg-slate-100 flex items-center justify-center rounded-lg">
          <FaShoppingBag className="w-8 h-8 text-slate-400" />
        </div>
      );
    }
    
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-full aspect-square object-cover rounded-lg"
        onError={() => setErro(true)}
      />
    );
  };

  // Função para buscar clientes da API
  const buscarClientes = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/customers', { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Resposta da API de clientes:', data);
        // Verificar se data é um array ou um objeto com propriedade data
        const clientesArray = Array.isArray(data) ? data : (data.data || []);
        setClientes(clientesArray);
        console.log('✅ Clientes carregados:', clientesArray.length);
      } else {
        console.error('Erro ao buscar clientes:', response.statusText);
        setClientes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClientes([]);
    }
  };

  // Função para verificar status financeiro do cliente
  const verificarStatusFinanceiroCliente = async (clienteId) => {
    if (!clienteId) {
      setStatusFinanceiroCliente(null);
      setCreditoDisponivel(0);
      setUsarCredito(false);
      setValorCreditoUtilizado(0);
      setDebitoPendente(0);
      setPagarDebito(false);
      return;
    }
    
    try {
      // Buscar dados atualizados do cliente da API
      const response = await fetch(`${API_URL}/api/customers/${clienteId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        console.log('❌ Erro ao buscar cliente');
        setStatusFinanceiroCliente(null);
        setCreditoDisponivel(0);
        setUsarCredito(false);
        setValorCreditoUtilizado(0);
        setDebitoPendente(0);
        setPagarDebito(false);
        return;
      }

      const { data: clienteEncontrado } = await response.json();
      
      console.log('👤 Cliente selecionado:', clienteEncontrado);
      console.log('💰 Débito do cliente:', clienteEncontrado.debito);
      console.log('💳 Limite de crédito:', clienteEncontrado.limiteCredito);
      
      const valorDebito = parseFloat(clienteEncontrado.debito) || 0;
      const limiteCredito = parseFloat(clienteEncontrado.limiteCredito) || 0;
      const creditoDisp = limiteCredito - valorDebito;
      
      console.log('✨ Crédito disponível:', creditoDisp);
      
      setCreditoDisponivel(creditoDisp > 0 ? creditoDisp : 0);
      setDebitoPendente(valorDebito);
      
      if (valorDebito > 0) {
        console.log('🔴 Cliente possui débito de R$', valorDebito);
        setStatusFinanceiroCliente('debito');
      } else {
        console.log('✅ Cliente sem débito');
        setStatusFinanceiroCliente('credito');
      }

      // Atualizar também o array de clientes no estado para manter sincronizado
      setClientes(prevClientes => 
        prevClientes.map(c => c.id === clienteId ? clienteEncontrado : c)
      );
    } catch (error) {
      console.error('❌ Erro ao verificar status financeiro:', error);
      setStatusFinanceiroCliente(null);
      setCreditoDisponivel(0);
      setUsarCredito(false);
      setValorCreditoUtilizado(0);
      setDebitoPendente(0);
      setPagarDebito(false);
    }
  };

  return (
    <div className="layout-with-sidebar">
      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo Principal */}
      <div className="main-content content-with-hamburger flex flex-col overflow-hidden">
        {/* Header do PDV */}
        <header className="flex shrink-0 items-center justify-between whitespace-nowrap border-b border-slate-200 px-4 sm:px-6 h-16 bg-white mobile-header-spacing">
          <h2 className="text-slate-900 text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
            Ponto de Venda (PDV)
          </h2>
          <div className="flex items-center gap-2 sm:gap-4">
            {configExigirCaixa && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${caixaAberto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <div className={`w-2 h-2 rounded-full ${caixaAberto ? 'bg-green-600' : 'bg-red-600'}`}></div>
                <span className="text-sm font-medium">
                  Caixa: {caixaAberto ? 'Aberto' : 'Fechado'}
                </span>
              </div>
            )}
            <p className="text-sm text-slate-600">Operador: {usuario?.name || 'Usuário'}</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 p-2 sm:p-4 md:p-6 overflow-hidden">
        {/* Coluna Esquerda: Produtos */}
        <section className="col-span-12 lg:col-span-5 flex flex-col gap-3 sm:gap-4 overflow-hidden">
          <div className="bg-white rounded-xl shadow-sm p-2 sm:p-4 flex flex-col overflow-hidden max-h-full">
            {/* Busca */}
            <div className="relative">
              {/* Substituindo o componente Search pelo ícone FaSearch */}
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary h-12 placeholder:text-slate-500 pl-12 text-base font-normal leading-normal bg-background-light border-transparent"
                placeholder="Buscar por código ou nome do produto"
              />
            </div>

            {/* Filtro de Categorias */}
            <div className="flex gap-2 sm:gap-3 py-2 sm:py-4 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              {categorias.map(categoria => (
                <button
                  key={categoria}
                  onClick={() => setCategoriaAtiva(categoria)}
                  className={`flex h-8 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-4 ${
                    categoriaAtiva === categoria
                      ? 'bg-primary/20 text-primary'
                      : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                >
                  <p className="text-sm font-medium leading-normal">{categoria}</p>
                </button>
              ))}
            </div>

            {/* Grid de Produtos */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2 sm:gap-3 overflow-y-auto max-h-[60vh] pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              {carregando ? (
                <div className="col-span-full flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : produtosFiltrados.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-8 text-slate-500">
                  <FaShoppingBag className="w-12 h-12 mb-2 text-slate-300" />
                  <p>Nenhum produto encontrado</p>
                </div>
              ) : (
                produtosFiltrados.map(produto => (
                  <div
                    key={produto.id}
                    onClick={() => adicionarAoCarrinho(produto)}
                    className="flex flex-col cursor-pointer group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all border border-slate-100 hover:border-primary"
                  >
                    <div className="relative overflow-hidden">
                      <ImagemProduto src={produto.imagem} alt={produto.nome} />
                      {/* Badge de estoque */}
                      {produto.variacoes && produto.variacoes.length > 0 && (
                        <div className="absolute top-2 right-2 bg-slate-900/90 text-white px-2 py-1 rounded-md text-[10px] font-semibold shadow-lg">
                          {produto.variacoes.reduce((total, v) => total + (v.estoque?.quantidade || 0), 0)} un.
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 flex flex-col gap-1">
                      <p className="text-slate-900 text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">
                        {produto.nome}
                      </p>
                      <p className="text-primary text-base font-bold">
                        {formatarPreco(produto.preco)}
                      </p>
                      {/* Variações disponíveis */}
                      {produto.variacoes && produto.variacoes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {produto.variacoes.map((variacao, idx) => {
                            const quantidadeEstoque = variacao.estoque?.quantidade || 0;
                            return (
                              <span
                                key={idx}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                  quantidadeEstoque > 0
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                                title={`${variacao.tamanho} - ${variacao.cor}: ${quantidadeEstoque} un.`}
                              >
                                {variacao.tamanho}/{variacao.cor} ({quantidadeEstoque} un.)
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Coluna Central: Carrinho */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 h-full flex flex-col">
            <h2 className="text-slate-900 text-xl font-semibold leading-tight px-2 pb-3 pt-1">
              Carrinho
            </h2>
            
            {/* Itens do Carrinho */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-2">
              {carrinho.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <FaShoppingBag className="w-16 h-16 mb-3 text-slate-300" />
                  <p>Carrinho vazio</p>
                  <p className="text-xs">Adicione produtos para começar</p>
                </div>
              ) : (
                carrinho.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 py-3 ${
                      index > 0 ? 'border-t border-slate-100' : ''
                    }`}
                  >
                    <div className="w-16 h-16 flex-shrink-0">
                      <ImagemProduto src={item.imagem} alt={item.nome} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight mb-1 line-clamp-2">{item.nome}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {item.tamanho}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {item.cor}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          (Est: {item.estoqueDisponivel})
                        </span>
                      </div>
                      <p className="text-sm font-bold text-primary">
                        {formatarPreco(item.preco)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                          className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 flex-shrink-0"
                        >
                          <FaMinus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                          className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 flex-shrink-0"
                        >
                          <FaPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removerDoCarrinho(item.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <FaTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Resumo */}
            <div className="border-t border-slate-200 mt-auto pt-4 px-2 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <p className="text-slate-600">Subtotal</p>
                <p className="font-medium">{formatarPreco(calcularSubtotal())}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="text-slate-600">Descontos</p>
                <p className="font-medium text-green-600">- {formatarPreco(calcularDesconto())}</p>
              </div>
              {pagarDebito && debitoPendente > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-600">Débito pendente</p>
                  <p className="font-medium text-orange-600">+ {formatarPreco(debitoPendente)}</p>
                </div>
              )}
              {usarCredito && valorCreditoUtilizado > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <p className="text-slate-600">Crédito usado</p>
                  <p className="font-medium text-blue-600">- {formatarPreco(valorCreditoUtilizado)}</p>
                </div>
              )}
              <div className="flex items-center justify-between text-lg font-bold">
                <p>Total a Pagar</p>
                <p>{formatarPreco(usarCredito ? calcularTotalComCredito() : calcularTotal())}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Coluna Direita: Pagamento */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5 h-full flex flex-col">
            <h2 className="text-slate-900 text-xl font-semibold leading-tight pb-4">
              Pagamento
            </h2>
            
            <div className="space-y-3">
              {/* Desconto */}
              <label className="flex flex-col">
                <span className="text-sm font-medium mb-1 text-slate-700">Desconto</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                    className="form-input flex-grow min-w-0 rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary h-12 placeholder:text-slate-500 px-4 text-base bg-background-light border border-slate-300"
                    placeholder={tipoDesconto === 'percentual' ? "0" : "0.00"}
                    min="0"
                    step={tipoDesconto === 'percentual' ? "1" : "0.01"}
                  />
                  <div className="w-20">
                    <CustomSelect
                      value={tipoDesconto}
                      onChange={val => { setTipoDesconto(val); setDesconto(''); }}
                      options={[
                        { value: 'valor', label: 'R$' },
                        { value: 'percentual', label: '%' }
                      ]}
                      placeholder="Tipo"
                    />
                  </div>
                </div>
                {desconto && parseFloat(desconto) > 0 && (
                  <span className="text-xs text-green-600 mt-1">
                    Desconto aplicado: {formatarPreco(calcularDesconto())}
                  </span>
                )}
              </label>

              {/* Seleção de Cliente */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <FaUser className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Cliente</span>
                </div>
                <CustomSelect
                  value={clienteSelecionado || ''}
                  onChange={setClienteSelecionado}
                  options={[
                    { value: '', label: 'Cliente não identificado' },
                    ...((Array.isArray(clientes) ? clientes : []).map(cliente => ({ value: cliente.id, label: cliente.nome })) )
                  ]}
                  placeholder="Selecione o cliente"
                />
                {statusFinanceiroCliente === 'debito' && (
                  <div className="mt-2 flex items-center gap-2 px-2 py-1 rounded-md bg-red-50 border border-red-200">
                    <svg className="w-3.5 h-3.5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-red-700">Cliente com débito pendente</span>
                  </div>
                )}
                {creditoDisponivel > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-blue-50 border border-blue-200">
                      <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-blue-700 font-medium">Crédito disponível: {formatarPreco(creditoDisponivel)}</span>
                    </div>
                    <label className="mt-2 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usarCredito}
                        onChange={(e) => {
                          setUsarCredito(e.target.checked);
                          if (e.target.checked) {
                            const total = calcularTotal();
                            const valorAUsar = Math.min(creditoDisponivel, total);
                            setValorCreditoUtilizado(valorAUsar);
                          } else {
                            setValorCreditoUtilizado(0);
                          }
                        }}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-xs text-slate-600">Usar crédito nesta compra</span>
                    </label>
                    {usarCredito && (
                      <div className="mt-2 px-2 py-1 rounded-md bg-green-50 border border-green-200">
                        <span className="text-xs text-green-700 font-medium">
                          Valor do crédito aplicado: {formatarPreco(valorCreditoUtilizado)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {debitoPendente > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-orange-50 border border-orange-200">
                      <svg className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-orange-700 font-medium">Débito pendente: {formatarPreco(debitoPendente)}</span>
                    </div>
                    <label className="mt-2 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pagarDebito}
                        onChange={(e) => setPagarDebito(e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-xs text-slate-600">Pagar débito junto com esta compra</span>
                    </label>
                    {pagarDebito && (
                      <div className="mt-2 px-2 py-1 rounded-md bg-green-50 border border-green-200">
                        <span className="text-xs text-green-700 font-medium">
                          Débito a ser pago: {formatarPreco(debitoPendente)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Seleção de Vendedor */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  {/* Substituindo o componente User pelo ícone FaUser */}
                  <FaUser className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Vendedor</span>
                </div>
                <CustomSelect
                  value={vendedorSelecionado || ''}
                  onChange={setVendedorSelecionado}
                  options={[
                    { value: '', label: 'Sistema' },
                    ...vendedores.map(vendedor => ({
                      value: vendedor.nome,
                      label: `${vendedor.nome} • ${vendedor.funcao === 'admin' ? 'Admin' : vendedor.funcao === 'gerente' ? 'Gerente' : 'Vendedor'}`
                    }))
                  ]}
                  placeholder="Selecione o vendedor"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Selecione o vendedor responsável por esta venda
                </p>
              </div>

              {/* Forma de Pagamento */}
              <div className="pt-2">
                <span className="text-sm font-medium text-slate-700">Forma de Pagamento</span>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => setFormaPagamento('Dinheiro')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 border-2 ${
                      formaPagamento === 'Dinheiro'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <FaMoneyBill className="w-5 h-5" />
                    <span className="text-sm font-bold">Dinheiro</span>
                  </button>
                  <button
                    onClick={() => setFormaPagamento('Débito')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 border-2 ${
                      formaPagamento === 'Débito'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <FaCreditCard className="w-5 h-5" />
                    <span className="text-sm font-bold">Débito</span>
                  </button>
                  <button
                    onClick={() => setFormaPagamento('Crédito')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 border-2 ${
                      formaPagamento === 'Crédito'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <FaCreditCard className="w-5 h-5" />
                    <span className="text-sm font-bold">Crédito</span>
                  </button>
                  <button
                    onClick={() => setFormaPagamento('Pix')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 border-2 ${
                      formaPagamento === 'Pix'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <FaQrcode className="w-5 h-5" />
                    <span className="text-sm font-bold">Pix</span>
                  </button>
                </div>
              </div>

              {/* Campo de Troco - só aparece se pagamento for em Dinheiro */}
              {formaPagamento === 'Dinheiro' && (
                <div className="pt-2">
                  <label className="flex flex-col">
                    <span className="text-sm font-medium mb-1 text-slate-700">Troco para</span>
                    <input
                      type="number"
                      step="0.01"
                      value={troco}
                      onChange={(e) => setTroco(e.target.value)}
                      className="form-input rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary h-10 placeholder:text-slate-500 px-3 text-sm border-2 border-slate-300"
                      placeholder="R$ 0,00"
                    />
                  </label>
                  {troco && parseFloat(troco) > calcularTotal() && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">Troco a devolver:</span>
                        <span className="text-lg font-bold text-green-700">
                          {formatarPreco(parseFloat(troco) - calcularTotal())}
                        </span>
                      </div>
                    </div>
                  )}
                  {troco && parseFloat(troco) > 0 && parseFloat(troco) < calcularTotal() && (
                    <p className="text-red-500 text-xs mt-1">Valor insuficiente para o total da venda</p>
                  )}
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="mt-auto pt-4 sm:pt-6 flex flex-col gap-2 sm:gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emitirNota}
                  onChange={(e) => setEmitirNota(e.target.checked)}
                  className="form-checkbox rounded text-primary focus:ring-primary/50 border-slate-300"
                />
                <span className="text-sm">Emitir Nota Fiscal (NFC-e)</span>
              </label>
              
              <button
                onClick={finalizarVenda}
                className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-4 bg-primary hover:bg-blue-700 text-white text-lg font-bold tracking-[0.015em]"
              >
                Finalizar Venda
              </button>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button className="w-full flex items-center justify-center text-base font-medium rounded-lg h-12 border border-slate-300 hover:bg-slate-100">
                  Salvar Orçamento
                </button>
                <button
                  onClick={limparVenda}
                  className="w-full flex items-center justify-center text-base font-medium rounded-lg h-12 border border-red-300 text-red-600 hover:bg-red-50"
                >
                  Cancelar Venda
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal de Seleção de Variação */}
      <ModalSelecaoVariacao
        isOpen={modalVariacao.isOpen}
        onClose={() => setModalVariacao({ isOpen: false, produto: null })}
        produto={modalVariacao.produto}
        onConfirmar={(variacao) => {
          adicionarVariacaoAoCarrinho(modalVariacao.produto, variacao);
        }}
      />

      {/* Modal de Caixa Fechado */}
      {mostrarModalCaixaFechado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header com Gradiente */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Caixa Fechado</h3>
                  <p className="text-white/90 text-sm mt-1">Ação necessária</p>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              <p className="text-slate-700 text-base leading-relaxed mb-6">
                É necessário abrir um caixa para realizar vendas.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">💡 Dica:</span> Acesse o menu <strong>Caixa</strong> para abrir o caixa antes de continuar.
                </p>
              </div>

              {/* Ações */}
              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarModalCaixaFechado(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setMostrarModalCaixaFechado(false);
                    navigate('/caixa');
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                >
                  Ir para Caixa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Universal de Informação/Sucesso/Erro/Aviso */}
      {modalInfo.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header Dinâmico baseado no tipo */}
            <div className={`p-6 text-white ${
              modalInfo.tipo === 'sucesso' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
              modalInfo.tipo === 'erro' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
              modalInfo.tipo === 'aviso' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
              'bg-gradient-to-r from-blue-500 to-indigo-500'
            }`}>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  {modalInfo.tipo === 'sucesso' && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {modalInfo.tipo === 'erro' && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {modalInfo.tipo === 'aviso' && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {modalInfo.tipo === 'info' && (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{modalInfo.titulo}</h3>
                  {modalInfo.subtitulo && (
                    <p className="text-white/90 text-sm mt-1">{modalInfo.subtitulo}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              <p className="text-slate-700 text-base leading-relaxed text-center mb-6">
                {modalInfo.mensagem}
              </p>

              {/* Botão de Ação */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setModalInfo({ ...modalInfo, isOpen: false })}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl ${
                    modalInfo.tipo === 'sucesso' ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white' :
                    modalInfo.tipo === 'erro' ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white' :
                    modalInfo.tipo === 'aviso' ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white' :
                    'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                  }`}
                >
                  OK
                </button>
                {modalInfo.tipo === 'sucesso' && comprovanteVenda && (
                  <button
                    onClick={() => setMostrarComprovante(true)}
                    className="w-full px-4 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Gerar Comprovante
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Comprovante de Venda */}
      {comprovanteVenda && mostrarComprovante && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 print:max-w-full print:rounded-none print:shadow-none">
            <div className="p-6">
              <h2 className="text-xl font-bold text-center mb-2">Comprovante de Venda</h2>
              <p className="text-sm text-center text-slate-600 mb-4">{comprovanteVenda.data}</p>
              <div className="mb-4">
                <p className="text-sm"><strong>Vendedor:</strong> {comprovanteVenda.vendedor}</p>
                <p className="text-sm"><strong>Forma de Pagamento:</strong> {comprovanteVenda.formaPagamento}</p>
              </div>
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Produto</th>
                    <th className="text-center py-1">Qtd</th>
                    <th className="text-right py-1">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {comprovanteVenda.itens.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{item.nome}</td>
                      <td className="text-center py-1">{item.quantidade}</td>
                      <td className="text-right py-1">{formatarPreco(item.preco)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mb-2 flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatarPreco(comprovanteVenda.subtotal)}</span>
              </div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Desconto:</span>
                <span>- {formatarPreco(comprovanteVenda.desconto)}</span>
              </div>
              <div className="mb-2 flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatarPreco(comprovanteVenda.total)}</span>
              </div>
              {comprovanteVenda.troco > 0 && (
                <div className="mb-2 flex justify-between text-sm">
                  <span>Troco:</span>
                  <span>{formatarPreco(comprovanteVenda.troco)}</span>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl print:hidden"
                >
                  Imprimir
                </button>
                <button
                  onClick={() => {
                    setMostrarComprovante(false);
                    setModalInfo({ ...modalInfo, isOpen: false });
                  }}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors print:hidden"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast de sucesso da venda - estilo padrão do sistema */}
      {showVendaSucesso && !mostrarComprovante && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className="bg-white border border-emerald-600 text-emerald-700 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in zoom-in duration-200">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Venda realizada com sucesso!</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default PDV;
