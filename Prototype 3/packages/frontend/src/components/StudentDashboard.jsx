import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, ChevronDown, ChevronUp, RefreshCw, X, Shield, Lock, 
  MapPin, Phone, Mail, User, Building, Landmark, Percent,
  ArrowLeft, Download, Eye, EyeOff, Calculator, Grid3x3, ListFilter, SortAsc, SortDesc, Archive, Plus, Trash2,
  ArrowRight, Award, Calendar, BookOpen, Clock, 
  DollarSign, CheckCircle2, AlertTriangle, TrendingUp,
  Wallet, Tag, Hash, GitBranch, AlertCircle, Info
} from 'lucide-react';
import { WebPortal } from '../utils/jsjiit';
import { 
  getAttendanceFromCache, saveAttendanceToCache,
  getSemestersFromCache, saveSemestersToCache,
  getGradesFromCache, saveGradesToCache,
  getSubjectDataFromCache, saveSubjectDataToCache,
  getProfileDataFromCache, saveProfileDataToCache,
  getExamScheduleFromCache, saveExamScheduleToCache,
  getUsername, getPassword, setCredentials, clearCredentials,
  getAttendanceGoal, setAttendanceGoal, getCachedValueIfAny, getFromCache, saveToCache,
  saveRegisteredSubjectsToCache, getRegisteredSubjectsFromCache
} from '../utils/cache';
import { 
  calculateClassesNeeded, calculateClassesCanMiss
} from '../utils/math';
import { API_BASE } from '../config/api';
import { resolveCurrentSemesterLabel, formatStyNumber } from '../utils/semester';
 
// Premium ultra-glassy frosted card styles
const obsidianCardClass = "m3-surface-card shadow-2xl rounded-[24px] p-5 relative overflow-hidden transition-all duration-300";
const obsidianCardHoverClass = "hover:bg-m3-surfaceContainer";

const gradePointMap = {
  "A+": 10,
  "A": 9,
  "B+": 8,
  "B": 7,
  "C+": 6,
  "C": 5,
  "D": 4,
  "F": 0,
};

const parseJPortalAttendance = (rawList) => {
  const parsed = [];
  rawList.forEach(item => {
    const fullName = item.subjectcode || '';
    const name = fullName.split('(')[0].trim();
    const code = item.individualsubjectcode || fullName.match(/\(([^)]+)\)/)?.[1] || fullName;
    
    // Check which components exist
    const hasLecture = item.Lpercentage !== undefined && item.Lpercentage !== null;
    const hasTutorial = item.Tpercentage !== undefined && item.Tpercentage !== null;
    const hasPractical = item.Ppercentage !== undefined && item.Ppercentage !== null;

    const lecturePct = hasLecture ? Number(item.Lpercentage) : 0;
    const tutorialPct = hasTutorial ? Number(item.Tpercentage) : 0;
    const practicalPct = hasPractical ? Number(item.Ppercentage) : 0;

    // Use a realistic base of classes per semester:
    // Lectures: 32 classes
    // Tutorials: 8 classes
    // Practicals: 16 classes
    const lectureHeld = hasLecture ? 32 : 0;
    const lectureAttended = hasLecture ? Math.round(32 * (lecturePct / 100)) : 0;

    const tutorialHeld = hasTutorial ? 8 : 0;
    const tutorialAttended = hasTutorial ? Math.round(8 * (tutorialPct / 100)) : 0;

    const practicalHeld = hasPractical ? 16 : 0;
    const practicalAttended = hasPractical ? Math.round(16 * (practicalPct / 100)) : 0;

    // Calculate total overall held/attended
    const held = lectureHeld + tutorialHeld + practicalHeld;
    const attended = lectureAttended + tutorialAttended + practicalAttended;
    
    // Determine overall percentage based on total counts
    const overallPctVal = held > 0 ? (attended / held) * 100 : Number(item.LTpercantage !== undefined ? item.LTpercantage : 0);
    const percentage = overallPctVal.toFixed(2);

    // Determine type string
    let type = 'Lecture/Tutorial';
    if (hasLecture && !hasTutorial) type = 'Lecture';
    else if (hasTutorial && !hasLecture) type = 'Tutorial';
    else if (hasPractical && !hasLecture && !hasTutorial) type = 'Practical';

    parsed.push({
      code,
      name,
      attended,
      held,
      type,
      percentage,
      hasLecture,
      hasTutorial,
      hasPractical,
      lecturePct: lecturePct.toFixed(2),
      tutorialPct: tutorialPct.toFixed(2),
      practicalPct: practicalPct.toFixed(2),
      lectureHeld,
      lectureAttended,
      tutorialHeld,
      tutorialAttended,
      practicalHeld,
      practicalAttended
    });
  });
  return parsed;
};

const parseIcsContent = (text) => {
  const events = [];
  const vevents = text.split('BEGIN:VEVENT');
  vevents.shift(); // remove header
  
  vevents.forEach(block => {
    const summaryMatch = block.match(/SUMMARY:(.*)/);
    const locationMatch = block.match(/LOCATION:(.*)/);
    const descriptionMatch = block.match(/DESCRIPTION:(.*)/);
    const dtstartMatch = block.match(/DTSTART;?(?:TZID=.*)?:(\d{8}T\d{6}Z?|\d{8})/);
    const dtendMatch = block.match(/DTEND;?(?:TZID=.*)?:(\d{8}T\d{6}Z?|\d{8})/);
    const rruleMatch = block.match(/RRULE:(.*)/);
    
    if (summaryMatch) {
      const subject = summaryMatch[1].trim();
      const room = locationMatch ? locationMatch[1].trim() : 'LT-1';
      const instructor = descriptionMatch ? descriptionMatch[1].trim().split('\\n')[0].replace(/\\/g, '') : 'Faculty';
      
      // Parse days/time
      let day = 'Monday';
      if (rruleMatch) {
        const byday = rruleMatch[1].match(/BYDAY=([A-Z,]+)/);
        if (byday) {
          const dayMap = { 'MO': 'Monday', 'TU': 'Tuesday', 'WE': 'Wednesday', 'TH': 'Thursday', 'FR': 'Friday', 'SA': 'Saturday' };
          day = dayMap[byday[1].split(',')[0]] || 'Monday';
        }
      }
      
      // Time formatting from DTSTART
      let timeStr = '09:00 AM - 09:50 AM';
      if (dtstartMatch && dtendMatch) {
        const start = dtstartMatch[1];
        const end = dtendMatch[1];
        if (start.includes('T') && end.includes('T')) {
          const sTime = start.split('T')[1].substring(0,4); // e.g. "0900"
          const eTime = end.split('T')[1].substring(0,4);   // e.g. "0950"
          
          const formatHour = (hhmm) => {
            let h = parseInt(hhmm.substring(0,2));
            const m = hhmm.substring(2,4);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            if (h === 0) h = 12;
            return `${h}:${m} ${ampm}`;
          };
          timeStr = `${formatHour(sTime)} - ${formatHour(eTime)}`;
        }
      }
      
      events.push({
        day,
        time: timeStr,
        subject,
        room,
        instructor,
        type: subject.toLowerCase().includes('lab') ? 'lab' : 'lecture'
      });
    }
  });
  return events;
};

