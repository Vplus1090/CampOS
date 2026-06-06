import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Calendar, BookOpen, KeyRound, X, QrCode, SmartphoneNfc, CreditCard, Eye, EyeOff, Lock, Palette, Sun, Moon, SunMoon } from 'lucide-react';
import { applyThemeMode, initGeolocation } from '../utils/theme';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import MessMenu from './MessMenu';
import StudyMaterials from './StudyMaterials';
import AcademicCalendar from './AcademicCalendar';
import { API_BASE } from '../config/api';
import { parseJsonResponse } from '../utils/parseJsonResponse';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function LockScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('campos-remember-me') === 'true';
  });

  // Pre-fill credentials if remember me was active
  useEffect(() => {
    if (localStorage.getItem('campos-remember-me') === 'true') {
      const savedEmail = localStorage.getItem('campos-remember-email') || '';
      const savedPassword = localStorage.getItem('campos-remember-password') || '';
      setEmail(savedEmail);
      setPassword(savedPassword);
    }
  }, []);

  // Portal online/offline status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Guest overlay states
  const [showGuestMess, setShowGuestMess] = useState(false);
  const [showGuestCalendar, setShowGuestCalendar] = useState(false);
  const [showGuestShelf, setShowGuestShelf] = useState(false);
  const [showDemoProfiles, setShowDemoProfiles] = useState(false);
  const [showShelfSetup, setShowShelfSetup] = useState(false);
  const [setupBranch, setSetupBranch] = useState('Computer Science & Engineering');
  const [setupSemester, setSetupSemester] = useState('Semester 1');
  const [guestShelfBranch, setGuestShelfBranch] = useState('All Branches');
  const [guestShelfSemester, setGuestShelfSemester] = useState('All Semesters');

  // Theme states
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('campos-theme') || 'lavender';
  });
  const [currentMode, setCurrentMode] = useState(() => {
    return localStorage.getItem('campos-mode') || 'dark';
  });

  const applyTheme = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('campos-theme', themeId);
    document.body.classList.remove('theme-lavender', 'theme-blue', 'theme-green', 'theme-orange', 'theme-yellow');
    document.body.classList.add(`theme-${themeId}`);
  };

  const applyMode = (modeId) => {
    setCurrentMode(modeId);
    localStorage.setItem('campos-mode', modeId);
    applyThemeMode(modeId);
    if (modeId === 'auto') {
      initGeolocation(() => {
        applyThemeMode('auto');
      });
    }
  };

  useEffect(() => {
    applyTheme(currentTheme);
    applyThemeMode(currentMode);
  }, [currentTheme, currentMode]);

  // Additional Guest State Hooks
  const [showGuestQr, setShowGuestQr] = useState(false);
  const [showGuestPayment, setShowGuestPayment] = useState(false);
  const [processingGuestPayment, setProcessingGuestPayment] = useState(false);
  const [guestPaymentData, setGuestPaymentData] = useState(null);
  const [activeGuestPass, setActiveGuestPass] = useState(null);
  const [remainingGuestMinutes, setRemainingGuestMinutes] = useState(0);

  // Live Guest Pass checker effect
  useEffect(() => {
    const checkGuestPass = () => {
      const passStr = localStorage.getItem('cp_token_guest');
      if (passStr) {
        try {
          const pass = JSON.parse(passStr);
          if (pass && pass.ExpiryTime) {
            const remainingMs = new Date(pass.ExpiryTime) - new Date();
            const mins = Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
            if (mins > 0) {
              setActiveGuestPass(pass);
              setRemainingGuestMinutes(mins);
            } else {
              localStorage.removeItem('cp_token_guest');
              setActiveGuestPass(null);
              setRemainingGuestMinutes(0);
            }
          }
        } catch (e) {
          setActiveGuestPass(null);
        }
      } else {
        setActiveGuestPass(null);
        setRemainingGuestMinutes(0);
      }
    };

    checkGuestPass();
    const interval = setInterval(checkGuestPass, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setSubmitting(true);
      setLoginError(null);

      // Append default domain if not present to simplify login
      let loginEmail = email.trim();
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail}@campos.local`;
      }

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password }),
        credentials: 'include',
      });

      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || 'Login failed');

      // Save credentials if rememberMe is enabled
      if (rememberMe) {
        localStorage.setItem('campos-remember-me', 'true');
        localStorage.setItem('campos-remember-email', email.trim());
        localStorage.setItem('campos-remember-password', password);
      } else {
        localStorage.removeItem('campos-remember-me');
        localStorage.removeItem('campos-remember-email');
        localStorage.removeItem('campos-remember-password');
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Framer Motion M3 Physics Variants
  const springConfig = { type: 'spring', stiffness: 400, damping: 30, bounce: 0.5 };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: springConfig
    }
  };

  // Render Overlay Placeholders (Using original components inside simple full screen divs)
  if (showGuestPayment || showGuestQr || showGuestMess || showGuestCalendar || showGuestShelf) {
    return (
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="absolute inset-0 z-[99999] bg-m3-surface flex flex-col overflow-hidden text-m3-onSurface"
      >
        <div className={`flex-1 bg-m3-surface scrollbar-none ${
          (showGuestMess || showGuestCalendar || showGuestShelf)
            ? 'h-full max-h-full overflow-hidden'
            : 'overflow-y-auto p-4'
        }`}>
          {showGuestMess && <MessMenu currentUser={null} setActiveTab={() => setShowGuestMess(false)} triggerPayment={(amt, src) => { setGuestPaymentData({amount: amt, source: src}); setShowGuestPayment(true); }} />}
          {showGuestCalendar && <AcademicCalendar setActiveTab={() => setShowGuestCalendar(false)} />}
          {showGuestShelf && <StudyMaterials setActiveTab={() => setShowGuestShelf(false)} initialBranch={guestShelfBranch} initialSemester={guestShelfSemester} />}
          {showGuestPayment && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center relative">
              <button 
                onClick={() => setShowGuestPayment(false)}
                className="absolute top-4 left-4 p-3 rounded-full bg-m3-surfaceContainerHigh hover:bg-m3-surfaceContainerHighest text-m3-primary transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <h2 className="text-5xl font-black text-m3-primary font-sans">₹{guestPaymentData?.amount || 60}</h2>
              <p className="text-m3-onSurfaceVariant text-sm">Payment overlays simplified for lockscreen rewrite</p>
            </div>
          )}
          {showGuestQr && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center relative">
              <button 
                onClick={() => setShowGuestQr(false)}
                className="absolute top-4 left-4 p-3 rounded-full bg-m3-surfaceContainerHigh hover:bg-m3-surfaceContainerHighest text-m3-primary transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
               <QrCode size={180} className="text-m3-primary" />
               <p className="text-m3-onSurfaceVariant font-bold">Active Guest Pass QR</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="absolute inset-0 bg-m3-surface flex flex-col justify-between items-center p-6 z-[9999] overflow-hidden select-none font-sans text-m3-onSurface"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 🎨 Theme Selector Trigger (Top Left) */}
      <motion.button
        type="button"
        onClick={() => setShowThemeSelector(true)}
        className="absolute top-5 left-5 z-20 flex items-center justify-center p-3 rounded-full bg-m3-surfaceContainerHigh border border-m3-outlineVariant shadow-sm text-m3-primary hover:text-m3-primary/80 transition-colors cursor-pointer"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springConfig}
      >
        <Palette size={16} />
      </motion.button>

      {/* 🟢/🔴 Portal Online/Offline Status Indicator (Top Right) */}
      <motion.div 
        className="absolute top-5 right-5 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-m3-surfaceContainerHigh border border-m3-outlineVariant shadow-sm"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springConfig}
      >
        <span className="relative flex w-2.5 h-2.5">
          {isOnline && (
            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-m3-primary"></span>
          )}
          <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isOnline ? 'bg-m3-primary' : 'bg-m3-error')}></span>
        </span>
        <span className={cn("text-[11px] font-bold tracking-widest uppercase", isOnline ? 'text-m3-primary' : 'text-m3-error')}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </motion.div>

      <motion.div 
        className="w-full max-w-[320px] flex flex-col justify-center items-stretch h-full z-10 relative pt-12 pb-6 gap-7"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Spacer to shift everything down */}
        <div className="h-16" />

        {/* Playful M3 Expressive Header */}
        <motion.header variants={itemVariants} className="flex flex-col items-start text-left w-full mb-2">
          <h1 className="text-[36px] font-normal text-m3-onSurface tracking-tight font-sans leading-[1.1]">
            Log into your
          </h1>
          <h1 className="text-[44px] font-black text-m3-onSurface tracking-tight font-sans leading-[1.1] mt-0.5">
            CampOS
          </h1>
        </motion.header>

        {/* 🎫 Guest Pass Live Activity Card on Lockscreen (Quick Access) */}
        <AnimatePresence>
          {activeGuestPass && (
            <motion.div 
              variants={itemVariants}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0, height: 0 }}
              transition={springConfig}
              onClick={() => setShowGuestQr(true)}
              className="w-full bg-m3-tertiaryContainer rounded-[24px] p-4 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex flex-col">
                <span className="font-bold text-m3-onTertiaryContainer">Mess Access Pass</span>
                <span className="text-m3-onTertiaryContainer/80 font-medium text-xs flex items-center gap-1.5 mt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-m3-primary animate-pulse"></span>
                  Active • {remainingGuestMinutes} Mins Left
                </span>
              </div>
              <div className="w-10 h-10 bg-m3-onTertiaryContainer/10 rounded-full flex items-center justify-center">
                <QrCode size={20} className="text-m3-onTertiaryContainer" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📥 Form input panel */}
        <motion.form variants={itemVariants} onSubmit={handleLogin} className="flex flex-col w-full gap-5 mt-2">
          
          {/* M3 Input - Username */}
          <div className="flex flex-col w-full gap-2 text-left">
            <label htmlFor="username" className="text-[16px] font-medium text-m3-onSurfaceVariant pl-1 font-sans">
              username
            </label>
            <input
              type="text"
              id="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="m3-filled-field"
            />
          </div>

          {/* M3 Input - Password */}
          <div className="flex flex-col w-full gap-2 text-left relative">
            <label htmlFor="password" className="text-[16px] font-medium text-m3-onSurfaceVariant pl-1 font-sans">
              password
            </label>
            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="m3-filled-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-m3-onSurfaceVariant hover:text-m3-onSurface transition cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me Option */}
          <div className="flex items-center gap-3 pl-1 select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
              rememberMe 
                ? 'bg-m3-primary border-m3-primary text-m3-onPrimary' 
                : 'border-m3-outlineVariant hover:border-m3-primary bg-m3-surfaceContainerLow'
            }`}>
              {rememberMe && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium text-m3-onSurfaceVariant">
              Remember me
            </span>
          </div>

          <AnimatePresence>
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="px-4 py-3 text-sm font-medium text-m3-onError bg-m3-error rounded-xl"
              >
                {loginError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* M3 Filled Button for Login (Large & Expressive) */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={submitting}
            className="m3-filled-button w-full mt-3 !min-h-[72px] !text-lg disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-m3-onPrimary border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              'Login'
            )}
          </motion.button>
        </motion.form>

        {/* 🎛️ Bottom Public Access M3 Circular Buttons */}
        <motion.div variants={itemVariants} className="flex justify-center items-center gap-4 mt-6">
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setShowGuestMess(true)}
            className="m3-icon-button !w-14 !h-14"
          >
            <Utensils size={20} />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setShowGuestCalendar(true)}
            className="m3-icon-button !w-14 !h-14"
          >
            <Calendar size={20} />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => {
              setSetupBranch('Computer Science & Engineering');
              setSetupSemester('Semester 1');
              setShowShelfSetup(true);
            }}
            className="m3-icon-button !w-14 !h-14"
          >
            <BookOpen size={20} />
          </motion.button>
        </motion.div>

        {/* Dev Utility - Text links */}
        <motion.div variants={itemVariants} className="flex justify-center items-center w-full pt-4 gap-4 opacity-40 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setShowDemoProfiles(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-m3-primary hover:text-m3-primary/80 transition-colors"
          >
            <KeyRound size={14} />
            <span>Demo Profiles</span>
          </button>
          <span className="text-m3-outlineVariant text-[10px]">|</span>
          <button
            type="button"
            onClick={() => {
              Object.keys(localStorage).forEach((key) => {
                if (key.startsWith('cp_')) localStorage.removeItem(key);
              });
              window.dispatchEvent(new Event('storage'));
              alert('Demo environment reset successfully!');
              window.location.reload();
            }}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-m3-error hover:text-m3-error/80 transition-colors"
          >
            <X size={14} />
            <span>Reset</span>
          </button>
        </motion.div>
      </motion.div>

      {/* 🔑 Demo Profiles Popup Overlay */}
      <AnimatePresence>
        {showDemoProfiles && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-md z-[99999] flex items-end justify-center" 
            onClick={() => setShowDemoProfiles(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="backdrop-blur-xl rounded-t-[32px] rounded-b-none p-6 w-full shadow-2xl flex flex-col gap-6 text-left border-t border-white/10" 
              style={{ backgroundColor: 'color-mix(in srgb, var(--m3-surface-container) 75%, transparent)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xl font-bold text-m3-onSurface">
                  <KeyRound size={22} className="text-m3-primary" /> Demo Profiles
                </h3>
                <button onClick={() => setShowDemoProfiles(false)} className="p-2 -mr-2 text-m3-onSurfaceVariant hover:text-m3-primary rounded-full hover:bg-white/5 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { label: 'Student (Demo)', user: 'student', pass: 'Student@123', color: 'bg-m3-surfaceContainerHigh hover:bg-m3-surfaceContainerHighest text-m3-onSurface' },
                ].map((profile) => (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    key={profile.user}
                    onClick={() => {
                      setEmail(profile.user);
                      setPassword(profile.pass);
                      setShowDemoProfiles(false);
                    }}
                    className={`w-full rounded-[20px] p-5 flex flex-col transition-colors text-left ${profile.color}`}
                  >
                    <span className="text-lg font-bold leading-tight">{profile.label}</span>
                    <span className="text-sm font-mono mt-1 opacity-70">
                      {profile.user} • {profile.pass}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📚 Shelf Setup Popup Overlay */}
      <AnimatePresence>
        {showShelfSetup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-md z-[99999] flex items-end justify-center" 
            onClick={() => setShowShelfSetup(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="backdrop-blur-xl rounded-t-[32px] rounded-b-none p-6 w-full shadow-2xl flex flex-col gap-6 text-left border-t border-white/10" 
              style={{ backgroundColor: 'color-mix(in srgb, var(--m3-surface-container) 75%, transparent)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xl font-bold text-m3-onSurface">
                  <BookOpen size={22} className="text-m3-primary" /> Shelf Setup
                </h3>
                <button onClick={() => setShowShelfSetup(false)} className="p-2 -mr-2 text-m3-onSurfaceVariant hover:text-m3-primary rounded-full hover:bg-white/5 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Branch Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-m3-onSurfaceVariant text-[11px] font-bold uppercase tracking-wider pl-1">Branch</span>
                <select
                  value={setupBranch}
                  onChange={(e) => setSetupBranch(e.target.value)}
                  className="w-full bg-m3-surfaceContainerHigh text-m3-onSurface rounded-[18px] px-4 py-4 text-sm font-bold outline-none border-none appearance-none"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mathematics and Computing">Mathematics and Computing</option>
                  <option value="Robotics and Artificial Intelligence">Robotics and Artificial Intelligence</option>
                  <option value="Biotechnology">Biotechnology</option>
                </select>
              </div>

              {/* Semester Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-m3-onSurfaceVariant text-[11px] font-bold uppercase tracking-wider pl-1">Semester</span>
                <select
                  value={setupSemester}
                  onChange={(e) => setSetupSemester(e.target.value)}
                  className="w-full bg-m3-surfaceContainerHigh text-m3-onSurface rounded-[18px] px-4 py-4 text-sm font-bold outline-none border-none appearance-none"
                >
                  {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setGuestShelfBranch(setupBranch);
                  setGuestShelfSemester(setupSemester);
                  setShowShelfSetup(false);
                  setShowGuestShelf(true);
                }}
                className="w-full mt-2 py-4 bg-m3-primary text-m3-onPrimary rounded-[20px] font-bold text-sm shadow-sm transition-colors hover:bg-m3-primary/90"
              >
                Access Shelf
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎨 Theme Selector Popup Overlay */}
      <AnimatePresence>
        {showThemeSelector && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-md z-[99999] flex items-end justify-center" 
            onClick={() => setShowThemeSelector(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="backdrop-blur-xl rounded-t-[32px] rounded-b-none p-6 w-full shadow-2xl flex flex-col gap-6 text-left border-t border-white/10" 
              style={{ backgroundColor: 'color-mix(in srgb, var(--m3-surface-container) 75%, transparent)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xl font-bold text-m3-onSurface">
                  <Palette size={22} className="text-m3-primary" /> Active Theme
                </h3>
                <button onClick={() => setShowThemeSelector(false)} className="p-2 -mr-2 text-m3-onSurfaceVariant hover:text-m3-primary rounded-full hover:bg-white/5 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-5 py-2 w-full">
                <div className="flex items-center justify-center gap-3.5 w-full">
                  {[
                    { id: 'lavender', hex: '#d0bcff', name: 'Lavender' },
                    { id: 'blue', hex: '#a8c7ff', name: 'Sapphire Blue' },
                    { id: 'green', hex: '#85d996', name: 'Emerald Green' },
                    { id: 'orange', hex: '#ffb77c', name: 'Sunset Orange' },
                    { id: 'yellow', hex: '#e6c449', name: 'Amber Yellow' },
                  ].map((theme) => {
                    const isActive = currentTheme === theme.id;
                    return (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.15 }}
                        key={theme.id}
                        onClick={() => applyTheme(theme.id)}
                        className={`w-10 h-10 rounded-full cursor-pointer transition-all duration-300 relative focus:outline-none shrink-0 border border-m3-outlineVariant/50 ${
                          isActive 
                            ? 'ring-4 ring-m3-primary ring-offset-4 ring-offset-m3-surfaceContainer'
                            : 'hover:ring-2 hover:ring-m3-outlineVariant/50'
                        }`}
                        style={{ backgroundColor: theme.hex }}
                        title={`${theme.name} Theme`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-center w-full px-2 mt-2">
                  <div className="m3-segmented-chips w-full max-w-xs justify-between bg-m3-surfaceContainerLow p-1 rounded-full border border-m3-outlineVariant/60">
                    <button
                      type="button"
                      onClick={() => applyMode('light')}
                      className={`flex-grow m3-segmented-chip flex items-center justify-center gap-1 py-2 text-xs font-bold transition-all duration-300 !rounded-full ${
                        currentMode === 'light'
                          ? 'm3-segmented-chip--selected'
                          : '!bg-transparent !border-none !shadow-none'
                      }`}
                    >
                      <Sun size={14} /> Light
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMode('dark')}
                      className={`flex-grow m3-segmented-chip flex items-center justify-center gap-1 py-2 text-xs font-bold transition-all duration-300 !rounded-full ${
                        currentMode === 'dark'
                          ? 'm3-segmented-chip--selected'
                          : '!bg-transparent !border-none !shadow-none'
                      }`}
                    >
                      <Moon size={14} /> Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMode('auto')}
                      className={`flex-grow m3-segmented-chip flex items-center justify-center gap-1 py-2 text-xs font-bold transition-all duration-300 !rounded-full ${
                        currentMode === 'auto'
                          ? 'm3-segmented-chip--selected'
                          : '!bg-transparent !border-none !shadow-none'
                      }`}
                    >
                      <SunMoon size={14} /> Auto
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
