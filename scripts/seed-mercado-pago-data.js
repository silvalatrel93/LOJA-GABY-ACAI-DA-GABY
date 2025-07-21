/**
 * Script de Seed - Dados de Teste Mercado Pago
 * 
 * Popula o banco com dados de teste para demonstração
 * Execute: node scripts/seed-mercado-pago-data.js
 */

console.log('🌱 Seed de Dados - Mercado Pago\n');

// Simular dados que seriam inseridos via MCP
const SAMPLE_CREDENTIALS = {
  loja_id: 'default-store',
  public_key: 'TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789',
  access_token: 'TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890abcdef12-123456789',
  chave_pix: 'contato@nutriben.com.br',
  is_sandbox: true,
  is_active: true
};

const SAMPLE_TRANSACTIONS = [
  {
    payment_method_id: 'pix',
    transaction_amount: 45.90,
    status: 'approved',
    status_detail: 'accredited',
    external_reference: 'pedido-001',
    payer_email: 'cliente1@email.com',
    payer_name: 'Ana Silva',
    description: 'Almoço executivo + bebida'
  },
  {
    payment_method_id: 'credit_card',
    transaction_amount: 89.50,
    status: 'approved',
    status_detail: 'accredited',
    external_reference: 'pedido-002',
    payer_email: 'cliente2@email.com',
    payer_name: 'Carlos Santos',
    installments: 2,
    description: 'Jantar para 2 pessoas'
  },
  {
    payment_method_id: 'pix',
    transaction_amount: 25.00,
    status: 'pending',
    status_detail: 'pending_waiting_payment',
    external_reference: 'pedido-003',
    payer_email: 'cliente3@email.com',
    payer_name: 'Maria Costa',
    description: 'Lanche da tarde'
  },
  {
    payment_method_id: 'credit_card',
    transaction_amount: 120.75,
    status: 'rejected',
    status_detail: 'cc_rejected_insufficient_amount',
    external_reference: 'pedido-004',
    payer_email: 'cliente4@email.com',
    payer_name: 'João Oliveira',
    installments: 3,
    description: 'Combo família'
  },
  {
    payment_method_id: 'pix',
    transaction_amount: 67.30,
    status: 'approved',
    status_detail: 'accredited',
    external_reference: 'pedido-005',
    payer_email: 'cliente5@email.com',
    payer_name: 'Fernanda Lima',
    description: 'Prato do dia + sobremesa'
  },
  {
    payment_method_id: 'debit_card',
    transaction_amount: 38.90,
    status: 'approved',
    status_detail: 'accredited',
    external_reference: 'pedido-006',
    payer_email: 'cliente6@email.com',
    payer_name: 'Pedro Rocha',
    description: 'Sanduíche natural + suco'
  },
  {
    payment_method_id: 'pix',
    transaction_amount: 156.80,
    status: 'approved',
    status_detail: 'accredited',
    external_reference: 'pedido-007',
    payer_email: 'cliente7@email.com',
    payer_name: 'Juliana Mendes',
    description: 'Pedido para festa (4 pessoas)'
  },
  {
    payment_method_id: 'credit_card',
    transaction_amount: 78.20,
    status: 'cancelled',
    status_detail: 'cancelled_by_user',
    external_reference: 'pedido-008',
    payer_email: 'cliente8@email.com',
    payer_name: 'Roberto Silva',
    installments: 1,
    description: 'Almoço executivo cancelado'
  }
];

/**
 * Gerar SQL para inserir credenciais
 */
function generateCredentialsSQL() {
  return `
-- Inserir credenciais de teste (criptografadas em produção)
INSERT INTO mercado_pago_credentials (
  loja_id, 
  public_key, 
  access_token, 
  chave_pix, 
  is_sandbox, 
  is_active
) VALUES (
  '${SAMPLE_CREDENTIALS.loja_id}',
  '${SAMPLE_CREDENTIALS.public_key}',
  '${SAMPLE_CREDENTIALS.access_token}',
  '${SAMPLE_CREDENTIALS.chave_pix}',
  ${SAMPLE_CREDENTIALS.is_sandbox},
  ${SAMPLE_CREDENTIALS.is_active}
) ON CONFLICT (loja_id, is_active) 
DO UPDATE SET 
  public_key = EXCLUDED.public_key,
  access_token = EXCLUDED.access_token,
  chave_pix = EXCLUDED.chave_pix,
  updated_at = CURRENT_TIMESTAMP
RETURNING id, loja_id, is_sandbox, is_active;
`;
}

