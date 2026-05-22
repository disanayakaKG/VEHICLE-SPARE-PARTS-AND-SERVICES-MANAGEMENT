/**
 * Invoice Generator Utility for Warranty Claims
 * Generates PDF invoices using pdfkit
 */

const formatDate = (date) => {
   if (!date) return 'N/A';
   return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
   });
};

const formatCurrency = (amount) => {
   if (!amount) return 'Rs. 0';
   return `Rs. ${amount.toLocaleString()}`;
};

const capitalizeFirst = (str) => {
   if (!str) return '';
   return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
};

/**
 * Generate warranty invoice PDF content
 * @param {PDFDocument} doc - pdfkit document instance
 * @param {Object} data - Invoice data containing claim, product, order, and user info
 */
const generateWarrantyInvoice = (doc, data) => {
   const { claim, product, order, user } = data;

   // Colors
   const primaryColor = '#7c3aed';
   const darkColor = '#1f2937';
   const grayColor = '#6b7280';
   const lightGray = '#f3f4f6';

   // Header Section
   doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);

   doc.fillColor('#ffffff')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('AutoParts Pro', 50, 35);

   doc.fontSize(12)
      .font('Helvetica')
      .text('Warranty Claim Invoice', 50, 70);

   doc.fontSize(11)
      .text(`Claim #: ${claim.claimNumber || 'N/A'}`, 50, 90);

   // Generated Date (right side)
   doc.fontSize(10)
      .text(`Generated: ${formatDate(new Date())}`, 400, 70, { align: 'right' });

   // Status Badge
   const statusColors = {
      pending: '#f59e0b',
      under_review: '#3b82f6',
      approved: '#10b981',
      rejected: '#ef4444',
      replacement_sent: '#8b5cf6',
      completed: '#10b981'
   };

   const statusColor = statusColors[claim.status] || '#6b7280';
   doc.roundedRect(450, 85, 100, 25, 5).fill(statusColor);
   doc.fillColor('#ffffff')
      .fontSize(10)
      .text(capitalizeFirst(claim.status), 455, 92, { width: 90, align: 'center' });

   // Reset position after header
   let yPos = 140;

   // Customer & Order Info Section
   doc.fillColor(darkColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Customer Information', 50, yPos);

   yPos += 25;
   doc.fontSize(10)
      .font('Helvetica')
      .fillColor(grayColor);

   doc.text(`Name: ${user.name || 'N/A'}`, 50, yPos);
   doc.text(`Email: ${user.email || 'N/A'}`, 50, yPos + 15);
   doc.text(`Phone: ${user.phone || 'N/A'}`, 50, yPos + 30);

   // Order Info (right column)
   doc.fillColor(darkColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Order Information', 300, yPos - 25);

   doc.fontSize(10)
      .font('Helvetica')
      .fillColor(grayColor);

   doc.text(`Order #: ${order.orderNumber || 'N/A'}`, 300, yPos);
   doc.text(`Order Date: ${formatDate(order.createdAt)}`, 300, yPos + 15);
   doc.text(`Amount: ${formatCurrency(order.totalAmount)}`, 300, yPos + 30);
   doc.text(`Payment: ${capitalizeFirst(order.paymentMethod)}`, 300, yPos + 45);

   yPos += 80;

   // Horizontal Line
   doc.strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .stroke();

   yPos += 20;

   // Product Details Section
   doc.fillColor(darkColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Product Details', 50, yPos);

   yPos += 25;

   // Product info box
   doc.rect(50, yPos, 495, 60).fill(lightGray);

   doc.fillColor(darkColor)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(product.name || 'Product Name', 60, yPos + 10);

   doc.fontSize(10)
      .font('Helvetica')
      .fillColor(grayColor)
      .text(`Part Number: ${product.partNumber || 'N/A'}`, 60, yPos + 30);

   yPos += 80;

   // Warranty Period Section
   doc.fillColor(darkColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Warranty Period', 50, yPos);

   yPos += 25;

   // Calculate warranty duration
   const startDate = new Date(claim.warrantyStartDate);
   const endDate = new Date(claim.warrantyEndDate);
   const monthsDiff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));

   doc.rect(50, yPos, 495, 50).fill(lightGray);

   doc.fontSize(10)
      .font('Helvetica')
      .fillColor(grayColor);

   doc.text(`Start Date: ${formatDate(claim.warrantyStartDate)}`, 60, yPos + 10);
   doc.text(`End Date: ${formatDate(claim.warrantyEndDate)}`, 200, yPos + 10);
   doc.text(`Duration: ${monthsDiff} months`, 380, yPos + 10);

   // Check if expired
   const isExpired = new Date() > endDate;
   const warrantyStatus = isExpired ? 'EXPIRED' : 'ACTIVE';
   const warrantyStatusColor = isExpired ? '#ef4444' : '#10b981';

   doc.fillColor(warrantyStatusColor)
      .font('Helvetica-Bold')
      .text(`Status: ${warrantyStatus}`, 60, yPos + 30);

   yPos += 70;

   // Claim Details Section
   doc.fillColor(darkColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Claim Details', 50, yPos);

   yPos += 25;

   doc.fontSize(10)
      .font('Helvetica')
      .fillColor(grayColor);

   doc.text(`Issue Type: ${capitalizeFirst(claim.issueType)}`, 50, yPos);
   doc.text(`Date Filed: ${formatDate(claim.createdAt)}`, 300, yPos);

   yPos += 20;

   doc.fillColor(darkColor)
      .font('Helvetica-Bold')
      .text('Issue Description:', 50, yPos);

   yPos += 15;

   doc.font('Helvetica')
      .fillColor(grayColor)
      .text(claim.issueDescription || 'No description provided', 50, yPos, {
         width: 495,
         lineGap: 3
      });

   yPos += 50;

   // Resolution Section (if resolved)
   if (claim.resolution) {
      doc.fillColor(darkColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Resolution', 50, yPos);

      yPos += 25;

      doc.rect(50, yPos, 495, 50).fill('#ecfdf5');

      doc.fillColor('#047857')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(`Resolution Type: ${capitalizeFirst(claim.resolution)}`, 60, yPos + 10);

      if (claim.resolvedAt) {
         doc.fontSize(10)
            .font('Helvetica')
            .text(`Resolved On: ${formatDate(claim.resolvedAt)}`, 60, yPos + 30);
      }

      yPos += 70;
   }

   // Admin Notes (if any)
   if (claim.adminNotes) {
      doc.fillColor(darkColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Admin Notes', 50, yPos);

      yPos += 25;

      doc.rect(50, yPos, 495, 40).fill('#eff6ff');

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#1e40af')
         .text(claim.adminNotes, 60, yPos + 12, { width: 475 });

      yPos += 60;
   }

   // Replacement History Section
   if (claim.replacementHistory && claim.replacementHistory.length > 0) {
      // Check if we need a new page
      if (yPos > 650) {
         doc.addPage();
         yPos = 50;
      }

      doc.fillColor(darkColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Replacement History', 50, yPos);

      yPos += 25;

      // Table header
      doc.rect(50, yPos, 495, 25).fill(primaryColor);

      doc.fillColor('#ffffff')
         .fontSize(9)
         .font('Helvetica-Bold');

      doc.text('#', 60, yPos + 8);
      doc.text('Tracking Number', 80, yPos + 8);
      doc.text('Shipped Date', 220, yPos + 8);
      doc.text('Status', 340, yPos + 8);
      doc.text('Notes', 420, yPos + 8);

      yPos += 25;

      // Table rows
      claim.replacementHistory.forEach((replacement, index) => {
         const bgColor = index % 2 === 0 ? '#ffffff' : lightGray;
         doc.rect(50, yPos, 495, 25).fill(bgColor);

         doc.fillColor(darkColor)
            .fontSize(9)
            .font('Helvetica');

         doc.text(`${index + 1}`, 60, yPos + 8);
         doc.text(replacement.trackingNumber || 'N/A', 80, yPos + 8);
         doc.text(formatDate(replacement.shippedAt), 220, yPos + 8);
         doc.text(capitalizeFirst(replacement.status), 340, yPos + 8);
         doc.text((replacement.notes || '-').substring(0, 15), 420, yPos + 8);

         yPos += 25;
      });

      yPos += 20;
   }

   // Current Replacement Tracking (if any)
   if (claim.replacementTrackingNumber && !claim.replacementHistory?.length) {
      doc.fillColor(darkColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Replacement Tracking', 50, yPos);

      yPos += 20;

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(grayColor)
         .text(`Tracking Number: ${claim.replacementTrackingNumber}`, 50, yPos);

      yPos += 30;
   }

   // Footer
   const footerY = doc.page.height - 80;

   doc.strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, footerY)
      .lineTo(545, footerY)
      .stroke();

   doc.fillColor(grayColor)
      .fontSize(9)
      .font('Helvetica')
      .text('This is a computer-generated document. No signature is required.', 50, footerY + 15, {
         align: 'center',
         width: 495
      });

   doc.text(`AutoParts Pro - Your Trusted Auto Parts Partner`, 50, footerY + 30, {
      align: 'center',
      width: 495
   });

   doc.text(`Document generated on ${formatDate(new Date())}`, 50, footerY + 45, {
      align: 'center',
      width: 495
   });
};

/**
 * Generate regular order invoice PDF content
 * @param {PDFDocument} doc - pdfkit document instance
 * @param {Object} data - Invoice data containing order and user info
 */
const generateOrderInvoice = (doc, data) => {
   const { order, user } = data;

   // Colors
   const primaryColor = '#7c3aed';
   const darkColor = '#1f2937';
   const grayColor = '#6b7280';
   const lightGray = '#f3f4f6';
   const successColor = '#10b981';

   // Header Section
   doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);

   doc.fillColor('#ffffff')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('AutoParts Pro', 50, 35);

   doc.fontSize(12)
      .font('Helvetica')
      .text('Tax Invoice', 50, 70);

   doc.fontSize(11)
      .text(`Order #: ${order.orderNumber || 'N/A'}`, 50, 90);

   // Date (right side)
   doc.fontSize(10)
      .text(`Date: ${formatDate(order.createdAt)}`, 400, 70, { align: 'right' });

   doc.text(`Invoice #: INV-${order.orderNumber.split('-').pop()}`, 400, 85, { align: 'right' });

   // Reset position after header
   let yPos = 140;

   // Customer & Shipping Section
   doc.fillColor(darkColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Billing & Shipping', 50, yPos);

   yPos += 25;
   doc.fontSize(10)
      .font('Helvetica')
      .fillColor(grayColor);

   // Billing (Left)
   doc.text('Bill To:', 50, yPos, { underline: true });
   doc.fillColor(darkColor).font('Helvetica-Bold').text(user.name || 'N/A', 50, yPos + 15);
   doc.fillColor(grayColor).font('Helvetica').text(user.email || 'N/A', 50, yPos + 30);
   doc.text(user.phone || 'N/A', 50, yPos + 45);

   // Shipping (Right)
   const addr = order.shippingAddress || {};
   doc.text('Ship To:', 300, yPos, { underline: true });
   doc.fillColor(darkColor).font('Helvetica-Bold').text(user.name || 'N/A', 300, yPos + 15);
   doc.fillColor(grayColor).font('Helvetica').text(addr.street || 'N/A', 300, yPos + 30);
   doc.text(`${addr.city || 'N/A'}, ${addr.state || 'N/A'} ${addr.zipCode || ''}`, 300, yPos + 45);
   doc.text(`Phone: ${addr.phone || 'N/A'}`, 300, yPos + 60);

   yPos += 100;

   // Items Table
   doc.fillColor(darkColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Order Items', 50, yPos);

   yPos += 25;

   // Table header
   doc.rect(50, yPos, 495, 25).fill(lightGray);
   doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold');
   doc.text('Description', 60, yPos + 7);
   doc.text('Qty', 300, yPos + 7);
   doc.text('Unit Price', 380, yPos + 7);
   doc.text('Total', 480, yPos + 7, { align: 'right', width: 50 });

   yPos += 25;
   doc.font('Helvetica').fontSize(10).fillColor(grayColor);

   order.items.forEach((item, index) => {
      // Check for new page
      if (yPos > 700) {
         doc.addPage();
         yPos = 50;
      }

      doc.fillColor(darkColor).text(item.name, 60, yPos + 10, { width: 230 });
      doc.text(item.quantity.toString(), 300, yPos + 10);
      doc.text(formatCurrency(item.price), 380, yPos + 10);
      doc.text(formatCurrency(item.price * item.quantity), 480, yPos + 10, { align: 'right', width: 50 });

      yPos += 30;
      doc.moveTo(50, yPos).lineTo(545, yPos).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
   });

   yPos += 20;

   // Totals
   const totalBoxWidth = 200;
   const totalBoxX = 345;

   doc.fillColor(grayColor);
   doc.text('Subtotal:', totalBoxX, yPos);
   doc.fillColor(darkColor).text(formatCurrency(order.subtotal), totalBoxX + 100, yPos, { align: 'right', width: 100 });

   yPos += 20;
   if (order.discountAmount > 0) {
      doc.fillColor('#ef4444');
      doc.text(`Discount (${order.discountCode || 'PROMO'}):`, totalBoxX, yPos);
      doc.text(`-${formatCurrency(order.discountAmount)}`, totalBoxX + 100, yPos, { align: 'right', width: 100 });
      yPos += 20;
   }

   doc.fillColor(grayColor);
   doc.text('Shipping:', totalBoxX, yPos);
   doc.fillColor(darkColor).text(order.shippingCost === 0 ? 'FREE' : formatCurrency(order.shippingCost), totalBoxX + 100, yPos, { align: 'right', width: 100 });

   yPos += 30;
   doc.rect(totalBoxX - 10, yPos - 5, totalBoxWidth + 10, 35).fill(primaryColor);
   doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold');
   doc.text('Total Amount:', totalBoxX, yPos + 10);
   doc.text(formatCurrency(order.totalAmount), totalBoxX + 100, yPos + 10, { align: 'right', width: 100 });

   yPos += 60;

   // Payment Status
   doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text('Payment Information', 50, yPos);
   yPos += 20;
   doc.fontSize(10).font('Helvetica').fillColor(grayColor);
   doc.text(`Method: ${capitalizeFirst(order.paymentMethod)}`, 50, yPos);
   doc.text(`Status: ${capitalizeFirst(order.paymentStatus)}`, 50, yPos + 15);

   if (order.paymentStatus === 'completed') {
      doc.fillColor(successColor).font('Helvetica-Bold').text('PAID IN FULL', 50, yPos + 35);
   }

   // Footer (same as above)
   const footerY = doc.page.height - 80;
   doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, footerY).lineTo(545, footerY).stroke();
   doc.fillColor(grayColor).fontSize(9).font('Helvetica').text('Thank you for your business!', 50, footerY + 15, { align: 'center', width: 495 });
   doc.text(`AutoParts Pro - Genuine Parts, Guaranteed Quality`, 50, footerY + 30, { align: 'center', width: 495 });
};

module.exports = { generateWarrantyInvoice, generateOrderInvoice };
