import { createSupabaseClient } from "../supabase-client"
import type { PageContent } from "../types"
import { DEFAULT_STORE_ID } from "../constants"

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

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      lastUpdated: new Date(item.last_updated),
    }))
  },

  // Obter conteúdo da página por ID
  async getPageContent(id: string): Promise<PageContent | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("page_content").select("*").eq("id", id).single()

    if (error) {
      console.error(`Erro ao buscar conteúdo da página ${id}:`, error)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      lastUpdated: new Date(data.last_updated),
    }
  },

  // Obter conteúdo da página por slug
  async getPageContentBySlug(slug: string): Promise<PageContent | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("page_content").select("*").eq("id", slug).single()

    if (error) {
      console.error(`Erro ao buscar conteúdo da página com slug ${slug}:`, error)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      lastUpdated: new Date(data.last_updated),
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
      store_id: DEFAULT_STORE_ID, // Adicionar o ID da loja padrão
    }

    const { data, error } = await supabase.from("page_content").upsert(pageContentData).select().single()

    if (error) {
      console.error("Erro ao salvar conteúdo da página:", error)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      lastUpdated: new Date(data.last_updated),
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

  // Inicializar conteúdo padrão das páginas
  async initializeDefaultPageContent(): Promise<void> {
    console.log("Verificando conteúdo das páginas...")

    // Página Sobre
    const sobreContent = await this.getPageContent("sobre")

    if (!sobreContent) {
      console.log("Inicializando conteúdo da página Sobre...")

      await this.savePageContent({
        id: "sobre",
        title: "Sobre Nós",
        content: `
# Sobre a Açaí Delícia

Bem-vindo à Açaí Delícia, onde servimos o melhor açaí da cidade!

## Nossa História

Fundada em 2020, a Açaí Delícia nasceu da paixão por oferecer produtos de qualidade e sabor incomparável. Utilizamos apenas ingredientes frescos e de alta qualidade para garantir a melhor experiência para nossos clientes.

## Nosso Compromisso

- Qualidade superior
- Atendimento excelente
- Preços justos
- Entrega rápida

Venha nos visitar e experimente o melhor açaí da região!
        `,
        lastUpdated: new Date(),
      })

      console.log("Conteúdo da página Sobre inicializado com sucesso!")
    } else {
      console.log("Conteúdo da página Sobre encontrado, pulando inicialização.")
    }

    // Página Delivery
    const deliveryContent = await this.getPageContent("delivery")

    if (!deliveryContent) {
      console.log("Inicializando conteúdo da página Delivery...")

      await this.savePageContent({
        id: "delivery",
        title: "Delivery",
        content: `
# Delivery

Entregamos em toda a cidade! Peça agora mesmo e receba seu açaí fresquinho em casa.

## Áreas de Entrega

- Centro
- Zona Norte
- Zona Sul
- Zona Leste
- Zona Oeste

## Tempo de Entrega

O tempo médio de entrega é de 30 a 45 minutos, dependendo da sua localização.

## Taxa de Entrega

A taxa de entrega varia de acordo com a região. Consulte o valor ao fazer seu pedido.

## Formas de Pagamento

- Dinheiro
- Cartão de Crédito/Débito
- Pix
        `,
        lastUpdated: new Date(),
      })

      console.log("Conteúdo da página Delivery inicializado com sucesso!")
    } else {
      console.log("Conteúdo da página Delivery encontrado, pulando inicialização.")
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllPageContents = PageContentService.getAllPageContents.bind(PageContentService)
export const getPageContent = PageContentService.getPageContent.bind(PageContentService)
export const getPageContentBySlug = PageContentService.getPageContentBySlug.bind(PageContentService)
export const savePageContent = PageContentService.savePageContent.bind(PageContentService)
export const deletePageContent = PageContentService.deletePageContent.bind(PageContentService)
export const initializeDefaultPageContent = PageContentService.initializeDefaultPageContent.bind(PageContentService)
