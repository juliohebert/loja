const { sequelize } = require('../config/database');

async function createStore() {
  try {
    const storeData = {
      nome_loja: 'Loja Julio',
      email: 'juliohebertds@gmail.com',
      senha: 'securepassword123', // Replace with a hashed password in production
      cnpj: '12345678000199',
      telefone: '(11) 98765-4321',
      endereco: 'Rua Exemplo, 123, São Paulo, SP',
      responsavel: 'Julio Hebert',
      plano: 'premium',
      db_name: 'loja_julio_db',
    };

    const query = `
      INSERT INTO lojas_master (
        nome_loja, email, senha, cnpj, telefone, endereco, responsavel, plano, db_name
      ) VALUES (
        :nome_loja, :email, :senha, :cnpj, :telefone, :endereco, :responsavel, :plano, :db_name
      );
    `;

    await sequelize.query(query, { replacements: storeData });

    console.log('✅ Loja criada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar loja:', error);
    process.exit(1);
  }
}

createStore();