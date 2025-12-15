import React, { useState, useEffect } from 'react';
import { Banner, Card } from '../../types';
import { CardDisplay } from '../CardDisplay';

interface GachaViewProps {
  banners: Banner[];
  coins: number;
  onPull: (bannerId: string, amount: number) => Promise<void>;
  recentCards: Card[];
  pityCount: number;
}

export const GachaView: React.FC<GachaViewProps> = ({ banners, coins, onPull, recentCards, pityCount }) => {
  const [pullState, setPullState] = useState<'idle' | 'charging' | 'releasing' | 'revealing'>('idle');
  const [pullCount, setPullCount] = useState(1);

  const handlePullWrapper = async (id: string, amt: number) => {
      setPullCount(amt);
      setPullState('charging');
      
      // Charging Phase: Energy gathering (1.5s)
      if (navigator.vibrate) navigator.vibrate(50);
      await new Promise(r => setTimeout(r, 1500));
      
      // Data Fetch (Hidden during transition)
      await onPull(id, amt);
      
      // Release Phase: Explosion/Stars (1.5s)
      setPullState('releasing');
      if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
      await new Promise(r => setTimeout(r, 1500));
      
      // Reveal Phase: Flash to white (0.5s hold)
      setPullState('revealing');
      await new Promise(r => setTimeout(r, 500));
      
      // Back to Idle (Fade out white)
      setPullState('idle');
  };

  return (
    <div className="p-4 max-w-6xl mx-auto relative">
      {/* CINEMATIC PULL OVERLAY */}
      {pullState !== 'idle' && (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
              <style>
                {`
                  @keyframes gather {
                    0% { transform: translate(var(--sx), var(--sy)) scale(0); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translate(0, 0) scale(1); opacity: 0; }
                  }
                  @keyframes shootStar {
                    0% { transform: translate(0, 0) scale(0.5); opacity: 1; }
                    50% { opacity: 1; }
                    100% { transform: translate(var(--ex), var(--ey)) scale(0); opacity: 0; }
                  }
                  @keyframes bookFloat {
                    0%, 100% { transform: translateY(0) rotateX(10deg); }
                    50% { transform: translateY(-20px) rotateX(10deg); }
                  }
                  @keyframes beamExpand {
                    0% { transform: scaleY(0); opacity: 0; }
                    20% { transform: scaleY(1); opacity: 1; }
                    100% { transform: scaleY(1.5); opacity: 0; }
                  }
                  .particle-gather {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: #38bdf8;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #38bdf8;
                    animation: gather 0.8s ease-in infinite;
                  }
                  .star-trail {
                    position: absolute;
                    width: 100px;
                    height: 4px;
                    background: linear-gradient(90deg, rgba(255,255,255,0), #fbbf24, #fff);
                    border-radius: 50%;
                    animation: shootStar 1s ease-out forwards;
                    transform-origin: left center;
                  }
                `}
              </style>

              {/* Background Effects */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/50 via-slate-950 to-slate-950"></div>
              
              {/* Magic Circle (Floor) */}
              <div className={`absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] border-2 border-sky-500/30 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite] transition-all duration-1000 ${pullState === 'releasing' ? 'scale-150 opacity-0' : 'scale-100 opacity-100'} [transform:rotateX(60deg)]`}>
                  <div className="absolute inset-4 border border-sky-400/20 rounded-full"></div>
                  <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(14,165,233,0.1),transparent)]"></div>
              </div>

              {/* The Mystic Book Container */}
              <div className={`relative z-10 flex flex-col items-center justify-center transition-all duration-500 ${pullState === 'releasing' ? 'scale-110' : 'scale-100'}`}>
                  
                  {/* Energy Beam (Releasing) */}
                  {pullState === 'releasing' && (
                      <div className="absolute bottom-0 w-32 h-[200vh] bg-gradient-to-t from-white via-sky-300 to-transparent opacity-80 blur-lg origin-bottom animate-[beamExpand_0.5s_ease-out_forwards]"></div>
                  )}

                  {/* The Book */}
                  <div className={`w-40 h-56 bg-indigo-900 rounded-r-md border-l-8 border-yellow-600 shadow-[0_0_50px_rgba(56,189,248,0.4)] flex items-center justify-center relative perspective-1000 ${pullState === 'charging' ? 'animate-shake' : 'animate-[bookFloat_3s_ease-in-out_infinite]'}`}>
                      {/* Book Cover Design */}
                      <div className="absolute inset-2 border border-yellow-500/30"></div>
                      <div className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                          {/* Book Icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-20 h-20">
                            <path d="M11.25 4.533A9.707 9.707 0 006 3.755c-2.348 0-4.526.918-6.197 2.425a1.126 1.126 0 01-1.553 0L3.124 2.39a.75.75 0 10-1.248-.832L.209 6.357a.75.75 0 00.598 1.117h6.638a.75.75 0 00.565-1.243l-1.63-1.902a7.24 7.24 0 013.87-1.079c2.467 0 4.649 1.192 5.96 3.018a.75.75 0 001.218-.813A9.73 9.73 0 0011.25 4.533zM22.78 17.633a.75.75 0 00-.598-1.117h-6.638a.75.75 0 00-.566 1.243l1.63 1.902a7.24 7.24 0 01-3.87 1.079 7.235 7.235 0 01-5.96-3.019.75.75 0 00-1.218.813 9.73 9.73 0 006.178 3.712 9.707 9.707 0 005.25-.778 1.126 1.126 0 011.553 0l4.873 3.79a.75.75 0 001.248-.832l-1.667-4.802z" />
                            <path d="M12.75 7.5a.75.75 0 00-1.5 0v3.502c0 .265.14.51.37.653l2.625 1.64a.75.75 0 00.794-1.27l-2.29-1.43V7.5z" />
                          </svg>
                      </div>
                      
                      {/* Glow Overlay */}
                      <div className={`absolute inset-0 bg-sky-400/20 mix-blend-screen transition-opacity duration-300 ${pullState === 'charging' ? 'opacity-100' : 'opacity-0'}`}></div>
                  </div>

                  {/* Charging Particles */}
                  {pullState === 'charging' && (
                      <div className="absolute inset-0 pointer-events-none">
                          {[...Array(20)].map((_, i) => {
                              const angle = Math.random() * 360;
                              const dist = 300 + Math.random() * 100;
                              const sx = `${Math.cos(angle * Math.PI / 180) * dist}px`;
                              const sy = `${Math.sin(angle * Math.PI / 180) * dist}px`;
                              return (
                                  <div 
                                    key={i} 
                                    className="particle-gather" 
                                    style={{ 
                                        '--sx': sx, 
                                        '--sy': sy, 
                                        animationDelay: `${Math.random() * 1}s` 
                                    } as React.CSSProperties} 
                                  />
                              );
                          })}
                      </div>
                  )}

                  {/* Shooting Stars (Cards) */}
                  {pullState === 'releasing' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                          {[...Array(pullCount)].map((_, i) => {
                              const angle = (360 / pullCount) * i + Math.random() * 30; // Spread out
                              const dist = 500;
                              const ex = `${Math.cos(angle * Math.PI / 180) * dist}px`;
                              const ey = `${Math.sin(angle * Math.PI / 180) * dist}px`;
                              return (
                                  <div 
                                    key={i} 
                                    className="star-trail"
                                    style={{
                                        '--ex': ex,
                                        '--ey': ey,
                                        transform: `rotate(${angle}deg)`,
                                        animationDelay: `${i * 0.1}s`
                                    } as React.CSSProperties}
                                  >
                                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[2px] shadow-[0_0_10px_#fff]"></div>
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>

              {/* Status Text */}
              <div className="absolute bottom-20 text-center">
                  <h2 className={`text-2xl font-black tracking-[0.3em] uppercase transition-all duration-300 ${pullState === 'releasing' ? 'text-white scale-110' : 'text-sky-400'}`}>
                      {pullState === 'charging' ? 'Gathering Ability...' : 'Summoning!'}
                  </h2>
              </div>

              {/* Flash Reveal */}
              <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-[800ms] ease-out ${pullState === 'revealing' ? 'opacity-100' : 'opacity-0'}`}></div>
          </div>
      )}

      <div className="mb-6 flex items-center justify-between">
         <h2 className="text-xl font-bold text-sky-900">Scout Members</h2>
         <div className="flex gap-2 items-center">
             {/* PITY COUNTER "THE BOOK" */}
             <div className="flex flex-col items-end mr-4">
                 <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Reality Rewrite</div>
                 <div className="w-32 h-2 bg-indigo-100 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-500" style={{ width: `${Math.min(100, pityCount)}%` }}></div>
                 </div>
                 <div className="text-[10px] font-bold text-slate-400">{pityCount}/100</div>
             </div>
             <div className="text-sm font-bold text-sky-600 bg-sky-100 px-3 py-1 rounded-full">
                Balance: {coins} Coins
             </div>
         </div>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-6 snap-x hide-scrollbar">
        {banners.map(b => (
          <div key={b.id} className={`min-w-[300px] md:min-w-[350px] snap-center rounded-2xl overflow-hidden shadow-lg border relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${b.theme === 'au' ? 'border-purple-300 bg-gradient-to-br from-indigo-50 to-purple-50' : 'border-sky-100 bg-white'}`}>
            <div className="h-44 bg-gray-200 relative group">
               <img src={b.imageUrl} alt={b.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
               {b.theme === 'au' && (
                 <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-md animate-pulse flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
                    </svg>
                    AU LIMITED
                 </div>
               )}
               <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                 <h3 className="text-white font-bold text-xl drop-shadow-md">{b.name}</h3>
               </div>
            </div>
            <div className="p-4 flex flex-col h-[140px] justify-between">
               <p className="text-sm text-slate-600 line-clamp-2">{b.description}</p>
               <div className="flex gap-2 mt-2">
                 <button 
                    disabled={pullState !== 'idle'}
                    onClick={() => handlePullWrapper(b.id, 1)} 
                    className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition active:scale-95 disabled:opacity-50 ${b.theme === 'au' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'}`}
                 >
                    1 Pull <br/><span className="text-xs opacity-75">(100)</span>
                 </button>
                 <button 
                    disabled={pullState !== 'idle'}
                    onClick={() => handlePullWrapper(b.id, 10)} 
                    className={`flex-1 py-2.5 rounded-lg font-bold text-white text-sm transition active:scale-95 shadow-md disabled:opacity-50 ${b.theme === 'au' ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700' : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'}`}
                 >
                    10 Pull <br/><span className="text-xs opacity-90">(1000)</span>
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-sky-900 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-yellow-400">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
            </svg>
            Latest Pulls
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-6 px-2">
          {recentCards.length > 0 ? recentCards.slice(0, 5).map((c, i) => (
             <div key={`${c.id}-${i}`} className="animate-pop" style={{ animationDelay: `${i * 100}ms` }}>
                <CardDisplay card={c} size="sm" />
             </div>
          )) : (
              <div className="text-slate-400 italic text-sm p-4 w-full text-center border-2 border-dashed border-slate-200 rounded-xl">
                  Pull on a banner to see cards here!
              </div>
          )}
        </div>
      </div>
    </div>
  );
};