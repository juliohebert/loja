import React, { useEffect, useState } from 'react';
import API_URL from '../config/apiUrl';

export default function PlanosDisponiveis() {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planoAtual, setPlanoAtual] = useState(null);

  useEffect(() => {
    fetchPlanos();
    fetchPlanoAtual();
  }, []);

  async function fetchPlanos() {
    try {
      const response = await fetch(API_URL + '/api/plans/available');
      if (!response.ok) throw new Error('Erro ao buscar planos');
      const data = await response.json();
      setPlanos(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlanoAtual() {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('currentTenantId');
      
      const response = await fetch(`${API_URL}/api/subscriptions?tenantId=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          setPlanoAtual(data.data[0]?.plano);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar plano atual:', err);
    }
  }

  async function contratarPlano(planoId, planoNome) {
    if (!confirm(`Deseja contratar o plano ${planoNome}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('currentTenantId');
      
      const response = await fetch(API_URL + '/api/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          tenantId,
          plano: planoNome,
          status: 'ativo'
        })
      });

      if (!response.ok) throw new Error('Erro ao contratar plano');
      
      alert('Plano contratado com sucesso!');
      fetchPlanoAtual();
    } catch (err) {
      alert(err.message || 'Erro ao contratar plano');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Carregando planos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
        <p className="text-red-800 dark:text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Planos Disponíveis</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha o plano ideal para sua loja e aproveite todos os recursos.
        </p>
        {planoAtual && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-center gap-3">
            <span className="material-icons-outlined text-blue-600 dark:text-blue-400">check_circle</span>
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Plano Atual</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Você está no plano: <strong>{planoAtual}</strong></p>
            </div>
          </div>
        )}
      </div>

      {planos.length === 0 && (
        <div className="text-center py-12">
          <span className="material-icons-outlined text-6xl text-gray-400 mb-4">inbox</span>
          <p className="text-gray-600 dark:text-gray-400">Nenhum plano disponível no momento.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planos.map(plano => {
          const isPlanoAtual = planoAtual === plano.name;
          
          return (
            <div
              key={plano.id}
              className={`relative rounded-lg p-6 transition-all hover:shadow-xl ${
                plano.isRecommended
                  ? 'border-2 border-primary bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 shadow-lg'
                  : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {plano.isRecommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    ⭐ Recomendado
                  </span>
                </div>
              )}

              {isPlanoAtual && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-bold px-3 py-1 rounded-full">
                    Plano Atual
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plano.name}
                </h4>
                {plano.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plano.description}
                  </p>
                )}
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    R$ {Number(plano.price).toFixed(2)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    /{plano.duration}
                  </span>
                </div>
                {plano.trialDays > 0 && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                    🎁 {plano.trialDays} dias grátis de teste
                  </p>
                )}
              </div>

              {plano.features && plano.features.length > 0 && (
                <ul className="space-y-3 mb-6">
                  {plano.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="material-icons-outlined text-green-500 text-lg mt-0.5 flex-shrink-0">
                        check_circle
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                {plano.maxProducts && (
                  <p className="flex items-center gap-2">
                    <span className="material-icons-outlined text-base">inventory_2</span>
                    <span>Até {plano.maxProducts} produtos</span>
                  </p>
                )}
                {plano.maxUsers && (
                  <p className="flex items-center gap-2">
                    <span className="material-icons-outlined text-base">people</span>
                    <span>Até {plano.maxUsers} usuários</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => contratarPlano(plano.id, plano.name)}
                disabled={isPlanoAtual}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  isPlanoAtual
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                    : plano.isRecommended
                    ? 'bg-primary hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900'
                }`}
              >
                {isPlanoAtual ? 'Plano Contratado' : 'Contratar Plano'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
