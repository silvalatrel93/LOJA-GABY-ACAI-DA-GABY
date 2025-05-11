import { createSupabaseClient } from "./supabase-client"

// Verificar se as tabelas necessárias existem no Supabase
export async function verifySupabaseTables(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()

    // Verificar se a tabela categories existe
    const { error: categoriesError } = await supabase.from("categories").select("id").limit(1)

    if (categoriesError && categoriesError.code === "42P01") {
      console.log("Tabela 'categories' não existe no Supabase")
      return false
    }

    // Verificar se a tabela products existe
    const { error: productsError } = await supabase.from("products").select("id").limit(1)

    if (productsError && productsError.code === "42P01") {
      console.log("Tabela 'products' não existe no Supabase")
      return false
    }

    // Verificar se a tabela additionals existe
    const { error: additionalsError } = await supabase.from("additionals").select("id").limit(1)

    if (additionalsError && additionalsError.code === "42P01") {
      console.log("Tabela 'additionals' não existe no Supabase")
      return false
    }

    // Verificar se a tabela phrases existe
    const { error: phrasesError } = await supabase.from("phrases").select("id").limit(1)

    if (phrasesError && phrasesError.code === "42P01") {
      console.log("Tabela 'phrases' não existe no Supabase")
      return false
    }

    // Verificar se a tabela store_config existe
    const { error: storeConfigError } = await supabase.from("store_config").select("id").limit(1)

    if (storeConfigError && storeConfigError.code === "42P01") {
      console.log("Tabela 'store_config' não existe no Supabase")
      return false
    }

    // Verificar se a tabela carousel_slides existe
    const { error: carouselError } = await supabase.from("carousel_slides").select("id").limit(1)

    if (carouselError && carouselError.code === "42P01") {
      console.log("Tabela 'carousel_slides' não existe no Supabase")
      return false
    }

    // Verificar se a tabela page_content existe
    const { error: pageContentError } = await supabase.from("page_content").select("id").limit(1)

    if (pageContentError && pageContentError.code === "42P01") {
      console.log("Tabela 'page_content' não existe no Supabase")
      return false
    }

    // Todas as tabelas existem
    return true
  } catch (error) {
    console.error("Erro ao verificar tabelas no Supabase:", error)
    return false
  }
}

// Criar tabelas no Supabase se necessário
export async function createSupabaseTables(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()

    // Executar o SQL para criar as tabelas
    const { error } = await supabase.rpc("create_tables")

    if (error) {
      console.error("Erro ao criar tabelas no Supabase:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao criar tabelas no Supabase:", error)
    return false
  }
}
