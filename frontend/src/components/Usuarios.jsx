import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Users, Plus, Edit, Trash2, CheckCircle, XCircle, Shield, Search, Eye, EyeOff } from 'lucide-react';
import ModalConfirmacao from './ModalConfirmacao';
import Toast from './Toast';

const Usuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroFuncao, setFiltroFuncao] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  
  // Modal de criar/editar usuário
  const [modalUsuario, setModalUsuario] = useState({ isOpen: false, usuario: null });
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    funcao: 'vendedor',
    ativo: true
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  // Modais
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, usuarioId: null, nomeUsuario: '' });
  const [toast, setToast] = useState({ isOpen: false, tipo: 'sucesso', mensagem: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    buscarUsuarios();
  }, [navigate]);

  const buscarUsuarios = async () => {
    try {
      setCarregando(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Falha ao buscar usuários');

      const data = await response.json();
      setUsuarios(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setToast({ isOpen: true, tipo: 'erro', mensagem: 'Erro ao carregar usuários' });
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = modalUsuario.usuario 
        ? `http://localhost:3001/api/users/${modalUsuario.usuario.id}`
        : 'http://localhost:3001/api/users';
      
      const method = modalUsuario.usuario ? 'PUT' : 'POST';
      
      // Se está editando e não mudou a senha, não enviar campo senha
      const dataToSend = { ...formData };
      if (modalUsuario.usuario && !formData.senha) {
        delete dataToSend.senha;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar usuário');
      }

      setToast({ 
        isOpen: true, 
        tipo: 'sucesso', 
        mensagem: modalUsuario.usuario ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!' 
      });
      
      setModalUsuario({ isOpen: false, usuario: null });
      buscarUsuarios();
    } catch (error) {
      console.error('Erro:', error);
      setToast({ isOpen: true, tipo: 'erro', mensagem: error.message });
    }
  };

  const handleEditar = (usuario) => {
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      telefone: usuario.telefone || '',
      funcao: usuario.funcao,
      ativo: usuario.ativo
    });
    setModalUsuario({ isOpen: true, usuario });
  };

  const handleNovo = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      telefone: '',
      funcao: 'vendedor',
      ativo: true
    });
    setModalUsuario({ isOpen: true, usuario: null });
  };

  const handleDesativar = (usuario) => {
    setModalConfirmacao({ 
      isOpen: true, 
      usuarioId: usuario.id, 
      nomeUsuario: usuario.nome,
      acao: usuario.ativo ? 'desativar' : 'reativar'
    });
  };

  const confirmarAcao = async () => {
    const { usuarioId, acao } = modalConfirmacao;
    setModalConfirmacao({ isOpen: false, usuarioId: null, nomeUsuario: '', acao: '' });

    try {
      const token = localStorage.getItem('token');
      const url = acao === 'desativar'
        ? `http://localhost:3001/api/users/${usuarioId}`
        : `http://localhost:3001/api/users/${usuarioId}/reactivate`;
      
      const method = acao === 'desativar' ? 'DELETE' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao atualizar usuário');

      setToast({ 
        isOpen: true, 
        tipo: 'sucesso', 
        mensagem: acao === 'desativar' ? 'Usuário desativado com sucesso!' : 'Usuário reativado com sucesso!' 
      });
      buscarUsuarios();
    } catch (error) {
      console.error('Erro:', error);
      setToast({ isOpen: true, tipo: 'erro', mensagem: error.message });
    }
  };

  // Filtros
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchBusca = usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       usuario.email.toLowerCase().includes(busca.toLowerCase());
    const matchFuncao = filtroFuncao === 'todos' || usuario.funcao === filtroFuncao;
    const matchStatus = filtroStatus === 'todos' || 
                       (filtroStatus === 'ativo' && usuario.ativo) ||
                       (filtroStatus === 'inativo' && !usuario.ativo);
    
    return matchBusca && matchFuncao && matchStatus;
  });

  const getFuncaoBadge = (funcao) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      gerente: 'bg-blue-100 text-blue-800',
      vendedor: 'bg-green-100 text-green-800'
    };
    
    const labels = {
      admin: 'Administrador',
      gerente: 'Gerente',
      vendedor: 'Vendedor'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[funcao]}`}>
        {labels[funcao]}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Gestão de Usuários</h1>
              <p className="text-gray-600">Gerencie usuários, permissões e acessos</p>
            </div>
            <button
              onClick={handleNovo}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Usuário
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtro Função */}
              <select
                value={filtroFuncao}
                onChange={(e) => setFiltroFuncao(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todas as funções</option>
                <option value="admin">Administrador</option>
                <option value="gerente">Gerente</option>
                <option value="vendedor">Vendedor</option>
              </select>

              {/* Filtro Status */}
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos os status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Sobre Permissões</h3>
                <p className="text-sm text-blue-700">
                  <strong>Administrador:</strong> Acesso total ao sistema, incluindo gestão de usuários e configurações.<br />
                  <strong>Gerente:</strong> Pode gerenciar produtos, estoque, vendas e visualizar relatórios.<br />
                  <strong>Vendedor:</strong> Pode realizar vendas e consultar estoque (sem editar).
                </p>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {carregando ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        Carregando...
                      </td>
                    </tr>
                  ) : usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{usuario.nome}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{usuario.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{usuario.telefone || '-'}</td>
                        <td className="px-6 py-4">{getFuncaoBadge(usuario.funcao)}</td>
                        <td className="px-6 py-4">
                          {usuario.ativo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3" />
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {usuario.ultimoLogin ? new Date(usuario.ultimoLogin).toLocaleString('pt-BR') : 'Nunca'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditar(usuario)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDesativar(usuario)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                usuario.ativo 
                                  ? 'text-red-600 hover:bg-red-50' 
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={usuario.ativo ? 'Desativar' : 'Reativar'}
                            >
                              {usuario.ativo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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
        </div>
      </main>

      {/* Modal Criar/Editar */}
      {modalUsuario.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {modalUsuario.usuario ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {modalUsuario.usuario ? '(deixe em branco para não alterar)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required={!modalUsuario.usuario}
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função *</label>
                <select
                  required
                  value={formData.funcao}
                  onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
                  Usuário ativo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalUsuario({ isOpen: false, usuario: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {modalUsuario.usuario ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação */}
      <ModalConfirmacao
        isOpen={modalConfirmacao.isOpen}
        onClose={() => setModalConfirmacao({ isOpen: false, usuarioId: null, nomeUsuario: '', acao: '' })}
        onConfirm={confirmarAcao}
        tipo={modalConfirmacao.acao === 'desativar' ? 'warning' : 'success'}
        titulo={modalConfirmacao.acao === 'desativar' ? 'Desativar Usuário' : 'Reativar Usuário'}
        mensagem={
          modalConfirmacao.acao === 'desativar'
            ? `Deseja realmente desativar "${modalConfirmacao.nomeUsuario}"? O usuário não poderá mais acessar o sistema.`
            : `Deseja reativar "${modalConfirmacao.nomeUsuario}"? O usuário voltará a ter acesso ao sistema.`
        }
      />

      {/* Toast */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ isOpen: false, tipo: 'sucesso', mensagem: '' })}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        duracao={3000}
      />
    </div>
  );
};

export default Usuarios;
