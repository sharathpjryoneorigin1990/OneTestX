'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, LogOut, User, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const NewNavbar = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 bg-opacity-95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <img 
                src="/logo.svg" 
                alt="OneTest X" 
                className="h-8 w-auto"
              />
            </Link>
          </div>
          
          {/* Centered Navigation Links - Only visible for non-logged in users */}
          {!user && (
            <div className="hidden md:flex items-center justify-center flex-1">
              <nav className="flex space-x-4">
                <Link href="/features" className="text-gray-300 hover:text-white transition-colors px-2 py-2">
                  Features
                </Link>
                <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors px-2 py-2">
                  Pricing
                </Link>
                <Link href="/documentation" className="text-gray-300 hover:text-white transition-colors px-2 py-2">
                  Documentation
                </Link>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors px-2 py-2">
                  Contact
                </Link>
              </nav>
            </div>
          )}
          
          {/* Sign In Button - Right aligned */}
          {!user ? (
            <div className="hidden md:block">
              <Link 
                href="/login" 
                className="ml-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/environments/configure" className="text-gray-300 hover:text-white transition-colors">
                Settings
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          )}
          
          <div className="md:hidden">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="text-gray-300 hover:text-white"
                >
                  <User className="h-6 w-6" />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/environments/configure"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewNavbar;
