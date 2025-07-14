-- ========================================
-- RESTAURAR PRODUTOS DAS CATEGORIAS REMOVIDAS
-- Data: 2025-01-20
-- Descrição: Recriar produtos que estavam nas categorias removidas da loja principal
-- ========================================

-- CATEGORIA: MARMITAS DE AÇAÍ (ID: 8)
-- ========================================

-- 1. Marmita de Açaí
INSERT INTO products (
    name,
    description,
    image,
    sizes,
    category_id,
    store_id,
    active,
    has_additionals,
    additionals_limit,
    needs_spoon
) VALUES (
    'Marmita de Açaí',
    'Deliciosa marmita de açaí com opções de tamanhos P e G. Escolha seus adicionais favoritos!',
    'https://images.unsplash.com/photo-1591034856923-c87b5f3e6e2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    '[
        {"size": "Marmita P", "price": 33.00, "additionalsLimit": 3},
        {"size": "Marmita G", "price": 43.99, "additionalsLimit": 6}
    ]'::jsonb,
    8,
    '00000000-0000-0000-0000-000000000000',
    true,
    true,
    10,
    true
);

-- 2. Combo de 2 Marmita Mini
INSERT INTO products (
    name,
    description,
    image,
    sizes,
    category_id,
    store_id,
    active,
    has_additionals,
    additionals_limit,
    needs_spoon
) VALUES (
    'Combo de 2 Marmita Mini',
    'Combo especial com 2 marmitas mini de açaí. Perfeito para compartilhar!',
    'https://images.unsplash.com/photo-1591034856923-c87b5f3e6e2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    '[
        {"size": "2 Marmitas Mini", "price": 25.00, "additionalsLimit": 4}
    ]'::jsonb,
    8,
    '00000000-0000-0000-0000-000000000000',
    true,
    true,
    8,
    true
);

-- 3. Marmita Hamburgeira de Açaí
INSERT INTO products (
    name,
    description,
    image,
    sizes,
    category_id,
    store_id,
    active,
    has_additionals,
    additionals_limit,
    needs_spoon
) VALUES (
    'Marmita Hamburgeira de Açaí',
    'Marmita especial no formato hamburgeira, ideal para levar onde quiser!',
    'https://images.unsplash.com/photo-1591034856923-c87b5f3e6e2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    '[
        {"size": "Hamburgeira", "price": 28.00, "additionalsLimit": 5}
    ]'::jsonb,
    8,
    '00000000-0000-0000-0000-000000000000',
    true,
    true,
    10,
    true
);

-- CATEGORIA: AÇAÍ NO POTÃO (ID: 1)
-- ========================================

-- 4. Açaí no Potão
INSERT INTO products (
    name,
    description,
    image,
    sizes,
    category_id,
    store_id,
    active,
    has_additionals,
    additionals_limit,
    needs_spoon
) VALUES (
    'Açaí no Potão',
    '1L - ESCOLHA 5 ADICIONAIS GRÁTIS (1 CAMADA DE COMPLEMENTOS).\n\n2L - ESCOLHA 5 ADICIONAIS GRÁTIS (2 CAMADAS DE COMPLEMENTOS).',
    'https://images.unsplash.com/photo-1591034856923-c87b5f3e6e2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    '[
        {"size": "1L", "price": 35.00, "additionalsLimit": 5},
        {"size": "2L", "price": 65.00, "additionalsLimit": 10}
    ]'::jsonb,
    1,
    '00000000-0000-0000-0000-000000000000',
    true,
    true,
    15,
    true
);

-- CATEGORIA: AÇAÍ NO COPO PRONTO (ID: 10)
-- ========================================

-- 5. Açaí no Copo 300ml Pronto
INSERT INTO products (
    name,
    description,
    image,
    sizes,
    category_id,
    store_id,
    active,
    has_additionals,
    additionals_limit,
    needs_spoon
) VALUES (
    'Açaí no Copo 300ml Pronto',
    'Açaí cremoso de 300ml já pronto com complementos selecionados.',
    'https://images.unsplash.com/photo-1591034856923-c87b5f3e6e2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    '[
        {"size": "300ml", "price": 12.00}
    ]'::jsonb,
    10,
    '00000000-0000-0000-0000-000000000000',
    true,
    false,
    0,
    true
);

