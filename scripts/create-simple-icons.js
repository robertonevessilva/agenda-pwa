#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para os ícones
const colors = {
  primary: '#1976d2',
  light: '#42a5f5',
  dark: '#1565c0'
};

// Tamanhos dos ícones
const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 96, name: 'favicon-96x96.png' },
  { size: 128, name: 'favicon-128x128.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 512, name: 'icon-maskable-512.png' }
];

// Diretório de saída
const outputDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Criando ícones simples para Agenda PWA...');

// Função para criar um PNG simples em base64
function createSimplePNG(size, isMaskable = false) {
  // Para ícones simples, vamos criar um canvas básico
  // Em produção real, seria melhor usar uma biblioteca como canvas
  // Mas para demonstração, vamos criar arquivos placeholder
  
  const canvas = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${isMaskable 
    ? `<rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${colors.primary}"/>`
    : `<rect width="${size}" height="${size}" fill="${colors.primary}"/>
       <circle cx="${size/2}" cy="${size/3}" r="${size/6}" fill="white" opacity="0.9"/>
       <rect x="${size/4}" y="${size * 2/3}" width="${size/2}" height="${size/12}" rx="${size/24}" fill="white" opacity="0.9"/>
       <rect x="${size * 3/8}" y="${size * 5/6}" width="${size/4}" height="${size/24}" rx="${size/48}" fill="white" opacity="0.7"/>`
  }
</svg>`;
  
  return Buffer.from(canvas);
}

// Gerar ícones em diferentes tamanhos
sizes.forEach(({ size, name }) => {
  const outputPath = path.join(outputDir, name);
  const isMaskable = name.includes('maskable');
  
  try {
    const pngData = createSimplePNG(size, isMaskable);
    fs.writeFileSync(outputPath, pngData);
    console.log(`✓ ${name} (${size}x${size}) ${isMaskable ? '- maskable' : ''}`);
  } catch (error) {
    console.error(`✗ Erro ao criar ${name}:`, error.message);
  }
});

// Criar favicon.ico simples (apenas copiar o 32x32)
try {
  const favicon32 = path.join(outputDir, 'favicon-32x32.png');
  const faviconOutput = path.join(outputDir, 'favicon.ico');
  
  // Para simplificar, vamos copiar o favicon-32x32.png como favicon.ico
  // Em produção real, seria necessário converter para .ico
  fs.copyFileSync(favicon32, faviconOutput);
  console.log('✓ favicon.ico criado (cópia do 32x32)');
} catch (error) {
  console.error('✗ Erro ao criar favicon.ico:', error.message);
}

console.log('\n✅ Ícones simples criados com sucesso em:', outputDir);
console.log('\nArquivos criados:');
sizes.forEach(({ name }) => {
  const filePath = path.join(outputDir, name);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  - ${name} (${stats.size} bytes)`);
  }
});

console.log('\nNota: Estes são ícones placeholder SVG. Em produção, converta para PNG usando uma ferramenta como ImageMagick ou uma biblioteca Node.js.');