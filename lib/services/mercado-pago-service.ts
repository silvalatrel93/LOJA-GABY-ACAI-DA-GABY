import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { createSupabaseClient } from '../supabase-client';
import { EncryptionService, DataMaskingService } from './encryption-service';

export interface MercadoPagoCredentials {
  id: string;
  loja_id: string;
  public_key: string;
  access_token: string;
  chave_pix?: string;
  webhook_url?: string;
  is_sandbox: boolean;
  is_active: boolean;
}

export interface PaymentData {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  external_reference: string;
  notification_url?: string;
  installments?: number;
  token?: string; // Para pagamentos com cartão
}

export interface PaymentResponse {
  id: string | number;
  status: string;
  status_detail: string;
  payment_method_id: string;
  transaction_amount: number;
  date_created: string;
  date_approved?: string;
  external_reference: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
}

/**
 * Serviço para integração com Mercado Pago
 */
export class MercadoPagoService {
  private supabase = createSupabaseClient();

  /**
   * Busca as credenciais ativas de uma loja
   */
  async getCredentials(lojaId: string): Promise<MercadoPagoCredentials | null> {
    try {
      const { data, error } = await this.supabase
        .from('mercado_pago_credentials')
        .select('*')
        .eq('loja_id', lojaId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.log(`Credenciais não encontradas para loja: ${lojaId}`);
        return null;
      }

      // Descriptografar dados sensíveis
      const credentials: MercadoPagoCredentials = {
        id: data.id as string,
        loja_id: data.loja_id as string,
        public_key: EncryptionService.decrypt(data.public_key as string),
        access_token: EncryptionService.decrypt(data.access_token as string),
        chave_pix: data.chave_pix ? EncryptionService.decrypt(data.chave_pix as string) : undefined,
        webhook_url: data.webhook_url as string | undefined,
        is_sandbox: data.is_sandbox as boolean,
        is_active: data.is_active as boolean,
      };

      console.log(`Credenciais carregadas para loja: ${lojaId} (Sandbox: ${credentials.is_sandbox})`);
      return credentials;
    } catch (error) {
      console.error('Erro ao buscar credenciais:', error);
      return null;
    }
  }

  /**
   * Salva ou atualiza credenciais de uma loja
   */
  async saveCredentials(
    lojaId: string,
    publicKey: string,
    accessToken: string,
    chavePix?: string,
    webhookUrl?: string,
    isSandbox: boolean = true
  ): Promise<boolean> {
    try {
      // Validar credenciais antes de salvar
      const isValid = await this.validateCredentials(accessToken, publicKey, isSandbox);
      if (!isValid) {
        throw new Error('Credenciais inválidas');
      }

      // Criptografar dados sensíveis
      const encryptedData = {
        loja_id: lojaId,
        public_key: EncryptionService.encrypt(publicKey),
        access_token: EncryptionService.encrypt(accessToken),
        chave_pix: chavePix ? EncryptionService.encrypt(chavePix) : null,
        webhook_url: webhookUrl,
        is_sandbox: isSandbox,
        is_active: true,
      };

      // Desativar credenciais antigas
      await this.supabase
        .from('mercado_pago_credentials')
        .update({ is_active: false })
        .eq('loja_id', lojaId);

      // Inserir novas credenciais
      const { error } = await this.supabase
        .from('mercado_pago_credentials')
        .insert(encryptedData);

      if (error) {
        console.error('Erro ao salvar credenciais:', error);
        return false;
      }

      console.log(`Credenciais salvas com sucesso para loja: ${lojaId}`);
      return true;
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      return false;
    }
  }

  /**
   * Valida credenciais fazendo uma chamada de teste na API
   */
  async validateCredentials(accessToken: string, publicKey: string, isSandbox: boolean): Promise<boolean> {
    try {
      const client = new MercadoPagoConfig({
        accessToken,
        options: {
          timeout: 5000,
        }
      });

      // Fazer uma chamada de teste para validar o token
      const payment = new Payment(client);
      
      // Tentar buscar métodos de pagamento (endpoint que não requer dados específicos)
      const testCall = await payment.search({
        options: {
          limit: 1
        }
      });

      console.log(`Credenciais validadas com sucesso (Sandbox: ${isSandbox})`);
      return true;
    } catch (error: any) {
      console.error('Erro na validação das credenciais:', error.message);
      return false;
    }
  }

  /**
   * Cria um pagamento PIX
   */
  async createPixPayment(lojaId: string, paymentData: PaymentData): Promise<PaymentResponse | null> {
    try {
      const credentials = await this.getCredentials(lojaId);
      if (!credentials) {
        throw new Error('Credenciais não encontradas');
      }

      const client = new MercadoPagoConfig({
        accessToken: credentials.access_token,
        options: { timeout: 5000 }
      });

      const payment = new Payment(client);

      const pixPaymentData = {
        transaction_amount: paymentData.transaction_amount,
        description: paymentData.description,
        payment_method_id: 'pix',
        payer: {
          email: paymentData.payer.email,
          first_name: paymentData.payer.first_name,
          last_name: paymentData.payer.last_name,
          identification: paymentData.payer.identification,
        },
        external_reference: paymentData.external_reference,
        notification_url: paymentData.notification_url,
      };

      const response = await payment.create({ body: pixPaymentData });
      
      if (!response || !response.id) {
        throw new Error('Falha ao criar pagamento PIX');
      }

      // Salvar transação no banco
      await this.saveTransaction(lojaId, response, paymentData.external_reference);

      console.log(`Pagamento PIX criado: ${response.id} para loja: ${lojaId}`);
      return response as PaymentResponse;
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      return null;
    }
  }

