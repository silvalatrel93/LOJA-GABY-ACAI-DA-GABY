/**
 * Script para definir a senha do administrador no arquivo .env.local
 * 
 * Uso: node scripts/set-admin-password.js sua_senha_aqui
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.resolve(process.cwd(), '.env.local');

// Função para ler o arquivo .env.local
async function readEnvFile() {
  try {
    if (fs.existsSync(envPath)) {
      return fs.readFileSync(envPath, 'utf8');
    }
    return '';
  } catch (error) {
    console.error('Erro ao ler o arquivo .env.local:', error);
    return '';
  }
}

// Função para atualizar ou adicionar a variável NEXT_PUBLIC_ADMIN_PASSWORD
async function updateEnvFile(password) {
  try {
    let envContent = await readEnvFile();
    
    // Verificar se a variável já existe
    const passwordRegex = /^NEXT_PUBLIC_ADMIN_PASSWORD=.*/m;
    
    if (passwordRegex.test(envContent)) {
      // Substituir a variável existente
      envContent = envContent.replace(
        passwordRegex,
        `NEXT_PUBLIC_ADMIN_PASSWORD=${password}`
      );
    } else {
      // Adicionar a variável ao final do arquivo
      envContent = envContent.trim();
      envContent += envContent ? '\n\n' : '';
      envContent += `# Senha do painel administrativo\nNEXT_PUBLIC_ADMIN_PASSWORD=${password}\n`;
    }
    
    // Salvar o arquivo atualizado
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('Senha do administrador definida com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar o arquivo .env.local:', error);
  }
}

// Função principal
async function main() {
  // Verificar se a senha foi fornecida como argumento
  let password = process.argv[2];
  
  // Se não foi fornecida, solicitar ao usuário
  if (!password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    password = await new Promise((resolve) => {
      rl.question('Digite a senha do administrador: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
  
  // Validar a senha
  if (!password || password.length < 6) {
    console.error('A senha deve ter pelo menos 6 caracteres!');
    process.exit(1);
  }
  
  // Atualizar o arquivo .env.local
  await updateEnvFile(password);
}

main();
