/**
 * Script de Teste - Integração Mercado Pago
 * 
 * Este script testa todos os endpoints da integração Mercado Pago
 * Execute: node scripts/test-mercado-pago-integration.js
 */

const https = require('https');
const http = require('http');

// Configurações de teste
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const LOJA_ID = 'loja-teste-1';

// Credenciais de teste do Mercado Pago (sandbox)
const TEST_CREDENTIALS = {
  public_key: 'TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789',
  access_token: 'TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890abcdef12-123456789',
  chave_pix: 'test@email.com',
  is_sandbox: true
};

// Dados de teste para pagamento
const TEST_PAYMENT_DATA = {
  transaction_amount: 25.50,
  description: 'Teste de integração PediFacil',
  external_reference: `teste-${Date.now()}`,
  payer: {
    email: 'test@email.com',
    first_name: 'João',
    last_name: 'Silva',
    identification: {
      type: 'CPF',
      number: '12345678901'
    }
  }
};

/**
 * Função auxiliar para fazer requisições HTTP
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
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
 * Teste 1: Salvar credenciais
 */
async function testSaveCredentials() {
  console.log('\n🔧 Teste 1: Salvando credenciais...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/credentials`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const requestData = {
      loja_id: LOJA_ID,
      ...TEST_CREDENTIALS
    };
    
    const response = await makeRequest(options, requestData);
    
    if (response.statusCode === 200) {
      console.log('✅ Credenciais salvas com sucesso');
      console.log('   Resposta:', response.body);
      return true;
    } else {
      console.log('❌ Erro ao salvar credenciais');
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
 * Teste 2: Buscar credenciais
 */
async function testGetCredentials() {
  console.log('\n🔍 Teste 2: Buscando credenciais...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/credentials?loja_id=${LOJA_ID}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Credenciais encontradas');
      console.log('   Public Key:', response.body.public_key?.substring(0, 20) + '...');
      console.log('   Sandbox:', response.body.is_sandbox);
      console.log('   Ativa:', response.body.is_active);
      return response.body;
    } else {
      console.log('❌ Erro ao buscar credenciais');
      console.log('   Status:', response.statusCode);
      console.log('   Resposta:', response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return null;
  }
}

/**
 * Teste 3: Criar pagamento PIX
 */
async function testCreatePixPayment() {
  console.log('\n💰 Teste 3: Criando pagamento PIX...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/create-payment`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const requestData = {
      loja_id: LOJA_ID,
      payment_method_id: 'pix',
      ...TEST_PAYMENT_DATA
    };
    
    const response = await makeRequest(options, requestData);
    
    if (response.statusCode === 200) {
      console.log('✅ Pagamento PIX criado com sucesso');
      console.log('   ID:', response.body.id);
      console.log('   Status:', response.body.status);
      console.log('   Valor:', response.body.transaction_amount);
      if (response.body.pix) {
        console.log('   QR Code:', response.body.pix.qr_code ? 'Gerado' : 'Não gerado');
      }
      return response.body;
    } else {
      console.log('❌ Erro ao criar pagamento PIX');
      console.log('   Status:', response.statusCode);
      console.log('   Resposta:', response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return null;
  }
}

/**
 * Teste 4: Buscar transações
 */
async function testGetTransactions() {
  console.log('\n📊 Teste 4: Buscando transações...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/transactions?loja_id=${LOJA_ID}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Transações encontradas');
      console.log('   Total:', response.body.transactions?.length || 0);
      console.log('   Estatísticas:', response.body.stats?.total || 'N/A');
      return response.body;
    } else {
      console.log('❌ Erro ao buscar transações');
      console.log('   Status:', response.statusCode);
      console.log('   Resposta:', response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return null;
  }
}

/**
 * Teste 5: Webhook (simulação)
 */
async function testWebhook() {
  console.log('\n🔔 Teste 5: Testando webhook...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/webhook`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
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
        id: '1234567890',
        status: 'approved',
        status_detail: 'accredited',
        external_reference: TEST_PAYMENT_DATA.external_reference,
        transaction_amount: TEST_PAYMENT_DATA.transaction_amount
      }
    };
    
    const response = await makeRequest(options, webhookData);
    
    if (response.statusCode === 200) {
      console.log('✅ Webhook processado com sucesso');
      console.log('   Resposta:', response.body);
      return true;
    } else {
      console.log('❌ Erro no webhook');
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
 * Teste 6: Remover credenciais (cleanup)
 */
async function testRemoveCredentials() {
  console.log('\n🗑️  Teste 6: Removendo credenciais (cleanup)...');
  
  try {
    const url = new URL(`${BASE_URL}/api/mercado-pago/credentials?loja_id=${LOJA_ID}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'DELETE',
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Credenciais removidas com sucesso');
      return true;
    } else {
      console.log('❌ Erro ao remover credenciais');
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
  console.log('🚀 Iniciando testes da integração Mercado Pago');
  console.log('📍 Base URL:', BASE_URL);
  console.log('🏪 Loja ID:', LOJA_ID);
  
  const results = {
    saveCredentials: false,
    getCredentials: false,
    createPixPayment: false,
    getTransactions: false,
    webhook: false,
    removeCredentials: false
  };
  
  // Executar testes em sequência
  results.saveCredentials = await testSaveCredentials();
  
  if (results.saveCredentials) {
    results.getCredentials = await testGetCredentials();
    results.createPixPayment = await testCreatePixPayment();
    results.getTransactions = await testGetTransactions();
    results.webhook = await testWebhook();
    results.removeCredentials = await testRemoveCredentials();
  }
  
  // Resumo dos resultados
  console.log('\n📋 Resumo dos Testes:');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSOU' : '❌ FALHOU';
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} - ${testName}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log('='.repeat(50));
  console.log(`📊 Taxa de Sucesso: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Todos os testes passaram! Integração funcionando perfeitamente.');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os logs acima.');
  }
  
  return results;
}

/**
 * Verificar se o servidor está rodando
 */
async function checkServerHealth() {
  console.log('🔍 Verificando se o servidor está rodando...');
  
  try {
    const url = new URL(`${BASE_URL}/api/health`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/mercado-pago/webhook', // Usar endpoint que sabemos que existe
      method: 'GET',
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Servidor está rodando');
      return true;
    } else {
      console.log('⚠️  Servidor respondeu mas pode ter problemas');
      return true; // Continuar mesmo assim
    }
  } catch (error) {
    console.log('❌ Servidor não está acessível:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando em:', BASE_URL);
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
      console.log('\n❌ Não foi possível executar os testes. Servidor não está acessível.');
      process.exit(1);
    }
  })().catch((error) => {
    console.error('💥 Erro fatal nos testes:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testSaveCredentials,
  testGetCredentials,
  testCreatePixPayment,
  testGetTransactions,
  testWebhook,
  testRemoveCredentials
};
