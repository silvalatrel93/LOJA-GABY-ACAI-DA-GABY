import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configurar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '..', 'migrations', 'update_additionals_foreign_key.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executando migração...');
    
    // Dividir o SQL em comandos separados
    const commands = sql.split(';').filter(cmd => cmd.trim() !== '');
    
    for (const command of commands) {
      const { error } = await supabase.rpc('pgmigrate', { query: command.trim() });
      
      if (error) {
        console.error('Erro ao executar comando SQL:', error);
        console.error('Comando:', command);
      } else {
        console.log('Comando executado com sucesso:', command.trim().substring(0, 50) + '...');
      }
    }
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao executar migração:', error);
  }
}

runMigration();
