import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getAuthHeaders } from '../utils/auth';
import API_URL from '../config/apiUrl';

const GerenciarDebitos = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [cliente, setCliente] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tipoOperacao, setTipoOperacao] = useState('adicionar'); // adicionar, pagar, aumentar-credito, diminuir-credito
  const [formData, setFormData] = useState({
    valor: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    carregarCliente();
  }, [id]);

  const carregarCliente = async () => {
    try {
      const response = await fetch(`${API_URL}/api/customers/${id}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Cliente não encontrado');
      }

      const data = await response.json();
      setCliente(data.data);
      
      // Carregar transações do cliente
      if (data.data.transacoes) {
        setHistorico(data.data.transacoes);
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      alert('Cliente não encontrado');
      navigate('/clientes');
    }
  };

  const handleOpenModal = (tipo) => {
    setTipoOperacao(tipo);
    setFormData({
      valor: '',
      descricao: '',
      data: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      valor: '',
      descricao: '',
      data: new Date().toISOString().split('T')[0]
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSalvarOperacao = async () => {
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      alert('Informe um valor válido');
      return;
    }

    if (!formData.descricao.trim()) {
      alert('Informe uma descrição');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/customers/${id}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tipo: tipoOperacao,
          valor: parseFloat(formData.valor),
          descricao: formData.descricao,
          data: formData.data
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao registrar transação');
      }

      const mensagens = {
        'adicionar': 'Débito adicionado com sucesso!',
        'pagar': 'Pagamento registrado com sucesso!',
        'aumentar-credito': 'Limite de crédito aumentado com sucesso!',
        'diminuir-credito': 'Limite de crédito reduzido com sucesso!'
      };
      
      alert(mensagens[tipoOperacao]);
      handleCloseModal();
      carregarCliente();
    } catch (error) {
      console.error('Erro ao salvar operação:', error);
      alert(error.message || 'Erro ao registrar transação');
    }
  };

  const handleRemoverHistorico = async (historicoId) => {
    if (!confirm('Deseja realmente remover este registro do histórico?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/customers/transactions/${historicoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover transação');
      }

      alert('Registro removido com sucesso!');
      carregarCliente();
    } catch (error) {
      console.error('Erro ao remover transação:', error);
      alert(error.message || 'Erro ao remover transação');
    }
  };

  const formatarData = (data) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (!cliente) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="flex min-h-screen bg-background-light">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between whitespace-nowrap border-b border-slate-200 px-6 h-16 bg-white">
          <div>
            <h1 className="text-slate-900 text-3xl font-bold leading-tight">Gerenciar Débitos</h1>
            <p className="text-slate-600 text-sm mt-1">{cliente.nome}</p>
          </div>
          <button 
            onClick={() => navigate('/clientes')}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 border-2 border-slate-300 bg-transparent text-slate-900 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-100"
          >
            <span className="truncate">Voltar</span>
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {/* Cards de Saldo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Card de Débito */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Débito Atual</p>
                  <h2 className={`text-4xl font-bold ${cliente.debito > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatarValor(cliente.debito || 0)}
                  </h2>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal('adicionar')}
                  className="flex-1 items-center justify-center rounded-lg h-10 px-4 bg-red-600 text-white text-sm font-bold hover:bg-red-700"
                >
                  ➕ Adicionar Débito
                </button>
                <button
                  onClick={() => handleOpenModal('pagar')}
                  className="flex-1 items-center justify-center rounded-lg h-10 px-4 bg-green-600 text-white text-sm font-bold hover:bg-green-700"
                  disabled={!cliente.debito || cliente.debito <= 0}
                >
                  💰 Registrar Pagamento
                </button>
              </div>
            </div>

            {/* Card de Crédito */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Limite de Crédito</p>
                  <h2 className="text-4xl font-bold text-blue-600">
                    {formatarValor(cliente.limiteCredito || 0)}
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">
                    Disponível: {formatarValor(Math.max(0, (cliente.limiteCredito || 0) - (cliente.debito || 0)))}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal('aumentar-credito')}
                  className="flex-1 items-center justify-center rounded-lg h-10 px-4 bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
                >
                  ⬆️ Aumentar Crédito
                </button>
                <button
                  onClick={() => handleOpenModal('diminuir-credito')}
                  className="flex-1 items-center justify-center rounded-lg h-10 px-4 bg-orange-600 text-white text-sm font-bold hover:bg-orange-700"
                  disabled={!cliente.limiteCredito || cliente.limiteCredito <= 0}
                >
                  ⬇️ Reduzir Crédito
                </button>
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">Histórico de Movimentações</h2>
            </div>

            {historico.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Nenhuma movimentação registrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Data</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Tipo</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Descrição</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Valor</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((item) => (
                      <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {formatarData(item.data)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            item.tipo === 'adicionar' ? 'bg-red-100 text-red-700' : 
                            item.tipo === 'pagar' ? 'bg-green-100 text-green-700' :
                            item.tipo === 'aumentar-credito' ? 'bg-blue-100 text-blue-700' :
                            item.tipo === 'diminuir-credito' ? 'bg-orange-100 text-orange-700' :
                            item.tipo === 'usar-credito' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.tipo === 'adicionar' ? '📈 Débito Adicionado' : 
                             item.tipo === 'pagar' ? '💵 Pagamento' :
                             item.tipo === 'aumentar-credito' ? '⬆️ Aumento Crédito' :
                             item.tipo === 'diminuir-credito' ? '⬇️ Redução Crédito' :
                             item.tipo === 'usar-credito' ? '💳 Crédito Utilizado' :
                             item.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {item.descricao}
                        </td>
                        <td className={`px-6 py-4 text-sm text-right font-semibold ${
                          item.tipo === 'adicionar' || item.tipo === 'aumentar-credito' || item.tipo === 'usar-credito' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.tipo === 'adicionar' || item.tipo === 'aumentar-credito' || item.tipo === 'usar-credito' ? '+' : '-'} {formatarValor(item.valor)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleRemoverHistorico(item.id)}
                            className="text-red-600 hover:text-red-800 font-semibold text-sm"
                          >
                            🗑️ Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">
                {tipoOperacao === 'adicionar' ? 'Adicionar Débito' : 
                 tipoOperacao === 'pagar' ? 'Registrar Pagamento' :
                 tipoOperacao === 'aumentar-credito' ? 'Aumentar Limite de Crédito' :
                 'Reduzir Limite de Crédito'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <label className="flex flex-col w-full">
                <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                  Valor <span className="text-red-500">*</span>
                </p>
                <input 
                  name="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={handleInputChange}
                  className="form-input rounded-lg h-12 px-3 border-2 border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="0,00"
                />
              </label>

              <label className="flex flex-col w-full">
                <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                  Data <span className="text-red-500">*</span>
                </p>
                <input 
                  name="data"
                  type="date"
                  value={formData.data}
                  onChange={handleInputChange}
                  className="form-input rounded-lg h-12 px-3 border-2 border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </label>

              <label className="flex flex-col w-full">
                <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                  Descrição <span className="text-red-500">*</span>
                </p>
                <textarea 
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 bg-white focus:border-primary min-h-20 placeholder:text-slate-400 p-3 text-sm font-normal leading-normal" 
                  placeholder={
                    tipoOperacao === 'adicionar' ? 'Ex: Compra a prazo de...' : 
                    tipoOperacao === 'pagar' ? 'Ex: Pagamento em dinheiro' :
                    tipoOperacao === 'aumentar-credito' ? 'Ex: Aumento de limite aprovado' :
                    'Ex: Redução de limite'
                  }
                ></textarea>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="flex items-center justify-center rounded-lg h-10 px-4 border-2 border-slate-300 bg-transparent text-slate-900 text-sm font-bold hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarOperacao}
                className={`flex items-center justify-center rounded-lg h-10 px-4 text-white text-sm font-bold ${
                  tipoOperacao === 'adicionar' ? 'bg-red-600 hover:bg-red-700' : 
                  tipoOperacao === 'pagar' ? 'bg-green-600 hover:bg-green-700' :
                  tipoOperacao === 'aumentar-credito' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciarDebitos;
