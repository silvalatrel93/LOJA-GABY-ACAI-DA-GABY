# 🚀 Guia Rápido - Aplicar Migração

## ⚡ Passos Simples (5 minutos)

### 1. **Acesse o Supabase Dashboard**
- Vá para: https://app.supabase.com
- Entre no seu projeto
- Clique em **"SQL Editor"** no menu lateral

### 2. **Execute a Migração**
- Copie todo o conteúdo do arquivo `APLICAR-MIGRACAO-SUPABASE.sql`
- Cole no SQL Editor
- Clique em **"Run"** (ou pressione Ctrl+Enter)

### 3. **Verifique o Resultado**
Você deve ver:
- ✅ "Coluna additionals_limit adicionada com sucesso!"
- ✅ Tabela mostrando o campo criado
- ✅ Lista de produtos atualizados

### 4. **Teste o Sistema**
- Volte para o painel administrativo
- Edite um produto
- Configure o limite de adicionais
- Salve o produto

## 🎯 O que Acontece

A migração vai:
1. ✅ Criar o campo `additionals_limit` na tabela `products`
2. ✅ Definir valor padrão de 5 adicionais
3. ✅ Atualizar todos os produtos existentes
4. ✅ Adicionar validação (só aceita valores >= 0)

## ❌ Se Der Erro

Se aparecer algum erro:
1. Copie a mensagem de erro
2. Me envie para eu ajudar
3. Ou tente executar linha por linha

## ✅ Após a Migração

O limitador de adicionais estará **100% funcional**:
- Campo de configuração no admin
- Limite personalizado por produto
- Validação automática no frontend

**Execute agora e teste!** 🚀 