// Tooltip simples para ações
function Tooltip({ label, children }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap shadow-lg">
          {label}
        </span>
      )}
    </span>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AssinaturasAdmin() {
  const [assinaturas, setAssinaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const [metricas, setMetricas] = useState({
    lojasAtivas: 0,
    assinaturasPendentes: 0,
    receitaMensal: 0,
    cancelamentos: 0,
  });

  useEffect(() => {
    async function fetchMetricas() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/subscriptions/metrics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMetricas(data);
        }
      } catch (err) {
        // Silenciar erro de métricas
      }
    }
    fetchMetricas();
  }, []);

  useEffect(() => {
    const tenantId = localStorage.getItem('currentTenantId');
    async function fetchAssinaturas() {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!tenantId) {
          // Visão super-admin: buscar todas as lojas e status de assinatura/trial
          const response = await fetch('http://localhost:3001/api/tenants/assinaturas', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) throw new Error('Erro ao buscar lojas e assinaturas');
          const data = await response.json();
          setAssinaturas(data.data);
          setTotal(data.data.length);
        } else {
          // Visão tenant: buscar assinaturas da loja selecionada
          const params = new URLSearchParams({
            search,
            status,
            order,
            page,
            pageSize
          });
          const response = await fetch(`http://localhost:3001/api/subscriptions?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'x-tenant-id': tenantId
            }
          });
          if (!response.ok) throw new Error('Erro ao buscar assinaturas');
          const data = await response.json();
          setAssinaturas(data.data);
          setTotal(data.total);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAssinaturas();
  }, [search, status, order, page, pageSize]);



  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gerenciar Assinaturas das Lojas</h2>
        <p className="text-gray-500 dark:text-gray-400">Visualize, edite e gerencie o status de assinatura de todos os parceiros.</p>
      </div>
      <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg shadow-sm flex items-center gap-4">
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40">
          <span className="material-icons-outlined text-blue-600 dark:text-blue-300 text-2xl">info</span>
        </span>
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Atenção</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">Selecione uma loja específica abaixo para ver o histórico completo de faturamento.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <CardMetrica titulo="Lojas Ativas" valor={metricas.lojasAtivas || 0} cor="green" variacao="Ativas" />
        <CardMetrica titulo="Em Teste" valor={metricas.assinaturasPendentes || 0} cor="yellow" variacao="Teste" />
        <CardMetrica titulo="Receita Mensal" valor={`R$ ${(metricas.receitaMensal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} cor="blue" variacao="Receita" />
        <CardMetrica titulo="Cancelamentos" valor={metricas.cancelamentos || 0} cor="red" variacao="Cancelamentos" />
      </div>
      <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-t-lg border-x border-t border-border-light dark:border-border-dark flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <span className="material-icons-outlined">search</span>
          </span>
          <input className="pl-10 w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5" placeholder="Buscar por nome da loja, ID ou e-mail..." type="text" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="pendente">Pendente</option>
            <option value="cancelado">Cancelado</option>
            <option value="atrasado">Atrasado</option>
          </select>
          <select className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5" value={order} onChange={e => setOrder(e.target.value)}>
            <option value="">Ordenar por Data</option>
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
          </select>
          <div className="flex gap-2 flex-wrap">
            <button className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-sm hover:shadow">
              <span className="material-icons-outlined text-lg">add</span>
              <span className="hidden sm:inline">Nova Assinatura</span>
            </button>
            <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-medium py-2.5 px-4 rounded-lg transition-all border border-gray-300 dark:border-gray-600 shadow-sm">
              <span className="material-icons-outlined text-lg">upload</span>
              <span className="hidden sm:inline">Importar</span>
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto bg-surface-light dark:bg-surface-dark border-x border-b border-border-light dark:border-border-dark rounded-b-lg shadow-sm mt-0">
        {loading && <p className="p-4">Carregando...</p>}
        {error && <p className="p-4 text-red-600">{error}</p>}
        {!loading && !error && (
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="p-4" scope="col">
                  <div className="flex items-center">
                    <input className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" id="checkbox-all" type="checkbox" />
                    <label className="sr-only" htmlFor="checkbox-all">checkbox</label>
                  </div>
                </th>
                <th className="px-6 py-3" scope="col">Loja</th>
                <th className="px-6 py-3" scope="col">Plano</th>
                <th className="px-6 py-3" scope="col">Status</th>
                <th className="px-6 py-3" scope="col">Próxima Cobrança</th>
                <th className="px-6 py-3" scope="col">Valor</th>
                <th className="px-6 py-3 text-right" scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {assinaturas.map((a, idx) => {
                const nomeLoja = a.nomeLoja || a.loja?.nome || a.tenantId || '-';
                const emailLoja = a.email || a.loja?.email || '-';
                let plano = '-';
                let status = 'Sem assinatura';
                let statusKey = 'cancelado';
                let proximaCobranca = '-';
                let valor = '-';
                let isOverdue = false;
                
                if (a.assinatura) {
                  plano = a.assinatura.plano || '-';
                  status = a.assinatura.status === 'trial' ? 'Trial' : (a.assinatura.status || 'Ativo');
                  statusKey = a.assinatura.status === 'trial' ? 'pendente' : (a.assinatura.status === 'ativo' || a.assinatura.status === 'active' ? 'ativo' : a.assinatura.status || 'ativo');
                  if (a.assinatura.dataFim) {
                    const dataFim = new Date(a.assinatura.dataFim);
                    proximaCobranca = dataFim.toLocaleDateString('pt-BR');
                    isOverdue = dataFim < new Date();
                    if (isOverdue) statusKey = 'atrasado';
                  }
                  valor = a.assinatura.valor ? `R$ ${Number(a.assinatura.valor).toFixed(2)}` : '-';
                } else if (a.diasRestantesTrial > 0) {
                  status = 'Trial';
                  statusKey = 'pendente';
                  proximaCobranca = `${a.diasRestantesTrial} dias de trial`;
                }
                return (
                  <tr key={a.id || a.tenantId || idx} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="w-4 p-4">
                      <div className="flex items-center">
                        <input className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" type="checkbox" />
                        <label className="sr-only">checkbox</label>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">{nomeLoja && nomeLoja !== '-' ? nomeLoja.slice(0,2).toUpperCase() : '--'}</div>
                        <div>
                          <div className="font-semibold">{nomeLoja}</div>
                          <div className="text-xs text-gray-500">{emailLoja}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">{plano}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={statusKey} />
                    </td>
                    <td className={`px-6 py-4 font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {proximaCobranca}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{valor}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Tooltip label="Detalhes">
                          <button
                            className="group rounded-full p-2 transition bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Ver detalhes"
                          >
                            {/* Heroicon: Eye */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary transition">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C3.75 7.5 7.5 4.5 12 4.5c4.5 0 8.25 3 9.75 7.5-1.5 4.5-5.25 7.5-9.75 7.5-4.5 0-8.25-3-9.75-7.5z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </Tooltip>
                        <Tooltip label="Editar">
                          <button
                            className="group rounded-full p-2 transition bg-transparent hover:bg-yellow-50 dark:hover:bg-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            aria-label="Editar assinatura"
                            onClick={() => navigate(`/admin/assinaturas/${a.id || a.tenantId}`)}
                          >
                            {/* Heroicon: Pencil Square */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-yellow-600 transition">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4.5 1.318 1.318-4.5 12.544-12.544z" />
                            </svg>
                          </button>
                        </Tooltip>
                        <Tooltip label="Bloquear">
                          <button
                            className="group rounded-full p-2 transition bg-transparent hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                            aria-label="Cancelar assinatura"
                          >
                            {/* Heroicon: No Symbol */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition">
                              <circle cx="12" cy="12" r="9" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 8l8 8" />
                            </svg>
                          </button>
                        </Tooltip>
                      </div>

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* Paginação real */}
      <nav aria-label="Table navigation" className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4">
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          Mostrando <span className="font-semibold text-gray-900 dark:text-white">{(page - 1) * pageSize + 1}</span> - <span className="font-semibold text-gray-900 dark:text-white">{Math.min(page * pageSize, total)}</span> de <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
        </span>
        <ul className="inline-flex items-stretch -space-x-px">
          <li>
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50">
              <span className="material-icons-outlined text-sm">chevron_left</span>
            </button>
          </li>
          {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => (
            <li key={i}>
              <button onClick={() => setPage(i + 1)} className={`flex items-center justify-center text-sm py-2 px-3 leading-tight ${page === i + 1 ? 'text-primary bg-blue-50 border border-primary dark:border-gray-700 dark:bg-gray-700 dark:text-white' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'}`}>
                {i + 1}
              </button>
            </li>
          ))}
          <li>
            <button disabled={page === Math.ceil(total / pageSize) || total === 0} onClick={() => setPage(page + 1)} className="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50">
              <span className="material-icons-outlined text-sm">chevron_right</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

// Card de Métrica
function CardMetrica({ titulo, valor, cor, variacao }) {
  const configs = {
    green: {
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      textColor: 'text-green-600 dark:text-green-400',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    yellow: {
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    blue: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      textColor: 'text-blue-600 dark:text-blue-400',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    red: {
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-600 dark:text-red-400',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      )
    }
  };
  
  const config = configs[cor] || configs.blue;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">{titulo}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{valor}</h3>
        </div>
        <div className={`p-3 rounded-lg ${config.iconBg} ${config.iconColor}`}>
          {config.icon}
        </div>
      </div>
      <div className={`flex items-center text-xs font-medium ${config.textColor}`}>
        <span>{variacao}</span>
      </div>
    </div>
  );
}

// Badge de status
function StatusBadge({ status }) {
  const map = {
    ativo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    atrasado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    cancelado: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300',
  };
  const label = {
    ativo: 'Ativo',
    pendente: 'Pendente',
    atrasado: 'Atrasado',
    cancelado: 'Cancelado',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded flex items-center w-fit gap-1 ${map[status] || ''}`}>
      <span className={`w-2 h-2 rounded-full ${map[status]?.split(' ')[0] || 'bg-gray-500'}`}></span>
      {label[status] || status}
    </span>
  );
}
