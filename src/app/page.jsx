'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Dumbbell, Sparkles, ChevronRight, Award, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import GeneratorTab from '@/components/GeneratorTab';
import RoutinesTab from '@/components/RoutinesTab';
import LibraryTab from '@/components/LibraryTab';
import CreateTab from '@/components/CreateTab';
import TrackerTab from '@/components/TrackerTab';
import AnalyticsTab from '@/components/AnalyticsTab';
import SavedTab from '@/components/SavedTab';
import { setCustomExercisesCache } from '@/lib/data';
import { getCustomExercises, syncOfflineData } from '@/lib/storage';

export default function MainPage() {
  const [currentPage, setCurrentPage] = useState('home');
  const [activeWorkout, setActiveWorkout] = useState(null);
  
  // Custom caches / selections to prefill tabs
  const [prefilledWorkout, setPrefilledWorkout] = useState(null);
  const [prefilledRoutine, setPrefilledRoutine] = useState(null);
  const [prefilledMuscles, setPrefilledMuscles] = useState(null);

  // React-based toast notifications state
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const refreshCustomExercises = async () => {
    try {
      const data = await getCustomExercises();
      setCustomExercisesCache(data);
    } catch { /* silent */ }
  };

  // On Mount: Load custom exercises, set up offline sync listener, register Service Worker
  useEffect(() => {
    refreshCustomExercises();

    // Register Service Worker for PWA offline capabilities
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[Service Worker] Registered with scope:', reg.scope))
        .catch(err => console.error('[Service Worker] Registration failed:', err));
    }

    const handleSync = async () => {
      if (navigator.onLine) {
        try {
          const didSync = await syncOfflineData();
          if (didSync) {
            showToast('Synced offline data with server database! 🔌', 'success');
            refreshCustomExercises();
          }
        } catch (err) {
          console.error('[Offline Sync Error]', err);
        }
      }
    };

    window.addEventListener('online', handleSync);
    if (navigator.onLine) {
      handleSync();
    }

    return () => window.removeEventListener('online', handleSync);
  }, []);

  // Handle active workout tracking redirection
  const handleStartWorkout = (workoutTemplate) => {
    setActiveWorkout(workoutTemplate);
    setCurrentPage('tracker');
    showToast('Workout session started! Timer running.', 'success');
  };

  // Inspect workout/routine from Saved Library
  const handleInspectWorkout = (workout) => {
    setPrefilledWorkout(workout);
    setCurrentPage('generator');
  };

  const handleInspectRoutine = (routine) => {
    setPrefilledRoutine(routine);
    setCurrentPage('routine');
  };

  // Analytics AI recommendations trigger
  const handlePrefillMuscles = (muscles) => {
    setPrefilledMuscles(muscles);
    setCurrentPage('generator');
  };

  // Finish session tracker callback
  const handleFinishWorkout = () => {
    setActiveWorkout(null);
    setCurrentPage('analytics');
  };

  const handleCancelWorkout = () => {
    setActiveWorkout(null);
    setCurrentPage('home');
    showToast('Session cancelled', 'info');
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Navigation Bar */}
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content Area */}
      <main className="flex-grow">
        
        {/* Active Tracker Tab takes full priority if running */}
        {currentPage === 'tracker' && activeWorkout ? (
          <TrackerTab
            workout={activeWorkout}
            onCancelWorkout={handleCancelWorkout}
            onFinishWorkout={handleFinishWorkout}
            showToast={showToast}
          />
        ) : (
          <>
            {/* SPA tab routing */}
            {currentPage === 'home' && (
              <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 space-y-16 animate-fade-in">
                
                {/* Hero Section */}
                <div className="text-center space-y-6 max-w-3xl mx-auto relative">
                  <div className="absolute inset-0 -top-20 -z-10 blur-3xl opacity-20 bg-gradient-to-b from-accent-purple via-accent-indigo to-transparent h-[400px]"></div>
                  
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-text-secondary select-none">
                    <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse"></span>
                    Smart Training Assistant
                  </div>

                  <h1 className="font-heading font-black text-4xl sm:text-6xl text-white tracking-tight leading-tight sm:leading-none">
                    Build Your Perfect <span className="text-gradient">Workout</span>
                  </h1>

                  <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                    Instantly generate personalized workouts and weekly routines tailored to your target muscles, splits, and equipment availability.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button
                      onClick={() => setCurrentPage('generator')}
                      className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan hover:opacity-90 font-bold text-white shadow-lg shadow-accent-purple/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Flame className="w-5 h-5 fill-white" />
                      ⚡ Generate Workout
                    </button>
                    <button
                      onClick={() => setCurrentPage('routine')}
                      className="px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-5 h-5" />
                      📋 Build Routine
                    </button>
                  </div>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6">
                  <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
                    <span className="font-heading font-black text-3xl text-white block">80+</span>
                    <span className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold block">Exercises</span>
                  </div>
                  <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
                    <span className="font-heading font-black text-3xl text-white block">5</span>
                    <span className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold block">Split Options</span>
                  </div>
                  <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
                    <span className="font-heading font-black text-3xl text-white block">11</span>
                    <span className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold block">Muscle Areas</span>
                  </div>
                  <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
                    <span className="font-heading font-black text-3xl text-white block">∞</span>
                    <span className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold block">Combinations</span>
                  </div>
                </div>

                {/* Features Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-8">
                  
                  {/* Feature 1 */}
                  <div
                    onClick={() => setCurrentPage('generator')}
                    className="glass-card rounded-2xl p-6 border border-white/5 cursor-pointer hover:border-white/15 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan text-xl mb-4 group-hover:scale-105 transition-transform">
                        🎯
                      </div>
                      <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-accent-cyan transition-colors">
                        Smart Generation
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Procedural or Gemini-powered workout planning matching muscle splits, set prescriptions, and proper volume load.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-accent-cyan font-bold uppercase tracking-wider mt-4">
                      Open Generator <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div
                    onClick={() => setCurrentPage('routine')}
                    className="glass-card rounded-2xl p-6 border border-white/5 cursor-pointer hover:border-white/15 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple text-xl mb-4 group-hover:scale-105 transition-transform">
                        📅
                      </div>
                      <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-accent-purple transition-colors">
                        Routine Builder
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Push/Pull/Legs, Arnold Splits, Upper/Lower, or custom setups. Design structural weekly planners for complete consistency.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-accent-purple font-bold uppercase tracking-wider mt-4">
                      Create Routine <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div
                    onClick={() => setCurrentPage('saved')}
                    className="glass-card rounded-2xl p-6 border border-white/5 cursor-pointer hover:border-white/15 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center text-accent-amber text-xl mb-4 group-hover:scale-105 transition-transform">
                        💾
                      </div>
                      <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-accent-amber transition-colors">
                        Save & Revisit
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Log workout templates, custom split configurations, and access local storage offline fallbacks directly.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-accent-amber font-bold uppercase tracking-wider mt-4">
                      View Library <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                </div>

              </div>
            )}

            {currentPage === 'generator' && (
              <GeneratorTab
                onStartWorkout={handleStartWorkout}
                showToast={showToast}
                // Inspect variables
                prefilledWorkout={prefilledWorkout}
                clearPrefill={() => setPrefilledWorkout(null)}
                prefilledMuscles={prefilledMuscles}
                clearPrefilledMuscles={() => setPrefilledMuscles(null)}
              />
            )}

            {currentPage === 'routine' && (
              <RoutinesTab
                showToast={showToast}
                prefilledRoutine={prefilledRoutine}
                clearPrefill={() => setPrefilledRoutine(null)}
              />
            )}

            {currentPage === 'library' && (
              <LibraryTab />
            )}

            {currentPage === 'create' && (
              <CreateTab
                showToast={showToast}
                refreshCache={refreshCustomExercises}
              />
            )}

            {currentPage === 'analytics' && (
              <AnalyticsTab
                onPrefillGenerator={handlePrefillMuscles}
                showToast={showToast}
              />
            )}

            {currentPage === 'saved' && (
              <SavedTab
                onStartWorkout={handleStartWorkout}
                onInspectWorkout={handleInspectWorkout}
                onInspectRoutine={handleInspectRoutine}
                showToast={showToast}
              />
            )}
          </>
        )}

      </main>

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => {
          const typeCls = toast.type === 'error' 
            ? 'bg-accent-rose text-white border-accent-rose' 
            : toast.type === 'info'
            ? 'bg-accent-indigo text-white border-accent-indigo'
            : 'bg-[#12121a] border-accent-purple/30 text-white';

          return (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold flex items-center gap-2 pointer-events-auto transition-all animate-fade-in min-w-[200px] max-w-[320px] ${typeCls}`}
            >
              <span>{toast.type === 'error' ? '✕' : toast.type === 'info' ? 'ℹ' : '✓'}</span>
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
