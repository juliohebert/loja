const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Loja de Roupas',
      version: '1.0.0',
      description: 'API completa para gerenciamento de loja de roupas com controle de produtos, estoque, clientes e financeiro',
      contact: {
        name: 'Suporte API',
        email: 'suporte@loja.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido no endpoint de login'
        }
      },
      schemas: {
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'ID do usuário' },
            nome: { type: 'string', description: 'Nome do usuário' },
            email: { type: 'string', format: 'email', description: 'Email do usuário' },
            funcao: { type: 'string', enum: ['admin', 'user'], description: 'Função do usuário' },
            criadoEm: { type: 'string', format: 'date-time', description: 'Data de criação' },
            atualizadoEm: { type: 'string', format: 'date-time', description: 'Data de atualização' }
          }
        },
        Produto: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'ID do produto' },
            nome: { type: 'string', description: 'Nome do produto' },
            descricao: { type: 'string', description: 'Descrição do produto' },
            marca: { type: 'string', description: 'Marca' },
            categoria: { type: 'string', description: 'Categoria' },
            precoCusto: { type: 'number', format: 'float', description: 'Preço de custo' },
            precoVenda: { type: 'number', format: 'float', description: 'Preço de venda' },
            imagens: { type: 'array', items: { type: 'string' }, description: 'URLs das imagens' },
            ativo: { type: 'boolean', description: 'Produto ativo' },
            variacoes: { type: 'array', items: { $ref: '#/components/schemas/Variacao' }, description: 'Variações do produto' }
          }
        },
        Variacao: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'ID da variação' },
            produtoId: { type: 'string', format: 'uuid', description: 'ID do produto' },
            sku: { type: 'string', description: 'SKU da variação' },
            tamanho: { type: 'string', description: 'Tamanho (P, M, G, etc)' },
            cor: { type: 'string', description: 'Cor' },
            codigoBarras: { type: 'string', description: 'Código de barras' },
            estoque: { $ref: '#/components/schemas/Estoque', description: 'Dados de estoque' }
          }
        },
        Estoque: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'ID do estoque' },
            variacaoId: { type: 'string', format: 'uuid', description: 'ID da variação' },
            quantidade: { type: 'integer', description: 'Quantidade em estoque' },
            limiteMinimo: { type: 'integer', description: 'Limite mínimo de estoque' },
            localizacao: { type: 'string', description: 'Localização física' }
          }
        },
        Cliente: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'ID do cliente' },
            nome: { type: 'string', description: 'Nome completo' },
            cpf: { type: 'string', description: 'CPF (apenas números)' },
            telefone: { type: 'string', description: 'Telefone' },
            email: { type: 'string', format: 'email', description: 'Email' },
            endereco: { type: 'string', description: 'Endereço completo' },
            cidade: { type: 'string', description: 'Cidade' },
            estado: { type: 'string', description: 'UF do estado' },
            cep: { type: 'string', description: 'CEP' },
            debito: { type: 'number', format: 'float', description: 'Valor total de débito' },
            limiteCredito: { type: 'number', format: 'float', description: 'Limite de crédito' },
            observacoes: { type: 'string', description: 'Observações gerais' },
            ativo: { type: 'boolean', description: 'Cliente ativo' },
            transacoes: { type: 'array', items: { $ref: '#/components/schemas/TransacaoCliente' }, description: 'Histórico de transações' }
          }
        },
        TransacaoCliente: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'ID da transação' },
            clienteId: { type: 'string', format: 'uuid', description: 'ID do cliente' },
            tipo: { type: 'string', enum: ['adicionar', 'pagar', 'aumentar-credito', 'diminuir-credito'], description: 'Tipo de transação' },
            valor: { type: 'number', format: 'float', description: 'Valor da transação' },
            descricao: { type: 'string', description: 'Descrição da transação' },
            data: { type: 'string', format: 'date', description: 'Data da transação' },
            dataHora: { type: 'string', format: 'date-time', description: 'Data e hora de registro' }
          }
        },
        Erro: {
          type: 'object',
          properties: {
            erro: { type: 'string', description: 'Mensagem de erro' },
            detalhes: { type: 'string', description: 'Detalhes do erro' }
          }
        },
        Sucesso: {
          type: 'object',
          properties: {
            mensagem: { type: 'string', description: 'Mensagem de sucesso' },
            dados: { type: 'object', description: 'Dados retornados' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints de autenticação e gerenciamento de usuários'
      },
      {
        name: 'Produtos',
        description: 'Gerenciamento de produtos e variações'
      },
      {
        name: 'Estoque',
        description: 'Controle de estoque'
      },
      {
        name: 'Clientes',
        description: 'Gerenciamento de clientes'
      },
      {
        name: 'Transações',
        description: 'Gestão de débitos e créditos de clientes'
      },
      {
        name: 'Sistema',
        description: 'Endpoints de sistema e monitoramento'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
