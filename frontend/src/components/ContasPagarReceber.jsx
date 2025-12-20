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
import { DollarSign, Plus, TrendingUp, TrendingDown, Calendar, AlertCircle, CheckCircle, XCircle, Eye, CreditCard } from 'lucide-react';
import API_URL from '../config/apiUrl';

const ContasPagarReceber = () => {
  const navigate = useNavigate();
  const [aba, setAba] = useState('pagar');
  const [contasPagar, setContasPagar] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date().toISOString().slice(0, 7));
  
  const [modalSucesso, setModalSucesso] = useState({ isOpen: false, mensagem: '' });
  const [modalErro, setModalErro] = useState({ isOpen: false, mensagem: '' });
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, mensagem: '', onConfirm: null });
  const [contaDetalhes, setContaDetalhes] = useState(null);
  const [modalPagamento, setModalPagamento] = useState({ isOpen: false, conta: null, valor: 0 });

  const [formulario, setFormulario] = useState({
    tipo: 'pagar',
    descricao: '',
    valor: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    dataVencimento: '',
    categoria: '',
    formaPagamento: '',
    numeroParcela: 1,
    totalParcelas: 1,
    observacoes: '',
    supplierId: '',
    clienteNome: '',
    clienteCpfCnpj: '',
    clienteTelefone: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    carregarDados();
  }, [navigate, mesAtual]);

  const carregarDados = async () => {
    try {
      const headers = getAuthHeaders();
      const [ano, mes] = mesAtual.split('-');
      
      const [pagarRes, receberRes, fornecedoresRes] = await Promise.all([
        fetch(`${API_URL}/api/accounts-payable?mes=${mes}&ano=${ano}`, { headers }),
        fetch(`${API_URL}/api/accounts-receivable?mes=${mes}&ano=${ano}`, { headers }),
        fetch(API_URL + '/api/suppliers?ativo=true', { headers })
      ]);

      const pagarData = await pagarRes.json();
      const receberData = await receberRes.json();
      const fornecedoresData = await fornecedoresRes.json();

      setContasPagar(pagarData.data || []);
      setContasReceber(receberData.data || []);
      setFornecedores(fornecedoresData.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setModalErro({ isOpen: true, mensagem: 'Erro ao carregar contas' });
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.descricao || !formulario.valor || !formulario.dataVencimento) {
      setModalErro({ isOpen: true, mensagem: 'Preencha todos os campos obrigatórios' });
      return;
    }

    const payload = {
      ...formulario,
      valor: parseFloat(formulario.valor)
    };

    try {
      const url = formulario.tipo === 'pagar' 
        ? API_URL + '/api/accounts-payable'
        : API_URL + '/api/accounts-receivable';

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Falha ao criar conta');

      setModalSucesso({ isOpen: true, mensagem: 'Conta criada com sucesso!' });
      limparFormulario();
      setMostrarFormulario(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      setModalErro({ isOpen: true, mensagem: 'Erro ao criar conta' });
    }
  };

  const handleRegistrarPagamento = async () => {
    if (!modalPagamento.valor || modalPagamento.valor <= 0) {
      setModalErro({ isOpen: true, mensagem: 'Valor inválido' });
      return;
    }

    try {
      const endpoint = aba === 'pagar' ? 'pay' : 'receive';
      const url = aba === 'pagar'
        ? `${API_URL}/api/accounts-payable/${modalPagamento.conta.id}/${endpoint}`
        : `${API_URL}/api/accounts-receivable/${modalPagamento.conta.id}/${endpoint}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          [aba === 'pagar' ? 'valorPago' : 'valorRecebido']: parseFloat(modalPagamento.valor),
          [aba === 'pagar' ? 'dataPagamento' : 'dataRecebimento']: new Date().toISOString().split('T')[0],
          formaPagamento: modalPagamento.formaPagamento || 'dinheiro'
        })
      });

      if (!response.ok) throw new Error('Falha ao registrar pagamento');

      setModalSucesso({ isOpen: true, mensagem: `${aba === 'pagar' ? 'Pagamento' : 'Recebimento'} registrado com sucesso!` });
      setModalPagamento({ isOpen: false, conta: null, valor: 0 });
      carregarDados();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      setModalErro({ isOpen: true, mensagem: 'Erro ao registrar pagamento' });
    }
  };

  const handleCancelarConta = (conta) => {
    setModalConfirmacao({
      isOpen: true,
      mensagem: `Deseja cancelar esta conta?`,
      onConfirm: () => confirmarCancelamento(conta.id)
    });
  };

  const confirmarCancelamento = async (id) => {
    try {
      const url = aba === 'pagar'
        ? `${API_URL}/api/accounts-payable/${id}/cancel`
        : `${API_URL}/api/accounts-receivable/${id}/cancel`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Falha ao cancelar conta');

      setModalSucesso({ isOpen: true, mensagem: 'Conta cancelada com sucesso!' });
      carregarDados();
    } catch (error) {
      console.error('Erro ao cancelar conta:', error);
      setModalErro({ isOpen: true, mensagem: 'Erro ao cancelar conta' });
    }
  };

  const limparFormulario = () => {
    setFormulario({
      tipo: aba,
      descricao: '',
      valor: '',
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: '',
      categoria: '',
      formaPagamento: '',
      numeroParcela: 1,
      totalParcelas: 1,
      observacoes: '',
      supplierId: '',
      clienteNome: '',
      clienteCpfCnpj: '',
      clienteTelefone: ''
    });
  };

  const getStatusBadge = (conta) => {
    const hoje = new Date().toISOString().split('T')[0];
    const vencido = conta.dataVencimento < hoje && conta.status === 'pendente';
    
    const badges = {
      pendente: vencido ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800',
      pago: 'bg-green-100 text-green-800',
      recebido: 'bg-green-100 text-green-800',
      vencido: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-800'
    };
    
    const status = vencido ? 'vencido' : conta.status;
    const labels = {
      pendente: 'Pendente',
      pago: 'Pago',
      recebido: 'Recebido',
      vencido: 'Vencido',
      cancelado: 'Cancelado'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const calcularResumo = (contas) => {
    const pendente = contas.filter(c => c.status === 'pendente').reduce((acc, c) => acc + parseFloat(c.valor), 0);
    const pago = contas.filter(c => c.status === 'pago' || c.status === 'recebido').reduce((acc, c) => acc + parseFloat(c.valor), 0);
    const vencido = contas.filter(c => {
      const hoje = new Date().toISOString().split('T')[0];
      return c.dataVencimento < hoje && c.status === 'pendente';
    }).reduce((acc, c) => acc + parseFloat(c.valor), 0);
    
    return { pendente, pago, vencido };
  };

  const contasAtivas = aba === 'pagar' ? contasPagar : contasReceber;
  const resumo = calcularResumo(contasAtivas);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Contas a Pagar/Receber</h1>
              <p className="text-gray-600">Controle financeiro e fluxo de caixa</p>
            </div>
            <button
              onClick={() => {
                setFormulario({ ...formulario, tipo: aba });
                setMostrarFormulario(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Nova Conta
            </button>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendente</p>
                  <p className="text-2xl font-bold text-gray-900">{formatarPreco(resumo.pendente)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{aba === 'pagar' ? 'Pago' : 'Recebido'}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatarPreco(resumo.pago)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vencido</p>
                  <p className="text-2xl font-bold text-gray-900">{formatarPreco(resumo.vencido)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs e Filtro de Mês */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setAba('pagar')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    aba === 'pagar' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <TrendingDown className="w-5 h-5" />
                  Contas a Pagar
                </button>
                <button
                  onClick={() => setAba('receber')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    aba === 'receber' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  Contas a Receber
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <input
                  type="month"
                  value={mesAtual}
                  onChange={(e) => setMesAtual(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Formulário */}
          {mostrarFormulario && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Nova Conta a {formulario.tipo === 'pagar' ? 'Pagar' : 'Receber'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                    <input
                      type="text"
                      value={formulario.descricao}
                      onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {formulario.tipo === 'pagar' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fornecedor</label>
                      <select
                        value={formulario.supplierId}
                        onChange={(e) => setFormulario({ ...formulario, supplierId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione...</option>
                        {fornecedores.map(f => (
                          <option key={f.id} value={f.id}>{f.nomeFantasia || f.nome}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Cliente</label>
                        <input
                          type="text"
                          value={formulario.clienteNome}
                          onChange={(e) => setFormulario({ ...formulario, clienteNome: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CPF/CNPJ</label>
                        <input
                          type="text"
                          value={formulario.clienteCpfCnpj}
                          onChange={(e) => setFormulario({ ...formulario, clienteCpfCnpj: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor *</label>
                    <input
                      type="number"
                      value={formulario.valor}
                      onChange={(e) => setFormulario({ ...formulario, valor: e.target.value })}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Emissão</label>
                    <input
                      type="date"
                      value={formulario.dataEmissao}
                      onChange={(e) => setFormulario({ ...formulario, dataEmissao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Vencimento *</label>
                    <input
                      type="date"
                      value={formulario.dataVencimento}
                      onChange={(e) => setFormulario({ ...formulario, dataVencimento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                    <input
                      type="text"
                      value={formulario.categoria}
                      onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Aluguel, Venda"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parcela</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formulario.numeroParcela}
                        onChange={(e) => setFormulario({ ...formulario, numeroParcela: e.target.value })}
                        min="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="flex items-center">de</span>
                      <input
                        type="number"
                        value={formulario.totalParcelas}
                        onChange={(e) => setFormulario({ ...formulario, totalParcelas: e.target.value })}
                        min="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                    <textarea
                      value={formulario.observacoes}
                      onChange={(e) => setFormulario({ ...formulario, observacoes: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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
                    Criar Conta
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Contas */}
          {carregando ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando contas...</p>
            </div>
          ) : contasAtivas.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma conta encontrada</h3>
              <p className="text-gray-500">Crie sua primeira conta a {aba === 'pagar' ? 'pagar' : 'receber'}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {contasAtivas.map((conta) => {
                const valorPendente = parseFloat(conta.valor) - parseFloat(conta.valorPago || conta.valorRecebido || 0);
                const percentualPago = ((parseFloat(conta.valorPago || conta.valorRecebido || 0) / parseFloat(conta.valor)) * 100).toFixed(0);
                
                return (
                  <div key={conta.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{conta.descricao}</h3>
                          {getStatusBadge(conta)}
                        </div>
                        {aba === 'pagar' && conta.fornecedor && (
                          <p className="text-sm text-gray-600">{conta.fornecedor.nomeFantasia || conta.fornecedor.nome}</p>
                        )}
                        {aba === 'receber' && conta.clienteNome && (
                          <p className="text-sm text-gray-600">{conta.clienteNome}</p>
                        )}
                        {conta.categoria && (
                          <p className="text-xs text-gray-500 mt-1">Categoria: {conta.categoria}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{formatarPreco(parseFloat(conta.valor))}</p>
                        {valorPendente > 0 && valorPendente < parseFloat(conta.valor) && (
                          <p className="text-sm text-orange-600">Faltam {formatarPreco(valorPendente)}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {conta.numeroParcela}/{conta.totalParcelas}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Emissão</p>
                        <p className="font-medium text-gray-900">
                          {new Date(conta.dataEmissao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Vencimento</p>
                        <p className="font-medium text-gray-900">
                          {new Date(conta.dataVencimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">{aba === 'pagar' ? 'Pago' : 'Recebido'}</p>
                        <p className="font-medium text-gray-900">{percentualPago}%</p>
                      </div>
                    </div>

                    {valorPendente > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className={`h-2 rounded-full ${conta.status === 'pendente' ? 'bg-blue-600' : 'bg-green-600'}`}
                          style={{ width: `${percentualPago}%` }}
                        />
                      </div>
                    )}

                    <div className="flex gap-2 justify-end border-t pt-4">
                      <button
                        onClick={() => setContaDetalhes(conta)}
                        className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                        Detalhes
                      </button>
                      {conta.status !== 'pago' && conta.status !== 'recebido' && conta.status !== 'cancelado' && (
                        <>
                          <button
                            onClick={() => setModalPagamento({ isOpen: true, conta, valor: valorPendente, formaPagamento: 'dinheiro' })}
                            className="flex items-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <CreditCard className="w-4 h-4" />
                            {aba === 'pagar' ? 'Pagar' : 'Receber'}
                          </button>
                          <button
                            onClick={() => handleCancelarConta(conta)}
                            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal Pagamento */}
      {modalPagamento.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Registrar {aba === 'pagar' ? 'Pagamento' : 'Recebimento'}
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                <input
                  type="number"
                  value={modalPagamento.valor}
                  onChange={(e) => setModalPagamento({ ...modalPagamento, valor: e.target.value })}
                  min="0"
                  step="0.01"
                  max={parseFloat(modalPagamento.conta?.valor || 0) - parseFloat(modalPagamento.conta?.valorPago || modalPagamento.conta?.valorRecebido || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                <select
                  value={modalPagamento.formaPagamento}
                  onChange={(e) => setModalPagamento({ ...modalPagamento, formaPagamento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="transferencia">Transferência</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalPagamento({ isOpen: false, conta: null, valor: 0 })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarPagamento}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {contaDetalhes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{contaDetalhes.descricao}</h2>
                <button
                  onClick={() => setContaDetalhes(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Valor Total</p>
                  <p className="text-lg font-semibold">{formatarPreco(parseFloat(contaDetalhes.valor))}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{aba === 'pagar' ? 'Valor Pago' : 'Valor Recebido'}</p>
                  <p className="text-lg font-semibold">
                    {formatarPreco(parseFloat(contaDetalhes.valorPago || contaDetalhes.valorRecebido || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Emissão</p>
                  <p className="font-medium">{new Date(contaDetalhes.dataEmissao).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Vencimento</p>
                  <p className="font-medium">{new Date(contaDetalhes.dataVencimento).toLocaleDateString('pt-BR')}</p>
                </div>
                {contaDetalhes.categoria && (
                  <div>
                    <p className="text-sm text-gray-500">Categoria</p>
                    <p className="font-medium">{contaDetalhes.categoria}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Parcela</p>
                  <p className="font-medium">{contaDetalhes.numeroParcela}/{contaDetalhes.totalParcelas}</p>
                </div>
              </div>
              
              {contaDetalhes.observacoes && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Observações</p>
                  <p className="text-gray-700">{contaDetalhes.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

export default ContasPagarReceber;
