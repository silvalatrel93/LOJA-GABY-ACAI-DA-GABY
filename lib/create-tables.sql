-- Função para criar todas as tabelas necessárias
CREATE OR REPLACE FUNCTION create_tables()
RETURNS void AS $$
BEGIN
  -- Criar tabela categories se não existir
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Criar tabela products se não existir
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    sizes JSONB NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    active BOOLEAN NOT NULL DEFAULT true,
    allowed_additionals INTEGER[] NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Criar tabela additionals se não existir
  CREATE TABLE IF NOT EXISTS additionals (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    active BOOLEAN NOT NULL DEFAULT true,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Criar tabela carousel_slides se não existir
  CREATE TABLE IF NOT EXISTS carousel_slides (
    id INTEGER PRIMARY KEY,
    image TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    "order" INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Criar tabela phrases se não existir
  CREATE TABLE IF NOT EXISTS phrases (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Criar tabela store_config se não existir
  CREATE TABLE IF NOT EXISTS store_config (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_open BOOLEAN NOT NULL DEFAULT true,
    operating_hours JSONB NOT NULL,
    special_dates JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Criar tabela page_content se não existir
  CREATE TABLE IF NOT EXISTS page_content (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Criar tabela notifications se não existir
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Criar tabela orders se não existir
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    printed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Criar triggers para atualizar o updated_at automaticamente
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('
      CREATE OR REPLACE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    ', tbl);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Configurar políticas de segurança (RLS)
-- Habilitar RLS em todas as tabelas
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    
    -- Criar política para permitir acesso anônimo (para desenvolvimento)
    EXECUTE format('
      CREATE POLICY allow_anonymous ON %I
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
    ', tbl);
    
    -- Criar política para permitir acesso autenticado
    EXECUTE format('
      CREATE POLICY allow_authenticated ON %I
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    ', tbl);
    
    -- Criar política para permitir acesso de serviço
    EXECUTE format('
      CREATE POLICY allow_service_role ON %I
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    ', tbl);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
