'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, showToast }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = activeTab === 'login' 
        ? { email, password } 
        : { name, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      showToast(
        activeTab === 'login' 
          ? `Welcome back, ${data.name}! 👋` 
          : 'Registration successful! Welcome to ForgeFit! 🎉', 
        'success'
      );
      
      onAuthSuccess(data);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-bg-dark/95 p-6 shadow-2xl backdrop-blur-xl animate-scale-up text-white z-10">
        
        {/* Decorative background glow */}
        <div className="absolute -right-24 -top-24 -z-10 h-48 w-48 rounded-full bg-accent-purple/20 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 -z-10 h-48 w-48 rounded-full bg-accent-cyan/15 blur-3xl" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-text-muted hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-white/5 mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'login' ? 'text-white' : 'text-text-muted hover:text-white'
            }`}
          >
            Sign In
            {activeTab === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-indigo to-accent-purple" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'register' ? 'text-white' : 'text-text-muted hover:text-white'
            }`}
          >
            Register
            {activeTab === 'register' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-indigo to-accent-purple" />
            )}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-heading font-black text-2xl text-gradient">
            {activeTab === 'login' ? 'Welcome Back' : 'Join ForgeFit'}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {activeTab === 'login' 
              ? 'Sign in to access and sync your workout data.' 
              : 'Create an account to save progress in the cloud.'}
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'register' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:bg-white/10 transition-all text-white"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                required
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:bg-white/10 transition-all text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:bg-white/10 transition-all text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-cyan hover:opacity-90 font-bold text-white shadow-lg shadow-accent-purple/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : activeTab === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <span className="h-[1px] flex-grow bg-white/5" />
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Or Continue With</span>
          <span className="h-[1px] flex-grow bg-white/5" />
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.4 13a5.53 5.53 0 0 1 5.59-5.518c1.378 0 2.635.494 3.61 1.414l3.223-3.223C18.847 3.79 16.584 3 14 3 8.477 3 4 7.477 4 13s4.477 10 10 10c5.52 0 10-4.48 10-10 0-.69-.06-1.354-.18-1.996h-11.58Z"
            />
          </svg>
          Google
        </button>

      </div>
    </div>
  );
}
