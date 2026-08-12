'use client';

import React from 'react';
import { Dumbbell, AlertTriangle, Play, Pause, Trash2, X, ArrowLeft } from 'lucide-react';

export default function ExitWorkoutModal({
  isOpen,
  onResume,
  onMinimize,
  onDiscard,
  workoutName,
  resolvedTheme = 'dark'
}) {
  if (!isOpen) return null;

  const isLight = resolvedTheme === 'light';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in">
      {/* Dimmed Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onResume}
      />

      {/* Modal Container */}
      <div 
        className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl transition-all border transform scale-100 ${
          isLight 
            ? 'bg-white/95 border-gray-200 text-slate-900 shadow-slate-300/50' 
            : 'bg-[#0f0f17]/95 border-white/10 text-white shadow-black/80'
        } backdrop-blur-2xl`}
      >
        {/* Header Icon & Close Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <button
            onClick={onResume}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-slate-400'
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Text Content */}
        <div className="mb-6">
          <h3 className="text-xl font-black tracking-tight mb-2 flex items-center gap-2">
            Workout in Progress
          </h3>
          <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            You have an active session running{workoutName ? ` (` + workoutName + `)` : ''}. What would you like to do before navigating back?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Action: Resume Workout */}
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan text-white font-extrabold text-sm shadow-lg hover:shadow-accent-purple/20 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            Resume Workout
          </button>

          {/* Secondary Action: Keep in background & minimize */}
          {onMinimize && (
            <button
              onClick={onMinimize}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  : 'border-white/10 hover:bg-white/5 text-slate-200'
              }`}
            >
              <Pause className="w-4 h-4 text-accent-cyan" />
              Keep Running in Background
            </button>
          )}

          {/* Destructive Action: Discard Workout */}
          <button
            onClick={onDiscard}
            className="w-full py-3 px-4 rounded-2xl font-bold text-sm border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Discard & Exit Workout
          </button>
        </div>
      </div>
    </div>
  );
}
