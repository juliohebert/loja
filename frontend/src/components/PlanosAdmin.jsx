import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PlanosAdmin() {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlanos();
  }, [filter]);

  async function fetchPlanos() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      
      let url = 'http://localhost:3001/api/plans';
      if (filter !== 'all') {
        url += `?active=${filter === 'active' ? 'true' : 'false'}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao buscar planos');
      }
      
      const data = await response.json();
      setPlanos(data.data || []);
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function togglePlanStatus(id) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/plans/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Erro ao alterar status');
      fetchPlanos();
    } catch (err) {
      alert('Erro ao alterar status do plano');
    }
  }

  async function deletePlan(id) {
    if (!confirm('Tem certeza que deseja deletar este plano?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Erro ao deletar plano');
      fetchPlanos();
    } catch (err) {
      alert('Erro ao deletar plano');
    }
  }

  const filteredPlanos = planos.filter(p =>
    search === '' ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gerenciar Planos</h2>
        <p className="text-gray-500 dark:text-gray-400">Crie e gerencie os planos disponíveis para as lojas.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-t-lg border-x border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <span className="material-icons-outlined">search</span>
          </span>
          <input
            className="pl-10 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
            placeholder="Buscar plano..."
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <select
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">Todos os Planos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <button
            onClick={() => navigate('/admin/planos/novo')}
            className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-sm hover:shadow"
          >
            <span className="material-icons-outlined text-lg">add</span>
            <span>Novo Plano</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg shadow-sm">
        {loading && <p className="p-4">Carregando...</p>}
        {error && <p className="p-4 text-red-600">{error}</p>}
        {!loading && !error && filteredPlanos.length === 0 && (
          <p className="p-4 text-gray-500">Nenhum plano encontrado.</p>
        )}
        {!loading && !error && filteredPlanos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredPlanos.map(plano => (
              <div
                key={plano.id}
                className={`relative border rounded-lg p-6 transition-all hover:shadow-lg ${
                  plano.isRecommended
                    ? 'border-primary bg-blue-50 dark:bg-blue-900/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                {plano.isRecommended && (
                  <span className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                    Recomendado
                  </span>
                )}
                {!plano.isActive && (
                  <span className="absolute top-3 right-3 bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded">
                    Inativo
                  </span>
                )}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plano.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    R$ {Number(plano.price).toFixed(2)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">/{plano.duration}</span>
                </div>
                {plano.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{plano.description}</p>
                )}
                {plano.features && plano.features.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {plano.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="material-icons-outlined text-green-500 text-base">check_circle</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => navigate(`/admin/planos/${plano.id}`)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-3 rounded-lg text-sm font-medium transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => togglePlanStatus(plano.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      plano.isActive
                        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-300'
                        : 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300'
                    }`}
                  >
                    {plano.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => deletePlan(plano.id)}
                    className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 py-2 px-3 rounded-lg text-sm font-medium transition"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
