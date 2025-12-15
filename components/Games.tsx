import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Question, Card, SkillType, Rarity, CardElement } from '../types';

interface GameProps {
  questions: Question[];
  equippedCards: Card[];
  onComplete: (score: number, coins: number, masteryUpdate?: {id: string, correct: boolean}[]) => void;
  onExit: () => void;
  backgroundImage?: string;
}

// --- VISUAL TYPES ---
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

// --- SHARED UTILS ---
const getCoinMultiplier = (cards: Card[]) => {
  let mult = 1;
  cards.forEach(c => {
    if (c.skill.type === SkillType.COIN_BOOST) mult += (c.skill.value - 1);
  });
  return mult;
};

const getXPMultiplier = (cards: Card[]) => {
    let mult = 1;
    cards.forEach(c => {
        if (c.skill.type === SkillType.XP_BOOST) mult += (c.skill.value - 1);
    });
    return mult;
};

// Map elements to colors
const ElementColors: Record<CardElement, string> = {
  [CardElement.LOGIC]: '#3b82f6', // Blue
  [CardElement.EMOTION]: '#ef4444', // Red
  [CardElement.STRENGTH]: '#22c55e', // Green
};

const ElementNames: Record<CardElement, string> = {
    [CardElement.LOGIC]: 'Logic',
    [CardElement.EMOTION]: 'Emotion',
    [CardElement.STRENGTH]: 'Strength',
};

