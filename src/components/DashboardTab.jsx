import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Activity, Percent, Award, Brain, Calendar, Dumbbell, Flame, Sparkles, Clock, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, Apple, Utensils } from 'lucide-react';
import { getWorkoutLogs } from '@/lib/storage';
import AddWorkoutModal from './AddWorkoutModal';

export default function DashboardTab({ user, showToast, onPrefillGenerator, currentFilter = 'Today', selectedDate = new Date(), onNavigate }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [activePieMuscle, setActivePieMuscle] = useState(null);

  // Filter logs based on top-right date selector and currentFilter
  const filteredLogs = useMemo(() => {
    if (!logs.length) return [];
    
    return logs.filter(log => {
      const logDate = new Date(log.date || log.loggedAt);
      if (isNaN(logDate.getTime())) return false;
      
      const refDate = new Date(selectedDate);
      
      if (currentFilter === 'Today') {
        return logDate.getFullYear() === refDate.getFullYear() &&
               logDate.getMonth() === refDate.getMonth() &&
               logDate.getDate() === refDate.getDate();
      }
      
      if (currentFilter === 'Weekly') {
        const refDay = refDate.getDay();
        const diffToMonday = refDay === 0 ? -6 : 1 - refDay;
        const startOfWeek = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        
        return logDate >= startOfWeek && logDate < endOfWeek;
      }
      
      if (currentFilter === 'Monthly') {
        return logDate.getFullYear() === refDate.getFullYear() &&
               logDate.getMonth() === refDate.getMonth();
      }
      
      if (currentFilter === 'Yearly') {
        return logDate.getFullYear() === refDate.getFullYear();
      }
      
      return true;
    });
  }, [logs, currentFilter, selectedDate]);

  const filterLabel = useMemo(() => {
    if (currentFilter === 'Today') return 'for selected date';
    if (currentFilter === 'Weekly') return 'for selected week';
    if (currentFilter === 'Monthly') return 'for selected month';
    if (currentFilter === 'Yearly') return 'for selected year';
    return 'for selected period';
  }, [currentFilter]);

  // Consistency Calendar states
  const calendarView = useMemo(() => {
    const filterLower = currentFilter.toLowerCase();
    if (filterLower === 'today' || filterLower === 'weekly') return 'weekly';
    if (filterLower === 'monthly') return 'monthly';
    if (filterLower === 'yearly') return 'yearly';
    return 'weekly';
  }, [currentFilter]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCalDay, setSelectedCalDay] = useState(null); // 'YYYY-MM-DD'
  const [editingLog, setEditingLog] = useState(null);

  // Sync selected calendar view month/year when the user clicks the top-right date selector
  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      setSelectedMonth(d.getMonth());
      setSelectedYear(d.getFullYear());
    }
  }, [selectedDate]);

  const getLocalDateString = (dateObjOrStr) => {
    const d = new Date(dateObjOrStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch logged workouts and load sleep hours
  const loadData = async () => {
    try {
      const loggedWorkouts = await getWorkoutLogs();
      setLogs(loggedWorkouts || []);
    } catch (err) {
      console.warn('Failed to load logs in dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Generate date list for past 7 days
  const last7DaysList = useMemo(() => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d);
    }
    return list;
  }, []);

  // Consistency Calendar logic
  const activeDaysMap = useMemo(() => {
    const map = new Map();
    logs.forEach(log => {
      const dStr = getLocalDateString(log.date || log.loggedAt);
      if (dStr) {
        if (!map.has(dStr)) {
          map.set(dStr, []);
        }
        map.get(dStr).push(log);
      }
    });
    return map;
  }, [logs]);

  const getDaysInMonthGrid = (month, year) => {
    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay(); // Sun=0, Mon=1...
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Mon=0, Tue=1... Sun=6
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const grid = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      grid.push(new Date(year, month, day));
    }
    return grid;
  };

  // Heatmap definitions
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

    if (!filteredLogs.length) return volumes;

    filteredLogs.forEach(log => {
      if (log.exercises) {
        log.exercises.forEach(ex => {
          let exVolume = 0;
          if (ex.sets) {
            ex.sets.forEach(s => {
              if (s.completed) {
                const w = parseFloat(s.weight) || (ex.equipment === 'Bodyweight' ? 10 : 0);
                exVolume += w;
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
    });

    return volumes;
  }, [filteredLogs]);

  const maxVal = useMemo(() => {
    return Math.max(...Object.values(recentVolumes), 50);
  }, [recentVolumes]);

  const getMuscleStyle = (muscle) => {
    const vol = recentVolumes[muscle] || 0;
    if (vol === 0) {
      return {
        fill: 'var(--heatmap-empty-fill, rgba(0, 0, 0, 0.04))',
        stroke: 'var(--heatmap-empty-stroke, rgba(0, 0, 0, 0.08))',
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

  // Compute Dashboard/Analytics Metrics
  const metrics = useMemo(() => {
    if (!filteredLogs.length) return null;

    let totalWorkouts = filteredLogs.length;
    let totalDurationSeconds = 0;
    let totalVolumeLifted = 0;
    let workoutsPast7Days = 0;
    const muscleFrequency = {};

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const activeDaysThisWeek = new Set();

    filteredLogs.forEach(log => {
      totalDurationSeconds += log.durationSeconds || 0;
      
      const logDate = new Date(log.date || log.loggedAt);
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
              const name = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
              muscleFrequency[name] = (muscleFrequency[name] || 0) + 1;
            });
          }

          if (Array.isArray(ex.sets)) {
            ex.sets.forEach(set => {
              if (set.completed) {
                logVolume += (set.weight || 0);
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
  }, [filteredLogs]);

  // Volume Trend chart points (for selected period)
  const chartData = useMemo(() => {
    if (currentFilter === 'Today') {
      // Sort logs chronologically by logged time
      const sortedLogs = [...filteredLogs].sort((a, b) => {
        const ad = new Date(a.date || a.loggedAt).getTime();
        const bd = new Date(b.date || b.loggedAt).getTime();
        return ad - bd;
      });

      return sortedLogs.map(log => {
        const d = new Date(log.date || log.loggedAt);
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        
        let vol = 0;
        log.exercises?.forEach(ex => {
          ex.sets?.forEach(s => {
            if (s.completed) vol += (s.weight || 0);
          });
        });
        
        return {
          label: timeStr,
          volume: vol
        };
      });
    }

    if (currentFilter === 'Weekly') {
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const slots = daysOfWeek.map(label => ({ label, volume: 0 }));
      filteredLogs.forEach(log => {
        const d = new Date(log.date || log.loggedAt);
        const day = d.getDay(); // Sun = 0, Mon = 1...
        const index = day === 0 ? 6 : day - 1;
        let vol = 0;
        log.exercises?.forEach(ex => {
          ex.sets?.forEach(s => {
            if (s.completed) vol += (s.weight || 0);
          });
        });
        if (index >= 0 && index < 7) {
          slots[index].volume += vol;
        }
      });
      return slots;
    }

    if (currentFilter === 'Monthly') {
      const slots = [
        { label: 'Week 1', volume: 0 },
        { label: 'Week 2', volume: 0 },
        { label: 'Week 3', volume: 0 },
        { label: 'Week 4', volume: 0 }
      ];
      filteredLogs.forEach(log => {
        const d = new Date(log.date || log.loggedAt);
        const dateNum = d.getDate();
        let vol = 0;
        log.exercises?.forEach(ex => {
          ex.sets?.forEach(s => {
            if (s.completed) vol += (s.weight || 0);
          });
        });
        if (dateNum >= 1 && dateNum <= 7) slots[0].volume += vol;
        else if (dateNum >= 8 && dateNum <= 14) slots[1].volume += vol;
        else if (dateNum >= 15 && dateNum <= 21) slots[2].volume += vol;
        else slots[3].volume += vol;
      });
      return slots;
    }

    if (currentFilter === 'Yearly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const slots = months.map(label => ({ label, volume: 0 }));
      filteredLogs.forEach(log => {
        const d = new Date(log.date || log.loggedAt);
        const monthIndex = d.getMonth();
        let vol = 0;
        log.exercises?.forEach(ex => {
          ex.sets?.forEach(s => {
            if (s.completed) vol += (s.weight || 0);
          });
        });
        if (monthIndex >= 0 && monthIndex < 12) {
          slots[monthIndex].volume += vol;
        }
      });
      return slots;
    }

    return [];
  }, [filteredLogs, currentFilter]);

  // AI Insights Handler
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

  const handlePrefillClick = (suggestionText) => {
    if (!suggestionText) return;
    const matchedMuscles = [];
    const musclesList = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];
    
    musclesList.forEach(muscle => {
      const regex = new RegExp(`\\b${muscle}\\b`, 'i');
      if (regex.test(suggestionText)) {
        matchedMuscles.push(muscle);
      }
    });

    if (matchedMuscles.length > 0) {
      onPrefillGenerator(matchedMuscles);
      showToast(`Prefilled Generator with: ${matchedMuscles.join(', ')}`, 'success');
    } else {
      onPrefillGenerator(['Chest', 'Shoulders']);
      showToast('Prefilled Generator with recommended split', 'success');
    }
  };

  // Helper formatting methods
  const formatDuration = (secs) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Render SVG Line Chart
  const renderSVGChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-xs text-text-muted font-bold">
          No sessions logged for selected period.
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
    
    const points = chartData.map((d, i) => {
      const x = chartData.length === 1
        ? paddingLeft + 0.5 * (width - paddingLeft - paddingRight)
        : paddingLeft + (i / (chartData.length - 1)) * (width - paddingLeft - paddingRight);
      const y = height - paddingBottom - (d.volume / maxVolume) * (height - paddingTop - paddingBottom);
      return { x, y, ...d };
    });

    const linePath = chartData.length === 1
      ? `M ${points[0].x - 40} ${points[0].y} L ${points[0].x + 40} ${points[0].y}`
      : points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const areaPath = chartData.length === 1
      ? `M ${points[0].x - 40} ${points[0].y} L ${points[0].x + 40} ${points[0].y} L ${points[0].x + 40} ${height - paddingBottom} L ${points[0].x - 40} ${height - paddingBottom} Z`
      : `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

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
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--heatmap-outline-stroke, rgba(255,255,255,0.08))" strokeWidth="1" strokeDasharray="4 4" />
              <text x={paddingLeft - 8} y={y + 4} fill="currentColor" className="text-[#a0a0b8]" fontSize="9" textAnchor="end" fontWeight="bold">
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
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[#12121a] cursor-pointer transition-all hover:r-6"
            />
            <text
              x={p.x}
              y={p.y - 8}
              fill="currentColor"
              className="text-[#ededed] opacity-0 group-hover:opacity-100 transition-opacity bg-black"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
            >
              {p.volume} kg
            </text>
            <text
              x={p.x}
              y={height - 10}
              fill="currentColor"
              className="text-[#a0a0b8]"
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

  // Concurrency helper for donut/energy calculations
  const muscleCaloriesData = useMemo(() => {
    const stats = {};
    const weight = parseFloat(user?.profile?.weight) || 70;

    filteredLogs.forEach(log => {
      if (!log.exercises) return;

      // 1. Calculate total session calories based on weight and duration
      // 6.0 METs for resistance training, 3.5 conversion constant
      const durationMin = (log.durationSeconds || 2700) / 60;
      const totalSessionCalories = 6.0 * 3.5 * (weight / 200) * durationMin;

      // 2. Count completed sets per muscle group in this session
      const sessionMuscleStats = {};
      let totalSessionMuscleSets = 0;

      log.exercises.forEach(ex => {
        let completedSets = 0;
        if (ex.sets) {
          ex.sets.forEach(s => {
            if (s.completed) completedSets++;
          });
        }
        if (completedSets > 0 && ex.muscles) {
          ex.muscles.forEach(m => {
            const name = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
            sessionMuscleStats[name] = (sessionMuscleStats[name] || 0) + completedSets;
            totalSessionMuscleSets += completedSets;
          });
        }
      });

      // 3. Distribute session calories proportionally to each muscle group
      if (totalSessionMuscleSets > 0) {
        Object.entries(sessionMuscleStats).forEach(([muscleName, setsCount]) => {
          const proportion = setsCount / totalSessionMuscleSets;
          const caloriesBurned = proportion * totalSessionCalories;
          if (!stats[muscleName]) {
            stats[muscleName] = { sets: 0, calories: 0 };
          }
          stats[muscleName].sets += setsCount;
          stats[muscleName].calories += caloriesBurned;
        });
      }
    });

    const data = Object.entries(stats).map(([muscle, item]) => ({
      muscle,
      sets: item.sets,
      calories: Math.round(item.calories)
    }));

    data.sort((a, b) => b.calories - a.calories);
    return data;
  }, [filteredLogs, user]);

  const topMuscleGroup = useMemo(() => {
    if (muscleCaloriesData.length === 0) return null;
    return muscleCaloriesData[0];
  }, [muscleCaloriesData]);

  const top3MuscleGroups = useMemo(() => {
    const list = [...muscleCaloriesData];
    const colors = ['#6366f1', '#a389f4', '#06b6d4'];
    return list.slice(0, 3).map((item, i) => ({
      ...item,
      color: colors[i]
    }));
  }, [muscleCaloriesData]);

  const pieSlices = useMemo(() => {
    const total = top3MuscleGroups.reduce((acc, m) => acc + m.calories, 0);
    if (total === 0) return [];

    let accumulatedPercent = 0;
    const r = 60;
    const cx = 90;
    const cy = 90;

    return top3MuscleGroups.map((m) => {
      const percent = m.calories / total;
      const startAngle = accumulatedPercent * 2 * Math.PI - Math.PI / 2;
      accumulatedPercent += percent;
      const endAngle = accumulatedPercent * 2 * Math.PI - Math.PI / 2;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const largeArcFlag = percent > 0.5 ? 1 : 0;

      const pathData = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `Z`
      ].join(' ');

      return {
        muscle: m.muscle,
        calories: m.calories,
        color: m.color,
        percent: Math.round(percent * 100),
        pathData
      };
    });
  }, [top3MuscleGroups]);

  const currentSelectedMuscle = useMemo(() => {
    if (pieSlices.length === 0) return null;
    if (!activePieMuscle) return pieSlices[0];
    return pieSlices.find(m => m.muscle === activePieMuscle) || pieSlices[0];
  }, [pieSlices, activePieMuscle]);

  const dynamicEnergyWorkouts = useMemo(() => {
    if (muscleCaloriesData.length > 0) {
      return muscleCaloriesData.reduce((acc, curr) => acc + curr.calories, 0);
    }
    return 0;
  }, [muscleCaloriesData]);

  const calculatedActiveMinutes = useMemo(() => {
    let logMinutes = 0;
    filteredLogs.forEach(log => {
      logMinutes += Math.round((log.durationSeconds || 0) / 60) || 45;
    });
    return logMinutes > 0 ? logMinutes : 0;
  }, [filteredLogs]);

  // Load nutrition settings and logs from localStorage
  const calorieTarget = useMemo(() => {
    if (typeof window === 'undefined') return 2500;
    const saved = localStorage.getItem('wg_nutrition_target');
    return saved ? parseInt(saved) : 2500;
  }, []);

  const dietSettings = useMemo(() => {
    if (typeof window === 'undefined') {
      return { dietType: 'Standard', macroFocus: 'Balanced' };
    }
    const dietType = localStorage.getItem('wg_nutrition_diet') || 'Standard';
    const macroFocus = localStorage.getItem('wg_nutrition_macro') || 'Balanced';
    return { dietType, macroFocus };
  }, []);

  const macroDist = useMemo(() => {
    const focus = dietSettings.macroFocus;
    return {
      Balanced: { p: 30, c: 45, f: 25 },
      HighProtein: { p: 40, c: 35, f: 25 },
      Keto: { p: 25, c: 5, f: 70 },
      LowFat: { p: 25, c: 60, f: 15 }
    }[focus] || { p: 30, c: 45, f: 25 };
  }, [dietSettings.macroFocus]);

  const targetProtein = useMemo(() => Math.round((calorieTarget * (macroDist.p / 100)) / 4), [calorieTarget, macroDist]);
  const targetCarbs = useMemo(() => Math.round((calorieTarget * (macroDist.c / 100)) / 4), [calorieTarget, macroDist]);
  const targetFats = useMemo(() => Math.round((calorieTarget * (macroDist.f / 100)) / 9), [calorieTarget, macroDist]);

  const nutritionData = useMemo(() => {
    const defaultMeals = [];

    if (typeof window === 'undefined') {
      return { meals: defaultMeals, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 };
    }

    const saved = localStorage.getItem('wg_meals_log');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const refDate = new Date(selectedDate);
          
          const filteredMeals = parsed.filter(meal => {
            let mealDate = new Date();
            if (meal.id && meal.id.length > 5 && !isNaN(parseInt(meal.id))) {
              mealDate = new Date(parseInt(meal.id));
            }
            if (isNaN(mealDate.getTime())) return false;

            if (currentFilter === 'Today') {
              return mealDate.getFullYear() === refDate.getFullYear() &&
                     mealDate.getMonth() === refDate.getMonth() &&
                     mealDate.getDate() === refDate.getDate();
            }
            
            if (currentFilter === 'Weekly') {
              const refDay = refDate.getDay();
              const diffToMonday = refDay === 0 ? -6 : 1 - refDay;
              const startOfWeek = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + diffToMonday);
              startOfWeek.setHours(0, 0, 0, 0);
              
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 7);
              
              return mealDate >= startOfWeek && mealDate < endOfWeek;
            }
            
            if (currentFilter === 'Monthly') {
              return mealDate.getFullYear() === refDate.getFullYear() &&
                     mealDate.getMonth() === refDate.getMonth();
            }
            
            if (currentFilter === 'Yearly') {
              return mealDate.getFullYear() === refDate.getFullYear();
            }
            
            return true;
          });

          const totalCals = filteredMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
          const totalProtein = filteredMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
          const totalCarbs = filteredMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
          const totalFats = filteredMeals.reduce((acc, m) => acc + (m.fats || 0), 0);
          return {
            meals: filteredMeals,
            totalCalories: totalCals,
            totalProtein,
            totalCarbs,
            totalFats
          };
        }
      } catch (e) {
        // Fallback to defaults
      }
    }
    return {
      meals: defaultMeals,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0
    };
  }, [currentFilter, selectedDate]);

  const scaledTargets = useMemo(() => {
    const refDate = new Date(selectedDate);
    let scaleMultiplier = 1;
    let label = 'Daily';

    if (currentFilter === 'Weekly') {
      scaleMultiplier = 7;
      label = 'Weekly';
    } else if (currentFilter === 'Monthly') {
      const year = refDate.getFullYear();
      const month = refDate.getMonth();
      scaleMultiplier = new Date(year, month + 1, 0).getDate();
      label = 'Monthly';
    } else if (currentFilter === 'Yearly') {
      scaleMultiplier = 365;
      label = 'Yearly';
    }

    const scaledCalories = calorieTarget * scaleMultiplier;
    const pTarget = Math.round((scaledCalories * (macroDist.p / 100)) / 4);
    const cTarget = Math.round((scaledCalories * (macroDist.c / 100)) / 4);
    const fTarget = Math.round((scaledCalories * (macroDist.f / 100)) / 9);

    return {
      calories: scaledCalories,
      protein: pTarget,
      carbs: cTarget,
      fats: fTarget,
      label
    };
  }, [currentFilter, selectedDate, calorieTarget, macroDist]);

  const mealsPreviewLabel = useMemo(() => {
    if (currentFilter === 'Today') return "Today's Meals Preview";
    if (currentFilter === 'Weekly') return "Weekly Meals Preview";
    if (currentFilter === 'Monthly') return "Monthly Meals Preview";
    if (currentFilter === 'Yearly') return "Yearly Meals Preview";
    return "Meals Preview";
  }, [currentFilter]);

  const calculatedWellnessIndex = useMemo(() => {
    const targetCals = scaledTargets.calories;
    
    // 1. Workout sets score (target 5 completed sets in past 7 days)
    let setCounter = 0;
    filteredLogs.forEach(log => {
      if (log.exercises) {
        log.exercises.forEach(ex => {
          if (ex.sets) {
            ex.sets.forEach(s => {
              if (s.completed) setCounter++;
            });
          }
        });
      }
    });
    const workoutScore = Math.min(100, Math.max(0, (setCounter / 5) * 100));

    // 2. Nutrition score (how close to target calories)
    const currentCals = nutritionData.totalCalories;
    const nutritionScore = Math.max(0, 100 - Math.abs((currentCals - targetCals) / (targetCals || 1)) * 100);

    return Math.round(workoutScore * 0.50 + nutritionScore * 0.50);
  }, [filteredLogs, nutritionData, scaledTargets]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-150 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-slide-up">
      
      {/* 1. Header Panel */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Health & Fitness <span className="text-gradient">Dashboard</span>
          </h2>
          <p className="text-text-secondary mt-2 text-xs sm:text-sm">
            Track workouts, energy expenditure, target muscle groups, and training trends in one place.
          </p>
        </div>
      </div>

      {/* 2. Top KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Sessions */}
        <div className="bg-[#12121a] rounded-[2rem] p-5 shadow-sm border border-white/10 text-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple shrink-0">
            <Flame className="w-5 h-5 fill-accent-purple" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Sessions Completed</span>
            <span className="font-heading font-black text-2xl text-[#ededed] block mt-0.5">
              {metrics?.totalWorkouts || 0}
            </span>
          </div>
        </div>

        {/* Total Active Duration */}
        <div className="bg-[#12121a] rounded-[2rem] p-5 shadow-sm border border-white/10 text-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Active Duration</span>
            <span className="font-heading font-black text-2xl text-[#ededed] block mt-0.5">
              {formatDuration(metrics?.totalDurationSeconds || 0)}
            </span>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-[#12121a] rounded-[2rem] p-5 shadow-sm border border-white/10 text-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 border border-accent-indigo/20 flex items-center justify-center text-accent-indigo shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Volume Lifted</span>
            <span className="font-heading font-black text-xl sm:text-2xl text-[#ededed] block mt-0.5">
              {(metrics?.totalVolumeLifted || 0).toLocaleString()} kg
            </span>
          </div>
        </div>

        {/* Consistency */}
        <div className="bg-[#12121a] rounded-[2rem] p-5 shadow-sm border border-white/10 text-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center text-accent-amber shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Consistency (7d)</span>
            <span className="font-heading font-black text-2xl text-[#ededed] block mt-0.5">
              {metrics?.workoutsPast7Days || 0}
            </span>
          </div>
        </div>

      </div>

      {/* 3. Section 1 Layout: Energy Burn (Left) & Nutrition Intake (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column (6 Cols) - Donut/Pie Chart */}
        <div className="lg:col-span-6 bg-[#12121a] rounded-[2rem] p-6 shadow-sm border border-white/10 space-y-6 flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-orange-50/10 flex items-center justify-center text-orange-500 border border-orange-500/25">
                  <Zap className="w-4 h-4 fill-orange-500" />
                </div>
                <span className="font-heading font-extrabold text-sm text-[#ededed]">Workouts Energy</span>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mt-4">
              <h4 className="font-heading font-black text-4xl text-[#ededed] tracking-tight">
                {dynamicEnergyWorkouts.toLocaleString()}
              </h4>
              <span className="text-text-secondary text-xs font-semibold ml-0.5">total kcal burned</span>
            </div>
          </div>

          <div className="flex items-center justify-center py-2 relative">
            <svg width="180" height="180" viewBox="0 0 180 180" className="select-none">
              {pieSlices.length > 0 ? (
                <>
                  {pieSlices.map((slice, idx) => {
                    const isSelected = currentSelectedMuscle && currentSelectedMuscle.muscle === slice.muscle;
                    return (
                      <path
                        key={idx}
                        d={slice.pathData}
                        fill={slice.color}
                        stroke={isSelected ? "#ffffff" : "none"}
                        strokeWidth={isSelected ? "2" : "0"}
                        className={`donut-slice-path transition-all hover:opacity-95 cursor-pointer origin-center ${isSelected ? 'scale-[1.03] drop-shadow-lg' : 'opacity-85 hover:opacity-100'}`}
                        onClick={() => setActivePieMuscle(slice.muscle)}
                        title={`${slice.muscle}: ${slice.calories} kcal (${slice.percent}%)`}
                      />
                    );
                  })}
                  <circle cx="90" cy="90" r="35" className="donut-center-circle fill-[#12121a]" />
                </>
              ) : (
                <circle cx="90" cy="90" r="60" className="donut-empty-circle fill-[#161624]" />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] text-text-secondary uppercase tracking-widest font-extrabold font-heading">Energy</span>
              <span className="font-heading font-black text-sm text-[#ededed] mt-0.5">Burn</span>
            </div>
          </div>

          {topMuscleGroup ? (
            <div className="bg-[#a389f4]/10 rounded-2xl p-3 border border-[#a389f4]/25 flex items-center gap-2">
              <span className="text-base">🔥</span>
              <div className="text-left">
                <span className="text-[10px] text-text-muted font-bold uppercase block">Top Muscle Burn</span>
                <span className="text-xs font-black text-[#ededed]">
                  {topMuscleGroup.muscle} ({topMuscleGroup.calories} kcal, {topMuscleGroup.sets} sets)
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#161624] rounded-2xl p-3 border border-white/10 flex items-center gap-2">
              <span className="text-base">💪</span>
              <div className="text-left">
                <span className="text-[10px] text-text-muted font-bold uppercase block">Top Muscle Burn</span>
                <span className="text-xs font-semibold text-[#a0a0b8]">
                  No workouts logged yet.
                </span>
              </div>
            </div>
          )}

          {/* Breakdown progress bars */}
          <div className="space-y-3 pt-2">
            {currentSelectedMuscle ? (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-[#ededed]">
                  <span>{currentSelectedMuscle.percent}% share</span>
                  <span className="flex items-center gap-1.5 font-medium text-[#a0a0b8] font-semibold">
                    {currentSelectedMuscle.muscle} ({currentSelectedMuscle.calories} kcal)
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: currentSelectedMuscle.color }} />
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#161624]/60 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${currentSelectedMuscle.percent}%`, backgroundColor: currentSelectedMuscle.color }} />
                </div>
                <div className="text-[10px] text-text-muted text-right italic mt-1.5">
                  Click on other pie slices to inspect their energy share.
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-text-muted italic">
                No muscle energy burn recorded.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (6 Cols) - Nutrition Analysis */}
        <div className="lg:col-span-6 bg-[#12121a] rounded-[2rem] p-6 shadow-sm border border-white/10 space-y-6 flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/25">
                  <Apple className="w-4 h-4 fill-emerald-500" />
                </div>
                <span className="font-heading font-extrabold text-sm text-[#ededed]">Nutrition & Calorie Intake</span>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('nutrition')}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[#ededed] text-[10px] font-bold transition-all cursor-pointer shadow-sm"
              >
                Log Meals 🥗
              </button>
            </div>

            <div className="flex items-baseline gap-1 mt-4">
              <h4 className="font-heading font-black text-4xl text-[#ededed] tracking-tight">
                {nutritionData.totalCalories.toLocaleString()}
              </h4>
              <span className="text-text-secondary text-xs font-semibold ml-0.5">/ {scaledTargets.calories.toLocaleString()} kcal consumed</span>
            </div>

            {/* Calorie Progress Bar */}
            <div className="w-full bg-[#161624]/60 h-2.5 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-accent-cyan rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((nutritionData.totalCalories / (scaledTargets.calories || 1)) * 100))}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-text-secondary">
              <span>{Math.round((nutritionData.totalCalories / (scaledTargets.calories || 1)) * 100)}% of {scaledTargets.label} Target</span>
              <span className={scaledTargets.calories - nutritionData.totalCalories >= 0 ? 'text-accent-emerald' : 'text-accent-rose'}>
                {scaledTargets.calories - nutritionData.totalCalories >= 0
                  ? `${(scaledTargets.calories - nutritionData.totalCalories).toLocaleString()} kcal remaining`
                  : `${Math.abs(scaledTargets.calories - nutritionData.totalCalories).toLocaleString()} kcal over target`}
              </span>
            </div>
          </div>

          {/* Macro Breakdown Rows */}
          <div className="grid grid-cols-3 gap-3 bg-[#161624]/40 rounded-2xl p-3 border border-white/5">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold text-[#ededed]">
                <span>Protein</span>
                <span className="text-[#a0a0b8]">{nutritionData.totalProtein}g</span>
              </div>
              <div className="w-full bg-[#161624] h-1.5 rounded-full overflow-hidden font-medium">
                <div
                  className="bg-[#f43f5e] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((nutritionData.totalProtein / (scaledTargets.protein || 1)) * 100))}%` }}
                />
              </div>
              <span className="text-[8px] text-[#a0a0b8] font-bold block">{scaledTargets.protein}g target</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold text-[#ededed]">
                <span>Carbs</span>
                <span className="text-[#a0a0b8]">{nutritionData.totalCarbs}g</span>
              </div>
              <div className="w-full bg-[#161624] h-1.5 rounded-full overflow-hidden font-medium">
                <div
                  className="bg-[#f59e0b] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((nutritionData.totalCarbs / (scaledTargets.carbs || 1)) * 100))}%` }}
                />
              </div>
              <span className="text-[8px] text-[#a0a0b8] font-bold block">{scaledTargets.carbs}g target</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold text-[#ededed]">
                <span>Fats</span>
                <span className="text-[#a0a0b8]">{nutritionData.totalFats}g</span>
              </div>
              <div className="w-full bg-[#161624] h-1.5 rounded-full overflow-hidden font-medium">
                <div
                  className="bg-[#06b6d4] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((nutritionData.totalFats / (scaledTargets.fats || 1)) * 100))}%` }}
                />
              </div>
              <span className="text-[8px] text-[#a0a0b8] font-bold block">{scaledTargets.fats}g target</span>
            </div>
          </div>

          {/* Energy Balance Analysis */}
          <div className="bg-[#161624]/60 rounded-2xl p-3 border border-white/5 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <div>
                <span className="text-[9px] text-[#a0a0b8] font-bold uppercase block">Caloric Energy Balance</span>
                <div className="text-[11px] font-bold text-[#ededed] mt-0.5 leading-tight">
                  Intake ({nutritionData.totalCalories} kcal) vs Burn ({dynamicEnergyWorkouts} kcal)
                </div>
              </div>
            </div>
            
            <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide uppercase shrink-0 ${
              nutritionData.totalCalories - dynamicEnergyWorkouts >= 0
                ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/30'
                : 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30'
            }`}>
              {nutritionData.totalCalories - dynamicEnergyWorkouts >= 0
                ? `Surplus (+${Math.round(nutritionData.totalCalories - dynamicEnergyWorkouts)} kcal)`
                : `Deficit (${Math.round(nutritionData.totalCalories - dynamicEnergyWorkouts)} kcal)`}
            </div>
          </div>

          {/* Logged Meals List */}
          <div className="space-y-2 text-left">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">{mealsPreviewLabel}</span>
            <div className="bg-[#161624] border border-white/5 rounded-2xl p-3 space-y-2.5 max-h-[110px] overflow-y-auto custom-scrollbar">
              {nutritionData.meals.length === 0 ? (
                <div className="text-center py-2 text-[10px] text-text-muted italic">No meals logged for selected period.</div>
              ) : (
                nutritionData.meals.slice(0, 3).map((meal) => (
                  <div key={meal.id} className="flex justify-between items-center text-[11px] border-b border-white/5 pb-2 last:border-b-0 last:pb-0 font-medium">
                    <div>
                      <span className="font-bold text-[#ededed] block line-clamp-1">{meal.name}</span>
                      <span className="text-[9px] text-[#a0a0b8] flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                          meal.type === 'Breakfast' ? 'bg-orange-400' :
                          meal.type === 'Lunch' ? 'bg-blue-400' :
                          meal.type === 'Dinner' ? 'bg-indigo-400' : 'bg-amber-400'
                        }`} />
                        {meal.type} · P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fats}g
                      </span>
                    </div>
                    <span className="font-black text-white shrink-0 ml-2">{meal.calories} kcal</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 3.5. Section 1.5 Layout: Activity + Wellness (Left) & Consistency Calendar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 Cols) - Activity + Wellness */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activity Time */}
            <div className="bg-[#12121a] rounded-[2rem] p-5 shadow-sm border border-white/10 flex flex-col justify-between h-[180px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="font-heading font-extrabold text-sm text-[#ededed]">Activity Time</span>
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <h4 className="font-heading font-black text-4xl text-[#ededed] tracking-tight">{calculatedActiveMinutes}</h4>
                <span className="text-text-secondary text-xs font-semibold ml-0.5">Min</span>
              </div>
              <div className="text-[10px] text-text-secondary font-bold flex items-center justify-between pt-2.5 border-t border-white/10">
                <span>Active Workout Tracking</span>
                <span className="text-cyan-500">👟 Active</span>
              </div>
            </div>

            {/* Wellness Index */}
            <div className="bg-[#12121a] rounded-[2rem] p-5 shadow-sm border border-white/10 flex flex-col justify-between h-[180px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                    <Percent className="w-4 h-4" />
                  </div>
                  <span className="font-heading font-extrabold text-sm text-[#ededed]">Wellness Index</span>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <h4 className="font-heading font-black text-4xl text-[#ededed] tracking-tight">{calculatedWellnessIndex}%</h4>
                <div className="px-2 py-0.5 rounded-full bg-[#d6fa46] text-[#1e1f22] text-[9px] font-black tracking-wide">Dynamic</div>
              </div>
              <div className="text-[10px] text-text-secondary font-bold text-center pt-2.5 border-t border-white/10">
                Workout & Nutrition Index
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (7 Cols) - Consistency Calendar */}
        <div className="lg:col-span-7">
          <div className="bg-[#12121a] rounded-[2rem] p-6 shadow-sm border border-white/10 text-white space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-extrabold text-sm text-[#ededed] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent-purple" />
                  Consistency Calendar
                </h3>
                <p className="text-xs text-text-muted mt-0.5 font-semibold">Track your workout frequency and stay accountable.</p>
              </div>
            </div>

            {/* Weekly View */}
            {calendarView === 'weekly' && (
              <div className="space-y-4">
                <div className="flex gap-2 sm:gap-3.5 overflow-x-auto pb-1 max-w-md">
                  {(() => {
                    const now = new Date();
                    const currentDay = now.getDay();
                    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
                    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
                    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    
                    return dayNames.map((name, i) => {
                      const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
                      const dStr = getLocalDateString(dayDate);
                      const active = activeDaysMap.has(dStr);
                      const isToday = dStr === getLocalDateString(new Date());
                      
                      return (
                        <div 
                          key={i} 
                          onClick={() => dStr && setSelectedCalDay(selectedCalDay === dStr ? null : dStr)}
                          className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none min-w-[50px] ${
                            active 
                              ? 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple' 
                              : isToday 
                                ? 'bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan font-black' 
                                : 'border-white/10 bg-[#161624] hover:bg-white/5'
                          }`}
                        >
                          <span className="text-[9px] text-text-muted font-bold uppercase">{name}</span>
                          <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                            active
                              ? 'bg-gradient-to-br from-accent-indigo to-accent-purple border-accent-purple text-white shadow shadow-accent-purple/20 scale-105'
                              : isToday
                              ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan'
                              : 'border-white/10 bg-[#161624]/60 text-text-secondary'
                          }`}>
                            {active ? '✓' : dayDate.getDate()}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Monthly View */}
            {calendarView === 'monthly' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between max-w-sm">
                  <button
                    onClick={() => {
                      if (selectedMonth === 0) {
                        setSelectedMonth(11);
                        setSelectedYear(prev => prev - 1);
                      } else {
                        setSelectedMonth(prev => prev - 1);
                      }
                      setSelectedCalDay(null);
                    }}
                    className="p-1.5 rounded-lg bg-[#161624] hover:bg-white/5 border border-white/10 text-white transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-heading font-black text-xs text-[#ededed] capitalize">
                    {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => {
                      if (selectedMonth === 11) {
                        setSelectedMonth(0);
                        setSelectedYear(prev => prev + 1);
                      } else {
                        setSelectedMonth(prev => prev + 1);
                      }
                      setSelectedCalDay(null);
                    }}
                    className="p-1.5 rounded-lg bg-[#161624] hover:bg-white/5 border border-white/10 text-white transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-w-md">
                  <div className="grid grid-cols-7 gap-2 text-center text-[9px] text-text-muted font-bold uppercase tracking-wider mb-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, idx) => (
                      <div key={idx}>{label}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {getDaysInMonthGrid(selectedMonth, selectedYear).map((dayDate, idx) => {
                      if (!dayDate) return <div key={idx} className="aspect-square bg-transparent"></div>;
                      const dStr = getLocalDateString(dayDate);
                      const active = activeDaysMap.has(dStr);
                      const isToday = dStr === getLocalDateString(new Date());
                      const isSelected = selectedCalDay === dStr;
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedCalDay(isSelected ? null : dStr)}
                          className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer select-none relative ${
                            active
                              ? 'bg-gradient-to-br from-accent-indigo via-accent-purple to-accent-cyan border-none text-white shadow-md shadow-accent-purple/20 scale-100 hover:scale-105'
                              : isToday
                                ? 'bg-[#d6fa46]/20 border-[#d6fa46]/35 text-[#d6fa46]'
                                : isSelected
                                  ? 'bg-[#161624] border-white/20 text-[#ededed]'
                                  : 'bg-[#161624] border-white/5 text-text-secondary hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <span>{dayDate.getDate()}</span>
                          {active && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white"></span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Yearly View */}
            {calendarView === 'yearly' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between max-w-sm">
                  <button
                    onClick={() => { setSelectedYear(prev => prev - 1); setSelectedCalDay(null); }}
                    className="p-1.5 rounded-lg bg-[#161624] hover:bg-white/5 border border-white/10 text-white cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-heading font-black text-xs text-[#ededed] tracking-wider">{selectedYear}</span>
                  <button
                    onClick={() => { setSelectedYear(prev => prev + 1); setSelectedCalDay(null); }}
                    className="p-1.5 rounded-lg bg-[#161624] hover:bg-white/5 border border-white/10 text-white cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 12 }).map((_, monthIdx) => {
                    const monthDate = new Date(selectedYear, monthIdx, 1);
                    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
                    const gridDays = getDaysInMonthGrid(monthIdx, selectedYear);
                    
                    return (
                      <div key={monthIdx} className="bg-[#161624] border border-white/5 rounded-2xl p-3 space-y-2">
                        <span className="font-heading font-bold text-[10px] text-[#ededed] capitalize block border-b border-white/5 pb-1">
                          {monthName}
                        </span>
                        <div className="grid grid-cols-7 gap-0.5">
                          {gridDays.map((dayDate, dayIdx) => {
                            if (!dayDate) return <div key={dayIdx} className="w-2 h-2 bg-transparent"></div>;
                            const dStr = getLocalDateString(dayDate);
                            const active = activeDaysMap.has(dStr);
                            const isToday = dStr === getLocalDateString(new Date());
                            
                            return (
                              <div
                                key={dayIdx}
                                onClick={() => setSelectedCalDay(selectedCalDay === dStr ? null : dStr)}
                                className={`w-2 h-2 rounded-[2px] cursor-pointer transition-all ${
                                  active
                                    ? 'bg-gradient-to-br from-accent-indigo to-accent-purple text-white shadow shadow-accent-purple/20'
                                    : isToday
                                      ? 'bg-accent-cyan/40 border border-accent-cyan/50'
                                      : 'bg-white/10 hover:bg-white/20'
                                }`}
                                title={dStr + (active ? ' (Workout logged)' : '')}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected day logs drilldown */}
            {selectedCalDay && (
              <div className="border-t border-white/10 pt-4 space-y-3 animate-fade-in text-left">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-xs text-[#ededed] flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
                    Logs on {new Date(selectedCalDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </h4>
                  <button
                    onClick={() => setSelectedCalDay(null)}
                    className="text-[10px] text-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    Close ✕
                  </button>
                </div>

                {activeDaysMap.has(selectedCalDay) ? (
                  <div className="space-y-2.5">
                    {activeDaysMap.get(selectedCalDay).map((log) => {
                      let totalWeight = 0;
                      let completedSets = 0;
                      log.exercises?.forEach(ex => {
                        ex.sets?.forEach(s => {
                          if (s.completed) {
                            completedSets++;
                            totalWeight += (s.weight || 0);
                          }
                        });
                      });

                      return (
                        <div 
                          key={log.id}
                          className="bg-[#161624] border border-white/5 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <span className="font-bold text-[#ededed] text-xs">{log.name}</span>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-secondary mt-1 items-center font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(log.durationSeconds)}
                              </span>
                              {(log.date || log.loggedAt) && (
                                <>
                                  <span>·</span>
                                  <span>
                                    {new Date(log.date || log.loggedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </span>
                                </>
                              )}
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
                          <button
                            onClick={() => setEditingLog(log)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#12121a] border border-white/10 hover:bg-accent-cyan/10 hover:text-accent-cyan text-white text-[10px] font-bold transition-all cursor-pointer shrink-0 self-start sm:self-auto shadow-sm"
                          >
                            Edit Log
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic">No workouts completed on this date.</p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Section 2 Layout: Heatmap Card (Full Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* SVG Muscle Heatmap */}
        <div className="lg:col-span-12 bg-[#12121a] rounded-[2rem] p-6 shadow-sm border border-white/10 text-white flex flex-col justify-between min-h-[460px]">
          <div>
            <h3 className="font-heading font-extrabold text-sm text-[#ededed]">Interactive Muscle Heatmap</h3>
            <p className="text-xs text-text-secondary mt-1 font-semibold">Cumulative volume (kg) logged per muscle group {filterLabel}.</p>
          </div>

          <div className="flex-grow flex items-center justify-center py-2">
            <svg viewBox="0 0 400 240" className="w-full max-h-[320px] select-none">
              <circle cx="100" cy="30" r="10" fill="var(--heatmap-outline-fill, rgba(255,255,255,0.06))" stroke="var(--heatmap-outline-stroke, rgba(255,255,255,0.12))" strokeWidth="1" />
              <polygon points="97,40 103,40 102,52 98,52" fill="var(--heatmap-outline-fill, rgba(255,255,255,0.06))" stroke="var(--heatmap-outline-stroke, rgba(255,255,255,0.12))" strokeWidth="1" />
              <polygon points="94,108 106,108 105,122 95,122" fill="var(--heatmap-outline-fill, rgba(255,255,255,0.06))" stroke="var(--heatmap-outline-stroke, rgba(255,255,255,0.12))" strokeWidth="1" />
              <polygon points="78,220 86,220 86,228 74,228" fill="var(--heatmap-outline-fill, rgba(255,255,255,0.06))" stroke="var(--heatmap-outline-stroke, rgba(255,255,255,0.12))" strokeWidth="1" />
              <polygon points="122,220 114,220 114,228 126,228" fill="var(--heatmap-outline-fill, rgba(255,255,255,0.06))" stroke="var(--heatmap-outline-stroke, rgba(255,255,255,0.12))" strokeWidth="1" />

              <circle cx="300" cy="30" r="10" fill="var(--heatmap-outline-fill, rgba(255,255,255,0.06))" stroke="var(--heatmap-outline-stroke, rgba(255,255,255,0.12))" strokeWidth="1" />
              <polygon points="297,40 303,40 302,52 298,52" fill="var(--heatmap-outline-fill, rgba(255,255,255,0.06))" stroke="var(--heatmap-outline-stroke, rgba(255,255,255,0.12))" strokeWidth="1" />
              <polygon points="294,108 306,108 305,126 295,126" fill="var(--heatmap-outline-fill, rgba(255,255,255,0.06))" stroke="var(--heatmap-outline-stroke, rgba(255,255,255,0.12))" strokeWidth="1" />
              <polygon points="278,220 286,220 286,228 274,228" fill="var(--heatmap-outline-fill, rgba(255,255,255,0.06))" stroke="var(--heatmap-outline-stroke, rgba(255,255,255,0.12))" strokeWidth="1" />
              <polygon points="322,220 314,220 314,228 326,228" fill="var(--heatmap-outline-fill, rgba(255,255,255,0.06))" stroke="var(--heatmap-outline-stroke, rgba(255,255,255,0.12))" strokeWidth="1" />

              <text x="100" y="235" textAnchor="middle" fill="var(--heatmap-text, #60626a)" fontSize="8" fontWeight="bold" opacity="0.6">FRONT VIEW</text>
              <text x="300" y="235" textAnchor="middle" fill="var(--heatmap-text, #60626a)" fontSize="8" fontWeight="bold" opacity="0.6">BACK VIEW</text>

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
                            stroke: '#1e1f22'
                          } : {})
                        }}
                      />
                    ))}
                  </g>
                );
              })}

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
                            stroke: '#1e1f22'
                          } : {})
                        }}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-left">
            <div className="text-[10px] text-text-secondary">
              {hoveredGroup ? (
                <span className="font-semibold text-[#ededed] animate-fade-in flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-purple animate-ping"></span>
                  {hoveredGroup}: <strong className="text-accent-indigo">{recentVolumes[hoveredGroup]?.toLocaleString() || 0} kg</strong>
                </span>
              ) : (
                <span className="text-text-muted font-medium">Hover muscles to inspect volume {filterLabel}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-text-muted font-bold">
              <span>Cold</span>
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-red-500"></div>
              <span>Hot</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Section 3 Layout: Recent Volume Trend (Left, 7 Cols) & Muscle Focus (Right, 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column (7 Cols) - Volume Trend Chart */}
        <div className="lg:col-span-7 bg-[#12121a] rounded-[2rem] p-6 shadow-sm border border-white/10 text-white flex flex-col justify-between h-[280px]">
          <div>
            <h3 className="font-heading font-extrabold text-sm text-[#ededed]">Volume Trend</h3>
            <p className="text-xs text-[#a0a0b8] mt-1 font-semibold">Total weight load lifted in sessions {filterLabel}.</p>
          </div>
          <div className="h-[200px] w-full flex items-center justify-center">
            {renderSVGChart()}
          </div>
        </div>

        {/* Right Column (5 Cols) - Muscle Focus list */}
        <div className="lg:col-span-5 bg-[#12121a] rounded-[2rem] p-6 shadow-sm border border-white/10 text-white flex flex-col justify-between h-[280px]">
          <div>
            <h3 className="font-heading font-extrabold text-sm text-[#ededed]">Muscle Focus Breakdown</h3>
            <p className="text-xs text-[#a0a0b8] mt-1 font-semibold">Distribution frequency based on sets logged per target muscle.</p>
          </div>

          <div className="space-y-3 pt-4 overflow-y-auto max-h-[190px] pr-1 custom-scrollbar text-left font-medium">
            {metrics && Object.keys(metrics.muscleFrequency).length > 0 ? (
              Object.entries(metrics.muscleFrequency)
                .sort((a, b) => b[1] - a[1])
                .map(([muscle, freq]) => {
                  const maxFreq = Math.max(...Object.values(metrics.muscleFrequency));
                  const percentage = Math.round((freq / maxFreq) * 100);
                  return (
                    <div key={muscle} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-[#ededed]">
                        <span>{muscle}</span>
                        <span className="text-[#a0a0b8]">{freq} sets</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#161624] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent-indigo to-accent-purple rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-xs text-text-muted italic">No muscle breakdown logged yet.</div>
            )}
          </div>
        </div>

      </div>

      {/* 6. Section 4 Layout: AI Coach Advice */}
      <div className="bg-[#12121a] rounded-[2rem] p-6 shadow-sm border border-white/10 text-white space-y-5">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent-purple" />
            <h3 className="font-heading font-extrabold text-sm text-[#ededed]">AI Coach Insights & Optimization</h3>
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
            <div className="h-4 bg-[#161624] rounded w-full"></div>
            <div className="h-4 bg-[#161624] rounded w-5/6"></div>
            <div className="h-4 bg-[#161624] rounded w-4/5"></div>
          </div>
        ) : aiInsights ? (
          <div className="space-y-5 animate-fade-in text-sm leading-relaxed text-left">
            
            <div className="p-4 rounded-xl bg-accent-purple/5 border border-accent-purple/10 text-[#ededed] italic font-semibold">
              "{aiInsights.summary}"
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-xs font-black text-accent-emerald uppercase tracking-wider block font-heading">
                  Observed Strengths
                </span>
                <ul className="space-y-1.5">
                  {aiInsights.strengths.map((str, idx) => (
                    <li key={idx} className="text-[#a0a0b8] text-xs flex items-start gap-2 font-semibold">
                      <span className="text-accent-emerald mt-0.5">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black text-accent-rose uppercase tracking-wider block font-heading">
                  Areas to Optimize
                </span>
                <ul className="space-y-1.5">
                  {aiInsights.weaknesses.map((weak, idx) => (
                    <li key={idx} className="text-[#a0a0b8] text-xs flex items-start gap-2 font-semibold">
                      <span className="text-accent-rose mt-0.5">!</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-accent-cyan uppercase tracking-wider block font-heading">
                Coach Recommendations
              </span>
              <ul className="space-y-1.5">
                {aiInsights.optimizationRecommendations.map((rec, idx) => (
                  <li key={idx} className="text-text-secondary text-xs flex items-start gap-2 font-semibold">
                    <span className="text-accent-cyan mt-0.5">·</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-black/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-black text-[#1e1f22] block font-heading">Next Workout Recommendation</span>
                <p className="text-xs text-text-secondary font-semibold max-w-lg">
                  {aiInsights.suggestedNextWorkout}
                </p>
              </div>
              <button
                onClick={() => handlePrefillClick(aiInsights.suggestedNextWorkout)}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-[#1e1f22] text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
              >
                Pre-fill Generator
              </button>
            </div>

          </div>
        ) : (
          <div className="text-center py-6 text-xs text-text-muted font-semibold">
            Click "Generate Advice" to analyze your logs and get AI-powered insights on your consistency, overload, and muscle imbalances.
          </div>
        )}
      </div>

      {/* Edit Log Modal */}
      <AddWorkoutModal
        isOpen={!!editingLog}
        onClose={() => setEditingLog(null)}
        logToEdit={editingLog}
        onSaveSuccess={loadData}
        showToast={showToast}
      />

    </div>
  );
};
