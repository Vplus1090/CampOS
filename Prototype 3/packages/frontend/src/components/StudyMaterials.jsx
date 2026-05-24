import React from 'react';

export default function StudyMaterials() {
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
    <div className="lock-card public-details-card study-materials-dashboard">
      <div className="card-header-public">
        <h3>📚 open study materials</h3>
      </div>

      <div className="public-materials-list">
        {studyMaterials.map((section) => (
          <div key={section.dept} className="material-dept-section">
            <h4 className="dept-title">{section.dept}</h4>
            <div className="courses-list-public">
              {section.courses.map((course) => (
                <div key={course.code} className="course-material-row">
                  <div className="row-info">
                    <span className="code font-mono">{course.code}</span>
                    <span className="name">{course.name}</span>
                    <span className="meta font-mono">({course.type} - {course.size})</span>
                  </div>
                  <button
                    className="btn-download"
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
