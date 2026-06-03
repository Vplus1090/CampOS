import React, { useState, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import M3ScreenHeader from './M3ScreenHeader';

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

  const goBack = () => setActiveTab && setActiveTab('home');

  return (
    <div className="m3-screen study-materials-dashboard">
      <M3ScreenHeader
        title="Study Shelf"
        subtitle="Books, tutorials & PYQs"
        isScrolled={isScrolled}
        onBack={goBack}
      />

      <div onScroll={handleScroll} className="m3-screen__scroll" style={{ paddingBottom: 32 }}>
        {nextExam && (
          <div className="bg-[var(--m3-primary)] text-[var(--m3-on-primary)] shrink-0 flex items-center justify-between gap-3 rounded-[20px] p-4 shadow-sm">
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold uppercase tracking-widest opacity-85">Upcoming: {nextExam.name}</span>
              <span className="text-[18px] font-bold mt-0.5">
                {nextExamCountdown}
              </span>
            </div>
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full bg-[var(--m3-on-primary)]/40 rounded-full opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 bg-[var(--m3-on-primary)]" />
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div className="flex flex-col gap-1.5 text-left">
            <span className="m3-body-small font-medium uppercase tracking-wider pl-1">Branch</span>
            <div className="m3-select-wrap">
              <select
                value={shelfBranch}
                onChange={(e) => setShelfBranch(e.target.value)}
                className="m3-select"
              >
                <option value="All Branches">All Branches</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Biotechnology">Biotechnology</option>
              </select>
              <div className="absolute -translate-y-1/2 pointer-events-none text-m3-primary right-4 top-1/2">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <span className="m3-body-small font-medium uppercase tracking-wider pl-1">Semester</span>
            <div className="m3-select-wrap">
              <select
                value={shelfSemester}
                onChange={(e) => setShelfSemester(e.target.value)}
                className="m3-select"
              >
                <option value="All Semesters">All Semesters</option>
                {Array.from({ length: 8 }).map((_, i) => (
                  <option key={i} value={`Semester ${i + 1}`}>Semester {i + 1}</option>
                ))}
              </select>
              <div className="absolute -translate-y-1/2 pointer-events-none text-m3-primary right-4 top-1/2">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>

        <div className="m3-segmented-chips justify-center flex-wrap py-1 shrink-0">
          {['All', 'Notes', 'Tutorials', 'PYQs', 'Books'].map((cat) => {
            const isActive = shelfCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setShelfCategory(cat)}
                className={`m3-segmented-chip m3-segmented-chip--sm ${isActive ? 'm3-segmented-chip--selected' : ''}`}
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
                <article
                  key={course.code}
                  className="m3-surface-card flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col gap-1 pr-4 text-left items-start min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="m3-assist-chip text-[10px] py-0.5">{course.code}</span>
                      <span className="m3-body-small font-bold uppercase tracking-widest opacity-70">{course.type}</span>
                    </div>
                    <span className="m3-title-medium leading-snug mt-1">{course.name}</span>
                    <span className="m3-body-small mt-1 opacity-80">
                      {course.branch} • {course.semester} • {course.size}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(course)}
                    disabled={isDownloading}
                    className="m3-icon-button"
                    aria-label={`Download ${course.code}`}
                  >
                    {isDownloading ? (
                      <div className="w-5 h-5 border-2 rounded-full border-m3-primary border-t-transparent animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                  </button>
                </article>
              );
            })
          ) : (
            <div className="m3-surface-card p-12 text-center flex flex-col items-center justify-center shrink-0">
              <span className="mb-3 text-4xl opacity-40">🔍</span>
              <h3 className="m3-title-medium">No materials found</h3>
              <p className="m3-body-small mt-1">Try adjusting your filters.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
