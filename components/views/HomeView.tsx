import React, { useState } from 'react';
import { DailyTask, SchedulerTask, Card } from '../../types';

interface HomeViewProps {
  userEmail: string;
  pomodoroTime: number;
  pomodoroActive: boolean;
  setPomodoroActive: (active: boolean) => void;
  lastDailyClaim: string;
  onDailyClaim: () => void;
  onLoginClick: () => void;
  dailyTasks: DailyTask[];
  onClaimTask: (id: string) => void;
  schedulerTasks: SchedulerTask[];
  setSchedulerTasks: React.Dispatch<React.SetStateAction<SchedulerTask[]>>;
  onConsultRanpo: () => void;
  teamLeader: Card | null | undefined;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  userEmail, 
  pomodoroTime, 
  pomodoroActive, 
  setPomodoroActive, 
  lastDailyClaim, 
  onDailyClaim,
  onLoginClick,
  dailyTasks,
  onClaimTask,
  schedulerTasks,
  setSchedulerTasks,
  onConsultRanpo,
  teamLeader
}) => {
  const [newTask, setNewTask] = useState('');

  const handleAddTask = () => {
      if (newTask.trim()) {
          setSchedulerTasks([...schedulerTasks, { id: `task_${Date.now()}`, text: newTask, completed: false }]);
          setNewTask('');
      }
  };

  const toggleTask = (id: string) => {
      setSchedulerTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
      setSchedulerTasks(prev => prev.filter(t => t.id !== id));
  };

  // Dynamic greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      
      {/* Hero Banner with Team Leader */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg animate-pop relative overflow-hidden flex flex-col md:flex-row items-center gap-4">
         {/* Background graphic */}
         <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-48 h-48 transform translate-x-10 -translate-y-10">
               <path d="M11.25 4.533A9.707 9.707 0 006 3.755c-2.348 0-4.526.918-6.197 2.425a1.126 1.126 0 01-1.553 0L3.124 2.39a.75.75 0 10-1.248-.832L.209 6.357a.75.75 0 00.598 1.117h6.638a.75.75 0 00.565-1.243l-1.63-1.902a7.24 7.24 0 013.87-1.079c2.467 0 4.649 1.192 5.96 3.018a.75.75 0 001.218-.813A9.73 9.73 0 0011.25 4.533zM22.78 17.633a.75.75 0 00-.598-1.117h-6.638a.75.75 0 00-.566 1.243l1.63 1.902a7.24 7.24 0 01-3.87 1.079 7.235 7.235 0 01-5.96-3.019.75.75 0 00-1.218.813 9.73 9.73 0 006.178 3.712 9.707 9.707 0 005.25-.778 1.126 1.126 0 011.553 0l4.873 3.79a.75.75 0 001.248-.832l-1.667-4.802z" />
             </svg>
         </div>
         
         {teamLeader && (
             <div className="relative shrink-0">
                 <img src={teamLeader.imageUrl} className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-md object-cover bg-white" alt="Leader"/>
                 <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Leader</div>
             </div>
         )}

         <div className="flex-1 text-center md:text-left z-10">
            <h2 className="text-2xl font-bold mb-1">{greeting}{userEmail ? `, ${userEmail.split('@')[0]}` : ''}!</h2>
            <p className="opacity-90 text-sm md:text-base font-medium">"{teamLeader ? `Let's work hard today!` : 'Ready to study alongside the Agency?'}"</p>
            {!userEmail && (
                <button onClick={onLoginClick} className="mt-3 bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm transition">
                Sign In to Save
                </button>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* Pomodoro */}
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-sky-100 transition hover:shadow-md flex flex-col justify-between">
           <h3 className="font-bold text-sky-800 mb-2 flex items-center gap-2">
               <span className="bg-sky-100 p-1.5 rounded-lg text-sky-600">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                     <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                   </svg>
               </span>
               Pomodoro Timer
           </h3>
           <div className="text-5xl font-black font-mono text-center my-4 text-sky-600 tracking-wider">
             {Math.floor(pomodoroTime / 60)}:{(pomodoroTime % 60).toString().padStart(2, '0')}
           </div>
           <button 
            onClick={() => setPomodoroActive(!pomodoroActive)}
            className={`w-full py-3 rounded-xl font-bold transition shadow-sm ${pomodoroActive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}
           >
             {pomodoroActive ? 'STOP FOCUS' : 'START FOCUS'}
           </button>
         </div>

         {/* Daily Login & Fortune */}
         <div className="flex flex-col gap-4">
             {/* Login Bonus */}
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-sky-100 flex items-center justify-between transition hover:shadow-md">
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Daily Bonus</p>
                    <p className="font-bold text-slate-700">Login Reward</p>
                </div>
                {lastDailyClaim === new Date().toDateString() ? (
                  <button disabled className="bg-gray-100 text-gray-400 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-1 cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                    Claimed
                  </button>
                ) : (
                  <button onClick={onDailyClaim} className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-xl text-sm shadow-md animate-bounce">
                    Claim 100 🪙
                  </button>
                )}
             </div>

             {/* Fortune (Omikuji) */}
             <div className="bg-indigo-900 p-4 rounded-2xl shadow-md border border-indigo-800 text-white flex items-center justify-between relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-xl group-hover:scale-150 transition duration-700"></div>
                <div className="relative z-10">
                    <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Ultra Deduction</p>
                    <p className="font-bold text-lg">Daily Fortune</p>
                </div>
                <button onClick={onConsultRanpo} className="relative z-10 bg-white text-indigo-900 font-bold py-2 px-4 rounded-xl text-sm shadow hover:bg-indigo-50 transition active:scale-95">
                    Consult Ranpo
                </button>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Tasks */}
          <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-sky-500">
                        <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                      </svg>
                      Daily Tasks
                  </h3>
                  <span className="text-xs font-bold text-slate-400">{dailyTasks.filter(t => t.claimed).length}/{dailyTasks.length}</span>
              </div>
              <div className="p-2 divide-y divide-slate-50 flex-1">
                  {dailyTasks.map(task => {
                      const isCompleted = task.current >= task.target;
                      return (
                          <div key={task.id} className="p-3 flex items-center justify-between gap-3">
                              <div className="flex-1">
                                  <div className="flex justify-between mb-1">
                                      <span className="text-sm font-medium text-slate-700">{task.description}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                      <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${Math.min(100, (task.current / task.target) * 100)}%` }}></div>
                                  </div>
                              </div>
                              {task.claimed ? (
                                  <span className="text-xs font-bold text-slate-300">Done</span>
                              ) : isCompleted ? (
                                  <button onClick={() => onClaimTask(task.id)} className="px-3 py-1 bg-yellow-400 text-white rounded-lg text-xs font-bold shadow-sm animate-pulse">
                                      {task.reward} 🪙
                                  </button>
                              ) : (
                                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">{task.current}/{task.target}</span>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Doppo Poet Scheduler */}
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col h-full relative">
              {/* Pattern Overlay to look like notebook */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(0deg,transparent_24%,#000_25%,#000_26%,transparent_27%,transparent_74%,#000_75%,#000_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,#000_25%,#000_26%,transparent_27%,transparent_74%,#000_75%,#000_76%,transparent_77%,transparent)] bg-[length:30px_30px]"></div>
              
              <div className="p-4 border-b border-emerald-50 bg-emerald-50/50 flex justify-between items-center relative z-10">
                  <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-600">
                        <path d="M11.25 4.533A9.707 9.707 0 006 3.755c-2.348 0-4.526.918-6.197 2.425a1.126 1.126 0 01-1.553 0L3.124 2.39a.75.75 0 10-1.248-.832L.209 6.357a.75.75 0 00.598 1.117h6.638a.75.75 0 00.565-1.243l-1.63-1.902a7.24 7.24 0 013.87-1.079c2.467 0 4.649 1.192 5.96 3.018a.75.75 0 001.218-.813A9.73 9.73 0 0011.25 4.533zM22.78 17.633a.75.75 0 00-.598-1.117h-6.638a.75.75 0 00-.566 1.243l1.63 1.902a7.24 7.24 0 01-3.87 1.079 7.235 7.235 0 01-5.96-3.019.75.75 0 00-1.218.813 9.73 9.73 0 006.178 3.712 9.707 9.707 0 005.25-.778 1.126 1.126 0 011.553 0l4.873 3.79a.75.75 0 001.248-.832l-1.667-4.802z" />
                        <path d="M12.75 7.5a.75.75 0 00-1.5 0v3.502c0 .265.14.51.37.653l2.625 1.64a.75.75 0 00.794-1.27l-2.29-1.43V7.5z" />
                      </svg>
                      Doppo Poet Scheduler
                  </h3>
                  <div className="text-xs font-bold text-emerald-600 bg-white/50 px-2 py-1 rounded border border-emerald-100">
                      Ideals: {schedulerTasks.filter(t => t.completed).length}/{schedulerTasks.length}
                  </div>
              </div>
              
              <div className="flex-1 p-4 relative z-10 flex flex-col">
                  <div className="flex gap-2 mb-3">
                      <input 
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        placeholder="New ideal to accomplish..."
                        className="flex-1 border border-emerald-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                      />
                      <button onClick={handleAddTask} className="bg-emerald-600 text-white px-3 rounded-lg font-bold hover:bg-emerald-700 text-sm">
                          +
                      </button>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {schedulerTasks.length === 0 && <div className="text-center text-slate-400 text-xs italic mt-4">Your schedule is empty. Kunikida would disapprove.</div>}
                      {schedulerTasks.map(task => (
                          <div key={task.id} className="flex items-center gap-2 group">
                              <button 
                                onClick={() => toggleTask(task.id)}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-emerald-400'}`}
                              >
                                  {task.completed && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>}
                              </button>
                              <span className={`flex-1 text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.text}</span>
                              <button onClick={() => removeTask(task.id)} className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">×</button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};