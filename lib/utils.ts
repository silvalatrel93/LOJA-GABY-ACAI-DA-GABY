// Adicionar a função formatDate ao arquivo utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatCurrency(value: number): string {
  // Sempre mostrar duas casas decimais, independentemente de ser um número inteiro
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: Date | string, formatString = "dd/MM/yyyy HH:mm"): string {
  return format(new Date(date), formatString, { locale: ptBR })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Remove o identificador técnico do tamanho do produto
 * @param size Tamanho do produto (possivelmente com identificador técnico)
 * @returns Tamanho limpo, sem identificador técnico
 */
export function cleanSizeDisplay(size: string): string {
  // Se o tamanho contém #, retorna apenas a parte antes do #
  // Isso funciona para qualquer identificador: #1, #2, #3, etc.
  if (size && size.includes("#")) {
    return size.split("#")[0]
  }
  return size
}
