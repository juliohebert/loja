  // Função utilitária para formatar valores monetários no padrão brasileiro
  const formatarPreco = (valor) => {
    return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  };
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ModalSucesso from './ModalSucesso';
import ModalErro from './ModalErro';
import ModalSelecaoVariacao from './ModalSelecaoVariacao';

const Trocas = () => {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  
  // Estados da troca
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [produtoDevolver, setProdutoDevolver] = useState(null);
  const [produtoNovo, setProdutoNovo] = useState(null);
  const [motivoTroca, setMotivoTroca] = useState('');
  
  // Modais
  const [modalSucesso, setModalSucesso] = useState({ isOpen: false, mensagem: '' });
  const [modalErro, setModalErro] = useState({ isOpen: false, mensagem: '' });
  const [modalSelecaoVariacao, setModalSelecaoVariacao] = useState({
    isOpen: false,
    produto: null,
    tipo: null // 'devolver' ou 'novo'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    carregarDados();
  }, [navigate]);

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Carregar vendas do localStorage
      const vendasStorage = JSON.parse(localStorage.getItem('vendas') || '[]');
      setVendas(vendasStorage);

      // Carregar produtos da API
      const response = await fetch('http://localhost:3001/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProdutos(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const selecionarVenda = (venda) => {
    setVendaSelecionada(venda);
    setProdutoDevolver(null);
    setProdutoNovo(null);
  };

  const selecionarProdutoDevolver = (item) => {
    // Se o produto original tinha variações, não precisa abrir modal
    setProdutoDevolver(item);
  };

  const abrirSelecaoVariacao = (produto, tipo) => {
    setModalSelecaoVariacao({
      isOpen: true,
      produto: produto,
      tipo: tipo
    });
  };

  const handleVariacaoSelecionada = (variacao) => {
    if (modalSelecaoVariacao.tipo === 'novo') {
      setProdutoNovo({
        ...modalSelecaoVariacao.produto,
        variacao: variacao,
        quantidade: 1
      });
    }
    setModalSelecaoVariacao({ isOpen: false, produto: null, tipo: null });
  };

  const calcularDiferenca = () => {
    if (!produtoDevolver || !produtoNovo) return 0;
    
    const valorDevolver = parseFloat(produtoDevolver.preco || 0) * parseFloat(produtoDevolver.quantidade || 1);
    const valorNovo = parseFloat(produtoNovo.precoVenda || 0);
    
    return valorNovo - valorDevolver;
  };

  const processarTroca = async () => {
    if (!vendaSelecionada || !produtoDevolver || !produtoNovo) {
      setModalErro({
        isOpen: true,
        mensagem: 'Selecione uma venda, o produto a devolver e o novo produto'
      });
      return;
    }

    if (!motivoTroca.trim()) {
      setModalErro({
        isOpen: true,
        mensagem: 'Informe o motivo da troca'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const diferenca = calcularDiferenca();

      // 1. Atualizar estoque - devolver produto antigo
      const produtoAntigoCompleto = produtos.find(p => p.nome === produtoDevolver.produto);
      if (produtoAntigoCompleto && produtoAntigoCompleto.variacoes) {
        const variacaoAntiga = produtoAntigoCompleto.variacoes.find(v => 
          v.tamanho === produtoDevolver.tamanho && v.cor === produtoDevolver.cor
        );
        if (variacaoAntiga) {
          await fetch(`http://localhost:3001/api/products/stock/${variacaoAntiga.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              operation: 'add',
              quantity: produtoDevolver.quantidade
            })
          });
        }
      }

      // 2. Atualizar estoque - retirar produto novo
      if (produtoNovo.variacao) {
        await fetch(`http://localhost:3001/api/products/stock/${produtoNovo.variacao.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation: 'subtract',
            quantity: 1
          })
        });
      }

      // 3. Registrar troca
      const troca = {
        id: Date.now(),
        data: new Date().toISOString().split('T')[0],
        dataHora: new Date().toISOString(),
        vendaOriginal: vendaSelecionada.numeroVenda,
        produtoDevolvido: {
          nome: produtoDevolver.produto,
          tamanho: produtoDevolver.tamanho,
          cor: produtoDevolver.cor,
          quantidade: produtoDevolver.quantidade,
          valor: produtoDevolver.preco
        },
        produtoNovo: {
          nome: produtoNovo.nome,
          tamanho: produtoNovo.variacao.tamanho,
          cor: produtoNovo.variacao.cor,
          quantidade: 1,
          valor: produtoNovo.precoVenda
        },
        diferenca: diferenca,
        motivo: motivoTroca,
        vendedor: localStorage.getItem('userName') || 'Sistema'
      };

      // Salvar no localStorage
      const trocas = JSON.parse(localStorage.getItem('trocas') || '[]');
      trocas.push(troca);
      localStorage.setItem('trocas', JSON.stringify(trocas));

      // 4. Registrar lançamento financeiro se houver diferença
      if (diferenca !== 0) {
        const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
        const lancamento = {
          id: Date.now() + 1,
          data: new Date().toISOString().split('T')[0],
          dataHora: new Date().toISOString(),
          tipo: diferenca > 0 ? 'receita' : 'despesa',
          categoria: 'Troca de Produto',
          descricao: `Troca - Venda #${vendaSelecionada.numeroVenda.toString().padStart(4, '0')}`,
          valor: Math.abs(diferenca),
          formaPagamento: diferenca > 0 ? 'Dinheiro' : 'Devolução',
          observacoes: `${produtoDevolver.produto} → ${produtoNovo.nome}`
        };
        lancamentos.push(lancamento);
        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
      }

      setModalSucesso({
        isOpen: true,
        mensagem: diferenca > 0 
          ? `Troca realizada! Cliente deve pagar ${formatarPreco(diferenca)}`
          : diferenca < 0
          ? `Troca realizada! Devolva ${formatarPreco(Math.abs(diferenca))} ao cliente`
          : 'Troca realizada com sucesso!'
      });

      // Limpar formulário
      setTimeout(() => {
        setVendaSelecionada(null);
        setProdutoDevolver(null);
        setProdutoNovo(null);
        setMotivoTroca('');
        carregarDados();
      }, 2000);

    } catch (error) {
      console.error('Erro ao processar troca:', error);
      setModalErro({
        isOpen: true,
        mensagem: 'Erro ao processar troca. Tente novamente.'
      });
    }
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 px-6 h-16 bg-white">
          <h1 className="text-slate-900 text-3xl font-bold">Trocas</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            
            {/* Etapa 1: Selecionar Venda */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Selecione a Venda Original</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {vendas.length === 0 ? (
                  <p className="text-slate-500 text-sm col-span-full">Nenhuma venda registrada</p>
                ) : (
                  vendas.slice(-9).reverse().map(venda => (
                    <button
                      key={venda.id}
                      onClick={() => selecionarVenda(venda)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        vendaSelecionada?.id === venda.id
                          ? 'border-primary bg-blue-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-800 text-lg">
                            #{venda.numeroVenda?.toString().padStart(4, '0')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(venda.dataHora).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        {vendaSelecionada?.id === venda.id && (
                          <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </div>
                      <p className="font-semibold text-primary text-lg">
                        {formatarPreco(venda.total)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {venda.itens.length} {venda.itens.length === 1 ? 'item' : 'itens'}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Etapa 2 e 3: Produtos lado a lado */}
            {vendaSelecionada && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                
                {/* Produto a Devolver */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                      2
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800">Produto a Devolver</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {vendaSelecionada.itens.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => selecionarProdutoDevolver(item)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          produtoDevolver === item
                            ? 'border-red-500 bg-red-50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {item.imagem && (
                            <img 
                              src={item.imagem} 
                              alt={item.produto}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{item.produto}</p>
                            <div className="flex gap-3 text-sm text-slate-600 mt-1">
                              {item.tamanho && <span>Tam: {item.tamanho}</span>}
                              {item.cor && <span>• {item.cor}</span>}
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-slate-600">Qtd: {item.quantidade}</span>
                              <span className="font-semibold text-slate-800">
                                {formatarPreco(item.preco * item.quantidade)}
                              </span>
                            </div>
                          </div>
                          {produtoDevolver === item && (
                            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Novo Produto */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                      3
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800">Novo Produto</h2>
                  </div>
                  
                  {!produtoDevolver ? (
                    <div className="text-center py-12 text-slate-400">
                      <svg className="w-16 h-16 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                      </svg>
                      <p>Selecione o produto a devolver primeiro</p>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="🔍 Buscar produto..."
                        className="w-full mb-4 px-4 h-11 rounded-lg border-2 border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary"
                      />

                      {produtoNovo ? (
                        <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-green-800">✓ Produto Selecionado</p>
                            <button
                              onClick={() => setProdutoNovo(null)}
                              className="text-green-700 hover:text-green-900"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                              </svg>
                            </button>
                          </div>
                          <p className="font-semibold text-green-900">{produtoNovo.nome}</p>
                          <p className="text-sm text-green-700">
                            {produtoNovo.variacao.tamanho} / {produtoNovo.variacao.cor}
                          </p>
                          <p className="text-lg font-bold text-green-900 mt-2">
                            {formatarPreco(parseFloat(produtoNovo.precoVenda || 0))}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {produtosFiltrados.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">
                              Nenhum produto encontrado
                            </p>
                          ) : (
                            produtosFiltrados.map(produto => (
                              <button
                                key={produto.id}
                                onClick={() => abrirSelecaoVariacao(produto, 'novo')}
                                className="w-full text-left p-3 rounded-lg border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-slate-800">{produto.nome}</p>
                                    <p className="text-sm text-slate-600">{produto.marca}</p>
                                  </div>
                                  <p className="font-bold text-primary text-lg">
                                    {formatarPreco(parseFloat(produto.precoVenda || 0))}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Etapa 4: Confirmar Troca */}
            {produtoDevolver && produtoNovo && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">Confirmar Troca</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Motivo da Troca <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={motivoTroca}
                      onChange={(e) => setMotivoTroca(e.target.value)}
                      placeholder="Ex: Tamanho incorreto, defeito no produto, cliente não gostou..."
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                      rows="4"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                      <p className="text-sm font-medium text-slate-600 mb-2">Diferença de Valor</p>
                      <p className={`text-4xl font-bold ${
                        calcularDiferenca() > 0 ? 'text-green-600' : 
                        calcularDiferenca() < 0 ? 'text-red-600' : 
                        'text-slate-600'
                      }`}>
                        {calcularDiferenca() > 0 ? '+' : ''}
                        {formatarPreco(Math.abs(calcularDiferenca()))}
                      </p>
                      {calcularDiferenca() > 0 && (
                        <p className="text-sm text-green-700 mt-2 font-medium">
                          ↑ Cliente deve pagar
                        </p>
                      )}
                      {calcularDiferenca() < 0 && (
                        <p className="text-sm text-red-700 mt-2 font-medium">
                          ↓ Devolver ao cliente
                        </p>
                      )}
                      {calcularDiferenca() === 0 && (
                        <p className="text-sm text-slate-600 mt-2 font-medium">
                          = Troca sem diferença
                        </p>
                      )}
                    </div>

                    <button
                      onClick={processarTroca}
                      disabled={!motivoTroca.trim()}
                      className="w-full h-14 bg-primary text-white text-lg font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      ✓ Confirmar Troca
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modais */}
      <ModalSucesso
        isOpen={modalSucesso.isOpen}
        onClose={() => setModalSucesso({ isOpen: false, mensagem: '' })}
        mensagem={modalSucesso.mensagem}
      />

      <ModalErro
        isOpen={modalErro.isOpen}
        onClose={() => setModalErro({ isOpen: false, mensagem: '' })}
        titulo="Erro"
        mensagem={modalErro.mensagem}
      />

      <ModalSelecaoVariacao
        isOpen={modalSelecaoVariacao.isOpen}
        onClose={() => setModalSelecaoVariacao({ isOpen: false, produto: null, tipo: null })}
        produto={modalSelecaoVariacao.produto}
        onConfirmar={handleVariacaoSelecionada}
      />
    </div>
  );
};

export default Trocas;
