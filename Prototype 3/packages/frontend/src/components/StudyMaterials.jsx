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
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e) => {
    const currentScrollTop = e.target.scrollTop;
    setIsScrolled(currentScrollTop > 10);
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
    <div className="relative flex flex-col h-full max-h-full overflow-hidden font-sans text-[#e6e1e5] select-none study-materials-dashboard bg-[#181125]">
      
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
            Study Shelf
          </span>
        </div>

        {/* Bottom Area: Large Headline & Subtitle (At-rest state) */}
        <div className={`mt-3 pl-3.5 text-left transition-all duration-200 ${
          isScrolled ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}>
          <h1 className="text-[28px] font-normal leading-tight text-[#e6e1e5] tracking-tight font-sans">
            Study Shelf
          </h1>
          <p className="text-[12px] text-[#cac4d0] mt-1 font-medium tracking-wide font-sans">
            Books, Tutorials & PYQs
          </p>
        </div>
      </header>

      {/* Scrollable Content Wrapper */}
      <div 
        onScroll={handleScroll}
        className="flex-1 pb-8 px-6 flex flex-col gap-6 overflow-y-auto scrollbar-none pt-[188px]"
      >
        {/* Nearest upcoming exam clock widget placed cleanly at the top */}
        {nextExam && (
          <div className="bg-[#211a30]/40 border border-[#483c5e]/50 rounded-[20px] px-5 py-3.5 flex items-center gap-3 shadow-sm w-full justify-between shrink-0">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-[#cac4d0] uppercase tracking-widest font-sans leading-none">Upcoming Exam: {nextExam.name}</span>
              <span className="text-base font-bold tracking-wider text-[#eaddff] mt-1.5">
                {nextExamCountdown}
              </span>
            </div>
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full bg-[#d0bcff]/40 rounded-full opacity-75 animate-ping"></span>
              <span className="relative inline-flex w-2 h-2 bg-[#d0bcff] rounded-full"></span>
            </span>
          </div>
        )}

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[#cac4d0] text-[11px] font-medium uppercase tracking-wider pl-1">Branch</span>
            <div className="relative w-full">
              <select
                value={shelfBranch}
                onChange={(e) => setShelfBranch(e.target.value)}
                className="w-full bg-[#292035] hover:bg-[#352a48] border border-[#483c5e]/60 rounded-[16px] px-4 py-3.5 text-xs text-[#e6e1e5] font-semibold outline-none focus:border-[#948baf] cursor-pointer appearance-none transition-all duration-300"
              >
                <option className="bg-[#292035] text-[#e6e1e5]" value="All Branches">All Branches</option>
                <option className="bg-[#292035] text-[#e6e1e5]" value="Computer Science">Computer Science</option>
                <option className="bg-[#292035] text-[#e6e1e5]" value="Electronics & Communication">Electronics & Communication</option>
                <option className="bg-[#292035] text-[#e6e1e5]" value="Information Technology">Information Technology</option>
                <option className="bg-[#292035] text-[#e6e1e5]" value="Biotechnology">Biotechnology</option>
              </select>
              <div className="absolute -translate-y-1/2 pointer-events-none text-[#d0bcff] right-4 top-1/2">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[#cac4d0] text-[11px] font-medium uppercase tracking-wider pl-1">Semester</span>
            <div className="relative w-full">
              <select
                value={shelfSemester}
                onChange={(e) => setShelfSemester(e.target.value)}
                className="w-full bg-[#292035] hover:bg-[#352a48] border border-[#483c5e]/60 rounded-[16px] px-4 py-3.5 text-xs text-[#e6e1e5] font-semibold outline-none focus:border-[#948baf] cursor-pointer appearance-none transition-all duration-300"
              >
                <option className="bg-[#292035] text-[#e6e1e5]" value="All Semesters">All Semesters</option>
                {Array.from({ length: 8 }).map((_, i) => (
                  <option className="bg-[#292035] text-[#e6e1e5]" key={i} value={`Semester ${i + 1}`}>Semester {i + 1}</option>
                ))}
              </select>
              <div className="absolute -translate-y-1/2 pointer-events-none text-[#d0bcff] right-4 top-1/2">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* M3 Segmented Button / Filters Row */}
        <div className="flex flex-wrap gap-2 py-1 shrink-0">
          {['All', 'Notes', 'Tutorials', 'PYQs', 'Books'].map((cat) => {
            const isActive = shelfCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setShelfCategory(cat)}
                className={`px-4 py-2 rounded-[8px] text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                  isActive
                    ? 'bg-[#4f378b] text-[#eaddff] border-[#948baf]/30 shadow-sm'
                    : 'bg-transparent hover:bg-[#352a48]/20 text-[#cac4d0] border-[#483c5e]/60 cursor-pointer'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Document Listing Grid */}
        <div className="flex flex-col gap-4 shrink-0">
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((course) => {
              const isDownloading = downloadingId === course.code;
              return (
                <div
                  key={course.code}
                  className="bg-[#211a30]/40 border border-[#483c5e]/50 rounded-[24px] p-5 flex items-center justify-between transition-all duration-300 hover:border-[#483c5e] group"
                >
                  <div className="flex flex-col gap-1 pr-4 text-left items-start">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#292035] border border-[#483c5e]/40 text-[#d0bcff] text-[10px] font-semibold px-2 py-0.5 rounded-[6px] tracking-wide font-sans">
                        {course.code}
                      </span>
                      <span className="text-[10px] font-bold text-[#cac4d0]/70 uppercase tracking-widest">
                        {course.type}
                      </span>
                    </div>
                    <span className="text-base font-bold text-[#e6e1e5] leading-snug mt-1.5">
                      {course.name}
                    </span>
                    <span className="text-xs text-[#cac4d0]/60 font-medium mt-1">
                      {course.branch} • {course.semester} • {course.size}
                    </span>
                  </div>

                  {/* Interactive M3 Outlined Button */}
                  <button
                    onClick={() => handleDownload(course)}
                    disabled={isDownloading}
                    className={`p-3 rounded-[12px] border transition-all duration-300 flex items-center justify-center cursor-pointer shrink-0 ${
                      isDownloading
                        ? 'bg-[#292035] border-[#483c5e] text-[#cac4d0]/50'
                        : 'bg-[#292035] border-[#483c5e] text-[#d0bcff] hover:bg-[#352a48] active:scale-90'
                    }`}
                  >
                    {isDownloading ? (
                      <div className="w-5 h-5 border-2 rounded-full border-[#d0bcff] border-t-transparent animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="bg-[#211a30]/40 border border-[#483c5e]/50 rounded-[24px] p-12 text-center flex flex-col items-center justify-center shrink-0">
              <span className="mb-3 text-4xl text-[#d0bcff]/40">🔍</span>
              <h3 className="text-base font-bold text-[#e6e1e5]">No materials found</h3>
              <p className="mt-1 text-sm text-[#cac4d0]/60">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
