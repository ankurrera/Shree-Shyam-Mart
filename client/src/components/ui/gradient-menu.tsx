import React from 'react';
import { IoHomeOutline, IoVideocamOutline, IoCameraOutline, IoShareSocialOutline, IoHeartOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';

export interface GradientMenuItem {
  title: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  path?: string;
  badge?: number | string;
  onClick?: () => void;
}

const defaultMenuItems: GradientMenuItem[] = [
  { title: 'Home', icon: <IoHomeOutline />, gradientFrom: '#a955ff', gradientTo: '#ea51ff' },
  { title: 'Video', icon: <IoVideocamOutline />, gradientFrom: '#56CCF2', gradientTo: '#2F80ED' },
  { title: 'Photo', icon: <IoCameraOutline />, gradientFrom: '#FF9966', gradientTo: '#FF5E62' },
  { title: 'Share', icon: <IoShareSocialOutline />, gradientFrom: '#80FF72', gradientTo: '#7EE8FA' },
  { title: 'Tym', icon: <IoHeartOutline />, gradientFrom: '#ffa9c6', gradientTo: '#f434e2' }
];

export interface GradientMenuProps {
  items?: GradientMenuItem[];
  className?: string;
  containerClassName?: string;
  activePath?: string;
}

export default function GradientMenu({
  items = defaultMenuItems,
  className = '',
  containerClassName = '',
  activePath
}: GradientMenuProps) {
  return (
    <div className={`flex justify-center items-center ${containerClassName}`}>
      <ul className={`flex items-center gap-2 sm:gap-4 md:gap-6 ${className}`}>
        {items.map((item, idx) => {
          const isActive = activePath && item.path ? activePath === item.path : false;
          const { title, icon, gradientFrom, gradientTo, path, badge, onClick } = item;

          const content = (
            <>
              {/* Gradient background on hover/active */}
              <span 
                className={`absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] transition-all duration-500 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              ></span>

              {/* Blur glow */}
              <span 
                className={`absolute top-[8px] inset-x-0 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[12px] -z-10 transition-all duration-500 ${
                  isActive ? 'opacity-60' : 'opacity-0 group-hover:opacity-50'
                }`}
              ></span>

              {/* Badge (e.g. for cart items) */}
              {badge !== undefined && Number(badge) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 z-20 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center shadow-xs">
                  {badge}
                </span>
              )}

              {/* Icon */}
              <span 
                className={`relative z-10 transition-all duration-500 delay-0 ${
                  isActive 
                    ? 'scale-0' 
                    : 'group-hover:scale-0'
                }`}
              >
                <span className={`text-xl sm:text-2xl ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-white'}`}>
                  {icon}
                </span>
              </span>

              {/* Title */}
              <span 
                className={`absolute text-white uppercase font-bold tracking-wider text-[11px] sm:text-xs transition-all duration-500 delay-100 ${
                  isActive 
                    ? 'scale-100' 
                    : 'scale-0 group-hover:scale-100'
                }`}
              >
                {title}
              </span>
            </>
          );

          return (
            <li
              key={idx}
              style={{ '--gradient-from': gradientFrom, '--gradient-to': gradientTo } as React.CSSProperties}
              className={`relative h-[48px] sm:h-[54px] bg-white/95 backdrop-blur-md shadow-lg rounded-full flex items-center justify-center transition-all duration-500 group cursor-pointer ${
                isActive 
                  ? 'w-[100px] sm:w-[130px] shadow-none' 
                  : 'w-[48px] sm:w-[54px] hover:w-[110px] sm:hover:w-[140px] hover:shadow-none'
              }`}
            >
              {path ? (
                <Link 
                  to={path} 
                  onClick={onClick}
                  className="w-full h-full flex items-center justify-center relative rounded-full"
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onClick}
                  className="w-full h-full flex items-center justify-center relative rounded-full focus:outline-none"
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
