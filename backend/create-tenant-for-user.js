const { Sequelize } = require('sequelize');

// Conectar ao banco de dados Neon
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aqfY3Ih6vZUj@ep-delicate-forest-a-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function createTenantForUser() {
  try {
    // Buscar o usuário
    const [users] = await sequelize.query(`
      SELECT id, nome, email, tenant_id 
      FROM usuarios 
      WHERE email = 'juliohebertds@gmail.com'
    `);

    if (!users.length) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    const user = users[0];
    console.log('👤 Usuário encontrado:', user);

    // Verificar se já tem tenant
    if (user.tenant_id) {
      console.log('✅ Usuário já tem tenant_id:', user.tenant_id);
      return;
    }

    // Criar tenant
    const tenantId = require('crypto').randomUUID();
    const [tenant] = await sequelize.query(`
      INSERT INTO tenants (id, nome, cnpj, "createdAt", "updatedAt")
      VALUES (:id, :nome, :cnpj, NOW(), NOW())
      RETURNING *
    `, {
      replacements: {
        id: tenantId,
        nome: 'Loja ModaStore',
        cnpj: '00.000.000/0001-00'
      }
    });

    console.log('🏪 Tenant criado:', tenant[0]);

    // Atualizar usuário com tenant_id
    await sequelize.query(`
      UPDATE usuarios 
      SET tenant_id = :tenantId
      WHERE id = :userId
    `, {
      replacements: {
        tenantId: tenantId,
        userId: user.id
      }
    });

    console.log('✅ Usuário atualizado com tenant_id');
    console.log('\n🎉 Pronto! Agora faça login novamente.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

createTenantForUser();
