# 🔊 Guia Completo - Sistema de Notificação Sonora para Mesa

## 📋 Visão Geral

Este documento detalha como implementar um **sistema completo de notificação sonora** para pedidos de mesa em qualquer aplicação web.

### ✨ Funcionalidades:
- **Notificação sonora automática** quando novos pedidos chegam
- **Som contínuo em loop** até ser parado manualmente
- **Interface visual responsiva** com modal de notificação
- **Controle de ativação/desativação** do som
- **Compatibilidade com políticas de autoplay** dos navegadores
- **Sistema de impressão automática** integrado
- **Monitoramento em tempo real** via Supabase

## 🏗️ Arquitetura do Sistema

```
Novo Pedido Mesa → Supabase Real-time → OrderService → processOrders → Som + Visual → User Action → Reset
```

## 📋 Pré-requisitos

### 🛠️ Tecnologias:
- React 18+ com hooks
- TypeScript
- Supabase para banco e real-time
- Next.js (recomendado)
- Tailwind CSS

### 🗄️ Estrutura do Banco:
```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  order_type TEXT DEFAULT 'delivery', -- 'delivery' ou 'table'
  table_id INTEGER REFERENCES tables(id),
  notified BOOLEAN DEFAULT false,
  printed BOOLEAN DEFAULT false,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tables (
  id BIGSERIAL PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  qr_code TEXT UNIQUE NOT NULL
);
```

## 📁 Estrutura de Arquivos

```
projeto/
├── hooks/
│   └── useNotificationSound.ts          # Hook para controle de áudio
├── lib/
│   ├── services/
│   │   ├── order-service.ts             # Serviço de pedidos
│   │   └── table-service.ts             # Serviço de mesas
│   └── types.ts                         # Definições de tipos
├── app/admin/pedidos-mesa/
│   └── page.tsx                         # Página principal
└── public/sounds/
    ├── new-table-order.mp3              # Som específico para mesa
    └── new-order.mp3                    # Som para delivery
```

## 🚀 Implementação

### **1. Hook de Notificação Sonora**

```typescript
// hooks/useNotificationSound.ts
import { useEffect, useRef, useCallback } from 'react';

type SoundType = 'newOrder' | 'newTableOrder' | 'alert' | 'success';

const sounds: Record<SoundType, string> = {
  newOrder: '/sounds/new-order.mp3',
  newTableOrder: '/sounds/new-table-order.mp3',
  alert: '/sounds/alert.mp3',
  success: '/sounds/success.mp3',
};

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSupportedRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const audio = new Audio();
      const canPlay = audio.canPlayType('audio/mpeg');
      isSupportedRef.current = canPlay === 'probably' || canPlay === 'maybe';
      
      if (isSupportedRef.current) {
        audioRef.current = new Audio();
        audioRef.current.volume = 0.5;
        
        const handleError = () => {
          console.warn('Erro ao carregar áudio');
          isSupportedRef.current = false;
        };
        
        audioRef.current.addEventListener('error', handleError);
        
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('error', handleError);
            audioRef.current.pause();
            audioRef.current = null;
          }
        };
      }
    } catch (error) {
      console.warn('Erro ao inicializar áudio:', error);
      isSupportedRef.current = false;
    }
  }, []);

  const playSound = useCallback((type: SoundType = 'newOrder') => {
    if (!isSupportedRef.current || !audioRef.current) return;

    try {
      const soundPath = sounds[type];
      if (!soundPath) return;
      
      audioRef.current.src = soundPath;
      audioRef.current.play().catch(error => {
        console.warn('Erro ao reproduzir som:', error);
      });
    } catch (error) {
      console.warn('Erro ao reproduzir som:', error);
    }
  }, []);

  return { playSound, isSupported: isSupportedRef.current };
}
```

### **2. Serviço de Pedidos**

```typescript
// lib/services/order-service.ts
import { createSupabaseClient } from "../supabase-client"
import type { Order, OrderStatus } from "../types"

export const OrderService = {
  async getTableOrders(): Promise<Order[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_type", "table")
        .order("date", { ascending: false })

      if (error) return []

      return (data || []).map((order: any) => ({
        id: Number(order.id),
        customerName: String(order.customer_name),
        customerPhone: String(order.customer_phone),
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        paymentMethod: String(order.payment_method),
        status: order.status as OrderStatus,
        date: new Date(String(order.date)),
        notified: Boolean(order.notified),
        orderType: 'table',
        tableId: order.table_id ? Number(order.table_id) : undefined,
      }))
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
      return []
    }
  },

  async markOrderAsNotified(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from("orders")
        .update({ notified: true })
        .eq("id", id)

      return !error
    } catch (error) {
      return false
    }
  }
}

export function subscribeToOrderChanges(
  onOrderChange: (payload: any) => void,
  onError?: (error: Error) => void
) {
  try {
    const supabase = createSupabaseClient()
    
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onOrderChange)
      .subscribe()

    return channel
  } catch (error) {
    onError?.(error as Error)
    return null
  }
}
```

### **3. Página Principal de Mesa**

