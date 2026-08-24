import { query, transaction } from "../configs/db.js";
import notificationService from "../services/notificationService.js";

const formatOrder = (row) => {
    if (!row) return null;
    let items = [];
    try {
        items = typeof row.items === 'string' ? JSON.parse(row.items || '[]') : (row.items || []);
    } catch {
        items = [];
    }

    let address = null;
    try {
        address = typeof row.address_snapshot === 'string' ? JSON.parse(row.address_snapshot || '{}') : (row.address_snapshot || {});
    } catch {
        address = {};
    }

    let paymentDetails = {};
    try {
        paymentDetails = typeof row.payment_details === 'string' ? JSON.parse(row.payment_details || '{}') : (row.payment_details || {});
    } catch {
        paymentDetails = {};
    }

    return {
        _id: row.id,
        id: row.id,
        userId: row.user_id,
        address,
        items,
        amount: parseFloat(row.amount),
        status: row.status,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        paymentType: row.payment_type,
        isPaid: Boolean(row.is_paid),
        paymentDetails,
        stockRestored: Boolean(row.stock_restored),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
};

// place order cod: /api/order/cod
export const placeOrderCOD = async (req, res) => {
    try {
        const userId = req.userId;
        const { items, address } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Not Authorized" });
        }

        if (!address || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid order data" });
        }

        // Run full transactional checkout in PostgreSQL
        const newOrder = await transaction(async (client) => {
            // 1. Verify shipping address belongs to user
            const addrRes = await client.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [address, userId]);
            if (addrRes.rows.length === 0) {
                const err = new Error("Selected delivery address is invalid");
                err.status = 400;
                throw err;
            }
            const validAddress = addrRes.rows[0];

            // 2. Validate items structure and aggregate quantities by product ID
            const productQuantities = new Map();
            for (const item of items) {
                const isProdIdValid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(item.product) ||
                                      /^[0-9a-fA-F]{24}$/.test(item.product);
                if (!item.product || typeof item.product !== 'string' || !isProdIdValid) {
                    const err = new Error("Invalid product ID in order");
                    err.status = 400;
                    throw err;
                }
                const qty = Number(item.quantity);
                if (!Number.isInteger(qty) || qty <= 0 || qty > 100) {
                    const err = new Error("Invalid product quantity");
                    err.status = 400;
                    throw err;
                }
                productQuantities.set(
                    item.product,
                    (productQuantities.get(item.product) || 0) + qty
                );
            }

            const productIds = Array.from(productQuantities.keys());
            const placeholders = productIds.map((_, i) => `$${i + 1}`).join(', ');

            // 3. Fetch products
            const prodRes = await client.query(
                `SELECT * FROM products WHERE id IN (${placeholders})`,
                productIds
            );

            if (prodRes.rows.length !== productIds.length) {
                const err = new Error("One or more products in your cart are no longer available");
                err.status = 400;
                throw err;
            }

            // 4. PRE-VALIDATE ALL PRODUCTS BEFORE PERFORMING ANY STOCK DECREMENTS
            let subtotal = 0;
            const validatedItems = [];

            for (const product of prodRes.rows) {
                const quantity = productQuantities.get(product.id);
                const currentStock = parseInt(product.stock, 10);
                const inStock = Boolean(product.in_stock);

                if (!inStock || currentStock < quantity) {
                    const err = new Error(`Product "${product.name}" is currently out of stock or has insufficient quantity`);
                    err.status = 400;
                    throw err;
                }

                const price = parseFloat(product.price);
                const offerPrice = parseFloat(product.offer_price);
                const itemPrice = offerPrice >= 0 && offerPrice < price ? offerPrice : price;

                subtotal += itemPrice * quantity;

                let images = [];
                try {
                    images = typeof product.image === 'string' ? JSON.parse(product.image) : (product.image || []);
                } catch {
                    images = [];
                }

                validatedItems.push({
                    product: product.id,
                    name: product.name,
                    price: itemPrice,
                    image: Array.isArray(images) && images.length > 0 ? images[0] : "",
                    quantity,
                    currentStock
                });
            }

            // 5. ATOMICALLY DECREMENT STOCK (WITH ROW-LEVEL CONDITIONAL GUARD FOR CONCURRENCY)
            for (const item of validatedItems) {
                const updateRes = await client.query(
                    'UPDATE products SET stock = stock - CAST($1 AS INTEGER), updated_at = NOW() WHERE id = $2 AND stock >= CAST($1 AS INTEGER) RETURNING stock',
                    [item.quantity, item.product]
                );

                if (updateRes.rows.length === 0) {
                    const err = new Error(`Product "${item.name}" is currently out of stock or has insufficient quantity`);
                    err.status = 400;
                    throw err;
                }

                const remainingStock = parseInt(updateRes.rows[0].stock, 10);
                if (remainingStock <= 0) {
                    await client.query('UPDATE products SET in_stock = false WHERE id = $1', [item.product]);
                }
            }

            // 6. Calculate tax charge (2%)
            const tax = Math.floor(subtotal * 0.02);
            const totalAmount = subtotal + tax;

            // 7. Insert Order into PostgreSQL
            const orderRes = await client.query(
                `INSERT INTO orders (
                    user_id, address_id, address_snapshot, items, amount,
                    status, payment_method, payment_status, payment_type, is_paid,
                    payment_details, stock_restored
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    'Order placed', 'COD', 'Pending', 'COD', false,
                    $6, false
                ) RETURNING *`,
                [
                    userId,
                    address,
                    JSON.stringify({
                        _id: validAddress.id,
                        id: validAddress.id,
                        firstName: validAddress.first_name,
                        lastName: validAddress.last_name,
                        email: validAddress.email,
                        street: validAddress.street,
                        city: validAddress.city,
                        state: validAddress.state,
                        zipcode: validAddress.zipcode,
                        country: validAddress.country,
                        phone: validAddress.phone
                    }),
                    JSON.stringify(validatedItems),
                    totalAmount,
                    JSON.stringify({ provider: 'COD', reference: '' })
                ]
            );

            const insertedOrder = orderRes.rows[0];

            // 8. Insert Order Items
            for (const item of validatedItems) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, name, price, image, quantity)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [insertedOrder.id, item.product, item.name, item.price, item.image, item.quantity]
                );
            }

            return insertedOrder;
        });

        // Trigger notification asynchronously (non-blocking)
        notificationService.sendOrderPlaced(newOrder).catch((err) => {
            console.error('[NOTIFICATION ASYNC ERR]', err.message);
        });

        return res.json({ success: true, message: "Order Placed Successfully", orderId: newOrder.id });
    } catch (error) {
        if (error.status === 400) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Order creation error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to place order. Please try again." });
    }
};

