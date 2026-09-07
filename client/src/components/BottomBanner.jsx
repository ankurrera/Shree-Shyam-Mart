import React from 'react';
import { assets } from '../assets/assets';
import { HugeiconsIcon } from '@hugeicons/react';
import { DeliveryTruck01Icon, Leaf01Icon, Coins01Icon, ShieldCheckIcon } from '@hugeicons/core-free-icons';

const featureList = [
  {
    icon: DeliveryTruck01Icon,
    title: "Fastest Delivery",
    description: "Groceries delivered in under 30 minutes.",
    shortDesc: "Under 30 mins",
  },
  {
    icon: Leaf01Icon,
    title: "Freshness Guaranteed",
    description: "Fresh produce straight from the source.",
    shortDesc: "Direct from source",
  },
  {
    icon: Coins01Icon,
    title: "Affordable Prices",
    description: "Quality groceries at unbeatable prices.",
    shortDesc: "Unbeatable rates",
  },
  {
    icon: ShieldCheckIcon,
    title: "Trusted by Thousands",
    description: "Loved by 10,000+ happy customers.",
    shortDesc: "10,000+ buyers",
  },
];

const BottomBanner = () => {
  return (
    <section aria-label="Why We Are the Best" className="mt-16 md:mt-24">
      {/* ===================================================================
          DESKTOP VIEW (md and up): Wide landscape banner with right-aligned cards
          =================================================================== */}
      <div className="hidden md:block relative rounded-3xl overflow-hidden shadow-xs border border-slate-200/80">
        <img 
          src={assets.bottom_banner_image} 
          alt="Shree Shyam Mart - Why We Are the Best" 
          className="w-full object-cover" 
        />

        <div className="absolute inset-0 flex flex-col justify-center items-end pr-10 lg:pr-24 xl:pr-36">
          <div className="max-w-md w-full space-y-3">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 border border-emerald-200 text-xs font-bold text-emerald-800 tracking-wide">
                🌿 Our Guarantee
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-heading tracking-tight mt-2">
                Why We Are the Best?
              </h2>
            </div>

            <div className="space-y-2.5 pt-1">
              {featureList.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/70 shadow-2xs hover:bg-white hover:shadow-xs transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                    <HugeiconsIcon icon={feature.icon} size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================
          MOBILE VIEW (phone): Clean 2x2 compact pills in the top zone.
          Leaves the deity artwork, flowers, and grocery basket 100% visible
          without any overlap!
          =================================================================== */}
      <div className="block md:hidden relative rounded-3xl overflow-hidden shadow-xs border border-slate-200/80 bg-amber-50/30">
        <img 
          src={assets.bottom_banner_image_sm} 
          alt="Shree Shyam Mart - Why We Are the Best" 
          className="w-full object-cover" 
        />

        {/* Compact, non-overlapping header & 2x2 feature grid */}
        <div className="absolute inset-x-0 top-0 pt-4 px-3 flex flex-col items-center">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-emerald-200/80 text-[10px] font-bold text-emerald-800 shadow-2xs">
            ★ Shree Shyam Mart Promise
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 font-heading tracking-tight mt-1 text-center drop-shadow-xs">
            Why We Are the Best?
          </h2>

          {/* 2x2 Grid restricted strictly to the top whitespace */}
          <div className="grid grid-cols-2 gap-2 mt-2.5 w-full max-w-sm">
            {featureList.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/92 backdrop-blur-md p-2 rounded-xl border border-white/90 shadow-2xs flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={feature.icon} size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[11px] font-bold text-slate-900 leading-tight truncate font-heading">
                    {feature.title}
                  </h3>
                  <p className="text-[9.5px] text-slate-600 leading-tight mt-0.5 truncate">
                    {feature.shortDesc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BottomBanner;