```typescript
// app/admin/pedidos-mesa/page.tsx
"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Bell, BellOff, X } from "lucide-react"
import { OrderService, subscribeToOrderChanges } from "@/lib/services/order-service"
import { useNotificationSound } from "@/hooks/useNotificationSound"
import type { Order } from "@/lib/types"

export default function PedidosMesaPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [showNewOrderNotification, setShowNewOrderNotification] = useState(false)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [showSoundActivationMessage, setShowSoundActivationMessage] = useState(false)
  
  const { playSound } = useNotificationSound()
  const prevOrdersRef = useRef<Order[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Função para iniciar som específico de mesa
  const startTableSound = useCallback(() => {
    if (!isSoundEnabled) return;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/new-table-order.mp3');
        audioRef.current.volume = 0.8; // Volume mais alto para mesa
        audioRef.current.loop = true;
      }

      const playAfterInteraction = () => {
        if (audioRef.current && isSoundEnabled) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(console.error);
          document.removeEventListener('click', playAfterInteraction);
          setShowSoundActivationMessage(false);
        }
      };

      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        setShowSoundActivationMessage(true);
        document.addEventListener('click', playAfterInteraction);
      });
    } catch (err) {
      console.error('Erro ao configurar som:', err);
    }
  }, [isSoundEnabled]);

  // Função para parar som
  const stopTableSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setShowSoundActivationMessage(false);
  }, []);

  // Processar novos pedidos
  const processTableOrders = useCallback(async (orders: Order[]) => {
    const newTableOrders = orders.filter(order => 
      !order.notified && order.status === "new" && order.orderType === "table"
    );

    if (newTableOrders.length > 0) {
      // Marcar como notificados
      await Promise.all(
        newTableOrders.map(order => OrderService.markOrderAsNotified(order.id))
      );

      // Ativar som e notificação
      if (isSoundEnabled) {
        startTableSound();
      }

      setNewOrdersCount(prev => prev + newTableOrders.length);
      setShowNewOrderNotification(true);
    }

    setOrders(orders);
  }, [isSoundEnabled, startTableSound]);

  // Carregar pedidos
  const loadTableOrders = useCallback(async () => {
    const orders = await OrderService.getTableOrders();
    processTableOrders(orders);
  }, [processTableOrders]);

  // Configurar monitoramento em tempo real
  useEffect(() => {
    let isMounted = true;
    let realtimeChannel: any = null;

    // Carregar pedidos iniciais
    loadTableOrders();

    // Configurar real-time
    realtimeChannel = subscribeToOrderChanges((payload) => {
      if (payload.type === 'INSERT' && payload.new?.order_type === 'table') {
        loadTableOrders();
      }
    });

    return () => {
      isMounted = false;
      if (realtimeChannel) realtimeChannel.unsubscribe();
      if (audioRef.current) audioRef.current.pause();
    };
  }, [loadTableOrders]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com controle de som */}
      <header className="bg-purple-800 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Pedidos Mesa</h1>
          
          <button
            onClick={() => {
              setIsSoundEnabled(!isSoundEnabled);
              if (isSoundEnabled) stopTableSound();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"
          >
            {isSoundEnabled ? (
              <>
                <Bell size={16} className="text-emerald-400" />
                <span>Som Ativo</span>
              </>
            ) : (
              <>
                <BellOff size={16} className="text-amber-400" />
                <span>Som Inativo</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Modal de notificação */}
      {showNewOrderNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-green-600 text-white p-6 rounded-lg shadow-2xl max-w-md w-full animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Bell className="mr-3 w-6 h-6" />
                <p className="font-bold text-xl">Novo Pedido Mesa!</p>
              </div>
              <button
                onClick={() => {
                  stopTableSound();
                  setShowNewOrderNotification(false);
                  setNewOrdersCount(0);
                }}
                className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-green-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-green-700 p-4 rounded-md mb-4">
              <p className="text-lg font-medium text-center">
                {newOrdersCount} novo{newOrdersCount > 1 ? 's' : ''} pedido{newOrdersCount > 1 ? 's' : ''} de mesa
              </p>

              {showSoundActivationMessage && (
                <div className="mt-3 bg-yellow-600 p-3 rounded-md animate-pulse">
                  <p className="text-white text-center font-medium">
                    Clique em qualquer lugar para ativar o som
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                stopTableSound();
                setShowNewOrderNotification(false);
                setNewOrdersCount(0);
              }}
              className="bg-white text-green-700 px-6 py-3 rounded-md font-medium text-lg hover:bg-green-100 w-full"
            >
              Aceitar Pedidos
            </button>
          </div>
        </div>
      )}

      {/* Lista de pedidos */}
      <main className="p-4">
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold">Pedido #{order.id}</h3>
              <p>Cliente: {order.customerName}</p>
              <p>Mesa: {order.tableId}</p>
              <p>Status: {order.status}</p>
              <p>Total: R$ {order.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

## 🔧 Configuração dos Arquivos de Som

Coloque os arquivos de áudio na pasta `/public/sounds/`:

- **`new-table-order.mp3`** - Som específico para pedidos de mesa
- **`new-order.mp3`** - Som para pedidos de delivery

## ✅ Checklist de Implementação

- [ ] Configurar banco de dados Supabase
- [ ] Criar hook `useNotificationSound`
- [ ] Implementar `OrderService` com real-time
- [ ] Criar página de pedidos de mesa
- [ ] Adicionar arquivos de som
- [ ] Configurar tipos TypeScript
- [ ] Testar notificações sonoras
- [ ] Testar real-time do Supabase
- [ ] Validar compatibilidade com navegadores

## 🎯 Funcionalidades Principais

### 🔊 **Sistema de Som:**
- Volume 80% para pedidos de mesa
- Loop contínuo até parar manualmente
- Fallback para interação do usuário
- Som específico diferente do delivery

### 📱 **Interface:**
- Modal verde com animação
- Contador de novos pedidos
- Botão de controle de som no header
- Mensagem de ativação quando necessário

### ⚡ **Real-time:**
- Monitoramento via Supabase
- Detecção automática de novos pedidos
- Atualização em tempo real da interface
- Fallback com verificação periódica

Este sistema garante que nenhum pedido de mesa passe despercebido, com notificação sonora contínua e interface visual clara.
