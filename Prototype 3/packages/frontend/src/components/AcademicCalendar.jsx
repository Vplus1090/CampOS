import React from 'react';
import { GraduationCap, Calendar } from 'lucide-react';

export default function AcademicCalendar({ setActiveTab }) {
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

  const themeStyles = {
    teal: {
      border: 'border-teal-500/25',
      bg: 'bg-teal-500/[0.02]',
      iconColor: 'text-teal-400',
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      shadow: 'shadow-[0_0_25px_rgba(13,148,136,0.04)]'
    },
    rose: {
      border: 'border-rose-500/25',
      bg: 'bg-rose-500/[0.02]',
      iconColor: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      shadow: 'shadow-[0_0_25px_rgba(225,29,72,0.04)]'
    },
    amber: {
      border: 'border-amber-500/25',
      bg: 'bg-amber-500/[0.02]',
      iconColor: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      shadow: 'shadow-[0_0_25px_rgba(217,119,6,0.04)]'
    },
    magenta: {
      border: 'border-pink-500/25',
      bg: 'bg-pink-500/[0.02]',
      iconColor: 'text-pink-400',
      badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      shadow: 'shadow-[0_0_25px_rgba(219,39,119,0.04)]'
    },
    purple: {
      border: 'border-purple-500/25',
      bg: 'bg-purple-500/[0.02]',
      iconColor: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      shadow: 'shadow-[0_0_25px_rgba(147,51,234,0.04)]'
    }
  };

  return (
    <div className="academic-calendar-dashboard flex flex-col gap-6 text-white font-sans min-h-screen pb-24 relative select-none">
      
      {/* Header title */}
      <header className="flex justify-between items-center w-full mt-2 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setActiveTab && setActiveTab('home')}
            className="w-11 h-11 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer shrink-0"
            type="button"
          >
            <span className="text-xl font-bold">&larr;</span>
          </button>
          <div className="header-info text-left">
            <h2 className="text-xl font-black text-white leading-none font-sans">Academic Calendar</h2>
            <p className="text-slate-400 text-[10px] font-semibold tracking-wide mt-1">Odd Semester 2025-26</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 animate-fadeIn">
        {calendarEvents.map((event, idx) => {
          const style = themeStyles[event.theme] || themeStyles.teal;
          return (
            <div
              key={idx}
              className={`backdrop-blur-3xl rounded-[28px] border-2 ${style.border} ${style.bg} ${style.shadow} p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:scale-[1.01]`}
            >
              <div className="flex flex-col items-start text-left gap-2.5">
                <div className="flex items-center flex-wrap gap-2">
                  <GraduationCap size={18} className={`${style.iconColor} shrink-0`} />
                  <h4 className="text-base font-extrabold text-white font-sans tracking-wide leading-none">
                    {event.category}
                  </h4>
                  <div className="flex items-center gap-1.5 ml-1">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${style.badge}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-300 pl-[24px] text-left">
                  {event.desc}
                </p>
              </div>

              <div className="flex shrink-0 md:justify-end">
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 shadow-sm">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-[11px] font-mono font-bold tracking-wide text-slate-300">
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

