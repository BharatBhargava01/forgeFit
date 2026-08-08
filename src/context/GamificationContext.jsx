'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const GamificationContext = createContext(null);

const STORAGE_KEY = 'forgefit_gamification';
const ACHIEVEMENTS_STORAGE_KEY = 'forgefit_achievements';

const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_workout', name: 'First Steps', description: 'Complete your first workout', icon: '🏃', xpReward: 50, unlocked: false, category: 'workout' },
  { id: 'week_warrior', name: 'Week Warrior', description: 'Work out 7 days in a row', icon: '🔥', xpReward: 200, unlocked: false, category: 'streak' },
  { id: 'month_master', name: 'Month Master', description: 'Maintain a 30-day streak', icon: '👑', xpReward: 1000, unlocked: false, category: 'streak' },
  { id: 'centurion', name: 'Centurion', description: 'Complete 100 workouts', icon: '💯', xpReward: 500, unlocked: false, category: 'workout' },
  { id: 'heavy_lifter', name: 'Heavy Lifter', description: 'Lift 10,000kg total volume', icon: '🏋️', xpReward: 300, unlocked: false, category: 'volume' },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete 10 workouts before 8 AM', icon: '🌅', xpReward: 150, unlocked: false, category: 'time' },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete 10 workouts after 10 PM', icon: '🦉', xpReward: 150, unlocked: false, category: 'time' },
  { id: 'variety_king', name: 'Variety King', description: 'Perform 50 different exercises', icon: '🎭', xpReward: 250, unlocked: false, category: 'variety' },
  { id: 'pr_hunter', name: 'PR Hunter', description: 'Set 10 personal records', icon: '🎯', xpReward: 400, unlocked: false, category: 'strength' },
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Share 5 workouts', icon: '🦋', xpReward: 100, unlocked: false, category: 'social' },
];

export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];

export const LEVEL_TITLES = {
  1: { name: '🥚 Novice Lifter', desc: 'Starting your training journey. Build the habit!' },
  2: { name: '🔨 Iron Apprentice', desc: 'Developing solid fundamentals and form consistency.' },
  3: { name: '🏃 Consistency Cadet', desc: 'Overcoming pain barriers and logging regular sessions.' },
  4: { name: '🏋️ Barbell Baron', desc: 'Pushing heavy volume targets with high efficiency.' },
  5: { name: '⚔️ Steel Warrior', desc: 'Unlocking expert training schedules and intensity.' },
  6: { name: '👑 Beast Mode Legend', desc: 'Achieved elite volume metrics and training consistency.' },
  7: { name: '⚡ Iron Titan', desc: 'Dominating heavy compound loads with unstoppable force.' },
  8: { name: '🔥 Gym Master', desc: 'Inspiring others with flawless discipline and technique.' },
  9: { name: '🌌 Grandmaster', desc: 'Operating at peak human athletic performance.' },
  10: { name: '💎 Apex Legend', desc: 'The pinnacle of fitness excellence and mastery.' }
};

export const getLevelTitle = (level) => {
  return LEVEL_TITLES[level] || LEVEL_TITLES[Math.min(10, Math.max(1, level))] || LEVEL_TITLES[1];
};

