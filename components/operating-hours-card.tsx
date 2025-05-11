import type { StoreConfig } from "@/lib/db"

interface OperatingHoursCardProps {
  storeConfig: StoreConfig
}

export default function OperatingHoursCard({ storeConfig }: OperatingHoursCardProps) {
  // Função para agrupar dias com mesmo horário
  const groupDaysByHours = () => {
    const daysMap = {
      monday: "Segunda",
      tuesday: "Terça",
      wednesday: "Quarta",
      thursday: "Quinta",
      friday: "Sexta",
      saturday: "Sábado",
      sunday: "Domingo",
    }

    const groups: { days: string[]; hours: string; open: boolean }[] = []

    if (!storeConfig.operatingHours) return groups

    // Agrupar dias com horários iguais
    Object.entries(storeConfig.operatingHours).forEach(([dayKey, config]) => {
      const dayName = daysMap[dayKey]

      // Se o dia estiver fechado
      if (!config.open) {
        const existingClosedGroup = groups.find((g) => !g.open)

        if (existingClosedGroup) {
          existingClosedGroup.days.push(dayName)
        } else {
          groups.push({ days: [dayName], hours: "", open: false })
        }
        return
      }

      // Se o dia estiver aberto
      const existingGroup = groups.find((g) => g.open && g.hours === config.hours)

      if (existingGroup) {
        existingGroup.days.push(dayName)
      } else {
        groups.push({
          days: [dayName],
          hours: config.hours,
          open: true,
        })
      }
    })

    return groups
  }

  const hourGroups = groupDaysByHours()

  // Verificar se a loja está aberta manualmente
  const isManuallyOpen = storeConfig.isOpen !== undefined

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-blue-900 pt-4 pb-2 px-4 relative">
        <h3 className="text-center">
          <span className="block text-orange-500 text-2xl font-bold tracking-wide">HORÁRIOS DE</span>
          <span className="block text-blue-100 text-xl font-semibold mb-2">funcionamento</span>
        </h3>
      </div>

      {/* Corpo com horários */}
      <div className="bg-blue-900 p-4">
        {hourGroups.map((group, index) => {
          // Extrair horário de início e fim do formato "10:00 - 22:00"
          let startTime = ""
          let endTime = ""

          if (group.open && group.hours) {
            const timeParts = group.hours.split("-").map((part) => part.trim())
            if (timeParts.length === 2) {
              startTime = timeParts[0]
              endTime = timeParts[1]
            }
          }

          return (
            <div key={index} className="bg-blue-800 rounded p-3 mb-2 last:mb-0">
              <p className="text-orange-400 font-bold text-center">
                {group.days.length > 1
                  ? `${group.days[0].toUpperCase()} A ${group.days[group.days.length - 1].toUpperCase()}`
                  : group.days[0].toUpperCase()}
              </p>
              <p className="text-white font-bold text-center">
                {!group.open ? "FECHADO" : `DAS ${startTime} ÀS ${endTime} HORAS`}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
