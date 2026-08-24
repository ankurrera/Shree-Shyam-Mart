import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../configs/db.js';

// login seller : /api/seller/login
export const sellerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const envSellerEmail = process.env.SELLER_EMAIL ? process.env.SELLER_EMAIL.trim().toLowerCase() : '';
        const envSellerPassword = process.env.SELLER_PASSWORD;

        let user = null;

        // 1. Check if login matches environment credentials (SELLER_EMAIL & SELLER_PASSWORD)
        if (envSellerEmail && normalizedEmail === envSellerEmail && password === envSellerPassword) {
            const userRes = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
            const hashedPassword = await bcrypt.hash(password, 10);

            if (userRes.rows.length === 0) {
                // Auto-seed seller account into Supabase PostgreSQL users table
                const insertRes = await query(
                    'INSERT INTO users (name, email, password, role, cart_items) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    ['Seller Admin', normalizedEmail, hashedPassword, 'seller', JSON.stringify({})]
                );
                user = insertRes.rows[0];
            } else {
                user = userRes.rows[0];
                // Ensure user role is seller or admin
                if (user.role !== 'seller' && user.role !== 'admin') {
                    await query("UPDATE users SET role = 'seller', updated_at = NOW() WHERE id = $1", [user.id]);
                    user.role = 'seller';
                }
            }
        } else {
            // 2. Query Supabase PostgreSQL users table for seller account
            const userRes = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
            if (userRes.rows.length === 0) {
                return res.status(401).json({ success: false, message: "Invalid Credentials" });
            }

            user = userRes.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Invalid Credentials" });
            }

            if (user.role !== 'seller' && user.role !== 'admin') {
                return res.status(403).json({ success: false, message: "Access Denied: Account is not authorized as a seller" });
            }
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('sellerToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            message: "Logged In",
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("Seller login error:", error.message);
        res.status(500).json({ success: false, message: "Unable to process seller login" });
    }
};

// check isauth : /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
    try {
        const user = req.user || {};
        return res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'seller'
            }
        });
    } catch (error) {
        console.error("Seller isAuth error:", error.message);
        res.status(500).json({ success: false, message: "Seller authentication check failed" });
    }
};

// logout seller : /api/seller/logout
export const sellerLogout = async (req, res) => {
    try {
        res.clearCookie('sellerToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        return res.json({ success: true, message: "Logged Out" });
    } catch (error) {
        console.error("Seller logout error:", error.message);
        res.status(500).json({ success: false, message: "Seller logout failed" });
    }
};


