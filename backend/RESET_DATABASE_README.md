# 🗑️ Scripts de Reset do Banco de Dados

Scripts para limpar todos os dados do banco de dados e começar do zero.

## ⚠️ **ATENÇÃO**

**ESTES SCRIPTS APAGAM TODOS OS DADOS DE PRODUÇÃO!**

Use apenas quando:
- ✅ Estiver testando o sistema
- ✅ Quiser começar com banco limpo
- ✅ Remover dados de testes
- ❌ **NUNCA** use em produção com dados reais

---

## 📋 Opção 1: Script Node.js (Recomendado)

### Vantagens:
- ✅ Aviso de 5 segundos antes de executar
- ✅ Feedback detalhado do processo
- ✅ Tratamento de erros
- ✅ Verificação de sucesso

### Como usar:

```bash
cd backend
node reset-database.js
```

### O que ele remove:
- ✅ Todas as vendas
- ✅ Todos os produtos e estoque
- ✅ Todos os clientes
- ✅ Todos os fornecedores
- ✅ Todas as ordens de compra
- ✅ Todas as contas a pagar/receber
- ✅ Todos os caixas
- ✅ Todas as assinaturas

### O que ele mantém:
- 🔒 Usuários (para manter acesso)
- 🔒 Configurações do sistema
- 🔒 Planos disponíveis

### Para remover usuários também:

Edite o arquivo `reset-database.js` e descomente esta linha:

```javascript
// console.log('👤 Removendo usuários...');
// await sequelize.query('DELETE FROM usuarios WHERE funcao != \'super-admin\';');
```

---

## 📋 Opção 2: Script SQL

### Vantagens:
- ✅ Execução direta no Neon SQL Editor
- ✅ Não precisa baixar código localmente
- ✅ Mais rápido para quem prefere SQL

### Como usar:

1. Acesse [Neon Console](https://console.neon.tech)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Abra o arquivo `reset-database.sql`
5. Copie e cole no editor
6. Execute

### Para remover usuários também:

Descomente esta linha no SQL:

```sql
-- DELETE FROM usuarios WHERE funcao != 'super-admin';
```

---

## 🔄 Ordem de Execução

Os scripts removem dados na seguinte ordem (respeitando chaves estrangeiras):

```
1. Itens de venda → Vendas
2. Estoque → Variações → Produtos
3. Itens de ordem → Ordens de compra → Fornecedores
4. Contas a pagar
5. Contas a receber
6. Clientes
7. Caixas
8. Assinaturas
9. (Opcional) Usuários
```

---

## 📊 Verificação Pós-Reset

Após executar o script, você pode verificar o estado do banco:

### Via Node.js:
O script já mostra um resumo automaticamente.

### Via SQL:
```sql
SELECT 'vendas' as tabela, COUNT(*) as total FROM vendas
UNION ALL
SELECT 'produtos', COUNT(*) FROM produtos
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios;
```

---

## 🛡️ Segurança

### Proteções implementadas:

1. **Aviso de 5 segundos** (script Node.js)
2. **Mantém super-admin** sempre
3. **Mantém configurações** do sistema
4. **Mantém planos** cadastrados
5. **Log detalhado** de todas as operações

### Recomendações:

- ⚠️ **Faça backup** antes de executar
- ⚠️ **Nunca execute em produção** sem certeza absoluta
- ⚠️ **Avise a equipe** antes de limpar o banco
- ⚠️ **Teste primeiro** em ambiente de desenvolvimento

---

## 🔄 Após o Reset

### Próximos passos:

1. ✅ Sistema limpo e pronto para usar
2. ✅ Faça login com usuário existente
3. ✅ Ou crie novo usuário via `/register`
4. ✅ Configure sua loja em Configurações
5. ✅ Adicione produtos, clientes, etc.

### Se removeu usuários:

1. Crie novo usuário via endpoint `/api/auth/register`
2. Ou execute o script `create-test-user.js`
3. Ou crie direto no banco via SQL:

```sql
INSERT INTO usuarios (id, nome, email, senha, funcao, tenant_id, criado_em, atualizado_em)
VALUES (
  gen_random_uuid(),
  'Admin',
  'admin@loja.com',
  '$2b$10$hash_aqui', -- Use bcrypt para gerar
  'admin',
  'tenant_default',
  NOW(),
  NOW()
);
```

---

## 📝 Logs

### Script Node.js gera logs como:
```
🚨 ATENÇÃO: Este script vai APAGAR TODOS OS DADOS!
⏳ Aguardando 5 segundos... Pressione Ctrl+C para cancelar.

🔄 Conectando ao banco de dados...
✅ Conectado!

🗑️  Limpando dados...

📦 Removendo itens de venda...
💰 Removendo vendas...
📊 Removendo estoque...
...

✅ Banco de dados limpo com sucesso!
```

---

## ❓ Troubleshooting

### Erro: "Cannot delete because of foreign key constraint"
- ✅ O script já lida com isso usando `SET session_replication_role`
- ⚠️ Se persistir, execute o SQL manualmente linha por linha

### Erro: "Connection refused"
- ✅ Verifique suas credenciais do banco
- ✅ Confirme que `DATABASE_URL` está configurada
- ✅ Teste conexão: `psql $DATABASE_URL`

### Erro: "Permission denied"
- ✅ Seu usuário precisa ter permissão DELETE
- ✅ Use um usuário admin do banco

---

## 🎯 Casos de Uso

### 1. Limpar dados de teste
```bash
node reset-database.js
```

### 2. Preparar demo para cliente
```bash
node reset-database.js
# Depois adicione dados de exemplo
```

### 3. Desenvolvimento local
```bash
node reset-database.js
# Desenvolva com banco limpo
```

### 4. Corrigir dados corrompidos
```bash
node reset-database.js
# Reimporte dados corretos
```

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique os logs de erro
2. Confira as permissões do banco
3. Teste conexão manualmente
4. Execute linha por linha no SQL Editor

---

**Última atualização:** 6 de janeiro de 2026
