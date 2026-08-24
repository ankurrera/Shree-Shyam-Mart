-- ============================================================================
-- SHREE SHYAM MART: SUPABASE POSTGRESQL SCHEMA & SEED MIGRATION (IDEMPOTENT)
-- ============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    cart_items JSONB DEFAULT '{}'::jsonb,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'seller', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zipcode INTEGER NOT NULL,
    country TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description JSONB NOT NULL DEFAULT '[]'::jsonb,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    offer_price NUMERIC(10, 2) NOT NULL CHECK (offer_price >= 0),
    category TEXT NOT NULL,
    image JSONB NOT NULL DEFAULT '[]'::jsonb,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    in_stock BOOLEAN NOT NULL DEFAULT true,
    weight TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders Table (COD)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    address_snapshot JSONB NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'Order placed' CHECK (status IN ('Order placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled')),
    payment_method TEXT NOT NULL DEFAULT 'COD' CHECK (payment_method = 'COD'),
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Refunded')),
    payment_type TEXT DEFAULT 'COD',
    is_paid BOOLEAN NOT NULL DEFAULT false,
    payment_details JSONB DEFAULT '{"provider": "COD", "reference": ""}'::jsonb,
    stock_restored BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image TEXT DEFAULT '',
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. High-Performance Query Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_instock ON products(category, in_stock);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 8. Notification Events Table (Durable Idempotency & Retries)
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_order_event UNIQUE(order_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_notification_events_order_type ON notification_events(order_id, event_type);

-- 9. Row Level Security (RLS) Configuration
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if present before recreating
DROP POLICY IF EXISTS "Public products read access" ON products;
CREATE POLICY "Public products read access" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public users read access" ON users;
CREATE POLICY "Public users read access" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public addresses read access" ON addresses;
CREATE POLICY "Public addresses read access" ON addresses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public orders read access" ON orders;
CREATE POLICY "Public orders read access" ON orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public order_items read access" ON order_items;
CREATE POLICY "Public order_items read access" ON order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public notification_events read access" ON notification_events;
CREATE POLICY "Public notification_events read access" ON notification_events FOR SELECT USING (true);

-- 10. Seed Default Seller Account (admin@example.com / greatstack123)
INSERT INTO users (name, email, password, role)
VALUES (
    'Seller Admin',
    'admin@example.com',
    '$2a$10$w6.o5bX85wA08n/.g7pM9.tJzW6zQ9qYy6/X4P9JzXW4M1O4b2x2e',
    'seller'
)
ON CONFLICT (email) 
DO UPDATE SET role = 'seller', updated_at = NOW();

