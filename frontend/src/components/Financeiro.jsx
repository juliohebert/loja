import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Plus, Filter, Search, Edit, Trash2, Banknote, CreditCard, Smartphone, QrCode, Info } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import API_URL from '../config/apiUrl';

const Financeiro = () => {
  // Função utilitária para formatar valores monetários no padrão brasileiro
  const formatarPreco = (valor) => {
    return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  };
  const navigate = useNavigate();
  
  const [abaAtiva, setAbaAtiva] = useState('todos');
  const [busca, setBusca] = useState('');
  const [mesAtual] = useState(new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
  const [lancamentos, setLancamentos] = useState([]);
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes-atual');
  const [modalEditar, setModalEditar] = useState({ isOpen: false, lancamento: null });
  const [modalCancelar, setModalCancelar] = useState({ isOpen: false, vendaId: null, numeroVenda: '' });
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [vendasCanceladas, setVendasCanceladas] = useState([]);

  useEffect(() => {
    carregarLancamentos();
    carregarVendasCanceladas();
    aplicarFiltroPeriodo('mes-atual');
  }, []);

  const aplicarFiltroPeriodo = (periodo) => {
    setPeriodoSelecionado(periodo);
    const hoje = new Date();
    let dataInicio, dataFim;

    switch(periodo) {
      case 'hoje':
        dataInicio = dataFim = hoje.toISOString().split('T')[0];
        break;
      case 'semana':
        const primeiroDiaSemana = new Date(hoje);
        primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay());
        dataInicio = primeiroDiaSemana.toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
        break;
      case 'mes-atual':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'mes-passado':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0];
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
        dataFim = new Date(hoje.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      case 'todos':
        dataInicio = '';
        dataFim = '';
        break;
      case 'personalizado':
        return; // Não alterar datas no modo personalizado
      default:
        dataInicio = dataFim = '';
    }

    setFiltroDataInicio(dataInicio);
    setFiltroDataFim(dataFim);
  };

  const carregarLancamentos = async () => {
    console.log('💰 [FINANCEIRO] Carregando lançamentos...');
    
    try {
      // Buscar vendas da API
      const responseVendas = await fetch(API_URL + '/api/sales', {
        headers: getAuthHeaders()
      });

      let lancamentosVendas = [];
      if (responseVendas.ok) {
        const dataVendas = await responseVendas.json();
        const vendas = dataVendas.data || [];
        console.log('✅ [FINANCEIRO] Vendas carregadas da API:', vendas.length);
        
        // Converter vendas em lançamentos (filtrar vendas canceladas)
        lancamentosVendas = vendas
          .filter(venda => venda.status !== 'cancelado') // Não exibir vendas canceladas
          .map(venda => {
            // Formatar itens para descrição
            const itensDescricao = venda.itens && Array.isArray(venda.itens)
              ? venda.itens.map(item => `${item.quantidade}x ${item.nome || item.produto}`).join(', ')
              : '';

            return {
              id: venda.id,
              tipo: 'receita',
              categoria: 'Venda',
              descricao: `Venda #${venda.numeroVenda}${itensDescricao ? ' - ' + itensDescricao : ''}`,
              valor: parseFloat(venda.total) || 0,
              data: venda.data || (venda.criadoEm ? venda.criadoEm.split('T')[0] : new Date().toISOString().split('T')[0]),
              dataHora: venda.dataHora || venda.criadoEm,
              formaPagamento: venda.formaPagamento || 'Não informado',
              status: 'pago',
              observacoes: venda.observacoes || null,
              isVenda: true // Marcador para identificar que veio da API de vendas
            };
          });
      } else {
        console.warn('⚠️ [FINANCEIRO] Falha ao buscar vendas da API');
      }

      // Buscar contas a receber da API
      let lancamentosReceber = [];
      try {
        const responseReceber = await fetch(API_URL + '/api/accounts-receivable', {
          headers: getAuthHeaders()
        });
        if (responseReceber.ok) {
          const dataReceber = await responseReceber.json();
          const contasReceber = dataReceber.data || [];
          console.log('✅ [FINANCEIRO] Contas a receber carregadas:', contasReceber.length);
          
          lancamentosReceber = contasReceber
            .filter(conta => conta.ativo !== false) // Filtrar apenas contas ativas
            .map(conta => ({
              id: conta.id,
              tipo: 'receita',
              categoria: 'Conta a Receber',
              descricao: conta.descricao,
              valor: parseFloat(conta.valor) || 0,
              data: conta.dataEmissao,
              dataHora: conta.createdAt || conta.dataEmissao,
              formaPagamento: conta.formaPagamento || 'Não informado',
              status: conta.status,
              observacoes: conta.observacoes
            }));
        }
      } catch (error) {
        console.warn('⚠️ [FINANCEIRO] Erro ao buscar contas a receber:', error);
      }

      // Buscar contas a pagar da API
      let lancamentosPagar = [];
      try {
        const responsePagar = await fetch(API_URL + '/api/accounts-payable', {
          headers: getAuthHeaders()
        });
        if (responsePagar.ok) {
          const dataPagar = await responsePagar.json();
          const contasPagar = dataPagar.data || [];
          console.log('✅ [FINANCEIRO] Contas a pagar carregadas:', contasPagar.length);
          
          lancamentosPagar = contasPagar
            .filter(conta => conta.ativo !== false) // Filtrar apenas contas ativas
            .map(conta => ({
              id: conta.id,
              tipo: 'despesa',
              categoria: 'Conta a Pagar',
              descricao: conta.descricao,
              valor: parseFloat(conta.valor) || 0,
              data: conta.dataEmissao,
              dataHora: conta.createdAt || conta.dataEmissao,
              formaPagamento: conta.formaPagamento || 'Não informado',
              status: conta.status,
              observacoes: conta.observacoes,
              fornecedor: conta.fornecedor?.nome
            }));
        }
      } catch (error) {
        console.warn('⚠️ [FINANCEIRO] Erro ao buscar contas a pagar:', error);
      }

      // Buscar lançamentos manuais do localStorage (apenas para backward compatibility)
      const lancamentosSalvos = localStorage.getItem('lancamentos');
      let lancamentosManuais = lancamentosSalvos ? JSON.parse(lancamentosSalvos) : [];
      
      // Filtrar apenas lançamentos que não são vendas (para evitar duplicação)
      lancamentosManuais = lancamentosManuais.filter(lanc => 
        !lanc.descricao?.startsWith('Venda #') || lanc.tipo === 'despesa'
      );

      console.log('📝 [FINANCEIRO] Lançamentos manuais (localStorage):', lancamentosManuais.length);
      
      // Combinar todos os lançamentos
      const todosLancamentos = [...lancamentosVendas, ...lancamentosReceber, ...lancamentosPagar, ...lancamentosManuais];
      
      // Ordenar por data (mais recente primeiro)
      todosLancamentos.sort((a, b) => {
        const dataA = new Date(a.dataHora || a.data);
        const dataB = new Date(b.dataHora || b.data);
        return dataB - dataA;
      });

      console.log('📊 [FINANCEIRO] Total de lançamentos:', todosLancamentos.length);
      setLancamentos(todosLancamentos);
    } catch (error) {
      console.error('❌ [FINANCEIRO] Erro ao carregar lançamentos:', error);
      
      // Fallback: usar apenas localStorage
      const lancamentosSalvos = localStorage.getItem('lancamentos');
      if (lancamentosSalvos) {
        setLancamentos(JSON.parse(lancamentosSalvos));
      }
    }
  };

  const carregarVendasCanceladas = async () => {
    console.log('🔴 [FINANCEIRO] Carregando vendas canceladas...');
    
    try {
      const response = await fetch(API_URL + '/api/sales', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        const vendas = data.data || [];
        
        // Filtrar apenas vendas canceladas
        const canceladas = vendas
          .filter(venda => venda.status === 'cancelado')
          .map(venda => ({
            id: venda.id,
            numeroVenda: venda.numeroVenda,
            total: parseFloat(venda.total) || 0,
            data: venda.data,
            dataHora: venda.dataHora,
            motivoCancelamento: venda.motivoCancelamento,
            canceladoEm: venda.canceladoEm,
            canceladoPor: venda.canceladoPor,
            usuario: venda.usuario,
            cliente: venda.cliente,
            itens: venda.itens,
            formaPagamento: venda.formaPagamento
          }));
        
        console.log('✅ [FINANCEIRO] Vendas canceladas:', canceladas.length);
        setVendasCanceladas(canceladas);
      } else {
        console.warn('⚠️ [FINANCEIRO] Falha ao buscar vendas canceladas');
      }
    } catch (error) {
      console.error('❌ [FINANCEIRO] Erro ao carregar vendas canceladas:', error);
    }
  };

  const handleEditar = async (id) => {
    const lancamento = lancamentos.find(l => l.id === id);
    
    console.log('🔍 [EDITAR] Lançamento encontrado:', {
      id,
      categoria: lancamento?.categoria,
      isVenda: lancamento?.isVenda,
      descricao: lancamento?.descricao,
      bloqueado: lancamento?.isVenda || lancamento?.categoria === 'Venda' || lancamento?.descricao?.startsWith('Venda #')
    });
    
    // Não permitir editar vendas vindas da API, com categoria Venda ou descrição começando com "Venda #"
    if (lancamento?.isVenda || lancamento?.categoria === 'Venda' || lancamento?.descricao?.startsWith('Venda #')) {
      alert('Vendas do sistema não podem ser editadas manualmente. Use o sistema de vendas.');
      return;
    }
    
    // Abrir modal de edição
    setModalEditar({ isOpen: true, lancamento: { ...lancamento } });
  };

  const handleRemover = async (id) => {
    const lancamento = lancamentos.find(l => l.id === id);
    
    console.log('🗑️ [REMOVER] Lançamento encontrado:', {
      id,
      categoria: lancamento?.categoria,
      isVenda: lancamento?.isVenda,
      descricao: lancamento?.descricao,
      tipo: lancamento?.tipo,
      bloqueado: lancamento?.isVenda || lancamento?.categoria === 'Venda' || lancamento?.descricao?.startsWith('Venda #')
    });
    
    // Não permitir remover vendas vindas da API, com categoria Venda ou descrição começando com "Venda #"
    if (lancamento?.isVenda || lancamento?.categoria === 'Venda' || lancamento?.descricao?.startsWith('Venda #')) {
      alert('Vendas do sistema não podem ser removidas manualmente.');
      return;
    }
    
    if (!window.confirm('Deseja realmente inativar este lançamento?')) {
      return;
    }

    try {
      // Determinar o endpoint baseado no tipo de lançamento
      let endpoint = '';
      if (lancamento.tipo === 'receita') {
        endpoint = `${API_URL}/api/accounts-receivable/${id}`;
      } else if (lancamento.tipo === 'despesa') {
        endpoint = `${API_URL}/api/accounts-payable/${id}`;
      } else {
        // Lançamento manual do localStorage
        const lancamentosSalvos = localStorage.getItem('lancamentos');
        const lancamentosLocais = lancamentosSalvos ? JSON.parse(lancamentosSalvos) : [];
        const novosLancamentosLocais = lancamentosLocais.filter(l => l.id !== id);
        localStorage.setItem('lancamentos', JSON.stringify(novosLancamentosLocais));
        
        const novosLancamentos = lancamentos.filter(l => l.id !== id);
        setLancamentos(novosLancamentos);
        alert('Lançamento removido com sucesso!');
        return;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Remover do estado local
        const novosLancamentos = lancamentos.filter(l => l.id !== id);
        setLancamentos(novosLancamentos);
        alert('Lançamento inativado com sucesso!');
      } else {
        const data = await response.json();
        alert(data.message || 'Erro ao inativar lançamento');
      }
    } catch (error) {
      console.error('Erro ao remover lançamento:', error);
      alert('Erro ao inativar lançamento. Tente novamente.');
    }
  };

  const calcularResumo = () => {
    const lancamentosFiltrados = filtrarPorPeriodo(lancamentos);
    const receitas = lancamentosFiltrados.filter(l => l.tipo === 'receita').reduce((sum, l) => sum + l.valor, 0);
    const despesas = lancamentosFiltrados.filter(l => l.tipo === 'despesa').reduce((sum, l) => sum + l.valor, 0);
    const saldo = receitas - despesas;
    return { receitas, despesas, saldo };
  };

  const filtrarPorPeriodo = (lista) => {
    if (!filtroDataInicio && !filtroDataFim) {
      return lista;
    }

    return lista.filter(l => {
      const dataLancamento = l.data;
      if (filtroDataInicio && dataLancamento < filtroDataInicio) return false;
      if (filtroDataFim && dataLancamento > filtroDataFim) return false;
      return true;
    });
  };

  const filtrarLancamentos = () => {
    let resultado = filtrarPorPeriodo(lancamentos);

    if (abaAtiva !== 'todos') {
      resultado = resultado.filter(l => l.tipo === abaAtiva);
    }

    if (busca) {
      resultado = resultado.filter(l => 
        l.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        l.categoria.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Ordena por data e hora, mais recentes primeiro
    return resultado.sort((a, b) => {
      // Usa dataHora/dataHoraCompleta se existir, senão data
      const dataA = new Date(a.dataHora || a.dataHoraCompleta || a.data);
      const dataB = new Date(b.dataHora || b.dataHoraCompleta || b.data);
      return dataB - dataA;
    });
  };

  const salvarEdicao = async () => {
    try {
      const { lancamento } = modalEditar;
      
      // Determinar endpoint baseado na categoria
      let endpoint = '';
      if (lancamento.categoria === 'Conta a Receber') {
        endpoint = `${API_URL}/api/accounts-receivable/${lancamento.id}`;
      } else if (lancamento.categoria === 'Conta a Pagar') {
        endpoint = `${API_URL}/api/accounts-payable/${lancamento.id}`;
      } else {
        // Lançamento manual do localStorage
        const lancamentosSalvos = localStorage.getItem('lancamentos');
        const lancamentosLocais = lancamentosSalvos ? JSON.parse(lancamentosSalvos) : [];
        const index = lancamentosLocais.findIndex(l => l.id === lancamento.id);
        if (index !== -1) {
          lancamentosLocais[index] = lancamento;
          localStorage.setItem('lancamentos', JSON.stringify(lancamentosLocais));
        }
        
        // Atualizar estado
        const novosLancamentos = lancamentos.map(l => l.id === lancamento.id ? lancamento : l);
        setLancamentos(novosLancamentos);
        setModalEditar({ isOpen: false, lancamento: null });
        alert('Lançamento atualizado com sucesso!');
        return;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          descricao: lancamento.descricao,
          valor: parseFloat(lancamento.valor),
          dataEmissao: lancamento.data,
          dataVencimento: lancamento.data,
          status: lancamento.status,
          observacoes: lancamento.observacoes
        })
      });

      if (response.ok) {
        // Recarregar lançamentos
        await carregarLancamentos();
        setModalEditar({ isOpen: false, lancamento: null });
        alert('Lançamento atualizado com sucesso!');
      } else {
        const data = await response.json();
        alert(data.message || 'Erro ao atualizar lançamento');
      }
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      alert('Erro ao atualizar lançamento. Tente novamente.');
    }
  };

  const handleCancelarVenda = (id, numeroVenda) => {
    console.log('🔴 [CANCELAR VENDA] Abrindo modal para venda:', { id, numeroVenda });
    setModalCancelar({ isOpen: true, vendaId: id, numeroVenda });
    setMotivoCancelamento('');
  };

  const confirmarCancelamento = async () => {
    if (!motivoCancelamento.trim()) {
      alert('Por favor, informe o motivo do cancelamento.');
      return;
    }

    try {
      console.log('🔴 [CANCELAR VENDA] Enviando cancelamento:', {
        vendaId: modalCancelar.vendaId,
        motivo: motivoCancelamento
      });

      const response = await fetch(`${API_URL}/api/sales/${modalCancelar.vendaId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ motivo: motivoCancelamento })
      });

      if (response.ok) {
        await carregarLancamentos();
        await carregarVendasCanceladas();
        setModalCancelar({ isOpen: false, vendaId: null, numeroVenda: '' });
        setMotivoCancelamento('');
        alert('Venda cancelada com sucesso!');
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao cancelar venda');
      }
    } catch (error) {
      console.error('❌ Erro ao cancelar venda:', error);
      alert('Erro ao cancelar venda. Tente novamente.');
    }
  };

  const resumo = calcularResumo();
  const lancamentosFiltrados = filtrarLancamentos();

  return (
    <div className="flex min-h-screen bg-background-light">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between whitespace-nowrap border-b border-slate-200 px-6 h-16 bg-white">
          <h1 className="text-slate-900 text-3xl font-bold leading-tight">Financeiro</h1>
          <button 
            onClick={() => navigate('/financeiro/novo')}
            className="flex items-center justify-center gap-2 min-w-[84px] cursor-pointer rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span className="truncate">Novo Lançamento</span>
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Receitas</p>
                  <p className="text-2xl font-bold text-green-600">{formatarPreco(resumo.receitas)}</p>
                  <p className="text-xs text-slate-500 mt-1">{mesAtual}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Despesas</p>
                  <p className="text-2xl font-bold text-red-600">{formatarPreco(resumo.despesas)}</p>
                  <p className="text-xs text-slate-500 mt-1">{mesAtual}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Saldo</p>
                  <p className={`text-2xl font-bold ${resumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatarPreco(resumo.saldo)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{mesAtual}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Lançamentos */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Abas */}
            <div className="border-b border-slate-200 px-6">
              <div className="flex gap-8">
                <button
                  onClick={() => setAbaAtiva('todos')}
                  className={`flex items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                    abaAtiva === 'todos'
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-slate-500 hover:border-b-slate-300'
                  }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Todos</p>
                </button>
                <button
                  onClick={() => setAbaAtiva('receita')}
                  className={`flex items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                    abaAtiva === 'receita'
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-slate-500 hover:border-b-slate-300'
                  }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Receitas</p>
                </button>
                <button
                  onClick={() => setAbaAtiva('despesa')}
                  className={`flex items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                    abaAtiva === 'despesa'
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-slate-500 hover:border-b-slate-300'
                  }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Despesas</p>
                </button>
                <button
                  onClick={() => setAbaAtiva('canceladas')}
                  className={`flex items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                    abaAtiva === 'canceladas'
                      ? 'border-b-orange-500 text-orange-600'
                      : 'border-b-transparent text-slate-500 hover:border-b-slate-300'
                  }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">
                    Canceladas {vendasCanceladas.length > 0 && `(${vendasCanceladas.length})`}
                  </p>
                </button>
              </div>
            </div>

            {/* Barra de Busca e Filtros */}
            <div className="p-6 space-y-4">
              {/* Filtros de Período */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Filter className="w-5 h-5" />
                  <span className="text-sm">Período:</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => aplicarFiltroPeriodo('hoje')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      periodoSelecionado === 'hoje'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => aplicarFiltroPeriodo('semana')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      periodoSelecionado === 'semana'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Esta Semana
                  </button>
                  <button
                    onClick={() => aplicarFiltroPeriodo('mes-atual')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      periodoSelecionado === 'mes-atual'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Este Mês
                  </button>
                  <button
                    onClick={() => aplicarFiltroPeriodo('mes-passado')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      periodoSelecionado === 'mes-passado'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Mês Passado
                  </button>
                  <button
                    onClick={() => aplicarFiltroPeriodo('ano')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      periodoSelecionado === 'ano'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Este Ano
                  </button>
                  <button
                    onClick={() => aplicarFiltroPeriodo('todos')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      periodoSelecionado === 'todos'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => {
                      setPeriodoSelecionado('personalizado');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      periodoSelecionado === 'personalizado'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* Período Personalizado */}
              {periodoSelecionado === 'personalizado' && (
                <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">De:</label>
                    <input
                      type="date"
                      value={filtroDataInicio}
                      onChange={(e) => setFiltroDataInicio(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Até:</label>
                    <input
                      type="date"
                      value={filtroDataFim}
                      onChange={(e) => setFiltroDataFim(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary h-12 placeholder:text-slate-500 pl-12 text-base font-normal leading-normal bg-background-light border-transparent"
                  placeholder="Buscar por descrição ou categoria"
                />
              </div>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
              {abaAtiva === 'canceladas' ? (
                /* Tabela de Vendas Canceladas */
                <table className="w-full">
                  <thead className="bg-orange-50 border-y border-orange-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase tracking-wider">Venda</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase tracking-wider">Data Venda</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-orange-900 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase tracking-wider">Cancelado Em</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase tracking-wider">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {vendasCanceladas.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                          Nenhuma venda cancelada encontrada
                        </td>
                      </tr>
                    ) : (
                      vendasCanceladas.map((venda) => (
                        <tr key={venda.id} className="hover:bg-orange-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">Venda #{venda.numeroVenda}</div>
                            <div className="text-xs text-slate-500">
                              {venda.itens && Array.isArray(venda.itens) 
                                ? venda.itens.map(item => `${item.quantidade}x ${item.nome || item.produto}`).join(', ')
                                : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {new Date(venda.data).toLocaleDateString('pt-BR')}
                            <div className="text-xs text-slate-500">
                              {venda.dataHora ? new Date(venda.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {venda.cliente?.nome || 'Cliente não informado'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                            {formatarPreco(venda.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {venda.canceladoEm ? new Date(venda.canceladoEm).toLocaleString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                            <div className="line-clamp-2" title={venda.motivoCancelamento}>
                              {venda.motivoCancelamento || 'Motivo não informado'}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                /* Tabela Normal de Lançamentos */
              <table className="w-full">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Data</th>
                    <th className="px-2 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Pagamento</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {lancamentosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                        Nenhum lançamento encontrado
                      </td>
                    </tr>
                  ) : (
                    lancamentosFiltrados.map((lancamento, index) => (
                      <tr key={`${lancamento.categoria}-${lancamento.id}-${index}`} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {new Date(lancamento.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-slate-900">
                          {(() => {
                            // Tenta pegar a hora do campo dataHora, dataHoraCompleta ou do campo data
                            const hora = lancamento.dataHora || lancamento.dataHoraCompleta || lancamento.data;
                            if (hora) {
                              const d = new Date(hora);
                              if (!isNaN(d.getTime())) {
                                return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                              }
                            }
                            return '-';
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-slate-900">{lancamento.descricao}</div>
                            {(() => {
                              // Filtrar apenas informações relevantes (desconto, crédito, débito)
                              if (!lancamento.observacoes) return null;
                              
                              const observacoes = lancamento.observacoes.trim();
                              if (observacoes === '') return null;
                              
                              // Filtrar apenas linhas que contenham desconto, crédito ou débito
                              const linhasRelevantes = observacoes.split('|').map(l => l.trim()).filter(linha => 
                                linha.toLowerCase().includes('desconto') || 
                                linha.toLowerCase().includes('crédito') || 
                                linha.toLowerCase().includes('débito')
                              );
                              
                              if (linhasRelevantes.length === 0) return null;
                              
                              const textoFiltrado = linhasRelevantes.join(' | ');
                              
                              return (
                                <div className="relative group inline-block">
                                  <Info className="w-4 h-4 text-blue-500 cursor-help" />
                                  <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none min-w-max max-w-md">
                                    {textoFiltrado}
                                    <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {lancamento.categoria}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lancamento.tipo === 'receita' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <TrendingUp className="w-3 h-3" />
                              Receita
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <TrendingDown className="w-3 h-3" />
                              Despesa
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {(() => {
                            const formaPagamento = lancamento.observacoes?.match(/Forma de pagamento:\s*([^|]+)/i)?.[1]?.trim() || '';
                            const Icon = formaPagamento.toLowerCase().includes('dinheiro') ? Banknote :
                                       formaPagamento.toLowerCase().includes('débito') ? CreditCard :
                                       formaPagamento.toLowerCase().includes('crédito') || formaPagamento.toLowerCase().includes('credito') ? CreditCard :
                                       formaPagamento.toLowerCase().includes('pix') ? Smartphone :
                                       DollarSign;
                            const color = formaPagamento.toLowerCase().includes('dinheiro') ? 'text-green-600' :
                                        formaPagamento.toLowerCase().includes('débito') ? 'text-blue-600' :
                                        formaPagamento.toLowerCase().includes('crédito') || formaPagamento.toLowerCase().includes('credito') ? 'text-purple-600' :
                                        formaPagamento.toLowerCase().includes('pix') ? 'text-cyan-600' :
                                        'text-gray-400';
                            return formaPagamento ? (
                              <div className="relative group inline-block">
                                <Icon className={`w-5 h-5 mx-auto ${color}`} />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
                                  {formaPagamento}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            );
                          })()}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${
                          lancamento.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {lancamento.tipo === 'receita' ? '+' : '-'} {formatarPreco(lancamento.valor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lancamento.status === 'pago' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {lancamento.status === 'pago' ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Botão de Cancelar apenas para vendas ativas */}
                            {(lancamento.isVenda || lancamento.categoria === 'Venda' || lancamento.descricao?.startsWith('Venda #')) ? (
                              <button
                                onClick={() => handleCancelarVenda(lancamento.id, lancamento.descricao)}
                                className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Cancelar Venda"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditar(lancamento.id)}
                                  className="p-1.5 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRemover(lancamento.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Edição */}
      {modalEditar.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Lançamento</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={modalEditar.lancamento.descricao}
                  onChange={(e) => setModalEditar({
                    ...modalEditar,
                    lancamento: { ...modalEditar.lancamento, descricao: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={modalEditar.lancamento.valor}
                  onChange={(e) => setModalEditar({
                    ...modalEditar,
                    lancamento: { ...modalEditar.lancamento, valor: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={modalEditar.lancamento.data}
                  onChange={(e) => setModalEditar({
                    ...modalEditar,
                    lancamento: { ...modalEditar.lancamento, data: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={modalEditar.lancamento.observacoes || ''}
                  onChange={(e) => setModalEditar({
                    ...modalEditar,
                    lancamento: { ...modalEditar.lancamento, observacoes: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalEditar({ isOpen: false, lancamento: null })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento de Venda */}
      {modalCancelar.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 p-2 rounded-full">
                <Trash2 className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Cancelar Venda</h2>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Você está prestes a cancelar a venda:
              </p>
              <p className="text-base font-semibold text-gray-900">
                {modalCancelar.numeroVenda}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo do cancelamento <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Descreva o motivo do cancelamento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows="4"
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Esta ação não pode ser desfeita. A venda será marcada como cancelada e permanecerá no histórico para auditoria.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalCancelar({ isOpen: false, vendaId: null, numeroVenda: '' });
                  setMotivoCancelamento('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Voltar
              </button>
              <button
                onClick={confirmarCancelamento}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financeiro;
