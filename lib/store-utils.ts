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

    // Verificar horário de funcionamento
    const now = new Date()

    // Dias da semana em inglês
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const today = days[now.getDay()]

    // Verificar se há configuração para o dia atual
    if (storeConfig?.operatingHours && storeConfig.operatingHours[today]) {
      const todayConfig = storeConfig.operatingHours[today]

      // Se o dia estiver marcado como fechado
      if (!todayConfig.open) {
        return {
          isOpen: false,
          statusText: "Loja fechada hoje",
          statusClass: "text-red-500 font-medium",
        }
      }

      // Verificar horário
      if (todayConfig.hours) {
        const [openTime, closeTime] = todayConfig.hours.split("-").map((time) => time.trim())

        // Converter para objetos Date para comparação
        const [openHour, openMinute] = openTime.split(":").map(Number)
        const [closeHour, closeMinute] = closeTime.split(":").map(Number)

        const openDate = new Date()
        openDate.setHours(openHour, openMinute, 0)

        const closeDate = new Date()
        closeDate.setHours(closeHour, closeMinute, 0)

        // Verificar se está dentro do horário de funcionamento
        if (now >= openDate && now <= closeDate) {
          return {
            isOpen: true,
            statusText: "Loja aberta",
            statusClass: "text-green-500 font-medium",
          }
        } else {
          // Calcular quanto tempo falta para abrir ou quanto tempo passou do fechamento
          let timeMessage = ""

          if (now < openDate) {
            // Loja ainda não abriu
            const diffMinutes = Math.floor((openDate.getTime() - now.getTime()) / (1000 * 60))

            if (diffMinutes < 60) {
              timeMessage = `Abre em ${diffMinutes} minutos`
            } else {
              const hours = Math.floor(diffMinutes / 60)
              const minutes = diffMinutes % 60
              timeMessage = `Abre em ${hours}h${minutes > 0 ? ` e ${minutes}min` : ""}`
            }
          } else {
            // Loja já fechou
            timeMessage = "Fechado por hoje"
          }

          return {
            isOpen: false,
            statusText: timeMessage,
            statusClass: "text-red-500 font-medium",
          }
        }
      }
    }

    // Verificar datas especiais
    if (storeConfig?.specialDates && storeConfig.specialDates.length > 0) {
      const today = new Date()
      const todayString = today.toISOString().split("T")[0] // Formato YYYY-MM-DD

      const specialDate = storeConfig.specialDates.find((date) => date.date === todayString)

      if (specialDate) {
        return {
          isOpen: specialDate.isOpen,
          statusText: specialDate.isOpen
            ? "Loja aberta (horário especial)"
            : `Loja fechada: ${specialDate.description || "Data especial"}`,
          statusClass: specialDate.isOpen ? "text-green-500 font-medium" : "text-red-500 font-medium",
        }
      }
    }

    // Padrão: considerar aberto se não houver configuração específica
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
