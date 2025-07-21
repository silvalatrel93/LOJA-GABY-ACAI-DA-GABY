/**
 * Script de Teste Final - Integração Completa Mercado Pago
 * 
 * Testa toda a integração end-to-end
 * Execute: node scripts/final-test-integration.js
 */

const http = require('http');

console.log('🎯 Teste Final - Integração Completa Mercado Pago\n');

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
 * Teste 1: Verificar credenciais
 */
async function testCredentials() {
  console.log('🔑 Teste 1: Verificando credenciais...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/credentials?loja_id=${LOJA_ID}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: 'GET',
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Credenciais encontradas:');
      console.log(`   Chave Pública: ${response.body.public_key?.substring(0, 20)}...`);
      console.log(`   Sandbox: ${response.body.is_sandbox ? 'Sim' : 'Não'}`);
      console.log(`   Ativa: ${response.body.is_active ? 'Sim' : 'Não'}`);
      console.log(`   Chave PIX: ${response.body.chave_pix || 'Não configurada'}`);
      return true;
    } else {
      console.log('❌ Credenciais não encontradas');
      console.log('   Status:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao verificar credenciais:', error.message);
    return false;
  }
}

/**
 * Teste 2: Buscar todas as transações
 */
async function testAllTransactions() {
  console.log('\\n📊 Teste 2: Buscando todas as transações...');
  
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
      const { transactions, stats } = response.body;
      
      console.log('✅ Transações encontradas:');
      console.log(`   Total: ${transactions?.length || 0}`);
      console.log(`   Estatísticas:`);
      console.log(`     - Aprovadas: ${stats?.approved || 0}`);
      console.log(`     - Pendentes: ${stats?.pending || 0}`);
      console.log(`     - Rejeitadas: ${stats?.rejected || 0}`);
      console.log(`     - Canceladas: ${stats?.cancelled || 0}`);
      console.log(`     - Valor Total: R$ ${stats?.total_amount || 0}`);
      console.log(`     - Valor Aprovado: R$ ${stats?.approved_amount || 0}`);
      
      if (transactions?.length > 0) {
        console.log('\\n   📋 Últimas transações:');
        transactions.slice(0, 3).forEach((t, index) => {
          console.log(`     ${index + 1}. ${t.payment_id} - ${t.payment_method_id.toUpperCase()} - R$ ${t.transaction_amount} (${t.status})`);
        });
      }
      
      return true;
    } else {
      console.log('❌ Erro ao buscar transações');
      console.log('   Status:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Teste 3: Filtrar transações por status
 */
async function testFilteredTransactions() {
  console.log('\\n🔍 Teste 3: Filtrando transações aprovadas...');
  
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
      const { transactions } = response.body;
      
      console.log('✅ Transações aprovadas:');
      console.log(`   Total: ${transactions?.length || 0}`);
      
      transactions?.forEach((t, index) => {
        console.log(`   ${index + 1}. ${t.payer_name} - ${t.payment_method_id.toUpperCase()} - R$ ${t.transaction_amount}`);
      });
      
      return true;
    } else {
      console.log('❌ Erro ao filtrar transações');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Teste 4: Testar paginação
 */
async function testPagination() {
  console.log('\\n📄 Teste 4: Testando paginação...');
  
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
      const { transactions, pagination } = response.body;
      
      console.log('✅ Paginação funcionando:');
      console.log(`   Limite: ${pagination?.limit}`);
      console.log(`   Offset: ${pagination?.offset}`);
      console.log(`   Total: ${pagination?.total}`);
      console.log(`   Nesta página: ${transactions?.length || 0}`);
      
      return true;
    } else {
      console.log('❌ Erro na paginação');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Teste 5: Simular webhook
 */
async function testWebhook() {
  console.log('\\n🔔 Teste 5: Simulando webhook...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/webhook`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Simular notificação do Mercado Pago
    const webhookData = {
      id: 12345,
      live_mode: false,
      type: 'payment',
      date_created: new Date().toISOString(),
      user_id: 123456789,
      api_version: 'v1',
      action: 'payment.updated',
      data: {
        id: 'MP-TEST-WEBHOOK-' + Date.now(),
        status: 'approved',
        status_detail: 'accredited',
        external_reference: 'pedido-webhook-test',
        transaction_amount: 99.99
      }
    };
    
    const response = await makeRequest(options, webhookData);
    
    if (response.statusCode === 200) {
      console.log('✅ Webhook processado com sucesso');
      console.log(`   Resposta: ${response.body.message || 'OK'}`);
      return true;
    } else {
      console.log('❌ Erro no webhook');
      console.log('   Status:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

/**
 * Teste 6: Performance e stress test básico
 */
async function testPerformance() {
  console.log('\\n⚡ Teste 6: Teste básico de performance...');
  
  const startTime = Date.now();
  const promises = [];
  
  // Fazer 5 requisições simultâneas
  for (let i = 0; i < 5; i++) {
    const url = new URL(`${BASE_URL}/api/mercado-pago/transactions?loja_id=${LOJA_ID}&limit=10`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: 'GET',
    };
    
    promises.push(makeRequest(options));
  }
  
  try {
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = responses.filter(r => r.statusCode === 200).length;
    
    console.log('✅ Teste de performance concluído:');
    console.log(`   Requisições: 5 simultâneas`);
    console.log(`   Sucessos: ${successCount}/5`);
    console.log(`   Tempo total: ${duration}ms`);
    console.log(`   Tempo médio: ${Math.round(duration / 5)}ms por requisição`);
    
    return successCount === 5;
  } catch (error) {
    console.log('❌ Erro no teste de performance:', error.message);
    return false;
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('🚀 Iniciando Teste Final da Integração Mercado Pago');
  console.log('📍 Base URL:', BASE_URL);
  console.log('🏪 Loja ID:', LOJA_ID);
  console.log('=' .repeat(70));
  
  const results = {
    credentials: false,
    allTransactions: false,
    filteredTransactions: false,
    pagination: false,
    webhook: false,
    performance: false
  };
  
  // Executar testes em sequência
  results.credentials = await testCredentials();
  results.allTransactions = await testAllTransactions();
  results.filteredTransactions = await testFilteredTransactions();
  results.pagination = await testPagination();
  results.webhook = await testWebhook();
  results.performance = await testPerformance();
  
  // Resumo dos resultados
  console.log('\\n📋 Resumo Final dos Testes:');
  console.log('='.repeat(70));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSOU' : '❌ FALHOU';
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} - ${testName}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log('='.repeat(70));
  console.log(`📊 Taxa de Sucesso Final: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (passedTests === totalTests) {
    console.log('\\n🎉 TODOS OS TESTES PASSARAM! INTEGRAÇÃO COMPLETA E FUNCIONAL!');
    console.log('\\n🚀 Status: PRONTO PARA PRODUÇÃO');
    console.log('\\n📋 Próximos passos:');
    console.log('1. 🔑 Configure credenciais REAIS do Mercado Pago');
    console.log('2. 🌐 Configure URL de produção');
    console.log('3. 🔒 Ative validação de webhook em produção');
    console.log('4. 📊 Configure monitoramento de transações');
    console.log('5. 🎯 Treine os usuários com o dashboard');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('\\n⚠️  MAIORIA DOS TESTES PASSOU - Integração quase completa');
    console.log('💡 Corrija os itens que falharam antes do deploy');
  } else {
    console.log('\\n❌ MUITOS TESTES FALHARAM - Verifique a configuração');
    console.log('💡 Certifique-se de que o servidor está rodando e o banco está configurado');
  }
  
  console.log('\\n📖 Documentação disponível:');
  console.log('   - GUIA_MERCADO_PAGO_COMPLETO.md');
  console.log('   - MIGRACAO_MERCADO_PAGO_COMPLETA.md');
  console.log('   - scripts/README.md');
  
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
      console.log('✅ Servidor está rodando e APIs estão acessíveis');
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
      const results = await runAllTests();
      
      // Código de saída baseado no resultado
      const totalTests = Object.keys(results).length;
      const passedTests = Object.values(results).filter(Boolean).length;
      
      if (passedTests === totalTests) {
        process.exit(0); // Sucesso total
      } else if (passedTests >= totalTests * 0.8) {
        process.exit(1); // Maioria passou, mas tem problemas
      } else {
        process.exit(2); // Muitos problemas
      }
    } else {
      console.log('\\n❌ Não foi possível executar os testes. Servidor não está acessível.');
      process.exit(3);
    }
  })().catch((error) => {
    console.error('💥 Erro fatal nos testes:', error);
    process.exit(4);
  });
}

module.exports = {
  runAllTests,
  testCredentials,
  testAllTransactions,
  testFilteredTransactions,
  testPagination,
  testWebhook,
  testPerformance
};
