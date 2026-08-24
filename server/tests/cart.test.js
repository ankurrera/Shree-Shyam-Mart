import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { query } from '../configs/db.js';

describe('Cart Authorization & IDOR Security Tests', () => {
    let userACookie, userBCookie;
    let userAId, userBId;

    const setupUsers = async () => {
        // Register User A
        const resA = await request(app).post('/api/user/register').send({
            name: 'User A',
            email: 'usera@example.com',
            password: 'PasswordA123!'
        });
        userACookie = resA.headers['set-cookie'];
        const userARes = await query('SELECT * FROM users WHERE email = $1', ['usera@example.com']);
        userAId = userARes.rows[0].id;

        // Register User B
        const resB = await request(app).post('/api/user/register').send({
            name: 'User B',
            email: 'userb@example.com',
            password: 'PasswordB123!'
        });
        userBCookie = resB.headers['set-cookie'];
        const userBRes = await query('SELECT * FROM users WHERE email = $1', ['userb@example.com']);
        userBId = userBRes.rows[0].id;
    };

    it('should reject unauthenticated cart updates', async () => {
        const res = await request(app)
            .post('/api/cart/update')
            .send({ cartData: { '66c5d9a0f123456789abcdef': 2 } });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should prevent IDOR: User A submitting User B userId does NOT modify User B cart', async () => {
        await setupUsers();

        // Set User B cart initially to contain 5 items of product X
        const prodX = '66c5d9a0f123456789abc001';
        await query('UPDATE users SET cart_items = $1 WHERE id = $2', [JSON.stringify({ [prodX]: 5 }), userBId]);

        // User A attempts to overwrite User B's cart by injecting userId in req.body
        const res = await request(app)
            .post('/api/cart/update')
            .set('Cookie', userACookie)
            .send({
                userId: userBId, // Malicious IDOR injection attempt
                cartData: { [prodX]: 10 }
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify User B cart was completely protected and remained unchanged (5)
        const updatedUserBRes = await query('SELECT cart_items FROM users WHERE id = $1', [userBId]);
        const updatedUserB = updatedUserBRes.rows[0];
        const bCart = typeof updatedUserB.cart_items === 'string' ? JSON.parse(updatedUserB.cart_items) : updatedUserB.cart_items;
        expect(bCart[prodX]).toBe(5);

        // Verify User A's own cart was updated instead
        const updatedUserARes = await query('SELECT cart_items FROM users WHERE id = $1', [userAId]);
        const updatedUserA = updatedUserARes.rows[0];
        const aCart = typeof updatedUserA.cart_items === 'string' ? JSON.parse(updatedUserA.cart_items) : updatedUserA.cart_items;
        expect(aCart[prodX]).toBe(10);
    });

    it('should sanitize non-numeric or negative cart quantities', async () => {
        await setupUsers();

        const prodY = '66c5d9a0f123456789abc002';
        const res = await request(app)
            .post('/api/cart/update')
            .set('Cookie', userACookie)
            .send({
                cartData: {
                    [prodY]: -5, // Negative quantity should be dropped
                    '66c5d9a0f123456789abc003': 'invalid_string', // Non-numeric should be dropped
                    '66c5d9a0f123456789abc004': 3 // Valid quantity
                }
            });

        expect(res.status).toBe(200);
        const userARes = await query('SELECT cart_items FROM users WHERE id = $1', [userAId]);
        const aCart = typeof userARes.rows[0].cart_items === 'string' ? JSON.parse(userARes.rows[0].cart_items) : userARes.rows[0].cart_items;
        expect(aCart[prodY]).toBeUndefined();
        expect(aCart['66c5d9a0f123456789abc003']).toBeUndefined();
        expect(aCart['66c5d9a0f123456789abc004']).toBe(3);
    });

    it('should ignore prototype pollution payload keys in cartData', async () => {
        await setupUsers();

        const res = await request(app)
            .post('/api/cart/update')
            .set('Cookie', userACookie)
            .send({
                cartData: {
                    '__proto__': { 'isAdmin': true },
                    'constructor': { 'prototype': { 'polluted': true } },
                    '66c5d9a0f123456789abc005': 2
                }
            });

        expect(res.status).toBe(200);
        const userARes = await query('SELECT cart_items FROM users WHERE id = $1', [userAId]);
        const rawCart = typeof userARes.rows[0].cart_items === 'string' ? JSON.parse(userARes.rows[0].cart_items) : userARes.rows[0].cart_items;
        const aCart = Object.assign(Object.create(null), rawCart);
        expect(aCart['__proto__']).toBeUndefined();
        expect(aCart['constructor']).toBeUndefined();
        expect(aCart['66c5d9a0f123456789abc005']).toBe(2);
    });
});
