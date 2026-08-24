import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Plus, Minus, Star, Zap, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const ProductCard = ({ product, className }) => {
    const { currency, addToCart, removeFromCart, cartItems, navigate } = useAppContext();
    const [wishlisted, setWishlisted] = useState(false);

    if (!product) return null;

    const quantity = cartItems[product._id] || 0;
    const rating = product.rating != null ? Number(product.rating).toFixed(1) : '4.2';
    const stockVal = typeof product.stock === 'number' ? product.stock : 0;
    const isOutOfStock = stockVal === 0 || !product.inStock;

    const discountPercentage = product.price > product.offerPrice 
        ? Math.round(((product.price - product.offerPrice) / product.price) * 100) 
        : 0;

    const handleWishlistClick = (e) => {
        e.stopPropagation();
        setWishlisted(prev => !prev);
    };

    return (
        <div 
            onClick={() => {
                navigate(`/products/${product.category.toLowerCase()}/${product._id}`); 
                scrollTo(0, 0);
            }} 
            className={cn(
                "group cursor-pointer bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden font-sans w-full",
                className
            )}
        >
            {/* Image Showcase & Overlay Badges */}
            <div className="w-full h-40 sm:h-44 bg-slate-50/60 rounded-xl flex items-center justify-center p-3 relative mb-2 overflow-hidden group-hover:bg-slate-50 transition-colors">
                {/* Discount / Stock Badges */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                    {isOutOfStock ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-600 text-white shadow-2xs">
                            Out of Stock
                        </span>
                    ) : discountPercentage > 0 ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white shadow-2xs">
                            {discountPercentage}% OFF
                        </span>
                    ) : null}
                </div>

                {/* Wishlist Heart Toggle */}
                <button
                    onClick={handleWishlistClick}
                    aria-label="Wishlist product"
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white backdrop-blur-xs flex items-center justify-center shadow-xs border border-slate-100 hover:scale-105 transition-all cursor-pointer"
                >
                    <Heart 
                        className={`w-3.5 h-3.5 transition-colors ${wishlisted ? "text-rose-500 fill-rose-500" : "text-slate-400 hover:text-rose-500"}`} 
                    />
                </button>

                {/* Product Image */}
                <img 
                    src={product.image[0]} 
                    alt={product.name} 
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs"
                    loading="lazy"
                />
            </div>

            {/* Product Meta & Details */}
            <div className="flex flex-col flex-1 justify-between space-y-2">
                <div className="space-y-1">
                    {/* Delivery Speed Badge */}
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold tracking-wide">
                        <Zap size={11} className="text-amber-500 fill-amber-500" />
                        <span>15 MINS</span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-snug min-h-[32px] group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                    
                    {/* Weight & Rating Row */}
                    <div className="flex items-center justify-between pt-0.5">
                        <p className="text-[11px] text-slate-400 font-medium truncate max-w-[60%]">
                            {product.weight || product.category}
                        </p>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200/60 text-[10px] font-bold text-amber-700">
                            <Star size={10} className="text-amber-500 fill-amber-500" />
                            {rating}
                        </span>
                    </div>
                </div>

                {/* Price & Action Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                                {currency}{product.offerPrice}
                            </span>
                            {product.price > product.offerPrice && (
                                <span className="text-[11px] text-slate-400 line-through font-normal">
                                    {currency}{product.price}
                                </span>
                            )}
                        </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                        {quantity === 0 ? (
                            <button 
                                disabled={isOutOfStock}
                                onClick={() => addToCart(product._id)} 
                                className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-600/40 hover:bg-emerald-600 hover:text-white font-bold text-xs rounded-lg transition-all duration-200 shadow-2xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                ADD
                            </button>
                        ) : (
                            <div className="flex items-center justify-between w-20 h-7.5 bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-xs select-none overflow-hidden">
                                <button 
                                    onClick={() => removeFromCart(product._id)} 
                                    className="w-6 h-full flex items-center justify-center hover:bg-emerald-700 transition-colors cursor-pointer"
                                >
                                    <Minus size={13} />
                                </button>
                                <span className="w-5 text-center text-xs font-semibold">{quantity}</span>
                                <button 
                                    onClick={() => addToCart(product._id)} 
                                    className="w-6 h-full flex items-center justify-center hover:bg-emerald-700 transition-colors cursor-pointer"
                                >
                                    <Plus size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;


