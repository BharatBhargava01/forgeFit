import React, { useState, useEffect, useMemo } from 'react';
import { Search, Dumbbell, ShieldCheck, Tag } from 'lucide-react';
import { MUSCLE_GROUPS, filterExercises, getExerciseCount } from '@/lib/data';

export default function LibraryTab() {
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
      <div className="mb-8">
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
          Exercise <span className="text-gradient">Library</span>
        </h2>
        <p className="text-text-secondary mt-2">
          Browse and search through our complete database of exercises.
        </p>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="glass-card rounded-2xl p-12 text-center border border-white/5">
          <span className="text-2xl block mb-2">🔍</span>
          <span className="font-bold text-white text-base block mb-1">No exercises found</span>
          <p className="text-text-muted text-xs max-w-xs mx-auto">
            Try adjusting your search query or switching filters to show results.
          </p>
        </div>
      )}
    </div>
  );
}
