# 🔧 Correção: PWA Instalando Admin ao Invés da Loja

## ❌ Problema Identificado

O PWA estava instalando a loja principal ao invés do painel administrativo devido à configuração incorreta do `manifest.json`:

- O `start_url` estava apontando para `/` (página principal da loja)
- O mesmo manifest estava sendo usado tanto para a loja quanto para o admin
- Quando o usuário instalava o PWA no admin, ele era redirecionado para a loja

## ✅ Solução Implementada

### 1. **Criação de Manifest Específico para Admin**

**Arquivo criado: `public/admin-manifest.json`**
```json
{
  "name": "PediFacil Admin - Painel Administrativo",
  "short_name": "PediFacil Admin",
  "description": "Painel administrativo para gestão de pedidos e delivery",
  "start_url": "/admin",
  "display": "standalone",
  "background_color": "#6B21A8",
  "theme_color": "#6B21A8",
  "orientation": "portrait"
}
```

### 2. **Separação dos Manifests**

**Loja (manifest.json):**
- `start_url`: `/` (página principal)
- Nome: "PediFacil - Sistema de Delivery"

**Admin (admin-manifest.json):**
- `start_url`: `/admin` (painel administrativo)
- Nome: "PediFacil Admin - Painel Administrativo"

### 3. **Atualização dos Layouts**

**`app/admin/layout.tsx`:**
```typescript
export const metadata: Metadata = {
  manifest: "/admin-manifest.json", // ← Mudança aqui
  // ...
};
```

**`app/admin/metadata.ts`:**
```typescript
export const metadata: Metadata = {
  manifest: "/admin-manifest.json", // ← Mudança aqui
  // ...
};
```

### 4. **Atualização do Service Worker**

**`public/sw.js`:**
- Adicionado `/admin-manifest.json` ao cache
- Atualizado nome do cache para `pedifacil-admin-cache-v2`
- Mantida compatibilidade com ambos os manifests

### 5. **Atualização da Página Offline**

**`public/offline.html`:**
- Título atualizado para "PediFacil Admin - Offline"
- Conteúdo focado no painel administrativo

## 🎯 Resultado

Agora quando o usuário:

1. **Acessa a loja principal (`/`)**: 
   - Usa `manifest.json`
   - PWA instala a loja com `start_url: "/"`

2. **Acessa o admin (`/admin`)**:
   - Usa `admin-manifest.json`
   - PWA instala o admin com `start_url: "/admin"`
   - Botão "Instalar App" aparece apenas no admin

## 🔍 Como Testar

1. Acesse `/admin` em um navegador compatível com PWA
2. Aguarde o botão "Instalar App" aparecer
3. Clique no botão e instale o PWA
4. Verifique se o app instalado abre diretamente no `/admin`
5. Teste a funcionalidade offline

## 📝 Observações

- O componente `PWARegister` já estava configurado corretamente para aparecer apenas no admin
- A separação dos manifests garante que cada contexto tenha sua própria configuração PWA
- O service worker continua funcionando para ambos os contextos
- Cache atualizado para versão v2 para forçar renovação

## ✅ Status

**PROBLEMA RESOLVIDO** ✅

O PWA agora instala corretamente o painel administrativo quando acessado através das rotas `/admin/*`.