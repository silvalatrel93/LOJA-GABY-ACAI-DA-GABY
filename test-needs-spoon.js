require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl ? 'Configurada' : 'Não encontrada');
console.log('Key:', supabaseKey ? 'Configurada' : 'Não encontrada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNeedsSpoon() {
  try {
    console.log('🔍 Testando consulta da coluna needs_spoon...');
    
    const { data, error } = await supabase
      .from('products')
      .select('id, name, needs_spoon')
      .limit(3);
    
    if (error) {
      console.error('❌ Erro na consulta:', error);
      return;
    }
    
    console.log('✅ Consulta bem-sucedida!');
    console.log('📊 Dados retornados:', JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

testNeedsSpoon();