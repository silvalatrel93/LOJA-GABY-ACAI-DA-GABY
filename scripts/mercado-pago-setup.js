/**
 * Script Principal - Setup Completo Mercado Pago
 * 
 * Este script orquestra todo o processo de configuração do Mercado Pago
 * Execute: node scripts/mercado-pago-setup.js
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Importar outros scripts
const envSetup = require('./setup-mercado-pago-env.js');
const migration = require('./apply-mercado-pago-migration.js');

/**
 * Executar comando e aguardar resultado
 */
function runCommand(command, args = [], cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Executando: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falhou com código ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Verificar se dependências estão instaladas
 */
async function checkDependencies() {
  console.log('📦 Verificando dependências...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json não encontrado');
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'mercadopago',
    '@supabase/supabase-js',
    'next',
    'react'
  ];
  
  const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log('❌ Dependências faltando:');
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
    
    console.log('\n📥 Instalando dependências...');
    await runCommand('npm', ['install', ...missingDeps]);
    console.log('✅ Dependências instaladas');
  } else {
    console.log('✅ Todas as dependências estão instaladas');
  }
}

/**
 * Verificar estrutura de arquivos
 */
function checkFileStructure() {
  console.log('\n📁 Verificando estrutura de arquivos...');
  
  const requiredFiles = [
    'supabase/migrations/20250121000000_create_mercado_pago_credentials.sql',
    'lib/services/encryption-service.ts',
    'lib/services/mercado-pago-service.ts',
    'app/api/mercado-pago/credentials/route.ts',
    'app/api/mercado-pago/create-payment/route.ts',
    'app/api/mercado-pago/webhook/route.ts',
    'app/api/mercado-pago/transactions/route.ts',
    'components/mercado-pago-credentials-form.tsx',
    'components/mercado-pago-payment.tsx',
    'app/admin/mercado-pago/page.tsx',
    'hooks/use-mercado-pago.ts'
  ];
  
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(process.cwd(), file))
  );
  
  if (missingFiles.length > 0) {
    console.log('❌ Arquivos faltando:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    return false;
  } else {
    console.log('✅ Todos os arquivos necessários estão presentes');
    return true;
  }
}

/**
 * Setup completo passo a passo
 */
