"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"

export default function SupabaseSchemaInitializer() {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeSchema = async () => {
      try {
        console.log("Verificando e criando esquema do banco de dados...")
        const supabase = createSupabaseClient()

        // Verificar se as tabelas já existem
        const { data: tablesData, error: tablesError } = await supabase.from("categories").select("count")

        if (tablesError && tablesError.code === "PGRST116") {
          // Tabela não existe, criar esquema
          console.log("Tabelas não encontradas, criando esquema...")

          // Executar script SQL para criar tabelas
          const sql = `
            -- Tabela de categorias
            CREATE TABLE IF NOT EXISTS categories (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              "order" INTEGER NOT NULL DEFAULT 0,
              active BOOLEAN NOT NULL DEFAULT true
            );

            -- Tabela de produtos
            CREATE TABLE IF NOT EXISTS products (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              description TEXT,
              image VARCHAR(255),
              sizes JSONB NOT NULL,
              category_id INTEGER REFERENCES categories(id),
              active BOOLEAN NOT NULL DEFAULT true,
              allowed_additional_ids INTEGER[] DEFAULT '{}'::INTEGER[]
            );

            -- Tabela de adicionais
            CREATE TABLE IF NOT EXISTS additionals (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              price DECIMAL(10, 2) NOT NULL,
              category_id INTEGER REFERENCES categories(id),
              active BOOLEAN NOT NULL DEFAULT true,
              image VARCHAR(255)
            );

            -- Tabela de slides do carrossel
            CREATE TABLE IF NOT EXISTS carousel_slides (
              id SERIAL PRIMARY KEY,
              image VARCHAR(255) NOT NULL,
              title VARCHAR(255),
              subtitle VARCHAR(255),
              "order" INTEGER NOT NULL DEFAULT 0,
              active BOOLEAN NOT NULL DEFAULT true
            );

            -- Tabela de frases
            CREATE TABLE IF NOT EXISTS phrases (
              id SERIAL PRIMARY KEY,
              text TEXT NOT NULL,
              "order" INTEGER NOT NULL DEFAULT 0,
              active BOOLEAN NOT NULL DEFAULT true
            );

            -- Tabela de configuração da loja
            CREATE TABLE IF NOT EXISTS store_config (
              id VARCHAR(50) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              logo_url VARCHAR(255),
              delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
              is_open BOOLEAN NOT NULL DEFAULT true,
              operating_hours JSONB NOT NULL,
              special_dates JSONB,
              last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabela de conteúdo das páginas
            CREATE TABLE IF NOT EXISTS page_content (
              id VARCHAR(50) PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              content TEXT NOT NULL,
              last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabela de notificações
            CREATE TABLE IF NOT EXISTS notifications (
              id SERIAL PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              type VARCHAR(50) NOT NULL,
              active BOOLEAN NOT NULL DEFAULT true,
              start_date TIMESTAMP WITH TIME ZONE NOT NULL,
              end_date TIMESTAMP WITH TIME ZONE NOT NULL,
              priority INTEGER NOT NULL DEFAULT 0,
              read BOOLEAN NOT NULL DEFAULT false,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabela de pedidos
            CREATE TABLE IF NOT EXISTS orders (
              id SERIAL PRIMARY KEY,
              customer_name VARCHAR(255) NOT NULL,
              customer_phone VARCHAR(50) NOT NULL,
              address JSONB NOT NULL,
              items JSONB NOT NULL,
              subtotal DECIMAL(10, 2) NOT NULL,
              delivery_fee DECIMAL(10, 2) NOT NULL,
              total DECIMAL(10, 2) NOT NULL,
              payment_method VARCHAR(50) NOT NULL,
              status VARCHAR(50) NOT NULL,
              date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              printed BOOLEAN NOT NULL DEFAULT false
            );

            -- Tabela de carrinho
            CREATE TABLE IF NOT EXISTS cart (
              id SERIAL PRIMARY KEY,
              session_id VARCHAR(255) NOT NULL,
              product_id INTEGER NOT NULL,
              name VARCHAR(255) NOT NULL,
              price DECIMAL(10, 2) NOT NULL,
              quantity INTEGER NOT NULL,
              image VARCHAR(255),
              size VARCHAR(50) NOT NULL,
              additionals JSONB,
              UNIQUE(session_id, product_id, size)
            );
          `

          // Executar o script SQL
          const { error: sqlError } = await supabase.rpc("exec_sql", { sql })

          if (sqlError) {
            throw new Error(`Erro ao executar script SQL: ${sqlError.message}`)
          }

          console.log("Esquema criado com sucesso!")
        } else if (tablesError) {
          throw new Error(`Erro ao verificar tabelas: ${tablesError.message}`)
        } else {
          console.log("Esquema já existe, pulando criação.")
        }

        setInitialized(true)
      } catch (err) {
        console.error("Erro durante a inicialização do esquema:", err)
        setError(`Erro durante a inicialização do esquema: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    initializeSchema()
  }, [])

  // Renderizar mensagem de erro, se houver
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erro de Inicialização do Esquema</h2>
          <p className="mb-4">{error}</p>
          <p className="text-sm text-gray-600">Verifique se você tem permissões para criar tabelas no Supabase.</p>
        </div>
      </div>
    )
  }

  // Componente não renderiza nada visualmente quando não há erro
  return null
}
