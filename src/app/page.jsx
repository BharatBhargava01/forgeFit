'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Calendar, Dumbbell, Sparkles, ChevronRight, ChevronLeft, Award, Clock, LayoutDashboard, Apple, FolderHeart, User, Menu, X, Bell, Search, LogOut, RefreshCw, ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PlannerTab from '@/components/PlannerTab';
import LibraryTab from '@/components/LibraryTab';
import CreateTab from '@/components/CreateTab';
import TrackerTab from '@/components/TrackerTab';
import DashboardTab from '@/components/DashboardTab';
import NutritionTab from '@/components/NutritionTab';
import AiChatPopup from '@/components/AiChatPopup';

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
  const [mealRemindersEnabled, setMealRemindersEnabled] = useState(false);
  const [themeSetting, setThemeSetting] = useState('light');
  const [systemTheme, setSystemTheme] = useState('light');
  
  // Layout helper states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('Today');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Date selector and calendar states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const getCalendarGrid = (month, year) => {
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay(); // Sun=0, Mon=1...
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const grid = [];
    for (let i = 0; i < startDay; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      grid.push(new Date(year, month, day));
    }
    return grid;
  };
  
  // Active session recovery state
  const [savedSession, setSavedSession] = useState(null);
  
  // Custom caches / selections to prefill tabs
  const [prefilledWorkout, setPrefilledWorkout] = useState(null);
  const [prefilledRoutine, setPrefilledRoutine] = useState(null);
  const [prefilledMuscles, setPrefilledMuscles] = useState(null);
  const [plannerTab, setPlannerTab] = useState('workout');

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

  // Guard for public pages when not logged in
  useEffect(() => {
    const publicPages = ['home', 'planner', 'library'];
    if (!user && !publicPages.includes(currentPage)) {
      setCurrentPage('home');
    }
  }, [user, currentPage]);

  const showToast = (message, type = 'success') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Load user session and check URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedUser = localStorage.getItem('wg_user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          setCurrentPage('dashboard');
        } catch (e) {
          localStorage.removeItem('wg_user');
        }
      }

      const savedTheme = localStorage.getItem('wg_theme_setting');
      if (savedTheme) {
        setThemeSetting(savedTheme);
      }
    }

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
        setCurrentPage('home');
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

  const handleToggleMealReminders = async () => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      showToast('System notifications are not supported in this browser.', 'error');
      return;
    }

    if (mealRemindersEnabled) {
      localStorage.setItem('wg_meal_reminders_enabled', 'false');
      setMealRemindersEnabled(false);
      showToast('Meal logging reminders disabled.', 'info');
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('wg_meal_reminders_enabled', 'true');
        setMealRemindersEnabled(true);
        showToast('Meal logging reminders enabled! 🥗', 'success');
      } else {
        showToast('Notification permission was denied. Enable it in your settings.', 'error');
      }
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/auth/me', { method: 'DELETE' });
      if (res.ok) {
        setUser(null);
        localStorage.removeItem('wg_user');
        clearUserCaches();
        showToast('Account permanently deleted. We hope to see you again! 👋', 'info');
      } else {
        showToast('Failed to delete account. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Error deleting account', 'error');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handler = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedTheme = useMemo(() => {
    return themeSetting === 'system' ? systemTheme : themeSetting;
  }, [themeSetting, systemTheme]);

  const handleChangeTheme = (val) => {
    setThemeSetting(val);
    localStorage.setItem('wg_theme_setting', val);
    showToast(`Theme updated to: ${val === 'system' ? 'System Preference' : val === 'dark' ? 'Dark Mode' : 'Light Mode'} 🎨`, 'success');
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

      const mealsEnabled = localStorage.getItem('wg_meal_reminders_enabled') === 'true';
      setMealRemindersEnabled(mealsEnabled);

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

  // Redirect guest if they try to access restricted pages, and send signed-in users to dashboard
  useEffect(() => {
    if (!user && ['dashboard', 'profile', 'tracker', 'create'].includes(currentPage)) {
      setCurrentPage('home');
    }
    if (user && currentPage === 'home') {
      setCurrentPage('dashboard');
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
    setPlannerTab('workout');
    setCurrentPage('planner');
  };

  const handleInspectRoutine = (routine) => {
    setPrefilledRoutine(routine);
    setPlannerTab('routine');
    setCurrentPage('planner');
  };

  // Analytics AI recommendations trigger
  const handlePrefillMuscles = (muscles) => {
    setPrefilledMuscles(muscles);
    setPlannerTab('workout');
    setCurrentPage('planner');
  };

  // Finish session tracker callback
  const handleFinishWorkout = () => {
    setActiveWorkout(null);
    setCurrentPage(user ? 'dashboard' : 'home');
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

  const sidebarLinks = [
    ...(user ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    ...(!user ? [{ id: 'home', label: 'Home', icon: Flame }] : []),
    { id: 'planner', label: 'Planner', icon: Calendar },
    ...(user ? [{ id: 'nutrition', label: 'Nutrition', icon: Apple }] : []),
    { id: 'library', label: 'Library', icon: FolderHeart },
    ...(user ? [
      { id: 'create', label: 'Exercises', icon: Dumbbell },
      { id: 'profile', label: 'Profile', icon: User }
    ] : [])
  ];

  return (
    <div className={`flex min-h-screen bg-[#15161b] font-sans antialiased text-[#1e1f22] ${resolvedTheme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      
      {/* Sidebar - Desktop */}
      <aside className={`dark-sidebar hidden lg:flex flex-col ${sidebarCollapsed ? 'w-20 px-3' : 'w-72 px-6'} bg-[#15161b] text-[#808191] border-r border-white/[0.03] py-6 shrink-0 sticky top-0 h-screen z-40 select-none transition-all duration-300 justify-between`}>
        <div className="space-y-8">
          
          {/* Logo Brand matching the image */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 px-2'} cursor-pointer`} onClick={() => { setCurrentPage(user ? 'dashboard' : 'home'); setMobileSidebarOpen(false); }}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-white shadow-lg shrink-0 transition-transform hover:scale-105">
              <Flame className="w-5.5 h-5.5 fill-white text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-heading font-extrabold text-xl tracking-tight text-white select-none animate-fade-in">
                ForgeFit
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => {
              const isActive = currentPage === link.id;
              const IconComp = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => setCurrentPage(link.id)}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-2xl text-xs font-black tracking-wide transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1e1f22] shadow-md font-extrabold'
                      : 'text-[#808191] hover:text-white hover:bg-white/5'
                  }`}
                  title={sidebarCollapsed ? link.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className={`w-4.5 h-4.5 ${isActive ? 'text-[#1e1f22]' : 'text-[#808191] group-hover:text-white'}`} />
                    {!sidebarCollapsed && <span>{link.label}</span>}
                  </div>
                  {!sidebarCollapsed && link.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide ${isActive ? 'bg-[#d6fa46] text-[#1e1f22]' : 'bg-[#d6fa46]/20 text-[#d6fa46] group-hover:bg-[#d6fa46] group-hover:text-[#1e1f22] transition-colors'}`}>
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Collapse Toggle Button */}
        <div className="pt-4 border-t border-white/[0.03]">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-2xl text-xs font-black tracking-wide text-[#808191] hover:text-white hover:bg-white/5 transition-all cursor-pointer`}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <div className="flex items-center gap-3">
              {sidebarCollapsed ? (
                <ChevronRight className="w-4.5 h-4.5 text-[#808191]" />
              ) : (
                <>
                  <ChevronLeft className="w-4.5 h-4.5 text-[#808191]" />
                  <span>Collapse Sidebar</span>
                </>
              )}
            </div>
          </button>
        </div>

      </aside>

      {/* Mobile Drawer Sidebar Menu Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          
          <aside className="relative flex flex-col w-72 bg-[#15161b] text-[#808191] p-6 h-full z-10 select-none">
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-xl hover:bg-white/5 text-[#808191] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => { setCurrentPage(user ? 'dashboard' : 'home'); setMobileSidebarOpen(false); }}>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-white shadow-lg shrink-0">
                  <Flame className="w-5.5 h-5.5 fill-white text-white" />
                </div>
                <span className="font-heading font-extrabold text-xl tracking-tight text-white select-none animate-fade-in">
                  ForgeFit
                </span>
              </div>

              <nav className="space-y-1">
                {sidebarLinks.map((link) => {
                  const isActive = currentPage === link.id;
                  const IconComp = link.icon;
                  return (
                    <button
                      key={link.id}
                      onClick={() => {
                        setCurrentPage(link.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#1e1f22] shadow-md font-bold'
                          : 'text-[#808191] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComp className={`w-4.5 h-4.5 ${isActive ? 'text-[#1e1f22]' : 'text-[#808191]'}`} />
                        <span>{link.label}</span>
                      </div>
                      {link.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-[#d6fa46] text-[#1e1f22]' : 'bg-[#d6fa46]/20 text-[#d6fa46]'}`}>
                          {link.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Main Container Right Side */}
      <div className="flex-grow flex flex-col min-h-screen relative overflow-hidden lg:p-3">
        
        {/* Inner Panel container */}
        <div className={`flex-1 rounded-none lg:rounded-[2.5rem] shadow-2xl flex flex-col overflow-y-auto min-h-[calc(100vh-1.5rem)] transition-colors duration-300 ${resolvedTheme === 'light' ? 'bg-[#eef0f2] text-[#1e1f22]' : 'bg-[#0d0d15] text-[#ededed]'}`}>
          
          {/* Top Header Panel */}
          <header className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2.5 flex items-center justify-between gap-2 sm:gap-4 border-b border-black/[0.02]">
            
            {/* User Profile Widget on the Left */}
            <div className="relative">
              <div 
                className="flex items-center gap-1.5 sm:gap-3 p-1 sm:p-1.5 pr-1 sm:pr-4.5 rounded-full bg-white border border-gray-200/50 hover:border-gray-300 shadow-sm cursor-pointer select-none transition-all"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                {user ? (
                  user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name} 
                      className="w-10 h-10 rounded-full border border-[#a389f4]/40 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#a389f4]/20 border border-[#a389f4]/40 flex items-center justify-center text-[#a389f4] font-black text-sm shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-[#1e1f22] font-black text-sm shrink-0">
                    G
                  </div>
                )}
                
                <div className="text-left shrink-0 hidden sm:block">
                  <h4 className="font-heading font-black text-xs text-[#1e1f22] leading-tight flex items-center gap-1">
                    {user ? user.name : 'Guest User'}
                    <ChevronDown className="w-3 h-3 text-text-secondary" />
                  </h4>
                  <span className="text-[10px] text-text-secondary font-bold block leading-none mt-0.5">
                    {user ? user.email : 'Click to sign in'}
                  </span>
                </div>
              </div>

              {/* User Dropdown Dialog Popover */}
              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2.5 w-60 rounded-2xl bg-white border border-gray-150 p-2 shadow-2xl z-50 text-[#1e1f22] animate-slide-up">
                    {user ? (
                      <>
                        <div className="px-3 py-2 border-b border-gray-100 mb-1 text-left">
                          <p className="text-xs font-black text-[#1e1f22] truncate">{user.name}</p>
                          <p className="text-[10px] text-text-secondary truncate mt-0.5">{user.email}</p>
                        </div>
                        <button
                          onClick={() => { setCurrentPage('profile'); setUserDropdownOpen(false); }}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-[#1e1f22] hover:bg-gray-50 flex items-center gap-2 cursor-pointer text-left"
                        >
                          👤 View Fitness Goals
                        </button>
                        <button
                          onClick={() => { handleSyncData(); setUserDropdownOpen(false); }}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-[#1e1f22] hover:bg-gray-50 flex items-center gap-2 cursor-pointer text-left"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
                          Sync Local Data
                        </button>
                        <button
                          onClick={() => { handleSignOut(); setUserDropdownOpen(false); }}
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 cursor-pointer text-left mt-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setAuthModalOpen(true); setUserDropdownOpen(false); }}
                        className="w-full px-3 py-3 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple text-white font-extrabold text-xs shadow-md text-center cursor-pointer block"
                      >
                        Sign In / Register
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Hamburger menu toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm text-[#1e1f22] cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Right Header: Notification & Date (only shown on dashboard) */}
            {currentPage === 'dashboard' && (
              <div className="flex items-center gap-1.5 sm:gap-4">

                {/* Date Selection with calendar dropdown */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => {
                      setCalendarOpen(!calendarOpen);
                      setCalendarMonth(selectedDate.getMonth());
                      setCalendarYear(selectedDate.getFullYear());
                    }}
                    className="px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white border border-gray-200/50 hover:border-gray-300 font-bold text-[9px] sm:text-[10px] tracking-wide uppercase shadow-sm flex items-center gap-1 sm:gap-1.5 cursor-pointer select-none text-[#1e1f22]"
                  >
                    <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                    <span>
                      {selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </button>

                  {calendarOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setCalendarOpen(false)} />
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-gray-150 p-4 shadow-2xl z-50 animate-slide-up text-[#1e1f22]">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => {
                              if (calendarMonth === 0) {
                                setCalendarMonth(11);
                                setCalendarYear(prev => prev - 1);
                              } else {
                                setCalendarMonth(prev => prev - 1);
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer text-[#1e1f22]"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-heading font-black text-xs text-[#1e1f22]">
                            {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </span>
                          <button
                            onClick={() => {
                              if (calendarMonth === 11) {
                                setCalendarMonth(0);
                                setCalendarYear(prev => prev + 1);
                              } else {
                                setCalendarMonth(prev => prev + 1);
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer text-[#1e1f22]"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-text-muted font-bold uppercase tracking-wider mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((label, idx) => (
                            <div key={idx}>{label}</div>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {getCalendarGrid(calendarMonth, calendarYear).map((dayDate, idx) => {
                            if (!dayDate) return <div key={idx} className="aspect-square bg-transparent"></div>;
                            const isSelected = selectedDate.getDate() === dayDate.getDate() &&
                                              selectedDate.getMonth() === dayDate.getMonth() &&
                                              selectedDate.getFullYear() === dayDate.getFullYear();
                            const isToday = new Date().getDate() === dayDate.getDate() &&
                                            new Date().getMonth() === dayDate.getMonth() &&
                                            new Date().getFullYear() === dayDate.getFullYear();
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSelectedDate(dayDate);
                                  setCalendarOpen(false);
                                  showToast(`Selected date: ${dayDate.toLocaleDateString()}`, 'info');
                                }}
                                className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer select-none ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-accent-indigo to-accent-purple text-white shadow-md'
                                    : isToday
                                      ? 'bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20'
                                      : 'hover:bg-gray-150 text-text-secondary hover:text-[#1e1f22]'
                                }`}
                              >
                                {dayDate.getDate()}
                              </button>
                            );
                          })}
                        </div>

                        {/* Quick controls */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-between">
                          <button
                            onClick={() => {
                              const today = new Date();
                              setSelectedDate(today);
                              setCalendarMonth(today.getMonth());
                              setCalendarYear(today.getFullYear());
                              setCalendarOpen(false);
                              showToast('Reset to today', 'info');
                            }}
                            className="text-[10px] font-black text-accent-purple hover:underline cursor-pointer"
                          >
                            Today
                          </button>
                          <button
                            onClick={() => setCalendarOpen(false)}
                            className="text-[10px] font-black text-text-secondary hover:text-[#1e1f22] cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Filter Selector */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    className="px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white border border-gray-200/50 hover:border-gray-300 font-bold text-[9px] sm:text-xs shadow-sm flex items-center gap-0.5 sm:gap-1 cursor-pointer select-none text-[#1e1f22]"
                  >
                    <span>{currentFilter}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
                  </button>

                  {filterDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setFilterDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white border border-gray-150 p-1.5 shadow-2xl z-50 animate-slide-up text-left">
                        {['Today', 'Weekly', 'Monthly', 'Yearly'].map(option => (
                          <button
                            key={option}
                            onClick={() => {
                              setCurrentFilter(option);
                              setFilterDropdownOpen(false);
                              showToast(`Dashboard filtered to ${option}`, 'info');
                            }}
                            className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold text-left cursor-pointer transition-colors ${
                              currentFilter === option ? 'bg-gray-50 text-[#1e1f22]' : 'text-text-secondary hover:bg-gray-50 hover:text-[#1e1f22]'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

              </div>
            )}

          </header>

          {/* Active SPA Tab Container */}
          <main className="flex-grow overflow-x-hidden">
            
            {/* Active Workout Saved Session Resume Banner */}
            {savedSession && currentPage !== 'tracker' && (
              <div className="w-full max-w-4xl mx-auto px-6 pt-4 animate-slide-down">
                <div className="relative group overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan shadow-md">
                  <div className="rounded-[14px] p-4 bg-[#15161b]/95 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
                    <div className="flex items-center gap-4 text-left w-full md:w-auto">
                      <div className="w-9 h-9 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple text-lg shrink-0 animate-pulse">
                        ⚡
                      </div>
                      <div>
                        <span className="text-[9px] text-accent-cyan uppercase tracking-wider font-extrabold block">Unfinished Session Paused</span>
                        <h4 className="font-heading font-extrabold text-xs text-white mt-0.5">
                           Resume "{savedSession.workout?.name || 'Workout Session'}"?
                        </h4>
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          Paused at {Math.floor(savedSession.elapsedSeconds / 60)}m {savedSession.elapsedSeconds % 60}s · {savedSession.loggedExercises?.length || 0} exercises tracked
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
                      <button
                        onClick={handleDiscardSavedSession}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-accent-rose/10 hover:text-accent-rose border border-white/5 text-text-secondary font-bold text-[10px] tracking-wide transition-all cursor-pointer text-center"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleResumeSavedSession}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 text-white font-extrabold text-[10px] tracking-wide transition-all cursor-pointer text-center text-white"
                      >
                        Resume Session
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SPA tab routing */}
            {currentPage === 'dashboard' && (
              <DashboardTab
                key={user ? user.id : 'guest'}
                user={user}
                showToast={showToast}
                onPrefillGenerator={handlePrefillMuscles}
                currentFilter={currentFilter}
                selectedDate={selectedDate}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'home' && (
              <div className="max-w-6xl mx-auto px-6 py-12 space-y-16 animate-fade-in">
                {/* Hero Section */}
                <div className="text-center space-y-6 max-w-3xl mx-auto relative">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1f22]/5 border border-black/10 text-xs font-semibold text-text-secondary select-none">
                    <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse"></span>
                    Smart Training Assistant
                  </div>

                  <h1 className="font-heading font-black text-4xl sm:text-5xl text-[#1e1f22] tracking-tight leading-tight">
                    Build Your Perfect <span className="text-[#a389f4]">Workout</span>
                  </h1>

                  <p className="text-text-secondary text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-semibold">
                    Instantly generate personalized workouts and weekly routines tailored to your target muscles, splits, and equipment availability.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                    <button
                      onClick={() => {
                        setPlannerTab('workout');
                        setCurrentPage('planner');
                      }}
                      className="px-7 py-3 rounded-2xl bg-[#1e1f22] hover:bg-[#2d2e33] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-white"
                    >
                      <Flame className="w-4 h-4 fill-white" />
                      ⚡ Generate Workout
                    </button>
                    <button
                      onClick={() => {
                        setPlannerTab('routine');
                        setCurrentPage('planner');
                      }}
                      className="px-7 py-3 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 text-[#1e1f22] font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      📋 Build Routine
                    </button>
                  </div>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-2">
                  {[
                    { val: '80+', lbl: 'Exercises' },
                    { val: '5', lbl: 'Split Options' },
                    { val: '11', lbl: 'Muscle Areas' },
                    { val: '∞', lbl: 'Combinations' }
                  ].map((s, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-5 border border-black/[0.02] text-center shadow-sm">
                      <span className="font-heading font-black text-3xl text-[#1e1f22] block">{s.val}</span>
                      <span className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-extrabold block">{s.lbl}</span>
                    </div>
                  ))}
                </div>

                {/* Features Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6">
                  
                  {/* Feature 1 */}
                  <div
                    onClick={() => {
                      setPlannerTab('workout');
                      setCurrentPage('planner');
                    }}
                    className="bg-white rounded-[2rem] p-6 border border-black/[0.02] cursor-pointer hover:border-gray-200 transition-all group flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-500 text-lg mb-4 group-hover:scale-105 transition-transform">
                        🎯
                      </div>
                      <h3 className="font-heading font-extrabold text-md text-[#1e1f22] mb-2 group-hover:text-cyan-500 transition-colors">
                        Smart Generation
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                        Procedural or Gemini-powered workout planning matching muscle splits, set prescriptions, and proper volume load.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-cyan-500 font-black uppercase tracking-wider mt-5">
                      Open Generator <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div
                    onClick={() => {
                      setPlannerTab('routine');
                      setCurrentPage('planner');
                    }}
                    className="bg-white rounded-[2rem] p-6 border border-black/[0.02] cursor-pointer hover:border-gray-200 transition-all group flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 text-lg mb-4 group-hover:scale-105 transition-transform">
                        📅
                      </div>
                      <h3 className="font-heading font-extrabold text-md text-[#1e1f22] mb-2 group-hover:text-[#a389f4] transition-colors">
                        Routine Builder
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                        Push/Pull/Legs, Arnold Splits, Upper/Lower, or custom setups. Design structural weekly planners for complete consistency.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-[#a389f4] font-black uppercase tracking-wider mt-5">
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
                        setCurrentPage('profile');
                      }
                    }}
                    className="bg-white rounded-[2rem] p-6 border border-black/[0.02] cursor-pointer hover:border-gray-200 transition-all group flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 text-lg mb-4 group-hover:scale-105 transition-transform">
                        💾
                      </div>
                      <h3 className="font-heading font-extrabold text-md text-[#1e1f22] mb-2 group-hover:text-amber-500 transition-colors">
                        Save & Revisit
                      </h3>
                      <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                        Log workout templates, custom split configurations, and access local storage offline fallbacks directly.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-amber-500 font-black uppercase tracking-wider mt-5">
                      View Settings <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {currentPage === 'planner' && (
              <PlannerTab
                key={user ? user.id : 'guest'}
                user={user}
                onSignInClick={() => setAuthModalOpen(true)}
                onStartWorkout={handleStartWorkout}
                showToast={showToast}
                prefilledWorkout={prefilledWorkout}
                clearPrefillWorkout={() => setPrefilledWorkout(null)}
                prefilledMuscles={prefilledMuscles}
                clearPrefilledMuscles={() => setPrefilledMuscles(null)}
                prefilledRoutine={prefilledRoutine}
                clearPrefillRoutine={() => setPrefilledRoutine(null)}
                setPrefilledWorkout={setPrefilledWorkout}
                plannerTab={plannerTab}
                setPlannerTab={setPlannerTab}
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

            {currentPage === 'nutrition' && (
              <NutritionTab
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

            {currentPage === 'tracker' && (
              <TrackerTab
                workout={activeWorkout}
                onCancelWorkout={handleCancelWorkout}
                onFinishWorkout={handleFinishWorkout}
                showToast={showToast}
              />
            )}

            {currentPage === 'profile' && (
              <ProfileTab
                key={user ? user.id : 'guest'}
                user={user}
                onUpdateUser={(updated) => setUser(updated)}
                onStartWorkout={handleStartWorkout}
                onInspectWorkout={handleInspectWorkout}
                onInspectRoutine={handleInspectRoutine}
                showToast={showToast}
                motivationEnabled={motivationEnabled}
                motivationHours={motivationHours}
                onToggleMotivation={handleToggleMotivation}
                onToggleHour={handleToggleHour}
                mealRemindersEnabled={mealRemindersEnabled}
                onToggleMealReminders={handleToggleMealReminders}
                onSignOut={handleSignOut}
                onDeleteAccount={handleDeleteAccount}
                themeSetting={themeSetting}
                onChangeTheme={handleChangeTheme}
              />
            )}

            {/* Removed MessagesTab */}

          </main>

        </div>

      </div>
      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-4 right-20 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => {
          const typeCls = toast.type === 'error' 
            ? 'bg-accent-rose border-accent-rose' 
            : toast.type === 'info'
            ? 'bg-accent-indigo border-accent-indigo'
            : 'bg-[#15161b] border-white/10';

          return (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-2xl border shadow-lg text-xs font-bold flex items-center gap-2 pointer-events-auto transition-all animate-fade-in min-w-[200px] max-w-[320px] ${typeCls}`}
              style={{ color: '#ffffff' }}
            >
              <span style={{ color: '#ffffff' }}>{toast.type === 'error' ? '✕' : toast.type === 'info' ? 'ℹ' : '✓'}</span>
              <span style={{ color: '#ffffff' }}>{toast.message}</span>
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

      {/* Persistent Floating AI Chat Coach */}
      <AiChatPopup user={user} showToast={showToast} />

    </div>
  );
}
