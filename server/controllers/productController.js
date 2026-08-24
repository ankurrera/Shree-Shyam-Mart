import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { query } from '../configs/db.js';

export const formatProduct = (row) => {
    if (!row) return null;
    const desc = typeof row.description === 'string' ? (JSON.parse(row.description || '[]')) : (row.description || []);
    const img = typeof row.image === 'string' ? (JSON.parse(row.image || '[]')) : (row.image || []);
    return {
        _id: row.id,
        id: row.id,
        name: row.name,
        description: desc,
        price: parseFloat(row.price),
        offerPrice: parseFloat(row.offer_price),
        category: row.category,
        image: img,
        stock: parseInt(row.stock, 10),
        inStock: Boolean(row.in_stock),
        weight: row.weight || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
};

// add product : /api/product/add
export const addProduct = async (req, res) => {
    const images = req.files || [];
    try {
        if (!req.body.productData) {
            return res.status(400).json({ success: false, message: "Missing product data" });
        }

        let productData;
        try {
            productData = JSON.parse(req.body.productData);
        } catch {
            return res.status(400).json({ success: false, message: "Invalid product data JSON" });
        }

        if (!images || images.length === 0) {
            return res.status(400).json({ success: false, message: "At least one product image is required" });
        }

        const imagesUrl = await Promise.all(
            images.map(async (item) => {
                try {
                    const result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                    return result.secure_url;
                } finally {
                    if (item.path && fs.existsSync(item.path)) {
                        fs.unlink(item.path, () => {});
                    }
                }
            })
        );

        const name = String(productData.name || '').trim();
        const description = Array.isArray(productData.description) ? productData.description : [String(productData.description || '')];
        const category = String(productData.category || '').trim();
        const price = parseFloat(productData.price) || 0;
        const offerPrice = parseFloat(productData.offerPrice) || 0;
        const stock = parseInt(productData.stock, 10) || 0;
        const inStock = productData.inStock !== undefined ? Boolean(productData.inStock) : (stock > 0);
        const weight = String(productData.weight || '');

        const insertRes = await query(
            `INSERT INTO products (name, description, price, offer_price, category, image, stock, in_stock, weight)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                name,
                JSON.stringify(description),
                price,
                offerPrice,
                category,
                JSON.stringify(imagesUrl),
                stock,
                inStock,
                weight
            ]
        );

        res.json({ success: true, message: "Product Added", product: formatProduct(insertRes.rows[0]) });
    } catch (error) {
        images.forEach((item) => {
            if (item.path && fs.existsSync(item.path)) {
                fs.unlink(item.path, () => {});
            }
        });
        console.error("Product add error:", error.message);
        res.status(500).json({ success: false, message: "Unable to add product" });
    }
};

// get product : /api/product/list
export const productList = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10);
        const limit = parseInt(req.query.limit, 10);
        const category = req.query.category;

        let queryText = 'SELECT * FROM products';
        let countText = 'SELECT COUNT(*) FROM products';
        const params = [];

        if (category && typeof category === 'string') {
            params.push(category);
            queryText += ` WHERE category = $${params.length}`;
            countText += ` WHERE category = $${params.length}`;
        }

        queryText += ' ORDER BY created_at DESC';

        if (Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0) {
            const countRes = await query(countText, params);
            const totalCount = parseInt(countRes.rows[0].count, 10);
            const totalPages = Math.ceil(totalCount / limit);

            const offset = (page - 1) * limit;
            params.push(limit, offset);
            queryText += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

            const productsRes = await query(queryText, params);
            const products = productsRes.rows.map(formatProduct);

            return res.json({
                success: true,
                products,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages
                }
            });
        }

        const productsRes = await query(queryText, params);
        const products = productsRes.rows.map(formatProduct);
        res.json({ success: true, products });
    } catch (error) {
        console.error("Product list error:", error.message);
        res.status(500).json({ success: false, message: "Unable to retrieve products" });
    }
};

// get single product : /api/product/:id
export const productById = async (req, res) => {
    try {
        const id = req.params.id || req.query.id || req.body.id;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        const isIdValid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id) ||
                          /^[0-9a-fA-F]{24}$/.test(id);

        if (!isIdValid) {
            return res.status(400).json({ success: false, message: "Invalid product ID format" });
        }

        const productRes = await query('SELECT * FROM products WHERE id = $1', [id]);
        if (productRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, product: formatProduct(productRes.rows[0]) });
    } catch (error) {
        console.error("Product detail error:", error.message);
        res.status(500).json({ success: false, message: "Unable to retrieve product details" });
    }
};

// change product in stock : /api/product/stock
export const changeStock = async (req, res) => {
    try {
        const { id, inStock } = req.body;

        if (!id || typeof inStock !== 'boolean') {
            return res.status(400).json({ success: false, message: "Invalid stock update parameters" });
        }

        const isIdValid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id) ||
                          /^[0-9a-fA-F]{24}$/.test(id);

        if (!isIdValid) {
            return res.status(400).json({ success: false, message: "Invalid product ID format" });
        }

        const updateRes = await query(
            'UPDATE products SET in_stock = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [inStock, id]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, message: "Stock Updated", product: formatProduct(updateRes.rows[0]) });
    } catch (error) {
        console.error("Change stock error:", error.message);
        res.status(500).json({ success: false, message: "Unable to update product stock" });
    }
};

// update product stock quantity: /api/product/update-stock
export const updateStockQuantity = async (req, res) => {
    try {
        const { productId, stock } = req.body;

        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        const isIdValid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(productId) ||
                          /^[0-9a-fA-F]{24}$/.test(productId);

        if (!isIdValid) {
            return res.status(400).json({ success: false, message: "Invalid product ID format" });
        }

        if (stock === undefined || stock === null || typeof stock === 'boolean' || Array.isArray(stock)) {
            return res.status(400).json({ success: false, message: "Stock quantity must be an integer" });
        }

        const numericStock = Number(stock);

        if (!Number.isInteger(numericStock) || numericStock < 0 || !Number.isFinite(numericStock)) {
            return res.status(400).json({ success: false, message: "Stock must be a non-negative integer" });
        }

        const inStock = numericStock > 0;

        const updateRes = await query(
            'UPDATE products SET stock = $1, in_stock = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [numericStock, inStock, productId]
        );

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        return res.json({
            success: true,
            message: "Stock quantity updated successfully",
            product: formatProduct(updateRes.rows[0])
        });
    } catch (error) {
        console.error("Update stock quantity error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to update stock quantity" });
    }
};