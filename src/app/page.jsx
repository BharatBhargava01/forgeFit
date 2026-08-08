'use client';

import React, { useState, useEffect, useMemo } from 'react';
import MainAppContent from '@/components/MainAppContent';
import { GamificationProvider } from '@/context/GamificationContext';

export default function MainPage() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [themeSetting, setThemeSetting] = useState('light');
  const [systemTheme, setSystemTheme] = useState('light');
  
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
          setUser(null);
          localStorage.removeItem('wg_user');
        }
      } catch (err) {
        console.warn('Session check failed:', err);
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
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        checkSession();
      } else if (urlParams.has('error')) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

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

  return (
    <GamificationProvider>
      <MainAppContent
        user={user}
        setUser={setUser}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        activeWorkout={activeWorkout}
        setActiveWorkout={setActiveWorkout}
        themeSetting={themeSetting}
        setThemeSetting={setThemeSetting}
        systemTheme={systemTheme}
      />
    </GamificationProvider>
  );
}