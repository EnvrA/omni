import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface InvoiceData {
  logoUrl?: string;
  header?: string;
  body?: string;
  footer?: string;
  amount: number;
  dueDate: string;
  clientName: string;
}

export async function generateInvoicePdf(data: InvoiceData) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const { width } = page.getSize();

  const font = await doc.embedFont(StandardFonts.Helvetica);
  let y = 780;

  if (data.logoUrl) {
    try {
      const logoBytes = await fetch(data.logoUrl).then((r) => r.arrayBuffer());
      const logo = await doc.embedPng(logoBytes);
      page.drawImage(logo, { x: 50, y, width: 100, height: 50 });
    } catch {
      // ignore
    }
    y -= 60;
  }

  if (data.header) {
    page.drawText(data.header, {
      x: 50,
      y,
      size: 14,
      font,
    });
    y -= 20;
  }

  page.drawText(`Bill To: ${data.clientName}`, { x: 50, y, size: 12, font });
  y -= 20;
  page.drawText(`Amount Due: $${data.amount.toFixed(2)}`, {
    x: 50,
    y,
    size: 12,
    font,
  });
  y -= 20;
  page.drawText(`Due Date: ${data.dueDate}`, { x: 50, y, size: 12, font });
  y -= 40;

  if (data.body) {
    page.drawText(data.body, { x: 50, y, size: 12, font, lineHeight: 14 });
    y -= 40;
  }

  if (data.footer) {
    page.drawText(data.footer, {
      x: 50,
      y: 40,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes).toString('base64');
}
