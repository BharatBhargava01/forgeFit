'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, GripVertical } from 'lucide-react';
import { saveWorkoutLog, updateWorkoutLog, getCustomExercises, saveCustomExercise } from '@/lib/storage';
import { EXERCISES } from '@/lib/data';

export default function AddWorkoutModal({ isOpen, onClose, onSaveSuccess, showToast, logToEdit }) {
  const [loading, setLoading] = useState(false);
  const [workoutName, setWorkoutName] = useState('Manual Workout Session');
  
  // Default date format YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  const [exercises, setExercises] = useState([
    {
      id: 1,
      name: '',
      muscles: [],
      sets: [{ id: 1, weight: '', reps: '' }]
    }
  ]);

  // Overlay states for adding exercises
  const [isAddExModalOpen, setIsAddExModalOpen] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscles, setCustomMuscles] = useState([]);
  const [customEquipment, setCustomEquipment] = useState('Dumbbell');
  const [exSearchQuery, setExSearchQuery] = useState('');

  const getLocalDateString = (dateObjOrStr) => {
    const d = new Date(dateObjOrStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeStr = (dateObjOrStr) => {
    const d = new Date(dateObjOrStr);
    if (isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const musclesList = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];

  const [exerciseSuggestions, setExerciseSuggestions] = useState([]);
  const [focusedExId, setFocusedExId] = useState(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        const custom = await getCustomExercises();
        const combined = [...(custom || []), ...EXERCISES];
        setExerciseSuggestions(combined);
      } catch (err) {
        console.warn('Failed to load custom exercises, falling back to defaults:', err);
        setExerciseSuggestions(EXERCISES);
      }
    }
    if (isOpen) {
      loadExercises();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (logToEdit) {
        setWorkoutName(logToEdit.name || 'Workout Session');
        const localDate = getLocalDateString(logToEdit.loggedAt || logToEdit.date);
        setDate(localDate);
        const localTime = getLocalTimeStr(logToEdit.loggedAt || logToEdit.date);
        setTime(localTime || '12:00');
        setDurationMinutes(Math.round((logToEdit.durationSeconds || 0) / 60) || 45);
        
        if (logToEdit.exercises) {
          setExercises(logToEdit.exercises.map((ex, idx) => ({
            id: ex.id || `ex-${idx}-${Date.now()}`,
            name: ex.name,
            muscles: ex.muscles || [],
            sets: (ex.sets || []).map((s, sIdx) => ({
              id: s.id || `set-${sIdx}-${Date.now()}`,
              weight: s.weight === undefined ? '' : s.weight,
              reps: s.reps === undefined ? '' : s.reps
            }))
          })));
        } else {
          setExercises([{ id: 1, name: '', muscles: [], sets: [{ id: 1, weight: '', reps: '' }] }]);
        }
      } else {
        setWorkoutName('Manual Workout Session');
        setDate(new Date().toLocaleDateString('en-CA'));
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        setTime(`${currentHours}:${currentMinutes}`);
        setDurationMinutes(45);
        setExercises([
          {
            id: 1,
            name: '',
            muscles: [],
            sets: [{ id: 1, weight: '', reps: '' }]
          }
        ]);
      }
    }
  }, [isOpen, logToEdit]);

  const getFilteredSuggestions = (query) => {
    if (!query) {
      return exerciseSuggestions.slice(0, 15);
    }
    const cleanQuery = query.toLowerCase().trim();
    return exerciseSuggestions
      .filter(ex => ex.name.toLowerCase().includes(cleanQuery))
      .slice(0, 15);
  };

  const handleSelectSuggestion = (exId, suggestion) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          name: suggestion.name,
          muscles: suggestion.muscles || []
        };
      }
      return ex;
    }));
    setFocusedExId(null);
  };

  const handleAddExistingExercise = (ex) => {
    setExercises([
      ...exercises,
      {
        id: Date.now() + Math.random(),
        name: ex.name,
        muscles: ex.muscles || [],
        sets: [{ id: Date.now() + Math.random(), weight: '', reps: '' }]
      }
    ]);
    setIsAddExModalOpen(false);
    setExSearchQuery('');
    showToast(`Added "${ex.name}" to session`, 'success');
  };

  const handleCreateAndAddExercise = async () => {
    if (!customName.trim()) {
      showToast('Please enter an exercise name', 'error');
      return;
    }
    if (customMuscles.length === 0) {
      showToast('Please select at least one target muscle', 'error');
      return;
    }

    const newExPayload = {
      name: customName.trim(),
      muscles: customMuscles,
      equipment: customEquipment,
      difficulty: 2,
      type: 'compound',
      description: 'Created during log editing'
    };

    try {
      const savedEx = await saveCustomExercise(newExPayload);
      
      setExercises([
        ...exercises,
        {
          id: Date.now() + Math.random(),
          name: savedEx.name,
          muscles: savedEx.muscles,
          sets: [{ id: Date.now() + Math.random(), weight: '', reps: '' }]
        }
      ]);
      
      const custom = await getCustomExercises();
      const combined = [...(custom || []), ...EXERCISES];
      setExerciseSuggestions(combined);
      
      setIsAddExModalOpen(false);
      setCustomName('');
      setCustomMuscles([]);
      setCustomEquipment('Dumbbell');
      setIsCreatingCustom(false);
      setExSearchQuery('');
      
      showToast(`Created & Added "${savedEx.name}"!`, 'success');
    } catch (err) {
      showToast('Failed to create custom exercise', 'error');
    }
  };

  if (!isOpen) return null;

  const handleRemoveExercise = (exId) => {
    if (confirm('Are you sure you want to remove this exercise from this session?')) {
      setExercises(exercises.filter(ex => ex.id !== exId));
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...exercises];
    const item = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, item);
    setExercises(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleExerciseChange = (exId, field, value) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        return { ...ex, [field]: value };
      }
      return ex;
    }));
  };

  const handleToggleMuscle = (exId, muscle) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        const isSelected = ex.muscles.includes(muscle);
        const newMuscles = isSelected
          ? ex.muscles.filter(m => m !== muscle)
          : [...ex.muscles, muscle];
        return { ...ex, muscles: newMuscles };
      }
      return ex;
    }));
  };

  const handleAddSet = (exId) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: [...ex.sets, { id: Date.now() + Math.random(), weight: '', reps: '' }]
        };
      }
      return ex;
    }));
  };

  const handleRemoveSet = (exId, setId) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        if (ex.sets.length <= 1) return ex;
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId)
        };
      }
      return ex;
    }));
  };

  const handleSetChange = (exId, setId, field, value) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.map(s => {
            if (s.id === setId) {
              return { ...s, [field]: value };
            }
            return s;
          })
        };
      }
      return ex;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!workoutName.trim()) {
      showToast('Workout session name is required', 'error');
      return;
    }
    if (!durationMinutes || parseFloat(durationMinutes) <= 0) {
      showToast('Please enter a valid duration', 'error');
      return;
    }
    if (exercises.length === 0) {
      showToast('Please add at least one exercise', 'error');
      return;
    }

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      if (!ex.name.trim()) {
        showToast(`Please enter a name for Exercise ${i + 1}`, 'error');
        return;
      }
      if (ex.muscles.length === 0) {
        showToast(`Please select at least one muscle hit for "${ex.name}"`, 'error');
        return;
      }
      for (let j = 0; j < ex.sets.length; j++) {
        const s = ex.sets[j];
        if (s.weight === '' || parseFloat(s.weight) < 0) {
          showToast(`Please enter weight for Set ${j + 1} in "${ex.name}"`, 'error');
          return;
        }
        if (!s.reps || parseInt(s.reps) <= 0) {
          showToast(`Please enter reps for Set ${j + 1} in "${ex.name}"`, 'error');
          return;
        }
      }
    }

    setLoading(true);

    try {
      const payload = {
        name: workoutName.trim(),
        durationSeconds: Math.round(parseFloat(durationMinutes) * 60),
        date: new Date(`${date}T${time || '12:00'}`).toISOString(),
        exercises: exercises.map(ex => ({
          name: ex.name.trim(),
          muscles: ex.muscles,
          sets: ex.sets.map(s => ({
            weight: parseFloat(s.weight),
            reps: parseInt(s.reps),
            completed: true
          }))
        }))
      };

      if (logToEdit) {
        await updateWorkoutLog(logToEdit.id, payload);
        showToast('Workout log updated successfully! 🛠️', 'success');
      } else {
        await saveWorkoutLog(payload);
        showToast('Workout logged successfully! 🔥', 'success');
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showToast(logToEdit ? 'Failed to update log' : 'Failed to save manual log', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0a0f]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-scale-up text-white z-10 scrollbar-none">
        
        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 rounded-xl p-2 text-text-muted hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple text-2xl">
            {logToEdit ? '🛠️' : '💪'}
          </div>
          <div className="text-left">
            <h3 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
              {logToEdit ? 'Edit Workout Session' : 'Log Workout Session'}
            </h3>
            <p className="text-text-secondary text-xs mt-0.5">
              {logToEdit ? 'Modify details of this logged training session.' : 'Manually document a past training session to keep your analytics up to date.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {/* General Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block text-left mb-1.5">
                Workout Name
              </label>
              <input
                type="text"
                required
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g. Push Day"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:border-accent-purple/50 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block text-left mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:border-accent-purple/50 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block text-left mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:border-accent-purple/50 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block text-left mb-1.5">
                Duration (minutes)
              </label>
              <input
                type="number"
                required
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g. 60"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:border-accent-purple/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="border-t border-white/5 my-4" />

          {/* Exercises Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-accent-cyan font-bold uppercase tracking-wider">
                Exercises Logged
              </span>
            </div>

            {exercises.map((ex, exIdx) => (
              <div 
                key={ex.id} 
                onDragOver={(e) => handleDragOver(e, exIdx)}
                className={`glass-card rounded-2xl p-5 border relative space-y-4 transition-all duration-200 ${
                  draggedIndex === exIdx 
                    ? 'opacity-40 border-dashed border-accent-purple bg-accent-purple/5 scale-[0.98]' 
                    : 'border-white/5'
                }`}
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-grow">
                    {/* Drag Handle */}
                    <div 
                      draggable
                      onDragStart={(e) => handleDragStart(e, exIdx)}
                      onDragEnd={handleDragEnd}
                      className="mt-6 cursor-grab active:cursor-grabbing text-text-muted hover:text-white transition-colors p-1 shrink-0 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="flex-grow relative">
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block text-left mb-1.5">
                      Exercise {exIdx + 1} Name
                    </label>
                    <input
                      type="text"
                      required
                      value={ex.name}
                      onFocus={() => setFocusedExId(ex.id)}
                      onBlur={() => {
                        // Small delay to allow onMouseDown to fire
                        setTimeout(() => {
                          setFocusedExId(null);
                        }, 200);
                      }}
                      onChange={(e) => handleExerciseChange(ex.id, 'name', e.target.value)}
                      placeholder="e.g. Bench Press"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-muted focus:border-accent-purple/50 focus:outline-none transition-all"
                    />

                    {/* Suggestions Dropdown */}
                    {focusedExId === ex.id && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#12121a] shadow-2xl divide-y divide-white/5 animate-fade-in scrollbar-none">
                        {getFilteredSuggestions(ex.name).length > 0 ? (
                          getFilteredSuggestions(ex.name).map(suggestion => (
                            <button
                              key={suggestion.id || suggestion.name}
                              type="button"
                              onMouseDown={() => handleSelectSuggestion(ex.id, suggestion)}
                              className="w-full text-left px-4 py-3 hover:bg-white/5 text-xs text-[#d2cdcd] font-medium transition-all cursor-pointer flex justify-between items-center gap-4 border-none bg-transparent"
                            >
                              <span className="font-bold text-[#d2cdcd]">{suggestion.name}</span>
                              <span className="text-[9px] text-text-secondary bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase font-bold shrink-0">
                                {suggestion.muscles?.join(', ')}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-xs text-text-muted italic">
                            No matching exercises found. You can still type custom exercises.
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-6">
                    {/* Remove Exercise */}
                    {exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="p-2.5 rounded-xl bg-white/5 text-text-muted hover:bg-accent-rose/10 hover:text-accent-rose border border-white/5 transition-colors cursor-pointer"
                        title="Remove Exercise"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Muscles Hit Multi-select */}
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block text-left mb-1.5">
                    Muscles Hit
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {musclesList.map(muscle => {
                      const isSelected = ex.muscles.includes(muscle);
                      return (
                        <button
                          key={muscle}
                          type="button"
                          onClick={() => handleToggleMuscle(ex.id, muscle)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-accent-purple/20 border-accent-purple text-white shadow-md'
                              : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/10 hover:text-white'
                          }`}
                        >
                          {muscle}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sets Header */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block text-left">
                      Sets & Volume
                    </label>
                  </div>

                  {/* Sets Rows */}
                  <div className="space-y-2">
                    {ex.sets.map((set, setIdx) => (
                      <div 
                        key={set.id}
                        className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5"
                      >
                        <span className="text-xs font-bold text-text-muted w-10 text-left">
                          Set {setIdx + 1}
                        </span>
                        
                        <div className="flex-1 flex gap-2">
                          <div className="flex-1 flex items-center bg-black/20 border border-white/5 rounded-lg px-3">
                            <input
                              type="number"
                              required
                              min="0"
                              step="any"
                              value={set.weight}
                              onChange={(e) => handleSetChange(ex.id, set.id, 'weight', e.target.value)}
                              placeholder="Weight"
                              className="w-full bg-transparent border-none py-1 text-sm text-white focus:outline-none placeholder-text-muted text-center"
                            />
                            <span className="text-[10px] text-text-muted font-bold ml-1">kg</span>
                          </div>

                          <div className="flex-1 flex items-center bg-black/20 border border-white/5 rounded-lg px-3">
                            <input
                              type="number"
                              required
                              min="1"
                              value={set.reps}
                              onChange={(e) => handleSetChange(ex.id, set.id, 'reps', e.target.value)}
                              placeholder="Reps"
                              className="w-full bg-transparent border-none py-1 text-sm text-white focus:outline-none placeholder-text-muted text-center"
                            />
                            <span className="text-[10px] text-text-muted font-bold ml-1">reps</span>
                          </div>
                        </div>

                        {ex.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(ex.id, set.id)}
                            className="p-1.5 text-text-muted hover:text-accent-rose transition-colors cursor-pointer"
                            title="Remove Set"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSet(ex.id)}
                    className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text[#ede8e8] border border-white/5 text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Set
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setIsAddExModalOpen(true)}
              className="w-full py-3.5 rounded-2xl border border-dashed border-white/10 hover:border-white/20 text-xs font-bold text-text-secondary hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white/2"
            >
              <Plus className="w-4 h-4" /> Add Exercise
            </button>
          </div>

          <div className="border-t border-white/5 pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#ede8e8] font-semibold text-xs hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan hover:opacity-90 font-bold text-white shadow-lg text-xs transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 min-w-[100px]"
            >
              {loading ? 'Saving...' : (logToEdit ? 'Update Session' : 'Save Session')}
            </button>
          </div>
        </form>
      </div>

      {/* Add Exercise Modal */}
      {isAddExModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in text-white text-left">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
            onClick={() => {
              setIsAddExModalOpen(false);
              setIsCreatingCustom(false);
            }}
          />
          
          {/* Card */}
          <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0a0f]/95 p-6 shadow-2xl backdrop-blur-xl animate-scale-up z-10 scrollbar-none space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="font-heading font-black text-lg text-white">Add Exercise</h3>
                <p className="text-text-secondary text-xs mt-0.5">Add an exercise to the workout session.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddExModalOpen(false);
                  setIsCreatingCustom(false);
                }}
                className="p-1.5 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle tabs for Search vs Create Custom */}
            <div className="flex bg-white/5 border border-white/5 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  !isCreatingCustom
                    ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                Search Exercises
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingCustom(true)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  isCreatingCustom
                    ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                Create Custom
              </button>
            </div>

            {!isCreatingCustom ? (
              /* Search Existing tab */
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
                  <Search className="w-4 h-4 text-text-muted shrink-0" />
                  <input
                    type="text"
                    value={exSearchQuery}
                    onChange={(e) => setExSearchQuery(e.target.value)}
                    placeholder="Search e.g. Bench Press, Squat..."
                    className="w-full bg-transparent border-none text-sm text-white focus:outline-none placeholder-text-muted"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-white/5 border border-white/5 rounded-2xl bg-black/20 scrollbar-none">
                  {exerciseSuggestions
                    .filter(ex => ex.name.toLowerCase().includes(exSearchQuery.toLowerCase()))
                    .slice(0, 30)
                    .map(ex => (
                      <button
                        key={ex.id || ex.name}
                        type="button"
                        onClick={() => handleAddExistingExercise(ex)}
                        className="w-full px-4 py-3 hover:bg-[#12121a] hover:bg-opacity-50 text-left transition-colors cursor-pointer flex items-center justify-between gap-4 border-none bg-transparent"
                      >
                        <div>
                          <span className="font-bold text-sm text-white block">{ex.name}</span>
                          <span className="text-[10px] text-text-muted capitalize">{ex.equipment}</span>
                        </div>
                        <span className="text-[9px] text-text-secondary bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase font-bold shrink-0">
                          {ex.muscles?.slice(0, 2).join(', ')}
                        </span>
                      </button>
                    ))}
                  {exerciseSuggestions.filter(ex => ex.name.toLowerCase().includes(exSearchQuery.toLowerCase())).length === 0 && (
                    <div className="px-4 py-8 text-center text-xs text-text-muted italic">
                      No matching exercises found. Click "Create Custom" to add one!
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Create Custom form */
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block text-left mb-1.5">
                    Exercise Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Incline Cable Press"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:border-accent-purple/50 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block text-left mb-1.5">
                    Equipment
                  </label>
                  <select
                    value={customEquipment}
                    onChange={(e) => setCustomEquipment(e.target.value)}
                    className="w-full bg-[#12121a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-purple/50 focus:outline-none transition-all"
                  >
                    {['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Band'].map(eq => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block text-left mb-1.5">
                    Target Muscles Hit
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-black/25 rounded-2xl border border-white/5">
                    {['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'].map(muscle => {
                      const isSelected = customMuscles.includes(muscle);
                      return (
                        <button
                          key={muscle}
                          type="button"
                          onClick={() => {
                            setCustomMuscles(prev =>
                              isSelected ? prev.filter(m => m !== muscle) : [...prev, muscle]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-accent-purple/20 border-accent-purple text-white shadow'
                              : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/10 hover:text-white'
                          }`}
                        >
                          {muscle}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustom(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-xs hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateAndAddExercise}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan hover:opacity-90 font-bold text-white shadow-lg text-xs transition-all cursor-pointer"
                  >
                    Create & Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
