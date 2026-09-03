import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import unfpaLogo from '../../assets/images/unfpa.png';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Data Catalog', path: '/catalog' },
    { label: 'Methodology', path: '/methodology' },
    // { label: 'Analytics', path: '/analytics' },
  ];

  return (
    <header className="w-full h-16 relative z-50 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-4 hover:opacity-90 transition-opacity"
        >
          <img
            src={unfpaLogo}
            alt="UNFPA Logo"
            className="h-8 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="font-bold text-[15px] text-gray-900 leading-tight tracking-tight">
              Odisha Demographic & Data Intelligence Platform
            </span>
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mt-1">
              UNFPA India (Odisha State Office) initiative
            </span>
          </div>
        </Link>
      </div>

      {/* Right side: Desktop Nav + Mobile Hamburger */}
      <div className="flex items-center gap-8">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-colors py-2 font-[400] ${isActive ? 'text-orange-500' : 'hover:text-orange-500 text-gray-600'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Hamburger Menu Toggle (Mobile Only) */}
        <div className="flex md:hidden items-center z-[100]">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-lg transition-all relative z-[110] ${isMenuOpen ? 'text-[#26412C]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {isMenuOpen ? (
              <X className="w-8 h-8" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Full-Screen Menu Overlay (Mobile) */}
          {isMenuOpen && (
            <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <nav className="flex flex-col gap-8 text-center">
                {navigationItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-4xl font-[400] tracking-tighter transition-all text-black hover:text-orange-500 leading-none active:scale-95"
                  >
                    {item.label.toUpperCase()}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
