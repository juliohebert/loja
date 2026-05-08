import { useState, useEffect } from 'react';
import { FaPalette, FaCheck } from 'react-icons/fa';
import { listarTemas, obterTema, TEMA_PADRAO } from '../config/temas';
import { aplicarTemaNoDOM } from '../hooks/useTemaSistema';
import { getAuthHeaders } from '../utils/auth';
import API_URL from '../config/apiUrl';

export default function SeletorTema({ onMessage }) {
  const [temaSelecionado, setTemaSelecionado] = useState(TEMA_PADRAO);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const temas = listarTemas();

  useEffect(() => {
    carregarTemaSalvo();
  }, []);

  async function carregarTemaSalvo() {
    try {
      const res = await fetch(`${API_URL}/api/configurations/tema_selecionado`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.valor) setTemaSelecionado(data.data.valor);
      }
    } catch { /* usa padrão */ }
    finally { setCarregando(false); }
  }

  async function handleSelecionar(temaId) {
    if (temaId === temaSelecionado || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/configurations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          chave: 'tema_selecionado',
          valor: temaId,
          tipo: 'texto',
          descricao: 'Tema visual selecionado'
        })
      });

      if (res.ok) {
        setTemaSelecionado(temaId);
        aplicarTemaNoDOM(temaId);
        const tema = obterTema(temaId);
        onMessage?.(`Tema "${tema.nome}" aplicado com sucesso!`, 'sucesso');
      } else {
        onMessage?.('Erro ao salvar tema', 'erro');
      }
    } catch {
      onMessage?.('Erro ao aplicar tema', 'erro');
    } finally {
      setLoading(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FaPalette className="text-2xl text-blue-500" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tema Visual</h2>
          <p className="text-sm text-gray-500">Escolha o visual da sua loja. A mudança é aplicada imediatamente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {temas.map((tema) => {
          const ativo = temaSelecionado === tema.id;
          return (
            <button
              key={tema.id}
              onClick={() => handleSelecionar(tema.id)}
              disabled={loading}
              className={`
                relative text-left p-5 rounded-xl border-2 transition-all duration-200
                ${ativo
                  ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }
                ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Badge ativo */}
              {ativo && (
                <span className="absolute top-3 right-3 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center">
                  <FaCheck className="text-xs" />
                </span>
              )}

              {/* Preview de cores */}
              <div className="flex gap-2 mb-4 h-14">
                <div
                  className="w-14 h-14 rounded-lg shadow-inner flex-shrink-0 border border-black/10"
                  style={{ backgroundColor: tema.preview.fundo }}
                />
                <div className="flex-1 flex flex-col gap-1">
                  <div
                    className="flex-1 rounded border border-black/10"
                    style={{ backgroundColor: tema.preview.secundaria }}
                  />
                  <div
                    className="flex-1 rounded border border-black/10"
                    style={{ backgroundColor: tema.preview.primaria }}
                  />
                </div>
              </div>

              <p className="font-bold text-gray-900">{tema.nome}</p>
              <p className="text-sm text-gray-500 mt-0.5">{tema.descricao}</p>

              {ativo && (
                <p className="mt-2 text-xs font-semibold text-blue-600">✓ Tema ativo</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>Dica:</strong> O tema é exclusivo da sua loja e fica salvo automaticamente.
      </div>
    </div>
  );
}
