import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Users, Calendar, ArrowRight, LogOut } from 'lucide-react';

const SelecionarLoja = () => {
  const navigate = useNavigate();
  const [lojas, setLojas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Verificar se é super-admin
    if (user.funcao !== 'super-admin') {
      navigate('/dashboard');
      return;
    }

    carregarLojas();
  }, [navigate]);

  const carregarLojas = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/tenants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar lojas');
      }

      const data = await response.json();
      setLojas(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      setErro('Erro ao carregar lista de lojas');
    } finally {
      setCarregando(false);
    }
  };

  const acessarLoja = async (tenantId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/tenants/${tenantId}/access`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar token de acesso');
      }

      const data = await response.json();
      
      // Salvar novo token com acesso ao tenant
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentTenantId', tenantId);
      
      // Redirecionar para dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao acessar loja:', error);
      setErro('Erro ao acessar loja');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentTenantId');
    navigate('/login');
  };

  const formatarData = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando lojas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Store className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Painel Super Administrador</h1>
                <p className="text-sm text-gray-500">Selecione uma loja para gerenciar</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {erro && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {erro}
          </div>
        )}

        {/* Cards de Lojas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lojas.map((loja) => (
            <div
              key={loja.tenantId}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                {/* Ícone e Nome */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {loja.nomeLoja}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{loja.adminEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Informações */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{loja.totalUsuarios} usuário(s)</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Criado em {formatarData(loja.criadoEm)}</span>
                  </div>
                </div>

                {/* ID do Tenant */}
                <div className="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-500 font-mono truncate">
                  {loja.tenantId}
                </div>

                {/* Botão de Acesso */}
                <button
                  onClick={() => acessarLoja(loja.tenantId)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
                >
                  <span>Acessar Loja</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mensagem quando não há lojas */}
        {lojas.length === 0 && !carregando && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhuma loja cadastrada
            </h3>
            <p className="text-gray-500">
              Ainda não há lojas no sistema
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelecionarLoja;
