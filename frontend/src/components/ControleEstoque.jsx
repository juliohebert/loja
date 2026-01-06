import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getAuthHeaders } from '../utils/auth';
import { Package, TrendingDown, TrendingUp, Search, MoreHorizontal, ChevronLeft, ChevronRight, ShoppingBag, Edit, Trash2 } from 'lucide-react';
import ModalConfirmacao from './ModalConfirmacao';
import Toast from './Toast';
import ModalErro from './ModalErro';
import API_URL from '../config/apiUrl';

console.log('🌟🌟🌟 ARQUIVO ControleEstoque.jsx FOI CARREGADO! 🌟🌟🌟');
console.log('🌟 Timestamp do carregamento:', new Date().toISOString());

const ControleEstoque = () => {
  console.log('⚡ COMPONENTE ControleEstoque FOI INSTANCIADO!');
  const navigate = useNavigate();
  
  // Componente para imagem com fallback
  const ImagemProduto = ({ src, alt, nome }) => {
    const [erro, setErro] = useState(false);
    
    if (erro || !src) {
      return (
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-slate-400" />
        </div>
      );
    }
    
    return (
      <img
        className="w-10 h-10 rounded-lg object-cover"
        src={src}
        alt={alt || nome}
        onError={() => setErro(true)}
      />
    );
  };
  
  const [abaAtiva, setAbaAtiva] = useState('todos');
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const itensPorPagina = 10;

  // Estados dos modais
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, produtoId: null, nomeProduto: '' });
  const [toast, setToast] = useState({ isOpen: false, tipo: 'sucesso', mensagem: '' });
  const [modalErro, setModalErro] = useState({ isOpen: false, mensagem: '' });

  useEffect(() => {
    console.log('🔥 useEffect DO CONTROLE DE ESTOQUE EXECUTADO!');
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('🔥 Sem token, redirecionando...');
      navigate('/login');
      return;
    }
    console.log('🔥 Token encontrado, chamando buscarProdutos...');
    buscarProdutos();
  }, [navigate]);

  const buscarProdutos = async () => {
    console.log('🚨🚨🚨 BUSCAR PRODUTOS FOI CHAMADA! 🚨🚨🚨');
    console.log('🚨 Timestamp:', new Date().toISOString());
    try {
      setCarregando(true);
      setErro(null);
      
      const response = await fetch(API_URL + '/api/products', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar produtos');
      }

      const data = await response.json();
      
      console.log('📦 ===== CONTROLE DE ESTOQUE =====');
      console.log('📦 Produtos recebidos da API:', data.data?.length || 0);
      if (data.data && data.data.length > 0) {
        console.log('📦 Primeiro produto (completo):', JSON.stringify(data.data[0], null, 2));
      }
      
      // Transformar dados do backend para formato da tabela (uma linha por variação)
      const produtosFormatados = [];
      console.log('📦 Iniciando formatação de produtos...');
      
      data.data.forEach((produto, idx) => {
        const variacoes = produto.variacoes || produto.variations;
        
        console.log(`📦 Produto ${idx + 1}: ${produto.nome}`);
        console.log('   📦 Produto completo:', JSON.stringify(produto, null, 2));
        console.log(`   📦 Tem variacoes?`, !!variacoes, 'quantidade:', variacoes?.length);
        if (variacoes && variacoes.length > 0) {
          console.log('   📦 Primeira variação:', JSON.stringify(variacoes[0], null, 2));
        }
        
        // Se o produto não tem variações, criar uma entrada única
        if (!variacoes || !Array.isArray(variacoes) || variacoes.length === 0) {
          // Produtos sem variações não têm estoque na nossa estrutura atual
          // Este bloco é mantido para compatibilidade futura
          const quantidade = 0;
          const limiteMinimo = 10;
          
          console.log(`  ${produto.nome} (sem variações): qtd=${quantidade}, min=${limiteMinimo}`);
          
          // Determinar status
          let status = 'em-estoque';
          if (quantidade === 0) {
            status = 'esgotado';
          } else if (quantidade <= limiteMinimo) {
            status = 'estoque-baixo';
          }
          
          console.log(`  ✅ CALCULADO: qtd=${quantidade}, min=${limiteMinimo}, status=${status}`);
          
          produtosFormatados.push({
            id: produto.id,
            produtoId: produto.id,
            nome: produto.nome,
            sku: produto.sku || '-',
            cor: '-',
            tamanho: '-',
            quantidade: quantidade,
            limiteMinimo: limiteMinimo,
            status: status,
            imagem: produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : null,
            precoCusto: produto.precoCusto,
            precoVenda: produto.precoVenda,
            marca: produto.marca,
            categoria: produto.categoria
          });
        } else {
          // Processar cada variação do produto
          variacoes.forEach(variacao => {
            // LOG DETALHADO DA VARIAÇÃO
            console.log(`  📦 Variação RAW:`, variacao);
            console.log(`    - variacao.estoque?.quantidade:`, variacao.estoque?.quantidade);
            console.log(`    - variacao.estoque?.limiteMinimo:`, variacao.estoque?.limiteMinimo);
            
            // Determinar status baseado na quantidade em estoque
            let status = 'em-estoque';
            const quantidade = variacao.estoque?.quantidade || 0;
            const limiteMinimo = variacao.estoque?.limiteMinimo || 10;
            
            console.log(`  ✅ CALCULADO: qtd=${quantidade}, min=${limiteMinimo}, status=${quantidade === 0 ? 'esgotado' : quantidade <= limiteMinimo ? 'estoque-baixo' : 'em-estoque'}`);
            
            if (quantidade === 0) {
              status = 'esgotado';
            } else if (quantidade <= limiteMinimo) {
              status = 'estoque-baixo';
            }

            produtosFormatados.push({
              id: variacao.id,
              produtoId: produto.id,
              nome: produto.nome,
              sku: variacao.sku,
              cor: variacao.cor,
              tamanho: variacao.tamanho,
              quantidade: quantidade,
              limiteMinimo: limiteMinimo,
              status: status,
              imagem: produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : null,
              precoCusto: produto.precoCusto,
              precoVenda: produto.precoVenda,
              marca: produto.marca,
              categoria: produto.categoria
            });
          });
        }
      });

      console.log('📦 Total de produtos formatados:', produtosFormatados.length);
      console.log('📦 Produtos por status:', {
        esgotado: produtosFormatados.filter(p => p.status === 'esgotado').length,
        'estoque-baixo': produtosFormatados.filter(p => p.status === 'estoque-baixo').length,
        'em-estoque': produtosFormatados.filter(p => p.status === 'em-estoque').length
      });
      console.log('📦 Primeiros 3 produtos formatados:', produtosFormatados.slice(0, 3));

      setProdutos(produtosFormatados);
      console.log('📦 State atualizado com produtos!');
    } catch (error) {
      console.error('❌ ERRO ao buscar produtos:', error);
      console.error('❌ Stack trace:', error.stack);
      setErro('Erro ao buscar produtos: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleEditarProduto = (produtoId) => {
    console.log('Editar produto:', produtoId);
    navigate(`/products/editar/${produtoId}`);
  };

  const handleRemoverProduto = (produtoId, nomeProduto) => {
    setModalConfirmacao({ 
      isOpen: true, 
      produtoId, 
      nomeProduto 
    });
  };

  const confirmarRemocao = async () => {
    const { produtoId } = modalConfirmacao;
    setModalConfirmacao({ isOpen: false, produtoId: null, nomeProduto: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/products/${produtoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao remover produto');
      }

      setToast({ isOpen: true, tipo: 'sucesso', mensagem: 'Produto removido com sucesso!' });
      buscarProdutos();
    } catch (err) {
      console.error('Erro:', err);
      setModalErro({ isOpen: true, mensagem: err.message || 'Erro ao remover produto' });
    }
  };

  // Filtrar produtos
  console.log('🔍 ===== INÍCIO DO FILTRO =====');
  console.log('🔍 Aba ativa:', abaAtiva);
  console.log('🔍 Busca:', busca);
  console.log('🔍 Total de produtos no state:', produtos.length);
  console.log('🔍 Primeiros 3 produtos no state:', produtos.slice(0, 3));
  
  // MOSTRAR O PRIMEIRO PRODUTO COMPLETO EM JSON
  if (produtos.length > 0) {
    console.log('🔍 📦 PRIMEIRO PRODUTO COMPLETO (JSON):', JSON.stringify(produtos[0], null, 2));
  }
  
  const produtosFiltrados = produtos.filter(produto => {
    console.log(`  🔍 Testando produto: ${produto.nome}, status=${produto.status}, sku=${produto.sku}`);
    
    const matchBusca = produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       (produto.sku || '').toLowerCase().includes(busca.toLowerCase());
    
    console.log(`    - Match busca: ${matchBusca}`);
    
    if (!matchBusca) {
      console.log(`    - REJEITADO por busca`);
      return false;
    }

    let result = true;
    switch(abaAtiva) {
      case 'em-estoque':
        result = produto.status === 'em-estoque';
        break;
      case 'estoque-baixo':
        result = produto.status === 'estoque-baixo';
        break;
      case 'esgotado':
        result = produto.status === 'esgotado';
        break;
      default:
        result = true;
    }
    
    console.log(`    - Match aba (${abaAtiva}): ${result}`);
    return result;
  });

  console.log('🔍 RESULTADO - Produtos após filtro:', produtosFiltrados.length);
  console.log('🔍 RESULTADO - Produtos filtrados:', produtosFiltrados);

  // Paginação
  const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const produtosPaginados = produtosFiltrados.slice(indiceInicio, indiceFim);

  // Funções de status
  const getStatusBadge = (status) => {
    const badges = {
      'em-estoque': {
        class: 'bg-green-100 text-green-800',
        text: 'Em Estoque'
      },
      'estoque-baixo': {
        class: 'bg-yellow-100 text-yellow-800',
        text: 'Estoque Baixo'
      },
      'esgotado': {
        class: 'bg-red-100 text-red-800',
        text: 'Esgotado'
      }
    };
    
    const badge = badges[status] || badges['em-estoque'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const handleRegistrarEntrada = () => {
    // TODO: Implementar modal de registro de entrada
    alert('Funcionalidade de Registrar Entrada em desenvolvimento');
  };

  const handleRegistrarPerda = () => {
    // TODO: Implementar modal de registro de perda
    alert('Funcionalidade de Registrar Perda em desenvolvimento');
  };

  return (
    <div className="layout-with-sidebar">
      <Sidebar />

      <div className="main-content content-with-hamburger">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 sm:px-6 h-16 sm:h-20 bg-white mobile-header-spacing">
          <h1 className="text-slate-900 text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
            Controle de Estoque
          </h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRegistrarPerda}
              className="btn-touch flex items-center justify-center gap-2 cursor-pointer rounded-lg px-3 bg-slate-200 text-slate-900 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-300"
            >
              <TrendingDown className="w-5 h-5" />
              <span className="truncate hide-text-mobile">Registrar Perda</span>
            </button>
            <button 
              onClick={handleRegistrarEntrada}
              className="btn-touch flex items-center justify-center gap-2 cursor-pointer rounded-lg px-3 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-700"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="truncate hide-text-mobile">Registrar Entrada</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
          {/* Card do Estoque */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Abas */}
          <div className="border-b border-slate-200 px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setAbaAtiva('todos')}
                className={`flex items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                  abaAtiva === 'todos'
                    ? 'border-b-primary text-primary'
                    : 'border-b-transparent text-slate-500 hover:border-b-slate-300'
                }`}
              >
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">Todos</p>
              </button>
              <button
                onClick={() => setAbaAtiva('em-estoque')}
                className={`flex items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                  abaAtiva === 'em-estoque'
                    ? 'border-b-primary text-primary'
                    : 'border-b-transparent text-slate-500 hover:border-b-slate-300'
                }`}
              >
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">Em Estoque</p>
              </button>
              <button
                onClick={() => setAbaAtiva('estoque-baixo')}
                className={`flex items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                  abaAtiva === 'estoque-baixo'
                    ? 'border-b-primary text-primary'
                    : 'border-b-transparent text-slate-500 hover:border-b-slate-300'
                }`}
              >
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">Estoque Baixo</p>
              </button>
              <button
                onClick={() => setAbaAtiva('esgotado')}
                className={`flex items-center justify-center border-b-[3px] pb-[13px] pt-4 ${
                  abaAtiva === 'esgotado'
                    ? 'border-b-primary text-primary'
                    : 'border-b-transparent text-slate-500 hover:border-b-slate-300'
                }`}
              >
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">Esgotado</p>
              </button>
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 focus:outline-0 focus:ring-2 focus:ring-primary h-12 placeholder:text-slate-500 pl-12 text-base font-normal leading-normal bg-slate-100 border-transparent"
                placeholder="Buscar por nome ou SKU do produto"
              />
            </div>
          </div>

          {/* Tabela de Estoque */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-t border-slate-200">
                <tr>
                  <th className="px-6 py-3" scope="col">Produto</th>
                  <th className="px-6 py-3" scope="col">SKU</th>
                  <th className="px-6 py-3" scope="col">Cor</th>
                  <th className="px-6 py-3" scope="col">Tamanho</th>
                  <th className="px-6 py-3" scope="col">Quantidade</th>
                  <th className="px-6 py-3" scope="col">Status</th>
                  <th className="px-6 py-3" scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p>Carregando produtos...</p>
                      </div>
                    </td>
                  </tr>
                ) : erro ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-red-500">{erro}</p>
                        <button 
                          onClick={buscarProdutos}
                          className="text-primary hover:underline text-sm"
                        >
                          Tentar novamente
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : produtosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-12 h-12 text-slate-300" />
                        <p>Nenhum produto encontrado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  produtosPaginados.map((produto, index) => (
                    <tr 
                      key={produto.id} 
                      className={`bg-white ${index !== produtosPaginados.length - 1 ? 'border-b border-slate-200' : ''}`}
                    >
                      <th className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap" scope="row">
                        <div className="flex items-center gap-3">
                          <ImagemProduto 
                            src={produto.imagem}
                            alt={produto.nome}
                            nome={produto.nome}
                          />
                          {produto.nome}
                        </div>
                      </th>
                      <td className="px-6 py-4">{produto.sku}</td>
                      <td className="px-6 py-4">{produto.cor}</td>
                      <td className="px-6 py-4">{produto.tamanho}</td>
                      <td className="px-6 py-4 font-semibold">{produto.quantidade}</td>
                      <td className="px-6 py-4">{getStatusBadge(produto.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditarProduto(produto.produtoId)}
                            className="p-1.5 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoverProduto(produto.produtoId, produto.nome)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {produtosFiltrados.length > 0 && (
            <div className="flex justify-between items-center p-4 mt-auto border-t border-slate-200">
              <span className="text-sm text-slate-500">
                Exibindo {indiceInicio + 1}-{Math.min(indiceFim, produtosFiltrados.length)} de {produtosFiltrados.length} itens
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                  disabled={paginaAtual === 1}
                  className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-500" />
                </button>
                <span className="text-sm font-medium text-slate-700">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Modais */}
      <ModalConfirmacao
        isOpen={modalConfirmacao.isOpen}
        onClose={() => setModalConfirmacao({ isOpen: false, produtoId: null, nomeProduto: '' })}
        onConfirm={confirmarRemocao}
        tipo="danger"
        titulo="Remover Produto"
        mensagem={`Deseja realmente remover "${modalConfirmacao.nomeProduto}" do estoque? Esta ação não pode ser desfeita.`}
      />

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ isOpen: false, tipo: 'sucesso', mensagem: '' })}
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        duracao={3000}
      />

      <ModalErro
        isOpen={modalErro.isOpen}
        onClose={() => setModalErro({ isOpen: false, mensagem: '' })}
        titulo="Erro"
        mensagem={modalErro.mensagem}
      />
    </div>
  );
};

export default ControleEstoque;
