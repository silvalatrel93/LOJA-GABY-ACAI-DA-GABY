-- Remover a restrição de chave estrangeira existente
ALTER TABLE additionals DROP CONSTRAINT IF EXISTS additionals_category_id_fkey;

-- Adicionar a nova restrição de chave estrangeira para a tabela additional_categories
ALTER TABLE additionals ADD CONSTRAINT additionals_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES additional_categories(id) ON DELETE SET NULL;

-- Atualizar os adicionais existentes para usar as novas categorias
-- Primeiro, definir category_id como NULL para todos os adicionais
UPDATE additionals SET category_id = NULL;

-- Opcionalmente, você pode definir uma categoria padrão para os adicionais existentes
-- UPDATE additionals SET category_id = (SELECT id FROM additional_categories WHERE name = 'Categoria Padrão' LIMIT 1);
