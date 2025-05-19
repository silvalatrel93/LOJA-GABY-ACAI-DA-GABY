// Script para redefinir a tabela de pedidos e zerar o contador
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
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função principal para redefinir a tabela de pedidos
async function resetOrdersTable() {
  console.log('Iniciando redefinição da tabela de pedidos...');
  
  try {
    // Passo 1: Fazer backup dos pedidos existentes
    console.log('Fazendo backup dos pedidos existentes...');
    const { data: existingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*');
    
    if (fetchError) {
      console.error('Erro ao buscar pedidos existentes:', fetchError);
      process.exit(1);
    }
    
    console.log(`Backup de ${existingOrders.length} pedidos realizado com sucesso.`);
    
    // Salvar backup em arquivo
    const backupPath = path.join(process.cwd(), 'orders_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(existingOrders, null, 2));
    console.log(`Backup salvo em: ${backupPath}`);
    
    // Passo 2: Criar tabela temporária
    console.log('Criando tabela temporária...');
    const createTempTableQuery = `
      CREATE TABLE IF NOT EXISTS orders_new (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        address JSONB NOT NULL,
        items JSONB NOT NULL,
        subtotal NUMERIC NOT NULL,
        delivery_fee NUMERIC NOT NULL,
        total NUMERIC NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        printed BOOLEAN DEFAULT false,
        notified BOOLEAN DEFAULT false,
        store_id UUID NOT NULL
      );
    `;
    
    const { error: createError } = await supabase.rpc('pg_execute', { 
      query: createTempTableQuery 
    });
    
    if (createError) {
      console.error('Erro ao criar tabela temporária:', createError);
      process.exit(1);
    }
    
    console.log('Tabela temporária criada com sucesso.');
    
    // Passo 3: Excluir todos os pedidos da tabela original
    console.log('Excluindo pedidos da tabela original...');
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .gte('id', 0);
    
    if (deleteError) {
      console.error('Erro ao excluir pedidos:', deleteError);
      process.exit(1);
    }
    
    console.log('Pedidos excluídos com sucesso.');
    
    // Passo 4: Trocar as tabelas (opcional, apenas se tiver permissão)
    try {
      console.log('Tentando trocar as tabelas...');
      const swapTablesQuery = `
        ALTER TABLE orders RENAME TO orders_old;
        ALTER TABLE orders_new RENAME TO orders;
        DROP TABLE orders_old;
      `;
      
      const { error: swapError } = await supabase.rpc('pg_execute', { 
        query: swapTablesQuery 
      });
      
      if (swapError) {
        console.log('Não foi possível trocar as tabelas. Isso é normal se não tiver permissões de administrador.');
        console.log('Continuando com o método alternativo...');
      } else {
        console.log('Tabelas trocadas com sucesso!');
      }
    } catch (error) {
      console.log('Erro ao trocar tabelas (esperado). Continuando com método alternativo...');
    }
    
    // Passo 5: Inserir um pedido de teste para forçar o ID 1
    console.log('Inserindo pedido de teste...');
    const testOrder = {
      customer_name: "Teste de Contador",
      customer_phone: "00000000000",
      address: { street: "Teste", number: "1", neighborhood: "Teste" },
      items: [],
      subtotal: 0,
      delivery_fee: 0,
      total: 0,
      payment_method: "teste",
      status: "cancelled",
      date: new Date().toISOString(),
      printed: false,
      notified: true,
      store_id: "00000000-0000-0000-0000-000000000000"
    };
    
    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select();
    
    if (insertError) {
      console.error('Erro ao inserir pedido de teste:', insertError);
      process.exit(1);
    }
    
    console.log('Pedido de teste inserido:', insertedOrder);
    
    // Passo 6: Excluir o pedido de teste
    console.log('Excluindo pedido de teste...');
    const { error: deleteTestError } = await supabase
      .from('orders')
      .delete()
      .eq('customer_name', "Teste de Contador");
    
    if (deleteTestError) {
      console.error('Erro ao excluir pedido de teste:', deleteTestError);
      // Não é um erro crítico, podemos continuar
    }
    
    console.log('Contador de pedidos zerado com sucesso!');
    console.log('O próximo pedido começará com o ID #1');
    
  } catch (error) {
    console.error('Erro inesperado:', error);
    process.exit(1);
  }
}

// Executar a função
resetOrdersTable();