// get orders by user ID : /api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Not Authorized" });
        }

        const ordersRes = await query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        const orders = ordersRes.rows.map(formatOrder);
        res.json({ success: true, orders });
    } catch (error) {
        console.error("Fetch user orders error:", error.message);
        res.status(500).json({ success: false, message: "Unable to retrieve orders" });
    }
};

// get all orders (for seller/admin): /api/order/seller
export const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10);
        const limit = parseInt(req.query.limit, 10);
        const statusFilter = req.query.status && req.query.status !== 'all' ? req.query.status : null;
        const searchQuery = req.query.search ? String(req.query.search).trim() : null;

        let baseQuery = 'SELECT * FROM orders';
        let countQuery = 'SELECT COUNT(*) FROM orders';
        let whereClauses = [];
        let queryParams = [];

        if (statusFilter) {
            queryParams.push(statusFilter);
            whereClauses.push(`status = $${queryParams.length}`);
        }

        if (searchQuery) {
            queryParams.push(`%${searchQuery}%`);
            const searchIdx = queryParams.length;
            whereClauses.push(`(
                id::text ILIKE $${searchIdx} OR
                address_snapshot->>'firstName' ILIKE $${searchIdx} OR
                address_snapshot->>'lastName' ILIKE $${searchIdx} OR
                address_snapshot->>'phone' ILIKE $${searchIdx}
            )`);
        }

        if (whereClauses.length > 0) {
            const whereSql = ' WHERE ' + whereClauses.join(' AND ');
            baseQuery += whereSql;
            countQuery += whereSql;
        }

        // Calculate COD Summary metrics across all orders
        const allOrdersRes = await query('SELECT amount, status, payment_status FROM orders');
        let totalOrders = allOrdersRes.rows.length;
        let deliveredOrders = 0;
        let cancelledOrders = 0;
        let codCollected = 0;
        let codExpected = 0;

        for (const row of allOrdersRes.rows) {
            const amt = parseFloat(row.amount || 0);
            if (row.status === 'Delivered') {
                deliveredOrders++;
                codCollected += amt;
            } else if (row.status === 'Cancelled') {
                cancelledOrders++;
            } else {
                codExpected += amt;
            }
        }

        const codSummary = {
            totalOrders,
            deliveredOrders,
            cancelledOrders,
            codCollected: Math.round(codCollected * 100) / 100,
            codExpected: Math.round(codExpected * 100) / 100
        };

        baseQuery += ` ORDER BY created_at DESC`;

        if (Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0) {
            const countRes = await query(countQuery, queryParams);
            const totalCount = parseInt(countRes.rows[0].count, 10);
            const totalPages = Math.ceil(totalCount / limit);
            const offset = (page - 1) * limit;

            const paginationParams = [...queryParams, limit, offset];
            const limitOffsetSql = ` LIMIT $${paginationParams.length - 1} OFFSET $${paginationParams.length}`;
            const ordersRes = await query(baseQuery + limitOffsetSql, paginationParams);

            const orders = ordersRes.rows.map(formatOrder);
            return res.json({
                success: true,
                orders,
                codSummary,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages
                }
            });
        }

        const ordersRes = await query(baseQuery, queryParams);
        const orders = ordersRes.rows.map(formatOrder);
        res.json({ success: true, orders, codSummary });
    } catch (error) {
        console.error("Fetch all orders error:", error.message);
        res.status(500).json({ success: false, message: "Unable to retrieve seller orders" });
    }
};

