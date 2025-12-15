import React, { useState, useEffect, useRef } from 'react';
import { Card, Rarity, UserCard } from '../types';

interface CardDisplayProps {
  card: Card;
  userCard?: UserCard;
  onClick?: () => void;
  onFavoriteClick?: (e: React.MouseEvent) => void;
  showDetails?: boolean;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
}

const RarityColors: Record<Rarity, string> = {
  [Rarity.R]: 'border-gray-400 bg-gray-50',
  [Rarity.SR]: 'border-blue-400 bg-blue-50',
  [Rarity.SSR]: 'border-yellow-400 bg-yellow-50 shadow-[0_0_15px_rgba(250,204,21,0.5)]',
  [Rarity.UR]: 'border-purple-500 bg-purple-50 shadow-[0_0_20px_rgba(168,85,247,0.7)] animate-glow',
};

export const CardDisplay: React.FC<CardDisplayProps> = ({ card, userCard, onClick, onFavoriteClick, showDetails, selected, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-24 h-36 text-xs',
    md: 'w-32 h-48 text-sm',
    lg: 'w-64 h-96 text-base',
    responsive: 'w-full aspect-[2/3] text-sm',
  };

  // Animation logic
  const [animate, setAnimate] = useState<'level' | 'dupe' | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const prevLevel = useRef(userCard?.level);
  const prevDupes = useRef(userCard?.duplicates);

  // Image Handling
  const placeholderUrl = `https://image.pollinations.ai/prompt/anime%20art%20of%20${encodeURIComponent(card.name)}%20from%20bungou%20stray%20dogs,%20official%20art?width=300&height=450&nologo=true&model=flux&seed=${card.id}`;
  const staticFallback = `https://placehold.co/300x450/1e293b/ffffff?text=${encodeURIComponent(card.name.substring(0, 10))}`;
  const [imgSrc, setImgSrc] = useState(card.imageUrl || placeholderUrl);

  useEffect(() => {
    if (userCard) {
      if (prevLevel.current !== undefined && userCard.level > prevLevel.current) {
        setAnimate('level');
        const timer = setTimeout(() => setAnimate(null), 800);
        return () => clearTimeout(timer);
      }
      if (prevDupes.current !== undefined && userCard.duplicates > prevDupes.current) {
        setAnimate('dupe');
        const timer = setTimeout(() => setAnimate(null), 800); 
        return () => clearTimeout(timer);
      }
      prevLevel.current = userCard.level;
      prevDupes.current = userCard.duplicates;
    }
  }, [userCard?.level, userCard?.duplicates]);

  useEffect(() => {
      setImgSrc(card.imageUrl || placeholderUrl);
  }, [card.imageUrl, placeholderUrl]);

  let animationClasses = 'hover:scale-105 hover:shadow-2xl hover:brightness-105 hover:z-30 duration-300 ease-out transition-all';
  if (animate === 'level') {
    animationClasses = 'scale-110 ring-4 ring-green-500 shadow-[0_0_30px_rgba(34,197,94,0.6)] z-30 duration-500 ease-out';
  } else if (animate === 'dupe') {
    animationClasses = 'animate-dupe-pulse z-30 ring-4 ring-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.6)] duration-300';
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (onClick) {
        onClick();
        setIsFlipped(prev => !prev); 
    } else {
        setIsFlipped(prev => !prev);
    }
  };

  return (
    <div 
      className={`
        group perspective-1000 relative rounded-xl border-4 cursor-pointer flex flex-col select-none
        ${RarityColors[card.rarity]}
        ${selected ? 'ring-4 ring-offset-2 ring-sky-700' : ''}
        ${sizeClasses[size]}
        ${animationClasses}
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* === FRONT FACE === */}
        <div className="absolute inset-0 backface-hidden flex flex-col overflow-hidden rounded-lg bg-white">
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${animate ? 'opacity-40' : 'opacity-0'} z-20 ${animate === 'dupe' ? 'bg-cyan-300' : 'bg-white'}`} />

          {animate === 'dupe' && (
            <div className="absolute inset-0 flex items-center justify-center z-30 animate-pop pointer-events-none">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black text-[10px] md:text-xs px-3 py-1 rounded-full shadow-lg border-2 border-white transform -rotate-12 whitespace-nowrap">
                    LIMIT BREAK!
                </div>
            </div>
          )}

          <div className="absolute top-1 left-1 z-10 bg-black/70 text-white px-2 py-0.5 rounded-full font-bold text-[10px] shadow-sm">
            {card.rarity}
          </div>

          {/* Favorite Indicator / Toggle */}
          {userCard && (
            <div 
                onClick={onFavoriteClick ? onFavoriteClick : undefined}
                className={`absolute top-1 right-1 z-30 transition-transform hover:scale-125 ${onFavoriteClick ? 'cursor-pointer' : ''}`}
            >
              {userCard.isFavorite ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500 drop-shadow-md">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
              ) : (onFavoriteClick ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white drop-shadow-md">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
              ) : null)}
            </div>
          )}

          <div className="flex-grow relative bg-gray-200 overflow-hidden h-[70%]">
            <img 
              src={imgSrc} 
              onError={(e) => {
                  if (imgSrc !== staticFallback) setImgSrc(staticFallback);
              }}
              alt={card.name} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {userCard && (
               <div className={`absolute bottom-0 right-0 bg-sky-600 text-white px-2 py-0.5 text-[10px] font-bold rounded-tl-lg transition-transform duration-300 ${animate === 'level' ? 'scale-150 bg-green-500 origin-bottom-right' : ''}`}>
                 Lv.{userCard.level}
               </div>
            )}
          </div>

          <div className="bg-white/95 p-1 text-center h-[30%] flex flex-col justify-center items-center relative z-10 border-t border-gray-100">
            <h3 className="font-bold text-slate-900 leading-tight w-full truncate px-1 text-[11px] md:text-xs">{card.name}</h3>
            {showDetails && (
              <div className="text-[10px] text-slate-500 w-full">
                <p className="truncate px-1 opacity-75">{card.tags[0]}</p>
                {userCard && userCard.duplicates > 0 && (
                    <p className={`text-green-600 font-bold transition-transform duration-300 mt-0.5 ${animate === 'dupe' ? 'scale-150 text-cyan-600' : ''}`}>
                      LB READY
                    </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === BACK FACE === */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-lg overflow-hidden bg-white/95 backdrop-blur flex flex-col p-2 text-center border-2 border-dashed border-sky-200 shadow-inner">
           <div className="flex-1 flex flex-col items-center gap-1 overflow-hidden">
             <div className="text-[10px] font-bold text-sky-600 uppercase tracking-widest border-b border-sky-100 w-full shrink-0">Stats</div>
             
             <div className="grid grid-cols-2 gap-1 w-full text-[10px] shrink-0">
               <div className="bg-red-50 p-0.5 rounded border border-red-100 flex flex-col items-center">
                 <span className="block text-red-400 font-bold text-[9px] flex items-center gap-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                        <path fillRule="evenodd" d="M15.75 2.25H21a.75.75 0 01.75.75v5.25a.75.75 0 01-1.5 0V4.81L8.03 17.03a.75.75 0 01-1.06-1.06L19.19 3.75h-3.44a.75.75 0 010-1.5zm-10.5 4.5a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V10.5a.75.75 0 011.5 0v8.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V8.25a3 3 0 013-3h8.25a.75.75 0 010 1.5H5.25z" clipRule="evenodd" />
                    </svg>
                    ATK
                 </span>
                 <span className="text-slate-700 font-mono">{card.baseStats.attack + (userCard ? userCard.level * 10 : 0)}</span>
               </div>
               <div className="bg-green-50 p-0.5 rounded border border-green-100 flex flex-col items-center">
                 <span className="block text-green-400 font-bold text-[9px] flex items-center gap-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                    HP
                 </span>
                 <span className="text-slate-700 font-mono">{card.baseStats.health + (userCard ? userCard.level * 50 : 0)}</span>
               </div>
             </div>

             <div className="text-[10px] font-bold text-purple-600 uppercase tracking-widest border-b border-purple-100 w-full mt-1 shrink-0">Skill</div>
             <div className="overflow-y-auto w-full no-scrollbar flex-1 flex flex-col items-center">
                <p className="text-[10px] font-bold text-slate-800 leading-tight">{card.skill.type.replace('_', ' ')}</p>
                <p className="text-[9px] text-slate-500 leading-tight italic my-1">{card.skill.description}</p>
                <div className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[9px] font-bold inline-block mb-1">
                    Val: {card.skill.value}x
                </div>
             </div>
           </div>
           
           <div className="mt-auto pt-1 text-[8px] text-slate-400 italic border-t border-slate-100 truncate w-full shrink-0">
             "{card.description}"
           </div>
        </div>

      </div>
    </div>
  );
};