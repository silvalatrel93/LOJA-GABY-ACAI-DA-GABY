// Adicionar a função formatDate ao arquivo utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(date: Date | string, formatString = "dd/MM/yyyy HH:mm"): string {
  return format(new Date(date), formatString, { locale: ptBR })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
