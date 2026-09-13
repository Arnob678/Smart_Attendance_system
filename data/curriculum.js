// RUET Department of Electrical & Computer Engineering (ECE) Course Curriculum
const RUET_ECE_CURRICULUM = {
  '25': {
    name: '1st Year (25 Series)',
    defaultSemester: 1,
    semesters: {
      1: {
        label: '1st Year 1st Sem (1-1)',
        courses: [
          { code: 'ECE-1101', title: 'Electrical Circuit Analysis I', credits: 3.0, type: 'Theory' },
          { code: 'ECE-1102', title: 'Electrical Circuit Analysis I Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'CSE-1103', title: 'Computer Programming', credits: 3.0, type: 'Theory' },
          { code: 'CSE-1104', title: 'Computer Programming Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'MATH-1105', title: 'Mathematics I (Calculus & Analytical Geometry)', credits: 3.0, type: 'Theory' },
          { code: 'PHY-1107', title: 'Physics (Electromagnetism & Waves)', credits: 3.0, type: 'Theory' },
          { code: 'PHY-1108', title: 'Physics Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'HUM-1109', title: 'Technical English', credits: 3.0, type: 'Theory' }
        ]
      },
      2: {
        label: '1st Year 2nd Sem (1-2)',
        courses: [
          { code: 'ECE-1201', title: 'Electrical Circuit Analysis II', credits: 3.0, type: 'Theory' },
          { code: 'ECE-1202', title: 'Electrical Circuit Analysis II Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-1203', title: 'Electronic Devices and Circuits', credits: 3.0, type: 'Theory' },
          { code: 'ECE-1204', title: 'Electronic Devices and Circuits Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'MATH-1205', title: 'Mathematics II (Differential Equations & Vectors)', credits: 3.0, type: 'Theory' },
          { code: 'CHEM-1207', title: 'Chemistry', credits: 3.0, type: 'Theory' },
          { code: 'CHEM-1208', title: 'Chemistry Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'HUM-1209', title: 'Sociology and Government', credits: 2.0, type: 'Theory' }
        ]
      }
    }
  },
  '24': {
    name: '2nd Year (24 Series)',
    defaultSemester: 3,
    semesters: {
      3: {
        label: '2nd Year 1st Sem (2-1)',
        courses: [
          { code: 'ECE-2101', title: 'Signals and Systems', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2102', title: 'Signals and Systems Simulation Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-2103', title: 'Data structure and Algorithm', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2104', title: 'Data structure and Algorithm Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-2105', title: 'Analog Electronics and Sessional-2', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2106', title: 'Analog Electronics Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'MATH-2107', title: 'Mathematics III (Matrices & Complex Variables)', credits: 3.0, type: 'Theory' },
          { code: 'HUM-2109', title: 'Financial & Managerial Accounting', credits: 2.0, type: 'Theory' }
        ]
      },
      4: {
        label: '2nd Year 2nd Sem (2-2)',
        courses: [
          { code: 'ECE-2201', title: 'Digital Electronics and Logic Design', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2202', title: 'Digital Electronics Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-2203', title: 'Electromagnetic Fields and Waves', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2205', title: 'Numerical Methods and Programming', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2206', title: 'Numerical Methods Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-2207', title: 'Electrical Machines and Power Systems', credits: 3.0, type: 'Theory' },
          { code: 'ECE-2208', title: 'Electrical Machines Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'MATH-2209', title: 'Mathematics IV (Fourier Series & Statistics)', credits: 3.0, type: 'Theory' }
        ]
      }
    }
  },
  '23': {
    name: '3rd Year (23 Series)',
    defaultSemester: 5,
    semesters: {
      5: {
        label: '3rd Year 1st Sem (3-1)',
        courses: [
          { code: 'ECE-3101', title: 'Analog and Digital Communication', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3102', title: 'Communication Engineering Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3103', title: 'Microprocessors and Microcontrollers', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3104', title: 'Microprocessors and Microcontrollers Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3105', title: 'Control Systems Engineering', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3106', title: 'Control Systems Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3107', title: 'Database Management Systems', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3108', title: 'Database Management Systems Sessional', credits: 1.5, type: 'Sessional' }
        ]
      },
      6: {
        label: '3rd Year 2nd Sem (3-2)',
        courses: [
          { code: 'ECE-3201', title: 'Digital Signal Processing', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3202', title: 'Digital Signal Processing Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3203', title: 'Computer Networks', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3204', title: 'Computer Networks Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3205', title: 'VLSI Circuit Design', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3206', title: 'VLSI Design Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-3207', title: 'Antennas and Radio Wave Propagation', credits: 3.0, type: 'Theory' },
          { code: 'ECE-3208', title: 'Electronic Project Design Sessional', credits: 1.5, type: 'Sessional' }
        ]
      }
    }
  },
  '22': {
    name: '4th Year (22 Series)',
    defaultSemester: 7,
    semesters: {
      7: {
        label: '4th Year 1st Sem (4-1)',
        courses: [
          { code: 'ECE-4101', title: 'Wireless and Cellular Communication', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4102', title: 'Wireless Communication Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-4103', title: 'Optical Fiber Communication', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4104', title: 'Optical Fiber Communication Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-4105', title: 'Microwave and Radar Engineering', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4100', title: 'Project and Thesis I', credits: 3.0, type: 'Project' },
          { code: 'HUM-4107', title: 'Engineering Economics and Industrial Management', credits: 3.0, type: 'Theory' }
        ]
      },
      8: {
        label: '4th Year 2nd Sem (4-2)',
        courses: [
          { code: 'ECE-4201', title: 'Artificial Intelligence and Machine Learning', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4202', title: 'AI and Machine Learning Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-4203', title: 'Satellite Communication and Remote Sensing', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4205', title: 'Biomedical Engineering & Embedded Systems', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4200', title: 'Project and Thesis II', credits: 3.0, type: 'Project' }
        ]
      }
    }
  },
  '21': {
    name: '4th Year (21 Series)',
    defaultSemester: 8,
    semesters: {
      8: {
        label: '4th Year 2nd Sem (4-2)',
        courses: [
          { code: 'ECE-4201', title: 'Artificial Intelligence and Machine Learning', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4202', title: 'AI and Machine Learning Sessional', credits: 1.5, type: 'Sessional' },
          { code: 'ECE-4203', title: 'Satellite Communication and Remote Sensing', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4205', title: 'Biomedical Engineering & Embedded Systems', credits: 3.0, type: 'Theory' },
          { code: 'ECE-4200', title: 'Project and Thesis II', credits: 3.0, type: 'Project' }
        ]
      }
    }
  }
};

function getRecommendations(series, semester) {
  const sData = RUET_ECE_CURRICULUM[String(series)];
  if (!sData) return { semesters: [], courses: [] };

  const availableSemesters = Object.keys(sData.semesters).map(semNum => ({
    semester: Number(semNum),
    label: sData.semesters[semNum].label
  }));

  const targetSem = Number(semester) || sData.defaultSemester || availableSemesters[0]?.semester;
  const semObj = sData.semesters[targetSem] || sData.semesters[availableSemesters[0]?.semester];

  return {
    series: String(series),
    selectedSemester: targetSem,
    availableSemesters,
    courses: semObj ? semObj.courses : []
  };
}

module.exports = {
  RUET_ECE_CURRICULUM,
  getRecommendations
};
