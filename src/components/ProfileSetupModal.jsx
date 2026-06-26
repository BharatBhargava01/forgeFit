'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Save, User, Dumbbell, Award, Scale, Check } from 'lucide-react';
import { saveRoutine } from '@/lib/storage';
import { generateRoutine } from '@/lib/routine';

export default function ProfileSetupModal({ isOpen, onClose, onSaveSuccess, showToast, user }) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [height, setHeight] = useState('');
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
  const [wizardProgress, setWizardProgress] = useState(null);
  const [generatedRoutine, setGeneratedRoutine] = useState(null);


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

  if (!isOpen) return null;

  const handleNext = async () => {
    if (step === 1) {
      const a = parseInt(age);
      const w = parseFloat(weight);
      const tw = parseFloat(targetWeight);
      const h = parseFloat(height);

      if (!age || isNaN(a) || a < 1 || a > 120) {
        showToast('Please enter a valid age (1-120)', 'error');
        return;
      }
      if (!weight || isNaN(w) || w < 10 || w > 500) {
        showToast('Please enter a valid weight (10kg-500kg)', 'error');
        return;
      }
      if (!targetWeight || isNaN(tw) || tw < 10 || tw > 500) {
        showToast('Please enter a valid target weight (10kg-500kg)', 'error');
        return;
      }
      if (!height || isNaN(h) || h < 50 || h > 300) {
        showToast('Please enter a valid height (50cm-300cm)', 'error');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
      await triggerAIAnalysis();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

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

  const triggerAIAnalysis = async () => {
    setAnalyzingProfile(true);
    setAiBlueprint(null);
    setGeneratedRoutine(null);
    setWizardProgress({
      phase: 'blueprint',
      dietitian: 'running',
      strategist: 'pending',
      reviewer: 'pending',
      planner: 'pending',
      selector: 'pending',
      optimizer: 'pending',
      routineReviewer: 'pending',
      currentMessage: 'Agent 1: Dietitian (Planner) is analyzing physiological stats & calorie targets...'
    });

    const injuryText = [
      ...selectedInjuries,
      customInjury.trim()
    ].filter(Boolean).join(', ') || 'None';

    const profileData = {
      age: parseInt(age),
      gender,
      weight: parseFloat(weight),
      target_weight: targetWeight ? parseFloat(targetWeight) : null,
      height: parseFloat(height),
      goal,
      fitness_level: fitnessLevel,
      injuries: injuryText,
      frequency: parseInt(frequency),
      equipment,
      focus_muscles: focusMuscles
    };

    let resolvedBlueprint = null;

    try {
      // 1. Fetch AI Program Blueprint (NDJSON Stream)
      const blueprintRes = await fetch('/api/auth/profile-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileData })
      });

      if (!blueprintRes.ok) throw new Error('Failed to run AI profiling stream');

      // Handle non-streaming JSON fallback
      const blueprintContentType = blueprintRes.headers.get('Content-Type') || '';
      if (blueprintContentType.includes('application/json')) {
        // API returned a non-streaming error/fallback; skip to rule-based
        throw new Error('AI blueprint API returned non-streaming response, falling back');
      }

      const reader = blueprintRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.status === 'dietitian_done') {
              setWizardProgress(prev => ({
                ...prev,
                dietitian: 'done',
                strategist: 'running',
                currentMessage: event.message
              }));
            } else if (event.status === 'strategist_done') {
              setWizardProgress(prev => ({
                ...prev,
                strategist: 'done',
                reviewer: 'running',
                currentMessage: event.message
              }));
            } else if (event.status === 'reviewer_done') {
              setWizardProgress(prev => ({
                ...prev,
                reviewer: 'done',
                currentMessage: event.message
              }));
            } else if (event.status === 'completed') {
              resolvedBlueprint = event.data;
              setAiBlueprint(event.data);
            } else if (event.status === 'error') {
              throw new Error(event.message);
            }
          } catch (jsonErr) {
            console.warn("Error parsing blueprint chunk:", jsonErr);
          }
        }
      }

      if (!resolvedBlueprint) throw new Error("No blueprint generated by multi-agent pipeline.");

      // 2. Automatically generate the routine (NDJSON Stream)
      setWizardProgress(prev => ({
        ...prev,
        phase: 'routine',
        planner: 'running',
        currentMessage: 'Agent 1: Planner is structuring weekly calendar splits...'
      }));

      const routineSplit = mapSplitToKey(resolvedBlueprint.recommendedSplit);
      const routineRes = await fetch('/api/routines/multi-agent-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          splitType: routineSplit,
          daysPerWeek: parseInt(frequency),
          profile: profileData
        })
      });

      if (!routineRes.ok) throw new Error('Failed to run AI weekly routine stream');

      // Handle non-streaming JSON fallback from server
      const routineContentType = routineRes.headers.get('Content-Type') || '';
      if (routineContentType.includes('application/json')) {
        const jsonRes = await routineRes.json();
        if (jsonRes.fallback && jsonRes.data) {
          setGeneratedRoutine(jsonRes.data);
          setWizardProgress(prev => ({ ...prev, planner: 'done', selector: 'done', optimizer: 'done', routineReviewer: 'done', currentMessage: 'Routine generated with rule-based engine.' }));
          showToast('AI routine unavailable. Generated with rule-based engine.', 'info');
          return;
        }
      }

      const routineReader = routineRes.body.getReader();
      const routineDecoder = new TextDecoder();
      let routineBuffer = '';
      let resolvedRoutine = null;

      while (true) {
        const { value, done } = await routineReader.read();
        if (done) break;

        routineBuffer += routineDecoder.decode(value, { stream: true });
        const lines = routineBuffer.split('\n');
        routineBuffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.status === 'planner_done') {
              setWizardProgress(prev => ({
                ...prev,
                planner: 'done',
                selector: 'running',
                currentMessage: event.message
              }));
            } else if (event.status === 'selector_done') {
              setWizardProgress(prev => ({
                ...prev,
                selector: 'done',
                optimizer: 'running',
                currentMessage: event.message
              }));
            } else if (event.status === 'optimizer_done') {
              setWizardProgress(prev => ({
                ...prev,
                optimizer: 'done',
                routineReviewer: 'running',
                currentMessage: event.message
              }));
            } else if (event.status === 'reviewer_done') {
              setWizardProgress(prev => ({
                ...prev,
                routineReviewer: 'done',
                currentMessage: event.message
              }));
            } else if (event.status === 'completed') {
              resolvedRoutine = event.data;
              setGeneratedRoutine(event.data);
            } else if (event.status === 'error') {
              throw new Error(event.message);
            }
          } catch (jsonErr) {
            console.warn("Error parsing routine chunk:", jsonErr);
          }
        }
      }

      if (!resolvedRoutine) throw new Error("No routine compiled by multi-agent routine pipeline.");
      showToast('AI program and routine successfully created! 🚀', 'success');

    } catch (err) {
      console.error('AI profiling failed, falling back to rule-based routine generation:', err);
      // Fallback: generate a routine using the rule-based engine
      try {
        const splitType = mapSplitToKey(null);
        const fallbackRoutine = generateRoutine({ goal, daysPerWeek: parseInt(frequency), splitType, profile: profileData });
        if (fallbackRoutine) {
          setGeneratedRoutine(fallbackRoutine);
          showToast('AI profiling failed. Generated routine with rule-based engine instead.', 'warning');
        } else {
          showToast('AI profiling failed. You can still save your profile.', 'error');
        }
      } catch (fbErr) {
        console.error('Rule-based fallback also failed:', fbErr);
        showToast('AI profiling failed. You can still save your profile.', 'error');
      }
    } finally {
      setAnalyzingProfile(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    const injuryText = [
      ...selectedInjuries,
      customInjury.trim()
    ].filter(Boolean).join(', ') || 'None';

    const profile = {
      age: parseInt(age),
      weight: parseFloat(weight),
      target_weight: targetWeight ? parseFloat(targetWeight) : null,
      height: parseFloat(height),
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
      
      // Automatically save routine if it was generated
      if (generatedRoutine) {
        const routineName = `${generatedRoutine.splitName} (${generatedRoutine.goal.toUpperCase()})`;
        try {
          await saveRoutine({ name: routineName, ...generatedRoutine });
        } catch (rErr) {
          console.warn("Failed to automatically save routine:", rErr);
        }
      }

      onSaveSuccess(updatedUser);
      localStorage.setItem('wg_user', JSON.stringify(updatedUser));
      showToast('AI-personalized profile setup complete! 🚀', 'success');
      onClose();
    } catch (err) {
      showToast('Failed to save profile details. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const goals = [
    { id: 'hypertrophy', label: 'Hypertrophy', desc: 'Muscle growth & shape', emoji: '💪' },
    { id: 'strength', label: 'Strength', desc: 'Maximize neural power', emoji: '🏋️‍♂️' },
    { id: 'fat-loss', label: 'Fat Loss', desc: 'Define & burn calories', emoji: '🔥' },
    { id: 'endurance', label: 'Endurance', desc: 'Stamina & conditioning', emoji: '🏃‍♂️' },
    { id: 'powerlifting', label: 'Powerlifting', desc: 'SBD main lifts focus', emoji: '🏆' },
    { id: 'cardio-conditioning', label: 'Cardio', desc: 'Heart health & aerobic capacity', emoji: '❤️' },
    { id: 'mobility-flexibility', label: 'Mobility', desc: 'Flexibility & movement range', emoji: '🧘' }
  ];

  const levels = [
    { id: 'beginner', label: 'Beginner', desc: 'New to consistency', emoji: '🌱' },
    { id: 'intermediate', label: 'Intermediate', desc: '1+ years training', emoji: '⚡' },
    { id: 'advanced', label: 'Advanced', desc: 'Consistent heavy training', emoji: '🦁' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-scale-up text-white z-10">
        
        {/* Decorative background glows */}
        <div className="absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full bg-accent-purple/20 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 -z-10 h-64 w-64 rounded-full bg-accent-indigo/15 blur-3xl" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-text-muted hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-xs font-bold text-accent-purple uppercase tracking-wider mb-2">
            ✨ Onboarding Wizard
          </div>
          <h3 className="font-heading font-black text-2xl sm:text-3xl text-white">
            Set Up Your <span className="text-gradient">Fitness Profile</span>
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Let's personalize your workout generated volume, recovery, and calorie targets.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-between gap-2 mb-8 max-w-sm mx-auto">
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-gradient-to-r from-accent-indigo to-accent-purple' : 'bg-white/10'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-gradient-to-r from-accent-purple to-accent-pink' : 'bg-white/10'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 3 ? 'bg-gradient-to-r from-accent-pink to-accent-cyan' : 'bg-white/10'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 4 ? 'bg-gradient-to-r from-accent-cyan to-accent-emerald' : 'bg-white/10'}`} />
        </div>

        {/* Wizard Form */}
        <div className="space-y-6">
          {step === 1 ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-white font-heading font-bold text-sm border-b border-white/5 pb-2">
                <User className="w-4 h-4 text-accent-purple" />
                Step 1: Physiological Stats
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Age */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary" htmlFor="wizard-age">
                    Age (years)
                  </label>
                  <input
                    id="wizard-age"
                    type="number"
                    placeholder="e.g. 28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors text-sm"
                    required
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary" htmlFor="wizard-gender">
                    Gender
                  </label>
                  <select
                    id="wizard-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0c0c12] border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors cursor-pointer text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Current Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary" htmlFor="wizard-weight">
                    Current Weight (kg)
                  </label>
                  <input
                    id="wizard-weight"
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
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary" htmlFor="wizard-height">
                    Height (cm)
                  </label>
                  <input
                    id="wizard-height"
                    type="number"
                    placeholder="e.g. 178"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-purple transition-colors text-sm"
                    required
                  />
                </div>

                {/* Target Weight */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-text-secondary" htmlFor="wizard-target-weight">
                    Target Weight (kg)
                  </label>
                  <input
                    id="wizard-target-weight"
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
            </div>
          ) : null}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              
              {/* Training Goal */}
              <div className="space-y-2">
                <span className="flex items-center gap-2 text-white font-heading font-bold text-sm border-b border-white/5 pb-2">
                  <Dumbbell className="w-4 h-4 text-accent-cyan" />
                  Step 2: What is your primary fitness goal?
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {goals.map(g => {
                    const active = goal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGoal(g.id)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          active 
                            ? 'bg-accent-indigo/10 border-accent-indigo shadow-md shadow-accent-indigo/5' 
                            : 'bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xl shrink-0">{g.emoji}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block">{g.label}</span>
                          <span className="text-[10px] text-text-secondary truncate block">{g.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fitness Level */}
              <div className="space-y-2 pt-2">
                <span className="flex items-center gap-2 text-white font-heading font-bold text-sm border-b border-white/5 pb-2">
                  <Award className="w-4 h-4 text-accent-purple" />
                  What is your training experience level?
                </span>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {levels.map(l => {
                    const active = fitnessLevel === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setFitnessLevel(l.id)}
                        className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          active 
                            ? 'bg-accent-purple/10 border-accent-purple shadow-md shadow-accent-purple/5' 
                            : 'bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-lg">{l.emoji}</span>
                        <span className="text-xs font-bold text-white">{l.label}</span>
                        <span className="text-[9px] text-text-muted leading-tight">{l.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {/* Injuries & Limitations */}
              <div className="space-y-2">
                <span className="flex items-center gap-2 text-white font-heading font-bold text-sm border-b border-white/5 pb-2">
                  <span className="text-accent-rose text-base">⚠️</span>
                  Injuries & Joint Pain Boundaries
                </span>
                <p className="text-[11px] text-text-secondary">We will filter out heavy-loading movements or adapt prescriptions for safety.</p>
                <div className="flex flex-wrap gap-2 pt-1">
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
                            ? 'bg-accent-rose/20 border-accent-rose text-accent-rose'
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
                  placeholder="Other specific injuries (e.g. tennis elbow, torn meniscus)..."
                  value={customInjury}
                  onChange={(e) => setCustomInjury(e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-accent-rose transition-colors text-xs placeholder:text-text-muted"
                />
              </div>

              {/* Weekly Frequency */}
              <div className="space-y-2 pt-2">
                <span className="flex items-center gap-2 text-white font-heading font-bold text-sm border-b border-white/5 pb-2">
                  <span className="text-accent-purple text-base">📅</span>
                  Weekly Training Frequency
                </span>
                <p className="text-[11px] text-text-secondary">How many days per week are you planning to work out?</p>
                <div className="flex gap-2 pt-1">
                  {[2, 3, 4, 5, 6].map(days => {
                    const active = frequency === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setFrequency(days)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          active
                            ? 'bg-accent-purple/20 border-accent-purple text-white'
                            : 'bg-white/2 border-white/5 text-text-secondary hover:border-white/10'
                        }`}
                      >
                        {days} Days
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Equipment Preference */}
              <div className="space-y-2 pt-2">
                <span className="flex items-center gap-2 text-white font-heading font-bold text-sm border-b border-white/5 pb-2">
                  <span className="text-accent-cyan text-base">🏋️‍♂️</span>
                  Primary Equipment Setup
                </span>
                <select
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c0c12] border border-white/10 text-white focus:outline-none focus:border-accent-cyan transition-colors cursor-pointer text-xs"
                >
                  <option value="Full Gym">Full Gym Equipment (Barbells, Dumbbells, Machines, Cables)</option>
                  <option value="Dumbbells Only">Dumbbells Only Setup</option>
                  <option value="Kettlebells Only">Kettlebells Only Setup</option>
                  <option value="Bodyweight Only">Bodyweight Only (Calisthenics)</option>
                </select>
              </div>

              {/* Focus Muscles */}
              <div className="space-y-2 pt-2">
                <span className="flex items-center gap-2 text-white font-heading font-bold text-sm border-b border-white/5 pb-2">
                  <span className="text-accent-emerald text-base">🎯</span>
                  Target Focus Muscle Groups
                </span>
                <p className="text-[11px] text-text-secondary">Select any muscle groups you wish to place extra training priority on.</p>
                <div className="flex flex-wrap gap-2 pt-1">
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
                            ? 'bg-accent-emerald/20 border-accent-emerald text-accent-emerald'
                            : 'bg-white/2 border-white/5 text-text-secondary hover:border-white/10'
                        }`}
                      >
                        {muscle}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 animate-fade-in max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {analyzingProfile && wizardProgress ? (
                <div className="glass-card rounded-2xl p-6 space-y-6 shadow-xl border border-accent-purple/20 bg-[#0c0c12] animate-fade-in text-white text-left">
                  <div className="text-center pb-4 border-b border-white/5">
                    <div className="inline-flex p-3 rounded-full bg-accent-purple/10 border border-accent-purple/20 mb-3 text-accent-purple animate-pulse">
                      <Scale className="w-8 h-8" />
                    </div>
                    <h4 className="font-heading font-extrabold text-xl text-white">Collaborative AI Agent Pipeline</h4>
                    <p className="text-xs text-text-secondary mt-1">Specialized coaches, dietitians, and physiologists are constructing your strategy & routine.</p>
                  </div>

                  <div className="space-y-4 py-2 text-xs">
                    {/* Phase 1: Onboarding Blueprint */}
                    <div className="space-y-3">
                      <h5 className="font-heading font-black text-accent-cyan uppercase tracking-wider text-[10px]">Phase 1: Generating AI Program Blueprint</h5>
                      
                      {/* Dietitian */}
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                          wizardProgress.dietitian === 'done' ? 'bg-accent-emerald border-accent-emerald text-black' :
                          wizardProgress.dietitian === 'running' ? 'bg-accent-purple border-accent-purple text-white animate-pulse' :
                          'bg-white/5 border-white/10 text-text-muted'
                        }`}>
                          {wizardProgress.dietitian === 'done' ? <Check className="w-3 h-3 text-black stroke-[3px]" /> : '1'}
                        </div>
                        <span className={wizardProgress.dietitian === 'running' ? 'text-accent-purple font-bold' : wizardProgress.dietitian === 'done' ? 'text-white' : 'text-text-muted'}>
                          Dietitian: Calorie & Macronutrient targets
                        </span>
                      </div>

                      {/* Strategist */}
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                          wizardProgress.strategist === 'done' ? 'bg-accent-emerald border-accent-emerald text-black' :
                          wizardProgress.strategist === 'running' ? 'bg-accent-purple border-accent-purple text-white animate-pulse' :
                          'bg-white/5 border-white/10 text-text-muted'
                        }`}>
                          {wizardProgress.strategist === 'done' ? <Check className="w-3 h-3 text-black stroke-[3px]" /> : '2'}
                        </div>
                        <span className={wizardProgress.strategist === 'running' ? 'text-accent-purple font-bold' : wizardProgress.strategist === 'done' ? 'text-white' : 'text-text-muted'}>
                          Strategist: Custom training split & split calendar
                        </span>
                      </div>

                      {/* Reviewer */}
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                          wizardProgress.reviewer === 'done' ? 'bg-accent-emerald border-accent-emerald text-black' :
                          wizardProgress.reviewer === 'running' ? 'bg-accent-purple border-accent-purple text-white animate-pulse' :
                          'bg-white/5 border-white/10 text-text-muted'
                        }`}>
                          {wizardProgress.reviewer === 'done' ? <Check className="w-3 h-3 text-black stroke-[3px]" /> : '3'}
                        </div>
                        <span className={wizardProgress.reviewer === 'running' ? 'text-accent-purple font-bold' : wizardProgress.reviewer === 'done' ? 'text-white' : 'text-text-muted'}>
                          Head Coach: Safety review & milestones
                        </span>
                      </div>
                    </div>

                    {/* Phase 2: Routine Generation */}
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <h5 className="font-heading font-black text-accent-purple uppercase tracking-wider text-[10px]">Phase 2: Compiling Weekly Training Routine</h5>
                      
                      {/* Routine Planner */}
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                          wizardProgress.planner === 'done' ? 'bg-accent-emerald border-accent-emerald text-black' :
                          wizardProgress.planner === 'running' ? 'bg-accent-purple border-accent-purple text-white animate-pulse' :
                          'bg-white/5 border-white/10 text-text-muted'
                        }`}>
                          {wizardProgress.planner === 'done' ? <Check className="w-3 h-3 text-black stroke-[3px]" /> : '4'}
                        </div>
                        <span className={wizardProgress.planner === 'running' ? 'text-accent-purple font-bold' : wizardProgress.planner === 'done' ? 'text-white' : 'text-text-muted'}>
                          Planner: Training layout calendar mapping
                        </span>
                      </div>

                      {/* Selector */}
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                          wizardProgress.selector === 'done' ? 'bg-accent-emerald border-accent-emerald text-black' :
                          wizardProgress.selector === 'running' ? 'bg-accent-purple border-accent-purple text-white animate-pulse' :
                          'bg-white/5 border-white/10 text-text-muted'
                        }`}>
                          {wizardProgress.selector === 'done' ? <Check className="w-3 h-3 text-black stroke-[3px]" /> : '5'}
                        </div>
                        <span className={wizardProgress.selector === 'running' ? 'text-accent-purple font-bold' : wizardProgress.selector === 'done' ? 'text-white' : 'text-text-muted'}>
                          Selector: Exercise grounding database search
                        </span>
                      </div>

                      {/* Optimizer */}
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                          wizardProgress.optimizer === 'done' ? 'bg-accent-emerald border-accent-emerald text-black' :
                          wizardProgress.optimizer === 'running' ? 'bg-accent-purple border-accent-purple text-white animate-pulse' :
                          'bg-white/5 border-white/10 text-text-muted'
                        }`}>
                          {wizardProgress.optimizer === 'done' ? <Check className="w-3 h-3 text-black stroke-[3px]" /> : '6'}
                        </div>
                        <span className={wizardProgress.optimizer === 'running' ? 'text-accent-purple font-bold' : wizardProgress.optimizer === 'done' ? 'text-white' : 'text-text-muted'}>
                          Optimizer: Sets, reps, rest & coaching tips calculation
                        </span>
                      </div>

                      {/* Reviewer */}
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border ${
                          wizardProgress.routineReviewer === 'done' ? 'bg-accent-emerald border-accent-emerald text-black' :
                          wizardProgress.routineReviewer === 'running' ? 'bg-accent-purple border-accent-purple text-white animate-pulse' :
                          'bg-white/5 border-white/10 text-text-muted'
                        }`}>
                          {wizardProgress.routineReviewer === 'done' ? <Check className="w-3 h-3 text-black stroke-[3px]" /> : '7'}
                        </div>
                        <span className={wizardProgress.routineReviewer === 'running' ? 'text-accent-purple font-bold' : wizardProgress.routineReviewer === 'done' ? 'text-white' : 'text-text-muted'}>
                          Final Reviewer: Injury auditing & compliance check
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-[10px] text-text-secondary font-medium">
                    <span className="text-accent-purple font-bold">Status:</span> {wizardProgress.currentMessage}
                  </div>
                </div>
              ) : analyzingProfile ? (
                <div className="text-center py-12 space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple animate-bounce">
                    <Dumbbell className="w-8 h-8" />
                  </div>
                  <h4 className="font-heading font-bold text-lg text-white">Synthesizing Tailored Program...</h4>
                  <p className="text-xs text-text-secondary max-w-xs mx-auto">Our AI Personal Trainer is designing your training split layout, load distribution, and nutritional calorie goals.</p>
                </div>
              ) : aiBlueprint ? (
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-xl border border-accent-emerald/20 bg-accent-emerald/5 flex items-start gap-3">
                    <span className="text-xl shrink-0">👑</span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-accent-emerald">Recommended Routine Split</h4>
                      <h3 className="font-heading font-black text-lg text-white mt-0.5">{aiBlueprint.recommendedSplit}</h3>
                    </div>
                  </div>

                  {/* Weekly Layout Calendar */}
                  <div className="p-4 rounded-xl bg-white/3 border border-white/5 space-y-2">
                    <h4 className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                      <span>📅</span> Suggested Weekly Schedule
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {aiBlueprint.weeklySchedule?.map((dayText, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/2 last:border-b-0">
                          <span className="text-text-secondary font-medium">{dayText.split(':')[0]}</span>
                          <span className="text-white font-bold text-right">{dayText.split(':').slice(1).join(':').trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calorie Targets */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white/3 border border-white/5 text-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Daily Calories</span>
                      <span className="text-2xl font-black text-accent-purple block mt-1">{aiBlueprint.targetCalories} kcal</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/3 border border-white/5 text-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Daily Protein</span>
                      <span className="text-2xl font-black text-accent-cyan block mt-1">{aiBlueprint.proteinGrams}g</span>
                    </div>
                  </div>

                  {/* Carbs & Fats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white/3 border border-white/5 text-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Daily Carbs</span>
                      <span className="text-xl font-bold text-white block mt-0.5">{aiBlueprint.carbGrams}g</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/3 border border-white/5 text-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Daily Fats</span>
                      <span className="text-xl font-bold text-white block mt-0.5">{aiBlueprint.fatGrams}g</span>
                    </div>
                  </div>

                  {/* Coach Advice */}
                  <div className="p-4 rounded-xl bg-[#0c0c12] border border-white/5 space-y-1.5">
                    <h4 className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                      <span>🩺</span> Coach Safety & Setup Advice
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed italic">
                      "{aiBlueprint.coachAdvice}"
                    </p>
                  </div>

                  {/* Target Milestone */}
                  <div className="p-3.5 rounded-xl border border-accent-purple/20 bg-accent-purple/5 text-center">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Target Milestone 1</span>
                    <span className="text-xs font-bold text-white mt-1 block">🏆 {aiBlueprint.keyMilestone}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <span className="text-xl">⚠️</span>
                  <h4 className="font-heading font-bold text-lg text-white font-bold">Failed to Analyze Program</h4>
                  <p className="text-xs text-text-secondary max-w-xs mx-auto">We couldn't connect to the AI model. You can still submit and save your stats.</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-white/5 pt-5 gap-3 shrink-0">
            {step === 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Skip for Now
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                disabled={analyzingProfile || saving}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 font-bold text-xs text-white shadow-md shadow-accent-purple/10 flex items-center gap-1 transition-all cursor-pointer"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || analyzingProfile}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-cyan hover:opacity-90 font-bold text-xs text-white shadow-md shadow-accent-cyan/10 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Finish Setup'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
