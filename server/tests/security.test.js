import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import app from '../app.js';

describe('Security & Protection Integration Tests', () => {
    describe('CORS & Security Headers', () => {
        it('should emit Helmet security headers on responses', async () => {
            const res = await request(app).get('/');
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        });

        it('should allow requests matching allowed origin in development/production', async () => {
            const res = await request(app)
                .get('/')
                .set('Origin', 'http://localhost:5173');

            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
            expect(res.headers['access-control-allow-credentials']).toBe('true');
        });
    });

    describe('Rate Limiter Behavior', () => {
        it('should enforce HTTP 429 when rate limit threshold is exceeded', async () => {
            const testRateApp = express();
            const limiter = rateLimit({
                windowMs: 60 * 1000,
                max: 3,
                message: { success: false, message: 'Too many requests' }
            });
            testRateApp.use(limiter);
            testRateApp.get('/test-limit', (req, res) => res.json({ success: true }));

            // First 3 requests should pass
            for (let i = 0; i < 3; i++) {
                const res = await request(testRateApp).get('/test-limit');
                expect(res.status).toBe(200);
            }

            // 4th request must return HTTP 429
            const blockedRes = await request(testRateApp).get('/test-limit');
            expect(blockedRes.status).toBe(429);
            expect(blockedRes.body.success).toBe(false);
            expect(blockedRes.body.message).toContain('Too many requests');
        });
    });

    describe('Multer File Upload Filtering', () => {
        it('should reject non-image and SVG uploads in multipart requests', async () => {
            // Log in as seller
            const sellerLogin = await request(app).post('/api/seller/login').send({
                email: process.env.SELLER_EMAIL,
                password: process.env.SELLER_PASSWORD
            });
            const sellerCookie = sellerLogin.headers['set-cookie'];

            const fakeProductData = JSON.stringify({
                name: 'Bad Upload Product',
                description: ['Desc'],
                category: 'Grocery',
                price: 100,
                offerPrice: 90,
                stock: 10
            });

            // Attempt to upload SVG (which can contain embedded script tags)
            const res = await request(app)
                .post('/api/product/add')
                .set('Cookie', sellerCookie)
                .field('productData', fakeProductData)
                .attach('images', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'malicious.svg');

            // Must be rejected by server (either 400 or 500 error from Multer MIME filter)
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Health Check & Route Diagnostics', () => {
        it('should return 200 with healthy database status on GET /health', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.status).toBe('healthy');
            expect(res.body.database).toBe('connected');
            expect(res.body.timestamp).toBeDefined();
        });

        it('should return 404 JSON for undefined API endpoints', async () => {
            const res = await request(app).get('/api/non-existent-endpoint');
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('not found');
        });
    });
});
