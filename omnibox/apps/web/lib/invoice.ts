import { PDFDocument, StandardFonts } from 'pdf-lib';

export interface LineItem {
  item: string;
  description?: string;
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
  const pageWidth = page.getWidth();
  const margin = 50;
  const tableWidth = pageWidth - margin * 2;
  let y = 780;

  const drawLines = (
    text: string,
    x: number,
    startY: number,
    lineHeight: number = 12,
    size: number = 10,
  ) => {
    let yy = startY;
    for (const line of text.split(/\r?\n/)) {
      page.drawText(line, { x, y: yy, size, font });
      yy -= lineHeight;
    }
    return yy;
  };

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
      page.drawImage(img, { x: margin, y: y - 40, width: 100, height: 40 });
    } catch {
      // ignore image errors
    }
  }
  y -= 60;

  if (data.companyAddress) {
    y = drawLines(data.companyAddress, margin, y, 12, 10) - 5;
  }

  if (data.clientAddress) {
    page.drawText('Bill To:', { x: margin, y, size: 12, font });
    y = drawLines(data.clientAddress, margin + 60, y, 12, 10) - 5;
  }

  if (data.invoiceNumber) {
    page.drawText(`Invoice #: ${data.invoiceNumber}`, { x: margin, y, size: 10, font });
  }
  if (data.invoiceDate) {
    page.drawText(`Invoice Date: ${data.invoiceDate}`, { x: margin + 150, y, size: 10, font });
  }
  if (data.dueDate) {
    page.drawText(`Due Date: ${data.dueDate}`, { x: margin + 300, y, size: 10, font });
  }
  y -= 30;

  const showTax = data.columns?.tax !== false;
  const headerY = y;
  const itemW = tableWidth * 0.2;
  const descW = tableWidth * 0.4;
  const smallW = tableWidth * (40 / (showTax ? 4 : 3)) / 100;
  const xItem = margin;
  const xDesc = xItem + itemW;
  const xQty = xDesc + descW;
  const xRate = xQty + smallW;
  const xTax = showTax ? xRate + smallW : xRate;
  const xSub = showTax ? xTax + smallW : xRate + smallW;

  page.drawText('Item', { x: xItem, y: headerY, size: 10, font });
  page.drawText('Description', { x: xDesc, y: headerY, size: 10, font });
  page.drawText('Qty', { x: xQty, y: headerY, size: 10, font });
  page.drawText('Rate', { x: xRate, y: headerY, size: 10, font });
  if (showTax) page.drawText('Tax %', { x: xTax, y: headerY, size: 10, font });
  page.drawText('Subtotal', { x: xSub, y: headerY, size: 10, font });
  y -= 15;

  const items = data.items || [];
  for (const it of items) {
    const qty = parseFloat(it.quantity) || 0;
    const rate = parseFloat(it.rate) || 0;
    const sub = qty * rate;
    const startY = y;
    page.drawText(it.item, { x: xItem, y: startY, size: 10, font });
    const descEndY = it.description
      ? drawLines(it.description, xDesc, startY, 12, 10)
      : startY;
    page.drawText(it.quantity, { x: xQty, y: startY, size: 10, font });
    page.drawText(it.rate, { x: xRate, y: startY, size: 10, font });
    if (showTax) page.drawText(it.tax, { x: xTax, y: startY, size: 10, font });
    page.drawText(sub.toFixed(2), { x: xSub, y: startY, size: 10, font });
    y = descEndY - 15;
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
  page.drawText(`Subtotal: $${subtotal.toFixed(2)}`, { x: xSub, y, size: 10, font });
  y -= 12;
  if (showTax) {
    page.drawText(`Tax: $${taxTotal.toFixed(2)}`, { x: xSub, y, size: 10, font });
    y -= 12;
  }
  page.drawText(`Total: $${total.toFixed(2)}`, { x: xSub, y, size: 12, font });
  y -= 30;

  if (data.notes) {
    y = drawLines(data.notes, margin, y, 12, 10) - 5;
  }
  if (data.terms) {
    y = drawLines(data.terms, margin, y, 10, 8) - 5;
  }
  if (data.footer) {
    drawLines(data.footer, margin, 40, 12, 10);
  }

  const bytes = await doc.save();
  return Buffer.from(bytes).toString('base64');
}

