import React, { useState, useEffect } from 'react';
import { Clock, QrCode, Check, X, Smartphone, SmartphoneNfc, CreditCard, ArrowLeft, Ticket, Home, Coffee, Utensils, BookOpen } from 'lucide-react';
import NoticesFeed from './components/NoticesFeed';
import SkillSwapGrid from './components/SkillSwapGrid';
import CanteenOrder from './components/CanteenOrder';
import MessMenu from './components/MessMenu';
import StudyMaterials from './components/StudyMaterials';
import AcademicCalendar from './components/AcademicCalendar';
import MetroStartScreen from './components/MetroStartScreen';
import LockScreen from './components/LockScreen';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [stats, setStats] = useState({ notices: 0, skillgigs: 0, canteen: 0 });
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const triggerPayment = (amount, source, payload) => {
    setPaymentData({ amount, source, payload });
    setActiveTab('PAYMENT');
  };

  // Check if user session already exists on load
  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          setActiveTab('home');
        }
      }
    } catch (e) {
      // Session check failed, keep null
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [noticesRes, gigsRes, canteenRes] = await Promise.all([
        fetch('/api/notices'),
        fetch('/api/skillgigs'),
        fetch('/api/canteen/menu')
      ]);
      if (noticesRes.ok && gigsRes.ok && canteenRes.ok) {
        const notices = await noticesRes.json();
        const gigs = await gigsRes.json();
        const menu = await canteenRes.json();
        setStats({
          notices: notices.length,
          skillgigs: gigs.filter(g => g.Status === 'Active').length,
          canteen: menu.filter(m => m.IsAvailable).length
        });
      }
    } catch (e) {
      // Ignore statistics fetch errors silently
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
      // Refresh stats every 10 seconds to keep dashboard live
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Periodically check/clean expired mess tokens
  useEffect(() => {
    if (!currentUser) return;
    const checkExpiry = () => {
      const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';
      const tokenStr = localStorage.getItem(`cp_token_${username}`);
      if (tokenStr) {
        try {
          const token = JSON.parse(tokenStr);
          if (token && token.ExpiryTime) {
            const isExpired = new Date(token.ExpiryTime) < new Date();
            if (isExpired) {
              localStorage.removeItem(`cp_token_${username}`);
              // Force state refresh
              fetchStats();
            }
          }
        } catch (e) {
          // Ignore
        }
      }
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore logout API failures and clear state anyway
    } finally {
      setCurrentUser(null);
      setActiveTab('home');
    }
  };

  // Determine user role and active tabs
  const getTabs = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'canteen_admin') {
      return [
        { id: 'home', label: 'Start Screen', icon: '🏠' },
        { id: 'canteen', label: 'Canteen Menu', icon: '🍔' }
      ];
    }
    if (currentUser.role === 'admin') {
      return [
        { id: 'home', label: 'Start Screen', icon: '🏠' },
        { id: 'notices', label: 'Notice Board', icon: '📢' },
        { id: 'skillgigs', label: 'Skill Exchange', icon: '🤝' },
        { id: 'mess', label: 'Mess Menu', icon: '🍱' },
        { id: 'materials', label: 'Study Material', icon: '📚' },
        { id: 'calendar', label: 'Academic Calendar', icon: '📅' }
      ];
    }
    // Student role sees all 6 tabs plus home start screen
    return [
      { id: 'home', label: 'Start Screen', icon: '🏠' },
      { id: 'notices', label: 'Notice Board', icon: '📢' },
      { id: 'skillgigs', label: 'Skill Exchange', icon: '🤝' },
      { id: 'canteen', label: 'Canteen Menu', icon: '🍔' },
      { id: 'mess', label: 'Mess Menu', icon: '🍱' },
      { id: 'materials', label: 'Study Material', icon: '📚' },
      { id: 'calendar', label: 'Academic Calendar', icon: '📅' }
    ];
  };

  const allowedTabs = getTabs().map(t => t.id);
  const handleTabClick = (tabId) => {
    if (allowedTabs.includes(tabId)) {
      setActiveTab(tabId);
    }
  };

  // If page is loading session check
  if (checkingAuth) {
    return (
      <div className="app-loading-screen">
        <div className="spinner"></div>
        <p className="font-mono mt-4">Unlocking CampOS...</p>
      </div>
    );
  }

  // 💳 Immersive full-screen Checkout / Payment View
  if (activeTab === 'PAYMENT') {
    const handlePay = async (method) => {
      try {
        setProcessingPayment(true);
        // Simulate premium payment processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';

        if (paymentData.source === 'MESS_GUEST') {
          // POST /api/mess/buy-guest-token
          const res = await fetch('/api/mess/buy-guest-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Payment failed.');
          }

          const data = await res.json();
          if (data.token) {
            localStorage.setItem(`cp_token_${username}`, JSON.stringify(data.token));
            setActiveTab('MESS_QR_FULL');
          }
        } else if (paymentData.source === 'CANTEEN') {
          // POST /api/canteen/orders
          const res = await fetch('/api/canteen/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              StudentId: paymentData.payload.studentId,
              ItemsArray: paymentData.payload.cart.map((cartItem) => ({
                MenuItemId: cartItem._id,
                Quantity: cartItem.quantity,
              })),
            }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Payment failed.');
          }

          const orderData = await res.json();
          localStorage.setItem(`cp_order_${username}`, JSON.stringify({
            StudentName: `${currentUser.firstName} ${currentUser.lastName}`,
            ItemsArray: orderData.ItemsArray,
            TotalAmount: orderData.TotalAmount,
            PickupPIN: orderData.PickupPIN,
            ItemCount: orderData.ItemsArray.reduce((sum, item) => sum + item.Quantity, 0)
          }));

          setActiveTab('SUCCESS');
        }
      } catch (err) {
        alert(err.message);
      } finally {
        setProcessingPayment(false);
      }
    };

    const backTarget = paymentData?.source === 'MESS_GUEST' ? 'mess' : 'canteen';

    return (
      <div className="fixed inset-0 bg-white flex flex-col p-6 z-[9999] overflow-hidden font-sans">
        {/* Header with circular back button */}
        <header className="w-full flex items-center justify-between py-4">
          <button
            onClick={() => setActiveTab(backTarget)}
            className="bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-full h-12 w-12 flex items-center justify-center border border-slate-200/50 shadow-sm transition-all duration-300"
            title="Back"
          >
            <ArrowLeft className="text-slate-600" size={20} />
          </button>
          <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">CampOS Payment Gateway</span>
          <div className="w-12 h-12"></div> {/* spacer */}
        </header>

        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          {/* Centered Massive Price */}
          <div className="text-center mb-12">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest block mb-2">Total Payable Amount</span>
            <div className="text-6xl font-black text-slate-900 tracking-tight select-none">
              ₹{paymentData?.amount || 0}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="w-full flex flex-col gap-4">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider pl-1">Select Payment Method</span>
            
            {/* UPI / GPay */}
            <button
              onClick={() => handlePay('UPI')}
              className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 hover:border-black active:scale-[0.99] transition-all duration-300 bg-white group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 transition-colors group-hover:bg-indigo-50">
                  <SmartphoneNfc size={20} className="group-hover:text-indigo-600" />
                </div>
                <div className="text-left">
                  <h4 className="text-slate-800 font-black text-base group-hover:text-black font-sans">UPI / GPay</h4>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">Instant transfer using any UPI app</p>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-black font-extrabold text-sm font-mono">&rarr;</div>
            </button>

            {/* Credit / Debit Card */}
            <button
              onClick={() => handlePay('CARD')}
              className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 hover:border-black active:scale-[0.99] transition-all duration-300 bg-white group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 transition-colors group-hover:bg-indigo-50">
                  <CreditCard size={20} className="group-hover:text-indigo-600" />
                </div>
                <div className="text-left">
                  <h4 className="text-slate-800 font-black text-base group-hover:text-black font-sans">Card</h4>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">Visa, Mastercard, RuPay, or Maestro</p>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-black font-extrabold text-sm font-mono">&rarr;</div>
            </button>
          </div>
        </div>

        {/* Full-screen semi-transparent loading overlay */}
        {processingPayment && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[99999] flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-slate-900 font-black text-xl mt-6 tracking-tight font-sans">Processing Payment...</h3>
            <p className="text-slate-500 text-xs font-semibold mt-2 tracking-wide font-mono uppercase">Securing connection to banker</p>
          </div>
        )}
      </div>
    );
  }

  // 🎫 Immersive full-screen Mess QR Pass view
  if (activeTab === 'MESS_QR_FULL') {
    const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';
    const tokenStr = localStorage.getItem(`cp_token_${username}`);
    const token = tokenStr ? JSON.parse(tokenStr) : null;
    
    // Calculate remaining minutes
    let remainingMinutes = 90;
    if (token && token.ExpiryTime) {
      const remainingMs = new Date(token.ExpiryTime) - new Date();
      remainingMinutes = Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
    }

    return (
      <div className="fixed inset-0 bg-indigo-600 text-white flex flex-col items-center justify-center p-6 z-[9999] overflow-hidden font-sans">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          <h2 className="text-4xl font-black mt-2 tracking-tight">Guest Pass</h2>
          
          <div className="flex items-center gap-2 mt-4 opacity-80">
            <Clock size={20} className="text-white" />
            <span className="text-white text-sm font-semibold tracking-wide">
              {remainingMinutes > 0 ? `Valid for ${remainingMinutes} Mins` : 'Expired'}
            </span>
          </div>

          {/* Massive white QR card with exaggerated soft rounded corners */}
          <div className="w-full max-w-sm bg-white p-8 rounded-[32px] shadow-2xl mt-8 flex flex-col items-center justify-center transform hover:scale-[1.02] transition-transform duration-300">
            <div className="p-1.5 bg-slate-50 rounded-[24px]">
              <QrCode size={240} className="text-black" />
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">Pass Verification Code</p>
              <p className="text-indigo-950 font-black mt-1 text-base tracking-wide font-mono">
                {token ? `ID: #${String(token._id || token.id || '').substring(18).toUpperCase()}` : 'ACTIVE PASS'}
              </p>
            </div>
          </div>

          {/* Translucent floating close button */}
          <button
            onClick={() => setActiveTab('home')}
            className="mt-12 h-14 w-14 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg shadow-black/10 transition-all duration-300"
            title="Close Pass"
          >
            <X size={24} />
          </button>
        </div>
      </div>
    );
  }

  // 🍔 Immersive full-screen Canteen Success view
  if (activeTab === 'SUCCESS') {
    const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';
    const orderStr = localStorage.getItem(`cp_order_${username}`);
    const order = orderStr ? JSON.parse(orderStr) : null;
    const pin = order ? order.PickupPIN : '----';

    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 z-[9999] overflow-hidden font-sans">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          {/* Large green circle with a white check icon */}
          <div className="h-28 w-28 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 mb-8 border-4 border-green-400/20 transform hover:scale-105 transition-transform duration-300">
            <Check size={44} className="text-white stroke-[3px]" />
          </div>

          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans">Order Placed!</h2>
          <p className="text-slate-500 mt-2 text-sm max-w-xs leading-relaxed font-sans">
            Your hot meal is preparing. Scan or present the pickup ticket code at the counter.
          </p>

          {/* White ticket card with soft, exaggerated rounded corners */}
          <div className="w-full bg-white py-12 px-10 rounded-[32px] shadow-xl border border-slate-100 mt-8 flex flex-col items-center relative overflow-hidden max-w-sm">
            {/* Ambient subtle background decorative arcs to make it feel like a real ticket */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-violet-600"></div>
            
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">Pickup Code</span>
            <div className="text-7xl font-black text-indigo-600 tracking-widest my-8 font-mono select-all animate-pulse">
              {pin}
            </div>

            <div className="w-full border-t-2 border-dashed border-slate-100 pt-8 mt-2 flex flex-col gap-3 text-left">
              <div className="flex justify-between items-center text-xs font-medium text-slate-400 font-sans">
                <span>Customer:</span>
                <span className="text-slate-700 font-bold">{order?.StudentName || 'Student'}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium text-slate-400 font-sans">
                <span>Total Amount:</span>
                <span className="text-slate-700 font-extrabold font-mono">₹{order?.TotalAmount || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium text-slate-400 font-sans">
                <span>Items Count:</span>
                <span className="text-slate-700 font-bold">{order?.ItemCount || 0} items</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('home')}
            className="mt-8 px-10 py-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-full shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 transition-all duration-300 text-sm tracking-wide font-sans"
          >
            Done & Back Home
          </button>
        </div>
      </div>
    );
  }

  // 🔒 If user is NOT logged in, show the LockScreen
  if (!currentUser) {
    return (
      <LockScreen 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('home');
        }} 
      />
    );
  }

  const getTabIcon = (tabId) => {
    switch (tabId) {
      case 'home': return <Home size={20} className="stroke-[2.5px]" />;
      case 'canteen': return <Coffee size={20} className="stroke-[2.5px]" />;
      case 'mess': return <Utensils size={20} className="stroke-[2.5px]" />;
      case 'skillgigs': return <BookOpen size={20} className="stroke-[2.5px]" />;
      default: return null;
    }
  };

  const tabs = getTabs();

  return (
    <div className="mobile-device-simulator">
      <div className="mobile-screen-viewport">
        <div className="campos-dashboard flex flex-col justify-between h-full bg-[#f8fafc] relative font-sans">
          
          {/* Main feature display area inside simulated smartphone screen */}
          <main className="flex-1 overflow-y-auto scrollbar-none bg-[#f8fafc] relative">
            {activeTab === 'home' && (
              <MetroStartScreen
                currentUser={currentUser}
                stats={stats}
                onTileClick={(tabId) => setActiveTab(tabId)}
                onLogout={handleLogout}
              />
            )}
            {activeTab === 'notices' && allowedTabs.includes('notices') && (
              <NoticesFeed 
                currentUser={currentUser} 
                onUpdate={fetchStats} 
              />
            )}
            {activeTab === 'skillgigs' && allowedTabs.includes('skillgigs') && (
              <SkillSwapGrid 
                currentUser={currentUser} 
                onUpdate={fetchStats} 
              />
            )}
            {activeTab === 'canteen' && allowedTabs.includes('canteen') && (
              <CanteenOrder 
                currentUser={currentUser} 
                onUpdate={fetchStats} 
                setActiveTab={setActiveTab}
                triggerPayment={triggerPayment}
              />
            )}
            {activeTab === 'mess' && allowedTabs.includes('mess') && (
              <MessMenu currentUser={currentUser} setActiveTab={setActiveTab} triggerPayment={triggerPayment} />
            )}
            {activeTab === 'materials' && allowedTabs.includes('materials') && (
              <StudyMaterials />
            )}
            {activeTab === 'calendar' && allowedTabs.includes('calendar') && (
              <AcademicCalendar />
            )}
          </main>

          {/* Premium Bottom Mobile Navigation Bar */}
          <nav className="bg-white border-t border-slate-100 rounded-t-[32px] p-4 flex justify-around items-center shadow-2xl z-40 select-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 outline-none ${
                    isActive
                      ? 'border-2 border-indigo-600 bg-indigo-50/20 text-indigo-600 rounded-2xl py-2 px-4 font-bold scale-[1.03] shadow-sm shadow-indigo-100'
                      : 'text-slate-400 hover:text-slate-600 font-semibold text-xs py-2 px-3'
                  }`}
                >
                  {getTabIcon(tab.id)}
                  <span className="text-[10px] tracking-wide leading-none mt-0.5">{tab.label}</span>
                </button>
              );
            })}
          </nav>

        </div>
      </div>
    </div>
  );
}

export default App;
