'use client';

import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TooltipExplicativoProps {
  tipo: 'comissao' | 'taxa-online' | 'repasse' | 'calculo' | 'economia';
  children: React.ReactNode;
  plano?: string;
}

export default function TooltipExplicativo({ tipo, children, plano }: TooltipExplicativoProps) {
  const getConteudo = () => {
    switch (tipo) {
      case 'comissao':
        return (
          <div className="max-w-xs">
            <h4 className="font-semibold mb-2 text-gray-900">Taxa de Comissão</h4>
            <p className="text-sm mb-2 text-gray-800">
              {plano === 'Básico' 
                ? 'No plano Básico, o iFood cobra 12% de comissão sobre cada pedido.'
                : 'No plano Entrega Parceira, o iFood cobra 23% de comissão, mas inclui o serviço de entrega.'
              }
            </p>
            <p className="text-xs text-gray-700">
              Esta taxa é cobrada sobre o valor total do pedido (incluindo taxa de entrega).
            </p>
          </div>
        );
      
      case 'taxa-online':
        return (
          <div className="max-w-xs">
            <h4 className="font-semibold mb-2 text-gray-900">Taxa Online</h4>
            <p className="text-sm mb-2 text-gray-800">
              Taxa fixa de 3,2% cobrada em todos os pedidos pagos online (cartão, PIX, etc.).
            </p>
            <p className="text-xs text-gray-700">
              Esta taxa é aplicada independentemente do plano escolhido.
            </p>
          </div>
        );
      
      case 'repasse':
        return (
          <div className="max-w-xs">
            <h4 className="font-semibold mb-2 text-gray-900">Taxa de Repasse</h4>
            <p className="text-sm mb-2 text-gray-800">
              Taxas adicionais que podem ser aplicadas em situações específicas:
            </p>
            <ul className="text-xs space-y-1 text-gray-800">
              <li>• <strong>1,49%:</strong> Taxa de processamento adicional</li>
              <li>• <strong>1,59%:</strong> Taxa de serviço premium</li>
            </ul>
            <p className="text-xs text-gray-700 mt-2">
              Estas taxas variam conforme o contrato e região.
            </p>
          </div>
        );
      
      case 'calculo':
        return (
          <div className="max-w-sm">
            <h4 className="font-semibold mb-2 text-gray-900">Como Funciona o Cálculo</h4>
            <p className="text-sm mb-2 text-gray-800">
              <strong>Fórmula:</strong> Preço de Venda = Valor Líquido ÷ (1 - Taxa Total ÷ 100)
            </p>
            <div className="text-xs space-y-1 text-gray-800">
              <p><strong>Exemplo:</strong></p>
              <p>• Valor líquido desejado: R$ 25,00</p>
              <p>• Taxa total (Básico): 15,2%</p>
              <p>• Preço de venda: R$ 25,00 ÷ (1 - 0,152) = R$ 29,48</p>
              <p>• Taxa paga: R$ 4,48</p>
            </div>
          </div>
        );
      
      case 'economia':
        return (
          <div className="max-w-xs">
            <h4 className="font-semibold mb-2 text-gray-900">Sua Economia</h4>
            <p className="text-sm mb-2 text-gray-800">
              Com nosso sistema, você mantém 100% do valor dos pedidos, sem taxas de comissão.
            </p>
            <div className="text-xs space-y-1 text-gray-800">
              <p><strong>Vantagens:</strong></p>
              <p>• Zero taxas de comissão</p>
              <p>• Zero taxas online</p>
              <p>• Controle total dos preços</p>
              <p>• Relacionamento direto com o cliente</p>
            </div>
          </div>
        );
      
      default:
        return <p>Informação não disponível</p>;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {children}
            <Info className="h-3 w-3 text-gray-500 hover:text-gray-700" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-0 max-w-xs sm:max-w-sm">
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardContent className="p-2 sm:p-4">
              <div className="text-gray-900">
                {getConteudo()}
              </div>
            </CardContent>
          </Card>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente para FAQ/Ajuda
export function AjudaCalculadora() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-blue-300 bg-white shadow-lg">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-start gap-2 sm:gap-4">
          <div className="bg-blue-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
            <HelpCircle className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <h3 className="font-bold text-gray-900 text-sm sm:text-lg truncate">Dúvidas Frequentes</h3>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md flex-shrink-0"
              >
                <span className="hidden sm:inline">{isOpen ? 'Fechar' : 'Abrir'}</span>
                <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                  <svg 
                    className="h-4 w-4 sm:h-5 sm:w-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </div>
              </button>
            </div>
            
            {isOpen && (
              <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Por que preciso calcular o preço de venda?</p>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                    Para receber o valor líquido desejado, você precisa aumentar o preço para compensar as taxas do iFood.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-orange-500">
                  <p className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">As taxas são sempre as mesmas?</p>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                    Não. As taxas podem variar conforme seu contrato, região e tipo de pagamento.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500">
                  <p className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Como nosso sistema é diferente?</p>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                    Com nosso sistema, você define o preço final e recebe 100% do valor, sem descontos.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Essa calculadora é fornecida pelo iFood?</p>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                    Não, essa calculadora não tem nenhum vínculo comercial com a empresa iFood. Apenas desenvolvemos essa ferramenta para auxiliar os donos de delivery a entenderem como calcular corretamente o preço de venda considerando as taxas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}