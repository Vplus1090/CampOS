import React, { useState, useEffect, useMemo } from 'react';
import { 
  Megaphone, Coffee, Utensils, BookOpen, LogOut, 
  QrCode, Ticket, Clock, ArrowRight, Calendar,
  GraduationCap
} from 'lucide-react';

export default function MetroStartScreen({ currentUser, stats, onTileClick, onLogout, hasUnreadNotices }) {
  const [currentDate, setCurrentDate] = useState('');
  const [activePass, setActivePass] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  // Set the current date formatted nicely
  useEffect(() => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, []);

  // Load and periodically sync localStorage activity passes/orders
  useEffect(() => {
    if (!currentUser) return;
    const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';
    
    const loadLocalStorage = () => {
      // Load Mess Pass
      const passStr = localStorage.getItem(`cp_token_${username}`);
      if (passStr) {
        try {
          const pass = JSON.parse(passStr);
          if (pass && pass.ExpiryTime) {
            const isExpired = new Date(pass.ExpiryTime) < new Date();
            if (!isExpired) {
              setActivePass(pass);
            } else {
              localStorage.removeItem(`cp_token_${username}`);
              setActivePass(null);
            }
          }
        } catch (e) {
          setActivePass(null);
        }
      } else {
        setActivePass(null);
      }

      // Load Canteen Order
      const orderStr = localStorage.getItem(`cp_order_${username}`);
      if (orderStr) {
        try {
          setActiveOrder(JSON.parse(orderStr));
        } catch (e) {
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
    } catch (e) {
      console.warn("Failed to extract name from JPortal profile:", e);
    }
    if (currentUser?.firstName) {
      return currentUser.firstName;
    }
    return 'Guest';
  }, [currentUser]);

  return (
    <div className="metro-start-container flex flex-col p-6 text-white font-sans min-h-screen justify-between pb-10 bg-transparent relative z-10 select-none">
      <div className="w-full flex flex-col gap-6">
        
        {/* Header greeting & Controls */}
        <header className="flex justify-between items-center w-full mt-4 border-b border-white/10 pb-4">
          <div className="flex flex-col items-start text-left select-none animate-fadeIn" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            <span className="text-[22px] font-light text-white/95 leading-tight tracking-tight">
              Hello,
            </span>
            <span className="italic font-normal text-[32px] text-white leading-none mt-0.5 tracking-tight">
              {displayName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notices Pill */}
            {(isStudent || isSuperAdmin) && (
              <button
                onClick={() => onTileClick('notices')}
                className="h-12 px-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full flex items-center justify-center gap-2 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 active:scale-95 shadow-lg select-none cursor-pointer relative"
                title="Notices"
              >
                <Megaphone size={18} className="text-blue-400" />
                <span className="text-xs font-extrabold tracking-wide font-sans text-white/90">Notices</span>
                {hasUnreadNotices && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-[#141a27] animate-pulse"></span>
                )}
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="w-12 h-12 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full flex items-center justify-center backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 active:scale-95 shadow-lg select-none cursor-pointer"
              title="Log Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* 🌟 Active Live Activity Widgets */}
        {(activePass || activeOrder) && (
          <div className="metro-activity-widgets flex flex-col gap-3">

            <div className="flex flex-col gap-4">
              
              {/* Mess Pass Widget */}
              {activePass && (
                <div
                  onClick={() => onTileClick('MESS_QR_FULL')}
                  className="cursor-pointer bg-emerald-500/[0.03] backdrop-blur-3xl rounded-[28px] shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] text-white p-6 flex items-center justify-between active:scale-[0.98] transition-all duration-300 h-[145px] border border-emerald-500/35 relative overflow-hidden"
                >
                  <div className="flex flex-col justify-center h-full text-left">
                    <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest font-sans">Mess Token</span>
                    <h4 className="text-xl font-black tracking-wide mt-2 text-white">Pass Active</h4>
                    <p className="text-emerald-300/80 text-[11px] font-semibold mt-1">Tap to display pass QR</p>
                  </div>
                  
                  <div className="rounded-xl bg-white/[0.08] border border-white/10 p-3 flex items-center justify-center shadow-lg">
                    <QrCode size={28} className="text-emerald-400" />
                  </div>
                </div>
              )}

              {/* Canteen Order Widget */}
              {activeOrder && (
                <div
                  onClick={() => onTileClick('SUCCESS')}
                  className="cursor-pointer bg-orange-500/[0.03] backdrop-blur-3xl rounded-[28px] shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] text-white pt-5 pb-7 px-6 flex flex-col justify-center active:scale-[0.98] transition-all duration-300 h-[110px] border border-orange-500/35 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start text-left w-full">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest font-sans">Canteen Ticket</span>
                      <span className="text-4xl font-black text-orange-400 font-mono tracking-widest mt-0.5 leading-none">
                        {activeOrder.PickupPIN}
                      </span>
                    </div>
                    <Ticket size={24} className="text-orange-400 mt-1" />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Primary Dashboard Blocks */}
        <div className="flex flex-col gap-4">

          {isStudent ? (
            /* Student Asymmetrical Metro Grid (Forms a perfect 3x4 solid rectangle altogether) */
            <div className="grid grid-cols-3 auto-rows-[105px] gap-4 w-full animate-fadeIn select-none">
              
              {/* 1. Dashboard (Col-span 2, Row-span 2 - Largest Box) */}
              <div
                onClick={() => onTileClick('student_dashboard')}
                className="col-span-2 row-span-2 cursor-pointer bg-amber-500/[0.03] backdrop-blur-3xl border border-amber-500/30 rounded-[28px] p-5 h-full flex flex-col justify-between items-start transition-all duration-300 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-amber-500/50 hover:bg-amber-500/[0.06] active:scale-[0.97] group"
              >
                <GraduationCap className="text-amber-400 group-hover:text-amber-300 group-hover:scale-110 transition-all duration-300 shrink-0" size={32} />
                <h3 className="text-xl sm:text-[22px] font-extrabold tracking-wide text-white leading-none text-left">Dashboard</h3>
              </div>

              {/* 2. Timetable (Col-span 1, Row-span 2 - Vertical Font Style) */}
              <div
                onClick={() => onTileClick('timetable')}
                className="col-span-1 row-span-2 cursor-pointer bg-indigo-500/[0.03] backdrop-blur-3xl border border-indigo-500/30 rounded-[28px] p-4 sm:p-5 h-full flex flex-col justify-between items-center transition-all duration-300 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-indigo-500/50 hover:bg-indigo-500/[0.06] active:scale-[0.97] group"
              >
                <Clock className="text-indigo-400 group-hover:scale-110 transition-transform duration-300 shrink-0" size={20} />
                <div className="flex-1 flex items-center justify-center w-full relative overflow-hidden select-none">
                  <span className="text-sm sm:text-base font-extrabold text-white whitespace-nowrap rotate-90 origin-center absolute">
                    Timetable
                  </span>
                </div>
              </div>

              {/* 3. Canteen (Col-span 2, Row-span 1 - Wide Horizontal Box) */}
              <div
                onClick={() => onTileClick('canteen')}
                className="col-span-2 row-span-1 cursor-pointer bg-orange-500/[0.03] backdrop-blur-3xl rounded-[28px] p-4.5 sm:p-5 text-white h-full border border-orange-500/35 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:border-orange-500/55 hover:bg-orange-500/[0.06] flex items-center gap-3 transition-all duration-300 active:scale-[0.99] group"
              >
                <Coffee className="text-orange-400 shrink-0 group-hover:scale-110 transition-transform duration-300" size={20} />
                <h3 className="text-sm sm:text-base font-extrabold text-white leading-none text-left">Canteen</h3>
              </div>

              {/* 4. Mess Hall (Col-span 1, Row-span 1) */}
              <div
                onClick={() => onTileClick('mess')}
                className="col-span-1 row-span-1 cursor-pointer bg-emerald-500/[0.03] backdrop-blur-3xl rounded-[28px] p-4 sm:p-5 text-white h-full border border-emerald-500/35 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:border-emerald-500/55 hover:bg-emerald-500/[0.06] flex flex-col justify-between items-start transition-all duration-300 active:scale-[0.99] group"
              >
                <Utensils className="text-emerald-400 group-hover:scale-110 transition-transform duration-300 shrink-0" size={18} />
                <h3 className="text-[11px] sm:text-xs font-extrabold tracking-wide leading-tight text-white text-left">Mess Hall</h3>
              </div>

              {/* 5. Skill Swap (Col-span 1, Row-span 1) */}
              <div
                onClick={() => onTileClick('skillgigs')}
                className="col-span-1 row-span-1 cursor-pointer bg-violet-500/[0.03] backdrop-blur-3xl rounded-[28px] p-4 sm:p-5 text-white h-full border border-violet-500/35 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:border-violet-500/55 hover:bg-violet-500/[0.06] flex flex-col justify-between items-start transition-all duration-300 active:scale-[0.99] group"
              >
                <BookOpen className="text-violet-400 group-hover:scale-110 transition-transform duration-300 shrink-0" size={18} />
                <h3 className="text-[11px] sm:text-xs font-extrabold tracking-wide leading-tight text-white text-left">Skill Swap</h3>
              </div>

              {/* 6. Shelf (Col-span 1, Row-span 1) */}
              <div
                onClick={() => onTileClick('materials')}
                className="col-span-1 row-span-1 cursor-pointer bg-cyan-500/[0.03] backdrop-blur-3xl border border-cyan-500/25 rounded-[28px] p-4 sm:p-5 h-full flex flex-col justify-between items-start transition-all duration-300 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-cyan-500/50 hover:bg-cyan-500/[0.06] active:scale-[0.97] group"
              >
                <BookOpen className="text-cyan-400 group-hover:scale-110 transition-transform duration-300 shrink-0" size={18} />
                <h3 className="text-[11px] sm:text-xs font-extrabold tracking-wide leading-tight text-white text-left">Shelf</h3>
              </div>

              {/* 7. Calendar (Col-span 1, Row-span 1) */}
              <div
                onClick={() => onTileClick('calendar')}
                className="col-span-1 row-span-1 cursor-pointer bg-rose-500/[0.03] backdrop-blur-3xl border border-rose-500/25 rounded-[28px] p-4 sm:p-5 h-full flex flex-col justify-between items-start transition-all duration-300 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-rose-500/50 hover:bg-rose-500/[0.06] active:scale-[0.97] group"
              >
                <Calendar className="text-rose-400 group-hover:scale-110 transition-transform duration-300 shrink-0" size={18} />
                <h3 className="text-[9.5px] sm:text-[11px] font-extrabold tracking-wide leading-tight text-white text-left">Calendar</h3>
              </div>

            </div>
          ) : (
            /* Fallback Grid layout for Admin / Canteen Admin */
            <div className="flex flex-col gap-4">
              {/* Canteen (Glassy Orange) */}
              {isCanteenAdmin && (
                <div
                  onClick={() => onTileClick('canteen')}
                  className="cursor-pointer bg-orange-500/[0.03] backdrop-blur-3xl rounded-[28px] p-5 text-white h-[185px] border border-orange-500/35 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col justify-between transition-all duration-300 active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start w-full text-left">
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-black tracking-wide leading-none">Canteen Admin</h3>
                      <p className="text-orange-200/80 text-sm mt-2 font-semibold">Manage campus orders and menu</p>
                    </div>
                    <Coffee size={24} className="text-orange-400 mt-1" />
                  </div>
                </div>
              )}

              {/* Super Admin fallbacks */}
              {isSuperAdmin && (
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div
                    onClick={() => onTileClick('mess')}
                    className="cursor-pointer bg-emerald-500/[0.03] backdrop-blur-3xl rounded-[28px] p-5 text-white h-[135px] border border-emerald-500/35 shadow-xl flex flex-col justify-center relative transition duration-300 active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-center w-full text-left">
                      <h3 className="text-lg font-black tracking-wide leading-none">Mess Admin</h3>
                      <Utensils size={20} className="text-emerald-400" />
                    </div>
                  </div>
                  <div
                    onClick={() => onTileClick('skillgigs')}
                    className="cursor-pointer bg-violet-500/[0.03] backdrop-blur-3xl rounded-[28px] p-5 text-white h-[135px] border border-violet-500/35 shadow-xl flex flex-col justify-center relative transition duration-300 active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-center w-full text-left">
                      <h3 className="text-lg font-black tracking-wide leading-none">Skill Swap Admin</h3>
                      <BookOpen size={20} className="text-violet-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
