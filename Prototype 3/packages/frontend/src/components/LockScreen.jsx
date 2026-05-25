import React, { useState, useEffect } from 'react';
import { Utensils, Shield, User, ArrowRight, Download, Calendar, BookOpen, Clock, X, KeyRound, Coffee, Sun, Moon, ChevronDown, GraduationCap, QrCode, SmartphoneNfc, CreditCard } from 'lucide-react';
import MessMenu from './MessMenu';
import StudyMaterials from './StudyMaterials';
import AcademicCalendar from './AcademicCalendar';


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
  const [guestShelfBranch, setGuestShelfBranch] = useState('All Branches');
  const [guestShelfSemester, setGuestShelfSemester] = useState('All Semesters');

  // Additional Guest State Hooks for pass expiration, payment processing & QR pass
  const [showGuestQr, setShowGuestQr] = useState(false);
  const [showGuestPayment, setShowGuestPayment] = useState(false);
  const [processingGuestPayment, setProcessingGuestPayment] = useState(false);
  const [guestPaymentData, setGuestPaymentData] = useState(null);
  const [activeGuestPass, setActiveGuestPass] = useState(null);
  const [remainingGuestMinutes, setRemainingGuestMinutes] = useState(0);

  // Live Guest Pass checker effect
  useEffect(() => {
    const checkGuestPass = () => {
      const passStr = localStorage.getItem('cp_token_guest');
      if (passStr) {
        try {
          const pass = JSON.parse(passStr);
          if (pass && pass.ExpiryTime) {
            const remainingMs = new Date(pass.ExpiryTime) - new Date();
            const mins = Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
            if (mins > 0) {
              setActiveGuestPass(pass);
              setRemainingGuestMinutes(mins);
            } else {
              localStorage.removeItem('cp_token_guest');
              setActiveGuestPass(null);
              setRemainingGuestMinutes(0);
            }
          }
        } catch (e) {
          setActiveGuestPass(null);
        }
      } else {
        setActiveGuestPass(null);
        setRemainingGuestMinutes(0);
      }
    };

    checkGuestPass();
    const interval = setInterval(checkGuestPass, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to today's mess menu card when opening the overlay
  useEffect(() => {
    if (showGuestMess) {
      const timer = setTimeout(() => {
        const activeCard = document.getElementById('today-mess-card');
        if (activeCard) {
          activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showGuestMess]);

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
    {
      date: 'Tuesday, November 18, 2025',
      category: 'Project / Dissertation',
      tags: ['Odd Sem', 'Deadline'],
      desc: 'Major Project allocation for next year by',
      theme: 'teal'
    },
    {
      date: 'Tuesday, November 18, 2025',
      category: 'Project / Dissertation',
      tags: ['Odd Sem', 'Deadline'],
      desc: 'Minor Project allocation for next Semester by',
      theme: 'teal'
    },
    {
      date: 'Thursday, November 20, 2025',
      category: 'Project / Dissertation',
      tags: ['Odd Sem', 'Exam'],
      desc: 'Final Project Viva / End-Term Seminar / Evaluation of Dissertation',
      theme: 'teal'
    },
    {
      date: 'Friday, November 21, 2025',
      category: 'Feedback',
      tags: ['Odd Sem', 'Deadline'],
      desc: 'Students\' Online Feed Back Collection by',
      theme: 'rose'
    },
    {
      date: 'Tuesday, November 25, 2025',
      category: 'Attendance Review',
      tags: ['Odd Sem', 'Academic'],
      desc: 'End Semester Attendance Review',
      theme: 'amber'
    },
    {
      date: 'Tuesday, November 25, 2025',
      category: 'Project / Dissertation',
      tags: ['Odd Sem', 'Deadline'],
      desc: 'Submission of Project/Dissertation reports/Term Paper',
      theme: 'teal'
    },
    {
      date: 'Friday, November 28, 2025',
      category: 'End of Classes',
      tags: ['Odd Sem', 'Deadline'],
      desc: 'Classes to be over',
      theme: 'magenta'
    },
    {
      date: 'Friday, November 28, 2025',
      category: 'Academic',
      tags: ['Odd Sem', 'Meeting'],
      desc: 'Academic Council Meeting',
      theme: 'purple'
    }
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

  if (showGuestPayment) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#050608] via-[#0b0c10] to-[#040507] text-white z-[999999] font-sans overflow-hidden animate-fadeIn flex flex-col p-6">
        {/* Premium morphing wallpaper gradient blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#6366f1]/45 via-[#a855f7]/30 to-transparent animate-blob1" />
          <div className="absolute bottom-[-20%] left-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#d946ef]/35 via-[#8b5cf6]/25 to-transparent animate-blob2" />
          <div className="absolute top-[20%] left-[5%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#06b6d4]/35 via-[#10b981]/15 to-transparent animate-blob3" />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full h-full max-w-md mx-auto">
          {/* Header with circular back button */}
          <header className="flex items-center justify-between w-full py-2 shrink-0">
            <button
              onClick={() => setShowGuestPayment(false)}
              className="w-12 h-12 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer"
              title="Back to Mess Menu"
              type="button"
            >
              <span className="text-xl font-bold">&larr;</span>
            </button>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">Guest Payment Gateway</span>
            <div className="w-12 h-12"></div> {/* spacer */}
          </header>

          <div className="flex flex-col items-center justify-center flex-1 w-full">
            {/* Centered Massive Price */}
            <div className="mb-12 text-center animate-fadeIn">
              <span className="block mb-2 font-mono text-xs font-bold tracking-widest uppercase text-slate-400">Total Payable Amount</span>
              <div className="font-sans text-6xl font-black tracking-tight text-white select-none">
                ₹{guestPaymentData?.amount || 60}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col w-full max-w-sm gap-4">
              <span className="pl-1 font-sans text-xs font-bold tracking-wider text-left uppercase text-slate-400">Select Payment Method</span>
              
              {/* UPI / GPay */}
              <button
                onClick={async () => {
                  try {
                    setProcessingGuestPayment(true);
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    
                    const generatedId = 'GUEST_PASS_' + Math.random().toString(36).substring(2, 10).toUpperCase();
                    const guestToken = {
                      _id: generatedId,
                      Token: generatedId,
                      ExpiryTime: new Date(Date.now() + 90 * 60 * 1000).toISOString()
                    };
                    
                    localStorage.setItem('cp_token_guest', JSON.stringify(guestToken));
                    window.dispatchEvent(new Event('storage'));
                    
                    setShowGuestPayment(false);
                    setShowGuestQr(true);
                  } catch (err) {
                    alert('Simulated guest payment failed.');
                  } finally {
                    setProcessingGuestPayment(false);
                  }
                }}
                className="w-full flex items-center justify-between p-5 rounded-2xl border border-white/10 hover:border-white/35 active:scale-[0.99] transition-all duration-300 bg-white/[0.04] hover:bg-white/[0.08] group shadow-lg cursor-pointer"
                type="button"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-300 transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                    <SmartphoneNfc size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-extrabold text-white transition-colors group-hover:text-indigo-300">UPI / GPay</h4>
                    <p className="text-slate-400 text-xs mt-0.5 font-medium">Instant transfer using any UPI app</p>
                  </div>
                </div>
                <div className="font-mono text-sm font-extrabold text-slate-500 group-hover:text-white">&rarr;</div>
              </button>

              {/* Credit / Debit Card */}
              <button
                onClick={async () => {
                  try {
                    setProcessingGuestPayment(true);
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    
                    const generatedId = 'GUEST_PASS_' + Math.random().toString(36).substring(2, 10).toUpperCase();
                    const guestToken = {
                      _id: generatedId,
                      Token: generatedId,
                      ExpiryTime: new Date(Date.now() + 90 * 60 * 1000).toISOString()
                    };
                    
                    localStorage.setItem('cp_token_guest', JSON.stringify(guestToken));
                    window.dispatchEvent(new Event('storage'));
                    
                    setShowGuestPayment(false);
                    setShowGuestQr(true);
                  } catch (err) {
                    alert('Simulated guest payment failed.');
                  } finally {
                    setProcessingGuestPayment(false);
                  }
                }}
                className="w-full flex items-center justify-between p-5 rounded-2xl border border-white/10 hover:border-white/35 active:scale-[0.99] transition-all duration-300 bg-white/[0.04] hover:bg-white/[0.08] group shadow-lg cursor-pointer"
                type="button"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-300 transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                    <CreditCard size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-extrabold text-white transition-colors group-hover:text-indigo-300">Card</h4>
                    <p className="text-slate-400 text-xs mt-0.5 font-medium">Visa, Mastercard, RuPay</p>
                  </div>
                </div>
                <div className="font-mono text-sm font-extrabold text-slate-500 group-hover:text-white">&rarr;</div>
              </button>
            </div>
          </div>

          {/* Premium copyright footer */}
          <p className="text-center text-[8px] text-white/20 tracking-[0.25em] uppercase font-bold select-none py-4 mt-auto">
            Secured by CampOS Gateway
          </p>
        </div>

        {/* Full-screen semi-transparent loading overlay */}
        {processingGuestPayment && (
          <div className="absolute inset-0 bg-[#050608]/98 backdrop-blur-md z-[9999999] flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
            <div className="border-4 border-indigo-500 rounded-full w-14 h-14 border-t-transparent animate-spin"></div>
            <h3 className="mt-6 font-sans text-lg font-black tracking-tight text-white">Processing Payment...</h3>
            <p className="text-slate-400 text-[10px] font-semibold mt-2 tracking-widest font-mono uppercase">Securing connection to banker</p>
          </div>
        )}
      </div>
    );
  }

  if (showGuestQr) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#050608] via-[#0b0c10] to-[#040507] text-white flex flex-col items-center justify-center p-6 z-[999999] overflow-hidden font-sans">
        {/* Premium morphing wallpaper gradient blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#6366f1]/45 via-[#a855f7]/30 to-transparent animate-blob1" />
          <div className="absolute bottom-[-20%] left-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#d946ef]/35 via-[#8b5cf6]/25 to-transparent animate-blob2" />
          <div className="absolute top-[20%] left-[5%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#06b6d4]/35 via-[#10b981]/15 to-transparent animate-blob3" />
        </div>

        <div className="z-10 flex flex-col items-center w-full max-w-md text-center">
          <h2 className="mt-2 text-4xl font-black tracking-tight">Guest Pass</h2>
          
          <div className="flex items-center gap-2 mt-4 opacity-80">
            <Clock size={20} className="text-white" />
            <span className="font-sans text-sm font-semibold tracking-wide text-white">
              {remainingGuestMinutes > 0 ? `Valid for ${remainingGuestMinutes} Mins` : 'Expired'}
            </span>
          </div>

          {/* Massive white QR card */}
          <div className="w-full max-w-sm bg-white p-8 rounded-[32px] shadow-2xl mt-8 flex flex-col items-center justify-center transform hover:scale-[1.02] transition-transform duration-300">
            <div className="p-1.5 bg-slate-50 rounded-[24px]">
              <QrCode size={240} className="text-black" />
            </div>
            
            <div className="mt-6 text-center">
              <p className="font-mono text-xs font-bold tracking-widest uppercase text-slate-400">Pass Verification Code</p>
              <p className="mt-1 font-mono text-base font-black tracking-wide text-indigo-950">
                {activeGuestPass ? `ID: #${String(activeGuestPass._id || activeGuestPass.Token || '').substring(0, 12).toUpperCase()}` : 'ACTIVE PASS'}
              </p>
            </div>
          </div>

          {/* Translucent floating close button */}
          <button
            onClick={() => setShowGuestQr(false)}
            className="flex items-center justify-center mt-12 text-white transition-all duration-300 border rounded-full shadow-lg cursor-pointer h-14 w-14 bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border-white/20 shadow-black/10"
            title="Close Pass"
            type="button"
          >
            <X size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (showGuestMess) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#050608] via-[#0b0c10] to-[#040507] text-white z-[99999] font-sans overflow-hidden animate-fadeIn">
        {/* Premium morphing wallpaper gradient blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#6366f1]/45 via-[#a855f7]/30 to-transparent animate-blob1" />
          <div className="absolute bottom-[-20%] left-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#d946ef]/35 via-[#8b5cf6]/25 to-transparent animate-blob2" />
          <div className="absolute top-[20%] left-[5%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#06b6d4]/35 via-[#10b981]/15 to-transparent animate-blob3" />
        </div>

        {/* Scrollable content layer */}
        <div className="absolute inset-0 z-10 p-6 overflow-y-auto scrollbar-none">
          <div className="flex flex-col w-full max-w-md min-h-full mx-auto">
            <MessMenu 
              currentUser={null} 
              setActiveTab={(tab) => {
                if (tab === 'home') {
                  setShowGuestMess(false);
                } else if (tab === 'MESS_QR_FULL') {
                  setShowGuestQr(true);
                }
              }}
              triggerPayment={(amount, source) => {
                setGuestPaymentData({ amount, source });
                setShowGuestPayment(true);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (showGuestCalendar) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#050608] via-[#0b0c10] to-[#040507] text-white z-[99999] font-sans overflow-hidden">
        {/* Premium morphing wallpaper gradient blobs (fixed background) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#6366f1]/45 via-[#a855f7]/30 to-transparent animate-blob1" />
          <div className="absolute bottom-[-20%] left-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#d946ef]/35 via-[#8b5cf6]/25 to-transparent animate-blob2" />
          <div className="absolute top-[20%] left-[5%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#06b6d4]/35 via-[#10b981]/15 to-transparent animate-blob3" />
        </div>

        {/* Scrollable content layer */}
        <div className="absolute inset-0 z-10 p-6 overflow-hidden">
          <div className="w-full h-full max-w-md mx-auto">
            <AcademicCalendar setActiveTab={() => setShowGuestCalendar(false)} />
          </div>
        </div>
      </div>
    );
  }

  if (showGuestShelf) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#050608] via-[#0b0c10] to-[#040507] text-white z-[99999] font-sans overflow-hidden">
        {/* Premium morphing wallpaper gradient blobs (fixed background, never scrolls) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#6366f1]/45 via-[#a855f7]/30 to-transparent animate-blob1" />
          <div className="absolute bottom-[-20%] left-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#d946ef]/35 via-[#8b5cf6]/25 to-transparent animate-blob2" />
          <div className="absolute top-[20%] left-[5%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#06b6d4]/35 via-[#10b981]/15 to-transparent animate-blob3" />
        </div>

        {/* Scrollable content layer */}
        <div className="absolute inset-0 z-10 p-6 overflow-hidden">
          <div className="w-full h-full max-w-md mx-auto">
            <StudyMaterials 
              setActiveTab={() => setShowGuestShelf(false)} 
              initialBranch={guestShelfBranch}
              initialSemester={guestShelfSemester}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#050608] via-[#0b0c10] to-[#040507] flex flex-col justify-between items-center p-6 z-[9999] overflow-hidden select-none font-sans h-full text-white relative">
      
      {/* Premium morphing wallpaper gradient blobs (z-0, behind content) */}
      <div className="absolute top-[-20%] right-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-br from-[#6366f1]/45 via-[#a855f7]/30 to-transparent pointer-events-none z-0 animate-blob1" />
      <div className="absolute bottom-[-20%] left-[-25%] w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-[#d946ef]/35 via-[#8b5cf6]/25 to-transparent pointer-events-none z-0 animate-blob2" />
      <div className="absolute top-[20%] left-[5%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#06b6d4]/35 via-[#10b981]/15 to-transparent pointer-events-none z-0 animate-blob3" />

      {/* 🟢/🔴 Portal Online/Offline Status Indicator (Top Right) */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 shadow-md">
        <span className="relative flex w-2 h-2">
          {isOnline && (
            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-emerald-400"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></span>
        </span>
        <span className={`text-[9px] font-sans font-black tracking-[0.15em] select-none ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <div className="w-full max-w-[330px] flex flex-col justify-center items-center h-full z-10 relative pt-[90px] pb-2 gap-5">
        
        {/* ✍️ Playfair Display left-aligned elegant branding header */}
        <header className="flex flex-col items-start w-full text-left select-none animate-fadeIn" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          <span className="text-[22px] font-light text-white/95 leading-tight tracking-tight">
            Log into your
          </span>
          <span className="italic font-normal text-[32px] text-white leading-none mt-0.5 tracking-tight">
            CampOS
          </span>
        </header>

        {/* 🎫 Guest Pass Live Activity Card on Lockscreen (Quick Access) */}
        {activeGuestPass && (
          <div 
            onClick={() => setShowGuestQr(true)}
            className="w-full bg-emerald-500/[0.07] backdrop-blur-2xl border border-emerald-500/35 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-emerald-500/10 cursor-pointer select-none transition-all hover:scale-[1.01] active:scale-[0.98] animate-fadeIn w-full text-left"
          >
            <div className="flex flex-col">
              <span className="font-sans text-sm font-extrabold tracking-wide text-white">Mess Access Pass</span>
              <span className="text-emerald-300 font-bold text-xs flex items-center gap-1.5 mt-1 font-sans">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active • {remainingGuestMinutes} Mins Left
              </span>
            </div>
            <div className="w-9 h-9 bg-white/[0.08] border border-white/10 rounded-xl flex items-center justify-center">
              <QrCode size={18} className="text-white" />
            </div>
          </div>
        )}

        {/* 📥 Form input panel */}
        <form onSubmit={handleLogin} className="flex flex-col w-full gap-5 mt-2">
          
          {/* Username Outlined Input with Header Label */}
          <div className="flex flex-col w-full gap-0.5 text-left">
            <span className="text-[10px] font-sans font-black uppercase tracking-widest text-slate-400 pl-1 select-none pointer-events-none">
              username
            </span>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/[0.05] border border-white/20 backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] focus:border-white/40 focus:ring-2 focus:ring-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white tracking-wide transition-all duration-300 ease-out outline-none focus:scale-[1.015] focus:shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
            />
          </div>

          {/* Password Outlined Input with Header Label */}
          <div className="flex flex-col w-full gap-0.5 text-left">
            <span className="text-[10px] font-sans font-black uppercase tracking-widest text-slate-400 pl-1 select-none pointer-events-none">
              password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/[0.05] border border-white/20 backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] focus:border-white/40 focus:ring-2 focus:ring-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white tracking-wide transition-all duration-300 ease-out outline-none focus:scale-[1.015] focus:shadow-[0_8px_30px_rgba(255,255,255,0.1)]"
            />
          </div>

          {loginError && (
            <div className="p-3 mt-1 text-xs font-semibold text-center text-red-200 border bg-red-500/10 border-red-500/20 rounded-2xl animate-fadeIn">
              ⚠️ {loginError}
            </div>
          )}

          {/* Solid White LOGIN Action Button with Glowing Halo */}
          <div className="relative flex flex-col w-full mt-2 group rounded-xl">
            {/* Soft, vibrant glowing background halo */}
            <div className="absolute inset-0 bg-[#7085c3]/20 rounded-xl blur-xl opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500 pointer-events-none" />
            <button
              type="submit"
              disabled={submitting}
              className="relative w-full bg-white text-[#141a27] hover:bg-slate-50 active:scale-[0.98] disabled:hover:bg-white disabled:active:scale-100 transition-all duration-300 font-extrabold tracking-[0.15em] text-xs uppercase rounded-xl py-3.5 shadow-xl shadow-black/10 flex items-center justify-center gap-2"
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
        <div className="flex items-center justify-between w-full gap-4 mt-2">
          <div className="flex-1 border-t border-slate-700/50"></div>
          <span className="font-sans text-xs font-bold tracking-widest text-slate-400">OR</span>
          <div className="flex-1 border-t border-slate-700/50"></div>
        </div>

        {/* 🎛️ Bottom Public Access Slate-Blue buttons */}
        <footer className="flex flex-col w-full mt-2 mb-1">
          {/* Main public access actions: Symmetrically centered horizontal widgets with inner flex-col containers */}
          <div className="flex w-full gap-3 mb-5">
            <button
              type="button"
              onClick={() => setShowGuestMess(true)}
              className="group flex flex-col items-center justify-center gap-1.5 py-3 bg-white/[0.06] border border-white/20 hover:border-white/30 hover:bg-white/[0.12] active:scale-[0.97] text-slate-300 hover:text-white rounded-xl flex-1 select-none cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
            >
              <Utensils size={16} className="text-slate-400 group-hover:text-[#a3b3e6] transition-colors duration-300" />
              <span className="text-[9px] font-bold uppercase tracking-wider">mess menu</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShowGuestCalendar(true)}
              className="group flex flex-col items-center justify-center gap-1.5 py-3 bg-white/[0.06] border border-white/20 hover:border-white/30 hover:bg-white/[0.12] active:scale-[0.97] text-slate-300 hover:text-white rounded-xl flex-1 select-none cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
            >
              <Calendar size={16} className="text-slate-400 group-hover:text-[#a3b3e6] transition-colors duration-300" />
              <span className="text-[9px] font-bold uppercase tracking-wider">calendar</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setSetupBranch('Computer Science');
                setSetupSemester('Semester 1');
                setShowShelfSetup(true);
              }}
              className="group flex flex-col items-center justify-center gap-1.5 py-3 bg-white/[0.06] border border-white/20 hover:border-white/30 hover:bg-white/[0.12] active:scale-[0.97] text-slate-300 hover:text-white rounded-xl flex-1 select-none cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
            >
              <BookOpen size={16} className="text-slate-400 group-hover:text-[#a3b3e6] transition-colors duration-300" />
              <span className="text-[9px] font-bold uppercase tracking-wider">shelf</span>
            </button>
          </div>

          {/* Dev Utility - Completely separated text link for easy removal later */}
          <div className="flex justify-center items-center w-full pt-4 border-t border-white/5 gap-3.5">
            <button
              type="button"
              onClick={() => setShowDemoProfiles(true)}
              className="group flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a3b3e6]/60 hover:text-white select-none cursor-pointer transition-all duration-300 py-1"
            >
              <KeyRound size={12} className="text-[#a3b3e6]/50 group-hover:text-white transition-colors duration-300" />
              <span>demo credentials</span>
            </button>
            
            <span className="text-white/10 text-[10px] font-sans font-black select-none">|</span>

            <button
              type="button"
              onClick={() => {
                // Selectively clear all CampOS local keys
                Object.keys(localStorage).forEach((key) => {
                  if (key.startsWith('cp_')) {
                    localStorage.removeItem(key);
                  }
                });
                window.dispatchEvent(new Event('storage'));
                alert('Demo environment successfully reset! All passes, tickets, and logs have been cleared.');
                window.location.reload();
              }}
              className="group flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400/60 hover:text-rose-300 select-none cursor-pointer transition-all duration-300 py-1"
            >
              <X size={12} className="transition-colors duration-300 text-rose-400/50 group-hover:text-rose-300" />
              <span>reset demo</span>
            </button>
          </div>
        </footer>

        {/* 📜 Premium elegant copyright text */}
        <p className="text-center text-[9px] text-white/20 tracking-[0.25em] uppercase font-bold select-none mt-1 mb-1 font-sans">
          © 2026 CampOS. All rights reserved.
        </p>

      </div>

      {/* 🔑 Demo Profiles Popup Overlay — positioned at root level for full-screen coverage */}
      {showDemoProfiles && (
        <div className="absolute inset-0 bg-black/70 z-[99999] flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowDemoProfiles(false)}>
          <div className="bg-[#1c2436]/70 border border-white/10 backdrop-blur-xl rounded-3xl p-6 w-full max-w-[340px] shadow-2xl flex flex-col gap-5 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]" onClick={(e) => e.stopPropagation()}>
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

      {/* 📚 Shelf Setup Popup Overlay — positioned at root level for full-screen coverage */}
      {showShelfSetup && (
        <div className="absolute inset-0 bg-black/70 z-[99999] flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowShelfSetup(false)}>
          <div className="bg-[#1c2436]/70 border border-white/10 backdrop-blur-xl rounded-3xl p-6 w-full max-w-[340px] shadow-2xl flex flex-col gap-5 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]" onClick={(e) => e.stopPropagation()}>
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
                  className="w-full bg-black/25 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-semibold outline-none focus:border-[#7085c3] cursor-pointer appearance-none transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
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
                  className="w-full bg-black/25 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-semibold outline-none focus:border-[#7085c3] cursor-pointer appearance-none transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
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
                setGuestShelfBranch(setupBranch);
                setGuestShelfSemester(setupSemester);
                setShowShelfSetup(false);
                setShowGuestShelf(true);
              }}
              className="w-full bg-white text-[#141a27] hover:bg-slate-100 active:scale-[0.98] transition-all duration-300 font-black tracking-[0.15em] text-xs uppercase rounded-2xl py-4 shadow-xl shadow-black/10 flex items-center justify-center gap-2 mt-2"
            >
              <span>Open My Shelf</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}



    </div>
  );
}
