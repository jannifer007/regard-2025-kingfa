
import React, { useMemo } from 'react';

const Background: React.FC = () => {
  // Reduced particle count for a cleaner, simpler look
  const particles = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 120}%`,
    duration: `${20 + Math.random() * 15}s`, // Slower movement
    delay: `-${Math.random() * 20}s`,
    size: `${Math.random() * 6 + 2}px`,
    opacity: 0.1 + Math.random() * 0.3
  })), []);

  return (
    <div className="fixed inset-0 z-0 bg-[#700000] overflow-hidden">
      {/* Subtle Gradient Background - Static to reduce noise */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#600000] via-[#800000] to-[#500000]" />
      
      {/* Static texture overlay instead of moving stripes */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{
             backgroundImage: 'radial-gradient(circle, #FFD700 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }} 
      />

      {/* Floating Particles - Fewer and slower */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-yellow-400 blur-[1px] pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `floatUp ${p.duration} linear infinite`
          }}
        />
      ))}

      {/* Simple Spotlight - Static */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.08),transparent_70%)] pointer-events-none" />

      {/* Corporate Branding */}
      <div className="absolute top-6 left-8 flex items-center gap-2 z-20">
         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-yellow-500">
            <span className="text-[#8B0000] font-bold text-base">金发</span>
         </div>
         <div className="text-white/80">
            <h1 className="text-xl font-bold tracking-widest leading-none">KINGFA</h1>
            <p className="text-[10px] text-yellow-500/80 font-medium uppercase tracking-tighter">Info Management 2025</p>
         </div>
      </div>

      {/* Background Text - Very slow, subtle sway */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-yellow-500/[0.04] text-[18vw] font-black italic select-none whitespace-nowrap leading-none tracking-tighter transform rotate-[-10deg] animate-sway-slow">
          LUCKY 2025
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-10deg) scale(1); }
          50% { transform: rotate(-8deg) scale(1.02); }
        }
        .animate-sway-slow {
          animation: sway 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Background;
