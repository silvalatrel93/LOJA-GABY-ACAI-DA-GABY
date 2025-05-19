/**
 * Utilitários para geração de códigos PIX
 */

/**
 * Calcula o CRC16 para o código PIX conforme especificação do Banco Central
 * @param str String para calcular o CRC
 * @returns CRC16 calculado
 */
function crc16CCITT(str: string): string {
  // Implementação do algoritmo CRC16-CCITT (0x1021)
  let crc = 0xFFFF;
  
  // Converter string para bytes
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    crc ^= (c << 8);
    
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formata um valor para o padrão PIX (2 casas decimais)
 * @param value Valor a ser formatado
 * @returns Valor formatado
 */
function formatValue(value: number): string {
  return value.toFixed(2);
}

/**
 * Cria um campo para o código PIX
 * @param id ID do campo
 * @param value Valor do campo
 * @returns Campo formatado
 */
function createField(id: string, value: string): string {
  const size = value.length.toString().padStart(2, '0');
  return `${id}${size}${value}`;
}

/**
 * Gera o código PIX para pagamento
 * @param pixKey Chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)
 * @param merchantName Nome do recebedor
 * @param merchantCity Cidade do recebedor
 * @param amount Valor da transação
 * @param description Descrição da transação (opcional)
 * @returns Código PIX para ser usado em QR Code
 */
export function generatePixCode(
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount: number,
  description: string = ''
): string {
  // Campos obrigatórios
  const payload = [
    createField('00', '01'),                      // Payload Format Indicator
    createField('01', '11'),                      // Point of Initiation Method (11 = QR Code estático)
    
    // Merchant Account Information
    (() => {
      const gui = createField('00', 'BR.GOV.BCB.PIX');
      const key = createField('01', pixKey);
      const info = gui + key;
      
      if (description) {
        const desc = createField('02', description);
        return createField('26', info + desc);
      }
      
      return createField('26', info);
    })(),
    
    createField('52', '0000'),                    // Merchant Category Code
    createField('53', '986'),                     // Currency (986 = BRL)
    createField('54', formatValue(amount)),       // Transaction Amount
    createField('58', merchantName),              // Merchant Name
    createField('59', merchantCity),              // Merchant City
    createField('60', 'BRASIL'),                  // Merchant Country Code
  ];

  // Adicionar campo de CRC
  const baseCode = payload.join('') + '6304';
  const crc = crc16CCITT(baseCode);
  
  return baseCode + crc;
}

/**
 * Gera uma URL para exibir um QR Code
 * @param text Texto a ser codificado no QR Code
 * @returns URL para exibir o QR Code
 */
export function generateQRCodeUrl(text: string): string {
  const encodedText = encodeURIComponent(text);
  // Usando o serviço QR Server em vez do Google Charts
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedText}`;
}

/**
 * Gera um QR Code para pagamento PIX usando apenas a chave PIX
 * Esta é uma versão simplificada que gera um QR code com a chave PIX e o valor
 * @param pixKey Chave PIX (CPF, CNPJ, e-mail, telefone ou chave aleatória)
 * @param amount Valor da transação (opcional)
 * @returns URL para exibir o QR Code PIX
 */
export function generateSimplePixQRCode(pixKey: string, amount?: number): string {
  if (!pixKey || pixKey.trim() === "") {
    // Se não houver chave PIX, retorna um QR Code com uma mensagem de erro
    return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250' viewBox='0 0 250 250'%3E%3Crect width='250' height='250' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='12' text-anchor='middle' fill='%23dc3545'%3EChave PIX não configurada%3C/text%3E%3C/svg%3E";
  }
  
  try {
    // Usar uma abordagem mais simples: gerar um QR code com a chave PIX e o valor
    // Os aplicativos de banco conseguem reconhecer chaves PIX diretamente
    let pixText = pixKey;
    
    // Se houver um valor, adicionar como informação
    if (amount && amount > 0) {
      pixText = `${pixKey} - Valor: R$ ${amount.toFixed(2)}`;
    }
    
    // Usar o serviço QR Server para gerar o QR code
    const encodedText = encodeURIComponent(pixText);
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedText}&format=png&qzone=2`;
  } catch (error) {
    console.error("Erro ao gerar QR Code PIX:", error);
    return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250' viewBox='0 0 250 250'%3E%3Crect width='250' height='250' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='12' text-anchor='middle' fill='%23dc3545'%3EErro ao gerar QR Code%3C/text%3E%3C/svg%3E";
  }
}
