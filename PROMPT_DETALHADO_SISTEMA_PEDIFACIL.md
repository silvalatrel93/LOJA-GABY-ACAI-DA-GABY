# 🤖 Prompt Detalhado para Criação do Sistema PediFacil
## Especificação Completa para IA/Desenvolvedor

---

## 📋 **Contexto e Objetivo**

Crie um sistema completo de delivery e atendimento presencial (mesa) para açaiterias, chamado **PediFacil**. O sistema deve ser uma aplicação web progressiva (PWA) que funciona tanto para clientes quanto para administradores, com funcionalidades avançadas de gestão de pedidos, pagamentos e controle de visibilidade de produtos.

---

## 🎯 **Requisitos Funcionais Principais**

### **1. Sistema Dual (Delivery + Mesa)**
- **Delivery**: Página principal (`/`) com produtos para entrega
- **Mesa**: Páginas dinâmicas (`/mesa/[numero]`) para atendimento presencial
- **Preços Diferenciados**: Produtos devem ter preços diferentes para delivery e mesa
- **Detecção Automática**: Sistema deve detectar o contexto automaticamente
- **Filtros Inteligentes**: Produtos podem ser ocultos especificamente para delivery ou mesa

### **2. Gestão de Produtos Avançada**
- **Visibilidade Independente**: Cada produto pode ser:
  - Visível no delivery e oculto na mesa
  - Visível na mesa e oculto no delivery
  - Visível em ambos ou oculto em ambos
- **Tamanhos Múltiplos**: Produtos com diferentes tamanhos e preços
- **Adicionais**: Sistema de adicionais com preços específicos
- **Categorias**: Organização por categorias
- **Imagens Otimizadas**: Suporte a imagens com lazy loading

### **3. Carrinho Inteligente**
- **Contexto Preservado**: Carrinho mantém informação se é delivery ou mesa
- **Persistência**: Dados salvos no localStorage
- **Adicionais**: Suporte completo a adicionais por item
- **Observações**: Campo de notas por item
- **Colheres**: Sistema de solicitação de colheres
- **Cálculos Automáticos**: Subtotal, taxa de entrega, total

### **4. Sistema de Checkout**
- **Formulário Adaptativo**: Campos diferentes para delivery vs mesa
- **Validação Completa**: Validação de todos os campos obrigatórios
- **Múltiplos Pagamentos**: PIX, dinheiro, cartão na entrega
- **WhatsApp Integration**: Finalização via WhatsApp
- **Endereços**: Suporte a diferentes tipos de endereço

### **5. Integração de Pagamentos**
- **Mercado Pago PIX**: Integração completa com geração de QR Code
- **Webhook**: Sistema de notificações automáticas
- **Status Tracking**: Acompanhamento em tempo real do pagamento
- **Expiração**: Controle de tempo limite para pagamentos

### **6. Painel Administrativo Completo**
- **Dashboard**: Métricas em tempo real
- **Gestão de Pedidos**: Visualização e controle de status
- **Gestão de Produtos**: CRUD completo com upload de imagens
- **Configurações**: Personalização da loja
- **Relatórios**: Analytics e relatórios de vendas
- **Impressão**: Sistema automático de impressão de etiquetas

---

## 🏗️ **Especificações Técnicas**

### **Stack Tecnológico Obrigatório**
```
Frontend: Next.js 15+ com App Router
Language: TypeScript
Styling: Tailwind CSS + Radix UI
Database: Supabase (PostgreSQL)
Auth: Supabase Auth + Custom Admin
Payments: Mercado Pago API
State: React Context + localStorage
Deploy: Vercel
Package Manager: pnpm
```

