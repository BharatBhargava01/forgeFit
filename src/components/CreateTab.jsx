import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Dumbbell, Save, Search, Check, X, ShieldAlert } from 'lucide-react';
import { MUSCLE_GROUPS, EQUIPMENT, getAllExercises, filterExercises } from '@/lib/data';
import { saveCustomExercise, getCustomExercises, deleteCustomExercise, saveRoutine } from '@/lib/storage';

export default function CreateTab({ showToast, refreshCache }) {
  const [activeSubTab, setActiveSubTab] = useState('exercise'); // 'exercise' or 'routine'
  
  // Custom Exercise State
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseMuscles, setExerciseMuscles] = useState([]);
  const [exerciseEquipment, setExerciseEquipment] = useState('Bodyweight');
  const [exerciseDifficulty, setExerciseDifficulty] = useState(2);
  const [exerciseType, setExerciseType] = useState('compound');
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [customExercisesList, setCustomExercisesList] = useState([]);

  // Custom Routine State
  const [routineName, setRoutineName] = useState('');
  const [routineDays, setRoutineDays] = useState([]); // Array of { id, name, exercises: [] }
  
  // Exercise Picker Modal State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDayId, setPickerDayId] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerFilter, setPickerFilter] = useState('All');
  const [pickerSelectedIds, setPickerSelectedIds] = useState([]); // Temporary selection in modal

  // Fetch custom exercises on mount
  const fetchCustomExercises = async () => {
    try {
      const data = await getCustomExercises();
      setCustomExercisesList(data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchCustomExercises();
  }, []);

  // Filter exercises for the picker modal
  const allAvailableExercises = useMemo(() => {
    // Refresh built-in + cache
    return getAllExercises();
  }, [customExercisesList]); // re-evaluate when custom list changes

  const filteredPickerExercises = useMemo(() => {
    return allAvailableExercises.filter(ex => {
      const matchSearch = pickerSearch.trim() === '' || 
        ex.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        ex.description.toLowerCase().includes(pickerSearch.toLowerCase());
      
      const matchFilter = pickerFilter === 'All' || ex.muscles.includes(pickerFilter);
      return matchSearch && matchFilter;
    });
  }, [allAvailableExercises, pickerSearch, pickerFilter]);

  // Exercise Save Handler
  const handleSaveExercise = async (e) => {
    e.preventDefault();
    if (!exerciseName.trim()) {
      showToast('Exercise name is required', 'error');
      return;
    }
    if (exerciseMuscles.length === 0) {
      showToast('Please select at least one target muscle', 'error');
      return;
    }

    const newExercise = {
      name: exerciseName,
      muscles: exerciseMuscles,
      equipment: exerciseEquipment,
      difficulty: parseInt(exerciseDifficulty) || 2,
      type: exerciseType,
      description: exerciseDescription,
    };

    try {
      const saved = await saveCustomExercise(newExercise);
      showToast(`Custom exercise "${exerciseName}" saved!`, 'success');
      
      // Clear fields
      setExerciseName('');
      setExerciseMuscles([]);
      setExerciseEquipment('Bodyweight');
      setExerciseDifficulty(2);
      setExerciseType('compound');
      setExerciseDescription('');
      
      // Refresh local list & invoke cache update
      await fetchCustomExercises();
      if (refreshCache) refreshCache();
    } catch (err) {
      showToast('Failed to save custom exercise', 'error');
    }
  };

  const handleDeleteExercise = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteCustomExercise(id);
      showToast('Custom exercise deleted', 'info');
      await fetchCustomExercises();
      if (refreshCache) refreshCache();
    } catch (err) {
      showToast('Failed to delete exercise', 'error');
    }
  };

  const toggleFormMuscle = (muscle) => {
    setExerciseMuscles(prev =>
      prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]
    );
  };

  // Routine Builder Handlers
  const handleAddDay = () => {
    const dayId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setRoutineDays(prev => [
      ...prev,
      { id: dayId, name: `Day ${prev.length + 1}`, exercises: [] }
    ]);
  };

  const handleRemoveDay = (dayId) => {
    setRoutineDays(prev => prev.filter(d => d.id !== dayId));
  };

  const handleDayNameChange = (dayId, newName) => {
    setRoutineDays(prev => prev.map(d => d.id === dayId ? { ...d, name: newName } : d));
  };

  const handleRemoveExerciseFromDay = (dayId, exIdx) => {
    setRoutineDays(prev => prev.map(d => {
      if (d.id === dayId) {
        const updatedExs = [...d.exercises];
        updatedExs.splice(exIdx, 1);
        return { ...d, exercises: updatedExs };
      }
      return d;
    }));
  };

  // Picker Modal Open
  const handleOpenPicker = (dayId, existingExercises) => {
    setPickerDayId(dayId);
    setPickerSelectedIds(existingExercises.map(e => e.id));
    setPickerSearch('');
    setPickerFilter('All');
    setPickerOpen(true);
  };

  const handleConfirmPickerSelection = () => {
    const selectedExercises = allAvailableExercises.filter(ex => pickerSelectedIds.includes(ex.id));
    
    setRoutineDays(prev => prev.map(d => {
      if (d.id === pickerDayId) {
        // Map selected static data to default sets/reps prescriptions
        const formatted = selectedExercises.map(ex => {
          const isComp = ex.type === 'compound';
          return {
            ...ex,
            sets: isComp ? 4 : 3,
            reps: isComp ? 8 : 12,
            rest: isComp ? 90 : 60
          };
        });
        return { ...d, exercises: formatted };
      }
      return d;
    }));

    setPickerOpen(false);
    setPickerDayId(null);
  };

  const togglePickerSelection = (exId) => {
    setPickerSelectedIds(prev =>
      prev.includes(exId) ? prev.filter(id => id !== exId) : [...prev, exId]
    );
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      showToast('Routine name is required', 'error');
      return;
    }
    if (routineDays.length === 0) {
      showToast('Please add at least one day to the routine', 'error');
      return;
    }
    const emptyDay = routineDays.find(d => d.exercises.length === 0);
    if (emptyDay) {
      showToast(`Please add exercises to "${emptyDay.name}"`, 'error');
      return;
    }

    // Format week array exactly as generator expects
    const formattedWeek = routineDays.map((d, index) => {
      // Find all target muscles for this day
      const musclesSet = new Set();
      d.exercises.forEach(ex => ex.muscles.forEach(m => musclesSet.add(m)));
      
      return {
        dayIndex: index,
        dayName: `Day ${index + 1}`,
        isRest: false,
        label: d.name,
        muscles: Array.from(musclesSet),
        exercises: d.exercises
      };
    });

    // Fill in rest days to complete 7 days if less, to maintain calendar integrity
    while (formattedWeek.length < 7) {
      const index = formattedWeek.length;
      formattedWeek.push({
        dayIndex: index,
        dayName: `Day ${index + 1}`,
        isRest: true,
        label: 'Rest',
        muscles: [],
        exercises: []
      });
    }

    const payload = {
      name: routineName,
      goal: 'custom',
      daysPerWeek: routineDays.length,
      splitType: 'custom',
      splitName: 'Custom',
      week: formattedWeek
    };

    try {
      await saveRoutine(payload);
      showToast(`Custom routine "${routineName}" saved successfully!`, 'success');
      setRoutineName('');
      setRoutineDays([]);
    } catch (err) {
      showToast('Failed to save custom routine', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up relative">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
            Create <span className="text-gradient">Your Own</span>
          </h2>
          <p className="text-text-secondary mt-2">
            Build bespoke exercises or assemble custom training routines from scratch.
          </p>
        </div>
        
        {/* Toggle subtabs */}
        <div className="flex bg-white/5 border border-white/5 rounded-xl p-1 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('exercise')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeSubTab === 'exercise'
                ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            ➕ Custom Exercise
          </button>
          <button
            onClick={() => setActiveSubTab('routine')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeSubTab === 'routine'
                ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            🛠️ Custom Routine
          </button>
        </div>
      </div>

      {/* SUB-TAB: Custom Exercise */}
      {activeSubTab === 'exercise' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Add exercise Form */}
          <div className="lg:col-span-7 glass-card rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="font-heading font-bold text-xl text-white pb-3 border-b border-white/5">
              Add New Exercise
            </h3>
            
            <form onSubmit={handleSaveExercise} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider" htmlFor="ex-name">
                  Exercise Name *
                </label>
                <input
                  id="ex-name"
                  type="text"
                  required
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  placeholder="e.g. Incline Cable Flyes"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-accent-purple transition-all"
                />
              </div>

              {/* Muscles Multi-select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  Target Muscles *
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-1.5 rounded-lg bg-black/10">
                  {MUSCLE_GROUPS.filter(m => m !== 'Full Body').map(muscle => {
                    const active = exerciseMuscles.includes(muscle);
                    return (
                      <button
                        type="button"
                        key={muscle}
                        onClick={() => toggleFormMuscle(muscle)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-all ${
                          active
                            ? 'bg-accent-purple/20 border-accent-purple text-white font-bold'
                            : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/10 hover:text-white'
                        }`}
                      >
                        {muscle}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Equipment select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider" htmlFor="ex-eq">
                    Equipment
                  </label>
                  <select
                    id="ex-eq"
                    value={exerciseEquipment}
                    onChange={(e) => setExerciseEquipment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple cursor-pointer text-xs"
                  >
                    {EQUIPMENT.map(eq => (
                      <option key={eq} value={eq} className="bg-[#12121a] text-white">{eq}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider" htmlFor="ex-diff">
                    Difficulty
                  </label>
                  <select
                    id="ex-diff"
                    value={exerciseDifficulty}
                    onChange={(e) => setExerciseDifficulty(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple cursor-pointer text-xs"
                  >
                    <option value="1" className="bg-[#12121a] text-white">Easy (Beginner)</option>
                    <option value="2" className="bg-[#12121a] text-white">Medium (Intermediate)</option>
                    <option value="3" className="bg-[#12121a] text-white">Hard (Advanced)</option>
                  </select>
                </div>

                {/* Type select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider" htmlFor="ex-type">
                    Type
                  </label>
                  <select
                    id="ex-type"
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple cursor-pointer text-xs"
                  >
                    <option value="compound" className="bg-[#12121a] text-white">Compound</option>
                    <option value="isolation" className="bg-[#12121a] text-white">Isolation</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider" htmlFor="ex-desc">
                  Execution Description
                </label>
                <textarea
                  id="ex-desc"
                  rows="3"
                  value={exerciseDescription}
                  onChange={(e) => setExerciseDescription(e.target.value)}
                  placeholder="Describe form tips or correct execution steps..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-accent-purple transition-all"
                />
              </div>

              {/* Form submit */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 font-bold text-white shadow-md shadow-accent-purple/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Add Custom Exercise
              </button>
            </form>
          </div>

          {/* Custom Exercise List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between items-center pb-2">
              <h3 className="font-heading font-bold text-lg text-white">Your Custom Exercises</h3>
              <span className="text-xs bg-white/5 border border-white/5 px-2 py-0.5 rounded text-text-muted font-bold">
                {customExercisesList.length} created
              </span>
            </div>
            
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {customExercisesList.length > 0 ? (
                customExercisesList.map(ex => (
                  <div
                    key={ex.id}
                    className="glass-card rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <span className="font-bold text-white text-sm block">{ex.name}</span>
                      <div className="flex flex-wrap gap-1">
                        {ex.muscles.map(m => (
                          <span key={m} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-text-secondary border border-white/5">
                            {m}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-text-muted block">
                        {ex.equipment} · {ex.type}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteExercise(ex.id, ex.name)}
                      className="p-1.5 rounded-lg bg-white/5 text-text-muted hover:bg-accent-rose/10 hover:text-accent-rose transition-colors cursor-pointer border border-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="glass-card rounded-xl p-8 text-center border border-white/5 opacity-50 text-xs text-text-muted">
                  No custom exercises added yet. Fill the form to create one!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: Custom Routine Builder */}
      {activeSubTab === 'routine' && (
        <div className="space-y-6 animate-fade-in">
          {/* Routine Header form */}
          <div className="glass-card rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-end gap-6 border border-white/5">
            <div className="space-y-2 flex-1 w-full">
              <label className="text-sm font-semibold text-text-secondary" htmlFor="rt-name">
                📋 Custom Routine Name *
              </label>
              <input
                id="rt-name"
                type="text"
                required
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="e.g. My Arnold Split Split"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-accent-purple transition-all"
              />
            </div>
            <button
              onClick={handleAddDay}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-white font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Day
            </button>
          </div>

          {/* Days Grid */}
          {routineDays.length > 0 ? (
            <div className="space-y-4">
              {routineDays.map((day, idx) => (
                <div
                  key={day.id}
                  className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 relative"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-xs bg-white/5 border border-white/5 w-6 h-6 rounded-full flex items-center justify-center font-bold text-text-muted">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={day.name}
                        onChange={(e) => handleDayNameChange(day.id, e.target.value)}
                        className="bg-transparent border-b border-transparent focus:border-accent-purple font-heading font-bold text-lg text-white focus:outline-none pb-0.5"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenPicker(day.id, day.exercises)}
                        className="px-3 py-1.5 rounded-lg bg-accent-indigo/20 border border-accent-indigo hover:opacity-90 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Pick Exercises
                      </button>
                      <button
                        onClick={() => handleRemoveDay(day.id)}
                        className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-accent-rose/10 hover:text-accent-rose border border-white/5 cursor-pointer transition-colors"
                        title="Remove Day"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Added exercises list */}
                  {day.exercises.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {day.exercises.map((ex, exIdx) => (
                        <div
                          key={ex.id + '-' + exIdx}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5 text-xs text-text-secondary"
                        >
                          <div className="flex items-center gap-2">
                            <Dumbbell className="w-4 h-4 text-accent-indigo shrink-0" />
                            <span className="font-bold text-white">{ex.name}</span>
                          </div>
                          
                          {/* Sets/reps configuration */}
                          <div className="flex items-center gap-3 shrink-0">
                            {/* Inline sets / reps inputs */}
                            <div className="flex items-center gap-1 font-semibold">
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={ex.sets}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 3;
                                  setRoutineDays(prev => prev.map(d => d.id === day.id ? {
                                    ...d,
                                    exercises: d.exercises.map((x, xi) => xi === exIdx ? { ...x, sets: val } : x)
                                  } : d));
                                }}
                                className="w-9 text-center bg-white/5 border border-white/10 rounded py-0.5 text-white focus:outline-none focus:border-accent-purple"
                              />
                              <span className="text-[10px] text-text-muted font-normal">s</span>
                              <span className="text-text-muted">×</span>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={ex.reps}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 10;
                                  setRoutineDays(prev => prev.map(d => d.id === day.id ? {
                                    ...d,
                                    exercises: d.exercises.map((x, xi) => xi === exIdx ? { ...x, reps: val } : x)
                                  } : d));
                                }}
                                className="w-10 text-center bg-white/5 border border-white/10 rounded py-0.5 text-white focus:outline-none focus:border-accent-purple"
                              />
                              <span className="text-[10px] text-text-muted font-normal">r</span>
                            </div>
                            <button
                              onClick={() => handleRemoveExerciseFromDay(day.id, exIdx)}
                              className="p-1 rounded text-text-muted hover:text-accent-rose transition-colors cursor-pointer"
                              title="Delete exercise"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-black/10 text-xs text-text-muted">
                      No exercises added to this day. Click "Pick Exercises" to populate.
                    </div>
                  )}
                </div>
              ))}

              {/* Save Routine Action */}
              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleSaveRoutine}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan hover:opacity-90 font-bold text-white shadow-lg shadow-accent-purple/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-5 h-5" />
                  Save Custom Routine
                </button>
              </div>
            </div>
          ) : (
            /* Empty State Routine */
            <div className="glass-card rounded-2xl p-12 text-center border border-white/5 space-y-4">
              <span className="text-3xl block">🛠️</span>
              <span className="font-heading font-bold text-lg text-white block">Empty Routine Blueprint</span>
              <p className="text-text-secondary text-sm max-w-xs mx-auto">
                Name your routine above and add training days to start structuring your custom plan.
              </p>
              <button
                onClick={handleAddDay}
                className="mt-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer"
              >
                ➕ Add First Day
              </button>
            </div>
          )}
        </div>
      )}

      {/* EXERCISE PICKER MODAL OVERLAY */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-bg-card border border-white/10 bg-gradient-to-b from-[#12121a] to-[#0a0a0f] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h4 className="font-heading font-bold text-lg text-white">Pick Exercises</h4>
                <p className="text-xs text-text-muted mt-0.5">Select the exercises you'd like to assign to this training day.</p>
              </div>
              <button
                onClick={() => setPickerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors cursor-pointer border border-white/5"
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
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-accent-purple"
                />
              </div>

              {/* Muscle Filter chips */}
              <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1">
                {['All', ...MUSCLE_GROUPS].map(muscle => {
                  const active = pickerFilter === muscle;
                  return (
                    <button
                      key={muscle}
                      onClick={() => setPickerFilter(muscle)}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[40vh]">
              {filteredPickerExercises.length > 0 ? (
                filteredPickerExercises.map(ex => {
                  const selected = pickerSelectedIds.includes(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => togglePickerSelection(ex.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        selected
                          ? 'bg-accent-indigo/10 border-accent-indigo'
                          : 'bg-white/2 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-white text-sm block">{ex.name}</span>
                        <div className="flex flex-wrap gap-1">
                          {ex.muscles.map(m => (
                            <span key={m} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-text-muted">
                              {m}
                            </span>
                          ))}
                          <span className="text-[9px] text-text-muted">· {ex.equipment}</span>
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
                {pickerSelectedIds.length} exercises selected
              </span>
              <button
                onClick={handleConfirmPickerSelection}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-xs font-bold hover:opacity-90 shadow flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm Selection
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
