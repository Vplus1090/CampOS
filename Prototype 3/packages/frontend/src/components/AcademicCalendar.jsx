import React, { useState } from 'react';
import { GraduationCap, Calendar } from 'lucide-react';

export default function AcademicCalendar({ setActiveTab }) {
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e) => {
    const currentScrollTop = e.target.scrollTop;
    setIsScrolled(currentScrollTop > 10);
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
      border: 'border-white/10',
      bg: 'bg-[#211a30]/60',
      badge: 'bg-[#292035] text-[#d0bcff] border-[#483c5e]/30',
      iconColor: 'text-[#d0bcff]'
    },
    rose: {
      border: 'border-white/10',
      bg: 'bg-[#211a30]/60',
      badge: 'bg-[#292035] text-[#d0bcff] border-[#483c5e]/30',
      iconColor: 'text-[#d0bcff]'
    },
    amber: {
      border: 'border-white/10',
      bg: 'bg-[#211a30]/60',
      badge: 'bg-[#292035] text-[#d0bcff] border-[#483c5e]/30',
      iconColor: 'text-[#d0bcff]'
    },
    magenta: {
      border: 'border-white/10',
      bg: 'bg-[#211a30]/60',
      badge: 'bg-[#292035] text-[#d0bcff] border-[#483c5e]/30',
      iconColor: 'text-[#d0bcff]'
    },
    purple: {
      border: 'border-white/10',
      bg: 'bg-[#211a30]/60',
      badge: 'bg-[#292035] text-[#d0bcff] border-[#483c5e]/30',
      iconColor: 'text-[#d0bcff]'
    }
  };

  return (
    <div className="relative flex flex-col h-full max-h-full overflow-hidden font-sans text-[#e6e1e5] select-none academic-calendar-dashboard bg-[#181125]">
      
      {/* M3 Large Top App Bar */}
      <header className={`absolute top-0 left-0 right-0 z-20 flex flex-col px-6 transition-all duration-300 ease-in-out overflow-hidden ${
        isScrolled 
          ? 'h-[96px] pt-[26px] bg-[#292035] shadow-md justify-start' 
          : 'h-[180px] bg-transparent justify-start pt-[26px]'
      }`}>
        {/* Top Row: Navigation (No Action Icons) */}
        <div className="flex items-center justify-start w-full h-11 shrink-0">
          <button
            onClick={() => setActiveTab && setActiveTab('home')}
            className="w-11 h-11 bg-[#292035] hover:bg-[#352a48] border border-white/10 text-[#d0bcff] rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-sm cursor-pointer shrink-0"
            type="button"
          >
            <span className="text-xl font-bold">&larr;</span>
          </button>
          
          {/* Small Header Title (Scrolled state) */}
          <span className={`text-[20px] pl-3.5 font-medium text-[#e6e1e5] leading-none tracking-tight font-sans transition-all duration-300 ${
            isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
          }`}>
            Academic Calendar
          </span>
        </div>

        {/* Bottom Area: Large Headline & Subtitle (At-rest state) */}
        <div className={`mt-3 pl-3.5 text-left transition-all duration-200 ${
          isScrolled ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}>
          <h1 className="text-[28px] font-normal leading-tight text-[#e6e1e5] tracking-tight font-sans">
            Academic Calendar
          </h1>
          <p className="text-[12px] text-[#cac4d0] mt-1 font-medium tracking-wide font-sans">
            Odd Sem • 2025-26
          </p>
        </div>
      </header>

      {/* M3 Cards for Timeline Events */}
      <div 
        onScroll={handleScroll}
        className="flex-1 pb-8 px-6 space-y-6 overflow-y-auto scrollbar-none pt-[188px]"
      >
        {calendarEvents.map((event, idx) => {
          return (
            <div key={idx} className="flex gap-5 relative">
              {/* Timeline Indicator Column */}
              <div className="flex flex-col items-center w-6 shrink-0 relative">
                {/* Vertical Line Segments */}
                {idx > 0 && <div className="absolute top-0 w-[2px] bg-[#483c5e]/30 h-[44px] left-1/2 -translate-x-1/2" />}
                {idx < calendarEvents.length - 1 && <div className="absolute top-[44px] bottom-0 w-[2px] bg-[#483c5e]/30 left-1/2 -translate-x-1/2" />}
                
                {/* Timeline Dot Marker */}
                <div className="w-[12px] h-[12px] rounded-full bg-[#d0bcff] border-2 border-[#181125] z-10 mt-[38px] shadow-[0_0_8px_rgba(208,188,255,0.4)]" />
              </div>

              {/* Card Container */}
              <div className="flex-1 min-w-0">
                <div className="rounded-[24px] p-6 transition-all duration-300 border border-[#483c5e]/50 bg-[#211a30]/40 flex flex-col gap-4 text-left hover:border-[#483c5e]">
                  
                  {/* Header Row: Title, Icon, Tags */}
                  <div className="flex items-center gap-3.5 w-full pb-3.5 border-b border-[#483c5e]/30">
                    <div className="w-10 h-10 bg-[#4f378b]/30 border border-[#948baf]/10 rounded-[12px] flex items-center justify-center text-[#d0bcff] shrink-0">
                      <GraduationCap size={20} />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <h4 className="font-sans text-base font-bold leading-none tracking-wide text-[#e6e1e5]">
                        {event.category}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {event.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-[#292035] border border-[#483c5e]/40 text-[#d0bcff] text-[10px] font-medium px-2.5 py-0.5 rounded-[6px] tracking-wide font-sans uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Content Body: Description and Date stamp */}
                  <div className="flex flex-col gap-4">
                    <p className="text-sm font-medium text-[#cac4d0] leading-relaxed pr-2">
                      {event.desc}
                    </p>

                    {/* M3 Assist Chip stamp pill left-aligned */}
                    <div className="flex justify-start mt-1">
                      <div className="flex items-center gap-2 bg-[#292035] border border-[#483c5e] rounded-[8px] px-3.5 py-1.5 shadow-sm text-[#cac4d0]">
                        <Calendar size={12} className="text-[#d0bcff]" />
                        <span className="text-[11px] font-sans font-medium tracking-wide uppercase">
                          {event.date}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
