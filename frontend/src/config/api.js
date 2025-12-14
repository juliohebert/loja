/**
 * Configurações de API para o Frontend
 * Usa variável de ambiente VITE_API_URL se disponível
 * Fallback para localhost em desenvolvimento
 */

export const API_CONFIG = {
  // URL base da API
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  
  // Endpoints principais
  API: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:3001/api',
  
  // Timeout para requisições (ms)
  TIMEOUT: 30000,
  
  // Headers padrão
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

/**
 * Helper para construir URL completa de um endpoint
 * @param {string} endpoint - Endpoint sem /api (ex: 'products', 'sales')
 * @returns {string} URL completa
 */
export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.API}/${cleanEndpoint}`;
};

/**
 * Helper para obter headers de autenticação
 * @returns {object} Headers com token se disponível
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('currentTenantId');
  
  const headers = {
    ...API_CONFIG.HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(tenantId && { 'x-tenant-id': tenantId })
  };
  
  return headers;
};

export default API_CONFIG;
