import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Save, RotateCcw, ChevronDown, ChevronUp, Dumbbell, Trash2, X, GripVertical, Plus, Search, Check, Play } from 'lucide-react';
import { getSplitOptions, generateRoutine } from '@/lib/routine';
import { saveRoutine } from '@/lib/storage';
import { getAllExercises, MUSCLE_GROUPS } from '@/lib/data';

const mapSplitToKey = (splitName) => {
  if (!splitName) return 'push-pull-legs';
  const name = splitName.toLowerCase();
  if (name.includes('push') || name.includes('pull') || name.includes('ppl') || name.includes('legs')) return 'push-pull-legs';
  if (name.includes('upper') || name.includes('lower')) return 'upper-lower';
  if (name.includes('full')) return 'full-body';
  if (name.includes('bro') || name.includes('body part') || name.includes('single')) return 'bro-split';
  if (name.includes('arnold')) return 'arnold';
  return 'push-pull-legs';
};

export default function RoutinesTab({ showToast, prefilledRoutine, clearPrefill, user, onSignInClick, onStartWorkout, onSendToGenerator }) {
  const [goal, setGoal] = useState('hypertrophy');
  const [splitType, setSplitType] = useState('push-pull-legs');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [splitList, setSplitList] = useState([]);
  const [useAI, setUseAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routineResult, setRoutineResult] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [agentProgress, setAgentProgress] = useState(null);

  // Edit, delete, swap states for routines
  const [swapDayIndex, setSwapDayIndex] = useState(null);
  const [swapExIdx, setSwapExIdx] = useState(null);
  const [swapSearch, setSwapSearch] = useState('');

  // Drag and drop state for routine days
  const [draggedDayIndex, setDraggedDayIndex] = useState(null);

  // Drag and drop state for exercises
  const [draggedExDayIndex, setDraggedExDayIndex] = useState(null);
  const [draggedExIndex, setDraggedExIndex] = useState(null);

  // Add exercise states
  const [addExerciseDayIndex, setAddExerciseDayIndex] = useState(null);
  const [addSearch, setAddSearch] = useState('');
  const [addFilter, setAddFilter] = useState('All');
  const [addSelectedIds, setAddSelectedIds] = useState([]);

  const handleUpdateRoutineExerciseField = (dayIndex, exIdx, field, value) => {
    setRoutineResult(prev => {
      const updatedWeek = prev.week.map(day => {
        if (day.dayIndex === dayIndex) {
          const updatedExercises = day.exercises.map((ex, i) => 
            i === exIdx ? { ...ex, [field]: value } : ex
          );
          return { ...day, exercises: updatedExercises };
        }
        return day;
      });
      return { ...prev, week: updatedWeek };
    });
  };

  const handleDeleteRoutineExercise = (dayIndex, exIdx) => {
    if (!confirm('Are you sure you want to remove this exercise from this routine day?')) return;
    setRoutineResult(prev => {
      const updatedWeek = prev.week.map(day => {
        if (day.dayIndex === dayIndex) {
          return {
            ...day,
            exercises: day.exercises.filter((_, i) => i !== exIdx)
          };
        }
        return day;
      });
      return { ...prev, week: updatedWeek };
    });
  };

  const handleSwapRoutineExercise = (dayIndex, exIdx, newExercise) => {
    setRoutineResult(prev => {
      const updatedWeek = prev.week.map(day => {
        if (day.dayIndex === dayIndex) {
          const updatedExercises = [...day.exercises];
          const oldEx = updatedExercises[exIdx];
          updatedExercises[exIdx] = {
            ...newExercise,
            sets: oldEx.sets || 3,
            reps: oldEx.reps || 10,
            rest: oldEx.rest || 60,
          };
          return { ...day, exercises: updatedExercises };
        }
        return day;
      });
      return { ...prev, week: updatedWeek };
    });
    setSwapDayIndex(null);
    setSwapExIdx(null);
    setSwapSearch('');
    showToast(`Swapped for ${newExercise.name}! 🔄`, 'success');
  };

  const swapAlternatives = useMemo(() => {
    if (swapDayIndex === null || swapExIdx === null || !routineResult) return [];
    const day = routineResult.week.find(d => d.dayIndex === swapDayIndex);
    if (!day) return [];
    const exToSwap = day.exercises[swapExIdx];
    if (!exToSwap) return [];
    const allEx = getAllExercises();
    return allEx.filter(e => {
      const sharesMuscle = e.muscles.some(m => exToSwap.muscles.includes(m));
      const isDifferent = e.id !== exToSwap.id && e.name !== exToSwap.name;
      const matchesSearch = swapSearch 
        ? e.name.toLowerCase().includes(swapSearch.toLowerCase()) || 
          e.muscles.some(m => m.toLowerCase().includes(swapSearch.toLowerCase()))
        : true;
      return sharesMuscle && isDifferent && matchesSearch;
    });
  }, [swapDayIndex, swapExIdx, routineResult, swapSearch]);

  const handleDayDragStart = (e, index) => {
    setDraggedDayIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDayDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDayDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedDayIndex === null || draggedDayIndex === targetIndex) return;

    setRoutineResult(prev => {
      const updatedWeek = [...prev.week];
      const [draggedDay] = updatedWeek.splice(draggedDayIndex, 1);
      updatedWeek.splice(targetIndex, 0, draggedDay);

      // Re-map dayIndex and dayName sequentially so Day 1 through Day 7 labels stay correct
      const remappedWeek = updatedWeek.map((day, idx) => ({
        ...day,
        dayIndex: idx,
        dayName: `Day ${idx + 1}`
      }));

      return {
        ...prev,
        week: remappedWeek
      };
    });
    setDraggedDayIndex(null);
  };

  const handleExDragStart = (e, dayIndex, exIdx) => {
    e.stopPropagation();
    setDraggedExDayIndex(dayIndex);
    setDraggedExIndex(exIdx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ dayIndex, exIdx }));
  };

  const handleExDragOver = (e) => {
    e.preventDefault();
  };

  const handleExDrop = (e, targetDayIndex, targetExIdx) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedExDayIndex === null || draggedExIndex === null) return;

    setRoutineResult(prev => {
      const sourceDay = prev.week.find(d => d.dayIndex === draggedExDayIndex);
      if (!sourceDay) return prev;
      const draggedItem = sourceDay.exercises[draggedExIndex];
      if (!draggedItem) return prev;

      const updatedWeek = prev.week.map(day => {
        if (day.dayIndex === draggedExDayIndex && draggedExDayIndex === targetDayIndex) {
          const updatedExercises = [...day.exercises];
          const [removed] = updatedExercises.splice(draggedExIndex, 1);
          updatedExercises.splice(targetExIdx, 0, removed);
          return { ...day, exercises: updatedExercises };
        } else if (day.dayIndex === draggedExDayIndex) {
          const updatedExercises = day.exercises.filter((_, i) => i !== draggedExIndex);
          return { ...day, exercises: updatedExercises };
        } else if (day.dayIndex === targetDayIndex) {
          const updatedExercises = [...day.exercises];
          updatedExercises.splice(targetExIdx, 0, draggedItem);
          return { ...day, exercises: updatedExercises };
        }
        return day;
      });
      return { ...prev, week: updatedWeek };
    });

    setDraggedExDayIndex(null);
    setDraggedExIndex(null);
  };

  const handleExDragEnd = () => {
    setDraggedExDayIndex(null);
    setDraggedExIndex(null);
  };

  const allAvailableExercises = useMemo(() => {
    return getAllExercises();
  }, [addExerciseDayIndex]);

  const filteredAddExercises = useMemo(() => {
    return allAvailableExercises.filter(ex => {
      const matchSearch = addSearch.trim() === '' || 
        ex.name.toLowerCase().includes(addSearch.toLowerCase()) ||
        (ex.description && ex.description.toLowerCase().includes(addSearch.toLowerCase()));
      
      const matchFilter = addFilter === 'All' || ex.muscles.includes(addFilter);
      return matchSearch && matchFilter;
    });
  }, [allAvailableExercises, addSearch, addFilter]);

  const toggleAddSelection = (exId) => {
    setAddSelectedIds(prev =>
      prev.includes(exId) ? prev.filter(id => id !== exId) : [...prev, exId]
    );
  };

  const handleConfirmAddSelection = () => {
    if (addExerciseDayIndex === null) return;
    const selectedExercises = allAvailableExercises.filter(ex => addSelectedIds.includes(ex.id));
    if (selectedExercises.length === 0) return;

    setRoutineResult(prev => {
      const updatedWeek = prev.week.map(day => {
        if (day.dayIndex === addExerciseDayIndex) {
          const updatedExercises = [...day.exercises];
          selectedExercises.forEach(ex => {
            const isComp = ex.type === 'compound';
            updatedExercises.push({
              ...ex,
              sets: isComp ? 4 : 3,
              reps: isComp ? 8 : 12,
              rest: isComp ? 90 : 60
            });
          });
          return { ...day, exercises: updatedExercises };
        }
        return day;
      });
      return { ...prev, week: updatedWeek };
    });

    const dayName = routineResult.week.find(d => d.dayIndex === addExerciseDayIndex)?.dayName || 'day';
    showToast(`Added ${selectedExercises.length} exercise${selectedExercises.length > 1 ? 's' : ''} to ${dayName}! 💪`, 'success');
    
    setAddExerciseDayIndex(null);
    setAddSearch('');
    setAddSelectedIds([]);
  };

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
    }
  }, []);

  useEffect(() => {
    if (user && user.profile) {
      const p = user.profile;
      if (p.goal) setGoal(p.goal);
      if (p.frequency) setDaysPerWeek(p.frequency);
      if (p.ai_program_summary && p.ai_program_summary.recommendedSplit) {
        setSplitType(mapSplitToKey(p.ai_program_summary.recommendedSplit));
      }
    }
  }, [user]);

  useEffect(() => {
    if (addExerciseDayIndex !== null || swapDayIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [addExerciseDayIndex, swapDayIndex]);

  const handleSplitChange = (key) => {
    setSplitType(key);
  };

  const handleBuild = async () => {
    setLoading(true);
    setRoutineResult(null);
    setExpandedDays({});

    if (useAI) {
      setAgentProgress({
        planner: 'running',
        selector: 'pending',
        optimizer: 'pending',
        reviewer: 'pending',
        currentMessage: 'Agent 1: Planner is structuring weekly calendar splits...'
      });

      try {
        const res = await fetch('/api/routines/multi-agent-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, splitType, daysPerWeek, profile: user?.profile || null })
        });
        if (!res.ok) throw new Error(`Status: ${res.status}`);

        // Handle non-streaming JSON fallback response (rule-based generation from server)
        const contentType = res.headers.get('Content-Type') || '';
        if (contentType.includes('application/json')) {
          const jsonRes = await res.json();
          if (jsonRes.fallback && jsonRes.data) {
            setRoutineResult(jsonRes.data);
            showToast('Generated with rule-based engine (AI unavailable).', 'info');
            setLoading(false);
            setAgentProgress(null);
            return;
          }
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep the last incomplete line

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line);
              
              if (event.status === 'planner_done') {
                setAgentProgress(prev => ({
                  ...prev,
                  planner: 'done',
                  selector: 'running',
                  currentMessage: event.message
                }));
              } else if (event.status === 'selector_done') {
                setAgentProgress(prev => ({
                  ...prev,
                  selector: 'done',
                  optimizer: 'running',
                  currentMessage: event.message
                }));
              } else if (event.status === 'optimizer_done') {
                setAgentProgress(prev => ({
                  ...prev,
                  optimizer: 'done',
                  reviewer: 'running',
                  currentMessage: event.message
                }));
              } else if (event.status === 'reviewer_done') {
                setAgentProgress(prev => ({
                  ...prev,
                  reviewer: 'done',
                  currentMessage: event.message
                }));
              } else if (event.status === 'completed') {
                setRoutineResult(event.data);
                showToast('AI weekly routine generated successfully! 🚀', 'success');
              } else if (event.status === 'error') {
                throw new Error(event.message);
              }
            } catch (jsonErr) {
              console.warn("Error parsing chunk:", jsonErr);
            }
          }
        }
      } catch (err) {
        console.warn('AI routine generation failed, falling back to rule-based engine:', err);
        showToast('AI generation failed. Falling back to rule-based engine.', 'warning');
        const fallback = generateRoutine({ goal, daysPerWeek, splitType, profile: user?.profile || null });
        setRoutineResult(fallback);
      } finally {
        setLoading(false);
        setAgentProgress(null);
      }
    } else {
      setTimeout(() => {
        const res = generateRoutine({ goal, daysPerWeek, splitType, profile: user?.profile || null });
        setRoutineResult(res);
        setLoading(false);
      }, 800);
    }
  };

  const handleSave = async () => {
    if (!user) {
      showToast('Please sign in to save your routines! 📋', 'info');
      if (onSignInClick) onSignInClick();
      return;
    }
    if (!routineResult) return;
    const name = `${routineResult.splitName} (${routineResult.goal.toUpperCase()})`;
    try {
      await saveRoutine({ name, ...routineResult });
      showToast(`Routine "${name}" saved to library!`, 'success');
    } catch (err) {
      showToast('Failed to save routine', 'error');
    }
  };

  const handleStartWorkoutDay = (day) => {
    if (!onStartWorkout) return;
    const workoutObj = {
      id: `routine-day-${day.dayIndex}-${Date.now()}`,
      name: `${routineResult.splitName} - ${day.label}`,
      description: `Training day focusing on ${day.muscles.join(', ')}`,
      muscles: day.muscles,
      difficulty: 2,
      duration: day.exercises.length * 10,
      goal: routineResult.goal,
      exercises: day.exercises.map((ex, idx) => ({
        id: ex.id || `ex-${idx}-${Date.now()}`,
        name: ex.name,
        muscles: ex.muscles,
        equipment: ex.equipment,
        difficulty: ex.difficulty || 2,
        type: ex.type || 'compound',
        description: ex.description || '',
        sets: ex.sets || 3,
        reps: ex.reps || 10,
        rest: ex.rest || 60
      })),
      totalExercises: day.exercises.length,
      estimatedMinutes: day.exercises.length * 10
    };
    onStartWorkout(workoutObj);
  };

  const handleSendToGeneratorDay = (day) => {
    if (!onSendToGenerator) return;
    const workoutObj = {
      name: `${routineResult.splitName} - ${day.label}`,
      description: `Tweak and customize your ${day.label} session.`,
      muscles: day.muscles,
      difficulty: 2,
      duration: day.exercises.length * 10,
      goal: routineResult.goal,
      exercises: day.exercises.map((ex, idx) => ({
        id: ex.id || `ex-${idx}-${Date.now()}`,
        name: ex.name,
        muscles: ex.muscles,
        equipment: ex.equipment,
        difficulty: ex.difficulty || 2,
        type: ex.type || 'compound',
        description: ex.description || '',
        sets: ex.sets || 3,
        reps: ex.reps || 10,
        rest: ex.rest || 60
      })),
      totalExercises: day.exercises.length,
      estimatedMinutes: day.exercises.length * 10
    };
    onSendToGenerator(workoutObj);
  };

  const toggleDayExpanded = (dayIdx) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayIdx]: !prev[dayIdx]
    }));
  };

  const currentSplit = splitList.find(s => s.key === splitType);

  return (
    <>

      {/* AI Recommendation Notice */}
      {user?.profile?.ai_program_summary && (
        <div className="mb-6 p-4 rounded-xl border border-accent-purple/20 bg-accent-purple/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl shrink-0">👑</span>
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-white">AI Coach Recommendation Active:</span> Your profile recommends a <span className="text-accent-cyan font-bold">{user.profile.ai_program_summary.recommendedSplit}</span> routine split at <span className="text-accent-purple font-bold">{user.profile.frequency || 4} days/week</span>.
            </div>
          </div>
          <button
            onClick={() => {
              if (user.profile.goal) setGoal(user.profile.goal);
              if (user.profile.frequency) setDaysPerWeek(user.profile.frequency);
              if (user.profile.ai_program_summary.recommendedSplit) {
                setSplitType(mapSplitToKey(user.profile.ai_program_summary.recommendedSplit));
              }
              showToast('Parameters synced with your AI Coach Blueprint! ⚡', 'success');
            }}
            className="px-3 py-1.5 rounded-lg bg-accent-purple/10 border border-accent-purple/20 hover:bg-accent-purple/20 text-accent-purple text-xs font-bold shrink-0 transition-all cursor-pointer"
          >
            Apply Blueprint
          </button>
        </div>
      )}

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
              <option value="hypertrophy" className="bg-[#12121a] text-white">Hypertrophy (Muscle Growth)</option>
              <option value="strength" className="bg-[#12121a] text-white">Strength (Max Power)</option>
              <option value="endurance" className="bg-[#12121a] text-white">Endurance (Stamina)</option>
              <option value="fat-loss" className="bg-[#12121a] text-white">Fat Loss (Definition)</option>
              <option value="powerlifting" className="bg-[#12121a] text-white">Powerlifting (Max Strength)</option>
              <option value="cardio-conditioning" className="bg-[#12121a] text-white">Cardio / Conditioning</option>
              <option value="mobility-flexibility" className="bg-[#12121a] text-white">Mobility / Flexibility</option>
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
                <option key={s.key} value={s.key} className="bg-[#12121a] text-white">{s.name}</option>
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
              className="w-full px-4 py-2.5 rounded-xl bg-[#12121a] border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <option key={d} value={d} className="bg-[#12121a] text-white">{d} {d === 1 ? 'Day' : 'Days'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* AI Toggle */}
        <div className="flex items-center justify-between py-4 mt-6 border-t border-white/5">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              Use AI Generator 🧠
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-accent-purple/10 text-accent-purple border border-accent-purple/20 tracking-wider">
                Gemini AI
              </span>
            </span>
            <span className="text-xs text-text-secondary">Generates a custom weekly routine with Gemini</span>
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

        {/* Build Action */}
        <div className="mt-4 flex justify-end">
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
        {loading && agentProgress ? (
          /* Multi-Agent Live Stepper Loading State */
          <div className="glass-card rounded-2xl p-6 space-y-6 bg-[#0c0c12] shadow-xl border border-accent-purple/20 animate-slide-up text-white">
            <div className="text-center pb-4 border-b border-white/5">
              <div className="inline-flex p-3 rounded-full bg-accent-purple/10 border border-accent-purple/20 mb-3 text-accent-purple animate-pulse">
                <Dumbbell className="w-8 h-8" />
              </div>
              <h4 className="font-heading font-extrabold text-xl text-white">Running Multi-Agent AI Routine Pipeline</h4>
              <p className="text-xs text-text-secondary mt-1">Four collaborative agents are creating and auditing your weekly workout program.</p>
            </div>

            {/* Stepper */}
            <div className="space-y-6 py-2 text-left max-w-md mx-auto">
              {/* Step 1: Planner */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    agentProgress.planner === 'done' ? 'bg-accent-emerald border-accent-emerald text-black' :
                    agentProgress.planner === 'running' ? 'bg-accent-purple border-accent-purple text-white animate-pulse' :
                    'bg-white/5 border-white/10 text-text-muted'
                  }`}>
                    {agentProgress.planner === 'done' ? <Check className="w-4 h-4 text-black stroke-[3px]" /> : '1'}
                  </div>
                  <div className="w-0.5 h-10 bg-white/10 my-1"></div>
                </div>
                <div>
                  <h5 className={`font-bold text-sm ${agentProgress.planner === 'running' ? 'text-accent-purple' : agentProgress.planner === 'done' ? 'text-white' : 'text-text-muted'}`}>
                    Agent 1: Week Strategist (Planner)
                  </h5>
                  <p className="text-xs text-text-secondary mt-0.5">Designs split structures, training schedules, and recovery distribution.</p>
                </div>
              </div>

              {/* Step 2: Selector */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    agentProgress.selector === 'done' ? 'bg-accent-emerald border-accent-emerald text-black' :
                    agentProgress.selector === 'running' ? 'bg-accent-purple border-accent-purple text-white animate-pulse' :
                    'bg-white/5 border-white/10 text-text-muted'
                  }`}>
                    {agentProgress.selector === 'done' ? <Check className="w-4 h-4 text-black stroke-[3px]" /> : '2'}
                  </div>
                  <div className="w-0.5 h-10 bg-white/10 my-1"></div>
                </div>
                <div>
                  <h5 className={`font-bold text-sm ${agentProgress.selector === 'running' ? 'text-accent-purple' : agentProgress.selector === 'done' ? 'text-white' : 'text-text-muted'}`}>
                    Agent 2: Exercise Selector
                  </h5>
                  <p className="text-xs text-text-secondary mt-0.5">Queries and grounds exercise sets from target muscles database.</p>
                </div>
              </div>

              {/* Step 3: Optimizer */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    agentProgress.optimizer === 'done' ? 'bg-accent-emerald border-accent-emerald text-black' :
                    agentProgress.optimizer === 'running' ? 'bg-accent-purple border-accent-purple text-white animate-pulse' :
                    'bg-white/5 border-white/10 text-text-muted'
                  }`}>
                    {agentProgress.optimizer === 'done' ? <Check className="w-4 h-4 text-black stroke-[3px]" /> : '3'}
                  </div>
                  <div className="w-0.5 h-10 bg-white/10 my-1"></div>
                </div>
                <div>
                  <h5 className={`font-bold text-sm ${agentProgress.optimizer === 'running' ? 'text-accent-purple' : agentProgress.optimizer === 'done' ? 'text-white' : 'text-text-muted'}`}>
                    Agent 3: Intensity & Recovery Optimizer
                  </h5>
                  <p className="text-xs text-text-secondary mt-0.5">Calculates training volume, sets, reps, and custom coaching tips.</p>
                </div>
              </div>

              {/* Step 4: Reviewer */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    agentProgress.reviewer === 'done' ? 'bg-accent-emerald border-accent-emerald text-black' :
                    agentProgress.reviewer === 'running' ? 'bg-accent-purple border-accent-purple text-white animate-pulse' :
                    'bg-white/5 border-white/10 text-text-muted'
                  }`}>
                    {agentProgress.reviewer === 'done' ? <Check className="w-4 h-4 text-black stroke-[3px]" /> : '4'}
                  </div>
                </div>
                <div>
                  <h5 className={`font-bold text-sm ${agentProgress.reviewer === 'running' ? 'text-accent-purple' : agentProgress.reviewer === 'done' ? 'text-white' : 'text-text-muted'}`}>
                    Agent 4: Safety Auditor (Reviewer)
                  </h5>
                  <p className="text-xs text-text-secondary mt-0.5">Cross-checks joint injury boundaries and flags safety alerts.</p>
                </div>
              </div>
            </div>

            {/* Status Message */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-text-secondary font-medium">
              <span className="text-accent-purple font-bold">Status:</span> {agentProgress.currentMessage}
            </div>
          </div>
        ) : loading ? (
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
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-[#ededed] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
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
                      draggable
                      onDragStart={(e) => handleDayDragStart(e, day.dayIndex)}
                      onDragOver={(e) => handleDayDragOver(e, day.dayIndex)}
                      onDrop={(e) => handleDayDrop(e, day.dayIndex)}
                      className={`glass-card rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 border bg-white/1 min-h-[140px] cursor-move relative ${
                        draggedDayIndex === day.dayIndex
                          ? 'opacity-30 border-dashed border-accent-purple bg-accent-purple/5'
                          : 'border-white/5 opacity-40 hover:opacity-60'
                      }`}
                    >
                      <div className="absolute top-2 right-2">
                        <GripVertical className="w-3.5 h-3.5 text-text-muted hover:text-white transition-colors cursor-grab active:cursor-grabbing" />
                      </div>
                      <span className="text-2xl mb-1">😴</span>
                      <span className="text-xs text-text-muted font-bold tracking-wider uppercase mb-1">{day.dayName}</span>
                      <span className="text-sm font-semibold text-text-secondary">Rest Day</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={day.dayIndex}
                    draggable
                    onDragStart={(e) => {
                      if (e.target.closest('input') || e.target.closest('button') || e.target.closest('select') || e.target.closest('.no-drag')) {
                        e.preventDefault();
                        return;
                      }
                      handleDayDragStart(e, day.dayIndex);
                    }}
                    onDragOver={(e) => handleDayDragOver(e, day.dayIndex)}
                    onDrop={(e) => handleDayDrop(e, day.dayIndex)}
                    className={`glass-card rounded-xl border transition-all duration-300 md:col-span-1 ${
                      isExpanded ? 'md:col-span-7 md:scale-[1.01]' : ''
                    } cursor-move ${
                      draggedDayIndex === day.dayIndex
                        ? 'opacity-40 border-dashed border-accent-purple bg-accent-purple/5'
                        : 'border-white/10'
                    } bg-white/3 overflow-hidden`}
                  >
                    {/* Day Header Trigger */}
                    <div
                      onClick={() => toggleDayExpanded(day.dayIndex)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-text-muted hover:text-white transition-colors cursor-grab active:cursor-grabbing shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-xs text-text-muted font-bold tracking-wider uppercase">{day.dayName}</span>
                          <span className="text-sm font-extrabold text-white mt-1">{day.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5 text-text-muted">
                          {day.exercises?.length || 0} ex
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Day Exercises List */}
                    {isExpanded && (
                      <div className="p-4 border-t border-white/5 bg-black/20 space-y-3 animate-fade-in no-drag">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {day.muscles.map(m => (
                            <span key={m} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                              {m}
                            </span>
                          ))}
                        </div>
                        <div
                          onDragOver={handleExDragOver}
                          onDrop={(e) => {
                            if (e.target === e.currentTarget) {
                              handleExDrop(e, day.dayIndex, day.exercises?.length || 0);
                            }
                          }}
                          className="space-y-2 min-h-[30px]"
                        >
                          {day.exercises?.map((ex, exIdx) => (
                            <div
                              key={ex.id || exIdx}
                              draggable
                              onDragStart={(e) => {
                                if (e.target.closest('input') || e.target.closest('button') || e.target.closest('select')) {
                                  e.preventDefault();
                                  return;
                                }
                                handleExDragStart(e, day.dayIndex, exIdx);
                              }}
                              onDragOver={handleExDragOver}
                              onDrop={(e) => handleExDrop(e, day.dayIndex, exIdx)}
                              onDragEnd={handleExDragEnd}
                              className={`flex flex-col sm:flex-row justify-between sm:items-center py-2.5 px-3 rounded-lg bg-white/2 border text-xs text-text-secondary gap-3 transition-all cursor-move ${
                                draggedExDayIndex === day.dayIndex && draggedExIndex === exIdx
                                  ? 'opacity-40 border-dashed border-accent-purple bg-accent-purple/5'
                                  : 'border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-3.5 h-3.5 text-text-muted hover:text-white transition-colors cursor-grab active:cursor-grabbing shrink-0" />
                                <Dumbbell className="w-3.5 h-3.5 text-accent-indigo shrink-0" />
                                <span className="font-bold text-white text-left">{ex.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                                {/* Inputs for sets, reps, rest */}
                                <div className="flex gap-2 items-center">
                                  <div className="flex items-center gap-0.5">
                                    <input
                                      type="number"
                                      min="1"
                                      value={ex.sets}
                                      onChange={(e) => handleUpdateRoutineExerciseField(day.dayIndex, exIdx, 'sets', parseInt(e.target.value) || 1)}
                                      className="w-8 text-center bg-black/40 border border-white/10 rounded py-0.5 text-[11px] text-white font-bold"
                                      title="Sets"
                                    />
                                    <span className="text-[9px] text-text-muted">s</span>
                                  </div>

                                  <div className="flex items-center gap-0.5 border-l border-white/5 pl-2">
                                    <input
                                      type="number"
                                      min="1"
                                      value={ex.reps}
                                      onChange={(e) => handleUpdateRoutineExerciseField(day.dayIndex, exIdx, 'reps', parseInt(e.target.value) || 1)}
                                      className="w-8 text-center bg-black/40 border border-white/10 rounded py-0.5 text-[11px] text-white font-bold"
                                      title="Reps"
                                    />
                                    <span className="text-[9px] text-text-muted">r</span>
                                  </div>

                                  <div className="flex items-center gap-0.5 border-l border-white/5 pl-2">
                                    <input
                                      type="number"
                                      min="10"
                                      step="5"
                                      value={ex.rest}
                                      onChange={(e) => handleUpdateRoutineExerciseField(day.dayIndex, exIdx, 'rest', parseInt(e.target.value) || 30)}
                                      className="w-10 text-center bg-black/40 border border-white/10 rounded py-0.5 text-[11px] text-white font-bold"
                                      title="Rest (seconds)"
                                    />
                                    <span className="text-[9px] text-text-muted">s</span>
                                  </div>
                                </div>

                                {/* Swap and delete buttons */}
                                <div className="flex items-center gap-1 border-l border-white/5 pl-2">
                                  <button
                                    onClick={() => { setSwapDayIndex(day.dayIndex); setSwapExIdx(exIdx); }}
                                    className="p-1 rounded hover:bg-accent-indigo/10 text-text-secondary hover:text-accent-indigo cursor-pointer"
                                    title="Swap Exercise"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRoutineExercise(day.dayIndex, exIdx)}
                                    className="p-1 rounded hover:bg-accent-rose/10 text-text-secondary hover:text-accent-rose cursor-pointer"
                                    title="Delete Exercise"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons Group */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5 mt-4">
                          <button
                            onClick={() => {
                              setAddExerciseDayIndex(day.dayIndex);
                              setAddSelectedIds([]);
                            }}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                          >
                            <Plus className="w-4 h-4" />
                            Add Exercise
                          </button>
                          
                          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleSendToGeneratorDay(day)}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-accent-purple/10 border border-accent-purple/20 hover:bg-accent-purple/20 text-accent-purple text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                            >
                              <Dumbbell className="w-4 h-4" />
                              Tweak in Generator
                            </button>
                            <button
                              onClick={() => handleStartWorkoutDay(day)}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-accent-emerald/20 border border-accent-emerald/30 hover:bg-accent-emerald/30 text-accent-emerald text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] shadow-lg shadow-accent-emerald/10"
                            >
                              <Play className="w-4 h-4 fill-accent-emerald" />
                              Start Workout
                            </button>
                          </div>
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

      {/* ROUTINE SWAP ALTERNATIVES MODAL */}
      {swapDayIndex !== null && swapExIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg glass-card border border-white/10 bg-[#12121a] rounded-2xl p-6 shadow-2xl space-y-4 animate-slide-up flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div>
                <h4 className="font-heading font-extrabold text-lg text-white">Swap Routine Exercise</h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Select an alternative exercise targeting {routineResult.week.find(d => d.dayIndex === swapDayIndex)?.exercises[swapExIdx]?.muscles.join(', ')}
                </p>
              </div>
              <button
                onClick={() => { setSwapDayIndex(null); setSwapExIdx(null); setSwapSearch(''); }}
                className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Box */}
            <input
              type="text"
              placeholder="Search alternative exercises..."
              value={swapSearch}
              onChange={(e) => setSwapSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors text-sm"
            />

            {/* Alternatives List */}
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {swapAlternatives.length > 0 ? (
                swapAlternatives.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => handleSwapRoutineExercise(swapDayIndex, swapExIdx, alt)}
                    className="p-3 rounded-xl bg-white/2 border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all cursor-pointer flex justify-between items-center gap-4 group text-left"
                  >
                    <div>
                      <span className="font-bold text-white text-sm block group-hover:text-accent-cyan transition-colors">
                        {alt.name}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {alt.muscles.map(m => (
                          <span key={m} className="px-1 py-0.2 rounded bg-white/5 text-[9px] text-text-secondary border border-white/5">
                            {m}
                          </span>
                        ))}
                        <span className="text-[9px] text-text-muted">· {alt.equipment} · {alt.type}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-accent-indigo opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider shrink-0">
                      Swap 🔄
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-text-muted">
                  No alternative exercises found.
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      {/* ADD EXERCISE TO ROUTINE DAY MODAL */}
      {addExerciseDayIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-bg-card border border-white/10 bg-gradient-to-b from-[#12121a] to-[#0a0a0f] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center shrink-0">
              <div>
                <h4 className="font-heading font-extrabold text-lg text-white">
                  Add Exercises to {routineResult?.week.find(d => d.dayIndex === addExerciseDayIndex)?.dayName} ({routineResult?.week.find(d => d.dayIndex === addExerciseDayIndex)?.label})
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">Select the exercises you'd like to append to this training day.</p>
              </div>
              <button
                onClick={() => { setAddExerciseDayIndex(null); setAddSearch(''); setAddSelectedIds([]); }}
                className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors cursor-pointer border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search and Filters */}
            <div className="p-4 bg-black/20 border-b border-white/5 space-y-3 shrink-0">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-accent-purple"
                />
              </div>

              {/* Muscle Filter chips */}
              <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1 custom-scrollbar">
                {['All', ...MUSCLE_GROUPS].map(muscle => {
                  const active = addFilter === muscle;
                  return (
                    <button
                      key={muscle}
                      onClick={() => setAddFilter(muscle)}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all shrink-0 cursor-pointer ${
                        active
                          ? 'bg-accent-purple/20 border-accent-purple text-white border'
                          : 'bg-white/5 border-white/5 border text-text-secondary hover:text-white'
                      }`}
                    >
                      {muscle}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Exercises List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filteredAddExercises.length > 0 ? (
                filteredAddExercises.map(ex => {
                  const selected = addSelectedIds.includes(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => toggleAddSelection(ex.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        selected
                          ? 'bg-accent-indigo/10 border-accent-indigo'
                          : 'bg-white/2 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="space-y-1 text-left">
                        <span className="font-bold text-white text-sm block">{ex.name}</span>
                        <div className="flex flex-wrap gap-1">
                          {ex.muscles.map(m => (
                            <span key={m} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-text-secondary border border-white/5">
                              {m}
                            </span>
                          ))}
                          <span className="text-[9px] text-text-muted">· {ex.equipment} · {ex.type}</span>
                        </div>
                      </div>

                      {/* Check indicator */}
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        selected
                          ? 'bg-accent-indigo border-accent-indigo text-white'
                          : 'border-white/20'
                      }`}>
                        {selected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-text-muted">
                  No exercises match your search query.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center shrink-0">
              <span className="text-xs text-text-secondary">
                {addSelectedIds.length} exercises selected
              </span>
              <button
                onClick={handleConfirmAddSelection}
                disabled={addSelectedIds.length === 0}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold shadow flex items-center gap-1 cursor-pointer transition-all ${
                  addSelectedIds.length > 0
                    ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white hover:opacity-90'
                    : 'bg-white/5 text-text-muted border border-white/5 cursor-not-allowed'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Add Selected
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
}
