// Script para verificar o status das categorias restauradas
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Inicializar cliente Supabase com as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  try {
    // Verificar categorias específicas (IDs 1, 8, 10, 14)
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, active, order')
      .in('id', [1, 8, 10, 14])
      .order('id');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return;
    }

    console.log('=== Status das Categorias Restauradas ===');
    if (data.length === 0) {
      console.log('Nenhuma das categorias especificadas foi encontrada.');
    } else {
      data.forEach(category => {
        console.log(`ID: ${category.id}, Nome: ${category.name}, Ativo: ${category.active}, Ordem: ${category.order}`);
      });
    }

    // Verificar se alguma categoria está faltando
    const foundIds = data.map(c => c.id);
    const missingIds = [1, 8, 10, 14].filter(id => !foundIds.includes(id));
    
    if (missingIds.length > 0) {
      console.log('\nCategorias não encontradas:', missingIds.join(', '));
    }
  } catch (err) {
    console.error('Erro ao executar a verificação:', err);
  }
}

// Executar a verificação
checkCategories();