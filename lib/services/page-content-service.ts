import { createSupabaseClient } from "../supabase-client"
import type { PageContent } from "../types"

// Serviço para gerenciar conteúdo das páginas
export const PageContentService = {
  // Obter todos os conteúdos de página
  async getAllPageContents(): Promise<PageContent[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("page_content").select("*")

    if (error) {
      console.error("Erro ao buscar todos os conteúdos de página:", error)
      return []
    }

    return data.map((item: any) => ({
      id: String(item.id),
      title: String(item.title),
      content: String(item.content),
      lastUpdated: new Date(),
    }))
  },

  // Obter conteúdo da página por ID
  async getPageContent(id: string): Promise<PageContent | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("page_content").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error(`Erro ao buscar conteúdo da página ${id}:`, error)
      return null
    }

    if (!data) {
      return null
    }

    const typedData = data as any

    return {
      id: String(typedData.id),
      title: String(typedData.title),
      content: String(typedData.content),
      lastUpdated: new Date(typedData.last_updated),
    }
  },

  // Obter conteúdo da página por slug
  async getPageContentBySlug(slug: string): Promise<PageContent | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("page_content").select("*").eq("id", slug).maybeSingle()

    if (error) {
      console.error(`Erro ao buscar conteúdo da página com slug ${slug}:`, error)
      return null
    }

    if (!data) {
      return null
    }

    const typedData = data as any

    return {
      id: String(typedData.id),
      title: String(typedData.title),
      content: String(typedData.content),
      lastUpdated: new Date(typedData.last_updated),
    }
  },

  // Salvar conteúdo da página
  async savePageContent(pageContent: PageContent): Promise<PageContent | null> {
    const supabase = createSupabaseClient()

    const pageContentData = {
      id: pageContent.id,
      title: pageContent.title,
      content: pageContent.content,
      last_updated: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("page_content").upsert(pageContentData).select().maybeSingle()

    if (error) {
      console.error("Erro ao salvar conteúdo da página:", error)
      return null
    }

    if (!data) {
      return null
    }

    const typedData = data as any

    return {
      id: String(typedData.id),
      title: String(typedData.title),
      content: String(typedData.content),
      lastUpdated: new Date(typedData.last_updated),
    }
  },

  // Excluir conteúdo da página
  async deletePageContent(id: string): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("page_content").delete().eq("id", id)

    if (error) {
      console.error(`Erro ao excluir conteúdo da página ${id}:`, error)
      return false
    }

    return true
  },

  // Nota: Inicialização de conteúdo padrão foi removida para evitar dados mockup
  // Os usuários devem criar seu próprio conteúdo através do painel administrativo
  async initializeDefaultPageContent(): Promise<void> {
    console.log("Função de inicialização de conteúdo desabilitada - sem dados mockup")
    // Não inicializa dados automáticos - deixa para o usuário configurar
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllPageContents = PageContentService.getAllPageContents.bind(PageContentService)
export const getPageContent = PageContentService.getPageContent.bind(PageContentService)
export const getPageContentBySlug = PageContentService.getPageContentBySlug.bind(PageContentService)
export const savePageContent = PageContentService.savePageContent.bind(PageContentService)
export const deletePageContent = PageContentService.deletePageContent.bind(PageContentService)
export const initializeDefaultPageContent = PageContentService.initializeDefaultPageContent.bind(PageContentService)
