import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportData {
  title: string;
  subtitle?: string;
  metadata?: {
    patientName: string;
    patientId: string;
    dob: string;
    gender: string;
    date: string;
  };
  sections: ReportSection[];
}

export type ReportSection = 
  | { type: 'text'; title?: string; content: string }
  | { type: 'key-value'; title?: string; items: { label: string; value: string }[] }
  | { type: 'table'; title?: string; headers: string[]; rows: (string | number)[][] };

export const generatePDFReport = (data: ReportData, filename: string, buttonElement?: HTMLButtonElement) => {
  const originalText = buttonElement ? buttonElement.innerText : '';
  
  try {
    if (buttonElement) {
      buttonElement.innerText = 'Generating...';
      buttonElement.disabled = true;
    }

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    
    // --- DRAW HEADER ---
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(String(data.title), margin, 40);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(String(data.subtitle || 'CLINICAL HEALTH SUMMARY'), margin, 60);
    
    let yPos = 100;

    const checkPageBreak = (neededHeight: number) => {
      if (yPos + neededHeight > pageHeight - margin - 40) { // leave room for footer
        doc.addPage();
        yPos = margin;
      }
    };

    // --- DRAW METADATA BOX ---
    if (data.metadata) {
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.rect(margin, yPos, pageWidth - margin * 2, 70, 'FD');
      
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFontSize(10);
      
      // Col 1
      doc.setFont('helvetica', 'bold');
      doc.text('Patient Name:', margin + 15, yPos + 25);
      doc.setFont('helvetica', 'normal');
      doc.text(String(data.metadata.patientName || ''), margin + 95, yPos + 25);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Patient ID:', margin + 15, yPos + 50);
      doc.setFont('helvetica', 'normal');
      doc.text(String(data.metadata.patientId || ''), margin + 95, yPos + 50);

      // Col 2
      const col2X = margin + (pageWidth - margin * 2) / 2;
      doc.setFont('helvetica', 'bold');
      doc.text('DOB / Gender:', col2X, yPos + 25);
      doc.setFont('helvetica', 'normal');
      doc.text(`${data.metadata.dob || ''} / ${data.metadata.gender || ''}`, col2X + 85, yPos + 25);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Report Date:', col2X, yPos + 50);
      doc.setFont('helvetica', 'normal');
      doc.text(String(data.metadata.date || ''), col2X + 85, yPos + 50);

      yPos += 100;
    }

    doc.setTextColor(15, 23, 42);

    for (const section of data.sections) {
      if (section.type === 'text') {
        if (section.title) {
          checkPageBreak(25);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(String(section.title), margin, yPos);
          yPos += 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85); // Slate 700
        const contentStr = String(section.content || '');
        const lines = doc.splitTextToSize(contentStr, pageWidth - margin * 2);
        checkPageBreak(lines.length * 15);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 15 + 15;
        doc.setTextColor(15, 23, 42);
      } 
      else if (section.type === 'key-value') {
        if (section.title) {
          checkPageBreak(25);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(String(section.title), margin, yPos);
          yPos += 20;
        }
        
        doc.setFontSize(11);
        for (const item of section.items) {
          checkPageBreak(15);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(71, 85, 105);
          const labelStr = String(item.label || '');
          doc.text(`${labelStr}:`, margin, yPos);
          const labelWidth = doc.getTextWidth(`${labelStr}: `);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(15, 23, 42);
          
          const valueStr = String(item.value || '');
          const valueLines = doc.splitTextToSize(valueStr, pageWidth - margin * 2 - labelWidth);
          doc.text(valueLines, margin + labelWidth, yPos);
          yPos += valueLines.length * 15;
        }
        yPos += 15;
      }
      else if (section.type === 'table') {
        if (section.title) {
          checkPageBreak(25);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(String(section.title), margin, yPos);
          yPos += 15;
        }
        
        const stringRows = section.rows.map(row => row.map(cell => String(cell ?? '')));

        autoTable(doc, {
          startY: yPos,
          head: [section.headers.map(h => String(h || ''))],
          body: stringRows,
          theme: 'grid',
          headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', lineWidth: 0.1, lineColor: [203, 213, 225] },
          bodyStyles: { textColor: [51, 65, 85], lineWidth: 0.1, lineColor: [226, 232, 240] },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
          margin: { left: margin, right: margin },
          didParseCell: function (hookData) {
            // Highlight High/Low/Abnormal
            if (hookData.section === 'body' && typeof hookData.cell.raw === 'string') {
              const text = hookData.cell.raw.toUpperCase();
              if (text.includes('HIGH') || text.includes('ELEVATED') || text.includes('ABNORMAL')) {
                hookData.cell.styles.textColor = [220, 38, 38]; // Red 600
                hookData.cell.styles.fontStyle = 'bold';
              } else if (text.includes('LOW')) {
                hookData.cell.styles.textColor = [234, 179, 8]; // Yellow 500
                hookData.cell.styles.fontStyle = 'bold';
              } else if (text.includes('NORMAL')) {
                hookData.cell.styles.textColor = [16, 185, 129]; // Emerald 500
              }
            }
          }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 25;
      }
    }

    // --- ADD FOOTERS TO ALL PAGES ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        "Disclaimer: This report is generated by an AI Health Assistant for informational purposes only. It does not replace professional medical advice, diagnosis, or treatment.", 
        margin, pageHeight - 20
      );
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, pageHeight - 20);
    }

    doc.save(filename);

    if (buttonElement) {
      buttonElement.innerText = originalText;
      buttonElement.disabled = false;
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (buttonElement) {
      buttonElement.innerText = originalText;
      buttonElement.disabled = false;
    }
  }
};
