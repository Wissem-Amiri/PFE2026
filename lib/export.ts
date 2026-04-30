import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import dayjs from 'dayjs'

export const exportEmployeesToPDF = (employees: any[]) => {
  const doc = new jsPDF()

  // Document Title
  doc.setFontSize(22)
  doc.setTextColor(127, 86, 217) // #7F56D9 (UnifyRH Color)
  doc.text('UnifyRH', 14, 20)
  
  doc.setFontSize(16)
  doc.setTextColor(16, 24, 40) // #101828
  doc.text('Employee List Report', 14, 30)
  
  // Generation Date
  doc.setFontSize(10)
  doc.setTextColor(102, 112, 133) // #667085
  doc.text(`Generated on: ${dayjs().format('MM/DD/YYYY [at] HH:mm')}`, 14, 38)

  // Column Definitions
  const tableColumn = ["Employee", "Email", "Department", "Position", "Hire Date"];
  
  // Data Preparation
  const tableRows = employees.map(emp => [
    emp.user_name || '---',
    emp.email || '---',
    emp.employee?.department || 'General',
    emp.employee?.position || '---',
    emp.employee?.hire_date ? dayjs(emp.employee.hire_date).format('MM/DD/YYYY') : '---'
  ]);

  // Table Generation
  autoTable(doc, {
    startY: 45,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [127, 86, 217],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      cellPadding: 4
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [52, 64, 84],
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { top: 45 },
    styles: {
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 30 }
    }
  });

  // File Save
  doc.save(`Employee_Report_${dayjs().format('YYYY-MM-DD')}.pdf`)
}

export const exportTableToPDF = (title: string, headers: string[], rows: any[][], fileName: string) => {
  const doc = new jsPDF()

  // Document Title
  doc.setFontSize(22)
  doc.setTextColor(127, 86, 217) // #7F56D9
  doc.text('UnifyRH', 14, 20)
  
  doc.setFontSize(16)
  doc.setTextColor(16, 24, 40) // #101828
  doc.text(title, 14, 30)
  
  // Generation Date
  doc.setFontSize(10)
  doc.setTextColor(102, 112, 133) // #667085
  doc.text(`Generated on: ${dayjs().format('MM/DD/YYYY [at] HH:mm')}`, 14, 38)

  // Table Generation
  autoTable(doc, {
    startY: 45,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [127, 86, 217],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      cellPadding: 4
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [52, 64, 84],
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { top: 45 }
  });

  // File Save
  doc.save(`${fileName}_${dayjs().format('YYYY-MM-DD')}.pdf`)
}
