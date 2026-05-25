import React, { useState } from 'react';
import { 
  ArrowRight, Award, Calendar, BookOpen, Clock, 
  DollarSign, CheckCircle2, AlertTriangle, TrendingUp,
  ChevronDown, ChevronUp
} from 'lucide-react';

export default function StudentDashboard({ currentUser, onClose }) {
  const [activeTab, setActiveTab] = useState('attendance');
  const [expandedSubject, setExpandedSubject] = useState(null);

  const studentName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Vardaan Gahlot';

  // 📊 Dynamic Attendance Skip/Bunk Calculator Datastore
  const attendanceData = [
    { code: '15B11CI611', name: 'Software Engineering', attended: 37, held: 45, type: 'Lecture' },
    { code: '15B11CI612', name: 'Compiler Design', attended: 28, held: 39, type: 'Lecture' },
    { code: '15B11CI613', name: 'Computer Networks', attended: 35, held: 45, type: 'Lecture' },
    { code: '15B11CI614', name: 'Machine Learning', attended: 40, held: 45, type: 'Lecture' },
    { code: '15B11CI615', name: 'Web Technologies', attended: 42, held: 45, type: 'Lecture' },
    { code: '15B17CI671', name: 'Software Engineering Lab', attended: 8, held: 10, type: 'Practical' },
    { code: '15B17CI672', name: 'Computer Networks Lab', attended: 9, held: 10, type: 'Practical' }
  ];

  // 📝 Itemized Grades & Marks Datastore
  const gradesData = [
    { 
      name: 'Software Engineering', 
      t1: 12, t2: 13, t3: 31, internal: 33, total: 89, grade: 'A' 
    },
    { 
      name: 'Compiler Design', 
      t1: 10, t2: 11, t3: 28, internal: 30, total: 80, grade: 'B+' 
    },
    { 
      name: 'Computer Networks', 
      t1: 11, t2: 12, t3: 29, internal: 32, total: 84, grade: 'A-' 
    },
    { 
      name: 'Machine Learning', 
      t1: 14, t2: 13, t3: 32, internal: 34, total: 93, grade: 'A+' 
    },
    { 
      name: 'Web Technologies', 
      t1: 13, t2: 14, t3: 33, internal: 33, total: 93, grade: 'A+' 
    }
  ];

  // 📅 Timetable Timeline Datastore
  const timetableData = [
    { time: '09:00 AM - 09:50 AM', subject: 'Software Engineering', room: 'LT-3', instructor: 'Dr. Sandeep Kumar' },
    { time: '10:00 AM - 10:50 AM', subject: 'Compiler Design', room: 'LT-2', instructor: 'Dr. Kavita Pandey' },
    { time: '11:00 AM - 11:50 AM', subject: 'Computer Networks', room: 'LT-1', instructor: 'Dr. Vikas Saxena' },
    { time: '12:00 PM - 01:00 PM', subject: 'Lunch Break', room: 'Canteen / Mess', type: 'break' },
    { time: '01:00 PM - 02:50 PM', subject: 'Computer Networks Lab', room: 'CL-3', instructor: 'Mrs. Neha Aggarwal', type: 'lab' },
    { time: '03:00 PM - 03:50 PM', subject: 'Machine Learning', room: 'LT-3', instructor: 'Dr. Chetna Dabas' }
  ];

  // 💳 Tuition Fee Invoices Datastore
  const feeData = [
    { sem: 'Semester VI', desc: 'Academic Tuition Fee', amount: '₹1,32,500', status: 'PAID', date: 'Jan 12, 2026', txId: 'TXN603912' },
    { sem: 'Semester VI', desc: 'Hostel & Mess Fee', amount: '₹85,000', status: 'PAID', date: 'Jan 12, 2026', txId: 'TXN603956' },
    { sem: 'Semester V', desc: 'Academic Tuition Fee', amount: '₹1,24,000', status: 'PAID', date: 'Jul 15, 2025', txId: 'TXN508129' },
    { sem: 'Semester IV', desc: 'Academic Tuition Fee', amount: '₹1,24,000', status: 'PAID', date: 'Jan 10, 2025', txId: 'TXN401124' }
  ];

  // 🧮 Calculations for Skip/Bunk Attendance
  const calculateAttendanceStat = (attended, held) => {
    if (held === 0) return { pct: 0, status: 'safe', count: 0 };
    const pct = Math.round((attended / held) * 100);
    
    if (pct >= 75) {
      // Calculate how many classes we can skip consecutively and stay above 75%
      // (Attended) / (Held + Skip) >= 0.75  => Attended >= 0.75 * Held + 0.75 * Skip => Skip <= (Attended - 0.75 * Held) / 0.75
      const maxSkip = Math.floor((attended * 4 - held * 3) / 3);
      return { pct, status: 'safe', count: Math.max(0, maxSkip) };
    } else {
      // Calculate how many consecutive classes we must attend to cross 75%
      // (Attended + Attend) / (Held + Attend) >= 0.75 => Attended + Attend >= 0.75 * Held + 0.75 * Attend => 0.25 * Attend >= 0.75 * Held - Attended
      // Attend >= 3 * Held - 4 * Attended
      const minAttend = Math.ceil((3 * held - 4 * attended) / 1);
      return { pct, status: 'danger', count: Math.max(0, minAttend) };
    }
  };

  return (
    <div className="flex flex-col gap-4 text-white font-sans h-full w-full select-none pb-24 relative min-h-screen">
      {/* ─── Compact Page Header ─── */}
      <header className="flex items-center w-full mt-6 pb-2 shrink-0 justify-between animate-fadeIn select-none">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="w-11 h-11 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer shrink-0"
            type="button"
          >
            <span className="text-xl font-bold">&larr;</span>
          </button>
          <h2 className="flex items-center pl-3.5 text-left translate-y-[2.5px] text-[22px] italic font-bold text-white leading-none tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Student Dashboard
          </h2>
        </div>
      </header>

      {/* ─── Immersive Glassmorphic ID Overview Card ─── */}
      <div className="bg-amber-500/[0.03] border-2 border-amber-500/30 text-white rounded-[28px] p-5 flex flex-col gap-4 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] relative overflow-hidden group select-none animate-fadeIn">
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-black font-sans shadow-md border border-white/10 shrink-0 select-none">
              VG
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white leading-tight font-sans tracking-wide">{studentName}</h3>
              <span className="text-[10px] font-bold text-amber-400 font-mono tracking-wider block mt-0.5 uppercase">Enrollment ID: 20103120</span>
            </div>
          </div>
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0 shadow-sm animate-pulse">
            🟢 Active
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full pt-3.5 border-t border-white/10 text-left font-sans">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Branch</span>
            <span className="text-xs font-bold text-slate-200">CSE</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Semester</span>
            <span className="text-xs font-bold text-slate-200">VI (Junior)</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">CGPA / SGPA</span>
            <span className="text-xs font-extrabold text-amber-400 font-mono">8.74 / 8.90</span>
          </div>
        </div>
      </div>

      {/* ─── Task Bar Switcher ─── */}
      <div className="flex justify-center w-full py-1 shrink-0 select-none animate-fadeIn">
        <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/10 shadow-inner overflow-x-auto scrollbar-none max-w-full">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-2 px-4.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer shrink-0 ${
              activeTab === 'attendance'
                ? 'bg-white text-[#141a27] shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            type="button"
          >
            Attendance
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`py-2 px-4.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer shrink-0 ${
              activeTab === 'grades'
                ? 'bg-white text-[#141a27] shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            type="button"
          >
            Grades
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`py-2 px-4.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer shrink-0 ${
              activeTab === 'timetable'
                ? 'bg-white text-[#141a27] shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            type="button"
          >
            Timetable
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`py-2 px-4.5 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer shrink-0 ${
              activeTab === 'fees'
                ? 'bg-white text-[#141a27] shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            type="button"
          >
            Fees
          </button>
        </div>
      </div>

      {/* ─── Tab Content Workspace (Scroll-locked inside viewports) ─── */}
      <div className="flex-1 overflow-y-auto scrollbar-none min-h-0 animate-fadeIn">
        
        {/* 📊 1. Attendance skip calculator */}
        {activeTab === 'attendance' && (
          <div className="flex flex-col gap-3 pb-8">
            {attendanceData.map((item, idx) => {
              const stat = calculateAttendanceStat(item.attended, item.held);
              const cardBorder = stat.status === 'danger'
                ? 'border-rose-500/35 bg-rose-500/[0.01]'
                : 'border-white/10 bg-white/[0.03]';

              return (
                <div 
                  key={idx}
                  className={`rounded-2xl p-4.5 border flex flex-col gap-3 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.01] ${cardBorder}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="text-left flex-1 min-w-0 pr-3">
                      <span className="text-[8px] font-black text-slate-400 tracking-wider font-mono block uppercase">{item.code} • {item.type}</span>
                      <h4 className="text-sm font-bold text-white font-sans mt-0.5 truncate">{item.name}</h4>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0">
                      <span className={`text-base font-black font-mono leading-none ${stat.status === 'danger' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {stat.pct}%
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1.5 font-mono uppercase tracking-wide">
                        {item.attended}/{item.held} Classes
                      </span>
                    </div>
                  </div>

                  {/* Skipper calculator advice pill */}
                  <div className="w-full pt-3.5 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {stat.status === 'danger' ? (
                        <AlertTriangle size={14} className="text-rose-400 animate-bounce" />
                      ) : (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      )}
                      <span className="text-[10px] font-semibold text-slate-200 text-left leading-none font-sans">
                        {stat.status === 'danger' 
                          ? `Must attend ${stat.count} class${stat.count > 1 ? 'es' : ''} consecutively` 
                          : stat.count > 0 
                            ? `Can skip ${stat.count} class${stat.count > 1 ? 'es' : ''} consecutively` 
                            : 'Borderline. Attend next class!'}
                      </span>
                    </div>
                    
                    <span className={`text-[8px] font-black uppercase tracking-widest font-mono ${stat.status === 'danger' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {stat.status === 'danger' ? '⚠️ SHORTAGE' : '🟢 SECURE'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 📝 2. Grades & Marks list */}
        {activeTab === 'grades' && (
          <div className="flex flex-col gap-3 pb-8">
            {/* CGPA Trend visual block */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md shadow-sm">
              <div className="text-left">
                <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase block font-mono">Academic Trend</span>
                <h4 className="text-sm font-bold text-white font-sans mt-0.5">CGPA progression</h4>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl text-xs font-mono font-bold">
                <TrendingUp size={14} /> +0.16 Increase
              </div>
            </div>

            {/* Subject list grades cards */}
            {gradesData.map((item, idx) => {
              const isExpanded = expandedSubject === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300 shadow-sm"
                >
                  <div 
                    onClick={() => setExpandedSubject(isExpanded ? null : idx)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] select-none"
                  >
                    <div className="text-left flex-1 min-w-0 pr-3">
                      <h4 className="text-sm font-bold text-white font-sans truncate">{item.name}</h4>
                      <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider block mt-1 uppercase">Total: {item.total}/100</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center font-mono font-extrabold text-xs text-amber-400 shadow-inner">
                        {item.grade}
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4.5 pt-1 border-t border-white/5 bg-white/[0.01] grid grid-cols-4 gap-2 text-left font-sans animate-fadeIn">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">T1 (15)</span>
                        <span className="text-xs font-mono font-bold text-slate-200">{item.t1}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">T2 (15)</span>
                        <span className="text-xs font-mono font-bold text-slate-200">{item.t2}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">T3 (35)</span>
                        <span className="text-xs font-mono font-bold text-slate-200">{item.t3}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">Internal (35)</span>
                        <span className="text-xs font-mono font-bold text-slate-200">{item.internal}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 📅 3. Timetable vertical timeline */}
        {activeTab === 'timetable' && (
          <div className="flex flex-col gap-3.5 pb-8 relative pl-6 border-l border-white/10 ml-3 pt-3">
            {timetableData.map((item, idx) => {
              const markerBg = item.type === 'break' 
                ? 'bg-slate-500/80 border-slate-400' 
                : item.type === 'lab' 
                  ? 'bg-cyan-500/80 border-cyan-400' 
                  : 'bg-amber-500/80 border-amber-400';

              const cardBg = item.type === 'break'
                ? 'bg-white/[0.01] border-white/5 text-slate-400'
                : 'bg-white/[0.03] border-white/10 text-white';

              return (
                <div key={idx} className="relative flex flex-col gap-2 animate-fadeIn">
                  {/* Circular Timeline Node Pin */}
                  <div className={`absolute left-[-30px] top-[3px] w-3 h-3 rounded-full border-2 ${markerBg} shadow-md shadow-black/10`} />

                  {/* Time Stamp */}
                  <div className="flex items-center gap-1.5 text-left text-slate-400 text-[10px] font-mono font-bold tracking-wider leading-none select-none pl-1">
                    <Clock size={11} /> {item.time}
                  </div>

                  {/* Schedule Details Card */}
                  <div className={`rounded-2xl p-4.5 border flex justify-between items-start backdrop-blur-md shadow-sm text-left ${cardBg}`}>
                    <div className="flex-1 min-w-0 pr-3">
                      <h4 className="text-sm font-bold truncate leading-snug">{item.subject}</h4>
                      {item.instructor && <span className="text-[10px] font-semibold text-slate-400 block mt-1.5">{item.instructor}</span>}
                    </div>

                    <div className="shrink-0 rounded-xl bg-white/[0.04] border border-white/5 px-3 py-1.5 flex items-center justify-center font-mono font-extrabold text-[10px] text-amber-400 shadow-inner tracking-wider">
                      {item.room}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 💳 4. Fees details Receipts */}
        {activeTab === 'fees' && (
          <div className="flex flex-col gap-3 pb-8">
            {feeData.map((item, idx) => {
              return (
                <div 
                  key={idx}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-4.5 flex flex-col gap-3.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.01] animate-fadeIn"
                >
                  <div className="flex justify-between items-start w-full border-b border-white/5 pb-3">
                    <div className="text-left">
                      <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase block font-mono">{item.sem}</span>
                      <h4 className="text-sm font-bold text-white font-sans mt-0.5">{item.desc}</h4>
                    </div>

                    <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-sm flex items-center gap-1 leading-none select-none">
                      <CheckCircle2 size={11} /> {item.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-end w-full text-left font-sans pt-0.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">Date Paid / Receipt</span>
                      <span className="text-[11px] font-bold text-slate-300 font-mono">{item.date}</span>
                    </div>

                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">Amount Paid</span>
                      <span className="text-base font-mono font-black text-amber-400 leading-none">{item.amount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
