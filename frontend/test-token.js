// Script de teste para verificar headers
console.clear();
console.log('=== TESTE DE AUTENTICAÇÃO ===\n');

const token = localStorage.getItem('token');
console.log('1. Token no localStorage:', token ? '✅ Presente' : '❌ Ausente');

if (token) {
    console.log('   Token (início):', token.substring(0, 50) + '...');
    
    // Decodificar token
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        
        console.log('\n2. Token decodificado:');
        console.log('   - ID:', decoded.id);
        console.log('   - Email:', decoded.email);
        console.log('   - TenantId:', decoded.tenantId);
        console.log('   - Tipo:', decoded.tipo_usuario);
        console.log('   - Expira em:', new Date(decoded.exp * 1000).toLocaleString());
        
        console.log('\n3. Headers que seriam enviados:');
        console.log('   - Authorization: Bearer ' + token.substring(0, 20) + '...');
        console.log('   - x-tenant-id:', decoded.tenantId || '❌ AUSENTE!');
        console.log('   - Content-Type: application/json');
        
        if (!decoded.tenantId) {
            console.error('\n❌ PROBLEMA: Token não contém tenantId!');
        } else {
            console.log('\n✅ Token válido com tenantId:', decoded.tenantId);
        }
    } catch (error) {
        console.error('❌ Erro ao decodificar token:', error);
    }
} else {
    console.error('❌ Faça login primeiro!');
}

console.log('\n=== FIM DO TESTE ===');
