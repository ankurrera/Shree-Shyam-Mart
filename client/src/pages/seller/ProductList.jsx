import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { HugeiconsIcon } from '@hugeicons/react';
import { ShoppingBag01Icon, Tick02Icon } from '@hugeicons/core-free-icons';

const ProductList = () => {
    const { products, currency, axios, fetchProducts } = useAppContext();
    const [editingStock, setEditingStock] = useState({});
    const [savingId, setSavingId] = useState(null);

    const toggleStock = async (id, inStock) => {
        try {
            const { data } = await axios.post('/api/product/stock', { id, inStock });
            if (data.success) {
                fetchProducts();
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleStockChange = (id, val) => {
        setEditingStock(prev => ({ ...prev, [id]: val }));
    };

    const saveStockQuantity = async (productId, currentStock) => {
        const inputVal = editingStock[productId];
        if (inputVal === undefined || inputVal === '') return;

        const numericStock = Number(inputVal);
        if (!Number.isInteger(numericStock) || numericStock < 0) {
            toast.error("Stock must be a non-negative integer");
            return;
        }

        if (numericStock === currentStock) {
            return; // No change
        }

        try {
            setSavingId(productId);
            const { data } = await axios.post('/api/product/update-stock', {
                productId,
                stock: numericStock
            });

            if (data.success) {
                toast.success(data.message || "Stock quantity updated");
                fetchProducts();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl font-sans space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Product Catalog</h1>
                    <p className="text-xs text-slate-500 mt-1">Manage catalog pricing, toggle store visibility, and update real-time stock quantities</p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                    <HugeiconsIcon icon={ShoppingBag01Icon} size={16} className="text-primary" />
                    <span>Total Products: {products.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-5 py-3.5">Product</th>
                                <th className="px-5 py-3.5">Category</th>
                                <th className="px-5 py-3.5 hidden md:table-cell">Selling Price</th>
                                <th className="px-5 py-3.5">Stock Qty</th>
                                <th className="px-5 py-3.5">Status & Toggle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {products.map((product) => {
                                const stockVal = typeof product.stock === 'number' ? product.stock : 0;
                                const isLowStock = stockVal > 0 && stockVal <= 5;
                                const isOutOfStock = stockVal === 0 || !product.inStock;
                                const currentInputValue = editingStock[product._id] !== undefined ? editingStock[product._id] : stockVal;

                                return (
                                    <tr key={product._id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0 p-1 flex items-center justify-center overflow-hidden">
                                                    <img src={product.image[0]} alt={product.name} className="w-full h-full object-contain" />
                                                </div>
                                                <span className="font-semibold text-slate-800 line-clamp-1 max-w-xs">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 font-medium text-slate-600">{product.category}</td>
                                        <td className="px-5 py-3.5 hidden md:table-cell font-bold text-slate-900">{currency}{product.offerPrice}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={currentInputValue}
                                                    onChange={(e) => handleStockChange(product._id, e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            saveStockQuantity(product._id, stockVal);
                                                        }
                                                    }}
                                                    className="w-16 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold text-xs focus:outline-none focus:border-primary focus:bg-white transition-all"
                                                />
                                                {editingStock[product._id] !== undefined && Number(editingStock[product._id]) !== stockVal && (
                                                    <button
                                                        onClick={() => saveStockQuantity(product._id, stockVal)}
                                                        disabled={savingId === product._id}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary hover:bg-primary/90 text-white font-medium rounded-lg shadow-2xs transition-all cursor-pointer"
                                                    >
                                                        <HugeiconsIcon icon={Tick02Icon} size={12} />
                                                        Save
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        onChange={() => toggleStock(product._id, !product.inStock)} 
                                                        checked={product.inStock} 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                    />
                                                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-primary transition-colors duration-200"></div>
                                                    <span className="dot absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4 shadow-2xs"></span>
                                                </label>

                                                {/* Low Stock Alert Visual Badges */}
                                                {isOutOfStock ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">Out of Stock</span>
                                                ) : isLowStock ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Low Stock ({stockVal})</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">In Stock</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductList;


