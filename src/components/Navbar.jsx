import React, { useState } from 'react';
import { Menu, X, Flame } from 'lucide-react';

export default function Navbar({ currentPage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'generator', label: 'Generator' },
    { id: 'routine', label: 'Routines' },
    { id: 'library', label: 'Library' },
    { id: 'create', label: 'Create' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'saved', label: 'Saved' },
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

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
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
          </div>
        </div>
      )}
    </nav>
  );
}
