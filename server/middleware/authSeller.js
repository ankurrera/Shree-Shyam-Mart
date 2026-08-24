import jwt from 'jsonwebtoken';
import { query } from '../configs/db.js';

const authSeller = async (req, res, next) => {
    const sellerToken = req.cookies.sellerToken || req.cookies.token;

    if (!sellerToken) {
        return res.status(401).json({ success: false, message: 'Not Authorized: Missing Seller Token' });
    }

    try {
        const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);
        
        let user = null;
        if (tokenDecode.id) {
            const userRes = await query('SELECT id, name, email, role FROM users WHERE id = $1', [tokenDecode.id]);
            if (userRes.rows.length > 0) {
                user = userRes.rows[0];
            }
        } else if (tokenDecode.email) {
            const userRes = await query('SELECT id, name, email, role FROM users WHERE email = $1', [tokenDecode.email]);
            if (userRes.rows.length > 0) {
                user = userRes.rows[0];
            }
        }

        const envSellerEmail = process.env.SELLER_EMAIL ? process.env.SELLER_EMAIL.trim().toLowerCase() : '';
        const tokenEmail = tokenDecode.email ? tokenDecode.email.trim().toLowerCase() : (user ? user.email.trim().toLowerCase() : '');

        if (user && (user.role === 'seller' || user.role === 'admin')) {
            req.userId = user.id;
            req.user = user;
            return next();
        } else if (envSellerEmail && tokenEmail === envSellerEmail) {
            req.userId = user ? user.id : null;
            req.user = user || { email: envSellerEmail, role: 'seller' };
            return next();
        } else {
            return res.status(401).json({ success: false, message: 'Not Authorized: Invalid Seller Credentials or Role' });
        }
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not Authorized: Token Expired or Invalid' });
    }
};

export default authSeller;