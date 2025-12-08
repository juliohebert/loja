import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Entrar from './components/Entrar';
import Registrar from './components/Registrar';
import EsqueciSenha from './components/EsqueciSenha';
import CriarProduto from './components/CriarProduto';
import Dashboard from './components/Dashboard';
import ControleEstoque from './components/ControleEstoque';
import PDV from './components/PDV';
import Financeiro from './components/Financeiro';
import NovoLancamento from './components/NovoLancamento';
import Clientes from './components/Clientes';
import NovoCliente from './components/NovoCliente';
import GerenciarDebitos from './components/GerenciarDebitos';
import Caixa from './components/Caixa';
import Configuracoes from './components/Configuracoes';
import Relatorios from './components/Relatorios';
import Usuarios from './components/Usuarios';
import Trocas from './components/Trocas';
import Fornecedores from './components/Fornecedores';
import OrdensCompra from './components/OrdensCompra';
import ContasPagarReceber from './components/ContasPagarReceber';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Entrar />} />
        <Route path="/register" element={<Registrar />} />
        <Route path="/forgot-password" element={<EsqueciSenha />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<CriarProduto />} />
        <Route path="/products/editar/:id" element={<CriarProduto />} />
        <Route path="/estoque" element={<ControleEstoque />} />
        <Route path="/vendas" element={<PDV />} />
        <Route path="/trocas" element={<Trocas />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/financeiro/novo" element={<NovoLancamento />} />
        <Route path="/financeiro/editar/:id" element={<NovoLancamento />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/novo" element={<NovoCliente />} />
        <Route path="/clientes/editar/:id" element={<NovoCliente />} />
        <Route path="/clientes/debitos/:id" element={<GerenciarDebitos />} />
        <Route path="/caixa" element={<Caixa />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/ordens-compra" element={<OrdensCompra />} />
          <Route path="/contas" element={<ContasPagarReceber />} />
      </Routes>
    </Router>
  );
}

export default App
