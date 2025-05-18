// Script para corrigir a configuração de metadados nas páginas Next.js
const fs = require('fs');
const path = require('path');

// Diretórios a serem verificados
const directories = [
  path.join(__dirname, '..', 'app'),
];

// Função recursiva para encontrar arquivos
function findFiles(dir, pattern, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, pattern, fileList);
    } else if (pattern.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Encontrar todos os arquivos page.tsx e layout.tsx
const tsxFiles = findFiles(directories[0], /page\.tsx$|layout\.tsx$/);

// Contador de arquivos corrigidos
let correctedFiles = 0;

// Processar cada arquivo
tsxFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Verificar se o arquivo importa Metadata e tem viewport no objeto metadata
  if (content.includes('type { Metadata }') && (content.includes('viewport:') || content.includes('themeColor:'))) {
    console.log(`Processando arquivo: ${filePath}`);

    // Atualizar o import para incluir Viewport
    if (!content.includes('Viewport')) {
      content = content.replace('type { Metadata }', 'type { Metadata, Viewport }');
      modified = true;
    }

    // Extrair o objeto metadata
    const metadataRegex = /export\s+const\s+metadata\s*:\s*Metadata\s*=\s*{([^}]*)}/s;
    const metadataMatch = content.match(metadataRegex);

    if (metadataMatch) {
      let metadataContent = metadataMatch[1];
      let viewportValue = null;
      let themeColorValue = null;

      // Verificar se há viewport no metadata
      const viewportRegex = /viewport\s*:\s*"([^"]*)"/;
      const viewportMatch = metadataContent.match(viewportRegex);
      if (viewportMatch) {
        viewportValue = viewportMatch[1];
        // Remover viewport do metadata
        metadataContent = metadataContent.replace(/,?\s*viewport\s*:\s*"([^"]*)"\s*,?/g, '');
        modified = true;
      }

      // Verificar se há themeColor no metadata
      const themeColorRegex = /themeColor\s*:\s*"([^"]*)"/;
      const themeColorMatch = metadataContent.match(themeColorRegex);
      if (themeColorMatch) {
        themeColorValue = themeColorMatch[1];
        // Remover themeColor do metadata
        metadataContent = metadataContent.replace(/,?\s*themeColor\s*:\s*"([^"]*)"\s*,?/g, '');
        modified = true;
      }

      // Limpar vírgulas extras e formatação
      metadataContent = metadataContent.replace(/,,/g, ',');
      metadataContent = metadataContent.replace(/,\s*}/g, '}');

      // Atualizar o objeto metadata
      const updatedMetadata = `export const metadata: Metadata = {${metadataContent}}`;
      content = content.replace(metadataRegex, updatedMetadata);

      // Adicionar exportação de viewport se necessário
      if (viewportValue || themeColorValue) {
        const viewportParts = [];
        
        if (viewportValue) {
          // Converter string de viewport em objeto
          if (viewportValue.includes('width=device-width')) {
            viewportParts.push('  width: "device-width"');
          }
          if (viewportValue.includes('initial-scale=1')) {
            viewportParts.push('  initialScale: 1');
          }
          if (viewportValue.includes('maximum-scale=1')) {
            viewportParts.push('  maximumScale: 1');
          }
        }
        
        if (themeColorValue) {
          viewportParts.push(`  themeColor: "${themeColorValue}"`);
        }

        const viewportExport = `\nexport const viewport: Viewport = {\n${viewportParts.join(',\n')}\n};\n`;
        
        // Inserir após o metadata
        content = content.replace(updatedMetadata, `${updatedMetadata}\n${viewportExport}`);
      }
    }

    // Salvar o arquivo modificado
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Arquivo corrigido: ${filePath}`);
      correctedFiles++;
    }
  }
});

console.log(`\nTarefa concluída! ${correctedFiles} arquivos foram corrigidos.`);
