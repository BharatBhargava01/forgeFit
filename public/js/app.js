/* ============================================
   APP — SPA Router & Page Rendering
   ============================================ */

import { MUSCLE_GROUPS, EQUIPMENT, EXERCISES, filterExercises, getExerciseCount, setCustomExercisesCache } from './data.js';
import { generateWorkout } from './generator.js';
import { generateRoutine, getSplitOptions } from './routine.js';
import { saveWorkout, getWorkouts, deleteWorkout, saveRoutine, getRoutines, deleteRoutine, saveCustomExercise, getCustomExercises, deleteCustomExercise, saveWorkoutLog, getWorkoutLogs, deleteWorkoutLog, syncOfflineData } from './storage.js';
import { $, $$, createElement, showToast, difficultyInfo, formatDate, renderSkeletons, animateIn } from './ui.js';

/* ---- Refresh custom exercises cache from API ---- */
async function refreshCustomExercises() {
  try {
    const exercises = await getCustomExercises();
    setCustomExercisesCache(exercises);
  } catch { /* silent */ }
}

/* ---- Handle offline data synchronization ---- */
async function handleSyncOffline() {
  try {
    const didSync = await syncOfflineData();
    if (didSync) {
      showToast('Synced offline data with server!', 'success');
      
      // Update local memory cache with newly synced custom exercises
      await refreshCustomExercises();
      
      // Refresh current page UI to show synced items
      if (state.currentPage === 'saved') {
        renderSaved();
        renderHistory();
      } else if (state.currentPage === 'create') {
        renderCustomExerciseList();
      }
    }
  } catch (err) {
    console.error('Offline synchronization error:', err);
  }
}


/* ---- State ---- */
const state = {
  currentPage: 'home',
  generator: {
    muscles: [],
    difficulty: 2,
    duration: 30,
    equipment: [],
    result: null,
  },
  routine: {
    goal: 'hypertrophy',
    daysPerWeek: 4,
    splitType: 'push-pull-legs',
    result: null,
  },
  library: {
    search: '',
    filter: 'All',
  },
  saved: {
    tab: 'workouts',
  },
  create: {
    exerciseMuscles: [],
    routineDays: [],
    pickerDayIndex: -1,
    pickerSelected: [],
    pickerFilter: 'All',
  },
  tracker: {
    active: false,
    workout: null,
    durationSeconds: 0,
    timerInterval: null,
    loggedExercises: {},
    restTimer: {
      interval: null,
      remaining: 0,
      total: 0,
    }
  }
};

/* ---- Router ---- */
function navigate(page) {
  state.currentPage = page;
  $$('.page').forEach(p => p.classList.remove('active'));
  const target = $(`#page-${page}`);
  if (target) target.classList.add('active');

  $$('.navbar__link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  window.location.hash = page === 'home' ? '' : page;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Trigger page-specific init
  if (page === 'library') renderLibrary();
  if (page === 'saved') renderSaved();
  if (page === 'create') { renderCustomExerciseList(); renderRoutineDays(); }
  if (page === 'analytics') renderAnalytics();
}

function initRouter() {
  const hash = window.location.hash.slice(1);
  if (hash) navigate(hash);

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || 'home';
    navigate(hash);
  });
}

/* ==========================================
   PAGE: HOME
   ========================================== */
// Static — rendered in HTML

/* ==========================================
   PAGE: GENERATOR
   ========================================== */
function initGenerator() {
  const container = $('#generator-controls');
  if (!container) return;

  // Muscle chips
  const chipsEl = $('#muscle-chips');
  MUSCLE_GROUPS.filter(m => m !== 'Full Body').forEach(muscle => {
    const chip = createElement('button', {
      className: 'chip',
      dataset: { muscle },
      onClick: () => toggleMuscle(muscle),
    }, muscle);
    chipsEl.appendChild(chip);
  });

  // Duration options
  const durEl = $('#duration-options');
  [15, 30, 45, 60, 90].forEach(mins => {
    const opt = createElement('button', {
      className: `duration-option ${mins === 30 ? 'active' : ''}`,
      dataset: { duration: mins.toString() },
      onClick: () => selectDuration(mins),
    }, `${mins} min`);
    durEl.appendChild(opt);
  });

  // Difficulty slider
  const slider = $('#difficulty-slider');
  slider.addEventListener('input', (e) => {
    state.generator.difficulty = parseInt(e.target.value);
    updateDifficultyLabel();
  });

  // Equipment toggles
  const eqEl = $('#equipment-chips');
  EQUIPMENT.forEach(eq => {
    const chip = createElement('button', {
      className: 'chip',
      dataset: { equipment: eq },
      onClick: () => toggleEquipment(eq),
    }, eq);
    eqEl.appendChild(chip);
  });

  // Generate button
  $('#btn-generate').addEventListener('click', handleGenerate);
}

function toggleMuscle(muscle) {
  const idx = state.generator.muscles.indexOf(muscle);
  if (idx >= 0) state.generator.muscles.splice(idx, 1);
  else state.generator.muscles.push(muscle);

  $$('#muscle-chips .chip').forEach(chip => {
    chip.classList.toggle('active', state.generator.muscles.includes(chip.dataset.muscle));
  });
}

function selectDuration(mins) {
  state.generator.duration = mins;
  $$('#duration-options .duration-option').forEach(opt => {
    opt.classList.toggle('active', parseInt(opt.dataset.duration) === mins);
  });
}

function toggleEquipment(eq) {
  const idx = state.generator.equipment.indexOf(eq);
  if (idx >= 0) state.generator.equipment.splice(idx, 1);
  else state.generator.equipment.push(eq);

  $$('#equipment-chips .chip').forEach(chip => {
    chip.classList.toggle('active', state.generator.equipment.includes(chip.dataset.equipment));
  });
}

function updateDifficultyLabel() {
  const labels = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };
  const el = $('#difficulty-label');
  if (el) el.textContent = labels[state.generator.difficulty] || 'Intermediate';
}

