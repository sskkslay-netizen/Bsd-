import React, { useState, useRef, useEffect } from 'react';
import { Card, Rarity, SkillType, Banner, Furniture, Faction } from '../../types';
import { askDevAssistant } from '../../services/geminiService';

interface AdminViewProps {
  cards: Card[];
  banners: Banner[];
  battleBg: string;
  furnitureCatalog: Furniture[];
  onCreate: (card: Partial<Card>) => void;
  onUpdate: (card: Partial<Card>) => void;
  onDelete: (id: string) => void;
  onCreateBanner: (banner: Banner) => void;
  onUpdateBanner: (banner: Banner) => void;
  onDeleteBanner: (id: string) => void;
  onUpdateBattleBg: (url: string) => void;
  onCreateFurniture: (item: Furniture) => void;
  onUpdateFurniture: (item: Furniture) => void;
  onDeleteFurniture: (id: string) => void;
}

// Helper to compress images before state update to prevent LocalStorage quotas from breaking
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        // Aggressive compression for localStorage safety
        const MAX_DIM = 300; 

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Low quality JPEG (0.5) to save space
            resolve(canvas.toDataURL('image/jpeg', 0.5)); 
        } else {
            resolve(e.target?.result as string); // Fallback
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const AdminView: React.FC<AdminViewProps> = ({ 
  cards, banners, battleBg, furnitureCatalog,
  onCreate, onUpdate, onDelete, 
  onCreateBanner, onUpdateBanner, onDeleteBanner,
  onUpdateBattleBg,
  onCreateFurniture, onUpdateFurniture, onDeleteFurniture
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'banners' | 'assets' | 'furniture' | 'dev'>('cards');
  
  // Card Form State
  const [editMode, setEditMode] = useState(false);
  const [newCardData, setNewCardData] = useState<Partial<Card>>({});
  const cardFileRef = useRef<HTMLInputElement>(null);

  // Banner Form State
  const [editBannerMode, setEditBannerMode] = useState(false);
  const [bannerData, setBannerData] = useState<Partial<Banner>>({});
  const bannerFileRef = useRef<HTMLInputElement>(null);

  // Furniture Form State
  const [editFurnitureMode, setEditFurnitureMode] = useState(false);
  const [furnitureData, setFurnitureData] = useState<Partial<Furniture>>({});
  const furnitureFileRef = useRef<HTMLInputElement>(null);

  // Asset Form State
  const assetFileRef = useRef<HTMLInputElement>(null);

  // Dev Console State
  const [devChatHistory, setDevChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [devInput, setDevInput] = useState('');
  const [debugCode, setDebugCode] = useState('// Access "gameDebug" global\nconsole.log(gameDebug.state.coins);');
  const [debugOutput, setDebugOutput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // --- CARD HANDLERS ---
  const handleCreate = () => {
      onCreate(newCardData);
      setNewCardData({});
      if(cardFileRef.current) cardFileRef.current.value = '';
  };
  const handleUpdate = () => {
      onUpdate(newCardData);
      setEditMode(false);
      setNewCardData({});
      if(cardFileRef.current) cardFileRef.current.value = '';
  };
  const handleEditClick = (card: Card) => {
      setNewCardData({...card});
      setEditMode(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- BANNER HANDLERS ---
  const handleSaveBanner = () => {
    if (editBannerMode && bannerData.id) {
       onUpdateBanner(bannerData as Banner);
       setEditBannerMode(false);
    } else {
       onCreateBanner({ ...bannerData, rateUpTags: bannerData.rateUpTags || [] } as Banner);
    }
    setBannerData({});
    if(bannerFileRef.current) bannerFileRef.current.value = '';
  };
  const handleEditBannerClick = (banner: Banner) => {
    setBannerData({...banner});
    setEditBannerMode(true);
  };

  // --- FURNITURE HANDLERS ---
  const handleSaveFurniture = () => {
      if (editFurnitureMode && furnitureData.id) {
          onUpdateFurniture(furnitureData as Furniture);
          setEditFurnitureMode(false);
      } else {
          onCreateFurniture(furnitureData as Furniture);
      }
      setFurnitureData({});
      if (furnitureFileRef.current) furnitureFileRef.current.value = '';
  };
  const handleEditFurnitureClick = (item: Furniture) => {
      setFurnitureData({ ...item });
      setEditFurnitureMode(true);
  };

  // --- DEV CONSOLE HANDLERS ---
  const handleDevChatSubmit = async () => {
      if(!devInput.trim()) return;
      const userMsg = devInput;
      setDevInput('');
      setDevChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
      setIsAiThinking(true);

      const context = (window as any).gameDebug?.state || { error: "Debug state not found" };
      const reply = await askDevAssistant(userMsg, context);

      setDevChatHistory(prev => [...prev, { role: 'ai', text: reply }]);
      setIsAiThinking(false);
  };

  const handleRunCode = () => {
      try {
          // Capture console.log
          let logs: string[] = [];
          const originalLog = console.log;
          console.log = (...args) => logs.push(args.map(a => JSON.stringify(a)).join(' '));

          // Run Code
          const gameDebug = (window as any).gameDebug; // Expose to scope
          // eslint-disable-next-line no-eval
          const result = eval(debugCode);

          console.log = originalLog; // Restore
          setDebugOutput(`Result: ${String(result)}\nLogs:\n${logs.join('\n')}`);
      } catch (e: any) {
          setDebugOutput(`Error: ${e.message}`);
      }
  };

  // --- FILE HELPER ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, onSuccess: (url: string) => void) => {
    const file = e.target.files?.[0];
    if(file) {
      try {
          const compressed = await compressImage(file);
          onSuccess(compressed);
      } catch(err) {
          console.error("Image compression failed", err);
          alert("Failed to process image. Try a smaller file.");
      }
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
       <h2 className="text-2xl font-bold text-red-800 border-b border-red-200 pb-2">Dev Dashboard</h2>
       
       <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
          <button type="button" onClick={() => setActiveTab('cards')} className={`px-4 py-2 font-bold whitespace-nowrap ${activeTab === 'cards' ? 'text-red-700 border-b-2 border-red-700' : 'text-slate-500'}`}>Cards</button>
          <button type="button" onClick={() => setActiveTab('banners')} className={`px-4 py-2 font-bold whitespace-nowrap ${activeTab === 'banners' ? 'text-red-700 border-b-2 border-red-700' : 'text-slate-500'}`}>Banners</button>
          <button type="button" onClick={() => setActiveTab('furniture')} className={`px-4 py-2 font-bold whitespace-nowrap ${activeTab === 'furniture' ? 'text-red-700 border-b-2 border-red-700' : 'text-slate-500'}`}>Furniture</button>
          <button type="button" onClick={() => setActiveTab('assets')} className={`px-4 py-2 font-bold whitespace-nowrap ${activeTab === 'assets' ? 'text-red-700 border-b-2 border-red-700' : 'text-slate-500'}`}>Assets</button>
          <button type="button" onClick={() => setActiveTab('dev')} className={`px-4 py-2 font-bold whitespace-nowrap ${activeTab === 'dev' ? 'text-purple-700 border-b-2 border-purple-700' : 'text-slate-500'}`}>Dev Console</button>
       </div>

       {/* --- CARDS TAB --- */}
       {activeTab === 'cards' && (
         <>
           <div id="admin-form" className={`p-6 rounded-xl shadow-lg border-2 transition-colors ${editMode ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-red-100'}`}>
             <h3 className="font-bold mb-4 flex items-center gap-2">
                {editMode ? (
                    <span className="text-yellow-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                        </svg>
                        Edit Card Mode
                    </span>
                ) : (
                    <span className="text-red-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                        </svg>
                        Add New Card
                    </span>
                )}
             </h3>
             <div className="grid grid-cols-2 gap-4">
               {/* Inputs */}
               <div className="col-span-2 md:col-span-1">
                 <label className="text-xs font-bold text-slate-500">Character Name</label>
                 <input value={newCardData.name || ''} placeholder="e.g. Mafia Dazai" className="border p-2 rounded w-full mt-1" onChange={e => setNewCardData(prev => ({...prev, name: e.target.value}))} />
               </div>
               <div className="col-span-2 md:col-span-1">
                 <label className="text-xs font-bold text-slate-500">Rarity</label>
                 <select value={newCardData.rarity || ''} className="border p-2 rounded w-full mt-1" onChange={e => setNewCardData(prev => ({...prev, rarity: e.target.value as Rarity}))}>
                   <option value="">Select Rarity</option>
                   <option value="R">R</option>
                   <option value="SR">SR</option>
                   <option value="SSR">SSR</option>
                   <option value="UR">UR</option>
                 </select>
               </div>
               {/* Image Input */}
               <div className="col-span-2 space-y-2">
                 <label className="text-xs text-slate-500 font-bold">Card Image</label>
                 <div className="flex gap-2">
                    <input value={newCardData.imageUrl || ''} placeholder="Image URL" className="flex-1 border p-2 rounded" onChange={e => setNewCardData(prev => ({...prev, imageUrl: e.target.value}))} />
                    {newCardData.imageUrl && (
                        <button type="button" onClick={() => setNewCardData(prev => ({...prev, imageUrl: ''}))} className="bg-red-500 text-white px-3 rounded font-bold hover:bg-red-600 transition">
                            Clear
                        </button>
                    )}
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-dashed">
                    <span className="text-xs text-slate-400">Upload (Auto-compressed):</span>
                    <input ref={cardFileRef} type="file" accept="image/*" className="text-sm text-slate-500" onChange={(e) => handleFileChange(e, (url) => setNewCardData(prev => ({...prev, imageUrl: url})))} />
                 </div>
                 {newCardData.imageUrl && <img src={newCardData.imageUrl} alt="Preview" className="h-24 w-24 object-cover rounded-lg border shadow-sm" />}
               </div>
               
               <div className="col-span-2">
                 <label className="text-xs font-bold text-slate-500">Description</label>
                 <textarea value={newCardData.description || ''} placeholder="Lore..." className="w-full border p-2 rounded h-20 mt-1" onChange={e => setNewCardData(prev => ({...prev, description: e.target.value}))} />
               </div>

               {/* Faction/Tags */}
               <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500">Faction / Tags</label>
                    <div className="flex gap-2 mb-2">
                        <select 
                            className="border p-1.5 rounded text-sm flex-1" 
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                setNewCardData(prev => ({
                                    ...prev, 
                                    tags: prev.tags && !prev.tags.includes(val) ? [...prev.tags, val] : (prev.tags || [val])
                                }));
                            }}
                        >
                            <option value="">Add Faction Tag...</option>
                            <option value="Armed Detective Agency">Armed Detective Agency</option>
                            <option value="Port Mafia">Port Mafia</option>
                            <option value="Decay of Angels">Decay of Angels</option>
                            <option value="Hunting Dogs">Hunting Dogs</option>
                            <option value="The Guild">The Guild</option>
                            <option value="Special Division">Special Division</option>
                        </select>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {newCardData.tags?.map(t => (
                            <span key={t} className="px-2 py-1 bg-slate-100 rounded text-xs border flex items-center gap-1">
                                {t}
                                <button type="button" onClick={() => setNewCardData(prev => ({...prev, tags: prev.tags?.filter(tag => tag !== t)}))} className="text-red-500 font-bold">×</button>
                            </span>
                        ))}
                    </div>
               </div>
               
               {/* Skill Section */}
               <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
                 <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide border-b border-slate-200 pb-1">Skill Configuration</h4>
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Type</label>
                      <select value={newCardData.skill?.type || SkillType.COIN_BOOST} className="border p-2 rounded text-sm w-full" onChange={(e) => setNewCardData(prev => ({ ...prev, skill: { ...(prev.skill || { type: SkillType.COIN_BOOST, value: 1.1, description: '' }), type: e.target.value as SkillType } }))}>
                        {Object.values(SkillType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Value</label>
                      <input type="number" step="0.1" value={newCardData.skill?.value ?? ''} className="border p-2 rounded text-sm w-full" onChange={(e) => setNewCardData(prev => ({ ...prev, skill: { ...(prev.skill || { type: SkillType.COIN_BOOST, value: 1.1, description: '' }), value: parseFloat(e.target.value) } }))} />
                   </div>
                   <div className="col-span-2">
                     <label className="text-[10px] uppercase font-bold text-slate-400">Description</label>
                     <input value={newCardData.skill?.description || ''} className="w-full border p-2 rounded text-sm" onChange={(e) => setNewCardData(prev => ({ ...prev, skill: { ...(prev.skill || { type: SkillType.COIN_BOOST, value: 1.1, description: '' }), description: e.target.value } }))} />
                   </div>
                 </div>
               </div>
             </div>
             <div className="mt-6 flex gap-3 border-t pt-4">
               {editMode ? (
                 <>
                   <button type="button" onClick={handleUpdate} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 shadow-md">Save Changes</button>
                   <button type="button" onClick={() => { setEditMode(false); setNewCardData({}); }} className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-bold hover:bg-gray-600">Cancel</button>
                 </>
               ) : (
                 <button type="button" onClick={handleCreate} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 shadow-md">Create Card</button>
               )}
             </div>
           </div>
           
           <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
             <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
               {cards.map(c => (
                 <div key={c.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                   <div className="flex items-center gap-3">
                     <img src={c.imageUrl} className="w-10 h-10 rounded object-cover border bg-gray-200" alt={c.name} />
                     <div><div className="font-bold text-sm text-slate-800">{c.name}</div><div className="text-xs text-slate-500 bg-slate-100 inline-block px-1.5 rounded">{c.rarity}</div></div>
                   </div>
                   <div className="flex gap-2">
                     <button type="button" onClick={() => handleEditClick(c)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-xs font-bold">EDIT</button>
                     <button type="button" onClick={() => onDelete(c.id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs font-bold">DELETE</button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </>
       )}

       {/* --- BANNERS TAB --- */}
       {activeTab === 'banners' && (
          <>
             <div className="p-6 rounded-xl shadow-lg border-2 bg-white border-indigo-100">
               <h3 className="font-bold mb-4 text-indigo-800">{editBannerMode ? 'Edit Banner' : 'Create Banner'}</h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500">Banner Name</label>
                    <input value={bannerData.name || ''} className="border p-2 rounded w-full mt-1" onChange={e => setBannerData(prev => ({...prev, name: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Description</label>
                    <input value={bannerData.description || ''} className="border p-2 rounded w-full mt-1" onChange={e => setBannerData(prev => ({...prev, description: e.target.value}))} />
                  </div>
                  {/* Banner Image */}
                  <div>
                     <label className="text-xs text-slate-500 font-bold">Banner Image</label>
                     <div className="flex gap-2">
                        <input value={bannerData.imageUrl || ''} placeholder="URL" className="flex-1 border p-2 rounded" onChange={e => setBannerData(prev => ({...prev, imageUrl: e.target.value}))} />
                     </div>
                     <div className="flex items-center gap-2 mt-2">
                        <input ref={bannerFileRef} type="file" accept="image/*" className="text-sm" onChange={(e) => handleFileChange(e, (url) => setBannerData(prev => ({...prev, imageUrl: url})))} />
                     </div>
                     {bannerData.imageUrl && <img src={bannerData.imageUrl} className="mt-2 h-20 rounded border" alt="prev"/>}
                  </div>
                  <div className="flex gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 block">Theme</label>
                        <select value={bannerData.theme || 'standard'} className="border p-2 rounded" onChange={e => setBannerData(prev => ({...prev, theme: e.target.value as any}))}>
                            <option value="standard">Standard</option>
                            <option value="au">AU</option>
                            <option value="holiday">Holiday</option>
                        </select>
                     </div>
                     <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 block">Rate Up Tags (comma sep)</label>
                        <input value={bannerData.rateUpTags?.join(', ') || ''} className="border p-2 rounded w-full" onChange={e => setBannerData(prev => ({...prev, rateUpTags: e.target.value.split(',').map(s => s.trim())}))} />
                     </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button type="button" onClick={handleSaveBanner} className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold">Save Banner</button>
                     {editBannerMode && <button type="button" onClick={() => { setEditBannerMode(false); setBannerData({}); }} className="px-4 py-2 bg-gray-200 rounded font-bold">Cancel</button>}
                  </div>
               </div>
             </div>
             
             <div className="grid gap-4">
                {banners.map(b => (
                    <div key={b.id} className="bg-white p-4 rounded shadow flex justify-between items-center border">
                        <div className="flex gap-3 items-center">
                            <img src={b.imageUrl} className="w-16 h-8 object-cover rounded" alt={b.name} />
                            <div>
                                <div className="font-bold">{b.name}</div>
                                <div className="text-xs text-slate-500">{b.theme}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button type="button" onClick={() => handleEditBannerClick(b)} className="text-blue-600 text-xs font-bold border px-2 py-1 rounded">EDIT</button>
                             <button type="button" onClick={() => onDeleteBanner(b.id)} className="text-red-600 text-xs font-bold border px-2 py-1 rounded">DEL</button>
                        </div>
                    </div>
                ))}
             </div>
          </>
       )}

       {/* --- FURNITURE TAB --- */}
       {activeTab === 'furniture' && (
          <>
             <div className="p-6 rounded-xl shadow-lg border-2 bg-white border-orange-100">
               <h3 className="font-bold mb-4 text-orange-800">{editFurnitureMode ? 'Edit Furniture' : 'Create Furniture'}</h3>
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500">Name</label>
                        <input value={furnitureData.name || ''} className="border p-2 rounded w-full mt-1" onChange={e => setFurnitureData(prev => ({...prev, name: e.target.value}))} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500">Cost</label>
                        <input type="number" value={furnitureData.cost || 100} className="border p-2 rounded w-full mt-1" onChange={e => setFurnitureData(prev => ({...prev, cost: parseInt(e.target.value)}))} />
                      </div>
                  </div>
                  
                  {/* Icon/Image */}
                  <div>
                     <label className="text-xs text-slate-500 font-bold">Icon (Emoji or Image URL)</label>
                     <div className="flex gap-2">
                        <input value={furnitureData.icon || ''} placeholder="🪑 or https://..." className="flex-1 border p-2 rounded" onChange={e => setFurnitureData(prev => ({...prev, icon: e.target.value}))} />
                     </div>
                     <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded border border-dashed">
                        <span className="text-xs text-slate-400">Upload PNG (Auto-compressed):</span>
                        <input ref={furnitureFileRef} type="file" accept="image/png,image/jpeg" className="text-sm text-slate-500" onChange={(e) => handleFileChange(e, (url) => setFurnitureData(prev => ({...prev, icon: url})))} />
                     </div>
                     {furnitureData.icon && (furnitureData.icon.startsWith('http') || furnitureData.icon.startsWith('data:')) && (
                        <img src={furnitureData.icon} className="mt-2 w-16 h-16 object-contain border rounded p-1" alt="prev"/>
                     )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block">Type</label>
                    <select value={furnitureData.type || 'item'} className="border p-2 rounded w-full mt-1" onChange={e => setFurnitureData(prev => ({...prev, type: e.target.value as any}))}>
                        <option value="item">Item</option>
                        <option value="floor">Floor</option>
                        <option value="wall">Wall</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                     <button type="button" onClick={handleSaveFurniture} className="flex-1 bg-orange-600 text-white py-2 rounded font-bold">Save Furniture</button>
                     {editFurnitureMode && <button type="button" onClick={() => { setEditFurnitureMode(false); setFurnitureData({}); }} className="px-4 py-2 bg-gray-200 rounded font-bold">Cancel</button>}
                  </div>
               </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {furnitureCatalog.map(f => (
                    <div key={f.id} className="bg-white p-4 rounded shadow flex flex-col items-center border relative group">
                        <div className="mb-2 h-12 flex items-center">
                            {f.icon.startsWith('http') || f.icon.startsWith('data:') ? (
                                <img src={f.icon} className="h-10 w-10 object-contain" alt={f.name}/>
                            ) : (
                                <span className="text-3xl">{f.icon}</span>
                            )}
                        </div>
                        <div className="font-bold text-sm text-center">{f.name}</div>
                        <div className="text-xs text-orange-600 font-bold">{f.cost} 🪙</div>
                        
                        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                             <button type="button" onClick={() => handleEditFurnitureClick(f)} className="text-blue-600 text-xs font-bold border bg-white px-2 py-1 rounded shadow">✎</button>
                             <button type="button" onClick={() => onDeleteFurniture(f.id)} className="text-red-600 text-xs font-bold border bg-white px-2 py-1 rounded shadow">✕</button>
                        </div>
                    </div>
                ))}
             </div>
          </>
       )}

       {/* --- ASSETS TAB --- */}
       {activeTab === 'assets' && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
             <h3 className="font-bold mb-4 text-slate-800">Global Game Assets</h3>
             <div className="space-y-6">
                <div>
                   <label className="font-bold text-slate-600 block mb-2">Battle Arena Background</label>
                   <div className="border rounded-xl p-4 bg-slate-50">
                      <img src={battleBg} className="w-full h-48 object-cover rounded-lg border border-slate-300 mb-4" alt="Battle BG" />
                      <div className="flex gap-2 mb-2">
                          <input value={battleBg} onChange={(e) => onUpdateBattleBg(e.target.value)} className="flex-1 border p-2 rounded" placeholder="Image URL" />
                      </div>
                      <input ref={assetFileRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, onUpdateBattleBg)} />
                   </div>
                </div>
             </div>
          </div>
       )}
       
       {/* --- DEV CONSOLE TAB --- */}
       {activeTab === 'dev' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
             {/* Left: AI Chat */}
             <div className="flex flex-col bg-white rounded-xl shadow-lg border border-purple-200 overflow-hidden">
                <div className="bg-purple-100 p-3 border-b border-purple-200 font-bold text-purple-800 flex justify-between items-center">
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                        </svg>
                        Dev AI Assistant
                    </span>
                    <span className="text-xs bg-white px-2 py-0.5 rounded-full opacity-70">gemini-2.5-flash</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    {devChatHistory.length === 0 && (
                        <div className="text-center text-slate-400 mt-10">
                            <p>Ask me how to implement features or debug the current state!</p>
                            <p className="text-xs mt-2">Example: "Give me code to add a new UR card"</p>
                        </div>
                    )}
                    {devChatHistory.map((msg, i) => (
                        <div key={i} className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-purple-600 text-white self-end ml-10' : 'bg-white text-slate-800 border border-slate-200 mr-10'}`}>
                            {msg.role === 'ai' && <strong className="block text-purple-600 mb-1">AI</strong>}
                            {msg.text}
                        </div>
                    ))}
                    {isAiThinking && <div className="text-xs text-purple-500 animate-pulse">Thinking...</div>}
                </div>
                <div className="p-3 border-t bg-white flex gap-2">
                    <input 
                        value={devInput}
                        onChange={(e) => setDevInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleDevChatSubmit()}
                        placeholder="Ask the Admin AI..."
                        className="flex-1 border p-2 rounded-lg text-sm"
                        disabled={isAiThinking}
                    />
                    <button type="button" onClick={handleDevChatSubmit} disabled={isAiThinking} className="bg-purple-600 text-white px-4 rounded-lg font-bold hover:bg-purple-700">Send</button>
                </div>
             </div>

             {/* Right: Debugger / Repl */}
             <div className="flex flex-col bg-slate-900 rounded-xl shadow-lg border border-slate-700 overflow-hidden text-slate-200 font-mono text-sm">
                <div className="bg-slate-800 p-3 border-b border-slate-700 font-bold flex justify-between items-center">
                    <span>>_ Runtime Debugger</span>
                    <button type="button" onClick={handleRunCode} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold">RUN</button>
                </div>
                <div className="flex-1 flex flex-col">
                    <textarea 
                        value={debugCode}
                        onChange={(e) => setDebugCode(e.target.value)}
                        className="flex-1 bg-transparent p-4 outline-none resize-none text-green-400"
                        spellCheck={false}
                    />
                    <div className="h-1/3 border-t border-slate-700 bg-black/50 p-2 overflow-y-auto">
                        <div className="text-xs text-slate-500 mb-1">Output:</div>
                        <pre className="whitespace-pre-wrap text-xs text-slate-300">{debugOutput}</pre>
                    </div>
                </div>
                <div className="p-3 bg-red-900/20 border-t border-red-900/30 flex justify-end">
                    <button 
                        onClick={() => { if(window.confirm('Reset ALL Game Data? This cannot be undone.')) { localStorage.clear(); window.location.reload(); } }} 
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                        </svg>
                        RESET GAME DATA
                    </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};