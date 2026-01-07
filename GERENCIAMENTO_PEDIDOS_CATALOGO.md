# 📦 Gerenciamento de Pedidos do Catálogo

## 🎯 Visão Geral

Painel administrativo completo para gerenciar todos os pedidos recebidos através do catálogo online.

## ✨ Funcionalidades

### 📊 Dashboard de Estatísticas

Visualização em tempo real de:
- **Total de Pedidos**: Quantidade total de pedidos
- **Valor Total**: Soma do valor de todos os pedidos
- **Ticket Médio**: Valor médio por pedido
- **Novos Pedidos**: Quantidade de pedidos com status "novo"

### 🔍 Filtros Avançados

- **Busca**: Por número do pedido, nome do cliente ou telefone
- **Status**: Novo, Processando, Em Separação, Enviado, Entregue, Cancelado
- **Origem**: Catálogo Online, WhatsApp, Loja Física
- **Período**: Data inicial e final
- **Paginação**: 20 pedidos por página

### 📋 Lista de Pedidos

Tabela com informações principais:
- Número do pedido
- Nome e telefone do cliente
- Status atual (com cores)
- Origem do pedido
- Valor total
- Data de criação
- Ação para visualizar detalhes

### 👁️ Modal de Detalhes

Ao clicar em um pedido, exibe:

**Dados do Cliente:**
- Nome completo
- Telefone/WhatsApp
- E-mail (se informado)
- Endereço completo (se informado)

**Itens do Pedido:**
- Foto do produto
- Nome do produto
- Cor e tamanho
- Quantidade
- Preço unitário
- Subtotal por item

**Resumo Financeiro:**
- Subtotal
- Desconto (se houver)
- Valor total

**Gestão de Status:**
- Alterar status do pedido
- Adicionar observações
- Salvar alterações

### 🎨 Estados de Status

| Status | Cor | Descrição |
|--------|-----|-----------|
| Novo | Azul | Pedido recém-recebido |
| Processando | Amarelo | Em análise/confirmação |
| Em Separação | Roxo | Produtos sendo separados |
| Enviado | Índigo | Pedido despachado |
| Entregue | Verde | Pedido finalizado |
| Cancelado | Vermelho | Pedido cancelado |

## 🚀 Como Usar

### Acessar o Painel

1. Faça login no sistema
2. No menu lateral, clique em **"Pedidos Catálogo"**
3. Você verá a lista de todos os pedidos

### Filtrar Pedidos

1. Use a barra de busca para procurar por:
   - Número do pedido (ex: #0001)
   - Nome do cliente
   - Telefone

2. Selecione filtros específicos:
   - **Status**: Para ver pedidos em determinado estado
   - **Origem**: Para filtrar por canal de venda
   - **Data**: Para ver pedidos de um período

3. Clique em **"Limpar filtros"** para resetar

### Visualizar Detalhes

1. Clique no ícone 👁️ (olho) ao lado do pedido
2. Modal com todos os detalhes será aberto
3. Visualize:
   - Informações completas do cliente
   - Todos os itens do pedido com fotos
   - Valores detalhados

### Atualizar Status

1. No modal de detalhes, role até **"Atualizar Status"**
2. Selecione o novo status no dropdown
3. Adicione observações (opcional)
4. Clique em **"Salvar Alterações"**

**Nota**: Pedidos com status "Entregue" ou "Cancelado" não podem ser editados.

### Fluxo Recomendado

```
Novo → Processando → Em Separação → Enviado → Entregue
          ↓
      Cancelado (a qualquer momento antes do envio)
```

## 📱 Responsividade

A interface é totalmente responsiva:
- **Desktop**: Visualização completa em grade
- **Tablet**: Layout adaptado
- **Mobile**: Cards empilhados e menu hamburger

## 🔐 Segurança

- Apenas usuários autenticados podem acessar
- Filtro automático por tenant (multi-inquilino)
- Headers de autenticação em todas as requisições
- Validação de permissões no backend

## 🔄 Atualização Automática

- Estatísticas são atualizadas após cada ação
- Lista recarrega após mudança de status
- Sincronização em tempo real

## 📊 Estatísticas Dinâmicas

As estatísticas respondem aos filtros de data:
- Aplicar filtro de período atualiza os cards
- Valores são recalculados automaticamente
- Contadores refletem apenas o período selecionado

## 🎯 Endpoints da API

O componente utiliza:

```javascript
GET    /api/pedidos-catalogo              // Listar pedidos
GET    /api/pedidos-catalogo/estatisticas // Estatísticas
PATCH  /api/pedidos-catalogo/:id/status   // Atualizar status
```

## 💡 Dicas de Uso

1. **Priorize Novos Pedidos**: Use o card "Novos Pedidos" como referência
2. **Acompanhe Diariamente**: Configure filtro para "Hoje" regularmente
3. **Use Observações**: Documente informações importantes em cada mudança de status
4. **Organize por Status**: Filtre por status para processar pedidos em lote
5. **Busca Rápida**: Use Ctrl+F no navegador para busca rápida na página

## 🐛 Troubleshooting

### Pedidos não aparecem
- Verifique se há filtros ativos
- Clique em "Limpar filtros"
- Verifique se está logado na conta correta

### Erro ao atualizar status
- Verifique conexão com internet
- Atualize a página
- Verifique se o pedido não está já entregue/cancelado

### Estatísticas incorretas
- Limpe cache do navegador
- Recarregue a página com Ctrl+F5
- Verifique filtros de data

## 📈 Próximas Melhorias

Funcionalidades planejadas:
- [ ] Notificações em tempo real
- [ ] Exportar relatórios em PDF/Excel
- [ ] Integração com WhatsApp para envio de status
- [ ] Impressão de etiquetas de envio
- [ ] Histórico de alterações de status
- [ ] Comentários e notas internas
- [ ] Atribuição de pedidos a vendedores

## 🎓 Treinamento

Para capacitação da equipe:
1. Demonstre o fluxo completo de um pedido
2. Pratique mudanças de status
3. Ensine uso dos filtros
4. Explique importância das observações
5. Mostre como identificar pedidos prioritários

---

**Desenvolvido para**: Sistema de Gestão de Loja  
**Versão**: 1.0.0  
**Última atualização**: Janeiro 2026