// update order status (for seller/admin): /api/order/status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;

        if (!orderId || !status || typeof status !== 'string') {
            return res.status(400).json({ success: false, message: "Order ID and target status are required" });
        }

        const isIdValid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(orderId) ||
                          /^[0-9a-fA-F]{24}$/.test(orderId);

        if (!isIdValid) {
            return res.status(400).json({ success: false, message: "Invalid order ID format" });
        }

        const validStatuses = ['Order placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const updatedOrder = await transaction(async (client) => {
            const orderRes = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
            if (orderRes.rows.length === 0) {
                const err = new Error("Order not found");
                err.status = 404;
                throw err;
            }

            const order = orderRes.rows[0];

            // State Machine Transition Rules
            const allowedTransitions = {
                'Order placed': ['Confirmed', 'Cancelled'],
                'Confirmed': ['Dispatched', 'Cancelled'],
                'Dispatched': ['Delivered', 'Cancelled'],
                'Delivered': [], // Terminal
                'Cancelled': []  // Terminal
            };

            if (order.status === status) {
                return order;
            }

            const validNextSteps = allowedTransitions[order.status] || [];
            if (!validNextSteps.includes(status)) {
                const err = new Error(`Invalid status transition from "${order.status}" to "${status}". Allowed: [${validNextSteps.join(', ')}]`);
                err.status = 400;
                throw err;
            }

            let newStockRestored = Boolean(order.stock_restored);
            let newPaymentStatus = order.payment_status;
            let newIsPaid = Boolean(order.is_paid);
            let newPaymentDetails = typeof order.payment_details === 'string' ? JSON.parse(order.payment_details || '{}') : (order.payment_details || {});

            // 1. Handle Stock Restoration on Order Cancellation (Idempotent)
            if (status === 'Cancelled' && !newStockRestored) {
                const items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
                for (const item of items) {
                    if (item.product) {
                        await client.query(
                            'UPDATE products SET stock = stock + $1, in_stock = true, updated_at = NOW() WHERE id = $2',
                            [item.quantity, item.product]
                        );
                    }
                }
                newStockRestored = true;
                if (newPaymentStatus === 'Paid') {
                    newPaymentStatus = 'Refunded';
                }
            }

            // 2. Handle COD Payment State on Delivery
            if (status === 'Delivered' && order.payment_method === 'COD') {
                newPaymentStatus = 'Paid';
                newIsPaid = true;
                newPaymentDetails = {
                    provider: 'COD',
                    reference: `CASH-${order.id}`,
                    paidAt: new Date().toISOString()
                };
            }

            const updateRes = await client.query(
                `UPDATE orders SET
                    status = $1,
                    stock_restored = $2,
                    payment_status = $3,
                    is_paid = $4,
                    payment_details = $5,
                    updated_at = NOW()
                 WHERE id = $6
                 RETURNING *`,
                [status, newStockRestored, newPaymentStatus, newIsPaid, JSON.stringify(newPaymentDetails), orderId]
            );

            return updateRes.rows[0];
        });

        // Trigger notification event asynchronously
        const addr = typeof updatedOrder.address_snapshot === 'string' ? JSON.parse(updatedOrder.address_snapshot || '{}') : (updatedOrder.address_snapshot || {});
        const phone = addr.phone || '';
        if (status === 'Confirmed') notificationService.sendOrderConfirmed(updatedOrder, phone).catch(() => {});
        else if (status === 'Dispatched') notificationService.sendOrderDispatched(updatedOrder, phone).catch(() => {});
        else if (status === 'Delivered') notificationService.sendOrderDelivered(updatedOrder, phone).catch(() => {});
        else if (status === 'Cancelled') notificationService.sendOrderCancelled(updatedOrder, phone).catch(() => {});

        res.json({ success: true, message: "Order status updated successfully", order: formatOrder(updatedOrder) });
    } catch (error) {
        if (error.status === 400 || error.status === 404) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        console.error("Update order status error:", error.message);
        res.status(500).json({ success: false, message: "Unable to update order status" });
    }
};

