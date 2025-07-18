/**
 * Constantes globais compartilhadas por toda a aplicação
 */

// ID da loja padrão (Loja Principal)
export const DEFAULT_STORE_ID = "default-store"

// Status de pedidos
export const ORDER_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  DELIVERED: "delivered",
  CANCELED: "canceled",
}

// Métodos de pagamento
export const PAYMENT_METHODS = {
  CASH: "cash",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  PIX: "pix",
}
