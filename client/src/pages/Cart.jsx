import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import toast from "react-hot-toast";
import { HugeiconsIcon } from '@hugeicons/react';
import { ShoppingCart01Icon, Delete02Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

const Cart = () => {
    const {products, currency, cartItems, removeFromCart, getCartCount, updateCartItem, navigate, getCartAmount, axios, user, setCartItems, setShowUserLogin} = useAppContext()


    const [cartArray, setCartArray] = useState([])
    const [addresses, setAddresses] = useState([])
    const [showAddress, setShowAddress] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState(null)

    const getCart = ()=>{
        let tempArray = []
        for(const key in cartItems){
            const product = products.find((item)=>item._id === key)
            if (product && cartItems[key] > 0) {
                tempArray.push({
                    ...product,
                    quantity: cartItems[key]
                })
            }
        }
        setCartArray(tempArray)
    }

    const getUserAddress = async ()=>{
        try {
            const {data} = await axios.get('/api/address/get');
            if(data.success){
                setAddresses(data.addresses)
                if(data.addresses.length > 0){
                    setSelectedAddress(data.addresses[0])
                }
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const placeOrder = async ()=>{
        try {
            if(!selectedAddress){
                return toast.error("Please select an address")
            }
            if(cartArray.length === 0){
                return toast.error("Your cart is empty")
            }
            
            // Place Order with COD
            const {data} = await axios.post('/api/order/cod', {
                items: cartArray.map(item=> ({product: item._id, quantity: item.quantity})),
                address: selectedAddress._id
            })

            if(data.success){
                toast.success(data.message)
                setCartItems({})
                navigate('/my-orders')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        if(products.length > 0 && cartItems){
            getCart()
        }
    },[products, cartItems])

    useEffect(()=>{
        if(user){
            getUserAddress();
        }
    },[user]);
    
    if (cartArray.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 mt-8">
                <HugeiconsIcon icon={ShoppingCart01Icon} size={80} className="text-gray-300 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800">Your Cart is Empty</h2>
                <p className="text-gray-500 mt-2 max-w-md">Looks like you haven't added any items to your cart yet.</p>
                <button onClick={()=> { navigate("/products"); scrollTo(0,0) }} className="mt-6 px-8 py-3 bg-primary text-white font-medium rounded hover:bg-primary-dull transition cursor-pointer">
                    Start Shopping
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col md:flex-row mt-16">
            <div className='flex-1 max-w-4xl'>
                <h1 className="text-3xl font-medium mb-6">
                    Shopping Cart <span className="text-sm text-primary">{getCartCount()} Items</span>
                </h1>

                <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
                    <p className="text-left">Product Details</p>
                    <p className="text-center">Subtotal</p>
                    <p className="text-center">Action</p>
                </div>

                {cartArray.map((product, index) => (
                    <div key={index} className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3">
                        <div className="flex items-center md:gap-6 gap-3">
                            <div onClick={()=>{
                                navigate(`/products/${product.category.toLowerCase()}/${product._id}`); scrollTo(0,0)
                            }} className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded overflow-hidden">
                                <img className="max-w-full h-full object-cover" src={product.image[0]} alt={product.name} />
                            </div>
                            <div>
                                <p className="hidden md:block font-semibold">{product.name}</p>
                                <div className="font-normal text-gray-500/70">
                                    <p>Weight: <span>{product.weight || "N/A"}</span></p>
                                    <div className='flex items-center'>
                                        <p>Qty:</p>
                                        <select onChange={e=> updateCartItem(product._id, Number(e.target.value))} value={cartItems[product._id]} 
                                                        className='outline-none'>
                                            {Array(cartItems[product._id] > 9 ? cartItems[product._id] : 9).fill('').map((_, index) => (
                                                <option key={index} value={index + 1}>{index + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center">{currency}{product.offerPrice * product.quantity}</p>
                        <button onClick={()=> removeFromCart(product._id)} className="cursor-pointer mx-auto p-1 hover:bg-red-50 rounded transition">
                            <HugeiconsIcon icon={Delete02Icon} size={22} className="text-red-500 hover:text-red-700" />
                        </button>
                    </div>)
                )}

                <button onClick={()=> {navigate("/products"); scrollTo(0,0)}}className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium">
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} className="group-hover:-translate-x-1 transition rotate-180" />
                    Continue Shopping
                </button>

            </div>

            <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70 rounded-xl">
                <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
                <hr className="border-gray-300 my-5" />

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase tracking-wide text-gray-700">Delivery Address</p>
                    
                    {!user ? (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm space-y-2">
                            <p className="text-amber-800 text-xs font-medium">Please log in to add or select a delivery address.</p>
                            <button 
                                onClick={() => setShowUserLogin(true)} 
                                className="w-full py-2 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary-dull transition cursor-pointer"
                            >
                                Log In / Register
                            </button>
                        </div>
                    ) : selectedAddress ? (
                        <div className="relative mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800 text-xs">
                                        {selectedAddress.firstName} {selectedAddress.lastName} ({selectedAddress.phone})
                                    </p>
                                    <p className="text-gray-600 text-xs mt-1 leading-snug">
                                        {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.zipcode}, {selectedAddress.country}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setShowAddress(!showAddress)} 
                                    className="text-xs text-primary font-bold hover:underline cursor-pointer shrink-0 ml-2"
                                >
                                    {showAddress ? "Close" : "Change"}
                                </button>
                            </div>

                            {showAddress && (
                                <div className="absolute left-0 right-0 top-full mt-1.5 py-1 bg-white border border-gray-300 rounded-lg text-sm z-30 shadow-lg max-h-52 overflow-y-auto">
                                    {addresses.map((address, index) => (
                                        <div 
                                            key={index} 
                                            onClick={() => {
                                                setSelectedAddress(address);
                                                setShowAddress(false);
                                            }} 
                                            className={`p-2.5 text-xs text-gray-700 hover:bg-primary/10 cursor-pointer border-b border-gray-100 last:border-0 ${selectedAddress._id === address._id ? 'bg-primary/5 font-semibold text-primary' : ''}`}
                                        >
                                            <p className="font-bold">{address.firstName} {address.lastName} ({address.phone})</p>
                                            <p className="truncate">{address.street}, {address.city}, {address.state}</p>
                                        </div>
                                    ))}
                                    <div 
                                        onClick={() => {
                                            setShowAddress(false);
                                            navigate("/add-address");
                                        }} 
                                        className="p-2.5 text-xs text-center font-bold text-primary hover:bg-primary/10 cursor-pointer border-t border-gray-200"
                                    >
                                        + Add New Address
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-2 p-3 bg-white border border-dashed border-gray-300 rounded-lg text-center space-y-2">
                            <p className="text-gray-500 text-xs">No address found</p>
                            <button 
                                onClick={() => navigate("/add-address")} 
                                className="px-4 py-2 bg-primary/10 border border-primary/40 text-primary text-xs font-bold rounded-md hover:bg-primary/20 transition cursor-pointer"
                            >
                                + Add Delivery Address
                            </button>
                        </div>
                    )}

                    <p className="text-sm font-medium uppercase mt-6">Payment Method</p>

                    <div className="flex items-center gap-2 mt-2 px-3 py-2.5 bg-white border border-gray-300 rounded text-sm text-gray-700">
                        <span className="text-primary font-bold">●</span>
                        <span className="font-medium">Cash on Delivery</span>
                    </div>
                </div>


                <hr className="border-gray-300" />

                <div className="text-gray-500 mt-4 space-y-2">
                    <p className="flex justify-between">
                        <span>Price</span><span>{currency}{getCartAmount()}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Shipping Fee</span><span className="text-green-600">Free</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Tax (2%)</span><span>{currency}{getCartAmount() * 2 / 100}</span>
                    </p>
                    <p className="flex justify-between text-lg font-medium mt-3">
                        <span>Total Amount:</span><span>
                            {currency}{getCartAmount() + getCartAmount() * 2 / 100}</span>
                    </p>
                </div>

                <button onClick={placeOrder} className="w-full py-3 mt-6 cursor-pointer bg-primary text-white font-medium hover:bg-primary-dull transition">
                    Place Order
                </button>
            </div>
        </div>
    )

}

export default Cart;