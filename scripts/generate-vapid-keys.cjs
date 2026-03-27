#!/usr/bin/env node

const webpush = require('web-push');

// Gerar chaves VAPID
const vapidKeys = webpush.generateVAPIDKeys();

console.log('🔑 CHAVES VAPID GERADAS:');
console.log('========================================');
console.log('CHAVE PÚBLICA (frontend):');
console.log(vapidKeys.publicKey);
console.log('\nCHAVE PRIVADA (backend/segredo):');
console.log(vapidKeys.privateKey);
console.log('========================================\n');

console.log('📋 COMO CONFIGURAR:');
console.log('1. FRONTEND (nuxt.config.ts):');
console.log('   Adicione no manifest:');
console.log('   "gcm_sender_id": "103953800507"');
console.log('   E use a chave pública acima');
console.log('\n2. BACKEND (se tiver):');
console.log('   Use a chave privada para enviar notificações push');
console.log('\n3. SERVICE WORKER:');
console.log('   Adicione listener para evento "push"');

// Salvar em arquivo .env.example
const fs = require('fs');
const envContent = `# Chaves VAPID para notificações push
VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_SUBJECT=mailto:seu-email@exemplo.com
`;

fs.writeFileSync('.env.vapid.example', envContent);
console.log('\n✅ Arquivo .env.vapid.example criado com as chaves!');