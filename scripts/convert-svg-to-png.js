#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretórios
const publicDir = path.join(__dirname, '..', 'public');

// Lista de arquivos SVG com extensão .png (que são realmente SVGs)
const svgFiles = [
  { input: 'favicon-16x16.png', size: 16 },
  { input: 'favicon-32x32.png', size: 32 },
  { input: 'favicon-96x96.png', size: 96 },
  { input: 'favicon-128x128.png', size: 128 },
  { input: 'icon-192.png', size: 192 },
  { input: 'icon-512.png', size: 512 },
  { input: 'icon-maskable-512.png', size: 512, maskable: true }
];

console.log('Convertendo SVGs para PNGs reais...');

async function convertSvgToPng(inputFile, outputFile, size, isMaskable = false) {
  try {
    // Ler o conteúdo do arquivo
    const content = fs.readFileSync(path.join(publicDir, inputFile), 'utf8');
    
    // Verificar se é realmente um SVG
    if (!content.includes('<svg')) {
      console.log(`⚠️ ${inputFile} não parece ser um SVG, pulando...`);
      return false;
    }
    
    console.log(`Convertendo ${inputFile} para ${size}x${size} PNG...`);
    
    // Se for maskable, adicionar border-radius ao SVG
    let svgContent = content;
    if (isMaskable && content.includes('<rect')) {
      // Adicionar border-radius ao retângulo para ícone maskable
      const radius = size * 0.2;
      svgContent = content.replace(
        /<rect[^>]*>/,
        `<rect width="${size}" height="${size}" rx="${radius}" fill="#1976d2"/>`
      );
    }
    
    // Converter SVG para PNG usando sharp
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, outputFile || inputFile));
    
    console.log(`✅ ${inputFile} convertido para PNG`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao converter ${inputFile}:`, error.message);
    return false;
  }
}

async function createFaviconICO() {
  try {
    console.log('\nCriando favicon.ico...');
    
    // Ler o PNG de 16x16
    const png16Path = path.join(publicDir, 'favicon-16x16.png');
    const png32Path = path.join(publicDir, 'favicon-32x32.png');
    
    // Verificar se os PNGs existem
    if (!fs.existsSync(png16Path) || !fs.existsSync(png32Path)) {
      console.log('⚠️ PNGs não encontrados, criando favicon.ico simples...');
      // Criar um favicon.ico simples usando sharp
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <rect width="32" height="32" fill="#1976d2"/>
        <circle cx="16" cy="10.666" r="5.333" fill="white" opacity="0.9"/>
        <rect x="8" y="21.333" width="16" height="2.666" rx="1.333" fill="white" opacity="0.9"/>
        <rect x="12" y="26.666" width="8" height="1.333" rx="0.666" fill="white" opacity="0.7"/>
      </svg>`;
      
      await sharp(Buffer.from(svgContent))
        .resize(32, 32)
        .toFile(path.join(publicDir, 'favicon.ico'));
      
      console.log('✅ favicon.ico criado (PNG)');
      return;
    }
    
    // Para um ICO real, precisaríamos de uma biblioteca específica
    // Por enquanto, vamos usar o favicon-32x32.png como favicon.ico
    // (alguns navegadores aceitam PNG como favicon)
    fs.copyFileSync(png32Path, path.join(publicDir, 'favicon.ico'));
    console.log('✅ favicon.ico criado (cópia do favicon-32x32.png)');
    
    console.log('\n⚠️ Nota: Para um favicon.ico real com múltiplos tamanhos,');
    console.log('considere usar uma ferramenta online ou instalar ImageMagick:');
    console.log('convert favicon-16x16.png favicon-32x32.png favicon.ico');
    
  } catch (error) {
    console.error('❌ Erro ao criar favicon.ico:', error.message);
  }
}

async function main() {
  console.log('Iniciando conversão de ícones...\n');
  
  // Converter cada arquivo SVG
  let successCount = 0;
  for (const file of svgFiles) {
    const success = await convertSvgToPng(
      file.input, 
      file.input, // mesmo nome (sobrescrever)
      file.size,
      file.maskable
    );
    if (success) successCount++;
  }
  
  // Criar favicon.ico
  await createFaviconICO();
  
  console.log(`\n✅ Conversão concluída: ${successCount}/${svgFiles.length} arquivos convertidos`);
  console.log('\nOs ícones agora são PNGs reais e devem funcionar no Vercel!');
}

main().catch(console.error);