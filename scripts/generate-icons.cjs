#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Verificar se o ImageMagick está instalado
try {
  execSync('which convert', { stdio: 'pipe' });
} catch (error) {
  console.error('ImageMagick não está instalado. Instale com:');
  console.error('sudo apt-get install imagemagick');
  process.exit(1);
}

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

console.log('Gerando ícones para Agenda PWA...');

// Criar um SVG simples como base
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${colors.primary}"/>
  <circle cx="256" cy="200" r="80" fill="white" opacity="0.9"/>
  <rect x="160" y="320" width="192" height="40" rx="20" fill="white" opacity="0.9"/>
  <rect x="200" y="380" width="112" height="20" rx="10" fill="white" opacity="0.7"/>
</svg>
`;

const svgPath = path.join(outputDir, 'icon-template.svg');
fs.writeFileSync(svgPath, svgContent);

// Gerar ícones em diferentes tamanhos
sizes.forEach(({ size, name }) => {
  const outputPath = path.join(outputDir, name);
  
  try {
    // Para ícones maskable, adicionar padding
    if (name.includes('maskable')) {
      const paddedSize = Math.floor(size * 0.8);
      const padding = Math.floor((size - paddedSize) / 2);
      
      execSync(`convert -size ${size}x${size} xc:none \
        -fill "${colors.primary}" \
        -draw "roundrectangle ${padding},${padding} ${size-padding},${size-padding} ${size*0.2},${size*0.2}" \
        ${outputPath}`);
      
      console.log(`✓ ${name} (${size}x${size}) - maskable`);
    } else {
      // Converter SVG para PNG
      execSync(`convert -size ${size}x${size} ${svgPath} ${outputPath}`);
      console.log(`✓ ${name} (${size}x${size})`);
    }
  } catch (error) {
    console.error(`✗ Erro ao gerar ${name}:`, error.message);
  }
});

// Criar favicon.ico (combinando múltiplos tamanhos)
try {
  const favicon16 = path.join(outputDir, 'favicon-16x16.png');
  const favicon32 = path.join(outputDir, 'favicon-32x32.png');
  const faviconOutput = path.join(outputDir, 'favicon.ico');
  
  execSync(`convert ${favicon16} ${favicon32} ${faviconOutput}`);
  console.log('✓ favicon.ico gerado');
} catch (error) {
  console.error('✗ Erro ao gerar favicon.ico:', error.message);
}

// Limpar arquivo temporário
fs.unlinkSync(svgPath);

console.log('\n✅ Ícones gerados com sucesso em:', outputDir);
console.log('\nArquivos gerados:');
sizes.forEach(({ name }) => {
  const filePath = path.join(outputDir, name);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  - ${name} (${stats.size} bytes)`);
  }
});

console.log('\nPara usar os ícones, certifique-se de que o manifest.json está configurado corretamente.');