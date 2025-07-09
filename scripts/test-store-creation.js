// Script de teste para validar criação de lojas
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testStoreCreation() {
  console.log('🧪 Testando criação de loja...\n');

  try {
    // Teste 1: Verificar conexão com Supabase
    console.log('1. Verificando conexão com Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('stores')
      .select('count')
      .single();
    
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError.message);
      return;
    }
    console.log('✅ Conexão com Supabase OK\n');

    // Teste 2: Verificar estrutura da tabela
    console.log('2. Verificando estrutura da tabela stores...');
    const { data: tableStructure, error: structureError } = await supabase
      .from('stores')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Erro na estrutura da tabela:', structureError.message);
      return;
    }
    console.log('✅ Estrutura da tabela OK\n');

    // Teste 3: Criar loja de teste
    console.log('3. Criando loja de teste...');
    const testStore = {
      name: 'Loja Teste Automático',
      slug: 'loja-teste-automatico-' + Date.now(),
      description: 'Loja criada automaticamente para teste',
      owner_name: 'Teste Owner',
      owner_email: 'teste@email.com',
      owner_phone: '(11) 99999-9999',
      theme_color: '#6B21A8',
      is_active: true
    };

    const { data: createdStore, error: createError } = await supabase
      .from('stores')
      .insert([testStore])
      .select('*')
      .single();

    if (createError) {
      console.error('❌ Erro ao criar loja:', createError.message);
      return;
    }
    console.log('✅ Loja criada com sucesso!');
    console.log('   ID:', createdStore.id);
    console.log('   Nome:', createdStore.name);
    console.log('   Slug:', createdStore.slug);
    console.log('');

    // Teste 4: Verificar se a loja foi criada
    console.log('4. Verificando se a loja foi criada...');
    const { data: foundStore, error: findError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', createdStore.id)
      .single();

    if (findError) {
      console.error('❌ Erro ao buscar loja:', findError.message);
      return;
    }
    console.log('✅ Loja encontrada no banco de dados\n');

    // Teste 5: Limpar dados de teste
    console.log('5. Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('stores')
      .delete()
      .eq('id', createdStore.id);

    if (deleteError) {
      console.error('❌ Erro ao limpar dados de teste:', deleteError.message);
      return;
    }
    console.log('✅ Dados de teste limpos\n');

    console.log('🎉 Todos os testes passaram! A criação de lojas deve estar funcionando.');
    console.log('');
    console.log('📋 Próximo passo: Tente criar uma loja pela interface:');
    console.log('   1. Acesse http://localhost:3000/admin/profiles');
    console.log('   2. Clique em "Nova Loja"');
    console.log('   3. Preencha os dados e clique em "Criar Loja"');
    console.log('   4. Verifique o console do navegador para logs detalhados');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

// Executar teste
testStoreCreation(); 