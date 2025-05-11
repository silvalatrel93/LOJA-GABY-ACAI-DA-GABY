import { createSupabaseClient } from "../supabase-client"
import type { CarouselSlide } from "../types"

// Serviço para gerenciar slides do carrossel
export const CarouselService = {
  // Obter todos os slides
  async getAllSlides(): Promise<CarouselSlide[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("carousel_slides").select("*").order("order")

    if (error) {
      console.error("Erro ao buscar slides do carrossel:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      image: item.image,
      title: item.title || "",
      subtitle: item.subtitle || "",
      order: item.order,
      active: item.active,
    }))
  },

  // Obter slides ativos
  async getActiveSlides(): Promise<CarouselSlide[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("carousel_slides").select("*").eq("active", true).order("order")

    if (error) {
      console.error("Erro ao buscar slides ativos do carrossel:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      image: item.image,
      title: item.title || "",
      subtitle: item.subtitle || "",
      order: item.order,
      active: item.active,
    }))
  },

  // Alias para getActiveSlides para compatibilidade
  async getActiveCarouselSlides(): Promise<CarouselSlide[]> {
    return this.getActiveSlides()
  },

  // Obter slide por ID
  async getSlideById(id: number): Promise<CarouselSlide | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("carousel_slides").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error(`Erro ao buscar slide ${id}:`, error)
      return null
    }

    if (!data) {
      return null
    }

    return {
      id: data.id,
      image: data.image,
      title: data.title || "",
      subtitle: data.subtitle || "",
      order: data.order,
      active: data.active,
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
      }

      let result

      // Verificar se o slide já existe
      const existingSlide = await this.getSlideById(slide.id)

      if (existingSlide) {
        // Atualizar slide existente
        console.log(`Atualizando slide existente com ID ${slide.id}`)
        result = await supabase.from("carousel_slides").update(slideData).eq("id", slide.id).select()
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
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("carousel_slides").delete().eq("id", id)

    if (error) {
      console.error(`Erro ao excluir slide ${id}:`, error)
      return false
    }

    return true
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
