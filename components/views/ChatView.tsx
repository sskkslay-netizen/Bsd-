import React, { useState, useEffect, useRef } from 'react';
import { Card, UserCard, ChatMessage } from '../../types';
import { ai } from '../../services/geminiService';
import { LiveServerMessage } from '@google/genai';

interface ChatViewProps {
  cards: Card[];
  inventory: Record<string, UserCard>;
  history: ChatMessage[];
  onSendMessage: (charId: string, text: string) => Promise<void>;
  onClearHistory: () => void;
  isTyping: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({ cards, inventory, history, onSendMessage, onClearHistory, isTyping }) => {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const ownedCards = cards.filter(c => inventory[c.id]);
  const selectedChar = cards.find(c => c.id === selectedCharId);

  // Live Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<Promise<any> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
        cleanupLiveSession();
    };
  }, []);

  const handleSend = () => {
      if (selectedCharId && input.trim()) {
          onSendMessage(selectedCharId, input);
          setInput('');
      }
  };

  // --- AUDIO UTILS ---
  const decode = (base64: string) => {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
      const dataInt16 = new Int16Array(data.buffer);
      const frameCount = dataInt16.length; // Mono
      const buffer = ctx.createBuffer(1, frameCount, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }
      return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, data[i] * 32768));
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return {
      data: btoa(binary),
      mimeType: "audio/pcm;rate=16000",
    };
  };

  const cleanupLiveSession = () => {
      if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
      }
      if (sessionRef.current) {
          sessionRef.current.then(session => session.close());
          sessionRef.current = null;
      }
      setConnectionStatus('disconnected');
      setIsLiveActive(false);
  };

  const toggleLive = async () => {
      if (isLiveActive) {
          cleanupLiveSession();
          return;
      }

      if (!selectedChar) return;

      try {
          setConnectionStatus('connecting');
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
          
          const sessionPromise = ai.live.connect({
              model: 'gemini-2.5-flash-native-audio-preview-09-2025',
              config: {
                  responseModalities: ['AUDIO' as any], // Use string cast to avoid import crash
                  speechConfig: {
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
                  },
                  systemInstruction: `You are ${selectedChar.name}. ${selectedChar.description}. Be brief and in-character.`
              },
              callbacks: {
                  onopen: () => {
                      setConnectionStatus('connected');
                      setIsLiveActive(true);
                      
                      // Audio Input Stream setup
                      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                      const source = ctx.createMediaStreamSource(mediaStreamRef.current!);
                      const processor = ctx.createScriptProcessor(4096, 1, 1);
                      
                      processor.onaudioprocess = (e) => {
                          const inputData = e.inputBuffer.getChannelData(0);
                          const blob = createBlob(inputData);
                          sessionPromise.then(session => session.sendRealtimeInput({ media: blob }));
                      };
                      
                      source.connect(processor);
                      processor.connect(ctx.destination);
                  },
                  onmessage: async (msg: LiveServerMessage) => {
                      if (msg.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
                          const audioData = msg.serverContent.modelTurn.parts[0].inlineData.data;
                          if (audioContextRef.current && audioData) {
                              const audioBuffer = await decodeAudioData(decode(audioData), audioContextRef.current);
                              const source = audioContextRef.current.createBufferSource();
                              source.buffer = audioBuffer;
                              source.connect(audioContextRef.current.destination);
                              
                              const now = audioContextRef.current.currentTime;
                              const start = Math.max(now, nextStartTimeRef.current);
                              source.start(start);
                              nextStartTimeRef.current = start + audioBuffer.duration;
                          }
                      }
                  },
                  onclose: () => {
                      setConnectionStatus('disconnected');
                      setIsLiveActive(false);
                  },
                  onerror: (e) => {
                      console.error(e);
                      setConnectionStatus('disconnected');
                      setIsLiveActive(false);
                  }
              }
          });
          sessionRef.current = sessionPromise;

      } catch (err) {
          console.error("Live Error", err);
          cleanupLiveSession();
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto p-4">
      {/* Character Selector */}
      <div className="flex gap-2 overflow-x-auto pb-4 shrink-0 hide-scrollbar">
        {ownedCards.length > 0 ? ownedCards.map(c => (
          <div 
            key={c.id} 
            onClick={() => { setSelectedCharId(c.id); cleanupLiveSession(); }}
            className={`relative min-w-[70px] h-[70px] rounded-full overflow-hidden border-2 cursor-pointer transition-all ${selectedCharId === c.id ? 'border-sky-500 scale-110 shadow-md ring-2 ring-sky-200' : 'border-slate-200 opacity-70 hover:opacity-100'}`}
          >
            <img src={c.imageUrl} className="w-full h-full object-cover" alt={c.name} />
          </div>
        )) : (
            <div className="text-sm text-slate-400 p-2 italic w-full text-center border-2 border-dashed border-slate-200 rounded-lg">
                Collect cards to start chatting!
            </div>
        )}
      </div>

      {selectedChar ? (
        <div className="flex-1 bg-white rounded-2xl shadow-lg border border-sky-100 flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="bg-sky-50 p-3 border-b border-sky-100 flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="font-bold text-sky-900">{selectedChar.name}</span>
             </div>
             <div className="flex items-center gap-2">
                 <button 
                    onClick={toggleLive}
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 transition-all ${connectionStatus === 'connected' ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                    {connectionStatus === 'connecting' ? (
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                          <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                          <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                        </svg>
                    )}
                    {isLiveActive ? 'End Call' : 'Call'}
                 </button>
                 <button onClick={onClearHistory} className="text-slate-400 hover:text-red-400 transition" title="Clear History">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.636-1.452zm-2.541 6.538a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm5.25 0a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z" clipRule="evenodd" />
                    </svg>
                 </button>
             </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
             {history.length === 0 && (
                 <div className="text-center text-slate-400 mt-10 flex flex-col items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-2 text-slate-300">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                     </svg>
                     <p>Say hello to {selectedChar.name}!</p>
                 </div>
             )}
             {history.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'}`}>
                         {msg.text}
                     </div>
                 </div>
             ))}
             {isTyping && (
                 <div className="flex justify-start">
                     <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                         <div className="flex gap-1">
                             <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                             <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-100"></span>
                             <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-200"></span>
                         </div>
                     </div>
                 </div>
             )}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-sky-100 flex gap-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Message ${selectedChar.name}...`}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400 transition"
                disabled={isLiveActive}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLiveActive}
                className="bg-sky-600 text-white p-2 rounded-xl hover:bg-sky-700 disabled:opacity-50 transition shadow-md flex items-center justify-center w-10"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
              </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 mb-4 grayscale">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <p className="font-bold">Select a character to chat</p>
        </div>
      )}
    </div>
  );
};