# 🧹 Limpeza e Organização do Projeto

Análise de arquivos para organizar o projeto e remover arquivos temporários ou desnecessários.

---

## 📁 Arquivos para REMOVER (Scripts de migração já executados)

### Backend - Scripts de correção já aplicados:
```
✅ PODE REMOVER - Já foram executados:

backend/add-cancel-fields.js                    # ✅ Campo de cancelamento já adicionado
backend/add-logo-config.sql                     # ✅ Duplicado (temos add-logo-configs.sql)
backend/add-logo-configs.js                     # ✅ Duplicado (temos .sql)
backend/add-tenant-column.js                    # ✅ Coluna tenant já existe
backend/add_default_configuracoes.js            # ✅ Configurações já criadas
backend/fix-configuracoes-constraint.js         # ✅ Constraint já corrigida
backend/fix-findByPk.py                         # ✅ Script Python temporário
backend/fix-tenant-filters.py                   # ✅ Script Python temporário
backend/fix-tenant-type.js                      # ✅ Tipo de tenant já corrigido
backend/fix-user-tenant.js                      # ✅ Tenant de usuário já corrigido
backend/fix-user-tenant.sql                     # ✅ Duplicado do .js
backend/fix-vendas-tenant.js                    # ✅ Vendas já corrigidas
backend/migrate-tenant.js                       # ✅ Migração já executada
backend/populate-tenant-ids.js                  # ✅ Tenant IDs já populados
backend/rename-tenantid-column.js               # ✅ Coluna já renomeada
backend/update-tenant-id-nullable.js            # ✅ Nullable já atualizado
backend/update-user-role-enum.js                # ✅ ENUM já atualizado
backend/check-user-tenant.js                    # ✅ Script de debug temporário
```

### Backend - Arquivos de teste/debug temporários:
```
✅ PODE REMOVER:

backend/create-second-tenant.js                 # Script de teste
backend/create-test-accounts.js                 # Script de teste
backend/create-test-user.js                     # Script de teste
backend/list-tables.js                          # Script de debug
backend/sync-database.js                        # Perigoso - pode destruir dados
backend/test-import.js                          # Script de teste
backend/e_orders (deveria ser pedidos_compra)   # Nome errado - texto solto
backend/tgres psql -U postgres...               # Comando solto - não é arquivo
```

### Backend - Logs:
```
✅ PODE REMOVER:

backend/backend.log                             # Log temporário
backend/server.log                              # Log temporário
```

### Root - Arquivos temporários:
```
✅ PODE REMOVER:

backend.log                                     # Log duplicado
server.log                                      # Log duplicado
nohup.out                                       # Log de execução
decode-token-cli.js                            # Script de debug
decode-token.html                              # Script de debug HTML
check-render-deploy.sh                         # Script de teste de deploy
test-render-middleware.sh                      # Script de teste
trigger-render-deploy.sh                       # Script manual de deploy
update-fetch-headers.sh                        # Script de correção já aplicado
```

### Root - Pastas vazias ou duplicadas:
```
⚠️ VERIFICAR SE ESTÃO VAZIAS:

config/                                         # Pode estar vazia (tem em backend/config)
migrations/                                     # Pode estar vazia (tem em backend/src/migrations)
models/                                         # Pode estar vazia (tem em backend/src/models)
seeders/                                        # Pode estar vazia (tem em backend/src/seeders)
node_modules/                                   # Dependências - verificar se necessário na raiz
```

---

## 📁 Arquivos para MANTER

### Backend - Scripts úteis:
```
✅ MANTER:

backend/create-super-admin.js                   # Útil para criar super-admin
backend/create-tenant-for-user.js              # Útil para criar tenant para usuário
backend/reset-database.js                       # Script de limpeza do banco
backend/reset-database.sql                      # Versão SQL do reset
backend/delete-test-users.sql                   # Útil para deletar usuários de teste
backend/delete-users-quick.sql                  # Versão rápida do delete
backend/EXECUTAR_NO_NEON.sql                   # Script de configuração inicial
backend/add-logo-configs.sql                    # Script de configuração de logo
backend/start-production.js                     # Script de produção
backend/build.sh                                # Script de build
```

