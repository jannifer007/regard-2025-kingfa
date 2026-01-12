
import React, { useMemo } from 'react';

const Background: React.FC = () => {
  const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: `${8 + Math.random() * 12}s`,
    delay: `${Math.random() * 5}s`,
    size: `${Math.random() * 15 + 5}px`
  })), []);

  return (
    <div className="fixed inset-0 z-0 bg-[#700000] overflow-hidden">
      {/* Texture Layer */}
      <div className="absolute inset-0 opacity-5 animate-bg" style={{
        backgroundImage: 'radial-gradient(circle, #FFD700 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />
      
      {/* Subtle Glowing Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-yellow-500/10 blur-md animate-pulse"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay
          }}
        />
      ))}

      {/* Corporate Branding - Scaled down for better balance */}
      <div className="absolute top-6 left-8 flex items-center gap-2 z-20">
         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-yellow-500">
            <span className="text-[#8B0000] font-bold text-base">金发</span>
         </div>
         <div className="text-white/80">
            <h1 className="text-xl font-bold tracking-widest leading-none">KINGFA</h1>
            <p className="text-[10px] text-yellow-500/80 font-medium uppercase tracking-tighter">Info Management 2025</p>
         </div>
      </div>

      {/* Centered Background Text - Better balance and centering */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-yellow-500/[0.03] text-[18vw] font-black italic select-none whitespace-nowrap leading-none tracking-tighter transform rotate-[-10deg]">
          LUCKY 2025
        </div>
      </div>
    </div>
  );
};

export default Background;
