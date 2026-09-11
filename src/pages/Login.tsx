import React, { useState } from "react";
import { useSEO } from "../hooks/useSEO";
import { Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuthStore, DEFAULT_ADMIN_EMAIL } from '../store/authStore';
import { ArrowLeft, KeyRound, Mail, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { HeaLogo } from '../components/HeaLogo';

export default function Login() {
  useSEO("Portal Login", "Sign in to access the HEA Foundation management portal.");
  const { user, isAdmin, isLoading, loginWithPassword } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <LoadingSpinner text="Checking authentication..." />
      </div>
    );
  }

  if (user && isAdmin) {
    return <Navigate to={from} replace />;
  }

  if (user && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both your email address and password.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      const res = await loginWithPassword(password, email);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setErrorMsg(res.error || "Invalid email or password");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 transition-colors relative overflow-hidden bg-energy-mesh">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 dark:bg-purple-900/30 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/15 dark:bg-indigo-900/25 blur-[120px] pointer-events-none rounded-full" />

      <Link 
        to="/" 
        className="absolute top-24 left-6 md:left-12 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors z-10"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back to Website</span>
      </Link>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-200/80 dark:border-purple-900/40 p-8 sm:p-10 relative z-10"
      >
        {/* Logo & Header */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="mb-4">
            <HeaLogo size={56} />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
            Sign In to Portal
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            HEA Foundation Management & Administration
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Password Login Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4 mb-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="admin@heafoundation.org"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Admin Password
              </label>
            </div>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:via-indigo-700 hover:to-purple-900 text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-purple-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              "Sign In to Management Portal"
            )}
          </motion.button>
        </form>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs">
          <ShieldCheck size={14} className="text-purple-500" />
          <span>Restricted Executive Access Portal</span>
        </div>
      </motion.div>
    </div>
  );
}

