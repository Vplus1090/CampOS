import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, User, Users, SlidersHorizontal,
  ChevronDown, Sparkles, RefreshCw
} from 'lucide-react';
import M3ScreenHeader from './M3ScreenHeader';

// Weekdays
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

  // Scroll detection state
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 10);
  };

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

  // Fetch current batch timeline classes
  const displayEvents = useMemo(() => {
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
  }, [dbClasses, selectedCourse, selectedSemester, selectedPhase, selectedBatch, selectedDay]);

  // Dynamic Breaks in the Day Calculator
  const breaks = useMemo(() => {
    if (displayEvents.length < 2) return [];
    const calculatedBreaks = [];
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
        
        calculatedBreaks.push({
          timeRange: `${formatTime(endMin)} - ${formatTime(startMin)}`,
          duration: durationStr.trim()
        });
      }
    }
    return calculatedBreaks;
  }, [displayEvents]);

  const getBatchName = () => {
    if (!dbMeta) return '';
    const list = dbMeta.batches[selectedCourse]?.[selectedSemester]?.[selectedPhase] || [];
    return list.find(b => b.id === selectedBatch)?.name || '';
  };

  return (
    <div className="m3-screen timetable-dashboard">
      <M3ScreenHeader
        title="Timetable"
        subtitle="Lecture schedule & venue details"
        isScrolled={isScrolled}
        onBack={() => setActiveTab('home')}
      />

      <div onScroll={handleScroll} className="m3-screen__scroll">
        {/* Dynamic header row with filters toggle */}
        <div className="flex justify-end items-center w-full px-1 mb-2 shrink-0">
          {dbMeta && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shadow-sm cursor-pointer ${
                showFilters
                  ? 'bg-[#d0bcff] text-[#381e72]'
                  : 'bg-[#292035] hover:bg-[#352a48] text-[#d0bcff]'
              }`}
              type="button"
            >
              <SlidersHorizontal size={12} />
              <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
            </button>
          )}
        </div>

        {/* Dynamic Filters Panel */}
        {showFilters && dbMeta && (
          <div className="w-full bg-[#211a30]/55 border border-[#483c5e]/30 backdrop-blur-xl rounded-[28px] p-5 flex flex-col gap-4 shrink-0 text-left select-none shadow-lg">
            
            {/* 1. Day Selector */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono pl-1">Day</span>
              <div className="m3-segmented-chips flex-wrap gap-y-2">
                {weekDays.map((day) => {
                  const isActive = selectedDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`m3-segmented-chip m3-segmented-chip--sm ${
                        isActive ? 'm3-segmented-chip--selected' : ''
                      }`}
                      type="button"
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Course Selector */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono pl-1">Course</span>
              <div className="m3-segmented-chips flex-wrap">
                {dbMeta.courses.map((c) => {
                  const isActive = selectedCourse === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCourse(c.id)}
                      className={`m3-segmented-chip m3-segmented-chip--sm ${
                        isActive ? 'm3-segmented-chip--selected' : ''
                      }`}
                      type="button"
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Semester & Phase Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono pl-1">Semester</span>
                <div className="m3-segmented-chips">
                  {(dbMeta.semesters[selectedCourse] || []).map((sem) => {
                    const isActive = selectedSemester === sem.id;
                    return (
                      <button
                        key={sem.id}
                        onClick={() => setSelectedSemester(sem.id)}
                        className={`m3-segmented-chip m3-segmented-chip--sm min-w-[36px] justify-center ${
                          isActive ? 'm3-segmented-chip--selected' : ''
                        }`}
                        type="button"
                      >
                        {sem.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono pl-1">Phase</span>
                <div className="m3-segmented-chips">
                  {(dbMeta.phases[selectedCourse]?.[selectedSemester] || []).map((ph) => {
                    const isActive = selectedPhase === ph.id;
                    return (
                      <button
                        key={ph.id}
                        onClick={() => setSelectedPhase(ph.id)}
                        className={`m3-segmented-chip m3-segmented-chip--sm min-w-[36px] justify-center ${
                          isActive ? 'm3-segmented-chip--selected' : ''
                        }`}
                        type="button"
                      >
                        {ph.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Batch Selector Dropdown */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono pl-1">Batch</span>
              <div className="m3-select-wrap">
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="m3-select"
                >
                  {(dbMeta.batches[selectedCourse]?.[selectedSemester]?.[selectedPhase] || []).map((b) => (
                    <option className="bg-[#1c1529] text-[#e6e1e5]" key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <div className="absolute -translate-y-1/2 pointer-events-none text-[#cac4d0] right-4 top-1/2">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Database Loading State */}
        {loadingDb && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3.5 select-none py-16 text-center">
            <RefreshCw className="animate-spin text-[#d0bcff]" size={28} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syncing Timetable DB...</span>
          </div>
        )}

        {/* Database Error State */}
        {!loadingDb && dbError && (
          <div className="m3-surface-card p-6 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
              <Sparkles size={24} />
            </div>
            <p className="text-sm font-semibold text-[#e6e1e5]">{dbError}</p>
          </div>
        )}

        {/* Timetable Lectures */}
        {!loadingDb && !dbError && (
          <div className="w-full flex flex-col gap-4">
            {displayEvents.length === 0 ? (
              <div className="m3-surface-card p-8 flex flex-col items-center justify-center gap-3 text-center select-none">
                <div className="w-12 h-12 rounded-2xl bg-[#4f378b]/30 flex items-center justify-center text-[#d0bcff] shadow-md">
                  <Sparkles size={22} />
                </div>
                <h4 className="text-sm text-[#e6e1e5] font-extrabold uppercase tracking-widest">Free Day!</h4>
                <span className="text-xs text-slate-400 font-medium leading-relaxed max-w-[240px]">
                  No classes scheduled for today. Explore other days or batches!
                </span>
              </div>
            ) : (
              displayEvents.map((item, idx) => (
                <div key={idx} className="m3-surface-card p-5 flex flex-col gap-3.5 text-left shadow-sm">
                  {/* Card Header: time range badge + type */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="m3-badge text-[11px] font-bold">
                      {item.time}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#d0bcff]">
                      {item.typeLabel}
                    </span>
                  </div>

                  {/* Subject Name */}
                  <h4 className="text-base font-extrabold text-white tracking-wide leading-snug">
                    {item.subject}
                  </h4>

                  {/* Assist Chips Row */}
                  <div className="flex flex-wrap gap-2 pt-1 w-full">
                    {/* Venue Room */}
                    <span className="m3-assist-chip">
                      <MapPin size={11} className="mr-1 text-[#d0bcff] shrink-0" />
                      {item.room}
                    </span>

                    {/* Instructor */}
                    <span className="m3-assist-chip">
                      <User size={11} className="mr-1 text-[#d0bcff] shrink-0" />
                      {item.instructor}
                    </span>

                    {/* Batches */}
                    {item.batches && (
                      <span className="m3-assist-chip">
                        <Users size={11} className="mr-1 text-[#d0bcff] shrink-0" />
                        {item.batches}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Breaks in the Day Section */}
        {!loadingDb && !dbError && breaks.length > 0 && (
          <div className="w-full mt-2">
            <div className="m3-surface-card p-5 flex flex-col gap-4 text-left border-dashed border-[#483c5e]/50 bg-transparent">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-[#d0bcff] border-b border-white/5 pb-2 flex items-center gap-1.5 select-none">
                <Sparkles size={12} className="text-[#d0bcff]" /> Breaks in the Day
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {breaks.map((brk, bIdx) => (
                  <div key={bIdx} className="bg-[#211a30]/35 border border-[#483c5e]/20 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm text-left">
                    <span className="text-[10px] font-bold text-[#e6e1e5] leading-none">{brk.timeRange}</span>
                    <span className="text-[9px] font-black text-[#d0bcff] uppercase tracking-widest mt-0.5 leading-none">{brk.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
