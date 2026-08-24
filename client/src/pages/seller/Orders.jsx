import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import toast from 'react-hot-toast'
import { HugeiconsIcon } from '@hugeicons/react';
import { DeliveryTruck01Icon, Search01Icon, PackageIcon, Tick02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

const Orders = () => {
    const { currency, axios } = useAppContext()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeStatus, setActiveStatus] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [codSummary, setCodSummary] = useState({
        totalOrders: 0,
        deliveredOrders: 0,
        codCollected: 0,
        codExpected: 0
    })

    const fetchOrders = async (statusFilter = 'all', searchQuery = '') => {
        try {
            setLoading(true)
            let url = '/api/order/seller?'
            const params = new URLSearchParams()
            if (statusFilter && statusFilter !== 'all') {
                params.append('status', statusFilter)
            }
            if (searchQuery && searchQuery.trim() !== '') {
                params.append('search', searchQuery.trim())
            }
            url += params.toString()

            const { data } = await axios.get(url)
            if (data.success) {
                setOrders(data.orders || [])
                if (data.codSummary) {
                    setCodSummary(data.codSummary)
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error("Seller orders fetch error:", error.message)
            toast.error("Unable to load seller orders")
        } finally {
            setLoading(false)
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const { data } = await axios.post('/api/order/status', {
                orderId,
                status: newStatus
            });
            if (data.success) {
                toast.success(data.message);
                fetchOrders(activeStatus, searchTerm);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Status update error:", error.message);
            toast.error(error.response?.data?.message || "Failed to update order status");
        }
    };

    const handleFilterTab = (status) => {
        setActiveStatus(status);
        fetchOrders(status, searchTerm);
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        fetchOrders(activeStatus, query);
    };

    useEffect(() => {
        fetchOrders(activeStatus, searchTerm);
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center h-[80vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        )
    }

    const filterOptions = ['all', 'Order placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'];

    return (
        <div className='p-4 md:p-8 max-w-6xl font-sans space-y-6'>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Order Fulfillment & COD Operations</h1>
                    <p className="text-xs text-slate-500 mt-1">Track incoming customer orders, update delivery status, and reconcile cash collection</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
                    <HugeiconsIcon icon={DeliveryTruck01Icon} size={16} />
                    {orders.length} Order(s) Shown
                </span>
            </div>

            {/* COD Operational Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Orders</p>
                    <p className="text-2xl font-bold text-slate-800">{codSummary.totalOrders}</p>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
                    <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Delivered & Paid</p>
                    <p className="text-2xl font-bold text-emerald-600">{codSummary.deliveredOrders}</p>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
                    <p className="text-xs text-primary font-semibold uppercase tracking-wider">COD Collected</p>
                    <p className="text-2xl font-bold text-primary">{currency}{codSummary.codCollected}</p>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-1">
                    <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">COD Pending</p>
                    <p className="text-2xl font-bold text-amber-600">{currency}{codSummary.codExpected}</p>
                </div>
            </div>

            {/* Search Field & Status Filter Tabs */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    {filterOptions.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => handleFilterTab(opt)}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                                activeStatus === opt
                                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60'
                            }`}
                        >
                            {opt === 'all' ? 'All Orders' : opt}
                        </button>
                    ))}
                </div>

                <div className="relative min-w-[260px]">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <HugeiconsIcon icon={Search01Icon} size={16} />
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search name, phone, or ID..."
                        className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                fetchOrders(activeStatus, '');
                            }}
                            className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Orders Feed */}
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[35vh] text-center bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs">
                        <img className="w-16 h-16 opacity-40 mb-3" src={assets.box_icon} alt="No orders" />
                        <h3 className="text-base font-bold text-slate-700">No Orders Found</h3>
                        <p className="text-xs text-slate-500 mt-1">There are currently no orders matching status "{activeStatus}".</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-300 transition-all">
                            {/* Items Preview */}
                            <div className="flex items-start gap-4 max-w-sm">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0 p-2.5 flex items-center justify-center">
                                    <HugeiconsIcon icon={PackageIcon} size={22} className="text-slate-500" />
                                </div>
                                <div className="space-y-1">
                                    {order.items.map((item, itemIdx) => {
                                        const name = item.name || item.product?.name || "Product Item";
                                        return (
                                            <p key={itemIdx} className="font-semibold text-xs text-slate-800">
                                                {name} <span className="text-primary font-bold">× {item.quantity || 1}</span>
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Customer Delivery Details */}
                            <div className="text-xs text-slate-600 space-y-0.5 max-w-xs">
                                <p className='font-bold text-slate-900'>
                                    {order.address?.firstName} {order.address?.lastName}
                                </p>
                                <p className="text-slate-500">{order.address?.street}, {order.address?.city}</p> 
                                <p className="text-slate-500">{order.address?.state}, {order.address?.zipcode}</p>
                                <p className="font-semibold text-slate-700 mt-1">📞 {order.address?.phone || "N/A"}</p>
                            </div>

                            {/* Payment Summary */}
                            <div className="text-xs text-slate-600 space-y-1">
                                <p className="font-extrabold text-base text-primary">{currency}{order.amount}</p>
                                <p className="text-slate-500">Method: <span className="font-semibold text-slate-700">{order.paymentType}</span></p>
                                <p className="text-slate-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                                <p>Payment: <span className={`font-bold ${order.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>{order.isPaid ? "Paid" : "Pending"}</span></p>
                            </div>

                            {/* Status Selector */}
                            <div className="space-y-1 min-w-[160px]">
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Order Status</label>
                                <select 
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                                >
                                    <option value="Order placed">Order placed</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Dispatched">Dispatched</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Orders


