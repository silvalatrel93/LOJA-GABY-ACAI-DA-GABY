/**
 * Utilitário para garantir chaves React seguras e não vazias
 * 
 * Este arquivo fornece funções para garantir que as chaves (keys) em elementos React
 * nunca sejam vazias, prevenindo o erro "Encountered two children with the same key"
 */

/**
 * Cria uma chave segura a partir de qualquer valor, garantindo que nunca seja vazia
 * @param value O valor original que será usado como chave
 * @param prefix Um prefixo opcional para a chave
 * @param fallbackIndex Um índice de fallback para garantir unicidade
 * @returns Uma string não vazia para ser usada como chave React
 */
export function createSafeKey(
  value: any, 
  prefix: string = 'key', 
  fallbackIndex?: number
): string {
  // Se o valor for undefined, null ou string vazia
  if (value === undefined || value === null || value === '') {
    // Se um fallbackIndex for fornecido, use-o
    if (fallbackIndex !== undefined) {
      return `${prefix}-${fallbackIndex}`;
    }
    // Caso contrário, use um timestamp para garantir unicidade
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Se o valor for um objeto, tente usar o ID ou converta para string
  if (typeof value === 'object') {
    if ('id' in value && value.id) {
      return `${prefix}-${value.id}`;
    }
    // Tentativa de criar uma string de chave para objetos sem ID
    try {
      const objString = JSON.stringify(value);
      return `${prefix}-${objString.length > 20 ? 
        objString.substring(0, 20) + '_hash_' + hashString(objString) : 
        objString}`;
    } catch (e) {
      // Se falhar, use timestamp
      return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // Se o valor for um array, transforme em string e use hash
  if (Array.isArray(value)) {
    return `${prefix}-array-${value.length}-${hashString(value.join(','))}`;
  }

  // Para outros valores (número, boolean, etc.), converta para string
  return `${prefix}-${String(value)}`;
}

/**
 * Cria um hash simples a partir de uma string
 * @param str A string para criar o hash
 * @returns Um valor de hash numérico
 */
function hashString(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para um inteiro de 32 bits
  }
  
  return Math.abs(hash);
}

/**
 * Função específica para gerar chaves seguras para itens de carrinho
 */
export function createCartItemKey(item: any): string {
  if (!item) return createSafeKey(null, 'cart-item');
  
  // Combina ID do produto, tamanho e adicionais para uma chave única
  const additionalIds = item.additionals?.map((a: any) => a.id).join('-') || 'no-adds';
  return createSafeKey(`${item.id}-${item.size}-${additionalIds}`, 'cart-item');
}

/**
 * Função específica para gerar chaves seguras para adicionais
 */
export function createAdditionalKey(additional: any, parentId?: string | number): string {
  if (!additional) return createSafeKey(null, 'additional');
  
  const prefix = parentId ? `additional-${parentId}` : 'additional';
  return createSafeKey(additional.id, prefix);
}
