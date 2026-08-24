import { query } from '../configs/db.js';

// update user cart: /api/cart/update
export const updateCart = async (req, res) => {
    try {
        // Enforce user context from auth middleware to prevent IDOR vulnerabilities
        const userId = req.userId;
        const { cartData } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        if (!cartData || typeof cartData !== 'object' || Array.isArray(cartData)) {
            return res.status(400).json({ success: false, message: "Invalid cart data payload format" });
        }

        // Sanitize cart items: strip prototype keys and validate numeric positive quantities
        const sanitizedCart = Object.create(null);
        for (const [key, value] of Object.entries(cartData)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            const quantity = Number(value);
            if (Number.isInteger(quantity) && quantity > 0) {
                sanitizedCart[key] = quantity;
            }
        }

        const updateRes = await query(
            'UPDATE users SET cart_items = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
            [JSON.stringify(sanitizedCart), userId]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "Cart Updated" });
    } catch (error) {
        console.error("Cart update error:", error.message);
        res.status(500).json({ success: false, message: "Unable to update cart" });
    }
};