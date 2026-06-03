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
} from 'lucide-react';

function PillLabel({ icon: Icon, children }) {
  return (
    <span className="home-pill__label">
      {Icon && <Icon className="home-pill__icon" strokeWidth={2.25} aria-hidden />}
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
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';

    const loadLocalStorage = () => {
      const passStr = localStorage.getItem(`cp_token_${username}`);
      if (passStr) {
        try {
          const pass = JSON.parse(passStr);
          if (pass?.ExpiryTime && new Date(pass.ExpiryTime) >= new Date()) {
            setActivePass(pass);
          } else {
            localStorage.removeItem(`cp_token_${username}`);
            setActivePass(null);
          }
        } catch {
          setActivePass(null);
        }
      } else {
        setActivePass(null);
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

  const studentGrid = (
    <div className="home-screen__grid home-screen__grid--rows-5">
      <button
        type="button"
        className="home-pill home-pill--c4 home-pill--shape-pill home-pill--align-center"
        onClick={() => onTileClick('notices')}
        title="Notices"
      >
        <PillLabel icon={Megaphone}>Notices</PillLabel>
        {hasUnreadNotices && <span className="home-pill__unread" aria-hidden />}
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

  const adminGrid = (
    <div className="home-screen__grid home-screen__grid--rows-3">
      <button
        type="button"
        className="home-pill home-pill--c4 home-pill--shape-pill home-pill--align-center"
        onClick={() => onTileClick('notices')}
        title="Notices"
      >
        <PillLabel icon={Megaphone}>Notices</PillLabel>
        {hasUnreadNotices && <span className="home-pill__unread" aria-hidden />}
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
        <div className="home-screen__chips flex flex-col gap-2.5">
          {activePass && (
            <button
              type="button"
              onClick={() => onTileClick('MESS_QR_FULL')}
              className="w-full rounded-[22px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 flex items-center justify-between text-left active:scale-[0.99] transition"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300/80">Mess token</span>
                <p className="text-sm font-bold text-white mt-0.5">Pass active — tap for QR</p>
              </div>
              <QrCode size={22} className="text-emerald-400 shrink-0" />
            </button>
          )}
          {activeOrder && (
            <button
              type="button"
              onClick={() => onTileClick('SUCCESS')}
              className="w-full rounded-[22px] border border-orange-400/30 bg-orange-500/10 px-4 py-3 flex items-center justify-between text-left active:scale-[0.99] transition"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-300/80">Canteen</span>
                <p className="text-2xl font-black text-orange-300 font-mono mt-0.5">{activeOrder.PickupPIN}</p>
              </div>
              <Ticket size={22} className="text-orange-400 shrink-0" />
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