async function handleGenerate() {
  const results = $('#generator-results');
  renderSkeletons(results, 5);

  const isAI = $('#ai-mode-toggle') && $('#ai-mode-toggle').checked;
  const payload = {
    muscles: state.generator.muscles,
    difficulty: state.generator.difficulty,
    duration: state.generator.duration,
    equipment: state.generator.equipment,
  };

  if (isAI) {
    try {
      const res = await fetch('/api/workouts/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }
      const workout = await res.json();
      state.generator.result = workout;
      renderWorkoutResults(workout);
      showToast('AI workout generated successfully! 🧠');
    } catch (err) {
      console.warn('AI workout generation failed, falling back to rule-based engine:', err);
      showToast('AI Generation failed. Falling back to traditional rules.', 'error');
      
      const workout = generateWorkout(payload);
      state.generator.result = workout;
      renderWorkoutResults(workout);
    }
  } else {
    // Simulate brief loading for visual effect
    setTimeout(() => {
      const workout = generateWorkout(payload);
      state.generator.result = workout;
      renderWorkoutResults(workout);
    }, 600);
  }
}

function renderWorkoutResults(workout) {
  const results = $('#generator-results');
  results.innerHTML = '';

  // Results header
  const header = createElement('div', { className: 'results-header' },
    createElement('div', { className: 'results-header__info' },
      createElement('h3', {}, `Your Workout`),
      createElement('span', { className: 'results-header__count text-sm text-muted' },
        `${workout.totalExercises} exercises · ~${workout.estimatedMinutes} min`)
    ),
    createElement('div', { className: 'flex gap-2' },
      createBtn('▶️ Start', 'btn--primary btn--sm', () => startWorkoutTracking(workout)),
      createBtn('💾 Save', 'btn--secondary btn--sm', () => handleSaveWorkout(workout)),
      createBtn('🔄 Regenerate', 'btn--secondary btn--sm', handleGenerate)
    )
  );
  results.appendChild(header);

  // Exercise list
  const list = createElement('div', { className: 'exercise-list stagger' });
  workout.exercises.forEach((ex, i) => {
    const diff = difficultyInfo(ex.difficulty);
    const card = createElement('div', { className: 'card exercise-card' },
      createElement('div', { className: 'exercise-card__number' }, `${i + 1}`),
      createElement('div', { className: 'exercise-card__info' },
        createElement('div', { className: 'exercise-card__name' }, ex.name),
        createElement('div', { className: 'exercise-card__muscles' },
          ...ex.muscles.map(m => createElement('span', { className: 'chip chip--sm' }, m)),
        ),
        createElement('div', { className: 'exercise-card__detail' }, `${ex.equipment} · ${ex.type}`)
      ),
      createElement('div', { className: 'exercise-card__stats' },
        createStat(ex.sets, 'Sets'),
        createStat(ex.reps, 'Reps'),
        createStat(`${ex.rest}s`, 'Rest'),
        createElement('span', { className: `badge ${diff.cls}` }, diff.label)
      )
    );
    list.appendChild(card);
  });

  results.appendChild(list);
}

async function handleSaveWorkout(workout) {
  const name = workout.name || `${workout.muscles.join(' & ')} Workout`;
  await saveWorkout({ name, ...workout });
  showToast(`"${name}" saved!`);
}

/* ==========================================
   PAGE: ROUTINE BUILDER
   ========================================== */
function initRoutine() {
  const goalSelect = $('#routine-goal');
  const daysSelect = $('#routine-days');
  const splitSelect = $('#routine-split');

  // Populate split options
  const splits = getSplitOptions();
  splits.forEach(s => {
    splitSelect.appendChild(createElement('option', { value: s.key }, s.name));
  });

  // Update days when split changes
  splitSelect.addEventListener('change', () => {
    state.routine.splitType = splitSelect.value;
    updateDaysOptions();
  });

  goalSelect.addEventListener('change', () => {
    state.routine.goal = goalSelect.value;
  });

  daysSelect.addEventListener('change', () => {
    state.routine.daysPerWeek = parseInt(daysSelect.value);
  });

  updateDaysOptions();

  $('#btn-generate-routine').addEventListener('click', handleGenerateRoutine);
}

function updateDaysOptions() {
  const daysSelect = $('#routine-days');
  const splits = getSplitOptions();
  const current = splits.find(s => s.key === state.routine.splitType);

  daysSelect.innerHTML = '';
  if (current) {
    current.dayOptions.forEach(d => {
      daysSelect.appendChild(createElement('option', { value: d.toString() }, `${d} days`));
    });
    state.routine.daysPerWeek = current.dayOptions[0];
  }
}

function handleGenerateRoutine() {
  const results = $('#routine-results');
  renderSkeletons(results, 7);

  setTimeout(() => {
    const routine = generateRoutine({
      goal: state.routine.goal,
      daysPerWeek: state.routine.daysPerWeek,
      splitType: state.routine.splitType,
    });

    state.routine.result = routine;
    renderRoutineResults(routine);
  }, 800);
}

function renderRoutineResults(routine) {
  const results = $('#routine-results');
  results.innerHTML = '';

  // Header
  const header = createElement('div', { className: 'results-header', style: 'margin-bottom: var(--space-6)' },
    createElement('div', {},
      createElement('h3', {}, `${routine.splitName} · ${routine.goal.charAt(0).toUpperCase() + routine.goal.slice(1)}`),
      createElement('p', { className: 'text-sm text-muted' }, `${routine.daysPerWeek} training days per week`)
    ),
    createElement('div', { className: 'flex gap-2' },
      createBtn('🔄 Regenerate', 'btn--secondary btn--sm', handleGenerateRoutine),
      createBtn('💾 Save Routine', 'btn--primary btn--sm', () => handleSaveRoutine(routine))
    )
  );
  results.appendChild(header);

  // Weekly calendar
  const calendar = createElement('div', { className: 'weekly-calendar stagger' });
  routine.week.forEach(day => {
    if (day.isRest) {
      const restCard = createElement('div', { className: 'card day-card day-card--rest' },
        createElement('div', { className: 'rest-icon' }, '😴'),
        createElement('div', { className: 'day-card__day' }, day.dayName),
        createElement('span', { className: 'day-card__type day-card__type--rest' }, 'Rest Day')
      );
      calendar.appendChild(restCard);
    } else {
      const dayCard = createElement('div', { className: 'card day-card' },
        createElement('div', { 
            className: 'day-card__header',
            style: 'cursor: pointer; user-select: none;',
            onClick: (e) => {
              const exercises = e.currentTarget.nextElementSibling;
              exercises.classList.toggle('hidden');
              const chevron = e.currentTarget.querySelector('.chevron');
              if (chevron) {
                chevron.textContent = exercises.classList.contains('hidden') ? '▼' : '▲';
              }
            }
          },
          createElement('span', { className: 'day-card__day' }, day.dayName),
          createElement('div', { style: 'display: flex; align-items: center; gap: var(--space-2)' },
            createElement('span', { className: 'day-card__type' }, day.label),
            createElement('span', { className: 'chevron text-muted text-sm' }, '▼')
          )
        ),
        createElement('div', { className: 'day-card__exercises hidden' },
          ...day.exercises.map(ex =>
            createElement('div', { className: 'day-exercise' },
              createElement('span', { className: 'day-exercise__name' }, ex.name),
              createElement('span', { className: 'day-exercise__prescription' }, `${ex.sets}×${ex.reps}`)
            )
          )
        )
      );
      calendar.appendChild(dayCard);
    }
  });

  results.appendChild(calendar);
}

async function handleSaveRoutine(routine) {
  const name = `${routine.splitName} (${routine.goal})`;
  await saveRoutine({ name, ...routine });
  showToast(`"${name}" routine saved!`);
}

/* ==========================================
   PAGE: EXERCISE LIBRARY
   ========================================== */
function renderLibrary() {
  const grid = $('#library-grid');
  const countEl = $('#library-count');
  if (!grid) return;

  const filtered = filterExercises({
    search: state.library.search,
    muscles: state.library.filter !== 'All' ? [state.library.filter] : [],
  });

  const total = getExerciseCount();
  countEl.textContent = `Showing ${filtered.length} of ${total} exercises`;

  grid.innerHTML = '';
  const fragment = document.createDocumentFragment();

  filtered.forEach((ex, i) => {
    const diff = difficultyInfo(ex.difficulty);
    const headerChildren = [
      createElement('span', { className: 'library-card__name' }, ex.name),
    ];
    if (ex.isCustom) headerChildren.push(createElement('span', { className: 'badge badge--custom' }, 'CUSTOM'));
    headerChildren.push(createElement('span', { className: `badge ${diff.cls}` }, diff.label));

    const card = createElement('div', { className: 'card library-card card--interactive' },
      createElement('div', { className: 'library-card__header' }, ...headerChildren),
      createElement('div', { className: 'library-card__muscles' },
        ...ex.muscles.map(m => createElement('span', { className: 'chip chip--sm' }, m))
      ),
      createElement('p', { className: 'library-card__desc' }, ex.description || 'No description provided.'),
      createElement('div', { className: 'library-card__footer' },
        createElement('span', {}, `🏋️ ${ex.equipment}`),
        createElement('span', {}, `${ex.type === 'compound' ? '🔗 Compound' : '🎯 Isolation'}`)
      )
    );
    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

function initLibrary() {
  // Search
  const searchInput = $('#library-search');
  let debounce;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.library.search = e.target.value;
      renderLibrary();
    }, 200);
  });

  // Muscle filter chips
  const filterContainer = $('#library-filters');
  ['All', ...MUSCLE_GROUPS].forEach(muscle => {
    const chip = createElement('button', {
      className: `chip ${muscle === 'All' ? 'active' : ''}`,
      dataset: { filter: muscle },
      onClick: () => {
        state.library.filter = muscle;
        $$('#library-filters .chip').forEach(c => c.classList.toggle('active', c.dataset.filter === muscle));
        renderLibrary();
      },
    }, muscle);
    filterContainer.appendChild(chip);
  });
}

