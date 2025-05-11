import { getStoreConfig } from "@/lib/db"

// Dias da semana em português
const weekDays = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
}

// Função para verificar se a loja está aberta no momento
export async function isStoreOpen(): Promise<{
  isOpen: boolean
  message: string
  nextOpeningTime?: string
}> {
  const config = await getStoreConfig()

  // Se a loja estiver manualmente fechada, retorna fechado
  if (!config.isOpen) {
    return { isOpen: false, message: "Loja temporariamente fechada" }
  }

  // IMPORTANTE: Se a loja estiver manualmente marcada como aberta, retorna aberto
  // independentemente dos horários configurados
  if (config.isOpen === true) {
    return { isOpen: true, message: "Loja aberta" }
  }

  const now = new Date()
  const today = now.toISOString().split("T")[0] // Formato YYYY-MM-DD

  // Verificar se é uma data especial
  const specialDate = config.specialDates.find((date) => date.date === today)
  if (specialDate) {
    if (!specialDate.isOpen) {
      return {
        isOpen: false,
        message: specialDate.note || "Loja fechada hoje",
      }
    }
    // Se for uma data especial mas estiver aberta, continua a verificação normal
  }

  // Obter o dia da semana atual (0 = domingo, 1 = segunda, etc.)
  const dayOfWeek = now.getDay()
  const dayName = weekDays[dayOfWeek]

  // Verificar se o dia está configurado para aberto
  const dayConfig = config.operatingHours[dayName]
  if (!dayConfig.open) {
    // Encontrar o próximo dia aberto
    let nextOpenDay = null
    let daysToAdd = 1
    while (daysToAdd <= 7 && !nextOpenDay) {
      const nextDayIndex = (dayOfWeek + daysToAdd) % 7
      const nextDayName = weekDays[nextDayIndex]
      if (config.operatingHours[nextDayName].open) {
        nextOpenDay = {
          day: nextDayName,
          hours: config.operatingHours[nextDayName].hours,
        }
      }
      daysToAdd++
    }

    const nextDayMessage = nextOpenDay
      ? `Abriremos ${getDayName(nextOpenDay.day)} às ${nextOpenDay.hours.split(" - ")[0]}`
      : "Consulte nossos horários"

    return {
      isOpen: false,
      message: `Fechado hoje`,
      nextOpeningTime: nextDayMessage,
    }
  }

  // Verificar se está dentro do horário de funcionamento
  const [openTime, closeTime] = dayConfig.hours.split(" - ")
  const [openHour, openMinute] = openTime.split(":").map(Number)
  const [closeHour, closeMinute] = closeTime.split(":").map(Number)

  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  // Converter para minutos para facilitar a comparação
  const currentTimeInMinutes = currentHour * 60 + currentMinute
  const openTimeInMinutes = openHour * 60 + openMinute
  const closeTimeInMinutes = closeHour * 60 + closeMinute

  if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes) {
    return {
      isOpen: true,
      message: `Aberto hoje: ${dayConfig.hours}`,
    }
  } else {
    // Verificar se já passou do horário de fechamento ou ainda não abriu
    if (currentTimeInMinutes < openTimeInMinutes) {
      return {
        isOpen: false,
        message: `Abriremos hoje às ${openTime}`,
        nextOpeningTime: `Hoje às ${openTime}`,
      }
    } else {
      // Encontrar o próximo dia aberto
      let nextOpenDay = null
      let daysToAdd = 1
      while (daysToAdd <= 7 && !nextOpenDay) {
        const nextDayIndex = (dayOfWeek + daysToAdd) % 7
        const nextDayName = weekDays[nextDayIndex]
        if (config.operatingHours[nextDayName].open) {
          nextOpenDay = {
            day: nextDayName,
            hours: config.operatingHours[nextDayName].hours,
          }
        }
        daysToAdd++
      }

      const nextDayMessage = nextOpenDay
        ? `Abriremos ${getDayName(nextOpenDay.day)} às ${nextOpenDay.hours.split(" - ")[0]}`
        : "Consulte nossos horários"

      return {
        isOpen: false,
        message: `Fechado agora`,
        nextOpeningTime: nextDayMessage,
      }
    }
  }
}

// Função auxiliar para obter o nome do dia em português
function getDayName(day: string): string {
  const dayNames = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  }
  return dayNames[day]
}

// Função para obter o status da loja formatado para exibição
export async function getStoreStatus(): Promise<{
  isOpen: boolean
  statusText: string
  statusClass: string
}> {
  const status = await isStoreOpen()

  return {
    isOpen: status.isOpen,
    statusText: status.isOpen
      ? `Aberto agora`
      : `Fechado${status.nextOpeningTime ? ` • ${status.nextOpeningTime}` : ""}`,
    statusClass: status.isOpen ? "text-green-600" : "text-red-600",
  }
}
