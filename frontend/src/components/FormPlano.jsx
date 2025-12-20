import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API_URL from '../config/apiUrl';

export default function FormPlano() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: 'mensal',
    features: [],
    maxProducts: '',
    maxUsers: '',
    isActive: true,
    isRecommended: false,
    trialDays: 0
  });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchPlan();
    }
  }, [id]);

  async function fetchPlan() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/plans/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Erro ao buscar plano');
      const result = await response.json();
      const plan = result.data;
      
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price || '',
        duration: plan.duration || 'mensal',
        features: plan.features || [],
        maxProducts: plan.maxProducts || '',
        maxUsers: plan.maxUsers || '',
        isActive: plan.isActive !== undefined ? plan.isActive : true,
        isRecommended: plan.isRecommended || false,
        trialDays: plan.trialDays || 0
      });
    } catch (err) {
      alert('Erro ao carregar plano');
      navigate('/admin/planos');
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function addFeature() {
    if (featureInput.trim() === '') return;
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, featureInput.trim()]
    }));
    setFeatureInput('');
  }

  function removeFeature(index) {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = isEdit
        ? `${API_URL}/api/plans/${id}`
        : API_URL + '/api/plans';
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          maxProducts: formData.maxProducts ? parseInt(formData.maxProducts) : null,
          maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : null,
          trialDays: parseInt(formData.trialDays)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar plano');
      }

      alert(`Plano ${isEdit ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/admin/planos');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/planos')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <span className="material-icons-outlined">arrow_back</span>
          <span>Voltar</span>
        </button>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isEdit ? 'Editar Plano' : 'Novo Plano'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {isEdit ? 'Atualize as informações do plano' : 'Preencha as informações para criar um novo plano'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Plano *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
              placeholder="Ex: Plano Básico"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preço (R$) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
              placeholder="99.90"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descrição
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
            placeholder="Descrição do plano..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duração *
            </label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
            >
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Máx. Produtos
            </label>
            <input
              type="number"
              name="maxProducts"
              value={formData.maxProducts}
              onChange={handleChange}
              min="0"
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
              placeholder="Ilimitado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Máx. Usuários
            </label>
            <input
              type="number"
              name="maxUsers"
              value={formData.maxUsers}
              onChange={handleChange}
              min="0"
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
              placeholder="Ilimitado"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dias de Trial Gratuito
          </label>
          <input
            type="number"
            name="trialDays"
            value={formData.trialDays}
            onChange={handleChange}
            min="0"
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recursos/Benefícios
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
              placeholder="Digite um recurso e pressione Enter"
            />
            <button
              type="button"
              onClick={addFeature}
              className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              Adicionar
            </button>
          </div>
          {formData.features.length > 0 && (
            <ul className="space-y-2">
              {formData.features.map((feature, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <span className="material-icons-outlined text-lg">delete</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Plano Ativo</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isRecommended"
              checked={formData.isRecommended}
              onChange={handleChange}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Plano Recomendado</span>
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Salvando...' : (isEdit ? 'Atualizar Plano' : 'Criar Plano')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/planos')}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
