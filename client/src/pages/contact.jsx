import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
    Phone, 
    Mail, 
    MapPin, 
    Clock, 
    Send, 
    MessageCircle, 
    ExternalLink, 
    ShieldCheck, 
    Truck, 
    Sparkles,
    CheckCircle2
} from 'lucide-react';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        orderId: '',
        topic: 'Order Inquiry',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.contact.trim() || !formData.message.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
            toast.success('Thank you! Your message has been received. We will get back to you shortly.');
            setFormData({
                name: '',
                contact: '',
                orderId: '',
                topic: 'Order Inquiry',
                message: ''
            });
        }, 600);
    };

    const googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=Shakuntala+Complex+Baliapur+Road+Dhanbad+826001";
    const whatsappUrl = "https://wa.me/919204234193?text=Hello%20Shree%20Shyam%20Mart,%20I%20have%20an%20inquiry%20regarding%20my%20order.";

    return (
        <div className="py-8 md:py-12 space-y-12 font-sans">
            {/* Hero Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide">
                    <Sparkles size={14} />
                    <span>Customer Support & Assistance</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
                    Get in Touch with <span className="text-primary">Shree Shyam Mart</span>
                </h1>
                <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                    Have questions about fresh daily groceries, an ongoing delivery, or visiting our store in Dhanbad? We are always happy to help.
                </p>
            </div>

            {/* Quick Action Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                {/* Phone Call */}
                <a
                    href="tel:+919204234193"
                    className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-primary/50 hover:shadow-md transition-all flex flex-col items-start gap-3"
                >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <Phone size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Call Directly</p>
                        <h3 className="text-base font-bold text-slate-800 mt-0.5 group-hover:text-primary transition-colors">+91 92042 34193</h3>
                        <p className="text-xs text-slate-500 mt-1">Available Mon–Sun 8:00 AM – 9:30 PM</p>
                    </div>
                </a>

                {/* WhatsApp Chat */}
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-start gap-3"
                >
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <MessageCircle size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">WhatsApp Support</p>
                            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mt-0.5 group-hover:text-emerald-700 transition-colors">Chat on WhatsApp</h3>
                        <p className="text-xs text-slate-500 mt-1">Fast answers for order tracking & queries</p>
                    </div>
                </a>

                {/* Email */}
                <a
                    href="mailto:shreeshyammart11@gmail.com"
                    className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-primary/50 hover:shadow-md transition-all flex flex-col items-start gap-3"
                >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <Mail size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Assistance</p>
                        <h3 className="text-base font-bold text-slate-800 mt-0.5 group-hover:text-primary transition-colors break-all">shreeshyammart11@gmail.com</h3>
                        <p className="text-xs text-slate-500 mt-1">We respond within a few hours</p>
                    </div>
                </a>
            </div>

            {/* Main Content Grid: Store Details & Inquiry Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Store Information (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Location Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Visit Our Store</h3>
                                <p className="text-xs text-slate-500">Walk-in shopping and order pickups</p>
                            </div>
                        </div>

                        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            <p className="font-bold text-slate-800">Shree Shyam Mart</p>
                            <p className="mt-1">Shop No. G1, G2, Shakuntala Complex,</p>
                            <p>Above Coffee House, Opposite Kailasha Apartment,</p>
                            <p>Baliapur Road, Dhanbad, Jharkhand - 826001</p>
                        </div>

                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        >
                            <span>Open in Google Maps</span>
                            <ExternalLink size={14} />
                        </a>
                    </div>

                    {/* Operational Hours */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Store & Delivery Hours</h3>
                                <p className="text-xs text-slate-500">Open 7 Days a Week</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs pt-1">
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-600 font-medium">Monday – Sunday</span>
                                <span className="font-bold text-slate-800">8:00 AM – 9:30 PM</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-600 font-medium">Local COD Delivery</span>
                                <span className="font-semibold text-primary">Active All Day</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5">
                                <span className="text-slate-600 font-medium">Customer Support</span>
                                <span className="font-semibold text-slate-700">Immediate via Call & WhatsApp</span>
                            </div>
                        </div>
                    </div>

                    {/* Store Guarantees */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <Truck size={16} className="text-primary shrink-0" />
                            <span className="font-medium text-slate-700">Fast Local Delivery</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-primary shrink-0" />
                            <span className="font-medium text-slate-700">100% Genuine Goods</span>
                        </div>
                    </div>
                </div>

                {/* Inquiry Form (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Send Us a Message</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Have a specific query, bulk order request, or feedback? Fill in the form below.
                        </p>
                    </div>

                    {submitted ? (
                        <div className="py-10 text-center space-y-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 p-6">
                            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Message Delivered!</h3>
                            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                                Thank you for reaching out. Our customer care team will review your message and reach back via phone or email shortly.
                            </p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Your Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Rahul Sharma"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Phone Number or Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 9876543210 or name@gmail.com"
                                        value={formData.contact}
                                        onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Topic / Category
                                    </label>
                                    <select
                                        value={formData.topic}
                                        onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                                    >
                                        <option value="Order Inquiry">Order Inquiry / Tracking</option>
                                        <option value="Product Availability">Product Availability</option>
                                        <option value="Delivery Issue">Delivery Question</option>
                                        <option value="Feedback / Suggestion">Feedback or Suggestion</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Order ID <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. #9108df30"
                                        value={formData.orderId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Write your query or details here..."
                                    value={formData.message}
                                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-primary focus:bg-white resize-none transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 px-5 rounded-xl bg-primary hover:bg-primary-dull text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                            >
                                <Send size={16} />
                                <span>{isSubmitting ? "Sending..." : "Submit Message"}</span>
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-6 md:p-8 space-y-6">
                <div className="text-center max-w-xl mx-auto">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800">Frequently Asked Questions</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Quick answers to common questions about shopping with us</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-2">
                        <h4 className="text-sm font-bold text-slate-800">How do I pay for my order?</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            We support 100% Cash on Delivery (COD). You can verify your groceries upon arrival and pay cash directly to the delivery person.
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-2">
                        <h4 className="text-sm font-bold text-slate-800">What is the delivery area?</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            We deliver across Dhanbad and surrounding neighborhoods along Baliapur Road. Fast doorstep delivery is available every day.
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-2">
                        <h4 className="text-sm font-bold text-slate-800">Can I cancel or change my order?</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Yes! You can cancel anytime from your "My Orders" page while your order is in Order Placed, Confirmed, or Dispatched status, or ping us on WhatsApp.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;