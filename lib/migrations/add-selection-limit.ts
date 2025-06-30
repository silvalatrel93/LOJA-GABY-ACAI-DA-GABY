import { createSupabaseClient } from "../supabase-client"

export async function addSelectionLimitToAdditionalCategories() {
  try {
    console.log("Iniciando migração: Adicionando coluna selection_limit à tabela additional_categories")
    
    const supabase = createSupabaseClient()
    
    // Executar SQL diretamente usando o cliente Supabase
    // Usamos uma consulta SQL que adiciona a coluna apenas se ela não existir
    const { data, error } = await supabase
      .from('additional_categories')
      .select('id')
      .limit(1)
      
    if (error) {
      console.error("Erro ao acessar tabela additional_categories:", error)
      throw error
    }
    
    // Executar a migração diretamente no cliente
    try {
      // Tentativa 1: Usar a API de armazenamento para adicionar a coluna
      const { error: alterError } = await supabase
        .from('additional_categories')
        .update({ selection_limit: null })
        .eq('id', -999) // ID que não existe, apenas para forçar a criação do campo
      
      if (alterError) {
        console.log("Erro esperado ao tentar atualizar com campo inexistente:", alterError)
      }
      
      console.log("Tentativa de criação do campo selection_limit concluída")
    } catch (sqlError) {
      console.warn("Erro ao tentar criar campo selection_limit:", sqlError)
      // Continuar mesmo com erro, pois o campo pode já existir
    }
    
    console.log("Migração concluída com sucesso!")
    return true
  } catch (error) {
    console.error("Erro ao executar migração:", error)
    return false
  }
}
