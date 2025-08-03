import { createSupabaseClient } from "../supabase-client"

export async function createAdminSettingsTable(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()
    
    console.log("Verificando se a tabela admin_settings já existe...")
    
    // Verificar se a tabela já existe
    const { data: tableExists, error: checkError } = await supabase
      .from("admin_settings")
      .select("count")
      .limit(1)
    
    if (!checkError) {
      console.log("Tabela admin_settings já existe!")
      return true
    }
    
    if (checkError.code !== "PGRST116") {
      console.error("Erro ao verificar tabela admin_settings:", checkError)
      return false
    }
    
    console.log("Criando tabela admin_settings...")
    
    // Usar a API de migração do projeto
    const response = await fetch('/api/db-migration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          CREATE TABLE admin_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            key TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX admin_settings_key_idx ON admin_settings (key);
          
          CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
             NEW.updated_at = NOW();
             RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER update_admin_settings_updated_at 
            BEFORE UPDATE ON admin_settings 
            FOR EACH ROW 
            EXECUTE PROCEDURE update_admin_settings_updated_at();
        `
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error("Erro ao criar tabela admin_settings:", errorData)
      return false
    }
    
    console.log("Tabela admin_settings criada com sucesso!")
    return true
    
  } catch (error) {
    console.error("Erro ao executar migração admin_settings:", error)
    return false
  }
}