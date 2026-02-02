// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Coffee, Utensils, BookOpen, ShoppingBag, Plus, QrCode, WifiOff, Check,
  Clock, LogOut, Edit2, CreditCard, Smartphone,
  ArrowLeft, Ticket, X, Trash2, Send, Megaphone, Sunrise, UserPlus, Bell, MessageCircle, Flag, CheckSquare, Square, Sun, Moon
} from 'lucide-react';

// --- ANIMATION STYLES ---
const AnimationStyles = () => (
  <style>{`
    @keyframes popIn {
      0% { transform: scale(0.9); opacity: 0; }
      50% { transform: scale(1.02); } 
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes slideUp {
      0% { transform: translateY(30px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    @keyframes gradientBG {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animate-pop { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; opacity: 0; }
    .animate-gradient {
      background: linear-gradient(-45deg, #020617, #1e3a8a, #172554, #0f172a);
      background-size: 400% 400%;
      animation: gradientBG 10s ease infinite;
    }
    .delay-0 { animation-delay: 0ms; }
    .delay-1 { animation-delay: 80ms; }
    .delay-2 { animation-delay: 160ms; }
    .delay-3 { animation-delay: 240ms; }
    .delay-4 { animation-delay: 320ms; }
    .delay-5 { animation-delay: 400ms; }
  `}</style>
);



// --- UI COMPONENTS ---

const Card = ({ children, className = '', onClick, delay = 0 }) => (
  <div
    onClick={onClick}
    className={`bg-slate-900 rounded-[24px] p-5 shadow-sm border border-slate-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] animate-slide-up ${className}`}
    style={{ animationDelay: `${delay * 50}ms` }}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "h-12 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-90 disabled:opacity-50 disabled:scale-100";
  const variants = {
    primary: "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 hover:shadow-blue-600/40",
    secondary: "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700",
    tonal: "bg-slate-800 text-white hover:bg-slate-700",
    outline: "border-2 border-slate-700 text-slate-300 hover:border-blue-500 hover:text-white",
    ghost: "text-blue-400 hover:bg-slate-800",
    danger: "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white",
    white: "bg-slate-800 text-blue-400 shadow-md hover:bg-slate-700",
    success: "bg-green-500/20 text-green-400 border border-green-500/50",
    contrast: "bg-white text-black shadow-lg hover:bg-gray-100"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, type = "text", className = "" }) => (
  <div className={`w-full relative group ${className}`}>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full h-14 bg-slate-900 rounded-2xl px-4 text-white font-medium outline-none border-2 border-slate-800 focus:border-blue-500 focus:bg-slate-900 transition-all placeholder:text-slate-500 focus:scale-[1.01]"
      placeholder={placeholder}
    />
  </div>
);

const DishChips = ({ dishes }) => {
  if (!dishes) return null;
  const items = dishes.split(',').map(d => d.trim()).filter(d => d);
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((item, idx) => (
        <span key={idx} className={`bg-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 animate-pop`} style={{ animationDelay: `${idx * 50}ms` }}>
          {item}
        </span>
      ))}
    </div>
  );
};

// --- MAIN APP ---

