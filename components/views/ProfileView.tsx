import React from 'react';
import { Card, UserCard, StudySet, Faction } from '../../types';

interface ProfileViewProps {
  userEmail: string;
  coins: number;
  inventory: Record<string, UserCard>;
  totalCards: number;
  studySets: StudySet[];
  team: string[];
  cards: Card[];
  onLogout: () => void;
  onLogin: () => void;
  isAdmin: boolean;
  onAdminAccess: () => void;
  faction: Faction;
  onSetFaction: (f: Faction) => void;
  onExportSave: () => void;
  onImportSave: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCache?: () => void;
}

const THEME_PREVIEWS: Record<Faction, { colors: string, label: string, icon: React.ReactNode }> = {
    AGENCY: {
        colors: 'bg-gradient-to-br from-sky-50 to-blue-100 border-sky-300',
        label: 'Armed Detective Agency',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-sky-600"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" /></svg>
    },
    MAFIA: {
        colors: 'bg-gradient-to-br from-slate-800 to-red-950 border-red-800',
        label: 'Port Mafia',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500"><path d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 1c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" /></svg>
    },
    DECAY: {
        colors: 'bg-gradient-to-br from-zinc-800 to-purple-900 border-purple-600',
        label: 'Decay of Angels',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-400"><path d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" /></svg>
    },
    HUNTING_DOGS: {
        colors: 'bg-gradient-to-br from-red-50 to-orange-100 border-red-300',
        label: 'Hunting Dogs',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-700"><path d="M14.5 2.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h5zm-3 3v2h2v-2h-2zm-1.5 2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-5zm.5.5v4h3v-4h-3z" /></svg>
    },
    SPECIAL_DIVISION: {
        colors: 'bg-gradient-to-br from-stone-100 to-gray-200 border-stone-400',
        label: 'Special Division',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-stone-600"><path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" /></svg>
    },
    THE_GUILD: {
        colors: 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300',
        label: 'The Guild',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-600"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" /></svg>
    }
};

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  userEmail, coins, inventory, totalCards, studySets, team, cards, onLogout, onLogin, isAdmin, onAdminAccess, faction, onSetFaction, onExportSave, onImportSave, onClearCache
}) => {
  
  // Calculate Stats
  const ownedCount = Object.keys(inventory).length;
  const completionPercentage = Math.floor((ownedCount / totalCards) * 100);
  
  // Explicitly cast Object.values result as UserCard[] because TypeScript might infer unknown[] depending on lib config
  const userCards = Object.values(inventory) as UserCard[];
  const totalLevel = userCards.reduce((acc, curr) => acc + curr.level, 0);
  const favoriteCount = userCards.filter(c => c.isFavorite).length;

  // Determine Avatar (Leader of the team or first owned card)
  const leaderId = team.length > 0 ? team[0] : Object.keys(inventory)[0];
  const leaderCard = leaderId ? cards.find(c => c.id === leaderId) : null;
  const avatarUrl = leaderCard ? leaderCard.imageUrl : 'https://picsum.photos/seed/default/200/200';

  return (
    <div className="p-4 max-w-2xl mx-auto animate-pop pb-24">
       <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-sky-100 relative">
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-sky-500 to-blue-600 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              {/* Dynamic Particles based on current faction would go here in a more complex setup, but static is fine for profile header */}
          </div>

          {/* Profile Header */}
          <div className="px-6 pb-6 relative">
             <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 mb-6 gap-4">
                <div className="relative group">
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md object-cover bg-gray-200"
                    />
                    {leaderCard && (
                        <div className="absolute bottom-0 right-0 bg-sky-600 text-white text-[10px] px-2 py-0.5 rounded-full border border-white">
                            Lv.{inventory[leaderCard.id]?.level || 1}
                        </div>
                    )}
                </div>
                <div className="text-center md:text-left flex-1">
                   <h2 className="text-2xl font-bold text-slate-800">
                     {userEmail ? userEmail.split('@')[0] : 'Guest Agent'}
                   </h2>
                   <p className="text-sm text-slate-500 font-medium">
                     {userEmail ? 'Agency Member' : 'Unregistered Ability User'}
                   </p>
                </div>
                <div className="flex gap-2">
                    {userEmail ? (
                        <button 
                          onClick={onLogout}
                          className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-bold border border-red-100 hover:bg-red-100 transition"
                        >
                          Sign Out
                        </button>
                    ) : (
                        <button 
                          onClick={onLogin}
                          className="bg-sky-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-sky-700 transition animate-pulse"
                        >
                          Sign In / Register
                        </button>
                    )}
                </div>
             </div>

             {/* Stats Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-sky-50 p-3 rounded-2xl text-center border border-sky-100 flex flex-col items-center">
                   <div className="mb-1 text-sky-600">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                         <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                       </svg>
                   </div>
                   <div className="font-black text-sky-900 text-lg">{coins.toLocaleString()}</div>
                   <div className="text-xs text-sky-600 font-bold uppercase">Coins</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-2xl text-center border border-indigo-100 flex flex-col items-center">
                   <div className="mb-1 text-indigo-600">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                         <path d="M11.25 4.533A9.707 9.707 0 006 3.755c-2.348 0-4.526.918-6.197 2.425a1.126 1.126 0 01-1.553 0L3.124 2.39a.75.75 0 10-1.248-.832L.209 6.357a.75.75 0 00.598 1.117h6.638a.75.75 0 00.565-1.243l-1.63-1.902a7.24 7.24 0 013.87-1.079c2.467 0 4.649 1.192 5.96 3.018a.75.75 0 001.218-.813A9.73 9.73 0 0011.25 4.533zM22.78 17.633a.75.75 0 00-.598-1.117h-6.638a.75.75 0 00-.566 1.243l1.63 1.902a7.24 7.24 0 01-3.87 1.079 7.235 7.235 0 01-5.96-3.019.75.75 0 00-1.218.813 9.73 9.73 0 006.178 3.712 9.707 9.707 0 005.25-.778 1.126 1.126 0 011.553 0l4.873 3.79a.75.75 0 001.248-.832l-1.667-4.802z" />
                         <path d="M12.75 7.5a.75.75 0 00-1.5 0v3.502c0 .265.14.51.37.653l2.625 1.64a.75.75 0 00.794-1.27l-2.29-1.43V7.5z" />
                       </svg>
                   </div>
                   <div className="font-black text-indigo-900 text-lg">{ownedCount} <span className="text-xs text-indigo-400 font-normal">/ {totalCards}</span></div>
                   <div className="text-xs text-indigo-600 font-bold uppercase">Collection</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-2xl text-center border border-purple-100 flex flex-col items-center">
                   <div className="mb-1 text-purple-600">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                         <path d="M11.25 4.533A9.707 9.707 0 006 3.755c-2.348 0-4.526.918-6.197 2.425a1.126 1.126 0 01-1.553 0L3.124 2.39a.75.75 0 10-1.248-.832L.209 6.357a.75.75 0 00.598 1.117h6.638a.75.75 0 00.565-1.243l-1.63-1.902a7.24 7.24 0 013.87-1.079c2.467 0 4.649 1.192 5.96 3.018a.75.75 0 001.218-.813A9.73 9.73 0 0011.25 4.533zM22.78 17.633a.75.75 0 00-.598-1.117h-6.638a.75.75 0 00-.566 1.243l1.63 1.902a7.24 7.24 0 01-3.87 1.079 7.235 7.235 0 01-5.96-3.019.75.75 0 00-1.218.813 9.73 9.73 0 006.178 3.712 9.707 9.707 0 005.25-.778 1.126 1.126 0 011.553 0l4.873 3.79a.75.75 0 001.248-.832l-1.667-4.802z" />
                       </svg>
                   </div>
                   <div className="font-black text-purple-900 text-lg">{studySets.length}</div>
                   <div className="text-xs text-purple-600 font-bold uppercase">Sets</div>
                </div>
                <div className="bg-pink-50 p-3 rounded-2xl text-center border border-pink-100 flex flex-col items-center">
                   <div className="mb-1 text-pink-500">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                         <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                       </svg>
                   </div>
                   <div className="font-black text-pink-900 text-lg">{favoriteCount}</div>
                   <div className="text-xs text-pink-600 font-bold uppercase">Favs</div>
                </div>
             </div>

             {/* Detailed Stats */}
             <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-b pb-2">Ability Report</h3>
                
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="block text-sm font-bold text-slate-600">Total Level</span>
                        <span className="text-xs text-slate-400">Sum of all card levels</span>
                    </div>
                    <span className="text-2xl font-mono font-bold text-sky-600">{totalLevel}</span>
                </div>

                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-slate-600">Collection Completion</span>
                        <span className="text-sm font-bold text-sky-600">{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-sky-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${completionPercentage}%` }}></div>
                    </div>
                </div>

                {/* Team Preview */}
                <div className="mt-4">
                    <h3 className="font-bold text-slate-700 mb-3">Active Team</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {team.length > 0 ? team.map(id => {
                            const c = cards.find(card => card.id === id);
                            if(!c) return null;
                            return (
                                <div key={id} className="w-16 h-16 rounded-lg overflow-hidden border border-sky-200 relative">
                                    <img src={c.imageUrl} className="w-full h-full object-cover" alt={c.name} />
                                </div>
                            )
                        }) : (
                            <span className="text-sm text-slate-400 italic">No team selected. Go to Cards to equip.</span>
                        )}
                    </div>
                </div>

                {/* Faction Select */}
                <div className="mt-6">
                    <h3 className="font-bold text-slate-700 mb-3">Interface Theme</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {(Object.entries(THEME_PREVIEWS) as [Faction, typeof THEME_PREVIEWS[Faction]][]).map(([key, data]) => (
                            <button
                                key={key}
                                onClick={() => onSetFaction(key)}
                                className={`relative p-3 rounded-xl border-2 transition-all duration-300 overflow-hidden text-left group ${faction === key ? 'ring-2 ring-offset-2 ring-sky-500 scale-[1.02]' : 'hover:scale-[1.01] hover:shadow-md'}`}
                            >
                                <div className={`absolute inset-0 opacity-20 ${data.colors}`}></div>
                                <div className="relative z-10 flex items-center gap-2">
                                    <div className="p-2 bg-white/50 backdrop-blur rounded-lg shadow-sm">
                                        {data.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold ${faction === key ? 'text-slate-900' : 'text-slate-600'}`}>
                                            {data.label}
                                        </span>
                                        {faction === key && <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                                            ● Active
                                        </span>}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Data Management */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-700 mb-3">Data Management</h3>
                    
                    {/* CLEAR CACHE BUTTON */}
                    <button 
                        onClick={onClearCache}
                        className="w-full bg-orange-50 border border-orange-200 text-orange-700 py-3 mb-3 rounded-lg font-bold text-sm hover:bg-orange-100 flex items-center justify-center gap-2"
                        title="Removes uploaded images to free up space, keeps text/cards."
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.636-1.452zm-2.541 6.538a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm5.25 0a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z" clipRule="evenodd" />
                        </svg>
                        Clear Image Cache (Fix Storage Full)
                    </button>

                    <div className="flex gap-3">
                        <button onClick={onExportSave} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                            </svg>
                            Export Save
                        </button>
                        <div className="flex-1 relative">
                            <input type="file" accept=".json" onChange={onImportSave} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <button className="w-full bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                                </svg>
                                Import Save
                            </button>
                        </div>
                    </div>
                </div>

                {/* Admin Area */}
                {isAdmin && (
                    <div className="mt-8 border-t border-red-100 pt-6">
                        <h3 className="font-bold text-red-800 mb-2">Developer Zone</h3>
                        <p className="text-xs text-red-400 mb-4">Authorized personnel only. Modifying game data may cause instability.</p>
                        <button 
                            onClick={onAdminAccess}
                            className="w-full py-3 bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 hover:bg-red-200 transition flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                              <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
                            </svg>
                            Access Admin Dashboard
                        </button>
                    </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};