# 📋 Documentação do Sistema de Mesas - Painel Administrativo

## 📌 Visão Geral
O sistema de mesas do PediFacil permite o gerenciamento completo das mesas do estabelecimento, incluindo geração de QR codes, controle de status e integração com pedidos. Este documento detalha a implementação e funcionamento do módulo de mesas no painel administrativo.

## 🏗️ Estrutura de Arquivos

```
app/
  admin/
    mesas/
      page.tsx            # Página principal de gerenciamento
  mesa/
    [numero]/
      page.tsx           # Página do cliente para a mesa

components/
  qr-code-generator.tsx  # Componente para gerar QR codes
  ui/                    # Componentes de UI reutilizáveis

lib/
  services/
    table-service.ts     # Serviço de manipulação das mesas
  types.ts               # Tipos TypeScript
```

## 📋 Funcionalidades Principais

### 1. Gerenciamento de Mesas
- Cadastro de novas mesas
- Edição de mesas existentes
- Exclusão de mesas
- Ativação/desativação de mesas

### 2. QR Codes
- Geração automática de QR codes
- Regeneração de QR codes
- Download dos QR codes

### 3. Estatísticas
- Total de mesas cadastradas
- Mesas ativas/inativas
- Mesas com pedidos em andamento

## 🛠️ Implementação Técnica

### 1. Serviço de Mesas (`table-service.ts`)

#### Métodos Principais:

```typescript
// Obter todas as mesas
async getAllTables(): Promise<Table[]>

// Obter mesas ativas
async getActiveTables(): Promise<Table[]>

// Obter mesa por ID
async getTableById(id: number): Promise<Table | null>

// Criar nova mesa
async createTable(tableData: TableData): Promise<{ data: Table | null; error: Error | null }>

// Atualizar mesa
async updateTable(id: number, tableData: UpdateTableData): Promise<{ data: Table | null; error: Error | null }>

// Deletar mesa
async deleteTable(id: number): Promise<{ success: boolean; error: Error | null }>

// Gerar URL do QR code
function generateQRCodeUrl(tableNumber: number): string
```

### 2. Página de Administração (`app/admin/mesas/page.tsx`)

#### Estados Principais:

```typescript
const [tables, setTables] = useState<Table[]>([])
const [isLoading, setIsLoading] = useState(true)
const [isModalOpen, setIsModalOpen] = useState(false)
const [isQRModalOpen, setIsQRModalOpen] = useState(false)
const [selectedTable, setSelectedTable] = useState<Table | null>(null)
const [formData, setFormData] = useState({
  number: "",
  name: "",
  active: true,
})
```

#### Funcionalidades Implementadas:

1. **Carregamento de Mesas**
   ```typescript
   const loadTables = async () => {
     try {
       setIsLoading(true)
       const tablesData = await TableService.getAllTables()
       setTables(tablesData)
     } catch (error) {
       console.error("Erro ao carregar mesas:", error)
     } finally {
       setIsLoading(false)
     }
   }
   ```

2. **Criação/Edição de Mesa**
   ```typescript
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault()
     
     try {
       setIsSubmitting(true)
       
       if (selectedTable) {
         // Atualizar mesa existente
         const { data, error } = await TableService.updateTable(
           selectedTable.id,
           formData
         )
         
         if (error) throw error
       } else {
         // Criar nova mesa
         const { data, error } = await TableService.createTable(formData)
         if (error) throw error
       }
       
       await loadTables()
       setIsModalOpen(false)
       resetForm()
     } catch (error) {
       console.error("Erro ao salvar mesa:", error)
     } finally {
       setIsSubmitting(false)
     }
   }
   ```

3. **Geração de QR Code**
   ```typescript
   const handleGenerateQRCode = async (tableId: number) => {
     try {
       const { data, error } = await TableService.regenerateQRCode(tableId)
       if (error) throw error
       
       await loadTables()
     } catch (error) {
       console.error("Erro ao gerar QR code:", error)
     }
   }
   ```

## 🎨 Interface do Usuário

### 1. Listagem de Mesas
- Tabela responsiva com todas as mesas
- Filtros por status (ativas/inativas)
- Ações rápidas (editar, gerar QR code, excluir)

### 2. Formulário de Mesa
- Número da mesa (obrigatório)
- Nome personalizado (opcional)
- Status (ativo/inativo)

### 3. Modal de QR Code
- Visualização do QR code
- Botão para download
- Link de compartilhamento

## 🔄 Fluxo de Funcionalidades

### Adicionar Nova Mesa
1. Clicar em "Nova Mesa"
2. Preencher formulário
3. Salvar
4. O sistema gera automaticamente um QR code

### Fazer Pedido na Mesa
1. Cliente escaneia QR code
2. É redirecionado para a página da mesa
3. Faz o pedido normalmente

### Gerenciar Mesas
1. Visualizar lista de mesas
2. Editar/Excluir conforme necessário
3. Gerar novo QR code quando necessário

## 🔒 Segurança

1. **Autenticação**
   - Todas as rotas do painel administrativo requerem autenticação
   - Verificação de sessão ativa

2. **Validação de Dados**
   - Validação do lado do cliente
   - Validação do lado do servidor
   - Sanitização de entradas

3. **Permissões**
   - Apenas administradores podem gerenciar mesas
   - Registro de alterações

## 📊 Estatísticas

O painel exibe em tempo real:
- Total de mesas cadastradas
- Mesas ativas no momento
- Mesas com pedidos em andamento
- Histórico de ocupação

## 🛠️ Manutenção

### Atualizações Recomendadas
- Manter as dependências atualizadas
- Fazer backup regular do banco de dados
- Monitorar o uso de armazenamento dos QR codes

### Solução de Problemas Comuns

#### QR Code não está funcionando
1. Verificar se a URL base está correta
2. Confirmar se a mesa está ativa
3. Verificar permissões de câmera no dispositivo

#### Mesa não aparece na listagem
1. Verificar filtros ativos
2. Confirmar se a mesa não foi excluída
3. Verificar logs de erro no console

## 📝 Conclusão

O sistema de mesas do PediFacil oferece uma solução completa para gerenciamento de mesas em restaurantes e estabelecimentos similares. Com sua interface intuitiva e recursos poderosos, simplifica o processo de atendimento e melhora a experiência tanto dos clientes quanto da equipe administrativa.

Para suporte técnico ou dúvidas adicionais, entre em contato com a equipe de desenvolvimento.

---
*Documentação atualizada em: 30/07/2025*
*Versão: 1.0.0*
