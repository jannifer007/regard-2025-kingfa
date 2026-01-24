
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Staff, PrizeType, Winner, PrizeConfig } from './types';
import { STAFF_LIST, PRIZES } from './constants';
import { audioService } from './services/audioService';
import Background from './components/Background';

const App: React.FC = () => {
  const [remainingStaff, setRemainingStaff] = useState<Staff[]>(STAFF_LIST);
  const [winners, setWinners] = useState<Winner[]>([]);
  // Default to the last prize in the list (usually the lowest tier, first to be drawn)
  const [currentPrizeId, setCurrentPrizeId] = useState<string>(PRIZES[PRIZES.length - 1].id);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rollingIds, setRollingIds] = useState<Staff[]>([]);
  const [lastWinners, setLastWinners] = useState<Winner[]>([]);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showGrandReveal, setShowGrandReveal] = useState(false);
  const [rigConfig, setRigConfig] = useState<Record<string, string[]>>({});

  const hasAutoShownSummaryRef = useRef(false);
  const scrollIntervalRef = useRef<number | null>(null);

  const ALL_DEPTS = useMemo(() => Array.from(new Set(STAFF_LIST.map(s => s.department))), []);

  // Prize configs with reactive remaining counts
  const prizeConfigs = useMemo(() => PRIZES.map(p => ({
    ...p,
    remaining: p.total - winners.filter(w => w.subPrizeName === p.subName).length
  })), [winners]);

  const currentPrizeConfig = prizeConfigs.find(p => p.id === currentPrizeId)!;
  const isLotteryOver = prizeConfigs.every(p => p.remaining === 0);

  // Generate falling money elements for the Grand Prize screen
  const moneyRain = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 5,
    size: 20 + Math.random() * 20,
    symbol: Math.random() > 0.6 ? '🧧' : (Math.random() > 0.3 ? '💰' : '✨')
  })), []);

  // Hidden settings shortcut (Ctrl+Shift+S)
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

  // Initialize BGM on first interaction
  useEffect(() => {
    const initAudio = () => {
        audioService.startBgmIfNotPlaying();
        setIsBgmPlaying(true);
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    return () => {
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Auto-show grand summary on completion
  useEffect(() => {
    if (isLotteryOver && !showSummary && lastWinners.length > 0 && !hasAutoShownSummaryRef.current) {
      const timer = setTimeout(() => {
        setShowSummary(true);
        hasAutoShownSummaryRef.current = true;
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isLotteryOver, showSummary, lastWinners]);

  const toggleBgm = () => {
      const playing = audioService.toggleBgm();
      setIsBgmPlaying(playing);
  };

  const startDraw = useCallback(() => {
    if (currentPrizeConfig.remaining <= 0) {
      alert(`当前奖品[${currentPrizeConfig.subName}]已全部抽完！`);
      return;
    }
    if (remainingStaff.length === 0) {
      alert('所有人都已经中奖了！');
      return;
    }

    if (currentPrizeConfig.type === PrizeType.GRAND) {
      setShowGrandReveal(true);
    }

    setIsDrawing(true);
    setLastWinners([]);
    
    // Faster interval for a more intense rolling effect (40ms)
    scrollIntervalRef.current = window.setInterval(() => {
      const shuffled = [...remainingStaff].sort(() => 0.5 - Math.random()).slice(0, 20);
      setRollingIds(shuffled);
      audioService.playTick();
    }, 40);
  }, [currentPrizeConfig, remainingStaff]);

  const stopDraw = useCallback(() => {
    if (!isDrawing || scrollIntervalRef.current === null) return;

    window.clearInterval(scrollIntervalRef.current);
    scrollIntervalRef.current = null;
    setIsDrawing(false);

    const countToDraw = Math.min(currentPrizeConfig.batchSize, currentPrizeConfig.remaining, remainingStaff.length);
    
    const newWinners: Winner[] = [];
    let tempStaff = [...remainingStaff];
    const currentBatchDepartments = new Set<string>();

    const specifiedIds = rigConfig[currentPrizeId] || [];
    
    // Enforce logic: Only take the first 2 rigged IDs, and ensure they haven't won yet (via tempStaff check)
    const availableRiggedStaff = specifiedIds
        .slice(0, 2)
        .map(id => tempStaff.find(s => s.id === id))
        .filter((s): s is Staff => !!s);

    for (let i = 0; i < countToDraw; i++) {
        let winnerStaff: Staff | null = null;

        // 1. Check rigged candidates
        if (availableRiggedStaff.length > 0) {
            winnerStaff = availableRiggedStaff.find(s => !currentBatchDepartments.has(s.department)) || availableRiggedStaff[0];
            const idx = availableRiggedStaff.indexOf(winnerStaff);
            if (idx > -1) availableRiggedStaff.splice(idx, 1);
        }

        // 2. Random selection if no rigged candidate
        if (!winnerStaff) {
             let candidatePool = [...tempStaff];

             // Department balancing rules
             if (currentPrizeConfig.type === PrizeType.FIRST) {
                const existingFirstPrizeDepts = new Set([
                    ...winners.filter(w => w.prize === PrizeType.FIRST).map(w => w.staff.department),
                    ...newWinners.filter(w => w.prize === PrizeType.FIRST).map(w => w.staff.department)
                ]);
                const filtered = candidatePool.filter(s => !existingFirstPrizeDepts.has(s.department));
                if (filtered.length > 0) candidatePool = filtered;
             }

             if (currentPrizeConfig.type === PrizeType.SECOND || currentPrizeConfig.type === PrizeType.THIRD) {
                 const lowTierWinnerDepts = new Set([
                     ...winners.filter(w => w.prize === PrizeType.SECOND || w.prize === PrizeType.THIRD).map(w => w.staff.department),
                     ...newWinners.filter(w => w.prize === PrizeType.SECOND || w.prize === PrizeType.THIRD).map(w => w.staff.department)
                 ]);
                 const unluckyDepts = ALL_DEPTS.filter(d => !lowTierWinnerDepts.has(d));
                 if (unluckyDepts.length > 0) {
                     const priorityPool = candidatePool.filter(s => unluckyDepts.includes(s.department));
                     if (priorityPool.length > 0) candidatePool = priorityPool;
                 }
             }

             // Try to avoid duplicate departments in the same batch
             const diversePool = candidatePool.filter(s => !currentBatchDepartments.has(s.department));
             if (diversePool.length > 0) candidatePool = diversePool;

             if (candidatePool.length > 0) {
                const randomIndex = Math.floor(Math.random() * candidatePool.length);
                winnerStaff = candidatePool[randomIndex];
             }
        }

        if (!winnerStaff) break; 

        newWinners.push({
            staff: winnerStaff,
            prize: currentPrizeConfig.type,
            subPrizeName: currentPrizeConfig.subName,
            timestamp: Date.now() + i
        });
        
        currentBatchDepartments.add(winnerStaff.department);
        tempStaff = tempStaff.filter(s => s.id !== winnerStaff.id);
    }

    setWinners(prev => [...newWinners, ...prev]);
    setRemainingStaff(tempStaff);
    setLastWinners(newWinners);
    audioService.playWin();
  }, [isDrawing, remainingStaff, currentPrizeConfig, winners, ALL_DEPTS, rigConfig, currentPrizeId]);

  useEffect(() => {
    const handleSpaceKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const activeElement = document.activeElement;
        if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        if (showSettings) return; 
        if (showSummary) { setShowSummary(false); return; }
        if (showGrandReveal) {
          if (isDrawing) stopDraw();
          else if (lastWinners.length > 0) setShowGrandReveal(false);
          else startDraw();
          return;
        }

        if (isDrawing) {
          stopDraw();
        } else {
          if (isLotteryOver) { setShowSummary(true); } else { startDraw(); }
        }
      }
    };
    window.addEventListener('keydown', handleSpaceKey);
    return () => window.removeEventListener('keydown', handleSpaceKey);
  }, [isDrawing, showSettings, showSummary, showGrandReveal, startDraw, stopDraw, isLotteryOver, lastWinners]);

  const resetAll = () => {
    if (window.confirm('确定要重置所有抽奖数据吗？')) {
      setRemainingStaff(STAFF_LIST);
      setWinners([]);
      setLastWinners([]);
      setCurrentPrizeId(PRIZES[PRIZES.length - 1].id); // Reset to last prize
      setRollingIds(STAFF_LIST.slice(0, 20));
      setShowSummary(false);
      setShowGrandReveal(false);
      hasAutoShownSummaryRef.current = false;
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col items-center bg-red-950">
      <Background />

      {/* BGM Toggle Button */}
      <button 
        onClick={toggleBgm}
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all"
        title={isBgmPlaying ? "Pause Music" : "Play Music"}
      >
        <span className="text-xl">{isBgmPlaying ? '🔊' : '🔇'}</span>
      </button>

      <div className={`relative z-10 w-full h-full flex flex-col p-4 md:p-6 transition-opacity duration-500 ${showSummary || showGrandReveal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Header - Navigation Tabs */}
        <div className="flex justify-end items-center mb-6 px-12 mr-12">
          <div className="flex gap-2 bg-black/20 p-1.5 rounded-full backdrop-blur-md">
            {prizeConfigs.map(p => (
              <button
                key={p.id}
                disabled={isDrawing}
                onClick={() => { setCurrentPrizeId(p.id); setLastWinners([]); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 whitespace-nowrap ${
                  currentPrizeId === p.id 
                  ? 'bg-yellow-500 text-red-900 border-yellow-200 shadow-md scale-105 font-black' 
                  : 'text-yellow-100/60 border-transparent hover:bg-white/5'
                } ${p.type === PrizeType.GRAND ? 'text-yellow-400' : ''}`}
              >
                {p.type === PrizeType.GRAND ? '🏮 ' : ''}{p.subName}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 flex gap-6 md:gap-8 min-h-0 pb-2 overflow-hidden">
          
          {/* Column 1: Prize Card */}
          <div className="w-[24%] bg-red-900/30 backdrop-blur-xl rounded-[3rem] border border-yellow-500/10 p-6 flex flex-col items-center justify-between shadow-2xl">
             <div className="w-full text-center">
                <div className="text-yellow-500/60 font-black text-xs uppercase tracking-[0.3em] mb-3">抽奖单元 Current Round</div>
                <div className="text-white text-3xl font-black mb-1">{currentPrizeConfig.type}</div>
                <div className="text-yellow-400 festive-font text-5xl mb-6 leading-tight">{currentPrizeConfig.subName}</div>
             </div>
             
             <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden border-4 border-yellow-500/40 shadow-[0_0_50px_rgba(234,179,8,0.25)]">
                <img src={currentPrizeConfig.imageUrl} alt={currentPrizeConfig.subName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 via-transparent to-transparent" />
             </div>

             <div className="w-full space-y-3 mt-6">
                <div className="flex justify-between text-xs font-black uppercase text-yellow-500/50 tracking-wider">
                  <span>总数 Total</span>
                  <span className="text-yellow-500/90">{currentPrizeConfig.total}</span>
                </div>
                <div className="h-2 w-full bg-red-950/60 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 transition-all duration-1000 shadow-[0_0_10px_#EAB308]" style={{ width: `${(currentPrizeConfig.remaining / currentPrizeConfig.total) * 100}%` }} />
                </div>
                <div className="text-center text-lg font-black text-yellow-400 mt-2">
                  剩余 <span className="text-2xl">{currentPrizeConfig.remaining}</span> 件
                </div>
             </div>
          </div>

          {/* Column 2: Drawing Core Area */}
          <div className="flex-1 flex flex-col items-center justify-center relative min-w-0">
            <div className="relative w-full max-w-5xl aspect-[1.5/1] bg-gradient-to-br from-red-800 to-red-950 rounded-[4rem] border-[12px] border-yellow-600/50 shadow-[0_0_120px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
                
                {/* Scrolling Animation */}
                <div className={`w-full h-full grid grid-cols-5 gap-4 p-10 transition-all duration-700 ${lastWinners.length > 0 ? 'opacity-0 scale-75 blur-2xl' : 'opacity-100'}`}>
                    {rollingIds.map((s, i) => (
                        <div 
                          key={`${s.id}-${i}`} 
                          className={`flex flex-col items-center justify-center rounded-2xl border transition-all duration-75 ${
                            isDrawing 
                            ? 'bg-yellow-500/10 border-yellow-400/30 text-yellow-400 scale-90 blur-[0.5px] opacity-80 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                            : 'bg-yellow-500/5 border-yellow-500/10 text-yellow-500/30'
                          }`}
                        >
                            <span className={`font-black tracking-tight ${isDrawing ? 'text-lg' : 'text-base'}`}>{s.id}</span>
                            <span className={`font-bold uppercase tracking-tighter mt-1 ${isDrawing ? 'text-sm' : 'text-xs'}`}>{s.name}</span>
                        </div>
                    ))}
                </div>

                {/* Winner Reveal Grid */}
                {lastWinners.length > 0 && currentPrizeConfig.type !== PrizeType.GRAND && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center animate-winScale p-6 bg-gradient-to-t from-red-950/60 to-transparent">
                        <div className="text-yellow-500 text-[10px] font-black tracking-[1.5em] mb-4 uppercase drop-shadow-md select-none">恭喜获奖名单 WINNERS</div>
                        
                        <div className={`grid ${
                          lastWinners.length > 6 ? 'grid-cols-3' : 
                          lastWinners.length > 2 ? 'grid-cols-2' : 
                          'grid-cols-1'
                        } gap-3 w-full h-full max-h-[80%] items-center justify-center`}>
                            {lastWinners.map(w => {
                                const isNineWinners = lastWinners.length >= 9;
                                const isSevenWinners = lastWinners.length === 7;
                                return (
                                  <div key={w.staff.id} className={`w-full h-full min-h-0 bg-gradient-to-b from-white/10 to-red-900/95 backdrop-blur-lg border-2 border-yellow-400/30 rounded-2xl flex flex-col items-center justify-center shadow-xl transition-transform hover:scale-105 ${
                                    isNineWinners ? 'p-1' : isSevenWinners ? 'p-1.5' : 'p-4'
                                  }`}>
                                      <span className={`text-white font-black leading-none drop-shadow-lg tracking-tight ${
                                        isNineWinners ? 'text-lg' : isSevenWinners ? 'text-xl' : 'text-3xl'
                                      }`}>{w.staff.id}</span>
                                      <span className={`text-yellow-400 font-black festive-font tracking-widest drop-shadow-lg leading-tight ${
                                        isNineWinners ? 'text-xl py-0.5' : isSevenWinners ? 'text-2xl py-1' : 'text-5xl py-2'
                                      }`}>{w.staff.name}</span>
                                      <span className={`text-white/30 font-black tracking-widest border-t border-white/5 w-full text-center truncate px-2 ${
                                        isNineWinners ? 'text-[8px] mt-0.5 pt-0.5' : 'text-[10px] mt-2 pt-1'
                                      }`}>
                                          {w.staff.department}
                                      </span>
                                  </div>
                                );
                            })}
                        </div>
                        
                        <div className={`bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 text-red-950 rounded-full font-black tracking-[0.4em] shadow-2xl animate-bounce border-2 border-white/30 ${
                          lastWinners.length > 6 ? 'mt-2 px-8 py-1.5 text-sm' : 'mt-8 px-14 py-3 text-2xl'
                        }`}>
                           福星高照
                        </div>
                    </div>
                )}

                {/* Drawing State Overlay */}
                {isDrawing && (
                    <div className="absolute inset-0 bg-red-950/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                         <div className="relative group">
                            <div className="absolute -inset-8 bg-yellow-400/20 blur-2xl rounded-full animate-pulse" />
                            <div className="relative bg-yellow-500/90 text-red-950 px-20 py-6 rounded-full text-4xl font-black tracking-[0.8em] shadow-[0_0_60px_rgba(234,179,8,0.6)] border-4 border-white/40">
                                锁定锦鲤
                            </div>
                         </div>
                    </div>
                )}
            </div>

            {/* Main Action Button */}
            <button
                onClick={isDrawing ? stopDraw : (isLotteryOver ? () => setShowSummary(true) : startDraw)}
                className={`mt-10 px-28 py-8 rounded-full font-black text-5xl tracking-[0.4em] transition-all duration-300 transform active:scale-95 shadow-2xl border-[6px] ${
                  isDrawing 
                  ? 'bg-yellow-400 text-red-950 border-white' 
                  : (isLotteryOver 
                      ? 'bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 text-red-900 border-yellow-200 animate-pulse' 
                      : (currentPrizeConfig.type === PrizeType.GRAND ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-yellow-400 shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'bg-yellow-500 text-red-950 border-yellow-600 hover:brightness-110 hover:-translate-y-2')
                    )
                }`}
            >
                {isDrawing ? '停止' : (isLotteryOver ? '查看总榜' : '开始')} <span className="text-sm font-bold opacity-40 ml-2">(Space)</span>
            </button>
          </div>

          {/* Column 3: Recent Winners (Side Panel) */}
          <div className="w-[24%] flex flex-col bg-red-900/30 backdrop-blur-xl rounded-[3rem] border border-yellow-500/10 p-6 overflow-hidden shadow-2xl">
             <div className="flex justify-between items-center mb-5 border-b border-yellow-500/20 pb-4">
                <h3 className="text-yellow-500 font-black text-sm tracking-widest uppercase">本轮星光榜</h3>
                <button onClick={resetAll} className="text-[10px] text-yellow-900 hover:text-red-500 uppercase font-black transition-colors px-2 py-1 bg-red-900/20 rounded">Reset</button>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {winners.filter(w => w.subPrizeName === currentPrizeConfig.subName).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                        <span className="text-6xl mb-8 grayscale animate-pulse">🏮</span>
                        <span className="text-xs font-black tracking-[0.3em] uppercase">待福星降临</span>
                    </div>
                ) : (
                    winners.filter(w => w.subPrizeName === currentPrizeConfig.subName).map(w => (
                        <div key={w.timestamp} className="bg-gradient-to-r from-red-900/40 to-red-950/60 border border-white/5 p-3 rounded-2xl flex items-center justify-between animate-fadeIn hover:border-yellow-500/20 transition-all shadow-lg">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-red-950 font-black text-base shadow-sm">
                                    {w.staff.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-white text-base font-black leading-none truncate">{w.staff.name}</div>
                                    <div className="text-yellow-500/50 text-[10px] font-mono font-bold tracking-tighter">{w.staff.id}</div>
                                </div>
                             </div>
                             <div className="text-[9px] text-white/20 font-black uppercase text-right leading-none max-w-[60px] truncate">
                                {w.staff.department}
                             </div>
                        </div>
                    ))
                )}
             </div>
             <div className="mt-5 pt-4 border-t border-yellow-500/10 flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="text-[10px] text-yellow-800/40 font-black uppercase tracking-wider">池中 Candidates</span>
                    <span className="text-xs text-yellow-600 font-black">{remainingStaff.length} 人</span>
                 </div>
                 <div className="flex flex-col text-right">
                    <span className="text-[10px] text-yellow-800/40 font-black uppercase tracking-wider">已中 Winners</span>
                    <span className="text-xs text-yellow-600 font-black">{winners.length} 人</span>
                 </div>
             </div>
          </div>

        </div>
      </div>

      {/* SPECIAL INTERFACE: Grand Prize Reveal Screen */}
      {showGrandReveal && (
        <div className="fixed inset-0 z-[60] bg-[#600000] flex flex-col items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-gradient-to-br from-[#800000] via-red-950 to-black opacity-95" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] aspect-square bg-[radial-gradient(circle,rgba(255,215,0,0.1),transparent_70%)] rounded-full animate-pulse" />
            </div>

            {/* NEW: Rotating Rays Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
                <div className="w-[150vmax] h-[150vmax] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,215,0,0.15)_15deg,transparent_30deg,rgba(255,215,0,0.15)_45deg,transparent_60deg,rgba(255,215,0,0.15)_75deg,transparent_90deg,rgba(255,215,0,0.15)_105deg,transparent_120deg,rgba(255,215,0,0.15)_135deg,transparent_150deg,rgba(255,215,0,0.15)_165deg,transparent_180deg,rgba(255,215,0,0.15)_195deg,transparent_210deg,rgba(255,215,0,0.15)_225deg,transparent_240deg,rgba(255,215,0,0.15)_255deg,transparent_270deg,rgba(255,215,0,0.15)_285deg,transparent_300deg,rgba(255,215,0,0.15)_315deg,transparent_330deg,rgba(255,215,0,0.15)_345deg,transparent_360deg)] animate-slow-spin opacity-50" />
            </div>

            {/* NEW: Money Rain */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {moneyRain.map((m) => (
                    <div 
                        key={m.id} 
                        className="absolute top-[-50px] animate-moneyFall opacity-0"
                        style={{
                            left: `${m.left}%`,
                            fontSize: `${m.size}px`,
                            animationDuration: `${m.duration}s`,
                            animationDelay: `-${m.delay}s`
                        }}
                    >
                        {m.symbol}
                    </div>
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-5xl h-full justify-center">
                <div className="text-yellow-400 font-black festive-font text-6xl md:text-8xl drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)] mb-2 animate-bounce">特等奖</div>
                <div className="text-white text-2xl md:text-4xl font-black tracking-[0.6em] mb-8 opacity-90 uppercase border-y-2 border-yellow-500/30 py-2 px-8 bg-red-950/40 backdrop-blur-sm">888现金红包</div>

                <div className="relative w-72 md:w-96 aspect-[0.7/1] group cursor-pointer" onClick={() => !isDrawing && lastWinners.length === 0 ? startDraw() : (isDrawing ? stopDraw() : setShowGrandReveal(false))}>
                    <div className={`absolute inset-0 bg-gradient-to-b from-red-600 to-red-800 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-4 border-yellow-500/40 overflow-hidden transition-all duration-500 ${isDrawing ? 'animate-shake-extreme ring-8 ring-yellow-400/20' : ''}`}>
                         {/* Red Envelope Flap Design */}
                         <div className="absolute top-0 left-0 right-0 h-1/2 bg-red-700 rounded-b-[7rem] shadow-2xl z-10 border-b-4 border-yellow-600/30 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-yellow-500 border-4 border-yellow-600 shadow-lg flex items-center justify-center text-3xl text-red-900 font-black mt-12 group-hover:scale-110 transition-transform">
                              福
                            </div>
                         </div>
                         
                         {/* Winner Information (Inside Envelope) */}
                         {lastWinners.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 animate-envelopeReveal bg-red-950 z-20">
                                <div className="text-yellow-500/60 font-black text-xl mb-2 tracking-widest">{lastWinners[0].staff.id}</div>
                                <div className="text-white festive-font text-6xl md:text-7xl mb-4 leading-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] text-center">{lastWinners[0].staff.name}</div>
                                <div className="text-yellow-200/80 font-black text-lg tracking-[0.3em] border-t-2 border-yellow-200/10 pt-4 uppercase text-center w-full">
                                    {lastWinners[0].staff.department}
                                </div>
                            </div>
                         )}

                         {/* Empty/Ready State */}
                         {lastWinners.length === 0 && !isDrawing && (
                             <div className="absolute inset-0 flex flex-col items-center justify-center pt-24">
                                 <div className="text-yellow-500/30 text-lg font-black tracking-[0.4em] uppercase animate-pulse">点击开启鸿运</div>
                             </div>
                         )}

                         {/* Drawing Animation Placeholder */}
                         {isDrawing && (
                            <div className="absolute inset-0 flex items-center justify-center pt-24">
                                <div className="text-yellow-400 text-6xl font-black animate-pulse tracking-tighter">???</div>
                            </div>
                         )}
                    </div>
                </div>

                <div className="mt-10 flex gap-6">
                    <button
                        onClick={isDrawing ? stopDraw : (lastWinners.length > 0 ? () => { setLastWinners([]); startDraw(); } : startDraw)}
                        className={`px-16 py-6 rounded-full font-black text-3xl tracking-[0.6em] transition-all shadow-[0_0_50px_rgba(234,179,8,0.3)] border-4 ${
                            isDrawing ? 'bg-white text-red-700 border-red-200' : 'bg-yellow-500 text-red-950 border-yellow-300 hover:scale-105 active:scale-95'
                        }`}
                    >
                        {isDrawing ? '开！' : (lastWinners.length > 0 ? '再抽一个' : '火速揭晓')}
                    </button>
                    <button
                        onClick={() => setShowGrandReveal(false)}
                        className="px-10 py-6 rounded-full border-2 border-white/20 text-white/40 hover:text-white hover:border-white transition-all font-black tracking-widest uppercase text-xl"
                    >
                        返回主场
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* SUMMARY SCREEN: All Winners List */}
      {showSummary && (
        <div className="fixed inset-0 z-50 bg-[#600000] flex flex-col p-8 md:p-12 animate-fadeIn overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10 pointer-events-none" />
             <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full">
                 
                 <div className="flex justify-between items-end mb-12 pb-8 border-b-4 border-yellow-500/30">
                     <div>
                        <h1 className="festive-font text-8xl md:text-9xl text-yellow-400 drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] leading-none">荣耀金榜</h1>
                        <p className="text-yellow-600 font-black tracking-[1.2em] uppercase text-sm mt-6 pl-2 opacity-80">2025 Kingfa Info Management Department</p>
                     </div>
                     <button onClick={() => setShowSummary(false)} className="px-14 py-4 rounded-full border-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-red-900 transition-all font-black tracking-widest uppercase text-lg shadow-2xl bg-red-950/40 backdrop-blur-sm">
                        继续抽奖 (Space)
                     </button>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr pb-20">
                    {PRIZES.map((prize) => (
                        <div key={prize.id} className={`flex flex-col rounded-[2rem] p-5 border shadow-xl relative overflow-hidden group ${
                            prize.type === PrizeType.GRAND 
                            ? 'bg-gradient-to-br from-red-900/90 to-red-950/90 border-yellow-500/40 col-span-1 md:col-span-2 lg:col-span-1' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}>
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                                <div className="flex flex-col">
                                    <span className={`font-black text-lg ${prize.type === PrizeType.GRAND ? 'text-yellow-400' : 'text-white/90'}`}>
                                        {prize.subName}
                                    </span>
                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{prize.type}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full font-black text-xs border ${
                                    prize.type === PrizeType.GRAND 
                                    ? 'bg-yellow-500 text-red-950 border-yellow-400' 
                                    : 'bg-white/10 text-white/60 border-white/10'
                                }`}>
                                    {winners.filter(w => w.subPrizeName === prize.subName).length}/{prize.total}
                                </span>
                            </div>

                            {/* Winners List */}
                            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 min-h-[150px]">
                                {winners.filter(w => w.subPrizeName === prize.subName).map((w, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        prize.type === PrizeType.GRAND 
                                        ? 'bg-yellow-500/10 border-yellow-500/20' 
                                        : 'bg-black/20 border-white/5'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <div className="min-w-0">
                                                <div className="text-white font-black text-base leading-none mb-0.5 truncate">{w.staff.name}</div>
                                                <div className="text-white/30 text-[9px] font-bold">{w.staff.id}</div>
                                            </div>
                                        </div>
                                        <div className="text-[9px] text-white/30 font-black uppercase text-right leading-none shrink-0">
                                            {w.staff.department}
                                        </div>
                                    </div>
                                ))}
                                {winners.filter(w => w.subPrizeName === prize.subName).length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full opacity-20 py-4">
                                        <div className="text-2xl mb-2">🎁</div>
                                        <div className="text-[9px] font-black tracking-widest uppercase">虚位以待</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    </div>
                 </div>
             </div>
        </div>
      )}

      {/* ADMIN PANEL: Rigging Configuration */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-white text-black p-12 rounded-[4rem] w-full max-w-2xl shadow-2xl border-4 border-gray-100">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">内定控制面板</h2>
                <button onClick={() => setShowSettings(false)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl hover:bg-gray-200 transition-colors">✕</button>
            </div>
            
            <div className="space-y-8 max-h-[55vh] overflow-y-auto pr-6 custom-scrollbar-dark">
              {PRIZES.map(p => (
                <div key={p.id} className="group border-b border-gray-100 pb-6 last:border-0">
                    <label className="block text-xs font-black text-gray-400 mb-3 uppercase tracking-[0.3em] group-focus-within:text-yellow-600 transition-colors">
                        {p.type} - {p.subName} <span className="text-[10px] font-normal lowercase">(输入工号，逗号分隔，最多2人)</span>
                    </label>
                    <input 
                        type="text" 
                        className="w-full border-2 border-gray-100 rounded-[1.5rem] p-5 text-lg font-mono font-bold focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none transition-all placeholder:text-gray-200"
                        placeholder="例如: KF001, KF008 (最多2人)"
                        value={rigConfig[p.id]?.join(', ') || ''}
                        onChange={(e) => {
                            const val = e.target.value.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
                            setRigConfig(prev => ({ ...prev, [p.id]: val }));
                        }}
                    />
                </div>
              ))}
            </div>
            
            <button 
                onClick={() => setShowSettings(false)} 
                className="mt-12 w-full py-6 bg-red-600 text-white rounded-[2rem] font-black text-2xl hover:bg-red-700 hover:shadow-2xl shadow-red-900/20 transition-all active:scale-95 border-b-4 border-red-800"
            >
                保存配置 & 同步系统
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(234, 179, 8, 0.3); border-radius: 20px; }
        .custom-scrollbar-dark::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 20px; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes winScale { 0% { transform: scale(0.4); opacity: 0; filter: blur(30px); } 100% { transform: scale(1); opacity: 1; filter: blur(0); } }
        @keyframes shakeExtreme {
            0%, 100% { transform: rotate(0deg) scale(1); }
            10%, 30%, 50%, 70%, 90% { transform: rotate(-3deg) scale(1.02); }
            20%, 40%, 60%, 80% { transform: rotate(3deg) scale(1.02); }
        }
        @keyframes envelopeReveal {
            0% { transform: translateY(100%) scale(0.5); opacity: 0; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes slowSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes moneyFall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.2, 0, 0, 1) forwards; }
        .animate-winScale { animation: winScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-shake-extreme { animation: shakeExtreme 0.3s ease-in-out infinite; }
        .animate-envelopeReveal { animation: envelopeReveal 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-slow-spin { animation: slowSpin 60s linear infinite; }
        .animate-moneyFall { animation-name: moneyFall; animation-timing-function: linear; animation-iteration-count: infinite; }
        
        .festive-font {
          line-height: 1.2;
          padding-top: 0.15em;
          padding-bottom: 0.15em;
        }
      `}</style>
    </div>
  );
};

export default App;
