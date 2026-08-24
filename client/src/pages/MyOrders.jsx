import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import toast from 'react-hot-toast'

const MyOrders = () => {
    const [myOrders, setMyOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const { currency, axios, user, navigate, fetchCart } = useAppContext()
    const [reorderingId, setReorderingId] = useState(null)

    const fetchMyOrders = async () =>{
        try {
            setLoading(true)
            const { data } = await axios.get('/api/order/user')
            if(data.success){
                setMyOrders(data.orders || [])
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error("Fetch orders error:", error.message)
            toast.error("Unable to load orders")
        } finally {
            setLoading(false)
        }
    }

    const handleReorder = async (orderId) => {
        try {
            setReorderingId(orderId);
            const { data } = await axios.post(`/api/order/${orderId}/reorder`);
            if (data.success) {
                if (data.reorderedCount > 0) {
                    toast.success(`${data.reorderedCount} item(s) added to your cart!`);
                    if (data.unavailableCount > 0) {
                        toast(`${data.unavailableCount} item(s) are currently unavailable/out of stock.`, { icon: '⚠️' });
                    }
                    if (fetchCart) fetchCart();
                    navigate('/cart');
                } else {
                    toast.error("None of the items from this order are currently available for reorder.");
                }
            } else {
                toast.error(data.message || "Reorder failed.");
            }
        } catch (error) {
            console.error("Reorder request error:", error.message);
            toast.error("Unable to process reorder");
        } finally {
            setReorderingId(null);
        }
    }

    useEffect(()=>{
        if(user){
            fetchMyOrders()
        } else {
            setLoading(false)
        }
    },[user])

    const getTimelineSteps = (status) => {
        if (status === 'Cancelled') {
            return [{ label: 'Order Placed', active: true }, { label: 'Cancelled', active: true, isTerminal: true }];
        }
        const steps = ['Order placed', 'Confirmed', 'Dispatched', 'Delivered'];
        const currentIdx = steps.indexOf(status);
        return steps.map((step, idx) => ({
            label: step,
            active: idx <= currentIdx,
            current: idx === currentIdx
        }));
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh] mt-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center mt-16">
                <p className="text-xl font-medium text-gray-700">Please sign in to view your orders.</p>
            </div>
        )
    }

    return (
        <div className='mt-16 pb-16'>
            <div className='flex flex-col items-end w-max mb-8'>
                <p className='text-2xl font-medium uppercase'>My orders</p>
                <div className='w-16 h-0.5 bg-primary rounded-full'></div>
            </div>

            {myOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                    <img src={assets.box_icon} alt="No Orders" className="w-16 h-16 opacity-40 mb-3" />
                    <h3 className="text-xl font-semibold text-gray-700">No orders placed yet</h3>
                    <p className="text-gray-500 text-sm mt-1">Once you place an order, its details and tracking will show up here.</p>
                    <button onClick={() => { navigate("/products"); scrollTo(0, 0); }} className="mt-5 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded hover:bg-primary-dull transition">
                        Browse Products
                    </button>
                </div>
            ) : (
                myOrders.map((order, index)=>{
                    const steps = getTimelineSteps(order.status);
                    return (
                        <div key={order._id || index} className='border border-gray-300 rounded-lg mb-10 p-4 py-5 max-w-4xl bg-white shadow-sm'>
                            <div className='flex justify-between md:items-center text-gray-500 text-sm md:text-base font-medium max-md:flex-col gap-1 pb-3 border-b border-gray-200'>
                                <span>Order ID: <span className="text-gray-700 font-normal">#{order._id}</span></span>
                                <span>Payment: <span className="text-gray-700 font-normal">{order.paymentType} ({order.isPaid ? 'Paid' : 'Pending'})</span></span>
                                <span>Total Amount: <span className="text-primary font-semibold">{currency}{order.amount}</span></span>
                            </div>

                            {/* Visual Timeline Stepper */}
                            <div className="my-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between overflow-x-auto text-xs md:text-sm">
                                {steps.map((step, sIdx) => (
                                    <div key={sIdx} className="flex items-center gap-1.5 shrink-0">
                                        <span className={`w-3 h-3 rounded-full inline-block ${
                                            step.isTerminal ? 'bg-red-500' : (step.active ? 'bg-primary' : 'bg-gray-300')
                                        }`}></span>
                                        <span className={`${step.current ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                            {step.label}
                                        </span>
                                        {sIdx < steps.length - 1 && <span className="text-gray-300 mx-1">→</span>}
                                    </div>
                                ))}
                            </div>

                            {order.items.map((item, itemIndex)=>{
                                const name = item.name || item.product?.name || "Product Item";
                                const category = item.product?.category || "Grocery";
                                const image = item.image || item.product?.image?.[0] || assets.box_icon;
                                const price = item.price || item.product?.offerPrice || 0;
                                const quantity = item.quantity || 1;

                                return (
                                    <div key={itemIndex}
                                    className={`relative bg-white text-gray-500 ${order.items.length !== itemIndex + 1 && "border-b"} border-gray-200 flex flex-col md:flex-row md:items-center justify-between p-4 py-3 md:gap-16 w-full max-w-4xl`} >
                                        <div className='flex items-center mb-4 md:mb-0'>
                                            <div className='bg-primary/10 p-3 rounded-lg flex items-center justify-center w-16 h-16 shrink-0 overflow-hidden'>
                                                <img src={image} alt={name} className='w-full h-full object-contain' />
                                            </div>
                                            <div className='ml-4'>
                                                <h2 className='text-base md:text-lg font-medium text-gray-800'>{name}</h2>
                                                <p className='text-xs md:text-sm text-gray-500'>Category: {category}</p>
                                            </div>
                                        </div>

                                        <div className='flex flex-col justify-center text-xs md:text-sm text-gray-500 md:ml-8 mb-4 md:mb-0'>
                                            <p>Qty: {quantity}</p>
                                            <p>Status: <span className="font-semibold text-primary">{order.status}</span></p>
                                            <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>

                                        <p className='text-primary text-base md:text-lg font-medium'>
                                            {currency}{price * quantity}
                                        </p>
                                    </div>
                                );
                            })}

                            <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap justify-between items-center gap-3">
                                <span className="text-xs text-gray-500">Need help? Contact Customer Support at support@shreeshyammart.dev</span>
                                <button
                                    onClick={() => handleReorder(order._id)}
                                    disabled={reorderingId === order._id}
                                    className="px-4 py-2 bg-primary text-white text-xs md:text-sm font-medium rounded hover:bg-primary-dull transition disabled:opacity-50"
                                >
                                    {reorderingId === order._id ? "Processing Reorder..." : "Reorder Available Items"}
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    )
}

export default MyOrders

