import { createSupabaseClient } from "../supabase-client"
import type { Category } from "../types"
import { DEFAULT_STORE_ID } from "../constants"

// Exportar o tipo Category para uso em outros arquivos
export type { Category }

// Serviço para gerenciar categorias
export const CategoryService = {
  // Obter todas as categorias
  async getAllCategories(): Promise<Category[]> {
    try {
      const supabase = createSupabaseClient()
      let query = supabase.from("categories").select("*").eq("store_id", DEFAULT_STORE_ID).order("order")

      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar categorias:", error)
        return []
      }

      return (data || []).map((category: any) => ({
        id: Number(category.id),
        name: String(category.name),
        order: Number(category.order),
        active: Boolean(category.active),
      }))
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      return []
    }
  },

  // Obter categorias ativas
  async getActiveCategories(): Promise<Category[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", DEFAULT_STORE_ID)
        .eq("active", true)
        .order("order")

      if (error) {
        console.error("Erro ao buscar categorias ativas:", error)
        return []
      }

      return (data || []).map((category: any) => ({
        id: Number(category.id),
        name: String(category.name),
        order: Number(category.order),
        active: Boolean(category.active),
      }))
    } catch (error) {
      console.error("Erro ao buscar categorias ativas:", error)
      return []
    }
  },

  // Obter categoria por ID
  async getCategoryById(id: number): Promise<Category | null> {
    try {
      console.log('Buscando categoria por ID:', { id });
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      if (error) {
        console.error("Erro ao buscar categoria:", error)
        return null
      }

      if (!data) {
        console.log(`Categoria com ID ${id} não encontrada`);
        return null;
      }

      console.log('Categoria encontrada:', {
        id: data.id,
        name: data.name,
        store_id: data.store_id
      });

      // Garantir que os tipos estejam corretos
      const category: Category = {
        id: Number(data.id),
        name: String(data.name),
        order: data.order ? Number(data.order) : 0,
        active: data.active !== undefined ? Boolean(data.active) : true,
      };

      return category;
    } catch (error) {
      console.error("Erro ao buscar categoria:", error)
      return null
    }
  },

  // Salvar categoria
  async saveCategory(category: Category): Promise<{ data: Category | null; error: Error | null }> {
    try {
      console.log('=== Iniciando saveCategory ===');
      console.log('Dados da categoria recebidos:', {
        categoryId: category.id,
        storeId: DEFAULT_STORE_ID,
        categoryName: category.name,
        isNew: !(category.id && category.id > 0),
        category: JSON.stringify(category, null, 2)
      });

      const supabase = createSupabaseClient();

      // Verificar sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Sessão atual:', {
        hasSession: !!sessionData?.session,
        user: sessionData?.session?.user,
        sessionError: sessionError?.message
      });

      // Verificar se o cliente Supabase foi inicializado corretamente
      if (!supabase) {
        console.error('Erro: Cliente Supabase não inicializado');
        return { data: null, error: new Error('Erro de conexão com o banco de dados') };
      }

      if (category.id && category.id > 0) {
        // Primeiro, verificar se a categoria existe
        const { data: existingCategory, error: fetchExistingError } = await supabase
          .from("categories")
          .select("id, store_id")
          .eq("id", category.id)
          .maybeSingle();

        if (fetchExistingError) {
          console.error("Erro ao verificar categoria existente:", fetchExistingError);
          return {
            data: null,
            error: new Error(`Erro ao verificar categoria: ${fetchExistingError.message}`)
          };
        }

        if (!existingCategory) {
          console.log(`Categoria com ID ${category.id} não encontrada. Criando nova categoria.`);
          // Se a categoria não existe, trata como uma nova categoria
          // Resetar o ID e seguir o fluxo de criação
          category.id = 0;
          // Continue to the creation flow below
        } else {
          // Verificar se a categoria pertence à loja correta
          if (existingCategory.store_id !== DEFAULT_STORE_ID) {
            console.error(`Categoria com ID ${category.id} pertence a outra loja.`);
            return {
              data: null,
              error: new Error(`Esta categoria pertence a outra loja e não pode ser modificada.`)
            };
          }

          // Atualizar categoria existente
          const updateData = {
            name: category.name.trim(),
            order: category.order || 0,
            active: category.active !== undefined ? Boolean(category.active) : true,
            updated_at: new Date().toISOString()
          };

          console.log('Atualizando categoria existente:', { id: category.id, ...updateData });

          // Fazer o update e retornar os dados atualizados em uma única operação
          const { data: updatedData, error: updateError } = await supabase
            .from("categories")
            .update(updateData)
            .eq("id", category.id)
            .select()
            .maybeSingle();

          if (updateError) {
            console.error("Erro ao atualizar categoria:", updateError);
            return {
              data: null,
              error: new Error(`Erro ao atualizar categoria: ${updateError.message}`)
            };
          }

          if (!updatedData) {
            console.error("Nenhum dado retornado ao atualizar categoria");
            return {
              data: null,
              error: new Error("Falha ao atualizar categoria. Nenhum dado retornado.")
            };
          }

          const result: Category = {
            id: Number(updatedData.id),
            name: String(updatedData.name || ''),
            order: Number(updatedData.order || 0),
            active: updatedData.active !== undefined ? Boolean(updatedData.active) : true,
          }

          return { data: result, error: null }
        }
      }

      // Criar nova categoria (quando ID é 0 ou não existe)
      if (!category.id || category.id <= 0) {
        // Validar dados antes de criar nova categoria
        if (!category.name || !category.name.trim()) {
          console.error("Erro: Nome da categoria é obrigatório");
          return { data: null, error: new Error("O nome da categoria é obrigatório") };
        }

        // Garantir que a ordem seja um número válido
        const order = typeof category.order === 'number' ? category.order : 0;
        const active = category.active !== undefined ? Boolean(category.active) : true;

        console.log('Criando nova categoria:', {
          name: category.name,
          order,
          active,
          storeId: DEFAULT_STORE_ID
        });

        try {
          // Corrigir a sequência antes de inserir
          console.log('Corrigindo sequência categories_id_seq...');
          const { error: sequenceError } = await supabase.rpc('fix_categories_sequence');
          if (sequenceError) {
            console.warn('Aviso: Não foi possível corrigir a sequência automaticamente:', sequenceError);
          } else {
            console.log('Sequência corrigida com sucesso');
          }
          // Preparar os dados para inserção (sem incluir ID para deixar o banco gerar automaticamente)
          const insertData = {
            name: category.name.trim(),
            order: order,
            active: active,
            store_id: DEFAULT_STORE_ID,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Garantir que não há ID nos dados de inserção
          if ('id' in insertData) {
            delete (insertData as any).id;
          }

          console.log('Inserindo nova categoria:', insertData);

          // Verificar se há ID nos dados (não deveria haver)
          console.log('Verificação de ID nos dados:', {
            hasId: 'id' in insertData,
            insertDataKeys: Object.keys(insertData),
            originalCategoryId: category.id
          });

          // Inserir a nova categoria
          console.log('Enviando dados para o Supabase:', {
            table: 'categories',
            data: insertData,
            store_id: insertData.store_id,
            store_id_type: typeof insertData.store_id,
            store_id_length: insertData.store_id?.length
          });

          const { data, error } = await supabase
            .from("categories")
            .insert(insertData)
            .select()
            .maybeSingle();

          if (error) {
            console.error("Erro ao inserir categoria:", {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
              details_full: error.details
            });
            throw new Error(`Erro ao inserir categoria: ${error.message || 'Erro desconhecido'}`);
          }

          if (!data) {
            console.error("Nenhum dado retornado ao criar categoria");
            throw new Error("Nenhum dado retornado ao criar categoria");
          }

          console.log('Dados da nova categoria:', data);

          // Criar o objeto de resultado
          const result: Category = {
            id: Number(data.id),
            name: String(data.name || ''),
            order: Number(data.order || 0),
            active: data.active !== undefined ? Boolean(data.active) : true,
          };

          console.log('Categoria criada com sucesso:', result);
          return { data: result, error: null };

        } catch (error) {
          console.error("Erro ao processar criação de categoria:", error);
          return {
            data: null,
            error: error instanceof Error ? error : new Error("Erro desconhecido ao criar categoria")
          };
        }
      }
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
    }

    // Fallback return statement (should not reach here)
    return { data: null, error: new Error("Unexpected error: function reached end without returning") };
  },

  // Excluir categoria
  async deleteCategory(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)

      if (error) {
        console.error(`Erro ao deletar categoria ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao deletar categoria ${id}:`, error)
      return false
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllCategories = CategoryService.getAllCategories.bind(CategoryService)
export const getActiveCategories = CategoryService.getActiveCategories.bind(CategoryService)
export const getCategoryById = CategoryService.getCategoryById.bind(CategoryService)
export const saveCategory = CategoryService.saveCategory.bind(CategoryService)
export const deleteCategory = CategoryService.deleteCategory.bind(CategoryService)