// --- FLASHCARD FLIP ---
export const FlashcardFlip: React.FC<GameProps> = ({ questions, equippedCards, onComplete, onExit }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); 
  const [gameOver, setGameOver] = useState(false);
  const [masteryLog, setMasteryLog] = useState<{id: string, correct: boolean}[]>([]);
  
  useEffect(() => {
    let timeBonus = 0;
    equippedCards.forEach(c => {
       if (c.skill.type === SkillType.TIMER_SLOW) timeBonus += 10;
    });
    setTimeLeft(prev => prev + timeBonus);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (gameOver) return;
        if (e.code === 'Space') {
            handleFlip();
        } else if (e.code === 'ArrowRight') {
            if(currentIdx < questions.length - 1) {
                setIsFlipped(false);
                setCurrentIdx(prev => prev + 1);
            }
        } else if (e.code === 'ArrowLeft') {
            if(currentIdx > 0) {
                setIsFlipped(false);
                setCurrentIdx(prev => prev - 1);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, gameOver, questions.length]);

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleFinish();
    }
  }, [timeLeft, gameOver]);

  const handleFinish = () => {
    setGameOver(true);
    const multiplier = getCoinMultiplier(equippedCards);
    const xpMult = getXPMultiplier(equippedCards); // Logic for XP boost (used in main app for bond)
    
    // Combo Master skill adds static bonus
    let bonus = 0;
    equippedCards.forEach(c => {
        if (c.skill.type === SkillType.COMBO_MASTER) bonus += Math.floor(score * 2);
    });

    const finalScore = score + bonus;
    const coins = Math.floor(finalScore * 10 * multiplier);
    
    // Pass XP mult indirectly or use it for coin calc
    setTimeout(() => onComplete(finalScore, coins, masteryLog), 2000);
  };

  const handleFlip = () => {
      if (navigator.vibrate) navigator.vibrate(20);
      setIsFlipped(!isFlipped);
  };

  const handleNext = (correct: boolean) => {
    const q = questions[currentIdx];
    setMasteryLog(prev => [...prev, { id: q.id, correct }]);

    if (correct) {
        setScore(s => s + 1);
        if (navigator.vibrate) navigator.vibrate(50);
    } else {
        if (navigator.vibrate) navigator.vibrate(100);
    }
    setIsFlipped(false);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(p => p + 1);
    } else {
      handleFinish();
    }
  };

  if (gameOver) return <div className="p-10 text-center text-2xl animate-bounce">Time's Up! Score: {score}</div>;
  if (!questions.length) return <div>No questions loaded.</div>;

  const q = questions[currentIdx];
  const allOptions = [...q.distractors, q.definition].sort(() => Math.random() - 0.5);

  return (
    <div className="flex flex-col items-center h-full max-w-2xl mx-auto p-4">
      <div className="w-full flex justify-between mb-4">
        <button onClick={onExit} className="text-red-500 font-bold flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Exit
        </button>
        <div className="font-bold text-sky-700 bg-sky-100 px-3 py-1 rounded-full flex items-center gap-2">
            <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                </svg>
                {timeLeft}s
            </span>
            <span>|</span>
            <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
                {score}
            </span>
        </div>
      </div>
      
      <div className="text-xs text-slate-400 mb-2">Tip: Press [SPACE] to flip</div>

      <div 
        onClick={handleFlip}
        className="w-full h-64 bg-white rounded-xl shadow-lg border-2 border-sky-100 flex items-center justify-center p-8 text-center cursor-pointer transition-transform duration-500 relative perspective-1000 group hover:border-sky-300"
      >
         <div className={`transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} w-full h-full relative`}>
            {/* Front */}
            <div className="absolute inset-0 backface-hidden flex items-center justify-center flex-col">
                <span className="text-slate-400 text-xs uppercase font-bold mb-2">Term</span>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">{q.term}</h2>
                <div className="mt-2 text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded">Mastery: {q.mastery || 0}%</div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center flex-col bg-sky-50 rounded-lg border border-sky-100">
                <span className="text-sky-400 text-xs uppercase font-bold mb-2">Definition</span>
                <p className="text-lg font-medium text-slate-700">{q.definition}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-6">
        {allOptions.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleNext(opt === q.definition)}
            className="p-4 bg-white border border-slate-200 hover:bg-sky-100 hover:border-sky-300 rounded-lg text-slate-700 transition-all font-medium shadow-sm active:scale-95"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- MEMORY MATCH ---
export const MemoryMatch: React.FC<GameProps> = ({ questions, equippedCards, onComplete, onExit }) => {
  const [cards, setCards] = useState<{id: string, text: string, type: 'term'|'def', matched: boolean}[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Only take top 6 to make a 3x4 grid or 4x3
    const subset = questions.slice(0, 6);
    const gameCards = subset.flatMap((q, i) => [
      { id: q.id, text: q.term, type: 'term' as const, matched: false },
      { id: q.id, text: q.definition, type: 'def' as const, matched: false }
    ]).sort(() => Math.random() - 0.5);
    setCards(gameCards);
  }, [questions]);

  const handleCardClick = (index: number) => {
    if (gameOver || flipped.length === 2 || cards[index].matched || flipped.includes(index)) return;

    if (navigator.vibrate) navigator.vibrate(20);
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const c1 = cards[newFlipped[0]];
      const c2 = cards[newFlipped[1]];

      if (c1.id === c2.id && c1.type !== c2.type) {
        // Match
        setTimeout(() => {
            setCards(prev => prev.map((c, i) => newFlipped.includes(i) ? { ...c, matched: true } : c));
            setFlipped([]);
            setMatches(m => {
                const newM = m + 1;
                if (newM === questions.slice(0, 6).length) {
                    handleFinish();
                }
                return newM;
            });
            setScore(s => s + 100);
            if (navigator.vibrate) navigator.vibrate([50, 50]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
            setFlipped([]);
            setScore(s => Math.max(0, s - 10));
            if (navigator.vibrate) navigator.vibrate(100);
        }, 1000);
      }
    }
  };

  const handleFinish = () => {
      setGameOver(true);
      const timeTaken = (Date.now() - startTime) / 1000;
      const finalScore = Math.max(0, Math.floor(score - timeTaken)); // Time penalty
      
      const multiplier = getCoinMultiplier(equippedCards);
      const coins = Math.floor(finalScore * 0.5 * multiplier);
      
      setTimeout(() => onComplete(finalScore, coins), 1500);
  };

  if (gameOver) {
      return <div className="p-10 text-center text-2xl animate-pop">
          <h2>Great Job!</h2>
          <p>Score: {score}</p>
      </div>
  }

  return (
    <div className="flex flex-col items-center h-full p-4">
        <div className="w-full flex justify-between mb-4">
            <button onClick={onExit} className="text-red-500 font-bold flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Exit
            </button>
            <div className="font-bold text-sky-700">Matches: {matches} | Score: {score}</div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 w-full max-w-3xl">
            {cards.map((c, i) => (
                <div 
                    key={i}
                    onClick={() => handleCardClick(i)}
                    className={`aspect-square rounded-lg flex items-center justify-center p-2 text-center text-xs md:text-sm font-bold cursor-pointer transition-all duration-300 transform ${c.matched ? 'opacity-0 scale-0' : 'opacity-100'} ${flipped.includes(i) ? 'bg-white border-2 border-sky-400 text-sky-800 rotate-y-0' : 'bg-sky-200 text-transparent hover:bg-sky-300 rotate-y-180'}`}
                >
                    {flipped.includes(i) || c.matched ? c.text : '?'}
                </div>
            ))}
        </div>
    </div>
  );
};

