import React, { useState } from 'react';
import { Card, UserCard, Rarity } from '../../types';

interface CardDetailViewProps {
  card: Card;
  userCard?: UserCard;
  coins: number;
  onLevelUp: () => void;
  onLimitBreak: () => void;
  onBack: () => void;
  onToggleTeam: () => void;
  onToggleFavorite: () => void;
  onRetire: () => void;
  isInTeam: boolean;
}

const RarityColors: Record<Rarity, string> = {
    [Rarity.R]: 'text-gray-500',
    [Rarity.SR]: 'text-blue-500',
    [Rarity.SSR]: 'text-yellow-500',
    [Rarity.UR]: 'text-purple-500',
};

export const CardDetailView: React.FC<CardDetailViewProps> = ({ card, userCard, coins, onLevelUp, onLimitBreak, onBack, onToggleTeam, onToggleFavorite, onRetire, isInTeam }) => {
  const [tab, setTab] = useState<'info' | 'story'>('info');

  // Calculate current stats
  const level = userCard?.level || 1;
  const isMaxLevel = level >= 100;
  const currentAtk = card.baseStats.attack + (level - 1) * 10;
  const currentHp = card.baseStats.health + (level - 1) * 50;
  
  // Level Up Cost Logic
  const nextLevelCost = level * 50;
  const canAfford = coins >= nextLevelCost;

  // Bond Logic
  const currentBond = userCard?.bond || 0;

  return (
    <div className="p-4 max-w-4xl mx-auto animate-pop pb-20">
      <div className="flex justify-between items-center mb-4">
        <button 
            onClick={onBack} 
            className="flex items-center text-sky-600 font-bold hover:text-sky-800 transition"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Collection
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-sky-100 flex flex-col md:flex-row min-h-[600px]">
        {/* Left Column: Image */}
        <div className="w-full md:w-1/2 bg-slate-100 relative group">
          <img 
            src={card.imageUrl} 
            alt={card.name} 
            className="w-full h-[400px] md:h-full object-cover"
            onError={(e) => {
               (e.target as HTMLImageElement).src = `https://placehold.co/300x450/1e293b/ffffff?text=${encodeURIComponent(card.name.substring(0, 10))}`;
            }}
          />
          
          {/* Favorite Toggle Button (Top Right of Image) */}
          {userCard && (
              <button 
                onClick={onToggleFavorite}
                className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition border border-white/50 group-hover:bg-white/40"
              >
                  {userCard.isFavorite ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 drop-shadow-md">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white drop-shadow-md">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                  )}
              </button>
          )}

          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
             <div className="flex items-center gap-2 mb-2">
                 <span className={`px-2 py-0.5 rounded text-xs font-black bg-white/90 ${RarityColors[card.rarity]}`}>{card.rarity}</span>
                 {userCard?.isFavorite && (
                     <span className="animate-pulse flex items-center gap-1 text-xs font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-red-500">
                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                        Favorited
                     </span>
                 )}
             </div>
             <h1 className="text-3xl font-bold">{card.name}</h1>
          </div>
        </div>

        {/* Right Column: Stats & Info & Story */}
        <div className="w-full md:w-1/2 flex flex-col">
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setTab('info')} 
                    className={`flex-1 py-4 font-bold text-sm ${tab === 'info' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    INFO & STATS
                </button>
                <button 
                    onClick={() => setTab('story')} 
                    className={`flex-1 py-4 font-bold text-sm ${tab === 'story' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    STORY & BOND
                </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                {tab === 'info' && (
                    <div className="flex flex-col gap-6">
                        {/* Status Header */}
                        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                            <div className="flex flex-col gap-1">
                                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Status</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-sky-900">Lv. {level}</span>
                                    <span className="text-xs text-slate-400 font-bold">/ 100</span>
                                    {userCard?.duplicates !== undefined && userCard.duplicates > 0 && (
                                        <span className="text-green-500 font-bold text-sm ml-2">LB READY (+{userCard.duplicates})</span>
                                    )}
                                </div>
                                
                                <div className="flex gap-2 mt-2">
                                    {/* Level Up Button */}
                                    {userCard && (
                                        <button 
                                            onClick={onLevelUp}
                                            disabled={!canAfford || isMaxLevel}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition w-fit border ${isMaxLevel ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : canAfford ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70'}`}
                                        >
                                            <span className="flex items-center gap-1">
                                                {isMaxLevel ? 'MAX LEVEL' : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.53 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v5.69a.75.75 0 001.5 0v-5.69l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                                                        </svg>
                                                        Level Up
                                                    </>
                                                )}
                                            </span>
                                            {!isMaxLevel && <span className="bg-white/50 px-1.5 rounded text-[10px]">{nextLevelCost} Coins</span>}
                                        </button>
                                    )}

                                    {/* Limit Break Button */}
                                    {userCard && userCard.duplicates > 0 && (
                                        <button 
                                            onClick={onLimitBreak}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition w-fit border bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200 animate-pulse"
                                            title="Use a duplicate to gain +5 Levels instantly"
                                        >
                                            <span className="flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                                    <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436h.001c-3.698 2.88-8.196 5.263-13.25 5.263-.876 0-1.726-.069-2.548-.198a.75.75 0 01-.65-.75c0-5.055 2.383-9.555 6.084-12.436z" clipRule="evenodd" />
                                                    <path d="M4.786 8.923a13.38 13.38 0 014.887-4.148c.117-.063.2-.178.21-.312.012-.17.24-.22.318-.067.79 1.569 2.149 2.928 3.718 3.718.153.078.102.307-.068.319a.434.434 0 01-.31-.212 13.385 13.385 0 01-4.15 4.888c-.063.117-.178.2-.312.21-.17.012-.22.24-.067.318 1.569.79 2.928 2.149 3.718 3.718.078.153.307.102.319-.068a.434.434 0 01-.212-.31 13.385 13.385 0 014.888-4.15c.117-.063.2-.178.21-.312.012-.17.24-.22.318-.067.79 1.569 2.149 2.928 3.718 3.718.153.078.102.307-.068.319a.434.434 0 01-.31-.212 13.385 13.385 0 01-4.15 4.888c-.063.117-.178.2-.312.21-.17.012-.22.24-.067.318 1.569.79 2.928 2.149 3.718 3.718.078.153.307.102.319-.068a.434.434 0 01-.212-.31z" />
                                                </svg>
                                                Limit Break
                                            </span>
                                            <span className="bg-white/50 px-1.5 rounded text-[10px]">1 Dupe</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            {isInTeam ? (
                                <button onClick={onToggleTeam} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-200 transition">Remove</button>
                            ) : (
                                <button onClick={onToggleTeam} className="bg-sky-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-sky-700 transition shadow-md">Add</button>
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition text-4xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                                        <path fillRule="evenodd" d="M15.75 2.25H21a.75.75 0 01.75.75v5.25a.75.75 0 01-1.5 0V4.81L8.03 17.03a.75.75 0 01-1.06-1.06L19.19 3.75h-3.44a.75.75 0 010-1.5zm-10.5 4.5a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V10.5a.75.75 0 011.5 0v8.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V8.25a3 3 0 013-3h8.25a.75.75 0 010 1.5H5.25z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="block text-red-400 font-bold text-xs uppercase mb-1">Attack Power</span>
                                <span className="text-3xl font-black text-slate-800">{currentAtk}</span>
                                <span className="block text-[10px] text-green-600 font-bold">+10 per level</span>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition text-4xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                    </svg>
                                </div>
                                <span className="block text-green-500 font-bold text-xs uppercase mb-1">Health Points</span>
                                <span className="text-3xl font-black text-slate-800">{currentHp}</span>
                                <span className="block text-[10px] text-green-600 font-bold">+50 per level</span>
                            </div>
                        </div>

                        {/* Skill Info */}
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <h3 className="text-purple-800 font-bold text-lg mb-1 flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                                    </svg>
                                    Skill:
                                </span>
                                <span className="uppercase">{card.skill.type.replace('_', ' ')}</span>
                            </h3>
                            <p className="text-purple-900/80 text-sm mb-2">{card.skill.description}</p>
                            <div className="inline-block bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs font-bold">
                                Effect Value: {card.skill.value}x
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h3 className="text-slate-700 font-bold mb-2 uppercase text-xs tracking-wider">Character Lore</h3>
                            <p className="text-slate-600 text-sm leading-relaxed italic border-l-4 border-sky-300 pl-3">"{card.description}"</p>
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                                {card.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-white text-slate-500 rounded border border-slate-200 text-xs font-medium">#{tag}</span>
                                ))}
                            </div>
                        </div>

                        {/* Danger Zone: Retire */}
                        {userCard && (
                            <div className="border-t border-slate-100 pt-4 flex justify-end">
                                <button 
                                    onClick={onRetire}
                                    className="text-red-400 text-xs font-bold hover:text-red-600 flex items-center gap-1 px-3 py-2 hover:bg-red-50 rounded transition"
                                >
                                    <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.636-1.452zm-2.541 6.538a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm5.25 0a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z" clipRule="evenodd" />
                                        </svg>
                                        Retire Card (Sell)
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'story' && (
                    <div className="space-y-6">
                        <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-pink-800 text-sm uppercase">Current Bond</h3>
                                <div className="text-2xl font-black text-pink-600">{currentBond}%</div>
                            </div>
                            <div className="text-xs text-pink-400 max-w-[150px] text-right">
                                Use card in Battles and Chat to increase Bond.
                            </div>
                        </div>

                        <div className="space-y-4">
                            {card.storyChapters?.map((chapter, index) => {
                                const isUnlocked = currentBond >= chapter.unlockBondLevel;
                                return (
                                    <div key={index} className={`rounded-xl border p-4 transition-all ${isUnlocked ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className={`font-bold ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                                                {isUnlocked ? chapter.title : `Locked Story ${index + 1}`}
                                            </h4>
                                            {!isUnlocked && (
                                                <span className="text-xs font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded">
                                                    Req: Bond {chapter.unlockBondLevel}
                                                </span>
                                            )}
                                        </div>
                                        {isUnlocked ? (
                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                                {chapter.content}
                                            </p>
                                        ) : (
                                            <div className="text-sm text-slate-400 italic flex items-center justify-center h-16 bg-slate-100/50 rounded-lg gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                                                </svg>
                                                Increase bond to unlock this memory.
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {(!card.storyChapters || card.storyChapters.length === 0) && (
                                <div className="text-center p-6 text-slate-400 bg-slate-50 rounded-xl">
                                    No stories available for this card yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};