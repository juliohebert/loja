import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';

const NovoLancamento = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdicao = !!id;

  const [formData, setFormData] = useState({
    tipo: 'receita',
    descricao: '',
    valor: '',
    categoria: '',
    data: new Date().toISOString().split('T')[0],
    status: 'pago',
    observacoes: ''
  });

  const [erros, setErros] = useState({});

  useEffect(() => {
    if (isEdicao) {
      carregarLancamento();
    }
  }, [id]);

  const carregarLancamento = () => {
    const lancamentosSalvos = localStorage.getItem('lancamentos');
    if (lancamentosSalvos) {
      const lancamentos = JSON.parse(lancamentosSalvos);
      const lancamento = lancamentos.find(l => l.id === parseInt(id));
      if (lancamento) {
        setFormData(lancamento);
      } else {
        alert('Lançamento não encontrado');
        navigate('/financeiro');
      }
    }
  };

  const categorias = {
    receita: ['Vendas', 'Serviços', 'Outras Receitas'],
    despesa: ['Fixas', 'Estoque', 'Salários', 'Impostos', 'Marketing', 'Outras Despesas']
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo
    if (erros[name]) {
      setErros(prev => {
        const novosErros = { ...prev };
        delete novosErros[name];
        return novosErros;
      });
    }
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.descricao.trim()) {
      novosErros.descricao = 'Descrição é obrigatória';
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      novosErros.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.categoria) {
      novosErros.categoria = 'Categoria é obrigatória';
    }

    if (!formData.data) {
      novosErros.data = 'Data é obrigatória';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = () => {
    if (!validarFormulario()) {
      return;
    }
    let lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    if (isEdicao) {
      // Atualizar lançamento existente
      lancamentos = lancamentos.map(l => 
        l.id === parseInt(id) ? { ...formData, id: parseInt(id) } : l
      );
      alert('Lançamento atualizado com sucesso!');
    } else {
      // Criar novo lançamento
      const novoLancamento = {
        ...formData,
        id: Date.now(),
        valor: parseFloat(formData.valor)
      };
      lancamentos.push(novoLancamento);
      alert('Lançamento cadastrado com sucesso!');
    }
    localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
    navigate('/financeiro');
  };

  const handleCancelar = () => {
    navigate('/financeiro');
  };

  return (
    <div className="flex min-h-screen bg-background-light">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between whitespace-nowrap border-b border-slate-200 px-6 h-16 bg-white">
          <h1 className="text-slate-900 text-3xl font-bold leading-tight">
            {isEdicao ? 'Editar Lançamento' : 'Novo Lançamento'}
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
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-6">
                {/* Tipo */}
                <div>
                  <label className="flex flex-col w-full">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                      Tipo <span className="text-red-500">*</span>
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tipo: 'receita', categoria: '' }))}
                        className={`flex items-center justify-center gap-2 rounded-lg py-3 border-2 ${
                          formData.tipo === 'receita'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-slate-300 hover:border-green-500'
                        }`}
                      >
                        <span className="text-sm font-bold">Receita</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, tipo: 'despesa', categoria: '' }))}
                        className={`flex items-center justify-center gap-2 rounded-lg py-3 border-2 ${
                          formData.tipo === 'despesa'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-slate-300 hover:border-red-500'
                        }`}
                      >
                        <span className="text-sm font-bold">Despesa</span>
                      </button>
                    </div>
                  </label>
                </div>

                {/* Descrição */}
                <label className="flex flex-col w-full gap-1">
                  <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                    Descrição <span className="text-red-500">*</span>
                  </p>
                  <input 
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    className={`form-input rounded-lg h-14 px-4 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary text-base ${
                      erros.descricao ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                    }`}
                    placeholder="Ex: Venda #001, Aluguel, etc."
                  />
                  {erros.descricao && (
                    <p className="text-red-500 text-sm mt-1">{erros.descricao}</p>
                  )}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Valor */}
                  <label className="flex flex-col w-full gap-1">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                      Valor <span className="text-red-500">*</span>
                    </p>
                    <input 
                      name="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={handleInputChange}
                      className={`form-input rounded-lg h-14 px-4 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary text-base ${
                        erros.valor ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                      }`}
                      placeholder="0,00"
                    />
                    {erros.valor && (
                      <p className="text-red-500 text-sm mt-1">{erros.valor}</p>
                    )}
                  </label>

                  {/* Categoria */}
                  <label className="flex flex-col w-full gap-1">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                      Categoria <span className="text-red-500">*</span>
                    </p>
                    <select 
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      className={`form-select rounded-lg h-14 px-4 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary text-base ${
                        erros.categoria ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                      }`}
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias[formData.tipo].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {erros.categoria && (
                      <p className="text-red-500 text-sm mt-1">{erros.categoria}</p>
                    )}
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Data */}
                  <label className="flex flex-col w-full gap-1">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                      Data <span className="text-red-500">*</span>
                    </p>
                    <input 
                      name="data"
                      type="date"
                      value={formData.data}
                      onChange={handleInputChange}
                      className={`form-input rounded-lg h-14 px-4 border-2 bg-white text-slate-900 focus:ring-2 focus:ring-primary text-base ${
                        erros.data ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                      }`}
                    />
                    {erros.data && (
                      <p className="text-red-500 text-sm mt-1">{erros.data}</p>
                    )}
                  </label>

                  {/* Status */}
                  <label className="flex flex-col w-full gap-1">
                    <p className="text-slate-800 text-sm font-medium leading-normal pb-2">
                      Status <span className="text-red-500">*</span>
                    </p>
                    <select 
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="form-select rounded-lg h-14 px-4 border-2 border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary text-base"
                    >
                      <option value="pago">Pago</option>
                      <option value="pendente">Pendente</option>
                    </select>
                  </label>
                </div>

                {/* Observações */}
                <label className="flex flex-col w-full gap-1">
                  <p className="text-slate-800 text-sm font-medium leading-normal pb-2">Observações</p>
                  <textarea 
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 bg-white focus:border-primary min-h-24 placeholder:text-slate-400 p-4 text-base font-normal leading-normal" 
                    placeholder="Informações adicionais sobre o lançamento"
                  ></textarea>
                </label>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NovoLancamento;