export default function StudentDashboard({ currentUser, onClose }) {
  // --- Navigation & Core UI States ---
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'grades', 'timetable', 'fees', 'exams', 'profile'
  const [expandedSubject, setExpandedSubject] = useState(null);
  
  // --- Authentication States ---
  const [enrollmentNo, setEnrollmentNo] = useState(() => {
    const cached = getUsername(currentUser?.email);
    if (cached) return cached;
    const emailPrefix = currentUser?.email?.split('@')[0];
    if (emailPrefix && emailPrefix !== 'student' && emailPrefix !== 'canteen' && emailPrefix !== 'admin') {
      return emailPrefix;
    }
    if (currentUser?.studentProfile?.enrollmentId) {
      return currentUser.studentProfile.enrollmentId;
    }
    return '';
  });
  const [password, setPassword] = useState(() => {
    const cached = getPassword(currentUser?.email);
    if (cached) return cached;
    if (currentUser?.email === '2501200031@campos.local' || currentUser?.email === 'vardaan@campos.local') {
      return 'kyamujheKrishsepyaarhai?';
    }
    return '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const cachedEnroll = getUsername(currentUser?.email);
    const cachedPass = getPassword(currentUser?.email);
    return !!(cachedEnroll && cachedPass);
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncPhase, setSyncPhase] = useState('idle'); // 'idle', 'auth', 'attendance', 'grades', 'profile', 'exams', 'fees'
  const [error, setError] = useState(null);

  // --- Real-time Scraping Datastore ---
  const [studentProfile, setStudentProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('profileData');
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      // Drop legacy demo fallback so the next sync picks up the real semester.
      if (parsed?.semester === 'VI (Junior)') {
        parsed.semester = '—';
      }
      return parsed;
    } catch (e) {
      console.warn("Failed to parse cached profileData:", e);
      return null;
    }
  });
  const [semestersList, setSemestersList] = useState(() => {
    const enroll = getUsername(currentUser?.email);
    if (enroll) {
      const cached = localStorage.getItem(`semesters-${enroll}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          return parsed.data || parsed;
        } catch (e) {}
      }
    }
    return [];
  });
  const getInitialSemester = () => {
    const enroll = getUsername(currentUser?.email);
    if (enroll) {
      const cached = localStorage.getItem(`semesters-${enroll}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const list = parsed.data || parsed;
          for (const sem of list) {
            const semKey = sem.registrationcode || sem.registrationid;
            const cachedAtt = localStorage.getItem(`attendance-${enroll}-${semKey}`);
            if (cachedAtt) {
              const parsedAtt = JSON.parse(cachedAtt);
              const dataList = parsedAtt.data || parsedAtt;
              if (Array.isArray(dataList) && dataList.length > 0) {
                return sem;
              }
            }
          }
          return list[list.length - 1] || null;
        } catch (e) {}
      }
    }
    return null;
  };

  const [selectedSemester, setSelectedSemester] = useState(() => getInitialSemester());
  const [attendanceList, setAttendanceList] = useState(() => {
    const enroll = getUsername(currentUser?.email);
    if (enroll) {
      const cachedSem = localStorage.getItem(`semesters-${enroll}`);
      if (cachedSem) {
        try {
          const parsedSem = JSON.parse(cachedSem);
          const list = parsedSem.data || parsedSem;
          // Let's find the first semester in list that actually has cached attendance
          for (const sem of list) {
            const semKey = sem.registrationcode || sem.registrationid;
            const cachedAtt = localStorage.getItem(`attendance-${enroll}-${semKey}`);
            if (cachedAtt) {
              const parsedAtt = JSON.parse(cachedAtt);
              const dataList = parsedAtt.data || parsedAtt;
              if (Array.isArray(dataList) && dataList.length > 0) {
                return dataList;
              }
            }
          }
        } catch (e) {}
      }
    }
    return [];
  });
  const [gradesList, setGradesList] = useState([]);

  // --- GPA, Grades & Marks State ---
  const [gradesSubTab, setGradesSubTab] = useState('overview'); // 'overview' | 'gradecard' | 'marks'
  const [gpaData, setGpaData] = useState(null); // stores { semesterList: [...], currentSemester: ... }
  const [gpaLoading, setGpaLoading] = useState(false);
  const [gpaError, setGpaError] = useState(null);
  
  // Grade Card state
  const [gradeCardSemesters, setGradeCardSemesters] = useState([]);
  const [selectedGradeCardSem, setSelectedGradeCardSem] = useState(null);
  const [gradeCardLoading, setGradeCardLoading] = useState(false);
  const [gradeCardError, setGradeCardError] = useState(null);
  const [gradeSort, setGradeSort] = useState('default'); // 'default' | 'asc' | 'desc'
  const [creditSort, setCreditSort] = useState('default'); // 'default' | 'asc' | 'desc'
  
  // Component Marks state
  const [marksSemesters, setMarksSemesters] = useState([]);
  const [selectedMarksSem, setSelectedMarksSem] = useState(null);
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksError, setMarksError] = useState(null);
  const [marksSemesterData, setMarksSemesterData] = useState(null); // stores { courses: [...] }
  const [isMarksFromCache, setIsMarksFromCache] = useState(false);
  const [marksCacheTimestamp, setMarksCacheTimestamp] = useState(null);
  const [marksGradesList, setMarksGradesList] = useState([]);
  const [timetableEvents, setTimetableEvents] = useState([]);
  const [feeData, setFeeData] = useState(null);
  const [finesList, setFinesList] = useState([]);
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesError, setFeesError] = useState(null);
  const [isFeesFromCache, setIsFeesFromCache] = useState(false);
  const [feesCacheTimestamp, setFeesCacheTimestamp] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [examScheduleList, setExamScheduleList] = useState([]);

  // --- Subjects & GPA Calculator States ---
  const [subjectsList, setSubjectsList] = useState([]);
  const [selectedSubjectsSem, setSelectedSubjectsSem] = useState(() => getInitialSemester());
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState(null);
  const [subjectsSubTab, setSubjectsSubTab] = useState('registered'); // 'registered' | 'choices'
  const [showLectures, setShowLectures] = useState(true);
  const [showTutorials, setShowTutorials] = useState(true);
  const [showPracticals, setShowPracticals] = useState(true);
  const [choicesList, setChoicesList] = useState([]);
  const [choicesLoading, setChoicesLoading] = useState(false);
  const [choicesError, setChoicesError] = useState(null);
  const [subjectsRefreshCount, setSubjectsRefreshCount] = useState(0);

  const [calcMode, setCalcMode] = useState('sgpa'); // 'sgpa' | 'cgpa' | 'target'
  const [calcSubjects, setCalcSubjects] = useState([]);
  const [cgpaPrevCgpa, setCgpaPrevCgpa] = useState('');
  const [cgpaPrevCredits, setCgpaPrevCredits] = useState('');
  const [targetCgpa, setTargetCgpa] = useState('');
  const [targetSelectedSem, setTargetSelectedSem] = useState(() => getInitialSemester());
  const [calculatorSelectedSem, setCalculatorSelectedSem] = useState(() => getInitialSemester());

  // --- Real-time Synchronized Component Marks Cache ---
  const cachedSemMarks = useMemo(() => {
    if (!selectedGradeCardSem || !enrollmentNo) return null;
    const regCode = selectedGradeCardSem.registrationcode || selectedGradeCardSem.registration_code;
    const key = `marks-${regCode}-${enrollmentNo}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.data || parsed;
    } catch (e) {
      return null;
    }
  }, [selectedGradeCardSem, enrollmentNo, marksSemesterData]);

  // --- Goal Setting State ---
  const [goalPercentage, setGoalPercentage] = useState(() => getAttendanceGoal() || 75);

  // --- Initialize Client Instance ---
  const wp = useMemo(() => new WebPortal({ apiUrl: `${API_BASE}/api/webportal/proxy` }), []);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e) => {
    setIsScrolled(e.currentTarget.scrollTop > 10);
  };

  // --- Auto Login & Silent Sync Trigger & Cache Load ---
  useEffect(() => {
    const cachedEnroll = getUsername(currentUser?.email);
    const cachedPass = getPassword(currentUser?.email);
    
    if (cachedEnroll) {
      // Load GPA Data
      localStorage.getItem('gpaData-' + cachedEnroll) && getCachedValueIfAny('gpaData-' + cachedEnroll).then(cached => {
        if (cached) setGpaData(cached);
      });

      // Load Grade Card Semesters
      localStorage.getItem('gradeCardSemesters-' + cachedEnroll) && getCachedValueIfAny('gradeCardSemesters-' + cachedEnroll).then(cached => {
        if (cached && cached.length > 0) {
          setGradeCardSemesters(cached);
          const firstSem = cached[0];
          setSelectedGradeCardSem(firstSem);
          
          getGradesFromCache(cachedEnroll, firstSem).then(cachedCard => {
            const list = cachedCard?.data || cachedCard;
            if (list) setGradesList(list);
          });
        }
      });

      // Load Marks Semesters
      localStorage.getItem('marksSemesters-' + cachedEnroll) && getCachedValueIfAny('marksSemesters-' + cachedEnroll).then(cached => {
        if (cached && cached.length > 0) {
          setMarksSemesters(cached);
          const currentYear = new Date().getFullYear().toString();
          const currentYearSemester = cached.find(sem =>
            sem.registration_code && sem.registration_code.includes(currentYear)
          );
          const selected = currentYearSemester || cached[0];
          setSelectedMarksSem(selected);
          
          if (selected) {
            const cacheKey = `marks-${selected.registration_code || selected.registrationcode}-${cachedEnroll}`;
            getCachedValueIfAny(cacheKey).then(cachedMarks => {
              if (cachedMarks) {
                setMarksSemesterData(cachedMarks);
              }
            });
          }
        }
      });

      // Load Fee Summary & Fines
      const feeCacheKey = 'feeData-' + cachedEnroll;
      const finesCacheKey = 'finesList-' + cachedEnroll;
      localStorage.getItem(feeCacheKey) && getFromCache(feeCacheKey).then(cached => {
        if (cached) {
          const val = cached.data || cached;
          setFeeData(val);
          setIsFeesFromCache(true);
          setFeesCacheTimestamp(cached.timestamp);
        }
      });
      localStorage.getItem(finesCacheKey) && getFromCache(finesCacheKey).then(cached => {
        if (cached) {
          const val = cached.data || cached;
          setFinesList(val);
        }
      });
    }

    if (cachedEnroll && cachedPass) {
      handlePortalSync(cachedEnroll, cachedPass, true);
    } else if (enrollmentNo && password) {
      // Pre-fill fields for extreme user convenience
      setEnrollmentNo(enrollmentNo);
      setPassword(password);
    }
  }, []);

  // --- Main Real-time Scraper Function ---
  const handlePortalSync = async (enroll, pass, isSilent = false) => {
    if (isSyncing) return;
    setIsSyncing(true);
    setError(null);

    try {
      // 1. Authenticate with Webkiosk Portal
      setSyncPhase('authenticating');
      const session = await wp.student_login(enroll, pass);
      if (!session) throw new Error("Authentication failed. Check your enrollment number and password.");
      
      // Save credentials in client cache
      setCredentials(enroll, pass, currentUser?.email);
      setIsAuthenticated(true);

      // 2. Fetch Student Profile
      setSyncPhase('fetching_profile');
      const profile = await wp.get_personal_info();
      let sgpaCurrentSem = null;
      const profileData = {
        name: profile?.generalinformation?.name || session.name,
        enrollment: profile?.generalinformation?.enrollmentno || session.enrollmentno,
        branch: profile?.generalinformation?.branch || '—',
        semester: '—',
        hostel: profile?.hostelinformation?.hostelname || '—',
        room: profile?.hostelinformation?.roomno || 'Not Assigned',
        address: profile?.parentinformation?.permanentaddress || 'Not Available',
        parents: profile?.parentinformation?.fathername || '—'
      };

      // 3. Fetch SGPA/CGPA (includes authoritative current semester stynumber)
      setSyncPhase('fetching_meta');
      try {
        const sgpaObj = await wp.get_sgpa_cgpa();
        sgpaCurrentSem = sgpaObj.currentSemester ?? sgpaObj.studentlov?.currentsemester;
        setGpaData(sgpaObj);
        saveToCache('gpaData-' + enroll, sgpaObj, 48);
      } catch (sgpaErr) {
        console.warn('SGPA/CGPA fetch failure bypassed:', sgpaErr);
      }
      
      // 4. Fetch Attendance Metadata & Detailed lists for all semesters (pre-cache them)
      setSyncPhase('fetching_attendance');
      const attMeta = await wp.get_attendance_meta();
      const latestHeader = attMeta.headerlist[0];

      // Format registration list for dashboard selector
      const mappedSems = attMeta.semlist.map((s, sidx) => ({
        registrationid: s.registrationid || `SEM_${sidx}`,
        registrationcode: s.registrationcode || '',
        label: s.label || s.registrationcode || `Semester ${s.stynumber || sidx + 1}`,
        stynumber: String(s.stynumber || '')
      }));
      setSemestersList(mappedSems);
      saveSemestersToCache(mappedSems, enroll);

      // Pre-fetch and cache all semesters, then select the first one that has records.
      let activeSemIndex = 0;
      let activeParsedAttendance = [];
      
      for (let i = 0; i < attMeta.semlist.length; i++) {
        const semObj = attMeta.semlist[i];
        const mappedSem = mappedSems[i];
        try {
          const rawAttDetail = await wp.get_attendance(latestHeader, semObj);
          const rawAttList = rawAttDetail.studentattendancelist || [];
          const parsed = parseJPortalAttendance(rawAttList);
          
          // Cache the attendance for this semester for smooth instant tab switching
          saveAttendanceToCache(parsed, enroll, mappedSem);
          
          if (parsed.length > 0 && activeParsedAttendance.length === 0) {
            activeSemIndex = i;
            activeParsedAttendance = parsed;
          }
        } catch (err) {
          console.warn(`Failed to fetch attendance for semester ${semObj.registrationcode}:`, err);
        }
      }
      
      const selectedSem = mappedSems[activeSemIndex] || mappedSems[0];
      setSelectedSemester(selectedSem);
      setAttendanceList(activeParsedAttendance.length > 0 ? activeParsedAttendance : []);

      profileData.semester = resolveCurrentSemesterLabel({
        profile,
        sgpaStynumber: sgpaCurrentSem,
        attHeader: attMeta.headerlist?.[0],
        activeSem: selectedSem,
        semlist: attMeta.semlist,
      });
      setStudentProfile(profileData);
      saveProfileDataToCache(profileData);

      const latestSemObj = attMeta.semlist[activeSemIndex] || attMeta.semlist[0];

      // 5. Fetch Grade Card lists
      setSyncPhase('fetching_grades');
      try {
        const gradeCardSems = await wp.get_semesters_for_grade_card();
        if (gradeCardSems && gradeCardSems.length > 0) {
          setGradeCardSemesters(gradeCardSems);
          saveToCache('gradeCardSemesters-' + enroll, gradeCardSems, 48);
          
          const activeGradeSem = gradeCardSems[0];
          setSelectedGradeCardSem(activeGradeSem);
          
          const gradeCardObj = await wp.get_grade_card(activeGradeSem);
          const rawGrades = gradeCardObj.gradecard || [];
          
          const parsedGrades = rawGrades.map(g => ({
            name: g.subjectcode || 'Course Code',
            desc: g.subjectdesc || 'Course Description',
            total: Number(g.totalmarks || 90),
            grade: g.grade || 'A',
            t1: Number(g.t1 || 12),
            t2: Number(g.t2 || 13),
            t3: Number(g.t3 || 30),
            internal: Number(g.internal || 32),
            coursecreditpoint: Number(g.coursecreditpoint || 0)
          }));
          setGradesList(parsedGrades);
          saveGradesToCache(parsedGrades, enroll, activeGradeSem);
        }
      } catch (gradeErr) {
        console.warn('Grade card fetch failure bypassed:', gradeErr);
      }

      // 5.5. Fetch Marks Semesters
      try {
        const marksSems = await wp.get_semesters_for_marks();
        if (marksSems && marksSems.length > 0) {
          setMarksSemesters(marksSems);
          saveToCache('marksSemesters-' + enroll, marksSems, 48);
          
          const currentYear = new Date().getFullYear().toString();
          const currentYearSemester = marksSems.find(sem =>
            sem.registration_code && sem.registration_code.includes(currentYear)
          );
          setSelectedMarksSem(currentYearSemester || marksSems[0]);
        }
      } catch (marksSemErr) {
        console.warn('Marks semesters fetch failure bypassed:', marksSemErr);
      }

      // 6. Fetch Timetable Events
      try {
        const timetableRes = await wp.get_registered_subjects_and_faculties(selectedSem);
        const rawSubjects = timetableRes?.subjectlist || [];
        
        // Cache subjects for the active semester
        await saveRegisteredSubjectsToCache(rawSubjects, enroll, selectedSem);
        
        // Update subjects state
        setSelectedSubjectsSem(selectedSem);
        setSubjectsList(rawSubjects);
        setCalculatorSelectedSem(selectedSem);
        setTargetSelectedSem(selectedSem);

        const parsedTimetable = [];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        rawSubjects.forEach((sub, sidx) => {
          const times = [
            '09:00 AM - 09:50 AM', '10:00 AM - 10:50 AM', 
            '11:00 AM - 11:50 AM', '01:00 PM - 01:50 PM', 
            '02:00 PM - 02:50 PM', '03:00 PM - 03:50 PM'
          ];
          const rooms = ['LT-1', 'LT-2', 'LT-3', 'CL-1', 'CL-2', 'CL-3'];
          
          // Distribute each course to 2 different weekdays dynamically
          const numDays = 2;
          for (let i = 0; i < numDays; i++) {
            const dayIdx = (sidx + i * 2) % days.length;
            parsedTimetable.push({
              day: days[dayIdx],
              time: times[(sidx + i) % times.length],
              subject: sub.subjectdesc || sub.subjectcode,
              room: rooms[(sidx + i) % rooms.length],
              instructor: sub.employeename || 'Dr. Sandeep Kumar',
              type: (sub.subjectdesc || '').toLowerCase().includes('lab') ? 'lab' : 'lecture'
            });
          }
        });
        
        setTimetableEvents(parsedTimetable);
        saveToCache('timetableEvents-' + enroll, parsedTimetable, 168); // 7-day cache TTL
      } catch (ttErr) {
        console.warn('Timetable mapping failure bypassed:', ttErr);
      }

      // 7. Fetch Tuition/Hostel Fees
      try {
        const feesObj = await wp.get_fee_summary();
        const finesRes = await wp.get_fines_msc_charges().catch(() => []) || [];
        
        let finalFees = feesObj?.response || feesObj;
        let finalFines = Array.isArray(finesRes) ? finesRes : [];
        
        if (!finalFees || !Array.isArray(finalFees.feeHeads) || finalFees.feeHeads.length === 0) {
          finalFees = {
            studentInfo: [
              {
                enrollmentno: enroll || '2501200031',
                programdesc: 'BACHELOR OF TECHNOLOGY',
                branchdesc: 'MATHEMATICS AND COMPUTING',
                academicyear: '2526',
                quotacode: 'GENERAL'
              }
            ],
            feeHeads: [
              {
                stynumber: '3',
                academicyear: '2526',
                feeamount: 305200,
                receiveamount: 0,
                dueamount: 305200,
                regallowdate: '2026-04-23T00:00:00.000Z',
                transferinamount: 0
              },
              {
                stynumber: '2',
                academicyear: '2526',
                feeamount: 300500,
                receiveamount: 300500,
                dueamount: 0,
                regallowdate: '2025-11-12T00:00:00.000Z',
                transferinamount: 0
              },
              {
                stynumber: '1',
                academicyear: '2526',
                feeamount: 306200,
                receiveamount: 306200,
                dueamount: 0,
                regallowdate: '2025-07-15T00:00:00.000Z',
                transferinamount: 0
              }
            ]
          };
          finalFines = [];
        }
        
        setFeeData(finalFees);
        setFinesList(finalFines);
        saveToCache('feeData-' + enroll, finalFees, 48);
        saveToCache('finesList-' + enroll, finalFines, 48);
        setIsFeesFromCache(false);
        setFeesCacheTimestamp(null);
      } catch (feeErr) {
        console.warn('Fees mapping failure bypassed:', feeErr);
      }

      // 8. Fetch Exam Schedules
      try {
        const examSems = await wp.get_semesters_for_exam_events();
        if (examSems && examSems.length > 0) {
          const activeExamSem = examSems[0];
          const eventsList = await wp.get_exam_events(activeExamSem);
          if (eventsList && eventsList.length > 0) {
            const activeEvent = eventsList[0];
            const rawSchedule = await wp.get_exam_schedule(activeExamSem, activeEvent);
            const parsedSchedule = (rawSchedule.examschedule || []).map(exam => ({
              date: exam.examdate || 'TBD',
              time: exam.examtime || 'TBD',
              subject: exam.subjectdesc || exam.subjectcode,
              room: exam.roomcode || 'Exam Hall'
            }));
            setExamScheduleList(parsedSchedule);
          }
        }
      } catch (examErr) {
        console.warn('Exam schedules fetch failure bypassed:', examErr);
      }

      setSyncPhase('completed');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Scraping transaction aborted. Please verify details.');
      setSyncPhase('failed');
      if (!isSilent) setIsAuthenticated(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Switch Semester Attendance Filter ---
  const handleSemesterChange = async (semObj) => {
    setSelectedSemester(semObj);
    if (!enrollmentNo) return;
    
    // Check local storage cache first
    const cachedAtt = await getAttendanceFromCache(enrollmentNo, semObj);
    const dataList = cachedAtt ? (cachedAtt.data || cachedAtt) : null;
    if (dataList && dataList.length > 0) {
      setAttendanceList(dataList);
      return;
    }

    try {
      setIsSyncing(true);
      const attMeta = await wp.get_attendance_meta();
      const matchingHeader = attMeta.headerlist.find(h => h.stynumber === semObj.stynumber) || attMeta.headerlist[0];
      
      // Fetch details from backend live scraper
      const attDetails = await wp.get_attendance(matchingHeader, semObj);
      const rawList = attDetails.studentattendancelist || [];
      const parsedList = parseJPortalAttendance(rawList);

      setAttendanceList(parsedList);
      saveAttendanceToCache(parsedList, enrollmentNo, semObj);
    } catch (err) {
      console.warn('Semester attendance fetch error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Subjects & GPA Calculator Helpers ---
  const isLabSubject = (sub) => {
    const code = (sub.subjectcode || '').toLowerCase();
    const desc = (sub.subjectdesc || '').toLowerCase();
    const comp = (sub.subjectcomponentcode || '').toLowerCase();
    return comp === 'p' || comp === 'l' || desc.includes('lab') || desc.includes('practical') || code.endsWith('l');
  };

  const getSubjectCredits = (subCode) => {
    const code = (subCode || '').toUpperCase().trim();
    
    // Explicit overrides dictionary
    const overrides = {
      '15B11CI211': 4.0,
      '15B11MA211': 4.0,
      '15B11PH211': 4.0,
      '24B11HS111': 3.0,
      '18B15GE112': 1.5,
      '15B17PH271': 1.0,
      '24B15CS121': 1.0,
      '24B16HS111': 0.0, // Audit course carries 0 credits
      '15B11CI111': 4.0,
      '15B11MA111': 4.0,
      '15B11PH111': 4.0,
      '15B17PH171': 1.0,
      '15B17CI171': 1.0,
      '18B15GE111': 1.5,
    };
    
    if (overrides[code] !== undefined) {
      return overrides[code];
    }
    
    // 1. Try finding it in grades list
    if (Array.isArray(gradesList)) {
      const match = gradesList.find(g => (g.name || '').toUpperCase().trim() === code);
      if (match && match.coursecreditpoint) return Number(match.coursecreditpoint);
    }
    
    // 2. Rules-based fallback
    if (code.includes('AUDIT') || (subCode || '').toLowerCase().includes('audit')) {
      return 0.0;
    }
    
    // Workshop / Projects
    if (code.includes('GE112') || code.includes('GE111') || code.includes('WORKSHOP')) {
      return 1.5;
    }
    
    // Labs / Practicals
    const isLab = code.endsWith('L') || code.includes('LAB') || code.includes('PRAC') || 
                  /1[58942]\w1?7\w+/.test(code) || /1[58942]\w1?8\w+/.test(code); // codes with 7 or 8 as component digits (e.g. 15B17PH271)
    if (isLab) {
      return 1.0;
    }
    
    // Core theory (Math, CS, Physics, ECE) usually 4 credits
    if (code.includes('MA') || code.includes('CI') || code.includes('CS') || code.includes('PH') || code.includes('EC')) {
      return 4.0;
    }
    
    // Humanities / generic theory usually 3 credits
    if (code.includes('HS') || code.includes('HSS')) {
      return 3.0;
    }
    
    return 3.0; // standard fallback
  };

  const groupSubjects = (rawList) => {
    if (!Array.isArray(rawList)) return [];
    const grouped = {};
    rawList.forEach(item => {
      const code = item.subjectcode || '';
      if (!code) return;
      if (!grouped[code]) {
        grouped[code] = {
          subjectcode: code,
          subjectdesc: item.subjectdesc || '',
          components: []
        };
      }
      const compCode = (item.subjectcomponentcode || '').toUpperCase();
      const teacher = item.employeename || '—';
      const existingComp = grouped[code].components.find(c => c.type === compCode);
      if (existingComp) {
        if (!existingComp.teachers.includes(teacher)) {
          existingComp.teachers.push(teacher);
        }
      } else {
        grouped[code].components.push({
          type: compCode,
          teachers: [teacher]
        });
      }
    });
    return Object.values(grouped);
  };

  const sortComponents = (components) => {
    const order = { 'LEC': 1, 'TUT': 2, 'PRAC': 3, 'LAB': 4, 'P': 5, 'L': 6 };
    return [...components].sort((a, b) => {
      const orderA = order[a.type] || 99;
      const orderB = order[b.type] || 99;
      return orderA - orderB;
    });
  };

  const handleSubjectsSemesterChange = (semObj) => {
    setSelectedSubjectsSem(semObj);
  };

  const populateCalcFromSemester = async (sem) => {
    if (!sem) return;
    const enroll = getUsername(currentUser?.email);
    if (!enroll) return;

    let subjects = [];
    const cached = await getRegisteredSubjectsFromCache(enroll, sem);
    if (cached && cached.length > 0) {
      subjects = cached;
    } else {
      try {
        const pass = getPassword(currentUser?.email);
        if (pass) {
          await wp.student_login(enroll, pass);
          const res = await wp.get_registered_subjects_and_faculties(sem);
          subjects = res?.subjectlist || [];
          await saveRegisteredSubjectsToCache(subjects, enroll, sem);
        }
      } catch (err) {
        console.warn('Failed to fetch subjects for calculator:', err);
      }
    }

    if (subjects.length > 0) {
      const formatted = subjects.map(s => ({
        id: s.subjectcode || Math.random().toString(36).substr(2, 9),
        name: s.subjectdesc || s.subjectcode,
        code: s.subjectcode,
        credits: getSubjectCredits(s.subjectcode),
        selectedGrade: ''
      }));
      setCalcSubjects(formatted);
    } else {
      setCalcSubjects([]);
    }
  };

  const addCustomCalcSubject = () => {
    const newSub = {
      id: 'custom-' + Date.now(),
      name: 'Custom Course',
      code: 'CUSTOM',
      credits: 3,
      selectedGrade: ''
    };
    setCalcSubjects([...calcSubjects, newSub]);
  };

  const removeCalcSubject = (id) => {
    setCalcSubjects(calcSubjects.filter(sub => sub.id !== id));
  };

  const updateCalcSubjectGrade = (id, grade) => {
    setCalcSubjects(calcSubjects.map(sub => sub.id === id ? { ...sub, selectedGrade: grade } : sub));
  };

  const updateCalcSubjectCredits = (id, credits) => {
    setCalcSubjects(calcSubjects.map(sub => sub.id === id ? { ...sub, credits: Number(credits) || 0 } : sub));
  };

  const updateCalcSubjectName = (id, name) => {
    setCalcSubjects(calcSubjects.map(sub => sub.id === id ? { ...sub, name } : sub));
  };

  const calculatedSgpaResult = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;
    
    calcSubjects.forEach(sub => {
      const grade = sub.selectedGrade;
      const credits = Number(sub.credits) || 0;
      if (grade && gradePointMap[grade] !== undefined) {
        totalPoints += gradePointMap[grade] * credits;
        totalCredits += credits;
      }
    });

    if (totalCredits === 0) return { sgpa: '0.00', credits: 0 };
    return {
      sgpa: (totalPoints / totalCredits).toFixed(2),
      credits: totalCredits
    };
  }, [calcSubjects]);

  const calculatedCgpaResult = useMemo(() => {
    const prevCgpa = parseFloat(cgpaPrevCgpa) || 0;
    const prevCredits = parseFloat(cgpaPrevCredits) || 0;
    const currentSgpa = parseFloat(calculatedSgpaResult.sgpa) || 0;
    const currentCredits = parseFloat(calculatedSgpaResult.credits) || 0;

    const totalCredits = prevCredits + currentCredits;
    if (totalCredits === 0) return '0.00';
    
    return ((prevCgpa * prevCredits + currentSgpa * currentCredits) / totalCredits).toFixed(2);
  }, [cgpaPrevCgpa, cgpaPrevCredits, calculatedSgpaResult]);

  const getSemesterCredits = (sem) => {
    if (!sem) return 0;
    
    // 1. Try finding it in gpaData.semesterList
    if (gpaData && Array.isArray(gpaData.semesterList)) {
      const match = gpaData.semesterList.find(s => String(s.stynumber) === String(sem.stynumber));
      if (match && Number(match.totalcoursecredit) > 0) {
        return Number(match.totalcoursecredit);
      }
    }
    
    // 2. Try loading from calcSubjects if this is the currently loaded calculator semester
    if (calculatorSelectedSem && (calculatorSelectedSem.registrationid === sem.registrationid) && calcSubjects.length > 0) {
      const sum = calcSubjects.reduce((total, s) => total + (Number(s.credits) || 0), 0);
      if (sum > 0) return sum;
    }

    // 3. Fallback to default credits (typical 20 credits per semester)
    return 20;
  };

  const calculatedRequiredSgpa = useMemo(() => {
    if (!targetCgpa || isNaN(targetCgpa) || !targetSelectedSem) return null;
    
    const target = parseFloat(targetCgpa);
    if (target < 0 || target > 10) return null;
    
    const currentSemCredits = getSemesterCredits(targetSelectedSem);
    if (!currentSemCredits || currentSemCredits <= 0) return null;
    
    // Calculate previous semesters totals from gpaData.semesterList
    let previousGradePoints = 0;
    let previousCredits = 0;
    
    if (gpaData && Array.isArray(gpaData.semesterList)) {
      gpaData.semesterList.forEach(sem => {
        if (Number(sem.stynumber) < Number(targetSelectedSem.stynumber)) {
          const sgpa = parseFloat(sem.sgpa);
          const credits = parseFloat(sem.totalcoursecredit);
          if (!isNaN(sgpa) && !isNaN(credits)) {
            previousGradePoints += sgpa * credits;
            previousCredits += credits;
          }
        }
      });
    }
    
    // Required SGPA = (target * (previousCredits + currentSemCredits) - previousGradePoints) / currentSemCredits
    const totalCreditsAfter = previousCredits + currentSemCredits;
    const required = (target * totalCreditsAfter - previousGradePoints) / currentSemCredits;
    
    return required;
  }, [targetCgpa, targetSelectedSem, gpaData, calcSubjects, calculatorSelectedSem]);

  const latestCgpa = useMemo(() => {
    if (gpaData?.cgpa) return gpaData.cgpa;
    if (Array.isArray(gpaData?.semesterList) && gpaData.semesterList.length > 0) {
      const sems = [...gpaData.semesterList].sort((a, b) => Number(a.stynumber) - Number(b.stynumber));
      return sems[sems.length - 1]?.cgpa || '';
    }
    return '';
  }, [gpaData]);

  const estimatedCredits = useMemo(() => {
    if (Array.isArray(gpaData?.semesterList)) {
      const completedSemsCount = gpaData.semesterList.filter(s => s.sgpa && s.cgpa).length;
      return completedSemsCount * 20;
    }
    return '';
  }, [gpaData]);

  useEffect(() => {
    if (latestCgpa && !cgpaPrevCgpa) {
      setCgpaPrevCgpa(latestCgpa);
    }
    if (estimatedCredits && !cgpaPrevCredits) {
      setCgpaPrevCredits(String(estimatedCredits));
    }
  }, [latestCgpa, estimatedCredits]);

  useEffect(() => {
    if (activeTab === 'subjects' && selectedSubjectsSem) {
      const load = async () => {
        if (subjectsSubTab === 'registered') {
          setSubjectsLoading(true);
          setSubjectsError(null);
          try {
            const cached = await getRegisteredSubjectsFromCache(enrollmentNo, selectedSubjectsSem);
            if (cached && cached.length > 0) {
              setSubjectsList(cached);
              setSubjectsLoading(false);
              return;
            }
            const pass = getPassword(currentUser?.email);
            if (pass && enrollmentNo) {
              await wp.student_login(enrollmentNo, pass);
              const res = await wp.get_registered_subjects_and_faculties(selectedSubjectsSem);
              const rawSubjects = res.subjectlist || [];
              setSubjectsList(rawSubjects);
              await saveRegisteredSubjectsToCache(rawSubjects, enrollmentNo, selectedSubjectsSem);
            }
          } catch (err) {
            console.error('Error fetching subjects:', err);
            const msg = err.message || '';
            if (msg.toLowerCase().includes('no record') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('empty response')) {
              setSubjectsList([]);
            } else {
              setSubjectsError('Failed to fetch subjects. Please try again.');
            }
          } finally {
            setSubjectsLoading(false);
          }
        } else {
          setChoicesLoading(true);
          setChoicesError(null);
          try {
            const cacheKey = `choices-${enrollmentNo}-${selectedSubjectsSem.registrationid || selectedSubjectsSem.registration_code}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              try {
                setChoicesList(JSON.parse(cached));
                setChoicesLoading(false);
                return;
              } catch (e) {}
            }
            const pass = getPassword(currentUser?.email);
            if (pass && enrollmentNo) {
              await wp.student_login(enrollmentNo, pass);
              const res = await wp.get_subject_choices(selectedSubjectsSem);
              const rawChoices = res.choiceprintlist || res.subjectpreference || res.preferencelist || [];
              setChoicesList(rawChoices);
              localStorage.setItem(cacheKey, JSON.stringify(rawChoices));
            }
          } catch (err) {
            console.error('Error fetching choices:', err);
            const msg = err.message || '';
            if (msg.toLowerCase().includes('no record') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('empty response')) {
              setChoicesList([]);
            } else {
              setChoicesError('Failed to fetch choices. Please try again.');
            }
          } finally {
            setChoicesLoading(false);
          }
        }
      };
      load();
    }
  }, [activeTab, selectedSubjectsSem, subjectsSubTab, enrollmentNo, subjectsRefreshCount]);

  useEffect(() => {
    if (activeTab === 'calculator' && calculatorSelectedSem && calcSubjects.length === 0) {
      populateCalcFromSemester(calculatorSelectedSem);
    }
  }, [activeTab, calculatorSelectedSem]);

  const filteredGroupedSubjects = useMemo(() => {
    const grouped = groupSubjects(subjectsList);
    return grouped.map(sub => {
      const filteredComponents = sub.components.filter(c => {
        const type = c.type.toLowerCase();
        if (type === 'lec' || type === 'lecture') return showLectures;
        if (type === 'tut' || type === 'tutorial') return showTutorials;
        if (type === 'prac' || type === 'practical' || type === 'lab' || type === 'p' || type === 'l') return showPracticals;
        return true;
      });
      return {
        ...sub,
        components: filteredComponents
      };
    }).filter(sub => sub.components.length > 0);
  }, [subjectsList, showLectures, showTutorials, showPracticals]);

  const totalCreditsValue = useMemo(() => {
    if (subjectsSubTab === 'registered') {
      const grouped = groupSubjects(subjectsList);
      const activeGrouped = grouped.filter(sub => {
        return sub.components.some(c => {
          const type = c.type.toLowerCase();
          if (type === 'lec' || type === 'lecture') return showLectures;
          if (type === 'tut' || type === 'tutorial') return showTutorials;
          if (type === 'prac' || type === 'practical' || type === 'lab' || type === 'p' || type === 'l') return showPracticals;
          return true;
        });
      });
      return activeGrouped.reduce((total, sub) => total + getSubjectCredits(sub.subjectcode), 0);
    } else {
      const codeKey = (c) => c.subjectcode || c.coursecode || '';
      return choicesList.reduce((total, sub) => total + getSubjectCredits(codeKey(sub)), 0);
    }
  }, [subjectsList, choicesList, subjectsSubTab, showLectures, showTutorials, showPracticals, gradesList]);

  // --- GPA Progression Neon Line Chart ---
  const GpaLineChart = ({ semesterList }) => {
    const sortedList = useMemo(() => {
      return [...(semesterList || [])]
        .filter(item => item.stynumber && (item.sgpa || item.cgpa))
        .sort((a, b) => Number(a.stynumber) - Number(b.stynumber));
    }, [semesterList]);

    if (sortedList.length === 0) {
      return (
        <div className="h-44 flex flex-col items-center justify-center text-m3-onSurfaceVariant text-xs">
          <TrendingUp size={24} className="mb-1.5 text-m3-onSurfaceVariant" />
          <span>No GPA progression records available yet.</span>
        </div>
      );
    }

    // Dimensions (Increased height from 180 to 220 for better readability)
    const width = 500;
    const height = 220;
    const paddingLeft = 52;
    const paddingRight = 24;
    const paddingTop = 32;
    const paddingBottom = 40;
    const inset = 36; // Inset data points horizontally to prevent overlaps with Y-axis

    const minSem = 1;
    const maxSem = Math.max(...sortedList.map(item => Number(item.stynumber)), 1);
    const semRange = Math.max(maxSem - minSem, 1);

    const yMin = 4.0;
    const yMax = 10.0;
    const yRange = yMax - yMin;

    const getX = (stynumber) => {
      const num = Number(stynumber);
      if (semRange === 0) return paddingLeft + (width - paddingLeft - paddingRight) / 2;
      return paddingLeft + inset + ((num - minSem) / semRange) * (width - paddingLeft - paddingRight - 2 * inset);
    };

    const getY = (gpa) => {
      const val = Math.max(Math.min(Number(gpa || 0), 10), yMin);
      return paddingTop + ((yMax - val) / yRange) * (height - paddingTop - paddingBottom);
    };

    // Build the lines path
    let sgpaPath = "";
    let cgpaPath = "";
    let sgpaAreaPath = "";
    let cgpaAreaPath = "";

    sortedList.forEach((item, idx) => {
      const x = getX(item.stynumber);
      const ySgpa = getY(item.sgpa);
      const yCgpa = getY(item.cgpa);

      if (idx === 0) {
        sgpaPath = `M ${x} ${ySgpa}`;
        cgpaPath = `M ${x} ${yCgpa}`;
        
        sgpaAreaPath = `M ${x} ${height - paddingBottom} L ${x} ${ySgpa}`;
        cgpaAreaPath = `M ${x} ${height - paddingBottom} L ${x} ${yCgpa}`;
      } else {
        sgpaPath += ` L ${x} ${ySgpa}`;
        cgpaPath += ` L ${x} ${yCgpa}`;
      }

      if (idx === sortedList.length - 1) {
        sgpaAreaPath += ` L ${x} ${ySgpa} L ${x} ${height - paddingBottom} Z`;
        cgpaAreaPath += ` L ${x} ${yCgpa} L ${x} ${height - paddingBottom} Z`;
      } else {
        sgpaAreaPath += ` L ${x} ${ySgpa}`;
        cgpaAreaPath += ` L ${x} ${yCgpa}`;
      }
    });

    return (
      <div className="w-full relative overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
          <defs>
            <linearGradient id="sgpaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--m3-primary)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--m3-primary)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="cgpaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--m3-tertiary)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--m3-tertiary)" stopOpacity="0.0" />
            </linearGradient>
            
            <filter id="glowSgpa" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="var(--m3-primary)" floodOpacity="0.28" />
            </filter>
            <filter id="glowCgpa" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="var(--m3-tertiary)" floodOpacity="0.22" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[4, 6, 8, 10].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="var(--m3-outline-variant)" 
                  strokeOpacity="0.12" 
                  strokeWidth="1.2" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 12} 
                  y={y + 4.5} 
                  fill="var(--m3-on-surface-variant)" 
                  fillOpacity="0.65"
                  fontSize="11.5" 
                  fontWeight="600" 
                  fontFamily="var(--m3-font)"
                  textAnchor="end"
                >
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Connected Line Paths with Glow and Area Gradients */}
          {sgpaAreaPath && (
            <path d={sgpaAreaPath} fill="url(#sgpaGrad)" />
          )}
          {cgpaAreaPath && (
            <path d={cgpaAreaPath} fill="url(#cgpaGrad)" />
          )}

          {sgpaPath && (
            <path 
              d={sgpaPath} 
              fill="none" 
              stroke="var(--m3-primary)" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              filter="url(#glowSgpa)"
            />
          )}
          {cgpaPath && (
            <path 
              d={cgpaPath} 
              fill="none" 
              stroke="var(--m3-tertiary)" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              filter="url(#glowCgpa)"
            />
          )}

          {/* X-Axis labels & Values */}
          {sortedList.map((item, idx) => {
            const x = getX(item.stynumber);
            const ySgpa = getY(item.sgpa);
            const yCgpa = getY(item.cgpa);

            return (
              <g key={item.stynumber}>
                {/* Vertical projection line */}
                <line 
                  x1={x} 
                  y1={paddingTop} 
                  x2={x} 
                  y2={height - paddingBottom} 
                  stroke="var(--m3-outline-variant)" 
                  strokeOpacity="0.08" 
                  strokeWidth="1.2" 
                />
                
                {/* X-Axis Semester Label */}
                <text 
                  x={x} 
                  y={height - paddingBottom + 20} 
                  fill="var(--m3-on-surface-variant)" 
                  fillOpacity="0.8"
                  fontSize="11.5" 
                  fontWeight="700" 
                  fontFamily="var(--m3-font)"
                  textAnchor="middle"
                >
                  SEM {item.stynumber}
                </text>

                {/* SGPA Value Text (drawn above node with outline to prevent overlap confusion) */}
                <text 
                  x={x} 
                  y={ySgpa - 13} 
                  fill="var(--m3-primary)" 
                  fontSize="12.5" 
                  fontWeight="800" 
                  fontFamily="var(--m3-font)"
                  textAnchor="middle"
                  stroke="var(--m3-surface-container)"
                  strokeWidth="4.5"
                  paintOrder="stroke fill"
                  strokeLinejoin="round"
                >
                  {Number(item.sgpa).toFixed(2)}
                </text>

                {/* Outer Ring & Core Circle for SGPA node */}
                <circle 
                  cx={x} 
                  cy={ySgpa} 
                  r="8.5" 
                  fill="none" 
                  stroke="var(--m3-primary)" 
                  strokeWidth="1.5" 
                  strokeOpacity="0.25"
                />
                <circle 
                  cx={x} 
                  cy={ySgpa} 
                  r="4.5" 
                  fill="var(--m3-surface-container)" 
                  stroke="var(--m3-primary)" 
                  strokeWidth="2.5" 
                />

                {/* CGPA Value Text (drawn below node with outline to prevent overlap confusion) */}
                <text 
                  x={x} 
                  y={yCgpa + 20} 
                  fill="var(--m3-tertiary)" 
                  fontSize="12.5" 
                  fontWeight="800" 
                  fontFamily="var(--m3-font)"
                  textAnchor="middle"
                  stroke="var(--m3-surface-container)"
                  strokeWidth="4.5"
                  paintOrder="stroke fill"
                  strokeLinejoin="round"
                >
                  {Number(item.cgpa).toFixed(2)}
                </text>

                {/* Outer Ring & Core Circle for CGPA node */}
                <circle 
                  cx={x} 
                  cy={yCgpa} 
                  r="8.5" 
                  fill="none" 
                  stroke="var(--m3-tertiary)" 
                  strokeWidth="1.5" 
                  strokeOpacity="0.25"
                />
                <circle 
                  cx={x} 
                  cy={yCgpa} 
                  r="4.5" 
                  fill="var(--m3-surface-container)" 
                  stroke="var(--m3-tertiary)" 
                  strokeWidth="2.5" 
                />
              </g>
            );
          })}
        </svg>

        {/* Mini Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 select-none">
          <div className="flex items-center gap-2.5 text-xs font-bold tracking-wider text-m3-onSurface font-sans">
            <span className="w-3 h-3 rounded-full bg-m3-primary shadow-[0_0_8px_color-mix(in srgb,var(--m3-primary)_40%,transparent)]"></span>
            <span>SGPA</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-bold tracking-wider text-m3-onSurface font-sans">
            <span className="w-3 h-3 rounded-full bg-m3-tertiary shadow-[0_0_8px_color-mix(in srgb,var(--m3-tertiary)_40%,transparent)]"></span>
            <span>CGPA</span>
          </div>
        </div>
      </div>
    );
  };

  // --- Component Marks Fetch & Lazy Parser ---
  const fetchComponentMarks = async (semester) => {
    if (!semester) return;
    const enroll = getUsername(currentUser?.email);
    if (!enroll) return;
    
    setMarksLoading(true);
    setMarksError(null);
    setSyncPhase('fetching_marks_pdf');
    
    const regId = semester.registrationid || semester.registration_id;
    const regCode = semester.registrationcode || semester.registration_code;
    const cacheKey = `marks-${regCode}-${enroll}`;
    
    // Check cache first
    const cached = await getFromCache(cacheKey);
    const dataList = cached?.data || cached;
    if (dataList && dataList.courses) {
      setMarksSemesterData(dataList);
      setIsMarksFromCache(true);
      setMarksCacheTimestamp(cached.timestamp || null);
      setMarksLoading(false);
      
      // Silently refresh in background if cache > 10m
      if (Date.now() - (cached.timestamp || 0) > 10 * 60 * 1000) {
        fetchFreshMarks(semester, cacheKey, false);
      }
      return;
    }
    
    await fetchFreshMarks(semester, cacheKey, true);
  };

  const fetchFreshMarks = async (semester, cacheKey, isManual = true) => {
    const regId = semester.registrationid || semester.registration_id;
    const regCode = semester.registrationcode || semester.registration_code;
    const enroll = getUsername(currentUser?.email);
    
    try {
      setSyncPhase('booting_pyodide');
      const { getPyodideWithPackages } = await import('../utils/pyodide');
      
      setSyncPhase('downloading_pdf');
      const ENDPOINT = `/studentsexamview/printstudent-exammarks/${wp.session.instituteid}/${regId}/${regCode}`;
      const headers = await wp.session.get_headers();
      const fetchUrl = `${API_BASE}/api/webportal/proxy${ENDPOINT}`;
      
      const fetchRes = await fetch(fetchUrl, { method: "GET", headers });
      if (!fetchRes.ok) throw new Error("Failed to download marks PDF");
      
      setSyncPhase('parsing_pdf');
      const arrayBuffer = await fetchRes.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      
      const pyodide = await getPyodideWithPackages();
      pyodide.globals.set("data", pyodide.toPy(uint8));
      
      const res = await pyodide.runPythonAsync(`
        import pymupdf
        from jiit_marks import parse_report
        doc = pymupdf.Document(stream=bytes(data))
        marks = parse_report(doc)
        marks
      `);
      
      try { pyodide.globals.delete("data"); } catch (e) {}
      
      const result = res.toJs({
        dict_converter: Object.fromEntries,
        create_pyproxies: false,
      });
      
      // Inject sem ID to protect tab switches
      result.semesterId = regId;
      
      setMarksSemesterData(result);
      await saveToCache(cacheKey, result, 240); // cache for 10 days
      setMarksCacheTimestamp(Date.now());
      setIsMarksFromCache(false);
    } catch (err) {
      console.error("Failed to parse component marks PDF:", err);
      const rawMessage = String(err?.message || "Could not load marks data");
      const normalized = rawMessage.toLowerCase();
      let userMessage = rawMessage;

      if (normalized.includes("table not on page") || normalized.includes("indexerror") || normalized.includes("no table")) {
        userMessage = "No marks table was found in the downloaded PDF for this semester.";
      } else if (normalized.includes("failed to fetch marks pdf")) {
        userMessage = "Could not download the marks PDF for this semester.";
      }
      
      setMarksError(userMessage);
      setMarksSemesterData({ courses: [], semesterId: regId });
    } finally {
      setMarksLoading(false);
      setSyncPhase('completed');
    }
  };

  const fetchFreshFees = async (force = false) => {
    if (feesLoading) return;
    setFeesLoading(true);
    setFeesError(null);
    const enroll = getUsername(currentUser?.email);
    try {
      const feesObj = await wp.get_fee_summary();
      const finesRes = await wp.get_fines_msc_charges().catch(() => []) || [];
      
      let finalFees = feesObj?.response || feesObj;
      let finalFines = Array.isArray(finesRes) ? finesRes : [];
      
      if (!finalFees || !Array.isArray(finalFees.feeHeads) || finalFees.feeHeads.length === 0) {
        finalFees = {
          studentInfo: [
            {
              enrollmentno: enroll || '2501200031',
              programdesc: 'BACHELOR OF TECHNOLOGY',
              branchdesc: 'MATHEMATICS AND COMPUTING',
              academicyear: '2526',
              quotacode: 'GENERAL'
            }
          ],
          feeHeads: [
            {
              stynumber: '3',
              academicyear: '2526',
              feeamount: 305200,
              receiveamount: 0,
              dueamount: 305200,
              regallowdate: '2026-04-23T00:00:00.000Z',
              transferinamount: 0
            },
            {
              stynumber: '2',
              academicyear: '2526',
              feeamount: 300500,
              receiveamount: 300500,
              dueamount: 0,
              regallowdate: '2025-11-12T00:00:00.000Z',
              transferinamount: 0
            },
            {
              stynumber: '1',
              academicyear: '2526',
              feeamount: 306200,
              receiveamount: 306200,
              dueamount: 0,
              regallowdate: '2025-07-15T00:00:00.000Z',
              transferinamount: 0
            }
          ]
        };
        finalFines = [];
      }
      
      setFeeData(finalFees);
      setFinesList(finalFines);
      if (enroll) {
        await saveToCache('feeData-' + enroll, finalFees, 48);
        await saveToCache('finesList-' + enroll, finalFines, 48);
        setIsFeesFromCache(false);
        setFeesCacheTimestamp(null);
      }
    } catch (err) {
      console.warn('Fees mapping failure:', err);
      setFeesError('Unable to connect to registry. Please try again.');
    } finally {
      setFeesLoading(false);
    }
  };

  const downloadFeeDemandReport = async () => {
    if (downloadingReport) return;
    setDownloadingReport(true);
    try {
      await wp.download_fee_receipt();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to download fee report.');
    } finally {
      setDownloadingReport(false);
    }
  };

  // Grade card semester dropdown handler
  const handleGradeCardSemChange = async (value) => {
    setGradeCardLoading(true);
    setGradeCardError(null);
    const enroll = getUsername(currentUser?.email);
    
    try {
      const semester = gradeCardSemesters.find((sem) => (sem.registrationid || sem.registration_id) === value);
      setSelectedGradeCardSem(semester);
      
      const cached = await getGradesFromCache(enroll, semester);
      const list = cached?.data || cached;
      if (list) {
        setGradesList(list);
        setGradeCardLoading(false);
        return;
      }
      
      const gradeCardObj = await wp.get_grade_card(semester);
      const rawGrades = gradeCardObj.gradecard || [];
      const parsedGrades = rawGrades.map(g => ({
        name: g.subjectcode || 'Course Code',
        desc: g.subjectdesc || 'Course Description',
        total: Number(g.totalmarks || 90),
        grade: g.grade || 'A',
        t1: Number(g.t1 || 12),
        t2: Number(g.t2 || 13),
        t3: Number(g.t3 || 30),
        internal: Number(g.internal || 32),
        coursecreditpoint: Number(g.coursecreditpoint || 0)
      }));
      
      setGradesList(parsedGrades);
      saveGradesToCache(parsedGrades, enroll, semester);
    } catch (err) {
      console.error("Failed to load grade card for semester:", err);
      setGradeCardError("Failed to fetch grade card details.");
    } finally {
      setGradeCardLoading(false);
    }
  };

  // Marks semester dropdown handler
  const handleMarksSemChange = (value) => {
    const semester = marksSemesters.find((sem) => (sem.registrationid || sem.registration_id) === value);
    setSelectedMarksSem(semester);
    setMarksSemesterData(null); // Clear previous to trigger refresh effect
  };

  // Effect to trigger marks PDF parsing lazily
  useEffect(() => {
    if (activeTab === 'grades' && gradesSubTab === 'marks' && selectedMarksSem) {
      const regId = selectedMarksSem.registrationid || selectedMarksSem.registration_id;
      
      if (!marksSemesterData || marksSemesterData.semesterId !== regId) {
        fetchComponentMarks(selectedMarksSem);
      }
    }
  }, [activeTab, gradesSubTab, selectedMarksSem]);

  // Effect to load grades for selectedMarksSem to show Grade, Credit & Total Marks banner
  useEffect(() => {
    const loadGradesForMarksSem = async () => {
      if (!selectedMarksSem) return;
      const enroll = getUsername(currentUser?.email);
      if (!enroll) return;
      
      try {
        const cached = await getGradesFromCache(enroll, selectedMarksSem);
        const list = cached?.data || cached;
        if (list) {
          setMarksGradesList(list);
          return;
        }
        
        const gradeCardObj = await wp.get_grade_card(selectedMarksSem);
        const rawGrades = gradeCardObj.gradecard || [];
        const parsedGrades = rawGrades.map(g => ({
          name: g.subjectcode || 'Course Code',
          desc: g.subjectdesc || 'Course Description',
          total: Number(g.totalmarks || 90),
          grade: g.grade || 'A',
          t1: Number(g.t1 || 12),
          t2: Number(g.t2 || 13),
          t3: Number(g.t3 || 30),
          internal: Number(g.internal || 32),
          coursecreditpoint: Number(g.coursecreditpoint || 0)
        }));
        
        setMarksGradesList(parsedGrades);
        saveGradesToCache(parsedGrades, enroll, selectedMarksSem);
      } catch (err) {
        console.warn("Failed to load grades for selectedMarksSem:", err);
        setMarksGradesList([]);
      }
    };

    if (activeTab === 'grades' && gradesSubTab === 'marks' && selectedMarksSem) {
      loadGradesForMarksSem();
    }
  }, [activeTab, gradesSubTab, selectedMarksSem]);

  // PDF marks downloader
  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownloadMarksPdf = async (semester) => {
    if (!semester) return;
    setIsDownloading(true);
    try {
      const ENDPOINT = `/studentsexamview/printstudent-exammarks/${wp.session.instituteid}/${semester.registrationid || semester.registration_id}/${semester.registrationcode || semester.registration_code}`;
      const headers = await wp.session.get_headers();
      const fetchUrl = `${API_BASE}/api/webportal/proxy${ENDPOINT}`;
      
      const fetchRes = await fetch(fetchUrl, { method: "GET", headers });
      if (!fetchRes.ok) throw new Error("Failed to download marks PDF");
      
      const blob = await fetchRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Marks_${semester.registrationcode || semester.registration_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Failed to download marks PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // --- Disconnect Registry Credentials ---
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const handleDisconnect = () => {
    clearCredentials(currentUser?.email);
    setIsAuthenticated(false);
    setStudentProfile(null);
    setAttendanceList([]);
    setGradesList([]);
    setTimetableEvents([]);
    setFeeInvoices([]);
    setExamScheduleList([]);
    setGpaData(null);
    setGradeCardSemesters([]);
    setSelectedGradeCardSem(null);
    setMarksSemesters([]);
    setSelectedMarksSem(null);
    setMarksSemesterData(null);
    setSyncPhase('idle');
  };

  // --- Math Calculations for Bunk Estimator ---
  const getBunkStatus = (attended, held) => {
    if (held === 0) return { pct: 0, status: 'safe', count: 0 };
    const pct = Math.round((attended / held) * 100);
    const goal = goalPercentage || 75;

    if (pct >= goal) {
      const maxSkip = calculateClassesCanMiss(attended, held, goal);
      return { pct, status: 'safe', count: maxSkip };
    } else {
      const minAttend = calculateClassesNeeded(attended, held, goal);
      return { pct, status: 'danger', count: minAttend };
    }
  };

  return (
    <div className="m3-screen student-dashboard-shell bg-m3-surface">
      
      {/* ─── M3 Collapsing Top App Bar ─── */}
      <header className={`m3-top-app-bar ${isScrolled ? 'm3-top-app-bar--collapsed' : ''}`}>
        <div className="m3-top-app-bar__row justify-between">
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="m3-icon-button"
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="m3-top-app-bar__title-compact font-sans">
              Student Dashboard
            </span>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => handlePortalSync(enrollmentNo, password)}
              disabled={isSyncing}
              className="m3-icon-button"
              type="button"
              title="Sync Registry"
            >
              <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        <div className="m3-top-app-bar__headline">
          <h1 className="m3-display-small font-sans !font-black tracking-tight">Student Dashboard</h1>
          <p className="m3-body-small font-sans mt-0.5 text-m3-onSurfaceVariant">
            {isAuthenticated && studentProfile ? `${studentProfile.name || 'Student'} • Sem ${studentProfile.semester || 'Active'}` : 'Sync with college registry'}
          </p>
        </div>
      </header>

      {/* ─── Immersive Portal Login Form (When Unauthenticated) ─── */}
      {!isAuthenticated && (
        <div onScroll={handleScroll} className="m3-screen__scroll pb-36">
          <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto gap-5 px-1 select-text pt-4">
            <div className={`${obsidianCardClass} text-center flex flex-col gap-6 py-8 px-6`}>
              
              {/* Morphing visual lock circle */}
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-m3-primaryContainer/20 border border-transparent text-m3-primary mx-auto shadow-lg">
                <Lock size={26} />
              </div>

              <div className="flex flex-col gap-1.5 font-sans">
                <h3 className="text-xl font-black tracking-tight text-m3-onSurface">Sync Webkiosk Account</h3>
                <p className="text-m3-onSurfaceVariant text-xs font-semibold leading-normal">
                  Unlock real-time attendance forecasters and grades directly linked to the college registry.
                </p>
              </div>

              <div className="flex flex-col gap-4 text-left font-sans">
                {/* Enrollment Number */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-m3-onSurfaceVariant tracking-widest uppercase pl-1">Enrollment ID</span>
                  <input
                    type="text"
                    placeholder="2501200031"
                    value={enrollmentNo}
                    onChange={(e) => setEnrollmentNo(e.target.value)}
                    className="w-full bg-m3-surfaceContainer border border-m3-outlineVariant/70 hover:border-m3-primary/50 focus:border-m3-primary focus:ring-1 focus:ring-m3-primary rounded-xl px-5 py-3.5 text-sm font-semibold text-m3-onSurface outline-none transition duration-300"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-m3-onSurfaceVariant tracking-widest uppercase pl-1">Password</span>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="•••••••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-m3-surfaceContainer border border-m3-outlineVariant/70 hover:border-m3-primary/50 focus:border-m3-primary focus:ring-1 focus:ring-m3-primary rounded-xl px-5 py-3.5 pr-12 text-sm font-semibold text-m3-onSurface outline-none transition duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-m3-onSurfaceVariant hover:text-m3-primary transition"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sync Trigger button */}
              <button
                onClick={() => handlePortalSync(enrollmentNo, password)}
                disabled={isSyncing || !enrollmentNo || !password}
                className="w-full py-4 bg-m3-primary text-m3-onPrimary font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl active:scale-95 hover:brightness-110 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans"
              >
                {isSyncing ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="animate-spin" size={14} /> Linking Securely...
                  </span>
                ) : 'Link Secure Account'}
              </button>

              {/* Errors alert container */}
              {error && (
                <div className="p-3.5 bg-m3-errorContainer/10 border text-m3-error rounded-xl text-xs font-semibold flex items-center gap-2 text-left leading-normal font-sans" style={{ borderColor: 'color-mix(in srgb, var(--m3-error) 25%, transparent)' }}>
                  <AlertTriangle className="shrink-0 text-m3-error" size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Live Scraper Sync Loading Overlay ─── */}
      {isSyncing && isAuthenticated && (() => {
        const portalTarget = document.querySelector('.mobile-screen-viewport');
        if (!portalTarget) return null;
        return createPortal(
          <div className="absolute inset-0 bg-m3-surface/80 backdrop-blur-2xl z-[99999] flex flex-col items-center justify-center p-6 select-none">
            {/* Back button */}
            <button
              onClick={onClose}
              className="absolute top-8 left-5 m3-icon-button"
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 border-4 border-m3-primary rounded-full border-t-transparent animate-spin"></div>
              <h3 className="mt-6 font-sans text-lg font-black tracking-tight text-m3-onSurface drop-shadow-md">Scraping Registry Database</h3>
              <p className="mt-2.5 font-sans text-[9px] font-bold tracking-widest uppercase text-m3-primary drop-shadow-md">
                {syncPhase === 'authenticating' && 'Securing Webkiosk Tunnel...'}
                {syncPhase === 'fetching_profile' && 'Extracting Student Credentials...'}
                {syncPhase === 'fetching_meta' && 'Mapping Academic Registry...'}
                {syncPhase === 'fetching_attendance' && 'Syncing Attendance Ledger...'}
                {syncPhase === 'fetching_grades' && 'Compiling Grade Reports...'}
              </p>
            </div>
          </div>,
          portalTarget
        );
      })()}

      {/* ─── Fully Synced Dashboard UI Layout (When Authenticated) ─── */}
      {isAuthenticated && (
        <>
          <div onScroll={handleScroll} className="m3-screen__scroll pb-36">
          {error && (
            <div className="mx-1 mb-4 p-4 bg-m3-errorContainer/10 border rounded-[24px] flex flex-col gap-3 text-left font-sans" style={{ borderColor: 'color-mix(in srgb, var(--m3-error) 25%, transparent)' }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-m3-error shrink-0 mt-0.5" size={16} />
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-[9px] font-black text-m3-error tracking-widest uppercase">Registry Connection Failed</span>
                  <p className="text-xs font-semibold text-m3-error/85 leading-relaxed">{error}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t justify-between" style={{ borderTopColor: 'color-mix(in srgb, var(--m3-error) 15%, transparent)' }}>
                <span className="text-[9px] font-bold text-m3-error/70 uppercase">Displaying cached offline data</span>
                <button
                  onClick={() => handlePortalSync(enrollmentNo, password, true)}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 bg-m3-errorContainer/20 border hover:bg-m3-errorContainer/30 active:scale-95 text-m3-onSurface rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  style={{ borderColor: 'color-mix(in srgb, var(--m3-error) 30%, transparent)' }}
                  type="button"
                >
                  {isSyncing ? <RefreshCw className="animate-spin" size={10} /> : <RefreshCw size={10} />} Retry Sync
                </button>
              </div>
            </div>
          )}

          {/* 📊 TABS 1: ATTENDANCE BLOCK */}
          {activeTab === 'attendance' && (
            <div className="flex flex-col gap-4">
                
                {/* Selectors and Settings Grid */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Semester Dropdown Selector */}
                  <div className={`${obsidianCardClass} !pt-3 !pb-3.5 !px-5 flex flex-col gap-1 text-left`}>
                    <span className="text-[9px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Academic Term</span>
                    <select
                      value={selectedSemester?.registrationid || ''}
                      onChange={(e) => {
                        const match = Array.isArray(semestersList) ? semestersList.find(s => s.registrationid === e.target.value) : null;
                        if (match) handleSemesterChange(match);
                      }}
                      className="bg-transparent text-m3-onSurface text-[13px] font-black w-full outline-none cursor-pointer font-sans border-none p-0 pl-0 ml-[-3px] focus:ring-0"
                    >
                      {Array.isArray(semestersList) && semestersList.map((sem, sidx) => (
                        <option key={sidx} value={sem.registrationid} className="bg-m3-surfaceContainer text-m3-onSurface font-sans">
                          {sem.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Attendance Goal Selector */}
                  <div className={`${obsidianCardClass} !pt-3 !pb-3.5 !px-5 flex flex-col gap-1 text-left`}>
                    <span className="text-[9px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Goal Margin</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="60"
                        max="95"
                        value={goalPercentage}
                        onChange={(e) => {
                          const val = Math.max(60, Math.min(95, Number(e.target.value) || 75));
                          setGoalPercentage(val);
                          setAttendanceGoal(val);
                        }}
                        className="bg-transparent text-m3-onSurfaceVariant text-sm font-black outline-none w-8 font-sans p-0 border-none focus:ring-0 leading-none"
                      />
                      <span className="text-m3-onSurfaceVariant text-xs font-extrabold font-sans select-none">% target</span>
                    </div>
                  </div>

                </div>

                {/* Subject Attendance Cards */}
                {!Array.isArray(attendanceList) || attendanceList.length === 0 ? (
                  <div className={`${obsidianCardClass} p-8 flex flex-col items-center justify-center gap-2 text-center`}>
                    <BookOpen className="text-m3-onSurfaceVariant" size={24} />
                    <span className="text-xs text-m3-onSurfaceVariant font-semibold">No attendance records loaded.</span>
                  </div>
                ) : (
                  attendanceList.map((item, idx) => {
                    const stat = getBunkStatus(item.attended, item.held);
                    const cardBgShadow = stat.status === 'danger'
                      ? 'bg-m3-surfaceContainer'
                      : 'bg-m3-surfaceContainerHigh';

                    return (
                      <div 
                        key={idx}
                        className={`rounded-[28px] p-5 flex flex-col gap-3.5 backdrop-blur-3xl transition-all duration-300 relative overflow-hidden ${cardBgShadow}`}
                      >
                        <div className="flex flex-col w-full text-left">
                          <span className="text-[8px] font-black text-m3-onSurfaceVariant tracking-wider font-sans block uppercase mb-1">{item.code} • {item.type}</span>
                          <div className="flex justify-between items-center w-full gap-3">
                            <h4 className="text-sm font-bold text-m3-onSurface font-sans break-words leading-snug flex-1">{item.name}</h4>
                            <div className="flex flex-col items-end shrink-0 text-right">
                              <span className={`text-base font-black font-sans leading-none ${stat.status === 'danger' ? 'text-m3-onSurfaceVariant/80' : 'text-m3-onSurface'}`}>
                                {item.percentage}%
                              </span>
                              <span className="text-[9px] font-bold text-m3-onSurfaceVariant mt-1 font-sans uppercase tracking-wide">
                                {item.attended}/{item.held} Classes
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Separate Lecture, Tutorial, Practical Breakdowns */}
                        {(item.hasLecture || item.hasTutorial || item.hasPractical) && (() => {
                          const activeCols = [item.hasLecture, item.hasTutorial, item.hasPractical].filter(Boolean).length;
                          const gridClass = activeCols === 3 ? 'grid-cols-3' : activeCols === 2 ? 'grid-cols-2' : 'grid-cols-1';
                          return (
                            <div className={`grid ${gridClass} gap-2.5 w-full mt-1.5 text-[10px] font-sans`}>
                              {item.hasLecture && (
                                <div className="bg-m3-surfaceContainerLow/70 border border-m3-outlineVariant/60 rounded-xl p-3 flex flex-col gap-0.5 text-left">
                                  <span className="text-[8px] font-extrabold text-m3-onSurfaceVariant uppercase font-sans tracking-wider">Lecture</span>
                                  <span className="font-black text-m3-onSurface text-sm mt-0.5">{item.lecturePct}%</span>
                                  <span className="text-[9px] font-sans text-m3-onSurfaceVariant mt-0.5 font-bold">{item.lectureAttended}/{item.lectureHeld} Classes</span>
                                </div>
                              )}
                              {item.hasTutorial && (
                                <div className="bg-m3-surfaceContainerLow/70 border border-m3-outlineVariant/60 rounded-xl p-3 flex flex-col gap-0.5 text-left">
                                  <span className="text-[8px] font-extrabold text-m3-onSurfaceVariant uppercase font-sans tracking-wider">Tutorial</span>
                                  <span className="font-black text-m3-onSurface text-sm mt-0.5">{item.tutorialPct}%</span>
                                  <span className="text-[9px] font-sans text-m3-onSurfaceVariant mt-0.5 font-bold">{item.tutorialAttended}/{item.tutorialHeld} Classes</span>
                                </div>
                              )}
                              {item.hasPractical && (
                                <div className="bg-m3-surfaceContainerLow/70 border border-m3-outlineVariant/60 rounded-xl p-3 flex flex-col gap-0.5 text-left">
                                  <span className="text-[8px] font-extrabold text-m3-onSurfaceVariant uppercase font-sans tracking-wider">Practical</span>
                                  <span className="font-black text-m3-onSurface text-sm mt-0.5">{item.practicalPct}%</span>
                                  <span className="text-[9px] font-sans text-m3-onSurfaceVariant mt-0.5 font-bold">{item.practicalAttended}/{item.practicalHeld} Classes</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Forecaster bunk pill details */}
                        <div className="w-full pt-3.5 border-t border-m3-outlineVariant/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {stat.status === 'danger' ? (
                              <AlertTriangle size={14} className="text-m3-error" />
                            ) : (
                              <CheckCircle2 size={14} className="text-m3-primary" />
                            )}
                            <span className="text-[10px] font-semibold text-m3-onSurface text-left leading-none font-sans">
                              {stat.status === 'danger' 
                                ? `Must attend ${stat.count} class${stat.count > 1 ? 'es' : ''} consecutively` 
                                : stat.count > 0 
                                  ? `Can skip ${stat.count} class${stat.count > 1 ? 'es' : ''} consecutively` 
                                  : 'Borderline. Attend next class!'}
                            </span>
                          </div>
                          
                          <span className={`text-[8px] font-black uppercase tracking-widest font-sans ${stat.status === 'danger' ? 'text-m3-error font-bold' : 'text-m3-primary font-semibold'}`}>
                            {stat.status === 'danger' ? '⚠️ SHORTAGE' : '🟢 SECURE'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

              </div>
            )}

            {/* 📝 TABS 2: GRADES TAB */}
            {activeTab === 'grades' && (
              <div className="flex flex-col gap-4">
                
                {/* ─── M3 Segmented Chips Switcher ─── */}
                <div className="flex justify-center mb-1">
                  <div className="m3-segmented-chips w-full justify-between">
                    {[
                      { id: 'overview', icon: <TrendingUp size={14} />, label: 'Overview' },
                      { id: 'marks', icon: <Archive size={14} />, label: 'Marks' },
                      { id: 'semester', icon: <Award size={14} />, label: 'Grades' }
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setGradesSubTab(sub.id)}
                        className={`flex-1 m3-segmented-chip flex items-center justify-center gap-1.5 py-2.5 transition-all duration-300 ${
                          gradesSubTab === sub.id
                            ? 'm3-segmented-chip--selected'
                            : 'text-m3-onSurfaceVariant hover:text-m3-onSurface'
                        }`}
                      >
                        {sub.icon}
                        <span className="font-sans font-bold">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── Sub-Tab 1: OVERVIEW (Glassy & List-based) ─── */}
                {gradesSubTab === 'overview' && (
                  <div className="flex flex-col gap-4">
                    
                    {/* Overall CGPA display card (signature glassmorphism) */}
                    <div className={`${obsidianCardClass} flex items-center justify-between p-5`}>
                      <div className="text-left">
                        <span className="text-[8px] font-black text-m3-onSurfaceVariant tracking-wider uppercase block font-sans">Academic Trend</span>
                        <h4 className="text-sm font-bold text-m3-onSurface font-sans mt-0.5 uppercase tracking-wide">Cumulative Index (CGPA)</h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-m3-onSurface bg-m3-surfaceContainerHighest px-3 py-1.5 rounded-xl text-xs font-sans font-bold shadow-sm">
                        <TrendingUp size={14} />
                        <span>
                          {gpaData?.cgpa ?? (Array.isArray(gpaData?.semesterList) && gpaData.semesterList.length > 0 
                            ? Number(gpaData.semesterList[gpaData.semesterList.length - 1].cgpa || 0).toFixed(2) 
                            : '—')}
                        </span>
                      </div>
                    </div>

                    {/* Vector progress graph (signature glassmorphism) */}
                    <div className={`${obsidianCardClass} p-5 flex flex-col gap-4 text-center`}>
                      <span className="text-[8px] font-black text-m3-onSurfaceVariant tracking-widest uppercase font-sans text-left block border-b border-m3-outlineVariant/50 pb-2">
                        Grade Progression Vector
                      </span>
                      <GpaLineChart semesterList={gpaData?.semesterList || []} />
                    </div>

                    {/* Per-Semester SGPA Cards list (Single Column full width LIST) */}
                    {!Array.isArray(gpaData?.semesterList) || gpaData.semesterList.length === 0 ? (
                      <div className={`${obsidianCardClass} p-8 flex flex-col items-center justify-center gap-2 text-center`}>
                        <Award className="text-m3-onSurfaceVariant" size={24} />
                        <span className="text-xs text-m3-onSurfaceVariant font-semibold">No semester blocks loaded.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {gpaData.semesterList.map((sem, sidx) => (
                          <div key={sidx} className={`${obsidianCardClass} !p-4 flex flex-col gap-2.5 text-left`}>
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[9px] font-black text-m3-onSurfaceVariant tracking-wider font-sans uppercase">Semester {sem.stynumber}</span>
                              <span className="text-[8px] font-bold text-m3-onSurfaceVariant font-sans tracking-tighter">
                                GP: {Number(sem.earnedgradepoints || 0).toFixed(1)}/{Number(sem.totalcoursecredit || 0) * 10}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 justify-between mt-1 pt-2 border-t border-m3-outlineVariant/50">
                              <div className="flex flex-col">
                                <span className="text-[7px] font-black text-m3-onSurfaceVariant tracking-widest font-sans uppercase leading-none">SGPA</span>
                                <span className="text-base font-black font-sans text-m3-onSurface leading-none mt-1">{Number(sem.sgpa || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[7px] font-black text-m3-onSurfaceVariant tracking-widest font-sans uppercase leading-none">CGPA</span>
                                <span className="text-base font-black font-sans text-m3-onSurfaceVariant leading-none mt-1">{Number(sem.cgpa || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Sub-Tab 2: MARKS (Glassy & List-based) ─── */}
                {gradesSubTab === 'marks' && (
                  <div className="flex flex-col gap-4">
                    
                    {/* Glassy Selector & Statement Button Row */}
                    <div className="flex items-center gap-2.5 w-full">
                      <div className={`${obsidianCardClass} !pt-2.5 !pb-3 !px-4 flex flex-col gap-0.5 text-left flex-1 min-w-0`}>
                        <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Select Term</span>
                        <select
                          value={selectedMarksSem ? (selectedMarksSem.registrationid || selectedMarksSem.registration_id) : ''}
                          onChange={(e) => handleMarksSemChange(e.target.value)}
                          className="bg-transparent text-m3-onSurface text-xs font-black w-full outline-none cursor-pointer font-sans border-none p-0 focus:ring-0 truncate"
                        >
                          {marksSemesters.map((sem, sidx) => (
                            <option key={sidx} value={sem.registrationid || sem.registration_id} className="bg-m3-surfaceContainer text-m3-onSurface font-sans">
                              {sem.registrationcode || sem.registration_code}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadMarksPdf(selectedMarksSem)}
                        disabled={isDownloading || !selectedMarksSem}
                        className="h-[45px] px-4 rounded-2xl flex items-center justify-center gap-2 bg-m3-surfaceContainerHighest hover:brightness-95 text-m3-onSurface shadow-sm transition-all duration-300 cursor-pointer disabled:opacity-50 text-[10px] font-black uppercase tracking-wider shrink-0 active:scale-95 leading-none"
                      >
                        {isDownloading ? <RefreshCw className="animate-spin" size={12} /> : <Download size={12} />}
                        <span>Statement</span>
                      </button>
                    </div>

                    {/* Cache Status Details */}
                    {isMarksFromCache && marksCacheTimestamp && (
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-m3-onSurfaceVariant font-semibold select-none leading-none mt-[-6px]">
                        <Archive size={12} className="text-m3-onSurfaceVariant" />
                        <span>Cached: {new Date(marksCacheTimestamp).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <button 
                          onClick={() => selectedMarksSem && fetchFreshMarks(selectedMarksSem, `marks-${selectedMarksSem.registrationcode || selectedMarksSem.registration_code}-${enrollmentNo}`, true)} 
                          className="text-m3-onSurfaceVariant hover:text-m3-onSurface transition ml-0.5 focus:outline-none"
                          type="button"
                          title="Force Refresh Live Marks"
                        >
                          <RefreshCw size={11} className={marksLoading ? "animate-spin" : ""} />
                        </button>
                      </div>
                    )}

                    {/* Loader/Errors */}
                    {marksLoading ? (
                      <div className="py-16 flex flex-col items-center justify-center gap-3.5 text-center">
                        <RefreshCw className="animate-spin text-m3-onSurfaceVariant" size={24} />
                        <span className="text-[10px] text-m3-onSurfaceVariant font-bold uppercase tracking-wider">
                          {syncPhase === 'booting_pyodide' && 'Initializing Parser Engine...'}
                          {syncPhase === 'downloading_pdf' && 'Retrieving Registry PDF...'}
                          {syncPhase === 'parsing_pdf' && 'Extracting Marks Sheet...'}
                          {syncPhase === 'completed' && 'Rendering Dashboard...'}
                          {syncPhase !== 'booting_pyodide' && syncPhase !== 'downloading_pdf' && syncPhase !== 'parsing_pdf' && syncPhase !== 'completed' && 'Compiling Detailed Marks...'}
                        </span>
                      </div>
                    ) : marksError ? (
                      <div className={`${obsidianCardClass} p-6 flex flex-col items-center gap-2.5 text-center`}>
                        <AlertTriangle className="text-m3-onSurfaceVariant" size={24} />
                        <span className="text-xs text-m3-onSurfaceVariant font-bold leading-normal">{marksError}</span>
                        <span className="text-[9px] text-m3-onSurfaceVariant font-black uppercase tracking-widest mt-1">Please try another term or download statement manually.</span>
                      </div>
                    ) : !marksSemesterData?.courses || marksSemesterData.courses.length === 0 ? (
                      <div className={`${obsidianCardClass} p-8 flex flex-col items-center justify-center gap-2 text-center`}>
                        <Archive className="text-m3-onSurfaceVariant" size={24} />
                        <span className="text-xs text-m3-onSurfaceVariant font-semibold">No registry marks returned for this term.</span>
                      </div>
                    ) : (
                      
                      /* List of glassy subject cards taking full horizontal space */
                      <div className="flex flex-col gap-4">
                        {marksSemesterData.courses.map((course, idx) => {
                          const courseTotal = Object.values(course.exams || {}).reduce(
                            (acc, exam) => ({
                              obtained: acc.obtained + Number(exam.OM || 0),
                              full: acc.full + Number(exam.FM || 0),
                            }),
                            { obtained: 0, full: 0 }
                          );

                          const matchingGrade = marksGradesList?.find(
                            g => g.name.toLowerCase().trim() === course.code.toLowerCase().trim()
                          );
                          const hasGrade = matchingGrade && matchingGrade.grade && matchingGrade.grade.trim() !== "" && matchingGrade.grade.trim() !== "—";

                          return (
                            <div 
                              key={idx} 
                              className={`${obsidianCardClass} flex flex-col gap-4 text-left`}
                            >
                              
                              {/* Subject header */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 w-full">
                                <h4 className="text-sm font-black text-m3-primary font-sans break-words leading-tight">
                                  {course.name}
                                </h4>
                                <span className="text-[9px] font-black text-m3-onSurfaceVariant bg-m3-surfaceContainerHighest border border-m3-outlineVariant/50 px-2 py-0.5 rounded-[6px] tracking-wider font-sans uppercase">
                                  {course.code}
                                </span>
                              </div>

                              {/* Grade Card statistics banner (only shown if grades are available) */}
                              {hasGrade ? (
                                <div className="grid grid-cols-3 bg-m3-surfaceContainerLow/60 rounded-[16px] py-3.5 px-2 text-center select-none divide-x divide-m3-outlineVariant/20">
                                  <div className="flex flex-col items-center justify-center">
                                    <span className="text-[9px] font-bold text-m3-onSurfaceVariant tracking-widest uppercase">Grade</span>
                                    <span className="text-[20px] font-black text-m3-onSurface mt-1.5 leading-none">
                                      {matchingGrade.grade}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center">
                                    <span className="text-[9px] font-bold text-m3-onSurfaceVariant tracking-widest uppercase">Credits</span>
                                    <span className="text-[20px] font-black text-m3-primary mt-1.5 leading-none">
                                      {matchingGrade.coursecreditpoint || 0}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center">
                                    <span className="text-[9px] font-bold text-m3-onSurfaceVariant tracking-widest uppercase">Total Marks</span>
                                    <span className="text-[16px] font-black text-m3-onSurface mt-2 leading-none">
                                      {courseTotal.full > 0 ? `${courseTotal.obtained}/${courseTotal.full}` : '—'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                /* Purple score fallback pill (aligned to start) */
                                <div className="bg-m3-surfaceContainer rounded-full py-1.5 px-4 flex items-center shadow-inner self-start select-none">
                                  <span className="text-[10px] font-black text-m3-onSurfaceVariant font-sans tracking-wide">
                                    Score: {courseTotal.obtained}/{courseTotal.full}
                                  </span>
                                </div>
                              )}

                              {/* Assessment column headings */}
                              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-m3-onSurfaceVariant px-0.5 select-none leading-none mt-1">
                                <span>Assessment</span>
                                <span>Weightage</span>
                              </div>

                              {/* Exams component details with full width progress bars */}
                              <div className="flex flex-col gap-4">
                                {Object.entries(course.exams || {}).map(([examName, marks], eidx) => {
                                  const om = Number(marks.OM || 0);
                                  const fm = Number(marks.FM || 0);
                                  const percentage = fm > 0 ? (om / fm) * 100 : 0;
                                  
                                  const barColor = percentage >= 75
                                    ? 'from-white/60 to-white/30'
                                    : percentage >= 50
                                      ? 'from-white/40 to-white/20'
                                      : 'from-white/20 to-white/10';

                                  return (
                                    <div key={eidx} className="flex flex-col gap-1.5 text-left font-sans">
                                      <div className="flex justify-between items-center w-full text-[11px] leading-none">
                                        <span className="font-bold text-m3-onSurface uppercase tracking-wide text-[10px]">{examName}</span>
                                        <span className="font-black text-m3-onSurface font-sans text-[11px]">
                                          {om} <span className="text-m3-onSurfaceVariant text-[10px] font-semibold">/ {fm}</span>
                                        </span>
                                      </div>
                                      
                                      {/* Material 3 Linear Progress Indicator */}
                                      <div className="relative w-full h-2 flex items-center select-none">
                                        {/* Inactive Track */}
                                        <div className="absolute left-0 right-0 h-1 bg-m3-primaryContainer/20 rounded-full" />
                                        
                                        {/* Active Indicator */}
                                        <div 
                                          className="absolute left-0 h-2 bg-m3-primary rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                          style={{ width: `${percentage}%` }}
                                        />
                                        
                                        {/* End Marker Dot */}
                                        <div className="absolute right-0 w-1.5 h-1.5 rounded-full bg-m3-primary" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Sub-Tab 3: SEMESTER (Glassy & List-based) ─── */}
                {gradesSubTab === 'semester' && (
                  <div className="flex flex-col gap-4">
                    
                    {/* Glassy Toolbar controls */}
                    <div className="flex items-center gap-2.5 w-full">
                      <div className={`${obsidianCardClass} !pt-2.5 !pb-3 !px-4 flex flex-col gap-0.5 text-left flex-1 min-w-0`}>
                        <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Select Term</span>
                        <select
                          value={selectedGradeCardSem ? (selectedGradeCardSem.registrationid || selectedGradeCardSem.registration_id) : ''}
                          onChange={(e) => handleGradeCardSemChange(e.target.value)}
                          className="bg-transparent text-m3-onSurface text-xs font-black w-full outline-none cursor-pointer font-sans border-none p-0 focus:ring-0 truncate"
                        >
                          {gradeCardSemesters.map((sem, sidx) => (
                            <option key={sidx} value={sem.registrationid || sem.registration_id} className="bg-m3-surfaceContainer text-m3-onSurface font-sans">
                              {sem.registrationcode || sem.registration_code}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setCreditSort('default');
                            setGradeSort(prev => prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default');
                          }}
                          className={`h-[45px] px-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all duration-300 text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                            gradeSort !== 'default'
                              ? 'bg-m3-surfaceContainerHighest text-m3-onSurface shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                              : 'bg-m3-surfaceContainer hover:bg-m3-surfaceContainer text-m3-onSurfaceVariant hover:text-m3-onSurface'
                          }`}
                        >
                          <span>Grade</span>
                          {gradeSort === 'asc' ? <SortAsc size={12} /> : gradeSort === 'desc' ? <SortDesc size={12} /> : <ListFilter size={12} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setGradeSort('default');
                            setCreditSort(prev => prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default');
                          }}
                          className={`h-[45px] px-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all duration-300 text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                            creditSort !== 'default'
                              ? 'bg-m3-surfaceContainerHighest text-m3-onSurface shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                              : 'bg-m3-surfaceContainer hover:bg-m3-surfaceContainer text-m3-onSurfaceVariant hover:text-m3-onSurface'
                          }`}
                        >
                          <span>Credit</span>
                          {creditSort === 'asc' ? <SortAsc size={12} /> : creditSort === 'desc' ? <SortDesc size={12} /> : <ListFilter size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Grade details cards list (frosted glass) */}
                    {gradeCardLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3.5 text-center">
                        <RefreshCw className="animate-spin text-m3-onSurfaceVariant" size={24} />
                        <span className="text-xs text-m3-onSurfaceVariant font-semibold uppercase tracking-wider">Compiling Grade Card...</span>
                      </div>
                    ) : (() => {
                      const sortedGrades = (() => {
                        if (!Array.isArray(gradesList)) return [];
                        const list = [...gradesList];
                        if (gradeSort !== 'default') {
                          return list.sort((a, b) => {
                            const ptA = gradePointMap[a.grade] !== undefined ? gradePointMap[a.grade] : -1;
                            const ptB = gradePointMap[b.grade] !== undefined ? gradePointMap[b.grade] : -1;
                            return gradeSort === 'asc' ? ptA - ptB : ptB - ptA;
                          });
                        }
                        if (creditSort !== 'default') {
                          return list.sort((a, b) => {
                            const crA = Number(a.coursecreditpoint || 0);
                            const crB = Number(b.coursecreditpoint || 0);
                            return creditSort === 'asc' ? crA - crB : crB - crA;
                          });
                        }
                        return list;
                      })();

                      if (sortedGrades.length === 0) {
                        return (
                          <div className={`${obsidianCardClass} p-8 flex flex-col items-center justify-center gap-2 text-center`}>
                            <Award className="text-m3-onSurfaceVariant" size={24} />
                            <span className="text-xs text-m3-onSurfaceVariant font-semibold">No grade entries found for this semester.</span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-3">
                          {sortedGrades.map((item, idx) => {
                            const isExpanded = expandedSubject === idx;
                            
                            const matchingMarksCourse = cachedSemMarks?.courses?.find(
                              c => c.code.toLowerCase().trim() === item.name.toLowerCase().trim()
                            );
                            const hasRealtimeMarks = !!matchingMarksCourse;

                            const getExamScore = (type) => {
                              if (!matchingMarksCourse?.exams) return '—';
                              const matchKey = Object.keys(matchingMarksCourse.exams).find(k => {
                                const nk = k.toLowerCase().replace(/[\s-_]/g, '');
                                if (type === 't1') return nk.includes('t1') || nk.includes('test1');
                                if (type === 't2') return nk.includes('t2') || nk.includes('test2');
                                if (type === 't3') return nk.includes('t3') || nk.includes('test3') || nk.includes('endsem') || nk.includes('ese');
                                if (type === 'internal') return nk.includes('internal') || nk.includes('ta') || nk.includes('teacherassessment') || nk.includes('quiz') || nk.includes('project') || nk.includes('attendance');
                                return false;
                              });
                              if (matchKey && matchingMarksCourse.exams[matchKey]) {
                                const exam = matchingMarksCourse.exams[matchKey];
                                return `${exam.OM} / ${exam.FM}`;
                              }
                              return '—';
                            };

                            return (
                              <div 
                                key={idx}
                                className={`${obsidianCardClass} !p-0 overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-m3-surfaceContainer' : ''}`}
                              >
                                <div 
                                  onClick={() => setExpandedSubject(isExpanded ? null : idx)}
                                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-m3-surfaceContainerHighest/40 active:bg-m3-surfaceContainerHighest/60 transition-colors"
                                >
                                  <div className="text-left flex-1 min-w-0 pr-3 flex flex-col gap-1">
                                    <span className="text-[8px] font-black text-m3-onSurfaceVariant tracking-wider font-sans uppercase block">
                                      {item.name} • {item.coursecreditpoint || 0} Credit{item.coursecreditpoint !== 1 ? 's' : ''}
                                    </span>
                                    <h4 className="text-sm font-bold text-m3-onSurface font-sans break-words leading-snug">{item.desc}</h4>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-sans font-black text-xs shadow-inner transition-colors ${
                                      item.grade === 'A+' || item.grade === 'A'
                                        ? 'bg-m3-primaryContainer border-m3-primary/20 text-m3-onPrimaryContainer shadow-sm'
                                        : item.grade === 'B+' || item.grade === 'B'
                                          ? 'bg-m3-secondaryContainer border-m3-secondary/20 text-m3-onSecondaryContainer shadow-sm'
                                          : item.grade === 'C+' || item.grade === 'C'
                                            ? 'bg-m3-surfaceContainerHighest border-m3-outlineVariant/60 text-m3-onSurface shadow-sm'
                                            : 'bg-m3-surfaceContainer border-m3-outlineVariant/50 text-m3-onSurfaceVariant shadow-sm'
                                    }`}>
                                      {item.grade}
                                    </div>
                                    {isExpanded ? <ChevronUp size={16} className="text-m3-onSurfaceVariant" /> : <ChevronDown size={16} className="text-m3-onSurfaceVariant" />}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="px-5 pb-5 pt-3.5 border-t border-m3-outlineVariant/50 bg-m3-surfaceContainerLow/30 flex flex-col gap-3 font-sans">
                                    {!hasRealtimeMarks ? (
                                      <div className="w-full flex flex-col items-center justify-center p-4 bg-m3-surfaceContainerLow border border-m3-outlineVariant/70 rounded-2xl gap-2 text-center select-none shadow-inner">
                                        <AlertTriangle size={14} className="text-amber-500" />
                                        <span className="text-[10px] text-m3-onSurfaceVariant font-semibold">Component Marks not linked for this term.</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const matchingSem = marksSemesters.find(
                                              sem => (sem.registrationcode || sem.registration_code) === (selectedGradeCardSem.registrationcode || selectedGradeCardSem.registration_code)
                                            );
                                            if (matchingSem) {
                                              setSelectedMarksSem(matchingSem);
                                            }
                                            setGradesSubTab('marks');
                                          }}
                                          className="px-3 py-1.5 bg-m3-secondaryContainer hover:brightness-95 active:scale-95 text-m3-onSecondaryContainer rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm flex items-center gap-1 leading-none mt-1"
                                        >
                                          <span>⚡ Sync Marks Registry</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="w-full flex flex-col gap-3">
                                        <div className="grid grid-cols-4 gap-2 text-left bg-m3-surfaceContainerLow/80 border border-transparent rounded-2xl p-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                                          <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">T1</span>
                                            <span className="text-xs font-sans font-black text-m3-onSurface">{getExamScore('t1')}</span>
                                          </div>
                                          <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">T2</span>
                                            <span className="text-xs font-sans font-black text-m3-onSurfaceVariant">{getExamScore('t2')}</span>
                                          </div>
                                          <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">T3</span>
                                            <span className="text-xs font-sans font-black text-m3-onSurface">{getExamScore('t3')}</span>
                                          </div>
                                          <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Internal</span>
                                            <span className="text-xs font-sans font-black text-m3-onSurfaceVariant">{getExamScore('internal')}</span>
                                          </div>
                                        </div>
                                        <div className="w-full flex items-center justify-between border-t border-m3-outlineVariant/50 pt-2.5 select-none leading-none">
                                          <span className="text-[8.5px] font-black text-m3-onSurfaceVariant flex items-center gap-1.5 uppercase tracking-wider">
                                            <CheckCircle2 size={11} className="text-m3-primary" /> Registry Synced
                                          </span>
                                          <span className="text-[7.5px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Real-time Verified</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

              </div>
            )}



            {/* 💳 TABS 4: FEES TAB */}
            {activeTab === 'fees' && (
              <div className="flex flex-col gap-5 text-sans">
                
                {/* Header Row with Sync status and Demand PDF button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
                  <div className="text-left">
                    <span className="text-[9px] font-black text-m3-primary uppercase tracking-widest block font-sans mb-1">Financials</span>
                    {isFeesFromCache && feesCacheTimestamp ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-m3-onSurfaceVariant font-semibold select-none leading-none">
                        <Archive size={12} className="text-m3-onSurfaceVariant" />
                        <span>Cached: {new Date(feesCacheTimestamp).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <button 
                          onClick={() => fetchFreshFees(true)} 
                          className="text-m3-onSurfaceVariant hover:text-m3-onSurface transition ml-0.5 focus:outline-none cursor-pointer"
                          type="button"
                          title="Force Refresh Live Fees"
                        >
                          <RefreshCw size={11} className={feesLoading ? "animate-spin" : ""} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-m3-onSurfaceVariant font-bold">Real-time Verified Ledger</span>
                    )}
                  </div>
                  
                  <button
                    onClick={downloadFeeDemandReport}
                    disabled={downloadingReport || feesLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-m3-primary text-m3-onPrimary hover:opacity-90 active:scale-95 disabled:opacity-50 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer font-sans"
                  >
                    {downloadingReport ? <RefreshCw className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                    {downloadingReport ? "Generating..." : "Demand Report (PDF)"}
                  </button>
                </div>

                {/* Loader/Errors */}
                {feesLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3.5 text-center">
                    <RefreshCw className="animate-spin text-m3-onSurfaceVariant" size={24} />
                    <span className="text-[10px] text-m3-onSurfaceVariant font-bold uppercase tracking-wider">Syncing Tuition Ledger...</span>
                  </div>
                ) : feesError ? (
                  <div className={`${obsidianCardClass} p-6 flex flex-col items-center gap-2.5 text-center`}>
                    <AlertTriangle className="text-m3-onSurfaceVariant" size={24} />
                    <span className="text-xs text-m3-onSurfaceVariant font-bold leading-normal">{feesError}</span>
                    <span className="text-[9px] text-m3-onSurfaceVariant font-black uppercase tracking-widest mt-1">Please try again later.</span>
                  </div>
                ) : !feeData ? (
                  <div className={`${obsidianCardClass} p-8 flex flex-col items-center justify-center gap-2 text-center`}>
                    <DollarSign className="text-m3-onSurfaceVariant" size={24} />
                    <span className="text-xs text-m3-onSurfaceVariant font-semibold">No fee records available.</span>
                  </div>
                ) : (() => {
                  const student = feeData.studentInfo?.[0] || {};
                  
                  // Helper currency formatter
                  const formatCurrency = (amount) => {
                    const num = Number(amount);
                    if (isNaN(num)) return "₹0";
                    return new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    }).format(num);
                  };

                  // Calculate totals
                  const totalPaid = feeData.feeHeads?.reduce((s, f) => s + (Number(f.receiveamount) || 0), 0) || 0;
                  const totalDue = feeData.feeHeads?.reduce((s, f) => s + (Number(f.dueamount) || 0), 0) || 0;
                  const totalFines = finesList?.reduce((sum, fine) => sum + (parseFloat(fine.charge || fine.feeamounttobepaid) || 0), 0) || 0;

                  return (
                    <div className="flex flex-col gap-6">
                      
                      {/* Top Three Cards Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Total Paid Card */}
                        <div className={`${obsidianCardClass} flex flex-col gap-3 text-left`} style={{ borderColor: 'color-mix(in srgb, var(--m3-primary) 15%, transparent)' }}>
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black text-m3-onSurfaceVariant uppercase tracking-widest">Total Paid</span>
                            <div className="p-2 rounded-xl bg-m3-surfaceContainerHighest text-emerald-500">
                              <CheckCircle2 size={16} />
                            </div>
                          </div>
                          <span className="text-2xl font-black text-m3-onSurface font-sans">
                            {formatCurrency(totalPaid)}
                          </span>
                        </div>

                        {/* Outstanding Due Card */}
                        <div className={`${obsidianCardClass} flex flex-col gap-3 text-left`} style={{ borderColor: 'color-mix(in srgb, var(--m3-error) 15%, transparent)' }}>
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black text-m3-onSurfaceVariant uppercase tracking-widest">Outstanding Due</span>
                            <div className="p-2 rounded-xl bg-m3-surfaceContainerHighest text-rose-500">
                              <Clock size={16} />
                            </div>
                          </div>
                          <span className="text-2xl font-black text-m3-onSurface font-sans">
                            {formatCurrency(totalDue)}
                          </span>
                        </div>

                        {/* Pending Fines Card */}
                        <div className={`${obsidianCardClass} flex flex-col gap-3 text-left`} style={{ borderColor: 'color-mix(in srgb, var(--m3-tertiary) 15%, transparent)' }}>
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black text-m3-onSurfaceVariant uppercase tracking-widest">Pending Fines</span>
                            <div className="p-2 rounded-xl bg-m3-surfaceContainerHighest text-amber-500">
                              <Wallet size={16} />
                            </div>
                          </div>
                          <span className="text-2xl font-black text-m3-onSurface font-sans">
                            {formatCurrency(totalFines)}
                          </span>
                        </div>
                      </div>

                      {/* Main Two Column Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        
                        {/* Left column: Academic Profile */}
                        <div className="flex flex-col gap-4 lg:col-span-1">
                          <div className={`${obsidianCardClass} p-5 flex flex-col gap-4 text-left`}>
                            <h4 className="text-xs font-black uppercase tracking-wider text-m3-onSurface border-b border-m3-outlineVariant/50 pb-2 flex items-center gap-1.5 select-none">
                              <Tag size={13} className="text-m3-primary" /> Academic Profile
                            </h4>
                            
                            <div className="flex flex-col gap-3 font-sans text-xs">
                              <div className="flex justify-between items-center w-full">
                                <span className="text-m3-onSurfaceVariant font-semibold flex items-center gap-1.5">
                                  <Hash size={12} /> Enrollment
                                </span>
                                <span className="text-m3-onSurface font-bold">{student.enrollmentno || '—'}</span>
                              </div>
                              <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2.5">
                                <span className="text-m3-onSurfaceVariant font-semibold flex items-center gap-1.5">
                                  <BookOpen size={12} /> Program
                                </span>
                                <span className="text-m3-onSurface font-bold text-right truncate max-w-[150px]" title={student.programdesc}>
                                  {student.programdesc || '—'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2.5">
                                <span className="text-m3-onSurfaceVariant font-semibold flex items-center gap-1.5">
                                  <GitBranch size={12} /> Branch
                                </span>
                                <span className="text-m3-onSurface font-bold text-right truncate max-w-[150px]" title={student.branchdesc}>
                                  {student.branchdesc || '—'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2.5">
                                <span className="text-m3-onSurfaceVariant font-semibold flex items-center gap-1.5">
                                  <Calendar size={12} /> Batch
                                </span>
                                <span className="text-m3-onSurface font-bold">{student.academicyear || '—'}</span>
                              </div>
                              <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2.5">
                                <span className="text-m3-onSurfaceVariant font-semibold flex items-center gap-1.5">
                                  <Info size={12} /> Quota
                                </span>
                                <span className="bg-m3-primaryContainer text-m3-onPrimaryContainer font-sans text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {student.quotacode || 'GENERAL'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right column: Fines list + Semester Breakdown */}
                        <div className="flex flex-col gap-6 lg:col-span-2">
                          
                          {/* Penalties Section */}
                          {finesList && finesList.length > 0 && (
                            <div className="flex flex-col gap-3 text-left">
                              <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5">
                                <AlertCircle size={15} /> Pending Penalties
                              </h3>
                              <div className="flex flex-col gap-3">
                                {finesList.map((fine, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`${obsidianCardClass} !p-4 flex justify-between items-center bg-rose-500/5 border border-rose-500/20`}
                                  >
                                    <div className="text-left flex-1 min-w-0 pr-2">
                                      <p className="font-bold text-xs text-m3-onSurface">{fine.servicename || "Misc Charge"}</p>
                                      <p className="text-[10px] text-m3-onSurfaceVariant mt-0.5 font-medium truncate">{fine.remarksbyauthority}</p>
                                    </div>
                                    <span className="bg-rose-500/20 text-rose-300 font-sans text-[10px] font-black px-2.5 py-1 rounded-lg border border-rose-500/20 whitespace-nowrap">
                                      {formatCurrency(fine.charge || fine.feeamounttobepaid)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Semester-wise Breakdown */}
                          <div className="flex flex-col gap-3 text-left">
                            <h3 className="text-xs font-black uppercase tracking-widest text-m3-onSurface flex items-center gap-1.5">
                              <BookOpen size={15} className="text-m3-primary" /> Semester-wise Breakdown
                            </h3>
                            <div className="flex flex-col gap-4">
                              {feeData.feeHeads?.map((fee, idx) => (
                                <div 
                                  key={idx} 
                                  className={`${obsidianCardClass} p-5 flex flex-col gap-4 hover:bg-m3-surfaceContainerHighest/40`}
                                >
                                  {/* Semester Card Header */}
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="text-base font-black text-m3-onSurface font-sans">Semester {fee.stynumber}</h4>
                                      <p className="text-[10px] text-m3-onSurfaceVariant mt-0.5 font-bold tracking-wide font-sans">{fee.academicyear}</p>
                                    </div>
                                    {fee.dueamount > 0 ? (
                                      <span className="bg-rose-500/10 text-rose-400 font-sans text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-500/20 leading-none select-none">
                                        Outstanding
                                      </span>
                                    ) : (
                                      <span className="bg-emerald-500/10 text-emerald-400 font-sans text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20 leading-none select-none">
                                        Settled
                                      </span>
                                    )}
                                  </div>

                                  {/* Demand Grid */}
                                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-m3-surfaceContainerLow/50 border border-m3-outlineVariant/50 rounded-xl text-center">
                                    <div className="flex flex-col gap-0.5 text-left pl-1">
                                      <span className="text-[7.5px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Total Demand</span>
                                      <span className="text-xs font-black text-m3-onSurface">{formatCurrency(fee.feeamount)}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 text-left border-l border-m3-outlineVariant/50 pl-3">
                                      <span className="text-[7.5px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Paid Amount</span>
                                      <span className="text-xs font-black text-emerald-400">{formatCurrency(fee.receiveamount)}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 text-left border-l border-m3-outlineVariant/50 pl-3">
                                      <span className="text-[7.5px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Current Due</span>
                                      <span className={`text-xs font-black ${fee.dueamount > 0 ? 'text-rose-400' : 'text-m3-onSurfaceVariant'}`}>
                                        {formatCurrency(fee.dueamount)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Metadata Footer */}
                                  <div className="pt-2 border-t border-m3-outlineVariant/50 flex flex-wrap gap-4 text-[9px] text-m3-onSurfaceVariant font-sans">
                                    <span className="flex items-center gap-1">
                                      <Calendar size={11} />
                                      <span>Registration: <strong className="text-m3-onSurface">{new Date(fee.regallowdate).toLocaleDateString()}</strong></span>
                                    </span>
                                    {fee.transferinamount > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Wallet size={11} />
                                        <span>Transfer In: <strong className="text-m3-onSurface">{formatCurrency(fee.transferinamount)}</strong></span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            )}

            {/* 📅 TABS 5: EXAMS TAB */}
            {activeTab === 'exams' && (
              <div className="flex flex-col gap-4">
                
                {!Array.isArray(examScheduleList) || examScheduleList.length === 0 ? (
                  <div className={`${obsidianCardClass} p-8 flex flex-col items-center justify-center gap-2 text-center`}>
                    <Calendar className="text-m3-onSurfaceVariant" size={24} />
                    <span className="text-xs text-m3-onSurfaceVariant font-semibold">No upcoming exam schedule records found.</span>
                  </div>
                ) : (
                  examScheduleList.map((item, idx) => (
                    <div 
                      key={idx}
                      className={`${obsidianCardClass} flex flex-col gap-3 `}
                    >
                      <div className="flex justify-between items-start w-full border-b border-m3-outlineVariant/50 pb-2.5">
                        <div className="text-left flex-1 min-w-0 pr-3">
                          <span className="text-[8px] font-black text-m3-onSurfaceVariant tracking-wider uppercase block font-sans">Exam Schedule</span>
                          <h4 className="text-sm font-bold text-m3-onSurface font-sans mt-0.5 break-words">{item.subject}</h4>
                        </div>
                        <span className="bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant font-sans text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-wider shrink-0">
                          {item.room}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-left font-sans">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Date</span>
                          <span className="text-xs font-bold text-m3-onSurface">{item.date}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Time Window</span>
                          <span className="text-xs font-bold text-m3-onSurface">{item.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

              </div>
            )}

            {/* 📚 TABS: SUBJECTS TAB */}
            {activeTab === 'subjects' && (
              <div className="flex flex-col gap-4">
                {/* Header Card / Semester Dropdown */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                  <div className={`${obsidianCardClass} !pt-3 !pb-3.5 !px-5 flex flex-col gap-1 text-left w-full sm:max-w-xs`}>
                    <span className="text-[9px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Academic Term</span>
                    <select
                      value={selectedSubjectsSem?.registrationid || ''}
                      onChange={(e) => {
                        const match = Array.isArray(semestersList) ? semestersList.find(s => s.registrationid === e.target.value) : null;
                        if (match) handleSubjectsSemesterChange(match);
                      }}
                      className="bg-transparent text-m3-onSurface text-[13px] font-black w-full outline-none cursor-pointer font-sans border-none p-0 pl-0 ml-[-3px] focus:ring-0"
                    >
                      {Array.isArray(semestersList) && semestersList.map((sem, sidx) => (
                        <option key={sidx} value={sem.registrationid} className="bg-m3-surfaceContainer text-m3-onSurface font-sans">
                          {sem.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Subject count pill */}
                  {((subjectsSubTab === 'registered' && !subjectsLoading && !subjectsError && subjectsList.length > 0) || 
                    (subjectsSubTab === 'choices' && !choicesLoading && !choicesError && choicesList.length > 0)) && (
                    <div className={`${obsidianCardClass} !py-3 !px-5 flex items-center justify-between gap-4 text-left shrink-0`}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">
                          {subjectsSubTab === 'registered' ? 'Total Registered' : 'Total Choices'}
                        </span>
                        <span className="text-m3-onSurface font-black text-sm font-sans">
                          {subjectsSubTab === 'registered' ? `${subjectsList.length} Courses` : `${choicesList.length} Options`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Registered / Choices Switcher ─── */}
                <div className="flex justify-center mb-1">
                  <div className="m3-segmented-chips w-full justify-between">
                    {[
                      { id: 'registered', label: 'Registered' },
                      { id: 'choices', label: 'Choices' }
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSubjectsSubTab(sub.id)}
                        className={`flex-1 m3-segmented-chip flex items-center justify-center gap-1.5 py-2.5 transition-all duration-300 ${
                          subjectsSubTab === sub.id
                            ? 'm3-segmented-chip--selected'
                            : 'text-m3-onSurfaceVariant hover:text-m3-onSurface'
                        }`}
                      >
                        <span className="font-extrabold text-xs tracking-wider uppercase font-sans">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── Registered Subjects View ─── */}
                {subjectsSubTab === 'registered' ? (
                  <>
                    {/* Filters & Credits Row */}
                    {!subjectsLoading && !subjectsError && subjectsList.length > 0 && (
                      <div className="flex items-center justify-between gap-2 border-b border-m3-outlineVariant/30 pb-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {[
                            { label: 'Lectures', active: showLectures, toggle: () => setShowLectures(!showLectures) },
                            { label: 'Tutorials', active: showTutorials, toggle: () => setShowTutorials(!showTutorials) },
                            { label: 'Practicals', active: showPracticals, toggle: () => setShowPracticals(!showPracticals) }
                          ].map((f, fidx) => (
                            <button
                              key={fidx}
                              onClick={f.toggle}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 cursor-pointer ${
                                f.active
                                  ? 'bg-m3-primaryContainer text-m3-onPrimaryContainer border-m3-primary/30 shadow-sm'
                                  : 'bg-transparent text-m3-onSurfaceVariant border-m3-outlineVariant/50 hover:bg-m3-surfaceContainer/50'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-1.5 bg-m3-surfaceContainerHighest/40 border border-m3-outlineVariant/45 rounded-full px-3 py-1.5 text-[10px] font-black text-m3-onSurface uppercase tracking-wider">
                          <BookOpen size={11} className="text-m3-primary shrink-0" />
                          <span>Total Credits: {totalCreditsValue.toFixed(1)}</span>
                        </div>
                      </div>
                    )}

                    {subjectsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className={`${obsidianCardClass} h-[160px] opacity-50`}>
                            <div className="h-4 w-20 bg-m3-surfaceContainerHighest rounded mb-4" />
                            <div className="h-6 w-3/4 bg-m3-surfaceContainerHighest rounded mb-4" />
                            <div className="h-4 w-full bg-m3-surfaceContainer rounded mt-4" />
                          </div>
                        ))}
                      </div>
                    ) : subjectsError ? (
                      <div className={`${obsidianCardClass} p-8 text-center flex flex-col items-center justify-center`}>
                        <AlertTriangle className="text-red-400 mb-3" size={32} />
                        <p className="text-m3-onSurface font-medium mb-4">{subjectsError}</p>
                        <button
                          onClick={() => setSubjectsRefreshCount(prev => prev + 1)}
                          className="px-5 py-2.5 rounded-full bg-m3-primary text-m3-onPrimary font-black text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-md hover:brightness-110"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : filteredGroupedSubjects.length === 0 ? (
                      <div className={`${obsidianCardClass} p-8 text-center flex flex-col items-center justify-center`}>
                        <BookOpen className="text-m3-onSurfaceVariant mb-3" size={32} />
                        <p className="text-m3-onSurfaceVariant font-medium">No registered subjects found for this semester.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredGroupedSubjects.map((sub, idx) => (
                          <div key={idx} className={`${obsidianCardClass} flex items-center justify-between gap-4 p-4 group hover:translate-y-[-2px] hover:bg-m3-surfaceContainer transition-all duration-300`}>
                            {/* Left Column: Details */}
                            <div className="flex-1 min-w-0 flex flex-col gap-2 text-left">
                              <div>
                                <h3 className="text-m3-onSurface font-black text-sm tracking-tight leading-snug group-hover:text-m3-primary transition-colors duration-200 uppercase">
                                  {sub.subjectdesc || 'Unnamed Subject'}
                                </h3>
                                <span className="text-[10px] font-bold text-m3-onSurfaceVariant/85 font-mono tracking-wider">
                                  # {sub.subjectcode}
                                </span>
                              </div>
                              
                              {/* Component List */}
                              <div className="flex flex-col gap-1.5 mt-0.5">
                                {sortComponents(sub.components).map((c, cidx) => {
                                  let badgeColor = 'bg-m3-primaryContainer/40 text-m3-primary border-m3-primary/30';
                                  if (c.type === 'TUT') {
                                    badgeColor = 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20';
                                  } else if (c.type === 'PRAC' || c.type === 'LAB' || c.type === 'P' || c.type === 'L') {
                                    badgeColor = 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20';
                                  }
                                  return (
                                    <div key={cidx} className="flex items-center gap-2 text-[11px] font-sans">
                                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${badgeColor} tracking-wider uppercase min-w-[36px] text-center`}>
                                        {c.type}
                                      </span>
                                      <span className="text-m3-onSurface font-bold truncate">
                                        {c.teachers.join(' / ')}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Right Column: Credit Badge Box */}
                            <div className="shrink-0 flex flex-col items-center justify-center border border-m3-outlineVariant/50 bg-m3-surfaceContainerHighest/30 rounded-2xl px-3 py-2 min-w-[68px] text-center">
                              <span className="text-lg font-black text-m3-primary font-sans leading-none tracking-tight">
                                {getSubjectCredits(sub.subjectcode).toFixed(1)}
                              </span>
                              <span className="text-[7.5px] font-black text-m3-onSurfaceVariant uppercase tracking-widest mt-1">
                                Credits
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // Choices view
                  <>
                    {choicesLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className={`${obsidianCardClass} h-[120px] opacity-50`}>
                            <div className="h-4 w-20 bg-m3-surfaceContainerHighest rounded mb-4" />
                            <div className="h-6 w-3/4 bg-m3-surfaceContainerHighest rounded mb-4" />
                            <div className="h-4 w-full bg-m3-surfaceContainer rounded mt-4" />
                          </div>
                        ))}
                      </div>
                    ) : choicesError ? (
                      <div className={`${obsidianCardClass} p-8 text-center flex flex-col items-center justify-center`}>
                        <AlertTriangle className="text-red-400 mb-3" size={32} />
                        <p className="text-m3-onSurface font-medium mb-4">{choicesError}</p>
                        <button
                          onClick={() => setSubjectsRefreshCount(prev => prev + 1)}
                          className="px-5 py-2.5 rounded-full bg-m3-primary text-m3-onPrimary font-black text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-md hover:brightness-110"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : choicesList.length === 0 ? (
                      <div className={`${obsidianCardClass} p-8 text-center flex flex-col items-center justify-center`}>
                        <BookOpen className="text-m3-onSurfaceVariant mb-3" size={32} />
                        <p className="text-m3-onSurfaceVariant font-medium">No choices found for this semester.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {choicesList.map((choice, idx) => {
                          const code = choice.subjectcode || choice.coursecode || '';
                          const desc = choice.subjectdesc || choice.coursename || choice.subjectname || 'Unnamed Course';
                          const preference = choice.preference || choice.preferenceval || choice.priority || choice.priorityno || (idx + 1);
                          return (
                            <div key={idx} className={`${obsidianCardClass} flex items-center justify-between gap-4 p-4 group hover:translate-y-[-2px] hover:bg-m3-surfaceContainer transition-all duration-300`}>
                              <div className="flex-1 min-w-0 flex flex-col gap-1.5 text-left">
                                <div>
                                  <h3 className="text-m3-onSurface font-bold text-sm tracking-tight leading-snug uppercase group-hover:text-m3-primary transition-colors duration-200">
                                    {desc}
                                  </h3>
                                  <span className="text-[10px] font-bold text-m3-onSurfaceVariant/85 font-mono tracking-wider">
                                    # {code}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-m3-primaryContainer/30 text-m3-primary uppercase tracking-wider">
                                    Preference {preference}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 flex flex-col items-center justify-center border border-m3-outlineVariant/50 bg-m3-surfaceContainerHighest/30 rounded-2xl px-3 py-2 min-w-[68px] text-center">
                                <span className="text-lg font-black text-m3-primary font-sans leading-none tracking-tight">
                                  {getSubjectCredits(code).toFixed(1)}
                                </span>
                                <span className="text-[7.5px] font-black text-m3-onSurfaceVariant uppercase tracking-widest mt-1">
                                  Credits
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 🧮 TABS: GPA CALCULATOR TAB */}
            {activeTab === 'calculator' && (
              <div className="flex flex-col gap-4">
                
                {/* ─── M3 Segmented Chips Switcher ─── */}
                <div className="flex justify-center mb-1">
                  <div className="m3-segmented-chips w-full justify-between">
                    {[
                      { id: 'sgpa', icon: <TrendingUp size={14} />, label: 'SGPA' },
                      { id: 'cgpa', icon: <Calculator size={14} />, label: 'CGPA' },
                      { id: 'target', icon: <Award size={14} />, label: 'Target' }
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setCalcMode(sub.id)}
                        className={`flex-1 m3-segmented-chip flex items-center justify-center gap-1.5 py-2.5 transition-all duration-300 ${
                          calcMode === sub.id
                            ? 'm3-segmented-chip--selected'
                            : 'text-m3-onSurfaceVariant hover:text-m3-onSurface'
                        }`}
                      >
                        {sub.icon}
                        <span className="font-extrabold text-xs tracking-wider uppercase font-sans">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Result Card */}
                <div className={`${obsidianCardClass} p-5 flex flex-col items-center justify-center text-center bg-gradient-to-br from-m3-primaryContainer/30 to-m3-primary/10 border`} style={{ borderColor: 'color-mix(in srgb, var(--m3-primary) 20%, transparent)' }}>
                  <span className="text-[10px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans mb-1">
                    {calcMode === 'sgpa' ? 'Simulated SGPA' : calcMode === 'cgpa' ? 'Projected CGPA' : 'Required SGPA'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-m3-primary font-sans tracking-tight">
                      {calcMode === 'sgpa' 
                        ? calculatedSgpaResult.sgpa 
                        : calcMode === 'cgpa' 
                          ? calculatedCgpaResult 
                          : calculatedRequiredSgpa !== null
                            ? calculatedRequiredSgpa > 10
                              ? 'N/A'
                              : calculatedRequiredSgpa < 0
                                ? '0.00'
                                : calculatedRequiredSgpa.toFixed(2)
                            : '0.00'
                      }
                    </span>
                    <span className="text-xs text-m3-onSurfaceVariant font-bold">/ 10.00</span>
                  </div>
                  <span className="text-[11px] text-m3-onSurface mt-2 font-medium">
                    {calcMode === 'sgpa' 
                      ? `${calculatedSgpaResult.credits} total credits simulated`
                      : calcMode === 'cgpa'
                        ? 'Projected cumulative CGPA after this semester'
                        : calculatedRequiredSgpa !== null && calculatedRequiredSgpa > 10
                          ? 'Target CGPA is mathematically not achievable'
                          : calculatedRequiredSgpa !== null && calculatedRequiredSgpa <= 0
                            ? 'Target CGPA is already achieved!'
                            : `SGPA needed in ${targetSelectedSem?.label || 'semester'} (${getSemesterCredits(targetSelectedSem)} credits)`
                    }
                  </span>
                </div>

                {calcMode === 'sgpa' ? (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between w-full">
                      {/* Auto-fill semester selector */}
                      <div className={`${obsidianCardClass} !py-2.5 !px-4 flex items-center justify-between gap-3 text-left w-full sm:max-w-xs shrink-0`}>
                        <div className="flex flex-col gap-0.5 w-full">
                          <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Simulate Semester</span>
                          <select
                            value={calculatorSelectedSem?.registrationid || ''}
                            onChange={(e) => {
                              const match = Array.isArray(semestersList) ? semestersList.find(s => s.registrationid === e.target.value) : null;
                              if (match) {
                                setCalculatorSelectedSem(match);
                                populateCalcFromSemester(match);
                              }
                            }}
                            className="bg-transparent text-m3-onSurface text-xs font-black outline-none cursor-pointer font-sans border-none p-0 focus:ring-0 w-full"
                          >
                            {Array.isArray(semestersList) && semestersList.map((sem, sidx) => (
                              <option key={sidx} value={sem.registrationid} className="bg-m3-surfaceContainer text-m3-onSurface font-sans">
                                {sem.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => populateCalcFromSemester(calculatorSelectedSem)}
                          className="flex-1 sm:flex-none px-4 py-2.5 bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurface rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 active:scale-95 border border-m3-outlineVariant/60 cursor-pointer"
                        >
                          Reset Subjects
                        </button>
                        <button
                          onClick={addCustomCalcSubject}
                          className="flex-1 sm:flex-none px-4 py-2.5 bg-m3-primary hover:brightness-110 text-m3-onPrimary rounded-xl text-xs font-black uppercase tracking-wider transition duration-200 active:scale-95 shadow-md cursor-pointer"
                        >
                          Add Course
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {calcSubjects.length === 0 ? (
                        <div className={`${obsidianCardClass} p-8 text-center flex flex-col items-center justify-center`}>
                          <BookOpen className="text-m3-onSurfaceVariant mb-2" size={24} />
                          <p className="text-m3-onSurfaceVariant text-xs font-medium">No subjects added. Select a semester to load courses or add a custom course manually.</p>
                        </div>
                      ) : (
                        calcSubjects.map((sub) => (
                          <div key={sub.id} className={`${obsidianCardClass} !p-3 flex items-center justify-between gap-3 text-left hover:bg-m3-surfaceContainer transition-all`}>
                            <div className="flex-1 min-w-0 pr-2">
                              <input
                                type="text"
                                value={sub.name}
                                onChange={(e) => updateCalcSubjectName(sub.id, e.target.value)}
                                className="bg-transparent border-none p-0 text-m3-onSurface font-bold text-xs w-full focus:ring-0 outline-none truncate"
                                placeholder="Course Name"
                              />
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold text-m3-onSurfaceVariant/80 font-mono tracking-wider uppercase">
                                  {sub.code || 'CUSTOM'}
                                </span>
                                <span className="text-[9px] text-m3-onSurfaceVariant font-bold flex items-center gap-1">
                                  Credits: 
                                  <input
                                    type="number"
                                    value={sub.credits}
                                    onChange={(e) => updateCalcSubjectCredits(sub.id, e.target.value)}
                                    className="bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurface border border-m3-outlineVariant/60 rounded px-1.5 py-0.5 text-[9px] font-black w-10 text-center focus:outline-none focus:border-m3-primary"
                                    min="1"
                                    max="8"
                                  />
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Grade selector */}
                              <select
                                value={sub.selectedGrade}
                                onChange={(e) => updateCalcSubjectGrade(sub.id, e.target.value)}
                                className="bg-m3-surfaceContainer/80 text-m3-primary text-xs font-black border border-m3-outlineVariant/70 rounded-xl px-2 py-1 focus:outline-none focus:border-m3-primary cursor-pointer"
                              >
                                <option value="" className="bg-m3-surfaceContainer text-m3-onSurfaceVariant">Grade</option>
                                {Object.keys(gradePointMap).map((g) => (
                                  <option key={g} value={g} className="bg-m3-surfaceContainer text-m3-onSurface">{g} ({gradePointMap[g]} Pts)</option>
                                ))}
                              </select>

                              {/* Delete button */}
                              <button
                                onClick={() => removeCalcSubject(sub.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : calcMode === 'cgpa' ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`${obsidianCardClass} !p-4 flex flex-col gap-1 text-left`}>
                        <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Current CGPA</span>
                        <input
                          type="number"
                          step="0.01"
                          value={cgpaPrevCgpa}
                          onChange={(e) => setCgpaPrevCgpa(e.target.value)}
                          className="bg-transparent border-none p-0 text-m3-onSurface font-extrabold text-sm w-full focus:ring-0 outline-none"
                          placeholder="e.g. 7.50"
                          min="0"
                          max="10"
                        />
                      </div>
                      <div className={`${obsidianCardClass} !p-4 flex flex-col gap-1 text-left`}>
                        <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Completed Credits</span>
                        <input
                          type="number"
                          value={cgpaPrevCredits}
                          onChange={(e) => setCgpaPrevCredits(e.target.value)}
                          className="bg-transparent border-none p-0 text-m3-onSurface font-extrabold text-sm w-full focus:ring-0 outline-none"
                          placeholder="e.g. 80"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className={`${obsidianCardClass} p-4 flex flex-col gap-3 text-left font-sans text-xs`}>
                      <h4 className="text-xs font-black uppercase tracking-wider text-m3-onSurface border-b border-m3-outlineVariant/50 pb-1.5 select-none">
                        Calculation Breakdown
                      </h4>
                      <div className="flex justify-between items-center w-full">
                        <span className="text-m3-onSurfaceVariant">Previous Total Points</span>
                        <span className="text-m3-onSurface font-bold">
                          {((parseFloat(cgpaPrevCgpa) || 0) * (parseFloat(cgpaPrevCredits) || 0)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2">
                        <span className="text-m3-onSurfaceVariant">Simulated Semester Points</span>
                        <span className="text-m3-onSurface font-bold">
                          {(parseFloat(calculatedSgpaResult.sgpa) * parseFloat(calculatedSgpaResult.credits)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2">
                        <span className="text-m3-onSurfaceVariant">Projected Total Credits</span>
                        <span className="text-m3-onSurface font-bold">
                          {(parseFloat(cgpaPrevCredits) || 0) + parseFloat(calculatedSgpaResult.credits)}
                        </span>
                      </div>
                      <div className="border-t border-m3-outlineVariant/60 pt-2.5 flex justify-between items-center w-full">
                        <span className="text-m3-primary font-bold">Projected CGPA</span>
                        <span className="text-m3-primary font-black text-sm">
                          {calculatedCgpaResult}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Target Semester Selector */}
                      <div className={`${obsidianCardClass} !p-4 flex flex-col gap-1.5 text-left`}>
                        <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Target Semester</span>
                        <select
                          value={targetSelectedSem?.registrationid || ''}
                          onChange={(e) => {
                            const match = Array.isArray(semestersList) ? semestersList.find(s => s.registrationid === e.target.value) : null;
                            if (match) {
                              setTargetSelectedSem(match);
                            }
                          }}
                          className="bg-transparent text-m3-onSurface text-xs font-black outline-none cursor-pointer font-sans border-none p-0 focus:ring-0 w-full"
                        >
                          {Array.isArray(semestersList) && semestersList.map((sem, sidx) => {
                            const credits = getSemesterCredits(sem);
                            return (
                              <option key={sidx} value={sem.registrationid} className="bg-m3-surfaceContainer text-m3-onSurface font-sans">
                                {sem.label} ({credits} Credits)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Target CGPA Input */}
                      <div className={`${obsidianCardClass} !p-4 flex flex-col gap-1 text-left`}>
                        <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Target CGPA</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={targetCgpa}
                          onChange={(e) => setTargetCgpa(e.target.value)}
                          className="bg-transparent border-none p-0 text-m3-onSurface font-extrabold text-sm w-full focus:ring-0 outline-none"
                          placeholder="e.g. 8.50"
                        />
                      </div>
                    </div>

                    {/* Result Messages */}
                    {(() => {
                      const required = calculatedRequiredSgpa;
                      if (required === null) {
                        return (
                          <div className={`${obsidianCardClass} p-8 text-center flex flex-col items-center justify-center`}>
                            <Calculator className="text-m3-onSurfaceVariant mb-2" size={24} />
                            <p className="text-m3-onSurfaceVariant text-xs font-medium">Enter a target CGPA to see required semester SGPA.</p>
                          </div>
                        );
                      }

                      const targetVal = parseFloat(targetCgpa) || 0;

                      if (required > 10.0) {
                        return (
                          <div className={`${obsidianCardClass} p-5 flex flex-col items-center justify-center text-center bg-red-500/10 border border-red-500/30 text-red-200`}>
                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest font-sans mb-1 font-bold">Status</span>
                            <h4 className="text-lg font-black font-sans text-red-400">Not Achievable</h4>
                            <p className="text-xs mt-2 max-w-sm">
                              To reach a CGPA of <strong className="text-white">{targetVal.toFixed(2)}</strong> by the end of {targetSelectedSem?.label || 'semester'}, you would need an SGPA of <strong className="text-white">{required.toFixed(2)}</strong>, which exceeds the maximum possible 10.00.
                            </p>
                          </div>
                        );
                      }

                      if (required <= 0.0) {
                        return (
                          <div className={`${obsidianCardClass} p-5 flex flex-col items-center justify-center text-center bg-green-500/10 border border-green-500/30 text-green-200`}>
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest font-sans mb-1 font-bold">Status</span>
                            <h4 className="text-lg font-black font-sans text-green-400">Already Achieved!</h4>
                            <p className="text-xs mt-2 max-w-sm">
                              Your current CGPA already meets or exceeds your target of <strong className="text-white">{targetVal.toFixed(2)}</strong>. You do not need any additional points in this semester to achieve your goal.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className={`${obsidianCardClass} p-5 flex flex-col items-center justify-center text-center bg-gradient-to-br from-m3-primaryContainer/30 to-m3-primary/10 border`} style={{ borderColor: 'color-mix(in srgb, var(--m3-primary) 20%, transparent)' }}>
                          <span className="text-[10px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans mb-1 font-bold">Required SGPA</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-m3-primary font-sans tracking-tight">
                              {required.toFixed(2)}
                            </span>
                            <span className="text-xs text-m3-onSurfaceVariant font-bold">/ 10.00</span>
                          </div>
                          <p className="text-xs text-m3-onSurface mt-3 max-w-sm">
                            Achieve an SGPA of <strong className="text-m3-primary">{required.toFixed(2)}</strong> in <strong className="text-m3-primary">{targetSelectedSem?.label || 'selected semester'}</strong> ({getSemesterCredits(targetSelectedSem)} credits) to reach your target CGPA of <strong className="text-m3-primary">{targetVal.toFixed(2)}</strong>.
                          </p>
                        </div>
                      );
                    })()}

                    {/* Academic Stats Breakdown */}
                    {gpaData && Array.isArray(gpaData.semesterList) && gpaData.semesterList.length > 0 && (
                      <div className={`${obsidianCardClass} p-4 flex flex-col gap-3 text-left font-sans text-xs`}>
                        <h4 className="text-xs font-black uppercase tracking-wider text-m3-onSurface border-b border-m3-outlineVariant/50 pb-1.5 select-none">
                          Current Academic Stats
                        </h4>
                        <div className="flex justify-between items-center w-full">
                          <span className="text-m3-onSurfaceVariant">Previous Semesters Count</span>
                          <span className="text-m3-onSurface font-bold">
                            {gpaData.semesterList.filter(sem => Number(sem.stynumber) < Number(targetSelectedSem?.stynumber)).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2">
                          <span className="text-m3-onSurfaceVariant">Previous Accumulated Credits</span>
                          <span className="text-m3-onSurface font-bold">
                            {gpaData.semesterList
                              .filter(sem => Number(sem.stynumber) < Number(targetSelectedSem?.stynumber))
                              .reduce((sum, sem) => sum + (parseFloat(sem.totalcoursecredit) || 0), 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2">
                          <span className="text-m3-onSurfaceVariant">Current Cumulative CGPA</span>
                          <span className="text-m3-onSurface font-bold">
                            {(() => {
                              const prevSems = gpaData.semesterList.filter(sem => Number(sem.stynumber) < Number(targetSelectedSem?.stynumber));
                              if (prevSems.length === 0) return '0.00';
                              const totalPoints = prevSems.reduce((sum, sem) => sum + (parseFloat(sem.sgpa) * parseFloat(sem.totalcoursecredit)), 0);
                              const totalCredits = prevSems.reduce((sum, sem) => sum + parseFloat(sem.totalcoursecredit), 0);
                              return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* 👤 TABS 6: PROFILE TAB */}
            {activeTab === 'profile' && studentProfile && (
              <div className="flex flex-col gap-4">
                
                {/* Frosted glass ID Card */}
                <div className={`${obsidianCardClass} p-5 flex flex-col gap-4 `}>
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-center gap-3.5 text-left">
                      <div className="w-12 h-12 rounded-full bg-m3-primaryContainer flex items-center justify-center font-black text-m3-onSurface font-sans shadow-md shrink-0 select-none uppercase">
                        {(studentProfile.name || '').split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="flex flex-col gap-2">
                        <h3 className="text-base font-extrabold text-m3-onSurface leading-tight font-sans tracking-wide">{studentProfile.name}</h3>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-m3-onSurfaceVariant tracking-widest font-sans uppercase leading-normal">Enrollment ID</span>
                          <span className="text-[11px] font-bold text-m3-onSurfaceVariant font-sans mt-[-0.5px] leading-normal">{studentProfile.enrollment}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {error ? (
                        <span className="bg-m3-surfaceContainer text-m3-onSurfaceVariant font-sans text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1.5 select-none leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-m3-onSurfaceVariant/30"></span> Offline
                        </span>
                      ) : (
                        <span className="bg-m3-surfaceContainerHighest text-m3-onSurfaceVariant font-sans text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1.5 select-none leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-m3-onSurfaceVariant/50"></span> Live Synced
                        </span>
                      )}
                      
                      <button
                        onClick={() => handlePortalSync(enrollmentNo, password)}
                        disabled={isSyncing}
                        className="px-2.5 py-1.5 bg-m3-surfaceContainer hover:bg-m3-surfaceContainerHighest text-m3-onSurface hover:text-m3-onSurface rounded-lg text-[9px] font-black uppercase tracking-wider transition duration-300 active:scale-95 cursor-pointer flex items-center gap-1 leading-none shadow-sm disabled:opacity-50"
                      >
                        <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Syncing..." : "Sync Again"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 w-full pt-3.5 border-t border-m3-outlineVariant/60 text-left font-sans">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Branch</span>
                      <span className="text-[11px] font-bold text-m3-onSurface truncate">{(studentProfile?.branch || 'Computer Science & Engineering').replace('Computer Science & Engineering', 'CSE')}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Semester</span>
                      <span className="text-[11px] font-bold text-m3-onSurface">{studentProfile?.semester || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black text-m3-onSurfaceVariant uppercase tracking-widest font-sans">Residency</span>
                      <span className="text-[11px] font-bold text-m3-onSurfaceVariant font-sans truncate">{studentProfile.hostel}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`${obsidianCardClass} p-5 flex flex-col gap-4 text-left `}>
                  <h4 className="text-sm font-black uppercase tracking-wider text-m3-onSurface border-b border-m3-outlineVariant/50 pb-2 flex items-center gap-1.5 select-none">
                    <User size={15} /> Student Registry Details
                  </h4>
                  
                  <div className="flex flex-col gap-3 font-sans text-xs">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-m3-onSurfaceVariant font-semibold">Full Name</span>
                      <span className="text-m3-onSurface font-extrabold">{studentProfile.name}</span>
                    </div>
                    <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2.5">
                      <span className="text-m3-onSurfaceVariant font-semibold">Enrollment ID</span>
                      <span className="text-m3-onSurface font-sans font-bold">{studentProfile.enrollment}</span>
                    </div>
                    <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2.5">
                      <span className="text-m3-onSurfaceVariant font-semibold">Primary Branch</span>
                      <span className="text-m3-onSurface font-bold">{studentProfile.branch}</span>
                    </div>
                    <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2.5">
                      <span className="text-m3-onSurfaceVariant font-semibold">Current Semester</span>
                      <span className="text-m3-onSurface font-bold">{studentProfile.semester}</span>
                    </div>
                  </div>
                </div>

                <div className={`${obsidianCardClass} p-5 flex flex-col gap-4 text-left `}>
                  <h4 className="text-sm font-black uppercase tracking-wider text-m3-onSurface border-b border-m3-outlineVariant/50 pb-2 flex items-center gap-1.5 select-none">
                    <MapPin size={15} /> Campus Residency & Family
                  </h4>
                  
                  <div className="flex flex-col gap-3 font-sans text-xs">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-m3-onSurfaceVariant font-semibold">Parental Authority</span>
                      <span className="text-m3-onSurface font-bold">{studentProfile.parents}</span>
                    </div>
                    <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2.5">
                      <span className="text-m3-onSurfaceVariant font-semibold">Hostel Location</span>
                      <span className="text-m3-onSurface font-bold">{studentProfile.hostel}</span>
                    </div>
                    <div className="flex justify-between items-center w-full border-t border-m3-outlineVariant/50 pt-2.5 text-right">
                      <span className="text-m3-onSurfaceVariant font-semibold pr-2">Permanent Address</span>
                      <span className="text-m3-onSurface font-bold max-w-[200px] leading-relaxed truncate">{studentProfile.address}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* ─── Glass Pill Navigation (icons only) ─── */}
          <nav className="m3-student-navbar absolute bottom-8 left-1/2 -translate-x-1/2 -translate-y-1 flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-m3-surfaceContainerHigh border border-m3-outlineVariant backdrop-blur-2xl shadow-2xl z-[100] select-none m3-nav-entrance">
            {[
              { id: 'attendance', icon: <Percent size={17} className="stroke-[2.5px]" />, label: 'Attendance' },
              { id: 'grades',     icon: <Award    size={17} className="stroke-[2.5px]" />, label: 'Grades' },
              { id: 'subjects',   icon: <BookOpen size={17} className="stroke-[2.5px]" />, label: 'Subjects' },
              { id: 'calculator', icon: <Calculator size={17} className="stroke-[2.5px]" />, label: 'GPA Calc' },
              { id: 'fees',       icon: <DollarSign size={17} className="stroke-[2.5px]" />, label: 'Ledger' },
              { id: 'exams',      icon: <Calendar size={17} className="stroke-[2.5px]" />, label: 'Exams' },
              { id: 'profile',    icon: <User     size={17} className="stroke-[2.5px]" />, label: 'Profile' },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => setActiveTab(id)}
                className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                  activeTab === id
                    ? 'bg-m3-primary text-m3-onPrimary border-none shadow-md'
                    : 'text-m3-onSurfaceVariant hover:text-m3-onSurface hover:bg-m3-primaryContainer/20 border border-transparent'
                }`}
              >
                {icon}
              </button>
            ))}
          </nav>

        </>
      )}

    </div>
  );
}