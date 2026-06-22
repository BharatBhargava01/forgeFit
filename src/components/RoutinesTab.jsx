import React, { useState, useEffect } from 'react';
import { Calendar, Save, RotateCcw, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { getSplitOptions, generateRoutine } from '@/lib/routine';
import { saveRoutine } from '@/lib/storage';

export default function RoutinesTab({ showToast, prefilledRoutine, clearPrefill }) {
  const [goal, setGoal] = useState('hypertrophy');
  const [splitType, setSplitType] = useState('push-pull-legs');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [splitList, setSplitList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [routineResult, setRoutineResult] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});

  useEffect(() => {
    if (prefilledRoutine) {
      setRoutineResult(prefilledRoutine);
      setGoal(prefilledRoutine.goal || 'hypertrophy');
      setSplitType(prefilledRoutine.splitType || 'push-pull-legs');
      setDaysPerWeek(prefilledRoutine.daysPerWeek || 4);
      if (clearPrefill) clearPrefill();
    }
  }, [prefilledRoutine]);

  useEffect(() => {
    const options = getSplitOptions();
    setSplitList(options);
    if (options.length > 0) {
      const defaultSplit = options.find(s => s.key === 'push-pull-legs') || options[0];
      setSplitType(defaultSplit.key);
      setDaysPerWeek(defaultSplit.dayOptions[0]);
    }
  }, []);

  const handleSplitChange = (key) => {
    setSplitType(key);
    const selected = splitList.find(s => s.key === key);
    if (selected) {
      setDaysPerWeek(selected.dayOptions[0]);
    }
  };

  const handleBuild = () => {
    setLoading(true);
    setRoutineResult(null);
    setExpandedDays({});

    setTimeout(() => {
      const res = generateRoutine({ goal, daysPerWeek, splitType });
      setRoutineResult(res);
      setLoading(false);
    }, 800);
  };

  const handleSave = async () => {
    if (!routineResult) return;
    const name = `${routineResult.splitName} (${routineResult.goal.toUpperCase()})`;
    try {
      await saveRoutine({ name, ...routineResult });
      showToast(`Routine "${name}" saved to library!`, 'success');
    } catch (err) {
      showToast('Failed to save routine', 'error');
    }
  };

  const toggleDayExpanded = (dayIdx) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayIdx]: !prev[dayIdx]
    }));
  };

  const currentSplit = splitList.find(s => s.key === splitType);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up">
      {/* Tab Header */}
      <div className="mb-8">
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
          Routine <span className="text-gradient">Builder</span>
        </h2>
        <p className="text-text-secondary mt-2">
          Create a full weekly training program structured around your fitness targets.
        </p>
      </div>

      {/* Control Panel */}
      <div className="glass-card rounded-2xl p-6 mb-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Goal Select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary" htmlFor="routine-goal">
              🎯 Training Goal
            </label>
            <select
              id="routine-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors cursor-pointer"
            >
              <option value="hypertrophy">Hypertrophy (Muscle Growth)</option>
              <option value="strength">Strength (Max Power)</option>
              <option value="endurance">Endurance (Stamina)</option>
            </select>
          </div>

          {/* Split Type Select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary" htmlFor="routine-split">
              📋 Split Type
            </label>
            <select
              id="routine-split"
              value={splitType}
              onChange={(e) => handleSplitChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors cursor-pointer"
            >
              {splitList.map(s => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Days Per Week Select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary" htmlFor="routine-days">
              📅 Days Per Week
            </label>
            <select
              id="routine-days"
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors cursor-pointer"
            >
              {currentSplit?.dayOptions.map(d => (
                <option key={d} value={d}>{d} Days</option>
              ))}
            </select>
          </div>
        </div>

        {/* Build Action */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleBuild}
            className="w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 font-bold text-white shadow-lg shadow-accent-purple/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calendar className="w-5 h-5" />
            Build My Routine
          </button>
        </div>
      </div>

      {/* Routine Presentation */}
      <div className="w-full">
        {loading ? (
          /* Skeleton Loading State */
          <div className="glass-card rounded-2xl p-6 space-y-6 shadow-xl animate-pulse">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <div className="h-6 w-48 bg-white/10 rounded"></div>
              <div className="h-8 w-32 bg-white/10 rounded-lg"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map(idx => (
                <div key={idx} className="h-28 w-full bg-white/5 rounded-xl border border-white/5"></div>
              ))}
            </div>
          </div>
        ) : routineResult ? (
          /* Generated Routine Result */
          <div className="space-y-6 animate-fade-in">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/5">
              <div>
                <h3 className="font-heading font-extrabold text-2xl text-white">
                  {routineResult.splitName} Split
                </h3>
                <p className="text-text-secondary text-sm mt-1">
                  Goal: <span className="text-white font-semibold capitalize">{routineResult.goal}</span> · {routineResult.daysPerWeek} training days
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-sm font-bold shadow-md hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Routine
                </button>
                <button
                  onClick={handleBuild}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
            </div>

            {/* Grid Calendar Layout */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {routineResult.week.map((day) => {
                const isExpanded = !!expandedDays[day.dayIndex];
                if (day.isRest) {
                  return (
                    <div
                      key={day.dayIndex}
                      className="glass-card rounded-xl p-4 flex flex-col items-center justify-center text-center opacity-40 border border-white/5 bg-white/1 min-h-[140px]"
                    >
                      <span className="text-2xl mb-1">😴</span>
                      <span className="text-xs text-text-muted font-bold tracking-wider uppercase mb-1">{day.dayName}</span>
                      <span className="text-sm font-semibold text-text-secondary">Rest Day</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={day.dayIndex}
                    className={`glass-card rounded-xl border transition-all duration-300 md:col-span-1 ${
                      isExpanded ? 'md:col-span-7 md:scale-[1.01]' : ''
                    } border-white/10 bg-white/3 overflow-hidden`}
                  >
                    {/* Day Header Trigger */}
                    <div
                      onClick={() => toggleDayExpanded(day.dayIndex)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-white/5 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs text-text-muted font-bold tracking-wider uppercase">{day.dayName}</span>
                        <span className="text-sm font-extrabold text-white mt-1">{day.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5 text-text-muted">
                          {day.exercises.length} ex
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Day Exercises List */}
                    {isExpanded && (
                      <div className="p-4 border-t border-white/5 bg-black/20 space-y-3 animate-fade-in">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {day.muscles.map(m => (
                            <span key={m} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                              {m}
                            </span>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {day.exercises.map((ex, exIdx) => (
                            <div key={ex.id || exIdx} className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/2 border border-white/5 text-xs text-text-secondary">
                              <div className="flex items-center gap-2">
                                <Dumbbell className="w-3.5 h-3.5 text-accent-indigo" />
                                <span className="font-bold text-white">{ex.name}</span>
                              </div>
                              <div className="flex items-center gap-4 font-heading font-bold text-white shrink-0">
                                <span>{ex.sets}s × {ex.reps}r</span>
                                <span className="text-[10px] text-text-muted font-normal bg-white/5 px-1.5 py-0.5 rounded">
                                  Rest {ex.rest}s
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p className="text-xs text-center text-text-muted mt-4">
              💡 Tip: Click any active day card to expand and view its full workout plan.
            </p>
          </div>
        ) : (
          /* Empty State */
          <div className="glass-card rounded-2xl p-12 text-center shadow-xl space-y-4 border border-white/5 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-accent-indigo/10 text-accent-indigo border border-accent-indigo/20 flex items-center justify-center text-3xl mx-auto shadow-inner">
              📋
            </div>
            <h3 className="font-heading font-bold text-xl text-white">Ready to Build</h3>
            <p className="text-text-secondary text-sm max-w-sm mx-auto">
              Choose your goal and weekly layout above, then click Build My Routine to generate your weekly schedule.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
