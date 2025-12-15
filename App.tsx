import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { Card, UserCard, Banner, StudySet, Rarity, SkillType, ChatMessage, DailyTask, Faction, CardElement, DormState, Furniture, Note, SchedulerTask } from './types';
import { generateQuizFromContent, getCharacterChatResponse, processRawMaterial } from './services/geminiService';
import { FlashcardFlip, MemoryMatch, BattleArena } from './components/Games';
import { Toast } from './components/ui/Toast';

// Import View Components
import { HomeView } from './components/views/HomeView';
import { StudyView } from './components/views/StudyView';
import { GachaView } from './components/views/GachaView';
import { CollectionView } from './components/views/CollectionView';
import { ChatView } from './components/views/ChatView';
import { AdminView } from './components/views/AdminView';
import { CardDetailView } from './components/views/CardDetailView';
import { ProfileView } from './components/views/ProfileView';
import { DormView } from './components/views/DormView';
import { StoryView } from './components/views/StoryView';

// --- ERROR BOUNDARY ---
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 text-red-900 min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
          <div className="bg-white p-4 rounded border border-red-200 shadow-md text-left overflow-auto max-w-2xl w-full">
             <pre className="text-xs font-mono whitespace-pre-wrap">{this.state.error?.toString()}</pre>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full font-bold hover:bg-red-700">
            Reset Data & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- RICH FACTION THEME CONFIG ---
interface FactionTheme {
    id: Faction;
    name: string;
    bgGradient: string;
    headerColor: string;
    navColor: string;
    accentColor: string;
    textColor: string;
    particleIcon: string; // SVG path
    particleColor: string;
}

const FACTION_THEMES: Record<Faction, FactionTheme> = {
    AGENCY: {
        id: 'AGENCY',
        name: 'Armed Detective Agency',
        bgGradient: 'bg-gradient-to-br from-sky-50 via-white to-blue-50',
        headerColor: 'bg-white/90 border-sky-100 text-sky-800',
        navColor: 'bg-white border-sky-100',
        accentColor: 'text-sky-600',
        textColor: 'text-slate-800',
        particleColor: 'rgba(56, 189, 248, 0.2)', // Sky blue
        particleIcon: "M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" // Circle/Moon
    },
    MAFIA: {
        id: 'MAFIA',
        name: 'Port Mafia',
        bgGradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-red-950',
        headerColor: 'bg-slate-900/90 border-red-900 text-red-500',
        navColor: 'bg-slate-900 border-red-900',
        accentColor: 'text-red-500',
        textColor: 'text-slate-200',
        particleColor: 'rgba(220, 38, 38, 0.15)', // Red
        particleIcon: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" // Flame/Blood
    },
    DECAY: {
        id: 'DECAY',
        name: 'Decay of Angels',
        bgGradient: 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-purple-950',
        headerColor: 'bg-zinc-900/90 border-purple-900 text-purple-400',
        navColor: 'bg-zinc-900 border-purple-900',
        accentColor: 'text-purple-400',
        textColor: 'text-zinc-100',
        particleColor: 'rgba(168, 85, 247, 0.15)', // Purple
        particleIcon: "M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" // Scratch/Chaos
    },
    HUNTING_DOGS: {
        id: 'HUNTING_DOGS',
        name: 'Hunting Dogs',
        bgGradient: 'bg-gradient-to-br from-red-50 via-orange-50 to-stone-100',
        headerColor: 'bg-white/90 border-red-200 text-red-700',
        navColor: 'bg-white border-red-200',
        accentColor: 'text-red-700',
        textColor: 'text-red-900',
        particleColor: 'rgba(239, 68, 68, 0.1)', // Red
        particleIcon: "M14.5 2.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h5zm-3 3v2h2v-2h-2zm-1.5 2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-5zm.5.5v4h3v-4h-3z" // Sword-ish (abstract)
    },
    SPECIAL_DIVISION: {
        id: 'SPECIAL_DIVISION',
        name: 'Special Ability Division',
        bgGradient: 'bg-gradient-to-br from-stone-100 via-gray-100 to-slate-200',
        headerColor: 'bg-white/90 border-stone-300 text-stone-700',
        navColor: 'bg-white border-stone-300',
        accentColor: 'text-stone-600',
        textColor: 'text-stone-800',
        particleColor: 'rgba(71, 85, 105, 0.1)', // Slate
        particleIcon: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" // Badge
    },
    THE_GUILD: {
        id: 'THE_GUILD',
        name: 'The Guild',
        bgGradient: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100',
        headerColor: 'bg-white/90 border-amber-200 text-amber-700',
        navColor: 'bg-white border-amber-200',
        accentColor: 'text-amber-600',
        textColor: 'text-amber-900',
        particleColor: 'rgba(217, 119, 6, 0.15)', // Gold
        particleIcon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" // Coin/Globe
    }
};

// --- BACKGROUND VISUALS COMPONENT ---
const BackgroundEffects: React.FC<{ theme: FactionTheme }> = React.memo(({ theme }) => {
    // Generate static random positions so they don't jump on re-render, but only on mount
    const [particles] = useState(() => Array.from({ length: 15 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 40 + 20,
        duration: Math.random() * 10 + 10, // 10-20s
        delay: Math.random() * 5
    })));

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {particles.map((p, i) => (
                <div 
                    key={i}
                    className="absolute animate-float-slow opacity-20"
                    style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        color: theme.particleColor,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full animate-spin-slow">
                        <path d={theme.particleIcon} />
                    </svg>
                </div>
            ))}
        </div>
    );
});

// --- DETERMINISTIC MOCK DATA GENERATOR ---
const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

// Simplified Story Generator Fallback
const GENERATE_STORY = (name: string, faction: string, theme: string) => {
    return [
        { title: "Introduction", content: `${name} joins the ${faction} in this ${theme} timeline. It was a rainy day in Yokohama when everything changed.`, unlockBondLevel: 0 },
        { title: "Daily Routine", content: `Life is never boring for ${name}. Between ability training and dodging paperwork, there's always something happening at the ${faction}.`, unlockBondLevel: 3 },
        { title: "Hidden Truth", content: `A hidden truth about ${name} revealed only to those they trust most. The past is a ghost that never truly leaves.`, unlockBondLevel: 10 }
    ];
};

