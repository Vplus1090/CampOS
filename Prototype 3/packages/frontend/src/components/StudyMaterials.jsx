import React from 'react';

export default function StudyMaterials({ setActiveTab }) {
  const studyMaterials = [
    {
      dept: 'Computer Science & Engineering',
      courses: [
        { code: 'CS-101', name: 'Introduction to React & UI Foundations', size: '4.2 MB', type: 'Lecture Notes' },
        { code: 'CS-202', name: 'Database Architecture & Mongoose Aggregates', size: '8.5 MB', type: 'Syllabus PDF' },
        { code: 'CS-305', name: 'Advanced Microservices & REST API Security', size: '12.1 MB', type: 'Lab Manual' },
      ],
    },
    {
      dept: 'Electrical & Electronics',
      courses: [
        { code: 'EE-201', name: 'Network Synthesis & Filters Analysis', size: '5.9 MB', type: 'Lecture Notes' },
        { code: 'EE-302', name: 'Microprocessor Systems Design (ARM)', size: '9.4 MB', type: 'Reference Sheet' },
      ],
    },
  ];

  return (
    <div className="study-materials-dashboard flex flex-col gap-6 text-white font-sans min-h-screen pb-24 relative select-none">
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
            <h2 className="text-xl font-black text-white leading-none font-sans">Study Materials</h2>
            <p className="text-slate-400 text-[10px] font-semibold tracking-wide mt-1">Open Academic Catalog</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 animate-fadeIn">
        {studyMaterials.map((section) => (
          <div 
            key={section.dept} 
            className="bg-indigo-500/[0.02] backdrop-blur-3xl border-2 border-indigo-500/25 rounded-[32px] p-6 flex flex-col gap-4 shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] relative overflow-hidden transition-all duration-300 hover:scale-[1.01] text-left"
          >
            <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-3">
              {section.dept}
            </h4>
            
            <div className="flex flex-col gap-3">
              {section.courses.map((course) => (
                <div 
                  key={course.code} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.06] transition-all duration-300"
                >
                  <div className="flex flex-col text-left gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded">
                        {course.code}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 font-mono tracking-widest uppercase">
                        {course.type}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-white leading-tight font-sans">
                      {course.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      Size: {course.size}
                    </span>
                  </div>
                  
                  <button
                    className="bg-white text-[#141a27] hover:bg-slate-50 font-black rounded-xl px-4 py-2.5 shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] text-[10px] uppercase tracking-wider cursor-pointer shrink-0"
                    onClick={() => alert(`Downloading ${course.code} resource...`)}
                  >
                    ⬇️ Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

