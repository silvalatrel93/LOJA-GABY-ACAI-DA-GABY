import type { Order } from "../types";

// Serviço para envio de mensagens via WhatsApp
export const WhatsAppService = {
  /**
   * Formata o número de telefone para o formato internacional usado pelo WhatsApp
   * @param phone Número de telefone no formato brasileiro
   * @returns Número formatado para WhatsApp
   */
  formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    const numbers = phone.replace(/\D/g, '');
    
    // Verifica se já começa com 55 (código do Brasil)
    if (numbers.startsWith('55') && numbers.length >= 12) {
      return numbers;
    }
    
    // Adiciona o código do Brasil (55) se não estiver presente
    return `55${numbers}`;
  },

  /**
   * Cria uma mensagem de confirmação personalizada para o cliente
   * @param order Dados do pedido
   * @returns Texto formatado da mensagem
   */
  createOrderConfirmationMessage(order: Order): string {
    // Formata a data para exibição
    const orderDate = order.date instanceof Date 
      ? order.date 
      : new Date(order.date);
    
    const formattedDate = orderDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Formata o nome do cliente em maiúsculas
    const customerName = order.customerName ? order.customerName.toUpperCase() : 'CLIENTE';
    
    // Constrói a mensagem simplificada
    return `Olá, ${customerName}! 😊\n\n` +
           `Recebemos seu pedido realizado em ${formattedDate}.\n\n` +
           `Seu pedido está sendo preparado com todo carinho! Agradecemos a preferência. 💜\n\n` +
           `Em caso de dúvidas, entre em contato conosco.`;
  },

  /**
   * Gera a URL para envio direto de mensagem via WhatsApp
   * @param phone Número de telefone do cliente
   * @param message Mensagem a ser enviada
   * @returns URL completa para WhatsApp
   */
  generateWhatsAppUrl(phone: string, message: string): string {
    const formattedPhone = this.formatPhoneNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
  },

  /**
   * Abre uma nova janela do navegador com a mensagem de confirmação para o cliente
   * @param order Dados do pedido
   * @returns Verdadeiro se a operação foi bem-sucedida
   */
  async sendOrderConfirmation(order: Order): Promise<boolean> {
    try {
      if (!order.customerPhone) {
        console.error("Telefone do cliente não disponível para envio de confirmação");
        return false;
      }

      const message = this.createOrderConfirmationMessage(order);
      const whatsappUrl = this.generateWhatsAppUrl(order.customerPhone, message);
      
      // Em ambiente de navegador, abre uma nova janela
      if (typeof window !== 'undefined') {
        window.open(whatsappUrl, '_blank');
        return true;
      }
      
      console.log("URL do WhatsApp gerada:", whatsappUrl);
      return true;
    } catch (error) {
      console.error("Erro ao enviar confirmação via WhatsApp:", error);
      return false;
    }
  },

  /**
   * Envia automaticamente uma mensagem de confirmação para o cliente
   * sem abrir uma nova janela (para uso em background)
   * @param order Dados do pedido
   * @returns URL do WhatsApp para envio manual se necessário
   */
  prepareOrderConfirmation(order: Order): string | null {
    try {
      if (!order.customerPhone) {
        console.error("Telefone do cliente não disponível para envio de confirmação");
        return null;
      }

      const message = this.createOrderConfirmationMessage(order);
      return this.generateWhatsAppUrl(order.customerPhone, message);
    } catch (error) {
      console.error("Erro ao preparar confirmação via WhatsApp:", error);
      return null;
    }
  }
};

// Exportar funções individuais para facilitar o uso
export const sendOrderConfirmation = WhatsAppService.sendOrderConfirmation.bind(WhatsAppService);
export const prepareOrderConfirmation = WhatsAppService.prepareOrderConfirmation.bind(WhatsAppService);
