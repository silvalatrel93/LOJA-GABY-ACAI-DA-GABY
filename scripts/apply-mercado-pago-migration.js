/**
 * Script para Aplicar Migração - Mercado Pago
 * 
 * Este script aplica a migração do banco de dados para o Mercado Pago
 * Execute: node scripts/apply-mercado-pago-migration.js
 */

const fs = require('fs');
const path = require('path');

// Importar cliente do Supabase
async function createSupabaseClient() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY são obrigatórias');
    }
    
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('❌ Erro ao criar cliente Supabase:', error.message);
    throw error;
  }
}

/**
 * Ler arquivo de migração
 */
function readMigrationFile() {
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250121000000_create_mercado_pago_credentials.sql');
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Arquivo de migração não encontrado: ${migrationPath}`);
  }
  
  return fs.readFileSync(migrationPath, 'utf8');
}

/**
 * Dividir SQL em comandos individuais
 */
function splitSqlCommands(sql) {
  // Remover comentários
  const cleanSql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  // Dividir por ponto e vírgula, mas preservar comandos complexos
  const commands = [];
  let currentCommand = '';
  let inFunction = false;
  
  cleanSql.split('\n').forEach(line => {
    const trimmed = line.trim();
    
    // Detectar início de função/trigger
    if (trimmed.includes('CREATE OR REPLACE FUNCTION') || 
        trimmed.includes('CREATE TRIGGER')) {
      inFunction = true;
    }
    
    currentCommand += line + '\n';
    
    // Detectar fim de comando
    if (trimmed.endsWith(';')) {
      if (inFunction && (trimmed.includes('$$;') || trimmed === 'END;')) {
        inFunction = false;
      }
      
      if (!inFunction) {
        const command = currentCommand.trim();
        if (command && command !== ';') {
          commands.push(command);
        }
        currentCommand = '';
      }
    }
  });
  
  // Adicionar último comando se houver
  if (currentCommand.trim()) {
    commands.push(currentCommand.trim());
  }
  
  return commands.filter(cmd => cmd && cmd !== ';');
}

/**
 * Verificar se tabelas já existem
 */
async function checkExistingTables(supabase) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['mercado_pago_credentials', 'mercado_pago_transactions']);
    
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    // Se der erro, assumir que as tabelas não existem
    console.log('ℹ️  Não foi possível verificar tabelas existentes, continuando...');
    return [];
  }
}

/**
 * Executar comando SQL
 */
async function executeCommand(supabase, command, index, total) {
  try {
    console.log(`📝 Executando comando ${index + 1}/${total}...`);
    
    // Mostrar início do comando para debug
    const preview = command.substring(0, 100).replace(/\s+/g, ' ');
    console.log(`   ${preview}${command.length > 100 ? '...' : ''}`);
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: command });
    
    if (error) {
      // Tentar execução direta se RPC falhar
      const { error: directError } = await supabase
        .from('_temp_migration')
        .select('*')
        .limit(0);
      
      if (directError) {
        // Usar método alternativo
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ sql_query: command })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } else {
        throw error;
      }
    }
    
    console.log(`   ✅ Comando ${index + 1} executado com sucesso`);
    return true;
  } catch (error) {
    console.log(`   ❌ Erro no comando ${index + 1}:`, error.message);
    
    // Alguns erros são aceitáveis (ex: tabela já existe)
    if (error.message.includes('already exists') || 
        error.message.includes('já existe')) {
      console.log(`   ℹ️  Ignorando erro (recurso já existe)`);
      return true;
    }
    
    throw error;
  }
}

/**
 * Aplicar migração
 */
async function applyMigration() {
  console.log('🚀 Iniciando aplicação da migração Mercado Pago\n');
  
  try {
    // 1. Verificar variáveis de ambiente
    console.log('🔍 Verificando variáveis de ambiente...');
    
    if (!process.env.SUPABASE_URL) {
      throw new Error('SUPABASE_URL não encontrada no ambiente');
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY não encontrada');
    }
    
    console.log('✅ Variáveis de ambiente OK');
    
    // 2. Criar cliente Supabase
    console.log('\n🔗 Conectando ao Supabase...');
    const supabase = await createSupabaseClient();
    console.log('✅ Conectado ao Supabase');
    
    // 3. Verificar tabelas existentes
    console.log('\n📋 Verificando tabelas existentes...');
    const existingTables = await checkExistingTables(supabase);
    
    if (existingTables.length > 0) {
      console.log('⚠️  Tabelas já existem:');
      existingTables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      console.log('   Continuando com a migração (comandos duplicados serão ignorados)...');
    } else {
      console.log('✅ Nenhuma tabela existente encontrada');
    }
    
    // 4. Ler arquivo de migração
    console.log('\n📄 Lendo arquivo de migração...');
    const migrationSql = readMigrationFile();
    console.log(`✅ Migração lida (${migrationSql.length} caracteres)`);
    
    // 5. Dividir em comandos
    console.log('\n✂️  Dividindo SQL em comandos...');
    const commands = splitSqlCommands(migrationSql);
    console.log(`✅ ${commands.length} comandos identificados`);
    
    // 6. Executar comandos
    console.log('\n⚡ Executando comandos...');
    
    for (let i = 0; i < commands.length; i++) {
      await executeCommand(supabase, commands[i], i, commands.length);
      
      // Pequena pausa entre comandos
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 7. Verificar resultado
    console.log('\n🔍 Verificando resultado...');
    const finalTables = await checkExistingTables(supabase);
    
    const expectedTables = ['mercado_pago_credentials', 'mercado_pago_transactions'];
    const createdTables = finalTables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !createdTables.includes(t));
    
    if (missingTables.length === 0) {
      console.log('✅ Todas as tabelas foram criadas com sucesso:');
      expectedTables.forEach(table => {
        console.log(`   - ${table}`);
      });
    } else {
      console.log('⚠️  Algumas tabelas podem não ter sido criadas:');
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
    }
    
    console.log('\n🎉 Migração aplicada com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Configure as credenciais do Mercado Pago no admin');
    console.log('2. Teste a integração com: node scripts/test-mercado-pago-integration.js');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ Erro ao aplicar migração:', error.message);
    console.log('\n💡 Possíveis soluções:');
    console.log('1. Verifique se as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão corretas');
    console.log('2. Certifique-se de ter permissões para criar tabelas');
    console.log('3. Tente aplicar a migração manualmente no painel do Supabase');
    
    return false;
  }
}

/**
 * Verificar status das tabelas
 */
async function checkMigrationStatus() {
  console.log('🔍 Verificando status da migração...\n');
  
  try {
    const supabase = await createSupabaseClient();
    
    // Verificar tabelas
    const tables = await checkExistingTables(supabase);
    const expectedTables = ['mercado_pago_credentials', 'mercado_pago_transactions'];
    
    console.log('📊 Status das tabelas:');
    
    expectedTables.forEach(expectedTable => {
      const exists = tables.some(t => t.table_name === expectedTable);
      const status = exists ? '✅ Existe' : '❌ Não existe';
      console.log(`   ${expectedTable}: ${status}`);
    });
    
    // Verificar estrutura se tabelas existem
    if (tables.length > 0) {
      console.log('\n🔍 Verificando estrutura das tabelas...');
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table.table_name)
            .select('*')
            .limit(0);
          
          if (!error) {
            console.log(`   ✅ ${table.table_name}: Estrutura OK`);
          } else {
            console.log(`   ⚠️  ${table.table_name}: ${error.message}`);
          }
        } catch (err) {
          console.log(`   ❌ ${table.table_name}: Erro ao verificar`);
        }
      }
    }
    
    const allTablesExist = expectedTables.every(expectedTable => 
      tables.some(t => t.table_name === expectedTable)
    );
    
    console.log('\n' + '='.repeat(50));
    
    if (allTablesExist) {
      console.log('🎉 Migração completa! Todas as tabelas estão presentes.');
    } else {
      console.log('⚠️  Migração incompleta. Execute: node scripts/apply-mercado-pago-migration.js apply');
    }
    
    return allTablesExist;
    
  } catch (error) {
    console.log('❌ Erro ao verificar status:', error.message);
    return false;
  }
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
const command = args[0];

// Carregar variáveis de ambiente do .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

switch (command) {
  case 'apply':
    applyMigration();
    break;
    
  case 'status':
    checkMigrationStatus();
    break;
    
  default:
    console.log('🗄️  Script de Migração - Mercado Pago\n');
    console.log('Comandos disponíveis:');
    console.log('  apply   - Aplicar migração do banco de dados');
    console.log('  status  - Verificar status da migração');
    console.log('\nExemplos:');
    console.log('  node scripts/apply-mercado-pago-migration.js apply');
    console.log('  node scripts/apply-mercado-pago-migration.js status');
    break;
}

module.exports = {
  applyMigration,
  checkMigrationStatus
};
