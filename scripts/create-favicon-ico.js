#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretórios
const publicDir = path.join(__dirname, '..', 'public');
const outputFile = path.join(publicDir, 'favicon.ico');

console.log('Criando favicon.ico válido...');

// Para criar um ICO válido, precisamos de um formato específico
// Vamos criar um ICO simples com os favicons PNG existentes
// Como não temos uma biblioteca ICO, vamos usar uma abordagem alternativa:
// Criar um ICO manualmente com estrutura básica

// Primeiro, vamos ler os PNGs
const png16 = path.join(publicDir, 'favicon-16x16.png');
const png32 = path.join(publicDir, 'favicon-32x32.png');

// Verificar se os arquivos existem
if (!fs.existsSync(png16) || !fs.existsSync(png32)) {
  console.error('Arquivos PNG não encontrados!');
  process.exit(1);
}

// Como não temos uma biblioteca para criar ICOs, vamos usar uma solução alternativa:
// 1. Instalar o ImageMagick se possível
// 2. Ou usar o favicon-32x32.png como favicon.ico (renomeando)
// 3. Ou criar um ICO simples manualmente

// Solução mais simples: converter SVG para PNG primeiro, depois para ICO
// Mas como não temos ImageMagick, vamos usar uma abordagem diferente:

console.log('Usando favicon-32x32.png como favicon.ico temporariamente...');

// Ler o conteúdo do favicon-32x32.png
try {
  const pngContent = fs.readFileSync(png32);
  
  // Verificar se é um PNG válido
  if (pngContent.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
    console.log('PNG válido detectado');
    
    // Para um ICO real, precisaríamos converter, mas para agora
    // vamos apenas copiar o PNG como ICO (não ideal, mas funciona para alguns navegadores)
    // Na verdade, isso não funcionará. Precisamos de uma solução melhor.
    
    // Vamos criar um ICO manualmente simples
    // Estrutura básica de ICO:
    // 1. Cabeçalho ICO (6 bytes)
    // 2. Entrada de diretório (16 bytes por imagem)
    // 3. Dados da imagem (PNG)
    
    // Como é complexo, vamos usar uma abordagem mais prática:
    // Baixar um favicon.ico de exemplo ou usar uma ferramenta online
    
    console.log('Criando favicon.ico com estrutura básica...');
    
    // Para simplificar, vamos criar um ICO usando o favicon-16x16.png
    // Vamos escrever um ICO muito simples
    const createSimpleICO = () => {
      // Cabeçalho ICO: 0x00000100 (reservado, tipo ICO, número de imagens)
      const header = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01, 0x00]);
      
      // Entrada de diretório para 16x16 32-bit
      const dirEntry = Buffer.from([
        0x10, 0x10, // largura (16)
        0x10, 0x10, // altura (16)
        0x00,       // número de cores (0 = 256+)
        0x00,       // reservado
        0x01, 0x00, // planos de cores (1)
        0x20, 0x00, // bits por pixel (32)
        0x00, 0x00, 0x00, 0x00, // tamanho dos dados (placeholder)
        0x16, 0x00, 0x00, 0x00  // offset dos dados (22 bytes)
      ]);
      
      // Dados da imagem (vamos usar o PNG)
      const pngData = fs.readFileSync(png16);
      
      // Atualizar tamanho dos dados na entrada de diretório
      dirEntry.writeUInt32LE(pngData.length, 8);
      
      // Combinar tudo
      const icoData = Buffer.concat([header, dirEntry, pngData]);
      
      return icoData;
    };
    
    try {
      const icoData = createSimpleICO();
      fs.writeFileSync(outputFile, icoData);
      console.log(`✅ favicon.ico criado com sucesso (${icoData.length} bytes)`);
    } catch (error) {
      console.error('Erro ao criar ICO:', error.message);
      console.log('Fazendo fallback para cópia do PNG...');
      fs.copyFileSync(png32, outputFile);
      console.log('⚠️ favicon.ico criado como cópia do PNG (pode não ser válido)');
    }
  } else {
    console.log('Arquivo não é um PNG válido, copiando como está...');
    fs.copyFileSync(png32, outputFile);
  }
} catch (error) {
  console.error('Erro:', error.message);
  
  // Fallback: criar um SVG simples como favicon.ico
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#1976d2"/>
  <circle cx="16" cy="10.666" r="5.333" fill="white" opacity="0.9"/>
  <rect x="8" y="21.333" width="16" height="2.666" rx="1.333" fill="white" opacity="0.9"/>
  <rect x="12" y="26.666" width="8" height="1.333" rx="0.666" fill="white" opacity="0.7"/>
</svg>`;
  
  fs.writeFileSync(outputFile, svgContent);
  console.log('⚠️ favicon.ico criado como SVG (não ideal)');
}

console.log('\nNota: Para um favicon.ico válido, considere:');
console.log('1. Instalar ImageMagick: sudo apt-get install imagemagick');
console.log('2. Converter: convert favicon-16x16.png favicon-32x32.png favicon.ico');
console.log('3. Ou usar uma ferramenta online para converter PNG para ICO');