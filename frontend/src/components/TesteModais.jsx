import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ModalSucesso from './ModalSucesso';
import ModalErro from './ModalErro';
import ModalConfirmacao from './ModalConfirmacao';

const TesteModais = () => {
  const [modalSucesso, setModalSucesso] = useState({ isOpen: false, mensagem: '' });
  const [modalErro, setModalErro] = useState({ isOpen: false, mensagem: '' });
  const [modalConfirmacao, setModalConfirmacao] = useState({ isOpen: false, tipo: 'warning' });

  return (
    <div className="flex min-h-screen bg-background-light">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between whitespace-nowrap border-b border-slate-200 px-6 h-16 bg-white">
          <h1 className="text-slate-900 text-3xl font-bold leading-tight">Teste de Modais</h1>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Card de Teste - Modal Sucesso */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Modal de Sucesso</h2>
              <p className="text-slate-600 mb-4">
                Use este modal para confirmar ações bem-sucedidas, como salvar dados, criar registros, etc.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalSucesso({ 
                    isOpen: true, 
                    mensagem: 'O produto foi cadastrado e as informações foram salvas.' 
                  })}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Testar Modal de Sucesso
                </button>
              </div>
            </div>

            {/* Card de Teste - Modal Erro */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Modal de Erro</h2>
              <p className="text-slate-600 mb-4">
                Use este modal para exibir mensagens de erro e dar opção de tentar novamente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalErro({ 
                    isOpen: true, 
                    mensagem: 'Falha ao salvar o produto. Verifique sua conexão e tente novamente.' 
                  })}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Testar Modal de Erro (Simples)
                </button>
                <button
                  onClick={() => setModalErro({ 
                    isOpen: true, 
                    mensagem: 'Falha ao conectar com o servidor.',
                    onRetry: () => {
                      console.log('Tentando novamente...');
                      setModalErro({ isOpen: false, mensagem: '' });
                    }
                  })}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Testar Modal de Erro (Com Retry)
                </button>
              </div>
            </div>

            {/* Card de Teste - Modal Confirmação Warning */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Modal de Confirmação - Warning</h2>
              <p className="text-slate-600 mb-4">
                Use este modal para alertas importantes que requerem confirmação do usuário.
              </p>
              <button
                onClick={() => setModalConfirmacao({ isOpen: true, tipo: 'warning' })}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                Testar Warning
              </button>
            </div>

            {/* Card de Teste - Modal Confirmação Danger */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Modal de Confirmação - Danger</h2>
              <p className="text-slate-600 mb-4">
                Use este modal para ações destrutivas como deletar registros permanentemente.
              </p>
              <button
                onClick={() => setModalConfirmacao({ isOpen: true, tipo: 'danger' })}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Testar Danger
              </button>
            </div>

            {/* Card de Teste - Modal Confirmação Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Modal de Confirmação - Info</h2>
              <p className="text-slate-600 mb-4">
                Use este modal para informações importantes que precisam de confirmação.
              </p>
              <button
                onClick={() => setModalConfirmacao({ isOpen: true, tipo: 'info' })}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Testar Info
              </button>
            </div>

            {/* Exemplos de Código */}
            <div className="bg-slate-900 rounded-xl p-6 text-white">
              <h2 className="text-xl font-semibold mb-4">Exemplo de Código</h2>
              <pre className="text-sm overflow-x-auto">
{`// 1. Importar os componentes
import ModalSucesso from './ModalSucesso';
import ModalErro from './ModalErro';
import ModalConfirmacao from './ModalConfirmacao';

// 2. Criar estados
const [modalSucesso, setModalSucesso] = useState({ 
  isOpen: false, 
  mensagem: '' 
});

// 3. Abrir o modal
setModalSucesso({ 
  isOpen: true, 
  mensagem: 'Operação realizada com sucesso!' 
});

// 4. Adicionar no JSX
<ModalSucesso
  isOpen={modalSucesso.isOpen}
  onClose={() => setModalSucesso({ isOpen: false, mensagem: '' })}
  titulo="Sucesso!"
  mensagem={modalSucesso.mensagem}
/>`}
              </pre>
            </div>
          </div>
        </main>
      </div>

      {/* Modais */}
      <ModalSucesso
        isOpen={modalSucesso.isOpen}
        onClose={() => setModalSucesso({ isOpen: false, mensagem: '' })}
        titulo="Operação realizada com sucesso!"
        mensagem={modalSucesso.mensagem}
      />

      <ModalErro
        isOpen={modalErro.isOpen}
        onClose={() => setModalErro({ isOpen: false, mensagem: '' })}
        titulo="Ocorreu um Erro!"
        mensagem={modalErro.mensagem}
        onRetry={modalErro.onRetry}
      />

      <ModalConfirmacao
        isOpen={modalConfirmacao.isOpen}
        onClose={() => setModalConfirmacao({ isOpen: false, tipo: 'warning' })}
        onConfirm={() => {
          console.log('Ação confirmada!');
          setModalConfirmacao({ isOpen: false, tipo: 'warning' });
        }}
        titulo={
          modalConfirmacao.tipo === 'warning' ? 'Atenção!' :
          modalConfirmacao.tipo === 'danger' ? 'Deseja realmente excluir?' :
          'Informação importante'
        }
        mensagem={
          modalConfirmacao.tipo === 'warning' ? 'Esta ação pode afetar outros registros. Deseja continuar?' :
          modalConfirmacao.tipo === 'danger' ? 'Esta ação não pode ser desfeita. Tem certeza?' :
          'Você está prestes a realizar uma ação importante. Confirmar?'
        }
        tipo={modalConfirmacao.tipo}
        textoBotaoConfirmar={modalConfirmacao.tipo === 'danger' ? 'Excluir' : 'Confirmar'}
      />
    </div>
  );
};

export default TesteModais;
