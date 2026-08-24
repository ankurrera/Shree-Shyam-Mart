import { beforeAll, beforeEach, afterAll } from 'vitest';
import { newDb } from 'pg-mem';
import { randomUUID } from 'crypto';
import { setPool, closeDB } from '../configs/db.js';

let testPool = null;

export const initTestDB = async () => {
    const db = newDb();
    
    // Register PostgreSQL UUID generator with impure: true
    db.public.registerFunction({
        name: 'gen_random_uuid',
        returns: db.public.getType('uuid'),
        implementation: () => randomUUID(),
        impure: true
    });

    const { Pool } = db.adapters.createPg();
    testPool = new Pool();
    setPool(testPool);

    // Initialize full schema with created_at and updated_at
    await testPool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            cart_items JSONB DEFAULT '{}'::jsonb,
            role TEXT DEFAULT 'customer',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

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

        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description JSONB NOT NULL DEFAULT '[]'::jsonb,
            price NUMERIC(10, 2) NOT NULL,
            offer_price NUMERIC(10, 2) NOT NULL,
            category TEXT NOT NULL,
            image JSONB NOT NULL DEFAULT '[]'::jsonb,
            stock INTEGER NOT NULL DEFAULT 0,
            in_stock BOOLEAN NOT NULL DEFAULT true,
            weight TEXT DEFAULT '',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id),
            address_id UUID,
            address_snapshot JSONB NOT NULL,
            items JSONB NOT NULL DEFAULT '[]'::jsonb,
            amount NUMERIC(10, 2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'Order placed',
            payment_method TEXT NOT NULL DEFAULT 'COD',
            payment_status TEXT NOT NULL DEFAULT 'Pending',
            payment_type TEXT DEFAULT 'COD',
            is_paid BOOLEAN NOT NULL DEFAULT false,
            payment_details JSONB DEFAULT '{"provider": "COD", "reference": ""}'::jsonb,
            stock_restored BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id UUID,
            name TEXT NOT NULL,
            price NUMERIC(10, 2) NOT NULL,
            image TEXT DEFAULT '',
            quantity INTEGER NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    return testPool;
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_super_secure_jwt_secret_key_1234567890';
    process.env.SELLER_EMAIL = 'seller@example.com';
    process.env.SELLER_PASSWORD = 'SellerPassword123!';
    process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
    process.env.CLOUDINARY_API_KEY = 'test_key';
    process.env.CLOUDINARY_API_SECRET = 'test_secret';

    await initTestDB();
});

beforeEach(async () => {
    if (!testPool) {
        await initTestDB();
    } else {
        await testPool.query('DELETE FROM order_items');
        await testPool.query('DELETE FROM orders');
        await testPool.query('DELETE FROM addresses');
        await testPool.query('DELETE FROM users');
        await testPool.query('DELETE FROM products');
    }
});

afterAll(async () => {
    await closeDB();
});
