/**
 * Script de Teste - API Real do Mercado Pago
 * 
 * Testa as APIs reais com dados inseridos no banco
 * Execute: node scripts/test-api-real.js
 */

const http = require('http');

// Configurações
const BASE_URL = 'http://localhost:3000';
const LOJA_ID = 'default-store';

/**
 * Função auxiliar para fazer requisições HTTP
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Teste 1: Buscar transações da loja
 */
async function testGetTransactions() {
  console.log('📊 Teste 1: Buscando transações da loja...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/transactions?loja_id=${LOJA_ID}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: 'GET',
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Transações encontradas:');
      console.log(`   Total: ${response.body.transactions?.length || 0}`);
      console.log(`   Estatísticas:`);
      console.log(`     - Aprovadas: ${response.body.stats?.approved || 0}`);
      console.log(`     - Pendentes: ${response.body.stats?.pending || 0}`);
      console.log(`     - Rejeitadas: ${response.body.stats?.rejected || 0}`);
      console.log(`     - Valor total: R$ ${response.body.stats?.total_amount || 0}`);
      
      if (response.body.transactions?.length > 0) {
        console.log('   Primeira transação:');
        const first = response.body.transactions[0];
        console.log(`     - ID: ${first.payment_id}`);
        console.log(`     - Método: ${first.payment_method_id}`);
        console.log(`     - Status: ${first.status}`);
        console.log(`     - Valor: R$ ${first.transaction_amount}`);
      }
      
      return true;
    } else {
      console.log('❌ Erro ao buscar transações');
      console.log('   Status:', response.statusCode);
      console.log('   Resposta:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Teste 2: Buscar transações com filtro de status
 */
async function testGetTransactionsWithFilter() {
  console.log('\\n🔍 Teste 2: Buscando transações aprovadas...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/transactions?loja_id=${LOJA_ID}&status=approved`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: 'GET',
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Transações aprovadas encontradas:');
      console.log(`   Total: ${response.body.transactions?.length || 0}`);
      
      response.body.transactions?.forEach((transaction, index) => {
        console.log(`   ${index + 1}. ${transaction.payment_id} - R$ ${transaction.transaction_amount} (${transaction.status})`);
      });
      
      return true;
    } else {
      console.log('❌ Erro ao buscar transações filtradas');
      console.log('   Status:', response.statusCode);
      console.log('   Resposta:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Teste 3: Buscar transações com paginação
 */
async function testGetTransactionsWithPagination() {
  console.log('\\n📄 Teste 3: Testando paginação...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/transactions?loja_id=${LOJA_ID}&limit=2&offset=0`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: 'GET',
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Paginação funcionando:');
      console.log(`   Página atual: ${Math.floor(response.body.pagination?.offset / response.body.pagination?.limit) + 1}`);
      console.log(`   Limite por página: ${response.body.pagination?.limit}`);
      console.log(`   Total de transações: ${response.body.pagination?.total}`);
      console.log(`   Transações nesta página: ${response.body.transactions?.length || 0}`);
      
      return true;
    } else {
      console.log('❌ Erro na paginação');
      console.log('   Status:', response.statusCode);
      console.log('   Resposta:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Teste 4: Testar erro de loja não informada
 */
async function testMissingLojaId() {
  console.log('\\n⚠️  Teste 4: Testando validação (sem loja_id)...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/transactions`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: 'GET',
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 400) {
      console.log('✅ Validação funcionando corretamente');
      console.log(`   Erro esperado: ${response.body.error}`);
      return true;
    } else {
      console.log('❌ Validação não funcionou como esperado');
      console.log('   Status:', response.statusCode);
      console.log('   Resposta:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('🚀 Testando API Real do Mercado Pago');
  console.log('📍 Base URL:', BASE_URL);
  console.log('🏪 Loja ID:', LOJA_ID);
  console.log('=' .repeat(60));
  
  const results = {
    getTransactions: false,
    getTransactionsWithFilter: false,
    getTransactionsWithPagination: false,
    missingLojaId: false
  };
  
  // Executar testes em sequência
  results.getTransactions = await testGetTransactions();
  results.getTransactionsWithFilter = await testGetTransactionsWithFilter();
  results.getTransactionsWithPagination = await testGetTransactionsWithPagination();
  results.missingLojaId = await testMissingLojaId();
  
  // Resumo dos resultados
  console.log('\\n📋 Resumo dos Testes:');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSOU' : '❌ FALHOU';
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} - ${testName}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log('='.repeat(60));
  console.log(`📊 Taxa de Sucesso: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Todos os testes passaram! API funcionando perfeitamente.');
    console.log('\\n📋 Próximos passos:');
    console.log('1. 🔧 Configure credenciais reais do Mercado Pago');
    console.log('2. 🧪 Teste criação de pagamentos');
    console.log('3. 🔔 Teste webhooks');
    console.log('4. 🚀 Deploy em produção');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique se o servidor está rodando.');
  }
  
  return results;
}

/**
 * Verificar se o servidor está rodando
 */
async function checkServerHealth() {
  console.log('🔍 Verificando se o servidor está rodando...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/mercado-pago/transactions?loja_id=test',
      method: 'GET',
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 || response.statusCode === 400) {
      console.log('✅ Servidor está rodando e API está acessível');
      return true;
    } else {
      console.log('⚠️  Servidor respondeu mas pode ter problemas');
      return true; // Continuar mesmo assim
    }
  } catch (error) {
    console.log('❌ Servidor não está acessível:', error.message);
    console.log('💡 Inicie o servidor com: npm run dev');
    return false;
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  (async () => {
    const serverOk = await checkServerHealth();
    
    if (serverOk) {
      await runAllTests();
    } else {
      console.log('\\n❌ Não foi possível executar os testes. Servidor não está acessível.');
      console.log('💡 Certifique-se de que o servidor está rodando em: http://localhost:3000');
      process.exit(1);
    }
  })().catch((error) => {
    console.error('💥 Erro fatal nos testes:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testGetTransactions,
  testGetTransactionsWithFilter,
  testGetTransactionsWithPagination,
  testMissingLojaId
};
