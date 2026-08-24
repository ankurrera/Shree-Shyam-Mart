import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../configs/db.js';

// register user: /api/user/register
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        
        // 1. Check for existing user with identical email
        const existingUserRes = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
        if (existingUserRes.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists' });
        }

        // 2. Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insert user into PostgreSQL
        const insertRes = await query(
            'INSERT INTO users (name, email, password, cart_items) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
            [name.trim(), normalizedEmail, hashedPassword, JSON.stringify({})]
        );

        const newUser = insertRes.rows[0];
        const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({ success: true, user: { email: newUser.email, name: newUser.name } });
    } catch (error) {
        console.error("Register error:", error.message);
        res.status(500).json({ success: false, message: "Unable to complete registration. Please try again." });
    }
};

// login user: /api/user/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const userRes = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

        if (userRes.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({ success: true, user: { email: user.email, name: user.name } });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ success: false, message: "Unable to process login. Please try again." });
    }
};

// check auth: /api/user/is-auth
export const isAuth = async (req, res) => {
    try {
        const { userId } = req;
        const userRes = await query('SELECT id, name, email, cart_items, role, created_at FROM users WHERE id = $1', [userId]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = userRes.rows[0];
        const rawCart = typeof user.cart_items === 'string' ? JSON.parse(user.cart_items) : (user.cart_items || {});
        const cartItems = Object.assign(Object.create(null), rawCart);
        return res.json({
            success: true,
            user: {
                _id: user.id,
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                cartItems
            }
        });
    } catch (error) {
        console.error("IsAuth error:", error.message);
        res.status(500).json({ success: false, message: "Authentication verification failed" });
    }
};

// logout user: /api/user/logout
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        return res.json({ success: true, message: "Logged Out" });
    } catch (error) {
        console.error("Logout error:", error.message);
        res.status(500).json({ success: false, message: "Logout failed" });
    }
};