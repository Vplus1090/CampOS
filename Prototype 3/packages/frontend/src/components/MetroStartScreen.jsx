import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Coffee, Utensils, BookOpen, LogOut, 
  QrCode, Ticket, Clock, ArrowRight, Calendar 
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

  return (
    <div className="metro-start-container flex flex-col p-6 text-white font-sans min-h-screen justify-between pb-10 bg-transparent relative z-10 select-none">
      <div className="w-full flex flex-col gap-6">
        
        {/* Header greeting & Controls */}
        <header className="flex justify-between items-center w-full mt-4">
          <div className="flex flex-col items-start text-left select-none animate-fadeIn" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            <span className="text-[30px] font-light text-white/95 leading-tight tracking-tight">
              Hello,
            </span>
            <span className="italic font-normal text-[42px] text-white leading-none mt-1 tracking-tight">
              Vardaan
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
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest font-sans text-left pl-1">Live Activity</span>
            <div className="flex flex-col gap-4">
              
              {/* Mess Pass Widget */}
              {activePass && (
                <div
                  onClick={() => onTileClick('MESS_QR_FULL')}
                  className="cursor-pointer bg-indigo-500/[0.03] backdrop-blur-3xl rounded-[28px] shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] text-white p-6 flex items-center justify-between active:scale-[0.98] transition-all duration-300 h-[145px] border border-indigo-500/35 relative overflow-hidden"
                >
                  <div className="flex flex-col justify-center h-full text-left">
                    <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest font-sans">Mess Token</span>
                    <h4 className="text-xl font-black tracking-wide mt-2 text-white">Pass Active</h4>
                    <p className="text-indigo-300/80 text-[11px] font-semibold mt-1">Tap to display pass QR</p>
                  </div>
                  
                  <div className="rounded-xl bg-white/[0.08] border border-white/10 p-3 flex items-center justify-center shadow-lg">
                    <QrCode size={28} className="text-indigo-400" />
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
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest font-sans text-left pl-1">Services</span>
          

          {/* Card 2: Canteen (Glassy Orange) */}
          {(isStudent || isCanteenAdmin) && (
            <div
              onClick={() => onTileClick('canteen')}
              className="cursor-pointer bg-orange-500/[0.03] backdrop-blur-3xl rounded-[28px] p-6 text-white h-[185px] border-2 border-orange-500/35 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-[0_0_30px_rgba(249,115,22,0.08)] flex flex-col justify-between relative overflow-hidden group transition-all duration-300 active:scale-[0.99]"
            >

              <div className="flex justify-between items-start w-full z-10 text-left">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black tracking-wide leading-none">Canteen</h3>
                  <p className="text-orange-200/80 text-sm mt-2 font-semibold">Fresh campus specialties</p>
                </div>
                <Coffee size={24} className="text-orange-400 mt-1" />
              </div>

              {/* Order Now button at bottom */}
              <div className="flex justify-end items-center w-full z-10 mt-4">
                {!isCanteenAdmin && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onTileClick('canteen'); }}
                    className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/35 text-orange-400 font-black rounded-lg px-2.5 py-1 text-[9px] uppercase tracking-wider transition-all duration-300 active:scale-95 flex items-center gap-1 cursor-pointer z-20 backdrop-blur-md shadow-inner whitespace-nowrap"
                  >
                    Order Now <ArrowRight size={11} className="stroke-[3px] text-orange-400 shrink-0" />
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
                className="cursor-pointer bg-emerald-500/[0.03] backdrop-blur-3xl rounded-[28px] p-5 text-white h-[135px] border-2 border-emerald-500/35 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-[0_0_30px_rgba(16,185,129,0.08)] flex flex-col justify-center relative overflow-hidden group transition-all duration-300 active:scale-[0.99]"
              >
                <div className="flex justify-between items-center w-full z-10 text-left">
                  <h3 className="text-lg font-black tracking-wide leading-none">Mess Hall</h3>
                  <Utensils size={20} className="text-emerald-400" />
                </div>
              </div>
            )}

            {/* Card 4: Skill Swap (Glassy Violet) */}
            {(isStudent || isSuperAdmin) && (
              <div
                onClick={() => onTileClick('skillgigs')}
                className="cursor-pointer bg-violet-500/[0.03] backdrop-blur-3xl rounded-[28px] p-5 text-white h-[135px] border-2 border-violet-500/35 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-[0_0_30px_rgba(139,92,246,0.08)] flex flex-col justify-center relative overflow-hidden group transition-all duration-300 active:scale-[0.99]"
              >
                <div className="flex justify-between items-center w-full z-10 text-left">
                  <h3 className="text-lg font-black tracking-wide leading-none">Skill Swap</h3>
                  <BookOpen size={20} className="text-violet-400" />
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
                className="cursor-pointer bg-indigo-500/[0.03] backdrop-blur-3xl border border-indigo-500/25 rounded-[24px] p-6 h-[85px] flex items-center justify-between transition-all duration-300 shadow-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-[0.97] group"
              >
                <div className="flex items-center gap-3.5">
                  <BookOpen className="text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" size={22} />
                  <span className="text-white font-extrabold text-sm tracking-wide">Shelf</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-white transition-colors duration-300 stroke-[3px]" />
              </div>

              {/* Academic Calendar */}
              <div
                onClick={() => onTileClick('calendar')}
                className="cursor-pointer bg-indigo-500/[0.03] backdrop-blur-3xl border border-indigo-500/25 rounded-[24px] p-6 h-[85px] flex items-center justify-between transition-all duration-300 shadow-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-[0.97] group"
              >
                <div className="flex items-center gap-3.5">
                  <Calendar className="text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" size={22} />
                  <span className="text-white font-extrabold text-sm tracking-wide">Calendar</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-white transition-colors duration-300 stroke-[3px]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
