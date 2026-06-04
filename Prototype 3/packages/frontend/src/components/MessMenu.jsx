import React, { useState, useEffect } from 'react';
import { 
  Utensils, Sunrise, Sun, Moon, Calendar, 
  CalendarDays, QrCode, WifiOff, RefreshCw, Edit3
} from 'lucide-react';
import M3ScreenHeader from './M3ScreenHeader';
import { API_BASE } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessMenu({ currentUser, setActiveTab, triggerPayment }) {
  const [isScrolled, setIsScrolled] = useState(false);
  
  const getTodayName = () => {
    const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
    const mapping = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return mapping[dayIndex];
  };

  const [selectedDay, setSelectedDay] = useState(getTodayName());
  const [dailyMenu, setDailyMenu] = useState([]);
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMealId, setEditingMealId] = useState(''); // 'bf' | 'lh' | 'dn'
  const [editingDayName, setEditingDayName] = useState(''); // 'Monday', 'Tuesday', etc.
  const [editingDishes, setEditingDishes] = useState('');
  const [editingTime, setEditingTime] = useState('');
  
  const [saving, setSaving] = useState(false);

  const isDailyEditable = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isWeeklyEditable = currentUser?.role === 'super_admin';
  const isStudent = currentUser?.role === 'student';

  const [activePass, setActivePass] = useState(null);
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  const checkGuestPass = () => {
    const username = currentUser?.email ? currentUser.email.split('@')[0] : 'guest';
    const tokenStr = localStorage.getItem(`cp_token_${username}`);
    if (tokenStr) {
      try {
        const token = JSON.parse(tokenStr);
        if (token && token.ExpiryTime) {
          const expiryDate = new Date(token.ExpiryTime);
          const diffMs = expiryDate.getTime() - Date.now();
          if (diffMs > 0) {
            setActivePass(token);
            setRemainingMinutes(Math.ceil(diffMs / 60000));
          } else {
            setActivePass(null);
            localStorage.removeItem(`cp_token_${username}`);
          }
        }
      } catch (e) {
        setActivePass(null);
      }
    } else {
      setActivePass(null);
    }
  };

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [dailyRes, weeklyRes] = await Promise.all([
        fetch(`${API_BASE}/api/mess/daily`),
        fetch(`${API_BASE}/api/mess/weekly`)
      ]);
      
      if (!dailyRes.ok || !weeklyRes.ok) {
        throw new Error('Failed to load mess menus');
      }

      const dailyData = await dailyRes.json();
      const weeklyData = await weeklyRes.json();

      setDailyMenu(dailyData);
      setWeeklyMenu(weeklyData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
    checkGuestPass();
    const interval = setInterval(checkGuestPass, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleScroll = (e) => {
    const currentScrollTop = e.target.scrollTop;
    setIsScrolled(currentScrollTop > 10);
  };

  const handleBuyPass = () => {
    if (triggerPayment) {
      triggerPayment(60, 'MESS_GUEST', {});
    }
  };

  const getMealIcon = (mealId) => {
    switch (mealId) {
      case 'bf': return <Sunrise size={18} className="text-m3-primary" />;
      case 'lh': return <Sun size={18} className="text-m3-primary" />;
      case 'dn': return <Moon size={18} className="text-m3-primary" />;
      default: return <Utensils size={18} className="text-m3-primary" />;
    }
  };

  const handleStartEditCard = (mealId, dayName, currentText, currentTime) => {
    setEditingMealId(mealId);
    setEditingDayName(dayName);
    setEditingDishes(currentText);
    setEditingTime(currentTime);
    setShowEditModal(true);
  };

  const handleSaveMenuEdit = async (e) => {
    e.preventDefault();
    if (!editingMealId || !editingDayName) return;

    try {
      setSaving(true);

      // 1. Update the dishes for the selected day in weeklyMenu collection
      const weeklyUrl = `${API_BASE}/api/mess/weekly/${editingDayName}`;
      const currentDayDoc = weeklyMenu.find(m => m.day.toLowerCase() === editingDayName.toLowerCase());
      
      const payload = {
        breakfast: currentDayDoc?.breakfast || '',
        lunch: currentDayDoc?.lunch || '',
        dinner: currentDayDoc?.dinner || ''
      };

      if (editingMealId === 'bf') payload.breakfast = editingDishes;
      if (editingMealId === 'lh') payload.lunch = editingDishes;
      if (editingMealId === 'dn') payload.dinner = editingDishes;

      const resWeekly = await fetch(weeklyUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!resWeekly.ok) {
        const errorData = await resWeekly.json();
        throw new Error(errorData.message || 'Failed to update weekly dishes');
      }

      // 2. Update the global meal time in dailyMenu collection
      const dailyUrl = `${API_BASE}/api/mess/daily/${editingMealId}`;
      const resDaily = await fetch(dailyUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time: editingTime }),
        credentials: 'include'
      });

      if (!resDaily.ok) {
        const errorData = await resDaily.json();
        throw new Error(errorData.message || 'Failed to update meal time');
      }

      setShowEditModal(false);
      fetchMenuData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => setActiveTab && setActiveTab('home');

  return (
    <div className="m3-screen mess-menu-dashboard">
      <M3ScreenHeader
        title="Mess Menu"
        subtitle="Daily & weekly meals"
        isScrolled={isScrolled}
        onBack={goBack}
      />

      <div onScroll={handleScroll} className="m3-screen__scroll pb-24">
        {/* Loading State */}
        {loading && dailyMenu.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center select-none">
            <RefreshCw className="animate-spin text-m3-primary" size={24} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading mess menus...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="m3-surface-card p-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold text-m3-onSurface">⚠️ {error}</p>
            <button className="m3-filled-button" style={{ maxWidth: 160 }} onClick={fetchMenuData}>Retry</button>
          </div>
        )}

        {/* Day selection horizontal bar list */}
        {!loading && !error && (
          <div className="flex flex-wrap gap-2 py-1.5 px-1 shrink-0 w-full select-none">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 text-xs font-extrabold rounded-full transition-all duration-300 cursor-pointer shrink-0 border border-transparent ${
                  selectedDay === day
                    ? 'bg-m3-primary text-m3-onPrimary'
                    : 'bg-m3-surfaceContainer text-m3-onSurfaceVariant hover:bg-m3-surfaceContainerHighest border-[#483c5e]/30'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        )}

        {/* Active Guest Pass Block */}
        {!loading && !error && (isStudent || !currentUser) &&
          (activePass ? (
            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('MESS_QR_FULL')}
              className="m3-surface-card m3-surface-card--interactive shrink-0 flex items-center justify-between gap-3 w-full"
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
            isStudent && (
              <button type="button" onClick={handleBuyPass} className="m3-filled-button shrink-0 w-full">
                Buy Guest Meal Pass • ₹60
              </button>
            )
          ))}

        {/* Day's Menu Display */}
        {!loading && !error && (
          <div className="flex flex-col gap-4 w-full">
            {(() => {
              const activeDayMenu = weeklyMenu.find(
                (m) => m.day.toLowerCase() === selectedDay.toLowerCase()
              );
              
              const mealsList = [
                {
                  mealId: 'bf',
                  title: 'Breakfast',
                  time: dailyMenu.find(d => d.mealId === 'bf')?.time || '< 9:00 AM',
                  items: activeDayMenu?.breakfast || ''
                },
                {
                  mealId: 'lh',
                  title: 'Lunch',
                  time: dailyMenu.find(d => d.mealId === 'lh')?.time || '12:00 - 14:00',
                  items: activeDayMenu?.lunch || ''
                },
                {
                  mealId: 'dn',
                  title: 'Dinner',
                  time: dailyMenu.find(d => d.mealId === 'dn')?.time || 'From 19:30',
                  items: activeDayMenu?.dinner || ''
                }
              ];

              const parseItems = (str) => {
                if (!str) return [];
                return str
                  .split(/[&,]/)
                  .map(item => item.trim())
                  .filter(item => item.length > 0);
              };

              return mealsList.map((meal) => (
                <article key={meal.mealId} className="m3-surface-card flex flex-col gap-4 text-left relative overflow-hidden">
                  <div className="flex justify-between items-center w-full gap-2">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="m3-icon-badge shrink-0">{getMealIcon(meal.mealId)}</div>
                      <h4 className="m3-title-medium truncate">{meal.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="m3-badge font-bold shrink-0">{meal.time}</span>
                      {isWeeklyEditable && (
                        <button
                          onClick={() => handleStartEditCard(meal.mealId, selectedDay, meal.items, meal.time)}
                          className="w-7 h-7 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center transition cursor-pointer"
                          title="Edit Meal"
                          type="button"
                        >
                          <Edit3 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parseItems(meal.items).length > 0 ? (
                      parseItems(meal.items).map((item) => (
                        <span key={item} className="m3-assist-chip">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-m3-onSurfaceVariant/60 italic pl-1">No menu declared</span>
                    )}
                  </div>
                </article>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Slide-up Mess Edit Bottom Sheet Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[99999] flex items-end justify-center" onClick={() => setShowEditModal(false)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-m3-surfaceContainer p-6 rounded-t-[28px] flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderBottomColor: 'color-mix(in srgb, var(--m3-outline-variant) 55%, transparent)' }}>
                <h3 className="m3-title-medium font-bold text-m3-onSurface">
                  Edit {editingMealId === 'bf' ? 'Breakfast' : editingMealId === 'lh' ? 'Lunch' : 'Dinner'} - {editingDayName}
                </h3>
                <button
                  className="w-8 h-8 rounded-full hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant flex items-center justify-center transition cursor-pointer font-bold"
                  onClick={() => setShowEditModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveMenuEdit} className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Meal Timings</span>
                  <input
                    type="text"
                    placeholder="e.g. 12:00 - 14:00"
                    value={editingTime}
                    onChange={(e) => setEditingTime(e.target.value)}
                    required
                    className="m3-filled-field !h-11"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-m3-onSurfaceVariant uppercase tracking-widest pl-1">Menu Dishes (Comma or & separated)</span>
                  <textarea
                    placeholder="e.g. Aloo Paratha, Curd"
                    value={editingDishes}
                    onChange={(e) => setEditingDishes(e.target.value)}
                    required
                    rows={3}
                    className="m3-filled-field !h-auto !py-2.5 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2 select-none">
                  <button
                    type="button"
                    className="flex-1 h-[48px] rounded-full border-none bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="m3-filled-button flex-1"
                    style={{ minHeight: 48 }}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
