import { createSupabaseClient } from "../supabase-client"
import type { CarouselSlide } from "../types"
import { DEFAULT_STORE_ID } from "../constants"
import { 
  getOrderedRecordsWithStoreFilter, 
  getActiveOrderedRecordsWithStoreFilter, 
  getRecordByIdWithStoreFilter,
  insertWithStoreId,
  updateWithStoreFilter,
  deleteWithStoreFilter,
  safelyGetRecordById
} from "../supabase-utils"

// Serviço para gerenciar slides do carrossel
export const CarouselService = {
  // Obter todos os slides
  async getAllSlides(): Promise<CarouselSlide[]> {
    try {
      console.log("Iniciando getAllSlides")
      const supabase = createSupabaseClient()
      
      // Usar a função utilitária para obter registros ordenados com filtro de store_id
      const { data, error } = await getOrderedRecordsWithStoreFilter(supabase, "carousel_slides")

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
      console.log("Iniciando getActiveSlides")
      const supabase = createSupabaseClient()
      
      // Usar a função utilitária para obter registros ativos e ordenados com filtro de store_id
      const { data, error } = await getActiveOrderedRecordsWithStoreFilter(supabase, "carousel_slides")

      if (error) {
        console.error("Erro ao buscar slides ativos do carrossel:", error)
        return []
      }
      
      if (!data || !Array.isArray(data)) {
        console.log("Nenhum slide ativo encontrado")
        return []
      }

      console.log(`Encontrados ${data.length} slides ativos`)
      
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
      console.log(`Iniciando getSlideById para o slide ${id}`)
      
      if (!id || isNaN(id)) {
        console.error(`ID inválido para busca: ${id}`)
        return null
      }
      
      const supabase = createSupabaseClient()
      
      // Usar a função utilitária segura para obter um registro específico pelo ID com filtro de store_id
      // Esta função usa .maybeSingle() e tem tratamento de erros robusto
      const { data, error } = await safelyGetRecordById<any>(supabase, "carousel_slides", "id", id)

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
      console.log(`Iniciando saveSlide para o slide ${slide.id || 'novo'}`)
      const supabase = createSupabaseClient()

      const slideData = {
        image: slide.image,
        title: slide.title,
        subtitle: slide.subtitle,
        order: slide.order,
        active: slide.active,
        // store_id será adicionado automaticamente pelas funções utilitárias
      }

      let result;

      // Verificar se o slide já existe
      const existingSlide = await this.getSlideById(slide.id)

      if (existingSlide) {
        // Atualizar slide existente
        console.log(`Atualizando slide existente com ID ${slide.id}`)
        // Usar a função utilitária para atualizar com filtro de store_id
        result = await updateWithStoreFilter(supabase, "carousel_slides", slideData, "id", slide.id)
      } else {
        // Criar novo slide
        console.log("Criando novo slide")
        // Usar a função utilitária para inserir com store_id incluído automaticamente
        result = await insertWithStoreId(supabase, "carousel_slides", slideData)
      }

      if (result.error) {
        console.error("Erro ao salvar slide:", result.error)
        throw new Error(`Erro ao salvar slide: ${result.error.message}`)
      }

      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        console.error("Nenhum dado retornado ao salvar slide")
        throw new Error("Nenhum dado retornado ao salvar slide")
      }

      const data = result.data[0] as any

      console.log(`Slide salvo com sucesso. ID: ${data.id}`)
      
      return {
        id: Number(data.id),
        image: String(data.image || ""),
        title: String(data.title || ""),
        subtitle: String(data.subtitle || ""),
        order: Number(data.order),
        active: Boolean(data.active),
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
      
      // Abordagem direta: excluir o slide diretamente com os filtros necessários
      // Isso evita chamadas adicionais ao banco de dados
      console.log(`Excluindo slide ${id} diretamente`)
      const { error } = await supabase
        .from("carousel_slides")
        .delete()
        .eq("id", id)
        .eq("store_id", DEFAULT_STORE_ID)

      if (error) {
        console.error(`Erro ao excluir slide ${id}:`, error)
        return false
      }

      console.log(`Slide ${id} excluído com sucesso.`)
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
