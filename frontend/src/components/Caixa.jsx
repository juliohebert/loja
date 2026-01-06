// Função utilitária para formatar valores monetários no padrão brasileiro
const formatarPreco = (valor) => {
  return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';
import { FaCashRegister, FaLock, FaUnlock, FaHistory, FaPlus, FaMinus } from 'react-icons/fa';
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
    console.log('🔄 Calculando vendas do caixa...');
    console.log('📦 Caixa aberto:', caixaAberto);
    
    if (!caixaAberto) {
      console.log('❌ Caixa não está aberto');
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
      console.log('💰 Total de vendas da API:', vendas.length);
      
      // Usar data e HORA completa da abertura do caixa para filtrar corretamente
      const dataHoraAbertura = new Date(caixaAberto.dataAbertura);
      console.log('📅 Data/Hora abertura caixa:', dataHoraAbertura.toISOString());
      
      const vendasDoCaixaAtual = vendas.filter(venda => {
        // Filtrar vendas que foram criadas após abertura do caixa
        const dataVenda = new Date(venda.criadoEm || venda.data);
        const resultado = dataVenda >= dataHoraAbertura;
        console.log(`  Venda: ${dataVenda.toISOString()} >= ${dataHoraAbertura.toISOString()}? ${resultado}`);
        return resultado;
      });

      console.log('✅ Vendas do caixa atual:', vendasDoCaixaAtual.length);
      const totalVendas = vendasDoCaixaAtual.reduce((acc, venda) => acc + parseFloat(venda.total || 0), 0);
      console.log('💵 Total vendas:', totalVendas);
      
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
        const dataVenda = new Date(venda.criadoEm || venda.data);
        return dataVenda >= dataHoraAbertura;
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
      
      console.log('📦 Caixa selecionado:', caixa);
      console.log('💰 Total de vendas:', vendas.length);
      
      const dataAbertura = new Date(caixa.dataAbertura);
      const dataFechamento = caixa.dataFechamento ? new Date(caixa.dataFechamento) : new Date();
      
      console.log('📅 Período do caixa:');
      console.log('  Abertura:', dataAbertura.toISOString());
      console.log('  Fechamento:', dataFechamento.toISOString());
      
      // Filtrar vendas do período do caixa
      const vendasDoCaixa = vendas.filter(venda => {
        const dataVenda = new Date(venda.criadoEm || venda.data);
        const resultado = dataVenda >= dataAbertura && dataVenda <= dataFechamento;
        console.log(`  Venda ${dataVenda.toISOString()}: ${resultado ? '✅' : '❌'}`);
        return resultado;
      });

      console.log('✅ Vendas encontradas:', vendasDoCaixa.length);

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
      }, 5000); // Atualiza a cada 5 segundos

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
    setLoading(true);
    try {
      const response = await fetch(API_URL + '/api/cash-registers/open', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          saldoInicial: parseFloat(modalAbrir.saldoInicial)
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

  return (
    <div className="layout-with-sidebar">
      <Sidebar />

      <main className="main-content content-with-hamburger">
        <div className="container-mobile">
          {/* Toast */}
          {toast.isOpen && (
            <Toast
              isOpen={toast.isOpen}
              mensagem={toast.message}
              tipo={toast.tipo}
              onClose={() => setToast({ ...toast, isOpen: false })}
            />
          )}

          {/* Header */}
          <div className="mb-6 mobile-header-spacing">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Controle de Caixa</h1>
            <p className="text-gray-600">Gerencie a abertura e fechamento do caixa</p>
          </div>

      {/* Status do Caixa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Card Status Atual */}
        <div className={`p-6 rounded-lg shadow-md ${caixaAberto ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50 border-2 border-gray-300'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {caixaAberto ? <FaUnlock className="text-green-600" /> : <FaLock className="text-gray-600" />}
              Status do Caixa
            </h2>
            {caixaAberto && (
              <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">Aberto</span>
            )}
          </div>

          {caixaAberto ? (
            <>
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Aberto em:</p>
                  <p className="font-semibold">{formatarData(caixaAberto.dataAbertura)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saldo Inicial:</p>
                  <p className="text-2xl font-bold text-green-600">{formatarValor(caixaAberto.saldoInicial)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendas do Caixa:</p>
                  <button
                    onClick={abrirModalVendas}
                    className="text-xl font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors text-left"
                  >
                    {formatarValor(vendasDoCaixa.total)} 
                    <span className="text-sm text-gray-500 ml-2">({vendasDoCaixa.quantidade} vendas)</span>
                  </button>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">Saldo Atual:</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatarValor(parseFloat(caixaAberto.saldoInicial) + parseFloat(vendasDoCaixa.total))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Operador:</p>
                  <p className="font-semibold">{caixaAberto.usuario?.nome || 'N/A'}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const saldoTotal = parseFloat(caixaAberto.saldoInicial) + parseFloat(vendasDoCaixa.total);
                  setModalFechar({ ...modalFechar, saldoFinal: saldoTotal.toFixed(2), observacoes: '' });
                  setModalConfirmar({
                    isOpen: true,
                    message: 'Deseja realmente fechar o caixa?',
                    action: 'fechar'
                  });
                }}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <FaLock /> Fechar Caixa
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-4">Nenhum caixa aberto no momento.</p>
              <button
                onClick={() => setModalAbrir({ isOpen: true, saldoInicial: '0' })}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <FaUnlock /> Abrir Caixa
              </button>
            </>
          )}
        </div>

        {/* Card Resumo */}
        <div className="p-6 bg-white rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaCashRegister /> Resumo
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total de Caixas:</span>
              <span className="font-semibold">{historico.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Caixas Abertos:</span>
              <span className="font-semibold">{historico.filter(c => c.status === 'aberto').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Caixas Fechados:</span>
              <span className="font-semibold">{historico.filter(c => c.status === 'fechado').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaHistory /> Histórico de Caixas
        </h2>

        <div className="overflow-x-auto">
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
                        className="text-blue-600 hover:text-blue-800 hover:underline"
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
                  Saldo Final
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={modalFechar.saldoFinal}
                  onChange={(e) => setModalFechar({ ...modalFechar, saldoFinal: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="0.00"
                />
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
                Total: {formatarValor(modalVendas.vendas.reduce((acc, v) => acc + parseFloat(v.valor), 0))} • {modalVendas.vendas.length} vendas
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {modalVendas.vendas.length > 0 ? (
                <div className="space-y-3">
                  {modalVendas.vendas.map((venda, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{venda.descricao}</h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">Data:</span> {new Date(venda.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                            {venda.categoria && (
                              <p>
                                <span className="font-medium">Categoria:</span> {venda.categoria}
                              </p>
                            )}
                            {venda.cliente && (
                              <p>
                                <span className="font-medium">Cliente:</span> {venda.cliente}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-xl font-bold text-green-600">{formatarValor(venda.valor)}</p>
                          <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {venda.status || 'Pago'}
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
                    {formatarValor(modalDetalhesCaixa.vendas.reduce((acc, v) => acc + parseFloat(v.valor), 0))}
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
                      let formaPagamento = venda.formaPagamento;
                      
                      // Extrair forma de pagamento das observações se não existir
                      if (!formaPagamento && venda.observacoes) {
                        const match = venda.observacoes.match(/Forma de pagamento:\s*([^|]+)/i);
                        if (match) formaPagamento = match[1].trim();
                      }
                      
                      if (!formaPagamento) formaPagamento = 'Não informado';
                      
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
                                <h3 className="font-medium text-gray-800 text-sm">{venda.descricao}</h3>
                                <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                                  <p>
                                    {new Date(venda.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  {venda.observacoes && venda.observacoes.includes('Vendedor:') && (
                                    <p className="text-xs">
                                      {venda.observacoes.match(/Vendedor:\s*([^|]+)/)?.[1]?.trim()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4 text-right">
                                <p className="text-lg font-bold text-green-600">{formatarValor(venda.valor)}</p>
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
  );
}
