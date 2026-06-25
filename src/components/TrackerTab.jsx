import React, { useState, useEffect, useRef } from 'react';
import { Timer, Dumbbell, Check, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { saveWorkoutLog } from '@/lib/storage';

export default function TrackerTab({ workout, onCancelWorkout, onFinishWorkout, showToast }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Exercises state: map exercises to sets structures
  const [loggedExercises, setLoggedExercises] = useState([]);
  
  // Rest Timer State
  const [restOpen, setRestOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  
  // Timer references
  const mainTimerRef = useRef(null);
  const restTimerRef = useRef(null);

  // Initialize tracker exercises
  useEffect(() => {
    if (workout && workout.exercises) {
      const formatted = workout.exercises.map((ex, idx) => {
        // Create initial sets
        const setsArray = [];
        const count = ex.sets || 3;
        for (let s = 0; s < count; s++) {
          setsArray.push({
            id: s + 1,
            weight: 0,
            reps: ex.reps || 10,
            completed: false
          });
        }
        return {
          id: ex.id ? `${ex.id}-${idx}` : `ex-${idx}`,
          name: ex.name,
          muscles: ex.muscles,
          equipment: ex.equipment,
          type: ex.type,
          rest: ex.rest || 60,
          sets: setsArray
        };
      });
      setLoggedExercises(formatted);
      setElapsedSeconds(0);
    }
  }, [workout]);

  // Main session timer effect
  useEffect(() => {
    mainTimerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(mainTimerRef.current);
  }, []);

  // Rest countdown timer effect
  useEffect(() => {
    if (restOpen && restSeconds > 0) {
      restTimerRef.current = setInterval(() => {
        setRestSeconds(prev => prev - 1);
      }, 1000);
    } else if (restSeconds === 0) {
      setRestOpen(false);
      clearInterval(restTimerRef.current);
    }

    return () => clearInterval(restTimerRef.current);
  }, [restOpen, restSeconds]);

  // Format Elapsed Time (MM:SS)
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add Set
  const handleAddSet = (exId) => {
    setLoggedExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        const nextSetId = ex.sets.length > 0 ? Math.max(...ex.sets.map(s => s.id)) + 1 : 1;
        // Copy weight and reps from the last set for helper prefill
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: nextSetId,
              weight: lastSet ? lastSet.weight : 0,
              reps: lastSet ? lastSet.reps : 10,
              completed: false
            }
          ]
        };
      }
      return ex;
    }));
  };

  // Remove Set
  const handleRemoveSet = (exId, setId) => {
    setLoggedExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId)
        };
      }
      return ex;
    }));
  };

  // Update Set Weight / Reps
  const handleUpdateSetField = (exId, setId, field, value) => {
    setLoggedExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    }));
  };

  // Toggle Set Complete (trigging rest timer on check)
  const handleToggleSetComplete = (exId, setId, currentStatus, restDuration) => {
    const nextStatus = !currentStatus;
    
    setLoggedExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, completed: nextStatus } : s)
        };
      }
      return ex;
    }));

    if (nextStatus) {
      // Trigger rest timer
      setRestSeconds(restDuration);
      setRestTotal(restDuration);
      setRestOpen(true);
    }
  };

  // Rest Timer Controls
  const handleAddRestTime = (seconds) => {
    setRestSeconds(prev => prev + seconds);
    setRestTotal(prev => prev + seconds);
  };

  const handleSkipRest = () => {
    setRestOpen(false);
    setRestSeconds(0);
  };

  // Submit Workout Log
  const handleFinish = async () => {
    // Audit check: did they log anything?
    let completedSetsCount = 0;
    loggedExercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) completedSetsCount++;
      });
    });

    if (completedSetsCount === 0) {
      if (!confirm('You haven\'t completed any sets! Save workout session anyway?')) {
        return;
      }
    }

    const payload = {
      name: workout.name || 'Custom Workout Session',
      durationSeconds: elapsedSeconds,
      exercises: loggedExercises.map(ex => ({
        name: ex.name,
        muscles: ex.muscles,
        equipment: ex.equipment,
        type: ex.type,
        sets: ex.sets.map(s => ({
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
          completed: s.completed
        }))
      }))
    };

    try {
      await saveWorkoutLog(payload);
      showToast('Workout session completed and logged! 🔥', 'success');
      
      // Cleanup timers
      clearInterval(mainTimerRef.current);
      clearInterval(restTimerRef.current);
      
      onFinishWorkout();
    } catch (err) {
      showToast('Failed to log workout session', 'error');
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel tracking? Your current progress will be lost.')) {
      clearInterval(mainTimerRef.current);
      clearInterval(restTimerRef.current);
      onCancelWorkout();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-slide-up relative">
      
      {/* Timer & Dashboard Banner */}
      <div className="glass-card rounded-2xl p-6 mb-6 shadow-xl flex items-center justify-between border border-white/10 bg-gradient-to-r from-[#12121a] to-[#1a1a2e]">
        <div>
          <span className="text-xs text-text-muted font-bold tracking-wider uppercase">Active Session</span>
          <h3 className="font-heading font-extrabold text-2xl text-white mt-1">
            {workout?.name || 'Workout Session'}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {loggedExercises.length} Exercises · Prefill Target: {workout?.estimatedMinutes || '?'} mins
          </p>
        </div>
        <div className="flex items-center gap-3 bg-black/30 border border-white/5 px-4 py-2.5 rounded-xl">
          <Timer className="w-5 h-5 text-accent-purple animate-pulse-glow" />
          <span className="font-heading font-black text-2xl text-white tracking-widest leading-none">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Sticky Rest Timer stuck below navbar */}
      {restOpen && (
        <div className="sticky top-[72px] z-40 w-full mb-6 animate-slide-down">
          <div className="glass-card rounded-2xl p-4 border border-accent-purple/35 bg-[#12121a]/95 backdrop-blur-md shadow-xl shadow-accent-purple/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center text-accent-purple shrink-0 text-xl animate-pulse">
                ⏳
              </div>
              <div className="text-left flex-grow">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Rest Timer Active</span>
                <div className="w-32 sm:w-48 h-1.5 rounded-full bg-white/5 overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-accent-indigo to-accent-purple transition-all duration-1000 ease-linear"
                    style={{ width: `${(restSeconds / restTotal) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
              <div className="font-heading font-black text-3xl text-white tracking-widest leading-none flex items-baseline">
                {restSeconds}
                <span className="text-xs text-text-secondary ml-0.5">s</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddRestTime(30)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  ➕ 30s
                </button>
                <button
                  onClick={handleSkipRest}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 text-white font-bold text-xs shadow transition-all cursor-pointer"
                >
                  Skip ⏭️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exercises Log Grid */}
      <div className="space-y-6">
        {loggedExercises.map((ex, exIdx) => (
          <div key={ex.id || exIdx} className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
            
            {/* Exercise Header */}
            <div className="flex items-start justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple shrink-0">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-white">{ex.name}</h4>
                  <div className="flex gap-1.5 mt-0.5">
                    {ex.muscles.map(m => (
                      <span key={m} className="text-[9px] font-medium text-text-secondary bg-white/5 border border-white/5 px-1 py-0.2 rounded">
                        {m}
                      </span>
                    ))}
                    <span className="text-[9px] text-text-muted">· {ex.equipment} · Rest {ex.rest}s</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleAddSet(ex.id)}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1 border border-white/10 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Set
              </button>
            </div>

            {/* Set Logger Rows */}
            {ex.sets.length > 0 ? (
              <div className="space-y-2">
                {/* Headers */}
                <div className="grid grid-cols-12 gap-2 text-[10px] text-text-muted font-bold uppercase tracking-wider px-2">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-4 text-center">Weight (kg)</div>
                  <div className="col-span-3 text-center">Reps</div>
                  <div className="col-span-3 text-right">Log</div>
                </div>

                {ex.sets.map((set, sIdx) => (
                  <div
                    key={set.id}
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                      set.completed
                        ? 'bg-accent-emerald/5 border-accent-emerald/20'
                        : 'bg-white/2 border-white/5'
                    }`}
                  >
                    {/* Index */}
                    <div className="col-span-2 text-center text-xs font-bold text-white">
                      {sIdx + 1}
                    </div>

                    {/* Weight Input */}
                    <div className="col-span-4 flex items-center justify-center">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={set.completed}
                        value={set.weight || ''}
                        onChange={(e) => handleUpdateSetField(ex.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full max-w-[80px] text-center px-2 py-1 rounded bg-black/20 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-accent-purple disabled:opacity-50"
                      />
                    </div>

                    {/* Reps Input */}
                    <div className="col-span-3 flex items-center justify-center">
                      <input
                        type="number"
                        min="0"
                        disabled={set.completed}
                        value={set.reps || ''}
                        onChange={(e) => handleUpdateSetField(ex.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full max-w-[70px] text-center px-2 py-1 rounded bg-black/20 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-accent-purple disabled:opacity-50"
                      />
                    </div>

                    {/* Action buttons (Trash & Check) */}
                    <div className="col-span-3 flex items-center justify-end gap-2 pr-1">
                      <button
                        onClick={() => handleRemoveSet(ex.id, set.id)}
                        disabled={set.completed}
                        className="p-1 rounded text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        title="Delete Set"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleSetComplete(ex.id, set.id, set.completed, ex.rest)}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          set.completed
                            ? 'bg-accent-emerald border-accent-emerald text-white shadow shadow-accent-emerald/20'
                            : 'border-white/20 hover:border-white/40 text-transparent hover:text-text-muted'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3px]" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-text-muted">
                No sets logged. Click "+ Set" to add sets.
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Main Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleCancel}
          className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-accent-rose/10 hover:border-accent-rose/30 hover:text-accent-rose text-white font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <X className="w-5 h-5" />
          Cancel Workout
        </button>
        <button
          onClick={handleFinish}
          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 font-bold text-white shadow-lg shadow-accent-purple/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Check className="w-5 h-5 stroke-[3px]" />
          Finish Workout
        </button>
      </div>

    </div>
  );
}
