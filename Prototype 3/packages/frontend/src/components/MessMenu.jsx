import React, { useState, useEffect } from 'react';
import { 
  QrCode, WifiOff, Sunrise, Sun, Moon 
} from 'lucide-react';

export default function MessMenu({ currentUser, setActiveTab, triggerPayment }) {
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState(null);

  // Toggle Daily vs Weekly view
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly'

  // Load and keep pass countdown state reactive
  const [activePass, setActivePass] = useState(null);
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';
    
    const checkPass = () => {
      const passStr = localStorage.getItem(`cp_token_${username}`);
      if (passStr) {
        try {
          const pass = JSON.parse(passStr);
          if (pass && pass.ExpiryTime) {
            const remainingMs = new Date(pass.ExpiryTime) - new Date();
            const mins = Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
            if (mins > 0) {
              setActivePass(pass);
              setRemainingMinutes(mins);
            } else {
              localStorage.removeItem(`cp_token_${username}`);
              setActivePass(null);
              setRemainingMinutes(0);
            }
          }
        } catch (e) {
          setActivePass(null);
        }
      } else {
        setActivePass(null);
        setRemainingMinutes(0);
      }
    };

    checkPass();
    const interval = setInterval(checkPass, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleBuyPass = () => {
    if (!currentUser) return;
    if (triggerPayment) {
      triggerPayment(60, 'MESS_GUEST', {});
    }
  };

  const isStudent = currentUser?.role === 'student';

  const dailyMenu = [
    {
      id: 'bf',
      title: 'Breakfast',
      time: '< 9:00 AM',
      icon: <Sunrise size={18} className="text-orange-400" />,
      items: ['Chana Masala', 'Puri', 'Halwa'],
    },
    {
      id: 'lh',
      title: 'Lunch',
      time: '12:00 - 14:00',
      icon: <Sun size={18} className="text-amber-400" />,
      items: ['Matar Paneer', 'Veg Khichdi', 'Dahi', 'Papad'],
    },
    {
      id: 'dn',
      title: 'Dinner',
      time: 'From 19:30',
      icon: <Moon size={18} className="text-indigo-400" />,
      items: ['Methi Aloo', 'Chana Dal', 'Rice', 'Roti', 'Milk'],
    },
  ];

  const weeklyMenu = [
    { day: 'Monday', breakfast: 'Aloo Paratha & Curd', lunch: 'Rajma Chawal, Roti, Salad', dinner: 'Matar Paneer, Dal Fry, Rice' },
    { day: 'Tuesday', breakfast: 'Idli Vada & Sambar', lunch: 'Kadhi Chawal, Aloo Bhindi', dinner: 'Chicken Curry / Egg Bhurji, Rice' },
    { day: 'Wednesday', breakfast: 'Poha & Jalebi', lunch: 'Chole Bhature, Veg Pulav', dinner: 'Kadhai Paneer, Dal Makhani' },
    { day: 'Thursday', breakfast: 'Uttapam & Chutney', lunch: 'Veg Biryani & Mix Raita', dinner: 'Mix Veg, Dal Tadka, Roti' },
    { day: 'Friday', breakfast: 'Bread Butter & Omelette', lunch: 'Dal Baati Churma, Salad', dinner: 'Butter Chicken / Shahi Paneer, Naan' },
    { day: 'Saturday', breakfast: 'Puri Sabzi & Halwa', lunch: 'Chana Masala, Jeera Rice', dinner: 'Veg Manchurian & Fried Rice' },
    { day: 'Sunday', breakfast: 'Masala Dosa & Sambar', lunch: 'Special Sunday Paneer Feast', dinner: 'Aloo Gobi, Yellow Dal, Khichdi' },
  ];

  return (
    <div className="mess-menu-dashboard flex flex-col gap-6 text-white font-sans min-h-screen pb-24 relative select-none">
      
      {/* 💳 Mess Access Pass Panel */}
      <div 
        onClick={() => activePass && setActiveTab && setActiveTab('MESS_QR_FULL')}
        className={`bg-indigo-500/[0.03] backdrop-blur-3xl border-2 border-indigo-500/35 text-white rounded-[32px] p-6 flex flex-col gap-4 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-[0_0_35px_rgba(99,102,241,0.08)] relative overflow-hidden group transition-all duration-300 ${activePass ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
      >
        <div className="absolute -right-4 -bottom-4 w-36 h-36 bg-white/5 rounded-full border border-white/5 transition-transform group-hover:scale-110"></div>
        
        <div className="flex justify-between items-start w-full z-10 text-left">
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-black tracking-wide leading-none font-sans">Mess Access</h3>
            <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5 mt-2">
              <WifiOff size={14} className="text-slate-400" /> Offline Mode Ready
            </span>
          </div>

          <div className="w-12 h-12 bg-white/[0.08] border border-white/10 rounded-2xl flex items-center justify-center shadow-lg">
            <QrCode size={24} className="text-white" />
          </div>
        </div>

        {/* Dynamic Pass Validity Pill */}
        <div className="w-full mt-2 z-10">
          {activePass ? (
            <div className="bg-white/[0.06] border border-white/10 text-white rounded-2xl p-4 flex items-center justify-center gap-2 select-none shadow-md">
              <span className="font-extrabold tracking-wide text-sm font-sans flex items-center gap-2">
                🟢 Pass Active • {remainingMinutes} Mins Left
              </span>
            </div>
          ) : (
            isStudent && (
              <button
                onClick={(e) => { e.stopPropagation(); handleBuyPass(); }}
                className="w-full bg-white text-[#141a27] hover:bg-slate-50 font-black rounded-xl py-3.5 shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] text-xs uppercase tracking-wider cursor-pointer"
              >
                Buy Guest Meal Pass • ₹60
              </button>
            )
          )}
        </div>
      </div>

      {/* Segmented Controls Header */}
      <header className="flex justify-between items-center w-full mt-2 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setActiveTab && setActiveTab('home')}
            className="w-11 h-11 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer shrink-0"
            type="button"
          >
            <span className="text-xl font-bold">&larr;</span>
          </button>
          <div className="header-info text-left">
            <h2 className="text-xl font-black text-white leading-none">Mess Menu</h2>
            <p className="text-slate-400 text-[10px] font-semibold tracking-wide mt-1">Daily & Weekly Catalog</p>
          </div>
        </div>
        
        <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/10 shadow-inner select-none shrink-0">
          <button
            onClick={() => setViewMode('daily')}
            className={`py-1.5 px-4 text-[9px] font-black uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-white text-[#141a27] shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`py-1.5 px-4 text-[9px] font-black uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer ${
              viewMode === 'weekly'
                ? 'bg-white text-[#141a27] shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Weekly
          </button>
        </div>
      </header>

      {/* Render selected layout */}
      {viewMode === 'daily' ? (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {dailyMenu.map((meal) => {
            const colorStyle = 
              meal.id === 'bf' 
                ? 'border-orange-500/25 bg-orange-500/[0.02] shadow-[0_0_25px_rgba(249,115,22,0.04)]'
                : meal.id === 'lh'
                ? 'border-amber-500/25 bg-amber-500/[0.02] shadow-[0_0_25px_rgba(245,158,11,0.04)]'
                : 'border-indigo-500/25 bg-indigo-500/[0.02] shadow-[0_0_25px_rgba(99,102,241,0.04)]';

            return (
              <div
                key={meal.id}
                className={`rounded-[28px] p-6 transition-all duration-300 relative border-2 ${colorStyle} backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-4 text-left hover:scale-[1.01]`}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/[0.06] border border-white/10 rounded-2xl flex items-center justify-center">
                      {meal.icon}
                    </div>
                    <h4 className="text-base font-extrabold text-white font-sans tracking-wide leading-none">
                      {meal.title}
                    </h4>
                  </div>
                  
                  <span className="bg-white/[0.05] border border-white/10 text-slate-300 font-bold font-mono text-[9px] px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {meal.time}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                  {meal.items.map((item) => (
                    <span
                      key={item}
                      className="bg-white/[0.04] border border-white/10 text-slate-200 font-bold px-3.5 py-1.5 rounded-xl text-[10px] tracking-wide"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-300 text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-2">Day</th>
                  <th className="py-3 px-2">Breakfast</th>
                  <th className="py-3 px-2">Lunch</th>
                  <th className="py-3 px-2">Dinner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-xs text-slate-200">
                {weeklyMenu.map((m) => (
                  <tr key={m.day} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-2 font-black font-mono text-[#a3b3e6]">{m.day.substring(0, 3)}</td>
                    <td className="py-4 px-2 text-white">{m.breakfast.split(' & ')[0]}</td>
                    <td className="py-4 px-2 text-white">{m.lunch.split(', ')[0]}</td>
                    <td className="py-4 px-2 text-white">{m.dinner.split(', ')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
