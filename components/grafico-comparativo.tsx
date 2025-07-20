'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GraficoComparativoProps {
  valorLiquido: number;
  precoVendaIFood: number;
  taxaTotal: number;
}

export default function GraficoComparativo({ valorLiquido, precoVendaIFood, taxaTotal }: GraficoComparativoProps) {
  const valorTaxas = precoVendaIFood - valorLiquido;
  
  const dados = [
    {
      plataforma: 'iFood',
      'Valor Líquido': valorLiquido,
      'Taxas': valorTaxas,
      'Total': precoVendaIFood
    },
    {
      plataforma: 'Seu Sistema',
      'Valor Líquido': valorLiquido,
      'Taxas': 0,
      'Total': valorLiquido
    }
  ];

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {formatarMoeda(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!valorLiquido || !precoVendaIFood) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            📊 Comparativo Visual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            Preencha os campos acima para ver o gráfico comparativo
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Comparativo Visual
        </CardTitle>
        <p className="text-sm text-gray-600">
          Visualize a diferença entre as plataformas
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dados}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plataforma" />
              <YAxis tickFormatter={(value) => formatarMoeda(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Valor Líquido" stackId="a" fill="#10b981" name="Valor Líquido" />
              <Bar dataKey="Taxas" stackId="a" fill="#ef4444" name="Taxas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Valor Líquido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Taxas</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Economia:</strong> {formatarMoeda(valorTaxas)} por pedido
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Taxa do iFood: {taxaTotal.toFixed(1)}% sobre o preço de venda
          </p>
        </div>
      </CardContent>
    </Card>
  );
}