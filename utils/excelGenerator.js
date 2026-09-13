const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// Helper: Column index (0-based) to Excel letter: 0 -> A, 1 -> B, ..., 41 -> AP
function getColLetter(c) {
  let letter = '';
  let temp = c;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function escapeXml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateRuetExcel(reportData) {
  const templatePath = path.join(__dirname, '..', 'Excel.xlsx');
  const templateBuf = fs.readFileSync(templatePath);

  const zip = await JSZip.loadAsync(templateBuf);
  const origXml = await zip.file('xl/worksheets/sheet1.xml').async('text');

  const { course, sessions, students, teacherName } = reportData;
  const numSessions = sessions ? sessions.length : 0;
  const totalDateCols = 39;
  const totalCols = 42;

  // Build map of students by roll and studentId
  const studentMap = {};
  if (students && students.length) {
    students.forEach(st => {
      if (st.studentId) studentMap[String(st.studentId)] = st;
      if (st.rollNo) studentMap[String(st.rollNo)] = st;
    });
  }

  // Session dates for columns B to AN (up to 39 date columns)
  const dateHeaders = [];
  for (let i = 0; i < totalDateCols; i++) {
    if (i < numSessions) {
      dateHeaders.push(sessions[i].formattedDate || sessions[i].date || '');
    } else {
      dateHeaders.push('');
    }
  }

  // Course metadata
  const cName = course ? (course.name || '') : '';
  const cCode = course ? (course.code || '') : '';

  // Extract template prefix (everything before <sheetData>) and suffix (everything from </sheetData>)
  const sheetDataStart = origXml.indexOf('<sheetData>') + '<sheetData>'.length;
  const sheetDataEnd = origXml.indexOf('</sheetData>');

  const prefix = origXml.substring(0, sheetDataStart);
  const suffix = origXml.substring(sheetDataEnd);

  // Rebuild sheetData with dynamic live data
  let sd = '';

  // Row 1: Heaven's light is our guide
  sd += '<row r="1" ht="16" customHeight="1">';
  sd += '<c r="B1" t="inlineStr" s="3"><is><t>Heaven&apos;s light is our guide</t></is></c>';
  for (let c = 2; c < totalCols; c++) {
    sd += `<c r="${getColLetter(c)}1" t="inlineStr" s="3"><is><t></t></is></c>`;
  }
  sd += '</row>';

  // Row 2: Rajshahi University of Engineering & Technology
  sd += '<row r="2" ht="20" customHeight="1">';
  sd += '<c r="B2" t="inlineStr" s="4"><is><t>Rajshahi University of Engineering &amp; Technology</t></is></c>';
  for (let c = 2; c < totalCols; c++) {
    sd += `<c r="${getColLetter(c)}2" t="inlineStr" s="4"><is><t></t></is></c>`;
  }
  sd += '</row>';

  // Row 3: Dept. of Electrical & Computer Engineering
  sd += '<row r="3" ht="18" customHeight="1">';
  sd += '<c r="B3" t="inlineStr" s="3"><is><t>Dept. of Electrical &amp; Computer Engineering</t></is></c>';
  for (let c = 2; c < totalCols; c++) {
    sd += `<c r="${getColLetter(c)}3" t="inlineStr" s="3"><is><t></t></is></c>`;
  }
  sd += '</row>';

  // Row 4: Attendance Report
  sd += '<row r="4" ht="18" customHeight="1">';
  sd += '<c r="B4" t="inlineStr" s="4"><is><t>Attendance Report</t></is></c>';
  for (let c = 2; c < totalCols; c++) {
    sd += `<c r="${getColLetter(c)}4" t="inlineStr" s="4"><is><t></t></is></c>`;
  }
  sd += '</row>';

  // Row 5: Dept Name: ECE | Course Code: [Name] | Course Title: [Code]
  sd += '<row r="5" ht="12" customHeight="1">';
  sd += '<c r="A5" t="inlineStr" s="5"><is><t>Dept Name: ECE</t></is></c>';
  for (let c = 1; c <= 13; c++) {
    sd += `<c r="${getColLetter(c)}5" t="inlineStr" s="5"><is><t></t></is></c>`;
  }
  sd += `<c r="O5" t="inlineStr" s="5"><is><t>Course Code: ${escapeXml(cName)}</t></is></c>`;
  for (let c = 15; c <= 27; c++) {
    sd += `<c r="${getColLetter(c)}5" t="inlineStr" s="5"><is><t></t></is></c>`;
  }
  sd += `<c r="AC5" t="inlineStr" s="5"><is><t>Course Title: ${escapeXml(cCode)}</t></is></c>`;
  for (let c = 29; c < totalCols; c++) {
    sd += `<c r="${getColLetter(c)}5" t="inlineStr" s="5"><is><t></t></is></c>`;
  }
  sd += '</row>';

  // Row 6: Spacer
  sd += '<row r="6" ht="4" customHeight="1"/>';

  // Row 7: Headers with rotated 90deg text
  sd += '<row r="7" ht="45" customHeight="1">';
  sd += '<c r="A7" t="inlineStr" s="1"><is><t>Roll No.</t></is></c>';
  for (let i = 0; i < totalDateCols; i++) {
    sd += `<c r="${getColLetter(i + 1)}7" t="inlineStr" s="1"><is><t>${escapeXml(dateHeaders[i])}</t></is></c>`;
  }
  sd += '<c r="AO7" t="inlineStr" s="1"><is><t>Atnd (%)</t></is></c>';
  sd += '<c r="AP7" t="inlineStr" s="1"><is><t>Mark Obtained</t></is></c>';
  sd += '</row>';

  // Rows 8 to 67: 60 students (2410001 to 2410060)
  for (let roll = 1; roll <= 60; roll++) {
    const r = 7 + roll; // 8 to 67
    const sId = '2410' + String(roll).padStart(3, '0');
    const st = studentMap[sId] || studentMap[String(roll)];

    sd += `<row r="${r}" ht="13" customHeight="1">`;
    sd += `<c r="A${r}" s="2"><v>${sId}</v></c>`;

    for (let sIdx = 0; sIdx < totalDateCols; sIdx++) {
      const colLetter = getColLetter(sIdx + 1);
      let mark = '';
      if (sIdx < numSessions) {
        const sess = sessions[sIdx];
        if (st && st.sessionMarks && st.sessionMarks[sess.id]) {
          mark = st.sessionMarks[sess.id];
        } else if (st) {
          mark = 'A';
        }
      }
      sd += `<c r="${colLetter}${r}" t="inlineStr" s="2"><is><t>${escapeXml(mark)}</t></is></c>`;
    }

    const attndPct = (st && st.attndPct !== undefined) ? Number(st.attndPct).toFixed(1) : '0.0';
    const markObt = (st && st.markObtained !== undefined) ? String(st.markObtained) : '0';

    sd += `<c r="AO${r}" s="2"><v>${attndPct}</v></c>`;
    sd += `<c r="AP${r}" s="2"><v>${markObt}</v></c>`;
    sd += '</row>';
  }

  // Row 76: Teacher Name
  const tName = teacherName || 'Not Found';
  sd += '<row r="76" ht="12" customHeight="1">';
  sd += `<c r="A76" t="inlineStr" s="3"><is><t>${escapeXml(tName)}</t></is></c>`;
  for (let c = 1; c < totalCols; c++) {
    sd += `<c r="${getColLetter(c)}76" t="inlineStr" s="3"><is><t></t></is></c>`;
  }
  sd += '</row>';

  // Row 77: Underlines
  sd += '<row r="77" ht="12" customHeight="1">';
  sd += '<c r="A77" t="inlineStr" s="3"><is><t>____________________________</t></is></c>';
  for (let c = 1; c <= 13; c++) {
    sd += `<c r="${getColLetter(c)}77" t="inlineStr" s="3"><is><t></t></is></c>`;
  }
  sd += '<c r="O77" t="inlineStr" s="3"><is><t>____________________________</t></is></c>';
  for (let c = 15; c <= 27; c++) {
    sd += `<c r="${getColLetter(c)}77" t="inlineStr" s="3"><is><t></t></is></c>`;
  }
  sd += '<c r="AC77" t="inlineStr" s="3"><is><t>____________________________</t></is></c>';
  for (let c = 29; c < totalCols; c++) {
    sd += `<c r="${getColLetter(c)}77" t="inlineStr" s="3"><is><t></t></is></c>`;
  }
  sd += '</row>';

  // Row 78: Labels
  sd += '<row r="78" ht="12" customHeight="1">';
  sd += '<c r="A78" t="inlineStr" s="3"><is><t>Name of the Teacher</t></is></c>';
  for (let c = 1; c <= 13; c++) {
    sd += `<c r="${getColLetter(c)}78" t="inlineStr" s="3"><is><t></t></is></c>`;
  }
  sd += '<c r="O78" t="inlineStr" s="3"><is><t>Signature</t></is></c>';
  for (let c = 15; c <= 27; c++) {
    sd += `<c r="${getColLetter(c)}78" t="inlineStr" s="3"><is><t></t></is></c>`;
  }
  sd += '<c r="AC78" t="inlineStr" s="3"><is><t>Date</t></is></c>';
  for (let c = 29; c < totalCols; c++) {
    sd += `<c r="${getColLetter(c)}78" t="inlineStr" s="3"><is><t></t></is></c>`;
  }
  sd += '</row>';

  const finalXml = prefix + sd + suffix;
  zip.file('xl/worksheets/sheet1.xml', finalXml);

  return await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

module.exports = {
  generateRuetExcel
};
