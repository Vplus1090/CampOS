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
    <div className="metro-start-container flex flex-col p-6 text-slate-900 font-sans min-h-screen justify-between pb-24">
      <div className="w-full flex flex-col gap-6">
        
        {/* Header greeting & Logout */}
        <header className="flex justify-between items-center w-full mt-4">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-slate-900 leading-tight">Hello,</span>
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight leading-tight">
              {currentUser ? currentUser.firstName : 'Student'}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="w-12 h-12 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 rounded-full flex items-center justify-center border border-slate-200/50 shadow-sm transition-all duration-300"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* 🌟 Active Live Activity Widgets */}
        {(activePass || activeOrder) && (
          <div className="metro-activity-widgets flex flex-col gap-3">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">Live Activity</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Mess Pass Widget */}
              {activePass && (
                <div
                  onClick={() => onTileClick('MESS_QR_FULL')}
                  className="cursor-pointer bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20 text-white p-5 flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 h-[120px] border border-indigo-500/20 relative overflow-hidden"
                >
                  <div className="flex flex-col justify-center h-full">
                    <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest font-mono">Mess Token</span>
                    <h4 className="text-xl font-black tracking-wide mt-1">Pass Active</h4>
                    <p className="text-indigo-200/80 text-[11px] font-medium mt-1">Tap to display pass QR</p>
                  </div>
                  
                  <div className="rounded-xl bg-white p-2.5 flex items-center justify-center shadow-lg border border-white/20">
                    <QrCode size={26} className="text-indigo-600" />
                  </div>
                </div>
              )}

              {/* Canteen Order Widget */}
              {activeOrder && (
                <div
                  onClick={() => onTileClick('SUCCESS')}
                  className="cursor-pointer bg-black rounded-3xl shadow-xl shadow-black/20 text-white p-5 flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 h-[120px] border border-slate-900 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest font-mono">Canteen Ticket</span>
                      <span className="text-3xl font-black text-white font-mono tracking-widest mt-1">
                        {activeOrder.PickupPIN}
                      </span>
                    </div>
                    <Ticket size={26} className="text-slate-600" />
                  </div>
                  
                  <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs font-sans mt-auto">
                    <span className="text-slate-400 font-bold">{activeOrder.ItemCount || 0} Items</span>
                    <span className="text-emerald-400 font-extrabold tracking-wide">
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
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">Services</span>
          
          {/* Card 1: Notices (Blue Gradient) */}
          {(isStudent || isSuperAdmin) && (
            <div
              onClick={() => onTileClick('notices')}
              className="cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[28px] p-6 text-white h-[130px] shadow-lg shadow-blue-500/20 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 active:scale-[0.99]"
            >
              {/* Subtle background decorative circle overlay */}
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full border border-white/5 transition-transform group-hover:scale-110"></div>
              
              <div className="flex justify-between items-start w-full z-10">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black tracking-wide leading-none">Notices</h3>
                  <p className="text-white/80 text-sm mt-2 font-medium">Updates & News</p>
                </div>
                <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                  <Megaphone size={20} className="text-white" />
                </div>
              </div>

              <div className="text-white/60 text-xs font-mono font-bold tracking-wider z-10">
                📢 {stats.notices} announcements active
              </div>
            </div>
          )}

          {/* Card 2: Canteen (Orange Gradient) */}
          {(isStudent || isCanteenAdmin) && (
            <div
              onClick={() => onTileClick('canteen')}
              className="cursor-pointer bg-gradient-to-br from-orange-400 to-amber-500 rounded-[28px] p-6 text-white h-[180px] shadow-lg shadow-orange-500/20 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 active:scale-[0.99]"
            >
              {/* Subtle background decorative circle overlay */}
              <div className="absolute -right-4 -bottom-4 w-36 h-36 bg-white/5 rounded-full border border-white/5 transition-transform group-hover:scale-110"></div>

              <div className="flex justify-between items-start w-full z-10">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black tracking-wide leading-none">Canteen</h3>
                  <p className="text-white/80 text-sm mt-2 font-medium">Fresh campus specialties</p>
                </div>
                <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                  <Coffee size={20} className="text-white" />
                </div>
              </div>

              {/* Order Now button at bottom */}
              <div className="flex justify-between items-center w-full z-10 mt-4">
                <span className="text-white/90 text-xs font-mono font-bold tracking-wider">
                  {isCanteenAdmin ? `🛠️ CRUD Manager (${stats.canteen} items)` : `🍔 ${stats.canteen} items available`}
                </span>
                {!isCanteenAdmin && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onTileClick('canteen'); }}
                    className="bg-white text-orange-500 hover:bg-slate-50 font-black rounded-xl px-5 py-2.5 text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    Order Now <ArrowRight size={12} className="stroke-[3px]" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Row of side-by-side cards: Mess & Skill Swap */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Card 3: Mess Hall (Green/Teal Gradient) */}
            {(isStudent || isSuperAdmin) && (
              <div
                onClick={() => onTileClick('mess')}
                className="cursor-pointer bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[28px] p-5 text-white h-[130px] shadow-lg shadow-emerald-500/20 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 active:scale-[0.99]"
              >
                <div className="flex justify-between items-start w-full z-10">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black tracking-wide leading-none">Mess Hall</h3>
                    <p className="text-white/85 text-[11px] mt-1 font-semibold leading-tight">Menu & Tokens</p>
                  </div>
                  <div className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                    <Utensils size={15} className="text-white" />
                  </div>
                </div>

                <div className="text-white/60 text-[9px] font-mono font-black uppercase tracking-widest z-10">
                  🍱 Daily Meal Active
                </div>
              </div>
            )}

            {/* Card 4: Skill Swap (Purple Gradient) */}
            {(isStudent || isSuperAdmin) && (
              <div
                onClick={() => onTileClick('skillgigs')}
                className="cursor-pointer bg-gradient-to-br from-violet-500 to-purple-600 rounded-[28px] p-5 text-white h-[130px] shadow-lg shadow-purple-500/20 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 active:scale-[0.99]"
              >
                <div className="flex justify-between items-start w-full z-10">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black tracking-wide leading-none">Skill Swap</h3>
                    <p className="text-white/85 text-[11px] mt-1 font-semibold leading-tight">Learn & Teach</p>
                  </div>
                  <div className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                    <BookOpen size={15} className="text-white" />
                  </div>
                </div>

                <div className="text-white/60 text-[9px] font-mono font-black uppercase tracking-widest z-10">
                  🤝 {stats.skillgigs} skill swops
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Services List */}
        {isStudent && (
          <div className="flex flex-col gap-3 mt-2">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">Academic Library</span>
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Study Materials */}
              <div
                onClick={() => onTileClick('materials')}
                className="cursor-pointer bg-slate-50 hover:bg-slate-100/80 active:scale-95 border border-slate-200/50 rounded-2xl p-4.5 flex items-center justify-between transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <BookMarked className="text-indigo-600" size={18} />
                  <span className="text-slate-700 font-extrabold text-xs">Lectures</span>
                </div>
                <ArrowRight size={12} className="text-slate-400 stroke-[3px]" />
              </div>

              {/* Academic Calendar */}
              <div
                onClick={() => onTileClick('calendar')}
                className="cursor-pointer bg-slate-50 hover:bg-slate-100/80 active:scale-95 border border-slate-200/50 rounded-2xl p-4.5 flex items-center justify-between transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-indigo-600" size={18} />
                  <span className="text-slate-700 font-extrabold text-xs">Calendar</span>
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
