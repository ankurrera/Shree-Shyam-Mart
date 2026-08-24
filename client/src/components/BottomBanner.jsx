import React from 'react'
import { assets } from '../assets/assets'
import { HugeiconsIcon } from '@hugeicons/react';
import { DeliveryTruck01Icon, Leaf01Icon, Coins01Icon, ShieldCheckIcon } from '@hugeicons/core-free-icons';

const featureList = [
  {
    icon: DeliveryTruck01Icon,
    title: "Fastest Delivery",
    description: "Groceries delivered in under 30 minutes.",
  },
  {
    icon: Leaf01Icon,
    title: "Freshness Guaranteed",
    description: "Fresh produce straight from the source.",
  },
  {
    icon: Coins01Icon,
    title: "Affordable Prices",
    description: "Quality groceries at unbeatable prices.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Trusted by Thousands",
    description: "Loved by 10,000+ happy customers.",
  },
];

const BottomBanner = () => {
  return (
    <div className ='relative mt-24'>
      <img src={assets.bottom_banner_image} alt="banner" className='w-full hidden md:block' />
      <img src={assets.bottom_banner_image_sm} alt="banner" className='w-full md:hidden' />

      <div className ='absolute inset-0 flex flex-col items-center md:items-end md:justify-center pt-16 md:pt-0 md:pr-24'>
        <div>
            <h1 className='text-2xl md:text-3xl font-semibold text-primary mb-6'>Why We Are the Best?</h1>
            {featureList.map((feature, index)=>(
                <div key={index} className='flex items-center gap-4 mt-2'>
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <HugeiconsIcon icon={feature.icon} size={24} />
                    </div>
                    <div>
                        <h3 className='text-lg md:text-xl font-semibold'>{feature.title}</h3>
                        <p className='text-gray-500/70 text-xs md:text-sm'>{feature.description}</p>
                    </div>
                    
                </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default BottomBanner
