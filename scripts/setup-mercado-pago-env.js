/**
 * Script de Configuração - Variáveis de Ambiente Mercado Pago
 * 
 * Este script ajuda a configurar as variáveis de ambiente necessárias
 * Execute: node scripts/setup-mercado-pago-env.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Caminho para o arquivo .env.local
const ENV_FILE = path.join(process.cwd(), '.env.local');

/**
 * Gerar chave de criptografia segura
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Gerar webhook secret
 */
function generateWebhookSecret() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Ler arquivo .env.local existente
 */
function readExistingEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    return {};
  }
  
  const content = fs.readFileSync(ENV_FILE, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

/**
 * Escrever variáveis no arquivo .env.local
 */
function writeEnvFile(envVars) {
  const lines = [];
  
  // Adicionar header
  lines.push('# Configurações do Mercado Pago - PediFacil');
  lines.push('# Gerado automaticamente em: ' + new Date().toISOString());
  lines.push('');
  
  // Adicionar variáveis
  Object.entries(envVars).forEach(([key, value]) => {
    lines.push(`${key}=${value}`);
  });
  
  lines.push(''); // Linha em branco no final
  
  fs.writeFileSync(ENV_FILE, lines.join('\n'), 'utf8');
}

/**
 * Validar se as variáveis necessárias estão presentes
 */
function validateEnvironment(env) {
  const required = [
    'ENCRYPTION_KEY',
    'NEXT_PUBLIC_APP_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    console.log('❌ Variáveis obrigatórias faltando:');
    missing.forEach(key => {
      console.log(`   - ${key}`);
    });
    return false;
  }
  
  return true;
}

/**
 * Configuração interativa
 */
function setupEnvironment() {
  console.log('🔧 Configurando variáveis de ambiente para Mercado Pago\n');
  
  // Ler arquivo existente
  const existingEnv = readExistingEnv();
  console.log('📁 Arquivo .env.local:', fs.existsSync(ENV_FILE) ? 'encontrado' : 'será criado');
  
  // Variáveis necessárias
  const envVars = { ...existingEnv };
  
  // 1. Chave de criptografia
  if (!envVars.ENCRYPTION_KEY) {
    envVars.ENCRYPTION_KEY = generateEncryptionKey();
    console.log('🔐 Chave de criptografia gerada automaticamente');
  } else {
    console.log('🔐 Chave de criptografia já existe');
  }
  
  // 2. Webhook secret
  if (!envVars.MERCADO_PAGO_WEBHOOK_SECRET) {
    envVars.MERCADO_PAGO_WEBHOOK_SECRET = generateWebhookSecret();
    console.log('🔔 Webhook secret gerado automaticamente');
  } else {
    console.log('🔔 Webhook secret já existe');
  }
  
  // 3. URL da aplicação
  if (!envVars.NEXT_PUBLIC_APP_URL) {
    envVars.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    console.log('🌐 URL da aplicação definida como: http://localhost:3000');
    console.log('   💡 Altere para sua URL de produção quando necessário');
  } else {
    console.log('🌐 URL da aplicação já configurada:', envVars.NEXT_PUBLIC_APP_URL);
  }
  
  // 4. Chave pública do Mercado Pago (sandbox por padrão)
  if (!envVars.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
    envVars.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = 'TEST-SUBSTITUA-PELA-SUA-CHAVE-PUBLICA';
    console.log('🔑 Chave pública do Mercado Pago definida como placeholder');
    console.log('   ⚠️  IMPORTANTE: Substitua pela sua chave pública real');
  } else {
    console.log('🔑 Chave pública do Mercado Pago já configurada');
  }
  
  // 5. Verificar Supabase
  if (!envVars.SUPABASE_URL) {
    console.log('⚠️  SUPABASE_URL não encontrada - necessária para o banco de dados');
    envVars.SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
  }
  
  if (!envVars.SUPABASE_ANON_KEY) {
    console.log('⚠️  SUPABASE_ANON_KEY não encontrada - necessária para o banco de dados');
    envVars.SUPABASE_ANON_KEY = 'SUA-CHAVE-ANONIMA-DO-SUPABASE';
  }
  
  // Escrever arquivo
  writeEnvFile(envVars);
  console.log('\n✅ Arquivo .env.local atualizado com sucesso!');
  
  // Validar configuração
  console.log('\n🔍 Validando configuração...');
  const isValid = validateEnvironment(envVars);
  
  if (isValid) {
    console.log('✅ Todas as variáveis obrigatórias estão presentes');
  }
  
  // Mostrar próximos passos
  console.log('\n📋 Próximos passos:');
  console.log('1. Configure suas credenciais do Supabase (se necessário)');
  console.log('2. Obtenha suas credenciais do Mercado Pago em: https://www.mercadopago.com.br/developers');
  console.log('3. Execute a migração do banco: npm run db:migrate');
  console.log('4. Inicie o servidor: npm run dev');
  console.log('5. Execute os testes: node scripts/test-mercado-pago-integration.js');
  
  return envVars;
}

/**
 * Mostrar configuração atual
 */
function showCurrentConfig() {
  console.log('📋 Configuração atual do .env.local:\n');
  
  const env = readExistingEnv();
  
  if (Object.keys(env).length === 0) {
    console.log('❌ Arquivo .env.local não encontrado ou vazio');
    return;
  }
  
  // Variáveis relacionadas ao Mercado Pago
  const mpVars = Object.entries(env).filter(([key]) => 
    key.includes('MERCADO_PAGO') || 
    key === 'ENCRYPTION_KEY' || 
    key === 'NEXT_PUBLIC_APP_URL'
  );
  
  if (mpVars.length === 0) {
    console.log('❌ Nenhuma variável do Mercado Pago encontrada');
    return;
  }
  
  mpVars.forEach(([key, value]) => {
    if (key.includes('SECRET') || key.includes('KEY')) {
      // Mascarar valores sensíveis
      const masked = value.length > 10 ? 
        value.substring(0, 6) + '*'.repeat(value.length - 10) + value.substring(value.length - 4) :
        '*'.repeat(value.length);
      console.log(`${key}=${masked}`);
    } else {
      console.log(`${key}=${value}`);
    }
  });
  
  console.log('\n✅ Configuração carregada');
}

/**
 * Verificar se a configuração está completa
 */
function checkConfig() {
  console.log('🔍 Verificando configuração do Mercado Pago...\n');
  
  const env = readExistingEnv();
  
  const checks = [
    {
      name: 'Arquivo .env.local',
      check: () => fs.existsSync(ENV_FILE),
      fix: 'Execute: node scripts/setup-mercado-pago-env.js'
    },
    {
      name: 'Chave de criptografia',
      check: () => env.ENCRYPTION_KEY && env.ENCRYPTION_KEY.length === 64,
      fix: 'Execute setup para gerar nova chave'
    },
    {
      name: 'URL da aplicação',
      check: () => env.NEXT_PUBLIC_APP_URL && env.NEXT_PUBLIC_APP_URL.startsWith('http'),
      fix: 'Defina NEXT_PUBLIC_APP_URL no .env.local'
    },
    {
      name: 'Chave pública MP',
      check: () => env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY && !env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY.includes('SUBSTITUA'),
      fix: 'Configure sua chave pública real do Mercado Pago'
    },
    {
      name: 'Webhook secret',
      check: () => env.MERCADO_PAGO_WEBHOOK_SECRET,
      fix: 'Execute setup para gerar webhook secret'
    },
    {
      name: 'Supabase URL',
      check: () => env.SUPABASE_URL && env.SUPABASE_URL.includes('supabase.co'),
      fix: 'Configure SUPABASE_URL no .env.local'
    },
    {
      name: 'Supabase Key',
      check: () => env.SUPABASE_ANON_KEY,
      fix: 'Configure SUPABASE_ANON_KEY no .env.local'
    }
  ];
  
  let allGood = true;
  
  checks.forEach(({ name, check, fix }) => {
    const passed = check();
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}`);
    
    if (!passed) {
      console.log(`   💡 ${fix}`);
      allGood = false;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (allGood) {
    console.log('🎉 Configuração completa! Pronto para usar o Mercado Pago.');
  } else {
    console.log('⚠️  Configuração incompleta. Corrija os itens acima.');
  }
  
  return allGood;
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'setup':
    setupEnvironment();
    break;
    
  case 'show':
    showCurrentConfig();
    break;
    
  case 'check':
    checkConfig();
    break;
    
  default:
    console.log('🔧 Script de Configuração - Mercado Pago\n');
    console.log('Comandos disponíveis:');
    console.log('  setup  - Configurar variáveis de ambiente');
    console.log('  show   - Mostrar configuração atual');
    console.log('  check  - Verificar se configuração está completa');
    console.log('\nExemplos:');
    console.log('  node scripts/setup-mercado-pago-env.js setup');
    console.log('  node scripts/setup-mercado-pago-env.js check');
    break;
}

module.exports = {
  setupEnvironment,
  showCurrentConfig,
  checkConfig,
  generateEncryptionKey,
  generateWebhookSecret
};
