'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Dumbbell, Sparkles, ChevronRight, Award, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import GeneratorTab from '@/components/GeneratorTab';
import RoutinesTab from '@/components/RoutinesTab';
import LibraryTab from '@/components/LibraryTab';
import CreateTab from '@/components/CreateTab';
import TrackerTab from '@/components/TrackerTab';
import AnalyticsTab from '@/components/AnalyticsTab';
import SavedTab from '@/components/SavedTab';
import { setCustomExercisesCache } from '@/lib/data';
import { getCustomExercises, syncOfflineData } from '@/lib/storage';
import AuthModal from '@/components/AuthModal';
import ProfileTab from '@/components/ProfileTab';
import ProfileSetupModal from '@/components/ProfileSetupModal';

export default function MainPage() {
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [motivationEnabled, setMotivationEnabled] = useState(false);
  const [motivationHours, setMotivationHours] = useState([8, 12, 15, 18, 21]);
  
  // Active session recovery state
  const [savedSession, setSavedSession] = useState(null);
  
  // Custom caches / selections to prefill tabs
  const [prefilledWorkout, setPrefilledWorkout] = useState(null);
  const [prefilledRoutine, setPrefilledRoutine] = useState(null);
  const [prefilledMuscles, setPrefilledMuscles] = useState(null);

  // React-based toast notifications state
  const [toasts, setToasts] = useState([]);

  const needsProfileSetup = !!(user && (!user.profile || !user.profile.age || !user.profile.weight || !user.profile.height));

  useEffect(() => {
    if (needsProfileSetup) {
      setWizardOpen(true);
    } else {
      setWizardOpen(false);
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Load user session and check URL params
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          localStorage.setItem('wg_user', JSON.stringify(data));
        } else if (res.status === 401) {
          // If explicitly unauthorized, clear cached user
          setUser(null);
          localStorage.removeItem('wg_user');
        }
      } catch (err) {
        console.warn('Session check failed:', err);
        // Offline fallback: try to load cached user details
        const cachedUser = localStorage.getItem('wg_user');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch (e) {
            localStorage.removeItem('wg_user');
          }
        }
      }
    }
    
    checkSession();

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('login_success')) {
        showToast('Successfully signed in! 🚀', 'success');
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        // Clear old caches for clean user login
        clearUserCaches();
        checkSession();
      } else if (urlParams.has('error')) {
        const errType = urlParams.get('error');
        if (errType === 'google_not_configured') {
          showToast('Google login is not configured in .env. Please check credentials.', 'error');
        } else {
          showToast('Authentication failed. Please try again.', 'error');
        }
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (authModalOpen || wizardOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [authModalOpen, wizardOpen]);

  const clearUserCaches = () => {
    localStorage.removeItem('wg_workouts_cache');
    localStorage.removeItem('wg_routines_cache');
    localStorage.removeItem('wg_custom_exercises_cache');
    localStorage.removeItem('wg_workout_logs_cache');
    localStorage.removeItem('wg_deleted_workouts');
    localStorage.removeItem('wg_deleted_routines');
    localStorage.removeItem('wg_deleted_exercises');
    localStorage.removeItem('wg_deleted_logs');
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        localStorage.removeItem('wg_user');
        clearUserCaches();
        showToast('Signed out successfully. Using offline local storage. 👋', 'info');
      } else {
        showToast('Failed to sign out. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Error signing out', 'error');
    }
  };

  const handleSyncData = async () => {
    if (!user) {
      showToast('Please sign in to sync your data to the cloud.', 'error');
      return;
    }
    showToast('Syncing your local data to the database...', 'info');
    try {
      const didSync = await syncOfflineData();
      if (didSync) {
        showToast('Offline data synced with database successfully! 🔌', 'success');
        refreshCustomExercises();
      } else {
        showToast('All local data is already up to date with the server.', 'info');
      }
    } catch (err) {
      showToast('Failed to sync offline data. Try again later.', 'error');
    }
  };

  const syncSettingsToCache = async (enabled, hours) => {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    try {
      const cache = await caches.open('forgefit-settings-cache');
      await cache.put(
        new Request('/offline-settings.json'),
        new Response(JSON.stringify({ enabled, hours }))
      );
    } catch (e) {
      console.warn('[Cache Sync] Failed to cache settings:', e);
    }
  };

  const checkDailyMotivation = async () => {
    if (typeof window === 'undefined') return;
    
    const optedIn = localStorage.getItem('wg_motivation_enabled') === 'true';
    if (!optedIn) return;

    let hours = [8, 12, 15, 18, 21];
    const savedHours = localStorage.getItem('wg_motivation_hours');
    if (savedHours) {
      try {
        hours = JSON.parse(savedHours);
      } catch (e) { /* fallback */ }
    }

    const todayStr = new Date().toDateString();
    const currentHour = new Date().getHours();

    const lastDate = localStorage.getItem('wg_last_motivation_date');
    const lastHourKey = localStorage.getItem('wg_last_motivation_hour_key');
    const currentHourKey = `${todayStr}:${currentHour}`;

    const passedHours = hours.filter(h => h <= currentHour);
    if (passedHours.length === 0) return;

    const targetHour = Math.max(...passedHours);
    const targetKey = `${todayStr}:${targetHour}`;

    // Share already-notified state with the Service Worker via cache
    let alreadyNotified = false;
    if ('caches' in window) {
      try {
        const cache = await caches.open('forgefit-settings-cache');
        const lastKeyResponse = await cache.match('/last-notification-hour.json');
        if (lastKeyResponse) {
          const lastKeyData = await lastKeyResponse.json();
          if (lastKeyData.key === targetKey) {
            alreadyNotified = true;
          }
        }
      } catch (e) {
        console.warn('Failed to check notification cache:', e);
      }
    }

    if (alreadyNotified) return;

    let shouldNotify = false;

    // 1. If it's a scheduled hour and we haven't notified for this hour today
    if (hours.includes(currentHour) && lastHourKey !== currentHourKey) {
      shouldNotify = true;
    }
    // 2. Fallback: If we haven't notified at all today
    else if (lastDate !== todayStr) {
      shouldNotify = true;
    }

    if (shouldNotify) {
      const quotes = [
        "No pain, no gain. Shut up and train! ⚡",
        "The only bad workout is the one that didn't happen. 🏋️‍♂️",
        "Your body can stand almost anything. Convince your mind! 🧠",
        "Success isn't always about greatness. It's about consistency. 🎯",
        "Dream extreme. Train insane. Obtain the gain. 💪",
        "You don't have to be extreme, just consistent. 🔥",
        "Action is the foundational key to all success. 🚀",
        "Energy flows where attention goes. Focus on your strength! 🌟",
        "Don't limit your challenges. Challenge your limits. 🏔️",
        "Strength comes from an indomitable will! 🦁",
        "What hurts today makes you stronger tomorrow. 🌅",
        "Remember why you started. Push harder today! ⚡",
        "Your future self will thank you for the work you put in today. 🏆"
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

      showToast(randomQuote, 'info');

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification("ForgeFit Motivation ⚡", {
            body: randomQuote,
            icon: '/icon-192.png'
          });
        } catch (e) {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification("ForgeFit Motivation ⚡", {
                body: randomQuote,
                icon: '/icon-192.png'
              });
            });
          }
        }
      }

      localStorage.setItem('wg_last_motivation_date', todayStr);
      localStorage.setItem('wg_last_motivation_hour_key', currentHourKey);

      // Save to cache as well so the Service Worker knows we notified!
      if ('caches' in window) {
        try {
          const cache = await caches.open('forgefit-settings-cache');
          await cache.put(
            new Request('/last-notification-hour.json'),
            new Response(JSON.stringify({ key: targetKey }))
          );
        } catch (e) {
          console.warn('Failed to save notification cache:', e);
        }
      }
    }
  };

  const handleToggleHour = (hour) => {
    setMotivationHours(prev => {
      let updated;
      if (prev.includes(hour)) {
        if (prev.length <= 1) {
          showToast('Please keep at least one notification hour selected.', 'error');
          return prev;
        }
        updated = prev.filter(h => h !== hour);
      } else {
        updated = [...prev, hour].sort((a, b) => a - b);
      }
      localStorage.setItem('wg_motivation_hours', JSON.stringify(updated));
      syncSettingsToCache(motivationEnabled, updated);
      return updated;
    });
  };

  const handleToggleMotivation = async () => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      showToast('System notifications are not supported in this browser.', 'error');
      return;
    }

    if (motivationEnabled) {
      localStorage.setItem('wg_motivation_enabled', 'false');
      setMotivationEnabled(false);
      showToast('Daily motivational reminders disabled.', 'info');
      await syncSettingsToCache(false, motivationHours);
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('wg_motivation_enabled', 'true');
        setMotivationEnabled(true);
        showToast('Daily notifications enabled! 🔔', 'success');
        await syncSettingsToCache(true, motivationHours);
        
        try {
          new Notification("ForgeFit Motivation ⚡", {
            body: "Welcome to ForgeFit Daily Reminders! Let's crush your goals today! 🏋️‍♂️",
            icon: '/icon-192.png'
          });
        } catch (e) {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification("ForgeFit Motivation ⚡", {
                body: "Welcome to ForgeFit Daily Reminders! Let's crush your goals today! 🏋️‍♂️",
                icon: '/icon-192.png'
              });
            });
          }
        }

        setTimeout(() => {
          checkDailyMotivation();
        }, 1500);
      } else {
        showToast('Notification permission was denied. Enable it in your settings.', 'error');
      }
    }
  };

  const refreshCustomExercises = async () => {
    try {
      const data = await getCustomExercises();
      setCustomExercisesCache(data);
    } catch { /* silent */ }
  };

  // On Mount: Load custom exercises, set up offline sync listener, register Service Worker
  useEffect(() => {
    refreshCustomExercises();

    if (typeof window !== 'undefined') {
      const isEnabled = localStorage.getItem('wg_motivation_enabled') === 'true';
      setMotivationEnabled(isEnabled);

      let activeHours = [8, 12, 15, 18, 21];
      const savedHours = localStorage.getItem('wg_motivation_hours');
      if (savedHours) {
        try {
          activeHours = JSON.parse(savedHours);
          setMotivationHours(activeHours);
        } catch (e) { /* fallback */ }
      }

      // Sync settings to cache on mount
      syncSettingsToCache(isEnabled, activeHours);

      if (isEnabled) {
        setTimeout(() => {
          checkDailyMotivation();
        }, 2000);
      }
    }

    // Register Service Worker for PWA offline capabilities
    if ('serviceWorker' in navigator) {
      // Listen for version updates from Service Worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'VERSION_UPDATE') {
          const lastReloadedVersion = localStorage.getItem('wg_last_reloaded_version');
          if (lastReloadedVersion !== event.data.version) {
            localStorage.setItem('wg_last_reloaded_version', event.data.version);
            showToast('App successfully updated to the latest version! 🚀', 'info');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        }
      });

      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('[Service Worker] Registered with scope:', reg.scope);
          reg.update();

          // Register periodic sync for PWA background motivation checking directly
          if ('periodicSync' in reg) {
            reg.periodicSync.register('motivation-check', {
              minInterval: 60 * 60 * 1000, // hourly interval
            }).then(() => {
              console.log('[Periodic Sync] Registered motivation-check successfully');
            }).catch(err => {
              // Gracefully handle browser restrictions (e.g. app not installed yet)
              console.log('[Periodic Sync] Background sync registration deferred:', err.message);
            });
          }
        })
        .catch(err => console.error('[Service Worker] Registration failed:', err));
    }

    const handleSync = async () => {
      if (navigator.onLine) {
        try {
          const didSync = await syncOfflineData();
          if (didSync) {
            showToast('Synced offline data with server database! 🔌', 'success');
            refreshCustomExercises();
          }
        } catch (err) {
          console.error('[Offline Sync Error]', err);
        }
      }
    };

    window.addEventListener('online', handleSync);
    if (navigator.onLine) {
      handleSync();
    }

    const interval = setInterval(() => {
      if (localStorage.getItem('wg_motivation_enabled') === 'true') {
        checkDailyMotivation();
      }
    }, 300000); // Check every 5 mins

    return () => {
      window.removeEventListener('online', handleSync);
      clearInterval(interval);
    };
  }, []);

  // Redirect guest if they try to access restricted pages
  useEffect(() => {
    if (!user && ['create', 'analytics', 'saved', 'tracker'].includes(currentPage)) {
      setCurrentPage('home');
    }
  }, [user, currentPage]);

  // Check saved session in localStorage
  const checkSavedSession = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wg_active_session');
      if (saved) {
        try {
          setSavedSession(JSON.parse(saved));
        } catch (e) {
          localStorage.removeItem('wg_active_session');
          setSavedSession(null);
        }
      } else {
        setSavedSession(null);
      }
    }
  };

  // Check for saved session on navigation or state change
  useEffect(() => {
    checkSavedSession();
  }, [currentPage, activeWorkout]);

  // Handle active workout tracking redirection
  const handleStartWorkout = (workoutTemplate) => {
    if (!user) {
      showToast('Please sign in to track your workouts! 🏋️‍♂️', 'info');
      setAuthModalOpen(true);
      return;
    }
    // Clear any conflicting saved sessions
    localStorage.removeItem('wg_active_session');
    setSavedSession(null);

    setActiveWorkout(workoutTemplate);
    setCurrentPage('tracker');
    showToast('Workout session started! Timer running.', 'success');
  };

  // Inspect workout/routine from Saved Library
  const handleInspectWorkout = (workout) => {
    setPrefilledWorkout(workout);
    setCurrentPage('generator');
  };

  const handleInspectRoutine = (routine) => {
    setPrefilledRoutine(routine);
    setCurrentPage('routine');
  };

  // Analytics AI recommendations trigger
  const handlePrefillMuscles = (muscles) => {
    setPrefilledMuscles(muscles);
    setCurrentPage('generator');
  };

  // Finish session tracker callback
  const handleFinishWorkout = () => {
    setActiveWorkout(null);
    setCurrentPage('analytics');
    localStorage.removeItem('wg_active_session');
    setSavedSession(null);
  };

  const handleCancelWorkout = () => {
    setActiveWorkout(null);
    setCurrentPage('home');
    showToast('Session cancelled', 'info');
    localStorage.removeItem('wg_active_session');
    setSavedSession(null);
  };

  const handleResumeSavedSession = () => {
    if (savedSession) {
      setActiveWorkout(savedSession.workout);
      setCurrentPage('tracker');
      showToast('Resumed active workout! 💪', 'success');
    }
  };

  const handleDiscardSavedSession = () => {
    if (confirm('Are you sure you want to discard your saved workout progress? This cannot be undone.')) {
      localStorage.removeItem('wg_active_session');
      setSavedSession(null);
      showToast('Saved workout session discarded.', 'info');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Navigation Bar */}
      <Navbar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        user={user}
        onSignInClick={() => setAuthModalOpen(true)}
        onSignOutClick={handleSignOut}
        onSyncClick={handleSyncData}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        
        {/* Saved Session Resume Banner */}
        {savedSession && currentPage !== 'tracker' && (
          <div className="w-full max-w-4xl mx-auto px-4 pt-6 animate-slide-down">
            <div className="relative group overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan shadow-xl shadow-accent-purple/10">
              {/* Glassmorphic inner container */}
              <div className="glass-card rounded-[14px] p-4 bg-[#12121a]/90 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
                
                <div className="flex items-center gap-4 text-left w-full md:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple text-xl shrink-0 animate-pulse">
                    ⚡
                  </div>
                  <div>
                    <span className="text-[10px] text-accent-cyan uppercase tracking-wider font-extrabold block">Unfinished Workout Detected</span>
                    <h4 className="font-heading font-bold text-sm text-white mt-0.5">
                      Resume "{savedSession.workout?.name || 'Workout Session'}"?
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Paused at {Math.floor(savedSession.elapsedSeconds / 60)}m {savedSession.elapsedSeconds % 60}s · {savedSession.loggedExercises?.length || 0} exercises tracked
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
                  <button
                    onClick={handleDiscardSavedSession}
                    className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-white/5 hover:bg-accent-rose/10 hover:text-accent-rose border border-white/5 hover:border-accent-rose/20 text-text-secondary font-bold text-xs transition-all cursor-pointer text-center"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleResumeSavedSession}
                    className="flex-1 md:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 text-white font-extrabold text-xs shadow-md shadow-accent-purple/25 transition-all cursor-pointer text-center"
                  >
                    Resume Workout
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Active Tracker Tab takes full priority if running */}
        {currentPage === 'tracker' && activeWorkout ? (
          <TrackerTab
            workout={activeWorkout}
            onCancelWorkout={handleCancelWorkout}
            onFinishWorkout={handleFinishWorkout}
            showToast={showToast}
          />
        ) : (
          <>
            {/* SPA tab routing */}
            {currentPage === 'home' && (
              <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 space-y-16 animate-fade-in">
                
                {/* Hero Section */}
                <div className="text-center space-y-6 max-w-3xl mx-auto relative">
                  <div className="absolute inset-0 -top-20 -z-10 blur-3xl opacity-20 bg-gradient-to-b from-accent-purple via-accent-indigo to-transparent h-[400px]"></div>
                  
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-text-secondary select-none">
                    <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse"></span>
                    Smart Training Assistant
                  </div>

                  <h1 className="font-heading font-black text-4xl sm:text-6xl text-white tracking-tight leading-tight sm:leading-none">
                    Build Your Perfect <span className="text-gradient">Workout</span>
                  </h1>

                  <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                    Instantly generate personalized workouts and weekly routines tailored to your target muscles, splits, and equipment availability.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button
                      onClick={() => setCurrentPage('generator')}
                      className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan hover:opacity-90 font-bold text-white shadow-lg shadow-accent-purple/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Flame className="w-5 h-5 fill-white" />
                      ⚡ Generate Workout
                    </button>
                    <button
                      onClick={() => setCurrentPage('routine')}
                      className="px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-5 h-5" />
                      📋 Build Routine
                    </button>
                  </div>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6">
                  <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
                    <span className="font-heading font-black text-3xl text-white block">80+</span>
                    <span className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold block">Exercises</span>
                  </div>
                  <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
                    <span className="font-heading font-black text-3xl text-white block">5</span>
                    <span className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold block">Split Options</span>
                  </div>
                  <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
                    <span className="font-heading font-black text-3xl text-white block">11</span>
                    <span className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold block">Muscle Areas</span>
                  </div>
                  <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
                    <span className="font-heading font-black text-3xl text-white block">∞</span>
                    <span className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold block">Combinations</span>
                  </div>
                </div>

                {/* Daily Motivation Setup */}
                <div className="max-w-xl mx-auto w-full glass-card rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col gap-4 hover:border-white/10 transition-colors animate-fade-in">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple text-2xl shrink-0">
                        🔔
                      </div>
                      <div className="text-left">
                        <h4 className="font-heading font-bold text-white text-sm">Motivational Reminders</h4>
                        <p className="text-xs text-text-secondary mt-0.5 leading-normal">
                          Get multiple reminders throughout the day to stay active.
                        </p>
                      </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        checked={motivationEnabled}
                        onChange={handleToggleMotivation}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/5 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-accent-indigo peer-checked:to-accent-purple peer-checked:border-transparent transition-all duration-300 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow-sm after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                  </div>

                  {motivationEnabled && (
                    <div className="border-t border-white/5 pt-4 animate-slide-up space-y-3">
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block text-left">
                        Trigger Times
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { hour: 8, label: '8 AM', icon: '🌅' },
                          { hour: 12, label: '12 PM', icon: '☀️' },
                          { hour: 15, label: '3 PM', icon: '☕' },
                          { hour: 18, label: '6 PM', icon: '🌆' },
                          { hour: 21, label: '9 PM', icon: '🌙' }
                        ].map(({ hour, label, icon }) => {
                          const active = motivationHours.includes(hour);
                          return (
                            <button
                              key={hour}
                              onClick={() => handleToggleHour(hour)}
                              className={`py-2 px-1 rounded-xl text-[11px] font-semibold border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                active
                                  ? 'bg-accent-purple/20 border-accent-purple text-white shadow-md'
                                  : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/10 hover:text-white'
                              }`}
                            >
                              <span className="text-sm">{icon}</span>
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Features Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-8">
                  
                  {/* Feature 1 */}
                  <div
                    onClick={() => setCurrentPage('generator')}
                    className="glass-card rounded-2xl p-6 border border-white/5 cursor-pointer hover:border-white/15 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan text-xl mb-4 group-hover:scale-105 transition-transform">
                        🎯
                      </div>
                      <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-accent-cyan transition-colors">
                        Smart Generation
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Procedural or Gemini-powered workout planning matching muscle splits, set prescriptions, and proper volume load.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-accent-cyan font-bold uppercase tracking-wider mt-4">
                      Open Generator <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div
                    onClick={() => setCurrentPage('routine')}
                    className="glass-card rounded-2xl p-6 border border-white/5 cursor-pointer hover:border-white/15 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple text-xl mb-4 group-hover:scale-105 transition-transform">
                        📅
                      </div>
                      <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-accent-purple transition-colors">
                        Routine Builder
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Push/Pull/Legs, Arnold Splits, Upper/Lower, or custom setups. Design structural weekly planners for complete consistency.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-accent-purple font-bold uppercase tracking-wider mt-4">
                      Create Routine <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div
                    onClick={() => {
                      if (!user) {
                        showToast('Please sign in to view your saved workouts! 💾', 'info');
                        setAuthModalOpen(true);
                      } else {
                        setCurrentPage('saved');
                      }
                    }}
                    className="glass-card rounded-2xl p-6 border border-white/5 cursor-pointer hover:border-white/15 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center text-accent-amber text-xl mb-4 group-hover:scale-105 transition-transform">
                        💾
                      </div>
                      <h3 className="font-heading font-bold text-lg text-white mb-2 group-hover:text-accent-amber transition-colors">
                        Save & Revisit
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Log workout templates, custom split configurations, and access local storage offline fallbacks directly.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-accent-amber font-bold uppercase tracking-wider mt-4">
                      View Library <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                </div>

              </div>
            )}

            {currentPage === 'generator' && (
              <GeneratorTab
                key={user ? user.id : 'guest'}
                onStartWorkout={handleStartWorkout}
                showToast={showToast}
                user={user}
                onSignInClick={() => setAuthModalOpen(true)}
                // Inspect variables
                prefilledWorkout={prefilledWorkout}
                clearPrefill={() => setPrefilledWorkout(null)}
                prefilledMuscles={prefilledMuscles}
                clearPrefilledMuscles={() => setPrefilledMuscles(null)}
              />
            )}

            {currentPage === 'routine' && (
              <RoutinesTab
                key={user ? user.id : 'guest'}
                showToast={showToast}
                user={user}
                onSignInClick={() => setAuthModalOpen(true)}
                prefilledRoutine={prefilledRoutine}
                clearPrefill={() => setPrefilledRoutine(null)}
                onStartWorkout={handleStartWorkout}
                onSendToGenerator={handleInspectWorkout}
              />
            )}

            {currentPage === 'library' && (
              <LibraryTab
                key={user ? user.id : 'guest'}
                onStartWorkout={handleStartWorkout}
                onInspectWorkout={handleInspectWorkout}
                onInspectRoutine={handleInspectRoutine}
                showToast={showToast}
              />
            )}

            {currentPage === 'create' && (
              <CreateTab
                key={user ? user.id : 'guest'}
                showToast={showToast}
                refreshCache={refreshCustomExercises}
              />
            )}

            {currentPage === 'analytics' && (
              <AnalyticsTab
                key={user ? user.id : 'guest'}
                onPrefillGenerator={handlePrefillMuscles}
                showToast={showToast}
              />
            )}

            {currentPage === 'saved' && (
              <SavedTab
                key={user ? user.id : 'guest'}
                onStartWorkout={handleStartWorkout}
                onInspectWorkout={handleInspectWorkout}
                onInspectRoutine={handleInspectRoutine}
                showToast={showToast}
              />
            )}

            {currentPage === 'profile' && (
              <ProfileTab
                key={user ? user.id : 'guest'}
                user={user}
                onUpdateUser={(updated) => setUser(updated)}
                showToast={showToast}
              />
            )}
          </>
        )}

      </main>

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => {
          const typeCls = toast.type === 'error' 
            ? 'bg-accent-rose text-white border-accent-rose' 
            : toast.type === 'info'
            ? 'bg-accent-indigo text-white border-accent-indigo'
            : 'bg-[#12121a] border-accent-purple/30 text-white';

          return (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold flex items-center gap-2 pointer-events-auto transition-all animate-fade-in min-w-[200px] max-w-[320px] ${typeCls}`}
            >
              <span>{toast.type === 'error' ? '✕' : toast.type === 'info' ? 'ℹ' : '✓'}</span>
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(userData) => {
          clearUserCaches();
          setUser(userData);
          localStorage.setItem('wg_user', JSON.stringify(userData));
          // Auto-trigger sync on sign in to upload offline data
          setTimeout(() => {
            handleSyncData();
          }, 500);
        }}
        showToast={showToast}
      />

      {/* Onboarding Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSaveSuccess={(userData) => setUser(userData)}
        showToast={showToast}
        user={user}
      />

    </div>
  );
}
