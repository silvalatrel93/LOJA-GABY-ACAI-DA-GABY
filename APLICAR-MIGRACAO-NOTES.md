# 🚀 Como Aplicar a Migração da Coluna "notes"

Para que o campo de observações funcione corretamente, você precisa adicionar a coluna `notes` à tabela `cart` no seu banco de dados Supabase.

## 📋 Instruções Passo a Passo

### Método 1: Usando o SQL Editor do Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase**

   - Vá para [supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Selecione o projeto da sua aplicação

2. **Abra o SQL Editor**

   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query" para criar uma nova consulta

3. **Execute a Migração**

   - Cole o código SQL abaixo:

   ```sql
   -- Adiciona a coluna notes à tabela cart
   ALTER TABLE cart ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

   -- Atualiza o schema cache do PostgREST
   NOTIFY pgrst, 'reload schema';
   ```

4. **Execute a Query**
   - Clique em "Run" ou pressione `Ctrl + Enter`
   - Você deve ver uma mensagem de sucesso

### Método 2: Usando o Terminal (Alternativo)

Se você tem acesso direto ao PostgreSQL:

```bash
psql -h [seu-host] -U [seu-usuario] -d [seu-banco] -c "ALTER TABLE cart ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';"
```

## ✅ Verificação

Para verificar se a migração foi aplicada corretamente:

1. No SQL Editor do Supabase, execute:

   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'cart' AND column_name = 'notes';
   ```

2. Você deve ver um resultado como:
   ```
   column_name | data_type | is_nullable | column_default
   notes       | text      | YES         | ''::text
   ```

## 🔧 Solução de Problemas

### Erro: "relation 'cart' does not exist"

- Verifique se a tabela `cart` existe no seu banco
- Se não existir, você precisa criar a estrutura básica primeiro

### Erro: "permission denied"

- Verifique se você tem permissões de administrador no banco
- Use a chave de serviço (service key) se necessário

### Erro: "column already exists"

- Isso é normal! A migração usa `IF NOT EXISTS` para evitar erros
- A coluna já foi adicionada anteriormente

## 📱 Testando a Funcionalidade

Após aplicar a migração:

1. **Adicione um produto ao carrinho**
2. **Clique em "Adicionar observações"**
3. **Digite uma observação** (ex: "remover banana")
4. **Clique em "Salvar"**
5. **Finalize um pedido**
6. **Verifique se a observação aparece na etiqueta**

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. Verifique os logs do console no navegador (F12)
2. Confirme que as variáveis de ambiente estão corretas
3. Teste a conexão com o Supabase
4. Entre em contato com o suporte técnico

---

⚠️ **Importante**: Sempre faça backup do seu banco de dados antes de aplicar migrações em produção!
