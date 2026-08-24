import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

// input field component 
const InputField = ({ type, placeholder, name, handleChange, address }) => (
    <input 
        className='w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none text-gray-700 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition'
        type={type}
        placeholder={placeholder}
        onChange={handleChange}
        name={name}
        value={address[name] || ''}
        required
    />
)

const AddAddress = () => {
    const { axios, user, navigate, setShowUserLogin } = useAppContext();

    const [address, setAddress] = useState({
        firstName: '',
        lastName: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        phone: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            const nameParts = (user.name || '').trim().split(' ');
            setAddress(prev => ({
                ...prev,
                firstName: prev.firstName || nameParts[0] || '',
                lastName: prev.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
                email: prev.email || user.email || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAddress((prevAddress) => ({
            ...prevAddress,
            [name]: value,  
        }));
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please log in to save address");
            setShowUserLogin(true);
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await axios.post('/api/address/add', { address });
            if (data.success) {
                toast.success(data.message || "Address saved successfully!");
                navigate('/cart');
            } else {
                toast.error(data.message || "Failed to save address");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to save address");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className='mt-12 pb-16 max-w-4xl mx-auto px-4'>
            <p className='text-2xl md:text-3xl text-gray-700 font-semibold'>
                Add Shipping <span className='font-bold text-primary'>Address</span>
            </p>

            {!user && (
                <div className='mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-sm'>
                    <span className='text-amber-800 font-medium'>You need to log in to save shipping address.</span>
                    <button 
                        onClick={() => setShowUserLogin(true)}
                        className='px-4 py-1.5 bg-primary text-white text-xs font-bold rounded hover:bg-primary-dull transition cursor-pointer'
                    >
                        Log In Now
                    </button>
                </div>
            )}

            <div className='flex flex-col-reverse md:flex-row justify-between gap-10 mt-8'>
                <div className='flex-1 max-w-md'>
                    <form onSubmit={onSubmitHandler} className='space-y-3.5 text-sm'>
                        <div className='grid grid-cols-2 gap-4'>
                            <InputField handleChange={handleChange} address={address} name='firstName' type="text" placeholder="First Name" />
                            <InputField handleChange={handleChange} address={address} name='lastName' type="text" placeholder="Last Name" />
                        </div>
                        <InputField handleChange={handleChange} address={address} name='email' type="email" placeholder="Email Address" />
                        <InputField handleChange={handleChange} address={address} name='street' type="text" placeholder="Street Address" />

                        <div className='grid grid-cols-2 gap-4'>
                            <InputField handleChange={handleChange} address={address} name='city' type="text" placeholder="City" />
                            <InputField handleChange={handleChange} address={address} name='state' type="text" placeholder="State" />
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <InputField handleChange={handleChange} address={address} name='zipcode' type="number" placeholder="Zip code" />
                            <InputField handleChange={handleChange} address={address} name='country' type="text" placeholder="Country" />
                        </div>

                        <InputField handleChange={handleChange} address={address} name='phone' type="text" placeholder="Phone Number" />

                        <button 
                            disabled={submitting}
                            type="submit"
                            className='w-full mt-6 bg-primary text-white py-3 font-bold rounded-lg hover:bg-primary-dull transition cursor-pointer uppercase shadow-xs disabled:opacity-50'
                        >
                            {submitting ? "Saving Address..." : "Save Address"}
                        </button>
                    </form>
                </div>
                <div className='hidden md:flex flex-1 items-center justify-center'>
                    <img className='max-w-xs object-contain' src={assets.add_address_iamge} alt="Add Address" />
                </div>
            </div>
        </div>
    );
};

export default AddAddress;

