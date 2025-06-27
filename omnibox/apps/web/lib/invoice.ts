import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface InvoiceData {
  logoUrl?: string;
  header?: string;
  body?: string;
  footer?: string;
  companyName?: string;
  companyAddress?: string;
  notes?: string;
  terms?: string;
  accentColor?: string;
  layout?: Record<string, { x: number; y: number }>;
  amount: number;
  dueDate: string;
  clientName: string;
}

export async function generateInvoicePdf(data: InvoiceData) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const { width } = page.getSize();

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const layout = data.layout || {};

  if (data.logoUrl) {
    try {
      let logoBytes: ArrayBuffer | Uint8Array;
      let mime = "";
      if (data.logoUrl.startsWith("data:")) {
        const [meta, base] = data.logoUrl.split(",", 2);
        mime = meta.split(":")[1].split(";")[0];
        logoBytes = Buffer.from(base, "base64");
      } else {
        const res = await fetch(data.logoUrl);
        mime = res.headers.get("content-type") || "";
        logoBytes = await res.arrayBuffer();
      }
      const logo = mime.includes("png")
        ? await doc.embedPng(logoBytes)
        : await doc.embedJpg(logoBytes);
      const pos = layout.logo || { x: 50, y: 760 };
      page.drawImage(logo, { x: pos.x, y: pos.y, width: 100, height: 50 });
    } catch {
      // ignore
    }
  }

  if (data.header) {
    const pos = layout.header || { x: 50, y: 700 };
    page.drawText(data.header, {
      x: pos.x,
      y: pos.y,
      size: 14,
      font,
    });
  }

  if (data.companyName) {
    const pos = layout.companyName || { x: 50, y: 680 };
    page.drawText(data.companyName, { x: pos.x, y: pos.y, size: 12, font });
  }

  if (data.companyAddress) {
    const pos = layout.companyAddress || { x: 50, y: 660 };
    page.drawText(data.companyAddress, { x: pos.x, y: pos.y, size: 10, font });
  }

  const billPos = layout.billTo || { x: 50, y: 620 };
  page.drawText(`Bill To: ${data.clientName}`, { x: billPos.x, y: billPos.y, size: 12, font });
  const amountPos = layout.amount || { x: 50, y: 600 };
  page.drawText(`Amount Due: $${data.amount.toFixed(2)}`, {
    x: amountPos.x,
    y: amountPos.y,
    size: 12,
    font,
  });
  const duePos = layout.dueDate || { x: 50, y: 580 };
  page.drawText(`Due Date: ${data.dueDate}`, { x: duePos.x, y: duePos.y, size: 12, font });

  if (data.body) {
    const pos = layout.body || { x: 50, y: 540 };
    page.drawText(data.body, { x: pos.x, y: pos.y, size: 12, font, lineHeight: 14 });
  }

  if (data.notes) {
    const pos = layout.notes || { x: 50, y: 520 };
    page.drawText(data.notes, { x: pos.x, y: pos.y, size: 10, font, lineHeight: 12 });
  }

  if (data.footer) {
    const pos = layout.footer || { x: 50, y: 40 };
    page.drawText(data.footer, {
      x: pos.x,
      y: pos.y,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  if (data.terms) {
    const pos = layout.terms || { x: 50, y: 20 };
    page.drawText(data.terms, {
      x: pos.x,
      y: pos.y,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes).toString('base64');
}
