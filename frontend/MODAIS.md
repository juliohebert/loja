# 🎨 Guia de Uso dos Modais

Este guia demonstra como usar os novos componentes de modal no projeto.

## 📦 Componentes Disponíveis

### 1. Modal Base (`Modal.jsx`)
Componente base reutilizável para criar modais customizados.

```jsx
import Modal from './components/Modal';

<Modal isOpen={isOpen} onClose={handleClose} size="md">
  {/* Seu conteúdo aqui */}
</Modal>
```

**Props:**
- `isOpen` (boolean): Controla se o modal está visível
- `onClose` (function): Função chamada ao clicar fora do modal
- `size` (string): Tamanho do modal - 'sm', 'md', 'lg', 'xl'
- `children` (ReactNode): Conteúdo do modal

---

### 2. Modal de Sucesso (`ModalSucesso.jsx`)
Modal para exibir mensagens de sucesso.

```jsx
import ModalSucesso from './components/ModalSucesso';

const [modalSucesso, setModalSucesso] = useState({ isOpen: false, mensagem: '' });

// Exibir o modal
setModalSucesso({ 
  isOpen: true, 
  mensagem: 'O produto foi cadastrado com sucesso!' 
});

// No JSX
<ModalSucesso
  isOpen={modalSucesso.isOpen}
  onClose={() => setModalSucesso({ isOpen: false, mensagem: '' })}
  titulo="Operação realizada com sucesso!"
  mensagem={modalSucesso.mensagem}
  textoBotao="OK"
/>
```

**Props:**
- `isOpen` (boolean): Controla visibilidade
- `onClose` (function): Função ao fechar
- `titulo` (string): Título do modal (opcional)
- `mensagem` (string): Mensagem descritiva
- `textoBotao` (string): Texto do botão (padrão: "OK")

---

### 3. Modal de Erro (`ModalErro.jsx`)
Modal para exibir mensagens de erro.

```jsx
import ModalErro from './components/ModalErro';

const [modalErro, setModalErro] = useState({ isOpen: false, mensagem: '' });

// Exibir o modal
setModalErro({ 
  isOpen: true, 
  mensagem: 'Falha ao salvar o produto. Verifique os dados.' 
});

// No JSX
<ModalErro
  isOpen={modalErro.isOpen}
  onClose={() => setModalErro({ isOpen: false, mensagem: '' })}
  titulo="Ocorreu um Erro!"
  mensagem={modalErro.mensagem}
  textoBotao="Tentar Novamente"
  onRetry={handleRetry} // Opcional
/>
```

**Props:**
- `isOpen` (boolean): Controla visibilidade
- `onClose` (function): Função ao fechar/cancelar
- `onRetry` (function): Função ao clicar em "Tentar Novamente" (opcional)
- `titulo` (string): Título do modal (opcional)
- `mensagem` (string): Mensagem descritiva
- `textoBotao` (string): Texto do botão (padrão: "Tentar Novamente")

**Nota:** Se `onRetry` for fornecido, o modal exibirá dois botões: "Cancelar" e o botão de ação.

---

### 4. Modal de Confirmação (`ModalConfirmacao.jsx`)
Modal para confirmações de ações (deletar, alterar, etc).

```jsx
import ModalConfirmacao from './components/ModalConfirmacao';

const [modalConfirmar, setModalConfirmar] = useState(false);

// No JSX
<ModalConfirmacao
  isOpen={modalConfirmar}
  onClose={() => setModalConfirmar(false)}
  onConfirm={handleDelete}
  titulo="Deseja realmente excluir?"
  mensagem="Esta ação não pode ser desfeita."
  tipo="danger" // 'warning', 'danger', 'info'
  textoBotaoConfirmar="Excluir"
  textoBotaoCancelar="Cancelar"
/>
```

**Props:**
- `isOpen` (boolean): Controla visibilidade
- `onClose` (function): Função ao cancelar
- `onConfirm` (function): Função ao confirmar
- `titulo` (string): Título do modal
- `mensagem` (string): Mensagem descritiva
- `tipo` (string): Tipo do modal - 'warning', 'danger', 'info'
- `textoBotaoConfirmar` (string): Texto do botão de confirmação
- `textoBotaoCancelar` (string): Texto do botão de cancelamento

---

## 🎨 Tipos de Modal de Confirmação

### Warning (Amarelo)
```jsx
<ModalConfirmacao tipo="warning" titulo="Atenção!" />
```