export default function FluxApp() {
  const [view, setView] = useState('LOGIN');
  const [role, setRole] = useState('STUDENT');
  const [userName, setUserName] = useState('');
  const [messViewMode, setMessViewMode] = useState('DAILY');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Data State
  const [cart, setCart] = useState([]);
  const [menu, setMenu] = useState([]);
  const [messWeek, setMessWeek] = useState({});
  const [notices, setNotices] = useState([]);
  const [skillGigs, setSkillGigs] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  // Ephemeral State
  const [activeOrder, setActiveOrder] = useState(null);
  const [messToken, setMessToken] = useState(null);

  // Notifications
  const [lastViewedNoticeCount, setLastViewedNoticeCount] = useState(0);
  const [lastViewedSkillCount, setLastViewedSkillCount] = useState(0);

  // Chat
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Inputs
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeUrl, setNewNoticeUrl] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [newSkillOffer, setNewSkillOffer] = useState('');
  const [newSkillWant, setNewSkillWant] = useState('');

  // Payment
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentSource, setPaymentSource] = useState('CART');
  const [isProcessing, setIsProcessing] = useState(false);

  // Login
  const [loginTab, setLoginTab] = useState('STUDENT');
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- API HANDLERS (Simulated Fetch Wrapper) ---

  const apiFetch = async (endpoint, options = {}) => {
    try {
      const res = await fetch(`/api${endpoint}`, options);
      if (!res.ok) {
        let errorMsg = 'API Error';
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch (e) { }
        throw new Error(errorMsg);
      }
      return await res.json();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    if (view === 'LOGIN') return;

    const loadData = async () => {
      // In a real app, these would be Promise.all
      const fetchedMenu = await apiFetch('/menu');
      if (fetchedMenu) setMenu(fetchedMenu);

      const fetchedMess = await apiFetch('/mess');
      if (fetchedMess) setMessWeek(fetchedMess);

      const fetchedNotices = await apiFetch('/notices');
      if (fetchedNotices) setNotices(fetchedNotices);

      const fetchedSkills = await apiFetch('/skills');
      if (fetchedSkills) setSkillGigs(fetchedSkills);

      const fetchedFeedbacks = await apiFetch('/feedbacks');
      if (fetchedFeedbacks) setFeedbacks(fetchedFeedbacks);
    };

    loadData();
  }, [view]);

  // Load user session details from localStorage (Persisting simple session)
  useEffect(() => {
    if (!userName) return;
    const userKey = `flux_user_${userName}`;
    const savedCart = localStorage.getItem(`${userKey}_cart`);
    if (savedCart) setCart(JSON.parse(savedCart));

    const savedViews = localStorage.getItem(`${userKey}_views`);
    if (savedViews) {
      const v = JSON.parse(savedViews);
      setLastViewedNoticeCount(v.notices || 0);
      setLastViewedSkillCount(v.skills || 0);
    }
  }, [userName]);

  // Persist local state
  useEffect(() => {
    if (!userName) return;
    const userKey = `flux_user_${userName}`;
    localStorage.setItem(`${userKey}_cart`, JSON.stringify(cart));
    localStorage.setItem(`${userKey}_views`, JSON.stringify({ notices: lastViewedNoticeCount, skills: lastViewedSkillCount }));
  }, [cart, userName, lastViewedNoticeCount, lastViewedSkillCount]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, view]);

  // --- NOTIFICATION LOGIC ---
  const hasNewNotices = role === 'STUDENT' && notices.length > lastViewedNoticeCount;

  const hasSkillNotifications = React.useMemo(() => {
    if (role !== 'STUDENT' || !userName) return false;
    const myTotalRequests = skillGigs
      .filter(g => g.createdBy === userName)
      .reduce((sum, g) => sum + (g.interactions ? g.interactions.length : 0), 0);
    return myTotalRequests > lastViewedSkillCount;
  }, [skillGigs, userName, lastViewedSkillCount, role]);

  useEffect(() => { if (view === 'NOTICES') setLastViewedNoticeCount(notices.length); }, [view, notices]);
  useEffect(() => {
    if (view === 'SKILLS' && role === 'STUDENT') {
      const myTotalRequests = skillGigs
        .filter(g => g.createdBy === userName)
        .reduce((sum, g) => sum + (g.interactions ? g.interactions.length : 0), 0);
      setLastViewedSkillCount(myTotalRequests);
    }
  }, [view, skillGigs]);

  // --- ACTIONS ---

  const handleLogin = async () => {
    setLoginError('');
    if (!loginId || !loginPass) {
      setLoginError('Please enter credentials');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginId, password: loginPass }),
      });

      if (res.ok) {
        const user = await res.json();
        setUserName(user.name);
        setRole(user.role);
        setView('HOME');
        setLoginId('');
        setLoginPass('');
      } else {
        const err = await res.json();
        setLoginError(err.error || 'Login Failed');
      }
    } catch (e) {
      setLoginError('Connection Error');
    }
  };

  const addToCart = (item) => { if (item.available) setCart([...cart, item]); };
  const removeFromCart = (index) => { const newCart = [...cart]; newCart.splice(index, 1); setCart(newCart); };
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // Skill Actions
  const postSkill = async () => {
    if (!newSkillOffer || !newSkillWant) return;
    const newGig = { offer: newSkillOffer, want: newSkillWant, student: userName, createdBy: userName, initial: userName[0], color: 'bg-blue-600' };

    // Optimistic Update
    setSkillGigs([{ ...newGig, id: Date.now(), interactions: [], reports: 0 }, ...skillGigs]);
    setNewSkillOffer(''); setNewSkillWant('');

    await apiFetch('/skills', { method: 'POST', body: JSON.stringify(newGig) });
  };

  const deleteSkill = async (id) => {
    if (!confirm('Delete this?')) return;
    setSkillGigs(skillGigs.filter(g => g.id !== id));
    await apiFetch(`/skills/${id}`, { method: 'DELETE' });
  };

  const connectSkill = async (id) => {
    setSkillGigs(skillGigs.map(g => g.id === id ? { ...g, interactions: [...(g.interactions || []), { user: userName, status: 'PENDING' }] } : g));
    alert('Request Sent!');
    await apiFetch(`/skills/${id}/connect`, { method: 'POST', body: JSON.stringify({ user: userName }) });
  };

  const acceptRequest = async (gigId, reqUser) => {
    setSkillGigs(skillGigs.map(g => {
      if (g.id === gigId) {
        return { ...g, interactions: g.interactions.map(i => i.user === reqUser ? { ...i, status: 'ACCEPTED' } : i) };
      }
      return g;
    }));
    await apiFetch(`/skills/${gigId}/accept`, { method: 'POST', body: JSON.stringify({ user: reqUser }) });
  };

  const openChat = (gigId, otherUser) => {
    const users = [userName, otherUser].sort();
    const chatId = `chat_${gigId}_${users[0]}_${users[1]}`;
    const savedMsgs = localStorage.getItem(chatId);
    setChatMessages(savedMsgs ? JSON.parse(savedMsgs) : []);
    setActiveChatId(chatId);
    setActiveChatUser(otherUser);
    setView('CHAT');
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !activeChatId) return;
    const newMsg = { id: Date.now(), sender: userName, text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const updatedMsgs = [...chatMessages, newMsg];
    setChatMessages(updatedMsgs);
    localStorage.setItem(activeChatId, JSON.stringify(updatedMsgs));
    setChatInput('');
  };

  // Admin Actions
  const addNewDish = async () => {
    if (!newDishName || !newDishPrice) return;
    const newItem = { name: newDishName, price: parseInt(newDishPrice), category: 'New', available: true };
    setMenu([{ ...newItem, id: Date.now() }, ...menu]);
    setNewDishName(''); setNewDishPrice('');
    await apiFetch('/menu', { method: 'POST', body: JSON.stringify(newItem) });
  };

  const toggleStock = async (id) => {
    const item = menu.find(i => i.id === id);
    setMenu(menu.map(i => i.id === id ? { ...i, available: !i.available } : i));
    await apiFetch(`/menu/${id}`, { method: 'PATCH', body: JSON.stringify({ available: !item.available }) });
  };

  const deleteDish = async (id) => {
    if (!confirm('Delete?')) return;
    setMenu(menu.filter(i => i.id !== id));
    await apiFetch(`/menu/${id}`, { method: 'DELETE' });
  };

  const postNotice = async () => {
    if (!newNoticeTitle) return;
    const newNotice = { title: newNoticeTitle, date: 'Today', imageUrl: newNoticeUrl || 'https://placehold.co/600x400', postedBy: 'Admin' };
    setNotices([{ ...newNotice, id: Date.now() }, ...notices]);
    setNewNoticeTitle(''); setNewNoticeUrl('');
    await apiFetch('/notices', { method: 'POST', body: JSON.stringify(newNotice) });
  };

  const submitFeedback = async (type) => {
    if (!feedbackInput.trim()) return;
    const newFeedback = { user: userName, type, message: feedbackInput, timestamp: 'Just now' };
    setFeedbacks([{ ...newFeedback, id: Date.now() }, ...feedbacks]);
    setFeedbackInput('');
    alert('Feedback Sent!');
    await apiFetch('/feedbacks', { method: 'POST', body: JSON.stringify(newFeedback) });
  };



  const reportSkill = async (id) => {
    if (!confirm('Report this post?')) return;
    setSkillGigs(skillGigs.map(g => g.id === id ? { ...g, reports: (g.reports || 0) + 1 } : g));
    await apiFetch(`/skills/${id}/report`, { method: 'POST' });
    alert('Report submitted to Admin.');
  };

  const initiatePayment = (amount, source) => { setPaymentAmount(amount); setPaymentSource(source); setView('PAYMENT'); };

  const completePayment = async () => {
    setIsProcessing(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));

    setIsProcessing(false);
    if (paymentSource === 'CART') {
      const orderData = { items: cart, total: paymentAmount, userId: userName };
      await apiFetch('/orders', { method: 'POST', body: JSON.stringify(orderData) });

      const newOrderCode = Math.floor(1000 + Math.random() * 9000);
      setActiveOrder({ id: newOrderCode, items: [...cart], total: paymentAmount });
      setCart([]); setView('SUCCESS');
    }
    else if (paymentSource === 'MESS_GUEST') {
      const guestToken = { id: `GUEST-${Math.floor(1000 + Math.random() * 9000)}`, type: 'GUEST', timestamp: Date.now() };
      setMessToken(guestToken); setView('MESS_QR_FULL');
    }
  };

  const getCurrentDayShort = () => new Date().toLocaleDateString('en-US', { weekday: 'short' });

  // --- VIEWS ---

  const renderLogin = () => (
    <div className="h-full flex flex-col p-8 animate-in fade-in animate-gradient text-white">
      <div className="flex-1 flex flex-col justify-center items-center text-center z-10">
        <h1 className="text-6xl font-black mb-2 tracking-tighter drop-shadow-lg">Flux</h1>
        <p className="text-lg font-medium text-slate-200 mb-10 tracking-wide">Flow through Campus Life</p>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] w-full max-w-sm border border-white/20 shadow-2xl mt-4">
          <div className="space-y-4 mb-6">
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Username"
              className="w-full h-14 bg-black/20 rounded-2xl px-4 text-white font-medium outline-none border-2 border-transparent focus:border-white/50 transition-all placeholder:text-white/40 text-center"
            />
            <input
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="Password"
              type="password"
              className="w-full h-14 bg-black/20 rounded-2xl px-4 text-white font-medium outline-none border-2 border-transparent focus:border-white/50 transition-all placeholder:text-white/40 text-center"
            />
            {loginError && <p className="text-red-300 font-bold text-xs text-center bg-red-900/40 p-2 rounded-lg animate-pop">{loginError}</p>}
          </div>

          <Button onClick={handleLogin} variant="contrast" className="w-full h-14 text-lg">Login</Button>
        </div>
      </div>

      <div className="pt-6 space-y-3 z-10 flex flex-col items-center">
        <button onClick={() => setView('GUEST_MESS')} className="bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-6 rounded-full w-full max-w-sm flex items-center justify-center gap-2 transition-all">
          <Utensils size={18} /> View Mess Menu (Guest)
        </button>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 pb-32">
      <div className="flex justify-between items-center">
        <div className="animate-slide-up delay-0"><h1 className="text-4xl font-black text-white tracking-tight">Hello, <br /><span className="text-blue-500">{userName.split(' ')[0]}</span></h1></div>
        <div className="flex gap-2">
          <div className="flex gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors animate-pop">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => { setView('LOGIN'); setLoginId(''); setLoginPass(''); setUserName(''); }} className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-red-500/20 hover:text-red-500 transition-colors animate-pop"><LogOut size={20} /></button>
          </div>
        </div>
      </div>

      {role === 'ADMIN' && <div className="bg-amber-500/10 border-2 border-amber-500/20 text-amber-500 p-4 rounded-2xl flex items-center gap-3 font-bold animate-pop"><Edit2 size={20} /> Edit Mode Active</div>}

      <div className="space-y-4">
        {role === 'STUDENT' && messToken && (
          <div onClick={() => setView('MESS_QR_FULL')} className="bg-blue-600 text-white p-5 rounded-3xl shadow-xl shadow-blue-600/20 cursor-pointer active:scale-95 transition-transform relative overflow-hidden animate-pop">
            <div className="relative z-10 flex justify-between items-start">
              <div><p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Pass Active</p><h2 className="text-2xl font-bold">{messToken.type === 'GUEST' ? 'Guest Pass' : 'Mess Token'}</h2></div>
              <div className="bg-white/20 p-2 rounded-xl"><QrCode className="text-white" size={32} /></div>
            </div>
          </div>
        )}

        {role === 'STUDENT' && activeOrder && (
          <div onClick={() => setView('SUCCESS')} className="bg-slate-800 text-white p-5 rounded-3xl shadow-xl shadow-black/20 cursor-pointer active:scale-95 transition-transform relative overflow-hidden animate-pop">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Ready for Pickup</p><h2 className="text-4xl font-black tracking-widest text-white">#{activeOrder.id}</h2></div>
                <Ticket size={32} className="text-slate-500" />
              </div>
              <div className="border-t border-slate-700 pt-3 flex justify-between items-center"><span className="text-slate-400 font-medium">{activeOrder.items.length} Items</span><span className="text-green-400 font-bold">PAID ₹{activeOrder.total}</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div onClick={() => setView('NOTICES')} className="col-span-2 h-28 bg-blue-600 rounded-[32px] p-6 text-white relative overflow-hidden cursor-pointer shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-transform flex items-center justify-between animate-slide-up delay-1">
          <div><h2 className="text-2xl font-black">Notices</h2><p className="text-blue-100 font-medium">Updates & News</p></div>
          <div className="bg-white/20 p-3 rounded-full relative">
            <Megaphone size={28} />
            {hasNewNotices && <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-500"></div>}
          </div>
          <Megaphone size={100} className="absolute -bottom-5 -left-5 opacity-20" />
        </div>

        <div onClick={() => setView('CANTEEN')} className="col-span-2 h-56 bg-gradient-to-br from-orange-500 to-orange-700 rounded-[32px] p-6 text-white relative overflow-hidden cursor-pointer shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-transform animate-slide-up delay-2">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div><div className="flex justify-between items-start"><h2 className="text-3xl font-black">Canteen</h2><div className="bg-white/20 p-2 rounded-full"><Coffee size={24} /></div></div></div>
            <Button variant="white" className="w-fit h-10 text-orange-600 bg-white">{role === 'ADMIN' ? 'Manage Menu' : 'Order Now'}</Button>
          </div>
          <Coffee size={200} className="absolute -bottom-10 -right-10 opacity-20 rotate-12" />
        </div>

        <div onClick={() => setView('MESS')} className="h-48 bg-emerald-600 rounded-[32px] p-5 text-white relative overflow-hidden cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform flex flex-col justify-between animate-slide-up delay-3">
          <div><h3 className="text-xl font-bold">Mess Hall</h3><p className="text-emerald-100 text-sm">Menu & Tokens</p></div>
          <div className="self-end bg-white/20 p-2 rounded-full"><Utensils size={20} /></div>
          <Utensils size={120} className="absolute -bottom-5 -left-5 opacity-20" />
        </div>

        <div onClick={() => setView('SKILLS')} className="h-48 bg-blue-500 rounded-[32px] p-5 text-white relative overflow-hidden cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform flex flex-col justify-between animate-slide-up delay-4">
          <div><h3 className="text-xl font-bold">Skill Swap</h3><p className="text-blue-100 text-sm">{role === 'ADMIN' ? 'Moderate Content' : 'Learn & Teach'}</p></div>
          <div className="self-end bg-white/20 p-2 rounded-full relative">
            <BookOpen size={20} />
            {hasSkillNotifications && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-500"></div>}
          </div>
          <BookOpen size={120} className="absolute -bottom-5 -left-5 opacity-20" />
        </div>
      </div>
    </div>
  );

  const renderNotices = () => (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right relative z-10">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setView('HOME')} className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-white"><ArrowLeft /></button>
        <h2 className="text-3xl font-black text-white">Notices</h2>
      </div>
      {role === 'ADMIN' && (
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 mb-6 animate-pop">
          <h3 className="font-bold text-white mb-3">Post New Notice</h3>
          <div className="space-y-3"><Input value={newNoticeTitle} onChange={(e) => setNewNoticeTitle(e.target.value)} placeholder="Notice Title" className="h-12" /><div className="flex gap-2"><Input value={newNoticeUrl} onChange={(e) => setNewNoticeUrl(e.target.value)} placeholder="Image URL (optional)" className="h-12" /><Button onClick={postNotice} className="h-14 w-14 !p-0"><Send size={20} /></Button></div></div>
        </div>
      )}
      <div className="space-y-6 overflow-y-auto pb-20">
        {notices.map((notice, idx) => (
          <div key={notice.id} className="bg-slate-900 rounded-[32px] overflow-hidden shadow-lg border border-slate-800 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="h-40 bg-slate-800 relative">
              <img src={notice.imageUrl} alt={notice.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">{notice.date}</div>
            </div>
            <div className="p-5"><h3 className="text-xl font-bold text-white leading-tight">{notice.title}</h3><p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-wide">Posted by {notice.postedBy}</p></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCanteen = () => (
    <div className="p-6 space-y-6 pb-32 animate-in slide-in-from-right">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('HOME')} className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-white"><ArrowLeft /></button>
          <h2 className="text-3xl font-black text-white">Menu</h2>
        </div>
        {role === 'STUDENT' && cart.length > 0 && <Button variant="secondary" onClick={() => setView('CART')} className="h-10 text-sm px-4 animate-pop"><ShoppingBag size={18} /> {cart.length}</Button>}
      </div>

      {role === 'ADMIN' && (
        <div className="bg-slate-900 p-6 rounded-3xl text-white mb-8 shadow-xl animate-pop border border-slate-800">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Plus size={20} className="text-blue-400" /> Add New Dish</h3>
          <div className="flex flex-col gap-4">
            <input value={newDishName} onChange={(e) => setNewDishName(e.target.value)} placeholder="Dish Name e.g., Butter Chicken" className="w-full bg-slate-800 rounded-2xl px-4 h-14 outline-none border-2 border-slate-700 focus:border-blue-500 transition-colors text-lg" />
            <div className="flex gap-4">
              <div className="relative flex-1"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span><input value={newDishPrice} onChange={(e) => setNewDishPrice(e.target.value)} placeholder="Price" type="number" className="w-full bg-slate-800 rounded-2xl pl-8 pr-4 h-14 outline-none border-2 border-slate-700 focus:border-blue-500 transition-colors text-lg" /></div>
              <Button onClick={addNewDish} variant="secondary" className="h-14 w-20 !rounded-2xl flex-shrink-0"><Check size={24} /></Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {menu.map((item, idx) => (
          <Card key={item.id} className="flex items-center gap-4 !p-4" delay={idx}>
            <div className="flex-1">
              <h3 className={`text-lg font-bold text-white ${!item.available && 'opacity-50 line-through'}`}>{item.name}</h3>
              <p className="text-slate-400 text-sm font-medium">{item.category}</p>
              <div className="flex items-center gap-2 mt-2">
                {role === 'ADMIN' ? (
                  <div className="flex items-center bg-slate-800 rounded-lg px-2 border-2 border-transparent focus-within:border-blue-500 transition-colors"><span className="text-slate-400 text-sm">₹</span><input type="number" defaultValue={item.price} className="w-14 bg-transparent outline-none font-bold text-lg text-white ml-1" /></div>
                ) : (<span className="font-bold text-lg text-white">₹{item.price}</span>)}
                {!item.available && <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-2 py-1 rounded-md">SOLD OUT</span>}
              </div>
            </div>
            {role === 'ADMIN' ? (
              <div className="flex flex-col gap-2">
                <button onClick={() => toggleStock(item.id)} className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${item.available ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {item.available ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <button onClick={() => deleteDish(item.id)} className="h-10 w-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18} /></button>
              </div>
            ) : (
              <button onClick={() => addToCart(item)} disabled={!item.available} className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${item.available ? 'bg-white text-black shadow-md' : 'bg-slate-800 text-slate-600'}`}><Plus size={24} /></button>
            )}
          </Card>
        ))}
      </div>
      <div className="pt-6 border-t font-bold border-white/10"><h3 className="text-lg font-bold text-white mb-4">Feedback</h3>{role === 'STUDENT' ? (<div className="bg-slate-900 p-4 rounded-2xl border-2 border-slate-800"><textarea value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} placeholder="Food quality, taste, hygiene..." className="w-full bg-transparent outline-none text-white font-medium mb-3 h-20 resize-none placeholder:text-slate-400" /><div className="flex justify-end"><Button variant="secondary" onClick={() => submitFeedback('CANTEEN')} className="h-10 text-sm px-4"><Send size={16} /> Send</Button></div></div>) : (<div className="space-y-3">{feedbacks.filter(f => f.type === 'CANTEEN').length === 0 && <p className="text-slate-400 font-medium text-center py-4">No feedbacks yet.</p>}{feedbacks.filter(f => f.type === 'CANTEEN').map(f => (<div key={f.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm"><div className="flex justify-between items-center mb-1"><span className="font-bold text-blue-500">{f.user}</span><span className="text-xs text-slate-400">{f.timestamp}</span></div><p className="text-slate-300 font-medium">{f.message}</p></div>))}</div>)}</div>
    </div>
  );

  const renderDailyMessView = () => {
    const dayShort = getCurrentDayShort();
    const todayMenu = messWeek[dayShort];
    if (!todayMenu) return <p className="text-center text-slate-500 py-8">Menu not available for today.</p>;
    return (
      <div className="space-y-4">
        <div className="bg-slate-900 p-5 rounded-[24px] border border-slate-800 shadow-sm relative overflow-hidden animate-slide-up delay-1">
          <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-3"><div className="bg-orange-500/20 p-2 rounded-xl text-orange-500"><Sunrise size={20} /></div><h3 className="text-xl font-bold text-white">Breakfast</h3></div><span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded-md">&lt; 9:00 AM</span></div>
          <DishChips dishes={todayMenu.breakfast} />
        </div>
        <div className="bg-slate-900 p-5 rounded-[24px] border border-slate-800 shadow-sm relative overflow-hidden animate-slide-up delay-2">
          <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-3"><div className="bg-yellow-500/20 p-2 rounded-xl text-yellow-500"><Sun size={20} /></div><h3 className="text-xl font-bold text-white">Lunch</h3></div><span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded-md">12:00 - 14:00</span></div>
          <DishChips dishes={todayMenu.lunch} />
        </div>
        <div className="bg-slate-900 p-5 rounded-[24px] border border-slate-800 shadow-sm relative overflow-hidden animate-slide-up delay-3">
          <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-3"><div className="bg-blue-500/20 p-2 rounded-xl text-blue-500"><Moon size={20} /></div><h3 className="text-xl font-bold text-white">Dinner</h3></div><span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded-md">From 19:30</span></div>
          <DishChips dishes={todayMenu.dinner} />
        </div>
      </div>
    );
  };

  const renderMess = () => (
    <div className="p-6 space-y-6 pb-32 animate-in slide-in-from-right overflow-x-hidden">
      <div className="flex items-center gap-4">
        <button onClick={() => setView('HOME')} className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-white"><ArrowLeft /></button>
        <h2 className="text-3xl font-black text-white">Mess Hall</h2>
      </div>

      {role === 'STUDENT' && (
        <div className="bg-blue-600 text-white rounded-[32px] p-6 shadow-xl shadow-blue-600/30 animate-pop">
          <div className="flex justify-between items-start mb-6">
            <div><h2 className="text-2xl font-bold">Mess Access</h2><div className="flex items-center gap-2 mt-1 text-blue-200 text-sm font-medium"><WifiOff size={16} /> <span>Offline Mode Ready</span></div></div>
            <div className="bg-white/10 p-2 rounded-xl"><QrCode className="text-white" size={32} /></div>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => initiatePayment(60, 'MESS_GUEST')}
              className="w-full bg-white text-black font-bold hover:bg-gray-200 shadow-none"
            >
              Buy Guest Meal (₹60)
            </Button>
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-white">Weekly Menu</h3>
          </div>
          <div className="flex bg-slate-800 p-1 rounded-xl">
            <button onClick={() => setMessViewMode('DAILY')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${messViewMode === 'DAILY' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400'}`}>Daily</button>
            <button onClick={() => setMessViewMode('WEEKLY')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${messViewMode === 'WEEKLY' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400'}`}>Weekly</button>
          </div>
        </div>
        {messViewMode === 'DAILY' ? renderDailyMessView() : (
          <div className="overflow-x-auto pb-4 -mx-6 px-6 animate-slide-up">
            {role === 'ADMIN' && <p className="text-xs font-bold text-amber-500 mb-2 bg-amber-500/10 p-2 rounded-lg inline-block">Tip: Click on cells to edit menu items (comma separated).</p>}
            <table className="w-full min-w-[600px] border-collapse table-fixed">
              <thead>
                <tr>
                  <th className="text-left p-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 w-20">Day</th>
                  <th className="text-left p-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Breakfast</th>
                  <th className="text-left p-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Lunch</th>
                  <th className="text-left p-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Dinner</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(messWeek).map(([day, meals]) => (
                  <tr key={day} className="border-b border-slate-800 last:border-0 bg-slate-900">
                    <td className="p-3 font-black text-blue-500 align-top">{day}</td>
                    {['breakfast', 'lunch', 'dinner'].map((type) => (
                      <td key={type} className="p-3 align-top">
                        {role === 'ADMIN' ? (
                          <textarea defaultValue={meals[type]} className="w-full bg-slate-800 rounded-lg px-2 py-2 text-sm font-medium text-white border-2 border-transparent focus:border-blue-500 outline-none resize-none h-24 leading-tight" />
                        ) : (<DishChips dishes={meals[type]} />)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="pt-6 border-t font-bold border-white/10"><h3 className="text-lg font-bold text-white mb-4">Feedback</h3>{role === 'STUDENT' ? (<div className="bg-slate-900 p-4 rounded-2xl border-2 border-slate-800"><textarea value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} placeholder="Report hygiene or quality issues..." className="w-full bg-transparent outline-none text-white font-medium mb-3 h-20 resize-none placeholder:text-slate-400" /><div className="flex justify-end"><Button variant="secondary" onClick={() => submitFeedback('MESS')} className="h-10 text-sm px-4"><Send size={16} /> Send</Button></div></div>) : (<div className="space-y-3">{feedbacks.filter(f => f.type === 'MESS').length === 0 && <p className="text-slate-400 font-medium text-center py-4">No feedbacks yet.</p>}{feedbacks.filter(f => f.type === 'MESS').map(f => (<div key={f.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm"><div className="flex justify-between items-center mb-1"><span className="font-bold text-blue-500">{f.user}</span><span className="text-xs text-slate-400">{f.timestamp}</span></div><p className="text-slate-300 font-medium">{f.message}</p></div>))}</div>)}</div>
    </div>
  );

  const renderChat = () => (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="bg-slate-900 p-4 flex items-center gap-3 shadow-sm z-10 animate-slide-up border-b border-slate-800">
        <button onClick={() => setView('SKILLS')} className="h-10 w-10 rounded-full hover:bg-slate-800 flex items-center justify-center text-white"><ArrowLeft /></button>
        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">{activeChatUser[0]}</div>
        <div className="flex-1">
          <h3 className="font-bold text-white leading-tight">{activeChatUser}</h3>
          <p className="text-xs text-slate-400">Student</p>
        </div>
        <button onClick={() => alert('User Reported to Admin')} className="h-10 w-10 text-slate-400 hover:text-red-500"><Flag size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 && <p className="text-center text-slate-500 text-sm mt-10">Start the conversation...</p>}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === userName ? 'justify-end' : 'justify-start'} animate-pop`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.sender === userName ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-900 text-slate-200 rounded-bl-none shadow-sm border border-slate-800'}`}>
              <p>{msg.text}</p>
              <p className={`text-[10px] mt-1 text-right ${msg.sender === userName ? 'text-blue-200' : 'text-slate-400'}`}>{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-slate-900 p-3 flex gap-2 items-center border-t border-slate-800">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-slate-800 rounded-full px-4 h-12 outline-none text-white placeholder:text-slate-500 border border-slate-700 focus:border-blue-500 transition-colors"
        />
        <button onClick={sendMessage} className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-colors animate-pop">
          <Send size={20} />
        </button>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="p-6 space-y-6 pb-32 animate-in slide-in-from-right">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('HOME')} className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-white"><ArrowLeft /></button>
          <h2 className="text-3xl font-black text-white">{role === 'ADMIN' ? 'Moderation Queue' : 'Skill Swap'}</h2>
        </div>
      </div>

      {role === 'STUDENT' && (
        <div className="bg-slate-900 p-5 rounded-3xl text-white mb-6 animate-pop border border-slate-800">
          <h3 className="font-bold mb-3 flex items-center gap-2"><UserPlus size={20} /> Offer a Skill</h3>
          <div className="flex flex-col gap-3">
            <input value={newSkillOffer} onChange={(e) => setNewSkillOffer(e.target.value)} placeholder="What can you teach? (e.g. Guitar)" className="bg-slate-800 rounded-xl px-4 h-12 outline-none border border-slate-700 focus:border-white transition-colors text-white placeholder:text-slate-500" />
            <div className="flex gap-3">
              <input value={newSkillWant} onChange={(e) => setNewSkillWant(e.target.value)} placeholder="What do you want to learn?" className="flex-1 bg-slate-800 rounded-xl px-4 h-12 outline-none border border-slate-700 focus:border-white transition-colors text-white placeholder:text-slate-500" />
              <button onClick={postSkill} className="bg-blue-600 text-white h-12 w-14 rounded-xl flex items-center justify-center font-bold hover:bg-blue-500 transition-colors"><Send size={20} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN: SORT BY REPORTS */}
      <div className="grid gap-4">
        {[...skillGigs].sort((a, b) => role === 'ADMIN' ? b.reports - a.reports : 0).map((gig, idx) => {
          const isOwner = gig.createdBy === userName;
          const interactions = gig.interactions || [];
          const hasPending = isOwner && interactions.some(i => i.status === 'PENDING');
          const myRequest = interactions.find(i => i.user === userName);
          const isAccepted = myRequest?.status === 'ACCEPTED';

          return (
            <Card key={gig.id} delay={idx} className={`flex flex-col gap-4 relative overflow-hidden ${hasPending ? 'border-2 border-amber-500/50 bg-amber-500/10' : ''} ${gig.reports > 0 && role === 'ADMIN' ? 'border-2 border-red-500 bg-red-500/10' : ''}`}>
              {hasPending && <div className="absolute top-0 right-0 bg-amber-500 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1"><Bell size={10} /> NEW REQUEST</div>}
              {gig.reports > 0 && role === 'ADMIN' && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1"><Flag size={10} /> REPORTED ({gig.reports})</div>}

              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full ${gig.color.replace('indigo', 'blue')} flex items-center justify-center text-white font-bold text-xl`}>{gig.initial}</div>
                <div><h3 className="font-bold text-white text-lg">{gig.offer}</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-wide">By {gig.student}</p></div>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl text-sm font-medium text-slate-300">Looking for: <span className="text-blue-400 font-bold">{gig.want}</span></div>

              {/* ACTION AREA */}
              {role === 'ADMIN' ? (
                <Button variant="danger" onClick={() => deleteSkill(gig.id)} className="h-10 text-sm w-full">Delete Post</Button>
              ) : isOwner ? (
                <div className="flex flex-col gap-2">
                  {interactions.length > 0 && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Requests</p>
                      <div className="space-y-2">
                        {interactions.map((i, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{i.user}</span>
                            </div>
                            {i.status === 'ACCEPTED' ? (
                              <button onClick={() => openChat(gig.id, i.user)} className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-bold flex gap-1 items-center"><MessageCircle size={14} /> Chat</button>
                            ) : (
                              <button onClick={() => acceptRequest(gig.id, i.user)} className="bg-white text-black px-3 py-1 rounded-lg text-xs font-bold">Accept</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button variant="outline" onClick={() => deleteSkill(gig.id)} className="h-10 text-sm w-full border-red-500/20 text-red-500 hover:border-red-500 hover:bg-red-500 hover:text-white">Delete Post</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {isAccepted && (
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-center">
                      <p className="text-xs font-bold text-green-400 uppercase mb-2">Request Accepted!</p>
                      <Button variant="success" onClick={() => openChat(gig.id, gig.student)} className="h-10 w-full text-sm font-bold">
                        <MessageCircle size={16} /> Open Chat with {gig.student}
                      </Button>
                    </div>
                  )}
                  {!isAccepted && (
                    <div className="flex gap-2">
                      <Button
                        variant={myRequest ? "tonal" : "secondary"}
                        onClick={() => !myRequest && connectSkill(gig.id)}
                        className="h-10 text-sm flex-1 font-bold"
                        disabled={!!myRequest}
                      >
                        {myRequest?.status === 'PENDING' ? 'Pending...' : 'Connect'}
                      </Button>
                      <button onClick={() => reportSkill(gig.id)} className="h-10 w-10 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-red-500/10 hover:text-red-500"><Flag size={18} /></button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-bottom bg-slate-950">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('CANTEEN')} className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700"><ArrowLeft className="text-white" /></button>
        <h2 className="text-3xl font-black text-white">Your Cart</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {cart.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div><p className="font-bold text-white">{item.name}</p><p className="text-slate-400 font-medium">₹{item.price}</p></div>
            <button onClick={() => removeFromCart(idx)} className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20"><X size={16} /></button>
          </div>
        ))}
      </div>
      <div className="bg-slate-900 p-6 rounded-[32px] mt-4 text-white border border-slate-800">
        <div className="flex justify-between items-center mb-6"><span className="text-lg font-medium text-slate-400">Total</span><span className="text-4xl font-black">₹{cartTotal}</span></div>
        <Button onClick={() => initiatePayment(cartTotal, 'CART')} variant="white" className="w-full h-14 text-lg" disabled={cart.length === 0}>Proceed to Pay</Button>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-bottom bg-slate-950">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView(paymentSource === 'CART' ? 'CART' : 'MESS')} className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700"><ArrowLeft className="text-white" /></button>
        <h2 className="text-2xl font-bold text-white">Checkout</h2>
      </div>
      <div className="text-center mb-12"><p className="text-slate-400 font-medium mb-2">Amount to Pay</p><h1 className="text-6xl font-black text-white">₹{paymentAmount}</h1></div>
      <div className="space-y-3">
        {[{ icon: Smartphone, label: 'UPI / GPay', sub: 'Fastest' }, { icon: CreditCard, label: 'Card', sub: 'Credit / Debit' }].map((method, idx) => (
          <button key={idx} onClick={completePayment} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-800 hover:border-blue-500 hover:bg-slate-900 transition-all group bg-slate-900">
            <div className="h-12 w-12 rounded-full bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center text-white"><method.icon size={24} /></div>
            <div className="text-left"><p className="text-lg font-bold text-white">{method.label}</p><p className="text-sm font-medium text-slate-400">{method.sub}</p></div>
          </button>
        ))}
      </div>
      {isProcessing && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-50"><div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div><p className="mt-6 text-white font-bold text-lg">Processing Payment...</p></div>
      )}
    </div>
  );

  const renderSuccess = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in bg-slate-950">
      <div className="h-28 w-28 bg-green-500 rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-green-500/40 animate-pop"><Check size={56} strokeWidth={3} /></div>
      <h1 className="text-3xl font-black text-white mb-2">Order Confirmed!</h1>
      <p className="text-slate-400 font-medium mb-12">Please show this code at the counter.</p>
      {activeOrder && (
        <div className="bg-slate-900 px-10 py-12 rounded-[32px] shadow-xl w-full border border-slate-800 animate-slide-up">
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">Pickup Code</p>
          <h1 className="text-7xl font-black text-blue-500 tracking-widest">{activeOrder.id}</h1>
        </div>
      )}
      <div className="mt-12"><Button variant="ghost" onClick={() => setView('HOME')}>Return Home</Button></div>
    </div>
  );

  const renderMessQRFull = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in bg-blue-600 text-white">
      <h1 className="text-4xl font-black mb-2">{messToken?.type === 'GUEST' ? 'Guest Pass' : 'Mess Token'}</h1>
      <div className="flex items-center gap-2 opacity-80 mb-10 font-medium"><Clock size={20} /> Valid for 90 Minutes</div>
      <div className="bg-white p-8 rounded-[32px] shadow-2xl mb-10 animate-pop"><QrCode size={240} className="text-black" /></div>
      <p className="text-blue-200 font-medium max-w-[200px] leading-relaxed">Please scan this at the mess entrance.</p>
      <button onClick={() => setView('HOME')} className="absolute bottom-10 h-14 w-14 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 backdrop-blur-md"><X size={24} /></button>
    </div>
  );

  const renderGuestMess = () => (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right bg-slate-950">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('LOGIN')} className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700"><ArrowLeft className="text-white" /></button>
        <h2 className="text-2xl font-bold text-white">Daily Menu</h2>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto pb-6">
        <div className="bg-emerald-500/10 p-6 rounded-[28px] text-emerald-500 border border-emerald-500/20 mb-2">
          <h3 className="text-lg font-bold mb-1">Today's Special</h3>
          <p className="opacity-80 font-medium text-sm">Valid for: {new Date().toLocaleDateString()}</p>
        </div>
        {['breakfast', 'lunch', 'dinner'].map((type, idx) => (
          <div key={type} className="bg-slate-900 p-5 rounded-[24px] border border-slate-800 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2 block">{type}</span>
            <DishChips dishes={messWeek[getCurrentDayShort()]?.[type] || ''} />
          </div>
        ))}
      </div>
    </div>
  );

  // --- APP SHELL ---

  return (
    <div className={`min-h-screen flex items-center justify-center font-sans selection:bg-blue-500 selection:text-white ${isDarkMode ? 'bg-black' : 'bg-slate-100'}`}>
      <AnimationStyles />
      <div className={`w-full max-w-[412px] h-[860px] rounded-[40px] overflow-hidden shadow-2xl relative flex flex-col border-[8px] transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-900' : 'bg-white border-white'}`}>

        <main className={`flex-1 overflow-y-auto no-scrollbar transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
          {view === 'LOGIN' && renderLogin()}
          {view === 'GUEST_MESS' && renderGuestMess()}
          {view === 'HOME' && renderHome()}
          {view === 'CANTEEN' && renderCanteen()}
          {view === 'MESS' && renderMess()}
          {view === 'SKILLS' && renderSkills()}
          {view === 'CHAT' && renderChat()}
          {view === 'NOTICES' && renderNotices()}
          {view === 'CART' && renderCart()}
          {view === 'PAYMENT' && renderPayment()}
          {view === 'SUCCESS' && renderSuccess()}
          {view === 'MESS_QR_FULL' && renderMessQRFull()}
        </main>

        {/* Nav Removed */}
      </div>
    </div>
  );
}