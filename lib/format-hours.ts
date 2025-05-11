import type { StoreConfig } from "./db"

type DayTranslation = {
  [key: string]: string
}

const dayTranslations: DayTranslation = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
}

export function formatOperatingHours(config: StoreConfig): string {
  if (!config.operatingHours) return "Horário não disponível"

  const formattedHours = Object.entries(config.operatingHours)
    .map(([day, settings]) => {
      const translatedDay = dayTranslations[day]
      if (!settings.open) {
        return `${translatedDay}: Fechado`
      }
      return `${translatedDay}: ${settings.hours}`
    })
    .join("<br>")

  return formattedHours
}

export function getSimplifiedOperatingHours(config: StoreConfig): string {
  if (!config.operatingHours) return "Horário não disponível"

  // Verificar se todos os dias têm o mesmo horário
  const firstOpenDay = Object.entries(config.operatingHours).find(([_, settings]) => settings.open)
  if (!firstOpenDay) return "Fechado todos os dias"

  const standardHours = firstOpenDay[1].hours
  const allSameHours = Object.entries(config.operatingHours)
    .filter(([_, settings]) => settings.open)
    .every(([_, settings]) => settings.hours === standardHours)

  // Se todos os dias abertos têm o mesmo horário
  if (allSameHours) {
    const openDays = Object.entries(config.operatingHours)
      .filter(([_, settings]) => settings.open)
      .map(([day, _]) => dayTranslations[day])

    // Se todos os dias estão abertos com o mesmo horário
    if (openDays.length === 7) {
      return `Todos os dias: ${standardHours}`
    }

    // Se dias consecutivos estão abertos (ex: Segunda a Sexta)
    const daysOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    const openDaysIndices = Object.entries(config.operatingHours)
      .filter(([_, settings]) => settings.open)
      .map(([day, _]) => daysOrder.indexOf(day))
      .sort((a, b) => a - b)

    // Verificar se os dias são consecutivos
    let isConsecutive = true
    for (let i = 1; i < openDaysIndices.length; i++) {
      if (openDaysIndices[i] !== openDaysIndices[i - 1] + 1) {
        isConsecutive = false
        break
      }
    }

    if (isConsecutive && openDaysIndices.length > 1) {
      const firstDay = dayTranslations[daysOrder[openDaysIndices[0]]]
      const lastDay = dayTranslations[daysOrder[openDaysIndices[openDaysIndices.length - 1]]]
      return `${firstDay} a ${lastDay}: ${standardHours}`
    }

    // Se não são consecutivos, listar todos
    return `${openDays.join(", ")}: ${standardHours}`
  }

  // Se os horários são diferentes, retornar formato detalhado
  return formatOperatingHours(config)
}
