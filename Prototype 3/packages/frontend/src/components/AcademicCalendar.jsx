import React, { useState } from 'react';
import { GraduationCap, Calendar } from 'lucide-react';

export default function AcademicCalendar({ setActiveTab }) {
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  const handleScroll = (e) => {
    const currentScrollTop = e.target.scrollTop;
    
    if (currentScrollTop <= 5) {
      setIsHeaderMinimized(false);
      setLastScrollTop(0);
      return;
    }
    
    if (Math.abs(currentScrollTop - lastScrollTop) < 8) return;

    if (currentScrollTop > lastScrollTop) {
      setIsHeaderMinimized(true);
    } else {
      setIsHeaderMinimized(false);
    }
    setLastScrollTop(currentScrollTop);
  };
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
      desc: "Students' Online Feed Back Collection by",
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

  const themeStyles = {
    teal: {
      border: 'border-teal-500/40 bg-teal-950/[0.04]',
      badge: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
      iconColor: 'text-[#0d9488]'
    },
    rose: {
      border: 'border-rose-500/40 bg-rose-950/[0.04]',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      iconColor: 'text-[#e11d48]'
    },
    amber: {
      border: 'border-amber-500/40 bg-amber-950/[0.04]',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      iconColor: 'text-[#d97706]'
    },
    magenta: {
      border: 'border-pink-500/40 bg-pink-950/[0.04]',
      badge: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
      iconColor: 'text-[#db2777]'
    },
    purple: {
      border: 'border-purple-500/40 bg-purple-950/[0.04]',
      badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      iconColor: 'text-[#9333ea]'
    }
  };

  return (
    <div className="relative flex flex-col h-full max-h-full gap-4 pb-4 overflow-hidden font-sans text-white select-none academic-calendar-dashboard">
      
      {/* Collapsible Area */}
      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden flex flex-col gap-4 shrink-0 ${
          isHeaderMinimized 
            ? 'max-h-0 opacity-0 scale-95 pointer-events-none mb-0 mt-0 pb-0' 
            : 'max-h-[150px] opacity-100 scale-100 mb-1'
        }`}
      >
        {/* Header title */}
        <header className="flex items-center justify-between w-full pb-2 mt-2">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setActiveTab && setActiveTab('home')}
              className="w-11 h-11 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer shrink-0"
              type="button"
            >
              <span className="text-xl font-bold">&larr;</span>
            </button>
            <h2 className="text-2xl font-bold text-white leading-none flex items-center gap-2 translate-y-[2px]" style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}>
              <Calendar size={20} className="text-indigo-400" /> Academic Calendar
            </h2>
          </div>
        </header>
      </div>

      {/* Timeline Event Cards */}
      <div 
        onScroll={handleScroll}
        className="flex-1 pb-8 pr-1 space-y-5 overflow-y-auto animate-fadeIn scrollbar-none"
      >
        {calendarEvents.map((event, idx) => {
          const style = themeStyles[event.theme] || themeStyles.teal;
          return (
            <div
              key={idx}
              className={`rounded-[28px] p-6 transition-all duration-500 relative border-2 ${style.border} ${style.bg} backdrop-blur-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-xl flex flex-col gap-4 hover:scale-[1.005]`}
            >
              {/* Header: Title and Tags */}
              <div className="flex flex-col items-start gap-2 text-left">
                <div className="flex items-center flex-wrap gap-2.5">
                  <GraduationCap size={18} className={`${style.iconColor} shrink-0`} />
                  <h4 className="font-sans text-base font-extrabold leading-none tracking-wide text-white">
                    {event.category}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${style.badge}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <p className="text-xs font-semibold text-slate-300 leading-relaxed pl-[28px]">
                  {event.desc}
                </p>
              </div>

              {/* Date stamp pill aligned nicely */}
              <div className="flex justify-end mt-1">
                <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-xl px-3.5 py-1.5 shadow-md">
                  <Calendar size={12} className="text-slate-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold tracking-wide text-slate-200">
                    {event.date}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