-- 6. Açaí no Copo 500ml Pronto
INSERT INTO products (
    name,
    description,
    image,
    sizes,
    category_id,
    store_id,
    active,
    has_additionals,
    additionals_limit,
    needs_spoon
) VALUES (
    'Açaí no Copo 500ml Pronto',
    'Açaí cremoso de 500ml já pronto com complementos selecionados.',
    'https://images.unsplash.com/photo-1591034856923-c87b5f3e6e2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    '[
        {"size": "500ml", "price": 16.00}
    ]'::jsonb,
    10,
    '00000000-0000-0000-0000-000000000000',
    true,
    false,
    0,
    true
);

-- 7. Açaí no Copo 700ml Pronto
INSERT INTO products (
    name,
    description,
    image,
    sizes,
    category_id,
    store_id,
    active,
    has_additionals,
    additionals_limit,
    needs_spoon
) VALUES (
    'Açaí no Copo 700ml Pronto',
    'Açaí cremoso de 700ml já pronto com complementos selecionados.',
    'https://images.unsplash.com/photo-1591034856923-c87b5f3e6e2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    '[
        {"size": "700ml", "price": 22.00}
    ]'::jsonb,
    10,
    '00000000-0000-0000-0000-000000000000',
    true,
    false,
    0,
    true
);

-- CATEGORIA: PICOLÉ FRUTAS (ID: 14)
-- ========================================

-- 8. Picolé de Açaí
INSERT INTO products (
    name,
    description,
    image,
    sizes,
    category_id,
    store_id,
    active,
    has_additionals,
    additionals_limit,
    needs_spoon
) VALUES (
    'Picolé de Açaí',
    'Refrescante picolé de açaí, perfeito para os dias quentes.',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    '[
        {"size": "Unidade", "price": 8.00}
    ]'::jsonb,
    14,
    '00000000-0000-0000-0000-000000000000',
    true,
    false,
    0,
    false
);

-- 9. Picolé de Morango
INSERT INTO products (
    name,
    description,
    image,
    sizes,
    category_id,
    store_id,
    active,
    has_additionals,
    additionals_limit,
    needs_spoon
) VALUES (
    'Picolé de Morango',
    'Delicioso picolé de morango natural, sabor intenso e refrescante.',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    '[
        {"size": "Unidade", "price": 7.00}
    ]'::jsonb,
    14,
    '00000000-0000-0000-0000-000000000000',
    true,
    false,
    0,
    false
);

-- 10. Picolé de Manga
INSERT INTO products (
    name,
    description,
    image,
    sizes,
    category_id,
    store_id,
    active,
    has_additionals,
    additionals_limit,
    needs_spoon
) VALUES (
    'Picolé de Manga',
    'Picolé tropical de manga, doce e refrescante.',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    '[
        {"size": "Unidade", "price": 7.50}
    ]'::jsonb,
    14,
    '00000000-0000-0000-0000-000000000000',
    true,
    false,
    0,
    false
);

-- 11. Picolé de Coco
INSERT INTO products (
    name,
    description,
    image,
    sizes,
    category_id,
    store_id,
    active,
    has_additionals,
    additionals_limit,
    needs_spoon
) VALUES (
    'Picolé de Coco',
    'Cremoso picolé de coco, sabor tropical irresistível.',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    '[
        {"size": "Unidade", "price": 8.50}
    ]'::jsonb,
    14,
    '00000000-0000-0000-0000-000000000000',
    true,
    false,
    0,
    false
);

-- ========================================
-- VERIFICAR PRODUTOS CRIADOS
-- ========================================

SELECT 
    'PRODUTOS RESTAURADOS' as status,
    p.id,
    p.name,
    c.name as categoria,
    jsonb_pretty(p.sizes::jsonb) as tamanhos_precos
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.category_id IN (1, 8, 10, 14)
  AND p.store_id = '00000000-0000-0000-0000-000000000000'
ORDER BY p.category_id, p.id;

-- ========================================
-- RESULTADO ESPERADO:
-- ✅ 3 produtos na categoria MARMITAS DE AÇAÍ (ID: 8)
-- ✅ 1 produto na categoria AÇAÍ NO POTÃO (ID: 1)
-- ✅ 3 produtos na categoria AÇAÍ NO COPO PRONTO (ID: 10)
-- ✅ 4 produtos na categoria PICOLÉ FRUTAS (ID: 14)
-- ✅ Total: 11 produtos restaurados
-- ========================================