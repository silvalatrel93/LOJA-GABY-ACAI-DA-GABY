-- Adicionar coluna notified à tabela orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT FALSE;

-- Atualizar a função de atualização de pedidos para incluir o campo notified
CREATE OR REPLACE FUNCTION update_order_notified(order_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE orders 
  SET notified = TRUE, 
      updated_at = NOW()
  WHERE id = order_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar uma política para permitir atualizações no campo notified
CREATE POLICY "Permitir atualização de notificação para administradores"
  ON orders
  FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.role() = 'administrator');

-- Comentário para documentação
COMMENT ON COLUMN orders.notified IS 'Indica se o pedido já foi notificado';

-- Atualizar a view de pedidos para incluir o campo notified
CREATE OR REPLACE VIEW vw_orders AS
SELECT 
  id,
  customer_name,
  customer_phone,
  address,
  items,
  subtotal,
  delivery_fee,
  total,
  payment_method,
  status,
  date,
  printed,
  notified,
  created_at,
  updated_at
FROM orders
ORDER BY date DESC;
