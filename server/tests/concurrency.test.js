import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { query } from '../configs/db.js';

describe('Concurrency & Race Condition Verification Tests', () => {
    let users = [];
    let addresses = [];

    beforeEach(async () => {
        users = [];
        addresses = [];

        // Create 25 distinct authenticated users and delivery addresses
        for (let i = 0; i < 25; i++) {
            const email = `concurrent_user_${i}@example.com`;
            const regRes = await request(app).post('/api/user/register').send({
                name: `Concurrent User ${i}`,
                email,
                password: 'Password123!'
            });
            const cookie = regRes.headers['set-cookie'];
            const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
            const dbUser = userRes.rows[0];

            const addrRes = await query(
                `INSERT INTO addresses (user_id, first_name, last_name, email, street, city, state, zipcode, country, phone)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                [dbUser.id, `User${i}`, 'Test', email, `${i} Market St`, 'City', 'State', 10001, 'USA', `555-000${i}`]
            );

            users.push({ id: dbUser.id, cookie });
            addresses.push(addrRes.rows[0].id);
        }
    });

    it('Race Condition (Stock = 1): Exactly 1 succeeds and 1 fails between concurrent checkouts', async () => {
        // Create Product with stock = 1
        const prodRes = await query(
            `INSERT INTO products (name, description, price, offer_price, category, image, stock, in_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            ['Last Unit Item', JSON.stringify(['Only 1 left in stock']), 500, 450, 'Electronics', JSON.stringify(['https://example.com/item.jpg']), 1, true]
        );
        const hotProduct = prodRes.rows[0];

        // Fire 2 simultaneous checkout requests for the same single unit
        const [res1, res2] = await Promise.all([
            request(app)
                .post('/api/order/cod')
                .set('Cookie', users[0].cookie)
                .send({
                    address: addresses[0],
                    items: [{ product: hotProduct.id, quantity: 1 }]
                }),
            request(app)
                .post('/api/order/cod')
                .set('Cookie', users[1].cookie)
                .send({
                    address: addresses[1],
                    items: [{ product: hotProduct.id, quantity: 1 }]
                })
        ]);

        const responses = [res1, res2];
        const successful = responses.filter(r => r.status === 200 && r.body.success === true);
        const failed = responses.filter(r => r.status === 400 && r.body.success === false);

        expect(successful.length).toBe(1);
        expect(failed.length).toBe(1);
        expect(failed[0].body.message).toMatch(/out of stock|insufficient/i);

        // Verify database state: Stock must be exactly 0 (not -1), and exactly 1 order exists
        const finalProdRes = await query('SELECT stock FROM products WHERE id = $1', [hotProduct.id]);
        expect(parseInt(finalProdRes.rows[0].stock, 10)).toBe(0);

        const ordersRes = await query('SELECT * FROM orders');
        expect(ordersRes.rows.length).toBe(1);
    });

    it('High-Concurrency Test (Stock = 10): 25 concurrent checkout requests result in exactly 10 orders and 0 final stock', async () => {
        const prodRes = await query(
            `INSERT INTO products (name, description, price, offer_price, category, image, stock, in_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            ['Flash Sale Product', JSON.stringify(['Limited supply of 10 items']), 100, 90, 'Deals', JSON.stringify(['https://example.com/flash.jpg']), 10, true]
        );
        const limitedProduct = prodRes.rows[0];

        // Fire 25 simultaneous checkout requests
        const requests = users.map((user, idx) =>
            request(app)
                .post('/api/order/cod')
                .set('Cookie', user.cookie)
                .send({
                    address: addresses[idx],
                    items: [{ product: limitedProduct.id, quantity: 1 }]
                })
        );

        const results = await Promise.all(requests);

        const successful = results.filter(r => r.status === 200 && r.body.success === true);
        const rejected = results.filter(r => r.status === 400 && r.body.success === false);

        expect(successful.length).toBe(10);
        expect(rejected.length).toBe(15);

        // Critical invariant: successful orders + final stock === initial stock (10 + 0 = 10)
        const finalProdRes = await query('SELECT stock FROM products WHERE id = $1', [limitedProduct.id]);
        expect(parseInt(finalProdRes.rows[0].stock, 10)).toBe(0);
        expect(parseInt(finalProdRes.rows[0].stock, 10)).toBeGreaterThanOrEqual(0); // Invariant: No negative stock

        const ordersRes = await query('SELECT * FROM orders');
        expect(ordersRes.rows.length).toBe(10);
    });
});
