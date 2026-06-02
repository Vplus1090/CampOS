import React, { useState, useEffect } from 'react';
import { 
  QrCode, WifiOff, Sunrise, Sun, Moon 
} from 'lucide-react';

export default function MessMenu({ currentUser, setActiveTab, triggerPayment }) {
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e) => {
    const currentScrollTop = e.target.scrollTop;
    setIsScrolled(currentScrollTop > 10);
  };

  // Toggle Daily vs Weekly view
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly'

  // Load and keep pass countdown state reactive
  const [activePass, setActivePass] = useState(null);
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  useEffect(() => {
    const checkPass = () => {
      const username = currentUser ? (currentUser.email ? currentUser.email.split('@')[0] : 'user') : 'guest';
      const key = currentUser ? `cp_token_${username}` : 'cp_token_guest';
      const passStr = localStorage.getItem(key);
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
              localStorage.removeItem(key);
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
      icon: <Sunrise size={18} className="text-white/70" />,
      items: ['Chana Masala', 'Puri', 'Halwa'],
    },
    {
      id: 'lh',
      title: 'Lunch',
      time: '12:00 - 14:00',
      icon: <Sun size={18} className="text-white/70" />,
      items: ['Matar Paneer', 'Veg Khichdi', 'Dahi', 'Papad'],
    },
    {
      id: 'dn',
      title: 'Dinner',
      time: 'From 19:30',
      icon: <Moon size={18} className="text-white/70" />,
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
    <div className="relative flex flex-col h-full max-h-full overflow-hidden font-sans text-[#e6e1e5] select-none mess-menu-dashboard bg-[#181125]">
      
      {/* M3 Large Top App Bar */}
      <header className={`absolute top-0 left-0 right-0 z-20 flex flex-col px-6 transition-all duration-300 ease-in-out overflow-hidden ${
        isScrolled 
          ? 'h-[96px] pt-[26px] bg-[#292035] shadow-md justify-start' 
          : 'h-[180px] bg-transparent justify-start pt-[26px]'
      }`}>
        {/* Top Row: Navigation (No Action Icons) */}
        <div className="flex items-center justify-start w-full h-11 shrink-0">
          <button
            onClick={() => setActiveTab && setActiveTab('home')}
            className="w-11 h-11 bg-[#292035] hover:bg-[#352a48] border border-white/10 text-[#d0bcff] rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-sm cursor-pointer shrink-0"
            type="button"
          >
            <span className="text-xl font-bold">&larr;</span>
          </button>
          
          {/* Small Header Title (Scrolled state) */}
          <span className={`text-[20px] pl-3.5 font-medium text-[#e6e1e5] leading-none tracking-tight font-sans transition-all duration-300 ${
            isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
          }`}>
            Mess Menu
          </span>
        </div>

        {/* Bottom Area: Large Headline & Subtitle (At-rest state) */}
        <div className={`mt-3 pl-3.5 text-left transition-all duration-200 ${
          isScrolled ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}>
          <h1 className="text-[28px] font-normal leading-tight text-[#e6e1e5] tracking-tight font-sans">
            Mess Menu
          </h1>
          <p className="text-[12px] text-[#cac4d0] mt-1 font-medium tracking-wide font-sans">
            Daily & Weekly Meals
          </p>
        </div>
      </header>

      {/* Scrollable Content Wrapper */}
      <div
        onScroll={handleScroll}
        className="flex-1 pb-24 px-5 flex flex-col gap-5 overflow-y-auto scrollbar-none pt-[188px]"
      >
        {/* Guest pass / buy — flat like lockscreen (no nested outline card) */}
        {(isStudent || !currentUser) && (
          activePass ? (
            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('MESS_QR_FULL')}
              className="w-full shrink-0 rounded-[28px] bg-[#292035]/55 px-4 py-4 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-bold text-[#e6e1e5]">Mess Access</span>
                <span className="text-xs font-semibold text-[#eaddff] flex items-center gap-2">
                  Pass active • {remainingMinutes} min left
                </span>
                <span className="text-[11px] text-[#cac4d0] font-medium flex items-center gap-1.5 mt-0.5">
                  <WifiOff size={12} /> Tap for QR
                </span>
              </div>
              <div className="w-11 h-11 bg-[#4f378b]/45 rounded-2xl flex items-center justify-center text-[#d0bcff] shrink-0">
                <QrCode size={22} />
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBuyPass}
              className="w-full shrink-0 h-[52px] bg-[#d1c4e9] text-[#0f0f12] hover:bg-[#ddd0f0] font-bold rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.22)] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] text-[clamp(15px,2.5vh,18px)] cursor-pointer"
            >
              Buy Guest Meal Pass • ₹60
            </button>
          )
        )}

        {/* Render selected layout */}
        {viewMode === 'daily' ? (
          <div className="flex flex-col gap-4 shrink-0">
            {dailyMenu.map((meal) => {
              return (
                <div
                  key={meal.id}
                  className="rounded-[28px] p-4 transition-colors bg-[#292035]/35 hover:bg-[#292035]/50 flex flex-col gap-4 text-left shrink-0"
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 bg-[#4f378b]/40 rounded-2xl flex items-center justify-center text-[#d0bcff] shrink-0">
                        {meal.icon}
                      </div>
                      <h4 className="text-[18px] font-semibold text-[#e6e1e5] font-sans tracking-wide leading-none">
                        {meal.title}
                      </h4>
                    </div>
                    
                    {/* M3 Highlighted Pill style */}
                    <span className="bg-[#4f378b]/35 border border-[#d0bcff]/20 text-[#d0bcff] font-semibold font-sans text-[12px] px-3.5 py-1 rounded-full tracking-wide shadow-sm shrink-0">
                      {meal.time}
                    </span>
                  </div>

                  {/* M3 Suggestion Chips style */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {meal.items.map((item) => (
                      <span
                        key={item}
                        className="bg-[#211a30]/80 text-[#e6e1e5] font-medium px-3.5 py-1.5 rounded-full text-[12px] tracking-wide cursor-default select-none flex items-center justify-center"
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
          /* M3 Outlined Container Card */
          <div className="rounded-[28px] bg-[#292035]/35 p-4 shrink-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[#cac4d0] text-sm">
                <thead>
                  <tr className="border-b border-[#483c5e] text-[#cac4d0] font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-2">Day</th>
                    <th className="py-3 px-2">Breakfast</th>
                    <th className="py-3 px-2">Lunch</th>
                    <th className="py-3 px-2">Dinner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#483c5e]/30 font-medium text-xs text-[#e6e1e5]">
                  {weeklyMenu.map((m) => (
                    <tr key={m.day} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-2 font-bold text-[#d0bcff]">{m.day.substring(0, 3)}</td>
                      <td className="py-4 px-2 text-[#e6e1e5]">{m.breakfast.split(' & ')[0]}</td>
                      <td className="py-4 px-2 text-[#e6e1e5]">{m.lunch.split(', ')[0]}</td>
                      <td className="py-4 px-2 text-[#e6e1e5]">{m.dinner.split(', ')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Floating Segmented Switcher */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 select-none">
        <div className="flex bg-[#211a30]/90 backdrop-blur-md p-1 rounded-full border border-[#483c5e] shadow-lg">
          <button
            onClick={() => setViewMode('daily')}
            className={`py-2.5 px-6 text-xs font-bold rounded-full transition-all duration-300 cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-[#4f378b] text-[#eaddff] shadow-sm'
                : 'text-[#cac4d0] hover:text-[#eaddff] bg-transparent'
            }`}
            type="button"
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`py-2.5 px-6 text-xs font-bold rounded-full transition-all duration-300 cursor-pointer ${
              viewMode === 'weekly'
                ? 'bg-[#4f378b] text-[#eaddff] shadow-sm'
                : 'text-[#cac4d0] hover:text-[#eaddff] bg-transparent'
            }`}
            type="button"
          >
            Weekly
          </button>
        </div>
      </div>

    </div>
  );
}
