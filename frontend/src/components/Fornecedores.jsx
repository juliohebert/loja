import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getAuthHeaders } from '../utils/auth';
import ModalSucesso from './ModalSucesso';
import ModalErro from './ModalErro';
import ModalConfirmacao from './ModalConfirmacao';
import { Users, Plus, Edit, Trash2, Star, Phone, Mail, MapPin, Clock, FileText } from 'lucide-react';
import API_URL from '../config/apiUrl';

const Fornecedores = () => {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [carregando, setCarregando] = useState(true);
  
  // Modais
  const [modalSucesso, setModalSucesso] = useState({ isOpen: false, mensagem: '' });
  const [modalErro, setModalErro] = useState({ isOpen: false, mensagem: '' });
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, mensagem: '', onConfirm: null });
  
  // Formulário
  const [formulario, setFormulario] = useState({
    nome: '',
    nomeFantasia: '',
    cnpj: '',
    cpf: '',
    email: '',
    telefone: '',
    celular: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    prazoEntregaDias: 0,
    condicoesPagamento: '',
    observacoes: '',
    avaliacaoQualidade: 0,
    avaliacaoPontualidade: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    carregarFornecedores();
  }, [navigate]);

  const carregarFornecedores = async () => {
    try {
      const response = await fetch(API_URL + '/api/suppliers', {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Falha ao buscar fornecedores');

      const data = await response.json();
      setFornecedores(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setModalErro({ isOpen: true, mensagem: 'Erro ao carregar fornecedores' });
    } finally {
      setCarregando(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formulario.nome) {
      setModalErro({ isOpen: true, mensagem: 'Nome do fornecedor é obrigatório' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = modoEdicao 
        ? `${API_URL}/api/suppliers/${formulario.id}`
        : API_URL + '/api/suppliers';
      
      const response = await fetch(url, {
        method: modoEdicao ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formulario)
      });

      if (!response.ok) throw new Error('Falha ao salvar fornecedor');

      setModalSucesso({ 
        isOpen: true, 
        mensagem: `Fornecedor ${modoEdicao ? 'atualizado' : 'cadastrado'} com sucesso!` 
      });
      
      limparFormulario();
      setMostrarFormulario(false);
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      setModalErro({ isOpen: true, mensagem: 'Erro ao salvar fornecedor' });
    }
  };

  const handleEditar = (fornecedor) => {
    setFormulario(fornecedor);
    setModoEdicao(true);
    setMostrarFormulario(true);
  };

  const handleExcluir = (id) => {
    setModalConfirmacao({
      isOpen: true,
      mensagem: 'Deseja realmente desativar este fornecedor?',
      onConfirm: () => confirmarExclusao(id)
    });
  };

  const confirmarExclusao = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Falha ao desativar fornecedor');

      setModalSucesso({ isOpen: true, mensagem: 'Fornecedor desativado com sucesso!' });
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao desativar fornecedor:', error);
      setModalErro({ isOpen: true, mensagem: 'Erro ao desativar fornecedor' });
    }
  };

  const limparFormulario = () => {
    setFormulario({
      nome: '',
      nomeFantasia: '',
      cnpj: '',
      cpf: '',
      email: '',
      telefone: '',
      celular: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      prazoEntregaDias: 0,
      condicoesPagamento: '',
      observacoes: '',
      avaliacaoQualidade: 0,
      avaliacaoPontualidade: 0
    });
    setModoEdicao(false);
  };

  const formatarCNPJ = (cnpj) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatarCPF = (cpf) => {
    if (!cpf) return '';
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  };

  const renderEstrelas = (nota) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < nota ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      
      <main className="main-content content-with-hamburger">
        <div className="container-mobile">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4 mobile-header-spacing">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Fornecedores</h1>
              <p className="text-gray-600">Gestão de fornecedores e parceiros</p>
            </div>
            <button
              onClick={() => {
                limparFormulario();
                setMostrarFormulario(true);
              }}
              className="flex items-center justify-center gap-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors btn-touch w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              <span className="hide-text-mobile">Novo Fornecedor</span>
            </button>
          </div>

          {/* Formulário */}
          {mostrarFormulario && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {modoEdicao ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                {/* Dados Principais */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razão Social / Nome *
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={formulario.nome}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      name="nomeFantasia"
                      value={formulario.nomeFantasia}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      name="cnpj"
                      value={formulario.cnpj}
                      onChange={handleInputChange}
                      placeholder="00.000.000/0000-00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      value={formulario.cpf}
                      onChange={handleInputChange}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formulario.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      name="telefone"
                      value={formulario.telefone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Celular
                    </label>
                    <input
                      type="tel"
                      name="celular"
                      value={formulario.celular}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="border-t pt-4 mb-6">
                  <h3 className="text-md font-semibold text-gray-700 mb-3">Endereço</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                      <input
                        type="text"
                        name="cep"
                        value={formulario.cep}
                        onChange={handleInputChange}
                        placeholder="00000-000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                      <input
                        type="text"
                        name="endereco"
                        value={formulario.endereco}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                      <input
                        type="text"
                        name="numero"
                        value={formulario.numero}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                      <input
                        type="text"
                        name="complemento"
                        value={formulario.complemento}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                      <input
                        type="text"
                        name="bairro"
                        value={formulario.bairro}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                      <input
                        type="text"
                        name="cidade"
                        value={formulario.cidade}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <input
                        type="text"
                        name="estado"
                        value={formulario.estado}
                        onChange={handleInputChange}
                        maxLength={2}
                        placeholder="UF"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Informações Comerciais */}
                <div className="border-t pt-4 mb-6">
                  <h3 className="text-md font-semibold text-gray-700 mb-3">Informações Comerciais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prazo de Entrega (dias)
                      </label>
                      <input
                        type="number"
                        name="prazoEntregaDias"
                        value={formulario.prazoEntregaDias}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Condições de Pagamento
                      </label>
                      <input
                        type="text"
                        name="condicoesPagamento"
                        value={formulario.condicoesPagamento}
                        onChange={handleInputChange}
                        placeholder="Ex: 30 dias"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações
                      </label>
                      <textarea
                        name="observacoes"
                        value={formulario.observacoes}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      limparFormulario();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {modoEdicao ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Fornecedores */}
          {carregando ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando fornecedores...</p>
            </div>
          ) : fornecedores.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum fornecedor cadastrado</h3>
              <p className="text-gray-500 mb-6">Comece cadastrando seu primeiro fornecedor</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fornecedores.filter(f => f.ativo).map((fornecedor) => (
                <div 
                  key={fornecedor.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg mb-1">
                        {fornecedor.nomeFantasia || fornecedor.nome}
                      </h3>
                      {fornecedor.nomeFantasia && (
                        <p className="text-sm text-gray-500">{fornecedor.nome}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditar(fornecedor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExcluir(fornecedor.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {fornecedor.cnpj && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{formatarCNPJ(fornecedor.cnpj)}</span>
                      </div>
                    )}
                    {fornecedor.cpf && !fornecedor.cnpj && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{formatarCPF(fornecedor.cpf)}</span>
                      </div>
                    )}
                    {fornecedor.celular && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{fornecedor.celular}</span>
                      </div>
                    )}
                    {fornecedor.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{fornecedor.email}</span>
                      </div>
                    )}
                    {fornecedor.cidade && fornecedor.estado && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{fornecedor.cidade}/{fornecedor.estado}</span>
                      </div>
                    )}
                    {fornecedor.prazoEntregaDias > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{fornecedor.prazoEntregaDias} dias de entrega</span>
                      </div>
                    )}
                  </div>

                  {/* Avaliações */}
                  {(fornecedor.avaliacaoQualidade > 0 || fornecedor.avaliacaoPontualidade > 0) && (
                    <div className="border-t pt-3 space-y-2">
                      {fornecedor.avaliacaoQualidade > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Qualidade</p>
                          <div className="flex gap-1">
                            {renderEstrelas(fornecedor.avaliacaoQualidade)}
                          </div>
                        </div>
                      )}
                      {fornecedor.avaliacaoPontualidade > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Pontualidade</p>
                          <div className="flex gap-1">
                            {renderEstrelas(fornecedor.avaliacaoPontualidade)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modais */}
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

export default Fornecedores;
