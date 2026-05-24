import React, { useState, useEffect } from 'react';
import { Utensils, Shield, User, ArrowRight, Download, Calendar, BookOpen, Clock, X, KeyRound, Coffee, Sun, Moon, ChevronDown } from 'lucide-react';


export default function LockScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Portal online/offline status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Guest overlay states
  const [showGuestMess, setShowGuestMess] = useState(false);
  const [showGuestCalendar, setShowGuestCalendar] = useState(false);
  const [showGuestShelf, setShowGuestShelf] = useState(false);
  const [showDemoProfiles, setShowDemoProfiles] = useState(false);
  const [showShelfSetup, setShowShelfSetup] = useState(false);
  const [setupBranch, setSetupBranch] = useState('Computer Science');
  const [setupSemester, setSetupSemester] = useState('Semester 1');

  // Shelf Search, Category & Filtering states
  const [shelfSearch, setShelfSearch] = useState('');
  const [shelfBranch, setShelfBranch] = useState('All Branches');
  const [shelfSemester, setShelfSemester] = useState('All Semesters');
  const [shelfCategory, setShelfCategory] = useState('All');
  const [downloadingId, setDownloadingId] = useState(null);

  // Next Upcoming Exam Countdown states
  const [nextExam, setNextExam] = useState(null);
  const [nextExamCountdown, setNextExamCountdown] = useState('');

  // Live Exam Countdown ticking effect
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date().getTime();
      
      const exams = [
        { name: 'Mid-Term 1 (T1)', target: new Date('2026-06-25T09:00:00').getTime() },
        { name: 'Mid-Term 2 (T2)', target: new Date('2026-08-10T09:00:00').getTime() },
        { name: 'End-Sem Exams (T3)', target: new Date('2026-10-20T09:00:00').getTime() }
      ];

      // Find the first exam in the future
      const upcoming = exams.find(e => e.target - now > 0);

      if (upcoming) {
        setNextExam(upcoming);
        
        const diff = upcoming.target - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setNextExamCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setNextExam(null);
        setNextExamCountdown('');
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);


  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setSubmitting(true);
      setLoginError(null);

      // Append default domain if not present to simplify login
      let loginEmail = email.trim();
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail}@campos.local`;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      onLoginSuccess(data.user);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const messMenu = [
    { day: 'Monday', breakfast: 'Aloo Paratha & Curd', lunch: 'Rajma Chawal, Roti, Salad', tea: 'Samosa & Chai', dinner: 'Matar Paneer, Dal Fry, Rice' },
    { day: 'Tuesday', breakfast: 'Idli Vada & Sambar', lunch: 'Kadhi Chawal, Aloo Bhindi', tea: 'Veg Cutlet & Tea', dinner: 'Chicken Curry / Egg Bhurji, Rice' },
    { day: 'Wednesday', breakfast: 'Poha & Jalebi', lunch: 'Chole Bhature, Veg Pulav', tea: 'Bread Pakoda & Coffee', dinner: 'Kadhai Paneer, Dal Makhani' },
    { day: 'Thursday', breakfast: 'Uttapam & Chutney', lunch: 'Veg Biryani & Mix Raita', tea: 'Biscuits & Tea', dinner: 'Mix Veg, Dal Tadka, Roti' },
    { day: 'Friday', breakfast: 'Bread Butter & Omelette', lunch: 'Dal Baati Churma, Salad', tea: 'Kachori & Tea', dinner: 'Butter Chicken / Shahi Paneer, Naan' },
    { day: 'Saturday', breakfast: 'Puri Sabzi & Halwa', lunch: 'Chana Masala, Jeera Rice', tea: 'French Fries & Coffee', dinner: 'Veg Manchurian & Fried Rice' },
    { day: 'Sunday', breakfast: 'Masala Dosa & Sambar', lunch: 'Special Sunday Paneer Feast', tea: 'Dhokla & Chai', dinner: 'Aloo Gobi, Yellow Dal, Khichdi' },
  ];

  const calendarEvents = [
    { date: 'June 01, 2026', title: 'Spring Semester Begins', type: 'academic', desc: 'Orientation for new batches and regular classes commence.' },
    { date: 'June 25, 2026', title: 'CampOS Hackathon Sprint', type: 'event', desc: '36-hour continuous monorepo coding competition with cash prizes.' },
    { date: 'July 10-18, 2026', title: 'Mid-Term Examination Weeks', type: 'exam', desc: 'Strict examinations across all departments.' },
    { date: 'Aug 15, 2026', title: 'Independence Day Holiday', type: 'holiday', desc: 'Flag hoisting ceremony at main sports complex.' },
    { date: 'Sep 05-08, 2026', title: 'Sparks Campus Cultural Festival', type: 'event', desc: 'Three days of music, arts, food-stalls, and dance matches.' },
    { date: 'Oct 20, 2026', title: 'Final Semester Exams Begin', type: 'exam', desc: 'Submission of lab projects and end-term exams.' },
  ];

  const studyMaterials = [
    // Computer Science
    { code: 'CS-101', name: 'Introduction to React & UI Foundations', size: '4.2 MB', type: 'Notes', branch: 'Computer Science', semester: 'Semester 1' },
    { code: 'CS-102', name: 'Data Structures and Algorithms Handbook', size: '12.5 MB', type: 'Books', branch: 'Computer Science', semester: 'Semester 2' },
    { code: 'CS-201', name: 'Database Architecture & Mongoose Notes', size: '8.5 MB', type: 'Notes', branch: 'Computer Science', semester: 'Semester 3' },
    { code: 'CS-202', name: 'Object Oriented Programming Tutorial Lab', size: '3.1 MB', type: 'Tutorials', branch: 'Computer Science', semester: 'Semester 3' },
    { code: 'CS-301', name: 'T1/T2 Previous Year Question Papers (2025)', size: '1.8 MB', type: 'PYQs', branch: 'Computer Science', semester: 'Semester 5' },
    { code: 'CS-305', name: 'Advanced Microservices & REST Security Manual', size: '14.2 MB', type: 'Tutorials', branch: 'Computer Science', semester: 'Semester 6' },
    { code: 'CS-402', name: 'Machine Learning Deep Dive Reference Book', size: '28.4 MB', type: 'Books', branch: 'Computer Science', semester: 'Semester 7' },

    // Electronics & Communication
    { code: 'ECE-101', name: 'Basic Electronics & Circuit Components', size: '5.2 MB', type: 'Notes', branch: 'Electronics & Communication', semester: 'Semester 1' },
    { code: 'ECE-201', name: 'Network Synthesis & Filters Analysis', size: '5.9 MB', type: 'Notes', branch: 'Electronics & Communication', semester: 'Semester 3' },
    { code: 'ECE-202', name: 'Signal & Systems Lab Solutions', size: '4.8 MB', type: 'Tutorials', branch: 'Electronics & Communication', semester: 'Semester 4' },
    { code: 'ECE-302', name: 'Microprocessor Systems Design (ARM) Reference', size: '9.4 MB', type: 'Notes', branch: 'Electronics & Communication', semester: 'Semester 5' },
    { code: 'ECE-305', name: 'T3 End-Term Exam Papers (2024)', size: '2.3 MB', type: 'PYQs', branch: 'Electronics & Communication', semester: 'Semester 6' },
    { code: 'ECE-401', name: 'Wireless Communication Principles', size: '18.1 MB', type: 'Books', branch: 'Electronics & Communication', semester: 'Semester 8' },

    // Information Technology
    { code: 'IT-201', name: 'Web Engineering & Fullstack Guide', size: '7.6 MB', type: 'Notes', branch: 'Information Technology', semester: 'Semester 3' },
    { code: 'IT-302', name: 'Cloud Computing & AWS Lab Tutorials', size: '6.2 MB', type: 'Tutorials', branch: 'Information Technology', semester: 'Semester 5' },
    { code: 'IT-304', name: 'Information Security Mid-Term Solved Papers', size: '1.5 MB', type: 'PYQs', branch: 'Information Technology', semester: 'Semester 5' },
    { code: 'IT-405', name: 'Distributed Systems Architecture Book', size: '21.3 MB', type: 'Books', branch: 'Information Technology', semester: 'Semester 7' },

    // Biotechnology
    { code: 'BT-101', name: 'Introduction to Cell Biology & Genetics', size: '6.4 MB', type: 'Notes', branch: 'Biotechnology', semester: 'Semester 1' },
    { code: 'BT-202', name: 'Biochemistry Practical Lab Sheets', size: '3.8 MB', type: 'Tutorials', branch: 'Biotechnology', semester: 'Semester 3' },
    { code: 'BT-303', name: 'Genomics & Proteomics T2 Question Papers', size: '2.1 MB', type: 'PYQs', branch: 'Biotechnology', semester: 'Semester 5' },
    { code: 'BT-404', name: 'Industrial Bioprocess Technology Book', size: '15.9 MB', type: 'Books', branch: 'Biotechnology', semester: 'Semester 7' }
  ];

  // --- GUEST OVERLAYS RENDERING ---

  if (showGuestMess) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = new Date().getDay();
    const todayName = daysOfWeek[todayIndex];

    const getFormattedDate = (dayName) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetIdx = days.indexOf(dayName);
      const todayIdx = new Date().getDay();
      const diff = targetIdx - todayIdx;
      const date = new Date();
      date.setDate(date.getDate() + diff);
      
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yy = String(date.getFullYear()).substring(2);
      return `${dd}.${mm}.${yy}`;
    };

    const getFoodTags = (foodString) => {
      if (!foodString) return [];
      return foodString.replace(/ & /g, ', ').split(', ').map(item => item.trim());
    };

    return (
      <div className="fixed inset-0 bg-[#141a27] text-white flex flex-col p-6 z-[99999] overflow-y-auto font-sans">

        {/* Premium morphing wallpaper gradient blobs (z-0, behind content) */}
        <div className="absolute top-[-20%] right-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#7085c3]/20 via-[#4f649e]/10 to-transparent pointer-events-none z-0 animate-blob1" />
        <div className="absolute bottom-[-20%] left-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#b06ab3]/15 via-[#7a468c]/5 to-transparent pointer-events-none z-0 animate-blob2" />
        <div className="absolute top-[20%] left-[5%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#e39695]/8 via-[#9e5c61]/2 to-transparent pointer-events-none z-0 animate-blob3" />

        {/* Flowing animated background lines — z-0, content is z-10 so no overlap */}
        <svg className="absolute inset-0 z-0 w-full h-full pointer-events-none fill-none" viewBox="0 0 430 932" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradMess1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="25%" stopColor="#a3b3e6" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#7085c3" stopOpacity="0.35" />
              <stop offset="75%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7085c3" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="gradMess2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7085c3" stopOpacity="0.05" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#a3b3e6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7085c3" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Upper curved sweep */}
          <path
            d="M -10,0 C 150,150 250,50 350,180 C 400,240 450,120 440,-10"
            className="flow-line-1"
            style={{ stroke: 'url(#gradMess1)', strokeWidth: 5.5, filter: 'blur(4px)', opacity: 0.55 }}
          />
          <path
            d="M -10,0 C 150,150 250,50 350,180 C 400,240 450,120 440,-10"
            className="flow-line-1"
            style={{ stroke: 'url(#gradMess1)', strokeWidth: 1.8 }}
          />
          
          {/* Lower curved sweep */}
          <path
            d="M -10,960 C 130,850 250,850 440,910"
            className="flow-line-2"
            style={{ stroke: 'url(#gradMess2)', strokeWidth: 5.5, filter: 'blur(4px)', opacity: 0.55 }}
          />
          <path
            d="M -10,960 C 130,850 250,850 440,910"
            className="flow-line-2"
            style={{ stroke: 'url(#gradMess2)', strokeWidth: 1.8 }}
          />
        </svg>

        <div className="relative z-10 flex flex-col w-full max-w-5xl min-h-full mx-auto">
          <header className="flex items-center w-full gap-4 py-6 mb-8 border-b border-white/5">
            <button
              onClick={() => setShowGuestMess(false)}
              className="w-12 h-12 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md select-none cursor-pointer"
            >
              <span className="text-xl font-bold">&larr;</span>
            </button>
            <h2 className="flex items-center h-12 text-lg font-bold text-white select-none">
              Mess Menu
            </h2>
          </header>

          <div className="flex flex-col flex-1 gap-6 pb-12">

            {/* Render days in exact mock-up layout */}
            <div className="flex flex-col gap-6">
              {messMenu.map((m) => {
                const isActive = m.day === todayName;
                return (
                  <div
                    key={m.day}
                    className={`rounded-[32px] p-7 transition-all duration-500 relative backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] ${
                      isActive
                        ? 'border border-amber-500/50 bg-white/[0.09] shadow-[0_0_35px_rgba(245,158,11,0.15)]'
                        : 'border border-white/15 bg-white/[0.06]'
                    }`}
                  >
                    {/* Active Running Today Tag */}
                    {isActive && (
                      <div className="absolute top-7 right-7 bg-amber-500 text-[#141a27] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md shadow-lg select-none">
                        Running Today
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-baseline gap-3 mb-6">
                      <h3 className="text-2xl font-black tracking-tight text-white">{m.day}</h3>
                      <span className="font-mono text-sm font-bold tracking-widest text-white/30">
                        {getFormattedDate(m.day)}
                      </span>
                    </div>

                    {/* Meal columns (Breakfast, Lunch, Dinner) */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      {/* Breakfast */}
                      <div className="bg-black/25 border border-white/10 rounded-[22px] p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-white">
                            <Coffee size={16} className="text-amber-400" />
                            <span>Breakfast</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-black/40 text-[9px] font-mono text-slate-400 border border-white/5 font-semibold">
                            Till 9:30 AM
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getFoodTags(m.breakfast).map((tag, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded bg-[#0f121d] text-[11px] font-mono text-slate-300 border border-white/5 tracking-wide">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Lunch */}
                      <div className="bg-black/25 border border-white/10 rounded-[22px] p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-white">
                            <Sun size={16} className="text-amber-500" />
                            <span>Lunch</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-black/40 text-[9px] font-mono text-slate-400 border border-white/5 font-semibold">
                            12:00 PM - 2:00 PM
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getFoodTags(m.lunch).map((tag, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded bg-[#0f121d] text-[11px] font-mono text-slate-300 border border-white/5 tracking-wide">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Dinner */}
                      <div className="bg-black/25 border border-white/10 rounded-[22px] p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-white">
                            <Moon size={16} className="text-[#a3b3e6]" />
                            <span>Dinner</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-black/40 text-[9px] font-mono text-slate-400 border border-white/5 font-semibold">
                            7:30 PM - 9:30 PM
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getFoodTags(m.dinner).map((tag, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded bg-[#0f121d] text-[11px] font-mono text-slate-300 border border-white/5 tracking-wide">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showGuestCalendar) {
    return (
      <div className="fixed inset-0 bg-[#141a27] text-white flex flex-col p-6 z-[99999] overflow-y-auto font-sans justify-between">
        <div className="flex flex-col flex-1 w-full max-w-md mx-auto">
          <header className="flex items-center w-full gap-4 py-6 mb-4 border-b border-white/5">
            <button
              onClick={() => setShowGuestCalendar(false)}
              className="w-12 h-12 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md select-none cursor-pointer"
            >
              <span className="text-xl font-bold">&larr;</span>
            </button>
            <h2 className="flex items-center h-12 text-lg font-bold text-white select-none">
              Calendar
            </h2>
          </header>

          <div className="flex flex-col justify-center flex-1 my-6">
            <div className="lock-card public-details-card bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 p-6 shadow-2xl">
              
              <div className="flex flex-col gap-6 max-h-[50vh] overflow-y-auto pr-2 scrollbar-none">
                {calendarEvents.map((event, idx) => (
                  <div key={idx} className="flex gap-4 border-l-2 border-[#7085c3]/40 pl-4 relative py-1">
                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-[#7085c3]"></div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-mono text-indigo-300 font-bold uppercase tracking-wider">{event.date}</span>
                      <span className="text-base font-extrabold text-white mt-0.5">{event.title}</span>
                      <p className="mt-1 text-xs leading-relaxed text-white/60">{event.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showGuestShelf) {
    // Search, Branch, Semester, and Category filter logic
    const filteredMaterials = studyMaterials.filter((material) => {
      const matchesSearch = 
        material.code.toLowerCase().includes(shelfSearch.toLowerCase()) ||
        material.name.toLowerCase().includes(shelfSearch.toLowerCase());
      
      const matchesBranch = 
        shelfBranch === 'All Branches' || 
        material.branch === shelfBranch;
      
      const matchesSemester = 
        shelfSemester === 'All Semesters' || 
        material.semester === shelfSemester;
      
      const matchesCategory = 
        shelfCategory === 'All' || 
        material.type === shelfCategory;

      return matchesSearch && matchesBranch && matchesSemester && matchesCategory;
    });

    const handleDownload = (course) => {
      setDownloadingId(course.code);
      setTimeout(() => {
        setDownloadingId(null);
        alert(`Successfully downloaded: ${course.code} - ${course.name}`);
      }, 1500);
    };

    return (
      <div className="fixed inset-0 bg-[#141a27] text-white flex flex-col p-6 z-[99999] overflow-y-auto font-sans">
        {/* Premium morphing wallpaper gradient blobs (z-0, behind content) */}
        <div className="absolute top-[-20%] right-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#7085c3]/20 via-[#4f649e]/10 to-transparent pointer-events-none z-0 animate-blob1" />
        <div className="absolute bottom-[-20%] left-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#b06ab3]/15 via-[#7a468c]/5 to-transparent pointer-events-none z-0 animate-blob2" />
        <div className="absolute top-[20%] left-[5%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#e39695]/8 via-[#9e5c61]/2 to-transparent pointer-events-none z-0 animate-blob3" />
        {/* Animated SVG background lines identical to lockscreen */}
        <svg className="absolute inset-0 z-0 w-full h-full pointer-events-none fill-none" viewBox="0 0 430 932" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradShelf1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="25%" stopColor="#a3b3e6" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#7085c3" stopOpacity="0.35" />
              <stop offset="75%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7085c3" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="gradShelf2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7085c3" stopOpacity="0.05" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#a3b3e6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7085c3" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Upper curved sweep */}
          <path
            d="M -10,0 C 150,150 250,50 350,180 C 400,240 450,120 440,-10"
            className="flow-line-1"
            style={{ stroke: 'url(#gradShelf1)', strokeWidth: 5.5, filter: 'blur(4px)', opacity: 0.55 }}
          />
          <path
            d="M -10,0 C 150,150 250,50 350,180 C 400,240 450,120 440,-10"
            className="flow-line-1"
            style={{ stroke: 'url(#gradShelf1)', strokeWidth: 1.8 }}
          />
          
          {/* Lower curved sweep */}
          <path
            d="M -10,960 C 130,850 250,850 440,910"
            className="flow-line-2"
            style={{ stroke: 'url(#gradShelf2)', strokeWidth: 5.5, filter: 'blur(4px)', opacity: 0.55 }}
          />
          <path
            d="M -10,960 C 130,850 250,850 440,910"
            className="flow-line-2"
            style={{ stroke: 'url(#gradShelf2)', strokeWidth: 1.8 }}
          />
        </svg>

        <div className="relative z-10 flex flex-col w-full max-w-5xl min-h-full mx-auto">
          <header className="flex items-center w-full gap-4 py-6 mb-8 border-b border-white/5">
            <button
              onClick={() => setShowGuestShelf(false)}
              className="w-12 h-12 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md select-none cursor-pointer"
            >
              <span className="text-xl font-bold">&larr;</span>
            </button>
            <h2 className="flex items-center h-12 text-lg font-bold text-white select-none">
              Study Shelf
            </h2>
          </header>

          {/* Main Full-Width Column: Resource Directory with Small Header Countdown */}
          <div className="flex flex-col flex-1 w-full gap-6 pb-12 animate-fadeIn">
            
            {/* Nearest upcoming exam clock widget placed cleanly at the top */}
            {nextExam && (
              <div className="bg-[#1c2436]/40 border border-white/10 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] w-full justify-between mb-4">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black text-[#a3b3e6] uppercase tracking-widest font-mono leading-none">Upcoming Exam: {nextExam.name}</span>
                  <span className="text-base font-black font-mono tracking-wider text-white mt-1.5 font-semibold">
                    {nextExamCountdown}
                  </span>
                </div>
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full bg-indigo-400 rounded-full opacity-75 animate-ping"></span>
                  <span className="relative inline-flex w-2 h-2 bg-indigo-500 rounded-full"></span>
                </span>
              </div>
            )}


            {/* Category Pills Tab bar */}
            <div className="flex flex-wrap gap-2 py-1">
              {['All', 'Notes', 'Tutorials', 'PYQs', 'Books'].map((cat) => {
                const isActive = shelfCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setShelfCategory(cat)}
                    className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 border ${
                      isActive
                        ? 'bg-white text-[#141a27] border-white shadow-lg'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/15 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Document Listing Grid */}
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-none">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((course) => {
                  const isDownloading = downloadingId === course.code;
                  return (
                    <div
                      key={course.code}
                      className="bg-white/[0.06] border border-white/15 hover:border-white/35 hover:bg-white/[0.12] backdrop-blur-3xl rounded-2xl p-5 flex items-center justify-between transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] group"
                    >
                      <div className="flex flex-col gap-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#7085c3]/20 border border-[#7085c3]/30 text-[#a3b3e6] text-[9px] px-2.5 py-0.5 rounded font-mono uppercase font-black tracking-wider">
                            {course.code}
                          </span>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                            {course.type}
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-white leading-snug mt-1 group-hover:text-[#a3b3e6] transition-colors duration-300">
                          {course.name}
                        </span>
                        <span className="text-xs text-white/40 font-mono mt-0.5">
                          {course.branch} • {course.semester} • {course.size}
                        </span>
                      </div>

                      {/* Interactive download button */}
                      <button
                        onClick={() => handleDownload(course)}
                        disabled={isDownloading}
                        className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                          isDownloading
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-white/5 hover:bg-[#7085c3]/20 border-white/10 hover:border-[#7085c3]/40 text-white active:scale-90'
                        }`}
                      >
                        {isDownloading ? (
                          <div className="w-5 h-5 border-2 rounded-full border-amber-400 border-t-transparent animate-spin" />
                        ) : (
                          <Download size={18} />
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white/[0.06] border border-white/15 backdrop-blur-3xl rounded-[32px] p-12 text-center flex flex-col items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                  <span className="mb-3 text-4xl text-white/20">🔍</span>
                  <h3 className="text-lg font-extrabold text-white">No materials found</h3>
                  <p className="mt-1 text-sm text-white/40">Try adjusting your filters or search query.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#141a27] flex flex-col justify-center items-center p-8 z-[9999] overflow-hidden select-none font-sans min-h-screen text-white relative">
      
      {/* Premium morphing wallpaper gradient blobs (z-0, behind content) */}
      <div className="absolute top-[-20%] right-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#7085c3]/20 via-[#4f649e]/10 to-transparent pointer-events-none z-0 animate-blob1" />
      <div className="absolute bottom-[-20%] left-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#b06ab3]/15 via-[#7a468c]/5 to-transparent pointer-events-none z-0 animate-blob2" />
      <div className="absolute top-[20%] left-[5%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#e39695]/8 via-[#9e5c61]/2 to-transparent pointer-events-none z-0 animate-blob3" />

      {/* 🟢/🔴 Portal Online/Offline Status Indicator (Top Right) */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 shadow-md">
        <span className="relative flex w-2 h-2">
          {isOnline && (
            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-emerald-400"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></span>
        </span>
        <span className={`text-[10px] font-sans font-black tracking-[0.15em] select-none ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
          PORTAL {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>


      <div className="w-full max-w-sm flex flex-col justify-between h-[90%] z-10 relative">
        
        {/* ✍️ Times New Roman left-aligned elegant branding header */}
        <header className="flex flex-col items-start mt-16 text-left select-none animate-fadeIn" style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}>
          <span className="text-[36px] font-light text-white/95 leading-tight tracking-tight">
            Log into your
          </span>
          <span className="italic font-normal text-[44px] text-white leading-none mt-1 tracking-tight">
            CampOS
          </span>
        </header>

        {/* 📥 Form input panel */}
        <form onSubmit={handleLogin} className="flex flex-col w-full gap-8 mt-12">
          
          {/* Username Glassmorphic Outlined Input */}
          <div className="relative w-full group rounded-[20px]">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="peer w-full bg-white/[0.05] border border-white/15 backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-[20px] p-5 text-base font-semibold text-white tracking-wide transition-all duration-300 ease-out outline-none focus:scale-[1.015] focus:shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
            />
            <span className="absolute -top-6 left-1 px-2 bg-[#141a2700] text-[14px] font-sans font-black uppercase tracking-widest text-slate-400 select-none pointer-events-none transition-all duration-300 ease-out peer-focus:text-white peer-focus:-translate-y-[2px] peer-focus:scale-105">
              username
            </span>
          </div>

          {/* Password Glassmorphic Outlined Input */}
          <div className="relative w-full group rounded-[20px]">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="peer w-full bg-white/[0.05] border border-white/15 backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] focus:border-white/35 focus:ring-2 focus:ring-white/5 rounded-[20px] p-5 text-base font-semibold text-white tracking-wide transition-all duration-300 ease-out outline-none focus:scale-[1.015] focus:shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
            />
            <span className="absolute -top-6 left-1 px-2 bg-[#141a2700] text-[14px] font-sans font-black uppercase tracking-widest text-slate-400 select-none pointer-events-none transition-all duration-300 ease-out peer-focus:text-white peer-focus:-translate-y-[2px] peer-focus:scale-105">
              password
            </span>
          </div>

          {loginError && (
            <div className="p-4 mt-2 text-xs font-semibold text-center text-red-200 border bg-red-500/10 border-red-500/20 rounded-2xl animate-fadeIn">
              ⚠️ {loginError}
            </div>
          )}

          {/* Solid White LOGIN Action Button with Glowing Halo */}
          <div className="relative flex flex-col w-full mt-2 group">
            {/* Soft, vibrant glowing background halo */}
            <div className="absolute inset-0 bg-[#7085c3]/20 rounded-[20px] blur-xl opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500 pointer-events-none" />
            <button
              type="submit"
              disabled={submitting}
              className="relative w-full bg-white text-[#141a27] hover:bg-slate-50 active:scale-[0.98] disabled:hover:bg-white disabled:active:scale-100 transition-all duration-300 font-extrabold tracking-[0.15em] text-sm uppercase rounded-[20px] py-5 shadow-xl shadow-black/10 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="flex items-center justify-center h-5 gap-3">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    {/* Inner glowing pulsing core */}
                    <div className="absolute inset-0 rounded-full bg-[#141a27] animate-ping opacity-35" />
                    {/* Center solid core */}
                    <div className="absolute w-2 h-2 rounded-full bg-[#141a27]" />
                    {/* Outer rotating orbit segment */}
                    <div className="absolute inset-0 rounded-full border border-transparent border-t-[#141a27] border-r-[#141a27] animate-spin" />
                  </div>
                  <span className="text-[11px] font-black tracking-[0.2em] text-[#141a27] uppercase select-none animate-pulse">
                    authorizing...
                  </span>
                </div>
              ) : (
                'LOGIN'
              )}
            </button>
          </div>
        </form>

        {/* 🔗 OR Divider line */}
        <div className="flex items-center justify-between w-full gap-4 mt-12">
          <div className="flex-1 border-t border-slate-700/50"></div>
          <span className="font-sans text-xs font-bold tracking-widest text-slate-400">OR</span>
          <div className="flex-1 border-t border-slate-700/50"></div>
        </div>

        {/* 🎛️ Bottom Public Access Slate-Blue buttons */}
        <footer className="flex flex-col w-full gap-4 mt-8 mb-4">
          {/* Main public access actions: Symmetrically centered horizontal widgets with inner flex-col containers */}
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={() => setShowGuestMess(true)}
              className="group bg-white/[0.06] border border-white/15 hover:bg-white/[0.12] active:scale-[0.97] text-slate-300 hover:text-white rounded-2xl flex-1 select-none cursor-pointer transition-all duration-300 h-16 shadow-lg backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden"
            >
              <div className="flex flex-col items-center justify-center h-full w-full gap-1.5 py-1">
                <Utensils size={18} className="text-slate-400 group-hover:text-[#a3b3e6] transition-colors duration-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider">mess menu</span>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setShowGuestCalendar(true)}
              className="group bg-white/[0.06] border border-white/15 hover:bg-white/[0.12] active:scale-[0.97] text-slate-300 hover:text-white rounded-2xl flex-1 select-none cursor-pointer transition-all duration-300 h-16 shadow-lg backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden"
            >
              <div className="flex flex-col items-center justify-center h-full w-full gap-1.5 py-1">
                <Calendar size={18} className="text-slate-400 group-hover:text-[#a3b3e6] transition-colors duration-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider">calendar</span>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setSetupBranch('Computer Science');
                setSetupSemester('Semester 1');
                setShowShelfSetup(true);
              }}
              className="group bg-white/[0.06] border border-white/15 hover:bg-white/[0.12] active:scale-[0.97] text-slate-300 hover:text-white rounded-2xl flex-1 select-none cursor-pointer transition-all duration-300 h-16 shadow-lg backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden"
            >
              <div className="flex flex-col items-center justify-center h-full w-full gap-1.5 py-1">
                <BookOpen size={18} className="text-slate-400 group-hover:text-[#a3b3e6] transition-colors duration-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider">shelf</span>
              </div>
            </button>
          </div>

          {/* Dev Utility - Completely separated text link for easy removal later */}
          <div className="flex justify-center w-full pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowDemoProfiles(true)}
              className="group flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a3b3e6]/60 hover:text-white select-none cursor-pointer transition-all duration-300 py-1"
            >
              <KeyRound size={12} className="text-[#a3b3e6]/50 group-hover:text-white transition-colors duration-300" />
              <span>demo credentials</span>
            </button>
          </div>
        </footer>

        {/* 📜 Premium elegant copyright text */}
        <p className="text-center text-[10px] text-white/20 tracking-[0.25em] uppercase font-bold select-none mt-2 mb-1 font-sans">
          © 2026 CampOS. All rights reserved.
        </p>

        {/* 🔑 Demo Profiles Popup Overlay */}
        {showDemoProfiles && (
          <div className="fixed inset-0 bg-black/45 z-[99999] flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowDemoProfiles(false)}>
            <div className="bg-white/[0.06] border border-white/15 rounded-[32px] backdrop-blur-3xl p-8 w-full max-w-sm shadow-2xl flex flex-col gap-6 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white">
                  <KeyRound size={18} className="text-[#a3b3e6]" /> Demo Profiles
                </h3>
                <button onClick={() => setShowDemoProfiles(false)} className="transition-colors text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <p className="text-white/40 text-sm font-sans mt-0.5 leading-relaxed -mt-3">Tap any profile to auto-fill the login form.</p>

              <div className="flex flex-col gap-4">
                {[
                  { label: 'Student', icon: <User size={16} />, user: 'student', pass: 'Student@123', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20' },
                  { label: 'Canteen Admin', icon: <Utensils size={16} />, user: 'canteen', pass: 'Canteen@123', color: 'bg-amber-500/20 text-amber-300 border-amber-500/20' },
                  { label: 'Super Admin', icon: <Shield size={16} />, user: 'admin', pass: 'CampOS@Admin123', color: 'bg-red-500/20 text-red-300 border-red-500/20' },
                ].map((profile) => (
                  <button
                    key={profile.user}
                    onClick={() => {
                      setEmail(profile.user);
                      setPassword(profile.pass);
                      setShowDemoProfiles(false);
                    }}
                    className="w-full bg-black/25 hover:bg-white/[0.06] active:scale-[0.98] border border-white/10 rounded-2xl p-4 flex items-center gap-4 transition-all text-left group shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${profile.color}`}>
                      {profile.icon}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-white">{profile.label}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-white/40 text-[11px] font-mono truncate">{profile.user}</span>
                        <span className="text-white/20 text-[11px]">•</span>
                        <span className="text-white/40 text-[11px] font-mono truncate">{profile.pass}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold transition-colors text-white/20 group-hover:text-white/60">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 📚 Shelf Setup Popup Overlay */}
        {showShelfSetup && (
          <div className="fixed inset-0 bg-black/45 z-[99999] flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowShelfSetup(false)}>
            <div className="bg-white/[0.06] border border-white/15 rounded-[32px] backdrop-blur-3xl p-8 w-full max-w-sm shadow-2xl flex flex-col gap-6 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white">
                  <BookOpen size={18} className="text-[#a3b3e6]" /> Academic Setup
                </h3>
                <button onClick={() => setShowShelfSetup(false)} className="transition-colors text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <p className="text-white/40 text-sm font-sans mt-0.5 leading-relaxed -mt-3">Select your academic details to pre-configure your shelf directory.</p>

              {/* Branch Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.15em] font-sans pl-1">Branch</span>
                <div className="relative w-full">
                  <select
                    value={setupBranch}
                    onChange={(e) => setSetupBranch(e.target.value)}
                    className="w-full bg-black/25 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-semibold outline-none focus:border-[#7085c3] cursor-pointer appearance-none transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                  >
                    <option className="bg-[#141a27]" value="Computer Science">Computer Science</option>
                    <option className="bg-[#141a27]" value="Electronics & Communication">Electronics & Communication</option>
                    <option className="bg-[#141a27]" value="Information Technology">Information Technology</option>
                    <option className="bg-[#141a27]" value="Biotechnology">Biotechnology</option>
                  </select>
                  <div className="absolute -translate-y-1/2 pointer-events-none text-white/40 right-5 top-1/2">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Semester Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.15em] font-sans pl-1">Semester</span>
                <div className="relative w-full">
                  <select
                    value={setupSemester}
                    onChange={(e) => setSetupSemester(e.target.value)}
                    className="w-full bg-black/25 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-semibold outline-none focus:border-[#7085c3] cursor-pointer appearance-none transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <option className="bg-[#141a27]" key={i} value={`Semester ${i + 1}`}>Semester {i + 1}</option>
                    ))}
                  </select>
                  <div className="absolute -translate-y-1/2 pointer-events-none text-white/40 right-5 top-1/2">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Glowing Button to Open Shelf */}
              <button
                onClick={() => {
                  setShelfBranch(setupBranch);
                  setShelfSemester(setupSemester);
                  setShowShelfSetup(false);
                  setShowGuestShelf(true);
                }}
                className="w-full bg-white text-[#141a27] hover:bg-slate-100 active:scale-[0.98] transition-all duration-300 font-black tracking-[0.15em] text-xs uppercase rounded-[20px] py-5 shadow-xl shadow-black/10 flex items-center justify-center gap-2 mt-2"
              >
                <span>Open My Shelf</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
