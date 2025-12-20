import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config/apiUrl';

const statusOptions = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'suspensa', label: 'Suspensa' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'trial', label: 'Trial' },
];

export default function DetalheAssinatura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assinatura, setAssinatura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [planos, setPlanos] = useState([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);

  // Verifica se o tenant está selecionado
  useEffect(() => {
    const tenantId = localStorage.getItem('currentTenantId');
    if (!tenantId) {
      navigate('/selecionar-loja');
      return;
    }
    // Só busca assinatura se o tenantId existir
    fetchAssinatura();
    fetchPlanos();
  }, [id, navigate]);

  async function fetchAssinatura() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('currentTenantId');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      if (tenantId) headers['x-tenant-id'] = tenantId;
      const response = await fetch(`http://localhost:3001/api/subscriptions/${id}`, {
        headers
      });
      if (!response.ok) throw new Error('Erro ao buscar assinatura');
      const data = await response.json();
      setAssinatura(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlanos() {
    setLoadingPlanos(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_URL + '/api/plans', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar planos');
      const data = await response.json();
      setPlanos(data.data || []);
    } catch (err) {
      // Silenciar erro de planos
    } finally {
      setLoadingPlanos(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: assinatura.status,
          pago: assinatura.pago,
          dataFim: assinatura.dataFim,
          plano: assinatura.plano,
          valor: assinatura.valor !== undefined && assinatura.valor !== null ? Number(assinatura.valor) : undefined,
          qtdUsuarios: assinatura.qtdUsuarios !== undefined && assinatura.qtdUsuarios !== null ? Number(assinatura.qtdUsuarios) : undefined
        })
      });
      if (!response.ok) throw new Error('Erro ao atualizar assinatura');
      navigate('/admin/assinaturas');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || loadingPlanos) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!assinatura) return null;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white dark:bg-surface-dark rounded-xl shadow border border-gray-200 dark:border-gray-700 mt-8">
      <h2 className="text-xl font-bold mb-4">Detalhes da Assinatura</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Loja</label>
          <div className="font-semibold">{assinatura.lojaId || assinatura.loja?.nome}</div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Plano</label>
          <select
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark/50 px-3 py-2"
            value={assinatura.plano || ''}
            onChange={e => setAssinatura(a => ({ ...a, plano: e.target.value }))}
          >
            <option value="">Selecione um plano</option>
            {planos.map(plano => (
              <option key={plano.id} value={plano.name}>{plano.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark/50 px-3 py-2"
            value={assinatura.status}
            onChange={e => setAssinatura(a => ({ ...a, status: e.target.value }))}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Valor</label>
          <input
            type="number"
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark/50 px-3 py-2"
            value={assinatura.valor !== undefined && assinatura.valor !== null ? assinatura.valor : ''}
            onChange={e => setAssinatura(a => ({ ...a, valor: e.target.value }))}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Qtd. Usuários do Plano</label>
          <input
            type="number"
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark/50 px-3 py-2"
            value={assinatura.qtdUsuarios || ''}
            onChange={e => setAssinatura(a => ({ ...a, qtdUsuarios: e.target.value }))}
            min="1"
            step="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pago</label>
          <input
            type="checkbox"
            checked={assinatura.pago}
            onChange={e => setAssinatura(a => ({ ...a, pago: e.target.checked }))}
            className="mr-2"
          />
          <span>{assinatura.pago ? 'Sim' : 'Não'}</span>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data de Início</label>
          <div>{new Date(assinatura.dataInicio).toLocaleDateString()}</div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data de Fim</label>
          <input
            type="date"
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-background-dark/50 px-3 py-2"
            value={assinatura.dataFim ? assinatura.dataFim.substring(0, 10) : ''}
            onChange={e => setAssinatura(a => ({ ...a, dataFim: e.target.value }))}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-hover disabled:opacity-60" disabled={saving}>
            Salvar
          </button>
          <button type="button" className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-2 rounded" onClick={() => navigate('/admin/assinaturas')}>
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}
