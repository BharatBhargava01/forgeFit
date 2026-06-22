import React, { useState, useEffect } from 'react';
import { Zap, Brain, Play, Save, RotateCcw, Check, Flame } from 'lucide-react';
import { MUSCLE_GROUPS, EQUIPMENT } from '@/lib/data';
import { generateWorkout } from '@/lib/generator';
import { saveWorkout } from '@/lib/storage';

export default function GeneratorTab({ onStartWorkout, showToast, prefilledWorkout, clearPrefill, prefilledMuscles, clearPrefilledMuscles }) {
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState(2);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [useAI, setUseAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workoutResult, setWorkoutResult] = useState(null);

  useEffect(() => {
    if (prefilledWorkout) {
      setWorkoutResult(prefilledWorkout);
      setSelectedMuscles(prefilledWorkout.muscles || []);
      setDuration(prefilledWorkout.duration || 30);
      setDifficulty(prefilledWorkout.difficulty || 2);
      if (clearPrefill) clearPrefill();
    }
  }, [prefilledWorkout]);

  useEffect(() => {
    if (prefilledMuscles) {
      setSelectedMuscles(prefilledMuscles);
      if (clearPrefilledMuscles) clearPrefilledMuscles();
    }
  }, [prefilledMuscles]);

  const durationOptions = [15, 30, 45, 60, 90];
  const difficultyLabels = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };

  const toggleMuscle = (muscle) => {
    setSelectedMuscles(prev =>
      prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]
    );
  };

  const toggleEquipment = (eq) => {
    setSelectedEquipment(prev =>
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    );
  };

  const handleGenerate = async () => {
    if (selectedMuscles.length === 0) {
      showToast('Please select at least one muscle group', 'error');
      return;
    }

    setLoading(true);
    setWorkoutResult(null);

    const payload = {
      muscles: selectedMuscles,
      difficulty,
      duration,
      equipment: selectedEquipment,
    };

    if (useAI) {
      try {
        const res = await fetch('/api/workouts/ai-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        
        const data = await res.json();
        setWorkoutResult(data);
        showToast('AI workout generated successfully! 🧠', 'success');
      } catch (err) {
        console.warn('AI workout generation failed, falling back to rule-based engine:', err);
        showToast('AI Generation failed. Falling back to traditional rules.', 'error');
        const fallback = generateWorkout(payload);
        setWorkoutResult(fallback);
      } finally {
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        const result = generateWorkout(payload);
        setWorkoutResult(result);
        setLoading(false);
      }, 600);
    }
  };

  const handleSave = async () => {
    if (!workoutResult) return;
    const name = workoutResult.name || `${workoutResult.muscles.join(' & ')} Session`;
    try {
      await saveWorkout({ name, ...workoutResult });
      showToast(`"${name}" saved to library!`, 'success');
    } catch (err) {
      showToast('Failed to save workout', 'error');
    }
  };

  const getDifficultyBadge = (diff) => {
    const map = {
      1: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
      2: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
      3: 'bg-accent-rose/10 text-accent-rose border-accent-rose/20',
    };
    const label = difficultyLabels[diff] || 'Medium';
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${map[diff] || map[2]}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up">
      {/* Tab Header */}
      <div className="mb-8">
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
          Workout <span className="text-gradient">Generator</span>
        </h2>
        <p className="text-text-secondary mt-2">
          Pick your muscle groups and preferences to get a balanced training session instantly.
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6 shadow-xl">
            
            {/* Target Muscles */}
            <div className="space-y-3">
              <span className="text-sm font-semibold tracking-wider uppercase text-text-muted">
                Target Muscle Groups
              </span>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.filter(m => m !== 'Full Body').map(muscle => {
                  const active = selectedMuscles.includes(muscle);
                  return (
                    <button
                      key={muscle}
                      onClick={() => toggleMuscle(muscle)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 cursor-pointer ${
                        active
                          ? 'bg-accent-purple/20 border-accent-purple text-white'
                          : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {muscle}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <span className="text-sm font-semibold tracking-wider uppercase text-text-muted">
                Target Duration
              </span>
              <div className="flex gap-2">
                {durationOptions.map(mins => {
                  const active = duration === mins;
                  return (
                    <button
                      key={mins}
                      onClick={() => setDuration(mins)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 cursor-pointer ${
                        active
                          ? 'bg-accent-indigo/20 border-accent-indigo text-white font-bold'
                          : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {mins} min
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold tracking-wider uppercase text-text-muted">
                  Difficulty Level
                </span>
                <span className="text-sm font-bold text-accent-purple">
                  {difficultyLabels[difficulty]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg bg-white/10 appearance-none cursor-pointer accent-accent-purple"
              />
              <div className="flex justify-between text-xs text-text-muted font-medium">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Advanced</span>
              </div>
            </div>

            {/* Available Equipment */}
            <div className="space-y-3">
              <span className="text-sm font-semibold tracking-wider uppercase text-text-muted">
                Available Equipment
              </span>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT.map(eq => {
                  const active = selectedEquipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      onClick={() => toggleEquipment(eq)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                        active
                          ? 'bg-accent-indigo/20 border-accent-indigo text-white'
                          : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {eq}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-text-muted">Leave empty to include all equipment</p>
            </div>

            {/* AI Toggle */}
            <div className="flex items-center justify-between py-4 border-t border-white/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  Use AI Generator 🧠
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-accent-purple/10 text-accent-purple border border-accent-purple/20 tracking-wider">
                    Gemini AI
                  </span>
                </span>
                <span className="text-xs text-text-secondary">Generates a unique workout with Gemini</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/5 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-accent-indigo peer-checked:to-accent-purple peer-checked:border-transparent transition-all duration-300 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow-sm after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan hover:opacity-90 font-bold text-white shadow-lg shadow-accent-purple/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-white" />
              Generate Workout
            </button>

          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          {loading ? (
            /* Skeleton Loading State */
            <div className="glass-card rounded-2xl p-6 space-y-6 shadow-xl animate-pulse">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-white/10 rounded"></div>
                  <div className="h-4 w-48 bg-white/10 rounded"></div>
                </div>
                <div className="h-8 w-24 bg-white/10 rounded-lg"></div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="h-20 w-full bg-white/5 rounded-xl border border-white/5"></div>
                ))}
              </div>
            </div>
          ) : workoutResult ? (
            /* Result Presentation */
            <div className="glass-card rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/5">
                <div>
                  <h3 className="font-heading font-extrabold text-2xl text-white">
                    {workoutResult.name || 'Your Custom Workout'}
                  </h3>
                  <p className="text-text-secondary text-sm mt-1">
                    {workoutResult.totalExercises || workoutResult.exercises?.length} exercises · ~{workoutResult.estimatedMinutes} min
                  </p>
                  {workoutResult.description && (
                    <p className="text-text-muted text-xs italic mt-2 max-w-lg">
                      "{workoutResult.description}"
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => onStartWorkout(workoutResult)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-sm font-bold shadow-md shadow-accent-purple/10 hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="p-2 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-white hover:text-white cursor-pointer"
                    title="Regenerate"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Exercises List */}
              <div className="space-y-3">
                {workoutResult.exercises.map((ex, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 gap-4 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-text-secondary border border-white/5 shrink-0">
                        {i + 1}
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-white text-base block">{ex.name}</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ex.muscles.map(m => (
                            <span key={m} className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] text-text-secondary border border-white/5">
                              {m}
                            </span>
                          ))}
                          <span className="text-[10px] text-text-muted">
                            · {ex.equipment} · {ex.type}
                          </span>
                        </div>
                        {ex.description && (
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            {ex.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Prescriptions */}
                    <div className="flex items-center gap-4 sm:text-right w-full sm:w-auto justify-end sm:justify-start border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0 shrink-0">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center sm:items-end">
                          <span className="font-heading font-extrabold text-white text-lg">{ex.sets}</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-wider">Sets</span>
                        </div>
                        <div className="flex flex-col items-center sm:items-end">
                          <span className="font-heading font-extrabold text-white text-lg">{ex.reps}</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-wider">Reps</span>
                        </div>
                        <div className="flex flex-col items-center sm:items-end">
                          <span className="font-heading font-extrabold text-white text-lg">{ex.rest}s</span>
                          <span className="text-[10px] text-text-muted uppercase tracking-wider">Rest</span>
                        </div>
                      </div>
                      <div className="pl-2 border-l border-white/5">
                        {getDifficultyBadge(ex.difficulty)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="glass-card rounded-2xl p-12 text-center shadow-xl space-y-4 animate-fade-in border border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 text-accent-purple border border-accent-purple/20 flex items-center justify-center text-3xl mx-auto shadow-inner">
                ⚡
              </div>
              <h3 className="font-heading font-bold text-xl text-white">Ready to Generate</h3>
              <p className="text-text-secondary text-sm max-w-sm mx-auto">
                Select your target muscle groups and other options on the left, then click Generate Workout to begin.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
