"use client"

import { useEffect, useState } from "react"
import { exportAllData } from "@/lib/db"
import { createSupabaseClient } from "@/lib/supabase-client"

export default function AutoMigration() {
  const [migrationStatus, setMigrationStatus] = useState<"idle" | "migrating" | "success" | "error">("idle")
  const [migrationMessage, setMigrationMessage] = useState("")
  const [migrationProgress, setMigrationProgress] = useState(0)

  useEffect(() => {
    // Verificar se a migração já foi concluída
    if (localStorage.getItem("supabase_migration_completed") === "true") {
      console.log("Migração para o Supabase já foi concluída")
      return
    }

    const startMigration = async () => {
      try {
        setMigrationStatus("migrating")
        setMigrationMessage("Iniciando migração para o Supabase...")
        setMigrationProgress(10)

        // Exportar dados do IndexedDB
        setMigrationMessage("Exportando dados do IndexedDB...")
        const data = await exportAllData()
        setMigrationProgress(30)

        // Criar cliente Supabase
        const supabase = createSupabaseClient()

        // Migrar categorias primeiro (incluindo a categoria de adicionais se não existir)
        if (data.categories && data.categories.length > 0) {
          setMigrationMessage(`Migrando categorias (${data.categories.length})...`)

          // Verificar se a categoria de adicionais (ID 5) existe
          const hasAdditionalsCategory = data.categories.some((cat) => cat.id === 5)

          // Se não existir, adicionar a categoria de adicionais
          if (!hasAdditionalsCategory) {
            data.categories.push({
              id: 5,
              name: "Adicionais",
              order: data.categories.length + 1,
              active: true,
            })
          }

          for (const category of data.categories) {
            const { error } = await supabase.from("categories").upsert(
              {
                id: category.id,
                name: category.name,
                order: category.order,
                active: category.active,
              },
              { onConflict: "id" },
            )

            if (error) throw new Error(`Erro ao migrar categoria ${category.id}: ${error.message}`)
          }

          setMigrationProgress(40)
          setMigrationMessage("Categorias migradas com sucesso!")
        } else {
          // Se não houver categorias, criar pelo menos a categoria de adicionais
          const { error } = await supabase.from("categories").upsert(
            {
              id: 5,
              name: "Adicionais",
              order: 1,
              active: true,
            },
            { onConflict: "id" },
          )

          if (error) throw new Error(`Erro ao criar categoria de adicionais: ${error.message}`)

          setMigrationProgress(40)
          setMigrationMessage("Categoria de adicionais criada com sucesso!")
        }

        // Migrar adicionais
        if (data.additionals && data.additionals.length > 0) {
          setMigrationMessage(`Migrando adicionais (${data.additionals.length})...`)

          for (const additional of data.additionals) {
            // Garantir que todos os adicionais tenham uma categoria válida
            if (!additional.categoryId) {
              additional.categoryId = 5 // Usar a categoria de adicionais
            }

            const { error } = await supabase.from("additionals").upsert(
              {
                id: additional.id,
                name: additional.name,
                price: additional.price,
                category_id: additional.categoryId,
                active: additional.active,
                image: additional.image || null,
              },
              { onConflict: "id" },
            )

            if (error) throw new Error(`Erro ao migrar adicional ${additional.id}: ${error.message}`)
          }

          setMigrationProgress(50)
          setMigrationMessage("Adicionais migrados com sucesso!")
        }

        // Migrar produtos
        if (data.products && data.products.length > 0) {
          setMigrationMessage(`Migrando produtos (${data.products.length})...`)

          for (const product of data.products) {
            // Verificar se a categoria do produto existe
            const categoryExists = data.categories?.some((cat) => cat.id === product.categoryId) || false

            // Se a categoria não existir, usar a primeira categoria disponível
            if (!categoryExists && data.categories && data.categories.length > 0) {
              product.categoryId = data.categories[0].id
            }

            const { error } = await supabase.from("products").upsert(
              {
                id: product.id,
                name: product.name,
                description: product.description,
                image: product.image,
                sizes: product.sizes,
                category_id: product.categoryId,
                active: product.active !== undefined ? product.active : true,
                allowed_additionals: product.allowedAdditionals || null,
              },
              { onConflict: "id" },
            )

            if (error) throw new Error(`Erro ao migrar produto ${product.id}: ${error.message}`)
          }

          setMigrationProgress(60)
          setMigrationMessage("Produtos migrados com sucesso!")
        }

        // Migrar slides do carrossel
        if (data.carousel && data.carousel.length > 0) {
          setMigrationMessage(`Migrando slides do carrossel (${data.carousel.length})...`)

          for (const slide of data.carousel) {
            const { error } = await supabase.from("carousel_slides").upsert(
              {
                id: slide.id,
                image: slide.image,
                title: slide.title,
                subtitle: slide.subtitle,
                order: slide.order,
                active: slide.active,
              },
              { onConflict: "id" },
            )

            if (error) throw new Error(`Erro ao migrar slide ${slide.id}: ${error.message}`)
          }

          setMigrationProgress(70)
          setMigrationMessage("Slides do carrossel migrados com sucesso!")
        }

        // Migrar frases
        if (data.phrases && data.phrases.length > 0) {
          setMigrationMessage(`Migrando frases (${data.phrases.length})...`)

          for (const phrase of data.phrases) {
            const { error } = await supabase.from("phrases").upsert(
              {
                id: phrase.id,
                text: phrase.text,
                order: phrase.order,
                active: phrase.active,
              },
              { onConflict: "id" },
            )

            if (error) throw new Error(`Erro ao migrar frase ${phrase.id}: ${error.message}`)
          }

          setMigrationProgress(80)
          setMigrationMessage("Frases migradas com sucesso!")
        }

        // Migrar configuração da loja
        if (data.storeConfig) {
          setMigrationMessage("Migrando configuração da loja...")

          const { error } = await supabase.from("store_config").upsert(
            {
              id: data.storeConfig.id,
              name: data.storeConfig.name,
              logo_url: data.storeConfig.logoUrl,
              delivery_fee: data.storeConfig.deliveryFee,
              is_open: data.storeConfig.isOpen,
              operating_hours: data.storeConfig.operatingHours,
              special_dates: data.storeConfig.specialDates,
              last_updated: new Date(data.storeConfig.lastUpdated).toISOString(),
            },
            { onConflict: "id" },
          )

          if (error) throw new Error(`Erro ao migrar configuração da loja: ${error.message}`)

          setMigrationProgress(90)
          setMigrationMessage("Configuração da loja migrada com sucesso!")
        }

        // Migrar pedidos
        if (data.orders && data.orders.length > 0) {
          setMigrationMessage(`Migrando pedidos (${data.orders.length})...`)

          for (const order of data.orders) {
            const { error } = await supabase.from("orders").upsert(
              {
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
              },
              { onConflict: "id" },
            )

            if (error) throw new Error(`Erro ao migrar pedido ${order.id}: ${error.message}`)
          }

          setMigrationProgress(95)
          setMigrationMessage("Pedidos migrados com sucesso!")
        }

        // Marcar migração como concluída
        localStorage.setItem("supabase_migration_completed", "true")
        setMigrationProgress(100)
        setMigrationMessage("Migração concluída com sucesso!")
        setMigrationStatus("success")

        // Recarregar a página para usar os dados do Supabase
        window.location.reload()
      } catch (error) {
        console.error("Erro durante a migração:", error)
        setMigrationStatus("error")
        setMigrationMessage(`Erro durante a migração: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    startMigration()
  }, [])

  if (migrationStatus === "idle" || localStorage.getItem("supabase_migration_completed") === "true") {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold text-purple-900 mb-4">Migração para o Supabase</h2>

        {migrationStatus === "migrating" ? (
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${migrationProgress}%` }}
              ></div>
            </div>
            <p className="text-gray-700">{migrationMessage}</p>
            <p className="text-sm text-gray-500">Por favor, não feche esta janela até que a migração seja concluída.</p>
          </div>
        ) : migrationStatus === "success" ? (
          <div className="text-center">
            <div className="bg-green-100 text-green-700 p-4 rounded-md mb-4">{migrationMessage}</div>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            >
              Recarregar Página
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">{migrationMessage}</div>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
