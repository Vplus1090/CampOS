import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Coffee,
  Utensils,
  QrCode,
  Ticket,
  Clock,
  Calendar,
  Handshake,
  Library,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  WifiOff,
  Palette,
  X,
  Sun,
  Moon,
  SunMoon,
  ClipboardList,
  Users,
} from 'lucide-react';
import { applyThemeMode, initGeolocation } from '../utils/theme';

function PillLabel({ icon: Icon, children, badge }) {
  return (
    <span className="home-pill__label">
      {Icon && (
        <span className="relative inline-flex">
          <Icon className="home-pill__icon" strokeWidth={2.25} aria-hidden />
          {badge && <span className="home-pill__unread-dot" />}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}

function VerticalPill({ icon: Icon, children, stacked }) {
  return (
    <span className="home-pill__vertical">
      {Icon && <Icon className="home-pill__icon" strokeWidth={2.25} aria-hidden />}
      {stacked ? (
        <span className="home-pill__vertical-text home-pill__vertical-text--stacked">
          <span>{stacked[0]}</span>
          <span>{stacked[1]}</span>
        </span>
      ) : (
        <span className="home-pill__vertical-text">{children}</span>
      )}
    </span>
  );
}

/** Canteen row only — one unified button spanning full width */
function CanteenPillRow({ onClick, title }) {
  return (
    <button 
      type="button" 
      className="home-pill home-pill--c4 home-pill--shape-pill home-pill--align-center" 
      onClick={onClick} 
      title={title}
    >
      <PillLabel icon={Coffee}>Canteen</PillLabel>
    </button>
  );
}

export default function MetroStartScreen({ currentUser, stats, onTileClick, onLogout, hasUnreadNotices }) {
  const [activePass, setActivePass] = useState(null);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [activeOrder, setActiveOrder] = useState(null);

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
    if (!currentUser) return;
    const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';

    const loadLocalStorage = () => {
      const passStr = localStorage.getItem(`cp_token_${username}`);
      if (passStr) {
        try {
          const pass = JSON.parse(passStr);
          if (pass?.ExpiryTime) {
            const diffMs = new Date(pass.ExpiryTime) - new Date();
            const mins = Math.max(0, Math.ceil(diffMs / 60000));
            if (mins > 0) {
              setActivePass(pass);
              setRemainingMinutes(mins);
            } else {
              localStorage.removeItem(`cp_token_${username}`);
              setActivePass(null);
              setRemainingMinutes(0);
            }
          } else {
            setActivePass(null);
            setRemainingMinutes(0);
          }
        } catch {
          setActivePass(null);
          setRemainingMinutes(0);
        }
      } else {
        setActivePass(null);
        setRemainingMinutes(0);
      }

      const orderStr = localStorage.getItem(`cp_order_${username}`);
      if (orderStr) {
        try {
          setActiveOrder(JSON.parse(orderStr));
        } catch {
          setActiveOrder(null);
        }
      } else {
        setActiveOrder(null);
      }
    };

    loadLocalStorage();
    const interval = setInterval(loadLocalStorage, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const isStudent = currentUser?.role === 'student';
  const isAdmin = currentUser?.role === 'admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isCanteenAdmin = currentUser?.role === 'canteen_admin';

  const displayName = useMemo(() => {
    try {
      const cached = localStorage.getItem('profileData');
      if (cached) {
        const profile = JSON.parse(cached);
        const fullName = profile?.name || profile?.generalinformation?.name;
        if (fullName) {
          const first = fullName.trim().split(/\s+/)[0];
          return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
        }
      }
    } catch {
      // ignore
    }
    if (currentUser?.firstName) return currentUser.firstName;
    return 'Guest';
  }, [currentUser]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const openCanteen = () => onTileClick('canteen');
  const openCanteenOrders = () => onTileClick('canteen_orders');
  const openCanteenMenu = () => onTileClick('canteen_menu');

  const isSquished = !!(activePass || activeOrder);

  const studentGrid = (
    <div className="home-screen__grid home-screen__grid--rows-5">
      <button
        type="button"
        className={`home-pill home-pill--c4 home-pill--shape-pill home-pill--align-center ${hasUnreadNotices ? 'home-pill--notices-unread' : ''}`}
        onClick={() => onTileClick('notices')}
        title="Notices"
      >
        <PillLabel icon={Megaphone} badge={hasUnreadNotices}>Notices</PillLabel>
      </button>

      <button
        type="button"
        className="home-pill home-pill--c3 home-pill--shape-round home-pill--align-center"
        onClick={() => onTileClick('student_dashboard')}
        title="Student Dashboard"
      >
        <PillLabel icon={LayoutDashboard}>Dashboard</PillLabel>
      </button>
      <button
        type="button"
        className="home-pill home-pill--c1 home-pill--shape-squircle home-pill--icon-only"
        onClick={() => onTileClick('timetable')}
        title="Timetable"
      >
        <Clock className="home-pill__icon" strokeWidth={2.35} aria-hidden />
      </button>

      <CanteenPillRow onClick={openCanteen} title="Canteen" />

      <button
        type="button"
        className={`home-pill home-pill--c2 home-pill--shape-oval ${isSquished ? 'home-pill--align-center' : 'home-pill--tile-vertical'}`}
        onClick={() => onTileClick('mess')}
        title="Mess Menu"
      >
        {isSquished ? (
          <PillLabel icon={Utensils}>Mess Menu</PillLabel>
        ) : (
          <VerticalPill icon={Utensils} stacked={['Mess', 'Menu']} />
        )}
      </button>
      <button
        type="button"
        className={`home-pill home-pill--c2 home-pill--shape-oval ${isSquished ? 'home-pill--align-center' : 'home-pill--tile-vertical'}`}
        onClick={() => onTileClick('skillgigs')}
        title="Skill Swap"
      >
        {isSquished ? (
          <PillLabel icon={Handshake}>Skill Swap</PillLabel>
        ) : (
          <VerticalPill icon={Handshake} stacked={['Skill', 'Swap']} />
        )}
      </button>

      <button
        type="button"
        className={`home-pill home-pill--c2 home-pill--shape-soft ${isSquished ? 'home-pill--align-center' : 'home-pill--tile-vertical'}`}
        onClick={() => onTileClick('materials')}
        title="Shelf"
      >
        {isSquished ? (
          <PillLabel icon={Library}>Shelf</PillLabel>
        ) : (
          <VerticalPill icon={Library}>Shelf</VerticalPill>
        )}
      </button>
      <button
        type="button"
        className={`home-pill home-pill--c2 home-pill--shape-soft ${isSquished ? 'home-pill--align-center' : 'home-pill--tile-vertical'}`}
        onClick={() => onTileClick('calendar')}
        title="Calendar"
      >
        {isSquished ? (
          <PillLabel icon={Calendar}>Calendar</PillLabel>
        ) : (
          <VerticalPill icon={Calendar}>Calendar</VerticalPill>
        )}
      </button>
    </div>
  );

  const adminGrid = (
    <div className="home-screen__grid home-screen__grid--rows-3">
      <button
        type="button"
        className={`home-pill home-pill--c4 home-pill--shape-pill home-pill--align-center ${hasUnreadNotices ? 'home-pill--notices-unread' : ''}`}
        onClick={() => onTileClick('notices')}
        title="Notices"
      >
        <PillLabel icon={Megaphone} badge={hasUnreadNotices}>Notices</PillLabel>
      </button>

      <button
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-oval home-pill--tile-vertical"
        onClick={() => onTileClick('mess')}
        title="Mess Menu"
      >
        <VerticalPill icon={Utensils} stacked={['Mess', 'Menu']} />
      </button>
      <button
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-oval home-pill--tile-vertical"
        onClick={() => onTileClick('skillgigs')}
        title="Skill Swap"
      >
        <VerticalPill icon={Handshake} stacked={['Skill', 'Swap']} />
      </button>

      <button
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-soft home-pill--tile-vertical"
        onClick={() => onTileClick('materials')}
        title="Shelf"
      >
        <VerticalPill icon={Library}>Shelf</VerticalPill>
      </button>
      <button
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-soft home-pill--tile-vertical"
        onClick={() => onTileClick('calendar')}
        title="Calendar"
      >
        <VerticalPill icon={Calendar}>Calendar</VerticalPill>
      </button>
    </div>
  );

  const superAdminGrid = (
    <div className="home-screen__grid home-screen__grid--rows-5">
      {/* Notices: full width (4 cols) */}
      <button
        type="button"
        className={`home-pill home-pill--c4 home-pill--shape-pill home-pill--align-center ${hasUnreadNotices ? 'home-pill--notices-unread' : ''}`}
        onClick={() => onTileClick('notices')}
        title="Notices"
      >
        <PillLabel icon={Megaphone} badge={hasUnreadNotices}>Notices Board</PillLabel>
      </button>

      {/* Row 2: Mess Menu (span 2), Skill Swap (span 2) */}
      <button
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-oval home-pill--tile-vertical"
        onClick={() => onTileClick('mess')}
        title="Mess Menu"
      >
        <VerticalPill icon={Utensils} stacked={['Mess', 'Menu']} />
      </button>
      <button
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-oval home-pill--tile-vertical"
        onClick={() => onTileClick('skillgigs')}
        title="Skill Swap"
      >
        <VerticalPill icon={Handshake} stacked={['Skill', 'Swap']} />
      </button>

      {/* Row 3: Study Shelf (span 2), Calendar (span 2) */}
      <button
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-soft home-pill--tile-vertical"
        onClick={() => onTileClick('materials')}
        title="Shelf"
      >
        <VerticalPill icon={Library}>Shelf</VerticalPill>
      </button>
      <button
        type="button"
        className="home-pill home-pill--c2 home-pill--shape-soft home-pill--tile-vertical"
        onClick={() => onTileClick('calendar')}
        title="Calendar"
      >
        <VerticalPill icon={Calendar}>Calendar</VerticalPill>
      </button>

      {/* Row 4: Edit Menu (span 4) */}
      <button
        type="button"
        className="home-pill home-pill--c4 home-pill--shape-round home-pill--align-center"
        onClick={openCanteenMenu}
        title="Edit Menu"
      >
        <PillLabel icon={Coffee}>Edit Canteen Menu</PillLabel>
      </button>

      {/* Row 5: Manage Users (span 4) */}
      <button
        type="button"
        className="home-pill home-pill--c4 home-pill--shape-round home-pill--align-center"
        onClick={() => onTileClick('users')}
        title="User Management"
      >
        <PillLabel icon={Users}>Manage Users</PillLabel>
      </button>
    </div>
  );

  return (
    <div className="home-screen text-m3-onSurface font-sans select-none relative z-10">
      <header className="home-screen__header">
        <button type="button" className="home-screen__logout" onClick={onLogout} title="Log out">
          <ChevronLeft className="home-screen__logout-icon" strokeWidth={2.75} aria-hidden />
        </button>
        <div className="home-screen__titles">
          <p className="home-screen__welcome">{greeting}</p>
          <h1 className="home-screen__name">{displayName}</h1>
        </div>
        <button
          type="button"
          className="home-screen__theme-btn"
          onClick={() => setShowThemeSelector(true)}
          title="Select Theme"
        >
          <Palette className="home-screen__theme-btn-icon" strokeWidth={2.25} aria-hidden />
        </button>
      </header>

      {(activePass || activeOrder) && (
        <div className="home-screen__chips flex flex-col gap-3">
          {activePass && (
            <button
              type="button"
              onClick={() => onTileClick('MESS_QR_FULL')}
              className="w-full rounded-[28px] bg-m3-surfaceContainerHigh border-none px-6 py-5 flex items-center justify-between text-left active:scale-[0.99] transition-all duration-300 shadow-xl cursor-pointer"
            >
              <div className="flex flex-col gap-1.5">
                <h4 className="text-lg font-bold text-m3-onSurface tracking-tight">Mess Access</h4>
                <p className="text-sm font-bold text-m3-onSurface leading-tight">
                  Pass active • {remainingMinutes} min left
                </p>
                <div className="flex items-center gap-1.5 text-xs text-m3-onSurfaceVariant/85 mt-1 font-medium select-none">
                  <WifiOff size={14} className="opacity-80" />
                  <span>Tap for QR</span>
                </div>
              </div>
              <div 
                className="w-12 h-12 rounded-full text-m3-onPrimaryContainer flex items-center justify-center shrink-0 shadow-inner"
                style={{ backgroundColor: 'color-mix(in srgb, var(--m3-primary-container) 30%, transparent)' }}
              >
                <QrCode size={20} />
              </div>
            </button>
          )}
          {activeOrder && (
            <button
              type="button"
              onClick={() => onTileClick('SUCCESS')}
              className="w-full rounded-[28px] bg-m3-surfaceContainerHigh border-none px-6 py-5 flex items-center justify-between text-left active:scale-[0.99] transition-all duration-300 shadow-xl cursor-pointer"
            >
              <div className="flex flex-col gap-1.5">
                <h4 className="text-lg font-bold text-m3-onSurface tracking-tight">Canteen Order</h4>
                <p className="text-sm font-semibold text-m3-onSurface">
                  Pickup PIN • <span className="text-m3-tertiary font-black">{activeOrder.PickupPIN}</span>
                </p>
                <div className="flex items-center gap-1.5 text-xs text-m3-onSurfaceVariant/85 mt-1 font-medium select-none">
                  <Clock size={14} className="opacity-80" />
                  <span>Tap for Receipt</span>
                </div>
              </div>
              <div 
                className="w-12 h-12 rounded-full text-m3-tertiary flex items-center justify-center shrink-0 shadow-inner"
                style={{ backgroundColor: 'color-mix(in srgb, var(--m3-tertiary) 15%, transparent)' }}
              >
                <Ticket size={20} />
              </div>
            </button>
          )}
        </div>
      )}

      {isStudent && studentGrid}

      {isCanteenAdmin && (
        <div className="home-screen__grid home-screen__grid--rows-2">
          <button
            type="button"
            className="home-pill home-pill--c4 home-pill--shape-round home-pill--align-center"
            onClick={openCanteenOrders}
            title="Student Orders"
          >
            <PillLabel icon={ClipboardList}>Student Orders</PillLabel>
          </button>
          <button
            type="button"
            className="home-pill home-pill--c4 home-pill--shape-round home-pill--align-center"
            onClick={openCanteenMenu}
            title="Edit Menu"
          >
            <PillLabel icon={Coffee}>Edit Menu</PillLabel>
          </button>
        </div>
      )}

      {isAdmin && adminGrid}

      {isSuperAdmin && superAdminGrid}

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
    </div>
  );
}
