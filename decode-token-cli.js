// Decodificar token JWT manualmente
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImM4ODEwNGQ1LTExZGMtNDRlMC1iMGEyLWE3MzA3YjUxNzgiLCJlbWFpbCI6Imp1bGlvMUBlbWFpbC5jb20iLCJmdW5jYW8iOiJhZG1pbiIsInRlbmFudElkIjpudWxsLCJpYXQiOjE3MzYxNzgxNzgsImV4cCI6MTczNjc4Mjk3OH0.HhxHpMbBggU89pvTin341MqWDRaCOkfGjfy_cP0mnh8";

const parts = token.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

console.log('\n🔍 Token decodificado:');
console.log(JSON.stringify(payload, null, 2));
console.log('\n⚠️  tenantId:', payload.tenantId);
console.log('🎭 Função:', payload.funcao);
console.log('📧 Email:', payload.email);
