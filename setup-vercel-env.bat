@echo off
echo 🚀 Configurando Variáveis de Ambiente na Vercel...
echo.

echo ⚠️  IMPORTANTE: Você precisa ter suas chaves do Mercado Pago
echo 📋 Obtenha em: https://www.mercadopago.com.br/developers/panel
echo.

echo 🔑 Configurando NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY...
vercel env add NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY

echo.
echo 🔑 Configurando MERCADO_PAGO_ACCESS_TOKEN...
vercel env add MERCADO_PAGO_ACCESS_TOKEN

echo.
echo 🌐 Configurando NEXT_PUBLIC_APP_URL...
echo https://pedi-facil-loja-2.vercel.app | vercel env add NEXT_PUBLIC_APP_URL

echo.
echo ✅ Variáveis configuradas! Fazendo redeploy...
vercel --prod

echo.
echo 🎉 Configuração completa!
echo 🔗 Acesse: https://pedi-facil-loja-2.vercel.app
echo.
pause
