# 🍓 PediFacil - Sistema de Pedidos para Açaí

Sistema completo de pedidos online com **delivery** e **atendimento em mesa**, desenvolvido especificamente para açaiterias.

## ✨ **Funcionalidades Principais**

### 🚚 **Sistema de Delivery**

- Catálogo completo de produtos
- Carrinho de compras inteligente
- Integração com WhatsApp
- Controle independente de visibilidade

### 🍽️ **Sistema de Mesa (QR Code)**

- QR codes únicos por mesa
- Preços diferenciados por mesa
- Interface otimizada para mobile
- Controle independente de produtos

### 👥 **Painel Administrativo**

- Dashboard com métricas em tempo real
- Gerenciamento de produtos e categorias
- Controles de visibilidade independentes
- Sistema de impressão de etiquetas
- Relatórios detalhados

### 📱 **Interface Responsiva**

- Design mobile-first
- Adaptação automática para todos os dispositivos
- Textos e botões otimizados por tamanho de tela
- Experiência fluida em qualquer dispositivo

## 🚀 **Tecnologias Utilizadas**

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Pagamentos**: Mercado Pago
- **Deploy**: Vercel
- **PWA**: Service Workers

## 🎯 **Diferencial Técnico**

### **Controles de Visibilidade Independentes**

- Produtos podem ser ocultos especificamente do **delivery**
- Produtos podem ser ocultos especificamente das **mesas**
- Interface admin com toggles visuais intuitivos
- Badges informativos para cada tipo de visibilidade

### **Responsividade Avançada**

- **Desktop**: Textos completos ("Delivery: Visível", "Mesa: Oculto")
- **Mobile**: Textos compactos ("Del: ✓", "Mesa: ✗")
- **Touch-friendly**: Botões com área de toque otimizada
- **Performance**: Componentes otimizados para cada contexto

## 🔧 **Configuração e Instalação**

### **Pré-requisitos**

- Node.js 18+
- pnpm
- Conta no Supabase
- Conta no Mercado Pago (opcional)

### **Instalação**

```bash
# Clone o repositório
git clone https://github.com/SEU-USUARIO/pedifacil-sistema-delivery-mesa.git

# Entre no diretório
cd pedifacil-sistema-delivery-mesa

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp env.example .env.local
# Edite o .env.local com suas credenciais

# Execute as migrações do banco
# (Consulte: CORRECAO-VISIBILIDADE-INDEPENDENTE.sql)

# Inicie o servidor de desenvolvimento
pnpm dev
```

### **Variáveis de Ambiente**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Admin
ADMIN_PASSWORD=your-admin-password

# Loja
NEXT_PUBLIC_STORE_NAME=Nome da sua Açaiteria
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999


```

## 📱 **Demonstração**

### **Delivery**

- Acesse: `/` (página principal)
- Navegue pelo catálogo
- Adicione produtos ao carrinho
- Finalize via WhatsApp

### **Mesa**

- Acesse: `/mesa/1` (substitua "1" pelo número da mesa)
- Interface otimizada para mobile
- Preços específicos da mesa aplicados automaticamente

### **Admin**

- Acesse: `/admin`
- Login com senha configurada
- Gerencie produtos, categorias e visibilidade
- Acompanhe pedidos em tempo real

## 🔍 **Funcionalidades Técnicas Avançadas**

### **Sistema de Visibilidade**

- Coluna `hidden_from_delivery` no banco
- Coluna `hidden_from_table` no banco
- Lógica contextual no frontend
- Interface admin com toggles independentes

### **Responsividade**

- Breakpoints Tailwind: `xs`, `sm`, `md`, `lg`, `xl`
- Componentes adaptativos
- CSS customizado para casos específicos
- Performance otimizada

### **Performance**

- Lazy loading de componentes
- Otimização de imagens
- Cache inteligente
- Bundle splitting

## 📄 **Documentação**

- `TESTE-VISIBILIDADE-INDEPENDENTE.md` - Guia de testes
- `RESPONSIVIDADE-MELHORIAS-APLICADAS.md` - Detalhes técnicos
- `CORRECAO-VISIBILIDADE-INDEPENDENTE.sql` - Migração do banco
- `GUIA-VISIBILIDADE-DELIVERY.md` - Configuração de visibilidade

## 🤝 **Contribuição**

Este projeto foi desenvolvido com foco em:

- Código limpo e bem documentado
- Arquitetura escalável
- Experiência do usuário otimizada
- Performance e responsividade

## 📄 **Licença**

MIT License - Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ para açaiterias que querem oferecer a melhor experiência digital aos seus clientes!** 🍓
