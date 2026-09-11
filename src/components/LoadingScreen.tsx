import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeaLogo } from './HeaLogo';

interface LoadingScreenProps {
  onLoaded?: () => void;
  minDuration?: number;
}

export function LoadingScreen({ onLoaded, minDuration = 900 }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onLoaded) onLoaded();
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onLoaded]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="hea-loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl transition-colors"
        >
          {/* Ambient luminous glow circles */}
          <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-purple-600/25 via-indigo-600/20 to-fuchsia-500/20 blur-[100px] pointer-events-none animate-pulse-energy" />
          <div className="absolute w-64 h-64 rounded-full bg-indigo-500/15 blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center px-4">
            {/* Animated Logo with Halo */}
            <div className="relative mb-6">
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 opacity-35 blur-md animate-spin" style={{ animationDuration: '8s' }} />
              <div className="relative bg-white/80 dark:bg-zinc-900/80 p-4 rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-900/30">
                <HeaLogo size={64} animated />
              </div>
            </div>

            {/* Typography */}
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1.5"
            >
              HEA Foundation
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 tracking-wide uppercase mb-6"
            >
              Humanitarian Empowerment & Action
            </motion.p>

            {/* Glowing Gradient Progress Bar */}
            <div className="w-48 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative shadow-inner">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                className="w-full h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-violet-600 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoadingScreen;
