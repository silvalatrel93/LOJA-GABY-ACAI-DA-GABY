// Script para redefinir o contador de pedidos
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

// Obter credenciais do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não estão definidas');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) estão definidas no arquivo .env.local');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função para executar a migração
async function resetOrderCounter() {
  console.log('Iniciando redefinição do contador de pedidos...');
  
  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(process.cwd(), 'migrations', 'reset_order_counter.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar a migração
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Erro ao executar a migração:', error);
      
      // Tentar método alternativo se o RPC falhar
      console.log('Tentando método alternativo...');
      const { error: queryError } = await supabase.from('_exec_sql').insert({ sql });
      
      if (queryError) {
        console.error('Erro no método alternativo:', queryError);
        
        // Último recurso: executar diretamente a consulta SQL
        console.log('Executando SQL diretamente...');
        const { error: directError } = await supabase.rpc('pg_execute', { 
          query: "ALTER SEQUENCE orders_id_seq RESTART WITH 1" 
        });
        
        if (directError) {
          console.error('Erro ao executar SQL diretamente:', directError);
          console.error('Não foi possível redefinir o contador de pedidos.');
          process.exit(1);
        } else {
          console.log('Contador de pedidos redefinido com sucesso usando método direto!');
        }
      } else {
        console.log('Contador de pedidos redefinido com sucesso usando método alternativo!');
      }
    } else {
      console.log('Contador de pedidos redefinido com sucesso!');
    }
    
    console.log('O próximo pedido começará com o ID #1');
  } catch (err) {
    console.error('Erro inesperado:', err);
    process.exit(1);
  }
}

// Executar a função
resetOrderCounter();
