import React, { useState } from 'react';
import { Plus, Trash2, Save, Package, DollarSign, Tag } from 'lucide-react';
import API_URL from '../config/apiUrl';
import Sidebar from './Sidebar';

/**
 * 🎯 OBJECTIVE: Create a Responsive Product Form with dynamic Variation rows.
 * STACK: React, Tailwind CSS.
 *
 * FEATURES:
 * - Inputs for Product Details (Name, Price Cost, Price Sale, Brand).
 * - Dynamic List for Variations (Size, Color, Initial Stock).
 * - Button to "Add Variation" row.
 * - Calculate "Margin %" automatically when prices change.
 */

// Função utilitária para formatar valores monetários no padrão brasileiro
const formatarPreco = (valor) => {
  return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};

export default function ProductForm() {
  // State for main product data
  const [product, setProduct] = useState({ 
    name: '', 
    brand: '', 
    category: '',
    description: '',
    price_cost: '', 
    price_sale: '',
    exibir_catalogo: false // Controle de exibição no catálogo público
  });

  // State for list of variations
  const [variations, setVariations] = useState([
    { size: '', color: '', quantity: 0, min_limit: 5, barcode: '', location: '' }
  ]);

  // State para feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Handle product field changes
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle variation field changes
  const handleVariationChange = (index, field, value) => {
    const newVariations = [...variations];
    newVariations[index][field] = value;
    setVariations(newVariations);
  };

  // Add new variation row
  const addVariation = () => {
    setVariations([
      ...variations,
      { size: '', color: '', quantity: 0, min_limit: 5, barcode: '', location: '' }
    ]);
  };

  // Remove variation row
  const removeVariation = (index) => {
    if (variations.length > 1) {
      const newVariations = variations.filter((_, i) => i !== index);
      setVariations(newVariations);
    } else {
      setMessage({ type: 'error', text: 'É necessário pelo menos uma variação' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Calculate margin percentage
  const calculateMargin = () => {
    const cost = parseFloat(product.price_cost) || 0;
    const sale = parseFloat(product.price_sale) || 0;
    
    if (cost > 0) {
      const margin = ((sale - cost) / cost * 100).toFixed(2); // Não é valor monetário, manter
      return margin;
    }
    return '0.00';
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validações básicas
    if (!product.name || !product.brand || !product.price_cost || !product.price_sale) {
      setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios do produto' });
      setLoading(false);
      return;
    }

    const hasInvalidVariation = variations.some(v => !v.size || !v.color);
    if (hasInvalidVariation) {
      setMessage({ type: 'error', text: 'Todas as variações devem ter tamanho e cor' });
      setLoading(false);
      return;
    }

    // Preparar payload
    const payload = {
      ...product,
      price_cost: parseFloat(product.price_cost),
      price_sale: parseFloat(product.price_sale),
      variations: variations.map(v => ({
        ...v,
        quantity: parseInt(v.quantity) || 0,
        min_limit: parseInt(v.min_limit) || 5
      }))
    };

    console.log('📦 Payload para API:', payload);

    try {
      // Enviar para API
      const response = await fetch(API_URL + '/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ Produto criado com sucesso!' });
        
        // Reset form
        setProduct({ 
          name: '', 
          brand: '', 
          category: '', 
          description: '', 
          price_cost: '', 
          price_sale: '',
          exibir_catalogo: false 
        });
        setVariations([{ size: '', color: '', quantity: 0, min_limit: 5, barcode: '', location: '' }]);
        
        console.log('✅ Resposta da API:', data);
      } else {
        setMessage({ type: 'error', text: `❌ Erro: ${data.error}` });
      }
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      setMessage({ type: 'error', text: '❌ Erro ao conectar com o servidor' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const margin = calculateMargin();
  const marginColor = parseFloat(margin) >= 30 ? 'text-green-600' : parseFloat(margin) >= 15 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="layout-with-sidebar">
      <Sidebar />

      <div className="main-content content-with-hamburger">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 sm:px-6 h-16 sm:h-20 bg-white mobile-header-spacing mobile-header-no-button">
          <h1 className="text-slate-900 text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">Cadastro de Produto</h1>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              {/* Mensagem de feedback */}
              {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {message.text}
                </div>
              )}

          {/* PRODUCT DETAILS SECTION */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
              <Tag size={20} />
              Informações do Produto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome do Produto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleProductChange}
                  placeholder="Ex: Camisa Polo"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-4 py-2 border"
                />
              </div>

              {/* Marca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  value={product.brand}
                  onChange={handleProductChange}
                  placeholder="Ex: Nike"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-4 py-2 border"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <input
                  type="text"
                  name="category"
                  value={product.category}
                  onChange={handleProductChange}
                  placeholder="Ex: Camisetas"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-4 py-2 border"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  name="description"
                  value={product.description}
                  onChange={handleProductChange}
                  placeholder="Descrição breve"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-4 py-2 border"
                />
              </div>

              {/* Exibir no Catálogo Público */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="exibir_catalogo"
                  checked={product.exibir_catalogo}
                  onChange={(e) => setProduct(prev => ({ ...prev, exibir_catalogo: e.target.checked }))}
                  className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="exibir_catalogo" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Exibir este produto no catálogo público
                </label>
              </div>

              {/* Preço de Custo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço de Custo (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price_cost"
                  value={product.price_cost}
                  onChange={handleProductChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-4 py-2 border"
                />
              </div>

              {/* Preço de Venda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço de Venda (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price_sale"
                  value={product.price_sale}
                  onChange={handleProductChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-4 py-2 border"
                />
              </div>
            </div>

            {/* Margem de Lucro */}
            {(product.price_cost && product.price_sale) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Margem de Lucro:</span>
                  <span className={`text-2xl font-bold ${marginColor}`}>
                    {margin}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* VARIATIONS SECTION */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
              <DollarSign size={20} />
              Variações e Estoque
            </h2>
            
            <div className="space-y-4">
              {variations.map((variation, index) => (
                <div key={index} className="flex flex-wrap gap-3 items-end p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
                  {/* Tamanho */}
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tamanho <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="tamanhos-sugestoes"
                      value={variation.size}
                      onChange={(e) => handleVariationChange(index, 'size', e.target.value)}
                      placeholder="Ex: P, M, G ou 36, 38, 40"
                      required
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-3 py-2 border text-sm"
                    />
                    <datalist id="tamanhos-sugestoes">
                      <option value="PP">PP - Extra Pequeno</option>
                      <option value="P">P - Pequeno</option>
                      <option value="M">M - Médio</option>
                      <option value="G">G - Grande</option>
                      <option value="GG">GG - Extra Grande</option>
                      <option value="XG">XG - Extra Extra Grande</option>
                      <option value="36">36 - Calça/Short</option>
                      <option value="38">38 - Calça/Short</option>
                      <option value="40">40 - Calça/Short</option>
                      <option value="42">42 - Calça/Short</option>
                      <option value="44">44 - Calça/Short</option>
                      <option value="46">46 - Calça/Short</option>
                      <option value="48">48 - Calça/Short</option>
                      <option value="50">50 - Calça/Short</option>
                      <option value="Único">Único - Tamanho Único</option>
                      <option value="2 anos">2 anos - Infantil</option>
                      <option value="4 anos">4 anos - Infantil</option>
                      <option value="6 anos">6 anos - Infantil</option>
                      <option value="8 anos">8 anos - Infantil</option>
                      <option value="10 anos">10 anos - Infantil</option>
                      <option value="12 anos">12 anos - Infantil</option>
                    </datalist>
                  </div>

                  {/* Cor */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={variation.color}
                      onChange={(e) => handleVariationChange(index, 'color', e.target.value)}
                      placeholder="Ex: Azul"
                      required
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-3 py-2 border text-sm"
                    />
                  </div>

                  {/* Quantidade */}
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Qtd. Inicial
                    </label>
                    <input
                      type="number"
                      value={variation.quantity}
                      onChange={(e) => handleVariationChange(index, 'quantity', e.target.value)}
                      min="0"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-3 py-2 border text-sm"
                    />
                  </div>

                  {/* Estoque Mínimo */}
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Est. Mín.
                    </label>
                    <input
                      type="number"
                      value={variation.min_limit}
                      onChange={(e) => handleVariationChange(index, 'min_limit', e.target.value)}
                      min="0"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-3 py-2 border text-sm"
                    />
                  </div>

                  {/* Código de Barras */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Código de Barras
                    </label>
                    <input
                      type="text"
                      value={variation.barcode}
                      onChange={(e) => handleVariationChange(index, 'barcode', e.target.value)}
                      placeholder="EAN-13"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-3 py-2 border text-sm"
                    />
                  </div>

                  {/* Localização */}
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Localização
                    </label>
                    <input
                      type="text"
                      value={variation.location}
                      onChange={(e) => handleVariationChange(index, 'location', e.target.value)}
                      placeholder="Ex: A-12"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary px-3 py-2 border text-sm"
                    />
                  </div>

                  {/* Botão Remover */}
                  <button
                    type="button"
                    onClick={() => removeVariation(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={variations.length === 1}
                    title="Remover variação"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button 
              type="button"
              onClick={addVariation} 
              className="mt-4 flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors hover:bg-indigo-50 px-4 py-2 rounded-md"
            >
              <Plus size={20} />
              Adicionar Variação
            </button>
          </div>

          {/* SAVE BUTTON */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex justify-center items-center gap-2 font-bold text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={22} />
                  Salvar Produto
                </>
              )}
            </button>
          </div>
        </form>
          </div>
        </main>
      </div>
    </div>
  );
}
