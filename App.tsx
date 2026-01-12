
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Staff, PrizeType, Winner, PrizeConfig } from './types';
import { STAFF_LIST, PRIZES } from './constants';
import { audioService } from './services/audioService';
import Background from './components/Background';

const App: React.FC = () => {
  const [remainingStaff, setRemainingStaff] = useState<Staff[]>(STAFF_LIST);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [currentPrizeType, setCurrentPrizeType] = useState<PrizeType>(PrizeType.THIRD);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rollingIds, setRollingIds] = useState<Staff[]>([]);
  const [lastWinner, setLastWinner] = useState<Winner | null>(null);
  
  const scrollIntervalRef = useRef<number | null>(null);

  // Prize configuration
  const prizeConfigs = useMemo(() => PRIZES.map(p => ({
    ...p,
    remaining: p.total - winners.filter(w => w.prize === p.type).length
  })), [winners]);

  const currentPrizeConfig = prizeConfigs.find(p => p.type === currentPrizeType)!;

  // Initial placeholders
  useEffect(() => {
    if (!isDrawing && rollingIds.length === 0) {
      setRollingIds(remainingStaff.slice(0, 20));
    }
  }, [remainingStaff, isDrawing, rollingIds.length]);

  const startDraw = useCallback(() => {
    if (currentPrizeConfig.remaining <= 0) {
      alert(`${currentPrizeType}已全部抽完！`);
      return;
    }
    if (remainingStaff.length === 0) {
      alert('所有人都已经中奖了！');
      return;
    }

    setIsDrawing(true);
    setLastWinner(null);
    
    scrollIntervalRef.current = window.setInterval(() => {
      // Pick 20 unique random candidates for the rolling grid
      const shuffled = [...remainingStaff].sort(() => 0.5 - Math.random()).slice(0, 20);
      setRollingIds(shuffled);
      audioService.playTick();
    }, 60);
  }, [currentPrizeConfig, remainingStaff, currentPrizeType]);

  const stopDraw = useCallback(() => {
    if (!isDrawing || scrollIntervalRef.current === null) return;

    window.clearInterval(scrollIntervalRef.current);
    scrollIntervalRef.current = null;
    setIsDrawing(false);

    // Final winner selection
    const winnerStaff = remainingStaff[Math.floor(Math.random() * remainingStaff.length)];
    const newWinner: Winner = {
      staff: winnerStaff,
      prize: currentPrizeType,
      timestamp: Date.now()
    };

    setWinners(prev => [newWinner, ...prev]);
    setRemainingStaff(prev => prev.filter(s => s.id !== winnerStaff.id));
    setLastWinner(newWinner);
    audioService.playWin();
  }, [isDrawing, remainingStaff, currentPrizeType]);

  const resetAll = () => {
    if (window.confirm('确定要重置所有抽奖数据吗？')) {
      setRemainingStaff(STAFF_LIST);
      setWinners([]);
      setLastWinner(null);
      setCurrentPrizeType(PrizeType.THIRD);
      setRollingIds(STAFF_LIST.slice(0, 20));
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-6">
      <Background />

      {/* Main Container - Adjusted for better visual flow */}
      <div className="relative z-10 w-full max-w-7xl flex flex-col md:flex-row gap-6 items-stretch h-full py-6">
        
        {/* Left Section: Drawing Interaction Area */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="text-center mb-6">
            <h2 className="festive-font text-5xl md:text-7xl text-yellow-500 drop-shadow-lg mb-4 tracking-wider">
              年会大抽奖
            </h2>
            <div className="inline-flex gap-3 bg-red-950/40 p-1.5 rounded-full border border-yellow-900/30 backdrop-blur-sm">
              {prizeConfigs.map(p => (
                <button
                  key={p.type}
                  disabled={isDrawing}
                  onClick={() => setCurrentPrizeType(p.type)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-300 ${
                    currentPrizeType === p.type 
                    ? 'bg-yellow-500 text-red-900 border-yellow-200 scale-105 shadow-md' 
                    : 'bg-transparent text-yellow-600/70 border-transparent hover:border-yellow-900'
                  }`}
                >
                  {p.type} ({p.remaining}/{p.total})
                </button>
              ))}
            </div>
          </div>

          {/* Draw View Container - Optimized Size */}
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-red-800 to-red-950 rounded-[2rem] border-4 border-yellow-600/60 shadow-[0_0_60px_rgba(0,0,0,0.4)] overflow-hidden p-6 min-h-[340px] flex items-center justify-center">
            
            {/* Grid Display (20 Slots) */}
            <div className={`w-full grid grid-cols-4 md:grid-cols-5 gap-2 transition-all duration-500 ${lastWinner ? 'opacity-0 scale-90 blur-sm' : 'opacity-100'}`}>
              {rollingIds.map((staff, idx) => (
                <div 
                  key={staff.id + '-' + idx}
                  className={`h-14 flex flex-col items-center justify-center rounded-lg font-mono transition-all duration-75 border ${
                    isDrawing 
                    ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400' 
                    : 'bg-red-950/50 border-white/5 text-yellow-900/50'
                  }`}
                >
                  <div className="text-xs font-bold opacity-80">{staff.id}</div>
                  <div className="text-[10px] opacity-40 truncate px-1">{staff.name}</div>
                </div>
              ))}
            </div>

            {/* Winner Reveal Overlay */}
            {lastWinner && (
              <div className="absolute inset-0 z-50 flex items-center justify-center animate-winScale">
                <div className="text-center">
                  <div className="text-yellow-500 text-sm font-bold tracking-[0.5em] uppercase mb-2 drop-shadow-md">WINNER</div>
                  <div className="text-white text-6xl md:text-8xl font-black tracking-tighter mb-2 drop-shadow-2xl">
                    {lastWinner.staff.id}
                  </div>
                  <div className="text-yellow-400 text-5xl md:text-6xl font-bold festive-font tracking-widest drop-shadow-lg">
                    {lastWinner.staff.name}
                  </div>
                  <div className="mt-6">
                    <span className="px-4 py-1 bg-yellow-500 text-red-950 rounded text-xs font-black uppercase tracking-widest">
                      {lastWinner.prize}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Overlay Gradient for Drawing State */}
            {isDrawing && (
              <div className="absolute inset-0 z-40 bg-red-900/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                 <div className="text-yellow-400 font-black text-2xl animate-pulse tracking-widest border-y border-yellow-500/50 py-2 px-10">
                   滚动中...
                 </div>
              </div>
            )}

            {/* Corner Details */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-yellow-500/20"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-yellow-500/20"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-yellow-500/20"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-yellow-500/20"></div>
          </div>

          {/* Main Button - More Refined Size */}
          <button
            onClick={isDrawing ? stopDraw : startDraw}
            disabled={!isDrawing && currentPrizeConfig.remaining <= 0}
            className={`mt-10 group relative px-14 py-5 rounded-full font-black text-2xl tracking-[0.2em] transition-all duration-300 transform active:scale-95 shadow-xl ${
              isDrawing 
              ? 'bg-yellow-400 text-red-950 animate-pulse' 
              : 'bg-yellow-500 text-red-950 hover:bg-yellow-400 hover:-translate-y-1'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <span className="relative z-10">{isDrawing ? '停止' : '开始抽奖'}</span>
          </button>
        </div>

        {/* Right Section: Winner Sidebar - Sleeker and smaller */}
        <div className="w-full md:w-72 flex flex-col bg-red-950/30 backdrop-blur-xl rounded-2xl border border-yellow-500/10 p-5 overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center mb-5 border-b border-yellow-900/30 pb-3">
            <h3 className="text-yellow-500 font-bold text-lg tracking-tight">获奖名单</h3>
            <button 
              onClick={resetAll}
              className="text-[9px] text-yellow-900 hover:text-red-500 transition-colors font-black uppercase tracking-tighter"
            >
              Reset
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {winners.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 opacity-10">
                <div className="text-3xl mb-2">🏮</div>
                <div className="text-[10px] uppercase font-bold">Waiting...</div>
              </div>
            ) : (
              winners.map((winner) => (
                <div 
                  key={winner.timestamp}
                  className="flex items-center justify-between p-2.5 bg-red-900/40 rounded-xl border border-white/5 animate-fadeIn"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold text-[10px] border border-yellow-500/20">
                      {winner.staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white text-xs font-bold leading-none mb-1">{winner.staff.name}</div>
                      <div className="text-yellow-600/50 text-[9px] font-mono">{winner.staff.id}</div>
                    </div>
                  </div>
                  <div className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter uppercase ${
                    winner.prize === PrizeType.FIRST ? 'bg-yellow-500/80 text-red-950' :
                    winner.prize === PrizeType.SECOND ? 'bg-blue-600/80 text-white' :
                    'bg-orange-600/80 text-white'
                  }`}>
                    {winner.prize}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-yellow-900/30 text-center">
             <div className="text-[10px] text-yellow-800 font-medium uppercase tracking-widest">
               Remaining Candidates: <span className="text-yellow-500 font-bold">{remainingStaff.length}</span>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(234, 179, 8, 0.1); border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes winScale { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-winScale { animation: winScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
