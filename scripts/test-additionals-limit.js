// Script de teste para verificar o limitador de adicionais manual
console.log('🧪 Testando limitador de adicionais manual...')

// Simular um produto com limite personalizado
const testProduct = {
  id: 1,
  name: "Açaí 500ml",
  description: "Açaí cremoso de 500ml",
  image: "/test.jpg",
  sizes: [
    { size: "500ml", price: 15.00 }
  ],
  categoryId: 1,
  categoryName: "AÇAÍ",
  active: true,
  allowedAdditionals: [1, 2, 3, 4, 5, 6, 7, 8],
  hasAdditionals: true,
  additionalsLimit: 3 // Limite personalizado de 3 adicionais
}

// Simular adicionais
const testAdditionals = [
  { id: 1, name: "Banana", price: 2.00, categoryId: 1, categoryName: "FRUTAS", active: true },
  { id: 2, name: "Morango", price: 3.00, categoryId: 1, categoryName: "FRUTAS", active: true },
  { id: 3, name: "Granola", price: 2.50, categoryId: 2, categoryName: "PREMIUM", active: true },
  { id: 4, name: "Leite Condensado", price: 2.00, categoryId: 2, categoryName: "PREMIUM", active: true },
  { id: 5, name: "Chocolate", price: 3.50, categoryId: 2, categoryName: "PREMIUM", active: true }
]

console.log('✅ Produto de teste criado:', testProduct.name)
console.log('📊 Limite de adicionais:', testProduct.additionalsLimit)
console.log('🍓 Adicionais disponíveis:', testAdditionals.length)

// Simular seleção de adicionais
let selectedAdditionals = {}
let selectedCount = 0

function selectAdditional(additional) {
  if (selectedCount >= testProduct.additionalsLimit) {
    console.log(`❌ Não é possível adicionar ${additional.name} - Limite de ${testProduct.additionalsLimit} atingido`)
    return false
  }
  
  selectedAdditionals[additional.id] = { additional, quantity: 1 }
  selectedCount++
  console.log(`✅ ${additional.name} adicionado (${selectedCount}/${testProduct.additionalsLimit})`)
  return true
}

function removeAdditional(additionalId) {
  if (selectedAdditionals[additionalId]) {
    const additional = selectedAdditionals[additionalId].additional
    delete selectedAdditionals[additionalId]
    selectedCount--
    console.log(`➖ ${additional.name} removido (${selectedCount}/${testProduct.additionalsLimit})`)
    return true
  }
  return false
}

// Teste: Tentar adicionar mais adicionais que o limite
console.log('\n🧪 Teste 1: Adicionando adicionais até o limite...')
testAdditionals.forEach(additional => {
  selectAdditional(additional)
})

console.log('\n🧪 Teste 2: Removendo um adicional e adicionando outro...')
removeAdditional(1) // Remove banana
selectAdditional(testAdditionals[4]) // Tenta adicionar chocolate

console.log('\n📋 Resumo final:')
console.log('Adicionais selecionados:', Object.values(selectedAdditionals).map(item => item.additional.name))
console.log('Total selecionado:', selectedCount)
console.log('Limite do produto:', testProduct.additionalsLimit)

console.log('\n✅ Teste do limitador de adicionais concluído!') 