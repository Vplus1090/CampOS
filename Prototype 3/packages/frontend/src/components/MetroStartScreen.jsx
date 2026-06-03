import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';

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
  const isSuperAdmin = currentUser?.role === 'admin';
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

  return (
    <div className="home-screen text-white font-sans select-none relative z-10">
      <header className="home-screen__header">
        <button type="button" className="home-screen__logout" onClick={onLogout} title="Log out">
          <ChevronLeft className="home-screen__logout-icon" strokeWidth={2.75} aria-hidden />
        </button>
        <div className="home-screen__titles">
          <p className="home-screen__welcome">{greeting}</p>
          <h1 className="home-screen__name">{displayName}</h1>
        </div>
        <div className="w-12 h-12 shrink-0 opacity-0 pointer-events-none" /> {/* Spacer to center titles */}
      </header>

      {(activePass || activeOrder) && (
        <div className="home-screen__chips flex flex-col gap-3">
          {activePass && (
            <button
              type="button"
              onClick={() => onTileClick('MESS_QR_FULL')}
              className="w-full rounded-[28px] bg-[#211a30] border border-white/5 px-6 py-5 flex items-center justify-between text-left active:scale-[0.99] transition-all duration-300 shadow-xl cursor-pointer"
            >
              <div className="flex flex-col gap-1.5">
                <h4 className="text-lg font-bold text-white tracking-tight">Mess Access</h4>
                <p className="text-sm font-bold text-white leading-tight">
                  Pass active • {remainingMinutes} min left
                </p>
                <div className="flex items-center gap-1.5 text-xs text-[#cac4d0] mt-1 font-medium select-none">
                  <WifiOff size={14} className="opacity-80" />
                  <span>Tap for QR</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#4f378b]/40 text-[#eaddff] flex items-center justify-center shrink-0 shadow-inner">
                <QrCode size={20} />
              </div>
            </button>
          )}
          {activeOrder && (
            <button
              type="button"
              onClick={() => onTileClick('SUCCESS')}
              className="w-full rounded-[28px] bg-[#211a30] border border-white/5 px-6 py-5 flex items-center justify-between text-left active:scale-[0.99] transition-all duration-300 shadow-xl cursor-pointer"
            >
              <div className="flex flex-col gap-1.5">
                <h4 className="text-lg font-bold text-white tracking-tight">Canteen Order</h4>
                <p className="text-sm font-semibold text-[#e6e1e5]">
                  Pickup PIN • <span className="text-[#fb923c] font-black">{activeOrder.PickupPIN}</span>
                </p>
                <div className="flex items-center gap-1.5 text-xs text-[#cac4d0] mt-1 font-medium select-none">
                  <Clock size={14} className="opacity-80" />
                  <span>Tap for Receipt</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#fb923c]/20 text-[#fb923c] flex items-center justify-center shrink-0 shadow-inner">
                <Ticket size={20} />
              </div>
            </button>
          )}
        </div>
      )}

      {isStudent && studentGrid}

      {isCanteenAdmin && (
        <div className="home-screen__grid home-screen__grid--rows-1">
          <button
            type="button"
            className="home-pill home-pill--c4 home-pill--shape-round home-pill--align-center"
            onClick={openCanteen}
            title="Canteen Admin"
          >
            <PillLabel icon={Coffee}>Canteen Admin</PillLabel>
          </button>
        </div>
      )}

      {isSuperAdmin && adminGrid}
    </div>
  );
}
