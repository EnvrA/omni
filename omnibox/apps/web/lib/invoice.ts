import puppeteer from 'puppeteer';

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

function escapeHtml(value?: string) {
  return (value || '').replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function buildInvoiceHtml(data: InvoiceData) {
  const showTax = data.columns?.tax !== false;
  const smallColWidth = 40 / (showTax ? 4 : 3);
  const items = data.items || [];
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
  const rows = items
    .map((it) => {
      const sub = (parseFloat(it.rate) || 0) * (parseFloat(it.quantity) || 0);
      return `<tr class="border-b align-top"><td>${escapeHtml(it.item)}</td><td class="description">${escapeHtml(
        it.description,
      )}</td><td class="text-right">${escapeHtml(it.quantity)}</td><td class="text-right">${escapeHtml(
        it.rate,
      )}</td>${
        showTax ? `<td class="text-right">${escapeHtml(it.tax)}</td>` : ''
      }<td class="text-right">${sub.toFixed(2)}</td></tr>`;
    })
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
    body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:0;}
    .container{max-width:512px;margin:0 auto;background:#fff;border:1px solid #ccc;border-radius:6px;padding:16px;}
    .flex{display:flex;justify-content:space-between;}
    .info{font-size:14px;margin-top:8px;}
    .whitespace-pre-wrap{white-space:pre-wrap;}
    table{width:100%;border-collapse:collapse;font-size:14px;table-layout:fixed;margin-top:8px;}
    th,td{padding:4px;border-bottom:1px solid #ddd;}
    th{text-align:left;}
    .text-right{text-align:right;}
    .totals{display:flex;justify-content:end;margin-top:8px;font-size:14px;}
    .totals-inner{width:160px;}
    .totals-inner div{display:flex;justify-content:space-between;}
    .notes{margin-top:8px;font-size:14px;white-space:pre-wrap;}
    .terms{margin-top:8px;font-size:12px;color:#6b7280;white-space:pre-wrap;}
    img.logo{height:64px;object-fit:contain;}
  </style></head><body>
  <div class="container">
    <div class="flex">
      <div>
        ${data.logoUrl ? `<img src="${data.logoUrl}" class="logo"/>` : ''}
        <div class="info whitespace-pre-wrap">${escapeHtml(data.companyAddress)}</div>
      </div>
    </div>
    <div class="info">
      <div class="font-semibold">Bill To</div>
      <div class="whitespace-pre-wrap">${escapeHtml(data.clientAddress)}</div>
    </div>
    <div class="info flex" style="gap:16px;flex-wrap:wrap;">
      ${data.invoiceNumber ? `<div>Invoice #: ${escapeHtml(data.invoiceNumber)}</div>` : ''}
      ${data.invoiceDate ? `<div>Invoice Date: ${escapeHtml(data.invoiceDate)}</div>` : ''}
      ${data.dueDate ? `<div>Due Date: ${escapeHtml(data.dueDate)}</div>` : ''}
    </div>
    <table>
      <colgroup>
        <col style="width:20%" />
        <col style="width:40%" />
        <col style="width:${smallColWidth}%" />
        <col style="width:${smallColWidth}%" />
        ${showTax ? `<col style="width:${smallColWidth}%" />` : ''}
        <col style="width:${smallColWidth}%" />
      </colgroup>
      <thead>
        <tr class="border-b text-left">
          <th>Item</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Rate</th>
          ${showTax ? '<th>Tax %</th>' : ''}
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals"><div class="totals-inner">
      <div><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
      ${showTax ? `<div><span>Tax</span><span>${taxTotal.toFixed(2)}</span></div>` : ''}
      <div class="font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
    </div></div>
    ${data.notes ? `<div class="notes">${escapeHtml(data.notes)}</div>` : ''}
    ${data.terms ? `<div class="terms">${escapeHtml(data.terms)}</div>` : ''}
  </div>
  </body></html>`;
}

export async function generateInvoicePdf(data: InvoiceData) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(buildInvoiceHtml(data), { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
  await browser.close();
  return Buffer.from(pdf).toString('base64');
}