/* ==========================================
   PAGE: SAVED
   ========================================== */
async function renderSaved() {
  const list = $('#saved-list');
  if (!list) return;

  if (state.saved.tab === 'workouts') {
    const workouts = await getWorkouts();
    if (!workouts.length) {
      list.innerHTML = '';
      list.appendChild(createEmptyState('🏋️', 'No saved workouts', 'Generate a workout and save it to see it here.'));
      return;
    }
    list.innerHTML = '';
    workouts.forEach(w => {
      const item = createElement('div', { className: 'card saved-item' },
        createElement('div', { 
            className: 'saved-item__info',
            style: 'flex: 1; cursor: pointer;',
            onClick: () => {
              state.generator.result = w;
              renderWorkoutResults(w);
              navigate('generator');
            }
          },
          createElement('span', { className: 'saved-item__title' }, w.name),
          createElement('div', { className: 'saved-item__meta' },
            createElement('span', {}, `${w.totalExercises || '?'} exercises`),
            createElement('span', {}, `~${w.estimatedMinutes || '?'} min`),
            createElement('span', {}, formatDate(w.savedAt))
          )
        ),
        createElement('div', { className: 'saved-item__actions' },
          createBtn('▶️ Start', 'btn--primary btn--sm', () => startWorkoutTracking(w)),
          createBtn('🗑️', 'btn--danger btn--icon btn--sm', async () => {
            await deleteWorkout(w.id);
            renderSaved();
            showToast('Workout deleted', 'info');
          })
        )
      );
      list.appendChild(item);
    });
  } else if (state.saved.tab === 'routines') {
    const routines = await getRoutines();
    if (!routines.length) {
      list.innerHTML = '';
      list.appendChild(createEmptyState('📋', 'No saved routines', 'Build a routine and save it to see it here.'));
      return;
    }
    list.innerHTML = '';
    routines.forEach(r => {
      const item = createElement('div', { className: 'card saved-item' },
        createElement('div', { 
            className: 'saved-item__info',
            style: 'flex: 1; cursor: pointer;',
            onClick: () => {
              state.routine.result = r;
              renderRoutineResults(r);
              navigate('routine');
            }
          },
          createElement('span', { className: 'saved-item__title' }, r.name),
          createElement('div', { className: 'saved-item__meta' },
            createElement('span', {}, `${r.splitName || 'Custom'}`),
            createElement('span', {}, `${r.daysPerWeek || '?'} days/week`),
            createElement('span', {}, formatDate(r.savedAt))
          )
        ),
        createElement('div', { className: 'saved-item__actions' },
          createBtn('🗑️', 'btn--danger btn--icon btn--sm', async () => {
            await deleteRoutine(r.id);
            renderSaved();
            showToast('Routine deleted', 'info');
          })
        )
      );
      list.appendChild(item);
    });
  } else if (state.saved.tab === 'history') {
    renderHistory();
  }
}

function initSaved() {
  $$('.saved__tabs .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.saved.tab = btn.dataset.tab;
      $$('.saved__tabs .btn').forEach(b => b.classList.toggle('active', b === btn));
      renderSaved();
    });
  });
}

/* ==========================================
   PAGE: ANALYTICS
   ========================================== */
