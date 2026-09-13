const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable');
autoTable.applyPlugin(jsPDF);

function generateRuetPdf(reportData) {
  const { course, sessions, students, teacherName } = reportData;
  const numSessions = sessions ? sessions.length : 0;
  const totalDateCols = 39;

  // A4 portrait: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Base64 Logo (use optimized logo)
  let logoBase64 = null;
  try {
    let logoPath = path.join(__dirname, '..', 'public', 'ruet_logo_sm.png');
    if (!fs.existsSync(logoPath)) {
      logoPath = path.join(__dirname, '..', 'public', 'ruet_logo.png');
    }
    if (fs.existsSync(logoPath)) {
      const logoBuf = fs.readFileSync(logoPath);
      logoBase64 = 'data:image/png;base64,' + logoBuf.toString('base64');
    }
  } catch (e) {
    console.error('Error loading logo for PDF:', e.message);
  }

  // Draw Page Header
  function drawPageHeader() {
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 8, 4, 16, 16);
      } catch (err) {
        // ignore image error
      }
    }

    // [ RUET ] box
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('[ RUET ]', 16, 24, { align: 'center' });

    // Center titles
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.text("Heaven's light is our guide", 110, 8, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Rajshahi University of Engineering & Technology', 110, 13, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('Dept. of Electrical & Computer Engineering', 110, 17.5, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.text('Attendance Report', 110, 22.5, { align: 'center' });

    // Metadata row (bordered 3 cells spanning 196 mm)
    const metaY = 26.5;
    const metaH = 5.2;
    doc.setLineWidth(0.25);
    doc.setDrawColor(40, 40, 40);

    // Box 1: Dept Name: ECE
    doc.rect(7, metaY, 62, metaH);
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.text('Dept Name: ECE', 9, metaY + 3.6);

    // Box 2: Course Code: [Name]
    doc.rect(69, metaY, 74, metaH);
    const cName = course ? (course.name || '') : '';
    doc.text(`Course Code: ${cName}`, 71, metaY + 3.6);

    // Box 3: Course Title: [Code]
    doc.rect(143, metaY, 60, metaH);
    const cCode = course ? (course.code || '') : '';
    doc.text(`Course Title: ${cCode}`, 145, metaY + 3.6);
  }

  // Draw Page 1 header
  drawPageHeader();

  // Prepare Columns
  const colHeaders = ['Roll No.'];
  for (let i = 0; i < totalDateCols; i++) {
    if (i < numSessions) {
      colHeaders.push(sessions[i].formattedDate || sessions[i].date || '');
    } else {
      colHeaders.push('');
    }
  }
  colHeaders.push('Atnd (%)');
  colHeaders.push('Mark Obtained');

  // Prepare Student Rows
  const studentList = students || [];
  const tableRows = studentList.map(st => {
    const row = [st.studentId || String(st.rollNo || '')];
    for (let sIdx = 0; sIdx < totalDateCols; sIdx++) {
      if (sIdx < numSessions) {
        const sess = sessions[sIdx];
        const mark = (st.sessionMarks && st.sessionMarks[sess.id]) ? st.sessionMarks[sess.id] : 'A';
        row.push(mark);
      } else {
        row.push('');
      }
    }
    row.push(st.attndPct !== undefined ? Number(st.attndPct).toFixed(1) : '0.0');
    row.push(st.markObtained !== undefined ? String(st.markObtained) : '0');
    return row;
  });

  // Column styles fitting within 200mm
  const colStyles = {
    0: { cellWidth: 13.5, halign: 'center', fontStyle: 'bold' }
  };
  for (let i = 1; i <= totalDateCols; i++) {
    colStyles[i] = { cellWidth: 3.65, halign: 'center', cellPadding: 0.2 };
  }
  colStyles[totalDateCols + 1] = { cellWidth: 12.5, halign: 'center', cellPadding: 0.2 };
  colStyles[totalDateCols + 2] = { cellWidth: 14.5, halign: 'center', cellPadding: 0.2 };

  // Page 1 split: 53 students on Page 1 (matches the official RUET printout)
  const page1Rows = tableRows.slice(0, 53);
  const page2Rows = tableRows.slice(53);

  // Table on Page 1
  doc.autoTable({
    startY: 33.5,
    head: [colHeaders.map(() => '')],
    body: page1Rows,
    theme: 'grid',
    tableWidth: 200,
    margin: { left: 5, right: 5 },
    styles: {
      font: 'times',
      fontSize: 6.2,
      cellPadding: 0.2,
      lineColor: [190, 190, 190],
      lineWidth: 0.15,
      halign: 'center',
      valign: 'middle',
      minCellHeight: 4.2
    },
    headStyles: {
      fillColor: [255, 255, 255],
      lineWidth: 0.2,
      lineColor: [120, 120, 120],
      minCellHeight: 20
    },
    columnStyles: colStyles,
    didDrawCell: function (data) {
      if (data.section === 'head') {
        const text = colHeaders[data.column.index];
        if (text) {
          doc.saveGraphicsState && doc.saveGraphicsState();
          doc.setFont('times', 'bold');
          doc.setFontSize(5.8);
          doc.setTextColor(0, 0, 0);
          const x = data.cell.x + data.cell.width / 2 + 1.1;
          const y = data.cell.y + data.cell.height - 1.5;
          doc.text(text, x, y, { angle: 90 });
          doc.restoreGraphicsState && doc.restoreGraphicsState();
        }
      }
    }
  });

  const totalPages = page2Rows.length > 0 ? 2 : 1;
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`Page 1 of ${totalPages}`, 105, 292, { align: 'center' });

  // Page 2
  if (page2Rows.length > 0) {
    doc.addPage();

    doc.autoTable({
      startY: 12,
      head: [colHeaders.map(() => '')],
      body: page2Rows,
      theme: 'grid',
      tableWidth: 200,
      margin: { left: 5, right: 5 },
      styles: {
        font: 'times',
        fontSize: 6.2,
        cellPadding: 0.2,
        lineColor: [190, 190, 190],
        lineWidth: 0.15,
        halign: 'center',
        valign: 'middle',
        minCellHeight: 4.2
      },
      headStyles: {
        fillColor: [255, 255, 255],
        lineWidth: 0.2,
        lineColor: [120, 120, 120],
        minCellHeight: 20
      },
      columnStyles: colStyles,
      didDrawCell: function (data) {
        if (data.section === 'head') {
          const text = colHeaders[data.column.index];
          if (text) {
            doc.saveGraphicsState && doc.saveGraphicsState();
            doc.setFont('times', 'bold');
            doc.setFontSize(5.8);
            doc.setTextColor(0, 0, 0);
            const x = data.cell.x + data.cell.width / 2 + 1.1;
            const y = data.cell.y + data.cell.height - 1.5;
            doc.text(text, x, y, { angle: 90 });
            doc.restoreGraphicsState && doc.restoreGraphicsState();
          }
        }
      }
    });

    // Signature block on Page 2
    let sigY = doc.lastAutoTable.finalY + 30;
    if (sigY > 260) {
      doc.addPage();
      sigY = 30;
    }

    const tName = teacherName || 'Not Found';
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(tName, 35, sigY - 3, { align: 'center' });

    doc.setLineWidth(0.3);
    doc.line(12, sigY, 58, sigY);
    doc.line(80, sigY, 130, sigY);
    doc.line(145, sigY, 195, sigY);

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text('Name of the Teacher', 35, sigY + 4.5, { align: 'center' });
    doc.text('Signature', 105, sigY + 4.5, { align: 'center' });
    doc.text('Date', 170, sigY + 4.5, { align: 'center' });

    doc.text(`Page 2 of ${totalPages}`, 105, 292, { align: 'center' });
  }

  return Buffer.from(doc.output('arraybuffer'));
}

module.exports = { generateRuetPdf };
