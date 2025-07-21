-- Seed de Dados - Mercado Pago
-- Gerado automaticamente em: 2025-07-21T16:14:52.689Z
-- 
-- Este arquivo contém dados de teste para demonstração da integração
-- Mercado Pago no PediFacil.

-- Limpar dados de teste anteriores (opcional)
-- DELETE FROM mercado_pago_transactions WHERE webhook_data->>'seeded' = 'true';
-- DELETE FROM mercado_pago_credentials WHERE loja_id = 'default-store' AND is_sandbox = true;


-- Inserir credenciais de teste (criptografadas em produção)
INSERT INTO mercado_pago_credentials (
  loja_id, 
  public_key, 
  access_token, 
  chave_pix, 
  is_sandbox, 
  is_active
) VALUES (
  'default-store',
  'TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789',
  'TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890abcdef12-123456789',
  'contato@nutriben.com.br',
  true,
  true
) ON CONFLICT (loja_id, is_active) 
DO UPDATE SET 
  public_key = EXCLUDED.public_key,
  access_token = EXCLUDED.access_token,
  chave_pix = EXCLUDED.chave_pix,
  updated_at = CURRENT_TIMESTAMP
RETURNING id, loja_id, is_sandbox, is_active;



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
    (
      'MP-SEED-1753114492689-1',
      gen_random_uuid(),
      'default-store',
      'pix',
      45.9,
      'approved',
      'accredited',
      'pedido-001',
      'PIX_QR_MP-SEED-1753114492689-1',
      NULL,
      NULL,
      1,
      'cliente1@email.com',
      'Ana Silva',
      NULL,
      NULL,
      '{"description": "Almoço executivo + bebida", "seeded": true}'::jsonb
    ),
    (
      'MP-SEED-1753114492689-2',
      gen_random_uuid(),
      'default-store',
      'credit_card',
      89.5,
      'approved',
      'accredited',
      'pedido-002',
      NULL,
      NULL,
      NULL,
      2,
      'cliente2@email.com',
      'Carlos Santos',
      NULL,
      NULL,
      '{"description": "Jantar para 2 pessoas", "seeded": true}'::jsonb
    ),
    (
      'MP-SEED-1753114492689-3',
      gen_random_uuid(),
      'default-store',
      'pix',
      25,
      'pending',
      'pending_waiting_payment',
      'pedido-003',
      'PIX_QR_MP-SEED-1753114492689-3',
      NULL,
      NULL,
      1,
      'cliente3@email.com',
      'Maria Costa',
      NULL,
      NULL,
      '{"description": "Lanche da tarde", "seeded": true}'::jsonb
    ),
    (
      'MP-SEED-1753114492689-4',
      gen_random_uuid(),
      'default-store',
      'credit_card',
      120.75,
      'rejected',
      'cc_rejected_insufficient_amount',
      'pedido-004',
      NULL,
      NULL,
      NULL,
      3,
      'cliente4@email.com',
      'João Oliveira',
      NULL,
      NULL,
      '{"description": "Combo família", "seeded": true}'::jsonb
    ),
    (
      'MP-SEED-1753114492689-5',
      gen_random_uuid(),
      'default-store',
      'pix',
      67.3,
      'approved',
      'accredited',
      'pedido-005',
      'PIX_QR_MP-SEED-1753114492689-5',
      NULL,
      NULL,
      1,
      'cliente5@email.com',
      'Fernanda Lima',
      NULL,
      NULL,
      '{"description": "Prato do dia + sobremesa", "seeded": true}'::jsonb
    ),
    (
      'MP-SEED-1753114492689-6',
      gen_random_uuid(),
      'default-store',
      'debit_card',
      38.9,
      'approved',
      'accredited',
      'pedido-006',
      NULL,
      NULL,
      NULL,
      1,
      'cliente6@email.com',
      'Pedro Rocha',
      NULL,
      NULL,
      '{"description": "Sanduíche natural + suco", "seeded": true}'::jsonb
    ),
    (
      'MP-SEED-1753114492689-7',
      gen_random_uuid(),
      'default-store',
      'pix',
      156.8,
      'approved',
      'accredited',
      'pedido-007',
      'PIX_QR_MP-SEED-1753114492689-7',
      NULL,
      NULL,
      1,
      'cliente7@email.com',
      'Juliana Mendes',
      NULL,
      NULL,
      '{"description": "Pedido para festa (4 pessoas)", "seeded": true}'::jsonb
    ),
    (
      'MP-SEED-1753114492689-8',
      gen_random_uuid(),
      'default-store',
      'credit_card',
      78.2,
      'cancelled',
      'cancelled_by_user',
      'pedido-008',
      NULL,
      NULL,
      NULL,
      1,
      'cliente8@email.com',
      'Roberto Silva',
      NULL,
      NULL,
      '{"description": "Almoço executivo cancelado", "seeded": true}'::jsonb
    )
ON CONFLICT (payment_id) DO NOTHING
RETURNING payment_id, payment_method_id, status, transaction_amount;


-- Verificar dados inseridos
SELECT 
  'Credenciais' as tipo,
  COUNT(*) as quantidade
FROM mercado_pago_credentials 
WHERE loja_id = 'default-store'

UNION ALL

SELECT 
  'Transações' as tipo,
  COUNT(*) as quantidade
FROM mercado_pago_transactions 
WHERE loja_id = 'default-store' 
  AND webhook_data->>'seeded' = 'true';

-- Estatísticas das transações inseridas
SELECT 
  status,
  payment_method_id,
  COUNT(*) as quantidade,
  SUM(transaction_amount) as valor_total
FROM mercado_pago_transactions 
WHERE loja_id = 'default-store' 
  AND webhook_data->>'seeded' = 'true'
GROUP BY status, payment_method_id
ORDER BY status, payment_method_id;