async function renderAnalytics() {
  const content = $('#analytics-content');
  if (!content) return;

  renderSkeletons(content, 4);

  try {
    const logs = await getWorkoutLogs();
    
    if (!logs || !logs.length) {
      content.innerHTML = '';
      content.appendChild(createEmptyState('📊', 'No analytics available', 'Complete and log a workout session to see your stats here!'));
      return;
    }

    content.innerHTML = `
      <div class="analytics__kpis">
        <div class="card kpi-card">
          <div class="kpi-card__icon">🔥</div>
          <div class="kpi-card__content">
            <span class="kpi-card__label">Total Workouts</span>
            <span class="kpi-card__value" id="stats-total-workouts">0</span>
          </div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-card__icon">⏱️</div>
          <div class="kpi-card__content">
            <span class="kpi-card__label">Total Active Time</span>
            <span class="kpi-card__value" id="stats-total-time">0 min</span>
          </div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-card__icon">🏋️</div>
          <div class="kpi-card__content">
            <span class="kpi-card__label">Total Volume Lifted</span>
            <span class="kpi-card__value" id="stats-total-volume">0 kg</span>
          </div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-card__icon">📅</div>
          <div class="kpi-card__content">
            <span class="kpi-card__label">Consistency (7d)</span>
            <span class="kpi-card__value" id="stats-weekly-workouts">0 workouts</span>
          </div>
        </div>
      </div>

      <div class="card analytics__calendar-card">
        <h3>Weekly Consistency</h3>
        <p class="text-xs text-muted" style="margin-bottom: var(--space-4)">Your workouts this current week</p>
        <div class="analytics__calendar-days" id="analytics-weekly-days">
          <div class="calendar-day" data-day="1"><span class="day-name">M</span><span class="day-dot"></span></div>
          <div class="calendar-day" data-day="2"><span class="day-name">T</span><span class="day-dot"></span></div>
          <div class="calendar-day" data-day="3"><span class="day-name">W</span><span class="day-dot"></span></div>
          <div class="calendar-day" data-day="4"><span class="day-name">T</span><span class="day-dot"></span></div>
          <div class="calendar-day" data-day="5"><span class="day-name">F</span><span class="day-dot"></span></div>
          <div class="calendar-day" data-day="6"><span class="day-name">S</span><span class="day-dot"></span></div>
          <div class="calendar-day" data-day="0"><span class="day-name">S</span><span class="day-dot"></span></div>
        </div>
      </div>

      <div class="analytics__charts">
        <div class="card chart-card">
          <div class="chart-card__header">
            <h3>Recent Volume Trend</h3>
            <span class="text-xs text-muted">Total kg lifted (Last 7 workouts)</span>
          </div>
          <div class="chart-card__body" id="chart-volume-trend"></div>
        </div>

        <div class="card chart-card">
          <div class="chart-card__header">
            <h3>Muscle Focus Breakdown</h3>
            <span class="text-xs text-muted">Frequency based on exercises completed</span>
          </div>
          <div class="chart-card__body" id="chart-muscle-distribution"></div>
        </div>
      </div>

      <div class="analytics__achievements-section">
        <h3 style="margin-bottom: var(--space-4)">Milestones & Achievements</h3>
        <div class="analytics__achievements" id="analytics-achievements-list"></div>
      </div>
    `;

    let totalWorkouts = logs.length;
    let totalDurationSeconds = 0;
    let totalVolumeLifted = 0;
    let workoutsPast7Days = 0;
    let muscleFrequency = {};

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    const activeDaysThisWeek = new Set();

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

          if (ex.sets) {
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

    $('#stats-total-workouts').textContent = totalWorkouts;

    const hours = Math.floor(totalDurationSeconds / 3600);
    const minutes = Math.floor((totalDurationSeconds % 3600) / 60);
    $('#stats-total-time').textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    $('#stats-total-volume').textContent = `${totalVolumeLifted.toLocaleString()} kg`;
    $('#stats-weekly-workouts').textContent = `${workoutsPast7Days} workout${workoutsPast7Days !== 1 ? 's' : ''}`;

    const calendarDays = $$('#analytics-weekly-days .calendar-day');
    calendarDays.forEach(dayEl => {
      const dayIndex = parseInt(dayEl.dataset.day);
      if (activeDaysThisWeek.has(dayIndex)) {
        dayEl.classList.add('active');
      }
    });

    const recentLogs = [...logs].slice(0, 7).reverse();
    const volumeData = recentLogs.map(log => {
      let vol = 0;
      if (log.exercises) {
        log.exercises.forEach(ex => {
          if (ex.sets) {
            ex.sets.forEach(s => {
              if (s.completed) vol += (s.weight || 0) * (s.reps || 0);
            });
          }
        });
      }
      const d = new Date(log.loggedAt || log.date);
      return {
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: vol
      };
    });

    renderVolumeChart(volumeData);
    renderMuscleDistribution(muscleFrequency);
    renderAchievements(totalWorkouts, totalDurationSeconds, totalVolumeLifted);

  } catch (err) {
    console.error('Error rendering analytics:', err);
    content.innerHTML = '';
    content.appendChild(createEmptyState('✕', 'Failed to load analytics', 'Verify your backend server connection.'));
  }
}

function renderVolumeChart(data) {
  const container = $('#chart-volume-trend');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `<span class="text-muted text-sm">No data available</span>`;
    return;
  }

  const width = 360;
  const height = 200;
  const paddingBottom = 25;
  const paddingTop = 25;
  const paddingLeft = 10;
  const paddingRight = 10;

  const maxVal = Math.max(...data.map(d => d.value), 100);
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;

  const barWidth = Math.max(16, Math.floor(chartWidth / (data.length * 1.8)));
  const gap = Math.floor((chartWidth - (barWidth * data.length)) / (data.length + 1));

  let barsSvg = '';
  let gridLinesSvg = '';
  let labelsSvg = '';
  let valuesSvg = '';

  for (let i = 1; i <= 3; i++) {
    const yVal = paddingTop + (chartHeight / 4) * i;
    gridLinesSvg += `<line x1="${paddingLeft}" y1="${yVal}" x2="${width - paddingRight}" y2="${yVal}" class="chart-grid-line" />`;
  }

  data.forEach((d, idx) => {
    const x = paddingLeft + gap + idx * (barWidth + gap);
    const barHeight = (d.value / maxVal) * chartHeight;
    const y = height - paddingBottom - barHeight;

    barsSvg += `
      <rect 
        x="${x}" 
        y="${y}" 
        width="${barWidth}" 
        height="${barHeight}" 
        rx="4" 
        class="chart-bar"
      />
    `;

    labelsSvg += `
      <text x="${x + barWidth / 2}" y="${height - 5}" class="chart-axis-label">${d.label}</text>
    `;

    valuesSvg += `
      <text x="${x + barWidth / 2}" y="${y - 6}" class="chart-value-label">${d.value} kg</text>
    `;
  });

  container.innerHTML = `
    <svg class="svg-chart" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-accent-violet)" />
          <stop offset="100%" stop-color="var(--color-accent-indigo)" />
        </linearGradient>
        <linearGradient id="barHoverGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-accent-purple)" />
          <stop offset="100%" stop-color="var(--color-accent-cyan)" />
        </linearGradient>
      </defs>
      ${gridLinesSvg}
      ${barsSvg}
      ${labelsSvg}
      ${valuesSvg}
    </svg>
  `;
}

function renderMuscleDistribution(freq) {
  const container = $('#chart-muscle-distribution');
  if (!container) return;

  const sortedMuscles = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sortedMuscles.length === 0) {
    container.innerHTML = `<span class="text-muted text-sm">No data available</span>`;
    return;
  }

  const maxFreq = sortedMuscles[0][1];
  const muscleList = createElement('div', { className: 'muscle-list' });

  sortedMuscles.forEach(([name, count]) => {
    const percentage = Math.round((count / maxFreq) * 100);
    const row = createElement('div', { className: 'muscle-row' },
      createElement('div', { className: 'muscle-row__header' },
        createElement('span', { className: 'muscle-row__name' }, name),
        createElement('span', { className: 'muscle-row__count' }, `${count} set${count !== 1 ? 's' : ''}`)
      ),
      createElement('div', { className: 'muscle-row__track' },
        createElement('div', { 
          className: 'muscle-row__bar', 
          style: 'width: 0%'
        })
      )
    );
    muscleList.appendChild(row);

    setTimeout(() => {
      const bar = row.querySelector('.muscle-row__bar');
      if (bar) bar.style.width = `${percentage}%`;
    }, 100);
  });

  container.innerHTML = '';
  container.appendChild(muscleList);
}