### **Estrutura de Pastas Requerida**
```
app/
├── admin/                    # Painel administrativo
│   ├── login/               # Autenticação admin
│   ├── pedidos/             # Gestão de pedidos delivery
│   ├── pedidos-mesa/        # Gestão de pedidos mesa
│   ├── produtos/            # CRUD de produtos
│   ├── categorias/          # CRUD de categorias
│   ├── adicionais/          # CRUD de adicionais
│   ├── configuracoes/       # Configurações da loja
│   ├── horarios/            # Horários de funcionamento
│   ├── carrossel/           # Gestão do carrossel
│   ├── mesas/               # Gestão de mesas
│   └── relatorios/          # Relatórios e analytics
├── api/
│   ├── mercado-pago/
│   │   ├── pix/             # Criação de pagamentos PIX
│   │   └── webhook/         # Notificações de pagamento
│   └── admin/               # APIs administrativas
├── carrinho/                # Página do carrinho
├── checkout/                # Processo de checkout
│   ├── pix/                 # Pagamento PIX
│   ├── success/             # Sucesso
│   └── failure/             # Falha
├── delivery/                # Página de delivery
├── mesa/[numero]/           # Páginas dinâmicas de mesa
└── sobre/                   # Sobre a loja

components/
├── admin/                   # Componentes administrativos
├── product-card/            # Componentes do produto
│   ├── additional-selector.tsx
│   ├── product-image.tsx
│   ├── product-info.tsx
│   ├── quantity-selector.tsx
│   └── size-selector.tsx
├── ui/                      # Componentes base (Radix)
└── [outros componentes principais]

lib/
├── services/                # Serviços de negócio
│   ├── store-config-service.ts
│   ├── order-service.ts
│   └── product-service.ts
├── hooks/                   # Custom hooks
├── types.ts                 # Definições TypeScript
├── utils.ts                 # Funções utilitárias
├── cart-context.tsx         # Context do carrinho
└── supabase-client.ts       # Cliente Supabase
```

---

## 🗄️ **Esquema de Banco de Dados**

### **Tabela: products**
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image TEXT,
  category_id INTEGER REFERENCES categories(id),
  sizes JSONB NOT NULL, -- [{"name": "P", "deliveryPrice": 10, "tablePrice": 8}]
  hidden_from_delivery BOOLEAN DEFAULT FALSE,
  hidden_from_table BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Tabela: categories**
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image TEXT,
  order_index INTEGER DEFAULT 0,
  hidden BOOLEAN DEFAULT FALSE
);
```

### **Tabela: additionals**
```sql
CREATE TABLE additionals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  category_id INTEGER REFERENCES additional_categories(id),
  max_quantity INTEGER DEFAULT 1
);
```

### **Tabela: orders**
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  address JSONB, -- Para delivery
  items JSONB NOT NULL, -- Array de itens do pedido
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_change TEXT,
  status TEXT NOT NULL, -- pending, confirmed, preparing, ready, delivered, cancelled
  order_type TEXT NOT NULL, -- delivery, table, pickup
  table_id INTEGER, -- Para pedidos de mesa
  printed BOOLEAN DEFAULT FALSE,
  notified BOOLEAN DEFAULT FALSE,
  date TIMESTAMP DEFAULT NOW()
);
```

### **Tabela: store_config**
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
  carousel_initialized BOOLEAN DEFAULT FALSE,
  max_picoles_per_order INTEGER DEFAULT 20,
  minimum_picole_order NUMERIC(10, 2) DEFAULT 20.0,
  minimum_moreninha_order NUMERIC(10, 2) DEFAULT 17.0
);
```

---

## 🧩 **Componentes Principais Requeridos**

### **1. MainLayout**
```typescript
interface MainLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  showFooter?: boolean
}

// Deve incluir:
// - Header responsivo com glassmorphism
// - Menu hambúrguer para mobile
// - NotificationBell para admin
// - Footer com informações da loja
// - Cores dinâmicas baseadas na configuração
```

### **2. ProductCard Modular**
```typescript
interface ProductCardProps {
  product: Product
  context: 'delivery' | 'table'
  onAddToCart: (item: CartItem) => void
}

