import express from 'express';
import authSeller from '../middleware/authSeller.js';
import { upload } from '../configs/multer.js';

import { addProduct, changeStock, productById, productList, updateProduct, updateStockQuantity } from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.post('/add', authSeller, upload.array('images', 4), addProduct);
productRouter.post('/update', authSeller, upload.array('images', 4), updateProduct);
productRouter.put('/update', authSeller, upload.array('images', 4), updateProduct);
productRouter.get('/list', productList);
productRouter.get('/id', productById); // Compatibility alias
productRouter.get('/:id', productById);
productRouter.post('/stock', authSeller, changeStock);
productRouter.post('/update-stock', authSeller, updateStockQuantity);

export default productRouter;
