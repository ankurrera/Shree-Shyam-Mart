// import React from 'react'
// import { categories } from '../assets/assets'
// import { useAppContext } from '../context/AppContext'

// const Categories = () => {
//     const { navigate } = useAppContext();

//     return (
//         <div className='my-12 font-sans'>
//             <div className="flex items-center justify-between mb-5">
//                 <div>
//                     <h2 className='text-xl md:text-2xl font-bold text-slate-800 tracking-tight'>Categories</h2>
//                     <p className="text-xs text-slate-500 mt-0.5">Explore fresh everyday essentials</p>
//                 </div>
//             </div>

//             {/* Single-line horizontal scroll container */}
//             <div className='flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-2 scroll-smooth flex-nowrap'>
//                 {categories.map((category, index) => (
//                     <div 
//                         key={index} 
//                         className='group cursor-pointer shrink-0 w-32 sm:w-36 p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center text-center'
//                         onClick={() => {
//                             navigate(`/products/${category.path.toLowerCase()}`);
//                             scrollTo(0, 0);
//                         }}
//                     >
//                         <div 
//                             className="w-14 h-14 rounded-xl flex items-center justify-center p-2.5 mb-2.5 transition-transform group-hover:scale-105"
//                             style={{ backgroundColor: category.bgColor }}
//                         >
//                             <img 
//                                 src={category.image} 
//                                 alt={category.text} 
//                                 className='w-full h-full object-contain'
//                             />
//                         </div>
//                         <p className='text-xs font-semibold text-slate-700 group-hover:text-primary transition-colors truncate w-full'>
//                             {category.text}
//                         </p>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default Categories;
import React, { useEffect, useRef, useState } from 'react'
import { categories } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Categories = () => {
    const { navigate } = useAppContext();

    const categoriesRef = useRef(null);

    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    // Check which arrows should be visible
    const checkScroll = () => {
        const container = categoriesRef.current;

        if (!container) return;

        const atStart = container.scrollLeft <= 5;

        const atEnd =
            container.scrollLeft + container.clientWidth >=
            container.scrollWidth - 5;

        setShowLeftArrow(!atStart);
        setShowRightArrow(!atEnd);
    };

    useEffect(() => {
        checkScroll();

        const container = categoriesRef.current;

        if (!container) return;

        container.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        return () => {
            container.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, []);

    // Scroll left
    const scrollLeft = () => {
        const container = categoriesRef.current;

        if (!container) return;

        container.scrollBy({
            left: -350,
            behavior: 'smooth'
        });
    };

    // Scroll right
    const scrollRight = () => {
        const container = categoriesRef.current;

        if (!container) return;

        container.scrollBy({
            left: 350,
            behavior: 'smooth'
        });
    };

    return (
        <div className='my-12 font-sans'>

            {/* Heading */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className='text-xl md:text-2xl font-bold text-slate-800 tracking-tight'>
                        Categories
                    </h2>

                    <p className="text-xs text-slate-500 mt-0.5">
                        Explore fresh everyday essentials
                    </p>
                </div>
            </div>

            {/* Categories wrapper */}
            <div className='relative'>

                {/* Categories */}
                <div
                    ref={categoriesRef}
                    className='flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-2 scroll-smooth flex-nowrap'
                >
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

                {/* LEFT FADE */}
                {showLeftArrow && (
                    <div className='pointer-events-none absolute left-0 top-0 bottom-2 w-20 bg-gradient-to-r from-white via-white/80 to-transparent z-10' />
                )}

                {/* RIGHT FADE */}
                {showRightArrow && (
                    <div className='pointer-events-none absolute right-0 top-0 bottom-2 w-20 bg-gradient-to-l from-white via-white/80 to-transparent z-10' />
                )}

                {/* LEFT ARROW */}
                {showLeftArrow && (
                    <button
                        onClick={scrollLeft}
                        aria-label="Show previous categories"
                        className='absolute left-1 top-1/2 -translate-y-1/2 z-20
                        w-11 h-11 rounded-full
                        bg-white border border-slate-200
                        shadow-lg
                        flex items-center justify-center
                        text-slate-700
                        hover:bg-slate-50 hover:scale-105
                        active:scale-95
                        transition-all duration-200'
                    >
                        <span className='text-2xl font-medium leading-none'>
                            ←
                        </span>
                    </button>
                )}

                {/* RIGHT ARROW */}
                {showRightArrow && (
                    <button
                        onClick={scrollRight}
                        aria-label="Show more categories"
                        className='absolute right-1 top-1/2 -translate-y-1/2 z-20
                        w-11 h-11 rounded-full
                        bg-white border border-slate-200
                        shadow-lg
                        flex items-center justify-center
                        text-slate-700
                        hover:bg-slate-50 hover:scale-105
                        active:scale-95
                        transition-all duration-200'
                    >
                        <span className='text-2xl font-medium leading-none'>
                            →
                        </span>
                    </button>
                )}

            </div>
        </div>
    );
};

export default Categories;
