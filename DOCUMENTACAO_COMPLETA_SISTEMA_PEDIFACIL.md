# 📋 Documentação Completa do Sistema PediFacil
## Especificação Técnica Detalhada de Funcionalidades e Estrutura

### 📋 **Índice**
1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Estrutura de Pastas e Arquivos](#estrutura-de-pastas-e-arquivos)
4. [Funcionalidades Principais](#funcionalidades-principais)
5. [Sistema de Rotas](#sistema-de-rotas)
6. [Componentes Core](#componentes-core)
7. [Serviços e APIs](#serviços-e-apis)
8. [Banco de Dados](#banco-de-dados)
9. [Integração de Pagamentos](#integração-de-pagamentos)
10. [Sistema de Administração](#sistema-de-administração)
11. [PWA e Mobile](#pwa-e-mobile)
12. [Configuração e Deploy](#configuração-e-deploy)

---

## 🎯 **Visão Geral do Sistema**

### **O que é o PediFacil?**
O PediFacil é um sistema completo de delivery e atendimento presencial (mesa) desenvolvido especificamente para açaiterias e estabelecimentos similares. O sistema oferece uma experiência unificada para clientes e administradores, com funcionalidades avançadas de gestão de pedidos, pagamentos e visibilidade de produtos.

### **Principais Características:**
- ✅ **Dual Mode**: Delivery + Mesa com preços diferenciados
- ✅ **PWA**: Aplicativo web progressivo instalável
- ✅ **Responsivo**: Interface otimizada para todos os dispositivos
- ✅ **Real-time**: Atualizações em tempo real via Supabase
- ✅ **Pagamentos**: Integração com Mercado Pago (PIX)
- ✅ **Admin Panel**: Painel administrativo completo
- ✅ **Impressão**: Sistema automático de impressão de etiquetas
- ✅ **Visibilidade**: Controle independente de produtos por contexto

---

## 🏗️ **Arquitetura Técnica**

### **Stack Tecnológico:**
```
┌─────────────────────────────────────────────────────────────┐
│                    STACK TECNOLÓGICO                        │
├─────────────────────────────────────────────────────────────┤
│ Frontend:  Next.js 15.2.4 + React + TypeScript             │
│ Styling:   Tailwind CSS + Radix UI                          │
│ Backend:   Next.js API Routes                               │
│ Database:  Supabase (PostgreSQL)                            │
│ Auth:      Supabase Auth + Custom Admin                     │
│ Payments:  Mercado Pago API                                 │
│ Deploy:    Vercel                                            │
│ Package:   pnpm                                              │
└─────────────────────────────────────────────────────────────┘
```

### **Arquitetura de Componentes:**
```
┌─────────────────────────────────────────────────────────────┐
│                 ARQUITETURA DO SISTEMA                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Client App    │───▶│   API Routes    │                │
│  │   (Next.js)     │    │   (Backend)     │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           ▼                       ▼                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Components    │    │    Supabase     │                │
│  │   (UI Layer)    │    │   (Database)    │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           ▼                       ▼                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │    Services     │───▶│  External APIs  │                │
│  │   (Business)    │    │ (Mercado Pago)  │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 **Estrutura de Pastas e Arquivos**

### **Estrutura Principal:**
```
PediFacil/
├── app/                          # App Router (Next.js 13+)
│   ├── admin/                     # Painel administrativo
│   ├── api/                       # API Routes
│   ├── carrinho/                  # Página do carrinho
│   ├── checkout/                  # Processo de checkout
│   ├── delivery/                  # Página de delivery
│   ├── mesa/[numero]/             # Páginas dinâmicas de mesa
│   ├── layout.tsx                 # Layout raiz
│   └── page.tsx                   # Página inicial
├── components/                    # Componentes reutilizáveis
│   ├── admin/                     # Componentes do admin
│   ├── product-card/              # Componentes do produto
│   ├── ui/                        # Componentes base (Radix)
│   └── [outros componentes]
├── lib/                          # Utilitários e serviços
│   ├── services/                 # Serviços de negócio
│   ├── hooks/                    # Custom hooks
│   └── utils.ts                  # Funções utilitárias
├── public/                       # Arquivos estáticos
│   ├── icons/                    # Ícones PWA
│   └── images/                   # Imagens
└── [arquivos de configuração]
```

### **Arquivos de Configuração Principais:**
- `next.config.js` - Configuração do Next.js
- `tailwind.config.ts` - Configuração do Tailwind
- `package.json` - Dependências e scripts
- `tsconfig.json` - Configuração TypeScript
- `middleware.ts` - Middleware de autenticação

---

## ⚡ **Funcionalidades Principais**

### **1. Sistema Dual (Delivery + Mesa)**
```typescript
// Detecção automática de contexto
interface ContextType {
  isTableOrder: boolean
  tableNumber?: number
  pricing: 'delivery' | 'table'
}

// Preços diferenciados por contexto
interface ProductPricing {
  deliveryPrice: number
  tablePrice: number
  currentPrice: number // Calculado baseado no contexto
}
```

### **2. Sistema de Visibilidade Independente**
```typescript
// Controle de visibilidade por produto
interface ProductVisibility {
  hiddenFromDelivery: boolean
  hiddenFromTable: boolean
  isVisible: boolean // Calculado baseado no contexto
}

// Lógica de filtragem
function filterProductsByContext(products: Product[], context: ContextType) {
  return products.filter(product => {
    if (context.isTableOrder) {
      return !product.hiddenFromTable
    }
    return !product.hiddenFromDelivery
  })
}
```

### **3. Carrinho Inteligente**
```typescript
// Estado do carrinho com contexto
interface CartState {
  items: CartItem[]
  tableInfo?: TableInfo
  isTableOrder: boolean
  subtotal: number
  deliveryFee: number
  total: number
}

// Item do carrinho com adicionais
interface CartItem {
  id: number
  name: string
  size: string
  price: number
  quantity: number
  additionals: Additional[]
  needsSpoon: boolean
  spoonQuantity: number
  notes: string
}
```

### **4. Sistema de Pagamentos**
```typescript
// Integração Mercado Pago PIX
interface PixPayment {
  transaction_amount: number
  description: string
  payment_method_id: 'pix'
  payer: PayerInfo
  external_reference: string
  notification_url?: string
  date_of_expiration: string
}

// Resposta do pagamento
interface PaymentResponse {
  id: string
  status: string
  qr_code: string
  qr_code_base64: string
  ticket_url: string
  expiration_date: string
}
```

---

## 🛣️ **Sistema de Rotas**

### **Rotas Públicas:**
```
/                     # Página inicial (Delivery)
/delivery             # Página de delivery
/mesa/[numero]        # Página da mesa específica
/carrinho             # Carrinho de compras
/checkout             # Processo de checkout
/checkout/pix         # Pagamento PIX
/checkout/success     # Sucesso do pagamento
/checkout/failure     # Falha no pagamento
/sobre                # Sobre a loja
```

### **Rotas Administrativas:**
```
/admin                # Dashboard principal
/admin/login          # Login administrativo
/admin/pedidos        # Gestão de pedidos
/admin/pedidos-mesa   # Pedidos de mesa
/admin/produtos       # Gestão de produtos
/admin/categorias     # Gestão de categorias
/admin/adicionais     # Gestão de adicionais
/admin/configuracoes  # Configurações da loja
/admin/horarios       # Horários de funcionamento
/admin/carrossel      # Gestão do carrossel
/admin/mesas          # Gestão de mesas
/admin/relatorios     # Relatórios e analytics
```

### **API Routes:**
```
/api/mercado-pago/pix      # Criação de pagamentos PIX
/api/mercado-pago/webhook  # Webhook de notificações
/api/admin/*               # APIs administrativas
/api/pagseguro/*           # Integração PagSeguro (legacy)
```

---

## 🧩 **Componentes Core**

### **1. MainLayout**
```typescript
// Layout principal com header, menu e footer
interface MainLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  showFooter?: boolean
}

// Funcionalidades:
// - Header responsivo com glassmorphism
// - Menu hambúrguer mobile
// - Notificações em tempo real
// - Footer com informações da loja
```

### **2. ProductCard**
```typescript
// Card de produto modular
interface ProductCardProps {
  product: Product
  context: 'delivery' | 'table'
  onAddToCart: (item: CartItem) => void
}

// Subcomponentes:
// - ProductImage: Imagem otimizada
// - ProductInfo: Nome, descrição, preço
// - SizeSelector: Seleção de tamanhos
// - AdditionalSelector: Seleção de adicionais
// - QuantitySelector: Controle de quantidade
```

### **3. FloatingCartButton**
```typescript
// Botão flutuante do carrinho
interface FloatingCartButtonProps {
  position: 'bottom-right' | 'bottom-left'
  showTotal?: boolean
}

// Funcionalidades:
// - Contador de itens
// - Total do carrinho
// - Animações suaves
// - Auto-hide no scroll
```

### **4. PixPayment**
```typescript
// Componente de pagamento PIX
interface PixPaymentProps {
  orderId: string
  amount: number
  customerInfo: CustomerInfo
  onPaymentSuccess: (paymentId: string) => void
  onPaymentError: (error: string) => void
}

// Funcionalidades:
// - Geração de QR Code
// - Cópia do código PIX
// - Verificação automática de status
// - Timer de expiração
```

---

## 🔧 **Serviços e APIs**

### **1. StoreConfigService**
```typescript
// Gerenciamento de configurações da loja
class StoreConfigService {
  async getStoreConfig(): Promise<StoreConfig>
  async saveStoreConfig(config: Partial<StoreConfig>): Promise<StoreConfig>
  async createDefaultStoreConfig(): Promise<StoreConfig>
  subscribeToConfigChanges(callback: (config: StoreConfig) => void)
}

// Configurações gerenciadas:
// - Nome e logo da loja
// - Cores e tema
// - Horários de funcionamento
// - Taxas de delivery
// - Configurações de pagamento
```

### **2. OrderService**
```typescript
// Gerenciamento de pedidos
class OrderService {
  async getAllOrders(): Promise<Order[]>
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]>
  async getOrdersByType(type: OrderType): Promise<Order[]>
  async createOrder(order: Omit<Order, 'id'>): Promise<{data: Order, error: Error}>
  async updateOrderStatus(id: number, status: OrderStatus): Promise<boolean>
  subscribeToOrderChanges(callback: (payload: any) => void)
}

// Tipos de pedido:
// - delivery: Pedidos para entrega
// - table: Pedidos de mesa
// - pickup: Retirada no local
```

### **3. CartContext**
```typescript
// Context global do carrinho
interface CartContextType {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  updateNotes: (index: number, notes: string) => void
  clearCart: () => void
  tableInfo?: TableInfo
  isTableOrder: boolean
}

// Persistência:
// - localStorage para dados do carrinho
// - Sincronização entre abas
// - Recuperação automática
```

---

## 🗄️ **Banco de Dados**

### **Esquema Principal (Supabase/PostgreSQL):**

#### **Tabela: products**
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image TEXT,
  category_id INTEGER REFERENCES categories(id),
  sizes JSONB NOT NULL,
  hidden_from_delivery BOOLEAN DEFAULT FALSE,
  hidden_from_table BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Tabela: orders**
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL,
  order_type TEXT NOT NULL,
  table_id INTEGER,
  printed BOOLEAN DEFAULT FALSE,
  notified BOOLEAN DEFAULT FALSE,
  date TIMESTAMP DEFAULT NOW()
);
```

#### **Tabela: store_config**
```sql
CREATE TABLE store_config (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  delivery_fee NUMERIC(10, 2) DEFAULT 0,
  maringa_delivery_fee NUMERIC(10, 2) DEFAULT 8.0,
  store_color VARCHAR(7) DEFAULT '#8B5CF6',
  is_open BOOLEAN DEFAULT TRUE,
  operating_hours JSONB,
  special_dates JSONB,
  whatsapp_number VARCHAR(20),
  pix_key VARCHAR(255),
  carousel_initialized BOOLEAN DEFAULT FALSE
);
```

### **Relacionamentos:**
```
products ──┐
           ├── categories (1:N)
           └── additionals (N:M)

orders ────┐
           ├── products (N:M via items JSONB)
           └── tables (N:1)

store_config ── singleton (configuração única)
```

---

## 💳 **Integração de Pagamentos**

### **Mercado Pago PIX:**
```typescript
// Configuração do cliente
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!
})

// Criação de pagamento PIX
const paymentData = {
  transaction_amount: parseFloat(amount),
  description: `Pedido #${orderId}`,
  payment_method_id: 'pix',
  payer: {
    email: customerEmail,
    first_name: customerName,
    identification: {
      type: 'CPF',
      number: customerDocument
    }
  },
  external_reference: orderId,
  date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString()
}

// Resposta com QR Code
const response = await payment.create({ body: paymentData })
```

### **Webhook de Notificações:**
```typescript
// Endpoint: /api/mercado-pago/webhook
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  if (body.type === 'payment') {
    const paymentId = body.data.id
    const payment = await client.payment.get({ id: paymentId })
    
    // Atualizar status do pedido baseado no pagamento
    if (payment.status === 'approved') {
      await OrderService.updateOrderStatus(payment.external_reference, 'confirmed')
    }
  }
}
```

---

## 👨‍💼 **Sistema de Administração**

### **Autenticação:**
```typescript
// Middleware de autenticação
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const isAuthenticated = checkAdminAuth(request)
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
}
```

### **Dashboard Principal:**
```typescript
// Métricas em tempo real
interface DashboardMetrics {
  totalOrders: number
  pendingOrders: number
  todayRevenue: number
  averageOrderValue: number
  topProducts: Product[]
  recentOrders: Order[]
}

// Componentes do dashboard:
// - DashboardMetrics: Cards com estatísticas
// - SalesChart: Gráfico de vendas
// - RecentOrders: Pedidos recentes
// - TopProducts: Produtos mais vendidos
```

### **Gestão de Produtos:**
```typescript
// Interface de gestão
interface ProductManagement {
  products: Product[]
  categories: Category[]
  additionals: Additional[]
  
  // Ações disponíveis:
  createProduct(product: Omit<Product, 'id'>): Promise<Product>
  updateProduct(id: number, updates: Partial<Product>): Promise<Product>
  deleteProduct(id: number): Promise<boolean>
  toggleVisibility(id: number, context: 'delivery' | 'table'): Promise<boolean>
}
```

### **Gestão de Pedidos:**
```typescript
// Interface de pedidos
interface OrderManagement {
  orders: Order[]
  filters: OrderFilters
  
  // Ações disponíveis:
  updateStatus(id: number, status: OrderStatus): Promise<boolean>
  printOrder(id: number): Promise<boolean>
  notifyCustomer(id: number): Promise<boolean>
  generateReport(filters: ReportFilters): Promise<Report>
}
```

---

## 📱 **PWA e Mobile**

### **Configuração PWA:**
```json
// public/site.webmanifest
{
  "name": "PediFacil - Sistema de Delivery",
  "short_name": "PediFacil",
  "display": "standalone",
  "background_color": "#6B21A8",
  "theme_color": "#6B21A8",
  "icons": [
    {
      "src": "/icons/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### **Service Worker:**
```typescript
// Registro automático do service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => console.log('SW registered'))
    .catch(error => console.log('SW registration failed'))
}
```

### **Responsividade:**
```css
/* Breakpoints Tailwind */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */

/* Componentes adaptativos */
.product-card {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}

.admin-panel {
  @apply flex flex-col lg:flex-row;
}
```

---

## ⚙️ **Configuração e Deploy**

### **Variáveis de Ambiente:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Admin
ADMIN_PASSWORD=your-admin-password

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=your-mp-access-token
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=your-mp-public-key

# Loja
NEXT_PUBLIC_STORE_NAME=Nome da sua Loja
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
NEXT_PUBLIC_STORE_COLOR=#8B5CF6
```

### **Scripts de Build:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "vercel-build": "next build"
  }
}
```

### **Deploy na Vercel:**
```bash
# Instalação da CLI
npm i -g vercel

# Deploy
vercel --prod

# Configuração automática:
# - Build command: next build
# - Output directory: .next
# - Install command: pnpm install
```

---

## 🔄 **Fluxos de Funcionamento**

### **Fluxo de Pedido (Delivery):**
```
1. Cliente acessa / (página inicial)
2. Navega pelos produtos filtrados para delivery
3. Adiciona produtos ao carrinho com adicionais
4. Acessa /carrinho para revisar
5. Vai para /checkout e preenche dados
6. Escolhe método de pagamento
7. Se PIX: vai para /checkout/pix
8. Gera QR Code e aguarda pagamento
9. Webhook confirma pagamento
10. Redireciona para /checkout/success
11. Admin recebe notificação em tempo real
```

### **Fluxo de Pedido (Mesa):**
```
1. Cliente acessa /mesa/[numero]
2. Sistema detecta contexto de mesa
3. Aplica preços específicos da mesa
4. Filtra produtos visíveis para mesa
5. Adiciona produtos ao carrinho
6. Checkout simplificado (sem endereço)
7. Finaliza pedido
8. Admin vê pedido na seção "Pedidos Mesa"
```

### **Fluxo Administrativo:**
```
1. Admin acessa /admin/login
2. Autentica com senha
3. Dashboard com métricas em tempo real
4. Gerencia produtos/categorias/configurações
5. Monitora pedidos em tempo real
6. Atualiza status dos pedidos
7. Imprime etiquetas automaticamente
8. Gera relatórios de vendas
```

---

## 📊 **Métricas e Analytics**

### **Dados Coletados:**
- Total de pedidos por período
- Receita por dia/semana/mês
- Produtos mais vendidos
- Horários de pico
- Taxa de conversão
- Tempo médio de pedido
- Métodos de pagamento preferidos

### **Relatórios Disponíveis:**
- Vendas por período
- Performance de produtos
- Análise de clientes
- Relatório financeiro
- Estatísticas de delivery vs mesa

---

## 🔒 **Segurança**

### **Medidas Implementadas:**
- Row Level Security (RLS) no Supabase
- Autenticação admin com middleware
- Validação de dados no frontend e backend
- Sanitização de inputs
- HTTPS obrigatório
- Variáveis de ambiente protegidas
- Rate limiting nas APIs

### **Políticas de Acesso:**
```sql
-- RLS para store_config
CREATE POLICY "Authenticated users can manage store_config" 
ON store_config FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- RLS para orders
CREATE POLICY "Public can insert orders" 
ON orders FOR INSERT TO anon 
WITH CHECK (true);
```

---

## 🚀 **Performance**

### **Otimizações Implementadas:**
- **Images**: Next.js Image com lazy loading
- **Fonts**: Google Fonts otimizadas
- **Bundle**: Code splitting automático
- **Cache**: Estratégias de cache agressivas
- **Database**: Índices otimizados
- **API**: Debounce em requests
- **Real-time**: Conexões WebSocket eficientes

### **Métricas de Performance:**
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3s
- Lighthouse Score: 90+

---

## 🔧 **Manutenção e Troubleshooting**

### **Logs e Monitoramento:**
```typescript
// Sistema de logs estruturado
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data)
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data)
  }
}
```

### **Problemas Comuns e Soluções:**
1. **Erro de conexão Supabase**: Verificar variáveis de ambiente
2. **Pagamento PIX não funciona**: Validar token Mercado Pago
3. **Produtos não aparecem**: Verificar filtros de visibilidade
4. **Admin não consegue logar**: Verificar ADMIN_PASSWORD
5. **Carrinho não persiste**: Verificar localStorage

---

## 📈 **Roadmap e Melhorias Futuras**

### **Próximas Funcionalidades:**
- [ ] Sistema de cupons e promoções
- [ ] Integração com WhatsApp Business API
- [ ] Sistema de fidelidade
- [ ] Múltiplas lojas
- [ ] App mobile nativo
- [ ] Integração com delivery apps
- [ ] Sistema de avaliações
- [ ] Chat em tempo real

### **Melhorias Técnicas:**
- [ ] Migração para App Router completo
- [ ] Implementação de testes automatizados
- [ ] CI/CD com GitHub Actions
- [ ] Monitoramento com Sentry
- [ ] Cache Redis
- [ ] CDN para imagens

---

## 📞 **Suporte e Documentação**

### **Documentos Relacionados:**
- `README.md` - Guia de instalação
- `DOCUMENTACAO_SISTEMA_IMPRESSAO_AUTOMATICA.md` - Sistema de impressão
- `GUIA-VISIBILIDADE-DELIVERY.md` - Sistema de visibilidade
- `CORRECAO-*.md` - Histórico de correções

### **Contato para Suporte:**
- Documentação técnica: Este arquivo
- Issues: GitHub Issues
- Atualizações: Verificar commits recentes

---

**📅 Última atualização:** Janeiro 2025  
**🔄 Versão:** 2.0.0  
**👨‍💻 Desenvolvido com ❤️ para açaiterias que querem oferecer a melhor experiência digital!** 🍓