const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate payment receipt PDF
 */
const generatePaymentReceipt = async (payment, tenant, landlord, property) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const fileName = `receipt-${payment.receiptNumber}.pdf`;
      const filePath = path.join(__dirname, '../uploads/receipts', fileName);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);
      
      // Header
      doc.fontSize(24).text('PAYMENT RECEIPT', { align: 'center' });
      doc.moveDown();
      
      // Receipt info
      doc.fontSize(10).text(`Receipt Number: ${payment.receiptNumber}`, { align: 'right' });
      doc.text(`Date: ${new Date(payment.paidDate).toLocaleDateString()}`, { align: 'right' });
      doc.moveDown(2);
      
      // Landlord info
      doc.fontSize(12).text('From:', { underline: true });
      doc.fontSize(10).text(landlord.name);
      if (landlord.email) doc.text(landlord.email);
      if (landlord.phone) doc.text(landlord.phone);
      doc.moveDown();
      
      // Tenant info
      doc.fontSize(12).text('To:', { underline: true });
      doc.fontSize(10).text(tenant.name);
      doc.text(tenant.email);
      if (tenant.phone) doc.text(tenant.phone);
      doc.moveDown(2);
      
      // Property info
      doc.fontSize(12).text('Property:', { underline: true });
      doc.fontSize(10).text(property.name);
      doc.text(`${property.address.street}`);
      doc.text(`${property.address.city}, ${property.address.state} ${property.address.zipCode}`);
      doc.moveDown(2);
      
      // Payment details table
      const tableTop = doc.y;
      doc.fontSize(12).text('Payment Details:', { underline: true });
      doc.moveDown();
      
      const itemsData = [
        { description: 'Payment Type', amount: payment.type.replace('_', ' ').toUpperCase() },
        { description: 'Amount', amount: `₹${payment.amount.toFixed(2)}` },
        { description: 'Payment Method', amount: payment.paymentMethod.replace('_', ' ').toUpperCase() },
        { description: 'Transaction ID', amount: payment.demoPayment?.transactionId || 'N/A' }
      ];
      
      if (payment.demoPayment?.cardLast4) {
        itemsData.push({
          description: 'Card',
          amount: `${payment.demoPayment.cardBrand} ****${payment.demoPayment.cardLast4}`
        });
      }
      
      itemsData.forEach((item, index) => {
        const y = doc.y;
        doc.fontSize(10).text(item.description, 50, y);
        doc.text(item.amount, 300, y, { align: 'right' });
        doc.moveDown(0.5);
      });
      
      doc.moveDown(2);
      
      // Total
      doc.fontSize(14)
         .text('Total Paid:', 50, doc.y, { continued: true, bold: true })
         .text(`₹${payment.amount.toFixed(2)}`, { align: 'right' });
      
      doc.moveDown(3);
      
      // Footer
      doc.fontSize(10)
         .text('Thank you for your payment!', { align: 'center' })
         .moveDown()
         .fontSize(8)
         .text('PropertyHub - Property Management System', { align: 'center' })
         .text('This is an electronically generated receipt.', { align: 'center' });
      
      doc.end();
      
      writeStream.on('finish', () => {
        // Return URL path instead of file system path
        const urlPath = `/uploads/receipts/${fileName}`;
        resolve(urlPath);
      });
      
      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate lease agreement PDF
 */
const generateLeaseDocument = async (lease, landlord, tenant, property) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const fileName = `lease-${lease._id}.pdf`;
      const filePath = path.join(__dirname, '../uploads/leases', fileName);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);
      
      // Header
      doc.fontSize(24).text('LEASE AGREEMENT', { align: 'center' });
      doc.moveDown(2);
      
      // Parties
      doc.fontSize(12).text('THIS LEASE AGREEMENT', { underline: true });
      doc.moveDown();
      doc.fontSize(10).text(`Made this ${new Date(lease.startDate).toLocaleDateString()}`);
      doc.moveDown();
      
      doc.text('BETWEEN:', { underline: true });
      doc.text(`${landlord.name} (hereinafter called "Landlord")`);
      doc.text(`Email: ${landlord.email}`);
      doc.moveDown();
      
      doc.text('AND:', { underline: true });
      doc.text(`${tenant.name} (hereinafter called "Tenant")`);
      doc.text(`Email: ${tenant.email}`);
      doc.moveDown(2);
      
      // Property description
      doc.fontSize(12).text('PROPERTY:', { underline: true });
      doc.fontSize(10).text(property.name);
      doc.text(`${property.address.street}`);
      doc.text(`${property.address.city}, ${property.address.state} ${property.address.zipCode}`);
      doc.text(`Type: ${property.type}`);
      doc.text(`Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}`);
      doc.moveDown(2);
      
      // Terms
      doc.fontSize(12).text('TERMS:', { underline: true });
      doc.fontSize(10);
      doc.text(`Lease Start Date: ${new Date(lease.startDate).toLocaleDateString()}`);
      doc.text(`Lease End Date: ${new Date(lease.endDate).toLocaleDateString()}`);
      doc.text(`Monthly Rent: ₹${lease.rentAmount.toFixed(2)}`);
      doc.text(`Security Deposit: ₹${lease.depositAmount.toFixed(2)}`);
      doc.text(`Rent Due Date: ${lease.paymentDueDay} of each month`);
      doc.moveDown(2);
      
      // Additional terms
      doc.fontSize(12).text('ADDITIONAL TERMS AND CONDITIONS:', { underline: true });
      doc.fontSize(10).text(lease.terms, { align: 'justify' });
      doc.moveDown(3);
      
      // Signatures
      doc.fontSize(12).text('SIGNATURES:', { underline: true });
      doc.moveDown(2);
      
      doc.fontSize(10);
      doc.text('Landlord Signature:', 50, doc.y);
      doc.text('_______________________', 50, doc.y + 20);
      doc.text(`${landlord.name}`, 50, doc.y + 10);
      doc.text(`Date: ${lease.signatures.landlord.signedAt ? new Date(lease.signatures.landlord.signedAt).toLocaleDateString() : '___________'}`, 50, doc.y + 5);
      
      doc.moveDown(3);
      
      doc.text('Tenant Signature:', 50, doc.y);
      doc.text('_______________________', 50, doc.y + 20);
      doc.text(`${tenant.name}`, 50, doc.y + 10);
      doc.text(`Date: ${lease.signatures.tenant.signedAt ? new Date(lease.signatures.tenant.signedAt).toLocaleDateString() : '___________'}`, 50, doc.y + 5);
      
      doc.end();
      
      writeStream.on('finish', () => {
        // Return URL path instead of file system path
        const urlPath = `/uploads/leases/${fileName}`;
        resolve(urlPath);
      });
      
      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generatePaymentReceipt,
  generateLeaseDocument
};