  /**
   * Cria um pagamento com cartão de crédito
   */
  async createCardPayment(lojaId: string, paymentData: PaymentData): Promise<PaymentResponse | null> {
    try {
      const credentials = await this.getCredentials(lojaId);
      if (!credentials) {
        throw new Error('Credenciais não encontradas');
      }

      if (!paymentData.token) {
        throw new Error('Token do cartão é obrigatório');
      }

      const client = new MercadoPagoConfig({
        accessToken: credentials.access_token,
        options: { timeout: 5000 }
      });

      const payment = new Payment(client);

      const cardPaymentData = {
        transaction_amount: paymentData.transaction_amount,
        description: paymentData.description,
        payment_method_id: paymentData.payment_method_id,
        token: paymentData.token,
        installments: paymentData.installments || 1,
        payer: {
          email: paymentData.payer.email,
          identification: paymentData.payer.identification,
        },
        external_reference: paymentData.external_reference,
        notification_url: paymentData.notification_url,
      };

      const response = await payment.create({ body: cardPaymentData });
      
      if (!response || !response.id) {
        throw new Error('Falha ao criar pagamento com cartão');
      }

      // Salvar transação no banco
      await this.saveTransaction(lojaId, response, paymentData.external_reference);

      console.log(`Pagamento com cartão criado: ${response.id} para loja: ${lojaId}`);
      return response as PaymentResponse;
    } catch (error) {
      console.error('Erro ao criar pagamento com cartão:', error);
      return null;
    }
  }

  /**
   * Busca informações de um pagamento
   */
  async getPayment(lojaId: string, paymentId: string): Promise<PaymentResponse | null> {
    try {
      const credentials = await this.getCredentials(lojaId);
      if (!credentials) {
        throw new Error('Credenciais não encontradas');
      }

      const client = new MercadoPagoConfig({
        accessToken: credentials.access_token,
        options: { timeout: 5000 }
      });

      const payment = new Payment(client);
      const response = await payment.get({ id: paymentId });

      return response as PaymentResponse;
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error);
      return null;
    }
  }

  /**
   * Salva uma transação no banco de dados
   */
  private async saveTransaction(lojaId: string, paymentResponse: any, externalReference: string): Promise<void> {
    try {
      const transactionData = {
        payment_id: paymentResponse.id.toString(),
        order_id: externalReference,
        loja_id: lojaId,
        payment_method_id: paymentResponse.payment_method_id,
        transaction_amount: paymentResponse.transaction_amount,
        status: paymentResponse.status,
        status_detail: paymentResponse.status_detail,
        external_reference: externalReference,
        pix_qr_code: paymentResponse.point_of_interaction?.transaction_data?.qr_code,
        pix_qr_code_base64: paymentResponse.point_of_interaction?.transaction_data?.qr_code_base64,
        card_token: paymentResponse.token,
        installments: paymentResponse.installments,
        payer_email: paymentResponse.payer?.email,
        payer_identification_type: paymentResponse.payer?.identification?.type,
        payer_identification_number: paymentResponse.payer?.identification?.number,
        date_created: paymentResponse.date_created,
        date_approved: paymentResponse.date_approved,
        date_last_updated: paymentResponse.date_last_updated,
      };

      const { error } = await this.supabase
        .from('mercado_pago_transactions')
        .insert(transactionData);

      if (error) {
        console.error('Erro ao salvar transação:', error);
      } else {
        console.log(`Transação salva: ${paymentResponse.id}`);
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  }

  /**
   * Atualiza o status de uma transação via webhook
   */
  async updateTransactionFromWebhook(paymentId: string, webhookData: any): Promise<boolean> {
    try {
      const updateData = {
        status: webhookData.status,
        status_detail: webhookData.status_detail,
        date_approved: webhookData.date_approved,
        date_last_updated: webhookData.date_last_updated || new Date().toISOString(),
        webhook_data: webhookData,
      };

      const { error } = await this.supabase
        .from('mercado_pago_transactions')
        .update(updateData)
        .eq('payment_id', paymentId);

      if (error) {
        console.error('Erro ao atualizar transação:', error);
        return false;
      }

      console.log(`Transação atualizada via webhook: ${paymentId} - Status: ${webhookData.status}`);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar transação via webhook:', error);
      return false;
    }
  }

  /**
   * Busca transações por referência externa (ID do pedido)
   */
  async getTransactionsByOrderId(orderId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('mercado_pago_transactions')
        .select('*')
        .eq('external_reference', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transações:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }
  }

  /**
   * Remove credenciais de uma loja
   */
  async removeCredentials(lojaId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('mercado_pago_credentials')
        .update({ is_active: false })
        .eq('loja_id', lojaId);

      if (error) {
        console.error('Erro ao remover credenciais:', error);
        return false;
      }

      console.log(`Credenciais removidas para loja: ${lojaId}`);
      return true;
    } catch (error) {
      console.error('Erro ao remover credenciais:', error);
      return false;
    }
  }
}

export default MercadoPagoService;
