import { createSupabaseClient } from "../supabase-client"
import type { Product, Category, Additional, Order } from "../types"
import { ProductService } from "./product-service"
import { CategoryService } from "./category-service"
import { AdditionalService } from "./additional-service"

// Interface para backup de dados
interface BackupData {
  products: Product[]
  categories: Category[]
  additionals: Additional[]
  orders?: Order[]
  timestamp: string
  version: string
}

export const BackupService = {
  // Criar backup completo dos dados
  async createBackup(includeOrders = false): Promise<BackupData | null> {
    try {
      console.log("Iniciando backup dos dados...")

      // Buscar todos os dados
      const [products, categories, additionals] = await Promise.all([
        ProductService.getAllProducts(),
        CategoryService.getAllCategories(),
        AdditionalService.getAllAdditionals(),
      ])

      const backupData: BackupData = {
        products,
        categories,
        additionals,
        timestamp: new Date().toISOString(),
        version: "1.0",
      }

      // Incluir pedidos se solicitado
      if (includeOrders) {
        // Implementar busca de pedidos quando necessário
        backupData.orders = []
      }

      console.log("Backup criado com sucesso:", {
        products: products.length,
        categories: categories.length,
        additionals: additionals.length,
      })

      return backupData
    } catch (error) {
      console.error("Erro ao criar backup:", error)
      return null
    }
  },

  // Restaurar dados do backup
  async restoreBackup(backupData: BackupData): Promise<boolean> {
    try {
      console.log("Iniciando restauração do backup...")

      // Validar dados do backup
      if (!backupData.products || !backupData.categories || !backupData.additionals) {
        throw new Error("Dados de backup inválidos")
      }

      // Limpar dados existentes (opcional - implementar se necessário)
      // await this.clearAllData()

      // Restaurar categorias primeiro (dependência dos produtos)
      for (const category of backupData.categories) {
        await CategoryService.saveCategory(category)
      }

      // Restaurar produtos
      for (const product of backupData.products) {
        await ProductService.saveProduct(product)
      }

      // Restaurar adicionais
      for (const additional of backupData.additionals) {
        await AdditionalService.saveAdditional(additional)
      }

      console.log("Backup restaurado com sucesso")
      return true
    } catch (error) {
      console.error("Erro ao restaurar backup:", error)
      return false
    }
  },

  // Exportar dados para JSON
  async exportToJson(): Promise<string | null> {
    try {
      const backup = await this.createBackup(false)
      if (!backup) {
        throw new Error("Falha ao criar backup para exportação")
      }

      return JSON.stringify(backup, null, 2)
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
      return null
    }
  },

  // Importar dados do JSON
  async importFromJson(jsonData: string): Promise<boolean> {
    try {
      const backupData = JSON.parse(jsonData) as BackupData
      return await this.restoreBackup(backupData)
    } catch (error) {
      console.error("Erro ao importar dados:", error)
      return false
    }
  },

  // Limpar todos os dados (cuidado!)
  async clearAllData(): Promise<boolean> {
    try {
      console.warn("ATENÇÃO: Limpando todos os dados!")

      const supabase = createSupabaseClient()

      // Limpar na ordem correta para evitar problemas de referência
      await supabase.from("additionals").delete().neq("id", 0)
      await supabase.from("products").delete().neq("id", 0)
      await supabase.from("categories").delete().neq("id", 0)

      console.log("Todos os dados foram limpos")
      return true
    } catch (error) {
      console.error("Erro ao limpar dados:", error)
      return false
    }
  },

  // Verificar integridade dos dados
  async checkDataIntegrity(): Promise<{
    valid: boolean
    issues: string[]
  }> {
    try {
      const issues: string[] = []

      // Buscar dados
      const [products, categories, additionals] = await Promise.all([
        ProductService.getAllProducts(),
        CategoryService.getAllCategories(),
        AdditionalService.getAllAdditionals(),
      ])

      // Verificar se produtos têm categorias válidas
      const categoryIds = new Set(categories.map(c => c.id))
      for (const product of products) {
        if (!categoryIds.has(product.categoryId)) {
          issues.push(`Produto "${product.name}" tem categoria inválida (ID: ${product.categoryId})`)
        }
      }

      // Verificar se adicionais têm categorias válidas
      for (const additional of additionals) {
        if (!categoryIds.has(additional.categoryId)) {
          issues.push(`Adicional "${additional.name}" tem categoria inválida (ID: ${additional.categoryId})`)
        }
      }

      return {
        valid: issues.length === 0,
        issues,
      }
    } catch (error) {
      console.error("Erro ao verificar integridade:", error)
      return {
        valid: false,
        issues: ["Erro ao verificar integridade dos dados"],
      }
    }
  },
}
