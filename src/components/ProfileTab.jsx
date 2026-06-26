import React, { useState, useEffect } from 'react';
import { User, Activity, Flame, Dumbbell, Save, Award, Scale, HelpCircle } from 'lucide-react';

export default function ProfileTab({ user, onUpdateUser, showToast }) {
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

    try {
      const res = await fetch('/api/auth/profile-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileData })
      });

      if (!res.ok) throw new Error('AI analysis failed');
      
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
          try {
            const event = JSON.parse(line);
            if (event.status === 'completed') {
              analysisData = event.data;
            } else if (event.status === 'error') {
              throw new Error(event.message);
            }
          } catch (jsonErr) {
            console.warn("Error parsing chunk:", jsonErr);
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
      showToast('AI program blueprint successfully generated! 🚀', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate AI program blueprint. Try again.', 'error');
    } finally {
      setAnalyzingProfile(false);
    }
  };

  // Premium Calculations
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

    // Mifflin-St Jeor Equation
    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (gender === 'male') {
      bmr += 5;
    } else if (gender === 'female') {
      bmr -= 161;
    } else {
      bmr -= 78; // average
    }

    // TDEE assuming Moderate Activity (1.375 multiplier)
    const tdee = Math.round(bmr * 1.375);
    return tdee;
  };

  const getMacroBreakdown = (tdee) => {
    const w = parseFloat(weight);
    if (!tdee || !w) return null;

    // Target Calories based on Goal
    let targetCalories = tdee;
    if (goal === 'fat-loss') {
      targetCalories -= 500;
    } else if (['hypertrophy', 'strength', 'powerlifting'].includes(goal)) {
      targetCalories += 300;
    } else if (['cardio-conditioning', 'endurance'].includes(goal)) {
      targetCalories += 100;
    }

    // 1. Protein: 2.0g per kg of bodyweight
    const proteinGrams = Math.round(w * 2.0);
    const proteinCalories = proteinGrams * 4;

    // 2. Fats: 25% of total calories
    const fatCalories = Math.round(targetCalories * 0.25);
    const fatGrams = Math.round(fatCalories / 9);

    // 3. Carbs: Remaining calories
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
          My Fitness <span className="text-gradient">Profile</span>
        </h2>
        <p className="text-text-secondary mt-2">
          Manage your physiological stats to unlock personalized workouts and nutrition targets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Stats & Edit Profile */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6 shadow-xl border border-white/5">
            <h3 className="font-heading font-bold text-lg text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-accent-purple" />
              General Metrics
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

        {/* Right Column: Fitness Calculations & Insights */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Analysis Empty State */}
          {(!weight || !height || !age) ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/5 shadow-xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 text-text-muted flex items-center justify-center text-3xl mx-auto border border-white/5">
                📊
              </div>
              <h3 className="font-heading font-bold text-lg text-white">Metrics Required</h3>
              <p className="text-text-secondary text-sm max-w-sm mx-auto">
                Fill in your age, weight, and height to unlock real-time physiological analytics (BMI, BMR, and macro calculator).
              </p>
            </div>
          ) : (
            <>
              {/* AI Tailored Program Blueprint Card */}
              {aiBlueprint ? (
                <div className="glass-card rounded-2xl p-6 border border-accent-purple/20 shadow-xl space-y-6 animate-fade-in relative overflow-hidden">
                  {/* Decorative corner accent */}
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
                    {/* Split & Schedule */}
                    <div className="p-4 rounded-xl bg-white/3 border border-white/5 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-accent-emerald uppercase tracking-wider">Recommended Split</span>
                        <span className="text-xs font-black text-white bg-accent-emerald/10 border border-accent-emerald/20 px-2 py-0.5 rounded-full">{aiBlueprint.recommendedSplit}</span>
                      </div>
                      <div className="w-full h-px bg-white/5"></div>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        {aiBlueprint.weeklySchedule?.map((dayText, idx) => (
                          <div key={idx} className="flex justify-between py-0.5 border-b border-white/2 last:border-0">
                            <span className="text-text-secondary font-medium">{dayText.split(':')[0]}</span>
                            <span className="text-white font-bold text-right">{dayText.split(':').slice(1).join(':').trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Calories & Macros summary in blueprint */}
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

                    {/* Coach Advice */}
                    <div className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-1.5 text-xs">
                      <h4 className="font-bold text-text-secondary flex items-center gap-1.5">
                        🩺 Coach Safety & Setup boundaries
                      </h4>
                      <p className="text-text-secondary leading-relaxed italic">
                        "{aiBlueprint.coachAdvice}"
                      </p>
                    </div>

                    {/* Target Milestone */}
                    <div className="p-3.5 rounded-xl border border-accent-purple/20 bg-accent-purple/5 text-center text-xs">
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Active Milestone</span>
                      <span className="font-bold text-white mt-1 block">🏆 {aiBlueprint.keyMilestone}</span>
                    </div>

                    {/* Regenerate Button */}
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
                /* No Blueprint Alert */
                <div className="glass-card rounded-2xl p-6 border border-accent-purple/20 shadow-xl space-y-4 animate-fade-in text-center">
                  <div className="w-12 h-12 rounded-xl bg-accent-purple/10 text-accent-purple flex items-center justify-center text-xl mx-auto border border-accent-purple/20">
                    🧠
                  </div>
                  <h3 className="font-heading font-bold text-white text-base">No AI Program Blueprint Generated</h3>
                  <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                    Complete your general metrics and training preferences on the left, then click below to generate your tailored split schedule and nutrition recommendations.
                  </p>
                  <button
                    type="button"
                    onClick={handleRegenerateBlueprint}
                    disabled={analyzingProfile}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple text-white font-bold text-xs shadow-md shadow-accent-purple/10 flex items-center justify-center gap-1.5 mx-auto transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>⚡</span>
                    {analyzingProfile ? 'Generate AI Blueprint' : 'Generating Blueprint...'}
                  </button>
                </div>
              )}
              {/* BMI Card */}
              {bmi && (
                <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
                  <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-accent-cyan" />
                    Body Mass Index (BMI)
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="text-4xl font-heading font-black text-white bg-white/5 border border-white/10 rounded-2xl w-24 h-24 flex items-center justify-center shadow-inner">
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

              {/* BMR & Macro Targets Card */}
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

                  {/* Macros Breakdown Bars */}
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
                    💡 This breakdown is calculated dynamically using the <strong>Mifflin-St Jeor</strong> BMR formula at moderate daily activity. Protein is set at 2g/kg of body weight to optimize recovery, while fats are capped at 25% of energy expenditure.
                  </p>
                </div>
              )}

              {/* Personalization Confirmation Card */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl space-y-4">
                <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-accent-indigo" />
                  Generator Integration Active
                </h3>
                <div className="flex gap-4 items-start text-xs text-text-secondary leading-relaxed">
                  <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 border border-accent-indigo/20 text-accent-indigo flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <p>
                      Your profile metrics are linked to the rule-based generators. Currently, the following personalization adaptions are active:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li>Goal Defaults: Generated workouts/routines will automatically start with target <strong>{goal}</strong>.</li>
                      <li>Training Volume: Target sets counts dynamically adjust to your <strong>{fitnessLevel}</strong> level.</li>
                      {age && parseInt(age) > 50 && (
                        <li className="text-accent-cyan font-semibold">Age recovery booster: workout rest times are increased by 15s to support joint and muscle recovery.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
