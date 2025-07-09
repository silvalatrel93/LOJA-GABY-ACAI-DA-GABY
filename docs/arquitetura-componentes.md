# Arquitetura de Componentes Reutilizáveis

Este documento descreve a nova arquitetura de componentes e hooks reutilizáveis implementada no projeto Heai Açaí e Sorvetes. O objetivo desta arquitetura é reduzir a duplicação de código, melhorar a manutenibilidade e garantir uma experiência de usuário consistente em toda a aplicação.

## Componentes UI Reutilizáveis

### Button

O componente `Button` fornece uma interface consistente para todos os botões da aplicação, com suporte para diferentes variantes, tamanhos e ícones.

```tsx
import { Button } from "@/lib/components/ui/button"

// Exemplo de uso
<Button 
  variant="primary" // primary, secondary, success, outline, ghost
  size="md" // sm, md, lg
  icon={<Icon />} // opcional
  iconPosition="left" // left, right
  disabled={false} // opcional
  onClick={() => {}} // opcional
  className="" // classes adicionais
>
  Texto do botão
</Button>
```

### PriceDisplay

O componente `PriceDisplay` fornece uma forma consistente de exibir preços na aplicação, com suporte para diferentes variantes e prefixos.

```tsx
import { PriceDisplay } from "@/lib/components/ui/price-display"

// Exemplo de uso
<PriceDisplay 
  price={29.90} 
  variant="default" // default, large, small
  showPrefix={true} // opcional
  prefixText="A PARTIR DE" // opcional
  className="" // classes adicionais
/>
```

### StatusFeedback

O componente `StatusFeedback` fornece feedback visual para operações assíncronas, como carregamento, erro e sucesso.

```tsx
import { StatusFeedback } from "@/lib/components/ui/status-feedback"

// Exemplo de uso
<StatusFeedback 
  loading={isLoading} 
  error={errorMessage} 
  success={isSuccess}
  successMessage="Operação realizada com sucesso!"
>
  {/* Conteúdo a ser exibido quando não houver loading, error ou success */}
  <div>Conteúdo normal</div>
</StatusFeedback>
```

## Hooks Reutilizáveis

### useCrud

O hook `useCrud` fornece operações CRUD (Create, Read, Update, Delete) genéricas para qualquer entidade do banco de dados.

```tsx
import { useCrud } from "@/lib/hooks/use-crud"

// Exemplo de uso
const { 
  getById, 
  save, 
  remove, 
  loading, 
  error, 
  success,
  resetStatus 
} = useCrud<Product>("products")

// Buscar um produto por ID
const product = await getById("123")

// Salvar um produto (criar ou atualizar)
const savedProduct = await save({ name: "Açaí 1L", price: 29.90 })

// Excluir um produto
const deleted = await remove("123")
```

### useEntityManager

O hook `useEntityManager` fornece gerenciamento de lista de entidades, com suporte para filtros, ordenação e transformação de dados.

```tsx
import { useEntityManager } from "@/lib/hooks/use-entity-manager"

// Exemplo de uso
const { 
  data, 
  loading, 
  error, 
  refresh 
} = useEntityManager<Product>("products", {
  fetchOnMount: true, // buscar dados na montagem do componente
  activeOnly: true, // apenas registros ativos
  orderBy: "name", // ordenar por nome
  ascending: true, // ordem ascendente
  transformData: (data) => data.map(item => ({ ...item, fullName: `${item.name} - ${item.size}` })) // transformar dados
})
```

## Boas Práticas

1. **Sempre use os componentes UI reutilizáveis** em vez de criar novos estilos ou componentes para funcionalidades já existentes.

2. **Use os hooks reutilizáveis** para operações comuns de banco de dados e gerenciamento de estado.

3. **Mantenha a consistência visual** usando os componentes UI reutilizáveis em toda a aplicação.

4. **Evite duplicação de código** extraindo lógica comum para hooks personalizados.

5. **Documente novos componentes e hooks** seguindo o padrão deste documento.

## Próximos Passos

1. Refatorar gradualmente os componentes existentes para usar os novos componentes UI reutilizáveis.

2. Refatorar os serviços existentes para usar os hooks reutilizáveis.

3. Criar testes unitários para os novos componentes e hooks.

4. Expandir a biblioteca de componentes UI reutilizáveis com novos componentes conforme necessário.

## Exemplos de Refatoração

### Antes

```tsx
<div className="font-medium">
  <span className="text-xs bg-gradient-to-r from-purple-600 to-purple-900 text-transparent bg-clip-text font-bold block">A PARTIR DE</span>
  <span className="bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold">
    {formatCurrency(product.sizes[0]?.price || 0)}
  </span>
</div>
```

### Depois

```tsx
<PriceDisplay 
  price={product.sizes[0]?.price || 0} 
  showPrefix={true} 
  prefixText="A PARTIR DE" 
/>
```
