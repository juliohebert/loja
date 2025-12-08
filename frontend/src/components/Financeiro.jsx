import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Plus, Filter, Search, Edit, Trash2, Banknote, CreditCard, Smartphone, QrCode } from 'lucide-react';

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

  useEffect(() => {
    carregarLancamentos();
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

  const carregarLancamentos = () => {
    const lancamentosSalvos = localStorage.getItem('lancamentos');
    if (lancamentosSalvos) {
      setLancamentos(JSON.parse(lancamentosSalvos));
    }
  };

  const handleEditar = (id) => {
    navigate(`/financeiro/editar/${id}`);
  };

  const handleRemover = (id) => {
    if (window.confirm('Deseja realmente remover este lançamento?')) {
      const novosLancamentos = lancamentos.filter(l => l.id !== id);
      localStorage.setItem('lancamentos', JSON.stringify(novosLancamentos));
      setLancamentos(novosLancamentos);
      alert('Lançamento removido com sucesso!');
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
                    lancamentosFiltrados.map((lancamento) => (
                      <tr key={lancamento.id} className="hover:bg-slate-50">
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
                          <div className="text-sm font-medium text-slate-900">{lancamento.descricao}</div>
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
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Financeiro;