/**
 * Gerar SQL para inserir transações
 */
function generateTransactionsSQL() {
  const values = SAMPLE_TRANSACTIONS.map((transaction, index) => {
    const paymentId = `MP-SEED-${Date.now()}-${index + 1}`;
    const orderId = `gen_random_uuid()`;
    const pixQrCode = transaction.payment_method_id === 'pix' ? `'PIX_QR_${paymentId}'` : 'NULL';
    
    return `(
      '${paymentId}',
      ${orderId},
      '${SAMPLE_CREDENTIALS.loja_id}',
      '${transaction.payment_method_id}',
      ${transaction.transaction_amount},
      '${transaction.status}',
      '${transaction.status_detail}',
      '${transaction.external_reference}',
      ${pixQrCode},
      NULL,
      NULL,
      ${transaction.installments || 1},
      '${transaction.payer_email}',
      '${transaction.payer_name}',
      NULL,
      NULL,
      '{"description": "${transaction.description}", "seeded": true}'::jsonb
    )`;
  }).join(',\n    ');

  return `
-- Inserir transações de teste
INSERT INTO mercado_pago_transactions (
  payment_id,
  order_id,
  loja_id,
  payment_method_id,
  transaction_amount,
  status,
  status_detail,
  external_reference,
  pix_qr_code,
  pix_qr_code_base64,
  card_token,
  installments,
  payer_email,
  payer_name,
  payer_document,
  notification_url,
  webhook_data
) VALUES 
    ${values}
ON CONFLICT (payment_id) DO NOTHING
RETURNING payment_id, payment_method_id, status, transaction_amount;
`;
}

/**
 * Gerar estatísticas dos dados
 */
function generateStats() {
  const totalAmount = SAMPLE_TRANSACTIONS.reduce((sum, t) => sum + t.transaction_amount, 0);
  const approvedAmount = SAMPLE_TRANSACTIONS
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + t.transaction_amount, 0);
  
  const stats = {
    total: SAMPLE_TRANSACTIONS.length,
    approved: SAMPLE_TRANSACTIONS.filter(t => t.status === 'approved').length,
    pending: SAMPLE_TRANSACTIONS.filter(t => t.status === 'pending').length,
    rejected: SAMPLE_TRANSACTIONS.filter(t => t.status === 'rejected').length,
    cancelled: SAMPLE_TRANSACTIONS.filter(t => t.status === 'cancelled').length,
    totalAmount: totalAmount.toFixed(2),
    approvedAmount: approvedAmount.toFixed(2),
    pix: SAMPLE_TRANSACTIONS.filter(t => t.payment_method_id === 'pix').length,
    credit_card: SAMPLE_TRANSACTIONS.filter(t => t.payment_method_id === 'credit_card').length,
    debit_card: SAMPLE_TRANSACTIONS.filter(t => t.payment_method_id === 'debit_card').length
  };
  
  return stats;
}

/**
 * Mostrar resumo dos dados que serão inseridos
 */
