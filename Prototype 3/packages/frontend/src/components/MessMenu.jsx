import React, { useState, useEffect } from 'react';
import { 
  QrCode, WifiOff, Sunrise, Sun, Moon, 
  Clock, CreditCard, ShieldCheck 
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
      icon: <Sunrise size={22} className="text-orange-500" />,
      iconBg: 'bg-orange-50',
      items: ['Chana Masala', 'Puri', 'Halwa'],
    },
    {
      id: 'lh',
      title: 'Lunch',
      time: '12:00 - 14:00',
      icon: <Sun size={22} className="text-amber-500" />,
      iconBg: 'bg-amber-50',
      items: ['Matar Paneer', 'Veg Khichdi', 'Dahi', 'Papad'],
    },
    {
      id: 'dn',
      title: 'Dinner',
      time: 'From 19:30',
      icon: <Moon size={22} className="text-indigo-600" />,
      iconBg: 'bg-indigo-50',
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
    <div className="mess-menu-dashboard flex flex-col gap-6 text-slate-900 font-sans min-h-screen pb-24">
      
      {/* 💳 Mess Access Pass Panel */}
      <div 
        onClick={() => activePass && setActiveTab && setActiveTab('MESS_QR_FULL')}
        className={`bg-gradient-to-r from-[#2f2b94] to-[#403ba6] text-white rounded-3xl p-6 flex flex-col gap-4 shadow-xl border border-indigo-500/20 relative overflow-hidden group transition-all duration-300 ${activePass ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
      >
        <div className="absolute -right-4 -bottom-4 w-36 h-36 bg-white/5 rounded-full border border-white/5 transition-transform group-hover:scale-110"></div>
        
        <div className="flex justify-between items-start w-full z-10">
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-black tracking-wide leading-none font-sans">Mess Access</h3>
            <span className="text-white/60 text-xs font-semibold flex items-center gap-1.5 mt-2">
              <WifiOff size={14} className="text-white/60" /> Offline Mode Ready
            </span>
          </div>

          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
            <QrCode size={24} className="text-white/95" />
          </div>
        </div>

        {/* Dynamic Pass Validity Pill */}
        <div className="w-full mt-2 z-10">
          {activePass ? (
            <div className="bg-white text-indigo-900 rounded-2xl p-4 shadow-inner flex items-center justify-center gap-2 transform transition-transform duration-300 hover:scale-[1.01]">
              <span className="font-extrabold tracking-wide text-sm font-sans flex items-center gap-2">
                🟢 Pass Active • {remainingMinutes} Mins Left
              </span>
            </div>
          ) : (
            isStudent && (
              <button
                onClick={(e) => { e.stopPropagation(); handleBuyPass(); }}
                className="w-full bg-white text-[#2f2b94] hover:bg-slate-50 font-black rounded-2xl py-3.5 shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-xs uppercase tracking-wider"
              >
                Buy Guest Meal Pass • ₹60
              </button>
            )
          )}
        </div>
      </div>

      {/* Segmented Controls Header */}
      <header className="flex justify-between items-center w-full mt-2">
        <h2 className="text-2xl font-black tracking-tight font-sans">Mess Menu</h2>
        
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/50 shadow-inner select-none">
          <button
            onClick={() => setViewMode('daily')}
            className={`py-1.5 px-5 text-xs font-bold rounded-full transition-all duration-300 ${
              viewMode === 'daily'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`py-1.5 px-5 text-xs font-bold rounded-full transition-all duration-300 ${
              viewMode === 'weekly'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Weekly
          </button>
        </div>
      </header>

      {/* Render selected layout */}
      {viewMode === 'daily' ? (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {dailyMenu.map((meal) => (
            <div
              key={meal.id}
              className="bg-white rounded-3xl border border-slate-100/80 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 ${meal.iconBg} rounded-2xl flex items-center justify-center`}>
                    {meal.icon}
                  </div>
                  <h4 className="text-lg font-black text-slate-900 font-sans tracking-wide">
                    {meal.title}
                  </h4>
                </div>
                
                <span className="bg-slate-50 border border-slate-200/40 text-slate-500 font-bold font-mono text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {meal.time}
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5 mt-1">
                {meal.items.map((item) => (
                  <span
                    key={item}
                    className="bg-indigo-50/50 border border-indigo-100/30 text-indigo-950 font-bold px-4 py-2 rounded-xl text-xs tracking-wide"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="lock-card public-details-card bg-white rounded-3xl border border-slate-100/80 p-5 shadow-sm animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-700 text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-2">Day</th>
                  <th className="py-3 px-2">Breakfast</th>
                  <th className="py-3 px-2">Lunch</th>
                  <th className="py-3 px-2">Dinner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {weeklyMenu.map((m) => (
                  <tr key={m.day} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-2 font-black font-mono text-indigo-600">{m.day.substring(0, 3)}</td>
                    <td className="py-3.5 px-2 text-slate-800">{m.breakfast.split(' & ')[0]}</td>
                    <td className="py-3.5 px-2 text-slate-800">{m.lunch.split(', ')[0]}</td>
                    <td className="py-3.5 px-2 text-slate-800">{m.dinner.split(', ')[0]}</td>
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