function renderAchievements(workouts, duration, volume) {
  const container = $('#analytics-achievements-list');
  if (!container) return;

  const activeMinutes = Math.floor(duration / 60);

  const achievements = [
    {
      id: 'first-step',
      title: 'First Step',
      desc: 'Log your first completed workout.',
      icon: '🥉',
      rank: 'bronze',
      unlocked: workouts >= 1,
      statusText: workouts >= 1 ? 'Unlocked' : '0/1 workouts'
    },
    {
      id: 'carver',
      title: 'Consistent Carver',
      desc: 'Log 3 workouts to establish a routine.',
      icon: '🥈',
      rank: 'silver',
      unlocked: workouts >= 3,
      statusText: workouts >= 3 ? 'Unlocked' : `${workouts}/3 workouts`
    },
    {
      id: 'iron-warrior',
      title: 'Iron Warrior',
      desc: 'Lift a total combined volume of 1,000 kg.',
      icon: '🥇',
      rank: 'gold',
      unlocked: volume >= 1000,
      statusText: volume >= 1000 ? 'Unlocked' : `${volume}/1,000 kg`
    },
    {
      id: 'champion',
      title: 'Duration Champion',
      desc: 'Train for over 60 active minutes.',
      icon: '💎',
      rank: 'diamond',
      unlocked: activeMinutes >= 60,
      statusText: activeMinutes >= 60 ? 'Unlocked' : `${activeMinutes}/60 mins`
    }
  ];

  container.innerHTML = '';
  achievements.forEach(ach => {
    const card = createElement('div', { 
      className: `card achievement-card achievement-card--${ach.rank} ${ach.unlocked ? '' : 'achievement-card--locked'}` 
    },
      createElement('div', { className: 'achievement-card__badge' }, ach.icon),
      createElement('div', { className: 'achievement-card__info' },
        createElement('span', { className: 'achievement-card__title' }, ach.title),
        createElement('span', { className: 'achievement-card__desc' }, ach.desc),
        createElement('span', { className: 'achievement-card__status' }, ach.statusText)
      )
    );
    container.appendChild(card);
  });
}

/* ==========================================
   HELPERS
   ========================================== */
function createBtn(text, cls, onClick) {
  return createElement('button', { className: `btn ${cls}`, onClick }, text);
}

function createStat(value, label) {
  return createElement('div', { className: 'exercise-stat' },
    createElement('div', { className: 'exercise-stat__value' }, value.toString()),
    createElement('div', { className: 'exercise-stat__label' }, label)
  );
}

function createEmptyState(icon, title, text) {
  return createElement('div', { className: 'empty-state' },
    createElement('div', { className: 'empty-state__icon' }, icon),
    createElement('div', { className: 'empty-state__title' }, title),
    createElement('div', { className: 'empty-state__text' }, text)
  );
}

/* ==========================================
   PAGE: CREATE
   ========================================== */
function initCreate() {
  // Tab switching
  $$('[data-create-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.createTab;
      $$('[data-create-tab]').forEach(b => b.classList.toggle('active', b === btn));
      $('#create-panel-exercise').classList.toggle('hidden', tab !== 'exercise');
      $('#create-panel-routine').classList.toggle('hidden', tab !== 'routine');
    });
  });

  // --- Exercise Form ---
  const musclesEl = $('#ce-muscles');
  MUSCLE_GROUPS.forEach(m => {
    const chip = createElement('button', {
      className: 'chip', dataset: { muscle: m },
      onClick: () => {
        const idx = state.create.exerciseMuscles.indexOf(m);
        if (idx >= 0) state.create.exerciseMuscles.splice(idx, 1);
        else state.create.exerciseMuscles.push(m);
        $$('#ce-muscles .chip').forEach(c => c.classList.toggle('active', state.create.exerciseMuscles.includes(c.dataset.muscle)));
      }
    }, m);
    musclesEl.appendChild(chip);
  });

  const eqSelect = $('#ce-equipment');
  EQUIPMENT.forEach(eq => eqSelect.appendChild(createElement('option', { value: eq }, eq)));

  $('#btn-save-exercise').addEventListener('click', handleSaveExercise);

  // --- Custom Routine Builder ---
  $('#btn-add-day').addEventListener('click', () => {
    state.create.routineDays.push({ label: `Day ${state.create.routineDays.length + 1}`, exercises: [] });
    renderRoutineDays();
  });

  $('#btn-save-custom-routine').addEventListener('click', handleSaveCustomRoutine);

  // --- Exercise Picker Modal ---
  $('#picker-close').addEventListener('click', closePickerModal);
  $('#exercise-picker-modal').addEventListener('click', (e) => {
    if (e.target.id === 'exercise-picker-modal') closePickerModal();
  });
  $('#picker-confirm').addEventListener('click', confirmPickerSelection);

  let pickerDebounce;
  $('#picker-search').addEventListener('input', (e) => {
    clearTimeout(pickerDebounce);
    pickerDebounce = setTimeout(() => renderPickerList(e.target.value, state.create.pickerFilter), 150);
  });

  // Picker filter chips
  const pickerFilters = $('#picker-filters');
  ['All', ...MUSCLE_GROUPS].forEach(m => {
    const chip = createElement('button', {
      className: `chip ${m === 'All' ? 'active' : ''}`, dataset: { filter: m },
      onClick: () => {
        state.create.pickerFilter = m;
        $$('#picker-filters .chip').forEach(c => c.classList.toggle('active', c.dataset.filter === m));
        renderPickerList($('#picker-search').value, m);
      }
    }, m);
    pickerFilters.appendChild(chip);
  });
}

async function handleSaveExercise() {
  const name = $('#ce-name').value.trim();
  const muscles = [...state.create.exerciseMuscles];
  const equipment = $('#ce-equipment').value;
  const difficulty = parseInt($('#ce-difficulty').value);
  const type = $('#ce-type').value;
  const description = $('#ce-description').value.trim();

  if (!name) { showToast('Please enter an exercise name', 'error'); return; }
  if (!muscles.length) { showToast('Select at least one muscle group', 'error'); return; }

  await saveCustomExercise({ name, muscles, equipment, difficulty, type, description });
  await refreshCustomExercises();
  showToast(`"${name}" added to your exercises!`);

  // Reset form
  $('#ce-name').value = '';
  $('#ce-description').value = '';
  state.create.exerciseMuscles = [];
  $$('#ce-muscles .chip').forEach(c => c.classList.remove('active'));

  renderCustomExerciseList();
}

async function renderCustomExerciseList() {
  const list = $('#custom-exercise-list');
  const countEl = $('#custom-exercise-count');
  if (!list) return;

  const exercises = await getCustomExercises();
  countEl.textContent = `${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`;

  if (!exercises.length) {
    list.innerHTML = '';
    list.appendChild(createEmptyState('✨', 'No custom exercises yet', 'Use the form to add your own exercises.'));
    return;
  }

  list.innerHTML = '';
  exercises.forEach(ex => {
    const diff = difficultyInfo(ex.difficulty);
    const item = createElement('div', { className: 'custom-exercise-item' },
      createElement('div', { className: 'custom-exercise-item__info' },
        createElement('div', { className: 'custom-exercise-item__name' },
          ex.name,
          createElement('span', { className: `badge ${diff.cls}` }, diff.label)
        ),
        createElement('div', { className: 'custom-exercise-item__meta' },
          createElement('span', {}, ex.muscles.join(', ')),
          createElement('span', {}, ex.equipment),
          createElement('span', {}, ex.type)
        )
      ),
      createBtn('🗑️', 'btn--danger btn--icon btn--sm', async () => {
        await deleteCustomExercise(ex.id);
        await refreshCustomExercises();
        renderCustomExerciseList();
        showToast('Exercise removed', 'info');
      })
    );
    list.appendChild(item);
  });
}

