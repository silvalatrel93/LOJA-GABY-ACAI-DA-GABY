import { createSupabaseClient } from "../supabase-client"
import type { Phrase } from "../types"

// Serviço para gerenciar frases
export const PhraseService = {
  // Obter todas as frases
  async getAllPhrases(): Promise<Phrase[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("phrases").select("*").order("order")

    if (error) {
      console.error("Erro ao buscar frases:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      text: item.text,
      order: item.order,
      active: item.active,
    }))
  },

  // Obter frases ativas
  async getActivePhrases(): Promise<Phrase[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("phrases").select("*").eq("active", true).order("order")

    if (error) {
      console.error("Erro ao buscar frases ativas:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      text: item.text,
      order: item.order,
      active: item.active,
    }))
  },

  // Obter frase por ID
  async getPhraseById(id: number): Promise<Phrase | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("phrases").select("*").eq("id", id).single()

    if (error) {
      console.error(`Erro ao buscar frase ${id}:`, error)
      return null
    }

    return {
      id: data.id,
      text: data.text,
      order: data.order,
      active: data.active,
    }
  },

  // Salvar frase
  async savePhrase(phrase: Phrase): Promise<Phrase | null> {
    const supabase = createSupabaseClient()

    const phraseData = {
      id: phrase.id,
      text: phrase.text,
      order: phrase.order,
      active: phrase.active,
    }

    let result

    if (phrase.id) {
      // Atualizar frase existente
      result = await supabase.from("phrases").update(phraseData).eq("id", phrase.id).select().single()
    } else {
      // Criar nova frase
      result = await supabase.from("phrases").insert(phraseData).select().single()
    }

    if (result.error) {
      console.error("Erro ao salvar frase:", result.error)
      return null
    }

    const data = result.data

    return {
      id: data.id,
      text: data.text,
      order: data.order,
      active: data.active,
    }
  },

  // Excluir frase
  async deletePhrase(id: number): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("phrases").delete().eq("id", id)

    if (error) {
      console.error(`Erro ao excluir frase ${id}:`, error)
      return false
    }

    return true
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllPhrases = PhraseService.getAllPhrases.bind(PhraseService)
export const getActivePhrases = PhraseService.getActivePhrases.bind(PhraseService)
export const getPhraseById = PhraseService.getPhraseById.bind(PhraseService)
export const savePhrase = PhraseService.savePhrase.bind(PhraseService)
export const deletePhrase = PhraseService.deletePhrase.bind(PhraseService)

// Exportar tipos
export type { Phrase } from "../types"
