import { getAuthHeaders } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:3001/api';

/**
 * Função auxiliar para fazer requisições à API
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    console.error(`Erro na requisição para ${url}:`, error);
    throw error;
  }
};

/**
 * GET request
 */
export const apiGet = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'GET' });
};

/**
 * POST request
 */
export const apiPost = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  });
};

/**
 * PUT request
 */
export const apiPut = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

/**
 * DELETE request
 */
export const apiDelete = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
};

/**
 * PATCH request
 */
export const apiPatch = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data)
  });
};