async function fullSetup() {
  console.log('🚀 Iniciando Setup Completo do Mercado Pago\n');
  console.log('=' .repeat(60));
  
  try {
    // Passo 1: Verificar estrutura de arquivos
    console.log('\n📋 PASSO 1: Verificando estrutura de arquivos');
    const filesOk = checkFileStructure();
    
    if (!filesOk) {
      console.log('\n❌ Alguns arquivos estão faltando.');
      console.log('💡 Certifique-se de que todos os arquivos da integração foram criados.');
      return false;
    }
    
    // Passo 2: Verificar dependências
    console.log('\n📋 PASSO 2: Verificando dependências');
    await checkDependencies();
    
    // Passo 3: Configurar variáveis de ambiente
    console.log('\n📋 PASSO 3: Configurando variáveis de ambiente');
    envSetup.setupEnvironment();
    
    // Passo 4: Verificar configuração
    console.log('\n📋 PASSO 4: Verificando configuração');
    const configOk = envSetup.checkConfig();
    
    if (!configOk) {
      console.log('\n⚠️  Configuração incompleta detectada.');
      console.log('💡 Edite o arquivo .env.local com suas credenciais reais.');
      console.log('📖 Consulte o arquivo GUIA_MERCADO_PAGO_COMPLETO.md para instruções.');
    }
    
    // Passo 5: Aplicar migração do banco
    console.log('\n📋 PASSO 5: Aplicando migração do banco de dados');
    const migrationOk = await migration.applyMigration();
    
    if (!migrationOk) {
      console.log('\n❌ Falha na migração do banco de dados.');
      console.log('💡 Verifique suas credenciais do Supabase no .env.local');
      return false;
    }
    
    // Passo 6: Verificar status final
    console.log('\n📋 PASSO 6: Verificando status final');
    const statusOk = await migration.checkMigrationStatus();
    
    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DO SETUP:');
    console.log('='.repeat(60));
    
    console.log(`📁 Arquivos: ${filesOk ? '✅' : '❌'}`);
    console.log(`📦 Dependências: ✅`);
    console.log(`🔧 Configuração: ${configOk ? '✅' : '⚠️'}`);
    console.log(`🗄️  Migração: ${migrationOk ? '✅' : '❌'}`);
    console.log(`📊 Status Final: ${statusOk ? '✅' : '❌'}`);
    
    if (filesOk && migrationOk && statusOk) {
      console.log('\n🎉 SETUP COMPLETO COM SUCESSO!');
      console.log('\n📋 Próximos passos:');
      console.log('1. 🔑 Configure suas credenciais reais do Mercado Pago no .env.local');
      console.log('2. 🚀 Inicie o servidor: npm run dev');
      console.log('3. 🌐 Acesse: http://localhost:3000/admin/mercado-pago');
      console.log('4. 🧪 Execute os testes: node scripts/test-mercado-pago-integration.js');
      console.log('5. 📖 Leia o guia: GUIA_MERCADO_PAGO_COMPLETO.md');
      
      return true;
    } else {
      console.log('\n⚠️  SETUP PARCIALMENTE COMPLETO');
      console.log('💡 Corrija os itens marcados com ❌ ou ⚠️  acima.');
      
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ ERRO NO SETUP:', error.message);
    console.log('\n💡 Possíveis soluções:');
    console.log('1. Verifique se você está no diretório correto do projeto');
    console.log('2. Certifique-se de ter Node.js instalado');
    console.log('3. Verifique sua conexão com a internet');
    console.log('4. Execute: npm install');
    
    return false;
  }
}

/**
 * Verificação rápida do status
 */
async function quickStatus() {
  console.log('⚡ Verificação Rápida - Status Mercado Pago\n');
  
  try {
    // Verificar arquivos
    const filesOk = checkFileStructure();
    
    // Verificar configuração
    const configOk = envSetup.checkConfig();
    
    // Verificar migração
    const migrationOk = await migration.checkMigrationStatus();
    
    console.log('\n📊 Status Atual:');
    console.log(`📁 Arquivos: ${filesOk ? '✅ OK' : '❌ Faltando'}`);
    console.log(`🔧 Configuração: ${configOk ? '✅ OK' : '⚠️  Incompleta'}`);
    console.log(`🗄️  Banco: ${migrationOk ? '✅ OK' : '❌ Não aplicado'}`);
    
    const allOk = filesOk && configOk && migrationOk;
    
    console.log('\n' + '='.repeat(40));
    
    if (allOk) {
      console.log('🎉 Tudo pronto! Mercado Pago configurado.');
      console.log('🚀 Execute: npm run dev');
    } else {
      console.log('⚠️  Setup incompleto.');
      console.log('🔧 Execute: node scripts/mercado-pago-setup.js full');
    }
    
    return allOk;
    
  } catch (error) {
    console.log('❌ Erro na verificação:', error.message);
    return false;
  }
}

/**
 * Executar testes após setup
 */
async function runTests() {
  console.log('🧪 Executando testes da integração...\n');
  
  try {
    await runCommand('node', ['scripts/test-mercado-pago-integration.js']);
    console.log('\n✅ Testes executados com sucesso!');
    return true;
  } catch (error) {
    console.log('\n❌ Erro nos testes:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando: npm run dev');
    return false;
  }
}

/**
 * Mostrar ajuda
 */
function showHelp() {
  console.log('🔧 Script Principal - Setup Mercado Pago\n');
  console.log('Este script configura completamente a integração do Mercado Pago.\n');
  
  console.log('Comandos disponíveis:');
  console.log('  full     - Setup completo (recomendado)');
  console.log('  status   - Verificação rápida do status');
  console.log('  test     - Executar testes da integração');
  console.log('  help     - Mostrar esta ajuda');
  
  console.log('\nExemplos:');
  console.log('  node scripts/mercado-pago-setup.js full');
  console.log('  node scripts/mercado-pago-setup.js status');
  console.log('  node scripts/mercado-pago-setup.js test');
  
  console.log('\nArquivos relacionados:');
  console.log('  📄 GUIA_MERCADO_PAGO_COMPLETO.md - Guia completo');
  console.log('  📄 RESUMO_INTEGRACAO_MERCADO_PAGO.md - Resumo técnico');
  console.log('  🔧 scripts/setup-mercado-pago-env.js - Config ambiente');
  console.log('  🗄️  scripts/apply-mercado-pago-migration.js - Migração BD');
  console.log('  🧪 scripts/test-mercado-pago-integration.js - Testes');
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
const command = args[0] || 'help';

(async () => {
  switch (command) {
    case 'full':
      await fullSetup();
      break;
      
    case 'status':
      await quickStatus();
      break;
      
    case 'test':
      await runTests();
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
})().catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});

module.exports = {
  fullSetup,
  quickStatus,
  runTests,
  checkDependencies,
  checkFileStructure
};
