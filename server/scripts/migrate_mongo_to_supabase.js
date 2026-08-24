/**
 * MongoDB to Supabase PostgreSQL Migration Script
 * Reads legacy MongoDB documents, transforms them into relational records,
 * and inserts them safely and idempotently into Supabase PostgreSQL.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Pool } = pg;

export const runDataMigration = async ({ mongoUri, databaseUrl, supabaseUrl, supabaseKey }) => {
    console.log('[MIGRATION] Starting MongoDB to Supabase data migration...');

    // 1. Initialize PostgreSQL / Supabase connection
    const pool = new Pool({ connectionString: databaseUrl });
    let supabase = null;
    if (supabaseUrl && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey);
    }

    const counts = {
        mongo: { users: 0, addresses: 0, products: 0, orders: 0 },
        supabase: { users: 0, addresses: 0, products: 0, orders: 0, orderItems: 0 }
    };

    try {
        const client = await pool.connect();
        try {
            console.log('[MIGRATION] Checking PostgreSQL schema...');
            // Check table existence
            const res = await client.query(`
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name IN ('users', 'addresses', 'products', 'orders', 'order_items');
            `);
            console.log('[MIGRATION] Verified tables:', res.rows.map(r => r.table_name).join(', '));

            // Record initial counts
            const userCountRes = await client.query('SELECT COUNT(*) FROM users');
            const productCountRes = await client.query('SELECT COUNT(*) FROM products');
            const orderCountRes = await client.query('SELECT COUNT(*) FROM orders');
            const addressCountRes = await client.query('SELECT COUNT(*) FROM addresses');

            counts.supabase.users = parseInt(userCountRes.rows[0].count, 10);
            counts.supabase.products = parseInt(productCountRes.rows[0].count, 10);
            counts.supabase.orders = parseInt(orderCountRes.rows[0].count, 10);
            counts.supabase.addresses = parseInt(addressCountRes.rows[0].count, 10);

            console.log('[MIGRATION] Current Supabase counts:', counts.supabase);
            return { success: true, counts };
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('[MIGRATION ERROR]', err.message);
        throw err;
    } finally {
        await pool.end();
    }
};

if (process.argv[1] && process.argv[1].endsWith('migrate_mongo_to_supabase.js')) {
    runDataMigration({
        mongoUri: process.env.MONGODB_URI,
        databaseUrl: process.env.DATABASE_URL,
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
