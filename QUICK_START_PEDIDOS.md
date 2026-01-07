# 🚀 Guia Rápido - Pedidos do Catálogo

## 🎯 Como Acessar

1. Faça login no sistema
2. Menu lateral → **"Pedidos Catálogo"**
3. Pronto! 🎉

## 📊 O Que Você Verá

### Cards no Topo
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Total Pedidos   │ Valor Total     │ Ticket Médio    │ Novos Pedidos   │
│     42          │  R$ 12.500,00   │  R$ 297,62      │      8          │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Filtros
```
🔍 Buscar...    [Status ▼]  [Origem ▼]  [📅 Data]
```

### Lista de Pedidos
```
┌──────────┬───────────────┬───────────┬──────────┬──────────┬──────────┬──────┐
│ Pedido   │ Cliente       │ Status    │ Origem   │ Valor    │ Data     │ Ver  │
├──────────┼───────────────┼───────────┼──────────┼──────────┼──────────┼──────┤
│ #0001    │ Julio         │ 🟢 Novo   │ Catálogo │ R$ 50,00 │ 06/01/26 │ 👁️   │
│ #0002    │ Maria Silva   │ 🟡 Proc.  │ WhatsApp │ R$ 75,00 │ 06/01/26 │ 👁️   │
└──────────┴───────────────┴───────────┴──────────┴──────────┴──────────┴──────┘
```

## 🎬 Fluxo Básico

### 1️⃣ Cliente Faz Pedido
```
Cliente no Catálogo
    ↓
Preenche formulário
    ↓
Clica "Finalizar Pedido"
    ↓
✅ Pedido criado com status "NOVO"
```

### 2️⃣ Você Gerencia
```
Recebe notificação
    ↓
Abre painel "Pedidos Catálogo"
    ↓
Clica no ícone 👁️ para ver detalhes
    ↓
Vê: Cliente, Items, Endereço, Total
    ↓
Muda status para "PROCESSANDO"
    ↓
Adiciona observação (opcional)
    ↓
Salva
```

### 3️⃣ Ciclo de Vida do Pedido
```
🟢 NOVO
   ↓ (confirma)
🟡 PROCESSANDO
   ↓ (separa produtos)
🟣 EM SEPARAÇÃO
   ↓ (envia)
🔵 ENVIADO
   ↓ (cliente recebe)
✅ ENTREGUE

(❌ CANCELADO pode ocorrer a qualquer momento)
```

## ⚡ Ações Rápidas

### Buscar Pedido Específico
```bash
# Na barra de busca, digite:
#0001          → Busca por número
João           → Busca por nome
84996474171    → Busca por telefone
```

### Filtrar por Status
```bash
[Status ▼] → Selecione "Novo"
# Resultado: Só pedidos novos
```

### Ver Pedidos do Dia
```bash
[📅 Data] → Selecione hoje
# Resultado: Só pedidos de hoje
```

### Limpar Filtros
```bash
Click em "❌ Limpar filtros"
# Volta a mostrar todos
```

## 🎨 Cores dos Status

| Cor | Status | Significa |
|-----|--------|-----------|
| 🔵 Azul | Novo | Acabou de chegar |
| 🟡 Amarelo | Processando | Você está vendo |
| 🟣 Roxo | Em Separação | Pegando produtos |
| 🔵 Índigo | Enviado | Saiu para entrega |
| 🟢 Verde | Entregue | Finalizado! |
| 🔴 Vermelho | Cancelado | Não vai mais |

## 📱 Modal de Detalhes

Ao clicar no ícone 👁️:

```
╔════════════════════════════════════════╗
║  PEDIDO #0001                      [X] ║
╠════════════════════════════════════════╣
║                                        ║
║  👤 DADOS DO CLIENTE                   ║
║  ────────────────────────────────────  ║
║  Nome: Julio                           ║
║  Tel: 84996474171                      ║
║  Email: julio@email.com                ║
║  End: Rua X, 123                       ║
║                                        ║
║  📦 ITENS DO PEDIDO                    ║
║  ────────────────────────────────────  ║
║  [img] Camiseta Preta                  ║
║        Preto - PP                      ║
║        1x R$ 50,00         R$ 50,00    ║
║                                        ║
║  💰 TOTAIS                             ║
║  ────────────────────────────────────  ║
║  Subtotal:            R$ 50,00         ║
║  Desconto:            R$ 0,00          ║
║  ────────────────────────────────────  ║
║  TOTAL:               R$ 50,00         ║
║                                        ║
║  �� ATUALIZAR STATUS                   ║
║  ────────────────────────────────────  ║
║  Novo Status: [Processando ▼]         ║
║  Observações: [_______________]        ║
║                                        ║
║  [ Salvar Alterações ]                 ║
║                                        ║
╚════════════════════════════════════════╝
```

## 💡 Dicas Pro

### 1. Organize por Prioridade
```
1️⃣ Filtre "Novo" → Processar primeiro
2️⃣ Filtre "Processando" → Separar produtos
3️⃣ Filtre "Em Separação" → Preparar envio
```

### 2. Use Observações
```
Boas:
✅ "Cliente pediu embrulho para presente"
✅ "Entregar pela manhã"
✅ "Confirmado por WhatsApp"

Ruins:
❌ "ok"
❌ "" (vazio)
```

### 3. Atalhos de Teclado
```
Tab       → Navegar entre filtros
Enter     → Aplicar busca
Esc       → Fechar modal
Ctrl+F    → Busca rápida na página
```

### 4. Workflow Eficiente
```
Manhã:
→ Ver card "Novos Pedidos"
→ Processar todos (Novo → Processando)

Tarde:
→ Separar produtos (Processando → Em Separação)
→ Preparar envios (Em Separação → Enviado)

Fim do dia:
→ Confirmar entregas (Enviado → Entregue)
→ Revisar pendências
```

## 🚨 Alertas Importantes

### ⚠️ Não Pode Editar
- Pedidos **Entregues**
- Pedidos **Cancelados**

### ⚠️ Sempre Adicione Observação
Ao mudar status para:
- **Cancelado** → Motivo do cancelamento
- **Enviado** → Código de rastreio
- **Processando** → Confirmação com cliente

### ⚠️ Verifique Antes de Enviar
- ✅ Endereço completo?
- ✅ Telefone correto?
- ✅ Todos os itens separados?
- ✅ Cliente confirmou?

## 🎯 Metas Diárias

Objetivo: **Zero pedidos "Novo" no fim do dia**

```
📊 Seu Progresso
Novos:         [ 8 ] → Meta: [ 0 ]
Processando:   [ 5 ] → Meta: [ 0 ]
Em Separação:  [ 3 ] → Meta: [ 0 ]
```

## 📞 Precisa de Ajuda?

### Problema: "Não vejo meus pedidos"
✅ Limpar filtros
✅ Verificar se está logado
✅ Atualizar página (F5)

### Problema: "Erro ao salvar status"
✅ Verificar internet
✅ Recarregar página
✅ Tentar novamente

### Problema: "Estatísticas erradas"
✅ Limpar cache (Ctrl+Shift+Delete)
✅ Recarregar página (Ctrl+F5)

---

**🎉 Pronto! Agora você é expert em gerenciar pedidos do catálogo!**

📚 Documentação completa: `GERENCIAMENTO_PEDIDOS_CATALOGO.md`
