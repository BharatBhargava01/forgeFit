import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, History, Play, Trash2, Clock, ChevronDown, ChevronUp, Plus, Edit3 } from 'lucide-react';
import {
  getWorkouts,
  deleteWorkout,
  getRoutines,
  deleteRoutine,
  getWorkoutLogs,
  deleteWorkoutLog
} from '@/lib/storage';
import AddWorkoutModal from './AddWorkoutModal';

export default function SavedTab({ onStartWorkout, onInspectWorkout, onInspectRoutine, showToast }) {
  const [activeTab, setActiveTab] = useState('workouts'); // 'workouts', 'routines', 'history'
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      if (activeTab === 'workouts') {
        const data = await getWorkouts();
        setItemsList(data || []);
      } else if (activeTab === 'routines') {
        const data = await getRoutines();
        setItemsList(data || []);
      } else if (activeTab === 'history') {
        const data = await getWorkoutLogs();
        setItemsList(data || []);
      }
    } catch (err) {
      console.error(err);
      setItemsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  useEffect(() => {
    if (isAddModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddModalOpen]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      if (activeTab === 'workouts') {
        await deleteWorkout(id);
        showToast('Workout deleted', 'info');
      } else if (activeTab === 'routines') {
        await deleteRoutine(id);
        showToast('Routine deleted', 'info');
      } else if (activeTab === 'history') {
        await deleteWorkoutLog(id);
        showToast('Workout log deleted', 'info');
      }
      await fetchItems();
    } catch (err) {
      showToast('Failed to delete item', 'error');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} at ${timeStr}`;
  };

  const formatDuration = (totalSecs) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8 animate-slide-up">
      
      {/* Tab Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
            Saved <span className="text-gradient">Library</span>
          </h2>
          <p className="text-text-secondary mt-2">
            Access your saved workout templates, routines, and complete training history logs.
          </p>
        </div>
        
        {/* Toggle subtabs and manual log button */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-auto">
          <div className="flex bg-white/5 border border-white/5 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('workouts')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'workouts'
                  ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              Workouts
            </button>
            <button
              onClick={() => setActiveTab('routines')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'routines'
                  ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Routines
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
          </div>

          {activeTab === 'history' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan text-white text-xs font-bold shadow hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 font-bold" />
              Log Session
            </button>
          )}
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl border border-white/5"></div>
          ))}
        </div>
      ) : itemsList.length > 0 ? (
        <div className="space-y-4 animate-fade-in">
          
          {/* Workouts tab */}
          {activeTab === 'workouts' && (
            itemsList.map(w => (
              <div
                key={w.id}
                onClick={() => onInspectWorkout(w)}
                className="glass-card rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-4 cursor-pointer glass-card-hover group"
              >
                <div>
                  <h4 className="font-heading font-bold text-white text-base group-hover:text-accent-cyan transition-colors">
                    {w.name}
                  </h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted mt-1">
                    <span>{w.totalExercises || w.exercises?.length} exercises</span>
                    <span>·</span>
                    <span>~{w.estimatedMinutes} min</span>
                    <span>·</span>
                    <span>Saved {formatDate(w.savedAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onStartWorkout(w); }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-xs font-bold shadow hover:opacity-90 flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Start
                  </button>
                  <button
                    onClick={(e) => handleDelete(w.id, e)}
                    className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-accent-rose/10 hover:text-accent-rose border border-white/5 transition-colors cursor-pointer"
                    title="Delete Workout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Routines tab */}
          {activeTab === 'routines' && (
            itemsList.map(r => (
              <div
                key={r.id}
                onClick={() => onInspectRoutine(r)}
                className="glass-card rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-4 cursor-pointer glass-card-hover group"
              >
                <div>
                  <h4 className="font-heading font-bold text-white text-base group-hover:text-accent-cyan transition-colors">
                    {r.name}
                  </h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted mt-1">
                    <span className="capitalize">{r.splitName || 'Custom'} split</span>
                    <span>·</span>
                    <span>{r.daysPerWeek} training days/week</span>
                    <span>·</span>
                    <span>Saved {formatDate(r.savedAt)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(r.id, e)}
                  className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-accent-rose/10 hover:text-accent-rose border border-white/5 transition-colors cursor-pointer"
                  title="Delete Routine"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}

          {/* History logs tab */}
          {activeTab === 'history' && (
            itemsList.map(log => {
              const isExpanded = expandedLogId === log.id;
              // Calculate sets count and total weight lifted for this session
              let totalWeight = 0;
              let completedSets = 0;
              log.exercises?.forEach(ex => {
                if (Array.isArray(ex.sets)) {
                  ex.sets.forEach(s => {
                    if (s.completed) {
                      completedSets++;
                      totalWeight += (s.weight || 0);
                    }
                  });
                }
              });

              return (
                <div
                  key={log.id}
                  className="glass-card rounded-2xl border border-white/5 overflow-hidden transition-all"
                >
                  {/* Log Header Row */}
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <h4 className="font-heading font-bold text-white text-base">{log.name}</h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted mt-1 items-center">
                        <span className="flex items-center gap-1 font-semibold text-text-secondary">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(log.date || log.loggedAt)}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(log.durationSeconds)}
                        </span>
                        <span>·</span>
                        <span>{completedSets} sets</span>
                        {totalWeight > 0 && (
                          <>
                            <span>·</span>
                            <span>{totalWeight.toLocaleString()} kg lifted</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1.5 rounded text-text-secondary hover:text-white transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingLog(log); }}
                        className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-accent-cyan/10 hover:text-accent-cyan border border-white/5 transition-colors cursor-pointer"
                        title="Edit Log"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(log.id, e)}
                        className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-accent-rose/10 hover:text-accent-rose border border-white/5 transition-colors cursor-pointer"
                        title="Delete Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded exercise details */}
                  {isExpanded && log.exercises && (
                    <div className="p-5 border-t border-white/5 bg-black/30 space-y-4 animate-fade-in">
                      {log.exercises.map((ex, exIdx) => (
                        <div key={exIdx} className="space-y-1.5">
                          <span className="font-bold text-white text-xs block">{ex.name}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {Array.isArray(ex.sets) && ex.sets.map((set, sIdx) => (
                              <span
                                key={sIdx}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  set.completed
                                    ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20 font-bold'
                                    : 'bg-white/5 text-text-muted border-white/5 line-through'
                                }`}
                              >
                                Set {sIdx + 1}: {set.weight}kg × {set.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })
          )}

        </div>
      ) : (
        /* Empty Library State */
        <div className="glass-card rounded-2xl p-16 text-center border border-white/5 space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-white/5 text-text-muted border border-white/5 flex items-center justify-center text-3xl mx-auto shadow-inner">
            📚
          </div>
          <h3 className="font-heading font-bold text-xl text-white">
            No Saved {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h3>
          <p className="text-text-secondary text-sm max-w-xs mx-auto mb-4">
            {activeTab === 'workouts' && 'Generate workouts in the generator tab and hit save to add templates here.'}
            {activeTab === 'routines' && 'Build routines and save them to plan your weekly schedules here.'}
            {activeTab === 'history' && 'Record and complete your workout sessions in the tracker to log training logs.'}
          </p>
          {activeTab === 'history' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan text-white text-xs font-bold shadow hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer mx-auto"
            >
              <Plus className="w-3.5 h-3.5 font-bold" />
              Log Workout Manually
            </button>
          )}
        </div>
      )}

      </div>

      <AddWorkoutModal
        isOpen={isAddModalOpen || !!editingLog}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLog(null);
        }}
        logToEdit={editingLog}
        onSaveSuccess={fetchItems}
        showToast={showToast}
      />
    </>
  );
}
