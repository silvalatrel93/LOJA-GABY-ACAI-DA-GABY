# Script para configurar variáveis de ambiente na Vercel
Write-Host "🚀 Configurando variáveis de ambiente na Vercel..." -ForegroundColor Green

# Configurar NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY
Write-Host "📝 Configurando chave pública..." -ForegroundColor Yellow
$publicKey = "APP_USR-437a54b5-6505-4818-810d-ba940abbcfdf"
echo $publicKey | vercel env add NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY --scope production,preview,development

# Configurar MERCADO_PAGO_ACCESS_TOKEN  
Write-Host "📝 Configurando access token..." -ForegroundColor Yellow
$accessToken = "APP_USR-2948657089177648-072209-a5258db660a5157153e8dc81ca772eb9-244845124"
echo $accessToken | vercel env add MERCADO_PAGO_ACCESS_TOKEN --scope production,preview,development

# Configurar NEXT_PUBLIC_APP_URL
Write-Host "📝 Configurando URL da aplicação..." -ForegroundColor Yellow
$appUrl = "https://pedifacilloja2.vercel.app"
echo $appUrl | vercel env add NEXT_PUBLIC_APP_URL --scope production,preview,development --force

Write-Host "✅ Variáveis configuradas! Fazendo redeploy..." -ForegroundColor Green
vercel --prod

Write-Host "🎉 Configuração completa!" -ForegroundColor Green
Write-Host "🔗 Teste em: https://pedifacilloja2.vercel.app" -ForegroundColor Cyan
