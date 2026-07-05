import React, { useState, useEffect } from 'react';
import { Flame, Calendar } from 'lucide-react';
import GeneratorTab from './GeneratorTab';
import RoutinesTab from './RoutinesTab';

export default function PlannerTab({
  user,
  onSignInClick,
  onStartWorkout,
  showToast,
  prefilledWorkout,
  clearPrefillWorkout,
  prefilledMuscles,
  clearPrefilledMuscles,
  prefilledRoutine,
  clearPrefillRoutine,
  setPrefilledWorkout,
  plannerTab,
  setPlannerTab
}) {
  // Sync prefilled objects to switch modes automatically
  useEffect(() => {
    if (prefilledRoutine) {
      setPlannerTab('routine');
    } else if (prefilledWorkout || prefilledMuscles) {
      setPlannerTab('workout');
    }
  }, [prefilledRoutine, prefilledWorkout, prefilledMuscles, setPlannerTab]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up">
      {/* Page Header and Mode Toggle Selector in a single layout row */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
            Training <span className="text-gradient">Planner</span>
          </h2>
          <p className="text-text-secondary mt-2 text-xs sm:text-sm">
            Generate customized single-day workout sessions or build structured weekly routine plans.
          </p>
        </div>

        {/* Unified Mode Toggle */}
        <div className="flex bg-white/5 border border-white/5 rounded-2xl p-1 shrink-0 self-start md:self-auto shadow-inner">
          <button
            onClick={() => setPlannerTab('workout')}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              plannerTab === 'workout'
                ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow-md font-bold'
                : 'text-text-secondary hover:text-white hover:bg-white/3'
            }`}
          >
            <Flame className="w-4 h-4" />
            Workout Generator
          </button>
          <button
            onClick={() => setPlannerTab('routine')}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              plannerTab === 'routine'
                ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow-md font-bold'
                : 'text-text-secondary hover:text-white hover:bg-white/3'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Routine Builder
          </button>
        </div>
      </div>

      {/* Switch panels */}
      <div className="animate-fade-in">
        {plannerTab === 'workout' ? (
          <GeneratorTab
            onStartWorkout={onStartWorkout}
            showToast={showToast}
            user={user}
            onSignInClick={onSignInClick}
            prefilledWorkout={prefilledWorkout}
            clearPrefill={clearPrefillWorkout}
            prefilledMuscles={prefilledMuscles}
            clearPrefilledMuscles={clearPrefilledMuscles}
          />
        ) : (
          <RoutinesTab
            showToast={showToast}
            user={user}
            onSignInClick={onSignInClick}
            prefilledRoutine={prefilledRoutine}
            clearPrefill={clearPrefillRoutine}
            onStartWorkout={onStartWorkout}
            onSendToGenerator={(workout) => {
              setPrefilledWorkout(workout);
              setPlannerTab('workout');
              showToast('Day loaded into Single Workout Generator! 🏋️‍♂️', 'success');
            }}
          />
        )}
      </div>
    </div>
  );
}
