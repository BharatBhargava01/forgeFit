import React, { useState, useEffect } from 'react';
import { Apple, Utensils, Zap, Plus, Loader2, Sparkles, Trash2, Check } from 'lucide-react';

export default function NutritionTab({ showToast }) {
  const [calorieTarget, setCalorieTarget] = useState(2500);
  const [dietType, setDietType] = useState('Standard');
  const [macroFocus, setMacroFocus] = useState('Balanced');
  
  const [meals, setMeals] = useState([]);

  const [newMealName, setNewMealName] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('');
  const [newMealProtein, setNewMealProtein] = useState('');
  const [newMealCarbs, setNewMealCarbs] = useState('');
  const [newMealFats, setNewMealFats] = useState('');
  const [newMealType, setNewMealType] = useState('Breakfast');

  const [aiMealPlan, setAiMealPlan] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Load custom diet setups if saved
  useEffect(() => {
    const savedTarget = localStorage.getItem('wg_nutrition_target');
    const savedDiet = localStorage.getItem('wg_nutrition_diet');
    const savedMacro = localStorage.getItem('wg_nutrition_macro');
    const savedMeals = localStorage.getItem('wg_meals_log');
    
    if (savedTarget) setCalorieTarget(parseInt(savedTarget));
    if (savedDiet) setDietType(savedDiet);
    if (savedMacro) setMacroFocus(savedMacro);
    if (savedMeals) {
      try {
        setMeals(JSON.parse(savedMeals));
      } catch (e) { /* fallback */ }
    }
  }, []);

  const saveMealsToCache = (updatedMeals) => {
    setMeals(updatedMeals);
    localStorage.setItem('wg_meals_log', JSON.stringify(updatedMeals));
  };

  const handleAddMeal = (e) => {
    e.preventDefault();
    if (!newMealName || !newMealCalories) {
      showToast('Please fill in meal name and calories.', 'error');
      return;
    }

    const cals = parseInt(newMealCalories) || 0;
    const prot = parseInt(newMealProtein) || 0;

    // Use manual inputs if defined, otherwise fall back to estimation ratios
    const carbsVal = newMealCarbs !== '' ? (parseInt(newMealCarbs) || 0) : Math.round((cals * 0.4) / 4);
    const fatsVal = newMealFats !== '' ? (parseInt(newMealFats) || 0) : Math.round((cals * 0.35) / 9);

    const newMeal = {
      id: Date.now().toString(),
      type: newMealType,
      name: newMealName,
      calories: cals,
      protein: prot,
      carbs: carbsVal,
      fats: fatsVal
    };

    const updated = [...meals, newMeal];
    saveMealsToCache(updated);
    
    // Clear form inputs
    setNewMealName('');
    setNewMealCalories('');
    setNewMealProtein('');
    setNewMealCarbs('');
    setNewMealFats('');
    
    showToast(`Logged ${newMealName} to ${newMealType}! 🍏`, 'success');
  };

  const handleDeleteMeal = (id) => {
    const updated = meals.filter(m => m.id !== id);
    saveMealsToCache(updated);
    showToast('Meal removed from log.', 'info');
  };

  const handleSaveSettings = () => {
    localStorage.setItem('wg_nutrition_target', calorieTarget);
    localStorage.setItem('wg_nutrition_diet', dietType);
    localStorage.setItem('wg_nutrition_macro', macroFocus);
    showToast('Nutrition settings updated!', 'success');
  };

  // Generate Meal Plan using Gemini chat endpoint
  const handleGenerateMealPlan = async () => {
    setAiLoading(true);
    setAiMealPlan(null);
    try {
      const prompt = `Generate a customized daily fitness meal plan.
Calorie Target: ${calorieTarget} kcal
Diet Style: ${dietType}
Macro Focus: ${macroFocus}

Please structure the meal plan with:
1. Short overview of daily macro distributions.
2. Breakfast, Lunch, Dinner, and 1 Healthy Snack.
3. For each meal, provide name, calories, protein (g), carbs (g), fats (g), and brief preparation instructions.

Keep the tone encouraging, structured, and easy to read.`;

      const res = await fetch('/api/workouts/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate plan');
      }

      const data = await res.json();
      setAiMealPlan(data.content);
      showToast('AI Meal Plan ready! 🥗', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate AI meal plan. Check API settings.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Calculations
  const totalCaloriesConsumed = meals.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProteinConsumed = meals.reduce((acc, curr) => acc + curr.protein, 0);
  const totalCarbsConsumed = meals.reduce((acc, curr) => acc + curr.carbs, 0);
  const totalFatsConsumed = meals.reduce((acc, curr) => acc + curr.fats, 0);
  const calPercent = Math.min(100, Math.round((totalCaloriesConsumed / calorieTarget) * 100));

  // Macro Target Distributions
  const macroDist = {
    Balanced: { p: 30, c: 45, f: 25 },
    HighProtein: { p: 40, c: 35, f: 25 },
    Keto: { p: 25, c: 5, f: 70 },
    LowFat: { p: 25, c: 60, f: 15 }
  }[macroFocus] || { p: 30, c: 45, f: 25 };

  const targetProtein = Math.round((calorieTarget * (macroDist.p / 100)) / 4);
  const targetCarbs = Math.round((calorieTarget * (macroDist.c / 100)) / 4);
  const targetFats = Math.round((calorieTarget * (macroDist.f / 100)) / 9);

  return (
    <div className="p-6 space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="font-heading font-extrabold text-3xl text-white tracking-tight">
          Nutrition & Meal <span className="text-gradient">Planning</span>
        </h2>
        <p className="text-[#a0a0b8] text-xs sm:text-sm font-medium mt-0.5">
          Plan meals, track macro distribution, and generate AI meal routines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Goals & Tracker */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Calorie configuration Card */}
          <div className="bg-[#12121a] rounded-[2rem] p-5 shadow-sm border border-white/10 text-white">
            <h3 className="font-heading font-extrabold text-sm text-[#ededed] mb-4 flex items-center gap-2">
              <Apple className="w-4.5 h-4.5 text-orange-500" />
              Diet Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#ededed] mb-1">
                  <span>Daily Calorie Target</span>
                  <span>{calorieTarget} kcal</span>
                </div>
                <input
                  type="range"
                  min="1200"
                  max="5000"
                  step="50"
                  value={calorieTarget}
                  onChange={(e) => setCalorieTarget(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#161624] rounded-lg appearance-none cursor-pointer accent-[#a389f4]"
                />
              </div>

              <div>
                <label className="text-[10px] text-text-secondary font-bold block mb-1">Diet Style</label>
                <select
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-white/10 text-xs font-semibold outline-none text-white focus:border-accent-purple"
                >
                  <option value="Standard">Standard (No exclusions)</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Keto">Ketogenic</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Paleo">Paleo</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-text-secondary font-bold block mb-1">Macronutrient Target Focus</label>
                <select
                  value={macroFocus}
                  onChange={(e) => setMacroFocus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-white/10 text-xs font-semibold outline-none text-white focus:border-accent-purple"
                >
                  <option value="Balanced">Balanced (30% P / 45% C / 25% F)</option>
                  <option value="HighProtein">High Protein (40% P / 35% C / 25% F)</option>
                  <option value="Keto">Keto Focus (25% P / 5% C / 70% F)</option>
                  <option value="LowFat">Low Fat (25% P / 60% C / 15% F)</option>
                </select>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer mt-2"
              >
                Save Settings
              </button>
            </div>
          </div>

          {/* Macro distribution widget */}
          <div className="bg-[#12121a] rounded-[2rem] p-5 shadow-sm border border-white/10 text-white space-y-4">
            <h3 className="font-heading font-extrabold text-sm text-[#ededed] flex items-center gap-2">
              <Zap className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500" />
              Daily Macro Progress
            </h3>

            {/* Calories Progress circular meter replacement */}
            <div className="space-y-1 bg-[#161624] rounded-2xl p-4 text-center border border-white/5">
              <span className="text-[10px] text-text-secondary font-bold block">TOTAL CALORIES CONSUMED</span>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-3xl font-black text-white">{totalCaloriesConsumed}</span>
                <span className="text-[#a0a0b8] text-xs font-bold">/ {calorieTarget} kcal</span>
              </div>
              <div className="w-full bg-[#12121a] h-2.5 rounded-full overflow-hidden mt-3">
                <div className="bg-[#a389f4] h-full rounded-full transition-all duration-500" style={{ width: `${calPercent}%` }} />
              </div>
              <span className="text-[9px] text-[#a0a0b8] font-bold block mt-2">{calPercent}% of target calorie limit reached</span>
            </div>

            {/* Individual Macros Bars */}
            <div className="space-y-3.5 pt-2">
              {/* Protein */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#ededed]">
                  <span>Protein</span>
                  <span className="font-medium text-[#a0a0b8]">{totalProteinConsumed}g / {targetProtein}g</span>
                </div>
                <div className="w-full bg-[#161624] h-2 rounded-full overflow-hidden">
                  <div className="bg-red-400 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.round((totalProteinConsumed / (targetProtein || 1)) * 100))}%` }} />
                </div>
              </div>

              {/* Carbs */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#ededed]">
                  <span>Carbohydrates</span>
                  <span className="font-medium text-[#a0a0b8]">{totalCarbsConsumed}g / {targetCarbs}g</span>
                </div>
                <div className="w-full bg-[#161624] h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.round((totalCarbsConsumed / (targetCarbs || 1)) * 100))}%` }} />
                </div>
              </div>

              {/* Fats */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#ededed]">
                  <span>Fats</span>
                  <span className="font-medium text-[#a0a0b8]">{totalFatsConsumed}g / {targetFats}g</span>
                </div>
                <div className="w-full bg-[#161624] h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.round((totalFatsConsumed / (targetFats || 1)) * 100))}%` }} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Center column (8 Cols): Meal Logs and AI Meal Generator */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Meal Logger Form & History */}
            <div className="bg-[#12121a] rounded-[2rem] p-5 shadow-sm border border-white/10 text-white space-y-4">
              <h3 className="font-heading font-extrabold text-sm text-[#ededed] flex items-center gap-2">
                <Utensils className="w-4.5 h-4.5 text-indigo-500" />
                Meal Log Book
              </h3>

              <form onSubmit={handleAddMeal} className="space-y-3.5 bg-[#161624] rounded-2xl p-4 text-left border border-white/10">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-[#a0a0b8] font-bold block mb-0.5">Meal Type</label>
                    <select
                      value={newMealType}
                      onChange={(e) => setNewMealType(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#12121a] border border-white/10 text-xs font-semibold outline-none text-white focus:border-accent-purple"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-[#a0a0b8] font-bold block mb-0.5">Calories (kcal)</label>
                    <input
                      type="number"
                      placeholder="e.g. 350"
                      value={newMealCalories}
                      onChange={(e) => setNewMealCalories(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#12121a] border border-white/10 text-xs font-semibold outline-none text-white focus:border-accent-purple"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-[#a0a0b8] font-bold block mb-0.5">Meal Name / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Avocado Toast"
                    value={newMealName}
                    onChange={(e) => setNewMealName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#12121a] border border-white/10 text-xs font-semibold outline-none text-white focus:border-accent-purple"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-[#a0a0b8] font-bold block mb-0.5">Protein (g)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15"
                      value={newMealProtein}
                      onChange={(e) => setNewMealProtein(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#12121a] border border-white/10 text-xs font-semibold outline-none text-white focus:border-accent-purple"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#a0a0b8] font-bold block mb-0.5">Carbs (g)</label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      value={newMealCarbs}
                      onChange={(e) => setNewMealCarbs(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#12121a] border border-white/10 text-xs font-semibold outline-none text-white focus:border-accent-purple"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#a0a0b8] font-bold block mb-0.5">Fats (g)</label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      value={newMealFats}
                      onChange={(e) => setNewMealFats(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#12121a] border border-white/10 text-xs font-semibold outline-none text-white focus:border-accent-purple"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#a389f4] hover:bg-[#9278e3] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 mt-1 text-white"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Meal Entry
                </button>
              </form>

              {/* Log List */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {meals.length === 0 ? (
                  <div className="text-center py-8 text-[#a0a0b8] text-xs">No meals logged for today yet.</div>
                ) : (
                  meals.map(meal => (
                    <div key={meal.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#161624] border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-left">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mb-1 text-white ${
                          meal.type === 'Breakfast' ? 'bg-orange-400' :
                          meal.type === 'Lunch' ? 'bg-blue-400' :
                          meal.type === 'Dinner' ? 'bg-indigo-400' : 'bg-amber-400'
                        }`}>
                          {meal.type}
                        </span>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{meal.name}</h4>
                        <span className="text-[10px] text-[#a0a0b8]">
                          {meal.protein}g Protein · {meal.carbs}g Carbs · {meal.fats}g Fats
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{meal.calories} <span className="text-[10px] font-medium text-[#a0a0b8]">kcal</span></span>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Meal Generator Control Panel */}
            <div className="bg-[#12121a] rounded-[2rem] p-5 shadow-sm border border-white/10 flex flex-col justify-between min-h-[460px] text-white">
              <div className="space-y-4">
                <h3 className="font-heading font-extrabold text-sm text-[#ededed] flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-accent-purple" />
                  Gemini AI Meal Planner
                </h3>
                
                <p className="text-xs text-[#a0a0b8] leading-relaxed">
                  Generate a complete, custom culinary day planner matching your calories, macros, and diet styles instantly using Google Gemini.
                </p>

                <div className="rounded-2xl bg-accent-indigo/5 border border-accent-indigo/20 p-4 text-left text-xs text-indigo-200 space-y-2 mt-2">
                  <div className="font-bold flex items-center gap-1 text-accent-indigo">
                    <span>🥗 Selected Plan Profile:</span>
                  </div>
                  <div>Calories: <strong className="text-white">{calorieTarget} kcal</strong></div>
                  <div>Dietary Preference: <strong className="text-white">{dietType}</strong></div>
                  <div>Nutrition Goal: <strong className="text-white">{macroFocus}</strong></div>
                </div>
              </div>

              <button
                onClick={handleGenerateMealPlan}
                disabled={aiLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan text-white hover:opacity-90 font-extrabold text-xs shadow-md shadow-accent-purple/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-white" /> Generate Custom AI Meal Plan
                  </>
                )}
              </button>
            </div>

          </div>

          {/* AI Generated Output Screen */}
          {aiMealPlan && (
            <div className="bg-[#12121a] rounded-[2.2rem] p-6 shadow-sm border border-white/10 text-left animate-slide-up space-y-4 text-white">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-heading font-extrabold text-md text-[#ededed] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-purple" />
                  Your AI Recommended Meal Routine
                </h3>
                <button
                  onClick={() => setAiMealPlan(null)}
                  className="text-xs font-bold text-[#a0a0b8] hover:text-accent-rose transition-colors cursor-pointer"
                >
                  Clear Plan
                </button>
              </div>

              <div className="text-xs text-[#ededed] leading-relaxed space-y-4 overflow-y-auto max-h-[400px] pr-2 whitespace-pre-wrap font-medium">
                {aiMealPlan}
              </div>
            </div>
          )}

        </div>

      </div>
      
    </div>
  );
}