### Documentação:
```
✅ MANTER:

CORRECOES_APLICADAS.md                         # Histórico de correções
DEPLOY.md                                       # Instruções de deploy
DEPLOY_README.md                                # Instruções de deploy
DEPLOY_RENDER.md                                # Deploy específico Render
IDENTIDADE_VISUAL_README.md                    # Docs de identidade visual
INTEGRACAO.md                                   # Docs de integração
PRODUCAO_CHECKLIST.md                          # Checklist de produção
README.md                                       # Documentação principal
SUPER_ADMIN_README.md                          # Docs de super-admin
backend/RESET_DATABASE_README.md               # Docs de reset do banco
```

### Configuração:
```
✅ MANTER:

.env                                            # Variáveis de ambiente (NÃO COMMITAR)
.env.example                                    # Exemplo de .env
.env.production                                 # Produção (NÃO COMMITAR)
.gitignore                                      # Ignorar arquivos do Git
render.yaml                                     # Configuração Render
package.json                                    # Dependências raiz
backend/package.json                            # Dependências backend
frontend/package.json                           # Dependências frontend
```

---

## 🗂️ Organização Sugerida

### Criar pasta para scripts antigos:
```bash
mkdir -p backend/scripts/migration-old
mkdir -p backend/scripts/debug-old
mkdir -p backend/scripts/useful
```

### Mover scripts úteis:
```bash
mv backend/create-super-admin.js backend/scripts/useful/
mv backend/create-tenant-for-user.js backend/scripts/useful/
mv backend/reset-database.* backend/scripts/useful/
mv backend/delete-*.sql backend/scripts/useful/
```

### Mover scripts antigos:
```bash
mv backend/add-*.js backend/scripts/migration-old/
mv backend/fix-*.js backend/scripts/migration-old/
mv backend/fix-*.py backend/scripts/migration-old/
mv backend/migrate-*.js backend/scripts/migration-old/
mv backend/populate-*.js backend/scripts/migration-old/
mv backend/rename-*.js backend/scripts/migration-old/
mv backend/update-*.js backend/scripts/migration-old/
```

### Mover scripts de debug:
```bash
mv backend/create-test-*.js backend/scripts/debug-old/
mv backend/list-tables.js backend/scripts/debug-old/
mv backend/test-import.js backend/scripts/debug-old/
mv backend/check-user-tenant.js backend/scripts/debug-old/
```

---

## 🧹 Script de Limpeza Rápida

```bash
cd /home/julio/Documentos/www/loja_v2

# Remover logs
rm -f backend.log server.log nohup.out
rm -f backend/backend.log backend/server.log

# Remover arquivos de texto soltos
rm -f backend/e_orders*
rm -f backend/tgres*

# Remover scripts de debug temporários
rm -f decode-token-cli.js decode-token.html
rm -f check-render-deploy.sh test-render-middleware.sh
rm -f trigger-render-deploy.sh update-fetch-headers.sh

# Verificar pastas vazias (NÃO DELETE SE TIVER ARQUIVOS)
# rmdir config/ migrations/ models/ seeders/ 2>/dev/null || true
```

---

## ⚠️ Antes de Remover

### 1. Fazer backup
```bash
cd /home/julio/Documentos/www/loja_v2
tar -czf backup-scripts-$(date +%Y%m%d).tar.gz backend/*.js backend/*.py backend/*.sql
```

### 2. Commitar tudo antes
```bash
git add -A
git commit -m "backup: Antes de limpar scripts antigos"
git push
```

### 3. Criar branch para limpeza
```bash
git checkout -b cleanup/organize-files
# Fazer limpeza
git add -A
git commit -m "chore: Organizar e remover scripts antigos"
git push -u origin cleanup/organize-files
```

---

## 📊 Resumo

| Categoria | Quantidade | Ação |
|-----------|-----------|------|
| Scripts de migração executados | ~20 arquivos | MOVER para `/scripts/migration-old/` |
| Scripts de teste/debug | ~10 arquivos | MOVER para `/scripts/debug-old/` |
| Scripts úteis | ~8 arquivos | MANTER ou MOVER para `/scripts/useful/` |
| Logs temporários | ~5 arquivos | REMOVER |
| Documentação | ~10 arquivos | MANTER |
| Configuração | ~8 arquivos | MANTER |

**Total a organizar:** ~53 arquivos  
**Espaço liberado estimado:** 5-10 MB  
**Ganho:** Projeto mais limpo e organizado  

---

## ✅ Próximos Passos

1. ✅ Revisar esta lista
2. ✅ Fazer backup (tar.gz)
3. ✅ Criar branch de limpeza
4. ✅ Executar scripts de organização
5. ✅ Testar se tudo funciona
6. ✅ Commitar e fazer merge

**Quer que eu execute a limpeza automaticamente?** 🧹
