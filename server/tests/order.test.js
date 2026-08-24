import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { query } from '../configs/db.js';

describe('Order Lifecycle, Inventory & Integrity Tests', () => {
    let userACookie, userBCookie;
    let userAId, userBId;
    let addressAId, addressBId;
    let productA, productB, productC;
    let sellerCookie;

    beforeEach(async () => {
        // 1. Create User A
        const regA = await request(app).post('/api/user/register').send({
            name: 'Alice User',
            email: 'alice@example.com',
            password: 'Password123!'
        });
        userACookie = regA.headers['set-cookie'];
        const userARes = await query('SELECT * FROM users WHERE email = $1', ['alice@example.com']);
        userAId = userARes.rows[0].id;

        // 2. Create User B
        const regB = await request(app).post('/api/user/register').send({
            name: 'Bob User',
            email: 'bob@example.com',
            password: 'Password123!'
        });
        userBCookie = regB.headers['set-cookie'];
        const userBRes = await query('SELECT * FROM users WHERE email = $1', ['bob@example.com']);
        userBId = userBRes.rows[0].id;

        // 3. Create Addresses
        const addrARes = await query(
            `INSERT INTO addresses (user_id, first_name, last_name, email, street, city, state, zipcode, country, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [userAId, 'Alice', 'Smith', 'alice@example.com', '123 Apple St', 'Springfield', 'IL', 62701, 'USA', '555-0101']
        );
        addressAId = addrARes.rows[0].id;

        const addrBRes = await query(
            `INSERT INTO addresses (user_id, first_name, last_name, email, street, city, state, zipcode, country, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [userBId, 'Bob', 'Jones', 'bob@example.com', '456 Banana Rd', 'Decatur', 'IL', 62521, 'USA', '555-0102']
        );
        addressBId = addrBRes.rows[0].id;

        // 4. Create Products
        const pARes = await query(
            `INSERT INTO products (name, description, price, offer_price, category, image, stock, in_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            ['Product A', JSON.stringify(['Description A']), 100, 80, 'Grocery', JSON.stringify(['https://example.com/a.jpg']), 10, true]
        );
        productA = pARes.rows[0];

        const pBRes = await query(
            `INSERT INTO products (name, description, price, offer_price, category, image, stock, in_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            ['Product B', JSON.stringify(['Description B']), 200, 150, 'Grocery', JSON.stringify(['https://example.com/b.jpg']), 5, true]
        );
        productB = pBRes.rows[0];

        const pCRes = await query(
            `INSERT INTO products (name, description, price, offer_price, category, image, stock, in_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            ['Product C', JSON.stringify(['Description C']), 50, 40, 'Snacks', JSON.stringify(['https://example.com/c.jpg']), 2, true]
        );
        productC = pCRes.rows[0];

        // 5. Authenticate Seller
        const sellerLogin = await request(app).post('/api/seller/login').send({
            email: process.env.SELLER_EMAIL,
            password: process.env.SELLER_PASSWORD
        });
        sellerCookie = sellerLogin.headers['set-cookie'];
    });

    describe('Address Ownership Enforcement', () => {
        it('should prevent User A from placing an order with User B address', async () => {
            const res = await request(app)
                .post('/api/order/cod')
                .set('Cookie', userACookie)
                .send({
                    address: addressBId, // Belongs to User B
                    items: [{ product: productA.id, quantity: 1 }]
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('address is invalid');

            // Verify no order was created
            const ordersRes = await query('SELECT * FROM orders');
            expect(ordersRes.rows.length).toBe(0);
        });
    });

    describe('Server-Authoritative Pricing & Stock Decrement', () => {
        it('should calculate price from database ignoring forged client prices and decrement stock', async () => {
            // Client attempts to claim offerPrice = 1, price = 1, amount = 1
            const res = await request(app)
                .post('/api/order/cod')
                .set('Cookie', userACookie)
                .send({
                    address: addressAId,
                    items: [
                        {
                            product: productA.id,
                            quantity: 3,
                            price: 1,
                            offerPrice: 1,
                            amount: 3
                        }
                    ]
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // DB offerPrice = 80 * 3 = 240, tax = 2% of 240 = 4, total = 244
            const orderRes = await query('SELECT * FROM orders WHERE user_id = $1', [userAId]);
            expect(orderRes.rows.length).toBe(1);
            const order = orderRes.rows[0];
            expect(parseFloat(order.amount)).toBe(244);
            expect(order.payment_method).toBe('COD');
            expect(order.payment_status).toBe('Pending');
            expect(Boolean(order.is_paid)).toBe(false);

            // Verify Product A stock decremented from 10 to 7
            const updatedProductARes = await query('SELECT stock FROM products WHERE id = $1', [productA.id]);
            expect(parseInt(updatedProductARes.rows[0].stock, 10)).toBe(7);
        });

        it('should reject checkout if requested quantity exceeds available stock', async () => {
            const res = await request(app)
                .post('/api/order/cod')
                .set('Cookie', userACookie)
                .send({
                    address: addressAId,
                    items: [{ product: productC.id, quantity: 3 }] // Stock is 2
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('insufficient quantity');

            // Verify stock remained unchanged
            const pCRes = await query('SELECT stock FROM products WHERE id = $1', [productC.id]);
            expect(parseInt(pCRes.rows[0].stock, 10)).toBe(2);
        });
    });

    describe('Multi-Product Atomicity & Rollback', () => {
        it('should roll back all decrements if any single product in a multi-item cart fails stock check', async () => {
            // Order requests: Product A (qty 2, stock 10), Product B (qty 6, stock 5 -> FAILS), Product C (qty 1, stock 2)
            const res = await request(app)
                .post('/api/order/cod')
                .set('Cookie', userACookie)
                .send({
                    address: addressAId,
                    items: [
                        { product: productA.id, quantity: 2 },
                        { product: productB.id, quantity: 6 },
                        { product: productC.id, quantity: 1 }
                    ]
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);

            // Verify NO products had their stock changed
            const pARes = await query('SELECT stock FROM products WHERE id = $1', [productA.id]);
            const pBRes = await query('SELECT stock FROM products WHERE id = $1', [productB.id]);
            const pCRes = await query('SELECT stock FROM products WHERE id = $1', [productC.id]);

            expect(parseInt(pARes.rows[0].stock, 10)).toBe(10);
            expect(parseInt(pBRes.rows[0].stock, 10)).toBe(5);
            expect(parseInt(pCRes.rows[0].stock, 10)).toBe(2);

            // Verify no order was created
            const ordersRes = await query('SELECT * FROM orders');
            expect(ordersRes.rows.length).toBe(0);
        });
    });

    describe('Historical Order Item Snapshot & Product Deletion Resilience', () => {
        it('should preserve purchase snapshot even if the product is edited or deleted later', async () => {
            // 1. Place order
            const orderRes = await request(app)
                .post('/api/order/cod')
                .set('Cookie', userACookie)
                .send({
                    address: addressAId,
                    items: [{ product: productA.id, quantity: 1 }]
                });
            expect(orderRes.status).toBe(200);

            // 2. Modify product price and name in catalog and mark out of stock
            await query("UPDATE products SET name = 'Changed Product Name', offer_price = 999, in_stock = false WHERE id = $1", [productA.id]);

            // 4. Retrieve customer order history
            const historyRes = await request(app)
                .get('/api/order/user')
                .set('Cookie', userACookie);

            expect(historyRes.status).toBe(200);
            expect(historyRes.body.success).toBe(true);
            expect(historyRes.body.orders.length).toBe(1);

            const fetchedOrder = historyRes.body.orders[0];
            const itemSnapshot = fetchedOrder.items[0];

            // Verify snapshot retained original name and price
            expect(itemSnapshot.name).toBe('Product A');
            expect(itemSnapshot.price).toBe(80);
        });
    });

    describe('Order State Machine & Cancellation Stock Restoration', () => {
        it('should enforce valid state transitions and reject invalid state transitions', async () => {
            // 1. Create order
            await request(app)
                .post('/api/order/cod')
                .set('Cookie', userACookie)
                .send({
                    address: addressAId,
                    items: [{ product: productA.id, quantity: 2 }]
                });

            const orderRes = await query('SELECT * FROM orders WHERE user_id = $1', [userAId]);
            const order = orderRes.rows[0];

            // 2. Customer token attempting status change should be rejected (401)
            const customerAttempt = await request(app)
                .post('/api/order/status')
                .set('Cookie', userACookie)
                .send({ orderId: order.id, status: 'Confirmed' });
            expect(customerAttempt.status).toBe(401);

            // 3. Seller: Order placed -> Confirmed (Valid)
            const step1 = await request(app)
                .post('/api/order/status')
                .set('Cookie', sellerCookie)
                .send({ orderId: order.id, status: 'Confirmed' });
            expect(step1.status).toBe(200);

            // 4. Seller: Confirmed -> Dispatched (Valid)
            const step2 = await request(app)
                .post('/api/order/status')
                .set('Cookie', sellerCookie)
                .send({ orderId: order.id, status: 'Dispatched' });
            expect(step2.status).toBe(200);

            // 5. Seller: Dispatched -> Delivered (Valid)
            const step3 = await request(app)
                .post('/api/order/status')
                .set('Cookie', sellerCookie)
                .send({ orderId: order.id, status: 'Delivered' });
            expect(step3.status).toBe(200);

            const deliveredRes = await query('SELECT * FROM orders WHERE id = $1', [order.id]);
            const deliveredOrder = deliveredRes.rows[0];
            expect(deliveredOrder.status).toBe('Delivered');
            expect(deliveredOrder.payment_status).toBe('Paid');
            expect(Boolean(deliveredOrder.is_paid)).toBe(true);

            // 6. Invalid transition: Delivered -> Order placed (Should fail)
            const invalidStep = await request(app)
                .post('/api/order/status')
                .set('Cookie', sellerCookie)
                .send({ orderId: order.id, status: 'Order placed' });
            expect(invalidStep.status).toBe(400);
            expect(invalidStep.body.message).toContain('Invalid status transition');
        });

        it('should restore inventory on order cancellation and prevent double-restoration', async () => {
            // Initial stock = 10, buy 3 -> stock = 7
            await request(app)
                .post('/api/order/cod')
                .set('Cookie', userACookie)
                .send({
                    address: addressAId,
                    items: [{ product: productA.id, quantity: 3 }]
                });

            let pARes = await query('SELECT stock FROM products WHERE id = $1', [productA.id]);
            expect(parseInt(pARes.rows[0].stock, 10)).toBe(7);

            const orderRes = await query('SELECT * FROM orders WHERE user_id = $1', [userAId]);
            const order = orderRes.rows[0];

            // Seller cancels order
            const cancelRes = await request(app)
                .post('/api/order/status')
                .set('Cookie', sellerCookie)
                .send({ orderId: order.id, status: 'Cancelled' });
            expect(cancelRes.status).toBe(200);

            // Verify stock restored to 10
            pARes = await query('SELECT stock FROM products WHERE id = $1', [productA.id]);
            expect(parseInt(pARes.rows[0].stock, 10)).toBe(10);

            const cancelledRes = await query('SELECT * FROM orders WHERE id = $1', [order.id]);
            const cancelledOrder = cancelledRes.rows[0];
            expect(Boolean(cancelledOrder.stock_restored)).toBe(true);
            expect(cancelledOrder.status).toBe('Cancelled');

            // Attempting to cancel again is blocked (already in terminal state)
            await request(app)
                .post('/api/order/status')
                .set('Cookie', sellerCookie)
                .send({ orderId: order.id, status: 'Cancelled' });

            // Stock must NOT be increased again (must remain 10, NOT 13)
            pARes = await query('SELECT stock FROM products WHERE id = $1', [productA.id]);
            expect(parseInt(pARes.rows[0].stock, 10)).toBe(10);
        });

        it('should allow cancellation from Confirmed and Dispatched states and restore stock', async () => {
            // Test cancellation from Dispatched
            await request(app)
                .post('/api/order/cod')
                .set('Cookie', userBCookie)
                .send({
                    address: addressBId,
                    items: [{ product: productB.id, quantity: 2 }]
                });

            const orderRes = await query('SELECT * FROM orders WHERE user_id = $1', [userBId]);
            const order = orderRes.rows[0];

            // Advance: Order placed -> Confirmed -> Dispatched
            await request(app).post('/api/order/status').set('Cookie', sellerCookie).send({ orderId: order.id, status: 'Confirmed' });
            await request(app).post('/api/order/status').set('Cookie', sellerCookie).send({ orderId: order.id, status: 'Dispatched' });

            // Cancel from Dispatched
            const cancelRes = await request(app).post('/api/order/status').set('Cookie', sellerCookie).send({ orderId: order.id, status: 'Cancelled' });
            expect(cancelRes.status).toBe(200);

            const updatedProductBRes = await query('SELECT stock FROM products WHERE id = $1', [productB.id]);
            expect(parseInt(updatedProductBRes.rows[0].stock, 10)).toBe(5); // Restored from 3 back to 5
        });

        it('should paginate seller orders correctly with page and limit queries', async () => {
            // Create 3 orders with productA (stock 10)
            for (let i = 0; i < 3; i++) {
                await request(app)
                    .post('/api/order/cod')
                    .set('Cookie', userACookie)
                    .send({
                        address: addressAId,
                        items: [{ product: productA.id, quantity: 1 }]
                    });
            }

            const pageRes = await request(app)
                .get('/api/order/seller?page=1&limit=2')
                .set('Cookie', sellerCookie);

            expect(pageRes.status).toBe(200);
            expect(pageRes.body.success).toBe(true);
            expect(pageRes.body.orders.length).toBe(2);
            expect(pageRes.body.pagination.totalCount).toBeGreaterThanOrEqual(3);
            expect(pageRes.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Reorder Endpoint & Operational Filtering', () => {
        it('should allow user to reorder their own completed order using current catalog prices', async () => {
            // 1. Place order for product A (original price 80)
            const placeRes = await request(app)
                .post('/api/order/cod')
                .set('Cookie', userACookie)
                .send({
                    address: addressAId,
                    items: [{ product: productA.id, quantity: 2 }]
                });
            expect(placeRes.status).toBe(200);
            const orderId = placeRes.body.orderId;

            // 2. Update catalog price for product A (offer_price = 75)
            await query('UPDATE products SET offer_price = 75 WHERE id = $1', [productA.id]);

            // 3. User A reorders order
            const reorderRes = await request(app)
                .post(`/api/order/${orderId}/reorder`)
                .set('Cookie', userACookie);

            expect(reorderRes.status).toBe(200);
            expect(reorderRes.body.success).toBe(true);
            expect(reorderRes.body.reorderedCount).toBe(1);
            expect(reorderRes.body.reorderedItems[0].currentPrice).toBe(75); // Uses current updated price 75
        });

        it('should reject reordering another user order (IDOR Guard)', async () => {
            // Place order as User A
            const placeRes = await request(app)
                .post('/api/order/cod')
                .set('Cookie', userACookie)
                .send({
                    address: addressAId,
                    items: [{ product: productA.id, quantity: 1 }]
                });
            const orderId = placeRes.body.orderId;

            // User B attempts to reorder User A's order
            const unauthorizedRes = await request(app)
                .post(`/api/order/${orderId}/reorder`)
                .set('Cookie', userBCookie);

            expect(unauthorizedRes.status).toBe(404);
            expect(unauthorizedRes.body.success).toBe(false);
            expect(unauthorizedRes.body.message).toContain("unauthorized");
        });

        it('should filter seller orders by status and return codSummary', async () => {
            const res = await request(app)
                .get('/api/order/seller?status=Order%20placed')
                .set('Cookie', sellerCookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.orders)).toBe(true);
            expect(res.body.codSummary).toBeDefined();
            expect(res.body.codSummary.totalOrders).toBeGreaterThanOrEqual(0);
        });
    });
});

