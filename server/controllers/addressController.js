import { query } from "../configs/db.js";

const formatAddress = (row) => ({
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    street: row.street,
    city: row.city,
    state: row.state,
    zipcode: row.zipcode,
    country: row.country,
    phone: row.phone,
    createdAt: row.created_at
});

// add address : /api/address/add
export const addAddress = async (req, res) => {
    try {
        const { address } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Not Authorized" });
        }

        if (!address || typeof address !== 'object') {
            return res.status(400).json({ success: false, message: "Address details are required" });
        }

        const requiredFields = ['firstName', 'lastName', 'email', 'street', 'city', 'state', 'zipcode', 'country', 'phone'];
        for (const field of requiredFields) {
            if (!address[field] && address[field] !== 0) {
                return res.status(400).json({ success: false, message: `Field "${field}" is required` });
            }
        }

        const zipcode = Number(address.zipcode);
        if (isNaN(zipcode)) {
            return res.status(400).json({ success: false, message: "Zipcode must be a valid number" });
        }

        const insertRes = await query(
            `INSERT INTO addresses (user_id, first_name, last_name, email, street, city, state, zipcode, country, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                userId,
                String(address.firstName).trim(),
                String(address.lastName).trim(),
                String(address.email).trim().toLowerCase(),
                String(address.street).trim(),
                String(address.city).trim(),
                String(address.state).trim(),
                zipcode,
                String(address.country).trim(),
                String(address.phone).trim()
            ]
        );

        const newAddress = formatAddress(insertRes.rows[0]);
        res.json({ success: true, message: "Address added successfully", address: newAddress });
    } catch (error) {
        console.error("Add address error:", error.message);
        res.status(500).json({ success: false, message: "Unable to add address" });
    }
};

// get address : /api/address/get
export const getAddress = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Not Authorized" });
        }

        const resAddresses = await query(
            'SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        const addresses = resAddresses.rows.map(formatAddress);
        res.json({ success: true, addresses });
    } catch (error) {
        console.error("Get address error:", error.message);
        res.status(500).json({ success: false, message: "Unable to fetch addresses" });
    }
};