// --- BATTLE COMPONENTS ---

const BattleSprite: React.FC<{ 
    src: string; 
    isEnemy?: boolean; 
    isAttacking?: boolean; 
    isHit?: boolean; 
    isDead?: boolean;
    isActive?: boolean;
}> = ({ src, isEnemy, isAttacking, isHit, isDead, isActive }) => {
    
    // Animation Classes
    let animClass = "transition-all duration-300";
    if (isAttacking) {
        animClass += isEnemy ? " -translate-x-24 scale-110 z-20" : " translate-x-24 scale-110 z-20";
    }
    if (isHit) {
        animClass += " animate-flash-red brightness-150";
        animClass += isEnemy ? " translate-x-4" : " -translate-x-4";
    }
    if (isDead) {
        animClass += " grayscale opacity-50 scale-90 blur-sm";
    }

    return (
        <div className={`relative w-24 h-24 md:w-32 md:h-32 ${animClass}`}>
             {isActive && !isEnemy && !isDead && (
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce z-20 flex flex-col items-center">
                     <div className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white tracking-wider">
                         ACTIVE
                     </div>
                     <div className="w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-yellow-400 border-r-[6px] border-r-transparent"></div>
                 </div>
             )}
             <img 
                src={src} 
                className={`w-full h-full object-contain drop-shadow-2xl ${isEnemy ? 'transform -scale-x-100' : ''}`} 
                alt="sprite" 
             />
             <div className="absolute bottom-0 w-full h-4 bg-black/20 rounded-full blur-md -z-10 translate-y-2"></div>
        </div>
    );
};

