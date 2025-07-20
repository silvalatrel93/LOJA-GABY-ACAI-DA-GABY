import type { Order, Address } from "../types";
import { DEFAULT_STORE_ADDRESS } from "../store-utils";

// Serviço para gerar links do Google Maps para rotas de entrega
export const MapsService = {
  /**
   * Formata o endereço para uso no Google Maps
   * @param address Endereço do pedido
   * @returns Endereço formatado para URL
   */
  formatAddressForMaps(address: Address): string {
    const parts: string[] = [];

    // Adicionar rua e número
    if (address.street && address.number) {
      parts.push(`${address.street}, ${address.number}`);
    }

    // Adicionar complemento se houver
    if (address.complement) {
      parts.push(address.complement);
    }

    // Adicionar bairro
    if (address.neighborhood) {
      parts.push(address.neighborhood);
    }

    // Adicionar cidade e estado
    if (address.city && address.state) {
      parts.push(`${address.city}, ${address.state}`);
    }

    // Adicionar CEP se houver
    if (address.zipCode) {
      parts.push(address.zipCode);
    }

    return parts.join(", ");
  },

  /**
   * Gera uma URL do Google Maps para visualizar o endereço
   * @param address Endereço do pedido
   * @returns URL do Google Maps
   */
  generateMapsUrl(address: Address): string {
    const formattedAddress = this.formatAddressForMaps(address);
    const encodedAddress = encodeURIComponent(formattedAddress);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  },

  /**
   * Gera uma URL do Google Maps para rota de entrega
   * @param address Endereço de destino
   * @param origin Endereço de origem (opcional, usa "Sua localização" se não fornecido)
   * @returns URL do Google Maps com rota
   */
  generateRouteUrl(address: Address, origin?: string): string {
    const formattedAddress = this.formatAddressForMaps(address);
    const encodedDestination = encodeURIComponent(formattedAddress);

    // Sempre usar "Sua localização" como origem para que o GPS detecte automaticamente
    // Isso permite que o entregador use sua localização atual como ponto de partida
    const originAddress = "Sua localização";
    const encodedOrigin = encodeURIComponent(originAddress);

    return `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${encodedDestination}&travelmode=driving`;
  },

  /**
   * Cria mensagem para compartilhar com o entregador
   * @param order Dados do pedido
   * @returns Mensagem formatada com informações do pedido e rota
   */
  createDeliveryMessage(order: Order): string {
    const customerName = order.customerName.toUpperCase();
    const mapsUrl = this.generateRouteUrl(order.address);

    return `🛵 ENTREGA - PEDIDO #${order.id}\n\n` +
      `📍 Cliente: ${customerName}\n` +
      `📞 Telefone: ${order.customerPhone}\n\n` +
      `📍 Endereço:\n${this.formatAddressForMaps(order.address)}\n\n` +
      `🗺️ Rota no Google Maps:\n${mapsUrl}\n\n` +
      `💰 Total: R$ ${order.total.toFixed(2).replace('.', ',')}\n` +
      `💳 Pagamento: ${order.paymentMethod}\n\n` +
      `Boa entrega! 🚀`;
  },

  /**
   * Formata o número de telefone para WhatsApp
   * @param phone Número de telefone
   * @returns Número formatado para WhatsApp
   */
  formatPhoneNumber(phone: string): string {
    const numbers = phone.replace(/\D/g, '');

    if (numbers.startsWith('55') && numbers.length >= 12) {
      return numbers;
    }

    return `55${numbers}`;
  },

  /**
   * Gera URL para enviar mensagem de entrega via WhatsApp
   * @param order Dados do pedido
   * @param deliveryPhone Telefone do entregador
   * @returns URL do WhatsApp
   */
  generateDeliveryWhatsAppUrl(order: Order, deliveryPhone: string): string {
    const message = this.createDeliveryMessage(order);
    const formattedPhone = this.formatPhoneNumber(deliveryPhone);
    const encodedMessage = encodeURIComponent(message);
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
  },

  /**
   * Abre o Google Maps com a rota do pedido
   * @param order Dados do pedido
   * @returns Verdadeiro se a operação foi bem-sucedida
   */
  openMapsRoute(order: Order): boolean {
    try {
      const routeUrl = this.generateRouteUrl(order.address);

      if (typeof window !== 'undefined') {
        window.open(routeUrl, '_blank');
        return true;
      }

      console.log("URL da rota Google Maps:", routeUrl);
      return true;
    } catch (error) {
      console.error("Erro ao abrir rota no Google Maps:", error);
      return false;
    }
  },

  /**
   * Compartilha a rota com o entregador via WhatsApp
   * @param order Dados do pedido
   * @param deliveryPhone Telefone do entregador
   * @returns Verdadeiro se a operação foi bem-sucedida
   */
  shareRouteWithDelivery(order: Order, deliveryPhone: string): boolean {
    try {
      const whatsappUrl = this.generateDeliveryWhatsAppUrl(order, deliveryPhone);

      if (typeof window !== 'undefined') {
        window.open(whatsappUrl, '_blank');
        return true;
      }

      console.log("URL do WhatsApp para entregador:", whatsappUrl);
      return true;
    } catch (error) {
      console.error("Erro ao compartilhar rota com entregador:", error);
      return false;
    }
  }
};

// Exportar funções individuais para facilitar o uso
export const generateMapsUrl = MapsService.generateMapsUrl.bind(MapsService);
export const generateRouteUrl = MapsService.generateRouteUrl.bind(MapsService);
export const openMapsRoute = MapsService.openMapsRoute.bind(MapsService);
export const shareRouteWithDelivery = MapsService.shareRouteWithDelivery.bind(MapsService);