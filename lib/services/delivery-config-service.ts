// Serviço para gerenciar configurações de entrega
export interface DeliveryConfig {
  defaultDeliveryPhone: string;
  lastUpdated: Date;
}

const DELIVERY_CONFIG_KEY = 'delivery_config';

export const DeliveryConfigService = {
  /**
   * Obtém a configuração de entrega salva no localStorage
   * @returns Configuração de entrega ou valores padrão
   */
  getDeliveryConfig(): DeliveryConfig {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(DELIVERY_CONFIG_KEY);
        if (saved) {
          const config = JSON.parse(saved);
          return {
            ...config,
            lastUpdated: new Date(config.lastUpdated)
          };
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de entrega:', error);
    }
    
    return {
      defaultDeliveryPhone: '',
      lastUpdated: new Date()
    };
  },

  /**
   * Salva a configuração de entrega no localStorage
   * @param config Configuração de entrega
   */
  saveDeliveryConfig(config: DeliveryConfig): void {
    try {
      if (typeof window !== 'undefined') {
        const configToSave = {
          ...config,
          lastUpdated: new Date()
        };
        localStorage.setItem(DELIVERY_CONFIG_KEY, JSON.stringify(configToSave));
      }
    } catch (error) {
      console.error('Erro ao salvar configuração de entrega:', error);
    }
  },

  /**
   * Atualiza apenas o número padrão do entregador
   * @param phone Número de telefone do entregador
   */
  updateDefaultDeliveryPhone(phone: string): void {
    const config = this.getDeliveryConfig();
    config.defaultDeliveryPhone = phone;
    this.saveDeliveryConfig(config);
  },

  /**
   * Obtém apenas o número padrão do entregador
   * @returns Número de telefone padrão
   */
  getDefaultDeliveryPhone(): string {
    const config = this.getDeliveryConfig();
    return config.defaultDeliveryPhone;
  },

  /**
   * Formata o número de telefone para exibição
   * @param phone Número de telefone
   * @returns Número formatado
   */
  formatPhoneForDisplay(phone: string): string {
    if (!phone) return '';
    
    // Remove todos os caracteres não numéricos
    const numbers = phone.replace(/\D/g, '');
    
    // Formata conforme o padrão brasileiro
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    
    return phone;
  },

  /**
   * Valida se o número de telefone está no formato correto
   * @param phone Número de telefone
   * @returns Verdadeiro se válido
   */
  isValidPhone(phone: string): boolean {
    if (!phone) return false;
    
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 10 && numbers.length <= 11;
  }
};

// Exportar funções individuais para facilitar o uso
export const getDefaultDeliveryPhone = DeliveryConfigService.getDefaultDeliveryPhone.bind(DeliveryConfigService);
export const updateDefaultDeliveryPhone = DeliveryConfigService.updateDefaultDeliveryPhone.bind(DeliveryConfigService);
export const formatPhoneForDisplay = DeliveryConfigService.formatPhoneForDisplay.bind(DeliveryConfigService);
export const isValidPhone = DeliveryConfigService.isValidPhone.bind(DeliveryConfigService); 