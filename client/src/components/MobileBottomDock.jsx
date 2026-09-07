import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import GradientMenu from './ui/gradient-menu';
import { 
    IoHomeOutline, 
    IoStorefrontOutline, 
    IoCartOutline, 
    IoReceiptOutline, 
    IoChatbubbleEllipsesOutline 
} from 'react-icons/io5';

const MobileBottomDock = () => {
    const location = useLocation();
    const { getCartCount, user, setShowUserLogin } = useAppContext();
    const cartCount = getCartCount();

    // Do not show on seller routes or when in fullscreen modals
    if (location.pathname.startsWith('/seller')) {
        return null;
    }

    const navigationItems = [
        {
            title: 'Home',
            path: '/',
            icon: <IoHomeOutline />,
            gradientFrom: '#10b981',
            gradientTo: '#059669'
        },
        {
            title: 'Shop',
            path: '/products',
            icon: <IoStorefrontOutline />,
            gradientFrom: '#06b6d4',
            gradientTo: '#2563eb'
        },
        {
            title: 'Cart',
            path: '/cart',
            icon: <IoCartOutline />,
            badge: cartCount > 0 ? cartCount : undefined,
            gradientFrom: '#f59e0b',
            gradientTo: '#ea580c'
        },
        {
            title: 'Orders',
            path: user ? '/my-orders' : undefined,
            onClick: !user ? () => setShowUserLogin(true) : undefined,
            icon: <IoReceiptOutline />,
            gradientFrom: '#8b5cf6',
            gradientTo: '#6d28d9'
        },
        {
            title: 'Help',
            path: '/contact',
            icon: <IoChatbubbleEllipsesOutline />,
            gradientFrom: '#ec4899',
            gradientTo: '#f43f5e'
        }
    ];

    return (
        <aside aria-label="Mobile Navigation" className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 sm:hidden pointer-events-auto">
            <div className="p-1.5 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/25 shadow-2xl">
                <GradientMenu 
                    items={navigationItems} 
                    activePath={location.pathname}
                    className="gap-1.5"
                    containerClassName="min-h-0 bg-transparent"
                />
            </div>
        </aside>
    );
};

export default MobileBottomDock;
