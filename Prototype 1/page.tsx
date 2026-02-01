// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Coffee, Utensils, BookOpen, ShoppingBag, Plus, QrCode, WifiOff, Check, 
  Clock, User, LogOut, Edit2, CreditCard, Smartphone, Banknote, 
  ArrowLeft, Ticket, X, Trash2, SmartphoneNfc, Send, Megaphone, Image as ImageIcon, Save, Calendar, Sun, Moon, Sunrise, UserPlus, Bell, MessageCircle, Flag, CheckSquare, Square, AlertTriangle
} from 'lucide-react';

// --- DATA MODELS ---

type ViewState = 'LOGIN' | 'GUEST_MESS' | 'HOME' | 'CANTEEN' | 'MESS' | 'SKILLS' | 'NOTICES' | 'CART' | 'PAYMENT' | 'SUCCESS' | 'MESS_QR_FULL' | 'CHAT';
type UserRole = 'STUDENT' | 'ADMIN';
type PaymentSource = 'CART' | 'MESS_GUEST';
type MessViewMode = 'DAILY' | 'WEEKLY';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  available: boolean;
}

interface WeeklyMessMenu {
  [day: string]: {
    breakfast: string;
    lunch: string;
    dinner: string;
  }
}

interface Notice {
  id: number;
  title: string;
  date: string;
  imageUrl: string;
  postedBy: string;
}

interface Interaction {
  user: string;
  status: 'PENDING' | 'ACCEPTED';
}

interface SkillGig {
  id: number;
  student: string;
  createdBy: string;
  offer: string;
  want: string;
  initial: string;
  color: string;
  interactions: Interaction[];
  reports: number;
}

interface Order {
  id: number;
  items: MenuItem[];
  total: number;
  timestamp: string;
}

interface MessToken {
  id: string;
  type: 'STUDENT' | 'GUEST';
  timestamp: number;
  expiry: number;
}

interface Feedback {
  id: number;
  user: string;
  type: 'CANTEEN' | 'MESS';
  message: string;
  timestamp: string;
}

interface StudentProfile {
  password: string;
  batch: string;
  year: string;
}

interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  time: string;
}

// --- CONSTANTS ---

const STUDENT_DB: Record<string, StudentProfile> = {
  'Vardaan': { password: '1234', batch: 'CSE - B2', year: '1st Year' },
  'Kunal': { password: '4567', batch: 'ECE - A1', year: '2nd Year' },
  'Ripunjay': { password: '7890', batch: 'IT - C3', year: '1st Year' }
};

const ADMIN_PASS = '1234';

const INITIAL_MENU: MenuItem[] = [
  { id: 1, name: 'Spicy Paneer Wrap', price: 85, category: 'Snacks', available: true },
  { id: 2, name: 'Egg Fried Rice', price: 90, category: 'Lunch', available: true },
  { id: 3, name: 'Cold Coffee', price: 60, category: 'Drinks', available: true },
  { id: 4, name: 'Veg Burger', price: 45, category: 'Snacks', available: true },
  { id: 5, name: 'Samosa (2pcs)', price: 30, category: 'Snacks', available: false },
];

const INITIAL_WEEKLY_MESS: WeeklyMessMenu = {
  'Mon': { breakfast: 'Mix Veg Parantha, Dahi, Achar, Tea', lunch: 'Kadai Veg, Arhar Dal, Rice, Roti, Salad', dinner: 'Chole, Veg Fried Rice, Roti, Salad, Milk' },
  'Tue': { breakfast: 'Uttapam, Coconut Chutney, Sambar', lunch: 'Lauki Ki Sabji, Rajma, Rice, Roti, Boondi Raita', dinner: 'Aloo Matar, Masoor Dal, Rice, Roti, Milk' },
  'Wed': { breakfast: 'Chana Masala, Puri, Halwa', lunch: 'Matar Paneer, Veg Khichdi, Dahi, Papad', dinner: 'Methi Aloo, Chana Dal, Rice, Roti, Milk' },
  'Thu': { breakfast: 'Bread Pakoda, Butter Toast, Tea', lunch: 'Shimla Mirch Aloo, Kadhi Pakoda, Rice', dinner: 'Malai Kofta, Moong Dal, Jeera Rice, Roti' },
  'Fri': { breakfast: 'Veg Sandwich, French Toast, Coffee', lunch: 'Gobhi Matar, Dal Makhani, Rice, Roti', dinner: 'Veg Chowmien, Manchurian, Fried Rice' },
  'Sat': { breakfast: 'Aloo Paratha, Curd, Pickle', lunch: 'Khichdi, Baingan Bharta, Dahi', dinner: 'Kofta Curry, Rice, Roti, Kheer' },
  'Sun': { breakfast: 'Chole Bhature, Lassi', lunch: 'Veg Pulao, Raita, Paneer Butter Masala', dinner: 'Special Thali, Sweet Dish, Milk' },
};

const INITIAL_NOTICES: Notice[] = [
  { id: 1, title: 'Exam Schedule Released', date: '12 Jan', imageUrl: 'https://placehold.co/600x400/indigo/white?text=Exam+Schedule', postedBy: 'Admin' },
  { id: 2, title: 'Annual Fest Registration', date: '10 Jan', imageUrl: 'https://placehold.co/600x400/orange/white?text=Fest+2026', postedBy: 'Admin' }
];

const INITIAL_SKILLS: SkillGig[] = [
  { id: 1, student: 'Vardaan', createdBy: 'Vardaan', offer: 'Video Editing', want: 'Calculus Help', initial: 'V', color: 'bg-pink-500', interactions: [], reports: 0 },
  { id: 2, student: 'Kunal', createdBy: 'Kunal', offer: 'Guitar Basics', want: 'Python Help', initial: 'K', color: 'bg-purple-500', interactions: [], reports: 0 },
];

