import React, { useState, useRef } from 'react';
import { StudySet, Note } from '../../types';
import { PeriodicTable } from '../tools/PeriodicTable';

interface StudyViewProps {
  studySets: StudySet[];
  notes?: Note[];
  setNotes?: React.Dispatch<React.SetStateAction<Note[]>>;
  onGenerate: (input: string, type: 'text' | 'url' | 'image', count: number, difficulty: string) => void;
  onDelete: (id: string) => void;
  onPlay: (set: StudySet, mode: 'game_flash' | 'game_memory' | 'game_battle') => void;
  isLoading?: boolean;
}

export const StudyView: React.FC<StudyViewProps> = ({ studySets, notes = [], setNotes, onGenerate, onDelete, onPlay, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'sets' | 'notebook'>('sets');
  const [studyInput, setStudyInput] = useState('');
  const [inputType, setInputType] = useState<'text' | 'url' | 'image'>('text');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Medium');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPeriodicTable, setShowPeriodicTable] = useState(false);

  // Notebook State
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const QUICK_TOPICS = [
    "AP Psych: Research Methods",
    "AP Psych: Biological Bases",
    "AP Psych: Sensation & Perception",
    "AP Psych: Learning & Cognition",
    "Chemistry: Stoichiometry",
    "Chemistry: Atomic Structure",
    "Chemistry: Chemical Bonding",
    "Chemistry: Periodic Trends",
    "Algebra 2: Quadratic Functions",
    "Algebra 2: Logarithms & Exponents",
    "Algebra 2: Polynomials",
    "Algebra 2: Complex Numbers",
    "French: Common Verbs",
    "French: Daily Conversation",
    "French: Travel Vocabulary",
    "English: Rhetorical Devices",
    "English: Literary Analysis",
    "English: The Great Gatsby",
    "Bungou Stray Dogs Characters"
  ];

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 400; // Reduced for storage safety

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
             resolve(canvas.toDataURL('image/jpeg', 0.5));
          } else {
             resolve(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setStudyInput(compressed);
      } catch (err) {
        console.error("Compression failed", err);
      }
    }
  };

  const handleSaveNote = () => {
      if (!noteTitle.trim()) return;
      if (!setNotes) return;

      const newNote: Note = {
          id: editingNote ? editingNote.id : `note_${Date.now()}`,
          title: noteTitle,
          content: noteContent,
          lastEdited: Date.now()
      };

      if (editingNote) {
          setNotes(prev => prev.map(n => n.id === editingNote.id ? newNote : n));
      } else {
          setNotes(prev => [newNote, ...prev]);
      }
      setEditingNote(null);
      setNoteTitle('');
      setNoteContent('');
  };

  const handleDeleteNote = (id: string) => {
      if(window.confirm('Delete note?') && setNotes) {
          setNotes(prev => prev.filter(n => n.id !== id));
      }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {showPeriodicTable && <PeriodicTable onClose={() => setShowPeriodicTable(false)} />}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-sky-900">Study Hub</h2>
        <div className="flex gap-2">
            <button onClick={() => setShowPeriodicTable(true)} className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg text-sm font-bold hover:bg-slate-50 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
                </svg>
                Periodic Table
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-sky-100 mb-6">
          <button onClick={() => setActiveTab('sets')} className={`pb-2 px-2 font-bold ${activeTab === 'sets' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-400'}`}>Study Sets</button>
          <button onClick={() => setActiveTab('notebook')} className={`pb-2 px-2 font-bold ${activeTab === 'notebook' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-400'}`}>My Notebook</button>
      </div>
      
      {activeTab === 'sets' && (
      <>
        <div className="bg-white p-4 rounded-xl shadow mb-6 border border-sky-100">
            <h3 className="font-bold mb-2 text-slate-700">Create New Set</h3>
            
            {inputType === 'text' && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 hide-scrollbar">
                <span className="text-xs font-bold text-slate-400 self-center whitespace-nowrap mr-1">Quick Start:</span>
                {QUICK_TOPICS.map(topic => (
                    <button 
                        key={topic}
                        onClick={() => onGenerate(topic, 'text', questionCount, difficulty)}
                        className="whitespace-nowrap px-3 py-1 bg-sky-50 text-sky-600 rounded-full text-xs font-bold border border-sky-100 hover:bg-sky-100 transition active:scale-95"
                        disabled={isLoading}
                    >
                        {topic}
                    </button>
                ))}
            </div>
            )}

            <div className="flex gap-2 mb-2 flex-wrap">
              <button onClick={() => { setInputType('text'); setStudyInput(''); }} className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${inputType === 'text' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
                  Text/Paste
              </button>
              <button onClick={() => { setInputType('url'); setStudyInput(''); }} className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${inputType === 'url' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
                  URL/Video
              </button>
              <button onClick={() => { setInputType('image'); setStudyInput(''); }} className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${inputType === 'image' ? 'bg-sky-600 text-white shadow-md' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                    <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  Photo
              </button>
            </div>

            {/* Config Row */}
            <div className="flex gap-3 mb-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Difficulty:</span>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="text-xs p-1 rounded border border-slate-300">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Extreme">Extreme</option>
                  </select>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Questions:</span>
                  <select value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="text-xs p-1 rounded border border-slate-300">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
               </div>
            </div>

            {inputType === 'image' ? (
            <div className="w-full border-2 border-dashed border-sky-200 rounded-lg p-6 bg-sky-50/30 flex flex-col items-center justify-center min-h-[150px] relative transition hover:bg-sky-50 overflow-hidden">
                <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
                />
                {studyInput ? (
                <div className="flex flex-col items-center relative z-20">
                    <img src={studyInput} alt="Preview" className="h-32 object-contain rounded-md border border-slate-300 shadow-sm mb-2" />
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStudyInput(''); if(fileInputRef.current) fileInputRef.current.value=''; }}
                        className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow hover:bg-red-600 transition mb-2"
                    >
                        Remove Image
                    </button>
                    <span className="text-xs text-green-600 font-bold">Image loaded! Ready to analyze.</span>
                </div>
                ) : (
                <>
                    <span className="text-4xl mb-2 text-sky-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                          <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                        </svg>
                    </span>
                    <span className="font-bold text-sky-800">Upload from Gallery</span>
                    <span className="text-xs text-slate-500 mt-1">Photos of notes, textbooks, or diagrams</span>
                </>
                )}
            </div>
            ) : (
            <textarea 
                value={studyInput} 
                onChange={(e) => setStudyInput(e.target.value)} 
                placeholder={inputType === 'text' ? "Paste notes, definitions, or type a topic..." : "Paste YouTube video or Website URL..."}
                className="w-full p-3 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none min-h-[120px] bg-sky-50/30 resize-y"
            />
            )}
            
            <button 
            onClick={() => {
                if (studyInput.trim()) {
                    onGenerate(studyInput, inputType, questionCount, difficulty);
                    setStudyInput('');
                    if (inputType === 'image' && fileInputRef.current) fileInputRef.current.value = '';
                }
            }}
            disabled={isLoading || !studyInput.trim()}
            className="mt-3 w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white py-2.5 rounded-lg font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
            {isLoading ? 'Generating Magic... ' : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
                    </svg>
                    Generate AI Study Set
                </>
            )}
            </button>
        </div>

        <div className="space-y-4">
            {studySets.map(set => (
            <div key={set.id} className="bg-white p-4 rounded-xl border border-sky-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:shadow-md relative group">
                <div className="pr-8 flex items-center gap-4">
                    {set.sourceImage && (
                        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                            <img src={set.sourceImage} className="w-full h-full object-cover" alt="Source Note" />
                        </div>
                    )}
                    <div>
                        <h4 className="font-bold text-slate-800 text-lg">{set.title}</h4>
                        <p className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded-md mt-1">
                            {new Date(set.created).toLocaleDateString()} • {set.questions.length} Cards • {set.type.toUpperCase()}
                        </p>
                    </div>
                </div>

                {/* Delete Button */}
                <button 
                onClick={(e) => { e.stopPropagation(); onDelete(set.id); }}
                className="absolute top-2 right-2 text-red-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition z-10"
                title="Delete Study Set"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                </button>

                <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => onPlay(set, 'game_flash')} className="flex-1 sm:flex-none bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-200 transition">Flip</button>
                <button onClick={() => onPlay(set, 'game_memory')} className="flex-1 sm:flex-none bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-200 transition">Match</button>
                <button onClick={() => onPlay(set, 'game_battle')} className="flex-1 sm:flex-none bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-bold border border-red-200 hover:bg-red-200 transition flex items-center justify-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                    Battle
                </button>
                </div>
            </div>
            ))}
            {studySets.length === 0 && (
                <div className="text-center p-10 text-slate-400 bg-white/50 rounded-xl border border-dashed border-slate-300">
                    <div className="text-4xl mb-2 flex justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-slate-300">
                          <path d="M11.25 4.533A9.707 9.707 0 006 3.755c-2.348 0-4.526.918-6.197 2.425a1.126 1.126 0 01-1.553 0L3.124 2.39a.75.75 0 10-1.248-.832L.209 6.357a.75.75 0 00.598 1.117h6.638a.75.75 0 00.565-1.243l-1.63-1.902a7.24 7.24 0 013.87-1.079c2.467 0 4.649 1.192 5.96 3.018a.75.75 0 001.218-.813A9.73 9.73 0 0011.25 4.533zM22.78 17.633a.75.75 0 00-.598-1.117h-6.638a.75.75 0 00-.566 1.243l1.63 1.902a7.24 7.24 0 01-3.87 1.079 7.235 7.235 0 01-5.96-3.019.75.75 0 00-1.218.813 9.73 9.73 0 006.178 3.712 9.707 9.707 0 005.25-.778 1.126 1.126 0 011.553 0l4.873 3.79a.75.75 0 001.248-.832l-1.667-4.802z" />
                          <path d="M12.75 7.5a.75.75 0 00-1.5 0v3.502c0 .265.14.51.37.653l2.625 1.64a.75.75 0 00.794-1.27l-2.29-1.43V7.5z" />
                        </svg>
                    </div>
                    No study sets yet. Use the Quick Start above!
                </div>
            )}
        </div>
      </>
      )}

      {activeTab === 'notebook' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Note List */}
              <div className="col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
                  <button 
                    onClick={() => { setEditingNote(null); setNoteTitle(''); setNoteContent(''); }}
                    className="w-full py-3 bg-sky-100 text-sky-700 rounded-lg font-bold hover:bg-sky-200 transition border-2 border-dashed border-sky-300 flex items-center justify-center gap-2"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                      </svg>
                      New Note
                  </button>
                  {notes.map(note => (
                      <div key={note.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition cursor-pointer group relative" onClick={() => {
                          setEditingNote(note);
                          setNoteTitle(note.title);
                          setNoteContent(note.content);
                      }}>
                          <h4 className="font-bold text-slate-800">{note.title || 'Untitled'}</h4>
                          <p className="text-xs text-slate-500 mt-1">{new Date(note.lastEdited).toLocaleDateString()}</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                            className="absolute top-2 right-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.636-1.452zm-2.541 6.538a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm5.25 0a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z" clipRule="evenodd" />
                              </svg>
                          </button>
                      </div>
                  ))}
                  {notes.length === 0 && <div className="text-center text-slate-400 text-xs italic">Your notebook is empty.</div>}
              </div>

              {/* Editor */}
              <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow border border-slate-100 flex flex-col h-[600px]">
                  <input 
                    className="p-4 text-lg font-bold border-b border-slate-100 outline-none" 
                    placeholder="Note Title"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                  />
                  <textarea 
                    className="flex-1 p-4 outline-none resize-none bg-slate-50/50" 
                    placeholder="Type your notes here..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                  <div className="p-3 border-t border-slate-100 flex justify-end">
                      <button onClick={handleSaveNote} className="bg-sky-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-sky-700 transition">Save Note</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};