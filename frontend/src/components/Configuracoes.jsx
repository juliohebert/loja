import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCog, FaSave, FaUndo, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Sidebar from './Sidebar';
import Toast from './Toast';
import { getAuthHeaders } from '../utils/auth';
import PlanosDisponiveis from './PlanosDisponiveis';

export default function Configuracoes() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alteracoes, setAlteracoes] = useState({});
  const [toast, setToast] = useState({ isOpen: false, message: '', tipo: 'sucesso' });
  const [abaAtiva, setAbaAtiva] = useState('configuracoes');

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    carregarConfiguracoes();
  }, [navigate]);

  const carregarConfiguracoes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/configurations', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setConfigs(data.data);
      } else {
        setToast({ isOpen: true, message: 'Erro ao carregar configurações', tipo: 'erro' });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setToast({ isOpen: true, message: 'Erro ao carregar configurações', tipo: 'erro' });
    }
  };

  const handleChange = (chave, valor) => {
    setAlteracoes({
      ...alteracoes,
      [chave]: valor
    });
  };

  const getValorAtual = (config) => {
    if (alteracoes.hasOwnProperty(config.chave)) {
      return alteracoes[config.chave];
    }
    return config.valor;
  };

  const getValorConvertido = (config) => {
    const valor = getValorAtual(config);
    if (config.tipo === 'booleano') {
      return valor === 'true' || valor === true;
    }
    return valor;
  };

  const salvarConfiguracoes = async () => {
    if (Object.keys(alteracoes).length === 0) {
      setToast({ isOpen: true, message: 'Nenhuma alteração para salvar', tipo: 'aviso' });
      return;
    }

    setLoading(true);
    try {
      let erros = 0;
      let sucesso = 0;

      for (const [chave, valor] of Object.entries(alteracoes)) {
        const config = configs.find(c => c.chave === chave);
        const response = await fetch('http://localhost:3001/api/configurations', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            chave,
            valor: valor.toString(),
            tipo: config.tipo,
            descricao: config.descricao
          })
        });

        if (response.ok) {
          sucesso++;
        } else {
          erros++;
        }
      }

      if (erros === 0) {
        setToast({ isOpen: true, message: `${sucesso} configuração(ões) salva(s) com sucesso!`, tipo: 'sucesso' });
        setAlteracoes({});
        carregarConfiguracoes();
      } else {
        setToast({ isOpen: true, message: `${sucesso} salvas, ${erros} com erro`, tipo: 'aviso' });
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setToast({ isOpen: true, message: 'Erro ao salvar configurações', tipo: 'erro' });
    } finally {
      setLoading(false);
    }
  };

  const descartarAlteracoes = () => {
    setAlteracoes({});
    setToast({ isOpen: true, message: 'Alterações descartadas', tipo: 'sucesso' });
  };

  const getConfigIcone = (chave) => {
    switch(chave) {
      case 'exigir_caixa_aberto':
        return '🏪';
      case 'permitir_venda_estoque_zero':
        return '📦';
      case 'limite_desconto_pdv':
        return '💰';
      case 'logo_url':
        return '🖼️';
      case 'nome_loja':
        return '🏬';
      default:
        return '⚙️';
    }
  };

  const getConfigNome = (chave) => {
    const nomes = {
      'exigir_caixa_aberto': 'Exigir Caixa Aberto',
      'permitir_venda_estoque_zero': 'Venda com Estoque Zero',
      'limite_desconto_pdv': 'Limite de Desconto PDV',
      'logo_url': 'URL da Logo',
      'nome_loja': 'Nome da Loja'
    };
    return nomes[chave] || chave;
  };

  return (
    <div className="flex flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto">
        {/* Toast */}
        {toast.isOpen && (
          <Toast
            isOpen={toast.isOpen}
            mensagem={toast.message}
            tipo={toast.tipo}
            onClose={() => setToast({ ...toast, isOpen: false })}
          />
        )}

        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                    <FaCog className="text-3xl" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
                    <p className="text-blue-100 mt-1">Personalize e ajuste o comportamento da aplicação</p>
                  </div>
                </div>
              </div>

              {Object.keys(alteracoes).length > 0 && abaAtiva === 'configuracoes' && (
                <div className="flex gap-3">
                  <button
                    onClick={descartarAlteracoes}
                    className="px-6 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg hover:bg-white/20 flex items-center gap-2 font-semibold transition-all"
                    disabled={loading}
                  >
                    <FaUndo /> Descartar
                  </button>
                  <button
                    onClick={salvarConfiguracoes}
                    className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 font-semibold disabled:bg-gray-300 disabled:text-gray-500 transition-all shadow-lg"
                    disabled={loading}
                  >
                    <FaSave /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              )}
            </div>

            {/* Badge de alterações pendentes */}
            {Object.keys(alteracoes).length > 0 && abaAtiva === 'configuracoes' && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-semibold shadow-lg animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                {Object.keys(alteracoes).length} alteração(ões) pendente(s)
              </div>
            )}

            {/* Abas de navegação */}
            <div className="mt-6 flex gap-2 border-b border-white/20">
              <button
                onClick={() => setAbaAtiva('configuracoes')}
                className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                  abaAtiva === 'configuracoes'
                    ? 'bg-white text-blue-600'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-icons-outlined text-lg">settings</span>
                  Configurações
                </span>
              </button>
              <button
                onClick={() => setAbaAtiva('planos')}
                className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
                  abaAtiva === 'planos'
                    ? 'bg-white text-blue-600'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-icons-outlined text-lg">workspace_premium</span>
                  Planos
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {abaAtiva === 'configuracoes' && (
            <>
              {/* Informações */}
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 text-white rounded-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg mb-3">Informações sobre as Configurações</h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>As configurações são aplicadas <strong>imediatamente após salvar</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><strong>Exigir Caixa Aberto:</strong> Bloqueia vendas no PDV se não houver caixa aberto</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><strong>Venda com Estoque Zero:</strong> Permite vender produtos mesmo sem estoque disponível</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><strong>Limite de Desconto PDV:</strong> Percentual máximo de desconto permitido nas vendas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><strong>Logo da Loja:</strong> Faça upload ou cole a URL de uma imagem para personalizar o menu</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span><strong>Nome da Loja:</strong> Nome exibido ao lado da logo no menu lateral</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Configurações em Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {configs.map(config => (
              <div
                key={config.chave}
                className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  alteracoes.hasOwnProperty(config.chave) 
                    ? 'ring-2 ring-blue-500 ring-offset-2' 
                    : 'border border-gray-200'
                }`}
              >
                {/* Header do Card */}
                <div className={`p-6 ${
                  alteracoes.hasOwnProperty(config.chave)
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50'
                    : 'bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl bg-white p-3 rounded-lg shadow-sm">
                        {getConfigIcone(config.chave)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {getConfigNome(config.chave)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{config.descricao}</p>
                      </div>
                    </div>
                    {alteracoes.hasOwnProperty(config.chave) && (
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-semibold shadow-sm">
                        Modificado
                      </span>
                    )}
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-6">
                  {/* Input baseado no tipo */}
                  {config.tipo === 'booleano' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleChange(config.chave, 'true')}
                        className={`flex-1 px-6 py-4 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 transition-all ${
                          getValorConvertido(config) === true
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-500 text-white shadow-lg scale-105'
                            : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'
                        }`}
                      >
                        <FaCheckCircle className="text-xl" /> Ativado
                      </button>
                      <button
                        onClick={() => handleChange(config.chave, 'false')}
                        className={`flex-1 px-6 py-4 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 transition-all ${
                          getValorConvertido(config) === false
                            ? 'bg-gradient-to-r from-red-500 to-rose-500 border-red-500 text-white shadow-lg scale-105'
                            : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'
                        }`}
                      >
                        <FaTimesCircle className="text-xl" /> Desativado
                      </button>
                    </div>
                  )}

                  {config.tipo === 'numero' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Valor (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={getValorAtual(config)}
                          onChange={(e) => handleChange(config.chave, e.target.value)}
                          className="w-full px-5 py-4 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
                          %
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${Math.min(getValorAtual(config) || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">
                          {getValorAtual(config) || 0}%
                        </span>
                      </div>
                    </div>
                  )}

                  {config.tipo === 'texto' && (
                    <div>
                      {config.chave === 'logo_url' ? (
                        <div className="space-y-4">
                          {/* Preview da logo */}
                          {getValorAtual(config) && (
                            <div className="flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                              <img 
                                src={getValorAtual(config)} 
                                alt="Preview da logo"
                                className="max-h-24 max-w-full object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="text-gray-400 text-sm items-center gap-2 hidden">
                                <span className="text-2xl">⚠️</span>
                                <span>Erro ao carregar imagem</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Upload de arquivo */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Fazer upload de imagem
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    handleChange(config.chave, reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              📎 Formatos aceitos: JPG, PNG, GIF, SVG (máx. 2MB)
                            </p>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="px-2 bg-white text-gray-500 font-semibold">Ou</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Valor
                        </label>
                      )}
                      
                      <input
                        type="text"
                        value={getValorAtual(config)}
                        onChange={(e) => handleChange(config.chave, e.target.value)}
                        placeholder={config.chave === 'logo_url' ? 'https://exemplo.com/logo.png' : 'Digite o valor...'}
                        className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                      {config.chave === 'logo_url' && (
                        <p className="text-xs text-gray-500 mt-2">
                          🔗 Cole a URL de uma imagem hospedada
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {configs.length === 0 && (
              <div className="col-span-2 text-center py-20">
                <div className="bg-white rounded-2xl shadow-lg p-12 inline-block">
                  <FaCog className="mx-auto text-7xl mb-4 text-gray-300" />
                  <p className="text-xl font-semibold text-gray-600">Nenhuma configuração disponível</p>
                  <p className="text-sm text-gray-400 mt-2">As configurações aparecerão aqui quando disponíveis</p>
                </div>
              </div>
            )}
          </div>
            </>
          )}

          {abaAtiva === 'planos' && (
            <PlanosDisponiveis />
          )}
        </div>
      </main>
    </div>
  );
}
