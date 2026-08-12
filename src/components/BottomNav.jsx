'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Apple, 
  FolderHeart, 
  User, 
  Flame, 
  Zap,
  Dumbbell
} from 'lucide-react';

export default function BottomNav({
  currentPage,
  setCurrentPage,
  user,
  activeWorkout,
  savedSession,
  onOpenAuth,
  resolvedTheme,
}) {
  // Define nav links dynamically based on user auth status
  const navItems = user
    ? [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'planner', label: 'Planner', icon: Calendar },
        { id: 'create', label: 'Exercises', icon: Dumbbell },
        { id: 'nutrition', label: 'Nutrition', icon: Apple },
        { id: 'library', label: 'Library', icon: FolderHeart },
        { id: 'profile', label: 'Profile', icon: User },
      ]
    : [
        { id: 'home', label: 'Home', icon: Flame },
        { id: 'planner', label: 'Planner', icon: Calendar },
        { id: 'library', label: 'Library', icon: FolderHeart },
        { id: 'auth', label: 'Sign In', icon: User, isAuthTrigger: true },
      ];

  const hasActiveSession = !!(activeWorkout || savedSession);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      
      {/* Floating Active Workout Pill (if a workout is actively in progress or paused) */}
      {hasActiveSession && currentPage !== 'tracker' && (
        <div className="px-4 mb-2 pointer-events-auto flex justify-center animate-slide-up">
          <button
            onClick={() => setCurrentPage('tracker')}
            className="w-full max-w-sm py-2.5 px-4 rounded-2xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan text-white shadow-xl flex items-center justify-between border border-white/20 active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 animate-pulse">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-accent-cyan block leading-tight">
                  Active Workout
                </span>
                <span className="text-xs font-extrabold truncate block max-w-[170px] text-white">
                  {activeWorkout?.name || savedSession?.workout?.name || 'Session in Progress'}
                </span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-xl bg-white/20 text-[10px] font-black tracking-wide uppercase text-white shrink-0">
              Resume →
            </div>
          </button>
        </div>
      )}

      {/* Main Glassmorphic Bottom Navigation Bar */}
      <nav 
        className={`pointer-events-auto border-t shadow-2xl transition-colors duration-300 ${
          resolvedTheme === 'light'
            ? 'bg-white/90 border-gray-200/80 text-[#0f172a]'
            : 'bg-[#0a0a0f]/90 border-white/10 text-[#ededed]'
        } backdrop-blur-xl pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 px-2`}
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isAuthTrigger) {
                    onOpenAuth();
                  } else {
                    setCurrentPage(item.id);
                  }
                }}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'text-accent-purple font-extrabold'
                    : resolvedTheme === 'light'
                    ? 'text-slate-500 hover:text-slate-900'
                    : 'text-[#a0a0b8] hover:text-white'
                }`}
              >
                {/* Active Indicator Top Glow Bar */}
                {isActive && (
                  <span className="absolute -top-2 w-8 h-1 rounded-full bg-gradient-to-r from-accent-indigo to-accent-purple shadow-[0_0_12px_rgba(163,137,244,0.8)] animate-fade-in" />
                )}

                {/* Icon with scaling effect */}
                <div
                  className={`p-1 rounded-xl transition-transform duration-200 ${
                    isActive
                      ? 'scale-110 text-accent-purple'
                      : 'scale-100'
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] tracking-tight leading-none mt-1 font-bold ${
                    isActive
                      ? 'text-accent-purple font-extrabold'
                      : resolvedTheme === 'light'
                      ? 'text-slate-600'
                      : 'text-[#a0a0b8]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