// Subcomponentes obrigatórios:
// - ProductImage: com lazy loading e fallback
// - ProductInfo: nome, descrição, preço contextual
// - SizeSelector: seleção de tamanhos com preços
// - AdditionalSelector: seleção múltipla de adicionais
// - QuantitySelector: controle de quantidade
// - Botão "Adicionar ao Carrinho" com loading
```

### **3. FloatingCartButton**
```typescript
// Botão flutuante fixo com:
// - Contador de itens
// - Total do carrinho
// - Animação de entrada/saída
// - Auto-hide durante scroll
// - Link para /carrinho
```

### **4. PixPayment**
```typescript
interface PixPaymentProps {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerDocument: string
  onPaymentSuccess: (paymentId: string) => void
  onPaymentError: (error: string) => void
}

// Funcionalidades obrigatórias:
// - Geração de QR Code via Mercado Pago
// - Cópia do código PIX
// - Verificação automática de status (polling)
// - Timer de expiração (30 minutos)
// - Estados de loading, success, error
```

---

## 🔧 **Serviços Obrigatórios**

### **1. StoreConfigService**
```typescript
class StoreConfigService {
  async getStoreConfig(): Promise<StoreConfig>
  async saveStoreConfig(config: Partial<StoreConfig>): Promise<StoreConfig>
  async createDefaultStoreConfig(): Promise<StoreConfig>
  subscribeToConfigChanges(callback: (config: StoreConfig) => void): RealtimeChannel
  getDefaultConfig(): StoreConfig
}

// Deve gerenciar:
// - Configurações da loja (nome, logo, cores)
// - Horários de funcionamento
// - Taxas de delivery
// - Configurações de pagamento
// - Fallback para configuração padrão
```

### **2. OrderService**
```typescript
class OrderService {
  async getAllOrders(): Promise<Order[]>
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]>
  async getOrdersByType(type: OrderType): Promise<Order[]>
  async getOrdersByTable(tableId: number): Promise<Order[]>
  async createOrder(order: Omit<Order, 'id'>): Promise<{data: Order, error: Error}>
  async updateOrderStatus(id: number, status: OrderStatus): Promise<boolean>
  subscribeToOrderChanges(callback: (payload: any) => void): RealtimeChannel
  async getDeliveryOrders(): Promise<Order[]>
}
```

### **3. CartContext**
```typescript
interface CartContextType {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  updateNotes: (index: number, notes: string) => void
  clearCart: () => void
  tableInfo?: TableInfo
  isTableOrder: boolean
  isLoading: boolean
}

// Deve incluir:
// - Persistência no localStorage
// - Sincronização entre abas
// - Detecção automática de contexto (mesa/delivery)
// - Cálculos automáticos de totais
```

---

## 🎨 **Especificações de UI/UX**

### **Design System**
```css
/* Cores principais */
:root {
  --primary: #8B5CF6; /* Roxo padrão */
  --primary-dark: #6B21A8;
  --secondary: #F3F4F6;
  --accent: #10B981;
  --danger: #EF4444;
  --warning: #F59E0B;
}

/* Breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### **Componentes Visuais Obrigatórios**
- **Cards**: Sombras suaves, bordas arredondadas
- **Botões**: Estados hover, loading, disabled
- **Inputs**: Validação visual, placeholders
- **Modais**: Backdrop blur, animações suaves
- **Toasts**: Notificações não-intrusivas
- **Loading**: Spinners e skeletons

### **Responsividade**
- **Mobile First**: Design otimizado para celular
- **Touch Friendly**: Botões com área mínima de 44px
- **Gestos**: Swipe, pull-to-refresh onde apropriado
- **Orientação**: Suporte a portrait e landscape

---

## 🔌 **Integrações Obrigatórias**

### **1. Mercado Pago PIX**
```typescript
// API Route: /api/mercado-pago/pix
export async function POST(request: NextRequest) {
  const { transaction_amount, description, payer, external_reference } = await request.json()
  
  const paymentData = {
    transaction_amount: parseFloat(transaction_amount),
    description,
    payment_method_id: 'pix',
    payer,
    external_reference,
    date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  }
  
  const payment = await mercadoPago.payment.create({ body: paymentData })
  
  return NextResponse.json({
    id: payment.id,
    qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
    qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64
  })
}
```

### **2. WhatsApp Integration**
```typescript
// Função para gerar link do WhatsApp
function generateWhatsAppLink(order: Order, storeConfig: StoreConfig): string {
  const message = `
🛍️ *NOVO PEDIDO*

👤 *Cliente:* ${order.customerName}
📱 *Telefone:* ${order.customerPhone}

📦 *Itens:*
${order.items.map(item => 
  `• ${item.quantity}x ${item.name} (${item.size})\n  ${item.additionals?.map(add => `  + ${add.name}`).join('\n') || ''}
`).join('\n')}

💰 *Total:* R$ ${order.total.toFixed(2)}
💳 *Pagamento:* ${order.paymentMethod}

📍 *Endereço:*
${order.address ? formatAddress(order.address) : 'Retirada no local'}
  `
  
  return `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(message)}`
}
```

### **3. Supabase Real-time**
```typescript
// Subscription para pedidos em tempo real
const subscribeToOrders = (callback: (payload: any) => void) => {
  return supabase
    .channel('orders')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders'
    }, callback)
    .subscribe()
}
```

---

## 📱 **PWA Requirements**

### **Manifest**
```json
{
  "name": "PediFacil - Sistema de Delivery",
  "short_name": "PediFacil",
  "description": "Sistema completo de delivery e mesa para açaiterias",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#6B21A8",
  "theme_color": "#6B21A8",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### **Service Worker**
- Cache de recursos estáticos
- Offline fallback
- Background sync para pedidos
- Push notifications (futuro)

---

## 🔒 **Segurança e Autenticação**

### **Admin Authentication**
```typescript
// Middleware de autenticação
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('admin-auth')
    
    if (!authCookie || !verifyAdminToken(authCookie.value)) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
}
```

### **Row Level Security (RLS)**
```sql
-- Ativar RLS nas tabelas sensíveis
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Public can read store_config" ON store_config FOR SELECT TO anon USING (true);
CREATE POLICY "Public can insert orders" ON orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can manage all" ON orders FOR ALL TO authenticated USING (true);
```

---

## 📊 **Analytics e Métricas**

### **Dashboard Metrics**
```typescript
interface DashboardMetrics {
  totalOrders: number
  pendingOrders: number
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  averageOrderValue: number
  topProducts: Array<{product: Product, quantity: number, revenue: number}>
  recentOrders: Order[]
  ordersByStatus: Record<OrderStatus, number>
  ordersByType: Record<OrderType, number>
}
```

### **Reports**
- Vendas por período (dia/semana/mês)
- Performance de produtos
- Análise de horários de pico
- Comparativo delivery vs mesa
- Métodos de pagamento preferidos

---

## 🎛️ **Configurações Avançadas**

### **Store Configuration**
```typescript
interface StoreConfig {
  id: string
  name: string
  logoUrl: string
  storeColor: string
  isOpen: boolean
  deliveryFee: number
  maringaDeliveryFee: number
  operatingHours: OperatingHours
  specialDates: SpecialDate[]
  whatsappNumber: string
  pixKey: string
  maxPicolesPerOrder: number
  minimumPicoleOrder: number
  minimumMoreninhaOrder: number
  carousel_initialized: boolean
}

interface OperatingHours {
  [key: string]: {
    open: boolean
    hours: string // "08:00 - 18:00"
  }
}

interface SpecialDate {
  date: string
  isOpen: boolean
  hours?: string
  reason?: string
}
```

---

## 🚀 **Performance Requirements**

### **Métricas Obrigatórias**
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3s
- Lighthouse Score: 90+

### **Otimizações Obrigatórias**
- Next.js Image com lazy loading
- Code splitting automático
- Preload de recursos críticos
- Compressão de imagens
- Minificação de CSS/JS
- Cache agressivo de assets

---

## 🧪 **Testing Requirements**

### **Testes Obrigatórios**
```typescript
// Testes de componentes
describe('ProductCard', () => {
  it('should display correct price for delivery context', () => {})
  it('should display correct price for table context', () => {})
  it('should handle additionals selection', () => {})
  it('should add item to cart with correct data', () => {})
})

// Testes de serviços
describe('OrderService', () => {
  it('should create order successfully', () => {})
  it('should update order status', () => {})
  it('should filter orders by type', () => {})
})

// Testes de integração
describe('Checkout Flow', () => {
  it('should complete delivery order', () => {})
  it('should complete table order', () => {})
  it('should handle payment errors', () => {})
})
```

---

## 📦 **Deployment Requirements**

### **Environment Variables**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin
ADMIN_PASSWORD=
JWT_SECRET=

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=

# Store
NEXT_PUBLIC_STORE_NAME=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_STORE_COLOR=

# URLs
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_WEBHOOK_URL=
```

### **Build Configuration**
```javascript
// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  }
}
```

---

## 🔄 **Fluxos de Usuário Obrigatórios**

### **1. Fluxo de Pedido Delivery**
```
1. Usuário acessa / (página inicial)
2. Visualiza produtos filtrados para delivery
3. Seleciona produto, tamanho e adicionais
4. Adiciona ao carrinho
5. Acessa /carrinho para revisar
6. Clica em "Finalizar Pedido"
7. Vai para /checkout
8. Preenche dados pessoais e endereço
9. Seleciona método de pagamento
10. Se PIX: vai para /checkout/pix
11. Gera QR Code e aguarda pagamento
12. Sistema verifica pagamento via webhook
13. Redireciona para /checkout/success
14. Envia pedido via WhatsApp
15. Admin recebe notificação em tempo real
```

### **2. Fluxo de Pedido Mesa**
```
1. Usuário acessa /mesa/[numero]
2. Sistema detecta contexto de mesa
3. Aplica preços específicos da mesa
4. Filtra produtos visíveis para mesa
5. Adiciona produtos ao carrinho
6. Vai para checkout simplificado (sem endereço)
7. Preenche apenas nome e telefone
8. Finaliza pedido
9. Admin vê pedido na seção "Pedidos Mesa"
10. Pedido é preparado e entregue na mesa
```

### **3. Fluxo Administrativo**
```
1. Admin acessa /admin/login
2. Insere senha e autentica
3. Acessa dashboard com métricas
4. Monitora pedidos em tempo real
5. Atualiza status dos pedidos
6. Gerencia produtos e configurações
7. Gera relatórios de vendas
8. Sistema imprime etiquetas automaticamente
```

---

## ⚠️ **Casos de Erro e Edge Cases**

### **Tratamento de Erros Obrigatório**
- Falha na conexão com Supabase
- Erro na criação de pagamento PIX
- Timeout no webhook do Mercado Pago
- Produto fora de estoque
- Loja fechada durante checkout
- Erro de validação de formulário
- Falha no upload de imagem
- Perda de conexão durante pedido

### **Fallbacks Obrigatórios**
- Configuração padrão da loja
- Imagem placeholder para produtos
- Modo offline básico
- Cache de dados críticos
- Retry automático para APIs

---

## 📋 **Checklist de Implementação**

### **✅ Frontend**
- [ ] Next.js 15+ com App Router configurado
- [ ] TypeScript em todos os arquivos
- [ ] Tailwind CSS + Radix UI implementados
- [ ] Componentes responsivos e acessíveis
- [ ] PWA configurado com manifest e service worker
- [ ] Sistema de roteamento completo
- [ ] Context API para carrinho e configurações
- [ ] Formulários com validação completa
- [ ] Loading states e error boundaries
- [ ] Otimização de imagens e performance

### **✅ Backend**
- [ ] API Routes para todas as funcionalidades
- [ ] Integração completa com Mercado Pago
- [ ] Webhook para notificações de pagamento
- [ ] Middleware de autenticação admin
- [ ] Validação de dados server-side
- [ ] Rate limiting implementado
- [ ] Logs estruturados
- [ ] Error handling robusto

### **✅ Database**
- [ ] Schema Supabase completo
- [ ] Row Level Security configurado
- [ ] Índices otimizados
- [ ] Triggers para updated_at
- [ ] Políticas de acesso definidas
- [ ] Backup automático configurado
- [ ] Migrações versionadas

### **✅ Admin Panel**
- [ ] Dashboard com métricas em tempo real
- [ ] CRUD completo para produtos
- [ ] CRUD completo para categorias
- [ ] CRUD completo para adicionais
- [ ] Gestão de pedidos com filtros
- [ ] Configurações da loja
- [ ] Sistema de relatórios
- [ ] Upload de imagens
- [ ] Controle de visibilidade de produtos
- [ ] Gestão de horários de funcionamento

### **✅ Integrations**
- [ ] Mercado Pago PIX funcionando
- [ ] WhatsApp link generation
- [ ] Supabase real-time subscriptions
- [ ] Email notifications (opcional)
- [ ] Push notifications (futuro)

### **✅ Testing**
- [ ] Testes unitários para componentes críticos
- [ ] Testes de integração para fluxos principais
- [ ] Testes de API endpoints
- [ ] Testes de responsividade
- [ ] Testes de performance
- [ ] Testes de acessibilidade

### **✅ Deployment**
- [ ] Configuração de produção na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio personalizado (opcional)
- [ ] SSL/HTTPS configurado
- [ ] Monitoramento de erros
- [ ] Analytics configurado
- [ ] Backup de dados

---

## 🎯 **Critérios de Aceitação**

### **Funcionalidade**
- ✅ Sistema funciona perfeitamente em delivery e mesa
- ✅ Produtos têm preços diferentes por contexto
- ✅ Visibilidade independente funciona corretamente
- ✅ Carrinho persiste dados corretamente
- ✅ Checkout completa pedidos com sucesso
- ✅ Pagamentos PIX funcionam end-to-end
- ✅ Admin panel gerencia tudo corretamente
- ✅ Real-time updates funcionam

### **Performance**
- ✅ Lighthouse score > 90
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Funciona offline básico
- ✅ Imagens otimizadas

### **UX/UI**
- ✅ Interface intuitiva e responsiva
- ✅ Feedback visual para todas as ações
- ✅ Estados de loading e erro
- ✅ Acessibilidade básica
- ✅ Design consistente

### **Segurança**
- ✅ Autenticação admin segura
- ✅ Validação de dados
- ✅ RLS configurado
- ✅ Variáveis de ambiente protegidas
- ✅ HTTPS obrigatório

---

## 📞 **Suporte e Manutenção**

### **Documentação Obrigatória**
- README.md com instruções de instalação
- Documentação de API endpoints
- Guia de configuração de ambiente
- Troubleshooting guide
- Changelog de versões

### **Monitoramento**
- Logs estruturados para debugging
- Métricas de performance
- Alertas para erros críticos
- Backup automático de dados
- Health checks para APIs

---

**🎯 Este prompt deve resultar em um sistema completo, funcional e profissional, pronto para uso em produção por açaiterias reais. Cada funcionalidade deve ser implementada com qualidade de código comercial, seguindo as melhores práticas de desenvolvimento web moderno.**

**📅 Estimativa de desenvolvimento:** 4-6 semanas para desenvolvedor experiente  
**🔧 Complexidade:** Alta (sistema completo com múltiplas integrações)  
**💰 Valor comercial:** Alto (solução completa para negócios reais)**