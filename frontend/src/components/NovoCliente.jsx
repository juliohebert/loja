import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';

const NovoCliente = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdicao = !!id;

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    debito: 0,
    limiteCredito: 0,
    observacoes: ''
  });

  const [erros, setErros] = useState({});
  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    tipo: 'info',
    titulo: '',
    mensagem: '',
    onClose: null
  });

  useEffect(() => {
    if (isEdicao) {
      carregarCliente();
    }
  }, [id]);

  const carregarCliente = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/customers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Cliente não encontrado');
      }

      const data = await response.json();
      setFormData({
        nome: data.data.nome || '',
        cpf: data.data.cpf || '',
        telefone: data.data.telefone || '',
        email: data.data.email || '',
        endereco: data.data.endereco || '',
        cidade: data.data.cidade || '',
        estado: data.data.estado || '',
        cep: data.data.cep || '',
        debito: data.data.debito || 0,
        limiteCredito: data.data.limiteCredito || 0,
        observacoes: data.data.observacoes || ''
      });
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      setModalInfo({
        isOpen: true,
        tipo: 'erro',
        titulo: 'Cliente Não Encontrado',
        mensagem: 'Não foi possível carregar os dados do cliente.',
        onClose: () => navigate('/clientes')
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (erros[name]) {
      setErros(prev => {
        const novosErros = { ...prev };
        delete novosErros[name];
        return novosErros;
      });
    }
  };

  const formatarCPF = (cpf) => {
    return cpf
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatarTelefone = (telefone) => {
    return telefone
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatarCEP = (cep) => {
    return cep
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const handleCPFChange = (e) => {
    const cpfFormatado = formatarCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: cpfFormatado }));
  };

  const handleTelefoneChange = (e) => {
    const telefoneFormatado = formatarTelefone(e.target.value);
    setFormData(prev => ({ ...prev, telefone: telefoneFormatado }));
  };

  const handleCEPChange = (e) => {
    const cepFormatado = formatarCEP(e.target.value);
    setFormData(prev => ({ ...prev, cep: cepFormatado }));
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }

    if (!formData.cpf.trim()) {
      novosErros.cpf = 'CPF é obrigatório';
    } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
      novosErros.cpf = 'CPF inválido';
    }

    if (!formData.telefone.trim()) {
      novosErros.telefone = 'Telefone é obrigatório';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = isEdicao 
        ? `http://localhost:3001/api/customers/${id}`
        : 'http://localhost:3001/api/customers';
      
      const method = isEdicao ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: formData.nome,
          cpf: formData.cpf.replace(/\D/g, ''),
          telefone: formData.telefone,
          email: formData.email || null,
          endereco: formData.endereco || null,
          cidade: formData.cidade || null,
          estado: formData.estado || null,
          cep: formData.cep || null,
          limiteCredito: parseFloat(formData.limiteCredito) || 0,
          observacoes: formData.observacoes || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar cliente');
      }

      setModalInfo({
        isOpen: true,
        tipo: 'sucesso',
        titulo: isEdicao ? 'Cliente Atualizado!' : 'Cliente Cadastrado!',
        mensagem: isEdicao 
          ? 'As informações do cliente foram atualizadas com sucesso.'
          : 'O novo cliente foi cadastrado com sucesso no sistema.',
        onClose: () => navigate('/clientes')
      });
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      setModalInfo({
        isOpen: true,
        tipo: 'erro',
        titulo: 'Erro ao Salvar',
        mensagem: error.message || 'Não foi possível salvar os dados do cliente. Tente novamente.',
        onClose: null
      });
    }
  };

  const handleCancelar = () => {
    navigate('/clientes');
  };

  return (
    <div className="flex min-h-screen bg-background-light">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between whitespace-nowrap border-b border-slate-200 px-6 h-16 bg-white">
          <h1 className="text-slate-900 text-3xl font-bold leading-tight">
            {isEdicao ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCancelar}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 border-2 border-slate-300 bg-transparent text-slate-900 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-100"
            >
              <span className="truncate">Cancelar</span>
            </button>
            <button 
              onClick={handleSalvar}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-700"
            >
              <span className="truncate">Salvar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-6">
                {/* Dados Pessoais */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Dados Pessoais</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col w-full md:col-span-2">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                        Nome Completo <span className="text-red-500">*</span>
                      </p>
                      <input 
                        name="nome"
                        value={formData.nome}
                        onChange={handleInputChange}
                        className={`form-input rounded-lg h-12 px-3 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary ${
                          erros.nome ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                        }`}
                        placeholder="Ex: João da Silva"
                      />
                      {erros.nome && (
                        <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
                      )}
                    </label>

                    <label className="flex flex-col w-full">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                        CPF <span className="text-red-500">*</span>
                      </p>
                      <input 
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleCPFChange}
                        maxLength="14"
                        className={`form-input rounded-lg h-12 px-3 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary ${
                          erros.cpf ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                        }`}
                        placeholder="000.000.000-00"
                      />
                      {erros.cpf && (
                        <p className="text-red-500 text-sm mt-1">{erros.cpf}</p>
                      )}
                    </label>

                    <label className="flex flex-col w-full">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                        Telefone <span className="text-red-500">*</span>
                      </p>
                      <input 
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleTelefoneChange}
                        maxLength="15"
                        className={`form-input rounded-lg h-12 px-3 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary ${
                          erros.telefone ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                        }`}
                        placeholder="(00) 00000-0000"
                      />
                      {erros.telefone && (
                        <p className="text-red-500 text-sm mt-1">{erros.telefone}</p>
                      )}
                    </label>

                    <label className="flex flex-col w-full md:col-span-2">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">E-mail</p>
                      <input 
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-input rounded-lg h-12 px-3 border-2 border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="exemplo@email.com"
                      />
                    </label>
                  </div>
                </div>

                {/* Gerenciamento de Crédito */}
                <div className="pt-6 border-t border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Gerenciamento de Crédito</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col w-full">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">Limite de Crédito</p>
                      <input 
                        name="limiteCredito"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.limiteCredito}
                        onChange={handleInputChange}
                        className="form-input rounded-lg h-12 px-3 border-2 border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="0,00"
                      />
                      <p className="text-slate-500 text-xs mt-1">Define quanto o cliente pode comprar a prazo</p>
                    </label>

                    <label className="flex flex-col w-full">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">Crédito Disponível</p>
                      <input 
                        type="text"
                        value={`R$ ${((formData.limiteCredito || 0) - (formData.debito || 0)).toFixed(2)}`}
                        disabled
                        className="form-input rounded-lg h-12 px-3 border-2 border-slate-300 bg-slate-100 text-slate-700 cursor-not-allowed"
                      />
                      <p className="text-slate-500 text-xs mt-1">Limite de crédito - Débito atual</p>
                    </label>
                  </div>
                </div>

                {/* Endereço */}
                <div className="pt-6 border-t border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Endereço</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex flex-col w-full md:col-span-3">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">Rua/Avenida</p>
                      <input 
                        name="endereco"
                        value={formData.endereco}
                        onChange={handleInputChange}
                        className="form-input rounded-lg h-12 px-3 border-2 border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Ex: Rua das Flores, 123"
                      />
                    </label>

                    <label className="flex flex-col w-full">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">Cidade</p>
                      <input 
                        name="cidade"
                        value={formData.cidade}
                        onChange={handleInputChange}
                        className="form-input rounded-lg h-12 px-3 border-2 border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Ex: São Paulo"
                      />
                    </label>

                    <label className="flex flex-col w-full">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">Estado</p>
                      <input 
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                        maxLength="2"
                        className="form-input rounded-lg h-12 px-3 border-2 border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="SP"
                      />
                    </label>

                    <label className="flex flex-col w-full">
                      <p className="text-slate-800 text-sm font-medium leading-normal pb-2">CEP</p>
                      <input 
                        name="cep"
                        value={formData.cep}
                        onChange={handleCEPChange}
                        maxLength="9"
                        className="form-input rounded-lg h-12 px-3 border-2 border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="00000-000"
                      />
                    </label>
                  </div>
                </div>

                {/* Observações */}
                <div className="pt-6 border-t border-slate-200">
                  <label className="flex flex-col w-full">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">Observações</p>
                    <textarea 
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleInputChange}
                      className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 bg-white focus:border-primary min-h-24 placeholder:text-slate-400 p-3 text-sm font-normal leading-normal" 
                      placeholder="Informações adicionais sobre o cliente"
                    ></textarea>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

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
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              <p className="text-slate-700 text-base leading-relaxed text-center mb-6">
                {modalInfo.mensagem}
              </p>

              {/* Botão de Ação */}
              <button
                onClick={() => {
                  setModalInfo({ ...modalInfo, isOpen: false });
                  if (modalInfo.onClose) modalInfo.onClose();
                }}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl ${
                  modalInfo.tipo === 'sucesso' ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white' :
                  modalInfo.tipo === 'erro' ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white' :
                  modalInfo.tipo === 'aviso' ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white' :
                  'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovoCliente;
