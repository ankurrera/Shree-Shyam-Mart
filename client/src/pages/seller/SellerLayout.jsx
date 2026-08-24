import { Link, NavLink, Outlet } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, ShoppingCart01Icon, DeliveryTruck01Icon, Logout01Icon, Store01Icon } from '@hugeicons/core-free-icons';

const SellerLayout = () => {

    const { axios, navigate, setIsSeller } = useAppContext();

    const sidebarLinks = [
        { name: "Add Product", path: "/seller", icon: PlusSignIcon },
        { name: "Product List", path: "/seller/product-list", icon: ShoppingCart01Icon },
        { name: "Orders", path: "/seller/orders", icon: DeliveryTruck01Icon },
    ];

    const logout = async () => {
        try {
            const { data } = await axios.get('/api/seller/logout');
            if (data.success) {
                setIsSeller(false);
                toast.success(data.message);
                navigate('/');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
            {/* Top Navbar */}
            <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-4">
                    <Link to='/' className="flex items-center gap-2">
                        <img src={assets.logo} alt="Shree Shyam Mart Logo" className="cursor-pointer w-32 md:w-36 object-contain" />
                    </Link>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                        <HugeiconsIcon icon={Store01Icon} size={14} />
                        Seller Portal
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Hi, Admin
                    </div>
                    <button 
                        onClick={logout} 
                        className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
                    >
                        <HugeiconsIcon icon={Logout01Icon} size={14} />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            {/* Main Content Layout */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-16 md:w-64 border-r border-slate-200/80 bg-white min-h-[calc(100vh-57px)] pt-5 pb-8 flex flex-col justify-between shrink-0 shadow-xs">
                    <div className="space-y-1 px-2 md:px-3">
                        <p className="hidden md:block text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                            Dashboard Menu
                        </p>
                        {sidebarLinks.map((item) => (
                            <NavLink 
                                to={item.path} 
                                key={item.name} 
                                end={item.path === "/seller"}
                                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    isActive 
                                        ? "bg-primary text-white shadow-sm shadow-primary/20" 
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                            >
                                <HugeiconsIcon icon={item.icon} size={20} className="shrink-0" />
                                <span className="hidden md:inline">{item.name}</span>
                            </NavLink>
                        ))}
                    </div>

                    <div className="hidden md:block px-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                        <p className="font-semibold text-slate-500">Shree Shyam Mart</p>
                        <p className="mt-0.5">Fulfillment Dashboard v1.0</p>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 bg-slate-50/60 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SellerLayout;