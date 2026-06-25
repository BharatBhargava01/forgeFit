'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Save, User, Dumbbell, Award, Scale } from 'lucide-react';

export default function ProfileSetupModal({ isOpen, onClose, onSaveSuccess, showToast, user }) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('hypertrophy');
  const [fitnessLevel, setFitnessLevel] = useState('intermediate');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user.profile) {
      const p = user.profile;
      setAge(p.age || '');
      setWeight(p.weight || '');
      setHeight(p.height || '');
      setGender(p.gender || 'male');
      setGoal(p.goal || 'hypertrophy');
      setFitnessLevel(p.fitness_level || 'intermediate');
    }
  }, [user]);

  if (!isOpen) return null;

  const handleNext = () => {
    // Validate Step 1
    const a = parseInt(age);
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (!age || isNaN(a) || a < 1 || a > 120) {
      showToast('Please enter a valid age (1-120)', 'error');
      return;
    }
    if (!weight || isNaN(w) || w < 10 || w > 500) {
      showToast('Please enter a valid weight (10kg-500kg)', 'error');
      return;
    }
    if (!height || isNaN(h) || h < 50 || h > 300) {
      showToast('Please enter a valid height (50cm-300cm)', 'error');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    const profile = {
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      gender,
      goal,
      fitness_level: fitnessLevel
    };

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      
      onSaveSuccess(updatedUser);
      localStorage.setItem('wg_user', JSON.stringify(updatedUser));
      showToast('Profile setup complete! Personalized recommendations active. 🚀', 'success');
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
        <div className="flex items-center justify-between gap-2 mb-8 max-w-xs mx-auto">
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-gradient-to-r from-accent-indigo to-accent-purple' : 'bg-white/10'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-gradient-to-r from-accent-purple to-accent-cyan' : 'bg-white/10'}`} />
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

                {/* Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary" htmlFor="wizard-weight">
                    Weight (kg)
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
              </div>
            </div>
          ) : (
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-white/5 pt-5 gap-3 shrink-0">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Skip for Now
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 font-bold text-xs text-white shadow-md shadow-accent-purple/10 flex items-center gap-1 transition-all cursor-pointer"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-cyan hover:opacity-90 font-bold text-xs text-white shadow-md shadow-accent-cyan/10 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Finish Setup'}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
