import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Clock, Calendar, BookOpen, AlertTriangle, 
  Sparkles, RefreshCw, MapPin, User, Users, FileText, SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { getUsername, getFromCache, saveToCache } from '../utils/cache';

// Premium ultra-glassy frosted card styles
const obsidianCardClass = "border border-white/[0.08] bg-white/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.37),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-3xl rounded-[28px] p-5 relative overflow-hidden transition-all duration-300";
const obsidianCardHoverClass = "hover:border-white/[0.15] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]";

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Time converter to helper minutes
const getMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  return 0;
};

export default function Timetable({ currentUser, setActiveTab }) {
  const [selectedDay, setSelectedDay] = useState(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    return currentDay;
  });

  // DB States
  const [dbMeta, setDbMeta] = useState(null);
  const [dbClasses, setDbClasses] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const [dbError, setDbError] = useState(null);

  // Dynamic filter selections
  const [selectedCourse, setSelectedCourse] = useState('btech-62');
  const [selectedSemester, setSelectedSemester] = useState('sem2');
  const [selectedPhase, setSelectedPhase] = useState('phase1');
  const [selectedBatch, setSelectedBatch] = useState('g2');
  const [showFilters, setShowFilters] = useState(true);

  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  // Fetch CDN database on mount
  useEffect(() => {
    const loadPlannerDb = async () => {
      try {
        setLoadingDb(true);
        const cachedMeta = localStorage.getItem('jpoop-metadata');
        const cachedClasses = localStorage.getItem('jpoop-classes');
        const cacheTime = localStorage.getItem('jpoop-cache-timestamp');
        const oneDay = 24 * 60 * 60 * 1000;

        if (cachedMeta && cachedClasses && cacheTime && (Date.now() - parseInt(cacheTime) < oneDay)) {
          setDbMeta(JSON.parse(cachedMeta));
          setDbClasses(JSON.parse(cachedClasses));
          setLoadingDb(false);
          return;
        }

        const metaRes = await fetch('https://raw.githubusercontent.com/codelif/jiit-planner-cdn/refs/heads/main/metadata.json');
        if (!metaRes.ok) throw new Error("Metadata request failed");
        const metaData = await metaRes.json();

        const classesRes = await fetch('https://raw.githubusercontent.com/codelif/jiit-planner-cdn/refs/heads/main/classes.json');
        if (!classesRes.ok) throw new Error("Classes database request failed");
        const classesData = await classesRes.json();

        setDbMeta(metaData);
        setDbClasses(classesData);

        localStorage.setItem('jpoop-metadata', JSON.stringify(metaData));
        localStorage.setItem('jpoop-classes', JSON.stringify(classesData));
        localStorage.setItem('jpoop-cache-timestamp', Date.now().toString());
        setLoadingDb(false);
      } catch (err) {
        console.error("Failed to load planner database, loading offline fallback:", err);
        const cachedMeta = localStorage.getItem('jpoop-metadata');
        const cachedClasses = localStorage.getItem('jpoop-classes');
        if (cachedMeta && cachedClasses) {
          setDbMeta(JSON.parse(cachedMeta));
          setDbClasses(JSON.parse(cachedClasses));
        } else {
          setDbError("Unable to fetch timetable database. Check network connection.");
        }
        setLoadingDb(false);
      }
    };

    loadPlannerDb();
  }, []);

  // Synchronize dynamic cascading selections when course/semester/phase changes
  useEffect(() => {
    if (!dbMeta) return;
    const sems = dbMeta.semesters[selectedCourse] || [];
    if (sems.length > 0) {
      const isValid = sems.some(s => s.id === selectedSemester);
      if (!isValid) setSelectedSemester(sems[0].id);
    }
  }, [selectedCourse, dbMeta]);

  useEffect(() => {
    if (!dbMeta) return;
    const semPhases = dbMeta.phases[selectedCourse]?.[selectedSemester] || [];
    if (semPhases.length > 0) {
      const isValid = semPhases.some(p => p.id === selectedPhase);
      if (!isValid) setSelectedPhase(semPhases[0].id);
    }
  }, [selectedSemester, selectedCourse, dbMeta]);

  useEffect(() => {
    if (!dbMeta) return;
    const phaseBatches = dbMeta.batches[selectedCourse]?.[selectedSemester]?.[selectedPhase] || [];
    if (phaseBatches.length > 0) {
      const isValid = phaseBatches.some(b => b.id === selectedBatch);
      if (!isValid) {
        const g2Batch = phaseBatches.find(b => b.id === 'g2' || b.name === 'G2');
        setSelectedBatch(g2Batch ? g2Batch.id : phaseBatches[0].id);
      }
    }
  }, [selectedPhase, selectedSemester, selectedCourse, dbMeta]);

  // Scroll callback to minimize header
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

  // Fetch current batch timeline classes
  const getDisplayEvents = () => {
    if (!dbClasses) return [];
    const classKey = `${selectedCourse}_${selectedSemester}_${selectedPhase}_${selectedBatch}`;
    const batchObj = dbClasses[classKey];
    if (!batchObj || !batchObj.classes) return [];
    
    const dayClasses = batchObj.classes[selectedDay] || [];
    return dayClasses.map((ev) => ({
      subject: ev.subject,
      time: `${ev.start} - ${ev.end}`,
      start: ev.start,
      end: ev.end,
      instructor: ev.teacher || 'Faculty',
      room: ev.venue || 'N/A',
      type: ev.type === 'P' ? 'lab' : ev.type === 'T' ? 'tutorial' : 'lecture',
      typeLabel: ev.type === 'P' ? 'Practical' : ev.type === 'T' ? 'Tutorial' : 'Lecture',
      batches: ev.batches ? ev.batches.join(', ') : '',
    })).sort((a, b) => getMinutes(a.start) - getMinutes(b.start));
  };

  const displayEvents = getDisplayEvents();

  // Dynamic Breaks in the Day Calculator
  const getTimelineBreaks = () => {
    if (displayEvents.length < 2) return [];
    const breaks = [];
    for (let i = 0; i < displayEvents.length - 1; i++) {
      const endMin = getMinutes(displayEvents[i].end);
      const startMin = getMinutes(displayEvents[i+1].start);
      const diff = startMin - endMin;
      
      if (diff >= 15) { // Any break >= 15 mins
        const formatTime = (min) => {
          let h = Math.floor(min / 60);
          const m = min % 60;
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          if (h === 0) h = 12;
          return `${h}:${m < 10 ? '0' : ''}${m} ${ampm}`;
        };
        
        const hr = Math.floor(diff / 60);
        const mn = diff % 60;
        let durationStr = '';
        if (hr > 0) durationStr += `${hr} hr `;
        if (mn > 0) durationStr += `${mn} min`;
        
        breaks.push({
          timeRange: `${formatTime(endMin)} - ${formatTime(startMin)}`,
          duration: durationStr.trim()
        });
      }
    }
    return breaks;
  };

  const breaks = getTimelineBreaks();

  const getBatchName = () => {
    if (!dbMeta) return '';
    const list = dbMeta.batches[selectedCourse]?.[selectedSemester]?.[selectedPhase] || [];
    return list.find(b => b.id === selectedBatch)?.name || '';
  };

  return (
    <div className="relative flex flex-col h-full max-h-full gap-4 pb-8 overflow-hidden font-sans text-white select-none timetable-dashboard bg-transparent">
      
      {/* ─── Collapsible Header (Fixed Spacing & Padding) ─── */}
      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden flex flex-col shrink-0 ${
          isHeaderMinimized 
            ? 'max-h-0 opacity-0 scale-95 pointer-events-none mb-0 mt-0 pb-0 pt-0' 
            : 'max-h-[160px] opacity-100 scale-100 mb-1 mt-2 border-b border-white/10 pb-3'
        }`}
      >
        <header className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3.5 text-left">
            <button
              onClick={() => setActiveTab('home')}
              className="w-11 h-11 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer shrink-0"
              type="button"
            >
              <span className="text-xl font-bold">&larr;</span>
            </button>
            <h2 className="text-[22px] italic font-normal text-white leading-none flex items-center gap-2 translate-y-[2px] tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Timetable
            </h2>
          </div>

          <div className="flex items-center shrink-0">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition duration-300 active:scale-90 cursor-pointer ${
                showFilters 
                  ? 'bg-white text-[#141a27] border-white' 
                  : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white'
              }`}
              type="button"
              title="Filter options"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </header>
      </div>

      {/* ─── Dynamic Filters Panel (Exactly replicating JPoop design) ─── */}
      {showFilters && dbMeta && (
        <div className="w-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-3xl rounded-[24px] p-4 flex flex-col gap-3.5 shrink-0 text-left select-none">
          
          {/* 1. Day Selector Row */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono pl-1">Day</span>
            <div className="w-full overflow-x-auto scrollbar-none flex flex-row items-center gap-1.5">
              {weekDays.map((day) => {
                const isActive = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition duration-300 leading-none shrink-0 border ${
                      isActive 
                        ? 'bg-white border-white text-black font-extrabold' 
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Course Selector Row */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono pl-1">Course</span>
            <div className="w-full flex flex-wrap gap-1.5">
              {dbMeta.courses.map((c) => {
                const isActive = selectedCourse === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCourse(c.id)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition duration-300 leading-none border ${
                      isActive 
                        ? 'bg-white border-white text-black font-extrabold' 
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Semester & Phase Selector Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono pl-1">Semester</span>
              <div className="flex gap-1.5">
                {(dbMeta.semesters[selectedCourse] || []).map((sem) => {
                  const isActive = selectedSemester === sem.id;
                  return (
                    <button
                      key={sem.id}
                      onClick={() => setSelectedSemester(sem.id)}
                      className={`w-9 h-9 rounded-lg text-[10px] font-black transition duration-300 flex items-center justify-center border ${
                        isActive 
                          ? 'bg-white border-white text-black font-extrabold font-mono' 
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                      }`}
                    >
                      {sem.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono pl-1">Phase</span>
              <div className="flex gap-1.5">
                {(dbMeta.phases[selectedCourse]?.[selectedSemester] || []).map((ph) => {
                  const isActive = selectedPhase === ph.id;
                  return (
                    <button
                      key={ph.id}
                      onClick={() => setSelectedPhase(ph.id)}
                      className={`w-9 h-9 rounded-lg text-[10px] font-black transition duration-300 flex items-center justify-center border ${
                        isActive 
                          ? 'bg-white border-white text-black font-extrabold font-mono' 
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                      }`}
                    >
                      {ph.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Batch Selector Dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono pl-1">Batch</span>
            <div className="relative w-full">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white/10 hover:bg-white/[0.15] border border-white/15 hover:border-white/25 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-white/35 transition cursor-pointer appearance-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-3xl"
              >
                {(dbMeta.batches[selectedCourse]?.[selectedSemester]?.[selectedPhase] || []).map((b) => (
                  <option className="bg-[#141a27] text-white" key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="absolute -translate-y-1/2 pointer-events-none text-white/40 right-4 top-1/2">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Loader for DB Fetch */}
      {loadingDb && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3.5 select-none py-16 text-center">
          <RefreshCw className="animate-spin text-white/60" size={24} />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syncing Planner Database...</span>
        </div>
      )}

      {/* Main Layout containing Timeline & Breaks side-by-side / stacked */}
      {!loadingDb && (
        <div 
          onScroll={handleScroll}
          className="flex-1 pb-16 overflow-y-auto scrollbar-none flex flex-col gap-6"
        >
          
          {/* Timeline Lectures Column (Standardized Flex Spacing to prevent clipping) */}
          <div className="w-full flex flex-col gap-5 mt-1">
            
            {!showFilters && (
              <span className="text-[10px] font-mono font-black text-white/60 uppercase tracking-widest text-left select-none pb-1.5 block leading-none pl-1">
                Schedule for {selectedDay} • {getBatchName() || 'All Batches'}
              </span>
            )}
            
            {displayEvents.length === 0 ? (
              <div className={`${obsidianCardClass} p-8 flex flex-col items-center justify-center gap-2.5 text-center select-none `}>
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/70 shadow-md">
                  <Sparkles size={20} className="" />
                </div>
                <h4 className="text-xs text-slate-200 font-extrabold uppercase tracking-widest">Free Day!</h4>
                <span className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-[220px]">
                  No classes scheduled for today. Explore other days or batches!
                </span>
              </div>
            ) : (
              displayEvents.map((item, idx) => {
                return (
                  <div key={idx} className="flex gap-4 items-stretch w-full text-left">
                    
                    {/* 1. Time Stamps Column */}
                    <div className="w-[62px] shrink-0 flex flex-col justify-between py-1.5 text-right font-mono text-[9px] font-black text-slate-400 select-none">
                      <span>{item.start}</span>
                      <span>{item.end}</span>
                    </div>

                    {/* 2. Timeline Axis Line Column */}
                    <div className="w-3 shrink-0 flex flex-col items-center relative py-1">
                      {/* Top Dot node */}
                      <div className="w-2.5 h-2.5 rounded-full border bg-[#050608] border-white/60 z-20 shrink-0" />
                      {/* Continuous connecting thin line */}
                      <div className="flex-1 w-[1px] bg-white/[0.08] my-0.5" />
                      {/* Bottom Dot node */}
                      <div className="w-2.5 h-2.5 rounded-full border bg-[#050608] border-white/60 z-20 shrink-0" />
                    </div>

                    {/* 3. Lecture detailed frosted card Column */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className={`${obsidianCardClass} ${obsidianCardHoverClass} p-5 flex flex-col gap-3.5`}>
                        
                        {/* Time duration header block */}
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono font-bold tracking-wider leading-none select-none">
                          <Clock size={11} className="text-slate-400" />
                          <span>{item.time}</span>
                        </div>

                        {/* Title of course */}
                        <h4 className="text-sm font-extrabold text-white truncate leading-snug tracking-wide select-text">
                          {item.subject}
                        </h4>

                        {/* Sub-badges row */}
                        <div className="flex flex-wrap gap-2 items-center w-full pt-1">
                          {/* Type Pill */}
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border flex items-center gap-1 leading-none shadow-sm capitalize ${
                            item.type === 'lab' 
                              ? 'bg-white/[0.08] border-white/20 text-white/70' 
                              : item.type === 'tutorial'
                                ? 'bg-white/[0.06] border-white/15 text-white/60'
                                : 'bg-white/[0.04] border-white/10 text-white/50'
                          }`}>
                            <FileText size={9} />
                            {item.typeLabel}
                          </span>

                          {/* Instructor Pill */}
                          <span className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5 text-slate-300 text-[9px] font-bold flex items-center gap-1 leading-none shadow-sm truncate max-w-[120px]">
                            <User size={9} className="text-slate-400" />
                            {item.instructor}
                          </span>

                          {/* Batch Pill */}
                          {item.batches && (
                            <span className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5 text-slate-300 text-[9px] font-bold flex items-center gap-1 leading-none shadow-sm uppercase font-mono">
                              <Users size={9} className="text-slate-400" />
                              {item.batches}
                            </span>
                          )}

                          {/* Venue room Pill */}
                          <span className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5 text-slate-300 text-[9px] font-bold flex items-center gap-1 leading-none shadow-sm uppercase font-mono">
                            <MapPin size={9} className="text-white/50 shrink-0" />
                            {item.room}
                          </span>
                        </div>

                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Breaks in the Day section rendered cleanly below the lectures list */}
          {breaks.length > 0 && (
            <div className="w-full mt-2">
              <div className={`${obsidianCardClass} p-5 flex flex-col gap-4 text-left border-dashed border-white/20 bg-white/[0.01]`}>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2 flex items-center gap-1.5 select-none">
                  <Sparkles size={12} className="text-slate-400" /> Breaks in the Day
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {breaks.map((brk, bIdx) => (
                    <div key={bIdx} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm text-left">
                      <span className="text-[10px] font-mono font-bold text-slate-300 leading-none">{brk.timeRange}</span>
                      <span className="text-[9px] font-black text-white/60 uppercase tracking-widest font-mono mt-0.5 leading-none">{brk.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
