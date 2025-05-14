// Script para gerar ícones PWA a partir de uma imagem
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Tamanhos de ícones necessários para PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Caminho para a imagem de origem (substitua pelo caminho da sua imagem)
const sourceImagePath = path.join(__dirname, 'public', 'logo-heai.webp');

// Pasta de destino para os ícones
const outputDir = path.join(__dirname, 'public', 'icons');

// Verificar se a pasta de destino existe, se não, criar
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Função principal para gerar os ícones
async function generateIcons() {
  try {
    console.log('Carregando imagem de origem...');
    const sourceImage = await loadImage(sourceImagePath);
    
    console.log('Gerando ícones...');
    
    // Gerar cada tamanho de ícone
    for (const size of iconSizes) {
      await generateIcon(sourceImage, size);
    }
    
    console.log('Todos os ícones foram gerados com sucesso!');
    console.log(`Os ícones estão na pasta: ${outputDir}`);
  } catch (error) {
    console.error('Erro ao gerar ícones:', error);
  }
}

// Função para gerar um ícone específico
async function generateIcon(sourceImage, size) {
  // Criar canvas com o tamanho desejado
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Desenhar um círculo com fundo preto e borda verde
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();
  
  // Borda verde
  ctx.strokeStyle = '#8BC34A'; // Verde similar ao da logo
  ctx.lineWidth = size * 0.03; // 3% do tamanho para a borda
  ctx.stroke();
  
  // Calcular dimensões para manter a proporção
  const scale = Math.min(
    (size * 0.8) / sourceImage.width,
    (size * 0.8) / sourceImage.height
  );
  
  const scaledWidth = sourceImage.width * scale;
  const scaledHeight = sourceImage.height * scale;
  const x = (size - scaledWidth) / 2;
  const y = (size - scaledHeight) / 2;
  
  // Desenhar a imagem centralizada
  ctx.drawImage(sourceImage, x, y, scaledWidth, scaledHeight);
  
  // Salvar o ícone
  const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Ícone ${size}x${size} gerado: ${outputPath}`);
}

// Executar a função principal
generateIcons();
