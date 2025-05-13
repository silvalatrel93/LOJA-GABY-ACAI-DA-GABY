/**
 * Utilitários para o Supabase
 * Funções auxiliares para garantir que todas as consultas incluam o store_id
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_STORE_ID } from './constants'

/**
 * Função para obter uma tabela do Supabase com filtro de store_id aplicado automaticamente
 * @param supabase Cliente do Supabase
 * @param table Nome da tabela
 * @returns Query builder com filtro de store_id aplicado
 */
export function getTableWithStoreFilter(supabase: SupabaseClient, table: string) {
  return supabase.from(table).select('*').eq('store_id', DEFAULT_STORE_ID)
}

/**
 * Função para obter registros ativos de uma tabela do Supabase com filtro de store_id
 * @param supabase Cliente do Supabase
 * @param table Nome da tabela
 * @returns Query builder com filtro de store_id e active=true aplicados
 */
export function getActiveRecordsWithStoreFilter(supabase: SupabaseClient, table: string) {
  return supabase
    .from(table)
    .select('*')
    .eq('store_id', DEFAULT_STORE_ID)
    .eq('active', true)
}

/**
 * Função para obter registros ordenados de uma tabela do Supabase com filtro de store_id
 * @param supabase Cliente do Supabase
 * @param table Nome da tabela
 * @param orderField Campo para ordenar
 * @param ascending Ordenar de forma ascendente?
 * @returns Query builder com filtro de store_id e ordenação aplicados
 */
export function getOrderedRecordsWithStoreFilter(
  supabase: SupabaseClient, 
  table: string, 
  orderField: string = 'order',
  ascending: boolean = true
) {
  return supabase
    .from(table)
    .select('*')
    .eq('store_id', DEFAULT_STORE_ID)
    .order(orderField, { ascending })
}

/**
 * Função para obter registros ativos e ordenados de uma tabela do Supabase com filtro de store_id
 * @param supabase Cliente do Supabase
 * @param table Nome da tabela
 * @param orderField Campo para ordenar
 * @param ascending Ordenar de forma ascendente?
 * @returns Query builder com filtro de store_id, active=true e ordenação aplicados
 */
export function getActiveOrderedRecordsWithStoreFilter(
  supabase: SupabaseClient, 
  table: string, 
  orderField: string = 'order',
  ascending: boolean = true
) {
  return supabase
    .from(table)
    .select('*')
    .eq('store_id', DEFAULT_STORE_ID)
    .eq('active', true)
    .order(orderField, { ascending })
}

/**
 * Função para obter um registro específico pelo ID com filtro de store_id
 * @param supabase Cliente do Supabase
 * @param table Nome da tabela
 * @param idField Nome do campo de ID
 * @param id Valor do ID
 * @returns Query builder com filtro de store_id e ID aplicados
 */
export function getRecordByIdWithStoreFilter(
  supabase: SupabaseClient, 
  table: string, 
  idField: string, 
  id: string | number
) {
  return supabase
    .from(table)
    .select('*')
    .eq(idField, id)
    .eq('store_id', DEFAULT_STORE_ID)
    .single()
}

/**
 * Função para inserir dados em uma tabela do Supabase com store_id incluído automaticamente
 * @param supabase Cliente do Supabase
 * @param table Nome da tabela
 * @param data Dados a serem inseridos
 * @returns Promise com o resultado da inserção
 */
export function insertWithStoreId(supabase: SupabaseClient, table: string, data: any) {
  // Adiciona o store_id aos dados se não estiver presente
  const dataWithStoreId = {
    ...data,
    store_id: data.store_id || DEFAULT_STORE_ID
  }
  
  return supabase.from(table).insert(dataWithStoreId)
}

/**
 * Função para atualizar dados em uma tabela do Supabase com filtro de store_id
 * @param supabase Cliente do Supabase
 * @param table Nome da tabela
 * @param data Dados a serem atualizados
 * @param idField Nome do campo de ID
 * @param id Valor do ID
 * @returns Promise com o resultado da atualização
 */
export function updateWithStoreFilter(
  supabase: SupabaseClient, 
  table: string, 
  data: any, 
  idField: string, 
  id: string | number
) {
  return supabase
    .from(table)
    .update(data)
    .eq(idField, id)
    .eq('store_id', DEFAULT_STORE_ID)
}

/**
 * Função para excluir dados de uma tabela do Supabase com filtro de store_id
 * @param supabase Cliente do Supabase
 * @param table Nome da tabela
 * @param idField Nome do campo de ID
 * @param id Valor do ID
 * @returns Promise com o resultado da exclusão
 */
export function deleteWithStoreFilter(
  supabase: SupabaseClient, 
  table: string, 
  idField: string, 
  id: string | number
) {
  return supabase
    .from(table)
    .delete()
    .eq(idField, id)
    .eq('store_id', DEFAULT_STORE_ID)
}

/**
 * Função para limpar dados de uma tabela do Supabase com filtro de store_id e session_id
 * Específica para operações de carrinho
 * @param supabase Cliente do Supabase
 * @param table Nome da tabela
 * @param sessionId ID da sessão
 * @returns Promise com o resultado da exclusão
 */
export function clearCartWithStoreFilter(
  supabase: SupabaseClient, 
  table: string, 
  sessionId: string
) {
  return supabase
    .from(table)
    .delete()
    .eq('session_id', sessionId)
    .eq('store_id', DEFAULT_STORE_ID)
}
