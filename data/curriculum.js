// Official RUET Department of Electrical & Computer Engineering (ECE) Course Curriculum
// Transcribed from official 4-Year Semester-wise Detail Course Distribution

const RUET_ECE_ALL_SEMESTERS = {
  1: {
    year: '1st Year',
    term: '1st Year Odd Semester (1-1)',
    courses: [
      { code: 'ECE-1101', title: 'Circuits and Systems-I', credits: 3.0, type: 'Theory' },
      { code: 'ECE-1102', title: 'Circuits and Systems-I Sessional', credits: 1.5, type: 'Sessional' },
      { code: 'ECE-1103', title: 'Computer Programming', credits: 3.0, type: 'Theory' },
      { code: 'ECE-1104', title: 'Computer Programming Sessional', credits: 1.5, type: 'Sessional' },
      { code: 'Math-1117', title: 'Calculus and Ordinary Differential Equation', credits: 3.0, type: 'Theory' },
      { code: 'Phy-1117', title: 'Optics and Modern Physics', credits: 3.0, type: 'Theory' },
      { code: 'Phy-1118', title: 'Optics and Modern Physics Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'Hum-1117', title: 'Technical English', credits: 3.0, type: 'Theory' },
      { code: 'Hum-1118', title: 'Technical English Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-1100', title: 'Introduction to Computer System', credits: 0.75, type: 'Sessional' }
    ]
  },
  2: {
    year: '1st Year',
    term: '1st Year Even Semester (1-2)',
    courses: [
      { code: 'ECE-1201', title: 'Circuits and Systems-II', credits: 3.0, type: 'Theory' },
      { code: 'ECE-1202', title: 'Circuits and Systems-II Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-1203', title: 'Object Oriented Programming', credits: 3.0, type: 'Theory' },
      { code: 'ECE-1204', title: 'Object Oriented Programming Sessional', credits: 1.5, type: 'Sessional' },
      { code: 'ECE-1205', title: 'Analog Electronic Circuits-I', credits: 3.0, type: 'Theory' },
      { code: 'ECE-1206', title: 'Analog Electronic Circuits-I Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'Math-1217', title: 'Transform Methods, Statistics & Complex Variable', credits: 3.0, type: 'Theory' },
      { code: 'Hum-1217', title: 'Government, Sociology, Environment Protection & History of Independence', credits: 3.0, type: 'Theory' },
      { code: 'ECE-1200', title: 'Engineering Ethics', credits: 0.75, type: 'Sessional' }
    ]
  },
  3: {
    year: '2nd Year',
    term: '2nd Year Odd Semester (2-1)',
    courses: [
      { code: 'ECE-2103', title: 'Data Structure & Algorithms', credits: 3.0, type: 'Theory' },
      { code: 'ECE-2104', title: 'Data Structure & Algorithms Sessional', credits: 1.5, type: 'Sessional' },
      { code: 'ECE-2105', title: 'Analog Electronic Circuits-II', credits: 3.0, type: 'Theory' },
      { code: 'ECE-2106', title: 'Analog Electronic Circuits-II Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-2111', title: 'Digital Techniques', credits: 3.0, type: 'Theory' },
      { code: 'ECE-2112', title: 'Digital Techniques Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'Math-2117', title: 'Vector Analysis & Linear Algebra', credits: 3.0, type: 'Theory' },
      { code: 'Chem-2117', title: 'Inorganic and Physical Chemistry', credits: 3.0, type: 'Theory' },
      { code: 'Chem-2118', title: 'Inorganic and Physical Chemistry Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-2100', title: 'Software Development Project- I', credits: 0.75, type: 'Sessional' }
    ]
  },
  4: {
    year: '2nd Year',
    term: '2nd Year Even Semester (2-2)',
    courses: [
      { code: 'ECE-2207', title: 'Electrical Machine-I', credits: 3.0, type: 'Theory' },
      { code: 'ECE-2208', title: 'Electrical Machine-I Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-2213', title: 'Numerical Methods & Discrete Mathematics', credits: 3.0, type: 'Theory' },
      { code: 'ECE-2214', title: 'Numerical Methods & Discrete Mathematics Sessional', credits: 1.5, type: 'Sessional' },
      { code: 'ECE-2215', title: 'Data Base Systems', credits: 3.0, type: 'Theory' },
      { code: 'ECE-2216', title: 'Data Base Systems Sessional', credits: 1.5, type: 'Sessional' },
      { code: 'Math-2217', title: 'Co-ordinate Geometry & Partial Differential Equations', credits: 3.0, type: 'Theory' },
      { code: 'Hum-2217', title: 'Legal Issues, Industrial & Operational Management', credits: 3.0, type: 'Theory' },
      { code: 'ECE-2200', title: 'Electronic Shop Practice', credits: 1.5, type: 'Sessional' }
    ]
  },
  5: {
    year: '3rd Year',
    term: '3rd Year Odd Semester (3-1)',
    courses: [
      { code: 'ECE-3107', title: 'Electrical Machine-II', credits: 3.0, type: 'Theory' },
      { code: 'ECE-3108', title: 'Electrical Machine-II Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-3111', title: 'Microprocessor, Assembly Language & Interfacing', credits: 3.0, type: 'Theory' },
      { code: 'ECE-3112', title: 'Microprocessor, Assembly Language & Interfacing Sessional', credits: 1.5, type: 'Sessional' },
      { code: 'ECE-3117', title: 'Software Engineering & Information System Design', credits: 3.0, type: 'Theory' },
      { code: 'ECE-3118', title: 'Software Engineering & Information System Design Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-3119', title: 'Computer Architecture and Design', credits: 3.0, type: 'Theory' },
      { code: 'ECE-3121', title: 'Electromagnetic Fields & Waves', credits: 3.0, type: 'Theory' },
      { code: 'CE-3100', title: 'Civil Engineering Drawing', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-3100', title: 'Software Development Project -II', credits: 0.75, type: 'Sessional' }
    ]
  },
  6: {
    year: '3rd Year',
    term: '3rd Year Even Semester (3-2)',
    courses: [
      { code: 'ECE-3205', title: 'Industrial Electronics', credits: 3.0, type: 'Theory' },
      { code: 'ECE-3206', title: 'Industrial Electronics Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-3207', title: 'Communication Engineering', credits: 3.0, type: 'Theory' },
      { code: 'ECE-3208', title: 'Communication Engineering Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-3221', title: 'Operating System', credits: 3.0, type: 'Theory' },
      { code: 'ECE-3222', title: 'Operating System Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ME-3219', title: 'Basic Mechanical Engineering', credits: 3.0, type: 'Theory' },
      { code: 'ME-3220', title: 'Basic Mechanical Engineering Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'Hum-3217', title: 'Economics & Accountancy', credits: 3.0, type: 'Theory' },
      { code: 'ECE-3200', title: 'Electrical Services Design', credits: 1.5, type: 'Sessional' }
    ]
  },
  7: {
    year: '4th Year',
    term: '4th Year Odd Semester (4-1)',
    courses: [
      { code: 'ECE-4109', title: 'Power System', credits: 3.0, type: 'Theory' },
      { code: 'MTE-4117', title: 'Control Systems & Robotics', credits: 3.0, type: 'Theory' },
      { code: 'MTE-4118', title: 'Control Systems & Robotics Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-4123', title: 'Digital Signal Processing', credits: 3.0, type: 'Theory' },
      { code: 'ECE-4124', title: 'Digital Signal Processing Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-4000', title: 'Thesis/ Project-I', credits: 1.0, type: 'Project' },
      { code: 'ECE-4100', title: 'Industrial Training', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-4122', title: 'Seminar', credits: 0.75, type: 'Sessional' },
      // Optional I (Theory & Sessional)
      { code: 'ECE-4111', title: 'Digital Communication (Optional I)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4112', title: 'Digital Communication Sessional (Optional I)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4115', title: 'Antennas & Propagations (Optional I)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4116', title: 'Antennas & Propagations Sessional (Optional I)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4117', title: 'Radar & Satellite Communication (Optional I)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4118', title: 'Radar & Satellite Communication Sessional (Optional I)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4125', title: 'Radio & TV Engineering (Optional I)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4126', title: 'Radio & TV Engineering Sessional (Optional I)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4141', title: 'Fiber optic Communication (Optional I)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4142', title: 'Fiber optic Communication Sessional (Optional I)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4143', title: 'Bio-medical Engineering (Optional I)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4144', title: 'Bio-medical Engineering Sessional (Optional I)', credits: 0.75, type: 'Optional Sessional' },
      // Optional II (Theory & Sessional)
      { code: 'ECE-4127', title: 'VLSI Design (Optional II)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4128', title: 'VLSI Design Sessional (Optional II)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4129', title: 'Network Planning (Optional II)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4130', title: 'Network Planning Sessional (Optional II)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4131', title: 'Wireless Networks (Optional II)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4132', title: 'Wireless Networks Sessional (Optional II)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4133', title: 'Artificial Intelligence (Optional II)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4134', title: 'Artificial Intelligence Sessional (Optional II)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4135', title: 'Human Computer Interaction (Optional II)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4136', title: 'Human Computer Interaction Sessional (Optional II)', credits: 0.75, type: 'Optional Sessional' }
    ]
  },
  8: {
    year: '4th Year',
    term: '4th Year Even Semester (4-2)',
    courses: [
      { code: 'ECE-4209', title: 'Power Station, Switchgear & Protection', credits: 3.0, type: 'Theory' },
      { code: 'ECE-4211', title: 'Computer Networks', credits: 3.0, type: 'Theory' },
      { code: 'ECE-4212', title: 'Computer Networks Sessional', credits: 0.75, type: 'Sessional' },
      { code: 'ECE-4223', title: 'Digital Image Processing', credits: 3.0, type: 'Theory' },
      { code: 'ECE-4224', title: 'Digital Image Processing Sessional', credits: 1.5, type: 'Sessional' },
      { code: 'ECE-4000', title: 'Thesis/ Project -II', credits: 3.0, type: 'Project' },
      // Optional III (Theory & Sessional)
      { code: 'ECE-4221', title: 'Unix Programming (Optional III)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4222', title: 'Unix Programming Sessional (Optional III)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4227', title: 'Network Security (Optional III)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4228', title: 'Network Security Sessional (Optional III)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4237', title: 'Parallel & Distributed Processing (Optional III)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4238', title: 'Parallel & Distributed Processing Sessional (Optional III)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4239', title: 'Computer Graphics & Animations (Optional III)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4240', title: 'Computer Graphics & Animations Sessional (Optional III)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4241', title: 'Computer Vision (Optional III)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4242', title: 'Computer Vision Sessional (Optional III)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4243', title: 'Data Mining (Optional III)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4244', title: 'Data Mining Sessional (Optional III)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4245', title: 'Machine Learning (Optional III)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4246', title: 'Machine Learning Sessional (Optional III)', credits: 0.75, type: 'Optional Sessional' },
      // Optional IV (Theory & Sessional)
      { code: 'ECE-4247', title: 'Computer Aided Instrumentation (Optional IV)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4248', title: 'Computer Aided Instrumentation Sessional (Optional IV)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4249', title: 'Computer Aided Power System Design (Optional IV)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4250', title: 'Computer Aided Power System Design Sessional (Optional IV)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4251', title: 'Renewable Energy (Optional IV)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4252', title: 'Renewable Energy Sessional (Optional IV)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4253', title: 'Microwave Engineering (Optional IV)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4254', title: 'Microwave Engineering Sessional (Optional IV)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4255', title: 'Power System Operation & Control (Optional IV)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4256', title: 'Power System Operation & Control Sessional (Optional IV)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4257', title: 'High Voltage Engineering (Optional IV)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4258', title: 'High Voltage Engineering Sessional (Optional IV)', credits: 0.75, type: 'Optional Sessional' },
      { code: 'ECE-4259', title: 'System Simulation & Modeling (Optional IV)', credits: 3.0, type: 'Optional' },
      { code: 'ECE-4260', title: 'System Simulation & Modeling Sessional (Optional IV)', credits: 0.75, type: 'Optional Sessional' }
    ]
  }
};

// Map each admission series to its primary semesters and default semester
const SERIES_SEMESTER_MAP = {
  '25': { defaultSem: 1, primarySemesters: [1, 2] },
  '24': { defaultSem: 3, primarySemesters: [3, 4] },
  '23': { defaultSem: 5, primarySemesters: [5, 6] },
  '22': { defaultSem: 7, primarySemesters: [7, 8] },
  '21': { defaultSem: 8, primarySemesters: [7, 8] }
};

function getRecommendations(series, semester) {
  const sStr = String(series);
  const sConf = SERIES_SEMESTER_MAP[sStr] || { defaultSem: 1, primarySemesters: [1, 2] };

  // All 8 semesters available
  const availableSemesters = Object.keys(RUET_ECE_ALL_SEMESTERS).map(sNum => {
    const sem = Number(sNum);
    return {
      semester: sem,
      label: RUET_ECE_ALL_SEMESTERS[sem].term,
      isPrimary: sConf.primarySemesters.includes(sem)
    };
  });

  const selectedSem = Number(semester) || sConf.defaultSem;
  const semData = RUET_ECE_ALL_SEMESTERS[selectedSem] || RUET_ECE_ALL_SEMESTERS[1];

  return {
    series: sStr,
    selectedSemester: selectedSem,
    semesterLabel: semData.term,
    availableSemesters,
    courses: semData.courses
  };
}

module.exports = {
  RUET_ECE_ALL_SEMESTERS,
  SERIES_SEMESTER_MAP,
  getRecommendations
};
