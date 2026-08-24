import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { query } from '../configs/db.js';

describe('Product API Integration Tests', () => {
    let testProduct1, testProduct2;

    beforeEach(async () => {
        const p1Res = await query(
            `INSERT INTO products (name, description, price, offer_price, category, image, stock, in_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                'Fresh Apples',
                JSON.stringify(['Crispy red apples', 'Farm fresh']),
                150,
                120,
                'Fruits',
                JSON.stringify(['https://example.com/apple.jpg']),
                25,
                true
            ]
        );
        testProduct1 = p1Res.rows[0];

        const p2Res = await query(
            `INSERT INTO products (name, description, price, offer_price, category, image, stock, in_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                'Organic Milk',
                JSON.stringify(['1L pouch', 'Pure milk']),
                60,
                55,
                'Dairy',
                JSON.stringify(['https://example.com/milk.jpg']),
                40,
                true
            ]
        );
        testProduct2 = p2Res.rows[0];
    });

    describe('GET /api/product/list', () => {
        it('should retrieve all products', async () => {
            const res = await request(app).get('/api/product/list');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.products.length).toBe(2);
        });

        it('should support backward-compatible pagination with page and limit', async () => {
            const res = await request(app).get('/api/product/list?page=1&limit=1');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.products.length).toBe(1);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.totalCount).toBe(2);
            expect(res.body.pagination.totalPages).toBe(2);
        });
    });

    describe('GET /api/product/:id', () => {
        it('should retrieve product by valid ObjectId or UUID', async () => {
            const res = await request(app).get(`/api/product/${testProduct1.id}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.product.name).toBe('Fresh Apples');
            expect(res.body.product.stock).toBe(25);
        });

        it('should return 400 when product ID has an invalid format', async () => {
            const res = await request(app).get('/api/product/invalid-id-123');
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid product ID format');
        });

        it('should return 404 when product is not found in database', async () => {
            const nonExistentId = '66c5d9a0-f123-4567-89ab-c99999999999';
            const res = await request(app).get(`/api/product/${nonExistentId}`);
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Product not found');
        });
    });
});
