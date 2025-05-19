import { createHash } from 'crypto';
import { supabase, testSupabaseConnection } from './supabase-client';

// Testar a conexão com o Supabase ao carregar o serviço
testSupabaseConnection().then(isConnected => {
  if (isConnected) {
    console.log('AuthService: Conexão com o Supabase estabelecida');
  } else {
    console.error('AuthService: Falha na conexão com o Supabase');
  }
});

/**
 * Serviço para gerenciar autenticação e senhas de administrador
 * Utiliza hash seguro com salt para armazenar senhas
 */
export class AuthService {
  /**
   * Gera um hash seguro da senha usando SHA-256 com salt
   * @param password Senha em texto simples
   * @returns Hash da senha com salt
   */
  static generatePasswordHash(password: string): string {
    // Usar um salt fixo baseado em uma variável de ambiente ou gerar um dinamicamente
    const salt = process.env.NEXT_PUBLIC_PASSWORD_SALT || 'heai-acai-salt-default';
    
    // Criar o hash usando SHA-256 com salt
    return createHash('sha256')
      .update(password + salt)
      .digest('hex');
  }

  /**
   * Verifica se a senha fornecida corresponde ao hash armazenado
   * @param password Senha em texto simples para verificar
   * @param storedHash Hash armazenado para comparação
   * @returns Verdadeiro se a senha corresponder ao hash
   */
  static verifyPassword(password: string, storedHash: string): boolean {
    const hashedPassword = this.generatePasswordHash(password);
    return hashedPassword === storedHash;
  }

  /**
   * Salva a senha do administrador no banco de dados
   * @param password Senha em texto simples para salvar
   * @returns Resultado da operação
   */
  static async saveAdminPassword(password: string): Promise<{ success: boolean; error?: any }> {
    try {
      const hashedPassword = this.generatePasswordHash(password);
      
      // Verificar se já existe uma configuração de senha
      const { data: existingConfig, error: fetchError } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'admin_password')
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 é o código para "no rows found"
        console.error('Erro ao verificar senha existente:', fetchError);
        return { success: false, error: fetchError };
      }
      
      if (existingConfig) {
        // Atualizar senha existente
        const { error: updateError } = await supabase
          .from('admin_settings')
          .update({ value: hashedPassword, updated_at: new Date().toISOString() })
          .eq('key', 'admin_password');
        
        if (updateError) {
          console.error('Erro ao atualizar senha:', updateError);
          return { success: false, error: updateError };
        }
      } else {
        // Inserir nova senha
        const { error: insertError } = await supabase
          .from('admin_settings')
          .insert([
            { 
              key: 'admin_password', 
              value: hashedPassword,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
        
        if (insertError) {
          console.error('Erro ao inserir senha:', insertError);
          return { success: false, error: insertError };
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar senha do administrador:', error);
      return { success: false, error };
    }
  }

  /**
   * Verifica se a senha do administrador está correta
   * @param password Senha em texto simples para verificar
   * @returns Verdadeiro se a senha estiver correta
   */
  static async verifyAdminPassword(password: string): Promise<boolean> {
    try {
      console.log('Verificando senha do administrador...');
      
      // Buscar a senha armazenada no banco de dados
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'admin_password')
        .single();
      
      if (error) {
        console.error('Erro ao buscar senha do administrador:', error);
        return false;
      }
      
      if (!data) {
        console.error('Nenhuma senha de administrador encontrada no banco de dados');
        return false;
      }
      
      console.log('Senha encontrada no banco de dados, verificando hash...');
      
      // Verificar se a senha fornecida corresponde ao hash armazenado
      const hashedPassword = this.generatePasswordHash(password);
      const isValid = hashedPassword === data.value;
      
      console.log('Resultado da verificação de senha:', isValid ? 'Válida' : 'Inválida');
      
      return isValid;
    } catch (error) {
      console.error('Exceção ao verificar senha do administrador:', error);
      return false;
    }
  }

  /**
   * Verifica se existe uma senha de administrador configurada
   * @returns Verdadeiro se existir uma senha configurada
   */
  static async hasAdminPassword(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'admin_password')
        .single();
      
      return !error && !!data;
    } catch (error) {
      console.error('Erro ao verificar existência de senha:', error);
      return false;
    }
  }
}
