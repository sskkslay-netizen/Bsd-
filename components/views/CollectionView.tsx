import React, { useState } from 'react';
import { Card, UserCard, Rarity } from '../../types';
import { CardDisplay } from '../CardDisplay';

interface CollectionViewProps {
  cards: Card[];
  inventory: Record<string, UserCard>;
  team: string[];
  setTeam: React.Dispatch<React.SetStateAction<string[]>>;
  onLimitBreak: (id: string) => void;
  onViewDetails: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({ cards, inventory, team, setTeam, onLimitBreak, onViewDetails, onToggleFavorite }) => {
  const [filterRarity, setFilterRarity] = useState<Rarity | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rarity' | 'level' | 'bond'>('date');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Derived state
  const userCards = Object.values(inventory) as UserCard[];
  
  const filteredCards = userCards.filter(uc => {
     const card = cards.find(c => c.id === uc.cardId);
     if (!card) return false;
     
     const matchesRarity = filterRarity === 'ALL' || card.rarity === filterRarity;
     const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           card.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
     const matchesFav = showFavoritesOnly ? uc.isFavorite : true;

     return matchesRarity && matchesSearch && matchesFav;
  }).sort((a, b) => {
      const cardA = cards.find(c => c.id === a.cardId);
      const cardB = cards.find(c => c.id === b.cardId);
      if (!cardA || !cardB) return 0;

      switch (sortBy) {
          case 'rarity':
               const rarityVal = { [Rarity.UR]: 4, [Rarity.SSR]: 3, [Rarity.SR]: 2, [Rarity.R]: 1 };
               return (rarityVal[cardB.rarity] || 0) - (rarityVal[cardA.rarity] || 0);
          case 'level':
              return b.level - a.level;
          case 'bond':
              return (b.bond || 0) - (a.bond || 0);
          case 'date':
          default:
              return b.obtainedAt - a.obtainedAt;
      }
  });

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Sticky Search & Filter Bar */}
      <div className="sticky top-[72px] z-40 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-md border border-sky-100 mb-6 space-y-4 transition-all">
         <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-xl font-bold text-sky-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-sky-500">
                    <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM12.75 12a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V18a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V12z" clipRule="evenodd" />
                    <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
                  </svg>
                  My Cards
              </h2>
              <p className="text-xs text-slate-500">Showing {filteredCards.length} of {userCards.length} collected</p>
            </div>
            <div className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
                Team: {team.length}/3
            </div>
         </div>
         
         <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
                    </svg>
                </span>
                <input 
                  placeholder="Search Name or Tag (e.g. 'Dazai', 'School AU')..." 
                  className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition shadow-sm bg-slate-50 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
            
            {/* Filters & Sort */}
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
                <select 
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-sky-400 font-medium text-slate-700 cursor-pointer min-w-[120px]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                    <option value="date">📅 Date</option>
                    <option value="rarity">💎 Rarity</option>
                    <option value="level">💪 Level</option>
                    <option value="bond">💖 Bond</option>
                </select>

                <select 
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-sky-400 font-medium text-slate-700 cursor-pointer min-w-[100px]"
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value as Rarity | 'ALL')}
                >
                    <option value="ALL">All Rarity</option>
                    <option value={Rarity.UR}>UR Only</option>
                    <option value={Rarity.SSR}>SSR Only</option>
                    <option value={Rarity.SR}>SR Only</option>
                    <option value={Rarity.R}>R Only</option>
                </select>

                <button 
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`px-3 py-2 rounded-xl text-sm font-bold border transition flex items-center gap-1.5 whitespace-nowrap ${showFavoritesOnly ? 'bg-pink-50 text-pink-500 border-pink-200 shadow-inner' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                    {showFavoritesOnly ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                    )}
                    <span className="hidden sm:inline">Favs</span>
                </button>
            </div>
         </div>
      </div>
      
      {/* Grid Display */}
      {filteredCards.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {filteredCards.map(userCard => {
              const baseCard = cards.find(c => c.id === userCard.cardId);
              if (!baseCard) return null;
              const isSelected = team.includes(baseCard.id);

              return (
                <div key={userCard.cardId} className="relative group flex flex-col w-full animate-pop">
                  <div className="relative w-full">
                      <CardDisplay 
                        card={baseCard} 
                        userCard={userCard}
                        selected={isSelected}
                        showDetails={true}
                        size="responsive"
                        onClick={() => {
                          if (isSelected) setTeam(t => t.filter(id => id !== baseCard.id));
                          else if (team.length < 3) setTeam(t => [...t, baseCard.id]);
                          else alert("Team full! Deselect a card first.");
                        }}
                        onFavoriteClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(baseCard.id);
                        }}
                      />
                      
                      {/* Selection Indicator Overlay */}
                      {isSelected && (
                          <div className="absolute -top-2 -right-2 z-50 animate-pop pointer-events-none">
                              <div className="bg-sky-600 text-white text-[10px] font-bold p-1 rounded-full shadow-lg border-2 border-white flex items-center justify-center w-6 h-6">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                 </svg>
                              </div>
                          </div>
                      )}

                      {/* View Details Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onViewDetails(baseCard.id); }}
                        className="absolute bottom-1 right-1 bg-white/90 text-slate-700 p-1.5 rounded-full shadow-md z-40 hover:bg-sky-100 hover:text-sky-700 transition opacity-0 group-hover:opacity-100"
                        title="View Details"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                      </button>
                      
                      {/* Limit Break Badge */}
                      {userCard.duplicates > 0 && (
                        <div className="absolute -top-1 -left-1 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md z-40 animate-pulse pointer-events-none border border-white">
                          MAX+
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
      ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
              <div className="text-4xl mb-4 opacity-50 flex justify-center text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
              </div>
              <h3 className="text-slate-500 font-bold text-lg">No cards found</h3>
              <p className="text-slate-400 text-sm mb-4">Try adjusting your search terms or filters.</p>
              {(searchTerm || filterRarity !== 'ALL' || showFavoritesOnly) && (
                  <button 
                    onClick={() => { setSearchTerm(''); setFilterRarity('ALL'); setShowFavoritesOnly(false); }} 
                    className="text-sky-600 font-bold hover:underline bg-sky-50 px-4 py-2 rounded-lg"
                  >
                    Clear All Filters
                  </button>
              )}
          </div>
      )}
    </div>
  );
};