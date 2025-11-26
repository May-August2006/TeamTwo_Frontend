// utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Payment } from '../types/payment';

export interface ReceiptData {
  payment: Payment;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export const generatePaymentReceipt = async (payment: Payment): Promise<Blob> => {
  return new Promise((resolve) => {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Company Information (you can customize this)
    const companyInfo = {
      name: 'Myanmar Management System',
      address: 'Yangon, Myanmar',
      phone: '+95 9 123 456 789',
      email: 'info@mms.com'
    };

    // Set receipt title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('PAYMENT RECEIPT', 105, 25, { align: 'center' });

    // Company info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(companyInfo.name, 105, 35, { align: 'center' });
    doc.text(companyInfo.address, 105, 40, { align: 'center' });
    doc.text(`Tel: ${companyInfo.phone} | Email: ${companyInfo.email}`, 105, 45, { align: 'center' });

    // Add separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 50, 195, 50);

    // Receipt details section
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    
    const leftColumn = 20;
    const rightColumn = 120;
    let yPosition = 65;

    // Payment Information
    doc.setFont(undefined, 'bold');
    doc.text('Receipt Number:', leftColumn, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(payment.paymentNumber, rightColumn, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Payment Date:', leftColumn, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(payment.paymentDate).toLocaleDateString('en-US'), rightColumn, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Invoice Number:', leftColumn, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(payment.invoiceNumber, rightColumn, yPosition);
    yPosition += 8;

    // Tenant Information
    yPosition += 5;
    doc.setFont(undefined, 'bold');
    doc.text('Tenant Information:', leftColumn, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Tenant Name:', leftColumn, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(payment.tenantName, rightColumn, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Room Number:', leftColumn, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(payment.roomNumber, rightColumn, yPosition);
    yPosition += 8;

    // Payment Details Table
    yPosition += 10;
    autoTable(doc, {
      startY: yPosition,
      head: [['Description', 'Amount (MMK)']],
      body: [
        ['Payment Amount', payment.amount.toLocaleString()],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 55, halign: 'right' }
      }
    });

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Payment Method and Status
    doc.setFont(undefined, 'bold');
    doc.text('Payment Method:', leftColumn, finalY);
    doc.setFont(undefined, 'normal');
    doc.text(getPaymentMethodLabel(payment.paymentMethod), rightColumn, finalY);

    doc.setFont(undefined, 'bold');
    doc.text('Status:', leftColumn, finalY + 8);
    doc.setFont(undefined, 'normal');
    doc.text(payment.paymentStatus, rightColumn, finalY + 8);

    if (payment.referenceNumber) {
      doc.setFont(undefined, 'bold');
      doc.text('Reference Number:', leftColumn, finalY + 16);
      doc.setFont(undefined, 'normal');
      doc.text(payment.referenceNumber, rightColumn, finalY + 16);
    }

    // Received By
    doc.setFont(undefined, 'bold');
    doc.text('Received By:', leftColumn, finalY + 24);
    doc.setFont(undefined, 'normal');
    doc.text(payment.receivedBy, rightColumn, finalY + 24);

    // Notes if available
    if (payment.notes) {
      doc.setFont(undefined, 'bold');
      doc.text('Notes:', leftColumn, finalY + 32);
      doc.setFont(undefined, 'normal');
      const splitNotes = doc.splitTextToSize(payment.notes, 150);
      doc.text(splitNotes, leftColumn, finalY + 40);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer-generated receipt. No signature is required.', 105, pageHeight - 20, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, pageHeight - 15, { align: 'center' });

    // Convert to blob and return
    const pdfBlob = doc.output('blob');
    resolve(pdfBlob);
  });
};

// Helper function to get payment method label
const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'CASH': return 'Cash';
    case 'CHECK': return 'Check';
    case 'BANK_TRANSFER': return 'Bank Transfer';
    default: return method;
  }
};