// --- Custom Routine Builder ---
function renderRoutineDays() {
  const container = $('#custom-routine-days');
  if (!container) return;
  container.innerHTML = '';

  if (!state.create.routineDays.length) {
    container.appendChild(createEmptyState('📅', 'No days added', 'Click "Add Day" to start building your routine.'));
    return;
  }

  state.create.routineDays.forEach((day, dayIdx) => {
    const exerciseRows = createElement('div', { className: 'custom-day-card__exercises' });
    day.exercises.forEach((ex, exIdx) => {
      const row = createElement('div', { className: 'custom-day-exercise' },
        createElement('span', { className: 'custom-day-exercise__name' }, ex.name),
        createElement('span', { className: 'custom-day-exercise__label' }, 'Sets'),
        createElement('input', { type: 'number', value: ex.sets.toString(), min: '1', max: '10', dataset: { day: dayIdx.toString(), ex: exIdx.toString(), field: 'sets' } }),
        createElement('span', { className: 'custom-day-exercise__label' }, 'Reps'),
        createElement('input', { type: 'number', value: ex.reps.toString(), min: '1', max: '50', dataset: { day: dayIdx.toString(), ex: exIdx.toString(), field: 'reps' } }),
        createElement('span', { className: 'custom-day-exercise__label' }, 'Rest(s)'),
        createElement('input', { type: 'number', value: ex.rest.toString(), min: '0', max: '300', dataset: { day: dayIdx.toString(), ex: exIdx.toString(), field: 'rest' } }),
        createElement('button', { className: 'custom-day-exercise__remove', onClick: () => { day.exercises.splice(exIdx, 1); renderRoutineDays(); } }, '✕')
      );
      exerciseRows.appendChild(row);
    });

    // Listen for input changes on sets/reps/rest
    exerciseRows.addEventListener('input', (e) => {
      const { day: d, ex: ei, field } = e.target.dataset;
      if (d !== undefined && ei !== undefined && field) {
        state.create.routineDays[parseInt(d)].exercises[parseInt(ei)][field] = parseInt(e.target.value) || 0;
      }
    });

    const dayCard = createElement('div', { className: 'custom-day-card' },
      createElement('div', { className: 'custom-day-card__header' },
        createElement('div', { className: 'custom-day-card__title' },
          createElement('span', { className: 'font-bold text-muted text-sm' }, `Day ${dayIdx + 1}`),
          createElement('input', { type: 'text', value: day.label, placeholder: 'e.g. Push Day', onInput: (e) => { day.label = e.target.value; } })
        ),
        createElement('div', { className: 'custom-day-card__actions' },
          createBtn('➕ Exercise', 'btn--secondary btn--sm', () => openPickerModal(dayIdx)),
          createBtn('🗑️', 'btn--danger btn--icon btn--sm', () => {
            state.create.routineDays.splice(dayIdx, 1);
            renderRoutineDays();
          })
        )
      ),
      exerciseRows,
      day.exercises.length === 0 ? createElement('p', { className: 'text-sm text-muted text-center' }, 'No exercises yet — click "+ Exercise" to add some.') : null
    );
    container.appendChild(dayCard);
  });
}

async function handleSaveCustomRoutine() {
  const name = $('#cr-name').value.trim();
  if (!name) { showToast('Give your routine a name', 'error'); return; }
  if (!state.create.routineDays.length) { showToast('Add at least one day', 'error'); return; }
  const hasExercises = state.create.routineDays.some(d => d.exercises.length > 0);
  if (!hasExercises) { showToast('Add exercises to at least one day', 'error'); return; }

  const week = state.create.routineDays.map((day, i) => ({
    dayName: day.label || `Day ${i + 1}`,
    dayIndex: i,
    isRest: day.exercises.length === 0,
    label: day.label || `Day ${i + 1}`,
    muscles: [...new Set(day.exercises.flatMap(e => e.muscles || []))],
    exercises: day.exercises,
  }));

  await saveRoutine({
    name,
    splitName: 'Custom',
    goal: 'custom',
    daysPerWeek: state.create.routineDays.filter(d => d.exercises.length > 0).length,
    week,
    isCustom: true,
  });

  showToast(`"${name}" routine saved!`);
  $('#cr-name').value = '';
  state.create.routineDays = [];
  renderRoutineDays();
}

// --- Exercise Picker Modal ---
function openPickerModal(dayIndex) {
  state.create.pickerDayIndex = dayIndex;
  state.create.pickerSelected = [];
  state.create.pickerFilter = 'All';
  $('#picker-search').value = '';
  $$('#picker-filters .chip').forEach(c => c.classList.toggle('active', c.dataset.filter === 'All'));
  $('#exercise-picker-modal').classList.remove('hidden');
  renderPickerList('', 'All');
}

function closePickerModal() {
  $('#exercise-picker-modal').classList.add('hidden');
  state.create.pickerSelected = [];
}

function renderPickerList(search = '', muscleFilter = 'All') {
  const list = $('#picker-list');
  list.innerHTML = '';

  const filtered = filterExercises({
    search,
    muscles: muscleFilter !== 'All' ? [muscleFilter] : [],
  });

  filtered.forEach(ex => {
    const isSelected = state.create.pickerSelected.some(s => s.id === ex.id);
    const item = createElement('div', {
      className: `picker-item ${isSelected ? 'selected' : ''}`,
      onClick: () => {
        const idx = state.create.pickerSelected.findIndex(s => s.id === ex.id);
        if (idx >= 0) state.create.pickerSelected.splice(idx, 1);
        else state.create.pickerSelected.push(ex);
        renderPickerList(search, muscleFilter);
      }
    },
      createElement('div', { className: 'picker-item__checkbox' }, '✓'),
      createElement('div', { className: 'picker-item__info' },
        createElement('span', { className: 'picker-item__name' }, ex.name),
        createElement('span', { className: 'picker-item__detail' }, `${ex.muscles.join(', ')} · ${ex.equipment}`)
      ),
      createElement('span', { className: `badge ${difficultyInfo(ex.difficulty).cls}` }, difficultyInfo(ex.difficulty).label)
    );
    list.appendChild(item);
  });
}

function confirmPickerSelection() {
  const dayIdx = state.create.pickerDayIndex;
  if (dayIdx < 0 || !state.create.routineDays[dayIdx]) return;

  state.create.pickerSelected.forEach(ex => {
    state.create.routineDays[dayIdx].exercises.push({
      ...ex, sets: 3, reps: 10, rest: 60,
    });
  });

  closePickerModal();
  renderRoutineDays();
  if (state.create.pickerSelected.length) {
    showToast(`Added ${state.create.pickerSelected.length} exercise(s)`);
  }
}

/* ==========================================
   WORKOUT TRACKING SYSTEM
   ========================================== */

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35); // fade out
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (err) { /* silent */ }
}

