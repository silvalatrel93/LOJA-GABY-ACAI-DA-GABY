'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingUp, DollarSign, Info } from 'lucide-react';
import GraficoComparativo from './grafico-comparativo';
import HistoricoCalculos from './historico-calculos';
import TooltipExplicativo, { AjudaCalculadora } from './tooltip-explicativo';

interface PlanoIFood {
  nome: string;
  comissao: number;
  taxaOnline: number;
  taxaTotal: number;
}

const planosIFood: PlanoIFood[] = [
  {
    nome: 'Básico',
    comissao: 12,
    taxaOnline: 3.2,
    taxaTotal: 15.2
  },
  {
    nome: 'Entrega Parceira',
    comissao: 23,
    taxaOnline: 3.2,
    taxaTotal: 26.2
  }
];

export default function CalculadoraIFood() {
  const [valorLiquido, setValorLiquido] = useState<string>('');
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoIFood | null>(null);
  const [incluirRepasse149, setIncluirRepasse149] = useState(false);
  const [incluirRepasse159, setIncluirRepasse159] = useState(false);
  const [precoVenda, setPrecoVenda] = useState<number>(0);
  const [taxaTotal, setTaxaTotal] = useState<number>(0);
  const [valorTaxas, setValorTaxas] = useState<number>(0);
  const [economia, setEconomia] = useState<number>(0);
  const [calculoParaSalvar, setCalculoParaSalvar] = useState<any>(null);

  useEffect(() => {
    if (valorLiquido && planoSelecionado) {
      const valor = parseFloat(valorLiquido);
      let taxaFinal = planoSelecionado.taxaTotal;
      
      if (incluirRepasse149) taxaFinal += 1.49;
      if (incluirRepasse159) taxaFinal += 1.59;
      
      const precoCalculado = valor / (1 - taxaFinal / 100);
      const taxasCalculadas = precoCalculado - valor;
      
      setTaxaTotal(taxaFinal);
      setPrecoVenda(precoCalculado);
      setValorTaxas(taxasCalculadas);
      setEconomia(taxasCalculadas);
      
      // Preparar dados para salvar
      setCalculoParaSalvar({
        valorLiquido: valor,
        plano: planoSelecionado.nome,
        taxaTotal: taxaFinal,
        precoVenda: precoCalculado,
        economia: taxasCalculadas,
        incluirRepasse149,
        incluirRepasse159
      });
    }
  }, [valorLiquido, planoSelecionado, incluirRepasse149, incluirRepasse159]);

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const economiaAnual = economia * 12;

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-6">
        <Card className="border-2 border-orange-200 shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-orange-50 to-red-50 px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="flex items-center justify-center gap-2 text-base sm:text-xl lg:text-2xl text-orange-800 leading-tight">
              <Calculator className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="text-center text-sm sm:text-base lg:text-xl">Calculadora: iFood vs Meu Sistema</span>
            </CardTitle>
            <p className="text-xs sm:text-base text-gray-600 mt-1 sm:mt-2 px-2 sm:px-0">Descubra quanto você economiza sem taxas de delivery</p>
          </CardHeader>
          
          <CardContent className="space-y-3 sm:space-y-6 p-4 sm:p-4 lg:p-6">
            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="valor-liquido" className="text-xs sm:text-base font-medium">
                  Valor líquido desejado (R$)
                </Label>
                <Input
                  id="valor-liquido"
                  type="number"
                  placeholder="Ex: 25,00"
                  value={valorLiquido}
                  onChange={(e) => setValorLiquido(e.target.value)}
                  className="text-sm sm:text-lg h-11 sm:h-auto focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs sm:text-base font-medium">Plano iFood</Label>
                <Select onValueChange={(value) => {
                  const plano = planosIFood.find(p => p.nome === value);
                  setPlanoSelecionado(plano || null);
                }}>
                  <SelectTrigger className="text-sm sm:text-lg h-11 sm:h-auto bg-white border-2 border-gray-300 hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 shadow-sm">
                    <SelectValue placeholder="Selecione o plano" className="text-gray-700" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-gray-200 shadow-lg rounded-lg">
                    {planosIFood.map((plano) => (
                      <SelectItem 
                        key={plano.nome} 
                        value={plano.nome}
                        className="bg-white hover:bg-orange-50 focus:bg-orange-100 cursor-pointer p-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm sm:text-base font-medium text-gray-800">{plano.nome}</span>
                          <Badge variant="outline" className="ml-2 text-xs bg-orange-100 text-orange-700 border-orange-300 font-semibold">
                            {plano.taxaTotal}%
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Taxa Total Display */}
            {planoSelecionado && (
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <TooltipExplicativo tipo="calculo">
                    <Label className="font-medium text-xs sm:text-base">Taxa Total Calculada</Label>
                  </TooltipExplicativo>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-orange-600 mb-2">
                  {taxaTotal.toFixed(1)}%
                </div>
                <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between items-center">
                    <TooltipExplicativo tipo="comissao" plano={planoSelecionado.nome}>
                      <span className="truncate pr-2">Comissão ({planoSelecionado.nome})</span>
                    </TooltipExplicativo>
                    <span className="font-medium">{planoSelecionado.comissao}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <TooltipExplicativo tipo="taxa-online">
                      <span>Taxa Online</span>
                    </TooltipExplicativo>
                    <span className="font-medium">{planoSelecionado.taxaOnline}%</span>
                  </div>
                  {(incluirRepasse149 || incluirRepasse159) && (
                    <div className="flex justify-between items-center">
                      <TooltipExplicativo tipo="repasse">
                        <span>Taxas de Repasse</span>
                      </TooltipExplicativo>
                      <span className="font-medium">
                        {incluirRepasse149 && '+1.49%'}
                        {incluirRepasse149 && incluirRepasse159 && ' '}
                        {incluirRepasse159 && '+1.59%'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Taxas de Repasse */}
            <div className="space-y-2 sm:space-y-4">
              <TooltipExplicativo tipo="repasse">
                <Label className="text-xs sm:text-base font-medium">Taxas de Repasse (Opcional)</Label>
              </TooltipExplicativo>
              
              <div className="space-y-1 sm:space-y-3">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-100">
                  <Label htmlFor="repasse-149" className="text-xs sm:text-base cursor-pointer flex-1">
                    Taxa de repasse +1,49%
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">{incluirRepasse149 ? '+1.49%' : '0%'}</span>
                    <Switch
                      id="repasse-149"
                      checked={incluirRepasse149}
                      onCheckedChange={setIncluirRepasse149}
                      className="p-1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-100">
                  <Label htmlFor="repasse-159" className="text-xs sm:text-base cursor-pointer flex-1">
                    Taxa de repasse +1,59%
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-600 font-medium">{incluirRepasse159 ? '+1.59%' : '0%'}</span>
                    <Switch
                      id="repasse-159"
                      checked={incluirRepasse159}
                      onCheckedChange={setIncluirRepasse159}
                      className="p-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Resultados */}
            {valorLiquido && planoSelecionado && (
              <div className="space-y-3 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  {/* iFood */}
                  <Card className="border-red-200 bg-red-50 shadow-md">
                    <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                      <CardTitle className="text-sm sm:text-lg text-red-700 flex items-center gap-2">
                        <DollarSign className="h-3 w-3 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span>Com iFood</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Preço de venda necessário:</p>
                        <p className="text-base sm:text-xl lg:text-2xl font-bold text-red-600 break-words">
                          {formatarMoeda(precoVenda)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Total em taxas:</p>
                        <p className="text-sm sm:text-lg font-semibold text-red-500 break-words">
                          {formatarMoeda(valorTaxas)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Repasse líquido:</p>
                        <p className="text-sm sm:text-lg font-medium break-words">
                          {formatarMoeda(parseFloat(valorLiquido))}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Seu Sistema */}
                  <Card className="border-green-200 bg-green-50 shadow-md">
                    <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                      <CardTitle className="text-sm sm:text-lg text-green-700 flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span>Seu Sistema</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Preço de venda:</p>
                        <p className="text-base sm:text-xl lg:text-2xl font-bold text-green-600 break-words">
                          {formatarMoeda(parseFloat(valorLiquido))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Total em taxas:</p>
                        <p className="text-sm sm:text-lg font-semibold text-green-500">
                          R$ 0,00
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Repasse líquido:</p>
                        <p className="text-sm sm:text-lg font-medium break-words">
                          {formatarMoeda(parseFloat(valorLiquido))}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Economia */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-md">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="text-center">
                      <h4 className="text-sm sm:text-lg font-semibold text-green-800 mb-1 sm:mb-2">
                        💰 Economia Total
                      </h4>
                      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1 sm:mb-2">
                        {formatarMoeda(economia)}
                      </p>
                      <p className="text-xs sm:text-sm text-green-700 px-2 sm:px-0">
                        por pedido usando seu próprio sistema
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico Comparativo */}
                <GraficoComparativo 
                  valorLiquido={parseFloat(valorLiquido)}
                  precoVendaIFood={precoVenda}
                  taxaTotal={taxaTotal}
                />
                
                {/* CTA */}
                <div className="text-center pt-2 sm:pt-4">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-4 sm:px-8 py-3 sm:py-4 text-xs sm:text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                  >
                    🚀 Quero Economizar Agora!
                  </Button>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 px-4 sm:px-0">
                    Descubra como implementar seu próprio sistema
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Cálculos */}
        <HistoricoCalculos 
          calculoAtual={calculoParaSalvar}
          onSalvarCalculo={(calculo) => {
            // Callback quando um cálculo é salvo
            console.log('Cálculo salvo:', calculo);
          }}
        />

        {/* Ajuda e FAQ */}
         <AjudaCalculadora />
      </div>
    </TooltipProvider>
  );
}