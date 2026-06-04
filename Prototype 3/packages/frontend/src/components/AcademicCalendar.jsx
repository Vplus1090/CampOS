import React, { useState } from 'react';
import { GraduationCap, Calendar } from 'lucide-react';
import M3ScreenHeader from './M3ScreenHeader';

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
      bg: 'bg-m3-surfaceContainer/60',
      badge: 'bg-m3-surfaceContainerHighest text-m3-primary border-transparent',
      iconColor: 'text-m3-primary'
    },
    rose: {
      border: 'border-white/10',
      bg: 'bg-m3-surfaceContainer/60',
      badge: 'bg-m3-surfaceContainerHighest text-m3-tertiary border-transparent',
      iconColor: 'text-m3-tertiary'
    },
    amber: {
      border: 'border-white/10',
      bg: 'bg-m3-surfaceContainer/60',
      badge: 'bg-m3-surfaceContainerHighest text-m3-secondary border-transparent',
      iconColor: 'text-m3-secondary'
    },
    magenta: {
      border: 'border-white/10',
      bg: 'bg-m3-surfaceContainer/60',
      badge: 'bg-m3-tertiaryContainer text-m3-onTertiaryContainer border-transparent',
      iconColor: 'text-m3-onTertiaryContainer'
    },
    purple: {
      border: 'border-white/10',
      bg: 'bg-m3-surfaceContainer/60',
      badge: 'bg-m3-primaryContainer text-m3-onPrimaryContainer border-transparent',
      iconColor: 'text-m3-primary'
    }
  };

  const goBack = () => setActiveTab && setActiveTab('home');

  return (
    <div className="m3-screen academic-calendar-dashboard">
      <M3ScreenHeader
        title="Academic Calendar"
        subtitle="Odd sem • 2025–26"
        isScrolled={isScrolled}
        onBack={goBack}
      />

      <div onScroll={handleScroll} className="m3-screen__scroll !gap-3" style={{ paddingBottom: 32 }}>
        {calendarEvents.map((event, idx) => {
          return (
            <article key={idx} className="m3-surface-card flex flex-col gap-4 text-left">
              <div
                className="flex items-center gap-3.5 w-full pb-3.5"
                style={{ borderBottom: '1px solid color-mix(in srgb, var(--m3-outline-variant) 35%, transparent)' }}
              >
                <div className="m3-icon-badge">
                  <GraduationCap size={20} />
                </div>
                <h4 className="m3-title-medium flex-1">{event.category}</h4>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {event.tags.map((tag) => (
                    <span key={tag} className="m3-assist-chip text-[10px] py-0.5 uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <p className="m3-body-medium m3-text-variant leading-relaxed pr-2">{event.desc}</p>

              <div className="flex justify-start">
                <span className="m3-assist-chip gap-2 inline-flex">
                  <Calendar size={12} className="text-m3-primary shrink-0" />
                  <span className="text-[11px] font-medium tracking-wide uppercase">{event.date}</span>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
