import crypto from 'crypto';

// Chave de criptografia - deve ser definida nas variáveis de ambiente
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars';
const ALGORITHM = 'aes-256-gcm';

/**
 * Serviço de criptografia para proteger dados sensíveis
 */
export class EncryptionService {
  /**
   * Criptografa um texto usando AES-256-GCM
   */
  static encrypt(text: string): string {
    try {
      // Gerar IV aleatório
      const iv = crypto.randomBytes(16);
      
      // Garantir que a chave tenha 32 bytes
      const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
      
      // Criar cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      cipher.setAAD(Buffer.from('mercado-pago-credentials'));
      
      // Criptografar
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Obter tag de autenticação
      const authTag = cipher.getAuthTag();
      
      // Combinar IV + authTag + dados criptografados
      const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
      
      return result;
    } catch (error) {
      console.error('Erro ao criptografar:', error);
      throw new Error('Falha na criptografia');
    }
  }

  /**
   * Descriptografa um texto criptografado
   */
  static decrypt(encryptedData: string): string {
    try {
      // Separar componentes
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Formato de dados criptografados inválido');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      // Garantir que a chave tenha 32 bytes
      const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

      // Criar decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAAD(Buffer.from('mercado-pago-credentials'));
      decipher.setAuthTag(authTag);

      // Descriptografar
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar:', error);
      throw new Error('Falha na descriptografia');
    }
  }

  /**
   * Gera uma chave de criptografia segura
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Valida se uma string está criptografada
   */
  static isEncrypted(data: string): boolean {
    try {
      const parts = data.split(':');
      return parts.length === 3 && 
             parts[0].length === 32 && // IV hex length
             parts[1].length === 32 && // AuthTag hex length
             parts[2].length > 0;      // Encrypted data
    } catch {
      return false;
    }
  }

  /**
   * Hash seguro para validação (não reversível)
   */
  static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Verifica se um texto corresponde ao hash
   */
  static verifyHash(text: string, hash: string): boolean {
    return this.hash(text) === hash;
  }
}

/**
 * Utilitários para mascarar dados sensíveis em logs
 */
export class DataMaskingService {
  /**
   * Mascara uma chave de API mostrando apenas os primeiros e últimos caracteres
   */
  static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '***';
    
    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '*'.repeat(Math.max(0, apiKey.length - 8));
    
    return `${start}${middle}${end}`;
  }

  /**
   * Mascara um email
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***@***.***';
    
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : '***';
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mascara um CPF/CNPJ
   */
  static maskDocument(document: string): string {
    if (!document) return '***';
    
    if (document.length === 11) {
      // CPF
      return `***${document.substring(3, 6)}***-**`;
    } else if (document.length === 14) {
      // CNPJ
      return `**${document.substring(2, 5)}***/**01-**`;
    }
    
    return '***';
  }
}

export default EncryptionService;