### Danger (Vermelho)
```jsx
<ModalConfirmacao tipo="danger" titulo="Deseja excluir?" />
```

### Info (Azul)
```jsx
<ModalConfirmacao tipo="info" titulo="Informação importante" />
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Substituir `alert()` de sucesso

**Antes:**
```jsx
alert('Produto salvo com sucesso!');
navigate('/estoque');
```

**Depois:**
```jsx
setModalSucesso({ 
  isOpen: true, 
  mensagem: 'O produto foi cadastrado e as informações foram salvas.' 
});

// No JSX
<ModalSucesso
  isOpen={modalSucesso.isOpen}
  onClose={() => {
    setModalSucesso({ isOpen: false, mensagem: '' });
    navigate('/estoque');
  }}
  titulo="Produto cadastrado!"
  mensagem={modalSucesso.mensagem}
/>
```

---

### Exemplo 2: Substituir `alert()` de erro

**Antes:**
```jsx
alert(`Erro ao salvar produto: ${error.message}`);
```

**Depois:**
```jsx
setModalErro({ 
  isOpen: true, 
  mensagem: error.message || 'Falha ao salvar o produto.' 
});

// No JSX
<ModalErro
  isOpen={modalErro.isOpen}
  onClose={() => setModalErro({ isOpen: false, mensagem: '' })}
  titulo="Erro ao salvar produto"
  mensagem={modalErro.mensagem}
/>
```

---

### Exemplo 3: Substituir `confirm()`

**Antes:**
```jsx
if (confirm('Deseja realmente remover este item?')) {
  handleDelete(id);
}
```

**Depois:**
```jsx
const [itemParaDeletar, setItemParaDeletar] = useState(null);

// Ao clicar em deletar
setItemParaDeletar(id);

// No JSX
<ModalConfirmacao
  isOpen={itemParaDeletar !== null}
  onClose={() => setItemParaDeletar(null)}
  onConfirm={() => {
    handleDelete(itemParaDeletar);
    setItemParaDeletar(null);
  }}
  titulo="Deseja realmente remover?"
  mensagem="Esta ação não pode ser desfeita."
  tipo="danger"
  textoBotaoConfirmar="Remover"
/>
```

---

## 🎯 Boas Práticas

1. **Sempre use estado para controlar os modais:**
```jsx
const [modalSucesso, setModalSucesso] = useState({ isOpen: false, mensagem: '' });
```

2. **Limpe o estado ao fechar:**
```jsx
onClose={() => setModalSucesso({ isOpen: false, mensagem: '' })}
```

3. **Use mensagens descritivas:**
```jsx
// ✅ BOM
mensagem: 'O produto foi cadastrado e as informações foram salvas no estoque.'

// ❌ RUIM
mensagem: 'Sucesso!'
```

4. **Navegue após fechar o modal de sucesso:**
```jsx
<ModalSucesso
  onClose={() => {
    setModalSucesso({ isOpen: false, mensagem: '' });
    navigate('/dashboard');
  }}
/>
```

---

## 🎨 Customização

Os modais usam as classes Tailwind definidas no `tailwind.config.js` e incluem animações:

- `animate-fadeIn`: Fade in suave do overlay
- `animate-scaleIn`: Scale in do modal
- `animate-bounce`: Animação do ícone de sucesso
- `animate-shake`: Animação do ícone de erro

Para adicionar novas animações, edite o `tailwind.config.js`:

```javascript
keyframes: {
  minhaAnimacao: {
    '0%': { transform: 'translateY(-100%)' },
    '100%': { transform: 'translateY(0)' },
  },
},
animation: {
  minhaAnimacao: 'minhaAnimacao 0.3s ease-out',
},
```

---

## 📝 Checklist de Migração

Para migrar todos os `alert()` e `confirm()` do projeto:

- [ ] Importar os componentes de modal
- [ ] Criar estados para controlar os modais
- [ ] Substituir `alert()` por `setModal...({ isOpen: true, mensagem: '...' })`
- [ ] Substituir `confirm()` por `ModalConfirmacao`
- [ ] Adicionar os componentes de modal no JSX
- [ ] Testar todos os fluxos
- [ ] Remover console.log desnecessários

---

## 🚀 Próximos Passos

Componentes sugeridos para implementar:
- Modal de Loading (com spinner)
- Modal de Formulário (para edição inline)
- Toast Notifications (notificações não-bloqueantes)
- Modal com Steps (wizard)
