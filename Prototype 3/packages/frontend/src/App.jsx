import React, { useMemo, useState, useEffect } from 'react';
import { Clock, QrCode, Check, X, Smartphone, SmartphoneNfc, CreditCard, ArrowLeft, Ticket, Home, Coffee, Utensils, BookOpen, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import NoticesFeed from './components/NoticesFeed';
import SkillSwapGrid from './components/SkillSwapGrid';
import CanteenOrder from './components/CanteenOrder';
import MessMenu from './components/MessMenu';
import StudyMaterials from './components/StudyMaterials';
import AcademicCalendar from './components/AcademicCalendar';
import Timetable from './components/Timetable';
import MetroStartScreen from './components/MetroStartScreen';
import LockScreen from './components/LockScreen';
import PeerChat from './components/PeerChat';
import StudentDashboard from './components/StudentDashboard';
import { API_BASE } from './config/api';
import { parseJsonResponse } from './utils/parseJsonResponse';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [stats, setStats] = useState({ notices: 0, skillgigs: 0, canteen: 0 });

  // Synchronize theme and mode on load
  useEffect(() => {
    const savedTheme = localStorage.getItem('campos-theme') || 'lavender';
    document.body.classList.remove('theme-lavender', 'theme-blue', 'theme-green', 'theme-orange', 'theme-yellow');
    document.body.classList.add(`theme-${savedTheme}`);
    
    const savedMode = localStorage.getItem('campos-mode') || 'dark';
    document.body.classList.remove('mode-light', 'mode-dark');
    document.body.classList.add(`mode-${savedMode}`);
  }, []);
  const [canteenCart, setCanteenCart] = useState([]);
  const [isCartPopping, setIsCartPopping] = useState(false);
  const [showCanteenTicketModal, setShowCanteenTicketModal] = useState(false);
  const [activeChatPeer, setActiveChatPeer] = useState(null);

  const totalCartQty = canteenCart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (totalCartQty === 0) return;
    setIsCartPopping(true);
    const timer = setTimeout(() => setIsCartPopping(false), 600);
    return () => clearTimeout(timer);
  }, [totalCartQty]);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [hasUnreadNotices, setHasUnreadNotices] = useState(false);

  const checkUnreadNotices = (noticesList) => {
    if (!currentUser) return;
    const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';
    const lastRead = localStorage.getItem(`cp_notices_last_read_${username}`);
    
    if (!lastRead) {
      setHasUnreadNotices(noticesList.length > 0);
      return;
    }
    
    const lastReadTime = new Date(lastRead).getTime();
    const hasNew = noticesList.some(notice => {
      const noticeTime = new Date(notice.Date || notice.createdAt).getTime();
      return noticeTime > lastReadTime;
    });
    setHasUnreadNotices(hasNew);
  };

  const markNoticesRead = () => {
    if (!currentUser) return;
    const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';
    localStorage.setItem(`cp_notices_last_read_${username}`, new Date().toISOString());
    setHasUnreadNotices(false);
  };

  useEffect(() => {
    if (activeTab === 'notices') {
      markNoticesRead();
    }
  }, [activeTab, currentUser]);

  // Scroll main container to top when activeTab changes
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [activeTab]);

  const triggerPayment = (amount, source, payload) => {
    setPaymentData({ amount, source, payload });
    setActiveTab('PAYMENT');
  };

  // Check if user session already exists on load
  const checkSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
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
        fetch(`${API_BASE}/api/notices`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/skillgigs`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/canteen/menu`, { credentials: 'include' })
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
        checkUnreadNotices(notices);
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
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
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
        <p className="mt-4 font-mono">Unlocking CampOS...</p>
      </div>
    );
  }

  // 🖥️ Dynamic Mobile Viewport Content Router
  const renderContent = () => {
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

    // 💳 Immersive Checkout / Payment View
    if (activeTab === 'PAYMENT') {
      const handlePay = async (method) => {
        try {
          setProcessingPayment(true);
          // Simulate premium payment processing delay
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';

          if (paymentData.source === 'MESS_GUEST') {
            // POST /api/mess/buy-guest-token
            const res = await fetch(`${API_BASE}/api/mess/buy-guest-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
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
            const res = await fetch(`${API_BASE}/api/canteen/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                StudentId: paymentData.payload.studentId,
                ItemsArray: paymentData.payload.cart.map((cartItem) => ({
                  MenuItemId: cartItem._id,
                  Quantity: cartItem.quantity,
                })),
              }),
              credentials: 'include',
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
              ItemCount: orderData.ItemsArray.reduce((sum, item) => sum + item.Quantity, 0),
              Timestamp: orderData.Timestamp || new Date().toISOString()
            }));

            setCanteenCart([]); // Clear cart upon successful payment checkout
            setActiveTab('home');
            setShowCanteenTicketModal(true);
          }
        } catch (err) {
          alert(err.message);
        } finally {
          setProcessingPayment(false);
        }
      };

      const backTarget = paymentData?.source === 'MESS_GUEST' ? 'mess' : 'canteen';

      return (
        <div className="absolute inset-0 bg-m3-surface flex flex-col z-[9999] overflow-hidden font-sans">
          {/* M3 Header Top Bar */}
          <header className="m3-top-app-bar m3-top-app-bar--collapsed z-20 shrink-0" style={{ height: '96px', paddingTop: '26px' }}>
            <div className="m3-top-app-bar__row w-full justify-between pr-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab(backTarget)}
                  className="m3-icon-button text-m3-onSurface hover:bg-white/5"
                  type="button"
                  aria-label="Go back"
                >
                  <ChevronLeft size={22} strokeWidth={2.5} />
                </button>
                
                <h4 className="m3-title-medium text-white leading-none pl-1">Payment Gateway</h4>
              </div>
              <div className="w-12 h-12"></div> {/* spacer */}
            </div>
          </header>

          <div 
            className="flex-1 overflow-y-auto scrollbar-none p-6 flex flex-col justify-center items-center gap-8 min-h-0 w-full"
            style={{
              paddingTop: '106px',
            }}
          >
            {/* Centered Price Card */}
            <div className="m3-surface-card w-full p-6 text-center shadow-lg relative overflow-hidden flex flex-col items-center gap-2 border border-transparent animate-fade-in">
              <span className="text-[10px] font-bold text-m3-onSurfaceVariant tracking-widest uppercase font-mono">
                Total Payable Amount
              </span>
              <div className="text-5xl font-black tracking-tight text-m3-onPrimary font-sans flex items-center justify-center gap-1.5 my-2">
                <span>₹</span>
                <span className="text-white">{paymentData?.amount || 0}</span>
              </div>
              <div className="text-[10px] text-m3-onSurfaceVariant/60 font-semibold tracking-wide uppercase font-mono">
                Secure Checkout by CampOS
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col w-full gap-4">
              <div className="text-left pl-1">
                <span className="text-[10px] font-bold text-m3-onSurfaceVariant tracking-widest uppercase font-mono">
                  Select Payment Method
                </span>
              </div>
              
              {/* UPI / GPay */}
              <button
                onClick={() => handlePay('UPI')}
                className="w-full flex items-center justify-between p-5 rounded-[24px] bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest active:scale-[0.98] transition-all duration-300 border border-transparent group shadow-sm text-left cursor-pointer"
                type="button"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 transition-all duration-300 rounded-[16px] bg-m3-primaryContainer/30 text-m3-primary group-hover:bg-m3-primaryContainer/50 group-hover:text-m3-onPrimaryContainer">
                    <SmartphoneNfc size={20} />
                  </div>
                  <div>
                    <h4 className="font-sans text-base font-bold text-white group-hover:text-m3-onPrimaryContainer">UPI / GPay</h4>
                    <p className="text-m3-onSurfaceVariant/70 text-xs mt-1 font-medium">Instant transfer using any UPI app</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-m3-primary group-hover:text-white transition-colors duration-300 shrink-0" />
              </button>

              {/* Credit / Debit Card */}
              <button
                onClick={() => handlePay('CARD')}
                className="w-full flex items-center justify-between p-5 rounded-[24px] bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest active:scale-[0.98] transition-all duration-300 border border-transparent group shadow-sm text-left cursor-pointer"
                type="button"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 transition-all duration-300 rounded-[16px] bg-m3-primaryContainer/30 text-m3-primary group-hover:bg-m3-primaryContainer/50 group-hover:text-m3-onPrimaryContainer">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h4 className="font-sans text-base font-bold text-white group-hover:text-m3-onPrimaryContainer">Card</h4>
                    <p className="text-m3-onSurfaceVariant/70 text-xs mt-1 font-medium">Visa, Mastercard, RuPay, or Maestro</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-m3-primary group-hover:text-white transition-colors duration-300 shrink-0" />
              </button>
            </div>
          </div>

          {/* Full-screen loading overlay */}
          {processingPayment && (
            <div className="absolute inset-0 bg-m3-surface/95 backdrop-blur-sm z-[99999] flex flex-col items-center justify-center p-6 select-none">
              <div className="w-14 h-14 border-4 border-m3-primary rounded-full border-t-transparent animate-spin"></div>
              <h3 className="mt-6 font-sans text-xl font-bold tracking-tight text-white">Processing Payment...</h3>
              <p className="mt-2 text-[10px] font-bold tracking-widest uppercase text-m3-primary">Securing connection to banker</p>
            </div>
          )}
        </div>
      );
    }

    // 🎫 Immersive Mess QR Pass view
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
        <div className="absolute inset-0 bg-m3-surface text-white flex flex-col items-center justify-center p-6 z-[9999] overflow-hidden font-sans">
          <div className="flex flex-col items-center w-full max-w-md text-center">
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white select-none animate-fade-in">Guest Pass</h2>
            
            <div 
              className="flex items-center gap-2 mt-3.5 px-4 py-1.5 rounded-full text-m3-primary border-none select-none shadow-sm animate-fade-in"
              style={{ backgroundColor: 'color-mix(in srgb, var(--m3-primary-container) 30%, transparent)' }}
            >
              <Clock size={16} />
              <span className="text-xs font-bold font-mono tracking-wider uppercase">
                {remainingMinutes > 0 ? `Valid for ${remainingMinutes} Mins` : 'Expired'}
              </span>
            </div>

            {/* Massive white QR card with M3 surface style */}
            <div className="w-full max-w-sm bg-m3-surfaceContainerHigh p-8 rounded-[32px] border-none shadow-2xl mt-8 flex flex-col items-center justify-center transform hover:scale-[1.01] transition-transform duration-300 animate-fade-in">
              <div className="p-3 bg-white rounded-[24px] shadow-inner flex items-center justify-center">
                <QrCode size={220} className="text-black" />
              </div>
              
              <div className="mt-6 text-center w-full flex flex-col gap-2">
                <p className="text-[10px] font-bold tracking-widest uppercase text-m3-onSurfaceVariant">Pass Verification Code</p>
                <div className="mt-1 text-base font-bold tracking-wide text-white bg-m3-surfaceContainerLow py-2.5 px-5 rounded-2xl inline-block mx-auto shadow-inner border-none">
                  {token ? `ID: #${String(token._id || token.id || '').substring(18).toUpperCase()}` : 'ACTIVE PASS'}
                </div>
              </div>
            </div>

            {/* Light purple square close button */}
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center justify-center mt-12 text-m3-onPrimary hover:brightness-110 active:scale-95 transition-all duration-300 rounded-[20px] shadow-lg h-14 w-14 bg-m3-primary border-none shadow-black/20 cursor-pointer"
              title="Close Pass"
              type="button"
            >
              <X size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      );
    }

    // 🍔 Immersive Canteen Success view
    if (activeTab === 'SUCCESS') {
      const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';
      const orderStr = localStorage.getItem(`cp_order_${username}`);
      const order = orderStr ? JSON.parse(orderStr) : null;
      const pin = order ? order.PickupPIN : '----';

      return (
        <div className="absolute inset-0 moving-gradient-bg text-white flex flex-col items-center justify-center p-6 z-[9999] overflow-hidden font-sans select-none">


          <div className="z-10 flex flex-col items-center w-full max-w-md text-center">
            {/* Sleek check icon */}
            <div className="z-10 flex items-center justify-center w-20 h-20 mb-6 transition-transform duration-300 transform border-4 rounded-full shadow-xl bg-white/20 shadow-white/10 border-white/15 hover:scale-105">
              <Check size={36} className="text-white stroke-[3px]" />
            </div>

            <h2 className="mt-2 font-sans text-2xl font-black tracking-tight text-white">Order Placed!</h2>
            <p className="text-slate-300 mt-1.5 text-xs max-w-xs leading-relaxed font-sans">
              Your hot meal is preparing. Present this digital slip at the counter.
            </p>

            {/* Sleek Glass Credit Slip */}
            <div className="w-full bg-white/[0.03] backdrop-blur-3xl py-6 px-5 rounded-[28px] border-2 border-transparent shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] mt-6 flex flex-col items-center relative overflow-hidden max-w-[340px]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/30 to-white/10"></div>
              
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Pickup PIN</span>
              <div className="my-4 text-5xl font-black tracking-widest text-white select-all">
                {pin}
              </div>

              <div className="w-full border-t-2 border-dotted border-white/10 pt-4 mt-1 flex flex-col gap-2.5 text-left font-sans">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Customer:</span>
                  <span className="font-bold text-slate-200">{order?.StudentName || 'Student'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Total Amount:</span>
                  <span className="text-xs font-extrabold text-white">₹{order?.TotalAmount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Items Count:</span>
                  <span className="font-bold text-slate-200">{order?.ItemCount || 0} items</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('home')}
              className="mt-6 px-8 py-3.5 bg-m3-primary text-m3-onPrimary hover:brightness-110 font-black rounded-xl shadow-lg transition-all duration-300 text-xs uppercase tracking-wider z-10 cursor-pointer active:scale-95"
            >
              Done & Back Home
            </button>
          </div>
        </div>
      );
    }

    const immersiveTabs = [
      'home',
      'mess',
      'materials',
      'calendar',
      'notices',
      'skillgigs',
      'canteen',
      'canteen_cart',
      'student_dashboard',
      'timetable',
      'peerchat',
    ];
    const isImmersiveTab = immersiveTabs.includes(activeTab);

    // Otherwise show main dashboard
    return (
      <div
        className={`campos-dashboard flex flex-col justify-between h-full text-white relative font-sans overflow-hidden ${
          activeTab === 'home'
            ? 'campos-dashboard--home'
            : isImmersiveTab
              ? 'campos-dashboard--immersive'
              : 'moving-gradient-bg'
        }`}
      >
        <main
          className={`flex-1 min-h-0 scrollbar-none bg-transparent relative z-10 ${
            isImmersiveTab ? 'overflow-hidden flex flex-col p-0' : 'overflow-y-auto'
          }`}
        >
          {activeTab === 'home' && (
            <MetroStartScreen
              currentUser={currentUser}
              stats={stats}
              onTileClick={(tabId) => {
                if (tabId === 'SUCCESS') {
                  setShowCanteenTicketModal(true);
                } else {
                  setActiveTab(tabId);
                }
              }}
              onLogout={handleLogout}
              hasUnreadNotices={hasUnreadNotices}
            />
          )}
          {activeTab === 'notices' && allowedTabs.includes('notices') && (
            <NoticesFeed 
              currentUser={currentUser} 
              onUpdate={fetchStats} 
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'skillgigs' && allowedTabs.includes('skillgigs') && (
            <SkillSwapGrid 
              currentUser={currentUser} 
              onUpdate={fetchStats} 
              setActiveTab={setActiveTab}
              onStartChat={(peerName) => {
                setActiveChatPeer(peerName);
                setActiveTab('peerchat');
              }}
            />
          )}
          {activeTab === 'peerchat' && (
            <PeerChat
              currentUser={currentUser}
              initialActivePeer={activeChatPeer}
              onClose={() => setActiveTab('skillgigs')}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'canteen' && allowedTabs.includes('canteen') && (
            <CanteenOrder 
              currentUser={currentUser} 
              onUpdate={fetchStats} 
              setActiveTab={setActiveTab}
              triggerPayment={triggerPayment}
              cart={canteenCart}
              setCart={setCanteenCart}
            />
          )}
          {activeTab === 'canteen_cart' && allowedTabs.includes('canteen') && (
            <CanteenOrder 
              currentUser={currentUser} 
              onUpdate={fetchStats} 
              setActiveTab={setActiveTab}
              triggerPayment={triggerPayment}
              cart={canteenCart}
              setCart={setCanteenCart}
              isCartCheckout={true}
            />
          )}
          {activeTab === 'mess' && allowedTabs.includes('mess') && (
            <MessMenu currentUser={currentUser} setActiveTab={setActiveTab} triggerPayment={triggerPayment} />
          )}
          {activeTab === 'materials' && allowedTabs.includes('materials') && (
            <StudyMaterials setActiveTab={setActiveTab} />
          )}
          {activeTab === 'calendar' && allowedTabs.includes('calendar') && (
            <AcademicCalendar setActiveTab={setActiveTab} />
          )}
          {activeTab === 'timetable' && (
            <Timetable 
              currentUser={currentUser}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'student_dashboard' && (
            <StudentDashboard 
              currentUser={currentUser}
              onClose={() => setActiveTab('home')}
            />
          )}
        </main>

        {/* Floating Premium Cart FAB */}
        {activeTab === 'canteen' && canteenCart.length > 0 && (
          <button
            onClick={() => setActiveTab('canteen_cart')}
            className={`absolute bottom-6 right-6 z-[999] bg-m3-primary text-m3-onPrimary rounded-[20px] w-16 h-16 shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
              isCartPopping ? 'scale-110' : 'active:scale-90 hover:brightness-110'
            }`}
            type="button"
            title="View Cart"
          >
            <ShoppingCart size={24} className="stroke-[2.5px]" />
          </button>
        )}
 
        {/* Canteen Ticket Glass Popup Modal Overlay */}
        {showCanteenTicketModal && (() => {
          try {
            const username = currentUser.email ? currentUser.email.split('@')[0] : 'user';
            const orderStr = localStorage.getItem(`cp_order_${username}`);
            const order = orderStr ? JSON.parse(orderStr) : null;
            
            if (!order) return null;

            return (
              <CanteenTicketModal 
                order={order} 
                onClose={() => setShowCanteenTicketModal(false)} 
              />
            );
          } catch (e) {
            console.error("Failed to parse cp_order from localStorage:", e);
            return null;
          }
        })()}

      </div>
    );
  };

  const getTabIcon = (tabId) => {
    switch (tabId) {
      case 'home': return <Home size={20} className="stroke-[2.5px]" />;
      case 'canteen': return <Coffee size={20} className="stroke-[2.5px]" />;
      case 'mess': return <Utensils size={20} className="stroke-[2.5px]" />;
      case 'skillgigs': return <BookOpen size={20} className="stroke-[2.5px]" />;
      default: return null;
    }
  };

  return (
    <div className="mobile-device-simulator">
      <div className="mobile-screen-viewport">
        {/* iPhone 17 Premium Dynamic Island Pill Camera */}
        <div className="iphone-dynamic-island" />
        {renderContent()}
      </div>
    </div>
  );
}

// 🎫 Canteen Ticket Glass Popup Modal with live countdown timer
function CanteenTicketModal({ order, onClose }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      if (!order || !order.Timestamp) {
        setTimeLeft('Expired');
        return;
      }
      const orderTime = new Date(order.Timestamp).getTime();
      const expiryTime = orderTime + 20 * 60 * 1000; // 20 mins expiration window
      const remainingMs = expiryTime - Date.now();
      
      if (remainingMs <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      setTimeLeft(`Expires in ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order]);

  return (
    <div className="absolute inset-0 bg-black/60 z-[9999] flex items-center justify-center p-6" onClick={onClose}>
      <div 
        className="w-full max-w-[320px] m3-surface-card backdrop-blur-md border border-transparent shadow-2xl py-6 px-5 flex flex-col items-center relative overflow-hidden select-none animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Title and Ticket Icon */}
        <div 
          className="flex items-center justify-between w-full pb-3 mb-4"
          style={{ borderBottom: '1px solid color-mix(in srgb, var(--m3-outline-variant) 15%, transparent)' }}
        >
          <span className="text-m3-primary font-bold uppercase tracking-wider text-[10px]">Canteen Slip</span>
          <Ticket size={18} className="text-m3-primary/70" />
        </div>

        {/* Live Timer Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-m3-errorContainer/10 border border-transparent text-m3-error rounded-full text-[9px] font-bold tracking-wider uppercase mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-m3-error animate-pulse"></span>
          {timeLeft}
        </div>

        <span className="text-m3-onSurfaceVariant text-[10px] font-bold uppercase tracking-widest mt-1">Pickup PIN</span>
        <div className="my-4 text-5xl font-black tracking-widest text-white select-all">
          {order.PickupPIN}
        </div>

        {/* Order Items List */}
        <div className="w-full mt-1 mb-2 py-3 text-left flex flex-col gap-2 max-h-[140px] overflow-y-auto scrollbar-none font-sans" style={{ borderTop: '1px solid color-mix(in srgb, var(--m3-outline-variant) 12%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--m3-outline-variant) 12%, transparent)' }}>
          <span className="text-m3-onSurfaceVariant text-[8px] font-bold uppercase tracking-wider block mb-1">Order Items</span>
          {order.ItemsArray && order.ItemsArray.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-[10px] text-white/95 font-medium">
              <span className="pr-2 truncate">{item.Name}</span>
              <span className="font-bold text-m3-primary shrink-0">x{item.Quantity}</span>
            </div>
          ))}
        </div>

        <div className="w-full mt-1 flex flex-col gap-2.5 text-left font-sans">
          <div className="flex justify-between items-center text-[10px] font-bold text-m3-onSurfaceVariant">
            <span>Customer:</span>
            <span className="font-bold text-white">{order.StudentName || 'Student'}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-m3-onSurfaceVariant">
            <span>Total Amount:</span>
            <span className="text-xs font-black text-m3-tertiary">₹{order.TotalAmount || 0}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-m3-onSurfaceVariant">
            <span>Items Count:</span>
            <span className="font-bold text-white">{order.ItemCount || 0} items</span>
          </div>
        </div>

        {/* Action Button inside modal */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3.5 bg-m3-primary text-m3-onPrimary hover:brightness-110 active:scale-[0.97] font-bold rounded-2xl shadow-lg transition-all duration-300 text-[10px] uppercase tracking-wider cursor-pointer text-center"
        >
          Dismiss Ticket
        </button>
      </div>
    </div>
  );
}

export default App;
