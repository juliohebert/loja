// Decodificar token JWT manualmente
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI3NzM5ZWZmLTI3NTUtNGJhNC1hYjU5LTYwZDYwYTA3MjU2NCIsImVtYWlsIjoianVsaW9AZW1haWwuY29tIiwiZnVuY2FvIjoic3VwZXItYWRtaW4iLCJwZXJtaXNzb2VzIjp7fSwiYXRpdm8iOnRydWUsInRlbmFudElkIjpudWxsLCJpYXQiOjE3MzYxNzQyNDEsImV4cCI6MTczNjc3OTA0MX0.69a0p3F_JWODS__JJg2xovUDONj2PAyJJ55Y3J7AkBI";

const parts = token.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

console.log('\n🔍 Token decodificado:');
console.log(JSON.stringify(payload, null, 2));
console.log('\n⚠️  tenantId:', payload.tenantId);
console.log('🎭 Função:', payload.funcao);
