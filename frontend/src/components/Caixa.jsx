// Função utilitária para formatar valores monetários no padrão brasileiro
const formatarPreco = (valor) => {
  return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { FaCashRegister, FaLock, FaUnlock, FaHistory, FaPlus, FaMinus, FaListAlt } from 'react-icons/fa';
import Sidebar from './Sidebar';
import ModalConfirmacao from './ModalConfirmacao';
import Toast from './Toast';
import API_URL from '../config/apiUrl';

export default function Caixa() {
  const navigate = useNavigate();
  const [caixaAberto, setCaixaAberto] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', tipo: 'sucesso' });
  const [vendasDoCaixa, setVendasDoCaixa] = useState({ total: 0, quantidade: 0 });
  const [modalVendas, setModalVendas] = useState({ isOpen: false, vendas: [] });
  const [resumoPagamentos, setResumoPagamentos] = useState({});
  const [modalDetalhesCaixa, setModalDetalhesCaixa] = useState({ isOpen: false, caixa: null, vendas: [], resumo: {} });
  
  // Modais
  const [modalAbrir, setModalAbrir] = useState({ isOpen: false, saldoInicial: '0' });
  const [modalFechar, setModalFechar] = useState({ isOpen: false, saldoFinal: '0', observacoes: '' });
  const [modalConfirmar, setModalConfirmar] = useState({ isOpen: false, action: null, message: '' });

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    carregarCaixaAberto();
    carregarHistorico();
  }, [navigate]);

  const calcularVendasDoCaixa = async () => {
    if (!caixaAberto) {
      setVendasDoCaixa({ total: 0, quantidade: 0 });
      return;
    }

    try {
      // Buscar vendas da API ao invés do localStorage
      const response = await fetch(API_URL + '/api/sales', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar vendas');
      }

      const data = await response.json();
      const vendas = data.data || [];
      
      // Usar data e HORA completa da abertura do caixa para filtrar corretamente
      const dataHoraAbertura = new Date(caixaAberto.dataAbertura);
      
      const vendasDoCaixaAtual = vendas.filter(venda => {
        // Filtrar vendas que foram criadas após abertura do caixa e não foram canceladas
        const dataVenda = new Date(venda.criadoEm || venda.criado_em || venda.dataHora || venda.data);
        return dataVenda >= dataHoraAbertura && venda.status !== 'cancelado';
      });

      const totalVendas = vendasDoCaixaAtual.reduce((acc, venda) => acc + parseFloat(venda.total || 0), 0);
      
      setVendasDoCaixa({
        total: totalVendas,
        quantidade: vendasDoCaixaAtual.length
      });

      // Calcular resumo por forma de pagamento
      const resumo = {};
      vendasDoCaixaAtual.forEach(venda => {
        const formaPagamento = venda.formaPagamento || 'Não informado';
        
        if (!resumo[formaPagamento]) {
          resumo[formaPagamento] = { quantidade: 0, total: 0 };
        }
        resumo[formaPagamento].quantidade++;
        resumo[formaPagamento].total += parseFloat(venda.total || 0);
      });
      setResumoPagamentos(resumo);
    } catch (error) {
      console.error('❌ Erro ao calcular vendas:', error);
      setVendasDoCaixa({ total: 0, quantidade: 0 });
    }
  };

  const abrirModalVendas = async () => {
    if (!caixaAberto) return;

    try {
      const response = await fetch(API_URL + '/api/sales', {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Erro ao buscar vendas');

      const data = await response.json();
      const vendas = data.data || [];
      const dataHoraAbertura = new Date(caixaAberto.dataAbertura);
      
      const vendasDoCaixaAtual = vendas.filter(venda => {
        // Tentar múltiplos campos de data para garantir compatibilidade
        const dataVenda = new Date(venda.criadoEm || venda.criado_em || venda.dataHora || venda.data);
        return dataVenda >= dataHoraAbertura && venda.status !== 'cancelado';
      });

      setModalVendas({ isOpen: true, vendas: vendasDoCaixaAtual });
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    }
  };

  const abrirDetalhesCaixaFechado = async (caixa) => {
    try {
      const response = await fetch(API_URL + '/api/sales', {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Erro ao buscar vendas');

      const data = await response.json();
      const vendas = data.data || [];

      const dataAbertura = new Date(caixa.dataAbertura);
      const dataFechamento = caixa.dataFechamento ? new Date(caixa.dataFechamento) : new Date();
      
      // Filtrar vendas do período do caixa (excluindo canceladas)
      const vendasDoCaixa = vendas.filter(venda => {
        const dataVenda = new Date(venda.criadoEm || venda.criado_em || venda.dataHora || venda.data);
        return dataVenda >= dataAbertura && dataVenda <= dataFechamento && venda.status !== 'cancelado';
      });

      // Calcular resumo por forma de pagamento
      const resumo = {};
      vendasDoCaixa.forEach(venda => {
        const formaPagamento = venda.formaPagamento || 'Não informado';
        
        if (!resumo[formaPagamento]) {
          resumo[formaPagamento] = { quantidade: 0, total: 0 };
        }
        resumo[formaPagamento].quantidade++;
        resumo[formaPagamento].total += parseFloat(venda.total || 0);
      });

      setModalDetalhesCaixa({ isOpen: true, caixa, vendas: vendasDoCaixa, resumo });
    } catch (error) {
      console.error('Erro ao buscar detalhes do caixa:', error);
    }
  };

  useEffect(() => {
    if (caixaAberto) {
      calcularVendasDoCaixa();
      
      // Atualizar vendas periodicamente
      const interval = setInterval(() => {
        calcularVendasDoCaixa();
      }, 30000); // Atualiza a cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [caixaAberto]);

  const carregarCaixaAberto = async () => {
    try {
      const response = await fetch(API_URL + '/api/cash-registers/open/current', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setCaixaAberto(data.data);
      } else if (response.status !== 404) {
        throw new Error('Erro ao buscar caixa');
      }
    } catch (error) {
      console.error('Erro ao carregar caixa:', error);
    }
  };

  const carregarHistorico = async () => {
    try {
      const response = await fetch(API_URL + '/api/cash-registers?limit=10', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setHistorico(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const abrirCaixa = async () => {
    const saldoInicialNum = parseFloat(modalAbrir.saldoInicial);
    if (isNaN(saldoInicialNum) || saldoInicialNum < 0) {
      setToast({ isOpen: true, message: 'Informe um saldo inicial válido (≥ 0)', tipo: 'erro' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_URL + '/api/cash-registers/open', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          saldoInicial: saldoInicialNum
        })
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ isOpen: true, message: 'Caixa aberto com sucesso!', tipo: 'sucesso' });
        setCaixaAberto(data.data);
        setModalAbrir({ isOpen: false, saldoInicial: '0' });
        carregarHistorico();
      } else {
        setToast({ isOpen: true, message: data.message || 'Erro ao abrir caixa', tipo: 'erro' });
      }
    } catch (error) {
      setToast({ isOpen: true, message: 'Erro ao abrir caixa', tipo: 'erro' });
    } finally {
      setLoading(false);
    }
  };

  const fecharCaixa = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cash-registers/${caixaAberto.id}/close`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          saldoFinal: parseFloat(modalFechar.saldoFinal),
          observacoes: modalFechar.observacoes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setToast({ isOpen: true, message: 'Caixa fechado com sucesso!', tipo: 'sucesso' });
        setCaixaAberto(null);
        setModalFechar({ isOpen: false, saldoFinal: '0', observacoes: '' });
        setModalConfirmar({ isOpen: false, action: null, message: '' });
        carregarHistorico();
      } else {
        setToast({ isOpen: true, message: data.message || 'Erro ao fechar caixa', tipo: 'erro' });
      }
    } catch (error) {
      setToast({ isOpen: true, message: 'Erro ao fechar caixa', tipo: 'erro' });
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const calcularDuracao = (dataAbertura) => {
    const inicio = new Date(dataAbertura);
    const agora = new Date();
    const diff = Math.floor((agora - inicio) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m} min`;
  };

  const saldoEsperado = caixaAberto
    ? parseFloat(caixaAberto.saldoInicial) + parseFloat(vendasDoCaixa.total)
    : 0;

  return (
    <div className="layout-with-sidebar">
      <Sidebar />

      <div className="main-content content-with-hamburger">
        {/* Toast */}
        {toast.isOpen && (
          <Toast
            isOpen={toast.isOpen}
            mensagem={toast.message}
            tipo={toast.tipo}
            onClose={() => setToast({ ...toast, isOpen: false })}
          />
        )}

        <header className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg mobile-header-spacing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg">
                  <FaCashRegister className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Controle de Caixa</h1>
                  <p className="text-blue-100 text-sm mt-0.5">
                    {caixaAberto ? `Aberto em ${formatarData(caixaAberto.dataAbertura)}` : 'Nenhum caixa aberto no momento'}
                  </p>
                </div>
              </div>
              {caixaAberto ? (
                <span className="px-3 py-1.5 bg-green-400 text-white text-sm font-semibold rounded-full flex items-center gap-1.5 shrink-0">
                  <FaUnlock className="text-xs" /> Aberto
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-white/20 text-white text-sm font-semibold rounded-full flex items-center gap-1.5 shrink-0">
                  <FaLock className="text-xs" /> Fechado
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Saldo Inicial</p>
              <p className="text-xl font-bold text-gray-900">
                {caixaAberto ? formatarValor(parseFloat(caixaAberto.saldoInicial)) : '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total em Vendas</p>
              <p className="text-xl font-bold text-green-600">
                {caixaAberto ? formatarValor(vendasDoCaixa.total) : '—'}
              </p>
              {caixaAberto && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {vendasDoCaixa.quantidade} venda{vendasDoCaixa.quantidade !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Saldo Esperado</p>
              <p className="text-xl font-bold text-blue-600">
                {caixaAberto ? formatarValor(saldoEsperado) : '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ticket Médio</p>
              <p className="text-xl font-bold text-gray-900">
                {caixaAberto && vendasDoCaixa.quantidade > 0
                  ? formatarValor(vendasDoCaixa.total / vendasDoCaixa.quantidade)
                  : '—'}
              </p>
            </div>
          </div>

          {/* Status + Recebimentos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">

            {/* Card Status / Ações */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  {caixaAberto ? <FaUnlock className="text-green-500" /> : <FaLock className="text-gray-400" />}
                  Status do Caixa
                </h2>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                {caixaAberto ? (
                  <>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-5">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Abertura</p>
                        <p className="text-sm font-semibold text-gray-800">{formatarData(caixaAberto.dataAbertura)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Duração</p>
                        <p className="text-sm font-semibold text-gray-800">{calcularDuracao(caixaAberto.dataAbertura)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Operador</p>
                        <p className="text-sm font-semibold text-gray-800">{caixaAberto.usuario?.nome || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto mb-3">
                      <button
                        onClick={abrirModalVendas}
                        className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                      >
                        <FaListAlt /> Ver Vendas
                      </button>
                      <button
                        onClick={calcularVendasDoCaixa}
                        className="px-3 py-2 border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50 hover:text-gray-600 text-sm transition-colors"
                        title="Atualizar totais"
                      >
                        ↻
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setModalFechar({ ...modalFechar, saldoFinal: saldoEsperado.toFixed(2), observacoes: '' });
                        setModalConfirmar({ isOpen: true, message: 'Deseja realmente fechar o caixa?', action: 'fechar' });
                      }}
                      className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                    >
                      <FaLock /> Fechar Caixa
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <div className="p-4 bg-gray-100 rounded-full mb-3">
                      <FaLock className="text-3xl text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-5 text-sm">Nenhum caixa aberto no momento.</p>
                    <button
                      onClick={() => setModalAbrir({ isOpen: true, saldoInicial: '0' })}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-semibold transition-colors"
                    >
                      <FaUnlock /> Abrir Caixa
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Card Recebimentos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <FaCashRegister className="text-blue-500" /> Recebimentos por Forma
                </h2>
              </div>
              <div className="p-5 flex-1">
                {caixaAberto && Object.keys(resumoPagamentos).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(resumoPagamentos).map(([forma, dados]) => (
                      <div key={forma} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{forma}</p>
                          <p className="text-xs text-gray-500">{dados.quantidade} transação(ões)</p>
                        </div>
                        <p className="text-base font-bold text-green-600">{formatarValor(dados.total)}</p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 mt-1">
                      <p className="text-sm font-bold text-gray-800">Total Geral</p>
                      <p className="text-base font-bold text-blue-700">{formatarValor(vendasDoCaixa.total)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center text-gray-400">
                    <FaCashRegister className="text-3xl mb-2 opacity-20" />
                    <p className="text-sm">
                      {caixaAberto ? 'Nenhuma venda registrada ainda' : 'Abra o caixa para ver os recebimentos'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <FaHistory className="text-gray-400" />
              <h2 className="text-base font-semibold text-gray-800">Histórico de Caixas</h2>
            </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Abertura</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Fechamento</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operador</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Saldo Inicial</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Saldo Final</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {historico.map(caixa => (
                <tr key={caixa.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{formatarData(caixa.dataAbertura)}</td>
                  <td className="px-4 py-3 text-sm">{caixa.dataFechamento ? formatarData(caixa.dataFechamento) : '-'}</td>
                  <td className="px-4 py-3 text-sm">{caixa.usuario?.nome || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatarValor(caixa.saldoInicial)}</td>
                  <td className="px-4 py-3 text-sm text-right">{caixa.saldoFinal ? formatarValor(caixa.saldoFinal) : '-'}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${caixa.status === 'aberto' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {caixa.status === 'aberto' ? 'Aberto' : 'Fechado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {caixa.status === 'fechado' && (
                      <button
                        onClick={() => abrirDetalhesCaixaFechado(caixa)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Ver detalhes"
                      >
                        Ver detalhes
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {historico.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">Nenhum registro encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-4">
          {historico.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum registro encontrado</div>
          ) : (
            historico.map(caixa => (
              <div key={caixa.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                {/* Header com status e operador */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{caixa.usuario?.nome || 'N/A'}</div>
                    <div className="text-xs text-gray-500">Operador</div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${caixa.status === 'aberto' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {caixa.status === 'aberto' ? 'Aberto' : 'Fechado'}
                  </span>
                </div>

                {/* Datas */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Abertura:</span>
                    <div className="text-gray-900">{formatarData(caixa.dataAbertura)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Fechamento:</span>
                    <div className="text-gray-900">{caixa.dataFechamento ? formatarData(caixa.dataFechamento) : '-'}</div>
                  </div>
                </div>

                {/* Saldos */}
                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-gray-500 text-xs">Saldo Inicial:</span>
                    <div className="font-semibold text-gray-900">{formatarValor(caixa.saldoInicial)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Saldo Final:</span>
                    <div className="font-semibold text-gray-900">{caixa.saldoFinal ? formatarValor(caixa.saldoFinal) : '-'}</div>
                  </div>
                </div>

                {/* Botão de ação */}
                {caixa.status === 'fechado' && (
                  <button
                    onClick={() => abrirDetalhesCaixaFechado(caixa)}
                    className="w-full mt-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                  >
                    Ver detalhes
                  </button>
                )}
              </div>
            ))
          )}
        </div>
          </div>

      {/* Modal Abrir Caixa */}
      {modalAbrir.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scaleIn">
            <h3 className="text-xl font-bold mb-4">Abrir Caixa</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saldo Inicial
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={modalAbrir.saldoInicial}
                onChange={(e) => setModalAbrir({ ...modalAbrir, saldoInicial: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModalAbrir({ isOpen: false, saldoInicial: '0' })}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={abrirCaixa}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? 'Abrindo...' : 'Abrir Caixa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Fechamento */}
      <ModalConfirmacao
        isOpen={modalConfirmar.isOpen}
        mensagem={modalConfirmar.message}
        titulo="Confirmação"
        tipo="warning"
        textoBotaoConfirmar="Sim, fechar"
        textoBotaoCancelar="Cancelar"
        onConfirm={() => {
          setModalConfirmar({ ...modalConfirmar, isOpen: false });
          setModalFechar({ ...modalFechar, isOpen: true });
        }}
        onClose={() => setModalConfirmar({ isOpen: false, action: null, message: '' })}
      />

      {/* Modal Fechar Caixa */}
      {modalFechar.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">Fechar Caixa</h3>
              <p className="text-gray-600 mt-1">Informe os valores para fechamento do caixa</p>
            </div>
            
            {/* Resumo de Movimentações */}
            <div className="p-6 bg-gray-50 border-b">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaCashRegister className="text-blue-600" />
                Movimentações por Forma de Pagamento
              </h4>
              {Object.keys(resumoPagamentos).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(resumoPagamentos).map(([forma, dados]) => (
                    <div key={forma} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <div>
                        <p className="font-semibold text-gray-800">{forma}</p>
                        <p className="text-sm text-gray-600">{dados.quantidade} transação(ões)</p>
                      </div>
                      <p className="text-lg font-bold text-green-600">{formatarValor(dados.total)}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border-2 border-blue-200 mt-4">
                    <p className="font-bold text-gray-800">Total Geral</p>
                    <p className="text-xl font-bold text-blue-600">{formatarValor(vendasDoCaixa.total)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma movimentação registrada</p>
              )}
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Final (contagem física)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={modalFechar.saldoFinal}
                  onChange={(e) => setModalFechar({ ...modalFechar, saldoFinal: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="0.00"
                />
                {/* Indicador de divergência */}
                {modalFechar.saldoFinal !== '' && (() => {
                  const declarado = parseFloat(modalFechar.saldoFinal) || 0;
                  const divergencia = declarado - saldoEsperado;
                  const semDivergencia = Math.abs(divergencia) < 0.01;
                  return (
                    <div className={`mt-2 p-3 rounded-lg flex items-center justify-between text-sm ${semDivergencia ? 'bg-green-50 border border-green-200' : divergencia > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
                      <div>
                        <p className="font-medium text-gray-700">Saldo esperado: <span className="font-bold">{formatarValor(saldoEsperado)}</span></p>
                        <p className={`font-semibold ${semDivergencia ? 'text-green-700' : divergencia > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                          {semDivergencia ? '✔ Sem divergência' : divergencia > 0 ? `▲ Sobra: ${formatarValor(divergencia)}` : `▼ Falta: ${formatarValor(Math.abs(divergencia))}`}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={modalFechar.observacoes}
                  onChange={(e) => setModalFechar({ ...modalFechar, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  rows="3"
                  placeholder="Observações sobre o fechamento..."
                />
              </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalFechar({ isOpen: false, saldoFinal: '0', observacoes: '' })}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={fecharCaixa}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? 'Fechando...' : 'Fechar Caixa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Vendas */}
      {modalVendas.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Vendas do Caixa</h2>
                <button
                  onClick={() => setModalVendas({ isOpen: false, vendas: [] })}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Total: {formatarValor(modalVendas.vendas.reduce((acc, v) => acc + parseFloat(v.total || 0), 0))} • {modalVendas.vendas.length} vendas
              </p>
              
              {/* Resumo por forma de pagamento no modal */}
              {modalVendas.vendas.length > 0 && (() => {
                const resumoModal = {};
                modalVendas.vendas.forEach(venda => {
                  const forma = venda.formaPagamento || 'Não informado';
                  if (!resumoModal[forma]) {
                    resumoModal[forma] = { quantidade: 0, total: 0 };
                  }
                  resumoModal[forma].quantidade++;
                  resumoModal[forma].total += parseFloat(venda.total || 0);
                });
                return (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      💳 Recebimentos por Forma de Pagamento
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(resumoModal).map(([forma, dados]) => (
                        <div key={forma} className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                          <p className="text-xs text-gray-600 mb-1">{forma}</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatarValor(dados.total)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {dados.quantidade} venda{dados.quantidade !== 1 ? 's' : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {modalVendas.vendas.length > 0 ? (
                <div className="space-y-3">
                  {modalVendas.vendas.map((venda, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">Venda #{String(venda.numeroVenda).padStart(4, '0')}</h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">Data:</span> {new Date(venda.dataHora || venda.data).toLocaleString('pt-BR')}
                            </p>
                            <p>
                              <span className="font-medium">Pagamento:</span> {venda.formaPagamento}
                            </p>
                            {venda.cliente?.nome && (
                              <p>
                                <span className="font-medium">Cliente:</span> {venda.cliente.nome}
                              </p>
                            )}
                            {venda.vendedor && (
                              <p>
                                <span className="font-medium">Vendedor:</span> {venda.vendedor}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-xl font-bold text-green-600">{formatarValor(venda.total)}</p>
                          <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {venda.status === 'ativo' ? 'Ativa' : 'Cancelada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhuma venda realizada neste caixa</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <button
                onClick={() => setModalVendas({ isOpen: false, vendas: [] })}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes Caixa Fechado */}
      {modalDetalhesCaixa.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Detalhes do Caixa</h2>
                  <p className="text-gray-600 mt-1">
                    {formatarData(modalDetalhesCaixa.caixa?.dataAbertura)} - {modalDetalhesCaixa.caixa?.dataFechamento ? formatarData(modalDetalhesCaixa.caixa.dataFechamento) : 'Em aberto'}
                  </p>
                </div>
                <button
                  onClick={() => setModalDetalhesCaixa({ isOpen: false, caixa: null, vendas: [], resumo: {} })}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="p-6 bg-gray-50 border-b">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">Saldo Inicial</p>
                  <p className="text-xl font-bold text-gray-800">{formatarValor(modalDetalhesCaixa.caixa?.saldoInicial || 0)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">Total Vendas</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatarValor(modalDetalhesCaixa.vendas.reduce((acc, v) => acc + parseFloat(v.total || 0), 0))}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">Saldo Final</p>
                  <p className="text-xl font-bold text-blue-600">{formatarValor(modalDetalhesCaixa.caixa?.saldoFinal || 0)}</p>
                </div>
              </div>

              {/* Resumo por Forma de Pagamento */}
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaCashRegister className="text-blue-600" />
                Movimentações por Forma de Pagamento
              </h4>
              {Object.keys(modalDetalhesCaixa.resumo).length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(modalDetalhesCaixa.resumo).map(([forma, dados]) => (
                    <div key={forma} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <div>
                        <p className="font-semibold text-gray-800">{forma}</p>
                        <p className="text-sm text-gray-600">{dados.quantidade} transação(ões)</p>
                      </div>
                      <p className="text-lg font-bold text-green-600">{formatarValor(dados.total)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma movimentação registrada</p>
              )}
            </div>

            {/* Lista de Vendas */}
            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Vendas Realizadas ({modalDetalhesCaixa.vendas.length})
              </h4>
              {modalDetalhesCaixa.vendas.length > 0 ? (
                <div className="space-y-6">
                  {/* Agrupar vendas por forma de pagamento */}
                  {Object.entries(
                    modalDetalhesCaixa.vendas.reduce((grupos, venda) => {
                      const formaPagamento = venda.formaPagamento || 'Não informado';
                      
                      if (!grupos[formaPagamento]) {
                        grupos[formaPagamento] = [];
                      }
                      grupos[formaPagamento].push(venda);
                      return grupos;
                    }, {})
                  ).map(([formaPagamento, vendas]) => (
                    <div key={formaPagamento} className="border-l-4 border-primary pl-4">
                      <h5 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                        {formaPagamento === 'Dinheiro' && '💵'}
                        {formaPagamento === 'Débito' && '💳'}
                        {formaPagamento === 'Crédito' && '💳'}
                        {formaPagamento === 'Pix' && '📱'}
                        <span>{formaPagamento}</span>
                        <span className="text-sm font-normal text-gray-500">
                          ({vendas.length} {vendas.length === 1 ? 'venda' : 'vendas'})
                        </span>
                      </h5>
                      <div className="space-y-2">
                        {vendas.map((venda, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg border hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-800 text-sm">
                                  Venda #{String(venda.numeroVenda).padStart(4, '0')}
                                </h3>
                                <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                                  <p>
                                    {new Date(venda.dataHora || venda.data).toLocaleString('pt-BR')}
                                  </p>
                                  {venda.vendedor && (
                                    <p className="text-xs">
                                      Vendedor: {venda.vendedor}
                                    </p>
                                  )}
                                  {venda.cliente?.nome && (
                                    <p className="text-xs">
                                      Cliente: {venda.cliente.nome}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4 text-right">
                                <p className="text-lg font-bold text-green-600">{formatarValor(venda.total || 0)}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                  {venda.status === 'ativo' ? 'Ativa' : 'Cancelada'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhuma venda realizada neste caixa</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <button
                onClick={() => setModalDetalhesCaixa({ isOpen: false, caixa: null, vendas: [], resumo: {} })}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}