// reorder available items from historical order: POST /api/order/:orderId/reorder
export const reorderItems = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID parameter is required" });
        }

        const isIdValid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(orderId) ||
                          /^[0-9a-fA-F]{24}$/.test(orderId);

        if (!isIdValid) {
            return res.status(400).json({ success: false, message: "Invalid order ID format" });
        }

        // Verify order ownership (IDOR guard)
        const orderRes = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);
        if (orderRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found or access unauthorized" });
        }

        const order = orderRes.rows[0];
        const historicalItems = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);

        if (!Array.isArray(historicalItems) || historicalItems.length === 0) {
            return res.status(400).json({ success: false, message: "Historical order contains no items to reorder" });
        }

        const reorderedItems = [];
        const unavailableItems = [];

        // Query current user cart
        const userRes = await query('SELECT cart_items FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const rawCart = typeof userRes.rows[0].cart_items === 'string' ? JSON.parse(userRes.rows[0].cart_items || '{}') : (userRes.rows[0].cart_items || {});
        const currentCart = Object.assign(Object.create(null), rawCart);

        for (const item of historicalItems) {
            const productId = item.product || item.product_id;
            if (!productId) {
                unavailableItems.push({ name: item.name || 'Unknown Item', reason: 'Product no longer available' });
                continue;
            }

            const prodRes = await query('SELECT id, name, price, offer_price, stock, in_stock FROM products WHERE id = $1', [productId]);
            if (prodRes.rows.length === 0) {
                unavailableItems.push({ name: item.name || 'Product', reason: 'Product no longer sold' });
                continue;
            }

            const product = prodRes.rows[0];
            const currentStock = parseInt(product.stock, 10);
            const inStock = Boolean(product.in_stock);

            if (!inStock || currentStock <= 0) {
                unavailableItems.push({ name: product.name, reason: 'Currently out of stock' });
                continue;
            }

            const requestedQty = parseInt(item.quantity, 10) || 1;
            const existingQtyInCart = currentCart[product.id] || 0;
            const addableQty = Math.min(requestedQty, currentStock - existingQtyInCart);

            if (addableQty <= 0) {
                unavailableItems.push({ name: product.name, reason: 'Max available stock already in cart' });
                continue;
            }

            const price = parseFloat(product.price);
            const offerPrice = parseFloat(product.offer_price);
            const currentPrice = offerPrice >= 0 && offerPrice < price ? offerPrice : price;

            currentCart[product.id] = existingQtyInCart + addableQty;

            reorderedItems.push({
                product: product.id,
                name: product.name,
                currentPrice,
                addedQuantity: addableQty
            });
        }

        // Save updated cart to database
        await query(
            'UPDATE users SET cart_items = $1, updated_at = NOW() WHERE id = $2',
            [JSON.stringify(currentCart), userId]
        );

        return res.json({
            success: true,
            message: reorderedItems.length > 0 ? "Reorder processed and cart updated" : "None of the historical items are currently available for reorder",
            reorderedCount: reorderedItems.length,
            unavailableCount: unavailableItems.length,
            reorderedItems,
            unavailableItems,
            cartItems: currentCart
        });
    } catch (error) {
        console.error("Reorder error:", error.message);
        res.status(500).json({ success: false, message: "Unable to process reorder" });
    }
};

// operational retry endpoint for seller: POST /api/order/notifications/retry
export const retryNotifications = async (req, res) => {
    try {
        const result = await notificationService.retryFailedEvents(3);
        return res.json({
            success: true,
            message: "Notification retry execution completed",
            retriedCount: result.retriedCount || 0
        });
    } catch (error) {
        console.error("Retry notifications error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to process notification retries" });
    }
};