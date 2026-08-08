'use client';

import React from 'react';
import { useGamification } from '@/context/GamificationContext';

export default function SidebarProfile({ user, sidebarCollapsed }) {
  if (!user || sidebarCollapsed) return null;
  
  const { gamification, levelProgress } = useGamification();

  const level = gamification?.level || 1;
  const xp = gamification?.xp || 0;
  const streak = gamification?.streak || 0;
  const longestStreak = gamification?.longestStreak || 0;
  const progressPercent = levelProgress?.progressPercent || 0;
  const xpInCurrentLevel = levelProgress?.xpInCurrentLevel || 0;
  const xpNeededForNext = levelProgress?.xpNeededForNext || 100;

  return (
    <div className="pt-4 border-t border-accent-purple/10 space-y-4">
      <div className="px-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-gold to-accent-amber flex items-center justify-center text-[#0a0a0f] font-black text-sm shadow-lg shadow-accent-gold/30 shrink-0">
              {level}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-heading font-extrabold text-sm text-white">Lvl {level}</span>
                {levelProgress?.levelTitle && (
                  <span className="text-[9px] text-accent-gold font-extrabold truncate max-w-[110px]">
                    {levelProgress.levelTitle}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-text-muted font-bold block">XP: {xp.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="xp-bar h-2 rounded-full overflow-hidden bg-white/5">
          <div 
            className="h-full bg-gradient-to-r from-accent-purple to-accent-cyan rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-text-muted mt-1">
          <span>{xpInCurrentLevel.toLocaleString()} / {xpNeededForNext.toLocaleString()} XP</span>
          <span>Next: Level {level + 1}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="streak-flame text-2xl">🔥</span>
          <div>
            <span className="font-heading font-extrabold text-sm text-white">{streak}</span>
            <span className="text-[10px] text-text-muted ml-1">day streak</span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-heading font-extrabold text-sm text-accent-amber">{longestStreak}</span>
          <span className="text-[10px] text-text-muted ml-1">best</span>
        </div>
      </div>
    </div>
  );
}