function startWorkoutTracking(workout) {
  if (state.tracker.active) {
    if (!confirm('You have an active workout in progress. Abandon it and start a new one?')) {
      return;
    }
    cancelActiveWorkout();
  }

  state.tracker.active = true;
  state.tracker.workout = workout;
  state.tracker.durationSeconds = 0;
  state.tracker.loggedExercises = {};

  // Pre-fill sets array with target prescriptions
  workout.exercises.forEach((ex, exIdx) => {
    state.tracker.loggedExercises[exIdx] = Array.from({ length: ex.sets }, () => ({
      reps: ex.reps,
      weight: 0,
      completed: false
    }));
  });

  $('#tracker-workout-name').textContent = workout.name || 'Workout Session';
  $('#tracker-workout-meta').textContent = `${workout.exercises.length} exercises · ~${workout.estimatedMinutes || 30} min`;
  
  updateStopwatchDisplay();
  
  if (state.tracker.timerInterval) clearInterval(state.tracker.timerInterval);
  state.tracker.timerInterval = setInterval(() => {
    state.tracker.durationSeconds++;
    updateStopwatchDisplay();
  }, 1000);

  renderTrackerExercises();
  navigate('tracker');
}

function updateStopwatchDisplay() {
  const secs = state.tracker.durationSeconds;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n) => n.toString().padStart(2, '0');
  
  const formatted = h > 0 
    ? `${pad(h)}:${pad(m)}:${pad(s)}` 
    : `${pad(m)}:${pad(s)}`;
    
  $('#tracker-timer').textContent = formatted;
}

function renderTrackerExercises() {
  const container = $('#tracker-exercises');
  if (!container) return;
  container.innerHTML = '';

  state.tracker.workout.exercises.forEach((ex, exIdx) => {
    const card = createElement('div', { className: 'card tracker-exercise-card' },
      createElement('div', { className: 'tracker-exercise-card__header' },
        createElement('div', {},
          createElement('h4', { className: 'tracker-exercise-name' }, ex.name),
          createElement('span', { className: 'text-xs text-muted' }, `${ex.equipment} · ${ex.type}`)
        ),
        createElement('div', { className: 'tracker-exercise-card__muscles' },
          ...ex.muscles.map(m => createElement('span', { className: 'chip chip--sm' }, m))
        )
      )
    );

    const tableHeader = createElement('div', { className: 'tracker-sets-header' },
      createElement('span', { className: 'set-col-num' }, 'Set'),
      createElement('span', { className: 'set-col-target' }, 'Target'),
      createElement('span', { className: 'set-col-weight' }, 'Weight (kg)'),
      createElement('span', { className: 'set-col-reps' }, 'Reps'),
      createElement('span', { className: 'set-col-check' }, 'Done')
    );
    card.appendChild(tableHeader);

    const setsList = createElement('div', { className: 'tracker-sets-list' });
    
    state.tracker.loggedExercises[exIdx].forEach((set, setIdx) => {
      const isChecked = set.completed;
      
      const weightInput = createElement('input', {
        type: 'number',
        className: 'set-input-weight',
        value: set.weight === 0 ? '' : set.weight.toString(),
        placeholder: '0',
        disabled: isChecked,
        onInput: (e) => {
          set.weight = parseFloat(e.target.value) || 0;
        }
      });

      const repsInput = createElement('input', {
        type: 'number',
        className: 'set-input-reps',
        value: set.reps.toString(),
        placeholder: ex.reps.toString(),
        disabled: isChecked,
        onInput: (e) => {
          set.reps = parseInt(e.target.value) || 0;
        }
      });

      const checkBtn = createElement('button', {
        className: `btn-set-check ${isChecked ? 'checked' : ''}`,
        innerHTML: isChecked ? '✓' : '',
        onClick: () => {
          toggleSetCompletion(exIdx, setIdx, checkBtn, weightInput, repsInput, ex.rest);
        }
      });

      const setRow = createElement('div', { className: `tracker-set-row ${isChecked ? 'completed' : ''}` },
        createElement('span', { className: 'set-col-num' }, `${setIdx + 1}`),
        createElement('span', { className: 'set-col-target text-muted text-xs' }, `${ex.sets}x${ex.reps}`),
        createElement('div', { className: 'set-col-weight' }, weightInput),
        createElement('div', { className: 'set-col-reps' }, repsInput),
        createElement('div', { className: 'set-col-check' }, checkBtn)
      );

      setsList.appendChild(setRow);
    });

    card.appendChild(setsList);
    container.appendChild(card);
  });
}

function toggleSetCompletion(exIdx, setIdx, buttonEl, weightInput, repsInput, restTime) {
  const set = state.tracker.loggedExercises[exIdx][setIdx];
  const isChecked = !set.completed;
  set.completed = isChecked;

  buttonEl.classList.toggle('checked', isChecked);
  buttonEl.innerHTML = isChecked ? '✓' : '';
  
  const setRow = buttonEl.closest('.tracker-set-row');
  if (setRow) setRow.classList.toggle('completed', isChecked);
  
  weightInput.disabled = isChecked;
  repsInput.disabled = isChecked;

  if (isChecked) {
    set.weight = parseFloat(weightInput.value) || 0;
    set.reps = parseInt(repsInput.value) || 0;
    startRestTimer(restTime || 60);
  } else {
    stopRestTimer();
  }
}

function startRestTimer(seconds) {
  stopRestTimer();

  state.tracker.restTimer.total = seconds;
  state.tracker.restTimer.remaining = seconds;

  const overlay = $('#rest-timer-overlay');
  const countdownEl = $('#rest-timer-countdown');
  const progressEl = $('#rest-timer-progress');

  if (overlay) overlay.classList.remove('hidden');
  if (countdownEl) countdownEl.textContent = `${seconds}s`;
  if (progressEl) progressEl.style.width = '100%';

  state.tracker.restTimer.interval = setInterval(() => {
    state.tracker.restTimer.remaining--;
    const remaining = state.tracker.restTimer.remaining;
    const total = state.tracker.restTimer.total;

    if (countdownEl) countdownEl.textContent = `${remaining}s`;
    if (progressEl) progressEl.style.width = `${(remaining / total) * 100}%`;

    if (remaining <= 0) {
      stopRestTimer();
      playBeep();
      showToast('Rest over! Get to work!', 'info');
    }
  }, 1000);
}

