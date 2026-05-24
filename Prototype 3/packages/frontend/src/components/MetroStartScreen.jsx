import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Coffee, Utensils, BookOpen, LogOut, 
  QrCode, Ticket, Clock, ArrowRight, BookMarked, CalendarDays 
} from 'lucide-react';

export default function MetroStartScreen({ currentUser, stats, onTileClick, onLogout }) {
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

  return (
    <div className="metro-start-container flex flex-col p-6 text-white font-sans min-h-screen justify-between pb-10 bg-transparent relative z-10 select-none">
      <div className="w-full flex flex-col gap-6">
        
        {/* Header greeting & Logout */}
        <header className="flex justify-between items-center w-full mt-4">
          <div className="flex flex-col text-left">
            <span className="text-3xl font-black text-white/90 leading-tight">Hello,</span>
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-400 tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(129,140,248,0.25)]">
              Vardaan
            </span>
          </div>

          <button
            onClick={onLogout}
            className="w-12 h-12 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full flex items-center justify-center backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 active:scale-95 shadow-lg select-none cursor-pointer"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* 🌟 Active Live Activity Widgets */}
        {(activePass || activeOrder) && (
          <div className="metro-activity-widgets flex flex-col gap-3">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest font-sans text-left pl-1">Live Activity</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Mess Pass Widget */}
              {activePass && (
                <div
                  onClick={() => onTileClick('MESS_QR_FULL')}
                  className="cursor-pointer bg-indigo-500/[0.03] backdrop-blur-3xl rounded-[28px] shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] text-white p-5 flex items-center justify-between active:scale-[0.98] transition-all duration-300 h-[135px] border border-indigo-500/35 relative overflow-hidden"
                >
                  <div className="flex flex-col justify-center h-full text-left">
                    <span className="text-indigo-400 text-[9px] font-black uppercase tracking-widest font-sans">Mess Token</span>
                    <h4 className="text-lg font-black tracking-wide mt-1 text-white">Pass Active</h4>
                    <p className="text-indigo-300/80 text-[10px] font-semibold mt-1">Tap to display pass QR</p>
                  </div>
                  
                  <div className="rounded-xl bg-white/[0.08] border border-white/10 p-2.5 flex items-center justify-center shadow-lg">
                    <QrCode size={26} className="text-white" />
                  </div>
                </div>
              )}

              {/* Canteen Order Widget */}
              {activeOrder && (
                <div
                  onClick={() => onTileClick('SUCCESS')}
                  className="cursor-pointer bg-orange-500/[0.03] backdrop-blur-3xl rounded-[28px] shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] text-white p-5 flex flex-col justify-between active:scale-[0.98] transition-all duration-300 h-[135px] border border-orange-500/35 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start text-left w-full">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest font-sans">Canteen Ticket</span>
                      <span className="text-3xl font-black text-orange-400 font-mono tracking-widest mt-1">
                        {activeOrder.PickupPIN}
                      </span>
                    </div>
                    <Ticket size={24} className="text-slate-400 mt-1" />
                  </div>
                  
                  <div className="border-t border-white/10 pt-2.5 flex justify-between items-center text-[10px] font-sans mt-auto w-full">
                    <span className="text-slate-400 font-extrabold uppercase tracking-wide">{activeOrder.ItemCount || 0} Items</span>
                    <span className="text-orange-400 font-black tracking-widest uppercase">
                      PAID ₹{activeOrder.TotalAmount}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Primary Dashboard Blocks */}
        <div className="flex flex-col gap-4">
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest font-sans text-left pl-1">Services</span>
          
          {/* Card 1: Notices (Glassy Blue) */}
          {(isStudent || isSuperAdmin) && (
            <div
              onClick={() => onTileClick('notices')}
              className="cursor-pointer bg-blue-500/[0.03] backdrop-blur-3xl rounded-[28px] p-6 text-white h-[135px] border-2 border-blue-500/35 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-[0_0_30px_rgba(59,130,246,0.08)] flex flex-col justify-between relative overflow-hidden group transition-all duration-300 active:scale-[0.99]"
            >
              {/* Subtle background decorative circle overlay */}
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-500/10 rounded-full border border-white/5 transition-transform group-hover:scale-110"></div>
              
              <div className="flex justify-between items-start w-full z-10 text-left">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black tracking-wide leading-none">Notices</h3>
                  <p className="text-blue-200/80 text-sm mt-2 font-semibold">Updates & News</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                  <Megaphone size={20} className="text-white" />
                </div>
              </div>

              <div className="text-blue-300/65 text-xs font-mono font-bold tracking-wider z-10 text-left">
                📢 {stats.notices} announcements active
              </div>
            </div>
          )}

          {/* Card 2: Canteen (Glassy Orange) */}
          {(isStudent || isCanteenAdmin) && (
            <div
              onClick={() => onTileClick('canteen')}
              className="cursor-pointer bg-orange-500/[0.03] backdrop-blur-3xl rounded-[28px] p-6 text-white h-[185px] border-2 border-orange-500/35 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-[0_0_30px_rgba(249,115,22,0.08)] flex flex-col justify-between relative overflow-hidden group transition-all duration-300 active:scale-[0.99]"
            >
              {/* Subtle background decorative circle overlay */}
              <div className="absolute -right-4 -bottom-4 w-36 h-36 bg-orange-500/10 rounded-full border border-white/5 transition-transform group-hover:scale-110"></div>

              <div className="flex justify-between items-start w-full z-10 text-left">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black tracking-wide leading-none">Canteen</h3>
                  <p className="text-orange-200/80 text-sm mt-2 font-semibold">Fresh campus specialties</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                  <Coffee size={20} className="text-white" />
                </div>
              </div>

              {/* Order Now button at bottom */}
              <div className="flex justify-between items-center w-full z-10 mt-4">
                <span className="text-orange-300/65 text-xs font-mono font-bold tracking-wider text-left">
                  {isCanteenAdmin ? `🛠️ CRUD Manager (${stats.canteen} items)` : `🍔 ${stats.canteen} items available`}
                </span>
                {!isCanteenAdmin && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onTileClick('canteen'); }}
                    className="bg-white text-[#141a27] hover:bg-slate-50 font-black rounded-xl px-5 py-2.5 text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer z-20"
                  >
                    Order Now <ArrowRight size={12} className="stroke-[3px]" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Row of side-by-side cards: Mess & Skill Swap */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Card 3: Mess Hall (Glassy Emerald) */}
            {(isStudent || isSuperAdmin) && (
              <div
                onClick={() => onTileClick('mess')}
                className="cursor-pointer bg-emerald-500/[0.03] backdrop-blur-3xl rounded-[28px] p-5 text-white h-[135px] border-2 border-emerald-500/35 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-[0_0_30px_rgba(16,185,129,0.08)] flex flex-col justify-between relative overflow-hidden group transition-all duration-300 active:scale-[0.99]"
              >
                <div className="flex justify-between items-start w-full z-10 text-left">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black tracking-wide leading-none">Mess Hall</h3>
                    <p className="text-emerald-200/85 text-[11px] mt-1 font-semibold leading-tight">Menu & Tokens</p>
                  </div>
                  <div className="w-9 h-9 bg-emerald-500/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                    <Utensils size={15} className="text-white" />
                  </div>
                </div>

                <div className="text-emerald-300/65 text-[9px] font-mono font-black uppercase tracking-widest z-10 text-left">
                  🍱 Daily Meal Active
                </div>
              </div>
            )}

            {/* Card 4: Skill Swap (Glassy Violet) */}
            {(isStudent || isSuperAdmin) && (
              <div
                onClick={() => onTileClick('skillgigs')}
                className="cursor-pointer bg-violet-500/[0.03] backdrop-blur-3xl rounded-[28px] p-5 text-white h-[135px] border-2 border-violet-500/35 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-[0_0_30px_rgba(139,92,246,0.08)] flex flex-col justify-between relative overflow-hidden group transition-all duration-300 active:scale-[0.99]"
              >
                <div className="flex justify-between items-start w-full z-10 text-left">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black tracking-wide leading-none">Skill Swap</h3>
                    <p className="text-violet-200/85 text-[11px] mt-1 font-semibold leading-tight">Learn & Teach</p>
                  </div>
                  <div className="w-9 h-9 bg-violet-500/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                    <BookOpen size={15} className="text-white" />
                  </div>
                </div>

                <div className="text-violet-300/65 text-[9px] font-mono font-black uppercase tracking-widest z-10 text-left">
                  🤝 {stats.skillgigs} skill swops
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Services List */}
        {isStudent && (
          <div className="flex flex-col gap-3 mt-2">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest font-sans text-left pl-1">Academic Library</span>
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Study Materials */}
              <div
                onClick={() => onTileClick('materials')}
                className="cursor-pointer bg-indigo-500/[0.03] backdrop-blur-3xl border border-indigo-500/25 rounded-2xl p-4.5 flex items-center justify-between transition-all duration-300 shadow-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <BookMarked className="text-indigo-400" size={18} />
                  <span className="text-white font-extrabold text-xs">Lectures</span>
                </div>
                <ArrowRight size={12} className="text-slate-400 stroke-[3px]" />
              </div>

              {/* Academic Calendar */}
              <div
                onClick={() => onTileClick('calendar')}
                className="cursor-pointer bg-indigo-500/[0.03] backdrop-blur-3xl border border-indigo-500/25 rounded-2xl p-4.5 flex items-center justify-between transition-all duration-300 shadow-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-indigo-400" size={18} />
                  <span className="text-white font-extrabold text-xs">Calendar</span>
                </div>
                <ArrowRight size={12} className="text-slate-400 stroke-[3px]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
