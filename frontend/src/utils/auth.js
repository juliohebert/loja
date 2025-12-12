/**
 * Decodifica o token JWT e retorna o payload
 */
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
};

/**
 * Obtém o tenantId do token armazenado no localStorage
 */
export const getTenantId = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  const decoded = decodeToken(token);
  return decoded?.tenantId || null;
};

/**
 * Cria headers padrão para requisições autenticadas
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const tenantId = getTenantId();
  
  console.log('🔐 getAuthHeaders chamado:', {
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : null,
    tenantId: tenantId,
    decodedToken: token ? decodeToken(token) : null
  });
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }
  
  console.log('📤 Headers gerados:', headers);
  
  return headers;
};