function stopRestTimer() {
  if (state.tracker.restTimer.interval) {
    clearInterval(state.tracker.restTimer.interval);
    state.tracker.restTimer.interval = null;
  }
  const overlay = $('#rest-timer-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function addRestTime(seconds) {
  if (!state.tracker.restTimer.interval) return;
  state.tracker.restTimer.total += seconds;
  state.tracker.restTimer.remaining += seconds;
  
  const remaining = state.tracker.restTimer.remaining;
  const total = state.tracker.restTimer.total;
  
  const countdownEl = $('#rest-timer-countdown');
  const progressEl = $('#rest-timer-progress');
  if (countdownEl) countdownEl.textContent = `${remaining}s`;
  if (progressEl) progressEl.style.width = `${(remaining / total) * 100}%`;
}

function cancelActiveWorkout() {
  if (state.tracker.timerInterval) {
    clearInterval(state.tracker.timerInterval);
    state.tracker.timerInterval = null;
  }
  stopRestTimer();
  state.tracker.active = false;
  state.tracker.workout = null;
  state.tracker.durationSeconds = 0;
  state.tracker.loggedExercises = {};
  navigate('generator');
}

async function finishActiveWorkout() {
  let totalSetsCompleted = 0;
  const compiledExercises = [];

  state.tracker.workout.exercises.forEach((ex, exIdx) => {
    const loggedSets = state.tracker.loggedExercises[exIdx];
    const completedSets = loggedSets.filter(s => s.completed);
    
    if (completedSets.length > 0) {
      totalSetsCompleted += completedSets.length;
      compiledExercises.push({
        id: ex.id,
        name: ex.name,
        muscles: ex.muscles,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        type: ex.type,
        sets: loggedSets.map((s, idx) => ({
          setNumber: idx + 1,
          weight: s.weight,
          reps: s.reps,
          completed: s.completed
        }))
      });
    }
  });

  if (totalSetsCompleted === 0) {
    showToast('Please check off at least one completed set before finishing.', 'error');
    return;
  }

  const durationSeconds = state.tracker.durationSeconds;
  const name = state.tracker.workout.name || 'Workout Session';
  const logData = {
    durationSeconds,
    date: new Date().toISOString(),
    exercises: compiledExercises
  };

  try {
    await saveWorkoutLog({ name, ...logData });
    showToast('Workout logged successfully!');
  } catch (err) {
    showToast('Failed to save log to server. Saved locally!', 'info');
  }

  if (state.tracker.timerInterval) {
    clearInterval(state.tracker.timerInterval);
    state.tracker.timerInterval = null;
  }
  stopRestTimer();
  state.tracker.active = false;
  state.tracker.workout = null;
  state.tracker.durationSeconds = 0;
  state.tracker.loggedExercises = {};

  state.saved.tab = 'history';
  navigate('saved');
}

async function renderHistory() {
  const list = $('#saved-list');
  if (!list) return;

  renderSkeletons(list, 3);

  try {
    const logs = await getWorkoutLogs();
    if (!logs || !logs.length) {
      list.innerHTML = '';
      list.appendChild(createEmptyState('⏱️', 'No workout logs yet', 'Start tracking a workout and log your sets to see them here.'));
      return;
    }

    list.innerHTML = '';
    logs.forEach(log => {
      let totalVolume = 0;
      let totalReps = 0;
      let completedSetsCount = 0;

      log.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          if (set.completed) {
            totalVolume += (set.weight || 0) * (set.reps || 0);
            totalReps += set.reps || 0;
            completedSetsCount++;
          }
        });
      });

      const minutes = Math.floor(log.durationSeconds / 60);
      const seconds = log.durationSeconds % 60;
      const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      const card = createElement('div', { className: 'card history-item' },
        createElement('div', { 
            className: 'history-item__header',
            style: 'cursor: pointer; user-select: none;',
            onClick: (e) => {
              const details = e.currentTarget.nextElementSibling;
              details.classList.toggle('hidden');
              const chevron = e.currentTarget.querySelector('.chevron');
              if (chevron) {
                chevron.textContent = details.classList.contains('hidden') ? '▼' : '▲';
              }
            }
          },
          createElement('div', { className: 'history-item__info' },
            createElement('span', { className: 'history-item__title' }, log.name),
            createElement('div', { className: 'history-item__meta' },
              createElement('span', {}, `⏱️ ${durationStr}`),
              createElement('span', {}, `🔥 ${completedSetsCount} sets`),
              createElement('span', {}, `🏋️ ${totalVolume} kg volume`),
              createElement('span', {}, formatDate(log.loggedAt))
            )
          ),
          createElement('div', { style: 'display: flex; align-items: center; gap: var(--space-4)' },
            createElement('span', { className: 'chevron text-muted text-sm' }, '▼'),
            createBtn('🗑️', 'btn--danger btn--icon btn--sm', async (e) => {
              e.stopPropagation();
              if (confirm('Delete this workout log?')) {
                await deleteWorkoutLog(log.id);
                renderHistory();
                showToast('Log deleted', 'info');
              }
            })
          )
        ),
        createElement('div', { className: 'history-item__details hidden' },
          ...log.exercises.map(ex => 
            createElement('div', { className: 'history-exercise-row' },
              createElement('div', { className: 'history-exercise-name' }, ex.name),
              createElement('div', { className: 'history-exercise-sets' },
                ex.sets.filter(s => s.completed).map(s => 
                  createElement('span', { className: 'history-set-badge' }, `${s.weight}kg × ${s.reps}`)
                )
              )
            )
          )
        )
      );
      list.appendChild(card);
    });
  } catch (err) {
    list.innerHTML = '';
    list.appendChild(createEmptyState('✕', 'Failed to load logs', 'Make sure your backend server is running correctly.'));
  }
}

/* ==========================================
   INIT
   ========================================== */
async function init() {
  // Load custom exercises cache from API on startup
  await refreshCustomExercises();

  // Sync offline data if online
  if (navigator.onLine) {
    await handleSyncOffline();
  }

  // Listen for online/offline events
  window.addEventListener('online', () => {
    showToast('You are back online!', 'success');
    handleSyncOffline();
  });

  window.addEventListener('offline', () => {
    showToast('Connection lost. Working offline.', 'info');
  });

  // Nav links
  $$('.navbar__link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.page);
    });
  });

  // Logo click
  $('.navbar__logo').addEventListener('click', () => navigate('home'));

  // Mobile menu
  const toggle = $('.navbar__mobile-toggle');
  const links = $('.navbar__links');
  if (toggle) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    $$('.navbar__link').forEach(link => {
      link.addEventListener('click', () => links.classList.remove('open'));
    });
  }

  // Hero CTA buttons
  const heroGenBtn = $('#hero-generate');
  const heroRoutineBtn = $('#hero-routine');
  if (heroGenBtn) heroGenBtn.addEventListener('click', () => navigate('generator'));
  if (heroRoutineBtn) heroRoutineBtn.addEventListener('click', () => navigate('routine'));

  // Init pages
  initGenerator();
  initRoutine();
  initLibrary();
  initSaved();
  initCreate();
  initRouter();

  // Active tracker buttons
  const btnCancelWorkout = $('#btn-cancel-workout');
  if (btnCancelWorkout) {
    btnCancelWorkout.addEventListener('click', () => {
      if (confirm('Are you sure you want to cancel and abandon your active workout?')) {
        cancelActiveWorkout();
      }
    });
  }

  const btnFinishWorkout = $('#btn-finish-workout');
  if (btnFinishWorkout) {
    btnFinishWorkout.addEventListener('click', finishActiveWorkout);
  }

  // Rest Timer overlay buttons
  const btnRestAdd30 = $('#btn-rest-add-30');
  if (btnRestAdd30) {
    btnRestAdd30.addEventListener('click', () => addRestTime(30));
  }

  const btnRestSkip = $('#btn-rest-skip');
  if (btnRestSkip) {
    btnRestSkip.addEventListener('click', stopRestTimer);
  }
}

document.addEventListener('DOMContentLoaded', init);

