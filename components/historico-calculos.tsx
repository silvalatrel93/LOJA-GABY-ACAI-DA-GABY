'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { History, Trash2, Download, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createSupabaseClient } from '@/lib/supabase-client';

interface CalculoSalvo {
  id: string;
  supabaseId?: number; // ID do banco de dados
  data: string;
  valorLiquido: number;
  plano: string;
  taxaTotal: number;
  precoVenda: number;
  economia: number;
  incluirRepasse149: boolean;
  incluirRepasse159: boolean;
}

interface HistoricoCalculosProps {
  onSalvarCalculo: (calculo: Omit<CalculoSalvo, 'id' | 'data'>) => void;
  calculoAtual?: Omit<CalculoSalvo, 'id' | 'data'> | null;
}

export default function HistoricoCalculos({ onSalvarCalculo, calculoAtual }: HistoricoCalculosProps) {
  const [calculos, setCalculos] = useState<CalculoSalvo[]>([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  // Carregar histórico do Supabase e localStorage
  useEffect(() => {
    const carregarHistorico = async () => {
      try {
        // Tentar carregar do Supabase primeiro
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
          .from('calculadora_ifood_calculations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data && data.length > 0) {
          // Converter dados do Supabase para o formato local
          const calculosSupabase: CalculoSalvo[] = data.map((item: any) => ({
            id: item.id.toString(),
            supabaseId: item.id as number, // Armazenar o ID original do banco
            data: item.created_at as string,
            valorLiquido: item.valor_liquido as number,
            plano: item.plano_ifood as string,
            taxaTotal: ((item.taxa_repasse_1 || 0) + (item.taxa_repasse_2 || 0) + 
                       (item.plano_ifood === 'Básico' ? 15.2 : 26.2)),
            precoVenda: (item.valor_liquido as number) / (1 - ((item.percentual_economia as number) / 100)),
            economia: item.economia_calculada as number,
            incluirRepasse149: ((item.taxa_repasse_1 as number) || 0) > 0,
            incluirRepasse159: ((item.taxa_repasse_2 as number) || 0) > 0
          }));
          setCalculos(calculosSupabase);
          console.log('Histórico carregado do Supabase:', calculosSupabase.length, 'registros');
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar do Supabase:', error);
      }

      // Fallback para localStorage se Supabase falhar
      const historico = localStorage.getItem('historico-calculos-ifood');
      if (historico) {
        try {
          setCalculos(JSON.parse(historico));
          console.log('Histórico carregado do localStorage');
        } catch (error) {
          console.error('Erro ao carregar histórico do localStorage:', error);
        }
      }
    };

    carregarHistorico();
  }, []);

  // Salvar no localStorage sempre que calculos mudar
  useEffect(() => {
    localStorage.setItem('historico-calculos-ifood', JSON.stringify(calculos));
  }, [calculos]);

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (dataString: string): string => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const salvarCalculoAtual = async () => {
    if (!calculoAtual || !calculoAtual.valorLiquido || !calculoAtual.plano) {
      return;
    }

    const novoCalculo: CalculoSalvo = {
      id: Date.now().toString(),
      data: new Date().toISOString(),
      ...calculoAtual
    };

    try {
      // Salvar no Supabase
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('calculadora_ifood_calculations')
        .insert({
          valor_liquido: calculoAtual.valorLiquido,
          plano_ifood: calculoAtual.plano,
          taxa_repasse_1: calculoAtual.incluirRepasse149 ? 1.49 : 0,
          taxa_repasse_2: calculoAtual.incluirRepasse159 ? 1.59 : 0,
          economia_calculada: calculoAtual.economia,
          percentual_economia: ((calculoAtual.economia / calculoAtual.precoVenda) * 100)
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar no banco:', error);
        // Continuar salvando no localStorage mesmo se falhar no banco
      } else {
        console.log('Cálculo salvo no banco com sucesso:', data);
        // Atualizar o cálculo local com o ID do banco
        novoCalculo.supabaseId = (data as any).id as number;
      }
    } catch (error) {
      console.error('Erro ao conectar com o banco:', error);
    }

    // Salvar no localStorage (backup)
    setCalculos(prev => [novoCalculo, ...prev.slice(0, 9)]); // Manter apenas os 10 mais recentes
    onSalvarCalculo(calculoAtual);
  };

  const removerCalculo = async (id: string) => {
    // Encontrar o cálculo para obter o supabaseId
    const calculo = calculos.find(calc => calc.id === id);
    
    if (calculo?.supabaseId) {
      try {
        // Tentar remover do Supabase usando o ID correto
        const supabase = createSupabaseClient();
        const { error } = await supabase
          .from('calculadora_ifood_calculations')
          .delete()
          .eq('id', calculo.supabaseId);

        if (error) {
          console.error('Erro ao remover do banco:', error);
        } else {
          console.log('Cálculo removido do banco com sucesso');
        }
      } catch (error) {
        console.error('Erro ao conectar com o banco para remoção:', error);
      }
    }

    // Remover do estado local independentemente
    setCalculos(prev => prev.filter(calc => calc.id !== id));
  };

  const exportarHistorico = () => {
    const dados = calculos.map(calc => ({
      'Data': formatarData(calc.data),
      'Valor Líquido': formatarMoeda(calc.valorLiquido),
      'Plano iFood': calc.plano,
      'Taxa Total': `${calc.taxaTotal.toFixed(1)}%`,
      'Preço de Venda': formatarMoeda(calc.precoVenda),
      'Economia': formatarMoeda(calc.economia),
      'Repasse 1.49%': calc.incluirRepasse149 ? 'Sim' : 'Não',
      'Repasse 1.59%': calc.incluirRepasse159 ? 'Sim' : 'Não'
    }));

    const csv = [
      Object.keys(dados[0] || {}).join(','),
      ...dados.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico-calculos-ifood-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const economiaTotal = calculos.reduce((total, calc) => total + calc.economia, 0);
  const economiaMedia = calculos.length > 0 ? economiaTotal / calculos.length : 0;

  return (
    <Card className="border-purple-200 shadow-md">
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Histórico de Cálculos</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {calculoAtual && calculoAtual.valorLiquido && (
              <Button
                onClick={salvarCalculoAtual}
                size="sm"
                variant="outline"
                className="text-green-600 border-green-200 hover:bg-green-50 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                Salvar Cálculo
              </Button>
            )}
            <Button
              onClick={() => setMostrarHistorico(!mostrarHistorico)}
              size="sm"
              variant="outline"
              className="text-xs sm:text-sm flex-1 sm:flex-none"
            >
              {mostrarHistorico ? 'Ocultar' : 'Ver Histórico'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="px-3 sm:px-6 py-3 sm:py-6">
        {calculos.length === 0 ? (
          <Alert className="mx-1 sm:mx-0">
            <AlertDescription className="text-xs sm:text-sm">
              Nenhum cálculo salvo ainda. Faça um cálculo e clique em "Salvar Cálculo" para começar seu histórico.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Total de Cálculos</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600">{calculos.length}</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Economia Total</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">{formatarMoeda(economiaTotal)}</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Economia Média</p>
                <p className="text-lg sm:text-xl font-bold text-purple-600">{formatarMoeda(economiaMedia)}</p>
              </div>
            </div>

            {/* Botão de Exportar */}
            <div className="flex justify-center sm:justify-end mb-3 sm:mb-4">
              <Button
                onClick={exportarHistorico}
                size="sm"
                variant="outline"
                className="flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                Exportar CSV
              </Button>
            </div>

            <Separator className="mb-3 sm:mb-4" />

            {/* Lista de Cálculos */}
            {mostrarHistorico && (
              <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                {calculos.map((calculo) => (
                  <div key={calculo.id} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-2 sm:mb-3 gap-2 sm:gap-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                        <span className="text-xs sm:text-sm text-gray-600">
                          {formatarData(calculo.data)}
                        </span>
                        <Badge variant="outline" className="text-xs">{calculo.plano}</Badge>
                      </div>
                      <Button
                        onClick={() => removerCalculo(calculo.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 sm:p-2 self-end sm:self-auto"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div>
                        <p className="text-gray-600 text-xs">Valor Líquido</p>
                        <p className="font-semibold text-xs sm:text-sm">{formatarMoeda(calculo.valorLiquido)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Preço de Venda</p>
                        <p className="font-semibold text-xs sm:text-sm">{formatarMoeda(calculo.precoVenda)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Taxa Total</p>
                        <p className="font-semibold text-red-600 text-xs sm:text-sm">{calculo.taxaTotal.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Economia</p>
                        <p className="font-semibold text-green-600 text-xs sm:text-sm">{formatarMoeda(calculo.economia)}</p>
                      </div>
                    </div>
                    
                    {(calculo.incluirRepasse149 || calculo.incluirRepasse159) && (
                      <div className="mt-2 flex gap-1 sm:gap-2">
                        {calculo.incluirRepasse149 && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">+1.49%</Badge>
                        )}
                        {calculo.incluirRepasse159 && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">+1.59%</Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}