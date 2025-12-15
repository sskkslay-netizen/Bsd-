import React, { useState } from 'react';

interface ElementData {
  number: number;
  symbol: string;
  name: string;
  category: string;
  mass: string;
}

const ELEMENTS: ElementData[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', category: 'nonmetal', mass: '1.008' },
  { number: 2, symbol: 'He', name: 'Helium', category: 'noble-gas', mass: '4.0026' },
  { number: 3, symbol: 'Li', name: 'Lithium', category: 'alkali-metal', mass: '6.94' },
  { number: 4, symbol: 'Be', name: 'Beryllium', category: 'alkaline-earth', mass: '9.0122' },
  { number: 5, symbol: 'B', name: 'Boron', category: 'metalloid', mass: '10.81' },
  { number: 6, symbol: 'C', name: 'Carbon', category: 'nonmetal', mass: '12.011' },
  { number: 7, symbol: 'N', name: 'Nitrogen', category: 'nonmetal', mass: '14.007' },
  { number: 8, symbol: 'O', name: 'Oxygen', category: 'nonmetal', mass: '15.999' },
  { number: 9, symbol: 'F', name: 'Fluorine', category: 'halogen', mass: '18.998' },
  { number: 10, symbol: 'Ne', name: 'Neon', category: 'noble-gas', mass: '20.180' },
  { number: 11, symbol: 'Na', name: 'Sodium', category: 'alkali-metal', mass: '22.990' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', category: 'alkaline-earth', mass: '24.305' },
  { number: 13, symbol: 'Al', name: 'Aluminium', category: 'post-transition', mass: '26.982' },
  { number: 14, symbol: 'Si', name: 'Silicon', category: 'metalloid', mass: '28.085' },
  { number: 15, symbol: 'P', name: 'Phosphorus', category: 'nonmetal', mass: '30.974' },
  { number: 16, symbol: 'S', name: 'Sulfur', category: 'nonmetal', mass: '32.06' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', category: 'halogen', mass: '35.45' },
  { number: 18, symbol: 'Ar', name: 'Argon', category: 'noble-gas', mass: '39.948' },
  { number: 19, symbol: 'K', name: 'Potassium', category: 'alkali-metal', mass: '39.098' },
  { number: 20, symbol: 'Ca', name: 'Calcium', category: 'alkaline-earth', mass: '40.078' },
  // ... Truncated for brevity, can add more later if requested
  { number: 26, symbol: 'Fe', name: 'Iron', category: 'transition', mass: '55.845' },
  { number: 29, symbol: 'Cu', name: 'Copper', category: 'transition', mass: '63.546' },
  { number: 47, symbol: 'Ag', name: 'Silver', category: 'transition', mass: '107.87' },
  { number: 79, symbol: 'Au', name: 'Gold', category: 'transition', mass: '196.97' },
];

const CATEGORY_COLORS: Record<string, string> = {
    'nonmetal': 'bg-green-200 border-green-300 text-green-900',
    'noble-gas': 'bg-purple-200 border-purple-300 text-purple-900',
    'alkali-metal': 'bg-red-200 border-red-300 text-red-900',
    'alkaline-earth': 'bg-orange-200 border-orange-300 text-orange-900',
    'metalloid': 'bg-teal-200 border-teal-300 text-teal-900',
    'halogen': 'bg-yellow-200 border-yellow-300 text-yellow-900',
    'post-transition': 'bg-blue-200 border-blue-300 text-blue-900',
    'transition': 'bg-pink-200 border-pink-300 text-pink-900',
};

export const PeriodicTable: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [selectedEl, setSelectedEl] = useState<ElementData | null>(null);

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-pop">
            <div className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-slate-500">
                          <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
                        </svg>
                        Periodic Table of Elements (Lite)
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-red-500 font-bold px-3 py-1 bg-white border rounded flex items-center gap-1 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                        Close
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto p-6 bg-slate-100 flex gap-4">
                    {/* Grid */}
                    <div className="flex-1 grid grid-cols-10 gap-2 auto-rows-min content-start">
                        {ELEMENTS.map(el => (
                            <button
                                key={el.number}
                                onClick={() => setSelectedEl(el)}
                                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition hover:scale-110 shadow-sm ${CATEGORY_COLORS[el.category] || 'bg-white border-gray-300'}`}
                            >
                                <span className="text-[10px] font-bold opacity-60 self-start ml-1 -mt-1">{el.number}</span>
                                <span className="text-xl font-black">{el.symbol}</span>
                                <span className="text-[9px] font-medium truncate w-full text-center px-0.5">{el.name}</span>
                            </button>
                        ))}
                        {/* Placeholder for expansion */}
                        <div className="col-span-10 text-center text-xs text-slate-400 mt-4 italic">
                            * Selected common elements shown for study reference.
                        </div>
                    </div>

                    {/* Detail Panel */}
                    <div className="w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col justify-center items-center text-center">
                        {selectedEl ? (
                            <>
                                <div className={`w-24 h-24 rounded-xl flex items-center justify-center text-4xl font-black border-4 mb-4 ${CATEGORY_COLORS[selectedEl.category]}`}>
                                    {selectedEl.symbol}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-1">{selectedEl.name}</h3>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">{selectedEl.category}</p>
                                
                                <div className="w-full space-y-2 text-left text-sm">
                                    <div className="flex justify-between border-b pb-1">
                                        <span className="text-slate-400">Atomic #</span>
                                        <span className="font-mono font-bold">{selectedEl.number}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1">
                                        <span className="text-slate-400">Atomic Mass</span>
                                        <span className="font-mono font-bold">{selectedEl.mass}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-slate-400 flex flex-col items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                                </svg>
                                <p>Select an element to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};