function showDataSummary() {
  console.log('📊 Resumo dos Dados de Teste:');
  console.log('=' .repeat(50));
  
  console.log('\n🔑 Credenciais:');
  console.log(`   Loja: ${SAMPLE_CREDENTIALS.loja_id}`);
  console.log(`   Chave Pública: ${SAMPLE_CREDENTIALS.public_key.substring(0, 20)}...`);
  console.log(`   Chave PIX: ${SAMPLE_CREDENTIALS.chave_pix}`);
  console.log(`   Sandbox: ${SAMPLE_CREDENTIALS.is_sandbox ? 'Sim' : 'Não'}`);
  
  const stats = generateStats();
  
  console.log('\n💰 Transações:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Aprovadas: ${stats.approved}`);
  console.log(`   Pendentes: ${stats.pending}`);
  console.log(`   Rejeitadas: ${stats.rejected}`);
  console.log(`   Canceladas: ${stats.cancelled}`);
  
  console.log('\n💳 Por Método de Pagamento:');
  console.log(`   PIX: ${stats.pix}`);
  console.log(`   Cartão de Crédito: ${stats.credit_card}`);
  console.log(`   Cartão de Débito: ${stats.debit_card}`);
  
  console.log('\n💵 Valores:');
  console.log(`   Total: R$ ${stats.totalAmount}`);
  console.log(`   Aprovado: R$ ${stats.approvedAmount}`);
  
  console.log('\n📝 Exemplos de Transações:');
  SAMPLE_TRANSACTIONS.slice(0, 3).forEach((transaction, index) => {
    console.log(`   ${index + 1}. ${transaction.payer_name} - ${transaction.payment_method_id.toUpperCase()} - R$ ${transaction.transaction_amount} (${transaction.status})`);
  });
  
  if (SAMPLE_TRANSACTIONS.length > 3) {
    console.log(`   ... e mais ${SAMPLE_TRANSACTIONS.length - 3} transações`);
  }
}

/**
 * Gerar arquivo SQL completo
 */
function generateSeedSQL() {
  const credentialsSQL = generateCredentialsSQL();
  const transactionsSQL = generateTransactionsSQL();
  
  return `-- Seed de Dados - Mercado Pago
-- Gerado automaticamente em: ${new Date().toISOString()}
-- 
-- Este arquivo contém dados de teste para demonstração da integração
-- Mercado Pago no PediFacil.

-- Limpar dados de teste anteriores (opcional)
-- DELETE FROM mercado_pago_transactions WHERE webhook_data->>'seeded' = 'true';
-- DELETE FROM mercado_pago_credentials WHERE loja_id = '${SAMPLE_CREDENTIALS.loja_id}' AND is_sandbox = true;

${credentialsSQL}

${transactionsSQL}

-- Verificar dados inseridos
SELECT 
  'Credenciais' as tipo,
  COUNT(*) as quantidade
FROM mercado_pago_credentials 
WHERE loja_id = '${SAMPLE_CREDENTIALS.loja_id}'

UNION ALL

SELECT 
  'Transações' as tipo,
  COUNT(*) as quantidade
FROM mercado_pago_transactions 
WHERE loja_id = '${SAMPLE_CREDENTIALS.loja_id}' 
  AND webhook_data->>'seeded' = 'true';

-- Estatísticas das transações inseridas
SELECT 
  status,
  payment_method_id,
  COUNT(*) as quantidade,
  SUM(transaction_amount) as valor_total
FROM mercado_pago_transactions 
WHERE loja_id = '${SAMPLE_CREDENTIALS.loja_id}' 
  AND webhook_data->>'seeded' = 'true'
GROUP BY status, payment_method_id
ORDER BY status, payment_method_id;
`;
}

/**
 * Salvar arquivo SQL
 */
function saveSeedSQL() {
  const fs = require('fs');
  const path = require('path');
  
  const sqlContent = generateSeedSQL();
  const filePath = path.join(__dirname, '..', 'supabase', 'seed-mercado-pago.sql');
  
  try {
    fs.writeFileSync(filePath, sqlContent, 'utf8');
    console.log(`\n💾 Arquivo SQL salvo: ${filePath}`);
    console.log('📝 Execute no Supabase SQL Editor ou via MCP para aplicar os dados.');
    return true;
  } catch (error) {
    console.log(`\n❌ Erro ao salvar arquivo SQL: ${error.message}`);
    return false;
  }
}

/**
 * Mostrar instruções de uso
 */
function showInstructions() {
  console.log('\n📋 Como Usar os Dados de Teste:');
  console.log('=' .repeat(50));
  
  console.log('\n1️⃣ Via MCP Supabase:');
  console.log('   - Use o arquivo SQL gerado no Supabase SQL Editor');
  console.log('   - Ou execute via MCP: mcp1_execute_sql');
  
  console.log('\n2️⃣ Via Scripts:');
  console.log('   - Execute: node scripts/test-api-real.js');
  console.log('   - Teste as APIs com dados reais');
  
  console.log('\n3️⃣ Via Interface Web:');
  console.log('   - Inicie o servidor: npm run dev');
  console.log('   - Acesse: http://localhost:3000/admin/mercado-pago');
  console.log('   - Veja as transações no dashboard');
  
  console.log('\n⚠️  Importante:');
  console.log('   - Estes são dados de TESTE apenas');
  console.log('   - Use credenciais reais para produção');
  console.log('   - Dados marcados com "seeded": true no webhook_data');
}

// Executar se chamado diretamente
if (require.main === module) {
  showDataSummary();
  
  const saved = saveSeedSQL();
  
  if (saved) {
    showInstructions();
    console.log('\n🎉 Seed de dados preparado com sucesso!');
  } else {
    console.log('\n❌ Falha ao preparar seed de dados.');
    process.exit(1);
  }
}

module.exports = {
  SAMPLE_CREDENTIALS,
  SAMPLE_TRANSACTIONS,
  generateCredentialsSQL,
  generateTransactionsSQL,
  generateStats,
  generateSeedSQL,
  showDataSummary
};
