import { createSupabaseClient } from "../supabase-client"
import type { CarouselSlide } from "../types"

export const CarouselService = {
  // Obter todos os slides
  async getAllSlides(): Promise<CarouselSlide[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("carousel_slides")
        .select("*")
        .order("order", { ascending: true })

      if (error) {
        console.error("Erro ao buscar slides:", error)
        return []
      }

      return (data || []).map((slide: any) => ({
        id: Number(slide.id),
        title: String(slide.title),
        subtitle: String(slide.subtitle || ""),
        image: String(slide.image),
        active: Boolean(slide.active),
        order: Number(slide.order),
      }))
    } catch (error) {
      console.error("Erro ao buscar slides:", error)
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
        .order("order", { ascending: true })

      if (error) {
        console.error("Erro ao buscar slides ativos:", error)
        return []
      }

      return (data || []).map((slide: any) => ({
        id: Number(slide.id),
        title: String(slide.title),
        subtitle: String(slide.subtitle || ""),
        image: String(slide.image),
        active: Boolean(slide.active),
        order: Number(slide.order),
      }))
    } catch (error) {
      console.error("Erro ao buscar slides ativos:", error)
      return []
    }
  },

  // Obter slide por ID
  async getSlideById(id: number): Promise<CarouselSlide | null> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("carousel_slides")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error(`Erro ao buscar slide ${id}:`, error)
        return null
      }

      if (!data) {
        return null
      }

      return {
        id: Number(data.id),
        title: String(data.title),
        subtitle: String(data.subtitle || ""),
        image: String(data.image),
        active: Boolean(data.active),
        order: Number(data.order),
      }
    } catch (error) {
      console.error(`Erro ao buscar slide ${id}:`, error)
      return null
    }
  },

  // Salvar slide
  async saveSlide(slide: CarouselSlide): Promise<{ data: CarouselSlide | null; error: Error | null }> {
    try {
      const supabase = createSupabaseClient()

      if (slide.id && slide.id > 0) {
        // Atualizar slide existente
        const { data, error } = await supabase
          .from("carousel_slides")
          .update({
            title: slide.title,
            subtitle: slide.subtitle,
            image: slide.image,
            active: slide.active,
            order: slide.order,
          })
          .eq("id", slide.id)
          .select()
          .single()

        if (error) {
          console.error("Erro ao atualizar slide:", error)
          return { data: null, error: new Error(error.message) }
        }

        const result: CarouselSlide = {
          id: Number(data.id),
          title: String(data.title),
          subtitle: String(data.subtitle || ""),
          image: String(data.image),
          active: Boolean(data.active),
          order: Number(data.order),
        }

        return { data: result, error: null }
      } else {
        // Criar novo slide
        const { data, error } = await supabase
          .from("carousel_slides")
          .insert({
            title: slide.title,
            subtitle: slide.subtitle,
            image: slide.image,
            active: slide.active !== undefined ? slide.active : true,
            order: slide.order || 0,
          })
          .select()
          .single()

        if (error) {
          console.error("Erro ao criar slide:", error)
          return { data: null, error: new Error(error.message) }
        }

        const result: CarouselSlide = {
          id: Number(data.id),
          title: String(data.title),
          subtitle: String(data.subtitle || ""),
          image: String(data.image),
          active: Boolean(data.active),
          order: Number(data.order),
        }

        return { data: result, error: null }
      }
    } catch (error) {
      console.error("Erro ao salvar slide:", error)
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
    }
  },

  // Excluir slide
  async deleteSlide(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from("carousel_slides")
        .delete()
        .eq("id", id)

      if (error) {
        console.error(`Erro ao deletar slide ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao deletar slide ${id}:`, error)
      return false
    }
  },

  // Reordenar slides
  async reorderSlides(slides: { id: number; order: number }[]): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()

      for (const slide of slides) {
        const { error } = await supabase
          .from("carousel_slides")
          .update({ order: slide.order })
          .eq("id", slide.id)

        if (error) {
          console.error(`Erro ao reordenar slide ${slide.id}:`, error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error("Erro ao reordenar slides:", error)
      return false
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllSlides = CarouselService.getAllSlides.bind(CarouselService)
export const getActiveSlides = CarouselService.getActiveSlides.bind(CarouselService)
export const getSlideById = CarouselService.getSlideById.bind(CarouselService)
export const saveSlide = CarouselService.saveSlide.bind(CarouselService)
export const deleteSlide = CarouselService.deleteSlide.bind(CarouselService)
export const reorderSlides = CarouselService.reorderSlides.bind(CarouselService)

// Exportar tipos
export type { CarouselSlide } from "../types"
