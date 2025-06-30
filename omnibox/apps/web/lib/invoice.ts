import { PDFDocument, StandardFonts } from 'pdf-lib';

export interface LineItem {
  item: string;
  quantity: string;
  rate: string;
  tax: string;
}

export interface InvoiceData {
  logoUrl?: string;
  companyAddress?: string;
  clientAddress?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  footer?: string;
  items?: LineItem[];
  columns?: { tax: boolean };

  header?: string;
  body?: string;
  companyName?: string;
  accentColor?: string;
  layout?: Record<string, { x: number; y: number }>;
  amount?: number;
  clientName?: string;
}

export async function generateInvoicePdf(data: InvoiceData) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  let y = 780;

  if (data.logoUrl) {
    try {
      let bytes: ArrayBuffer | Uint8Array;
      let mime = '';
      if (data.logoUrl.startsWith('data:')) {
        const [meta, base] = data.logoUrl.split(',', 2);
        mime = meta.split(':')[1].split(';')[0];
        bytes = Buffer.from(base, 'base64');
      } else {
        const res = await fetch(data.logoUrl);
        mime = res.headers.get('content-type') || '';
        bytes = await res.arrayBuffer();
      }
      const img = mime.includes('png')
        ? await doc.embedPng(bytes)
        : await doc.embedJpg(bytes);
      page.drawImage(img, { x: 50, y: y - 40, width: 100, height: 40 });
    } catch {
      // ignore image errors
    }
  }
  y -= 60;

  if (data.companyAddress) {
    page.drawText(data.companyAddress, { x: 50, y, size: 10, font });
  }
  y -= 20;

  if (data.clientAddress) {
    page.drawText('Bill To:', { x: 50, y, size: 12, font });
    page.drawText(data.clientAddress, { x: 110, y, size: 10, font });
  }
  y -= 20;

  if (data.invoiceNumber) {
    page.drawText(`Invoice #: ${data.invoiceNumber}`, { x: 50, y, size: 10, font });
  }
  if (data.invoiceDate) {
    page.drawText(`Invoice Date: ${data.invoiceDate}`, { x: 200, y, size: 10, font });
  }
  if (data.dueDate) {
    page.drawText(`Due Date: ${data.dueDate}`, { x: 380, y, size: 10, font });
  }
  y -= 30;

  const showTax = data.columns?.tax !== false;
  const headerY = y;
  page.drawText('Item', { x: 50, y: headerY, size: 10, font });
  page.drawText('Qty', { x: 250, y: headerY, size: 10, font });
  page.drawText('Rate', { x: 290, y: headerY, size: 10, font });
  if (showTax) page.drawText('Tax', { x: 340, y: headerY, size: 10, font });
  const subX = showTax ? 390 : 340;
  page.drawText('Subtotal', { x: subX, y: headerY, size: 10, font });
  y -= 15;

  const items = data.items || [];
  for (const it of items) {
    const qty = parseFloat(it.quantity) || 0;
    const rate = parseFloat(it.rate) || 0;
    const tax = parseFloat(it.tax) || 0;
    const sub = qty * rate;
    page.drawText(it.item, { x: 50, y, size: 10, font });
    page.drawText(it.quantity, { x: 250, y, size: 10, font });
    page.drawText(it.rate, { x: 290, y, size: 10, font });
    if (showTax) page.drawText(it.tax, { x: 340, y, size: 10, font });
    page.drawText(sub.toFixed(2), { x: subX, y, size: 10, font });
    y -= 15;
  }

  const subtotal = items.reduce(
    (sum, it) => sum + (parseFloat(it.rate) || 0) * (parseFloat(it.quantity) || 0),
    0,
  );
  const taxTotal = items.reduce(
    (sum, it) =>
      sum +
      (parseFloat(it.rate) || 0) * (parseFloat(it.quantity) || 0) * ((parseFloat(it.tax) || 0) / 100),
    0,
  );
  const total = subtotal + taxTotal;

  y -= 10;
  page.drawText(`Subtotal: $${subtotal.toFixed(2)}`, { x: subX, y, size: 10, font });
  y -= 12;
  if (showTax) {
    page.drawText(`Tax: $${taxTotal.toFixed(2)}`, { x: subX, y, size: 10, font });
    y -= 12;
  }
  page.drawText(`Total: $${total.toFixed(2)}`, { x: subX, y, size: 12, font });
  y -= 30;

  if (data.notes) {
    page.drawText(data.notes, { x: 50, y, size: 10, font });
    y -= 20;
  }
  if (data.terms) {
    page.drawText(data.terms, { x: 50, y, size: 8, font });
    y -= 15;
  }
  if (data.footer) {
    page.drawText(data.footer, { x: 50, y: 40, size: 10, font });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes).toString('base64');
}

