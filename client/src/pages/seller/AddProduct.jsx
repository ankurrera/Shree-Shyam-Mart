import React, { useState } from 'react'
import { assets, categories } from '../../assets/assets';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { HugeiconsIcon } from '@hugeicons/react';
import { ImageAdd01Icon, PlusSignIcon } from '@hugeicons/core-free-icons';

const AddProduct = () => {

    const [files, setFiles] = useState([])
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [offerPrice, setOfferPrice] = useState('');
    const [stock, setStock] = useState('10');
    const [submitting, setSubmitting] = useState(false);
    const { axios } = useAppContext();

    const onSubmitHandler = async (event) => {
        try {
            event.preventDefault();
            setSubmitting(true);
            const productData = {
                name,
                description: description.split('\n'),
                category,
                price: Number(price),
                offerPrice: Number(offerPrice),
                stock: Number(stock) || 0
            }
            const formData = new FormData();
            formData.append('productData', JSON.stringify(productData));
            for(let i = 0; i < files.length; i++){
              if (files[i]) formData.append('images', files[i]);
            }

            const { data } = await axios.post('/api/product/add', formData)

            if(data.success){
                toast.success(data.message);
                setName('');
                setDescription('');
                setCategory('');
                setPrice('');
                setOfferPrice('');
                setStock('10');
                setFiles([])
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl font-sans space-y-6">
            <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Add New Product</h1>
                <p className="text-xs text-slate-500 mt-1">Upload high-resolution images and specify catalog pricing and stock availability</p>
            </div>

            <form onSubmit={onSubmitHandler} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
                {/* Product Images Section */}
                <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Product Images (Up to 4)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                        {Array(4).fill('').map((_, index) => (
                            <label 
                                key={index} 
                                htmlFor={`image${index}`}
                                className="relative flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 hover:border-primary/60 bg-slate-50/50 hover:bg-primary/5 rounded-xl cursor-pointer transition-all overflow-hidden group"
                            >
                                <input 
                                    onChange={(e) => {
                                        const updatedFiles = [...files];
                                        updatedFiles[index] = e.target.files[0];
                                        setFiles(updatedFiles);
                                    }} 
                                    type="file" 
                                    id={`image${index}`} 
                                    accept="image/*"
                                    hidden 
                                />
                                {files[index] ? (
                                    <img 
                                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform" 
                                        src={URL.createObjectURL(files[index])} 
                                        alt="Product preview" 
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-primary transition-colors">
                                        <HugeiconsIcon icon={ImageAdd01Icon} size={24} />
                                        <span className="text-[11px] font-medium">Upload Image {index + 1}</span>
                                    </div>
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Product Name */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700" htmlFor="product-name">
                        Product Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                        onChange={(e) => setName(e.target.value)} 
                        value={name} 
                        id="product-name" 
                        type="text" 
                        placeholder="e.g. Amul Taaza Toned Fresh Milk (1L)" 
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all" 
                        required 
                    />
                </div>

                {/* Product Description */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700" htmlFor="product-description">
                        Product Description
                    </label>
                    <textarea 
                        onChange={(e) => setDescription(e.target.value)} 
                        value={description}
                        id="product-description" 
                        rows={3} 
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white resize-none transition-all" 
                        placeholder="Enter key product features or details (one line per bullet point)"
                    ></textarea>
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700" htmlFor="category">
                        Category <span className="text-red-500">*</span>
                    </label>
                    <select 
                        onChange={(e) => setCategory(e.target.value)} 
                        value={category}
                        id="category" 
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all cursor-pointer" 
                        required
                    >
                        <option value="">Select Category</option>
                        {categories.map((item, index) => (
                            <option key={index} value={item.path}>{item.path}</option>
                        ))}
                    </select>
                </div>

                {/* Pricing & Stock Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700" htmlFor="product-price">
                            Regular Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input 
                            onChange={(e) => setPrice(e.target.value)} 
                            value={price} 
                            id="product-price" 
                            type="number" 
                            min="0"
                            placeholder="100" 
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all" 
                            required 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700" htmlFor="offer-price">
                            Offer Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input 
                            onChange={(e) => setOfferPrice(e.target.value)} 
                            value={offerPrice} 
                            id="offer-price" 
                            type="number" 
                            min="0"
                            placeholder="85" 
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all" 
                            required 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700" htmlFor="stock-quantity">
                            Stock Quantity <span className="text-red-500">*</span>
                        </label>
                        <input 
                            onChange={(e) => setStock(e.target.value)} 
                            value={stock} 
                            id="stock-quantity" 
                            type="number" 
                            min="0" 
                            placeholder="10" 
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all" 
                            required 
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold text-sm rounded-xl shadow-sm shadow-primary/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <HugeiconsIcon icon={PlusSignIcon} size={18} />
                        {submitting ? "Adding Product..." : "Add Product to Catalog"}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default AddProduct;


