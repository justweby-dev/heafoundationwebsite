import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useThemeStore } from '../store/themeStore';
import { HeaLogo } from './HeaLogo';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Projects', path: '/projects' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Volunteer', path: '/volunteer' },
  { name: 'Contact', path: '/contact' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b',
          isScrolled 
            ? 'bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-sm border-zinc-200/50 dark:border-zinc-800/50 py-3' 
            : 'bg-white/0 dark:bg-zinc-950/0 border-transparent py-5'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5 group">
            <HeaLogo size={38} className="group-hover:scale-105 transition-transform" />
            <span className="font-serif font-semibold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
              HEA Foundation
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400',
                  location.pathname === link.path ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-zinc-600 dark:text-zinc-300'
                )}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <motion.a
                href="/donate"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md shadow-purple-500/20 inline-block"
              >
                Donate Now
              </motion.a>
            </div>
          </nav>

          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 text-zinc-600 dark:text-zinc-300"
            >
              {isDark ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <button
              className="p-2 text-zinc-600 dark:text-zinc-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-white dark:bg-zinc-950 pt-24 px-4 pb-6 overflow-y-auto"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    'text-2xl font-serif font-medium transition-colors',
                    location.pathname === link.path ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-900 dark:text-zinc-50'
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-zinc-100 dark:border-zinc-800" />
              <motion.a
                href="/donate"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => setMobileMenuOpen(false)}
                className="bg-brand-600 text-center text-white px-6 py-4 rounded-xl text-lg font-medium shadow-md block"
              >
                Donate Now
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
