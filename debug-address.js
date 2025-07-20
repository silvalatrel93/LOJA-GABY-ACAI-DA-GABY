// Teste para verificar a exibição do endereço
const testOrder = {
  address: {
    street: "Av Bom Pastor ",
    number: "583",
    neighborhood: "JD bom pastor ",
    city: "Sarandi",
    state: "PR",
    complement: "",
    addressType: "casa"
  }
};

console.log('Endereço completo:', testOrder.address);
console.log('Street:', testOrder.address.street);
console.log('Number:', testOrder.address.number);
console.log('Concatenação:', `${testOrder.address.street}, ${testOrder.address.number}`);
console.log('Tipo do number:', typeof testOrder.address.number);
console.log('Number é truthy?', !!testOrder.address.number);
console.log('Number tem conteúdo?', testOrder.address.number && testOrder.address.number.trim() !== '');