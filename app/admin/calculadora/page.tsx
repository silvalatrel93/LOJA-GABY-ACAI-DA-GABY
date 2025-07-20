import { Metadata } from 'next';
import CalculadoraIFood from '@/components/calculadora-ifood';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Calculadora iFood vs Meu Sistema | Admin',
  description: 'Compare os custos entre iFood e seu sistema próprio',
};

export default function AdminCalculadoraPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Botão de Voltar */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 mb-4 sm:mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 shadow-sm"
        >
          <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Voltar ao Dashboard</span>
          <span className="sm:hidden">Voltar</span>
        </Link>
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          📊 Calculadora iFood vs Meu Sistema
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
          Ferramenta administrativa para comparar custos e demonstrar economia aos clientes
        </p>
      </div>
      
      <CalculadoraIFood />
    </div>
  );
}