// --- PRESET CHARACTER DATABASE ---
const PRESET_CHARACTERS = [
  // --- CANON CAST (Base) ---
  { name: 'Atsushi Nakajima', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'AGENCY' },
  { name: 'Osamu Dazai', rarity: Rarity.SSR, element: CardElement.LOGIC, faction: 'AGENCY' },
  { name: 'Doppo Kunikida', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'AGENCY' },
  { name: 'Ranpo Edogawa', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'AGENCY' },
  { name: 'Akiko Yosano', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'AGENCY' },
  { name: 'Kenji Miyazawa', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'AGENCY' },
  { name: 'Junichiro Tanizaki', rarity: Rarity.R, element: CardElement.EMOTION, faction: 'AGENCY' },
  { name: 'Kyouka Izumi', rarity: Rarity.SSR, element: CardElement.EMOTION, faction: 'AGENCY' },
  { name: 'Yukichi Fukuzawa', rarity: Rarity.UR, element: CardElement.STRENGTH, faction: 'AGENCY' },
  
  { name: 'Ryunosuke Akutagawa', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'MAFIA' },
  { name: 'Chuuya Nakahara', rarity: Rarity.UR, element: CardElement.STRENGTH, faction: 'MAFIA' },
  { name: 'Ichiyo Higuchi', rarity: Rarity.R, element: CardElement.LOGIC, faction: 'MAFIA' },
  { name: 'Ougai Mori', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'MAFIA' },
  { name: 'Kouyou Ozaki', rarity: Rarity.SR, element: CardElement.EMOTION, faction: 'MAFIA' },
  { name: 'Kyusaku Yumeno', rarity: Rarity.SR, element: CardElement.EMOTION, faction: 'MAFIA' },
  { name: 'Elise', rarity: Rarity.SR, element: CardElement.EMOTION, faction: 'MAFIA' },
  { name: 'Gin Akutagawa', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'MAFIA' },
  { name: 'Michizou Tachihara', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'MAFIA' }, 
  { name: 'Sakunosuke Oda', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'MAFIA' }, 

  { name: 'Francis F.', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'THE_GUILD' },
  { name: 'Lucy M.', rarity: Rarity.SR, element: CardElement.EMOTION, faction: 'THE_GUILD' },
  { name: 'Edgar Allan Poe', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'THE_GUILD' },
  { name: 'Fyodor Dostoevsky', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'DECAY' },
  { name: 'Nikolai Gogol', rarity: Rarity.SSR, element: CardElement.EMOTION, faction: 'DECAY' },
  { name: 'Sigma', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'DECAY' },
  { name: 'Saigiku Jouno', rarity: Rarity.SSR, element: CardElement.LOGIC, faction: 'HUNTING_DOGS' },
  { name: 'Tecchou Suehiro', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'HUNTING_DOGS' },
  { name: 'Teruko Okura', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'HUNTING_DOGS' },
  { name: 'Ango Sakaguchi', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'SPECIAL_DIVISION' },

  // --- SCHOOL AU (Main Cast + Tachihara/Gin) ---
  { name: 'Student Atsushi', rarity: Rarity.SR, element: CardElement.EMOTION, faction: 'AGENCY', tags: ['School AU'] },
  { name: 'Sensei Dazai', rarity: Rarity.SSR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['School AU'] },
  { name: 'Delinquent Chuuya', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['School AU'] },
  { name: 'Student Council Akutagawa', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'MAFIA', tags: ['School AU'] },
  { name: 'Disciplinary Comm. Kunikida', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['School AU'] },
  { name: 'Transfer Student Kyouka', rarity: Rarity.SR, element: CardElement.EMOTION, faction: 'AGENCY', tags: ['School AU'] },
  { name: 'Nurse Yosano', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['School AU'] },
  { name: 'Principal Fukuzawa', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['School AU'] },
  { name: 'Teacher Mori', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'MAFIA', tags: ['School AU'] },
  { name: 'Soccer Club Tachihara', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['School AU'] },
  { name: 'Archery Club Gin', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'MAFIA', tags: ['School AU'] },
  { name: 'Library Aide Poe', rarity: Rarity.R, element: CardElement.LOGIC, faction: 'THE_GUILD', tags: ['School AU'] },

  // --- HALLOWEEN HOLIDAY (Monsters/Costumes) ---
  { name: 'Vampire Dazai', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Holiday', 'Halloween'] },
  { name: 'Werewolf Atsushi', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['Holiday', 'Halloween'] },
  { name: 'Jiangshi Chuuya', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Holiday', 'Halloween'] },
  { name: 'Reaper Akutagawa', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Holiday', 'Halloween'] },
  { name: 'Witch Yosano', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Holiday', 'Halloween'] },
  { name: 'Pumpkin King Kenji', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['Holiday', 'Halloween'] },
  { name: 'Ghost Gin', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'MAFIA', tags: ['Holiday', 'Halloween'] },
  { name: 'Mummy Tachihara', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Holiday', 'Halloween'] },
  { name: 'Mad Scientist Ranpo', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Holiday', 'Halloween'] },

  // --- CHRISTMAS HOLIDAY ---
  { name: 'Santa Fukuzawa', rarity: Rarity.SSR, element: CardElement.EMOTION, faction: 'AGENCY', tags: ['Holiday', 'Christmas'] },
  { name: 'Reindeer Atsushi', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['Holiday', 'Christmas'] },
  { name: 'Gift Giver Chuuya', rarity: Rarity.UR, element: CardElement.EMOTION, faction: 'MAFIA', tags: ['Holiday', 'Christmas'] },
  { name: 'Snow Angel Kyouka', rarity: Rarity.SSR, element: CardElement.EMOTION, faction: 'AGENCY', tags: ['Holiday', 'Christmas'] },
  { name: 'Festive Dazai', rarity: Rarity.SSR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Holiday', 'Christmas'] },
  { name: 'Winter Coat Akutagawa', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Holiday', 'Christmas'] },
  { name: 'Elf Tachihara', rarity: Rarity.R, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Holiday', 'Christmas'] },
  { name: 'Snowman Kenji', rarity: Rarity.R, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['Holiday', 'Christmas'] },

  // --- SUMMER HOLIDAY (Beach/Yukata) ---
  { name: 'Beach Chuuya', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Holiday', 'Summer'] },
  { name: 'Lifeguard Kunikida', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['Holiday', 'Summer'] },
  { name: 'Yukata Kyouka', rarity: Rarity.SSR, element: CardElement.EMOTION, faction: 'AGENCY', tags: ['Holiday', 'Summer'] },
  { name: 'Surfer Tachihara', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Holiday', 'Summer'] },
  { name: 'Summer Festival Dazai', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Holiday', 'Summer'] },
  { name: 'Fireworks Gin', rarity: Rarity.SR, element: CardElement.EMOTION, faction: 'MAFIA', tags: ['Holiday', 'Summer'] },
  { name: 'Watermelon Split Akutagawa', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Holiday', 'Summer'] },

  // --- BAND AU (Music) ---
  { name: 'Vocals Chuuya', rarity: Rarity.UR, element: CardElement.EMOTION, faction: 'MAFIA', tags: ['Band AU', 'Multiverse'] },
  { name: 'Bass Dazai', rarity: Rarity.SSR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Band AU', 'Multiverse'] },
  { name: 'Drums Atsushi', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['Band AU', 'Multiverse'] },
  { name: 'Guitar Akutagawa', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Band AU', 'Multiverse'] },
  { name: 'Keyboard Ranpo', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Band AU', 'Multiverse'] },
  { name: 'Manager Yosano', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Band AU', 'Multiverse'] },
  { name: 'Roadie Tachihara', rarity: Rarity.R, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Band AU', 'Multiverse'] },
  { name: 'Fan Club Gin', rarity: Rarity.R, element: CardElement.EMOTION, faction: 'MAFIA', tags: ['Band AU', 'Multiverse'] },

  // --- BEAST AU ---
  { name: 'Beast Dazai', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'MAFIA', tags: ['Beast AU', 'Multiverse'] },
  { name: 'Beast Atsushi', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Beast AU', 'Multiverse'] },
  { name: 'Beast Akutagawa', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['Beast AU', 'Multiverse'] },
  { name: 'Beast Gin', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Beast AU', 'Multiverse'] },
  { name: 'Beast Kyouka', rarity: Rarity.SR, element: CardElement.EMOTION, faction: 'AGENCY', tags: ['Beast AU', 'Multiverse'] },

  // --- DEAD APPLE ---
  { name: 'Dead Apple Dazai', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Dead Apple', 'Multiverse'] },
  { name: 'Dead Apple Chuuya', rarity: Rarity.UR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Dead Apple', 'Multiverse'] },
  { name: 'Dead Apple Atsushi', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['Dead Apple', 'Multiverse'] },
  { name: 'Dead Apple Akutagawa', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Dead Apple', 'Multiverse'] },
  { name: 'Shibusawa', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'DECAY', tags: ['Dead Apple', 'Multiverse'] },

  // --- OTHER AUs ---
  { name: 'Chuuya Nakahara (ADA)', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['ADA AU', 'Multiverse'] },
  { name: 'Fem Atsushi', rarity: Rarity.SR, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['Gender Swap', 'Multiverse'] },
  { name: 'Fem Dazai', rarity: Rarity.SSR, element: CardElement.EMOTION, faction: 'AGENCY', tags: ['Gender Swap', 'Multiverse'] },
  { name: 'Fem Chuuya', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Gender Swap', 'Multiverse'] },
  { name: 'Witch Atsushi', rarity: Rarity.SR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Owl House AU', 'Multiverse'] },
  { name: 'Demon King Dazai', rarity: Rarity.SSR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Owl House AU', 'Multiverse'] },
  { name: 'Hero Atsushi', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['MHA AU', 'Multiverse'] },
  { name: 'Ladybug Chuuya', rarity: Rarity.UR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['MLB AU', 'Multiverse'] },
  { name: 'Chat Noir Dazai', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['MLB AU', 'Multiverse'] },
  { name: 'White Reaper Akutagawa', rarity: Rarity.UR, element: CardElement.STRENGTH, faction: 'AGENCY', tags: ['Inverted AU', 'Multiverse'] },
  { name: 'Mafia Atsushi', rarity: Rarity.UR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Inverted AU', 'Multiverse'] },
  { name: 'Barista Atsushi', rarity: Rarity.R, element: CardElement.EMOTION, faction: 'AGENCY', tags: ['Modern AU', 'Multiverse'] },
  { name: 'Slytherin Dazai', rarity: Rarity.SSR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Hogwarts AU', 'Multiverse'] },
  { name: 'Gryffindor Chuuya', rarity: Rarity.SSR, element: CardElement.STRENGTH, faction: 'MAFIA', tags: ['Hogwarts AU', 'Multiverse'] },
  { name: 'Son of Hermes Dazai', rarity: Rarity.SSR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['PJO AU', 'Multiverse'] },
  { name: 'Actor Dazai', rarity: Rarity.SR, element: CardElement.EMOTION, faction: 'AGENCY', tags: ['Actor AU', 'Multiverse'] },
  { name: 'Kitsune Dazai', rarity: Rarity.UR, element: CardElement.LOGIC, faction: 'AGENCY', tags: ['Yokai AU', 'Multiverse'] }
];

const generateMockCards = (): Card[] => {
  return PRESET_CHARACTERS.map((char: any, i) => ({
      id: `card_${i}_${char.name.replace(/\s/g, '')}`,
      name: char.name,
      rarity: char.rarity as Rarity,
      imageUrl: `https://image.pollinations.ai/prompt/anime%20character%20${encodeURIComponent(char.name)}%20bungou%20stray%20dogs%20official%20art%20style?width=300&height=450&nologo=true&seed=${i + 300}`,
      description: `${char.name}, a prominent member of the ${char.faction}.`,
      tags: ['BSD', char.faction, 'Anime', ...(char.tags || [])],
      element: char.element as CardElement,
      skill: { 
          type: i % 3 === 0 ? SkillType.COIN_BOOST : i % 3 === 1 ? SkillType.CRIT_BOOST : SkillType.HEALER, 
          value: char.rarity === Rarity.UR ? 2.0 : char.rarity === Rarity.SSR ? 1.5 : 1.2, 
          description: char.rarity === Rarity.UR ? 'Supreme Ability' : 'Unique Ability' 
      },
      baseStats: { 
          attack: char.rarity === Rarity.UR ? 1200 : char.rarity === Rarity.SSR ? 900 : 500, 
          health: char.rarity === Rarity.UR ? 2500 : char.rarity === Rarity.SSR ? 1800 : 1000 
      },
      storyChapters: GENERATE_STORY(char.name, char.faction, 'Canon')
  }));
};

const INITIAL_FURNITURE: Furniture[] = [
    { id: 'f1', name: 'Vintage Desk', cost: 500, icon: 'https://image.pollinations.ai/prompt/isometric%20vintage%20wooden%20desk%20game%20asset%20white%20background?width=100&height=100&nologo=true', type: 'item' },
    { id: 'f2', name: 'Bookshelf', cost: 300, icon: 'https://image.pollinations.ai/prompt/isometric%20bookshelf%20filled%20books%20game%20asset%20white%20background?width=100&height=100&nologo=true', type: 'item' },
    { id: 'f3', name: 'Persian Rug', cost: 400, icon: 'https://image.pollinations.ai/prompt/isometric%20persian%20rug%20game%20asset%20white%20background?width=100&height=100&nologo=true', type: 'floor' },
    { id: 'f4', name: 'Plant', cost: 100, icon: 'https://image.pollinations.ai/prompt/isometric%20potted%20plant%20game%20asset%20white%20background?width=100&height=100&nologo=true', type: 'item' },
    { id: 'f5', name: 'Coffee Maker', cost: 200, icon: 'https://image.pollinations.ai/prompt/isometric%20coffee%20maker%20game%20asset%20white%20background?width=100&height=100&nologo=true', type: 'item' },
];

export default function App() {
  const [view, setView] = useState<'home' | 'study' | 'gacha' | 'collection' | 'card_detail' | 'chat' | 'admin' | 'profile' | 'game_flash' | 'game_memory' | 'game_battle' | 'dorm' | 'story'>('home');
  const [userEmail, setUserEmail] = useState('');
  
  // Persisted Data
  const [coins, setCoins] = useState(1000);
  const [cards, setCards] = useState<Card[]>([]);
  const [inventory, setInventory] = useState<Record<string, UserCard>>({});
  const [team, setTeam] = useState<string[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [notes, setNotes] = useState<Note[]>([]); 
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [lastTaskDate, setLastTaskDate] = useState('');
  const [faction, setFaction] = useState<Faction>('AGENCY');
  const [dorm, setDorm] = useState<DormState>({ unlockedFurniture: [], placedFurniture: [] });
  const [furnitureCatalog, setFurnitureCatalog] = useState<Furniture[]>(INITIAL_FURNITURE);
  const [pullsSinceSSR, setPullsSinceSSR] = useState(0);
  
  // New States for Suggestions
  const [schedulerTasks, setSchedulerTasks] = useState<SchedulerTask[]>([]);
  const [lastFortuneDate, setLastFortuneDate] = useState<string>('');

  // Transient State
  const [activeStudySet, setActiveStudySet] = useState<StudySet | null>(null);
  const [battleBg, setBattleBg] = useState('https://image.pollinations.ai/prompt/anime%20city%20ruins%20night%20yokohama%20background?width=800&height=600&nologo=true&model=flux&seed=bg1');
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [lastDailyClaim, setLastDailyClaim] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTransitioningTheme, setIsTransitioningTheme] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => setToast({ msg, type });

  // --- DEBUGGER ---
  useEffect(() => {
    (window as any).gameDebug = {
        state: { coins, cards, inventory, team, banners, studySets, notes, schedulerTasks },
        actions: { setCoins, setCards, setInventory, setTeam, setBanners },
        utils: { generateMockCards }
    };
  }, [coins, cards, inventory, team, banners, studySets, notes, schedulerTasks]);

  // --- DATA PERSISTENCE KEYS ---
  const KEY_GAME_DATA = 'bst_data_v5'; // Bumped to v5 for HUGE AU update
  const KEY_USER_DATA = 'bst_user_v1'; 

  // Initialize Data
  useEffect(() => {
    // 1. Setup Defaults
    const initialCards = generateMockCards();
    const initialBanners: Banner[] = [
      { id: 'b1', name: 'Standard Scout', imageUrl: 'https://image.pollinations.ai/prompt/anime%20group%20bungou%20stray%20dogs%20detective%20agency%20banner?width=800&height=300&nologo=true&model=flux&seed=b1', description: 'Regular pool. Obtain various characters!', rateUpTags: [], theme: 'standard' },
      { id: 'b2', name: 'School AU Event', imageUrl: 'https://image.pollinations.ai/prompt/anime%20school%20classroom%20bungou%20stray%20dogs%20banner?width=800&height=300&nologo=true&model=flux&seed=b2', description: 'Class is in session! Rate UP for School AU.', rateUpTags: ['School AU'], theme: 'au' },
      { id: 'b3', name: 'Multiverse Madness', imageUrl: 'https://image.pollinations.ai/prompt/anime%20portal%20dimension%20bungou%20stray%20dogs%20banner?width=800&height=300&nologo=true&model=flux&seed=b3', description: 'Worlds collide! Rate UP for all Alternate Universe characters.', rateUpTags: ['Multiverse', 'Beast AU', 'Gender Swap', 'Owl House AU', 'MHA AU', 'MLB AU', 'Inverted AU', 'PJO AU', 'Actor AU', 'Yokai AU'], theme: 'au' },
      { id: 'b4', name: 'Holiday Celebration', imageUrl: 'https://image.pollinations.ai/prompt/anime%20christmas%20halloween%20party%20bungou%20stray%20dogs?width=800&height=300&nologo=true&model=flux&seed=b4', description: 'Limited time Holiday variants! Christmas, Halloween, and Summer!', rateUpTags: ['Holiday', 'Christmas', 'Halloween', 'Summer'], theme: 'holiday' },
      { id: 'b5', name: 'Dead Apple Collection', imageUrl: 'https://image.pollinations.ai/prompt/anime%20fog%20city%20ruins%20red%20moon%20bungou%20stray%20dogs%20banner?width=800&height=300&nologo=true&model=flux&seed=b5', description: 'The fog descends. Obtain Dead Apple variants.', rateUpTags: ['Dead Apple'], theme: 'standard' },
      { id: 'b6', name: 'Battle of the Bands', imageUrl: 'https://image.pollinations.ai/prompt/anime%20rock%20band%20concert%20bungou%20stray%20dogs%20banner?width=800&height=300&nologo=true&model=flux&seed=b6', description: 'Rock out with the Port Mafia and Agency bands!', rateUpTags: ['Band AU'], theme: 'au' },
    ];
    setCards(initialCards);
    setBanners(initialBanners);

    // 2. Load Game Data (Cards/Banners/Furniture)
    try {
        const savedData = localStorage.getItem(KEY_GAME_DATA);
        if (savedData) {
            const data = JSON.parse(savedData);
            if (data.cards && data.cards.length > 0) setCards(data.cards);
            if (data.banners) setBanners(data.banners);
            if (data.furnitureCatalog) setFurnitureCatalog(data.furnitureCatalog);
        }
    } catch (e) {
        console.error("Failed to load game data", e);
    }

    // 3. Load User Data
    try {
        const savedUser = localStorage.getItem(KEY_USER_DATA);
        if (savedUser) {
            const data = JSON.parse(savedUser);
            if (data.coins !== undefined) setCoins(data.coins);
            if (data.inventory) setInventory(data.inventory);
            if (data.team) setTeam(data.team);
            if (data.studySets) setStudySets(data.studySets);
            if (data.notes) setNotes(data.notes);
            if (data.userEmail) setUserEmail(data.userEmail);
            if (data.lastDailyClaim) setLastDailyClaim(data.lastDailyClaim);
            if (data.chatHistory) setChatHistory(data.chatHistory);
            if (data.dailyTasks) setDailyTasks(data.dailyTasks);
            if (data.lastTaskDate) setLastTaskDate(data.lastTaskDate);
            if (data.faction) setFaction(data.faction);
            if (data.dorm) setDorm(data.dorm);
            if (data.pullsSinceSSR !== undefined) setPullsSinceSSR(data.pullsSinceSSR);
            if (data.schedulerTasks) setSchedulerTasks(data.schedulerTasks);
            if (data.lastFortuneDate) setLastFortuneDate(data.lastFortuneDate);
        }
    } catch (e) {
        console.error("Failed to load user data", e);
    }
  }, []);

  // Initialize Daily Tasks
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastTaskDate !== today) {
        const newTasks: DailyTask[] = [
            { id: `t1-${Date.now()}`, description: 'Complete 2 Study Games', reward: 150, current: 0, target: 2, claimed: false, type: 'GAME' },
            { id: `t2-${Date.now()}`, description: 'Chat with a Character', reward: 50, current: 0, target: 1, claimed: false, type: 'CHAT' },
            { id: `t3-${Date.now()}`, description: 'Create a Study Set', reward: 100, current: 0, target: 1, claimed: false, type: 'STUDY' }
        ];
        setDailyTasks(newTasks);
        setLastTaskDate(today);
    }
  }, [lastTaskDate]);

  // --- SAVE LOGIC ---
  const saveData = useCallback(() => {
      // Save Game Data (Heavy)
      try {
          const gameData = { cards, banners, furnitureCatalog };
          localStorage.setItem(KEY_GAME_DATA, JSON.stringify(gameData));
      } catch (e) {
          console.error("Game Data Save Failed (Likely Storage Full)", e);
          showToast("Storage Full! Could not save Images/Cards.", 'error');
      }

      // Save User Data (Light)
      try {
          const userData = {
             coins, inventory, team, studySets, notes, userEmail, lastDailyClaim,
             chatHistory, dailyTasks, lastTaskDate, faction, dorm, pullsSinceSSR,
             schedulerTasks, lastFortuneDate
          };
          localStorage.setItem(KEY_USER_DATA, JSON.stringify(userData));
      } catch (e) {
          console.error("User Data Save Failed", e);
          showToast("Failed to save progress.", 'error');
      }
  }, [cards, banners, furnitureCatalog, coins, inventory, team, studySets, notes, userEmail, lastDailyClaim, chatHistory, dailyTasks, lastTaskDate, faction, dorm, pullsSinceSSR, schedulerTasks, lastFortuneDate]);

  // Auto-Save on changes
  useEffect(() => {
      const timer = setTimeout(() => {
          saveData();
      }, 2000); // Debounce save
      return () => clearTimeout(timer);
  }, [saveData]);

  const handleManualSave = () => {
      saveData();
      if (navigator.vibrate) navigator.vibrate(50);
      showToast("Game Saved Successfully!", 'success');
  };

  const handleClearCache = () => {
      if(window.confirm('Clear cached images to free up space? This will remove custom images from cards and study sets but keep your progress.')) {
          // Remove custom images from cards
          setCards(prev => prev.map(c => c.id.startsWith('custom_') ? { ...c, imageUrl: 'https://placehold.co/300x450/1e293b/ffffff?text=Image+Cleared' } : c));
          // Remove images from study sets
          setStudySets(prev => prev.map(s => ({ ...s, sourceImage: undefined })));
          showToast("Cache Cleared! Space freed.", 'success');
      }
  };

  const handleLogout = () => {
      if (window.confirm('Sign out?')) {
          setUserEmail('');
          setView('home');
          showToast('Signed out.', 'info');
      }
  };

  // --- IMPORT / EXPORT HANDLERS ---
  const handleExportSave = () => {
      const userData = {
          coins, inventory, team, studySets, notes, userEmail, lastDailyClaim,
          chatHistory, dailyTasks, lastTaskDate, faction, dorm, pullsSinceSSR,
          schedulerTasks, lastFortuneDate
      };
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bst_save_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Save data exported!", 'success');
  };

  const handleImportSave = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const data = JSON.parse(ev.target?.result as string);
              // Basic validation
              if (data.coins !== undefined && data.inventory) {
                  // Merge or Overwrite? Overwrite for now
                  localStorage.setItem(KEY_USER_DATA, JSON.stringify(data));
                  window.location.reload();
              } else {
                  showToast("Invalid Save File", 'error');
              }
          } catch (err) {
              console.error(err);
              showToast("Failed to parse save file", 'error');
          }
      };
      reader.readAsText(file);
  };

  // --- NEW FEATURE HANDLERS ---
  const handleFortune = () => {
      const today = new Date().toDateString();
      if (lastFortuneDate === today) {
          showToast("Come back tomorrow for another prediction!", 'info');
          return;
      }
      
      const fortunes = [
          { type: 'Great Blessing', reward: 500, msg: "Ranpo predicts a breakthrough! +500 Coins" },
          { type: 'Small Blessing', reward: 100, msg: "A pleasant surprise awaits. +100 Coins" },
          { type: 'Curse', reward: 10, msg: "Beware of sudden rain... +10 Coins" }
      ];
      
      const result = fortunes[Math.floor(Math.random() * fortunes.length)];
      setCoins(c => c + result.reward);
      setLastFortuneDate(today);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      showToast(result.msg, 'success');
  };

  const handleTaskProgress = (type: DailyTask['type']) => {
    setDailyTasks(prev => prev.map(t => {
        if (t.type === type && t.current < t.target) {
            return { ...t, current: t.current + 1 };
        }
        return t;
    }));
  };

  const handleClaimTask = (taskId: string) => {
    const task = dailyTasks.find(t => t.id === taskId);
    if (task && !task.claimed && task.current >= task.target) {
        setCoins(c => c + task.reward);
        setDailyTasks(prev => prev.map(t => t.id === taskId ? { ...t, claimed: true } : t));
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        showToast(`Task Claimed! +${task.reward} Coins`, 'success');
    }
  };

  const handleToggleFavorite = (cardId: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setInventory(prev => {
        if (!prev[cardId]) return prev;
        return {
            ...prev,
            [cardId]: { ...prev[cardId], isFavorite: !prev[cardId].isFavorite }
        };
    });
  };

  const isAdmin = true;

  // --- CRUD Handlers ---

  const handleCreateCard = (cardData: Partial<Card>) => {
    if (!cardData.name || !cardData.rarity) return;
    const newCard: Card = {
      id: `custom_${Date.now()}`,
      name: cardData.name,
      rarity: cardData.rarity as Rarity,
      imageUrl: cardData.imageUrl || 'https://picsum.photos/300/450',
      description: cardData.description || 'Custom Card',
      tags: ['Custom'],
      skill: { type: SkillType.COIN_BOOST, value: 1.1, description: 'Custom Skill' },
      baseStats: { attack: 100, health: 100 },
      element: CardElement.LOGIC,
      ...cardData
    } as Card;
    setCards(prev => [...prev, newCard]);
    showToast('Card Created!', 'success');
  };

  const handleUpdateCard = (cardData: Partial<Card>) => {
    if (!cardData.id) return;
    setCards(prev => prev.map(c => c.id === cardData.id ? { ...c, ...cardData } as Card : c));
    showToast('Card Updated!', 'success');
  };

  const handleDeleteCard = (id: string) => {
    if (window.confirm('Delete this card from the game database? This cannot be undone.')) {
        // 1. Remove from Global Cards
        setCards(prev => prev.filter(c => c.id !== id));
        
        // 2. Remove from User Inventory (Cleanup)
        setInventory(prev => {
            const newInventory = { ...prev };
            delete newInventory[id];
            return newInventory;
        });

        // 3. Remove from Teams
        setTeam(prev => prev.filter(cardId => cardId !== id));

        showToast('Card deleted.', 'info');
    }
  };

  const handleRetireCard = (cardId: string) => {
    const userCard = inventory[cardId];
    if (!userCard) return;
    
    if (team.includes(cardId)) {
        showToast("Cannot retire a card that is in your team!", 'error');
        return;
    }
    if (userCard.isFavorite) {
        showToast("Cannot retire a favorite card!", 'error');
        return;
    }

    const card = cards.find(c => c.id === cardId);
    let value = 100;
    if (card?.rarity === Rarity.SR) value = 500;
    if (card?.rarity === Rarity.SSR) value = 2000;
    if (card?.rarity === Rarity.UR) value = 5000;
    
    value += (userCard.level - 1) * 50; 

    if (window.confirm(`Retire ${card?.name || 'this card'}? You will gain ${value} coins. This action is irreversible.`)) {
        setFocusedCardId(null);
        setView('collection');

        setInventory(prev => {
            const newInventory = { ...prev };
            delete newInventory[cardId];
            return newInventory;
        });
        setCoins(c => c + value);
        if (navigator.vibrate) navigator.vibrate([100, 50]);
        showToast(`Retired card for ${value} coins.`, 'success');
    }
  };

  const handleCreateBanner = (banner: Banner) => {
    setBanners(prev => [...prev, { ...banner, id: `banner_${Date.now()}` }]);
    showToast('Banner Created', 'success');
  };

  const handleUpdateBanner = (banner: Banner) => {
    setBanners(prev => prev.map(b => b.id === banner.id ? banner : b));
    showToast('Banner Updated', 'success');
  };

  const handleDeleteBanner = (id: string) => {
    if (window.confirm('Delete this banner?')) setBanners(prev => prev.filter(b => b.id !== id));
  };

  const handleCreateFurniture = (item: Furniture) => {
      setFurnitureCatalog(prev => [...prev, { ...item, id: `furn_${Date.now()}` }]);
      showToast('Furniture Item Created', 'success');
  };

  const handleUpdateFurniture = (item: Furniture) => {
      setFurnitureCatalog(prev => prev.map(f => f.id === item.id ? item : f));
      showToast('Furniture Updated', 'success');
  };

  const handleDeleteFurniture = (id: string) => {
      if (window.confirm('Delete this item?')) {
          setFurnitureCatalog(prev => prev.filter(f => f.id !== id));
          setDorm(prev => ({
              ...prev,
              placedFurniture: prev.placedFurniture.filter(p => p.id !== id),
              unlockedFurniture: prev.unlockedFurniture.filter(u => u !== id)
          }));
      }
  };

  const handleDailyClaim = () => {
    const today = new Date().toDateString();
    setCoins(c => c + 100);
    setLastDailyClaim(today);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    showToast("Claimed 100 daily coins!", 'success');
  };

  const handlePull = async (bannerId: string, amount: number) => {
    const cost = amount * 100;
    if (coins < cost) {
        if (navigator.vibrate) navigator.vibrate(200);
        return showToast("Not enough coins!", 'error');
    }

    const banner = banners.find(b => b.id === bannerId);
    setCoins(prev => prev - cost);
    handleTaskProgress('PULL');
    
    const results: Card[] = [];
    let localPity = pullsSinceSSR;
    let highRarityPulled = false;

    for (let i = 0; i < amount; i++) {
      localPity++;
      let roll = Math.random();
      let rarity = Rarity.R;

      if (localPity > 100) {
        rarity = Math.random() > 0.5 ? Rarity.SSR : Rarity.UR;
        localPity = 0;
      } else {
        if (roll < 0.03) { rarity = Rarity.UR; localPity = 0; }
        else if (roll < 0.10) { rarity = Rarity.SSR; localPity = 0; }
        else if (roll < 0.40) rarity = Rarity.SR;
      }
      if (rarity === Rarity.SSR || rarity === Rarity.UR) highRarityPulled = true;

      let pool = cards.filter(c => c.rarity === rarity);
      if (banner && (banner.theme === 'au' || banner.theme === 'holiday')) {
        const rateUpPool = pool.filter(c => c.tags.some(t => banner.rateUpTags.includes(t)));
        if (rateUpPool.length > 0) pool = rateUpPool;
      }
      if (pool.length === 0) pool = cards.filter(c => c.rarity === rarity);
      if (pool.length === 0) pool = cards;

      const pulled = pool[Math.floor(Math.random() * pool.length)];
      results.push(pulled);

      setInventory(prev => {
        const existing = prev[pulled.id];
        return {
          ...prev,
          [pulled.id]: existing 
            ? { ...existing, duplicates: existing.duplicates + 1 }
            : { cardId: pulled.id, level: 1, duplicates: 0, isFavorite: false, obtainedAt: Date.now(), bond: 0 }
        };
      });
    }
    setPullsSinceSSR(localPity);
    if (highRarityPulled) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        showToast(`Lucky! Pulled High Rarity Cards!`, 'success');
    } else {
        if (navigator.vibrate) navigator.vibrate(100);
    }
  };

  const handleGenerateStudySet = async (input: string, type: 'text' | 'url' | 'image', count: number = 10, difficulty: string = 'Medium') => {
    setIsGenerating(true);
    try {
        const processedText = await processRawMaterial(input, type);
        const questions = await generateQuizFromContent(processedText, count, difficulty);
        
        let title = 'Quick Notes';
        if (type === 'url') title = 'Web/Video Study';
        else if (type === 'image') title = 'Image Analysis';
        else if (input.length > 30) title = input.substring(0, 30) + '...';

        const newSet: StudySet = {
          id: `set_${Date.now()}`,
          title: title,
          content: processedText,
          questions,
          type: type === 'image' ? 'image' : 'text',
          sourceImage: type === 'image' ? input : undefined, // Save the image if present
          created: Date.now()
        };
        setStudySets(prev => [newSet, ...prev]);
        setActiveStudySet(newSet);
        handleTaskProgress('STUDY');
        if (navigator.vibrate) navigator.vibrate([50, 100]);
        showToast("Study Set Generated!", 'success');
    } catch (e) {
        showToast("Failed to generate set.", 'error');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDeleteStudySet = (id: string) => {
    if (window.confirm("Delete this study set?")) {
      setStudySets(prev => prev.filter(s => s.id !== id));
      if (activeStudySet?.id === id) setActiveStudySet(null);
    }
  };

  const handleSendMessage = async (charId: string, text: string) => {
    const userMsg = { role: 'user', text } as ChatMessage;
    setChatHistory(prev => [...prev, userMsg]);
    setIsTyping(true);
    handleTaskProgress('CHAT');

    const card = cards.find(c => c.id === charId);
    if (card) {
      const reply = await getCharacterChatResponse(card, chatHistory, userMsg.text);
      if (navigator.vibrate) navigator.vibrate(50);
      setChatHistory(prev => [...prev, { role: 'model', text: reply }]);
      
      // Increase Bond on Chat
      setInventory(prev => {
          if (!prev[charId]) return prev;
          return {
              ...prev,
              [charId]: { ...prev[charId], bond: Math.min(100, (prev[charId].bond || 0) + 1) }
          };
      });
    }
    setIsTyping(false);
  };

  const handleLimitBreak = (cardId: string) => {
    setInventory(prev => {
      const item = prev[cardId];
      if (item.duplicates > 0) {
        if (item.level >= 100) {
           showToast("Already Max Level (100)!", 'error');
           return prev;
        }
        
        if (navigator.vibrate) navigator.vibrate([50, 50, 200]);
        showToast("Limit Break Successful! +5 Levels", 'success');
        
        const newLevel = Math.min(100, item.level + 5);
        return { ...prev, [cardId]: { ...item, level: newLevel, duplicates: item.duplicates - 1 } };
      }
      return prev;
    });
  };

  const handleLevelUp = (cardId: string) => {
    const userCard = inventory[cardId];
    if (!userCard) return;

    if (userCard.level >= 100) {
      showToast("Max Level Reached!", 'info');
      return;
    }

    const cost = userCard.level * 50; 
    if (coins >= cost) {
      setCoins(c => c - cost);
      setInventory(prev => ({ ...prev, [cardId]: { ...userCard, level: userCard.level + 1 } }));
      if (navigator.vibrate) navigator.vibrate(100);
      showToast(`Level Up!`, 'success');
    } else {
      if (navigator.vibrate) navigator.vibrate(200);
      showToast(`Need ${cost} coins!`, 'error');
    }
  };

  const handleViewCardDetails = (cardId: string) => {
    setFocusedCardId(cardId);
    setView('card_detail');
  };

  // Dorm Logic
  const handlePurchaseFurniture = (cost: number, id: string) => {
     if (coins >= cost) {
        setCoins(c => c - cost);
        setDorm(d => ({ ...d, unlockedFurniture: [...d.unlockedFurniture, id] }));
        if (navigator.vibrate) navigator.vibrate(100);
        showToast("Purchased Furniture!", 'success');
     } else {
        if (navigator.vibrate) navigator.vibrate(200);
        showToast("Not enough coins.", 'error');
     }
  };
  
  const handleUpdateDorm = (newDorm: DormState) => {
      setDorm(newDorm);
      showToast("Room layout saved!", 'success');
  };

  // Faction Setter Wrapper
  const handleSetFaction = (newFaction: Faction) => {
      if (newFaction !== faction) {
          setIsTransitioningTheme(true);
          setTimeout(() => {
              setFaction(newFaction);
              setTimeout(() => {
                  setIsTransitioningTheme(false);
              }, 500);
          }, 300);
      }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => { setPomodoroTime(t => t - 1); }, 1000);
    } else if (pomodoroTime === 0 && pomodoroActive) {
      setPomodoroActive(false);
      setCoins(c => c + 500); 
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      showToast("Pomodoro Finished! +500 Coins", 'success');
      setPomodoroTime(25 * 60);
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroTime]);

  const handleGameComplete = (score: number, earnedCoins: number, masteryUpdate?: {id: string, correct: boolean}[]) => {
      setCoins(c => c + earnedCoins);
      handleTaskProgress('GAME');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      showToast(`Earned ${earnedCoins} Coins!`, 'success');
      
      // Bond Increase Logic for Team
      if (earnedCoins > 0) {
          setInventory(prev => {
              const next = { ...prev };
              team.forEach(id => {
                  if (next[id]) next[id] = { ...next[id], bond: Math.min(100, (next[id].bond || 0) + 1) };
              });
              return next;
          });
      }
      
      if (masteryUpdate && activeStudySet) {
          setStudySets(prev => prev.map(s => {
              if (s.id === activeStudySet.id) {
                  const newQuestions = s.questions.map(q => {
                      const update = masteryUpdate.find(u => u.id === q.id);
                      if (update) {
                          const delta = update.correct ? 10 : -5;
                          return { ...q, mastery: Math.min(100, Math.max(0, (q.mastery || 0) + delta)) };
                      }
                      return q;
                  });
                  return { ...s, questions: newQuestions };
              }
              return s;
          }));
      }
      setView('study');
  };

  const theme = FACTION_THEMES[faction] || FACTION_THEMES['AGENCY'];

  const Header = () => (
    <header className={`fixed top-0 left-0 w-full backdrop-blur-md border-b p-4 z-50 flex justify-between items-center shadow-sm transition-colors duration-500 ${theme.headerColor}`}>
      <h1 className="text-xl font-bold tracking-tight cursor-pointer" onClick={() => setView('home')}>
          {theme.name}
      </h1>
      <div className="flex items-center gap-4">
        <div className={`px-3 py-1 rounded-full font-bold border shadow-sm flex items-center gap-1 bg-white/50 border-white/20`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
          {coins.toLocaleString()}
        </div>
        {!userEmail ? (
          <button onClick={() => setShowLoginModal(true)} className="text-xs bg-slate-100 p-2 rounded hover:bg-slate-200 text-slate-600 font-bold">Sign In</button>
        ) : (
          <button onClick={() => setView('profile')} className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden border-2 border-white">
             {team[0] && cards.find(c => c.id === team[0]) ? <img src={cards.find(c => c.id === team[0])?.imageUrl} className="w-full h-full object-cover" /> : userEmail[0]}
          </button>
        )}
      </div>
    </header>
  );

  const Navigation = () => (
    <nav className={`fixed bottom-0 left-0 w-full border-t flex justify-around p-3 z-50 shadow-lg transition-colors duration-500 ${theme.navColor}`}>
      <button onClick={() => setView('home')} className={`flex flex-col items-center group ${theme.textColor}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1 group-hover:scale-110 transition">
          <path d="M11.47 3.84a.75.75 0 011.06 0l8.632 8.632a.75.75 0 01-1.06 1.06l-.353-.353V21a.75.75 0 01-.75.75H8a.75.75 0 01-.75-.75v-6.102a2.25 2.25 0 00-2.25-2.25H4.5a.75.75 0 010-1.5h.5a.75.75 0 01.75.75v6.102a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75V13.18l-.353.353a.75.75 0 01-1.06-1.06l8.632-8.632z" />
          <path d="M16.5 13.5h-9a.75.75 0 000 1.5h9a.75.75 0 000-1.5z" /> 
        </svg>
        <span className="text-[10px] font-bold">Base</span>
      </button>
      <button onClick={() => setView('study')} className={`flex flex-col items-center group ${theme.textColor}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1 group-hover:scale-110 transition">
          <path d="M11.25 4.533A9.707 9.707 0 006 3.755c-2.348 0-4.526.918-6.197 2.425a1.126 1.126 0 01-1.553 0L3.124 2.39a.75.75 0 10-1.248-.832L.209 6.357a.75.75 0 00.598 1.117h6.638a.75.75 0 00.565-1.243l-1.63-1.902a7.24 7.24 0 013.87-1.079c2.467 0 4.649 1.192 5.96 3.018a.75.75 0 001.218-.813A9.73 9.73 0 0011.25 4.533zM22.78 17.633a.75.75 0 00-.598-1.117h-6.638a.75.75 0 00-.566 1.243l1.63 1.902a7.24 7.24 0 01-3.87 1.079 7.235 7.235 0 01-5.96-3.019.75.75 0 00-1.218.813 9.73 9.73 0 006.178 3.712 9.707 9.707 0 005.25-.778 1.126 1.126 0 011.553 0l4.873 3.79a.75.75 0 001.248-.832l-1.667-4.802z" />
          <path d="M12.75 7.5a.75.75 0 00-1.5 0v3.502c0 .265.14.51.37.653l2.625 1.64a.75.75 0 00.794-1.27l-2.29-1.43V7.5z" />
        </svg>
        <span className="text-[10px] font-bold">Study</span>
      </button>
      <button onClick={() => setView('gacha')} className={`flex flex-col items-center group ${theme.textColor}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1 group-hover:scale-110 transition">
          <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
        </svg>
        <span className="text-[10px] font-bold">Scout</span>
      </button>
      <button onClick={() => setView('collection')} className={`flex flex-col items-center group ${theme.textColor}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1 group-hover:scale-110 transition">
          <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-4.422 6.375 6.375 0 00-4.825-9.436.75.75 0 01-.751.75c-.233 0-.455.043-.662.124a5.63 5.63 0 011.412 11.88z" />
        </svg>
        <span className="text-[10px] font-bold">Team</span>
      </button>
      <button onClick={() => setView('chat')} className={`flex flex-col items-center group ${theme.textColor}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1 group-hover:scale-110 transition">
          <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
        </svg>
        <span className="text-[10px] font-bold">Chat</span>
      </button>
      <button onClick={() => setView('dorm')} className={`flex flex-col items-center group ${theme.textColor}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1 group-hover:scale-110 transition">
          <path d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z" />
          <path fillRule="evenodd" d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.006zM18 20.25v-9.565l1.5.545v9.02H18z" clipRule="evenodd" />
        </svg>
        <span className="text-[10px] font-bold">Dorm</span>
      </button>
    </nav>
  );
  
  // RENDER MAIN VIEW
  return (
    <div className={`min-h-screen pb-16 transition-colors duration-500 relative ${theme.bgGradient} ${theme.textColor}`}>
      <BackgroundEffects theme={theme} />
      
      {/* THEME TRANSITION OVERLAY */}
      <div className={`fixed inset-0 z-[100] bg-slate-900 pointer-events-none transition-transform duration-500 ease-in-out ${isTransitioningTheme ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-4xl font-black text-white uppercase tracking-[0.5em] animate-pulse">
                  System Override
              </h1>
          </div>
      </div>

      <Header />
      
      {/* View Router */}
      <div className="pt-[72px] animate-fade-in relative z-10">
        <ErrorBoundary>
          {view === 'home' && (
            <HomeView 
              userEmail={userEmail}
              pomodoroTime={pomodoroTime}
              pomodoroActive={pomodoroActive}
              setPomodoroActive={setPomodoroActive}
              lastDailyClaim={lastDailyClaim}
              onDailyClaim={handleDailyClaim}
              onLoginClick={() => setShowLoginModal(true)}
              dailyTasks={dailyTasks}
              onClaimTask={handleClaimTask}
              schedulerTasks={schedulerTasks}
              setSchedulerTasks={setSchedulerTasks}
              onConsultRanpo={handleFortune}
              teamLeader={team[0] ? cards.find(c => c.id === team[0]) : null}
            />
          )}

          {view === 'study' && (
            <StudyView 
              studySets={studySets}
              notes={notes}
              setNotes={setNotes}
              onGenerate={handleGenerateStudySet}
              onDelete={handleDeleteStudySet}
              onPlay={(set, mode) => {
                setActiveStudySet(set);
                setView(mode);
              }}
              isLoading={isGenerating}
            />
          )}

          {view === 'gacha' && (
            <GachaView 
              banners={banners}
              coins={coins}
              onPull={handlePull}
              recentCards={(Object.values(inventory) as UserCard[]).sort((a,b) => b.obtainedAt - a.obtainedAt).slice(0, 5).map(u => cards.find(c => c.id === u.cardId)).filter(Boolean) as Card[]}
              pityCount={pullsSinceSSR}
            />
          )}

          {view === 'collection' && (
            <CollectionView 
              cards={cards}
              inventory={inventory}
              team={team}
              setTeam={setTeam}
              onLimitBreak={handleLimitBreak}
              onViewDetails={handleViewCardDetails}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          
          {view === 'card_detail' && focusedCardId && (
              <CardDetailView 
                card={cards.find(c => c.id === focusedCardId)!}
                userCard={inventory[focusedCardId]}
                coins={coins}
                onLevelUp={() => handleLevelUp(focusedCardId)}
                onLimitBreak={() => handleLimitBreak(focusedCardId)}
                onBack={() => setView('collection')}
                onToggleTeam={() => {
                    if(team.includes(focusedCardId)) setTeam(t => t.filter(id => id !== focusedCardId));
                    else if(team.length < 3) setTeam(t => [...t, focusedCardId]);
                    else showToast("Team Full", 'error');
                }}
                onToggleFavorite={() => handleToggleFavorite(focusedCardId)}
                onRetire={() => handleRetireCard(focusedCardId)}
                isInTeam={team.includes(focusedCardId)}
              />
          )}

          {view === 'chat' && (
            <ChatView 
              cards={cards}
              inventory={inventory}
              history={chatHistory}
              onSendMessage={handleSendMessage}
              onClearHistory={() => setChatHistory([])}
              isTyping={isTyping}
            />
          )}

          {view === 'profile' && (
             <ProfileView 
               userEmail={userEmail}
               coins={coins}
               inventory={inventory}
               totalCards={cards.length}
               studySets={studySets}
               team={team}
               cards={cards}
               onLogout={handleLogout}
               onLogin={() => setShowLoginModal(true)}
               isAdmin={isAdmin}
               onAdminAccess={() => setView('admin')}
               faction={faction}
               onSetFaction={handleSetFaction}
               onExportSave={handleExportSave}
               onImportSave={handleImportSave}
               onClearCache={handleClearCache}
             />
          )}

          {view === 'admin' && isAdmin && (
             <AdminView 
                cards={cards}
                banners={banners}
                battleBg={battleBg}
                furnitureCatalog={furnitureCatalog}
                onCreate={handleCreateCard}
                onUpdate={handleUpdateCard}
                onDelete={handleDeleteCard}
                onCreateBanner={handleCreateBanner}
                onUpdateBanner={handleUpdateBanner}
                onDeleteBanner={handleDeleteBanner}
                onUpdateBattleBg={setBattleBg}
                onCreateFurniture={handleCreateFurniture}
                onUpdateFurniture={handleUpdateFurniture}
                onDeleteFurniture={handleDeleteFurniture}
             />
          )}

          {view === 'dorm' && (
             <DormView 
                coins={coins}
                onPurchase={handlePurchaseFurniture}
                dorm={dorm}
                onUpdateDorm={handleUpdateDorm}
                team={team}
                cards={cards}
                furnitureCatalog={furnitureCatalog}
             />
          )}

          {view === 'story' && (
             <StoryView 
                cards={cards}
                team={team}
             />
          )}
          
          {/* GAMES */}
          {activeStudySet && view === 'game_flash' && (
             <FlashcardFlip 
               questions={activeStudySet.questions} 
               equippedCards={team.map(id => cards.find(c => c.id === id)).filter(Boolean) as Card[]}
               onComplete={handleGameComplete}
               onExit={() => setView('study')}
             />
          )}
          {activeStudySet && view === 'game_memory' && (
             <MemoryMatch 
               questions={activeStudySet.questions} 
               equippedCards={team.map(id => cards.find(c => c.id === id)).filter(Boolean) as Card[]}
               onComplete={handleGameComplete}
               onExit={() => setView('study')}
             />
          )}
          {activeStudySet && view === 'game_battle' && (
             <BattleArena 
               questions={activeStudySet.questions}
               equippedCards={team.map(id => cards.find(c => c.id === id)).filter(Boolean) as Card[]}
               onComplete={handleGameComplete}
               onExit={() => setView('study')}
               backgroundImage={battleBg}
             />
          )}
        </ErrorBoundary>
      </div>

      <Navigation />

      {/* LOGIN MODAL (Simple Mock) */}
      {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-sm">
                  <h3 className="text-xl font-bold mb-4 text-slate-900">Agent Login</h3>
                  <input 
                    className="w-full border p-2 rounded mb-4 text-slate-800" 
                    placeholder="Enter Code Name (Email)..."
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowLoginModal(false)} className="px-4 py-2 text-slate-500 font-bold">Cancel</button>
                      <button 
                        onClick={() => {
                            if(loginInput.trim()) {
                                setUserEmail(loginInput);
                                setShowLoginModal(false);
                                showToast(`Welcome, Agent ${loginInput.split('@')[0]}`, 'success');
                            }
                        }}
                        className="px-6 py-2 bg-sky-600 text-white rounded font-bold hover:bg-sky-700"
                      >
                          Access Terminal
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
          <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}