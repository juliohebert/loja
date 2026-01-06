import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getAuthHeaders } from '../utils/auth';
import { Edit, Trash2, DollarSign, Plus, Search } from 'lucide-react';
import API_URL from '../config/apiUrl';

const Clientes = () => {
  const navigate = useNavigate();
  
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState([]);
  const [filtroDebito, setFiltroDebito] = useState('todos');
  const [filtroCredito, setFiltroCredito] = useState('todos');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setCarregando(true);
      
      const response = await fetch(API_URL + '/api/customers', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar clientes');
      }

      const data = await response.json();
      setClientes(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      alert('Erro ao carregar clientes. Verifique se o backend está rodando.');
    } finally {
      setCarregando(false);
    }
  };

  const handleEditar = (clienteId) => {
    navigate(`/clientes/editar/${clienteId}`);
  };

  const handleRemover = async (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    
    if (cliente && cliente.debito > 0) {
      alert('Não é possível remover um cliente com débito pendente!');
      return;
    }

    if (confirm('Deseja realmente remover este cliente?')) {
      try {
        const response = await fetch(`${API_URL}/api/customers/${clienteId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao remover cliente');
        }

        alert('Cliente removido com sucesso!');
        carregarClientes();
      } catch (error) {
        console.error('Erro ao remover cliente:', error);
        alert(error.message || 'Erro ao remover cliente');
      }
    }
  };

  const handleGerenciarDebitos = (clienteId) => {
    navigate(`/clientes/debitos/${clienteId}`);
  };

  const calcularCreditoDisponivel = (cliente) => {
    const limite = cliente.limiteCredito || 0;
    const usado = cliente.debito || 0;
    return Math.max(0, limite - usado);
  };

  const calcularPercentualCredito = (cliente) => {
    const limite = cliente.limiteCredito || 0;
    if (limite === 0) return 0;
    const usado = cliente.debito || 0;
    return Math.min(100, (usado / limite) * 100);
  };

  const filtrarClientes = () => {
    let resultado = clientes;

    if (busca) {
      resultado = resultado.filter(c => 
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.cpf.includes(busca) ||
        c.telefone.includes(busca) ||
        (c.email && c.email.toLowerCase().includes(busca.toLowerCase()))
      );
    }

    if (filtroDebito === 'com-debito') {
      resultado = resultado.filter(c => c.debito > 0);
    } else if (filtroDebito === 'sem-debito') {
      resultado = resultado.filter(c => !c.debito || c.debito === 0);
    }

    if (filtroCredito === 'com-credito') {
      resultado = resultado.filter(c => (c.limiteCredito || 0) > 0);
    } else if (filtroCredito === 'sem-credito') {
      resultado = resultado.filter(c => !c.limiteCredito || c.limiteCredito === 0);
    } else if (filtroCredito === 'credito-estourado') {
      resultado = resultado.filter(c => {
        const limite = c.limiteCredito || 0;
        const usado = c.debito || 0;
        return limite > 0 && usado >= limite;
      });
    }

    return resultado;
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const clientesFiltrados = filtrarClientes();
  const totalDebitos = clientes.reduce((acc, c) => acc + (Number(c.debito) || 0), 0);
  const clientesComDebito = clientes.filter(c => c.debito > 0).length;
  const clientesComCredito = clientes.filter(c => (c.limiteCredito || 0) > 0).length;
  const totalCredito = clientes.reduce((acc, c) => acc + calcularCreditoDisponivel(c), 0);

  return (
    <div className="layout-with-sidebar">
      <Sidebar />

      <div className="main-content content-with-hamburger">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 sm:px-6 h-16 sm:h-20 bg-white mobile-header-spacing">
          <h1 className="text-slate-900 text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">Clientes</h1>
          <button 
            onClick={() => navigate('/clientes/novo')}
            className="flex items-center justify-center gap-2 cursor-pointer rounded-lg px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-700 btn-touch"
          >
            <Plus className="w-5 h-5" />
            <span className="truncate hide-text-mobile">Novo Cliente</span>
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-slate-600 text-sm font-medium mb-2">Total de Clientes</p>
              <p className="text-slate-900 text-2xl font-bold">{clientes.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-slate-600 text-sm font-medium mb-2">Com Débito</p>
              <p className="text-red-600 text-2xl font-bold">{clientesComDebito}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-slate-600 text-sm font-medium mb-2">Débito Total</p>
              <p className="text-red-600 text-2xl font-bold">{formatarValor(totalDebitos)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-slate-600 text-sm font-medium mb-2">Com Crédito</p>
              <p className="text-blue-600 text-2xl font-bold">{clientesComCredito}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-slate-600 text-sm font-medium mb-2">Crédito Disponível</p>
              <p className="text-green-600 text-2xl font-bold">{formatarValor(totalCredito)}</p>
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary h-12 placeholder:text-slate-500 pl-12 text-base font-normal leading-normal bg-background-light border-transparent"
                  placeholder="Buscar por nome, CPF, telefone ou email"
                />
              </div>

              <div className="mb-4">
                <p className="text-slate-700 text-sm font-semibold mb-2">Filtrar por Débito:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFiltroDebito('todos')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      filtroDebito === 'todos' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroDebito('com-debito')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      filtroDebito === 'com-debito' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Com Débito
                  </button>
                  <button
                    onClick={() => setFiltroDebito('sem-debito')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      filtroDebito === 'sem-debito' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Sem Débito
                  </button>
                </div>
              </div>

              <div>
                <p className="text-slate-700 text-sm font-semibold mb-2">Filtrar por Crédito:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFiltroCredito('todos')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      filtroCredito === 'todos' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroCredito('com-credito')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      filtroCredito === 'com-credito' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Com Crédito
                  </button>
                  <button
                    onClick={() => setFiltroCredito('sem-credito')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      filtroCredito === 'sem-credito' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Sem Crédito
                  </button>
                  <button
                    onClick={() => setFiltroCredito('credito-estourado')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      filtroCredito === 'credito-estourado' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ⚠️ Crédito Estourado
                  </button>
                </div>
              </div>
            </div>

            {clientesFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {busca || filtroDebito !== 'todos' || filtroCredito !== 'todos' 
                  ? 'Nenhum cliente encontrado com os filtros aplicados' 
                  : 'Nenhum cliente cadastrado'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Nome</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">CPF</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Telefone</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">E-mail</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Débito</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Limite Crédito</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Crédito Disponível</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Status</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map((cliente) => (
                      <tr key={cliente.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{cliente.nome}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{cliente.cpf}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{cliente.telefone}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{cliente.email || '-'}</td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-red-600">
                          {formatarValor(cliente.debito || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-blue-600">
                          {formatarValor(cliente.limiteCredito || 0)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${
                              calcularCreditoDisponivel(cliente) === 0 && (cliente.limiteCredito || 0) > 0
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }`}>
                              {formatarValor(calcularCreditoDisponivel(cliente))}
                            </p>
                            {(cliente.limiteCredito || 0) > 0 && (
                              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    calcularPercentualCredito(cliente) >= 100 ? 'bg-red-600' :
                                    calcularPercentualCredito(cliente) >= 80 ? 'bg-orange-500' :
                                    calcularPercentualCredito(cliente) >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${calcularPercentualCredito(cliente)}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            cliente.debito > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {cliente.debito > 0 ? 'Com Débito' : 'Em Dia'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleGerenciarDebitos(cliente.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Gerenciar Débitos"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditar(cliente.id)}
                              className="p-1.5 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemover(cliente.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
    </div>
  );
};

export default Clientes;
