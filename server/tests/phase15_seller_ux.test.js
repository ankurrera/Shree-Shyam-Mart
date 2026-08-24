import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { query } from '../configs/db.js';

describe('Phase 15.1: Seller Dashboard Operational UX Tests', () => {

    let sellerCookie = '';
    let userCookie = '';
    let testProductId = '';

    beforeEach(async () => {
        // 1. Seller Login
        const sellerRes = await request(app)
            .post('/api/seller/login')
            .send({
                email: process.env.SELLER_EMAIL || 'admin@example.com',
                password: process.env.SELLER_PASSWORD || 'greatstack123'
            });
        sellerCookie = sellerRes.headers['set-cookie']?.[0] || '';

        // 2. Customer Registration & Login
        const userEmail = `cust_ux_${Date.now()}_${Math.random()}@example.com`;
        await request(app).post('/api/user/register').send({ name: 'Customer UX User', email: userEmail, password: 'password123' });
        const userRes = await request(app).post('/api/user/login').send({ email: userEmail, password: 'password123' });
        userCookie = userRes.headers['set-cookie']?.[0] || '';

        // 3. Insert Test Product
        const prodRes = await query(
            `INSERT INTO products (name, description, price, offer_price, category, image, stock, in_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            ['UX Test Item', JSON.stringify(['Test description']), 100, 90, 'Packaged Food', JSON.stringify(['https://example.com/test.webp']), 10, true]
        );
        testProductId = prodRes.rows[0].id;
    });

    describe('Inline Stock Update API (POST /api/product/update-stock)', () => {

        it('1. should allow authenticated seller to update stock quantity', async () => {
            const res = await request(app)
                .post('/api/product/update-stock')
                .set('Cookie', sellerCookie)
                .send({ productId: testProductId, stock: 15 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.product.stock).toBe(15);
            expect(res.body.product.inStock).toBe(true);
        });

        it('2. should reject customer attempt to update stock (401)', async () => {
            const res = await request(app)
                .post('/api/product/update-stock')
                .set('Cookie', userCookie)
                .send({ productId: testProductId, stock: 20 });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('3. should reject unauthenticated request to update stock (401)', async () => {
            const res = await request(app)
                .post('/api/product/update-stock')
                .send({ productId: testProductId, stock: 20 });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('4. should reject negative stock values (400)', async () => {
            const res = await request(app)
                .post('/api/product/update-stock')
                .set('Cookie', sellerCookie)
                .send({ productId: testProductId, stock: -5 });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('5. should reject decimal stock values (400)', async () => {
            const res = await request(app)
                .post('/api/product/update-stock')
                .set('Cookie', sellerCookie)
                .send({ productId: testProductId, stock: 4.5 });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('6. should reject invalid UUID formats (400)', async () => {
            const res = await request(app)
                .post('/api/product/update-stock')
                .set('Cookie', sellerCookie)
                .send({ productId: 'invalid-id-xyz', stock: 10 });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('7. should return 404 for unknown product ID', async () => {
            const res = await request(app)
                .post('/api/product/update-stock')
                .set('Cookie', sellerCookie)
                .send({ productId: '00000000-0000-0000-0000-000000000000', stock: 10 });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('8. should automatically set in_stock = false when stock = 0', async () => {
            const res = await request(app)
                .post('/api/product/update-stock')
                .set('Cookie', sellerCookie)
                .send({ productId: testProductId, stock: 0 });

            expect(res.status).toBe(200);
            expect(res.body.product.stock).toBe(0);
            expect(res.body.product.inStock).toBe(false);
        });

        it('9. should automatically set in_stock = true when stock > 0', async () => {
            const res = await request(app)
                .post('/api/product/update-stock')
                .set('Cookie', sellerCookie)
                .send({ productId: testProductId, stock: 3 });

            expect(res.status).toBe(200);
            expect(res.body.product.stock).toBe(3);
            expect(res.body.product.inStock).toBe(true);
        });
    });

    describe('Seller Order Search & Status Filter API (GET /api/order/seller)', () => {

        let createdOrderId = '';

        beforeEach(async () => {
            // Seed customer address via API
            const addrRes = await request(app)
                .post('/api/address/add')
                .set('Cookie', userCookie)
                .send({
                    address: {
                        firstName: 'UniqueNameSearch',
                        lastName: 'TestUser',
                        email: 'search@example.com',
                        street: '123 Search St',
                        city: 'Jaipur',
                        state: 'Rajasthan',
                        zipcode: '302001',
                        country: 'India',
                        phone: '9876543210'
                    }
                });

            expect(addrRes.status).toBe(200);
            const addrId = addrRes.body.address?._id || addrRes.body.address?.id;

            const orderRes = await request(app)
                .post('/api/order/cod')
                .set('Cookie', userCookie)
                .send({
                    address: addrId,
                    items: [{ product: testProductId, quantity: 1 }]
                });

            expect(orderRes.status).toBe(200);
            if (orderRes.body.order?._id || orderRes.body.order?.id) {
                createdOrderId = orderRes.body.order._id || orderRes.body.order.id;
            }
        });

        it('10. should filter seller orders by customer name', async () => {
            const res = await request(app)
                .get('/api/order/seller?search=UniqueNameSearch')
                .set('Cookie', sellerCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.orders.length).toBeGreaterThan(0);
            expect(res.body.orders[0].address.firstName).toBe('UniqueNameSearch');
        });

        it('11. should filter seller orders by phone number', async () => {
            const res = await request(app)
                .get('/api/order/seller?search=9876543210')
                .set('Cookie', sellerCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.orders.length).toBeGreaterThan(0);
            expect(res.body.orders[0].address.phone).toBe('9876543210');
        });

        it('12. should filter seller orders by full/partial order ID', async () => {
            if (!createdOrderId) return;
            const partialId = createdOrderId.substring(0, 8);
            const res = await request(app)
                .get(`/api/order/seller?search=${partialId}`)
                .set('Cookie', sellerCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.orders.length).toBeGreaterThan(0);
        });

        it('13. should work simultaneously with status filter and search query', async () => {
            const res = await request(app)
                .get('/api/order/seller?status=Order%20placed&search=9876543210')
                .set('Cookie', sellerCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.orders.length).toBeGreaterThan(0);
            expect(res.body.orders[0].status).toBe('Order placed');
        });
    });
});