// --- ANIMATION STYLES (INJECTED) ---
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
      background: linear-gradient(-45deg, #0f172a, #312e81, #4c1d95, #1e1b4b);
      background-size: 400% 400%;
      animation: gradientBG 10s ease infinite;
    }
    
    /* Stagger Delays */
    .delay-0 { animation-delay: 0ms; }
    .delay-1 { animation-delay: 80ms; }
    .delay-2 { animation-delay: 160ms; }
    .delay-3 { animation-delay: 240ms; }
    .delay-4 { animation-delay: 320ms; }
    .delay-5 { animation-delay: 400ms; }
  `}</style>
);

// --- POPPY COMPONENTS ---

const Card = ({ children, className = '', onClick, delay = 0 }: any) => (
  <div 
    onClick={onClick} 
    className={`bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] animate-slide-up ${className}`}
    style={{ animationDelay: `${delay * 50}ms` }}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyle = "h-12 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-90 disabled:opacity-50 disabled:scale-100";
  const variants = {
    primary: "bg-black text-white shadow-lg shadow-black/20 hover:bg-slate-800 hover:shadow-xl", 
    secondary: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/50",
    tonal: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    outline: "border-2 border-slate-200 text-slate-700 hover:border-black",
    ghost: "text-indigo-600 hover:bg-indigo-50",
    danger: "bg-red-500 text-white shadow-lg shadow-red-500/30",
    white: "bg-white text-indigo-900 shadow-md hover:bg-slate-50",
    success: "bg-green-500 text-white shadow-lg shadow-green-500/30",
    contrast: "bg-white text-black shadow-lg hover:bg-gray-100" // New high contrast
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, type = "text", className="" }: any) => (
  <div className={`w-full relative group ${className}`}>
    <input 
      type={type}
      value={value}
      onChange={onChange}
      className="w-full h-14 bg-slate-50 rounded-2xl px-4 text-slate-900 font-medium outline-none border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 focus:scale-[1.01]" 
      placeholder={placeholder}
    />
  </div>
);

const DishChips = ({ dishes }: { dishes: string }) => {
  if (!dishes) return null;
  const items = dishes.split(',').map(d => d.trim()).filter(d => d);
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((item, idx) => (
        <span key={idx} className={`bg-slate-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 animate-pop`} style={{ animationDelay: `${idx * 50}ms` }}>
          {item}
        </span>
      ))}
    </div>
  );
};

// --- MAIN APP ---

export default function CampusPulsePoppy() {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [userName, setUserName] = useState('');
  const [messViewMode, setMessViewMode] = useState<MessViewMode>('DAILY');
  
  // Data State
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [messWeek, setMessWeek] = useState<WeeklyMessMenu>(INITIAL_WEEKLY_MESS);
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES);
  const [skillGigs, setSkillGigs] = useState<SkillGig[]>(INITIAL_SKILLS);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [messToken, setMessToken] = useState<MessToken | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  
  // Notification State (Stored per user)
  const [lastViewedNoticeCount, setLastViewedNoticeCount] = useState(0);
  const [lastViewedSkillCount, setLastViewedSkillCount] = useState(0);
  
  // Chat State
  const [activeChatId, setActiveChatId] = useState<string | null>(null); 
  const [activeChatUser, setActiveChatUser] = useState<string>(''); 
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Input States
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeUrl, setNewNoticeUrl] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [newSkillOffer, setNewSkillOffer] = useState('');
  const [newSkillWant, setNewSkillWant] = useState('');

  // Payment State
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('CART');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Login State
  const [loginTab, setLoginTab] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- LOCAL STORAGE MANAGER ---

  const getKeys = (user: string) => ({
    cart: `cp_cart_${user}`,
    order: `cp_order_${user}`,
    token: `cp_token_${user}`,
    views: `cp_views_${user}` // For tracking read receipts
  });

  useEffect(() => {
    const savedMenu = localStorage.getItem('cp_global_menu'); if (savedMenu) setMenu(JSON.parse(savedMenu));
    const savedMess = localStorage.getItem('cp_global_mess_week_v2'); if (savedMess) setMessWeek(JSON.parse(savedMess));
    const savedNotices = localStorage.getItem('cp_global_notices'); if (savedNotices) setNotices(JSON.parse(savedNotices));
    const savedSkills = localStorage.getItem('cp_global_skills_v6'); if (savedSkills) setSkillGigs(JSON.parse(savedSkills));
    const savedFeedbacks = localStorage.getItem('cp_global_feedbacks'); if (savedFeedbacks) setFeedbacks(JSON.parse(savedFeedbacks));
  }, []);

  useEffect(() => {
    if (!userName) return;
    const keys = getKeys(userName);
    const savedCart = localStorage.getItem(keys.cart); setCart(savedCart ? JSON.parse(savedCart) : []);
    const savedOrder = localStorage.getItem(keys.order); setActiveOrder(savedOrder ? JSON.parse(savedOrder) : null);
    const savedToken = localStorage.getItem(keys.token); setMessToken(savedToken ? JSON.parse(savedToken) : null);
    
    // Load viewed counts
    const savedViews = localStorage.getItem(keys.views);
    if (savedViews) {
      const views = JSON.parse(savedViews);
      setLastViewedNoticeCount(views.notices || 0);
      setLastViewedSkillCount(views.skills || 0);
    }
  }, [userName]);

  useEffect(() => { localStorage.setItem('cp_global_menu', JSON.stringify(menu)); }, [menu]);
  useEffect(() => { localStorage.setItem('cp_global_mess_week_v2', JSON.stringify(messWeek)); }, [messWeek]);
  useEffect(() => { localStorage.setItem('cp_global_notices', JSON.stringify(notices)); }, [notices]);
  useEffect(() => { localStorage.setItem('cp_global_skills_v6', JSON.stringify(skillGigs)); }, [skillGigs]);
  useEffect(() => { localStorage.setItem('cp_global_feedbacks', JSON.stringify(feedbacks)); }, [feedbacks]);

  useEffect(() => {
    if (!userName) return;
    const keys = getKeys(userName);
    localStorage.setItem(keys.cart, JSON.stringify(cart));
    if (activeOrder) localStorage.setItem(keys.order, JSON.stringify(activeOrder)); else localStorage.removeItem(keys.order);
    if (messToken) localStorage.setItem(keys.token, JSON.stringify(messToken)); else localStorage.removeItem(keys.token);
    
    // Save views
    localStorage.setItem(keys.views, JSON.stringify({ notices: lastViewedNoticeCount, skills: lastViewedSkillCount }));
  }, [cart, activeOrder, messToken, userName, lastViewedNoticeCount, lastViewedSkillCount]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, view]);

  // --- NOTIFICATION LOGIC ---
  
  // Clear Notice Red Dot when visiting notices
  useEffect(() => {
    if (view === 'NOTICES' && role === 'STUDENT') {
      setLastViewedNoticeCount(notices.length);
    }
  }, [view, notices]);

  // Clear Skill Red Dot when visiting skills
  useEffect(() => {
    if (view === 'SKILLS' && role === 'STUDENT') {
      // Calculate total pending requests for this user
      const myTotalRequests = skillGigs
        .filter(g => g.createdBy === userName)
        .reduce((sum, g) => sum + g.interactions.length, 0);
      setLastViewedSkillCount(myTotalRequests);
    }
  }, [view, skillGigs]);

  const hasNewNotices = role === 'STUDENT' && notices.length > lastViewedNoticeCount;
  
  const hasSkillNotifications = React.useMemo(() => {
    if (role !== 'STUDENT' || !userName) return false;
    const currentTotalRequests = skillGigs
      .filter(g => g.createdBy === userName)
      .reduce((sum, g) => sum + g.interactions.length, 0);
    return currentTotalRequests > lastViewedSkillCount;
  }, [skillGigs, userName, lastViewedSkillCount, role]);


  const resetApp = () => {
    localStorage.clear();
    setMenu(INITIAL_MENU);
    setMessWeek(INITIAL_WEEKLY_MESS);
    setNotices(INITIAL_NOTICES);
    setSkillGigs(INITIAL_SKILLS);
    setActiveOrder(null);
    setMessToken(null);
    setCart([]);
    setFeedbacks([]);
    alert('System Reset! All users cleared.');
  };

  // --- LOGIC ---

  const addToCart = (item: MenuItem) => { if (item.available) setCart([...cart, item]); };
  const removeFromCart = (index: number) => { const newCart = [...cart]; newCart.splice(index, 1); setCart(newCart); };
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // --- SKILL & CHAT LOGIC ---
  const postSkill = () => {
    if (!newSkillOffer || !newSkillWant) return;
    const newGig: SkillGig = {
      id: Date.now(),
      student: userName,
      createdBy: userName, 
      offer: newSkillOffer,
      want: newSkillWant,
      initial: userName[0],
      color: `bg-${['pink','purple','indigo','blue','orange'][Math.floor(Math.random()*5)]}-500`,
      interactions: [],
      reports: 0
    };
    setSkillGigs([newGig, ...skillGigs]); setNewSkillOffer(''); setNewSkillWant('');
  };

  const deleteSkill = (id: number) => { if (confirm('Delete this skill post?')) setSkillGigs(skillGigs.filter(g => g.id !== id)); };
  const reportSkill = (id: number) => { if (confirm('Report this post to Admin?')) { setSkillGigs(skillGigs.map(g => g.id === id ? { ...g, reports: g.reports + 1 } : g)); alert('Post Reported.'); }};

  const connectSkill = (id: number) => {
    setSkillGigs(skillGigs.map(g => {
      if (g.id === id && !g.interactions.find(i => i.user === userName)) {
        return { ...g, interactions: [...g.interactions, { user: userName, status: 'PENDING' }] };
      }
      return g;
    }));
    alert('Request Sent! Waiting for acceptance.');
  };

  const acceptRequest = (gigId: number, reqUser: string) => {
    setSkillGigs(skillGigs.map(g => {
      if (g.id === gigId) {
        const updatedInteractions = g.interactions.map(i => i.user === reqUser ? { ...i, status: 'ACCEPTED' as const } : i);
        return { ...g, interactions: updatedInteractions };
      }
      return g;
    }));
  };

  const openChat = (gigId: number, otherUser: string) => {
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
    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: userName,
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedMsgs = [...chatMessages, newMsg];
    setChatMessages(updatedMsgs);
    localStorage.setItem(activeChatId, JSON.stringify(updatedMsgs));
    setChatInput('');
  };

  // --- ADMIN LOGIC ---
  const addNewDish = () => { if (!newDishName || !newDishPrice) return; const newItem: MenuItem = { id: Date.now(), name: newDishName, price: parseInt(newDishPrice), category: 'New', available: true }; setMenu([newItem, ...menu]); setNewDishName(''); setNewDishPrice(''); };
  const deleteDish = (id: number) => { if (confirm('Remove this dish?')) setMenu(menu.filter(item => item.id !== id)); };
  const updatePrice = (id: number, newPrice: string) => { const price = parseInt(newPrice); if (!isNaN(price)) setMenu(menu.map(item => item.id === id ? { ...item, price } : item)); };
  const updateMessCell = (day: string, type: 'breakfast' | 'lunch' | 'dinner', value: string) => { setMessWeek({ ...messWeek, [day]: { ...messWeek[day], [type]: value } }); };
  const getCurrentDayShort = () => new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const postNotice = () => { if (!newNoticeTitle) return; const newNotice: Notice = { id: Date.now(), title: newNoticeTitle, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), imageUrl: newNoticeUrl || 'https://placehold.co/600x400/000000/FFF?text=Notice', postedBy: 'Admin' }; setNotices([newNotice, ...notices]); setNewNoticeTitle(''); setNewNoticeUrl(''); };

  const initiatePayment = (amount: number, source: PaymentSource) => { setPaymentAmount(amount); setPaymentSource(source); setView('PAYMENT'); };
  const completePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (paymentSource === 'CART') {
        const newOrderCode = Math.floor(1000 + Math.random() * 9000);
        setActiveOrder({ id: newOrderCode, items: [...cart], total: paymentAmount, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        setCart([]); setView('SUCCESS');
      } 
      else if (paymentSource === 'MESS_GUEST') {
        const now = Date.now();
        const guestToken: MessToken = { id: `GUEST-${Math.floor(1000 + Math.random() * 9000)}`, type: 'GUEST', timestamp: now, expiry: now + (1.5 * 60 * 60 * 1000) };
        setMessToken(guestToken); setView('MESS_QR_FULL'); 
      }
    }, 2000);
  };

  const toggleStock = (id: number) => { setMenu(menu.map(item => item.id === id ? { ...item, available: !item.available } : item)); };
  const submitFeedback = (type: 'CANTEEN' | 'MESS') => { if (!feedbackInput.trim()) return; const newFeedback: Feedback = { id: Date.now(), user: userName, type: type, message: feedbackInput, timestamp: new Date().toLocaleDateString() }; setFeedbacks([newFeedback, ...feedbacks]); setFeedbackInput(''); alert('Feedback sent!'); };

  const handleLogin = () => {
    setLoginError('');
    if (loginTab === 'STUDENT') {
      const studentData = STUDENT_DB[loginId]; 
      if (studentData && studentData.password === loginPass) {
        setUserName(loginId); setRole('STUDENT'); setView('HOME'); setLoginId(''); setLoginPass('');
      } else { setLoginError('Invalid Name or Password'); }
    } else {
      if (loginId === 'admin' && loginPass === ADMIN_PASS) {
        setUserName('Administrator'); setRole('ADMIN'); setView('HOME'); setLoginId(''); setLoginPass('');
      } else { setLoginError('Invalid Admin ID or Password'); }
    }
  };

  // --- VIEWS ---

  const renderLogin = () => (
    <div className="h-full flex flex-col p-8 animate-in fade-in animate-gradient text-white">
      <div className="flex-1 flex flex-col justify-center items-center text-center z-10">
        <h1 className="text-5xl font-black mb-2 tracking-tighter drop-shadow-lg">Campus<span className="text-slate-300">Pulse</span></h1>
        
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] w-full max-w-sm border border-white/20 shadow-2xl mt-12">
          <div className="flex w-full bg-black/20 p-1 rounded-2xl mb-6">
            <button onClick={() => { setLoginTab('STUDENT'); setLoginError(''); }} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${loginTab === 'STUDENT' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}>Student</button>
            <button onClick={() => { setLoginTab('ADMIN'); setLoginError(''); }} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${loginTab === 'ADMIN' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}>Admin</button>
          </div>
          
          <div className="space-y-4 mb-6">
            <input 
              value={loginId} 
              onChange={(e) => setLoginId(e.target.value)} 
              placeholder={loginTab === 'STUDENT' ? "Name" : "Admin ID"} 
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
        <button onClick={resetApp} className="text-white/40 hover:text-red-300 text-xs font-bold uppercase tracking-widest transition-colors pt-4">
          Reset Demo
        </button>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 pb-32">
      <div className="flex justify-between items-center">
        <div className="animate-slide-up delay-0"><h1 className="text-4xl font-black text-slate-900 tracking-tight">Hello, <br/><span className="text-indigo-600">{userName.split(' ')[0]}</span></h1></div>
        <button onClick={() => { setView('LOGIN'); setLoginId(''); setLoginPass(''); setUserName(''); }} className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 hover:bg-red-100 hover:text-red-600 transition-colors animate-pop"><LogOut size={20} /></button>
      </div>

      {role === 'ADMIN' && <div className="bg-amber-100 border-2 border-amber-200 text-amber-900 p-4 rounded-2xl flex items-center gap-3 font-bold animate-pop"><Edit2 size={20} /> Edit Mode Active</div>}

      <div className="space-y-4">
        {role === 'STUDENT' && messToken && (
          <div onClick={() => setView('MESS_QR_FULL')} className="bg-indigo-600 text-white p-5 rounded-3xl shadow-xl shadow-indigo-600/20 cursor-pointer active:scale-95 transition-transform relative overflow-hidden animate-pop">
            <div className="relative z-10 flex justify-between items-start">
              <div><p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Pass Active</p><h2 className="text-2xl font-bold">{messToken.type === 'GUEST' ? 'Guest Pass' : 'Mess Token'}</h2></div>
              <div className="bg-white p-2 rounded-xl"><QrCode size={32} className="text-indigo-900" /></div>
            </div>
          </div>
        )}

        {role === 'STUDENT' && activeOrder && (
          <div onClick={() => setView('SUCCESS')} className="bg-black text-white p-5 rounded-3xl shadow-xl shadow-black/20 cursor-pointer active:scale-95 transition-transform relative overflow-hidden animate-pop">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Ready for Pickup</p><h2 className="text-4xl font-black tracking-widest text-white">#{activeOrder.id}</h2></div>
                <Ticket size={32} className="text-slate-600" />
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between items-center"><span className="text-slate-400 font-medium">{activeOrder.items.length} Items</span><span className="text-green-400 font-bold">PAID ₹{activeOrder.total}</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div onClick={() => setView('NOTICES')} className="col-span-2 h-28 bg-blue-500 rounded-[32px] p-6 text-white relative overflow-hidden cursor-pointer shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-transform flex items-center justify-between animate-slide-up delay-1">
           <div><h2 className="text-2xl font-black">Notices</h2><p className="text-blue-100 font-medium">Updates & News</p></div>
           <div className="bg-white/20 p-3 rounded-full relative">
             <Megaphone size={28} />
             {hasNewNotices && <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-500"></div>}
           </div>
           <Megaphone size={100} className="absolute -bottom-5 -left-5 opacity-20" />
        </div>

        <div onClick={() => setView('CANTEEN')} className="col-span-2 h-56 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[32px] p-6 text-white relative overflow-hidden cursor-pointer shadow-xl shadow-orange-500/30 active:scale-[0.98] transition-transform animate-slide-up delay-2">
           <div className="relative z-10 h-full flex flex-col justify-between">
             <div><div className="flex justify-between items-start"><h2 className="text-3xl font-black">Canteen</h2><div className="bg-white/20 p-2 rounded-full"><Coffee size={24} /></div></div></div>
             <Button variant="white" className="w-fit h-10 text-orange-600">{role === 'ADMIN' ? 'Manage Menu' : 'Order Now'}</Button>
           </div>
           <Coffee size={200} className="absolute -bottom-10 -right-10 opacity-20 rotate-12" />
        </div>

        <div onClick={() => setView('MESS')} className="h-48 bg-emerald-500 rounded-[32px] p-5 text-white relative overflow-hidden cursor-pointer shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-transform flex flex-col justify-between animate-slide-up delay-3">
           <div><h3 className="text-xl font-bold">Mess Hall</h3><p className="text-emerald-100 text-sm">Menu & Tokens</p></div>
           <div className="self-end bg-white/20 p-2 rounded-full"><Utensils size={20} /></div>
           <Utensils size={120} className="absolute -bottom-5 -left-5 opacity-20" />
        </div>

        <div onClick={() => setView('SKILLS')} className="h-48 bg-violet-500 rounded-[32px] p-5 text-white relative overflow-hidden cursor-pointer shadow-lg shadow-violet-500/30 active:scale-[0.98] transition-transform flex flex-col justify-between animate-slide-up delay-4">
           <div><h3 className="text-xl font-bold">Skill Swap</h3><p className="text-violet-100 text-sm">{role === 'ADMIN' ? 'Moderate Content' : 'Learn & Teach'}</p></div>
           <div className="self-end bg-white/20 p-2 rounded-full relative">
             <BookOpen size={20} />
             {hasSkillNotifications && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-violet-500"></div>}
           </div>
           <BookOpen size={120} className="absolute -bottom-5 -left-5 opacity-20" />
        </div>
      </div>
    </div>
  );

  const renderNotices = () => (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right bg-white">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setView('HOME')} className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-900"><ArrowLeft /></button>
        <h2 className="text-3xl font-black text-slate-900">Notices</h2>
      </div>
      {role === 'ADMIN' && (
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 mb-6 animate-pop">
          <h3 className="font-bold text-slate-900 mb-3">Post New Notice</h3>
          <div className="space-y-3"><Input value={newNoticeTitle} onChange={(e) => setNewNoticeTitle(e.target.value)} placeholder="Notice Title" className="h-12" /><div className="flex gap-2"><Input value={newNoticeUrl} onChange={(e) => setNewNoticeUrl(e.target.value)} placeholder="Image URL (optional)" className="h-12" /><Button onClick={postNotice} className="h-14 w-14 !p-0"><Send size={20}/></Button></div></div>
        </div>
      )}
      <div className="space-y-6 overflow-y-auto pb-20">
        {notices.map((notice, idx) => (
          <div key={notice.id} className="bg-white rounded-[32px] overflow-hidden shadow-lg border border-slate-100 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
             <div className="h-40 bg-slate-200 relative">
               <img src={notice.imageUrl} alt={notice.title} className="w-full h-full object-cover" />
               <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">{notice.date}</div>
             </div>
             <div className="p-5"><h3 className="text-xl font-bold text-slate-900 leading-tight">{notice.title}</h3><p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-wide">Posted by {notice.postedBy}</p></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCanteen = () => (
    <div className="p-6 space-y-6 pb-32 animate-in slide-in-from-right">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Menu</h2>
        {role === 'STUDENT' && cart.length > 0 && <Button variant="secondary" onClick={() => setView('CART')} className="h-10 text-sm px-4 animate-pop"><ShoppingBag size={18} /> {cart.length}</Button>}
      </div>

      {role === 'ADMIN' && (
        <div className="bg-slate-900 p-6 rounded-3xl text-white mb-8 shadow-xl animate-pop">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Plus size={20} className="text-indigo-400" /> Add New Dish</h3>
          <div className="flex flex-col gap-4">
             <input value={newDishName} onChange={(e) => setNewDishName(e.target.value)} placeholder="Dish Name e.g., Butter Chicken" className="w-full bg-slate-800 rounded-2xl px-4 h-14 outline-none border-2 border-slate-700 focus:border-indigo-500 transition-colors text-lg" />
             <div className="flex gap-4">
               <div className="relative flex-1"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span><input value={newDishPrice} onChange={(e) => setNewDishPrice(e.target.value)} placeholder="Price" type="number" className="w-full bg-slate-800 rounded-2xl pl-8 pr-4 h-14 outline-none border-2 border-slate-700 focus:border-indigo-500 transition-colors text-lg" /></div>
               <Button onClick={addNewDish} variant="secondary" className="h-14 w-20 !rounded-2xl flex-shrink-0"><Check size={24} /></Button>
             </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {menu.map((item, idx) => (
          <Card key={item.id} className="flex items-center gap-4 !p-4" delay={idx}>
            <div className="flex-1">
               <h3 className={`text-lg font-bold text-slate-900 ${!item.available && 'opacity-50 line-through'}`}>{item.name}</h3>
               <p className="text-slate-500 text-sm font-medium">{item.category}</p>
               <div className="flex items-center gap-2 mt-2">
                 {role === 'ADMIN' ? (
                   <div className="flex items-center bg-slate-100 rounded-lg px-2 border-2 border-transparent focus-within:border-indigo-500 transition-colors"><span className="text-slate-500 text-sm">₹</span><input type="number" value={item.price} onChange={(e) => updatePrice(item.id, e.target.value)} className="w-14 bg-transparent outline-none font-bold text-lg text-slate-900 ml-1"/></div>
                 ) : ( <span className="font-bold text-lg text-slate-900">₹{item.price}</span> )}
                 {!item.available && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-md">SOLD OUT</span>}
               </div>
            </div>
            {role === 'ADMIN' ? (
               <div className="flex flex-col gap-2">
                 <button onClick={() => toggleStock(item.id)} className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${item.available ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                   {item.available ? <CheckSquare size={18} /> : <Square size={18} />}
                 </button>
                 <button onClick={() => deleteDish(item.id)} className="h-10 w-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18} /></button>
               </div>
            ) : (
               <button onClick={() => addToCart(item)} disabled={!item.available} className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${item.available ? 'bg-black text-white shadow-md' : 'bg-slate-100 text-slate-300'}`}><Plus size={24} /></button>
            )}
          </Card>
        ))}
      </div>
      <div className="pt-6 border-t-2 border-slate-100"><h3 className="text-lg font-bold text-slate-900 mb-4">Feedback</h3>{role === 'STUDENT' ? (<div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100"><textarea value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} placeholder="Food quality, taste, hygiene..." className="w-full bg-transparent outline-none text-slate-900 font-medium mb-3 h-20 resize-none placeholder:text-slate-400" /><div className="flex justify-end"><Button variant="secondary" onClick={() => submitFeedback('CANTEEN')} className="h-10 text-sm px-4"><Send size={16} /> Send</Button></div></div>) : (<div className="space-y-3">{feedbacks.filter(f => f.type === 'CANTEEN').length === 0 && <p className="text-slate-400 font-medium text-center py-4">No feedbacks yet.</p>}{feedbacks.filter(f => f.type === 'CANTEEN').map(f => (<div key={f.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><div className="flex justify-between items-center mb-1"><span className="font-bold text-indigo-600">{f.user}</span><span className="text-xs text-slate-400">{f.timestamp}</span></div><p className="text-slate-700 font-medium">{f.message}</p></div>))}</div>)}</div>
    </div>
  );

  const renderDailyMessView = () => {
    const dayShort = getCurrentDayShort();
    const todayMenu = messWeek[dayShort];
    if (!todayMenu) return <p className="text-center text-slate-500 py-8">Menu not available for today.</p>;
    return (
      <div className="space-y-4">
         <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden animate-slide-up delay-1">
            <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-3"><div className="bg-orange-100 p-2 rounded-xl text-orange-600"><Sunrise size={20} /></div><h3 className="text-xl font-bold text-slate-900">Breakfast</h3></div><span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">&lt; 9:00 AM</span></div>
            <DishChips dishes={todayMenu.breakfast} />
         </div>
         <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden animate-slide-up delay-2">
            <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-3"><div className="bg-yellow-100 p-2 rounded-xl text-yellow-600"><Sun size={20} /></div><h3 className="text-xl font-bold text-slate-900">Lunch</h3></div><span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">12:00 - 14:00</span></div>
            <DishChips dishes={todayMenu.lunch} />
         </div>
         <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden animate-slide-up delay-3">
            <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Moon size={20} /></div><h3 className="text-xl font-bold text-slate-900">Dinner</h3></div><span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">From 19:30</span></div>
            <DishChips dishes={todayMenu.dinner} />
         </div>
      </div>
    );
  };

  const renderMess = () => (
    <div className="p-6 space-y-6 pb-32 animate-in slide-in-from-right overflow-x-hidden">
      {role === 'STUDENT' && (
        <div className="bg-indigo-900 text-white rounded-[32px] p-6 shadow-xl shadow-indigo-900/30 animate-pop">
           <div className="flex justify-between items-start mb-6">
             <div><h2 className="text-2xl font-bold">Mess Access</h2><div className="flex items-center gap-2 mt-1 text-indigo-200 text-sm font-medium"><WifiOff size={16} /> <span>Offline Mode Ready</span></div></div>
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
          <h3 className="text-2xl font-black text-slate-900">Mess Menu</h3>
           <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setMessViewMode('DAILY')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${messViewMode === 'DAILY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Daily</button>
            <button onClick={() => setMessViewMode('WEEKLY')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${messViewMode === 'WEEKLY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Weekly</button>
          </div>
        </div>
        {messViewMode === 'DAILY' ? renderDailyMessView() : (
          <div className="overflow-x-auto pb-4 -mx-6 px-6 animate-slide-up">
             {role === 'ADMIN' && <p className="text-xs font-bold text-amber-600 mb-2 bg-amber-50 p-2 rounded-lg inline-block">Tip: Click on cells to edit menu items (comma separated).</p>}
            <table className="w-full min-w-[600px] border-collapse table-fixed">
              <thead>
                <tr>
                  <th className="text-left p-3 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 w-20">Day</th>
                  <th className="text-left p-3 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Breakfast</th>
                  <th className="text-left p-3 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Lunch</th>
                  <th className="text-left p-3 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Dinner</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(messWeek).map(([day, meals]) => (
                  <tr key={day} className="border-b border-slate-50 last:border-0 bg-white">
                    <td className="p-3 font-black text-indigo-600 align-top">{day}</td>
                    {['breakfast', 'lunch', 'dinner'].map((type) => (
                      <td key={type} className="p-3 align-top">
                        {role === 'ADMIN' ? (
                          <textarea value={meals[type as keyof typeof meals]} onChange={(e) => updateMessCell(day, type, e.target.value)} className="w-full bg-slate-50 rounded-lg px-2 py-2 text-sm font-medium text-slate-900 border-2 border-transparent focus:border-indigo-500 outline-none resize-none h-24 leading-tight"/>
                        ) : ( <DishChips dishes={meals[type as keyof typeof meals]} /> )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="pt-6 border-t-2 border-slate-100"><h3 className="text-lg font-bold text-slate-900 mb-4">Feedback</h3>{role === 'STUDENT' ? (<div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100"><textarea value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} placeholder="Report hygiene or quality issues..." className="w-full bg-transparent outline-none text-slate-900 font-medium mb-3 h-20 resize-none placeholder:text-slate-400" /><div className="flex justify-end"><Button variant="secondary" onClick={() => submitFeedback('MESS')} className="h-10 text-sm px-4"><Send size={16} /> Send</Button></div></div>) : (<div className="space-y-3">{feedbacks.filter(f => f.type === 'MESS').length === 0 && <p className="text-slate-400 font-medium text-center py-4">No feedbacks yet.</p>}{feedbacks.filter(f => f.type === 'MESS').map(f => (<div key={f.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><div className="flex justify-between items-center mb-1"><span className="font-bold text-indigo-600">{f.user}</span><span className="text-xs text-slate-400">{f.timestamp}</span></div><p className="text-slate-700 font-medium">{f.message}</p></div>))}</div>)}</div>
    </div>
  );

  const renderChat = () => (
    <div className="h-full flex flex-col bg-[#F3F4F9]">
      <div className="bg-white p-4 flex items-center gap-3 shadow-sm z-10 animate-slide-up">
        <button onClick={() => setView('SKILLS')} className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-900"><ArrowLeft /></button>
        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">{activeChatUser[0]}</div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 leading-tight">{activeChatUser}</h3>
          <p className="text-xs text-slate-500">Student</p>
        </div>
        <button onClick={() => alert('User Reported to Admin')} className="h-10 w-10 text-slate-400 hover:text-red-500"><Flag size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">Start the conversation...</p>}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === userName ? 'justify-end' : 'justify-start'} animate-pop`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.sender === userName ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none shadow-sm'}`}>
              <p>{msg.text}</p>
              <p className={`text-[10px] mt-1 text-right ${msg.sender === userName ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-white p-3 flex gap-2 items-center">
        <input 
          value={chatInput} 
          onChange={(e) => setChatInput(e.target.value)} 
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..." 
          className="flex-1 bg-slate-100 rounded-full px-4 h-12 outline-none text-slate-900" 
        />
        <button onClick={sendMessage} className="h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors animate-pop">
          <Send size={20} />
        </button>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="p-6 space-y-6 pb-32 animate-in slide-in-from-right">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">{role === 'ADMIN' ? 'Moderation Queue' : 'Skill Swap'}</h2>
      </div>

      {role === 'STUDENT' && (
        <div className="bg-slate-900 p-5 rounded-3xl text-white mb-6 animate-pop">
          <h3 className="font-bold mb-3 flex items-center gap-2"><UserPlus size={20} /> Offer a Skill</h3>
          <div className="flex flex-col gap-3">
             <input value={newSkillOffer} onChange={(e) => setNewSkillOffer(e.target.value)} placeholder="What can you teach? (e.g. Guitar)" className="bg-slate-800 rounded-xl px-4 h-12 outline-none border border-slate-700 focus:border-white transition-colors" />
             <div className="flex gap-3">
               <input value={newSkillWant} onChange={(e) => setNewSkillWant(e.target.value)} placeholder="What do you want to learn?" className="flex-1 bg-slate-800 rounded-xl px-4 h-12 outline-none border border-slate-700 focus:border-white transition-colors" />
               <button onClick={postSkill} className="bg-indigo-500 text-white h-12 w-14 rounded-xl flex items-center justify-center font-bold hover:bg-indigo-400 transition-colors"><Send size={20} /></button>
             </div>
          </div>
        </div>
      )}

      {/* ADMIN: SORT BY REPORTS */}
      <div className="grid gap-4">
        {[...skillGigs].sort((a,b) => role === 'ADMIN' ? b.reports - a.reports : 0).map((gig, idx) => {
          const isOwner = gig.createdBy === userName;
          const interactions = gig.interactions || [];
          const hasPending = isOwner && interactions.some(i => i.status === 'PENDING');
          const myRequest = interactions.find(i => i.user === userName);
          const isAccepted = myRequest?.status === 'ACCEPTED';
          const ownerProfile = STUDENT_DB[gig.createdBy];

          return (
            <Card key={gig.id} delay={idx} className={`flex flex-col gap-4 relative overflow-hidden ${hasPending ? 'border-2 border-amber-400 bg-amber-50/50' : ''} ${gig.reports > 0 && role === 'ADMIN' ? 'border-2 border-red-500 bg-red-50' : ''}`}>
              {hasPending && <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1"><Bell size={10} /> NEW REQUEST</div>}
              {gig.reports > 0 && role === 'ADMIN' && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1"><Flag size={10} /> REPORTED ({gig.reports})</div>}

              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full ${gig.color} flex items-center justify-center text-white font-bold text-xl`}>{gig.initial}</div>
                <div><h3 className="font-bold text-slate-900 text-lg">{gig.offer}</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-wide">By {gig.student}</p></div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-sm font-medium text-slate-600">Looking for: <span className="text-indigo-600 font-bold">{gig.want}</span></div>
              
              {/* ACTION AREA */}
              {role === 'ADMIN' ? (
                <Button variant="danger" onClick={() => deleteSkill(gig.id)} className="h-10 text-sm w-full">Delete Post</Button>
              ) : isOwner ? (
                <div className="flex flex-col gap-2">
                   {interactions.length > 0 && (
                     <div className="bg-white border border-slate-200 rounded-xl p-3">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-2">Requests</p>
                       <div className="space-y-2">
                         {interactions.map((i, idx) => {
                           const reqProfile = STUDENT_DB[i.user];
                           return (
                             <div key={idx} className="flex justify-between items-center text-sm">
                               <div className="flex flex-col">
                                 <span className="font-bold text-slate-800">{i.user}</span>
                                 <span className="text-[10px] text-slate-500">{reqProfile ? `${reqProfile.batch}, ${reqProfile.year}` : 'Student'}</span>
                               </div>
                               {i.status === 'ACCEPTED' ? (
                                 <button onClick={() => openChat(gig.id, i.user)} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold flex gap-1 items-center"><MessageCircle size={14}/> Chat</button>
                               ) : (
                                 <button onClick={() => acceptRequest(gig.id, i.user)} className="bg-black text-white px-3 py-1 rounded-lg text-xs font-bold">Accept</button>
                               )}
                             </div>
                           )
                         })}
                       </div>
                     </div>
                   )}
                   <Button variant="outline" onClick={() => deleteSkill(gig.id)} className="h-10 text-sm w-full border-red-200 text-red-500 hover:border-red-500 hover:bg-red-50">Delete Post</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {isAccepted && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-center">
                      <p className="text-xs font-bold text-green-700 uppercase mb-2">Request Accepted!</p>
                      <Button variant="success" onClick={() => openChat(gig.id, gig.student)} className="h-10 w-full text-sm font-bold">
                         <MessageCircle size={16}/> Open Chat with {gig.student}
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
                      <button onClick={() => reportSkill(gig.id)} className="h-10 w-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500"><Flag size={18}/></button>
                    </div>
                  )}
                  {/* Reporting from Chat/Connected View */}
                  {isAccepted && <button onClick={() => reportSkill(gig.id)} className="w-full text-xs text-red-400 hover:text-red-600 font-bold mt-1 flex items-center justify-center gap-1"><Flag size={12} /> Report User</button>}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-bottom bg-white">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('CANTEEN')} className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"><ArrowLeft className="text-slate-900" /></button>
        <h2 className="text-3xl font-black text-slate-900">Your Cart</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {cart.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div><p className="font-bold text-slate-900">{item.name}</p><p className="text-slate-500 font-medium">₹{item.price}</p></div>
            <button onClick={() => removeFromCart(idx)} className="h-8 w-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"><X size={16}/></button>
          </div>
        ))}
      </div>
      <div className="bg-slate-900 p-6 rounded-[32px] mt-4 text-white">
        <div className="flex justify-between items-center mb-6"><span className="text-lg font-medium text-slate-400">Total</span><span className="text-4xl font-black">₹{cartTotal}</span></div>
        <Button onClick={() => initiatePayment(cartTotal, 'CART')} variant="white" className="w-full h-14 text-lg" disabled={cart.length === 0}>Proceed to Pay</Button>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-bottom bg-white">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView(paymentSource === 'CART' ? 'CART' : 'MESS')} className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"><ArrowLeft className="text-slate-900" /></button>
        <h2 className="text-2xl font-bold text-slate-900">Checkout</h2>
      </div>
      <div className="text-center mb-12"><p className="text-slate-400 font-medium mb-2">Amount to Pay</p><h1 className="text-6xl font-black text-slate-900">₹{paymentAmount}</h1></div>
      <div className="space-y-3">
        {[{ icon: Smartphone, label: 'UPI / GPay', sub: 'Fastest' }, { icon: CreditCard, label: 'Card', sub: 'Credit / Debit' }].map((method, idx) => (
          <button key={idx} onClick={completePayment} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-black hover:bg-slate-50 transition-all group">
            <div className="h-12 w-12 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center text-slate-900"><method.icon size={24} /></div>
            <div className="text-left"><p className="text-lg font-bold text-slate-900">{method.label}</p><p className="text-sm font-medium text-slate-500">{method.sub}</p></div>
          </button>
        ))}
      </div>
      {isProcessing && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50"><div className="w-16 h-16 border-4 border-slate-200 border-t-black rounded-full animate-spin"></div><p className="mt-6 text-slate-900 font-bold text-lg">Processing Payment...</p></div>
      )}
    </div>
  );

  const renderSuccess = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in bg-slate-50">
      <div className="h-28 w-28 bg-green-500 rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-green-500/40 animate-pop"><Check size={56} strokeWidth={3} /></div>
      <h1 className="text-3xl font-black text-slate-900 mb-2">Order Confirmed!</h1>
      <p className="text-slate-500 font-medium mb-12">Please show this code at the counter.</p>
      {activeOrder && (
        <div className="bg-white px-10 py-12 rounded-[32px] shadow-xl w-full border border-slate-100 animate-slide-up">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Pickup Code</p>
          <h1 className="text-7xl font-black text-indigo-600 tracking-widest">{activeOrder.id}</h1>
        </div>
      )}
      <div className="mt-12"><Button variant="ghost" onClick={() => setView('HOME')}>Return Home</Button></div>
    </div>
  );

  const renderMessQRFull = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in bg-indigo-600 text-white">
      <h1 className="text-4xl font-black mb-2">{messToken?.type === 'GUEST' ? 'Guest Pass' : 'Mess Token'}</h1>
      <div className="flex items-center gap-2 opacity-80 mb-10 font-medium"><Clock size={20} /> Valid for 90 Minutes</div>
      <div className="bg-white p-8 rounded-[32px] shadow-2xl mb-10 animate-pop"><QrCode size={240} className="text-black" /></div>
      <p className="text-indigo-200 font-medium max-w-[200px] leading-relaxed">Please scan this at the mess entrance.</p>
      <button onClick={() => setView('HOME')} className="absolute bottom-10 h-14 w-14 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 backdrop-blur-md"><X size={24} /></button>
    </div>
  );

  const renderGuestMess = () => (
    <div className="h-full flex flex-col p-6 animate-in slide-in-from-right bg-white">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('LOGIN')} className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"><ArrowLeft className="text-slate-900" /></button>
        <h2 className="text-2xl font-bold text-slate-900">Daily Menu</h2>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto pb-6">
        <div className="bg-emerald-100 p-6 rounded-[28px] text-emerald-900 border border-emerald-200 mb-2">
          <h3 className="text-lg font-bold mb-1">Today's Special</h3>
          <p className="opacity-80 font-medium text-sm">Valid for: {new Date().toLocaleDateString()}</p>
        </div>
        {['breakfast', 'lunch', 'dinner'].map((type, idx) => (
          <div key={type} className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
             <span className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2 block">{type}</span>
             <DishChips dishes={messWeek[getCurrentDayShort()]?.[type] || ''} />
          </div>
        ))}
      </div>
    </div>
  );

  // --- APP SHELL ---

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans selection:bg-indigo-500 selection:text-white">
      <AnimationStyles />
      <div className="w-full max-w-[412px] h-[860px] bg-white rounded-[40px] overflow-hidden shadow-2xl relative flex flex-col border-[8px] border-slate-900">
        
        <main className="flex-1 overflow-y-auto no-scrollbar bg-white">
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

        {!['LOGIN', 'GUEST_MESS', 'CART', 'PAYMENT', 'SUCCESS', 'MESS_QR_FULL', 'CHAT'].includes(view) && (
          <nav className="h-24 bg-white border-t border-slate-100 flex justify-around items-start pt-4 px-2 absolute bottom-0 w-full z-20">
            {[
              { id: 'HOME', icon: Home, label: 'Home' },
              { id: 'CANTEEN', icon: Coffee, label: 'Canteen' },
              { id: 'MESS', icon: Utensils, label: 'Mess' },
              { id: 'SKILLS', icon: BookOpen, label: 'Skill Swap' },
            ].map((item: any) => {
              if (role === 'ADMIN' && item.id === 'SKILLS') return null;
              const isActive = view === item.id;
              
              // Badge Logic
              const showBadge = (item.id === 'SKILLS' && hasSkillNotifications) || (item.id === 'HOME' && hasNewNotices); // Notices on Home

              return (
                <button 
                  key={item.id} 
                  onClick={() => setView(item.id as ViewState)}
                  className="flex flex-col items-center justify-center w-16 group relative"
                >
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center mb-1 transition-all duration-300 ${isActive ? 'bg-black text-white shadow-lg shadow-black/20 translate-y-[-4px]' : 'bg-transparent text-slate-400 group-hover:bg-slate-50'}`}>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {showBadge && <div className="absolute top-0 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></div>}
                  <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  );
}