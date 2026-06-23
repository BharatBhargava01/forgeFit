import React, { useState, useEffect, useMemo } from 'react';
import { Search, Dumbbell, ShieldCheck, Tag, Play, Sliders, Calendar, Clock } from 'lucide-react';
import { MUSCLE_GROUPS, filterExercises, getExerciseCount, PREMADE_WORKOUTS, PREMADE_ROUTINES } from '@/lib/data';

export default function LibraryTab({ onStartWorkout, onInspectWorkout, onInspectRoutine, showToast }) {
  const [libraryView, setLibraryView] = useState('exercises'); // 'exercises', 'workouts', 'routines'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredExercises = useMemo(() => {
    return filterExercises({
      search: debouncedSearch,
      muscles: selectedFilter !== 'All' ? [selectedFilter] : [],
    });
  }, [debouncedSearch, selectedFilter]);

  const totalExercisesCount = getExerciseCount();

  const difficultyDetails = (level) => {
    const map = {
      1: { label: 'Easy', cls: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20' },
      2: { label: 'Medium', cls: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20' },
      3: { label: 'Hard', cls: 'bg-accent-rose/10 text-accent-rose border-accent-rose/20' },
    };
    return map[level] || map[2];
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up">
      {/* Tab Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
            Training <span className="text-gradient">Library</span>
          </h2>
          <p className="text-text-secondary mt-2">
            Browse built-in exercises, or launch one of our scientifically designed pre-made workout templates.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-white/5 border border-white/5 rounded-xl p-1 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setLibraryView('exercises')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              libraryView === 'exercises'
                ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Exercises
          </button>
          <button
            onClick={() => setLibraryView('workouts')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              libraryView === 'workouts'
                ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Workouts
          </button>
          <button
            onClick={() => setLibraryView('routines')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              libraryView === 'routines'
                ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Routines
          </button>
        </div>
      </div>

      {libraryView === 'exercises' && (
        <>
          {/* Search Input */}
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, muscles, or description..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-accent-purple transition-all shadow-inner"
            />
          </div>

          {/* Filter Chips */}
          <div className="mb-6 flex flex-wrap gap-2 pb-2 overflow-x-auto max-w-full">
            {['All', ...MUSCLE_GROUPS].map((muscle) => {
              const active = selectedFilter === muscle;
              return (
                <button
                  key={muscle}
                  onClick={() => setSelectedFilter(muscle)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 shrink-0 cursor-pointer ${
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

          {/* Count Indicator */}
          <div className="mb-4 text-xs font-medium text-text-muted">
            Showing {filteredExercises.length} of {totalExercisesCount} exercises
          </div>

          {/* Grid List */}
          {filteredExercises.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              {filteredExercises.map((ex) => {
                const diff = difficultyDetails(ex.difficulty);
                return (
                  <div
                    key={ex.id}
                    className="glass-card rounded-xl p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all duration-300 glass-card-hover group min-h-[160px]"
                  >
                    <div>
                      {/* Title & Badge Row */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <span className="font-heading font-bold text-white text-lg group-hover:text-accent-cyan transition-colors">
                          {ex.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {ex.isCustom && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-purple text-white tracking-wider uppercase border border-accent-purple/20">
                              Custom
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider ${diff.cls}`}>
                            {diff.label}
                          </span>
                        </div>
                      </div>

                      {/* Muscle tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {ex.muscles.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-text-secondary border border-white/5 font-medium"
                          >
                            {m}
                          </span>
                        ))}
                      </div>

                      {/* Description */}
                      <p className="text-text-secondary text-xs leading-relaxed mb-4">
                        {ex.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Footer details */}
                    <div className="flex justify-between items-center text-[10px] text-text-muted border-t border-white/5 pt-3">
                      <span className="flex items-center gap-1 font-medium">
                        <Dumbbell className="w-3.5 h-3.5" />
                        {ex.equipment}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {ex.type === 'compound' ? 'Compound lift' : 'Isolation exercise'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty Filter State */
            <div className="glass-card rounded-2xl p-12 text-center border border-white/5 animate-fade-in">
              <span className="text-2xl block mb-2">🔍</span>
              <span className="font-bold text-white text-base block mb-1">No exercises found</span>
              <p className="text-text-muted text-xs max-w-xs mx-auto">
                Try adjusting your search query or switching filters to show results.
              </p>
            </div>
          )}
        </>
      )}

      {/* Workout Templates List */}
      {libraryView === 'workouts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {PREMADE_WORKOUTS.map((w) => (
            <div
              key={w.id}
              className="glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col justify-between glass-card-hover group min-h-[220px]"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-heading font-extrabold text-white text-lg group-hover:text-accent-cyan transition-colors">
                    {w.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-accent-purple/10 text-accent-purple border border-accent-purple/20 tracking-wider shrink-0">
                    {w.goal}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-text-muted mb-4 items-center">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {w.duration} min
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-3.5 h-3.5" />
                    {w.totalExercises} exercises
                  </span>
                  <span>·</span>
                  <span className="capitalize">{w.muscles.join(', ')}</span>
                </div>

                {/* Mini exercise preview */}
                <div className="bg-black/20 rounded-xl p-3 border border-white/5 space-y-1.5 mb-6">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Exercises Included</span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-secondary">
                    {w.exercises.map((ex) => (
                      <div key={ex.id} className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo shrink-0"></span>
                        <span className="truncate">{ex.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-white/5 pt-4">
                {onStartWorkout && (
                  <button
                    onClick={() => onStartWorkout(w)}
                    className="flex-grow py-2 px-4 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-xs font-bold shadow-lg shadow-accent-purple/15 hover:opacity-90 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start Session
                  </button>
                )}
                {onInspectWorkout && (
                  <button
                    onClick={() => onInspectWorkout(w)}
                    className="flex-grow py-2 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                    Customize
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Routine Templates List */}
      {libraryView === 'routines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {PREMADE_ROUTINES.map((r) => (
            <div
              key={r.id}
              className="glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col justify-between glass-card-hover group min-h-[220px]"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-heading font-extrabold text-white text-lg group-hover:text-accent-cyan transition-colors">
                    {r.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-accent-purple/10 text-accent-purple border border-accent-purple/20 tracking-wider shrink-0">
                    {r.goal}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-text-muted mb-4 items-center">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {r.splitName}
                  </span>
                  <span>·</span>
                  <span>{r.daysPerWeek} training days/week</span>
                </div>

                {/* Day splits overview */}
                <div className="bg-black/20 rounded-xl p-3 border border-white/5 space-y-1.5 mb-6">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Weekly Schedule</span>
                  <div className="flex flex-wrap gap-1.5">
                    {r.week.map((day, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                          day.isRest
                            ? 'bg-white/1 border-white/5 text-text-muted'
                            : 'bg-accent-indigo/10 border-accent-indigo/20 text-white'
                        }`}
                      >
                        {day.dayName.substring(0, 3)}: {day.isRest ? 'Rest' : day.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex border-t border-white/5 pt-4">
                {onInspectRoutine && (
                  <button
                    onClick={() => onInspectRoutine(r)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-xs font-bold shadow-lg shadow-accent-purple/15 hover:opacity-90 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                    Inspect & Customize Routine
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
