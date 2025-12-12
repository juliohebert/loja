// Função utilitária para formatar valores monetários no padrão brasileiro
const formatarPreco = (valor) => {
  return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getAuthHeaders } from '../utils/auth';
import { FileText, Download, Calendar, TrendingUp, Package, DollarSign, Filter, X, PieChart, Award, Users, ArrowUp, ArrowDown } from 'lucide-react';

const Relatorios = () => {
  const navigate = useNavigate();
  const [relatorioAtivo, setRelatorioAtivo] = useState('comparativo');
  const [carregando, setCarregando] = useState(false);
  
  // Filtros para comparativo mensal
  const [mesAtual, setMesAtual] = useState('');
  const [mesAnterior, setMesAnterior] = useState('');
  
  // Filtros para comparativo trimestral
  const [trimestreAtual, setTrimestreAtual] = useState('');
  const [trimestreAnterior, setTrimestreAnterior] = useState('');
  
  // Dados dos relatórios
  const [dadosComparativoMensal, setDadosComparativoMensal] = useState({
    mesAtual: { vendas: 0, pedidos: 0, ticketMedio: 0, clientes: 0 },
    mesAnterior: { vendas: 0, pedidos: 0, ticketMedio: 0, clientes: 0 },
    variacao: { vendas: 0, pedidos: 0, ticketMedio: 0, clientes: 0 }
  });
  
  const [dadosComparativoTrimestral, setDadosComparativoTrimestral] = useState({
    trimestreAtual: { vendas: 0, pedidos: 0, ticketMedio: 0, clientes: 0 },
    trimestreAnterior: { vendas: 0, pedidos: 0, ticketMedio: 0, clientes: 0 },
    variacao: { vendas: 0, pedidos: 0, ticketMedio: 0, clientes: 0 }
  });

  // Filtros originais
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Dados dos relatórios originais
  const [dadosVendas, setDadosVendas] = useState([]);
  const [dadosEstoque, setDadosEstoque] = useState([]);
  const [dadosFinanceiro, setDadosFinanceiro] = useState({
    receitas: [],
    despesas: [],
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0
  });
  const [dadosMargens, setDadosMargens] = useState([]);
  const [dadosCurvaABC, setDadosCurvaABC] = useState({ classeA: [], classeB: [], classeC: [] });
  const [dadosVendedores, setDadosVendedores] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Definir período padrão: mês atual e anterior
    const hoje = new Date();
    const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const dataAnterior = new Date(hoje);
    dataAnterior.setMonth(hoje.getMonth() - 1);
    const mesAnteriorStr = `${dataAnterior.getFullYear()}-${String(dataAnterior.getMonth() + 1).padStart(2, '0')}`;
    
    setMesAtual(mesAtualStr);
    setMesAnterior(mesAnteriorStr);
    
    // Definir trimestre atual e anterior
    const trimestreAtualNum = Math.floor(hoje.getMonth() / 3) + 1;
    const anoAtual = hoje.getFullYear();
    setTrimestreAtual(`${anoAtual}-T${trimestreAtualNum}`);
    
    if (trimestreAtualNum === 1) {
      setTrimestreAnterior(`${anoAtual - 1}-T4`);
    } else {
      setTrimestreAnterior(`${anoAtual}-T${trimestreAtualNum - 1}`);
    }

    // Definir período padrão para outros relatórios: últimos 30 dias
    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    setDataFim(hoje.toISOString().split('T')[0]);
    setDataInicio(trintaDiasAtras.toISOString().split('T')[0]);
  }, [navigate]);

  useEffect(() => {
    if (relatorioAtivo === 'comparativo' && mesAtual && mesAnterior) {
      gerarComparativoMensal();
    } else if (relatorioAtivo === 'trimestral' && trimestreAtual && trimestreAnterior) {
      gerarComparativoTrimestral();
    } else if (dataInicio && dataFim) {
      gerarRelatorio();
    }
  }, [relatorioAtivo, mesAtual, mesAnterior, trimestreAtual, trimestreAnterior, dataInicio, dataFim]);

  const gerarComparativoMensal = () => {
    setCarregando(true);
    
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    
    // Processar mês atual
    const [anoAtual, mesAtualNum] = mesAtual.split('-');
    const dadosMesAtual = processarMes(lancamentos, clientes, parseInt(anoAtual), parseInt(mesAtualNum));
    
    // Processar mês anterior
    const [anoAnt, mesAntNum] = mesAnterior.split('-');
    const dadosMesAnterior = processarMes(lancamentos, clientes, parseInt(anoAnt), parseInt(mesAntNum));
    
    // Calcular variações
    const variacao = {
      vendas: dadosMesAnterior.vendas > 0 ? ((dadosMesAtual.vendas - dadosMesAnterior.vendas) / dadosMesAnterior.vendas) * 100 : 0,
      pedidos: dadosMesAnterior.pedidos > 0 ? ((dadosMesAtual.pedidos - dadosMesAnterior.pedidos) / dadosMesAnterior.pedidos) * 100 : 0,
      ticketMedio: dadosMesAnterior.ticketMedio > 0 ? ((dadosMesAtual.ticketMedio - dadosMesAnterior.ticketMedio) / dadosMesAnterior.ticketMedio) * 100 : 0,
      clientes: dadosMesAnterior.clientes > 0 ? ((dadosMesAtual.clientes - dadosMesAnterior.clientes) / dadosMesAnterior.clientes) * 100 : 0
    };
    
    setDadosComparativoMensal({
      mesAtual: dadosMesAtual,
      mesAnterior: dadosMesAnterior,
      variacao
    });
    
    setCarregando(false);
  };

  const gerarOpcoesTrimestre = () => {
    const opcoes = [];
    const anoAtual = new Date().getFullYear();
    
    for (let ano = anoAtual; ano >= anoAtual - 2; ano--) {
      for (let t = 4; t >= 1; t--) {
        opcoes.push({
          value: `${ano}-T${t}`,
          label: `${ano} - T${t} (${getNomesTrimestre(t)})`
        });
      }
    }
    
    return opcoes;
  };

  const getNomesTrimestre = (trimestre) => {
    const nomes = {
      1: 'Jan-Mar',
      2: 'Abr-Jun',
      3: 'Jul-Set',
      4: 'Out-Dez'
    };
    return nomes[trimestre];
  };

  const processarMes = (lancamentos, clientes, ano, mes) => {
    const lancamentosMes = lancamentos.filter(l => {
      if (!l.data || l.tipo !== 'receita') return false;
      const [anoLanc, mesLanc] = l.data.split('-').map(Number);
      return anoLanc === ano && mesLanc === mes;
    });
    
    const vendas = lancamentosMes.reduce((acc, l) => acc + (l.valor || 0), 0);
    const pedidos = lancamentosMes.length;
    const ticketMedio = pedidos > 0 ? vendas / pedidos : 0;
    
    // Contar novos clientes no mês
    const clientesNovos = clientes.filter(c => {
      if (!c.createdAt) return false;
      const dataCriacao = new Date(c.createdAt);
      return dataCriacao.getFullYear() === ano && dataCriacao.getMonth() + 1 === mes;
    }).length;
    
    return { vendas, pedidos, ticketMedio, clientes: clientesNovos };
  };

  const gerarComparativoTrimestral = () => {
    setCarregando(true);
    
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
    
    // Processar trimestre atual
    const [anoAtual, trimAtual] = trimestreAtual.split('-T').map(Number);
    const dadosTrimestreAtual = processarTrimestre(lancamentos, clientes, anoAtual, trimAtual);
    
    // Processar trimestre anterior
    const [anoAnt, trimAnt] = trimestreAnterior.split('-T').map(Number);
    const dadosTrimestreAnterior = processarTrimestre(lancamentos, clientes, anoAnt, trimAnt);
    
    // Calcular variações
    const variacao = {
      vendas: dadosTrimestreAnterior.vendas > 0 ? ((dadosTrimestreAtual.vendas - dadosTrimestreAnterior.vendas) / dadosTrimestreAnterior.vendas) * 100 : 0,
      pedidos: dadosTrimestreAnterior.pedidos > 0 ? ((dadosTrimestreAtual.pedidos - dadosTrimestreAnterior.pedidos) / dadosTrimestreAnterior.pedidos) * 100 : 0,
      ticketMedio: dadosTrimestreAnterior.ticketMedio > 0 ? ((dadosTrimestreAtual.ticketMedio - dadosTrimestreAnterior.ticketMedio) / dadosTrimestreAnterior.ticketMedio) * 100 : 0,
      clientes: dadosTrimestreAnterior.clientes > 0 ? ((dadosTrimestreAtual.clientes - dadosTrimestreAnterior.clientes) / dadosTrimestreAnterior.clientes) * 100 : 0
    };
    
    setDadosComparativoTrimestral({
      trimestreAtual: dadosTrimestreAtual,
      trimestreAnterior: dadosTrimestreAnterior,
      variacao
    });
    
    setCarregando(false);
  };

  const processarTrimestre = (lancamentos, clientes, ano, trimestre) => {
    const mesInicio = (trimestre - 1) * 3 + 1;
    const mesFim = trimestre * 3;
    
    const lancamentosTrim = lancamentos.filter(l => {
      if (!l.data || l.tipo !== 'receita') return false;
      const [anoLanc, mesLanc] = l.data.split('-').map(Number);
      return anoLanc === ano && mesLanc >= mesInicio && mesLanc <= mesFim;
    });
    
    const vendas = lancamentosTrim.reduce((acc, l) => acc + (l.valor || 0), 0);
    const pedidos = lancamentosTrim.length;
    const ticketMedio = pedidos > 0 ? vendas / pedidos : 0;
    
    // Contar novos clientes no trimestre
    const clientesNovos = clientes.filter(c => {
      if (!c.createdAt) return false;
      const dataCriacao = new Date(c.createdAt);
      const mes = dataCriacao.getMonth() + 1;
      return dataCriacao.getFullYear() === ano && mes >= mesInicio && mes <= mesFim;
    }).length;
    
    return { vendas, pedidos, ticketMedio, clientes: clientesNovos };
  };

  const gerarRelatorio = () => {
    setCarregando(true);
    
    switch (relatorioAtivo) {
      case 'vendas':
        gerarRelatorioVendas();
        break;
      case 'estoque':
        gerarRelatorioEstoque();
        break;
      case 'financeiro':
        gerarRelatorioFinanceiro();
        break;
      case 'margens':
        gerarRelatorioMargens();
        break;
      case 'curva-abc':
        gerarRelatorioCurvaABC();
        break;
      case 'vendedores':
        gerarRelatorioVendedores();
        break;
      default:
        break;
    }
    
    setCarregando(false);
  };

  const gerarRelatorioVendas = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Buscar vendas do backend
      const response = await fetch(`http://localhost:3001/api/sales/period?dataInicio=${dataInicio}&dataFim=${dataFim}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar vendas');
      }

      const result = await response.json();
      const vendas = result.data || [];
      
      // Se não houver vendas no backend, buscar do localStorage como fallback
      let vendasFiltradas = vendas;
      if (vendas.length === 0) {
        const vendasLocal = JSON.parse(localStorage.getItem('vendas') || '[]');
        vendasFiltradas = vendasLocal.filter(venda => {
          const dataVenda = venda.data || venda.dataHora?.split(' ')[0];
          return dataVenda >= dataInicio && dataVenda <= dataFim;
        });
      }

      // Processar dados
      const vendasProcessadas = vendasFiltradas.map(venda => {
        const totalItens = venda.itens.reduce((acc, item) => acc + item.quantidade, 0);
        return {
          id: venda.id,
          numeroVenda: venda.numeroVenda,
          data: venda.data,
          dataHora: venda.dataHora,
          itens: venda.itens,
          totalItens: totalItens,
          subtotal: parseFloat(venda.subtotal),
          desconto: parseFloat(venda.desconto),
          total: parseFloat(venda.total),
          formaPagamento: venda.formaPagamento,
          vendedor: venda.vendedor || 'Sistema'
        };
      });

      setDadosVendas(vendasProcessadas);
    } catch (error) {
      console.error('Erro ao gerar relatório de vendas:', error);
      setToast({ isOpen: true, tipo: 'erro', mensagem: 'Erro ao carregar vendas' });
    }
  };

  const gerarRelatorioEstoque = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/products', {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Falha ao buscar produtos');

      const data = await response.json();
      
      // Processar produtos e variações
      const estoque = [];
      
      data.data.forEach(produto => {
        const variacoes = produto.variacoes || [];
        
        if (variacoes.length > 0) {
          variacoes.forEach(variacao => {
            const quantidade = variacao.estoque?.quantidade || 0;
            const limiteMinimo = variacao.estoque?.limiteMinimo || 10;
            const valorUnitario = parseFloat(produto.precoVenda);
            const valorCusto = parseFloat(produto.precoCusto);
            const valorTotal = quantidade * valorUnitario;
            const valorCustoTotal = quantidade * valorCusto;
            
            let status = 'Em Estoque';
            if (quantidade === 0) {
              status = 'Esgotado';
            } else if (quantidade <= limiteMinimo) {
              status = 'Estoque Baixo';
            }
            
            estoque.push({
              nome: produto.nome,
              sku: variacao.sku,
              tamanho: variacao.tamanho,
              cor: variacao.cor,
              quantidade: quantidade,
              limiteMinimo: limiteMinimo,
              valorUnitario: valorUnitario,
              valorCusto: valorCusto,
              valorTotal: valorTotal,
              valorCustoTotal: valorCustoTotal,
              status: status,
              categoria: produto.categoria,
              marca: produto.marca
            });
          });
        }
      });
      
      setDadosEstoque(estoque);
    } catch (error) {
      console.error('Erro ao gerar relatório de estoque:', error);
    }
  };

  const gerarRelatorioFinanceiro = () => {
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    
    // Filtrar por período
    const lancamentosFiltrados = lancamentos.filter(lanc => {
      return lanc.data >= dataInicio && lanc.data <= dataFim;
    });

    const receitas = lancamentosFiltrados.filter(l => l.tipo === 'receita');
    const despesas = lancamentosFiltrados.filter(l => l.tipo === 'despesa');
    
    const totalReceitas = receitas.reduce((acc, l) => acc + l.valor, 0);
    const totalDespesas = despesas.reduce((acc, l) => acc + l.valor, 0);
    const saldo = totalReceitas - totalDespesas;

    setDadosFinanceiro({
      receitas,
      despesas,
      totalReceitas,
      totalDespesas,
      saldo
    });
  };

  const gerarRelatorioMargens = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/products', {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Falha ao buscar produtos');

      const data = await response.json();
      const vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
      
      // Filtrar vendas por período
      const vendasFiltradas = vendas.filter(venda => {
        const dataVenda = venda.data || venda.dataHora?.split(' ')[0];
        return dataVenda >= dataInicio && dataVenda <= dataFim;
      });

      // Calcular vendas por produto
      const vendasPorProduto = {};
      vendasFiltradas.forEach(venda => {
        venda.itens.forEach(item => {
          const nome = item.nome || item.produto;
          if (!vendasPorProduto[nome]) {
            vendasPorProduto[nome] = {
              quantidade: 0,
              faturamento: 0
            };
          }
          vendasPorProduto[nome].quantidade += item.quantidade;
          vendasPorProduto[nome].faturamento += item.preco * item.quantidade;
        });
      });

      // Processar produtos com margens
      const margens = [];
      data.data.forEach(produto => {
        const precoCusto = parseFloat(produto.precoCusto) || 0;
        const precoVenda = parseFloat(produto.precoVenda) || 0;
        const margemValor = precoVenda - precoCusto;
        const margemPercentual = precoCusto > 0 ? ((margemValor / precoCusto) * 100) : 0;
        
        const vendido = vendasPorProduto[produto.nome] || { quantidade: 0, faturamento: 0 };
        const lucroTotal = margemValor * vendido.quantidade;

        margens.push({
          nome: produto.nome,
          categoria: produto.categoria,
          precoCusto: precoCusto,
          precoVenda: precoVenda,
          margemValor: margemValor,
          margemPercentual: margemPercentual,
          quantidadeVendida: vendido.quantidade,
          faturamento: vendido.faturamento,
          lucroTotal: lucroTotal
        });
      });

      // Ordenar por lucro total
      margens.sort((a, b) => b.lucroTotal - a.lucroTotal);
      setDadosMargens(margens);
    } catch (error) {
      console.error('Erro ao gerar relatório de margens:', error);
    }
  };

  const gerarRelatorioCurvaABC = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/products', {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Falha ao buscar produtos');

      const data = await response.json();
      const vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
      
      // Filtrar vendas por período
      const vendasFiltradas = vendas.filter(venda => {
        const dataVenda = venda.data || venda.dataHora?.split(' ')[0];
        return dataVenda >= dataInicio && dataVenda <= dataFim;
      });

      // Calcular faturamento por produto
      const faturamentoPorProduto = {};
      vendasFiltradas.forEach(venda => {
        venda.itens.forEach(item => {
          const nome = item.nome || item.produto;
          if (!faturamentoPorProduto[nome]) {
            faturamentoPorProduto[nome] = {
              nome: nome,
              faturamento: 0,
              quantidade: 0
            };
          }
          faturamentoPorProduto[nome].faturamento += item.preco * item.quantidade;
          faturamentoPorProduto[nome].quantidade += item.quantidade;
        });
      });

      // Converter para array e ordenar por faturamento
      const produtos = Object.values(faturamentoPorProduto).sort((a, b) => b.faturamento - a.faturamento);
      
      const totalFaturamento = produtos.reduce((acc, p) => acc + p.faturamento, 0);
      
      // Calcular percentuais acumulados
      let acumulado = 0;
      const produtosComPercentual = produtos.map(produto => {
        const percentual = (produto.faturamento / totalFaturamento) * 100;
        acumulado += percentual;
        return {
          ...produto,
          percentualFaturamento: percentual,
          percentualAcumulado: acumulado
        };
      });

      // Classificar em A, B, C
      const classeA = produtosComPercentual.filter(p => p.percentualAcumulado <= 80);
      const classeB = produtosComPercentual.filter(p => p.percentualAcumulado > 80 && p.percentualAcumulado <= 95);
      const classeC = produtosComPercentual.filter(p => p.percentualAcumulado > 95);

      setDadosCurvaABC({ classeA, classeB, classeC, totalFaturamento });
    } catch (error) {
      console.error('Erro ao gerar curva ABC:', error);
    }
  };

  const gerarRelatorioVendedores = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Buscar vendas do backend
      const response = await fetch(`http://localhost:3001/api/sales/period?dataInicio=${dataInicio}&dataFim=${dataFim}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar vendas');
      }

      const result = await response.json();
      let vendasFiltradas = result.data || [];
      
      // Se não houver vendas no backend, buscar do localStorage como fallback
      if (vendasFiltradas.length === 0) {
        const vendasLocal = JSON.parse(localStorage.getItem('vendas') || '[]');
        vendasFiltradas = vendasLocal.filter(venda => {
          const dataVenda = venda.data || venda.dataHora?.split(' ')[0];
          return dataVenda >= dataInicio && dataVenda <= dataFim;
        });
      }

      // Agrupar por vendedor
      const porVendedor = {};
      vendasFiltradas.forEach(venda => {
        const vendedor = venda.vendedor || 'Sistema';
        if (!porVendedor[vendedor]) {
          porVendedor[vendedor] = {
            vendedor: vendedor,
            totalVendas: 0,
            totalFaturamento: 0,
            totalItens: 0,
            ticketMedio: 0
          };
        }
        porVendedor[vendedor].totalVendas += 1;
        porVendedor[vendedor].totalFaturamento += parseFloat(venda.total);
        porVendedor[vendedor].totalItens += venda.itens.reduce((acc, item) => acc + item.quantidade, 0);
      });

      // Calcular ticket médio e converter para array
      const vendedores = Object.values(porVendedor).map(v => ({
        ...v,
        ticketMedio: v.totalFaturamento / v.totalVendas
      })).sort((a, b) => b.totalFaturamento - a.totalFaturamento);

      setDadosVendedores(vendedores);
    } catch (error) {
      console.error('Erro ao gerar relatório de vendedores:', error);
      setToast({ isOpen: true, tipo: 'erro', mensagem: 'Erro ao carregar dados de vendedores' });
    }
  };

  const exportarPDF = () => {
    alert('Funcionalidade de exportar PDF será implementada em breve!');
  };

  const exportarExcel = () => {
    let csvContent = '';
    let filename = '';

    switch (relatorioAtivo) {
      case 'vendas':
        filename = `relatorio_vendas_${dataInicio}_${dataFim}.csv`;
        csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Número Venda,Data,Hora,Total Itens,Subtotal,Desconto,Total,Forma Pagamento,Vendedor\n';
        dadosVendas.forEach(venda => {
          csvContent += `${venda.numeroVenda},${venda.data},${venda.dataHora?.split(' ')[1] || ''},${venda.totalItens},${venda.subtotal},${venda.desconto},${venda.total},${venda.formaPagamento},${venda.vendedor}\n`;
        });
        break;
        
      case 'estoque':
        filename = `relatorio_estoque_${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Produto,SKU,Tamanho,Cor,Quantidade,Limite Mínimo,Valor Unitário,Valor Total,Status,Categoria,Marca\n';
        dadosEstoque.forEach(item => {
          csvContent += `${item.nome},${item.sku},${item.tamanho},${item.cor},${item.quantidade},${item.limiteMinimo},${item.valorUnitario},${item.valorTotal},${item.status},${item.categoria},${item.marca}\n`;
        });
        break;
        
      case 'financeiro':
        filename = `relatorio_financeiro_${dataInicio}_${dataFim}.csv`;
        csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Tipo,Data,Descrição,Categoria,Valor,Forma Pagamento\n';
        [...dadosFinanceiro.receitas, ...dadosFinanceiro.despesas].forEach(lanc => {
          csvContent += `${lanc.tipo === 'receita' ? 'Receita' : 'Despesa'},${lanc.data},${lanc.descricao},${lanc.categoria},${lanc.valor},${lanc.formaPagamento}\n`;
        });
        csvContent += `\nResumo:,,,Total Receitas,${dadosFinanceiro.totalReceitas},\n`;
        csvContent += `,,,Total Despesas,${dadosFinanceiro.totalDespesas},\n`;
        csvContent += `,,,Saldo,${dadosFinanceiro.saldo},\n`;
        break;
        
      default:
        return;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const limparFiltros = () => {
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    setDataFim(hoje.toISOString().split('T')[0]);
    setDataInicio(trintaDiasAtras.toISOString().split('T')[0]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Relatórios</h1>
            <p className="text-gray-600">Análise e exportação de dados</p>
          </div>

          {/* Tabs de Relatórios */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex overflow-x-auto border-b border-gray-200">
              <button
                onClick={() => setRelatorioAtivo('comparativo')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  relatorioAtivo === 'comparativo'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                Comparativo Mensal
              </button>
              <button
                onClick={() => setRelatorioAtivo('trimestral')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  relatorioAtivo === 'trimestral'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <PieChart className="w-5 h-5" />
                Comparativo Trimestral
              </button>
              <button
                onClick={() => setRelatorioAtivo('vendas')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  relatorioAtivo === 'vendas'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                Vendas
              </button>
              <button
                onClick={() => setRelatorioAtivo('estoque')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  relatorioAtivo === 'estoque'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Package className="w-5 h-5" />
                Estoque
              </button>
              <button
                onClick={() => setRelatorioAtivo('financeiro')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  relatorioAtivo === 'financeiro'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                Financeiro
              </button>
              <button
                onClick={() => setRelatorioAtivo('margens')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  relatorioAtivo === 'margens'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <PieChart className="w-5 h-5" />
                Margens
              </button>
              <button
                onClick={() => setRelatorioAtivo('curva-abc')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  relatorioAtivo === 'curva-abc'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Award className="w-5 h-5" />
                Curva ABC
              </button>
              <button
                onClick={() => setRelatorioAtivo('vendedores')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  relatorioAtivo === 'vendedores'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Users className="w-5 h-5" />
                Vendedores
              </button>
            </div>

            {/* Filtros para Comparativo Mensal */}
            {relatorioAtivo === 'comparativo' && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Comparar meses:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="month"
                      value={mesAtual}
                      onChange={(e) => setMesAtual(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">vs</span>
                    <input
                      type="month"
                      value={mesAnterior}
                      onChange={(e) => setMesAnterior(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Filtros para Comparativo Trimestral */}
            {relatorioAtivo === 'trimestral' && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Comparar trimestres:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={trimestreAtual}
                      onChange={(e) => setTrimestreAtual(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {gerarOpcoesTrimestre().map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <span className="text-gray-500">vs</span>
                    <select
                      value={trimestreAnterior}
                      onChange={(e) => setTrimestreAnterior(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {gerarOpcoesTrimestre().map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Filtros */}
            {!['comparativo', 'trimestral', 'estoque'].includes(relatorioAtivo) && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Período:</span>
                  </div>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">até</span>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={limparFiltros}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Limpar
                  </button>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {relatorioAtivo === 'vendas' && `${dadosVendas.length} vendas encontradas`}
                {relatorioAtivo === 'estoque' && `${dadosEstoque.length} produtos em estoque`}
                {relatorioAtivo === 'financeiro' && `${dadosFinanceiro.receitas.length + dadosFinanceiro.despesas.length} lançamentos`}
                {relatorioAtivo === 'margens' && `${dadosMargens.length} produtos analisados`}
                {relatorioAtivo === 'curva-abc' && `${(dadosCurvaABC.classeA?.length || 0) + (dadosCurvaABC.classeB?.length || 0) + (dadosCurvaABC.classeC?.length || 0)} produtos classificados`}
                {relatorioAtivo === 'vendedores' && `${dadosVendedores.length} vendedores`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportarExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo do Relatório */}
          {carregando ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Gerando relatório...</p>
            </div>
          ) : (
            <>
              {/* Descrição do Relatório */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">
                      {relatorioAtivo === 'comparativo' && 'Sobre o Comparativo Mensal'}
                      {relatorioAtivo === 'trimestral' && 'Sobre o Comparativo Trimestral'}
                      {relatorioAtivo === 'vendas' && 'Sobre o Relatório de Vendas'}
                      {relatorioAtivo === 'estoque' && 'Sobre o Relatório de Estoque'}
                      {relatorioAtivo === 'financeiro' && 'Sobre o Relatório Financeiro'}
                      {relatorioAtivo === 'margens' && 'Sobre o Relatório de Margens'}
                      {relatorioAtivo === 'curva-abc' && 'Sobre a Curva ABC'}
                      {relatorioAtivo === 'vendedores' && 'Sobre o Relatório de Vendedores'}
                    </h3>
                    <div className="text-sm text-blue-700">
                      {relatorioAtivo === 'comparativo' && (
                        <p>
                          <strong>O que é:</strong> Comparação detalhada de performance entre dois meses selecionados.<br />
                          <strong>Para que serve:</strong> Identificar tendências de crescimento ou queda, entender a sazonalidade do negócio e avaliar o impacto de ações comerciais.<br />
                          <strong>Como usar:</strong> Selecione dois meses para comparar. Indicadores verdes (↑) mostram crescimento, vermelhos (↓) mostram queda. Analise quais métricas melhoraram ou pioraram para tomar decisões estratégicas.
                        </p>
                      )}
                      {relatorioAtivo === 'trimestral' && (
                        <p>
                          <strong>O que é:</strong> Análise comparativa de performance entre trimestres (períodos de 3 meses).<br />
                          <strong>Para que serve:</strong> Visão de médio prazo para planejamento estratégico, identificação de tendências sazonais e avaliação de resultados trimestrais.<br />
                          <strong>Como usar:</strong> Compare trimestres consecutivos ou do mesmo período em anos diferentes. Ideal para relatórios gerenciais e apresentação de resultados para investidores ou sócios.
                        </p>
                      )}
                      {relatorioAtivo === 'vendas' && (
                        <p>
                          <strong>O que é:</strong> Visualize todas as vendas realizadas em um período específico.<br />
                          <strong>Para que serve:</strong> Acompanhar o desempenho comercial, identificar períodos de maior movimento e analisar o ticket médio das vendas.<br />
                          <strong>Como usar:</strong> Selecione o período desejado e analise o número de vendas, faturamento total e ticket médio. Use os dados para planejar estratégias comerciais.
                        </p>
                      )}
                      {relatorioAtivo === 'estoque' && (
                        <p>
                          <strong>O que é:</strong> Visão completa e atual de todos os produtos em estoque com suas quantidades e valores.<br />
                          <strong>Para que serve:</strong> Controlar o inventário, identificar produtos esgotados ou com estoque baixo, e calcular o valor total imobilizado em mercadorias.<br />
                          <strong>Como usar:</strong> Revise regularmente os produtos em estoque baixo (laranja) e esgotados (vermelho) para fazer reposições. O valor total ajuda no planejamento financeiro.
                        </p>
                      )}
                      {relatorioAtivo === 'financeiro' && (
                        <p>
                          <strong>O que é:</strong> Análise do fluxo de caixa mostrando todas as receitas e despesas do período.<br />
                          <strong>Para que serve:</strong> Monitorar a saúde financeira do negócio, identificar gastos excessivos e garantir que há lucro operacional.<br />
                          <strong>Como usar:</strong> Compare receitas vs despesas para verificar se o negócio está lucrativo. Analise as categorias de despesas para identificar onde é possível economizar. Um saldo positivo indica boa saúde financeira.
                        </p>
                      )}
                      {relatorioAtivo === 'margens' && (
                        <p>
                          <strong>O que é:</strong> Análise de rentabilidade que mostra quanto você lucra com cada produto.<br />
                          <strong>Para que serve:</strong> Identificar quais produtos são mais rentáveis e quais têm margem baixa. Ajuda a decidir onde focar esforços de venda e quais preços ajustar.<br />
                          <strong>Como usar:</strong> Produtos com margem verde (≥50%) são muito lucrativos - priorize-os. Amarelo (≥30%) têm margem razoável. Vermelho (&lt;30%) requerem atenção: considere aumentar preços ou reduzir custos. Olhe também o "Lucro Total" para ver quais produtos geram mais dinheiro no volume.
                        </p>
                      )}
                      {relatorioAtivo === 'curva-abc' && (
                        <p>
                          <strong>O que é:</strong> Classificação dos produtos em 3 grupos (A, B, C) baseada no Princípio de Pareto: poucos produtos geram a maior parte da receita.<br />
                          <strong>Para que serve:</strong> Focar sua atenção nos produtos mais importantes. <strong>Classe A</strong> (~20% dos produtos, 80% da receita) são seus "carros-chefe" - nunca deixe faltar. <strong>Classe B</strong> (complementares) merecem atenção moderada. <strong>Classe C</strong> (muitos produtos, pouca receita) avalie se vale manter no estoque.<br />
                          <strong>Como usar:</strong> Priorize sempre produtos Classe A: mantenha estoque adequado, posição de destaque na loja, e atenção especial. Considere reduzir variedade dos produtos Classe C.
                        </p>
                      )}
                      {relatorioAtivo === 'vendedores' && (
                        <p>
                          <strong>O que é:</strong> Ranking de desempenho mostrando as métricas de cada vendedor.<br />
                          <strong>Para que serve:</strong> Avaliar a performance da equipe, identificar os melhores vendedores e quem precisa de treinamento. Útil para definir metas, bonificações e comissões.<br />
                          <strong>Como usar:</strong> Compare o faturamento e ticket médio de cada vendedor. Os top performers (🏆🥈🥉) podem servir de exemplo. Vendedores com ticket médio baixo podem precisar de treinamento em vendas. A % do total mostra a contribuição de cada um para o resultado geral.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparativo Mensal */}
              {relatorioAtivo === 'comparativo' && (
                <div className="space-y-6">
                  {/* Cards Comparativos */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Mês Anterior */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        {mesAnterior ? new Date(mesAnterior + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Mês Anterior'}
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Faturamento</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatarPreco(dadosComparativoMensal.mesAnterior.vendas)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Pedidos</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {dadosComparativoMensal.mesAnterior.pedidos}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Ticket Médio</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatarPreco(dadosComparativoMensal.mesAnterior.ticketMedio)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-600">Novos Clientes</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {dadosComparativoMensal.mesAnterior.clientes}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mês Atual */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        {mesAtual ? new Date(mesAtual + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Mês Atual'}
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Faturamento</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatarPreco(dadosComparativoMensal.mesAtual.vendas)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Pedidos</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {dadosComparativoMensal.mesAtual.pedidos}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Ticket Médio</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatarPreco(dadosComparativoMensal.mesAtual.ticketMedio)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-600">Novos Clientes</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {dadosComparativoMensal.mesAtual.clientes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Variações */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Variação Percentual
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className={`rounded-lg p-4 ${dadosComparativoMensal.variacao.vendas >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm font-medium mb-1 ${dadosComparativoMensal.variacao.vendas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Faturamento
                        </p>
                        <p className={`text-2xl font-bold flex items-center gap-1 ${dadosComparativoMensal.variacao.vendas >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {dadosComparativoMensal.variacao.vendas >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                          {Math.abs(dadosComparativoMensal.variacao.vendas).toFixed(1)}%
                        </p>
                      </div>
                      <div className={`rounded-lg p-4 ${dadosComparativoMensal.variacao.pedidos >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm font-medium mb-1 ${dadosComparativoMensal.variacao.pedidos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Pedidos
                        </p>
                        <p className={`text-2xl font-bold flex items-center gap-1 ${dadosComparativoMensal.variacao.pedidos >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {dadosComparativoMensal.variacao.pedidos >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                          {Math.abs(dadosComparativoMensal.variacao.pedidos).toFixed(1)}%
                        </p>
                      </div>
                      <div className={`rounded-lg p-4 ${dadosComparativoMensal.variacao.ticketMedio >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm font-medium mb-1 ${dadosComparativoMensal.variacao.ticketMedio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Ticket Médio
                        </p>
                        <p className={`text-2xl font-bold flex items-center gap-1 ${dadosComparativoMensal.variacao.ticketMedio >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {dadosComparativoMensal.variacao.ticketMedio >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                          {Math.abs(dadosComparativoMensal.variacao.ticketMedio).toFixed(1)}%
                        </p>
                      </div>
                      <div className={`rounded-lg p-4 ${dadosComparativoMensal.variacao.clientes >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm font-medium mb-1 ${dadosComparativoMensal.variacao.clientes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Novos Clientes
                        </p>
                        <p className={`text-2xl font-bold flex items-center gap-1 ${dadosComparativoMensal.variacao.clientes >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {dadosComparativoMensal.variacao.clientes >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                          {Math.abs(dadosComparativoMensal.variacao.clientes).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparativo Trimestral */}
              {relatorioAtivo === 'trimestral' && (
                <div className="space-y-6">
                  {/* Cards Comparativos */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Trimestre Anterior */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        {trimestreAnterior || 'Trimestre Anterior'}
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Faturamento</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatarPreco(dadosComparativoTrimestral.trimestreAnterior.vendas)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Pedidos</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {dadosComparativoTrimestral.trimestreAnterior.pedidos}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Ticket Médio</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatarPreco(dadosComparativoTrimestral.trimestreAnterior.ticketMedio)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-600">Novos Clientes</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {dadosComparativoTrimestral.trimestreAnterior.clientes}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trimestre Atual */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        {trimestreAtual || 'Trimestre Atual'}
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Faturamento</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatarPreco(dadosComparativoTrimestral.trimestreAtual.vendas)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Pedidos</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {dadosComparativoTrimestral.trimestreAtual.pedidos}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-gray-600">Ticket Médio</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatarPreco(dadosComparativoTrimestral.trimestreAtual.ticketMedio)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-600">Novos Clientes</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {dadosComparativoTrimestral.trimestreAtual.clientes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Variações */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Variação Percentual
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className={`rounded-lg p-4 ${dadosComparativoTrimestral.variacao.vendas >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm font-medium mb-1 ${dadosComparativoTrimestral.variacao.vendas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Faturamento
                        </p>
                        <p className={`text-2xl font-bold flex items-center gap-1 ${dadosComparativoTrimestral.variacao.vendas >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {dadosComparativoTrimestral.variacao.vendas >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                          {Math.abs(dadosComparativoTrimestral.variacao.vendas).toFixed(1)}%
                        </p>
                      </div>
                      <div className={`rounded-lg p-4 ${dadosComparativoTrimestral.variacao.pedidos >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm font-medium mb-1 ${dadosComparativoTrimestral.variacao.pedidos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Pedidos
                        </p>
                        <p className={`text-2xl font-bold flex items-center gap-1 ${dadosComparativoTrimestral.variacao.pedidos >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {dadosComparativoTrimestral.variacao.pedidos >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                          {Math.abs(dadosComparativoTrimestral.variacao.pedidos).toFixed(1)}%
                        </p>
                      </div>
                      <div className={`rounded-lg p-4 ${dadosComparativoTrimestral.variacao.ticketMedio >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm font-medium mb-1 ${dadosComparativoTrimestral.variacao.ticketMedio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Ticket Médio
                        </p>
                        <p className={`text-2xl font-bold flex items-center gap-1 ${dadosComparativoTrimestral.variacao.ticketMedio >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {dadosComparativoTrimestral.variacao.ticketMedio >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                          {Math.abs(dadosComparativoTrimestral.variacao.ticketMedio).toFixed(1)}%
                        </p>
                      </div>
                      <div className={`rounded-lg p-4 ${dadosComparativoTrimestral.variacao.clientes >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm font-medium mb-1 ${dadosComparativoTrimestral.variacao.clientes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Novos Clientes
                        </p>
                        <p className={`text-2xl font-bold flex items-center gap-1 ${dadosComparativoTrimestral.variacao.clientes >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {dadosComparativoTrimestral.variacao.clientes >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                          {Math.abs(dadosComparativoTrimestral.variacao.clientes).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Relatório de Vendas */}
              {relatorioAtivo === 'vendas' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Resumo */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium mb-1">Total de Vendas</p>
                        <p className="text-2xl font-bold text-blue-700">{dadosVendas.length}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-medium mb-1">Faturamento</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatarPreco(dadosVendas.reduce((acc, v) => acc + v.total, 0))}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 font-medium mb-1">Ticket Médio</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {formatarPreco(dadosVendas.length > 0 ? (dadosVendas.reduce((acc, v) => acc + v.total, 0) / dadosVendas.length) : 0)}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-orange-600 font-medium mb-1">Itens Vendidos</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {dadosVendas.reduce((acc, v) => acc + v.totalItens, 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabela */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Venda</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itens</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desconto</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dadosVendas.map((venda) => (
                          <tr key={venda.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">#{venda.numeroVenda}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{venda.dataHora}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{venda.totalItens}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatarPreco(venda.subtotal)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatarPreco(venda.desconto)}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatarPreco(venda.total)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{venda.formaPagamento}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{venda.vendedor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Relatório de Estoque */}
              {relatorioAtivo === 'estoque' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Resumo */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium mb-1">Total de Itens</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {dadosEstoque.reduce((acc, item) => acc + item.quantidade, 0)}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-medium mb-1">Valor Total (Venda)</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatarPreco(dadosEstoque.reduce((acc, item) => acc + item.valorTotal, 0))}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-orange-600 font-medium mb-1">Estoque Baixo</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {dadosEstoque.filter(item => item.status === 'Estoque Baixo').length}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4">
                        <p className="text-sm text-red-600 font-medium mb-1">Esgotados</p>
                        <p className="text-2xl font-bold text-red-700">
                          {dadosEstoque.filter(item => item.status === 'Esgotado').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabela */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variação</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Unit.</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dadosEstoque.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nome}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{item.sku}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{item.tamanho} / {item.cor}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{item.quantidade}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{item.limiteMinimo}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatarPreco(item.valorUnitario)}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatarPreco(item.valorTotal)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                item.status === 'Esgotado' ? 'bg-red-100 text-red-700' :
                                item.status === 'Estoque Baixo' ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Relatório Financeiro */}
              {relatorioAtivo === 'financeiro' && (
                <div className="space-y-6">
                  {/* Resumo */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                      <p className="text-sm text-green-600 font-medium mb-2">Total de Receitas</p>
                      <p className="text-3xl font-bold text-green-700">{formatarPreco(dadosFinanceiro.totalReceitas)}</p>
                      <p className="text-sm text-green-600 mt-1">{dadosFinanceiro.receitas.length} lançamentos</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
                      <p className="text-sm text-red-600 font-medium mb-2">Total de Despesas</p>
                      <p className="text-3xl font-bold text-red-700">{formatarPreco(dadosFinanceiro.totalDespesas)}</p>
                      <p className="text-sm text-red-600 mt-1">{dadosFinanceiro.despesas.length} lançamentos</p>
                    </div>
                    <div className={`rounded-lg p-6 border-2 ${
                      dadosFinanceiro.saldo >= 0 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                      <p className={`text-sm font-medium mb-2 ${
                        dadosFinanceiro.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}>Saldo do Período</p>
                      <p className={`text-3xl font-bold ${
                        dadosFinanceiro.saldo >= 0 ? 'text-blue-700' : 'text-orange-700'
                      }`}>{formatarPreco(dadosFinanceiro.saldo)}</p>
                      <p className={`text-sm mt-1 ${
                        dadosFinanceiro.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}>{dadosFinanceiro.saldo >= 0 ? 'Positivo' : 'Negativo'}</p>
                    </div>
                  </div>

                  {/* Tabela de Lançamentos */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800">Lançamentos do Período</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forma Pagamento</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {[...dadosFinanceiro.receitas, ...dadosFinanceiro.despesas]
                            .sort((a, b) => b.data.localeCompare(a.data))
                            .map((lanc) => (
                            <tr key={lanc.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-600">{lanc.data}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  lanc.tipo === 'receita' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {lanc.tipo === 'receita' ? 'Receita' : 'Despesa'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{lanc.descricao}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{lanc.categoria}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{lanc.formaPagamento}</td>
                              <td className={`px-6 py-4 text-sm font-semibold text-right ${
                                lanc.tipo === 'receita' ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {lanc.tipo === 'receita' ? '+' : '-'} {formatarPreco(lanc.valor)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Relatório de Margens */}
              {relatorioAtivo === 'margens' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Resumo */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium mb-1">Faturamento Total</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatarPreco(dadosMargens.reduce((acc, p) => acc + p.faturamento, 0))}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-medium mb-1">Lucro Total</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatarPreco(dadosMargens.reduce((acc, p) => acc + p.lucroTotal, 0))}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 font-medium mb-1">Margem Média</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {dadosMargens.length > 0 
                            ? (dadosMargens.reduce((acc, p) => acc + p.margemPercentual, 0) / dadosMargens.length).toFixed(1)
                            : '0'}%
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-orange-600 font-medium mb-1">Produtos Vendidos</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {dadosMargens.filter(p => p.quantidadeVendida > 0).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabela */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venda</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margem %</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd Vendida</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lucro Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dadosMargens.map((produto, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{produto.nome}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{produto.categoria}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatarPreco(produto.precoCusto)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatarPreco(produto.precoVenda)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                produto.margemPercentual >= 50 ? 'bg-green-100 text-green-700' :
                                produto.margemPercentual >= 30 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {produto.margemPercentual.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{produto.quantidadeVendida}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatarPreco(produto.faturamento)}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-green-700">{formatarPreco(produto.lucroTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Relatório Curva ABC */}
              {relatorioAtivo === 'curva-abc' && (
                <div className="space-y-6">
                  {/* Resumo */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-green-600 font-medium">Classe A</p>
                        <Award className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-green-700 mb-1">{dadosCurvaABC.classeA?.length || 0}</p>
                      <p className="text-xs text-green-600">~80% do faturamento</p>
                      <p className="text-sm text-green-700 mt-2 font-semibold">
                        {formatarPreco(dadosCurvaABC.classeA?.reduce((acc, p) => acc + p.faturamento, 0) || 0)}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-yellow-600 font-medium">Classe B</p>
                        <Award className="w-5 h-5 text-yellow-600" />
                      </div>
                      <p className="text-3xl font-bold text-yellow-700 mb-1">{dadosCurvaABC.classeB?.length || 0}</p>
                      <p className="text-xs text-yellow-600">~15% do faturamento</p>
                      <p className="text-sm text-yellow-700 mt-2 font-semibold">
                        {formatarPreco(dadosCurvaABC.classeB?.reduce((acc, p) => acc + p.faturamento, 0) || 0)}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-red-600 font-medium">Classe C</p>
                        <Award className="w-5 h-5 text-red-600" />
                      </div>
                      <p className="text-3xl font-bold text-red-700 mb-1">{dadosCurvaABC.classeC?.length || 0}</p>
                      <p className="text-xs text-red-600">~5% do faturamento</p>
                      <p className="text-sm text-red-700 mt-2 font-semibold">
                        {formatarPreco(dadosCurvaABC.classeC?.reduce((acc, p) => acc + p.faturamento, 0) || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Classe A */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-green-50">
                      <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Classe A - Produtos Essenciais
                      </h3>
                      <p className="text-sm text-green-600 mt-1">Produtos que geram a maior parte da receita</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Faturamento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Acumulado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {dadosCurvaABC.classeA?.map((produto, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{produto.nome}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{produto.quantidade}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatarPreco(produto.faturamento)}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{produto.percentualFaturamento.toFixed(2)}%</td>
                              <td className="px-6 py-4 text-sm font-medium text-green-700">{produto.percentualAcumulado.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Classe B */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-yellow-50">
                      <h3 className="text-lg font-semibold text-yellow-800 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Classe B - Produtos Intermediários
                      </h3>
                      <p className="text-sm text-yellow-600 mt-1">Produtos com importância moderada</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Faturamento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Acumulado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {dadosCurvaABC.classeB?.map((produto, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{produto.nome}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{produto.quantidade}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatarPreco(produto.faturamento)}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{produto.percentualFaturamento.toFixed(2)}%</td>
                              <td className="px-6 py-4 text-sm font-medium text-yellow-700">{produto.percentualAcumulado.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Classe C */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-red-50">
                      <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Classe C - Produtos de Baixa Rotação
                      </h3>
                      <p className="text-sm text-red-600 mt-1">Produtos com menor impacto no faturamento</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Faturamento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Acumulado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {dadosCurvaABC.classeC?.map((produto, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{produto.nome}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{produto.quantidade}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatarPreco(produto.faturamento)}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{produto.percentualFaturamento.toFixed(2)}%</td>
                              <td className="px-6 py-4 text-sm font-medium text-red-700">{produto.percentualAcumulado.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Relatório de Vendedores */}
              {relatorioAtivo === 'vendedores' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Resumo */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium mb-1">Total Vendedores</p>
                        <p className="text-2xl font-bold text-blue-700">{dadosVendedores.length}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-medium mb-1">Faturamento Total</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatarPreco(dadosVendedores.reduce((acc, v) => acc + v.totalFaturamento, 0))}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 font-medium mb-1">Total de Vendas</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {dadosVendedores.reduce((acc, v) => acc + v.totalVendas, 0)}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-orange-600 font-medium mb-1">Ticket Médio Geral</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {formatarPreco(dadosVendedores.length > 0 
                            ? (dadosVendedores.reduce((acc, v) => acc + v.totalFaturamento, 0) / 
                               dadosVendedores.reduce((acc, v) => acc + v.totalVendas, 0))
                            : 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabela */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ranking</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Vendas</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itens Vendidos</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Médio</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% do Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dadosVendedores.map((vendedor, index) => {
                          const totalGeral = dadosVendedores.reduce((acc, v) => acc + v.totalFaturamento, 0);
                          const percentual = (vendedor.totalFaturamento / totalGeral) * 100;
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                {index === 0 && (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold">
                                    🏆
                                  </span>
                                )}
                                {index === 1 && (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold">
                                    🥈
                                  </span>
                                )}
                                {index === 2 && (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold">
                                    🥉
                                  </span>
                                )}
                                {index > 2 && (
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-600 font-semibold text-sm">
                                    {index + 1}º
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{vendedor.vendedor}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{vendedor.totalVendas}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{vendedor.totalItens}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatarPreco(vendedor.totalFaturamento)}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{formatarPreco(vendedor.ticketMedio)}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ width: `${percentual}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{percentual.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Relatorios;