export function GamificationProvider({ children }) {
  const [gamification, setGamification] = useState({
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    totalWorkouts: 0,
    totalVolume: 0,
    workoutDates: [],
    exerciseVariety: new Set(),
    personalRecords: {},
    earlyWorkouts: 0,
    lateWorkouts: 0,
    sharedWorkouts: 0,
  });
  const [achievements, setAchievements] = useState([]);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setGamification(prev => ({
            ...prev,
            ...parsed,
            exerciseVariety: new Set(parsed.exerciseVariety || []),
            personalRecords: parsed.personalRecords || {},
          }));
        }

        const savedAchievements = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
        if (savedAchievements) {
          const parsed = JSON.parse(savedAchievements);
          setAchievements(parsed);
        } else {
          setAchievements(DEFAULT_ACHIEVEMENTS);
        }
      } catch (e) {
        console.warn('Failed to load gamification data:', e);
        setAchievements(DEFAULT_ACHIEVEMENTS);
      }
    }
  }, []);

  const saveGamification = useCallback((data) => {
    if (typeof window === 'undefined') return;
    try {
      const toSave = {
        ...data,
        exerciseVariety: Array.from(data.exerciseVariety),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save gamification data:', e);
    }
  }, []);

  const saveAchievements = useCallback((data) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save achievements:', e);
    }
  }, []);

  const calculateLevel = (xp) => {
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
        break;
      }
    }
    return level;
  };

  const getXpForNextLevel = (level) => {
    return LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  };

  const getCurrentLevelProgress = (xp, level) => {
    const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const checkAndUnlockAchievements = useCallback((newGamification) => {
    const newlyUnlocked = [];
    
    setAchievements(prev => {
      const updated = prev.map(achievement => {
        if (achievement.unlocked) return achievement;
        
        let shouldUnlock = false;
        
        switch (achievement.id) {
          case 'first_workout':
            shouldUnlock = newGamification.totalWorkouts >= 1;
            break;
          case 'week_warrior':
            shouldUnlock = newGamification.streak >= 7;
            break;
          case 'month_master':
            shouldUnlock = newGamification.streak >= 30;
            break;
          case 'centurion':
            shouldUnlock = newGamification.totalWorkouts >= 100;
            break;
          case 'heavy_lifter':
            shouldUnlock = newGamification.totalVolume >= 10000;
            break;
          case 'early_bird':
            shouldUnlock = newGamification.earlyWorkouts >= 10;
            break;
          case 'night_owl':
            shouldUnlock = newGamification.lateWorkouts >= 10;
            break;
          case 'variety_king':
            shouldUnlock = newGamification.exerciseVariety.size >= 50;
            break;
          case 'pr_hunter':
            shouldUnlock = Object.keys(newGamification.personalRecords).length >= 10;
            break;
          case 'social_butterfly':
            shouldUnlock = newGamification.sharedWorkouts >= 5;
            break;
        }
        
        if (shouldUnlock) {
          newlyUnlocked.push({ ...achievement, unlocked: true });
          return { ...achievement, unlocked: true };
        }
        return achievement;
      });
      
      return updated;
    });
    
    if (newlyUnlocked.length > 0) {
      setRecentlyUnlocked(prev => [...prev, ...newlyUnlocked]);
      const totalXp = newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0);
      addXp(totalXp, false);
    }
  }, []);

  const addXp = useCallback((amount, checkAchievements = true) => {
    setGamification(prev => {
      const newXp = prev.xp + amount;
      const newLevel = calculateLevel(newXp);
      const leveledUp = newLevel > prev.level;
      
      const newGamification = {
        ...prev,
        xp: newXp,
        level: newLevel,
      };
      
      saveGamification(newGamification);
      
      if (leveledUp) {
        setNewLevel(newLevel);
        setShowLevelUp(true);
      }
      
      if (checkAchievements) {
        setTimeout(() => checkAndUnlockAchievements(newGamification), 0);
      }
      
      return newGamification;
    });
  }, [saveGamification, checkAndUnlockAchievements]);

  const recordWorkout = useCallback((workoutData) => {
    const { volume, exercises, date, isEarly, isLate } = workoutData;
    const workoutDate = date ? new Date(date).toDateString() : new Date().toDateString();
    const today = new Date().toDateString();
    
    setGamification(prev => {
      const workoutDates = [...prev.workoutDates];
      if (!workoutDates.includes(workoutDate)) {
        workoutDates.push(workoutDate);
      }
      
      const exerciseVariety = new Set(prev.exerciseVariety);
      exercises?.forEach(ex => exerciseVariety.add(ex.name));
      
      let newStreak = prev.streak;
      let longestStreak = prev.longestStreak;
      
      if (workoutDate === today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (prev.lastWorkoutDate === yesterday || prev.lastWorkoutDate === today) {
          newStreak = prev.lastWorkoutDate === yesterday ? prev.streak + 1 : prev.streak;
        } else if (prev.lastWorkoutDate !== today) {
          newStreak = 1;
        }
      }
      
      longestStreak = Math.max(longestStreak, newStreak);
      
      const newGamification = {
        ...prev,
        totalWorkouts: prev.totalWorkouts + 1,
        totalVolume: prev.totalVolume + (volume || 0),
        lastWorkoutDate: workoutDate,
        workoutDates,
        exerciseVariety,
        streak: newStreak,
        longestStreak,
        earlyWorkouts: prev.earlyWorkouts + (isEarly ? 1 : 0),
        lateWorkouts: prev.lateWorkouts + (isLate ? 1 : 0),
      };
      
      saveGamification(newGamification);
      
      const baseXp = 50;
      const volumeBonus = Math.min(100, Math.floor((volume || 0) / 100));
      const streakBonus = newStreak > 1 ? Math.min(50, newStreak * 5) : 0;
      const totalXp = baseXp + volumeBonus + streakBonus;
      
      setTimeout(() => addXp(totalXp), 0);
      
      return newGamification;
    });
  }, [addXp, saveGamification]);

  const recordPersonalRecord = useCallback((exerciseName, weight) => {
    setGamification(prev => {
      const currentPR = prev.personalRecords[exerciseName] || 0;
      if (weight > currentPR) {
        const newRecords = { ...prev.personalRecords, [exerciseName]: weight };
        const newGamification = { ...prev, personalRecords: newRecords };
        saveGamification(newGamification);
        setTimeout(() => checkAndUnlockAchievements(newGamification), 0);
        return newGamification;
      }
      return prev;
    });
  }, [saveGamification, checkAndUnlockAchievements]);

  const recordSharedWorkout = useCallback(() => {
    setGamification(prev => {
      const newGamification = { ...prev, sharedWorkouts: prev.sharedWorkouts + 1 };
      saveGamification(newGamification);
      setTimeout(() => checkAndUnlockAchievements(newGamification), 0);
      return newGamification;
    });
  }, [saveGamification, checkAndUnlockAchievements]);

  const dismissLevelUp = useCallback(() => {
    setShowLevelUp(false);
  }, []);

  const dismissAchievement = useCallback((achievementId) => {
    setRecentlyUnlocked(prev => prev.filter(a => a.id !== achievementId));
  }, []);

  const xpForNextLevel = getXpForNextLevel(gamification.level);
  const currentLevelProgress = getCurrentLevelProgress(gamification.xp, gamification.level);
  const xpInCurrentLevel = gamification.xp - (LEVEL_THRESHOLDS[gamification.level - 1] || 0);
  const xpNeededForNext = xpForNextLevel - (LEVEL_THRESHOLDS[gamification.level - 1] || 0);

  return (
    <GamificationContext.Provider value={{
      gamification,
      achievements,
      recentlyUnlocked,
      showLevelUp,
      newLevel,
      addXp,
      recordWorkout,
      recordPersonalRecord,
      recordSharedWorkout,
      dismissLevelUp,
      dismissAchievement,
      levelProgress: {
        currentLevel: gamification.level,
        currentXp: gamification.xp,
        xpForNextLevel,
        xpInCurrentLevel,
        xpNeededForNext,
        progressPercent: currentLevelProgress,
        levelTitle: getLevelTitle(gamification.level).name,
        levelTitleDesc: getLevelTitle(gamification.level).desc,
      },
      streak: gamification.streak,
      longestStreak: gamification.longestStreak,
      totalWorkouts: gamification.totalWorkouts,
      totalVolume: gamification.totalVolume,
    }}>
      {children}
      
      {mounted && showLevelUp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card-hover glass-card p-8 max-w-md w-full text-center animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-gold via-accent-amber to-accent-orange animate-shimmer" />
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-gold/30 to-accent-amber/30 blur-xl animate-pulse" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-accent-gold to-accent-amber flex items-center justify-center shadow-2xl shadow-accent-gold/30">
                <span className="font-heading font-black text-3xl text-[#0a0a0f]">{newLevel}</span>
              </div>
            </div>
            <h3 className="font-heading font-extrabold text-2xl text-white mb-2">Level Up! 🎉</h3>
            <p className="text-text-secondary mb-6">You've reached level <span className="text-gradient-gold font-bold">{newLevel}</span></p>
            <button
              onClick={dismissLevelUp}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple text-white font-extrabold text-sm shadow-lg shadow-accent-purple/20 hover:opacity-90 transition-all cursor-pointer"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
      
      {mounted && recentlyUnlocked.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-3 animate-slide-up">
          {recentlyUnlocked.map((achievement, index) => (
            <div
              key={`${achievement.id}-${index}`}
              className="glass-card-hover glass-card p-4 flex items-center gap-4 min-w-[320px] max-w-md animate-slide-up shadow-2xl border-accent-gold/30"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold to-accent-amber flex items-center justify-center text-2xl shrink-0 shadow-lg shadow-accent-gold/30">
                {achievement.icon}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-heading font-extrabold text-xs text-accent-gold uppercase tracking-wider">Achievement Unlocked</p>
                <h4 className="font-bold text-white truncate">{achievement.name}</h4>
                <p className="text-text-secondary text-xs mt-0.5">{achievement.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-1 rounded-full bg-accent-gold/20 text-accent-gold text-[10px] font-black">+{achievement.xpReward} XP</span>
                <button
                  onClick={() => dismissAchievement(achievement.id)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}