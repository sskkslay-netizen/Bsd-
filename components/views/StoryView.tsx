import React, { useState } from 'react';
import { Card } from '../../types';
import { generateStory } from '../../services/geminiService';

interface StoryViewProps {
  cards: Card[];
  team: string[];
}

export const StoryView: React.FC<StoryViewProps> = ({ cards, team }) => {
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const teamCards = team.map(id => cards.find(c => c.id === id)).filter(Boolean) as Card[];

  const handleGenerate = async () => {
    if (teamCards.length === 0) return alert("Equip a team first!");
    setIsLoading(true);
    const result = await generateStory(teamCards, prompt || "A day in the life");
    setStory(result);
    setIsLoading(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
       <div className="bg-white rounded-xl shadow-lg border border-sky-100 p-6">
           <h2 className="text-xl font-bold text-sky-900 mb-4">Story Mode</h2>
           <p className="text-sm text-slate-500 mb-4">Generate a unique story featuring your current team!</p>
           
           <div className="flex gap-2 mb-4">
              {teamCards.map(c => (
                  <img key={c.id} src={c.imageUrl} className="w-12 h-12 rounded-full border border-sky-200 object-cover" alt={c.name} />
              ))}
              {teamCards.length === 0 && <span className="text-red-400 text-sm">No team selected.</span>}
           </div>

           <textarea 
             className="w-full p-3 border border-sky-200 rounded-lg mb-4 h-24 focus:ring-2 focus:ring-sky-400 outline-none transition"
             placeholder="Enter a scenario (e.g., 'The team gets locked in a convenience store')..."
             value={prompt}
             onChange={(e) => setPrompt(e.target.value)}
           />
           
           <button 
             onClick={handleGenerate}
             disabled={isLoading || teamCards.length === 0}
             className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
           >
             {isLoading ? (
                 <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Writing...
                 </>
             ) : 'Generate Story'}
           </button>
       </div>

       {story && (
           <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-orange-100 animate-pop">
               <h3 className="font-bold text-orange-800 mb-2">Result:</h3>
               <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{story}</p>
           </div>
       )}
    </div>
  );
};