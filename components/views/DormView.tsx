import React, { useState, useRef, useEffect } from 'react';
import { Furniture, DormState, Card } from '../../types';

interface DormViewProps {
  coins: number;
  onPurchase: (cost: number, id: string) => void;
  dorm: DormState;
  onUpdateDorm: (dorm: DormState) => void;
  team: string[];
  cards: Card[];
  furnitureCatalog: Furniture[];
}

export const DormView: React.FC<DormViewProps> = ({ coins, onPurchase, dorm, onUpdateDorm, team, cards, furnitureCatalog }) => {
  const [tab, setTab] = useState<'room' | 'shop'>('room');
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State
  const [localPlaced, setLocalPlaced] = useState(dorm.placedFurniture);
  const [dragItem, setDragItem] = useState<{ idx: number, offsetX: number, offsetY: number } | null>(null);
  const roomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      setLocalPlaced(dorm.placedFurniture);
  }, [dorm.placedFurniture, isEditing]);

  const teamCards = team.map(id => cards.find(c => c.id === id)).filter(Boolean) as Card[];

  const renderIcon = (icon: string) => {
    if (icon.startsWith('http') || icon.startsWith('data:image')) {
        return <img src={icon} alt="item" className="w-12 h-12 object-contain drop-shadow-sm pointer-events-none" />;
    }
    return <span className="text-4xl filter drop-shadow-sm pointer-events-none select-none">{icon}</span>;
  };

  // --- DRAG HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent, idx: number) => {
      if (!isEditing || !roomRef.current) return;
      
      const itemRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const offsetX = e.clientX - itemRect.left;
      const offsetY = e.clientY - itemRect.top;
      
      setDragItem({ idx, offsetX, offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!dragItem || !roomRef.current) return;

      const roomRect = roomRef.current.getBoundingClientRect();
      
      // Calculate new position as percentage relative to room container
      // Subtract offset to keep mouse relative to item start
      const xPx = e.clientX - roomRect.left;
      const yPx = e.clientY - roomRect.top;
      
      let xPct = (xPx / roomRect.width) * 100;
      let yPct = (yPx / roomRect.height) * 100;

      // Boundaries
      xPct = Math.max(0, Math.min(100, xPct));
      yPct = Math.max(0, Math.min(100, yPct));

      setLocalPlaced(prev => prev.map((item, i) => i === dragItem.idx ? { ...item, x: xPct, y: yPct } : item));
  };

  const handleMouseUp = () => {
      setDragItem(null);
  };

  const handleSave = () => {
      onUpdateDorm({ ...dorm, placedFurniture: localPlaced });
      setIsEditing(false);
  };

  const handleCancel = () => {
      setLocalPlaced(dorm.placedFurniture);
      setIsEditing(false);
  };

  const handleAddToRoom = (id: string) => {
      setLocalPlaced(prev => [...prev, { id, x: 50, y: 50 }]);
  };

  const handleRemoveFromRoom = (idx: number) => {
      setLocalPlaced(prev => prev.filter((_, i) => i !== idx));
  };

  // Compute available storage items (Owned - Placed)
  const getStorageItems = () => {
      const counts: Record<string, number> = {};
      dorm.unlockedFurniture.forEach(id => counts[id] = (counts[id] || 0) + 1);
      localPlaced.forEach(p => {
          if (counts[p.id]) counts[p.id]--;
      });
      return Object.entries(counts).filter(([_, count]) => count > 0).map(([id, count]) => ({ id, count }));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto select-none" onMouseMove={isEditing ? handleMouseMove : undefined} onMouseUp={isEditing ? handleMouseUp : undefined}>
       <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-sky-900">Agency Dorms</h2>
          <div className="flex gap-2 bg-white p-1 rounded-lg border shadow-sm">
              <button onClick={() => setTab('room')} className={`px-4 py-1 rounded transition ${tab === 'room' ? 'bg-sky-100 text-sky-800 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>My Room</button>
              <button onClick={() => setTab('shop')} className={`px-4 py-1 rounded transition ${tab === 'shop' ? 'bg-sky-100 text-sky-800 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>Furniture Shop</button>
          </div>
       </div>

       {tab === 'room' && (
           <div className="flex flex-col gap-4">
               {/* Controls */}
               <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-sky-100 shadow-sm">
                   <div className="text-sm text-slate-500">
                       {isEditing ? "Drag items to move. Double-click to remove." : "Relax with your chibi team!"}
                   </div>
                   <div className="flex gap-2">
                       {isEditing ? (
                           <>
                             <button onClick={handleSave} className="bg-green-500 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-600 shadow-md animate-pop flex items-center gap-1">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                 </svg>
                                 Save
                             </button>
                             <button onClick={handleCancel} className="bg-slate-200 text-slate-600 px-4 py-1.5 rounded-lg font-bold hover:bg-slate-300">Cancel</button>
                           </>
                       ) : (
                           <button onClick={() => setIsEditing(true)} className="bg-sky-600 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-sky-700 shadow-md flex items-center gap-1">
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                  <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                               </svg>
                               Edit Room
                           </button>
                       )}
                   </div>
               </div>

               {/* Room Container */}
               <div 
                 ref={roomRef}
                 className={`h-[400px] border-4 rounded-xl relative overflow-hidden shadow-inner bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] transition-colors ${isEditing ? 'border-sky-400 bg-sky-50 cursor-crosshair' : 'border-orange-200 bg-orange-50'}`}
               >
                   {/* Characters Chibi (Hidden in Edit Mode to reduce clutter, or kept?) -> Kept but inert */}
                   {!isEditing && teamCards.map((c, i) => (
                       <div key={c.id} className="absolute bottom-10 z-20 flex flex-col items-center animate-bounce pointer-events-none" style={{ left: `${20 + i * 30}%`, animationDuration: `${2 + i}s` }}>
                           <img src={c.imageUrl} className="w-16 h-16 rounded-full border-2 border-white shadow-md bg-gray-200 object-cover" alt="chibi"/>
                           <div className="bg-white/80 px-2 rounded-full text-[10px] font-bold mt-1 backdrop-blur-sm">{c.name}</div>
                       </div>
                   ))}

                   {/* Furniture */}
                   {localPlaced.map((p, i) => {
                       const item = furnitureCatalog.find(f => f.id === p.id);
                       if (!item) return null;
                       const isDragging = dragItem?.idx === i;
                       
                       return (
                           <div 
                             key={i} 
                             onMouseDown={(e) => handleMouseDown(e, i)}
                             onDoubleClick={() => isEditing && handleRemoveFromRoom(i)}
                             className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform ${isEditing ? 'cursor-grab active:cursor-grabbing hover:scale-110' : 'pointer-events-none'} ${isDragging ? 'scale-110 z-50 opacity-90' : 'z-10'}`} 
                             style={{ left: `${p.x}%`, top: `${p.y}%` }}
                           >
                               {renderIcon(item.icon)}
                               {isEditing && (
                                   <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                          <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                       </svg>
                                   </div>
                               )}
                           </div>
                       );
                   })}
                   
                   {isEditing && <div className="absolute top-2 right-2 bg-sky-600 text-white px-2 py-1 rounded text-xs font-bold shadow opacity-80 pointer-events-none">EDITING MODE</div>}
               </div>

               {/* Storage Panel (Edit Mode Only) */}
               {isEditing && (
                   <div className="bg-slate-800 p-4 rounded-xl shadow-lg border-2 border-slate-600 animate-slide-up">
                       <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-sky-400">
                              <path fillRule="evenodd" d="M3.75 6.75a3 3 0 00-3 3v6a3 3 0 003 3h15a3 3 0 003-3v-6a3 3 0 00-3-3h-15zM11.25 8.25a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V8.25zm.75 2.25a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V11.25a.75.75 0 00-.75-.75h-.008zM3.75 6A.75.75 0 014.5 5.25h15a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75V6z" clipRule="evenodd" />
                           </svg>
                           <span>Storage</span>
                           <span className="text-xs font-normal text-slate-400">(Click to place)</span>
                       </h3>
                       <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600">
                           {getStorageItems().map(({ id, count }) => {
                               const item = furnitureCatalog.find(f => f.id === id);
                               if(!item) return null;
                               return (
                                   <button 
                                     key={id} 
                                     onClick={() => handleAddToRoom(id)}
                                     className="flex flex-col items-center bg-slate-700 p-2 rounded-lg border border-slate-600 hover:bg-slate-600 hover:border-sky-400 transition min-w-[80px]"
                                   >
                                       <div className="h-10 flex items-center justify-center">{renderIcon(item.icon)}</div>
                                       <div className="text-[10px] text-slate-300 font-bold mt-1 truncate w-full text-center">{item.name}</div>
                                       <div className="text-[10px] text-sky-400 font-bold">x{count}</div>
                                   </button>
                               )
                           })}
                           {getStorageItems().length === 0 && <div className="text-slate-500 text-sm italic py-2">No items in storage. Buy more in the Shop!</div>}
                       </div>
                   </div>
               )}
           </div>
       )}

       {tab === 'shop' && (
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {furnitureCatalog.map(item => {
                   const ownedCount = dorm.unlockedFurniture.filter(id => id === item.id).length;
                   return (
                       <div key={item.id} className="bg-white p-4 rounded-xl border border-sky-100 flex flex-col items-center shadow-sm hover:shadow-md transition group">
                           <div className="mb-2 h-14 flex items-center justify-center group-hover:scale-110 transition">{renderIcon(item.icon)}</div>
                           <h3 className="font-bold text-slate-700">{item.name}</h3>
                           <div className="text-xs text-slate-500 mb-3 uppercase tracking-wide">{item.type}</div>
                           
                           <button 
                             onClick={() => onPurchase(item.cost, item.id)}
                             className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-1 rounded text-sm font-bold shadow w-full active:scale-95 transition"
                           >
                               Buy {item.cost} 🪙
                           </button>
                           {ownedCount > 0 && <div className="mt-2 text-xs text-green-600 font-bold">Owned: {ownedCount}</div>}
                       </div>
                   )
               })}
           </div>
       )}
    </div>
  );
};