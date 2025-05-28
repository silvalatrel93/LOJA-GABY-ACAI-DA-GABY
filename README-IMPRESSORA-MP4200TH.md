# Configuração da Impressora MP-4200 TH

## Especificações da Impressora

A **Bematech MP-4200 TH** é uma impressora térmica não fiscal com as seguintes características:

- **Largura do papel**: 58 a 82,5mm
- **Velocidade**: 250 mm/s
- **Resolução**: 8 dots/mm
- **Caracteres por linha**: 24, 32, 48, 64 ou 21, 28, 42, 56
- **Interface**: USB padrão
- **Diâmetro máximo da bobina**: 102mm

## Configuração do Sistema

### 1. Configuração de Papel

**Papel Recomendado:**
- Largura: **80mm** (padrão configurado)
- Diâmetro máximo: 102mm
- Espessura: 56 a 107 µm

### 2. Configurações de Impressão

**No navegador (Chrome/Edge):**
1. Ctrl + P para abrir impressão
2. Selecionar a impressora MP-4200 TH
3. Configurar:
   - **Tamanho do papel**: Personalizado 80mm x auto
   - **Margens**: 0mm (todas)
   - **Escala**: 100%
   - **Orientação**: Retrato

**No Windows:**
1. Painel de Controle > Dispositivos e Impressoras
2. Clique com botão direito na MP-4200 TH
3. Propriedades da Impressora > Preferências
4. Configurar tamanho personalizado: 80mm x 200mm

### 3. Configurações do Sistema

O sistema está configurado para:
- **Largura**: 80mm (LABEL_WIDTH_MM = 80)
- **Fonte**: Courier New (monospace)
- **Tamanhos de fonte otimizados** para 80mm
- **Quebras de linha automáticas**

### 4. Ajustes para Diferentes Larguras

**Para papel de 58mm:**
```typescript
const LABEL_WIDTH_MM = 58
```

**Para papel de 82mm:**
```typescript
const LABEL_WIDTH_MM = 82
```

## Solução de Problemas

### Problema: Letras saindo erradas na impressão
**Possíveis Causas:**
- Caracteres especiais (acentos, símbolos) não suportados
- Problema de codificação UTF-8
- Configuração de charset da impressora
- Velocidade de impressão muito alta
- Cabeça de impressão suja

**Soluções Implementadas:**
1. **Codificação UTF-8**: Adicionado charset UTF-8 no HTML de impressão
2. **Normalização de caracteres**: Caracteres especiais são automaticamente convertidos
3. **Fonte monospace**: Utiliza Courier New com fallback para Lucida Console
4. **Limpeza de caracteres**: Remove caracteres de controle problemáticos

**Soluções Manuais:**
- Limpar cabeça de impressão com álcool isopropílico
- Reduzir velocidade de impressão no driver (se disponível)
- Verificar se o papel térmico é de boa qualidade
- Testar com papel original Bematech

### Problema: Texto cortado nas laterais
**Solução**: Verificar se a largura do papel está configurada corretamente (80mm)

### Problema: Texto muito pequeno
**Solução**: Aumentar o zoom na impressão ou ajustar LABEL_WIDTH_MM

### Problema: Quebras de linha inadequadas
**Solução**: Verificar se o papel está carregado corretamente e se a largura está configurada

### Problema: Impressão muito lenta
**Solução**: Verificar conexão USB e drivers atualizados

## Características da Impressão

### Layout Otimizado:
- ✅ Cabeçalho com logo (se configurado)
- ✅ Informações do pedido
- ✅ Dados do cliente
- ✅ Endereço de entrega
- ✅ Itens com adicionais
- ✅ Totais com formatação clara
- ✅ Forma de pagamento
- ✅ Salmo bíblico no rodapé

### Formatação:
- **Fonte**: Courier New 10pt
- **Espaçamento**: Otimizado para 80mm
- **Alinhamento**: Preços à direita
- **Divisores**: Linhas tracejadas
- **Quebras**: Automáticas por palavra

## Manutenção

### Limpeza da Cabeça de Impressão:
1. **Desligar** a impressora e esperar esfriar
2. **Abrir** a tampa superior
3. **Limpar** a cabeça com algodão e álcool isopropílico (70%)
4. **Aguardar** secar completamente antes de fechar
5. **Não tocar** a cabeça com os dedos

### Problemas Comuns de Impressão:

**Letras borradas ou incompletas:**
- Cabeça de impressão suja → Limpeza necessária
- Papel térmico de baixa qualidade → Trocar por papel original
- Temperatura inadequada → Verificar configurações

**Caracteres substituídos ou errados:**
- Problema de codificação → Sistema já normaliza automaticamente
- Driver desatualizado → Atualizar driver da Bematech
- Configuração de charset → Verificar configurações regionais

**Impressão muito clara:**
- Papel térmico vencido → Verificar data de validade
- Cabeça desgastada → Contatar assistência técnica
- Configuração de densidade → Ajustar no driver

**Impressão muito escura:**
- Temperatura muito alta → Reduzir temperatura no driver
- Velocidade muito baixa → Aumentar velocidade
- Papel inadequado → Usar papel recomendado

### Troca de Papel:
1. Abrir tampa superior
2. Inserir bobina com papel saindo por baixo
3. Puxar papel até sair pela frente
4. Fechar tampa (corte automático)

### Vida Útil:
- **Mecanismo**: 200km de impressão
- **Guilhotina**: 2 milhões de cortes

## Suporte Técnico

Para problemas técnicos:
1. Verificar drivers atualizados
2. Testar com papel original Bematech
3. Verificar conexão USB
4. Consultar manual da impressora

---

**Configuração atual**: Otimizada para papel 80mm na MP-4200 TH 