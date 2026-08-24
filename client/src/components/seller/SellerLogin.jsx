import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast';
import { HugeiconsIcon } from '@hugeicons/react';
import { LockKeyIcon, Mail01Icon, Store01Icon } from '@hugeicons/core-free-icons';

const SellerLogin = () => {
    const { isSeller, setIsSeller, navigate, axios } = useAppContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmitHandler = async (event) => {
        try {
            event.preventDefault();
            setSubmitting(true);
            const { data } = await axios.post('/api/seller/login', { email, password });
            if (data.success) {
                setIsSeller(true);
                toast.success(data.message);
                navigate('/seller');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (isSeller) {
            navigate("/seller");
        }
    }, [isSeller]);

    return !isSeller && (
        <div className='min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans'>
            <form onSubmit={onSubmitHandler} className='w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 sm:p-10 space-y-6'>
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-1">
                        <HugeiconsIcon icon={Store01Icon} size={26} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        <span className="text-primary">Seller</span> Partner Portal
                    </h1>
                    <p className="text-xs text-slate-500">Sign in to manage inventory, fulfill orders, and track COD cash</p>
                </div>

                <div className='space-y-4'>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="seller-email">
                            Store Email Address
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <HugeiconsIcon icon={Mail01Icon} size={18} />
                            </span>
                            <input 
                                id="seller-email"
                                onChange={(e) => setEmail(e.target.value)} 
                                value={email}
                                type="email" 
                                placeholder="seller@example.com"
                                className='w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all'
                                required 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="seller-password">
                            Password
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <HugeiconsIcon icon={LockKeyIcon} size={18} />
                            </span>
                            <input 
                                id="seller-password"
                                onChange={(e) => setPassword(e.target.value)} 
                                value={password}
                                type="password" 
                                placeholder="••••••••••••"
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all" 
                                required 
                            />
                        </div>
                    </div>
                </div>

                <button 
                    disabled={submitting}
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-medium text-sm rounded-lg shadow-md shadow-primary/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                    {submitting ? "Signing in..." : "Sign In to Seller Portal"}
                </button>
            </form>
        </div>
    );
};

export default SellerLogin;

