import { getStoreConfig } from "@/lib/services/store-config-service"

export async function getStoreStatus() {
  try {
    const storeConfig = await getStoreConfig()

    // Se a loja estiver fechada manualmente
    if (storeConfig && storeConfig.isOpen === false) {
      return {
        isOpen: false,
        statusText: "Loja fechada temporariamente",
        statusClass: "text-red-500 font-medium",
      }
    }

    // Se chegou até aqui, a loja está aberta (ignorando horários)
    return {
      isOpen: true,
      statusText: "Loja aberta",
      statusClass: "text-green-500 font-medium",
    }
  } catch (error) {
    console.error("Erro ao verificar status da loja:", error)

    // Em caso de erro, assumir que está aberto para não impedir vendas
    return {
      isOpen: true,
      statusText: "Loja aberta",
      statusClass: "text-green-500 font-medium",
    }
  }
}

// Adicionar função isStoreOpen que retorna apenas o status booleano
export async function isStoreOpen(): Promise<boolean> {
  try {
    const status = await getStoreStatus()
    return status.isOpen
  } catch (error) {
    console.error("Erro ao verificar se a loja está aberta:", error)
    // Em caso de erro, assumir que está aberto para não impedir vendas
    return true
  }
}
