import React from 'react';

export default function AcademicCalendar() {
  const calendarEvents = [
    { date: 'June 01, 2026', title: 'Spring Semester Begins', type: 'academic', desc: 'Orientation for new batches and regular classes commence.' },
    { date: 'June 25, 2026', title: 'CampOS Annual Hackathon Sprint', type: 'event', desc: '36-hour continuous monorepo coding competition with cash prizes.' },
    { date: 'July 10-18, 2026', title: 'Mid-Term Examination Weeks', type: 'exam', desc: 'Strict examinations across all departments.' },
    { date: 'Aug 15, 2026', title: 'Independence Day Holiday', type: 'holiday', desc: 'Flag hoisting ceremony at main sports complex.' },
    { date: 'Sep 05-08, 2026', title: 'Sparks Campus Cultural Festival', type: 'event', desc: 'Three days of music, arts, food-stalls, and dance matches.' },
    { date: 'Oct 20, 2026', title: 'Final Semester Examinations Begin', type: 'exam', desc: 'Submission of lab projects and end-term exams.' },
  ];

  return (
    <div className="lock-card public-details-card academic-calendar-dashboard">
      <div className="card-header-public">
        <h3>📅 Campus Academic Calendar</h3>
      </div>

      <div className="public-timeline">
        {calendarEvents.map((event, idx) => (
          <div key={idx} className="timeline-item">
            <div className="timeline-dot-wrapper">
              <div className={`timeline-dot event-${event.type}`}></div>
            </div>
            <div className="timeline-content">
              <span className="date font-mono">{event.date}</span>
              <h4 className="title">{event.title}</h4>
              <p className="desc">{event.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
