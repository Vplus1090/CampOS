import React, { useState, useEffect } from 'react';
import { BookOpen, Download, ChevronDown } from 'lucide-react';

export default function StudyMaterials({ setActiveTab, initialBranch, initialSemester }) {
  const [shelfBranch, setShelfBranch] = useState(initialBranch || 'All Branches');
  const [shelfSemester, setShelfSemester] = useState(initialSemester || 'All Semesters');
  const [shelfCategory, setShelfCategory] = useState('All');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (initialBranch) setShelfBranch(initialBranch);
  }, [initialBranch]);

  useEffect(() => {
    if (initialSemester) setShelfSemester(initialSemester);
  }, [initialSemester]);

  // Scroll dynamics minimize states
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

  // Filtered Materials logic
  const filteredMaterials = studyMaterials.filter((material) => {
    const matchesBranch = 
      shelfBranch === 'All Branches' || 
      material.branch === shelfBranch;
    
    const matchesSemester = 
      shelfSemester === 'All Semesters' || 
      material.semester === shelfSemester;
    
    const matchesCategory = 
      shelfCategory === 'All' || 
      material.type === shelfCategory;

    return matchesBranch && matchesSemester && matchesCategory;
  });

  const handleDownload = (course) => {
    setDownloadingId(course.code);
    setTimeout(() => {
      setDownloadingId(null);
      alert(`Successfully downloaded: ${course.code} - ${course.name}`);
    }, 1500);
  };

  return (
    <div className="study-materials-dashboard flex flex-col gap-4 text-white font-sans h-full max-h-full pb-4 relative select-none overflow-hidden">
      
      {/* Collapsible Area */}
      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden flex flex-col gap-4 shrink-0 ${
          isHeaderMinimized 
            ? 'max-h-0 opacity-0 scale-95 pointer-events-none mb-0 mt-0 pb-0' 
            : 'max-h-[500px] opacity-100 scale-100 mb-1'
        }`}
      >
        {/* Header title */}
        <header className="flex items-center w-full mt-6 border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setActiveTab && setActiveTab('home')}
              className="w-11 h-11 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer shrink-0"
              type="button"
            >
              <span className="text-xl font-bold">&larr;</span>
            </button>
            <h2 className="text-[22px] italic font-normal text-white leading-none flex items-center gap-2 translate-y-[2px] tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Study Shelf
            </h2>
          </div>
        </header>

        {/* Nearest upcoming exam clock widget placed cleanly at the top */}
        {nextExam && (
          <div className="bg-[#1c2436]/40 border border-white/10 backdrop-blur-md rounded-2xl px-5 py-3 flex items-center gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] w-full justify-between shrink-0">
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black text-white/60 uppercase tracking-widest font-mono leading-none">Upcoming Exam: {nextExam.name}</span>
              <span className="text-base font-black font-mono tracking-wider text-white mt-1.5 font-semibold">
                {nextExamCountdown}
              </span>
            </div>
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full bg-white/40 rounded-full opacity-75"></span>
              <span className="relative inline-flex w-2 h-2 bg-white/50 rounded-full"></span>
            </span>
          </div>
        )}

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.15em] font-sans pl-1">Branch</span>
            <div className="relative w-full">
              <select
                value={shelfBranch}
                onChange={(e) => setShelfBranch(e.target.value)}
                className="w-full bg-white/10 hover:bg-white/[0.15] border border-white/15 hover:border-white/25 rounded-2xl px-4 py-3.5 text-xs text-white font-semibold outline-none focus:border-white/35 cursor-pointer appearance-none transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-3xl"
              >
                <option className="bg-[#141a27]" value="All Branches">All Branches</option>
                <option className="bg-[#141a27]" value="Computer Science">Computer Science</option>
                <option className="bg-[#141a27]" value="Electronics & Communication">Electronics & Communication</option>
                <option className="bg-[#141a27]" value="Information Technology">Information Technology</option>
                <option className="bg-[#141a27]" value="Biotechnology">Biotechnology</option>
              </select>
              <div className="absolute -translate-y-1/2 pointer-events-none text-white/40 right-4 top-1/2">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.15em] font-sans pl-1">Semester</span>
            <div className="relative w-full">
              <select
                value={shelfSemester}
                onChange={(e) => setShelfSemester(e.target.value)}
                className="w-full bg-white/10 hover:bg-white/[0.15] border border-white/15 hover:border-white/25 rounded-2xl px-4 py-3.5 text-xs text-white font-semibold outline-none focus:border-white/35 cursor-pointer appearance-none transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-3xl"
              >
                <option className="bg-[#141a27]" value="All Semesters">All Semesters</option>
                {Array.from({ length: 8 }).map((_, i) => (
                  <option className="bg-[#141a27]" key={i} value={`Semester ${i + 1}`}>Semester {i + 1}</option>
                ))}
              </select>
              <div className="absolute -translate-y-1/2 pointer-events-none text-white/40 right-4 top-1/2">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Category Pills Tab bar */}
        <div className="flex flex-wrap gap-2 py-1 shrink-0">
          {['All', 'Notes', 'Tutorials', 'PYQs', 'Books'].map((cat) => {
            const isActive = shelfCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setShelfCategory(cat)}
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 border ${
                  isActive
                    ? 'bg-white/[0.12] border-white/25 text-white shadow-md backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] font-extrabold'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/15 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] cursor-pointer'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Listing Grid - dynamically fills space, scrolls independently */}
      <div 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-none pr-1 space-y-4 pt-5 pb-4"
      >
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((course) => {
              const isDownloading = downloadingId === course.code;
              return (
                <div
                  key={course.code}
                  className="bg-white/[0.06] border border-white/15 hover:border-white/35 hover:bg-white/[0.12] backdrop-blur-3xl rounded-2xl p-5 flex items-center justify-between transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] group"
                >
                  <div className="flex flex-col gap-1 pr-4 text-left items-start">
                    <div className="flex items-center gap-2">
                      <span className="bg-white/10 border border-white/15 text-white/70 text-[9px] px-2 py-0.5 rounded font-mono uppercase font-black tracking-wider">
                        {course.code}
                      </span>
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                        {course.type}
                      </span>
                    </div>
                    <span className="text-base font-extrabold text-white leading-snug mt-1 group-hover:text-white/80 transition-colors duration-300">
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
                    className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer shrink-0 ${
                      isDownloading
                        ? 'bg-white/10 border-white/20 text-white/70'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white active:scale-90'
                    }`}
                  >
                    {isDownloading ? (
                      <div className="w-5 h-5 border-2 rounded-full border-white border-t-transparent animate-spin" />
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
  );
}
