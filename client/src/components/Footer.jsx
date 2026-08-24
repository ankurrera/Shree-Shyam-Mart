import React from 'react';
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from 'motion/react';
import { Truck, ShieldCheck, Clock, Phone } from 'lucide-react';

const FacebookIcon = ({ className = "w-3.5 h-3.5" }) => (
	<svg className={className} fill="currentColor" viewBox="0 0 24 24">
		<path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
	</svg>
);

const InstagramIcon = ({ className = "w-3.5 h-3.5" }) => (
	<svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
		<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
		<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
		<line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
	</svg>
);

const YoutubeIcon = ({ className = "w-3.5 h-3.5" }) => (
	<svg className={className} fill="currentColor" viewBox="0 0 24 24">
		<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
	</svg>
);

const LinkedinIcon = ({ className = "w-3.5 h-3.5" }) => (
	<svg className={className} fill="currentColor" viewBox="0 0 24 24">
		<path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.48 1.48 0 1 0 0 2.96 1.48 1.48 0 0 0 0-2.96z"/>
	</svg>
);

const socialLinks = [
    { title: 'Facebook', href: '#', icon: FacebookIcon },
    { title: 'Instagram', href: '#', icon: InstagramIcon },
    { title: 'Youtube', href: '#', icon: YoutubeIcon },
    { title: 'LinkedIn', href: '#', icon: LinkedinIcon },
];

const footerSections = [
    {
        label: 'Shopping',
        links: [
            { title: 'All Products', href: '/products' },
            { title: 'Fresh Fruits & Veg', href: '/products/fruits-and-vegetables' },
            { title: 'Dairy & Eggs', href: '/products/dairy-and-eggs' },
            { title: 'Beverages', href: '/products/beverages' },
        ],
    },
    {
        label: 'Company',
        links: [
            { title: 'About Us', href: '/' },
            { title: 'Contact Us', href: '/' },
            { title: 'Privacy Policy', href: '/' },
            { title: 'Terms of Service', href: '/' },
        ],
    },
    {
        label: 'Trust & Guarantees',
        links: [
            { title: '100% Cash on Delivery', href: '#', icon: ShieldCheck },
            { title: '15 Min Express Delivery', href: '#', icon: Clock },
            { title: 'Free Returns & Exchange', href: '#', icon: Truck },
            { title: 'Customer Helpline', href: '#', icon: Phone },
        ],
    },
];

const Footer = () => {
    return (
        <footer className="mt-10 border-t border-slate-200/80 bg-slate-50 text-slate-700 font-sans">
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 md:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Brand Info & Social Icons */}
                    <AnimatedContainer className="lg:col-span-4 space-y-2.5">
                        <Link to="/" className="inline-block">
                            <img className="w-28 md:w-32 object-contain" src={assets.logo} alt="Shree Shyam Mart Logo" />
                        </Link>
                        <p className="text-slate-500 text-xs max-w-sm leading-relaxed font-medium">
                            Delivering fresh daily groceries, dairy, and household essentials straight to your doorstep with guaranteed 100% Cash on Delivery.
                        </p>
                        
                        {/* Compact Social Links & Copyright in one line */}
                        <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1.5">
                                {socialLinks.map((social) => {
                                    const IconComponent = social.icon;
                                    return (
                                        <a
                                            key={social.title}
                                            href={social.href}
                                            aria-label={social.title}
                                            className="w-7 h-7 rounded-full bg-white hover:bg-primary hover:text-white text-slate-600 border border-slate-200/80 flex items-center justify-center shadow-2xs transition-all duration-200 cursor-pointer"
                                        >
                                            <IconComponent className="w-3.5 h-3.5" />
                                        </a>
                                    );
                                })}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                                © {new Date().getFullYear()} Shree Shyam Mart
                            </span>
                        </div>
                    </AnimatedContainer>

                    {/* Navigation Columns */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {footerSections.map((section, index) => (
                            <AnimatedContainer key={section.label} delay={0.05 + index * 0.05}>
                                <div>
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-2">
                                        {section.label}
                                    </h3>
                                    <ul className="space-y-1 text-xs text-slate-600">
                                        {section.links.map((link) => (
                                            <li key={link.title}>
                                                <a
                                                    href={link.href}
                                                    className="hover:text-primary inline-flex items-center gap-1.5 transition-colors duration-200 font-medium"
                                                >
                                                    {link.icon && <link.icon size={13} className="text-primary shrink-0" />}
                                                    <span className="line-clamp-1">{link.title}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </AnimatedContainer>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

function AnimatedContainer({ className, delay = 0.05, children }) {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
        return children;
    }

    return (
        <motion.div
            initial={{ filter: 'blur(4px)', translateY: -4, opacity: 0 }}
            whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export default Footer;

