import React from 'react'
import { categories } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Categories = () => {
    const { navigate } = useAppContext();

    return (
        <div className='my-12 font-sans'>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className='text-xl md:text-2xl font-bold text-slate-800 tracking-tight'>Categories</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Explore fresh everyday essentials</p>
                </div>
            </div>

            {/* Single-line horizontal scroll container */}
            <div className='flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-2 scroll-smooth flex-nowrap'>
                {categories.map((category, index) => (
                    <div 
                        key={index} 
                        className='group cursor-pointer shrink-0 w-32 sm:w-36 p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center text-center'
                        onClick={() => {
                            navigate(`/products/${category.path.toLowerCase()}`);
                            scrollTo(0, 0);
                        }}
                    >
                        <div 
                            className="w-14 h-14 rounded-xl flex items-center justify-center p-2.5 mb-2.5 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: category.bgColor }}
                        >
                            <img 
                                src={category.image} 
                                alt={category.text} 
                                className='w-full h-full object-contain'
                            />
                        </div>
                        <p className='text-xs font-semibold text-slate-700 group-hover:text-primary transition-colors truncate w-full'>
                            {category.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Categories;


