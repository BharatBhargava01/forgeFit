import React, { useState, useEffect, useMemo } from 'react';
import { Timer, Play, Pause, ChevronUp, ChevronDown, Check, Plus, Minus, Maximize2, Trash2, X } from 'lucide-react';

export default function WorkoutPip({ onNavigate, showToast, onFinishWorkout, onCancelWorkout }) {
  const [session, setSession] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentExIdx, setCurrentExIdx] = useState(0);

  // Poll localStorage to detect active session state
  useEffect(() => {
    const checkActiveSession = () => {
      const saved = localStorage.getItem('wg_active_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSession(parsed);
        } catch (e) {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    };

    checkActiveSession();
    // Watch for window-level storage changes
    window.addEventListener('storage', checkActiveSession);

    // Also poll every 1 second for local updates in the same tab
    const interval = setInterval(checkActiveSession, 1000);

    return () => {
      window.removeEventListener('storage', checkActiveSession);
      clearInterval(interval);
    };
  }, []);

  // Sync current exercise index when session is first loaded
  useEffect(() => {
    if (session && session.loggedExercises) {
      const incompleteIdx = session.loggedExercises.findIndex(ex => 
        ex.sets && ex.sets.some(s => !s.completed)
      );
      if (incompleteIdx !== -1) {
        setCurrentExIdx(incompleteIdx);
      }
    }
  }, [session?.workout?.id]); // run only when starting a new session

  // Running elapsed timer inside PiP
  useEffect(() => {
    if (!session || session.isPaused) return;

    const timer = setInterval(() => {
      setSession(prev => {
        if (!prev) return null;
        const nextSecs = (prev.elapsedSeconds || 0) + 1;
        const updated = { ...prev, elapsedSeconds: nextSecs };
        localStorage.setItem('wg_active_session', JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.isPaused, session?.workout?.id]);

  if (!session) return null;

  const currentExercise = session.loggedExercises?.[currentExIdx] || null;

  // Toggle set checkbox completed
  const handleToggleSet = (setId) => {
    if (!session || !currentExercise) return;
    const updatedExercises = session.loggedExercises.map((ex, idx) => {
      if (idx === currentExIdx) {
        const updatedSets = ex.sets.map(s => 
          s.id === setId ? { ...s, completed: !s.completed } : s
        );
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    const updated = { ...session, loggedExercises: updatedExercises };
    localStorage.setItem('wg_active_session', JSON.stringify(updated));
    setSession(updated);
    
    // Trigger window storage event to let TrackerTab update if mounted
    window.dispatchEvent(new Event('storage'));
  };

  // Adjust set weight (+/- 2.5kg) or reps (+/- 1)
  const handleAdjustSet = (setId, field, amount) => {
    if (!session || !currentExercise) return;
    const updatedExercises = session.loggedExercises.map((ex, idx) => {
      if (idx === currentExIdx) {
        const updatedSets = ex.sets.map(s => {
          if (s.id === setId) {
            const nextVal = Math.max(0, (s[field] || 0) + amount);
            return { ...s, [field]: nextVal };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    const updated = { ...session, loggedExercises: updatedExercises };
    localStorage.setItem('wg_active_session', JSON.stringify(updated));
    setSession(updated);
    
    window.dispatchEvent(new Event('storage'));
  };

  // Switch pause/play state
  const handleTogglePause = () => {
    if (!session) return;
    const updated = { ...session, isPaused: !session.isPaused };
    localStorage.setItem('wg_active_session', JSON.stringify(updated));
    setSession(updated);
    window.dispatchEvent(new Event('storage'));
    showToast(updated.isPaused ? 'Timer paused' : 'Timer resumed', 'info');
  };

  // Navigation between exercises
  const handlePrevEx = () => {
    setCurrentExIdx(prev => Math.max(0, prev - 1));
  };

  const handleNextEx = () => {
    if (session.loggedExercises) {
      setCurrentExIdx(prev => Math.min(session.loggedExercises.length - 1, prev + 1));
    }
  };

  // Formats timer into MM:SS or HH:MM:SS
  const formatTime = (totalSecs) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    const pad = (n) => String(n).padStart(2, '0');
    return hours > 0 ? `${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  // Calculate overall set completion status
  const totalSets = session.loggedExercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0;
  const completedSets = session.loggedExercises?.reduce((acc, ex) => 
    acc + (ex.sets?.filter(s => s.completed).length || 0), 0
  ) || 0;

  // Complete and save log session
  const triggerFinish = () => {
    if (completedSets === 0) {
      if (!confirm('You haven\'t logged any completed sets. Save workout anyway?')) return;
    }
    // Prepare log data
    const finalLog = {
      id: session.workout.id || `log-${Date.now()}`,
      name: session.workout.name || 'Workout Session',
      date: new Date().toISOString(),
      loggedAt: new Date().toISOString(),
      durationSeconds: session.elapsedSeconds,
      exercises: session.loggedExercises
    };

    // Save using parent callback or local storage layer helper
    onFinishWorkout(finalLog);
    showToast('Workout completed and saved to history! 🏆', 'success');
  };

  const triggerCancel = () => {
    if (confirm('Discard active workout progress? This cannot be undone.')) {
      onCancelWorkout();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up pointer-events-auto">
      {/* Floating Card Container */}
      <div className="relative group overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan shadow-2xl shadow-accent-purple/15">
        
        {/* Glassmorphic Inner Container */}
        <div className="glass-card bg-[#0d0d14]/95 backdrop-blur-xl rounded-[14px] p-3 sm:p-4 text-white flex flex-col transition-all duration-300"
          style={{ width: isExpanded ? '310px' : '260px', maxHeight: isExpanded ? '420px' : '64px' }}
        >
          {/* Header Row (Always Visible) */}
          <div className="flex items-center justify-between gap-3 h-10 select-none">
            <div className="flex items-center gap-2 text-left truncate flex-grow">
              <div className="w-8 h-8 rounded-xl bg-accent-purple/15 border border-accent-purple/20 flex items-center justify-center text-accent-purple shrink-0 relative">
                <Timer className={`w-4 h-4 ${!session.isPaused ? 'animate-pulse' : ''}`} />
                {/* Small floating set counter */}
                <span className="absolute -top-1 -right-1 bg-accent-cyan text-[#0a0a0f] text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#0d0d14]">
                  {completedSets}
                </span>
              </div>
              <div className="truncate">
                <span className="text-[9px] text-accent-cyan uppercase tracking-wider font-extrabold block">Running Workout</span>
                <span className="text-xs font-bold text-white block truncate mt-0.5">{session.workout?.name}</span>
              </div>
            </div>

            {/* Timer and Expand/Pause controls */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-heading font-black text-sm text-white bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
                {formatTime(session.elapsedSeconds)}
              </span>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors cursor-pointer"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded Content Panel */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col flex-grow overflow-hidden animate-fade-in space-y-4">
              
              {/* Exercise Navigation & Name */}
              {currentExercise ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={handlePrevEx}
                      disabled={currentExIdx === 0}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ◀
                    </button>
                    <div className="text-center flex-grow truncate">
                      <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider block">
                        Exercise {currentExIdx + 1} of {session.loggedExercises.length}
                      </span>
                      <span className="text-sm font-bold text-white block truncate mt-0.5">{currentExercise.name}</span>
                    </div>
                    <button
                      onClick={handleNextEx}
                      disabled={currentExIdx === session.loggedExercises.length - 1}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ▶
                    </button>
                  </div>

                  {/* Sets Checklist with weights/reps adjusters */}
                  <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1 custom-scrollbar">
                    {currentExercise.sets?.map((set, idx) => (
                      <div
                        key={set.id}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          set.completed
                            ? 'bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald'
                            : 'bg-white/2 border-white/5 text-white/90'
                        }`}
                      >
                        <span className="text-[10px] font-bold shrink-0 w-8">Set {idx + 1}</span>

                        {/* Weight adjuster */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAdjustSet(set.id, 'weight', -2.5)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[10px] font-black min-w-[34px] text-center">{set.weight}kg</span>
                          <button
                            onClick={() => handleAdjustSet(set.id, 'weight', 2.5)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Reps adjuster */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAdjustSet(set.id, 'reps', -1)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[10px] font-black min-w-[32px] text-center">{set.reps} r</span>
                          <button
                            onClick={() => handleAdjustSet(set.id, 'reps', 1)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Check button */}
                        <button
                          onClick={() => handleToggleSet(set.id)}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 transition-all cursor-pointer ${
                            set.completed
                              ? 'bg-accent-emerald border-accent-emerald text-[#0a0a0f]'
                              : 'border-white/20 hover:border-white/40 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-text-muted">No exercises available.</div>
              )}

              {/* Action Buttons Row */}
              <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 mt-auto shrink-0 select-none">
                <button
                  onClick={triggerCancel}
                  className="py-2 rounded-xl bg-white/5 hover:bg-accent-rose/10 hover:text-accent-rose text-text-secondary font-bold text-[10px] transition-all cursor-pointer border border-white/5 text-center flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Discard
                </button>
                <button
                  onClick={triggerFinish}
                  className="py-2 rounded-xl bg-gradient-to-r from-accent-emerald to-emerald-600 hover:opacity-90 text-[#0a0a0f] font-black text-[10px] shadow transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Finish
                </button>
                <button
                  onClick={() => {
                    onNavigate('tracker');
                    setIsExpanded(false);
                  }}
                  className="py-2 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 text-white font-extrabold text-[10px] shadow transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  Maximize
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
