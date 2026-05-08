const https = require('https');

const FRONTEND_URL = 'https://loja-seven-theta.vercel.app';
const BACKEND_URL = 'https://loja-api-w7km.onrender.com';
const CHECK_INTERVAL = 15000; // 15 segundos
const MAX_CHECKS = 40; // 10 minutos máximo

let checkCount = 0;
let frontendOk = false;
let backendOk = false;

console.log('🚀 Monitorando deploy...\n');
console.log(`Frontend: ${FRONTEND_URL}`);
console.log(`Backend: ${BACKEND_URL}`);
console.log('─'.repeat(60));

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function checkDeploy() {
  checkCount++;
  
  console.log(`\n[${new Date().toLocaleTimeString()}] Verificação #${checkCount}`);
  
  if (!frontendOk) {
    frontendOk = await checkUrl(FRONTEND_URL);
    console.log(`Frontend: ${frontendOk ? '✅ OK' : '⏳ Aguardando...'}`);
  } else {
    console.log('Frontend: ✅ OK');
  }
  
  if (!backendOk) {
    backendOk = await checkUrl(`${BACKEND_URL}/health`);
    console.log(`Backend: ${backendOk ? '✅ OK' : '⏳ Aguardando...'}`);
  } else {
    console.log('Backend: ✅ OK');
  }
  
  if (frontendOk && backendOk) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEPLOY CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`\n✅ Frontend disponível em: ${FRONTEND_URL}`);
    console.log(`✅ Backend disponível em: ${BACKEND_URL}`);
    console.log(`\n⏱️  Tempo total: ${Math.floor(checkCount * CHECK_INTERVAL / 1000)}s`);
    process.exit(0);
  }
  
  if (checkCount >= MAX_CHECKS) {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  TIMEOUT - Deploy ainda não concluído');
    console.log('='.repeat(60));
    console.log('\nStatus:');
    console.log(`  Frontend: ${frontendOk ? '✅ OK' : '❌ Não disponível'}`);
    console.log(`  Backend: ${backendOk ? '✅ OK' : '❌ Não disponível'}`);
    console.log('\nVerifique manualmente:');
    console.log(`  - Vercel: https://vercel.com/dashboard`);
    console.log(`  - Render: https://dashboard.render.com`);
    process.exit(1);
  }
  
  setTimeout(checkDeploy, CHECK_INTERVAL);
}

// Iniciar monitoramento
checkDeploy();
