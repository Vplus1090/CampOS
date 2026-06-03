import SkillGig from '../models/SkillGig.js';
import Notice from '../models/Notice.js';

/**
 * Seed initial mock data for SkillGigs and Notices.
 * Only runs if the respective collections are empty to avoid duplicate seeding.
 */
const seedSkillGigs = async () => {
  try {
    // 1. Seed Skill Gigs (Students: Kunal, Ripunjay, Krish, Student, Abhinav, Ashmit, Sanya)
    const gigCount = await SkillGig.countDocuments();
    if (gigCount === 0) {
      console.log('🌱 Skill Swap board is empty. Seeding student profiles...');

      const mockGigs = [
        {
          StudentName: 'Kunal',
          SkillOffered: 'React & Frontend UI Design',
          SkillWanted: 'Node.js Backend & API Development',
          Status: 'Active',
          ContactInfo: 'kunal.cse@campos.edu | Discord: kunal_ui',
        },
        {
          StudentName: 'Ripunjay',
          SkillOffered: 'Data Structures & Python Algorithms',
          SkillWanted: 'Docker & Kubernetes DevOps basics',
          Status: 'Active',
          ContactInfo: 'ripunjay.ds@campos.edu | Telegram: @ripu_ds',
        },
        {
          StudentName: 'Krish',
          SkillOffered: 'Figma Prototyping & UX Wireframing',
          SkillWanted: 'HTML/CSS responsive slicing',
          Status: 'Active',
          ContactInfo: 'krish.design@campos.edu | Mobile: +91 98765 43210',
        },
        {
          StudentName: 'Student',
          SkillOffered: 'Machine Learning & PyTorch',
          SkillWanted: 'React Native & iOS App Development',
          Status: 'Active',
          ContactInfo: 'student.ml@campos.edu | Slack: #student-ml',
        },
        {
          StudentName: 'Abhinav',
          SkillOffered: 'MongoDB & Database Optimization',
          SkillWanted: 'GraphQL & Apollo Client integration',
          Status: 'Active',
          ContactInfo: 'abhinav.db@campos.edu | GitHub: abhinav-db',
        },
        {
          StudentName: 'Ashmit',
          SkillOffered: 'Cybersecurity & Penetration Testing',
          SkillWanted: 'GoLang Microservices architecture',
          Status: 'Active',
          ContactInfo: 'ashmit.sec@campos.edu | PGP Key: 0xASHMIT7',
        },
        {
          StudentName: 'Sanya',
          SkillOffered: 'Public Speaking & Presentation Pitching',
          SkillWanted: 'SQL Databases & Postgres querying',
          Status: 'Active',
          ContactInfo: 'sanya.comm@campos.edu | Phone: +91 87654 32109',
        },
      ];

      await SkillGig.insertMany(mockGigs);
      console.log('✅ Successfully seeded 7 student Skill Share gigs.');
    } else {
      console.log('🤝 Skill Swap database contains data. Skipping seed.');
    }

    // 2. Seed Notices (CampOS Announcements Board)
    const noticeCount = await Notice.countDocuments();
    if (noticeCount === 0) {
      console.log('📢 Notices board is empty. Seeding initial announcements...');

      const mockNotices = [
        {
          Title: 'CampOS Hackathon 2026: Registrations Open!',
          Content: 'Join the annual 36-hour code sprint! Team up with peers, build revolutionary campus tools, and win cash prizes up to $5,000. Registration closes next Friday at midnight. Venue: Innovation Labs.',
          PriorityLevel: 'High',
          PostedBy: 'Dean of Student Affairs',
          Date: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        },
        {
          Title: 'Scheduled Power Outage in Hostel Blocks C & D',
          Content: 'Please note there will be a scheduled electricity maintenance shutdown this Sunday from 9:00 AM to 1:00 PM. Backup generators will supply common study rooms, but students are advised to charge their laptops and devices beforehand.',
          PriorityLevel: 'High',
          PostedBy: 'Hostel Warden Team',
          Date: new Date(Date.now() - 3600000 * 5), // 5 hours ago
        },
        {
          Title: 'Mid-Term Examinations Timetable Released',
          Content: 'The complete schedule for the upcoming Spring 2026 Mid-Semester Exams has been posted on the main portal. Please review your respective branch tables and verify dates to avoid conflicts.',
          PriorityLevel: 'Medium',
          PostedBy: 'Academic Registrar Office',
          Date: new Date(Date.now() - 3600000 * 24), // 1 day ago
        },
        {
          Title: 'Campus Placement Prep Session: Resume Writing',
          Content: 'A hands-on workshop led by industry experts will be held in Seminar Hall 1 this Thursday at 4 PM. We will review layout styles, standard power keywords, and action-verb formatting for top tech recruiters.',
          PriorityLevel: 'Medium',
          PostedBy: 'Training & Placement Cell',
          Date: new Date(Date.now() - 3600000 * 36), // 1.5 days ago
        },
        {
          Title: 'Photography Club Meetup & Outdoor Photo-walk',
          Content: 'Bring your DSLR or smartphone! We are meeting by the campus lake this Saturday at 6:30 AM for a golden-hour shoot. All beginners and pros are welcome. Refreshments will be served after the walk.',
          PriorityLevel: 'Low',
          PostedBy: 'Shutterbugs Club President',
          Date: new Date(Date.now() - 3600000 * 48), // 2 days ago
        },
      ];

      await Notice.insertMany(mockNotices);
      console.log('✅ Successfully seeded initial Campus Notices.');
    } else {
      console.log('📢 Notices database contains data. Skipping seed.');
    }
  } catch (err) {
    console.error('❌ Failed to seed Skill Share mock data:', err.message);
  }
};

export default seedSkillGigs;
