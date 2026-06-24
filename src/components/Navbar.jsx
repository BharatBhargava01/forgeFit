import React, { useState } from 'react';
import { Menu, X, Flame, ChevronDown, LogOut, RefreshCw } from 'lucide-react';

export default function Navbar({ currentPage, onNavigate, user, onSignInClick, onSignOutClick, onSyncClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = user ? [
    { id: 'home', label: 'Home' },
    { id: 'generator', label: 'Generator' },
    { id: 'routine', label: 'Routines' },
    { id: 'library', label: 'Library' },
    { id: 'create', label: 'Create' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'saved', label: 'Saved' },
  ] : [
    { id: 'home', label: 'Home' },
    { id: 'generator', label: 'Generator' },
    { id: 'routine', label: 'Routines' },
    { id: 'library', label: 'Library' },
  ];

  const handleLinkClick = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-bg-dark/80 border-b border-white/5 transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => handleLinkClick('home')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-white shadow-lg shadow-accent-purple/20 transition-transform group-hover:scale-105">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white group-hover:text-gradient transition-all">
              ForgeFit
            </span>
          </div>

          {/* Desktop Nav Links & User Section */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    currentPage === link.id
                      ? 'text-white bg-white/10 shadow-inner'
                      : 'text-text-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
            
            {/* User Auth Section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-sm font-semibold text-white cursor-pointer select-none"
                >
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name} 
                      className="w-6 h-6 rounded-full border border-accent-purple/40"
                      onError={(e) => { e.target.src = ''; }} // fallback on error
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center text-accent-purple text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{user.name.split(' ')[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    {/* Overlay to close menu */}
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0d0d15] p-1.5 shadow-2xl backdrop-blur-xl z-50 text-white animate-slide-up">
                      <div className="px-3 py-2.5 border-b border-white/5 mb-1.5 text-left">
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-text-secondary truncate mt-0.5">{user.email}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          onSyncClick();
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer text-left"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-accent-cyan" />
                        Sync Offline Data
                      </button>
                      
                      <button
                        onClick={() => {
                          onSignOutClick();
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-accent-rose hover:bg-accent-rose/10 transition-all flex items-center gap-2 cursor-pointer text-left mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple hover:opacity-90 font-semibold text-sm text-white shadow-md shadow-accent-purple/10 transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/5 bg-bg-dark/95 backdrop-blur-lg animate-fade-in">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`block w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-all cursor-pointer ${
                  currentPage === link.id
                    ? 'text-white bg-white/10 shadow-inner'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}
            
            {/* Mobile User Section */}
            <div className="border-t border-white/5 pt-4 mt-2 px-4 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 py-2">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full border border-accent-purple/40"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center text-accent-purple font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-bold text-white leading-none">{user.name}</p>
                      <p className="text-[10px] text-text-secondary mt-1">{user.email}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      onSyncClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl border border-white/5 bg-white/5 text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-accent-cyan" />
                    Sync Offline Data
                  </button>
                  
                  <button
                    onClick={() => {
                      onSignOutClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-sm font-semibold text-accent-rose flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onSignInClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