// --- BATTLE ARENA ---
export const BattleArena: React.FC<GameProps> = ({ questions, equippedCards, onComplete, onExit, backgroundImage }) => {
    // Lazy shuffle questions on init to ensure variety
    const [shuffledQuestions] = useState<Question[]>(() => [...questions].sort(() => Math.random() - 0.5));
    
    // Check for Faction Synergy
    const hasFactionSynergy = equippedCards.length === 3 && equippedCards.every(c => c.tags.some(t => c.tags.includes(equippedCards[0].tags[1]))); // Simplistic check, assumes index 1 is faction mostly
    // Better Faction Check: Check if any tag is common to all 3
    const commonTags = equippedCards.length === 3 ? equippedCards[0].tags.filter(t => equippedCards[1].tags.includes(t) && equippedCards[2].tags.includes(t)) : [];
    const factionBonusActive = commonTags.some(t => ['AGENCY', 'MAFIA', 'DECAY', 'HUNTING_DOGS', 'THE_GUILD'].includes(t) || t.includes('AU'));

    const [playerHp, setPlayerHp] = useState(100);
    const [enemyHp, setEnemyHp] = useState(100);
    const [turn, setTurn] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [currentQIdx, setCurrentQIdx] = useState(0);
    const [log, setLog] = useState<string[]>(["Battle Start!"]);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [activeCardIdx, setActiveCardIdx] = useState(0);
    
    // Visual States
    const [attackAnim, setAttackAnim] = useState<'player' | 'enemy' | null>(null);
    const [hitAnim, setHitAnim] = useState<'player' | 'enemy' | null>(null);
    const [screenShake, setScreenShake] = useState(false);
    
    // FX Systems
    const [particles, setParticles] = useState<Particle[]>([]);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const reqRef = useRef<number>(0);

    // Stats based on cards
    // NOTE: In a real RPG, we'd sum up HPs, but for damage we'll use individual stats
    const totalHpBase = equippedCards.length > 0 
        ? equippedCards.reduce((acc, c) => acc + c.baseStats.health, 0)
        : 1000;
    
    const maxPlayerHp = Math.floor(totalHpBase * (factionBonusActive ? 1.2 : 1));
    const maxEnemyHp = questions.length * 400 * 0.8; // Approximate scaling

    const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
        const newParts: Particle[] = [];
        for (let i = 0; i < count; i++) {
            newParts.push({
                id: Math.random(),
                x, y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color
            });
        }
        setParticles(prev => [...prev, ...newParts]);
    }, []);

    const spawnText = useCallback((x: number, y: number, text: string, color: string) => {
        setFloatingTexts(prev => [...prev, {
            id: Math.random(),
            x, y, text, life: 1.0, color
        }]);
    }, []);

    // FX Loop
    useEffect(() => {
        const loop = () => {
            setParticles(prev => prev.map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                vy: p.vy + 0.2, // gravity
                life: p.life - 0.02
            })).filter(p => p.life > 0));

            setFloatingTexts(prev => prev.map(t => ({
                ...t,
                y: t.y - 1, // float up
                life: t.life - 0.015
            })).filter(t => t.life > 0));

            reqRef.current = requestAnimationFrame(loop);
        };
        reqRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(reqRef.current);
    }, []);

    useEffect(() => {
        setPlayerHp(maxPlayerHp);
        setEnemyHp(maxEnemyHp);
        if (factionBonusActive) {
            setLog(prev => ["Faction Synergy: +20% Stats!", ...prev]);
        }
    }, []);

    const triggerScreenShake = (hard: boolean = false) => {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), hard ? 400 : 200);
    };

    const handleAnswer = (correct: boolean) => {
        if (gameOver || attackAnim || feedback) return;

        const activeCard = equippedCards.length > 0 
            ? equippedCards[activeCardIdx % equippedCards.length]
            : { 
                id: 'player',
                name: 'Player', 
                baseStats: { attack: 300, health: 100 }, 
                element: CardElement.LOGIC,
                rarity: Rarity.R,
                imageUrl: '',
                description: 'Player Avatar',
                tags: [],
                skill: { type: SkillType.COIN_BOOST, value: 0, description: 'None' }
            } as Card; // Fallback

        if (correct) {
            // Player Attack Sequence
            setAttackAnim('player');
            setLog(prev => [`${activeCard.name} is attacking!`, ...prev.slice(0, 4)]);

            // Delay for impact
            setTimeout(() => {
                let isCrit = Math.random() > 0.8;
                
                // CRIT BOOST SKILL
                if (activeCard.skill?.type === SkillType.CRIT_BOOST) {
                    if (Math.random() < (activeCard.skill.value / 10)) isCrit = true; 
                }

                // Base Damage
                let dmg = Math.floor(activeCard.baseStats.attack * (0.9 + Math.random() * 0.2));
                
                // Elemental Advantage Logic
                // Logic > Emotion > Strength > Logic
                // Random enemy element for simple variety (or fixed per quiz type later)
                const enemyElement = [CardElement.LOGIC, CardElement.EMOTION, CardElement.STRENGTH][currentQIdx % 3]; 
                let effectiveness = "Neutral";
                
                if (
                    (activeCard.element === CardElement.LOGIC && enemyElement === CardElement.EMOTION) ||
                    (activeCard.element === CardElement.EMOTION && enemyElement === CardElement.STRENGTH) ||
                    (activeCard.element === CardElement.STRENGTH && enemyElement === CardElement.LOGIC)
                ) {
                    dmg *= 1.5;
                    effectiveness = "Super Effective!";
                } else if (
                    (activeCard.element === CardElement.LOGIC && enemyElement === CardElement.STRENGTH) ||
                    (activeCard.element === CardElement.EMOTION && enemyElement === CardElement.LOGIC) ||
                    (activeCard.element === CardElement.STRENGTH && enemyElement === CardElement.EMOTION)
                ) {
                    dmg *= 0.75;
                    effectiveness = "Resisted...";
                }

                if (factionBonusActive) dmg *= 1.2;
                if (isCrit) dmg *= 1.5;

                dmg = Math.floor(dmg);

                setEnemyHp(prev => Math.max(0, prev - dmg));
                setHitAnim('enemy');
                
                // Visual FX
                const elementColor = ElementColors[activeCard.element] || '#fff';
                const elementName = ElementNames[activeCard.element] || '';

                spawnParticles(60, 40, isCrit ? '#fbbf24' : elementColor, isCrit ? 25 : 15);
                spawnText(60, 30, isCrit ? `CRIT ${dmg}!` : `${dmg}`, isCrit ? '#fbbf24' : '#fff');
                if (effectiveness !== "Neutral") spawnText(60, 20, effectiveness, effectiveness.includes("Super") ? '#4ade80' : '#94a3b8');
                
                if (isCrit) triggerScreenShake(true);
                else triggerScreenShake(false);

                if (navigator.vibrate) navigator.vibrate(isCrit ? [50, 50, 50] : 50);
                
                const moveName = isCrit ? "Ultimate Art" : `${elementName} Strike`;
                setLog(prev => [`${activeCard.name} used ${moveName}!`, ...prev.slice(0, 4)]);

                // HEALER SKILL LOGIC
                if (activeCard.skill?.type === SkillType.HEALER) {
                    const healAmount = Math.floor(maxPlayerHp * 0.05 * activeCard.skill.value);
                    setPlayerHp(prev => Math.min(maxPlayerHp, prev + healAmount));
                    spawnText(20, 30, `+${healAmount}`, '#4ade80');
                    setLog(prev => [`Healed for ${healAmount}!`, ...prev.slice(0, 4)]);
                }

                setTimeout(() => {
                    setAttackAnim(null);
                    setHitAnim(null);
                    
                    if (enemyHp - dmg <= 0) {
                        handleWin();
                    } else {
                        // Advance Turn
                        setTurn(t => t + 1);
                        setActiveCardIdx(prev => prev + 1);
                        setCurrentQIdx(prev => (prev + 1) % shuffledQuestions.length);
                    }
                }, 400);
            }, 300);

        } else {
            // Miss Sequence - Show Correct Answer!
            setLog(prev => [`Missed!`, ...prev.slice(0, 4)]);
            setFeedback(`Correct Answer: ${q.definition}`); 
            if (navigator.vibrate) navigator.vibrate(200);
            
            // Wait longer so user can read the answer
            setTimeout(() => {
                setFeedback(null); 
                setAttackAnim('enemy');
                
                setTimeout(() => {
                     const enemyDmg = Math.floor(maxPlayerHp * 0.15);
                     setPlayerHp(prev => Math.max(0, prev - enemyDmg));
                     setHitAnim('player');
                     
                     // Visual FX
                     spawnParticles(30, 40, '#ef4444', 10);
                     spawnText(30, 30, `-${enemyDmg}`, '#ef4444');
                     triggerScreenShake(true);
                     if (navigator.vibrate) navigator.vibrate(200);

                     setLog(prev => [`Enemy attacks for ${enemyDmg}!`, ...prev.slice(0, 4)]);

                     setTimeout(() => {
                        setAttackAnim(null);
                        setHitAnim(null);
                        if (playerHp - enemyDmg <= 0) handleLoss();
                        else {
                            // Advance Turn even on miss, but Active Card might take damage in a real RPG. 
                            // Here we just cycle.
                            setTurn(t => t + 1);
                            setActiveCardIdx(prev => prev + 1);
                            setCurrentQIdx(prev => (prev + 1) % shuffledQuestions.length);
                        }
                     }, 400);

                }, 300);
            }, 2500); 
        }
    };

    const handleWin = () => {
        setGameOver(true);
        setLog(prev => ["Victory!", ...prev]);
        const multiplier = getCoinMultiplier(equippedCards);
        const coins = Math.floor(200 * multiplier);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(() => onComplete(1000, coins), 2000);
    };

    const handleLoss = () => {
        setGameOver(true);
        setLog(prev => ["Defeat...", ...prev]);
        setTimeout(() => onComplete(0, 50), 2000);
    };

    const q = shuffledQuestions[currentQIdx];
    const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
    
    // Hints skill
    const hintCount = equippedCards.filter(c => c.skill.type === SkillType.HINT_REVEAL).reduce((acc, c) => acc + Math.floor(c.skill.value), 0);
    const [hintsRemaining, setHintsRemaining] = useState(hintCount);

    const useHint = () => {
        if (hintsRemaining > 0) {
            setHintsRemaining(prev => prev - 1);
            const wrong = q.distractors;
            const toDisable = wrong.slice(0, 2); 
            setDisabledOptions(toDisable);
            setLog(prev => ["Hint used!", ...prev.slice(0, 4)]);
        }
    };
    
    // Sort options to keep UI stable
    const allOptions = React.useMemo(() => {
        return q ? [...q.distractors, q.definition].sort() : [];
    }, [q]);

    if (!q) return <div>Loading battle data...</div>;

    // Current active card object (safe access)
    const currentActiveCardIdx = equippedCards.length > 0 ? activeCardIdx % equippedCards.length : -1;

    return (
        <div className={`relative w-full h-full max-w-4xl mx-auto flex flex-col overflow-hidden rounded-xl shadow-2xl bg-slate-900 ${screenShake ? 'animate-shake-hard' : ''}`}>
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img src={backgroundImage || "https://image.pollinations.ai/prompt/anime%20battle%20background%20dark%20city?width=800&height=600&nologo=true&model=flux&seed=arena"} className="w-full h-full object-cover opacity-50 transition-opacity" alt="battle_bg" />
            </div>

            {/* Particle Layer (Overlay) */}
            <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                {particles.map(p => (
                    <div 
                        key={p.id} 
                        className="absolute w-2 h-2 rounded-full"
                        style={{ 
                            left: `${p.x}%`, top: `${p.y}%`, 
                            backgroundColor: p.color, 
                            opacity: p.life,
                            transform: `scale(${p.life})`
                        }} 
                    />
                ))}
                {floatingTexts.map(t => (
                    <div 
                        key={t.id} 
                        className="absolute text-2xl font-black text-stroke shadow-sm"
                        style={{ 
                            left: `${t.x}%`, top: `${t.y}%`, 
                            color: t.color, 
                            opacity: t.life,
                            textShadow: '2px 2px 0 #000'
                        }} 
                    >
                        {t.text}
                    </div>
                ))}
            </div>

            {/* Feedback Overlay (Correct Answer) */}
            {feedback && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 animate-pop">
                    <div className="bg-white text-slate-900 p-6 rounded-2xl text-center shadow-[0_0_30px_rgba(255,255,255,0.5)] border-4 border-red-500 max-w-md">
                        <div className="text-4xl mb-2 flex justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-red-500">
                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-red-600">Missed!</h3>
                        <div className="text-sm uppercase font-bold text-slate-400 mb-1">Correct Answer</div>
                        <p className="text-lg font-bold leading-tight">{feedback.replace('Correct Answer: ', '')}</p>
                    </div>
                </div>
            )}

            {/* HUD */}
            <div className="relative z-40 p-4 flex justify-between items-start text-white text-shadow">
                <div className="flex flex-col gap-1 w-1/3">
                    <div className="flex justify-between text-xs font-bold">
                        <span>TEAM HP</span>
                        <span>{playerHp}/{maxPlayerHp}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-700 rounded-full border border-slate-500 overflow-hidden relative">
                        <div className="h-full bg-green-500 transition-all duration-300" style={{width: `${(playerHp/maxPlayerHp)*100}%`}}></div>
                        {/* Hit flash on bar */}
                        {hitAnim === 'player' && <div className="absolute inset-0 bg-white animate-pulse"></div>}
                    </div>
                </div>
                
                <div className="flex flex-col items-center">
                    <div className="font-black text-2xl tracking-widest text-yellow-400 drop-shadow-lg flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <div className="text-xs font-bold bg-black/50 px-2 rounded">Turn {turn}</div>
                </div>

                <div className="flex flex-col gap-1 w-1/3 items-end">
                    <div className="flex justify-between text-xs font-bold w-full">
                        <span>ENEMY HP</span>
                        <span>{Math.floor(enemyHp)}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-700 rounded-full border border-slate-500 overflow-hidden relative">
                        <div className="h-full bg-red-500 transition-all duration-300" style={{width: `${Math.min(100, (enemyHp/maxEnemyHp)*100)}%`}}></div>
                        {hitAnim === 'enemy' && <div className="absolute inset-0 bg-white animate-pulse"></div>}
                    </div>
                </div>
            </div>

            {/* Battle Stage */}
            <div className="relative z-10 flex-1 flex justify-between items-end px-6 md:px-12 pb-24">
                 {/* Player Team (Grouped) */}
                 <div className="flex -space-x-8 items-end relative">
                     {equippedCards.length > 0 ? equippedCards.slice(0, 3).map((c, i) => (
                         <div key={i} className="transform transition-transform" style={{ zIndex: 10 - i, transform: `translateY(${i * -5}px)` }}>
                            <BattleSprite 
                                src={c.imageUrl} 
                                isAttacking={attackAnim === 'player' && currentActiveCardIdx === i} 
                                isHit={hitAnim === 'player'}
                                isDead={playerHp <= 0}
                                isActive={currentActiveCardIdx === i && !gameOver}
                            />
                         </div>
                     )) : (
                        <BattleSprite src="https://image.pollinations.ai/prompt/chibi%20anime%20character%20fighting?width=150&height=150&nologo=true&model=flux&seed=p1" isAttacking={attackAnim === 'player'} isHit={hitAnim === 'player'} isActive={true} />
                     )}
                 </div>

                 {/* Enemy Sprite */}
                 <div className="relative">
                     <BattleSprite 
                        src="https://image.pollinations.ai/prompt/anime%20villain%20chibi%20dark?width=150&height=150&nologo=true&model=flux&seed=e1" 
                        isEnemy 
                        isAttacking={attackAnim === 'enemy'}
                        isHit={hitAnim === 'enemy'}
                        isDead={enemyHp <= 0}
                     />
                 </div>
            </div>

            {/* Log Overlay */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-72 pointer-events-none flex flex-col items-center">
                {log.map((l, i) => (
                    <div key={i} className={`text-center text-sm font-bold text-white mb-1 transition-all duration-300 px-3 py-1 rounded bg-black/30 backdrop-blur-sm border-l-4 border-sky-400 ${i === 0 ? 'opacity-100 scale-110 translate-y-0' : 'opacity-60 scale-90 -translate-y-2'}`}>{l}</div>
                ))}
            </div>

            {/* Action Bar */}
            <div className="relative z-50 bg-slate-800/95 backdrop-blur border-t-2 border-slate-600 p-4 rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                {gameOver ? (
                     <div className="text-center animate-pop">
                         <h3 className={`text-4xl font-black mb-4 ${playerHp > 0 ? 'text-yellow-400' : 'text-red-500'}`}>{playerHp > 0 ? 'VICTORY' : 'DEFEAT'}</h3>
                         <button onClick={onExit} className="bg-sky-500 hover:bg-sky-400 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition transform hover:scale-105">Return to Base</button>
                     </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-3">
                             <div className="text-sky-300 text-xs font-bold uppercase tracking-wider bg-slate-700 px-2 py-1 rounded">Target: <span className="text-white text-sm ml-1">{q.term}</span></div>
                             {hintsRemaining > 0 && (
                                 <button onClick={useHint} className="text-yellow-400 text-xs font-bold border border-yellow-400 px-3 py-1 rounded hover:bg-yellow-400/20 transition flex items-center gap-1">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                                     </svg>
                                     Hint ({hintsRemaining})
                                 </button>
                             )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {allOptions.map((opt, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleAnswer(opt === q.definition)}
                                    disabled={disabledOptions.includes(opt) || !!attackAnim || !!feedback}
                                    className={`p-3 text-sm font-bold rounded-xl text-left transition-all border-b-4 active:border-b-0 active:translate-y-1 ${disabledOptions.includes(opt) ? 'bg-slate-700 text-slate-500 border-slate-800 cursor-not-allowed' : 'bg-white hover:bg-sky-50 text-slate-800 border-slate-300 hover:border-sky-300'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};