import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Activity, Flame, Dumbbell, Save, Award, Scale, HelpCircle,
  Calendar, History, Play, Trash2, Clock, ChevronDown, ChevronUp, Plus, Settings, Search, Zap, CheckCircle
} from 'lucide-react';
import { generateBlueprint } from '@/lib/generator';
import {
  getWorkouts,
  deleteWorkout,
  getRoutines,
  deleteRoutine,
  getWorkoutLogs,
  deleteWorkoutLog
} from '@/lib/storage';
import AddWorkoutModal from './AddWorkoutModal';

export default function ProfileTab({ 
  user, 
  onUpdateUser, 
  onStartWorkout, 
  onInspectWorkout, 
  onInspectRoutine, 
  showToast 
}) {
  // Navigation inside the profile
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview', 'workouts', 'routines', 'history', 'settings'

  // Storage data states
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [savedRoutines, setSavedRoutines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Search filter for workouts
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable logs & manual entry state
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('male');
  const [goal, setGoal] = useState('hypertrophy');
  const [fitnessLevel, setFitnessLevel] = useState('intermediate');
  const [selectedInjuries, setSelectedInjuries] = useState([]);
  const [customInjury, setCustomInjury] = useState('');
  const [frequency, setFrequency] = useState(4);
  const [equipment, setEquipment] = useState('Full Gym');
  const [focusMuscles, setFocusMuscles] = useState([]);
  const [aiBlueprint, setAiBlueprint] = useState(null);
  const [analyzingProfile, setAnalyzingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch all personal data from IndexedDB / Storage layer
  const fetchProfileData = async () => {
    setLoadingData(true);
    try {
      const [wList, rList, lList] = await Promise.all([
        getWorkouts(),
        getRoutines(),
        getWorkoutLogs()
      ]);
      setSavedWorkouts(wList || []);
      setSavedRoutines(rList || []);
      setLogs(lList || []);
    } catch (err) {
      console.error('Failed to load storage items inside ProfileTab:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Pre-fill form from user profile object
  useEffect(() => {
    if (user && user.profile) {
      const p = user.profile;
      setAge(p.age || '');
      setWeight(p.weight || '');
      setTargetWeight(p.target_weight || p.targetWeight || '');
      setHeight(p.height || '');
      setGender(p.gender || 'male');
      setGoal(p.goal || 'hypertrophy');
      setFitnessLevel(p.fitness_level || 'intermediate');
      setSelectedInjuries(p.selected_injuries || []);
      setCustomInjury(p.custom_injury || '');
      setFrequency(p.frequency || 4);
      setEquipment(p.equipment || 'Full Gym');
      setFocusMuscles(p.focus_muscles || []);
      setAiBlueprint(p.ai_program_summary || null);
    }
  }, [user]);

  // Compute Dashboard Metrics based on logs
  const metrics = useMemo(() => {
    if (!logs.length) return null;

    let totalWorkouts = logs.length;
    let totalDurationSeconds = 0;
    let totalVolumeLifted = 0;

    logs.forEach(log => {
      totalDurationSeconds += log.durationSeconds || 0;
      let logVolume = 0;
      if (log.exercises) {
        log.exercises.forEach(ex => {
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
      totalVolumeLifted
    };
  }, [logs]);

  // Milestone Achievements
  const achievements = useMemo(() => {
    const defaultMetrics = metrics || { totalWorkouts: 0, totalVolumeLifted: 0, totalDurationSeconds: 0 };
    return [
      {
        id: 'first_step',
        title: 'First Step',
        desc: 'Log your first workout session',
        unlocked: defaultMetrics.totalWorkouts >= 1,
        icon: '🚀'
      },
      {
        id: 'consistent_runner',
        title: 'Consistent Runner',
        desc: 'Complete 3 workout logs',
        unlocked: defaultMetrics.totalWorkouts >= 3,
        icon: '🏃'
      },
      {
        id: 'heavy_lifter',
        title: 'Heavy Lifter',
        desc: 'Lift 5,000 kg in total volume',
        unlocked: defaultMetrics.totalVolumeLifted >= 5000,
        icon: '🏋️'
      },
      {
        id: 'iron_warrior',
        title: 'Iron Warrior',
        desc: 'Lift 20,000 kg in total volume',
        unlocked: defaultMetrics.totalVolumeLifted >= 20000,
        icon: '👑'
      },
      {
        id: 'time_warrior',
        title: 'Time Warrior',
        desc: 'Accumulate 3 hours of training',
        unlocked: defaultMetrics.totalDurationSeconds >= 10800,
        icon: '⏱️'
      }
    ];
  }, [metrics]);

  const gamification = useMemo(() => {
    const workouts = logs.length;
    let durationSeconds = 0;
    let volumeLifted = 0;

    logs.forEach(log => {
      durationSeconds += log.durationSeconds || 0;
      if (log.exercises) {
        log.exercises.forEach(ex => {
          if (Array.isArray(ex.sets)) {
            ex.sets.forEach(set => {
              if (set.completed) {
                volumeLifted += (set.weight || 0);
              }
            });
          }
        });
      }
    });

    // 100 XP per workout, 1 XP per 10kg lifted, 1 XP per 60 seconds training
    const totalXP = (workouts * 100) + Math.floor(volumeLifted / 10) + Math.floor(durationSeconds / 60);
    const xpPerLevel = 1000;
    const level = Math.floor(totalXP / xpPerLevel) + 1;
    const currentLevelXP = totalXP % xpPerLevel;
    const progressPercent = Math.min(100, (currentLevelXP / xpPerLevel) * 100);

    const levelTitles = {
      1: { name: '🥚 Novice Lifter', desc: 'Starting your training journey. Build the habit!' },
      2: { name: '🔨 Iron Apprentice', desc: 'Developing solid fundamentals and form consistency.' },
      3: { name: '🏃 Consistency Cadet', desc: 'Overcoming pain barriers and logging regular sessions.' },
      4: { name: '🏋️ Barbell Baron', desc: 'Pushing heavy volume targets with high efficiency.' },
      5: { name: '⚔️ Steel Warrior', desc: 'Unlocking expert training schedules and intensity.' },
      6: { name: '👑 Beast Mode Legend', desc: 'Achieved elite volume metrics and training consistency.' }
    };
    
    const titleInfo = levelTitles[Math.min(6, level)] || levelTitles[6];

    // Weekly consistency streak calculation
    const dates = logs.map(l => {
      const d = new Date(l.loggedAt || l.date);
      return d.toISOString().split('T')[0];
    });
    const uniqueDates = Array.from(new Set(dates)).sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    if (uniqueDates.length > 0) {
      const getLocalDateString = (d) => {
        const offset = d.getTimezoneOffset();
        const adjustedDate = new Date(d.getTime() - (offset*60*1000));
        return adjustedDate.toISOString().split('T')[0];
      };
      
      const todayStr = getLocalDateString(new Date());
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);
      
      let checkDate = null;
      if (uniqueDates.includes(todayStr)) {
        checkDate = new Date();
        streak = 1;
      } else if (uniqueDates.includes(yesterdayStr)) {
        checkDate = yesterday;
        streak = 1;
      }
      
      if (streak > 0) {
        while (true) {
          checkDate.setDate(checkDate.getDate() - 1);
          const dateStr = getLocalDateString(checkDate);
          if (uniqueDates.includes(dateStr)) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // Weekly checkmark calendar (Monday to Sunday)
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    
    const weekDaysStatus = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const hasLog = dates.includes(dStr);
      weekDaysStatus.push({
        name: dayNames[i],
        dayOfMonth: d.getDate(),
        active: hasLog
      });
    }

    return {
      totalXP,
      level,
      currentLevelXP,
      progressPercent,
      title: titleInfo.name,
      desc: titleInfo.desc,
      streak,
      weekDaysStatus
    };
  }, [logs]);

  // General metrics calculations
  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) return null;
    const bmi = w / Math.pow(h / 100, 2);
    return Math.round(bmi * 10) / 10;
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-accent-amber border-accent-amber/20 bg-accent-amber/5' };
    if (bmi < 25) return { label: 'Normal weight', color: 'text-accent-emerald border-accent-emerald/20 bg-accent-emerald/5' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-accent-amber border-accent-amber/20 bg-accent-amber/5' };
    return { label: 'Obese', color: 'text-accent-rose border-accent-rose/20 bg-accent-rose/5' };
  };

  const calculateTDEE = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    if (!w || !h || !a) return null;

    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (gender === 'male') {
      bmr += 5;
    } else if (gender === 'female') {
      bmr -= 161;
    } else {
      bmr -= 78;
    }
    return Math.round(bmr * 1.375); // moderate multiplier
  };

  const getMacroBreakdown = (tdee) => {
    const w = parseFloat(weight);
    if (!tdee || !w) return null;

    let targetCalories = tdee;
    if (goal === 'fat-loss') {
      targetCalories -= 500;
    } else if (['hypertrophy', 'strength', 'powerlifting'].includes(goal)) {
      targetCalories += 300;
    } else if (['cardio-conditioning', 'endurance'].includes(goal)) {
      targetCalories += 100;
    }

    const proteinGrams = Math.round(w * 2.0);
    const proteinCalories = proteinGrams * 4;
    const fatCalories = Math.round(targetCalories * 0.25);
    const fatGrams = Math.round(fatCalories / 9);
    const remainingCalories = targetCalories - proteinCalories - fatCalories;
    const carbGrams = Math.max(0, Math.round(remainingCalories / 4));

    return {
      calories: targetCalories,
      protein: proteinGrams,
      fats: fatGrams,
      carbs: carbGrams
    };
  };

  const bmi = calculateBMI();
  const bmiCat = getBMICategory(bmi);
  const tdee = calculateTDEE();
  const macros = getMacroBreakdown(tdee);

  // Handlers for deleting resources
  const handleDeleteWorkout = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workout?')) return;
    try {
      await deleteWorkout(id);
      showToast('Workout template deleted', 'info');
      await fetchProfileData();
    } catch (err) {
      showToast('Failed to delete workout', 'error');
    }
  };

  const handleDeleteRoutine = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this routine?')) return;
    try {
      await deleteRoutine(id);
      showToast('Weekly routine deleted', 'info');
      await fetchProfileData();
    } catch (err) {
      showToast('Failed to delete routine', 'error');
    }
  };

  const handleDeleteLog = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this log entry?')) return;
    try {
      await deleteWorkoutLog(id);
      showToast('Workout log deleted', 'info');
      await fetchProfileData();
    } catch (err) {
      showToast('Failed to delete log entry', 'error');
    }
  };

  // Helper date & string formats
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDuration = (totalSecs) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Filtered workouts list
  const filteredWorkouts = useMemo(() => {
    if (!searchQuery.trim()) return savedWorkouts;
    const query = searchQuery.toLowerCase();
    return savedWorkouts.filter(w => 
      w.name?.toLowerCase().includes(query) || 
      w.exercises?.some(ex => ex.name?.toLowerCase().includes(query))
    );
  }, [savedWorkouts, searchQuery]);

  // AI Blueprint Regeneration Trigger
  const handleRegenerateBlueprint = async () => {
    const a = parseInt(age);
    const w = parseFloat(weight);
    const tw = parseFloat(targetWeight);
    const h = parseFloat(height);

    if (!age || isNaN(a) || a < 1 || a > 120) {
      showToast('Please enter a valid age (1-120) before generating a blueprint', 'error');
      return;
    }
    if (!weight || isNaN(w) || w < 10 || w > 500) {
      showToast('Please enter a valid weight (10kg-500kg) before generating a blueprint', 'error');
      return;
    }
    if (!targetWeight || isNaN(tw) || tw < 10 || tw > 500) {
      showToast('Please enter a valid target weight (10kg-500kg) before generating a blueprint', 'error');
      return;
    }
    if (!height || isNaN(h) || h < 50 || h > 300) {
      showToast('Please enter a valid height (50cm-300cm) before generating a blueprint', 'error');
      return;
    }

    setAnalyzingProfile(true);
    showToast('Analyzing stats and generating tailored routine split... 🧠', 'info');

    const injuryText = [
      ...selectedInjuries,
      customInjury.trim()
    ].filter(Boolean).join(', ') || 'None';

    const profileData = {
      age: a,
      gender,
      weight: w,
      target_weight: tw,
      height: h,
      goal,
      fitness_level: fitnessLevel,
      injuries: injuryText,
      frequency: parseInt(frequency),
      equipment,
      focus_muscles: focusMuscles
    };

    let wasFallback = false;
    try {
      const res = await fetch('/api/auth/profile-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileData })
      });

      if (!res.ok) throw new Error('AI analysis failed');

      const contentType = res.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        const jsonRes = await res.json();
        if (jsonRes.fallback && jsonRes.data) {
          wasFallback = true;
          const analysisData = jsonRes.data;
          setAiBlueprint(analysisData);

          const profileSavePayload = {
            ...profileData,
            selected_injuries: selectedInjuries,
            custom_injury: customInjury,
            ai_program_summary: analysisData
          };

          const saveRes = await fetch('/api/auth/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile: profileSavePayload })
          });

          if (!saveRes.ok) throw new Error('Failed to save blueprint to user record');
          const updatedUser = await saveRes.json();

          onUpdateUser(updatedUser);
          localStorage.setItem('wg_user', JSON.stringify(updatedUser));
          showToast('AI generation failed. Falling back to rule-based engine.', 'warning');
          return;
        }
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let analysisData = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          let event;
          try {
            event = JSON.parse(line);
          } catch (jsonErr) {
            console.warn("Error parsing chunk as JSON:", jsonErr);
            continue;
          }
          if (event.status === 'completed') {
            analysisData = event.data;
            if (event.fallback) {
              wasFallback = true;
            }
          } else if (event.status === 'error') {
            throw new Error(event.message);
          }
        }
      }

      if (!analysisData) throw new Error('No blueprint data received from stream');

      setAiBlueprint(analysisData);

      const profileSavePayload = {
        ...profileData,
        selected_injuries: selectedInjuries,
        custom_injury: customInjury,
        ai_program_summary: analysisData
      };

      const saveRes = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileSavePayload })
      });

      if (!saveRes.ok) throw new Error('Failed to save blueprint to user record');
      const updatedUser = await saveRes.json();

      onUpdateUser(updatedUser);
      localStorage.setItem('wg_user', JSON.stringify(updatedUser));

      if (wasFallback) {
        showToast('AI generation failed. Falling back to rule-based engine.', 'warning');
      } else {
        showToast('AI program blueprint successfully generated! 🚀', 'success');
      }
    } catch (err) {
      console.warn('AI blueprint generation failed, falling back to rule-based engine:', err);
      try {
        const fallbackBlueprint = generateBlueprint({ profile: profileData });
        if (!fallbackBlueprint) throw new Error('Could not generate fallback blueprint');
        
        setAiBlueprint(fallbackBlueprint);

        const profileSavePayload = {
          ...profileData,
          selected_injuries: selectedInjuries,
          custom_injury: customInjury,
          ai_program_summary: fallbackBlueprint
        };

        const saveRes = await fetch('/api/auth/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: profileSavePayload })
        });

        if (!saveRes.ok) throw new Error('Failed to save fallback blueprint to user record');
        const updatedUser = await saveRes.json();

        onUpdateUser(updatedUser);
        localStorage.setItem('wg_user', JSON.stringify(updatedUser));
        showToast('AI generation failed. Falling back to rule-based engine.', 'warning');
      } catch (fbErr) {
        console.error('Both AI and fallback blueprint generation failed:', fbErr);
        showToast('Failed to generate program blueprint. Try again.', 'error');
      }
    } finally {
      setAnalyzingProfile(false);
    }
  };

  // Profile configuration form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    const w = parseFloat(weight);
    const tw = parseFloat(targetWeight);
    const h = parseFloat(height);
    const a = parseInt(age);

    if (age && (isNaN(a) || a < 1 || a > 120)) {
      showToast('Please enter a valid age (1-120)', 'error');
      return;
    }
    if (weight && (isNaN(w) || w < 10 || w > 500)) {
      showToast('Please enter a valid weight (10kg-500kg)', 'error');
      return;
    }
    if (targetWeight && (isNaN(tw) || tw < 10 || tw > 500)) {
      showToast('Please enter a valid target weight (10kg-500kg)', 'error');
      return;
    }
    if (height && (isNaN(h) || h < 50 || h > 300)) {
      showToast('Please enter a valid height (50cm-300cm)', 'error');
      return;
    }

    setSaving(true);
    const profile = {
      age: a || null,
      weight: w || null,
      target_weight: tw || null,
      height: h || null,
      gender,
      goal,
      fitness_level: fitnessLevel,
      selected_injuries: selectedInjuries,
      custom_injury: customInjury,
      frequency: parseInt(frequency),
      equipment,
      focus_muscles: focusMuscles,
      ai_program_summary: aiBlueprint
    };

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      
      onUpdateUser(updatedUser);
      localStorage.setItem('wg_user', JSON.stringify(updatedUser));
      showToast('Profile metrics updated successfully! 👤', 'success');
    } catch (err) {
      showToast('Failed to update profile details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="glass-card rounded-2xl p-12 border border-white/5 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 text-text-muted border border-white/5 flex items-center justify-center text-3xl mx-auto shadow-inner">
            👤
          </div>
          <h3 className="font-heading font-bold text-xl text-white">Please Sign In</h3>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">
            You need to be signed in to view and manage your fitness profile, saved library, achievements, and training history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up">
      
      {/* 1. Header Profile Dashboard Widget */}
      <div className="glass-card rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 mb-8 relative overflow-hidden bg-gradient-to-r from-bg-card via-bg-card to-accent-indigo/10">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.name} 
              className="w-16 h-16 rounded-full border-2 border-accent-purple/60 shadow animate-fade-in" 
              onError={(e) => { e.target.src = ''; }} // fallback on error
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-indigo to-accent-purple border border-accent-purple/40 flex items-center justify-center text-white text-3xl font-bold font-heading shadow-md shadow-accent-purple/10">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="space-y-1">
            <h3 className="font-heading font-black text-2xl text-white">{user.name}</h3>
            <p className="text-xs text-text-secondary">{user.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-accent-purple/20 border border-accent-purple/30 text-accent-purple">
                {fitnessLevel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan">
                {goal.replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic User Stats overview */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 bg-black/25 border border-white/5 rounded-2xl p-4 w-full md:w-auto shadow-inner">
          <div className="text-center min-w-[70px]">
            <span className="text-xl font-heading font-black text-white block">{metrics?.totalWorkouts || 0}</span>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mt-1">Logs</span>
          </div>
          <div className="text-center min-w-[70px] border-x border-white/5 px-2">
            <span className="text-xl font-heading font-black text-white block">
              {metrics?.totalVolumeLifted ? (metrics.totalVolumeLifted >= 1000 ? `${(metrics.totalVolumeLifted / 1000).toFixed(1)}k` : metrics.totalVolumeLifted) : 0} kg
            </span>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mt-1">Lifted</span>
          </div>
          <div className="text-center min-w-[70px]">
            <span className="text-xl font-heading font-black text-white block">
              {metrics?.totalDurationSeconds ? Math.round(metrics.totalDurationSeconds / 60) : 0}m
            </span>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mt-1">Time</span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs Selector */}
      <div className="flex bg-white/5 border border-white/5 rounded-2xl p-1 mb-8 overflow-x-auto max-w-full scrollbar-thin">
        {[
          { id: 'overview', label: 'Overview', icon: Award },
          { id: 'workouts', label: 'Saved Workouts', icon: Dumbbell },
          { id: 'routines', label: 'Routines', icon: Calendar },
          { id: 'history', label: 'History & Logs', icon: History },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const IconComponent = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                active
                  ? 'bg-gradient-to-r from-accent-indigo to-accent-purple text-white shadow-md font-bold'
                  : 'text-text-secondary hover:text-white hover:bg-white/3'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Sub-Tab Panels */}
      <div className="animate-fade-in">
        
        {/* TAB: Overview (AI Coach Blueprint, Macro calculations, achievements) */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Gamification Dashboard (XP progress & weekly streak) */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-gradient-to-r from-bg-card via-bg-card to-accent-purple/5">
              
              {/* Level Progress Circle / Details (Col 7) */}
              <div className="md:col-span-7 flex flex-col sm:flex-row items-center gap-6">
                {/* Circular indicator */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                    <circle cx="48" cy="48" r="42" stroke="url(#levelGradient)" strokeWidth="6" fill="transparent"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * gamification.progressPercent) / 100}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="flex flex-col items-center select-none z-10">
                    <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Level</span>
                    <span className="text-3xl font-heading font-black text-white">{gamification.level}</span>
                  </div>
                </div>

                {/* Level Title details */}
                <div className="text-center sm:text-left space-y-1.5 flex-grow">
                  <span className="text-xl font-heading font-black text-white flex items-center justify-center sm:justify-start gap-2">
                    {gamification.title}
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
                    {gamification.desc}
                  </p>
                  
                  {/* Horizontal progress tracker */}
                  <div className="space-y-1 pt-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-text-muted">
                      <span>XP Progress</span>
                      <span>{gamification.currentLevelXP} / 1000 XP</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-accent-indigo to-accent-purple rounded-full"
                        style={{ width: `${gamification.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consistency Streaks & Checkmarks (Col 5) */}
              <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6 space-y-4">
                
                {/* Streak counter */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-rose/10 border border-accent-rose/20 flex items-center justify-center text-accent-rose text-lg shadow-inner">
                    🔥
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider block">Consistency Streak</span>
                    <span className="text-base font-heading font-extrabold text-white flex items-center gap-1.5">
                      {gamification.streak} {gamification.streak === 1 ? 'Active Day' : 'Consecutive Days'}
                    </span>
                  </div>
                </div>

                {/* Weekly calendar checkboxes */}
                <div className="space-y-2">
                  <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Weekly Consistency</span>
                  <div className="grid grid-cols-7 gap-1">
                    {gamification.weekDaysStatus.map((day, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <span className="text-[8px] text-text-muted font-extrabold uppercase">{day.name}</span>
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${
                          day.active
                            ? 'bg-accent-emerald/20 border-accent-emerald/30 text-accent-emerald shadow-lg shadow-accent-emerald/5'
                            : 'bg-white/2 border-white/5 text-text-secondary'
                        }`}
                          title={`${day.name} ${day.dayOfMonth} ${day.active ? '(Completed)' : '(No log)'}`}
                        >
                          {day.active ? <CheckCircle className="w-4 h-4 stroke-[2.5px]" /> : day.dayOfMonth}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left side: AI blueprint and metrics calculations */}
            <div className="lg:col-span-7 space-y-6">
              
              {(!weight || !height || !age) ? (
                <div className="glass-card rounded-2xl p-10 text-center border border-white/5 shadow-xl space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 text-text-muted flex items-center justify-center text-2xl mx-auto border border-white/5">
                    📊
                  </div>
                  <h3 className="font-heading font-bold text-white text-base">Metrics Required</h3>
                  <p className="text-text-secondary text-xs max-w-xs mx-auto">
                    Fill in your age, weight, and height in the <strong>Settings</strong> tab to unlock real-time physiological analytics.
                  </p>
                </div>
              ) : (
                <>
                  {/* AI Tailored Program Blueprint Card */}
                  {aiBlueprint ? (
                    <div className="glass-card rounded-2xl p-6 border border-accent-purple/20 shadow-xl space-y-6 animate-fade-in relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-16 h-16 bg-accent-purple/10 rounded-bl-full flex items-center justify-center text-lg font-bold">
                        ✨
                      </div>

                      <div className="border-b border-white/5 pb-4 space-y-1">
                        <h3 className="font-heading font-black text-xl text-white flex items-center gap-2">
                          <Award className="w-5 h-5 text-accent-emerald" />
                          AI Coach Program Blueprint
                        </h3>
                        <p className="text-xs text-text-secondary">Fully personalized training structure generated by your AI trainer</p>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/3 border border-white/5 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-accent-emerald uppercase tracking-wider">Recommended Split</span>
                            <span className="text-xs font-black text-white bg-accent-emerald/10 border border-accent-emerald/20 px-2 py-0.5 rounded-full">{aiBlueprint.recommendedSplit}</span>
                          </div>
                          <div className="w-full h-px bg-white/5"></div>
                          <div className="grid grid-cols-1 gap-1 text-xs text-white/90">
                            {aiBlueprint.weeklySchedule?.map((dayText, idx) => (
                              <div key={idx} className="flex justify-between py-0.5 border-b border-white/2 last:border-0">
                                <span className="text-text-secondary font-medium">{dayText.split(':')[0]}</span>
                                <span className="text-white font-bold text-right">{dayText.split(':').slice(1).join(':').trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3.5 rounded-xl bg-[#0c0c12] border border-white/5 text-center">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Daily Calories</span>
                            <span className="text-xl font-black text-accent-purple block mt-1">{aiBlueprint.targetCalories} kcal</span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-[#0c0c12] border border-white/5 text-center">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Daily Protein</span>
                            <span className="text-xl font-black text-accent-cyan block mt-1">{aiBlueprint.proteinGrams}g</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-1.5 text-xs">
                          <h4 className="font-bold text-text-secondary flex items-center gap-1.5">
                            🩺 Coach Safety & Setup boundaries
                          </h4>
                          <p className="text-text-secondary leading-relaxed italic">
                            "{aiBlueprint.coachAdvice}"
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-accent-purple/20 bg-accent-purple/5 text-center text-xs">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Active Milestone</span>
                          <span className="font-bold text-white mt-1 block">🏆 {aiBlueprint.keyMilestone}</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleRegenerateBlueprint}
                          disabled={analyzingProfile}
                          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <span>⚡</span>
                          {analyzingProfile ? 'Regenerating...' : 'Regenerate AI Blueprint'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-card rounded-2xl p-6 border border-accent-purple/20 shadow-xl space-y-4 animate-fade-in text-center">
                      <div className="w-12 h-12 rounded-xl bg-accent-purple/10 text-accent-purple flex items-center justify-center text-xl mx-auto border border-accent-purple/20">
                        🧠
                      </div>
                      <h3 className="font-heading font-bold text-white text-base">No AI Program Blueprint Generated</h3>
                      <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                        Complete your metrics in the Settings tab, then generate your custom split schedule and coaching suggestions here.
                      </p>
                      <button
                        type="button"
                        onClick={handleRegenerateBlueprint}
                        disabled={analyzingProfile}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple text-white font-bold text-xs shadow-md shadow-accent-purple/10 flex items-center justify-center gap-1.5 mx-auto transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span>⚡</span>
                        {analyzingProfile ? 'Generating Blueprint...' : 'Generate AI Blueprint'}
                      </button>
                    </div>
                  )}

                  {/* BMI Widget */}
                  {bmi && (
                    <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
                      <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                        <Scale className="w-5 h-5 text-accent-cyan" />
                        Body Mass Index (BMI)
                      </h3>
                      <div className="flex items-center gap-6">
                        <div className="text-4xl font-heading font-black text-white bg-white/5 border border-white/10 rounded-2xl w-20 h-20 flex items-center justify-center shadow-inner shrink-0">
                          {bmi}
                        </div>
                        <div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${bmiCat?.color}`}>
                            {bmiCat?.label}
                          </span>
                          <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                            BMI is a general screening indicator of body density based on weight and height metrics.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Macro Targets */}
                  {macros && (
                    <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
                      <div className="border-b border-white/5 pb-4 flex justify-between items-center">
                        <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                          <Flame className="w-5 h-5 text-accent-purple" />
                          Daily Nutritional Target
                        </h3>
                        <div className="text-right">
                          <span className="text-2xl font-heading font-black text-accent-purple block">
                            {macros.calories} kcal
                          </span>
                          <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wide">
                            Estimated Target
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Protein */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-white">
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-accent-indigo"></span>
                              Protein (Goal-preserving)
                            </span>
                            <span className="text-text-secondary">{macros.protein}g · {macros.protein * 4} kcal</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full bg-accent-indigo" style={{ width: `${Math.min(100, (macros.protein * 4 / macros.calories) * 100)}%` }}></div>
                          </div>
                        </div>

                        {/* Carbs */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-white">
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan"></span>
                              Carbohydrates (Energy supply)
                            </span>
                            <span className="text-text-secondary">{macros.carbs}g · {macros.carbs * 4} kcal</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full bg-accent-cyan" style={{ width: `${Math.min(100, (macros.carbs * 4 / macros.calories) * 100)}%` }}></div>
                          </div>
                        </div>

                        {/* Fats */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-white">
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-accent-purple"></span>
                              Fats (Hormonal baseline)
                            </span>
                            <span className="text-text-secondary">{macros.fats}g · {macros.fats * 9} kcal</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full bg-accent-purple" style={{ width: `${Math.min(100, (macros.fats * 9 / macros.calories) * 100)}%` }}></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        💡 Estimated using the Mifflin-St Jeor BMR formula at moderate daily activity. Protein targets body weight preservation, fats maintain hormonal balance, and carbs fill the remainder.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right side: Milestones & Achievements (Moved here from Analytics Tab) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
                <h3 className="font-heading font-black text-lg text-white flex items-center gap-2 pb-3 border-b border-white/5">
                  <Award className="w-5 h-5 text-accent-purple" />
                  Milestones & Achievements
                </h3>
                
                <div className="space-y-3.5">
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`glass-card rounded-xl p-3.5 border transition-all flex items-center gap-4 ${
                        ach.unlocked
                          ? 'border-white/10 bg-white/3'
                          : 'border-white/5 bg-white/1 opacity-35 select-none'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl border ${
                        ach.unlocked
                          ? 'bg-gradient-to-br from-accent-indigo/10 to-accent-purple/10 border-accent-purple/20'
                          : 'bg-white/5 border-white/5'
                      }`}>
                        {ach.unlocked ? ach.icon : '🔒'}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-white block">{ach.title}</span>
                        <span className="text-[10px] text-text-muted leading-tight block">{ach.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

        {/* TAB: Saved Workouts */}
        {activeSubTab === 'workouts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Saved Workout Templates</h3>
                <p className="text-xs text-text-secondary mt-1">Manage and start your personalized workout templates.</p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search workouts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-accent-purple transition-all"
                />
              </div>
            </div>

            {loadingData ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-white/5 rounded-2xl border border-white/5"></div>
                ))}
              </div>
            ) : filteredWorkouts.length > 0 ? (
              <div className="space-y-4">
                {filteredWorkouts.map(w => (
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
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onStartWorkout(w); }}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-xs font-bold shadow hover:opacity-90 flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Start
                      </button>
                      <button
                        onClick={(e) => handleDeleteWorkout(w.id, e)}
                        className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-accent-rose/10 hover:text-accent-rose border border-white/5 transition-colors cursor-pointer"
                        title="Delete Workout"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center border border-white/5 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-2xl mx-auto shadow-inner">
                  📚
                </div>
                <h3 className="font-heading font-bold text-white text-base">No Workouts Saved</h3>
                <p className="text-text-secondary text-xs max-w-xs mx-auto">
                  Generate layouts in the Planner page and save them to build templates here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB: Routines */}
        {activeSubTab === 'routines' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading font-bold text-xl text-white">Weekly Routine Plans</h3>
              <p className="text-xs text-text-secondary mt-1">Select structured plans to map out your training days.</p>
            </div>

            {loadingData ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-white/5 rounded-2xl border border-white/5"></div>
                ))}
              </div>
            ) : savedRoutines.length > 0 ? (
              <div className="space-y-4">
                {savedRoutines.map(r => (
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
                      onClick={(e) => handleDeleteRoutine(r.id, e)}
                      className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-accent-rose/10 hover:text-accent-rose border border-white/5 transition-colors cursor-pointer"
                      title="Delete Routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center border border-white/5 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-2xl mx-auto shadow-inner">
                  📅
                </div>
                <h3 className="font-heading font-bold text-white text-base">No Weekly Routines</h3>
                <p className="text-text-secondary text-xs max-w-xs mx-auto">
                  Build custom routine schedules inside the Planner page and click Save.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB: History & Logs */}
        {activeSubTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="font-heading font-bold text-xl text-white">Workout Log History</h3>
                <p className="text-xs text-text-secondary mt-1">View, delete, or manually record completed sessions.</p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan text-white text-xs font-bold shadow hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Log Session
              </button>
            </div>

            {loadingData ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-white/5 rounded-2xl border border-white/5"></div>
                ))}
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map(log => {
                  const isExpanded = expandedLogId === log.id;
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
                      className="glass-card rounded-2xl border border-white/5 overflow-hidden transition-all animate-fade-in"
                    >
                      <div
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div>
                          <h4 className="font-heading font-bold text-white text-base">{log.name}</h4>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted mt-1 items-center">
                            <span className="flex items-center gap-1 font-semibold text-text-secondary">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(log.loggedAt || log.date)}
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
                            onClick={(e) => handleDeleteLog(log.id, e)}
                            className="p-2 rounded-lg bg-white/5 text-text-muted hover:bg-accent-rose/10 hover:text-accent-rose border border-white/5 transition-colors cursor-pointer"
                            title="Delete Log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

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
                })}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center border border-white/5 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-2xl mx-auto shadow-inner">
                  ⌚
                </div>
                <h3 className="font-heading font-bold text-white text-base">No Completed Sessions</h3>
                <p className="text-text-secondary text-xs max-w-xs mx-auto mb-2">
                  Completed sessions in the tracker or manual logged items will appear in this timeline.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan text-white text-xs font-bold shadow hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer mx-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Workout Manually
                </button>
              </div>
            )}

            <AddWorkoutModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSaveSuccess={fetchProfileData}
              showToast={showToast}
            />
          </div>
        )}

        {/* TAB: Settings (General metrics configuration form) */}
        {activeSubTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* General metrics inputs */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
              <div className="glass-card rounded-2xl p-6 space-y-6 shadow-xl border border-white/5">
                <h3 className="font-heading font-bold text-lg text-white border-b border-white/5 pb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-accent-purple" />
                  Physiological & Setup Metrics
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Age */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-secondary" htmlFor="profile-age">
                      Age (years)
                    </label>
                    <input
                      id="profile-age"
                      type="number"
                      placeholder="e.g. 28"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors text-sm"
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-secondary" htmlFor="profile-gender">
                      Gender
                    </label>
                    <select
                      id="profile-gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#12121a] border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors cursor-pointer text-sm"
                    >
                      <option value="male" className="bg-[#12121a] text-white">Male</option>
                      <option value="female" className="bg-[#12121a] text-white">Female</option>
                      <option value="other" className="bg-[#12121a] text-white">Non-binary / Other</option>
                    </select>
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-secondary" htmlFor="profile-weight">
                      Current Weight (kg)
                    </label>
                    <input
                      id="profile-weight"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 75"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors text-sm"
                      required
                    />
                  </div>

                  {/* Height */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-secondary" htmlFor="profile-height">
                      Height (cm)
                    </label>
                    <input
                      id="profile-height"
                      type="number"
                      placeholder="e.g. 178"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors text-sm"
                      required
                    />
                  </div>

                  {/* Target Weight */}
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold text-text-secondary" htmlFor="profile-target-weight">
                      Target Weight (kg)
                    </label>
                    <input
                      id="profile-target-weight"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 70"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Goal Select */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary" htmlFor="profile-goal">
                    Training Goal
                  </label>
                  <select
                    id="profile-goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#12121a] border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors cursor-pointer text-sm"
                  >
                    <option value="hypertrophy" className="bg-[#12121a]">Hypertrophy (Muscle Growth)</option>
                    <option value="strength" className="bg-[#12121a]">Strength (Max Power)</option>
                    <option value="endurance" className="bg-[#12121a]">Endurance (Stamina)</option>
                    <option value="fat-loss" className="bg-[#12121a]">Fat Loss (Definition)</option>
                    <option value="powerlifting" className="bg-[#12121a]">Powerlifting (Max Strength)</option>
                    <option value="cardio-conditioning" className="bg-[#12121a]">Cardio / Conditioning</option>
                    <option value="mobility-flexibility" className="bg-[#12121a]">Mobility / Flexibility</option>
                  </select>
                </div>

                {/* Fitness Level */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary" htmlFor="profile-level">
                    Fitness Level
                  </label>
                  <select
                    id="profile-level"
                    value={fitnessLevel}
                    onChange={(e) => setFitnessLevel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#12121a] border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors cursor-pointer text-sm"
                  >
                    <option value="beginner" className="bg-[#12121a]">Beginner (Just starting)</option>
                    <option value="intermediate" className="bg-[#12121a]">Intermediate (Some experience)</option>
                    <option value="advanced" className="bg-[#12121a]">Advanced (Consistent training)</option>
                  </select>
                </div>

                {/* Preferred Equipment */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary" htmlFor="profile-equipment">
                    Preferred Equipment Setup
                  </label>
                  <select
                    id="profile-equipment"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#12121a] border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors cursor-pointer text-sm"
                  >
                    <option value="Full Gym" className="bg-[#12121a] text-white">Full Gym Equipment</option>
                    <option value="Dumbbells Only" className="bg-[#12121a] text-white">Dumbbells Only</option>
                    <option value="Kettlebells Only" className="bg-[#12121a] text-white">Kettlebells Only</option>
                    <option value="Bodyweight Only" className="bg-[#12121a] text-white">Bodyweight Only</option>
                  </select>
                </div>

                {/* Weekly Frequency */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary" htmlFor="profile-frequency">
                    Weekly Training Days
                  </label>
                  <select
                    id="profile-frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#12121a] border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors cursor-pointer text-sm"
                  >
                    <option value="2" className="bg-[#12121a] text-white">2 Days / week</option>
                    <option value="3" className="bg-[#12121a] text-white">3 Days / week</option>
                    <option value="4" className="bg-[#12121a] text-white">4 Days / week</option>
                    <option value="5" className="bg-[#12121a] text-white">5 Days / week</option>
                    <option value="6" className="bg-[#12121a] text-white">6 Days / week</option>
                  </select>
                </div>

                {/* Injuries & Constraints */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary">
                    Injuries / Pain Barriers
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Lower Back', 'Knee', 'Shoulder', 'Wrist', 'Neck'].map(inj => {
                      const active = selectedInjuries.includes(inj);
                      return (
                        <button
                          key={inj}
                          type="button"
                          onClick={() => setSelectedInjuries(prev =>
                            prev.includes(inj) ? prev.filter(i => i !== inj) : [...prev, inj]
                          )}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            active
                              ? 'bg-accent-rose/20 border-accent-rose text-accent-rose font-bold'
                              : 'bg-white/2 border-white/5 text-text-secondary hover:border-white/10'
                          }`}
                        >
                          {inj}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Other specific injuries..."
                    value={customInjury}
                    onChange={(e) => setCustomInjury(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#12121a] border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors text-xs placeholder:text-text-muted"
                  />
                </div>

                {/* Target Focus Muscles */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary">
                    Prioritized Muscle Groups
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'].map(muscle => {
                      const active = focusMuscles.includes(muscle);
                      return (
                        <button
                          key={muscle}
                          type="button"
                          onClick={() => setFocusMuscles(prev =>
                            prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]
                          )}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            active
                              ? 'bg-accent-emerald/20 border-accent-emerald text-accent-emerald font-bold'
                              : 'bg-white/2 border-white/5 text-text-secondary hover:border-white/10'
                          }`}
                        >
                          {muscle}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 font-bold text-white shadow-lg shadow-accent-purple/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving stats...' : 'Save Profile Metrics'}
                </button>
              </div>
            </form>

            {/* Explanation card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
                <h3 className="font-heading font-black text-lg text-white flex items-center gap-2 pb-3 border-b border-white/5">
                  <HelpCircle className="w-5 h-5 text-accent-cyan" />
                  Why update stats?
                </h3>
                
                <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
                  <p>
                    Your biological measurements dynamically tune the entire ForgeFit experience. 
                  </p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li><strong>AI Recommendations:</strong> Program splits, target weight estimates, and recovery durations automatically scale.</li>
                    <li><strong>Workout Rest Targets:</strong> Users above 50 receive automatically increased recovery margins (an additional 15 seconds) to buffer joints and support muscle rebuilding.</li>
                    <li><strong>Customized Target Volume:</strong> Generated templates use set presets built directly for {fitnessLevel} builders.</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
      
    </div>
  );
}
