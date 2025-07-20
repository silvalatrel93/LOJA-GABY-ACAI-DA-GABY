import { createHash } from 'crypto';
import { supabase, testSupabaseConnection } from './supabase-client';

// Testar a conexão com o Supabase ao carregar o serviço
testSupabaseConnection().then(isConnected => {
  if (isConnected) {
    console.log('AuthService: Conexão com o Supabase estabelecida');
  } else {
    console.error('AuthService: Falha na conexão com o Supabase');
    // Tentar reconectar após um breve intervalo
    setTimeout(() => {
      console.log('AuthService: Tentando reconectar ao Supabase...');
      testSupabaseConnection();
    }, 2000);
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
    try {
      // Usar um salt fixo baseado em uma variável de ambiente ou gerar um dinamicamente
      const salt = process.env.NEXT_PUBLIC_PASSWORD_SALT || 'heai-acai-salt-default';
      console.log('[DEBUG] Salt usado:', salt);
      console.log('[DEBUG] Password + Salt:', password + salt);
      
      // Criar o hash usando SHA-256 com salt
      const hash = createHash('sha256')
        .update(password + salt)
        .digest('hex');
      
      console.log('[DEBUG] Hash gerado:', hash);
      return hash;
    } catch (error) {
      console.error('Erro ao gerar hash da senha:', error);
      // Fallback para um método mais simples em caso de erro
      return createHash('sha256').update(password).digest('hex');
    }
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
      console.log('Iniciando processo de salvamento de senha...');
      
      // Verificar se a conexão com o Supabase está funcionando
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.error('Não foi possível conectar ao Supabase para salvar a senha');
        return { success: false, error: 'Falha na conexão com o banco de dados' };
      }
      
      const hashedPassword = this.generatePasswordHash(password);
      console.log('Hash da senha gerado com sucesso');
      
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
      
      let result;
      
      if (existingConfig) {
        console.log('Senha existente encontrada, atualizando...');
        // Atualizar senha existente
        result = await supabase
          .from('admin_settings')
          .update({ value: hashedPassword, updated_at: new Date().toISOString() })
          .eq('key', 'admin_password');
      } else {
        console.log('Nenhuma senha existente, criando nova entrada...');
        // Inserir nova senha
        result = await supabase
          .from('admin_settings')
          .insert([
            { 
              key: 'admin_password', 
              value: hashedPassword,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
      }
      
      if (result.error) {
        console.error('Erro na operação de banco de dados:', result.error);
        return { success: false, error: result.error };
      }
      
      console.log('Senha salva com sucesso no banco de dados');
      
      // Verificar se a senha foi realmente salva
      const verificationResult = await this.hasAdminPassword();
      if (!verificationResult) {
        console.error('Verificação falhou: A senha parece não ter sido salva corretamente');
        return { success: false, error: 'Falha na verificação após salvar' };
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
      
      // Verificar se a conexão com o Supabase está funcionando
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.error('Não foi possível conectar ao Supabase para verificar a senha');
        return false;
      }
      
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
      
      if (!data || !data.value) {
        console.error('Nenhuma senha de administrador encontrada no banco de dados');
        return false;
      }
      
      console.log('Senha encontrada no banco de dados, verificando hash...');
      console.log('Hash armazenado no banco:', data.value);
      
      // Verificar se a senha fornecida corresponde ao hash armazenado
      const hashedPassword = this.generatePasswordHash(password);
      console.log('Hash gerado para senha fornecida:', hashedPassword);
      console.log('Senha fornecida (para debug):', password);
      
      const isValid = hashedPassword === data.value;
      
      console.log('Resultado da verificação de senha:', isValid ? 'Válida' : 'Inválida');
      console.log('Comparação detalhada:');
      console.log('  Armazenado:', data.value);
      console.log('  Gerado:    ', hashedPassword);
      console.log('  Iguais?:   ', isValid);
      
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
      console.log('Verificando se existe uma senha de administrador...');
      
      // Verificar se a conexão com o Supabase está funcionando
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.error('Não foi possível conectar ao Supabase para verificar existência de senha');
        return false;
      }
      
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'admin_password')
        .single();
      
      const hasPassword = !error && !!data && !!data.value;
      console.log('Resultado da verificação de existência de senha:', hasPassword ? 'Existe' : 'Não existe');
      
      return hasPassword;
    } catch (error) {
      console.error('Erro ao verificar existência de senha:', error);
      return false;
    }
  }
}
