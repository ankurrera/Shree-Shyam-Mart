import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { query } from '../configs/db.js';

describe('Authentication & Authorization Integration Tests', () => {
    const validUser = {
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'Password123!'
    };

    describe('POST /api/user/register', () => {
        it('should successfully register a new user and set HTTP-only cookie', async () => {
            const res = await request(app)
                .post('/api/user/register')
                .send(validUser);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe(validUser.email.toLowerCase());
            expect(res.body.user.name).toBe(validUser.name);

            // Verify password was hashed in database
            const dbUserRes = await query('SELECT * FROM users WHERE email = $1', [validUser.email.toLowerCase()]);
            expect(dbUserRes.rows.length).toBe(1);
            const dbUser = dbUserRes.rows[0];
            expect(dbUser.password).not.toBe(validUser.password);
            expect(dbUser.password.startsWith('$2')).toBe(true);

            // Verify cookie headers
            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toContain('token=');
            expect(cookies[0].toLowerCase()).toContain('httponly');
        });

        it('should reject registration when email is already registered', async () => {
            await request(app).post('/api/user/register').send(validUser);

            const duplicateRes = await request(app)
                .post('/api/user/register')
                .send(validUser);

            expect(duplicateRes.status).toBe(400);
            expect(duplicateRes.body.success).toBe(false);
            expect(duplicateRes.body.message).toContain('already exists');
        });

        it('should reject registration with missing required fields', async () => {
            const res = await request(app)
                .post('/api/user/register')
                .send({ name: 'Incomplete' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/user/login', () => {
        it('should log in existing user with correct credentials and issue cookie', async () => {
            await request(app).post('/api/user/register').send(validUser);

            const res = await request(app)
                .post('/api/user/login')
                .send({
                    email: validUser.email,
                    password: validUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should reject login with incorrect password', async () => {
            await request(app).post('/api/user/register').send(validUser);

            const res = await request(app)
                .post('/api/user/login')
                .send({
                    email: validUser.email,
                    password: 'WrongPassword123'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid email or password');
        });

        it('should reject login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/user/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'AnyPassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Customer Authentication Middleware (authUser)', () => {
        it('should allow access with valid authentication cookie', async () => {
            const registerRes = await request(app).post('/api/user/register').send(validUser);
            const cookie = registerRes.headers['set-cookie'];

            const authRes = await request(app)
                .get('/api/user/is-auth')
                .set('Cookie', cookie);

            expect(authRes.status).toBe(200);
            expect(authRes.body.success).toBe(true);
            expect(authRes.body.user.email).toBe(validUser.email.toLowerCase());
        });

        it('should reject access when no cookie is provided', async () => {
            const res = await request(app).get('/api/user/is-auth');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should reject access when an invalid/tampered cookie is provided', async () => {
            const res = await request(app)
                .get('/api/user/is-auth')
                .set('Cookie', ['token=forged.invalid.jwt.token; Path=/; HttpOnly']);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Seller Authentication (authSeller)', () => {
        it('should authenticate seller with valid environment credentials', async () => {
            const res = await request(app)
                .post('/api/seller/login')
                .send({
                    email: process.env.SELLER_EMAIL,
                    password: process.env.SELLER_PASSWORD
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'][0]).toContain('sellerToken=');
        });

        it('should reject seller login with incorrect password', async () => {
            const res = await request(app)
                .post('/api/seller/login')
                .send({
                    email: process.env.SELLER_EMAIL,
                    password: 'WrongSellerPassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should allow seller access on /api/seller/is-auth with seller cookie', async () => {
            const loginRes = await request(app)
                .post('/api/seller/login')
                .send({
                    email: process.env.SELLER_EMAIL,
                    password: process.env.SELLER_PASSWORD
                });

            const sellerCookie = loginRes.headers['set-cookie'];

            const authRes = await request(app)
                .get('/api/seller/is-auth')
                .set('Cookie', sellerCookie);

            expect(authRes.status).toBe(200);
            expect(authRes.body.success).toBe(true);
        });

        it('should reject customer token attempting to access seller protected endpoints (RBAC)', async () => {
            const registerRes = await request(app).post('/api/user/register').send(validUser);
            const customerCookie = registerRes.headers['set-cookie'];

            // Customer cookie attempting to access seller endpoint
            const res = await request(app)
                .get('/api/seller/is-auth')
                .set('Cookie', customerCookie);

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Logout Behaviors', () => {
        it('should clear seller token on logout', async () => {
            const res = await request(app).get('/api/seller/logout');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const cookie = res.headers['set-cookie'][0];
            expect(cookie).toMatch(/sellerToken=;.*Expires=/i);
        });

        it('should clear user token on logout', async () => {
            const res = await request(app).get('/api/user/logout');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const cookie = res.headers['set-cookie'][0];
            expect(cookie).toMatch(/token=;.*Expires=/i);
        });
    });
});
