import { createSupabaseClient } from "../supabase-client"
import type { CarouselSlide } from "../types"
import { DEFAULT_STORE_ID } from "../constants"

// Serviço para gerenciar slides do carrossel
export const CarouselService = {
  // Obter todos os slides
  async getAllSlides(): Promise<CarouselSlide[]> {
    try {
      console.log("Iniciando getAllSlides")
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("carousel_slides")
        .select("*")
        .eq("store_id", DEFAULT_STORE_ID)
        .order("order")

      if (error) {
        console.error("Erro ao buscar slides do carrossel:", error)
        return []
      }
      
      if (!data || !Array.isArray(data)) {
        console.log("Nenhum slide encontrado ou data não é um array")
        return []
      }

      console.log(`Encontrados ${data.length} slides`)
      
      return data.map((item: any) => ({
        id: Number(item.id),
        image: String(item.image || ""),
        title: String(item.title || ""),
        subtitle: String(item.subtitle || ""),
        order: Number(item.order),
        active: Boolean(item.active),
      }))
    } catch (error) {
      console.error("Erro ao buscar slides do carrossel:", error)
      return []
    }
  },

  // Obter slides ativos
  async getActiveSlides(): Promise<CarouselSlide[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("carousel_slides")
        .select("*")
        .eq("active", true)
        .eq("store_id", DEFAULT_STORE_ID)
        .order("order")

      if (error) {
        console.error("Erro ao buscar slides ativos do carrossel:", error)
        return []
      }
      
      if (!data || !Array.isArray(data)) {
        return []
      }

      return data.map((item: any) => ({
        id: Number(item.id),
        image: String(item.image || ""),
        title: String(item.title || ""),
        subtitle: String(item.subtitle || ""),
        order: Number(item.order),
        active: Boolean(item.active),
      }))
    } catch (error) {
      console.error("Erro ao buscar slides ativos do carrossel:", error)
      return []
    }
  },

  // Alias para getActiveSlides para compatibilidade
  async getActiveCarouselSlides(): Promise<CarouselSlide[]> {
    return this.getActiveSlides()
  },

  // Obter slide por ID
  async getSlideById(id: number): Promise<CarouselSlide | null> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("carousel_slides")
        .select("*")
        .eq("id", id)
        .eq("store_id", DEFAULT_STORE_ID)
        .maybeSingle()

      if (error) {
        console.error(`Erro ao buscar slide ${id}:`, error)
        return null
      }

      if (!data) {
        console.log(`Slide ${id} não encontrado`)
        return null
      }

      return {
        id: Number(data.id),
        image: String(data.image || ""),
        title: String(data.title || ""),
        subtitle: String(data.subtitle || ""),
        order: Number(data.order),
        active: Boolean(data.active),
      }
    } catch (error) {
      console.error(`Erro ao buscar slide ${id}:`, error)
      return null
    }
  },

  // Salvar slide
  async saveSlide(slide: CarouselSlide): Promise<CarouselSlide | null> {
    try {
      const supabase = createSupabaseClient()

      const slideData = {
        id: slide.id,
        image: slide.image,
        title: slide.title,
        subtitle: slide.subtitle,
        order: slide.order,
        active: slide.active,
        store_id: DEFAULT_STORE_ID, // Adicionar o ID da loja padrão
      }

      let result;

      // Verificar se o slide já existe
      const existingSlide = await this.getSlideById(slide.id)

      if (existingSlide) {
        // Atualizar slide existente
        console.log(`Atualizando slide existente com ID ${slide.id}`)
        result = await supabase.from("carousel_slides").update(slideData).eq("id", slide.id).eq("store_id", DEFAULT_STORE_ID).select()
      } else {
        // Criar novo slide
        console.log("Criando novo slide")
        // Remover o ID para que o banco de dados gere um novo
        const { id, ...newSlideData } = slideData
        result = await supabase.from("carousel_slides").insert(newSlideData).select()
      }

      if (result.error) {
        console.error("Erro ao salvar slide:", result.error)
        throw new Error(`Erro ao salvar slide: ${result.error.message}`)
      }

      if (!result.data || result.data.length === 0) {
        console.error("Nenhum dado retornado ao salvar slide")
        throw new Error("Nenhum dado retornado ao salvar slide")
      }

      const data = result.data[0]

      return {
        id: data.id,
        image: data.image,
        title: data.title || "",
        subtitle: data.subtitle || "",
        order: data.order,
        active: data.active,
      }
    } catch (error) {
      console.error("Erro ao salvar slide:", error)
      throw error
    }
  },

  // Excluir slide
  async deleteSlide(id: number): Promise<boolean> {
    try {
      console.log(`Iniciando exclusão do slide ${id}`)
      console.log(`DEFAULT_STORE_ID: ${DEFAULT_STORE_ID}`)
      
      if (!id || isNaN(id)) {
        console.error(`ID inválido para exclusão: ${id}`)
        return false
      }
      
      const supabase = createSupabaseClient()
      
      // Verificar se o slide existe antes de tentar excluí-lo
      console.log(`Verificando existência do slide ${id} para a loja ${DEFAULT_STORE_ID}`)
      const { data: existingData, error: checkError } = await supabase
        .from("carousel_slides")
        .select("*")
        .eq("id", id)
        .eq("store_id", DEFAULT_STORE_ID)
        .maybeSingle()
      
      if (checkError) {
        console.error(`Erro ao verificar existência do slide ${id}:`, checkError)
        return false
      }
      
      if (!existingData) {
        console.error(`Slide ${id} não encontrado para exclusão ou não pertence à loja ${DEFAULT_STORE_ID}`)
        return false
      }
      
      console.log(`Slide ${id} encontrado:`, existingData)
      console.log(`Prosseguindo com a exclusão do slide ${id}`)
      
      // Excluir o slide com o filtro de store_id
      const { error, count } = await supabase
        .from("carousel_slides")
        .delete()
        .eq("id", id)
        .eq("store_id", DEFAULT_STORE_ID)

      if (error) {
        console.error(`Erro ao excluir slide ${id}:`, error)
        return false
      }

      console.log(`Slide ${id} excluído com sucesso. Registros afetados: ${count || 1}`)
      return true
    } catch (error) {
      console.error(`Erro inesperado ao excluir slide ${id}:`, error)
      console.error('Detalhes do erro:', error instanceof Error ? error.message : String(error))
      return false
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllSlides = CarouselService.getAllSlides.bind(CarouselService)
export const getActiveSlides = CarouselService.getActiveSlides.bind(CarouselService)
export const getActiveCarouselSlides = CarouselService.getActiveCarouselSlides.bind(CarouselService)
export const getSlideById = CarouselService.getSlideById.bind(CarouselService)
export const saveSlide = CarouselService.saveSlide.bind(CarouselService)
export const deleteSlide = CarouselService.deleteSlide.bind(CarouselService)

// Exportar tipos
export type { CarouselSlide } from "../types"
