# 📋 Instruções: Migração da Coluna 'notes' na Tabela Cart

## 🎯 Problema

O sistema está tentando usar uma coluna `notes` na tabela `cart` que não existe no banco de dados. Isso está causando erros ao tentar salvar notas dos itens do carrinho.

## ✅ Solução Temporária Aplicada

O sistema foi configurado para funcionar **sem a coluna notes** temporariamente. Os erros no console foram reduzidos para avisos (warnings) e o sistema continua funcionando normalmente.

## 🔧 Como Aplicar a Migração Permanente

### Opção 1: Via Supabase Dashboard (Recomendado)

1. **Acesse o Supabase Dashboard**

   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione seu projeto

2. **Abra o SQL Editor**

   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o SQL**

   ```sql
   -- Adicionar coluna notes à tabela cart
   ALTER TABLE cart ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

   -- Verificar se a coluna foi criada
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'cart' AND column_name = 'notes';
   ```

4. **Clique em "Run"** para executar

### Opção 2: Via Linha de Comando (se tiver acesso ao banco)

```bash
# Conectar ao PostgreSQL e executar
psql "sua-connection-string-aqui" -c "ALTER TABLE cart ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';"
```

## 🧪 Como Verificar se Funcionou

Após aplicar a migração:

1. **Reinicie o servidor de desenvolvimento**

   ```bash
   npm run dev
   # ou
   yarn dev
   ```

2. **Teste a funcionalidade**

   - Vá para o carrinho
   - Adicione uma nota a algum item
   - Verifique se a nota é salva sem erros

3. **Verifique o console**
   - Não deve haver mais erros sobre "Could not find the 'notes' column"
   - As notas devem aparecer e persistir corretamente

## 📁 Arquivo de Migração

O arquivo SQL da migração está em: `migrations/add_notes_column_to_cart.sql`

## 🚨 Importante

- **Faça backup** do banco antes de aplicar qualquer migração
- **Teste em ambiente de desenvolvimento** primeiro
- A migração usa `IF NOT EXISTS` então é segura de executar múltiplas vezes

## ✅ Após a Migração

Uma vez que a coluna estiver criada, o sistema automaticamente:

- Parará de mostrar avisos sobre a coluna ausente
- Salvará e recuperará notas dos itens do carrinho normalmente
- Funcionará com todas as funcionalidades de notas habilitadas
