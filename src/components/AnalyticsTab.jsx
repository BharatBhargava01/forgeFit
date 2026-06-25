import React, { useState, useEffect, useMemo } from 'react';
import { Award, Brain, Calendar, Dumbbell, Flame, Sparkles, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { getWorkoutLogs } from '@/lib/storage';

export default function AnalyticsTab({ onPrefillGenerator, showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState(null);

  const muscleGroupsFront = [
    { name: 'Chest', label: 'Chest', paths: ['M 100,52 L 82,54 L 80,72 L 100,74 Z', 'M 100,52 L 118,54 L 120,72 L 100,74 Z'] },
    { name: 'Shoulders', label: 'Shoulders (Delts)', paths: ['M 80,54 L 70,62 L 76,76 L 82,68 Z', 'M 120,54 L 130,62 L 124,76 L 118,68 Z'] },
    { name: 'Biceps', label: 'Biceps', paths: ['M 70,62 L 62,84 L 70,92 L 76,76 Z', 'M 130,62 L 138,84 L 130,92 L 124,76 Z'] },
    { name: 'Abs', label: 'Abs (Rectus Abdominis)', paths: ['M 92,76 L 108,76 L 106,108 L 94,108 Z'] },
    { name: 'Obliques', label: 'Obliques', paths: ['M 80,72 L 92,76 L 94,108 L 82,108 Z', 'M 120,72 L 108,76 L 106,108 L 118,108 Z'] },
    { name: 'Quads', label: 'Quads', paths: ['M 78,122 L 96,122 L 93,170 L 76,164 Z', 'M 122,122 L 104,122 L 107,170 L 124,164 Z'] },
    { name: 'Calves', label: 'Calves (Front)', paths: ['M 77,174 L 91,174 L 88,220 L 78,220 Z', 'M 123,174 L 109,174 L 112,220 L 122,220 Z'] },
  ];

  const muscleGroupsBack = [
    { name: 'Shoulders', label: 'Shoulders (Rear Delts)', paths: ['M 280,54 L 270,62 L 276,76 L 282,68 Z', 'M 320,54 L 330,62 L 324,76 L 318,68 Z'] },
    { name: 'Back', label: 'Back (Traps & Lats)', paths: ['M 300,52 L 282,54 L 282,108 L 300,108 Z', 'M 300,52 L 318,54 L 318,108 L 300,108 Z'] },
    { name: 'Triceps', label: 'Triceps', paths: ['M 270,62 L 262,84 L 270,92 L 276,76 Z', 'M 330,62 L 338,84 L 330,92 L 324,76 Z'] },
    { name: 'Glutes', label: 'Glutes', paths: ['M 280,108 L 300,110 L 300,132 L 278,126 Z', 'M 320,108 L 300,110 L 300,132 L 322,126 Z'] },
    { name: 'Hamstrings', label: 'Hamstrings', paths: ['M 278,126 L 300,132 L 296,170 L 276,164 Z', 'M 322,126 L 300,132 L 304,170 L 324,164 Z'] },
    { name: 'Calves', label: 'Calves (Back)', paths: ['M 277,174 L 291,174 L 288,220 L 278,220 Z', 'M 323,174 L 309,174 L 312,220 L 322,220 Z'] },
  ];

  const recentVolumes = useMemo(() => {
    const volumes = {
      Chest: 0, Back: 0, Shoulders: 0, Biceps: 0, Triceps: 0,
      Quads: 0, Hamstrings: 0, Glutes: 0, Calves: 0, Abs: 0, Obliques: 0
    };

    if (!logs.length) return volumes;

    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    logs.forEach(log => {
      const logDate = new Date(log.loggedAt || log.date);
      if (logDate >= fortyEightHoursAgo) {
        if (log.abs_volume !== undefined) {
          volumes.Chest += parseFloat(log.chest_volume) || 0;
          volumes.Back += parseFloat(log.back_volume) || 0;
          volumes.Shoulders += parseFloat(log.shoulders_volume) || 0;
          volumes.Biceps += parseFloat(log.biceps_volume) || 0;
          volumes.Triceps += parseFloat(log.triceps_volume) || 0;
          volumes.Quads += parseFloat(log.quads_volume) || 0;
          volumes.Hamstrings += parseFloat(log.hamstrings_volume) || 0;
          volumes.Glutes += parseFloat(log.glutes_volume) || 0;
          volumes.Calves += parseFloat(log.calves_volume) || 0;
          volumes.Abs += parseFloat(log.abs_volume) || 0;
          volumes.Obliques += parseFloat(log.obliques_volume) || 0;
        } else {
          if (log.exercises) {
            log.exercises.forEach(ex => {
              let exVolume = 0;
              if (ex.sets) {
                ex.sets.forEach(s => {
                  if (s.completed) {
                    const w = parseFloat(s.weight) || (ex.equipment === 'Bodyweight' ? 10 : 0);
                    const r = parseInt(s.reps) || 1;
                    exVolume += w * r;
                  }
                });
              }
              if (ex.muscles) {
                ex.muscles.forEach(m => {
                  const muscle = m.toLowerCase();
                  if (muscle === 'chest') volumes.Chest += exVolume;
                  else if (muscle === 'back') volumes.Back += exVolume;
                  else if (muscle === 'shoulders') volumes.Shoulders += exVolume;
                  else if (muscle === 'biceps') volumes.Biceps += exVolume;
                  else if (muscle === 'triceps') volumes.Triceps += exVolume;
                  else if (muscle === 'quads') volumes.Quads += exVolume;
                  else if (muscle === 'hamstrings') volumes.Hamstrings += exVolume;
                  else if (muscle === 'glutes') volumes.Glutes += exVolume;
                  else if (muscle === 'calves') volumes.Calves += exVolume;
                  else if (muscle === 'abs') volumes.Abs += exVolume;
                  else if (muscle === 'obliques') volumes.Obliques += exVolume;
                  else if (muscle === 'core') {
                    volumes.Abs += exVolume;
                  }
                });
              }
            });
          }
        }
      }
    });

    return volumes;
  }, [logs]);

  const maxVal = useMemo(() => {
    return Math.max(...Object.values(recentVolumes), 500);
  }, [recentVolumes]);

  const getMuscleStyle = (muscle) => {
    const vol = recentVolumes[muscle] || 0;
    if (vol === 0) {
      return {
        fill: 'rgba(255, 255, 255, 0.03)',
        stroke: 'rgba(255, 255, 255, 0.08)',
        transition: 'all 0.3s ease'
      };
    }
    const ratio = Math.min(1, vol / maxVal);
    const hue = Math.round(200 - ratio * 200);
    const saturation = 80;
    const lightness = Math.round(40 + ratio * 20);
    return {
      fill: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`,
      stroke: `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`,
      filter: 'drop-shadow(0 0 4px rgba(124, 58, 237, 0.15))',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    };
  };

  const fetchLogs = async () => {
    try {
      const data = await getWorkoutLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load logs for analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Compute Dashboard Metrics
  const metrics = useMemo(() => {
    if (!logs.length) return null;

    let totalWorkouts = logs.length;
    let totalDurationSeconds = 0;
    let totalVolumeLifted = 0;
    let workoutsPast7Days = 0;
    const muscleFrequency = {};

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Find start of current week (Monday)
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const activeDaysThisWeek = new Set(); // index 0 (Sun) to 6 (Sat)

    logs.forEach(log => {
      totalDurationSeconds += log.durationSeconds || 0;
      
      const logDate = new Date(log.loggedAt || log.date);
      if (logDate >= sevenDaysAgo) {
        workoutsPast7Days++;
      }

      if (logDate >= startOfWeek) {
        activeDaysThisWeek.add(logDate.getDay());
      }

      let logVolume = 0;
      if (log.exercises) {
        log.exercises.forEach(ex => {
          if (ex.muscles) {
            ex.muscles.forEach(m => {
              muscleFrequency[m] = (muscleFrequency[m] || 0) + 1;
            });
          }

          if (Array.isArray(ex.sets)) {
            ex.sets.forEach(set => {
              if (set.completed) {
                logVolume += (set.weight || 0) * (set.reps || 0);
              }
            });
          }
        });
      }
      totalVolumeLifted += logVolume;
    });

    return {
      totalWorkouts,
      totalDurationSeconds,
      totalVolumeLifted,
      workoutsPast7Days,
      activeDaysThisWeek,
      muscleFrequency
    };
  }, [logs]);

  // SVG Chart Computations for past 7 sessions
  const chartData = useMemo(() => {
    if (!logs.length) return [];
    
    // Grab last 7 sessions, oldest first
    const recentLogs = [...logs].slice(0, 7).reverse();
    return recentLogs.map(log => {
      let vol = 0;
      if (log.exercises) {
        log.exercises.forEach(ex => {
          if (Array.isArray(ex.sets)) {
            ex.sets.forEach(s => {
              if (s.completed) vol += (s.weight || 0) * (s.reps || 0);
            });
          }
        });
      }
      const d = new Date(log.loggedAt || log.date);
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: vol
      };
    });
  }, [logs]);

  // Milestone Achievements
  const achievements = useMemo(() => {
    if (!metrics) return [];
    
    const list = [
      {
        id: 'first_step',
        title: 'First Step',
        desc: 'Log your first workout session',
        unlocked: metrics.totalWorkouts >= 1,
        icon: '🚀'
      },
      {
        id: 'consistent_runner',
        title: 'Consistent Runner',
        desc: 'Complete 3 workout logs',
        unlocked: metrics.totalWorkouts >= 3,
        icon: '🏃'
      },
      {
        id: 'heavy_lifter',
        title: 'Heavy Lifter',
        desc: 'Lift 5,000 kg in total volume',
        unlocked: metrics.totalVolumeLifted >= 5000,
        icon: '🏋️'
      },
      {
        id: 'iron_warrior',
        title: 'Iron Warrior',
        desc: 'Lift 20,000 kg in total volume',
        unlocked: metrics.totalVolumeLifted >= 20000,
        icon: '👑'
      },
      {
        id: 'time_warrior',
        title: 'Time Warrior',
        desc: 'Accumulate 3 hours of training',
        unlocked: metrics.totalDurationSeconds >= 10800,
        icon: '⏱️'
      }
    ];

    return list;
  }, [metrics]);

  // AI Insights Trigger
  const handleFetchAiInsights = async () => {
    if (logs.length === 0) return;
    setAiLoading(true);
    setAiInsights(null);

    try {
      const res = await fetch('/api/workouts/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setAiInsights(data);
      showToast('AI Coach insights loaded! 🧠', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to load AI Coach insights.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Pre-fill Generator from AI Recommended Muscles
  const handlePrefillClick = (suggestionText) => {
    if (!suggestionText) return;
    
    // Scan text for muscle names
    const matchedMuscles = [];
    const musclesList = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];
    
    musclesList.forEach(muscle => {
      // Case insensitive check
      const regex = new RegExp(`\\b${muscle}\\b`, 'i');
      if (regex.test(suggestionText)) {
        matchedMuscles.push(muscle);
      }
    });

    if (matchedMuscles.length > 0) {
      onPrefillGenerator(matchedMuscles);
      showToast(`Prefilled Generator with: ${matchedMuscles.join(', ')}`, 'success');
    } else {
      // Fallback
      onPrefillGenerator(['Chest', 'Shoulders']);
      showToast('Prefilled Generator with recommended split', 'success');
    }
  };

  // Format active duration
  const formatDuration = (secs) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Render SVG Line Chart
  const renderSVGChart = () => {
    if (chartData.length < 2) {
      return (
        <div className="h-full flex items-center justify-center text-xs text-text-muted">
          Need at least 2 sessions to render trend line.
        </div>
      );
    }

    const width = 500;
    const height = 200;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const maxVolume = Math.max(...chartData.map(d => d.volume), 100);
    
    // Generate SVG points
    const points = chartData.map((d, i) => {
      const x = paddingLeft + (i / (chartData.length - 1)) * (width - paddingLeft - paddingRight);
      // Invert Y coordinate
      const y = height - paddingBottom - (d.volume / maxVolume) * (height - paddingTop - paddingBottom);
      return { x, y, ...d };
    });

    // Construct path strings
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = height - paddingBottom - ratio * (height - paddingTop - paddingBottom);
          const volLabel = Math.round(ratio * maxVolume);
          return (
            <g key={idx} className="opacity-10">
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="white" strokeWidth="1" strokeDasharray="4 4" />
              <text x={paddingLeft - 8} y={y + 4} fill="white" fontSize="9" textAnchor="end" fontWeight="bold">
                {volLabel}
              </text>
            </g>
          );
        })}

        {/* Shaded Area under path */}
        <path d={areaPath} fill="url(#chartGradient)" />

        {/* Active Line */}
        <path d={linePath} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data Nodes */}
        {points.map((p, idx) => (
          <g key={idx} className="group">
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#06b6d4"
              stroke="#0a0a0f"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:r-6"
            />
            {/* Tooltip value */}
            <text
              x={p.x}
              y={p.y - 8}
              fill="white"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-black"
            >
              {p.volume} kg
            </text>
            {/* X-axis labels */}
            <text
              x={p.x}
              y={height - 10}
              fill="#a0a0b8"
              fontSize="8"
              fontWeight="medium"
              textAnchor="middle"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/10 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up">
        {/* Header */}
        <div className="mb-8">
          <h2 className="font-heading font-extrabold text-3xl text-white">
            Workout <span className="text-gradient">Analytics</span>
          </h2>
        </div>
        <div className="glass-card rounded-2xl p-16 text-center border border-white/5 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 text-accent-purple border border-accent-purple/20 flex items-center justify-center text-3xl mx-auto shadow-inner">
            📊
          </div>
          <h3 className="font-heading font-bold text-xl text-white">No Analytics Available</h3>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            Complete and log a training session using the Active Workout Tracker to unlock consistency, volume trends, and muscle distribution charts.
          </p>
        </div>
      </div>
    );
  }

  // Active days this week flags (Mon=1, Tue=2... Sun=0)
  const calendarDays = [
    { label: 'M', index: 1 },
    { label: 'T', index: 2 },
    { label: 'W', index: 3 },
    { label: 'T', index: 4 },
    { label: 'F', index: 5 },
    { label: 'S', index: 6 },
    { label: 'S', index: 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-slide-up">
      
      {/* Tab Header */}
      <div>
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
          Workout <span className="text-gradient">Analytics</span>
        </h2>
        <p className="text-text-secondary mt-2">
          Review your lifting volume, consistency layout, and unlock custom coach guidance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Workouts */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple shrink-0">
            <Flame className="w-5 h-5 fill-accent-purple" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Sessions Completed</span>
            <span className="font-heading font-black text-2xl text-white block mt-0.5">
              {metrics?.totalWorkouts}
            </span>
          </div>
        </div>

        {/* Total Time */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Active Duration</span>
            <span className="font-heading font-black text-2xl text-white block mt-0.5">
              {formatDuration(metrics?.totalDurationSeconds)}
            </span>
          </div>
        </div>

        {/* Total Volume */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 border border-accent-indigo/20 flex items-center justify-center text-accent-indigo shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Volume Lifted</span>
            <span className="font-heading font-black text-xl sm:text-2xl text-white block mt-0.5">
              {metrics?.totalVolumeLifted.toLocaleString()} kg
            </span>
          </div>
        </div>

        {/* Consistency */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center text-accent-amber shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Consistency (7d)</span>
            <span className="font-heading font-black text-2xl text-white block mt-0.5">
              {metrics?.workoutsPast7Days}
            </span>
          </div>
        </div>

      </div>

      {/* Consistency Calendar Row */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl">
        <h3 className="font-heading font-bold text-base text-white">Weekly Consistency</h3>
        <p className="text-xs text-text-muted mt-0.5 mb-4">Highlighted days represent workouts completed in this current week.</p>
        
        <div className="flex justify-between max-w-md">
          {calendarDays.map(day => {
            const active = metrics?.activeDaysThisWeek.has(day.index);
            return (
              <div key={day.index} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-text-muted font-bold">{day.label}</span>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-br from-accent-indigo to-accent-purple border-accent-purple text-white shadow shadow-accent-purple/20 scale-105'
                    : 'border-white/5 bg-white/2 text-text-muted'
                }`}>
                  {active ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Layout - Split 12-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Recent Volume & Muscle Focus (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Trend Volume Chart */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-4 flex flex-col justify-between h-[280px]">
            <div>
              <h3 className="font-heading font-bold text-base text-white">Recent Volume Trend</h3>
              <p className="text-xs text-text-muted mt-0.5">Total weight load lifted in your past 7 training sessions.</p>
            </div>
            <div className="h-[200px] w-full flex items-center justify-center">
              {renderSVGChart()}
            </div>
          </div>

          {/* Muscle Focus Breakdown */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
            <div>
              <h3 className="font-heading font-bold text-base text-white">Muscle Focus Breakdown</h3>
              <p className="text-xs text-text-muted mt-0.5">Distribution frequency based on sets logged per target muscle.</p>
            </div>

            <div className="space-y-3.5 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
              {metrics && Object.keys(metrics.muscleFrequency).length > 0 ? (
                Object.entries(metrics.muscleFrequency)
                  .sort((a, b) => b[1] - a[1])
                  .map(([muscle, freq]) => {
                    const maxFreq = Math.max(...Object.values(metrics.muscleFrequency));
                    const percentage = Math.round((freq / maxFreq) * 100);
                    return (
                      <div key={muscle} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-white">{muscle}</span>
                          <span className="text-text-secondary">{freq} sets</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-indigo to-accent-purple rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8 text-xs text-text-muted">No muscle breakdown available.</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Interactive Heatmap (5/12) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col justify-between min-h-[500px]">
          <div>
            <h3 className="font-heading font-bold text-base text-white">Interactive Muscle Heatmap</h3>
            <p className="text-xs text-text-muted mt-0.5">Cumulative volume (kg) logged per muscle group over the past 48 hours.</p>
          </div>

          <div className="flex-grow flex items-center justify-center py-4">
            <svg viewBox="0 0 400 240" className="w-full max-h-[320px] select-none">
              {/* STATIC ELEMENTS - FRONT */}
              <circle cx="100" cy="30" r="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <polygon points="97,40 103,40 102,52 98,52" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <polygon points="94,108 106,108 105,122 95,122" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <polygon points="78,220 86,220 86,228 74,228" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <polygon points="122,220 114,220 114,228 126,228" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

              {/* STATIC ELEMENTS - BACK */}
              <circle cx="300" cy="30" r="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <polygon points="297,40 303,40 302,52 298,52" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <polygon points="294,108 306,108 305,126 295,126" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <polygon points="278,220 286,220 286,228 274,228" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <polygon points="322,220 314,220 314,228 326,228" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

              {/* Labels FRONT & BACK */}
              <text x="100" y="235" textAnchor="middle" fill="#a0a0b8" fontSize="8" fontWeight="bold" opacity="0.6">FRONT VIEW</text>
              <text x="300" y="235" textAnchor="middle" fill="#a0a0b8" fontSize="8" fontWeight="bold" opacity="0.6">BACK VIEW</text>

              {/* INTERACTIVE MUSCLES FRONT */}
              {muscleGroupsFront.map(mg => {
                const activeStyle = getMuscleStyle(mg.name);
                const isHovered = hoveredGroup === mg.name;
                return (
                  <g 
                    key={mg.name}
                    onMouseEnter={() => setHoveredGroup(mg.name)}
                    onMouseLeave={() => setHoveredGroup(null)}
                    className="cursor-pointer"
                  >
                    {mg.paths.map((p, pIdx) => (
                      <path
                        key={pIdx}
                        d={p}
                        style={{
                          ...activeStyle,
                          ...(isHovered ? {
                            fillOpacity: 0.95,
                            strokeWidth: 2,
                            stroke: '#ffffff'
                          } : {})
                        }}
                      />
                    ))}
                  </g>
                );
              })}

              {/* INTERACTIVE MUSCLES BACK */}
              {muscleGroupsBack.map(mg => {
                const activeStyle = getMuscleStyle(mg.name);
                const isHovered = hoveredGroup === mg.name;
                return (
                  <g 
                    key={mg.name}
                    onMouseEnter={() => setHoveredGroup(mg.name)}
                    onMouseLeave={() => setHoveredGroup(null)}
                    className="cursor-pointer"
                  >
                    {mg.paths.map((p, pIdx) => (
                      <path
                        key={pIdx}
                        d={p}
                        style={{
                          ...activeStyle,
                          ...(isHovered ? {
                            fillOpacity: 0.95,
                            strokeWidth: 2,
                            stroke: '#ffffff'
                          } : {})
                        }}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Tooltip & Scale Legend */}
          <div className="w-full mt-4 flex items-center justify-between border-t border-white/5 pt-3">
            <div className="text-[10px] text-text-secondary">
              {hoveredGroup ? (
                <span className="font-semibold text-white animate-fade-in flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-purple animate-ping"></span>
                  {hoveredGroup}: <strong className="text-accent-cyan">{recentVolumes[hoveredGroup]?.toLocaleString() || 0} kg</strong>
                </span>
              ) : (
                <span className="text-text-muted">Hover muscles to inspect 48h volume</span>
              )}
            </div>
            {/* Heat Scale Legend */}
            <div className="flex items-center gap-1 text-[9px] text-text-muted">
              <span>Cold</span>
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-red-500"></div>
              <span>Hot</span>
            </div>
          </div>
        </div>

      </div>

      {/* AI COACH INSIGHTS SECTION */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-5">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent-purple" />
            <h3 className="font-heading font-extrabold text-lg text-white">AI Coach Insights & Optimization</h3>
          </div>
          {!aiInsights && !aiLoading && (
            <button
              onClick={handleFetchAiInsights}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-xs font-bold hover:opacity-90 shadow-md flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Advice
            </button>
          )}
        </div>

        {aiLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-full"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
            <div className="h-4 bg-white/10 rounded w-4/5"></div>
          </div>
        ) : aiInsights ? (
          <div className="space-y-6 animate-fade-in text-sm leading-relaxed">
            
            {/* Summary */}
            <div className="p-4 rounded-xl bg-accent-purple/5 border border-accent-purple/10 text-white italic">
              "{aiInsights.summary}"
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-accent-emerald uppercase tracking-wider block">
                  Observed Strengths
                </span>
                <ul className="space-y-1.5">
                  {aiInsights.strengths.map((str, idx) => (
                    <li key={idx} className="text-text-secondary text-xs flex items-start gap-2">
                      <span className="text-accent-emerald mt-0.5">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-accent-rose uppercase tracking-wider block">
                  Areas to Optimize
                </span>
                <ul className="space-y-1.5">
                  {aiInsights.weaknesses.map((weak, idx) => (
                    <li key={idx} className="text-text-secondary text-xs flex items-start gap-2">
                      <span className="text-accent-rose mt-0.5">!</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-accent-cyan uppercase tracking-wider block">
                Coach Recommendations
              </span>
              <ul className="space-y-1.5">
                {aiInsights.optimizationRecommendations.map((rec, idx) => (
                  <li key={idx} className="text-text-secondary text-xs flex items-start gap-2">
                    <span className="text-accent-cyan mt-0.5">·</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendation Split Prefill */}
            <div className="p-4 rounded-xl bg-white/2 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-white block">Next Workout Recommendation</span>
                <p className="text-xs text-text-secondary max-w-lg">
                  {aiInsights.suggestedNextWorkout}
                </p>
              </div>
              <button
                onClick={() => handlePrefillClick(aiInsights.suggestedNextWorkout)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                Pre-fill Generator
              </button>
            </div>

          </div>
        ) : (
          <div className="text-center py-6 text-xs text-text-muted">
            Click "Generate Advice" to analyze your logs and get AI-powered insights on your consistency, overload, and muscle imbalances.
          </div>
        )}
      </div>

      {/* MILESTONES & ACHIEVEMENTS SECTION */}
      <div className="space-y-4">
        <h3 className="font-heading font-extrabold text-lg text-white">Milestones & Achievements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`glass-card rounded-xl p-4 border transition-all flex items-center gap-4 ${
                ach.unlocked
                  ? 'border-white/10 bg-white/3'
                  : 'border-white/5 bg-white/1 opacity-30 select-none'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
                ach.unlocked
                  ? 'bg-gradient-to-br from-accent-indigo/10 to-accent-purple/10 border-accent-purple/20'
                  : 'bg-white/5 border-white/5'
              }`}>
                {ach.unlocked ? ach.icon : '🔒'}
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-white block">{ach.title}</span>
                <span className="text-[10px] text-text-muted leading-tight block">{ach.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
