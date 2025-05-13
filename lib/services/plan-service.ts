import { createSupabaseClient } from "../supabase-client"
import type { Plan, Subscription } from "../types"

// Obter todos os planos ativos
export async function getActivePlans(): Promise<Plan[]> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true })

    if (error) {
      console.error("Erro ao buscar planos:", error)
      return []
    }

    return data.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingCycle: plan.billing_cycle,
      features: plan.features,
      limits: plan.limits,
      isActive: plan.is_active,
      createdAt: new Date(plan.created_at),
      updatedAt: new Date(plan.updated_at),
    }))
  } catch (error) {
    console.error("Erro ao buscar planos:", error)
    return []
  }
}

// Obter plano por ID
export async function getPlanById(id: string): Promise<Plan | null> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase.from("plans").select("*").eq("id", id).single()

    if (error) {
      console.error(`Erro ao buscar plano ${id}:`, error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      billingCycle: data.billing_cycle,
      features: data.features,
      limits: data.limits,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  } catch (error) {
    console.error(`Erro ao buscar plano ${id}:`, error)
    return null
  }
}

// Obter assinatura do usuário atual
export async function getUserSubscription(): Promise<Subscription | null> {
  try {
    const supabase = createSupabaseClient()

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Usuário não autenticado")
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("Erro ao buscar assinatura do usuário:", error)
      return null
    }

    if (!data) {
      return null
    }

    return {
      id: data.id,
      userId: data.user_id,
      planId: data.plan_id,
      status: data.status,
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  } catch (error) {
    console.error("Erro ao buscar assinatura do usuário:", error)
    return null
  }
}

// Verificar se o usuário pode criar mais lojas
export async function canCreateStore(): Promise<{ canCreate: boolean; reason?: string }> {
  try {
    const supabase = createSupabaseClient()

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Usuário não autenticado")
    }

    // Obter a assinatura do usuário
    const subscription = await getUserSubscription()

    // Se não tiver assinatura, usar o plano gratuito (1 loja)
    if (!subscription || subscription.status !== "active") {
      // Contar quantas lojas o usuário já tem
      const { count, error } = await supabase
        .from("stores")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id)

      if (error) {
        console.error("Erro ao contar lojas do usuário:", error)
        return { canCreate: false, reason: "Erro ao verificar limite de lojas" }
      }

      if (count && count >= 1) {
        return {
          canCreate: false,
          reason: "Você atingiu o limite de lojas do plano gratuito. Faça upgrade para criar mais lojas.",
        }
      }

      return { canCreate: true }
    }

    // Obter o plano da assinatura
    const plan = await getPlanById(subscription.planId)

    if (!plan) {
      return { canCreate: false, reason: "Plano não encontrado" }
    }

    // Contar quantas lojas o usuário já tem
    const { count, error } = await supabase
      .from("stores")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id)

    if (error) {
      console.error("Erro ao contar lojas do usuário:", error)
      return { canCreate: false, reason: "Erro ao verificar limite de lojas" }
    }

    if (count && count >= plan.limits.stores) {
      return {
        canCreate: false,
        reason: `Você atingiu o limite de ${plan.limits.stores} lojas do plano ${plan.name}. Faça upgrade para criar mais lojas.`,
      }
    }

    return { canCreate: true }
  } catch (error) {
    console.error("Erro ao verificar se pode criar loja:", error)
    return { canCreate: false, reason: "Erro ao verificar limites do plano" }
  }
}

// Verificar se o usuário pode adicionar mais produtos a uma loja
export async function canAddProduct(storeId: string): Promise<{ canAdd: boolean; reason?: string }> {
  try {
    const supabase = createSupabaseClient()

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Usuário não autenticado")
    }

    // Verificar se o usuário é o proprietário da loja
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("owner_id")
      .eq("id", storeId)
      .single()

    if (storeError || !store || store.owner_id !== user.id) {
      return { canAdd: false, reason: "Você não tem permissão para adicionar produtos a esta loja" }
    }

    // Obter a assinatura do usuário
    const subscription = await getUserSubscription()

    // Se não tiver assinatura, usar o plano gratuito (10 produtos)
    if (!subscription || subscription.status !== "active") {
      // Contar quantos produtos a loja já tem
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)

      if (error) {
        console.error("Erro ao contar produtos da loja:", error)
        return { canAdd: false, reason: "Erro ao verificar limite de produtos" }
      }

      if (count && count >= 10) {
        return {
          canAdd: false,
          reason: "Você atingiu o limite de produtos do plano gratuito. Faça upgrade para adicionar mais produtos.",
        }
      }

      return { canAdd: true }
    }

    // Obter o plano da assinatura
    const plan = await getPlanById(subscription.planId)

    if (!plan) {
      return { canAdd: false, reason: "Plano não encontrado" }
    }

    // Contar quantos produtos a loja já tem
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId)

    if (error) {
      console.error("Erro ao contar produtos da loja:", error)
      return { canAdd: false, reason: "Erro ao verificar limite de produtos" }
    }

    if (count && count >= plan.limits.products) {
      return {
        canAdd: false,
        reason: `Você atingiu o limite de ${plan.limits.products} produtos do plano ${plan.name}. Faça upgrade para adicionar mais produtos.`,
      }
    }

    return { canAdd: true }
  } catch (error) {
    console.error("Erro ao verificar se pode adicionar produto:", error)
    return { canAdd: false, reason: "Erro ao verificar limites do plano" }
  }
}

// Verificar se o usuário pode usar domínio personalizado
export async function canUseCustomDomain(): Promise<{ canUse: boolean; reason?: string }> {
  try {
    const supabase = createSupabaseClient()

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Usuário não autenticado")
    }

    // Obter a assinatura do usuário
    const subscription = await getUserSubscription()

    // Se não tiver assinatura, não pode usar domínio personalizado
    if (!subscription || subscription.status !== "active") {
      return {
        canUse: false,
        reason:
          "Domínio personalizado está disponível apenas em planos pagos. Faça upgrade para usar esta funcionalidade.",
      }
    }

    // Obter o plano da assinatura
    const plan = await getPlanById(subscription.planId)

    if (!plan) {
      return { canUse: false, reason: "Plano não encontrado" }
    }

    if (!plan.limits.customDomain) {
      return {
        canUse: false,
        reason: `Domínio personalizado não está disponível no plano ${plan.name}. Faça upgrade para usar esta funcionalidade.`,
      }
    }

    return { canUse: true }
  } catch (error) {
    console.error("Erro ao verificar se pode usar domínio personalizado:", error)
    return { canUse: false, reason: "Erro ao verificar limites do plano" }
  }
}
