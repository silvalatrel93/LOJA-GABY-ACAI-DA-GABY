// Teste para verificar formatação de endereço
const { MapsService } = require('./lib/services/maps-service.ts');

// Dados reais do banco
const addressFromDB = {
  "city": "Sarandi",
  "state": "PR",
  "number": "583",
  "street": "Av Bom Pastor ",
  "complement": "",
  "addressType": "casa",
  "neighborhood": "JD bom pastor "
};

console.log('=== TESTE DE FORMATAÇÃO DE ENDEREÇO ===');
console.log('Dados do endereço:', JSON.stringify(addressFromDB, null, 2));

// Testar formatação
const formattedAddress = MapsService.formatAddressForMaps(addressFromDB);
console.log('\nEndereço formatado:', formattedAddress);

// Testar URL de rota
const routeUrl = MapsService.generateRouteUrl(addressFromDB);
console.log('\nURL da rota:', routeUrl);

// Verificar se o número está incluído
const hasNumber = formattedAddress.includes('583');
console.log('\nNúmero "583" está incluído?', hasNumber);

if (!hasNumber) {
  console.log('❌ PROBLEMA: Número não está sendo incluído!');
  console.log('Street:', addressFromDB.street);
  console.log('Number:', addressFromDB.number);
  console.log('Condição street && number:', !!(addressFromDB.street && addressFromDB.number));
} else {
  console.log('✅ OK: Número está sendo incluído corretamente!');
}