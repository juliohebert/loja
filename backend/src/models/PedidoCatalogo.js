const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PedidoCatalogo = sequelize.define('PedidoCatalogo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_pedido: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Número único do pedido (ex: #2458)'
  },
  cliente_nome: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Nome completo do cliente'
  },
  cliente_telefone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Telefone/WhatsApp do cliente'
  },
  cliente_email: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Email do cliente (opcional)'
  },
  cliente_endereco: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Endereço completo do cliente'
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array de itens do pedido com produto_id, nome, tamanho, cor, quantidade, preco_unitario'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Subtotal antes de descontos'
  },
  desconto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Valor total de desconto'
  },
  valor_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Valor total do pedido (subtotal - desconto)'
  },
  status: {
    type: DataTypes.ENUM('novo', 'processando', 'separacao', 'enviado', 'entregue', 'cancelado'),
    allowNull: false,
    defaultValue: 'novo',
    comment: 'Status atual do pedido'
  },
  origem: {
    type: DataTypes.ENUM('whatsapp', 'catalogo', 'loja_fisica'),
    allowNull: false,
    defaultValue: 'catalogo',
    comment: 'Canal de origem do pedido'
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observações adicionais do cliente'
  },
  tenant_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'default',
    comment: 'ID do tenant (multi-tenancy)'
  }
}, {
  tableName: 'pedidos_catalogo',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['numero_pedido']
    },
    {
      fields: ['cliente_telefone']
    },
    {
      fields: ['criado_em']
    }
  ]
});

// Método para gerar número de pedido único
PedidoCatalogo.gerarNumeroPedido = async function(tenantId) {
  const ultimoPedido = await this.findOne({
    where: { tenant_id: tenantId },
    order: [['id', 'DESC']]
  });

  const proximoNumero = ultimoPedido ? ultimoPedido.id + 1 : 1;
  return `#${String(proximoNumero).padStart(4, '0')}`;
};

// Método para calcular total
PedidoCatalogo.prototype.calcularTotal = function() {
  const subtotal = this.items.reduce((total, item) => {
    return total + (parseFloat(item.preco_unitario) * parseInt(item.quantidade));
  }, 0);
  
  this.subtotal = subtotal;
  this.valor_total = subtotal - parseFloat(this.desconto || 0);
};

module.exports = PedidoCatalogo;
