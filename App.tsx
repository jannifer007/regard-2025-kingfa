
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
  const [lastWinners, setLastWinners] = useState<Winner[]>([]);
  
  // Hidden Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [rigConfig, setRigConfig] = useState<Record<PrizeType, string[]>>({
    [PrizeType.FIRST]: [],
    [PrizeType.SECOND]: [],
    [PrizeType.THIRD]: []
  });

  // Derived constants
  const ALL_DEPTS = useMemo(() => Array.from(new Set(STAFF_LIST.map(s => s.department))), []);

  const scrollIntervalRef = useRef<number | null>(null);

  // Keyboard shortcut for Settings (Ctrl + Shift + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prize configuration
  const prizeConfigs = useMemo(() => PRIZES.map(p => ({
    ...p,
    remaining: p.total - winners.filter(w => w.prize === p.type).length
  })), [winners]);

  const currentPrizeConfig = prizeConfigs.find(p => p.type === currentPrizeType)!;
  const isLotteryOver = prizeConfigs.every(p => p.remaining === 0);

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
    setLastWinners([]);
    
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

    const batchSize = currentPrizeConfig.batchSize || 1;
    const countToDraw = Math.min(batchSize, currentPrizeConfig.remaining, remainingStaff.length);
    
    const newWinners: Winner[] = [];
    let tempStaff = [...remainingStaff];
    const currentBatchDepartments = new Set<string>();

    // Prepare specified winners for this round
    const specifiedIds = rigConfig[currentPrizeType] || [];
    // Find specified staff who are still eligible (haven't won yet)
    const availableRiggedStaff = specifiedIds
        .map(id => tempStaff.find(s => s.id === id))
        .filter((s): s is Staff => !!s);

    for (let i = 0; i < countToDraw; i++) {
        let winnerStaff: Staff | null = null;

        // --- 1. Rigging Priority ---
        // Rigging overrides all department constraints
        if (availableRiggedStaff.length > 0) {
            // First try to find a rigged candidate that doesn't violate the *batch* rule (just for aesthetics)
            const validRigged = availableRiggedStaff.find(s => !currentBatchDepartments.has(s.department));
            winnerStaff = validRigged || availableRiggedStaff[0];

            // Remove used rigged candidate
            const idx = availableRiggedStaff.indexOf(winnerStaff);
            if (idx > -1) availableRiggedStaff.splice(idx, 1);
        }

        // --- 2. Random Selection with Constraints ---
        if (!winnerStaff) {
             let candidatePool = [...tempStaff];

             // Constraint A: First Prize - Max 1 per Department
             if (currentPrizeType === PrizeType.FIRST) {
                const existingFirstPrizeDepts = new Set([
                    ...winners.filter(w => w.prize === PrizeType.FIRST).map(w => w.staff.department),
                    ...newWinners.filter(w => w.prize === PrizeType.FIRST).map(w => w.staff.department)
                ]);
                
                const filtered = candidatePool.filter(s => !existingFirstPrizeDepts.has(s.department));
                // Only apply if we don't filter out everyone (safety net, though unlikely with data size)
                if (filtered.length > 0) {
                    candidatePool = filtered;
                }
             }

             // Constraint B: Second/Third Prize - Ensure Full Department Coverage
             // "每个科室一定要有人抽到二等三等奖"
             if (currentPrizeType === PrizeType.SECOND || currentPrizeType === PrizeType.THIRD) {
                 const lowTierWinnerDepts = new Set([
                     ...winners.filter(w => w.prize === PrizeType.SECOND || w.prize === PrizeType.THIRD).map(w => w.staff.department),
                     ...newWinners.filter(w => w.prize === PrizeType.SECOND || w.prize === PrizeType.THIRD).map(w => w.staff.department)
                 ]);
                 
                 const unluckyDepts = ALL_DEPTS.filter(d => !lowTierWinnerDepts.has(d));
                 
                 // If there are departments that haven't won 2nd/3rd yet, we MUST prioritize them
                 if (unluckyDepts.length > 0) {
                     const priorityPool = candidatePool.filter(s => unluckyDepts.includes(s.department));
                     if (priorityPool.length > 0) {
                         candidatePool = priorityPool;
                     }
                 }
             }

             // Soft Constraint C: Batch Diversity (Avoid same dept in single batch)
             const diversePool = candidatePool.filter(s => !currentBatchDepartments.has(s.department));
             if (diversePool.length > 0) {
                 candidatePool = diversePool;
             }

             if (candidatePool.length > 0) {
                const randomIndex = Math.floor(Math.random() * candidatePool.length);
                winnerStaff = candidatePool[randomIndex];
             }
        }

        if (!winnerStaff) break; 

        newWinners.push({
            staff: winnerStaff,
            prize: currentPrizeType,
            timestamp: Date.now() + i
        });
        
        currentBatchDepartments.add(winnerStaff.department);
        tempStaff = tempStaff.filter(s => s.id !== winnerStaff.id);
    }

    setWinners(prev => [...newWinners, ...prev]);
    setRemainingStaff(tempStaff);
    setLastWinners(newWinners);
    audioService.playWin();
  }, [isDrawing, remainingStaff, currentPrizeType, currentPrizeConfig, rigConfig, winners, ALL_DEPTS]);

  // Spacebar Control for Operations
  useEffect(() => {
    const handleSpaceKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const activeElement = document.activeElement;
        if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
          return;
        }

        e.preventDefault();

        if (showSettings) return; 

        if (showSummary) {
          setShowSummary(false); 
          return;
        }

        if (isDrawing) {
          stopDraw();
        } else {
          startDraw();
        }
      }
    };

    window.addEventListener('keydown', handleSpaceKey);
    return () => window.removeEventListener('keydown', handleSpaceKey);
  }, [isDrawing, showSettings, showSummary, startDraw, stopDraw]);

  const resetAll = () => {
    if (window.confirm('确定要重置所有抽奖数据吗？')) {
      setRemainingStaff(STAFF_LIST);
      setWinners([]);
      setLastWinners([]);
      setCurrentPrizeType(PrizeType.THIRD);
      setRollingIds(STAFF_LIST.slice(0, 20));
      setShowSummary(false);
    }
  };

  // Helper to update rig config
  const updateRigConfig = (type: PrizeType, value: string) => {
    const ids = value.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
    setRigConfig(prev => ({ ...prev, [type]: ids }));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-6">
      <Background />

      {/* Main Container */}
      <div className={`relative z-10 w-full max-w-7xl flex flex-col md:flex-row gap-6 items-stretch h-full py-6 transition-opacity duration-500 ${showSummary ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
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

          {/* Draw View Container */}
          <div className="relative w-full max-w-3xl bg-gradient-to-br from-red-800 to-red-950 rounded-[2rem] border-4 border-yellow-600/60 shadow-[0_0_60px_rgba(0,0,0,0.4)] overflow-hidden p-6 min-h-[380px] flex items-center justify-center">
            
            {/* Grid Display (20 Slots) - REMOVED DEPARTMENT */}
            <div className={`w-full grid grid-cols-4 md:grid-cols-5 gap-2 transition-all duration-500 absolute inset-6 ${lastWinners.length > 0 ? 'opacity-0 scale-90 blur-sm pointer-events-none' : 'opacity-100'}`}>
              {rollingIds.map((staff, idx) => (
                <div 
                  key={staff.id + '-' + idx}
                  className={`h-14 flex flex-col items-center justify-center rounded-lg font-mono transition-all duration-75 border ${
                    isDrawing 
                    ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400' 
                    : 'bg-red-950/50 border-white/5 text-yellow-900/50'
                  }`}
                >
                  <div className="text-sm font-bold opacity-80">{staff.id}</div>
                  <div className="text-xs opacity-60 truncate px-1">{staff.name}</div>
                </div>
              ))}
            </div>

            {/* Winner Reveal Overlay - REMOVED DEPARTMENT */}
            {lastWinners.length > 0 && (
              <div className="relative z-50 flex flex-col items-center justify-center animate-winScale w-full">
                <div className="text-yellow-500 text-sm font-bold tracking-[0.5em] uppercase mb-4 drop-shadow-md">WINNER</div>
                
                {lastWinners.length === 1 ? (
                   /* Single Winner Layout (Big) */
                   <div className="text-center">
                      <div className="text-white text-6xl md:text-8xl font-black tracking-tighter mb-4 drop-shadow-2xl">
                        {lastWinners[0].staff.id}
                      </div>
                      <div className="text-yellow-400 text-5xl md:text-6xl font-bold festive-font tracking-widest drop-shadow-lg">
                        {lastWinners[0].staff.name}
                      </div>
                   </div>
                ) : (
                  /* Multiple Winners Layout (Grid) */
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {lastWinners.map(winner => (
                       <div key={winner.staff.id} className="bg-red-900/80 border border-yellow-500/50 rounded-xl p-4 flex flex-col items-center shadow-lg transform hover:scale-105 transition-transform">
                          <div className="text-white text-3xl font-black tracking-tighter mb-1">
                            {winner.staff.id}
                          </div>
                          <div className="text-yellow-400 text-2xl font-bold festive-font">
                            {winner.staff.name}
                          </div>
                       </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-8">
                  <span className="px-6 py-2 bg-yellow-500 text-red-950 rounded-full text-sm font-black uppercase tracking-widest shadow-lg">
                    {lastWinners[0].prize} ({lastWinners.length}人)
                  </span>
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

          {/* Main Button */}
          <button
            onClick={isDrawing ? stopDraw : startDraw}
            disabled={!isDrawing && currentPrizeConfig.remaining <= 0}
            className={`mt-10 group relative px-14 py-5 rounded-full font-black text-2xl tracking-[0.2em] transition-all duration-300 transform active:scale-95 shadow-xl ${
              isDrawing 
              ? 'bg-yellow-400 text-red-950 animate-pulse' 
              : 'bg-yellow-500 text-red-950 hover:bg-yellow-400 hover:-translate-y-1'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <span className="relative z-10">{isDrawing ? '停止 (Space)' : '开始抽奖 (Space)'}</span>
          </button>
          
           {/* Summary Button */}
          <button 
             onClick={() => setShowSummary(true)}
             className={`mt-4 text-sm text-yellow-500/60 hover:text-yellow-400 uppercase tracking-widest font-bold border-b border-transparent hover:border-yellow-400 transition-all ${isLotteryOver ? 'text-yellow-400 scale-125 font-black animate-pulse' : ''}`}
          >
            {isLotteryOver ? '✨ 查看大屏名单 ✨' : '查看总名单'}
          </button>

        </div>

        {/* Right Section: Winner Sidebar - REMOVED DEPARTMENT */}
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
                      <div className="text-white text-xs font-bold leading-none mb-0.5">{winner.staff.name}</div>
                      <div className="flex gap-1 text-[8px] text-yellow-600/70 font-mono">
                        <span>{winner.staff.id}</span>
                      </div>
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

      {/* Hidden Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white text-black p-8 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Settings (Rigging)</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-black">
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 text-xs text-gray-500 rounded border border-gray-200">
                ID
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {PrizeType.FIRST} (2P)
                </label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded p-2 text-sm font-mono"
                  placeholder="e.g. KF001, KF002"
                  value={rigConfig[PrizeType.FIRST].join(', ')}
                  onChange={(e) => updateRigConfig(PrizeType.FIRST, e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {PrizeType.SECOND} (2P)
                </label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded p-2 text-sm font-mono"
                  placeholder="e.g. KF010, KF011"
                  value={rigConfig[PrizeType.SECOND].join(', ')}
                  onChange={(e) => updateRigConfig(PrizeType.SECOND, e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {PrizeType.THIRD} (2P)
                </label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded p-2 text-sm font-mono"
                  placeholder="e.g. KF020, KF021, KF022, KF023"
                  value={rigConfig[PrizeType.THIRD].join(', ')}
                  onChange={(e) => updateRigConfig(PrizeType.THIRD, e.target.value)}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
              >
                保存并关闭
              </button>
            </div>
          </div>
        </div>
      )}

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
