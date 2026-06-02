import React, { useState, useEffect } from 'react';
import { QrCode, WifiOff, Sunrise, Sun, Moon } from 'lucide-react';
import M3ScreenHeader from './M3ScreenHeader';

export default function MessMenu({ currentUser, setActiveTab, triggerPayment }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewMode, setViewMode] = useState('daily');
  const [activePass, setActivePass] = useState(null);
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 10);
  };

  useEffect(() => {
    const checkPass = () => {
      const username = currentUser ? (currentUser.email ? currentUser.email.split('@')[0] : 'user') : 'guest';
      const key = currentUser ? `cp_token_${username}` : 'cp_token_guest';
      const passStr = localStorage.getItem(key);
      if (passStr) {
        try {
          const pass = JSON.parse(passStr);
          if (pass?.ExpiryTime) {
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
        } catch {
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
      icon: <Sunrise size={18} className="text-m3-primary" />,
      items: ['Chana Masala', 'Puri', 'Halwa'],
    },
    {
      id: 'lh',
      title: 'Lunch',
      time: '12:00 - 14:00',
      icon: <Sun size={18} className="text-m3-primary" />,
      items: ['Matar Paneer', 'Veg Khichdi', 'Dahi', 'Papad'],
    },
    {
      id: 'dn',
      title: 'Dinner',
      time: 'From 19:30',
      icon: <Moon size={18} className="text-m3-primary" />,
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

  const goBack = () => setActiveTab && setActiveTab('home');

  return (
    <div className="m3-screen mess-menu-dashboard">
      <M3ScreenHeader
        title="Mess Menu"
        subtitle="Daily & weekly meals"
        isScrolled={isScrolled}
        onBack={goBack}
      />

      <div onScroll={handleScroll} className="m3-screen__scroll">
        {(isStudent || !currentUser) &&
          (activePass ? (
            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('MESS_QR_FULL')}
              className="m3-surface-card m3-surface-card--interactive shrink-0 flex items-center justify-between gap-3"
            >
              <div className="flex flex-col gap-1 min-w-0 text-left">
                <span className="m3-title-small">Mess Access</span>
                <span className="m3-body-small text-m3-onPrimaryContainer font-semibold" style={{ color: 'var(--m3-on-primary-container)' }}>
                  Pass active • {remainingMinutes} min left
                </span>
                <span className="m3-body-small flex items-center gap-1.5">
                  <WifiOff size={12} /> Tap for QR
                </span>
              </div>
              <div className="m3-icon-badge">
                <QrCode size={22} />
              </div>
            </button>
          ) : (
            <button type="button" onClick={handleBuyPass} className="m3-filled-button shrink-0">
              Buy Guest Meal Pass • ₹60
            </button>
          ))}

        {viewMode === 'daily' ? (
          <div className="flex flex-col gap-4 shrink-0">
            {dailyMenu.map((meal) => (
              <article key={meal.id} className="m3-surface-card flex flex-col gap-4 text-left shrink-0">
                <div className="flex justify-between items-center w-full gap-2">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="m3-icon-badge">{meal.icon}</div>
                    <h4 className="m3-title-medium">{meal.title}</h4>
                  </div>
                  <span className="m3-badge">{meal.time}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {meal.items.map((item) => (
                    <span key={item} className="m3-assist-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="m3-surface-card shrink-0 overflow-hidden p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse m3-body-small">
                <thead>
                  <tr
                    className="font-bold text-xs uppercase tracking-wider m3-text-variant"
                    style={{ borderBottom: '1px solid var(--m3-outline-variant)' }}
                  >
                    <th className="py-3 px-2">Day</th>
                    <th className="py-3 px-2">Breakfast</th>
                    <th className="py-3 px-2">Lunch</th>
                    <th className="py-3 px-2">Dinner</th>
                  </tr>
                </thead>
                <tbody className="font-medium text-xs">
                  {weeklyMenu.map((m) => (
                    <tr key={m.day} className="hover:bg-white/[0.03] transition-colors" style={{ borderTop: '1px solid color-mix(in srgb, var(--m3-outline-variant) 35%, transparent)' }}>
                      <td className="py-4 px-2 font-bold" style={{ color: 'var(--m3-primary)' }}>{m.day.substring(0, 3)}</td>
                      <td className="py-4 px-2">{m.breakfast.split(' & ')[0]}</td>
                      <td className="py-4 px-2">{m.lunch.split(', ')[0]}</td>
                      <td className="py-4 px-2">{m.dinner.split(', ')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="m3-segmented-fab">
        <div className="m3-segmented" role="tablist" aria-label="Menu view">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'daily'}
            onClick={() => setViewMode('daily')}
            className={`m3-segmented__option ${viewMode === 'daily' ? 'm3-segmented__option--selected' : ''}`}
          >
            Daily
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'weekly'}
            onClick={() => setViewMode('weekly')}
            className={`m3-segmented__option ${viewMode === 'weekly' ? 'm3-segmented__option--selected' : ''}`}
          >
            Weekly
          </button>
        </div>
      </div>
    </div>
  );
}
