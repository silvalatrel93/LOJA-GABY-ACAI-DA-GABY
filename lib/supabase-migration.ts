import { createSupabaseClient } from "@/lib/supabase-client"
import { migrateToSupabase } from "@/lib/persistence-manager"
import type {
  Product,
  Category,
  Additional,
  Order,
  CarouselSlide,
  Phrase,
  StoreConfig,
  PageContent,
  Notification,
} from "@/lib/db"

type MigrationProgressCallback = (progress: number, message: string) => void

export async function migrateDataToSupabase(
  data: {
    products?: Product[]
    categories?: Category[]
    additionals?: Additional[]
    orders?: Order[]
    carousel?: CarouselSlide[]
    phrases?: Phrase[]
    storeConfig?: StoreConfig
    pageContent?: PageContent[]
    notifications?: Notification[]
  },
  progressCallback: MigrationProgressCallback,
): Promise<boolean> {
  const supabase = createSupabaseClient()
  let currentProgress = 0
  const totalSteps =
    Object.keys(data).filter(
      (key) => Array.isArray(data[key as keyof typeof data]) && data[key as keyof typeof data]?.length > 0,
    ).length + (data.storeConfig ? 1 : 0)
  const progressPerStep = totalSteps > 0 ? 100 / totalSteps : 100

  try {
    // Migrar categorias primeiro, pois outras tabelas dependem delas
    if (data.categories && data.categories.length > 0) {
      progressCallback(currentProgress, `Migrando categorias (${data.categories.length})...`)

      // Converter categorias para o formato do Supabase
      const categoriesToInsert = data.categories.map((category) => ({
        id: category.id,
        name: category.name,
        order: category.order,
        active: category.active,
      }))

      // Inserir categorias no Supabase
      for (let i = 0; i < categoriesToInsert.length; i++) {
        const category = categoriesToInsert[i]
        try {
          const { error } = await supabase.from("categories").upsert(category, { onConflict: "id" })

          if (error) {
            throw new Error(`Erro ao migrar categoria ${category.id} - ${category.name}: ${error.message}`)
          }

          // Atualizar progresso a cada 5 categorias ou na última
          if (i % 5 === 0 || i === categoriesToInsert.length - 1) {
            const stepProgress = Math.floor(((i + 1) / categoriesToInsert.length) * progressPerStep)
            progressCallback(
              currentProgress + stepProgress,
              `Migrando categorias... (${i + 1}/${categoriesToInsert.length})`,
            )
          }
        } catch (error) {
          throw new Error(
            `Erro ao migrar categoria ${category.id} - ${category.name}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      currentProgress += progressPerStep
      progressCallback(currentProgress, `Categorias migradas com sucesso! (${data.categories.length})`)
    }

    // Migrar adicionais
    if (data.additionals && data.additionals.length > 0) {
      progressCallback(currentProgress, `Migrando adicionais (${data.additionals.length})...`)

      // Converter adicionais para o formato do Supabase
      const additionalsToInsert = data.additionals.map((additional) => ({
        id: additional.id,
        name: additional.name,
        price: additional.price,
        category_id: additional.categoryId,
        active: additional.active,
        image: additional.image || null,
      }))

      // Inserir adicionais no Supabase
      for (let i = 0; i < additionalsToInsert.length; i++) {
        const additional = additionalsToInsert[i]
        try {
          const { error } = await supabase.from("additionals").upsert(additional, { onConflict: "id" })

          if (error) {
            throw new Error(`Erro ao migrar adicional ${additional.id} - ${additional.name}: ${error.message}`)
          }

          // Atualizar progresso a cada 5 adicionais ou no último
          if (i % 5 === 0 || i === additionalsToInsert.length - 1) {
            const stepProgress = Math.floor(((i + 1) / additionalsToInsert.length) * progressPerStep)
            progressCallback(
              currentProgress + stepProgress,
              `Migrando adicionais... (${i + 1}/${additionalsToInsert.length})`,
            )
          }
        } catch (error) {
          throw new Error(
            `Erro ao migrar adicional ${additional.id} - ${additional.name}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      currentProgress += progressPerStep
      progressCallback(currentProgress, `Adicionais migrados com sucesso! (${data.additionals.length})`)
    }

    // Migrar produtos
    if (data.products && data.products.length > 0) {
      progressCallback(currentProgress, `Migrando produtos (${data.products.length})...`)

      // Converter produtos para o formato do Supabase
      const productsToInsert = data.products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        sizes: product.sizes,
        category_id: product.categoryId,
        active: product.active !== undefined ? product.active : true,
        allowed_additionals: product.allowedAdditionals || null,
      }))

      // Inserir produtos no Supabase
      for (let i = 0; i < productsToInsert.length; i++) {
        const product = productsToInsert[i]
        try {
          const { error } = await supabase.from("products").upsert(product, { onConflict: "id" })

          if (error) {
            throw new Error(`Erro ao migrar produto ${product.id} - ${product.name}: ${error.message}`)
          }

          // Atualizar progresso a cada 5 produtos ou no último
          if (i % 5 === 0 || i === productsToInsert.length - 1) {
            const stepProgress = Math.floor(((i + 1) / productsToInsert.length) * progressPerStep)
            progressCallback(
              currentProgress + stepProgress,
              `Migrando produtos... (${i + 1}/${productsToInsert.length})`,
            )
          }
        } catch (error) {
          throw new Error(
            `Erro ao migrar produto ${product.id} - ${product.name}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      currentProgress += progressPerStep
      progressCallback(currentProgress, `Produtos migrados com sucesso! (${data.products.length})`)
    }

    // Migrar slides do carrossel
    if (data.carousel && data.carousel.length > 0) {
      progressCallback(currentProgress, `Migrando slides do carrossel (${data.carousel.length})...`)

      // Converter slides para o formato do Supabase
      const slidesToInsert = data.carousel.map((slide) => ({
        id: slide.id,
        image: slide.image,
        title: slide.title,
        subtitle: slide.subtitle,
        order: slide.order,
        active: slide.active,
      }))

      // Inserir slides no Supabase
      for (let i = 0; i < slidesToInsert.length; i++) {
        const slide = slidesToInsert[i]
        try {
          const { error } = await supabase.from("carousel_slides").upsert(slide, { onConflict: "id" })

          if (error) {
            throw new Error(`Erro ao migrar slide ${slide.id} - ${slide.title}: ${error.message}`)
          }
        } catch (error) {
          throw new Error(
            `Erro ao migrar slide ${slide.id} - ${slide.title}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      currentProgress += progressPerStep
      progressCallback(currentProgress, `Slides do carrossel migrados com sucesso! (${data.carousel.length})`)
    }

    // Migrar frases
    if (data.phrases && data.phrases.length > 0) {
      progressCallback(currentProgress, `Migrando frases (${data.phrases.length})...`)

      // Converter frases para o formato do Supabase
      const phrasesToInsert = data.phrases.map((phrase) => ({
        id: phrase.id,
        text: phrase.text,
        order: phrase.order,
        active: phrase.active,
      }))

      // Inserir frases no Supabase
      for (let i = 0; i < phrasesToInsert.length; i++) {
        const phrase = phrasesToInsert[i]
        try {
          const { error } = await supabase.from("phrases").upsert(phrase, { onConflict: "id" })

          if (error) {
            throw new Error(`Erro ao migrar frase ${phrase.id}: ${error.message}`)
          }
        } catch (error) {
          throw new Error(
            `Erro ao migrar frase ${phrase.id}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      currentProgress += progressPerStep
      progressCallback(currentProgress, `Frases migradas com sucesso! (${data.phrases.length})`)
    }

    // Migrar configuração da loja
    if (data.storeConfig) {
      progressCallback(currentProgress, "Migrando configuração da loja...")

      // Converter configuração para o formato do Supabase
      const configToInsert = {
        id: data.storeConfig.id,
        name: data.storeConfig.name,
        logo_url: data.storeConfig.logoUrl,
        delivery_fee: data.storeConfig.deliveryFee,
        is_open: data.storeConfig.isOpen,
        operating_hours: data.storeConfig.operatingHours,
        special_dates: data.storeConfig.specialDates,
        last_updated: new Date(data.storeConfig.lastUpdated).toISOString(),
      }

      // Inserir configuração no Supabase
      try {
        const { error } = await supabase.from("store_config").upsert(configToInsert, { onConflict: "id" })

        if (error) {
          throw new Error(`Erro ao migrar configuração da loja: ${error.message}`)
        }
      } catch (error) {
        throw new Error(
          `Erro ao migrar configuração da loja: ${error instanceof Error ? error.message : String(error)}`,
        )
      }

      currentProgress += progressPerStep
      progressCallback(currentProgress, "Configuração da loja migrada com sucesso!")
    }

    // Migrar conteúdo das páginas
    if (data.pageContent && data.pageContent.length > 0) {
      progressCallback(currentProgress, `Migrando conteúdo das páginas (${data.pageContent.length})...`)

      // Converter conteúdo para o formato do Supabase
      const contentToInsert = data.pageContent.map((content) => ({
        id: content.id,
        title: content.title,
        content: content.content,
        last_updated: new Date(content.lastUpdated).toISOString(),
      }))

      // Inserir conteúdo no Supabase
      for (let i = 0; i < contentToInsert.length; i++) {
        const content = contentToInsert[i]
        try {
          const { error } = await supabase.from("page_content").upsert(content, { onConflict: "id" })

          if (error) {
            throw new Error(`Erro ao migrar conteúdo da página ${content.id}: ${error.message}`)
          }
        } catch (error) {
          throw new Error(
            `Erro ao migrar conteúdo da página ${content.id}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      currentProgress += progressPerStep
      progressCallback(currentProgress, `Conteúdo das páginas migrado com sucesso! (${data.pageContent.length})`)
    }

    // Migrar notificações
    if (data.notifications && data.notifications.length > 0) {
      progressCallback(currentProgress, `Migrando notificações (${data.notifications.length})...`)

      // Converter notificações para o formato do Supabase
      const notificationsToInsert = data.notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        active: notification.active,
        start_date: new Date(notification.startDate).toISOString(),
        end_date: new Date(notification.endDate).toISOString(),
        priority: notification.priority,
        read: notification.read,
        created_at: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
      }))

      // Inserir notificações no Supabase
      for (let i = 0; i < notificationsToInsert.length; i++) {
        const notification = notificationsToInsert[i]
        try {
          const { error } = await supabase.from("notifications").upsert(notification, { onConflict: "id" })

          if (error) {
            throw new Error(`Erro ao migrar notificação ${notification.id}: ${error.message}`)
          }
        } catch (error) {
          throw new Error(
            `Erro ao migrar notificação ${notification.id}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      currentProgress += progressPerStep
      progressCallback(currentProgress, `Notificações migradas com sucesso! (${data.notifications.length})`)
    }

    // Migrar pedidos
    if (data.orders && data.orders.length > 0) {
      progressCallback(currentProgress, `Migrando pedidos (${data.orders.length})...`)

      // Converter pedidos para o formato do Supabase
      const ordersToInsert = data.orders.map((order) => ({
        id: order.id,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        address: order.address,
        items: order.items,
        subtotal: order.subtotal,
        delivery_fee: order.deliveryFee,
        total: order.total,
        payment_method: order.paymentMethod,
        status: order.status,
        date: new Date(order.date).toISOString(),
        printed: order.printed,
      }))

      // Inserir pedidos no Supabase
      for (let i = 0; i < ordersToInsert.length; i++) {
        const order = ordersToInsert[i]
        try {
          const { error } = await supabase.from("orders").upsert(order, { onConflict: "id" })

          if (error) {
            throw new Error(`Erro ao migrar pedido ${order.id}: ${error.message}`)
          }

          // Atualizar progresso a cada 5 pedidos ou no último
          if (i % 5 === 0 || i === ordersToInsert.length - 1) {
            const stepProgress = Math.floor(((i + 1) / ordersToInsert.length) * progressPerStep)
            progressCallback(currentProgress + stepProgress, `Migrando pedidos... (${i + 1}/${ordersToInsert.length})`)
          }
        } catch (error) {
          throw new Error(
            `Erro ao migrar pedido ${order.id}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      currentProgress += progressPerStep
      progressCallback(currentProgress, `Pedidos migrados com sucesso! (${data.orders.length})`)
    }

    // Definir o modo de persistência como Supabase após a migração bem-sucedida
    migrateToSupabase()

    progressCallback(100, "Migração concluída com sucesso!")
    return true
  } catch (error) {
    console.error("Erro durante a migração:", error)
    throw error
  }
}
