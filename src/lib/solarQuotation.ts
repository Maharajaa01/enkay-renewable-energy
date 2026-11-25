// Client-ready A4 "Solar Quotation" image, drawn straight onto a canvas (no extra dependencies).
// The page is laid out in A4 CSS pixels (794 × 1123) and rendered at 3× for a crisp, print-safe PNG.
import type { CalculatorSubmission } from './enquiries';
import { formatPayback, formatRupees } from '../components/admin/solarFinancials';
import { setPngDpi } from './contactQr';

const W = 794;
const H = 1123;
const SCALE = 3;
const M = 44; // print-safe side margin

const C = {
  forest: '#143D29',
  green: '#4CAF50',
  gold: '#C5A059',
  slate: '#1F2937',
  muted: '#6B7280',
  line: '#E5E7EB',
  tint: '#F2F8F3',
  card: '#F8FAF8',
  white: '#FFFFFF',
};
const FONT = 'Inter, "Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';

const COMPANY = {
  phone: '+91 63850 82822',
  email: 'support@enkayrenewablesenergy.com',
  location: 'Aminjikarai, Chennai, Tamil Nadu, India',
};

// Lucide icon paths (24×24, stroke) for the footer.
const ICONS = {
  phone: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'],
  mail: ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'm22 6-10 7L2 6'],
  pin: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
};

type Ctx = CanvasRenderingContext2D;
type Align = 'left' | 'center' | 'right';
interface TextOpts { size?: number; weight?: number; color?: string; align?: Align; maxW?: number; spacing?: number }

const dash = '—';
const numFmt = (n: number | null | undefined, max = 1) =>
  n === null || n === undefined || !Number.isFinite(n) ? dash : n.toLocaleString('en-IN', { maximumFractionDigits: max });
const kwp = (n: number | null | undefined, max = 1) => (n === null || n === undefined ? dash : `${numFmt(n, max)} kWp`);
const rupees = (n: number | null | undefined) => (n === null || n === undefined || !Number.isFinite(n) ? dash : formatRupees(n));
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : dash);
const text = (s: string | null | undefined) => (s && s.trim() ? s.trim() : dash);

const setFont = (ctx: Ctx, size: number, weight: number) => { ctx.font = `${weight} ${size}px ${FONT}`; };
const setSpacing = (ctx: Ctx, px: number) => { if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${px}px`; };

/** Draws one line of text; shrinks to fit `maxW`, and as a last resort truncates with an ellipsis. */
function put(ctx: Ctx, s: string, x: number, y: number, o: TextOpts = {}) {
  let size = o.size ?? 11;
  const weight = o.weight ?? 400;
  const spacing = o.spacing ?? 0;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = o.align ?? 'left';
  ctx.fillStyle = o.color ?? C.slate;
  setSpacing(ctx, spacing);
  setFont(ctx, size, weight);
  if (o.maxW) {
    const floor = size * 0.7;
    while (ctx.measureText(s).width > o.maxW && size > floor) { size -= 0.25; setFont(ctx, size, weight); }
    if (ctx.measureText(s).width > o.maxW) {
      while (s.length > 1 && ctx.measureText(`${s}…`).width > o.maxW) s = s.slice(0, -1);
      s = `${s}…`;
    }
  }
  ctx.fillText(s, x, y);
  setSpacing(ctx, 0);
  return ctx.measureText(s).width;
}

const width = (ctx: Ctx, s: string, size: number, weight: number, spacing = 0) => {
  setSpacing(ctx, spacing); setFont(ctx, size, weight);
  const w = ctx.measureText(s).width;
  setSpacing(ctx, 0);
  return w;
};

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function box(ctx: Ctx, x: number, y: number, w: number, h: number, o: { r?: number; fill?: string; stroke?: string; lw?: number }) {
  roundRect(ctx, x, y, w, h, o.r ?? 8);
  if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw ?? 1; ctx.stroke(); }
}

const hline = (ctx: Ctx, x1: number, x2: number, y: number, color: string, lw = 1) => {
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
};

/** Section heading with a short gold accent underneath. */
function heading(ctx: Ctx, s: string, y: number) {
  put(ctx, s, M, y, { size: 11, weight: 700, color: C.forest, spacing: 1.4 });
  hline(ctx, M, M + 28, y + 7, C.gold, 2);
  hline(ctx, M + 28, W - M, y + 7, C.line, 1);
}

function icon(ctx: Ctx, paths: string[], x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const p of paths) ctx.stroke(new Path2D(p));
  ctx.restore();
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('Could not load the ENKAY logo'));
  img.src = src;
});

async function ensureFonts() {
  try {
    await Promise.all([400, 500, 600, 700, 800].map(w => document.fonts.load(`${w} 16px Inter`)));
    await document.fonts.ready;
  } catch { /* falls back to the system sans-serif */ }
}

export const quotationRef = (row: CalculatorSubmission) => `ENK-SQ-${String(row.id).padStart(4, '0')}`;
export const quotationFilename = (row: CalculatorSubmission) =>
  `Solar-Quotation-${quotationRef(row)}-${(row.customer_name ?? row.location ?? 'customer').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')}.png`;

/** Renders the quotation for one saved calculation and resolves with a 300-DPI PNG. */
export async function buildSolarQuotationPng(row: CalculatorSubmission, logoUrl = '/assets/enkay-logo.png'): Promise<Blob> {
  const [logo] = await Promise.all([loadImage(logoUrl), ensureFonts()]);

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, W, H);

  const CW = W - M * 2;

  // ── 1. Header ───────────────────────────────────────────────
  const logoH = 58;
  ctx.drawImage(logo, M, 38, (logoH * logo.width) / logo.height, logoH);
  put(ctx, 'SOLAR QUOTATION', W - M, 58, { size: 22, weight: 800, color: C.forest, align: 'right', spacing: 1 });
  const issued = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const meta = (label: string, value: string, y: number) => {
    const vw = put(ctx, value, W - M, y, { size: 10.5, weight: 600, color: C.slate, align: 'right' });
    put(ctx, `${label}  `, W - M - vw, y, { size: 9, weight: 600, color: C.muted, align: 'right', spacing: 0.8 });
  };
  meta('DATE OF ISSUE', issued, 78);
  meta('REFERENCE', quotationRef(row), 94);
  hline(ctx, M, W - M, 118, C.line, 1);
  hline(ctx, M, M + 90, 118, C.gold, 2.5);

  // ── 2. Customer + system cards ──────────────────────────────
  const gap = 16;
  const cardW = (CW - gap) / 2;
  const cardY = 140;
  const cardH = 184;

  // Customer
  box(ctx, M, cardY, cardW, cardH, { r: 10, fill: C.card, stroke: C.line });
  put(ctx, 'CUSTOMER DETAILS', M + 18, cardY + 28, { size: 10, weight: 700, color: C.forest, spacing: 1.2 });
  hline(ctx, M + 18, M + 46, cardY + 36, C.gold, 2);
  const customer: [string, string][] = [
    ['Name', text(row.customer_name)],
    ['Phone', text(row.customer_phone)],
    ['Email', text(row.customer_email)],
    ['Project Type', cap(row.project_type)],
    ['Location', text(row.location)],
  ];
  customer.forEach(([label, value], i) => {
    const y = cardY + 62 + i * 24;
    put(ctx, label.toUpperCase(), M + 18, y, { size: 8.5, weight: 600, color: C.muted, spacing: 0.8 });
    put(ctx, value, M + 100, y, { size: 11.5, weight: i === 0 ? 700 : 500, maxW: cardW - 100 - 18 });
  });

  // Proposed system
  const sx = M + cardW + gap;
  box(ctx, sx, cardY, cardW, cardH, { r: 10, fill: C.tint, stroke: 'rgba(76,175,80,0.45)' });
  put(ctx, 'PROPOSED SOLAR SYSTEM', sx + 18, cardY + 28, { size: 10, weight: 700, color: C.forest, spacing: 1.2 });
  hline(ctx, sx + 18, sx + 46, cardY + 36, C.gold, 2);
  put(ctx, 'RECOMMENDED SIZE', sx + 18, cardY + 66, { size: 8.5, weight: 600, color: C.muted, spacing: 0.8 });
  const rec = row.recommended_kw === null || row.recommended_kw === undefined ? dash : numFmt(row.recommended_kw, 1);
  const recW = put(ctx, rec, sx + 18, cardY + 112, { size: 46, weight: 800, color: C.forest, maxW: cardW - 36 - 60 });
  if (rec !== dash) put(ctx, 'kWp', sx + 18 + recW + 8, cardY + 112, { size: 18, weight: 700, color: C.green });
  hline(ctx, sx + 18, sx + cardW - 18, cardY + 130, 'rgba(20,61,41,0.12)', 1);
  const half = (cardW - 36) / 2;
  const sub = (label: string, value: string, x: number) => {
    put(ctx, label, x, cardY + 150, { size: 8.5, weight: 600, color: C.muted, spacing: 0.8 });
    put(ctx, value, x, cardY + 168, { size: 13, weight: 700, maxW: half - 10 });
  };
  sub('CALCULATED SIZE', kwp(row.calculated_kw, 2), sx + 18);
  sub('SYSTEM SIZE', kwp(row.capacity_kwp, 2), sx + 18 + half);

  // ── 3. Financial & savings ──────────────────────────────────
  let y = 358;
  heading(ctx, 'FINANCIAL & SAVINGS SUMMARY', y);
  y += 24;

  const heroH = 92;
  box(ctx, M, y, CW, heroH, { r: 10, fill: C.tint, stroke: 'rgba(76,175,80,0.45)' });
  ctx.fillStyle = C.green;
  roundRect(ctx, M, y, 6, heroH, 3); ctx.fill();
  put(ctx, 'ESTIMATED SOLAR INSTALLATION COST', M + 28, y + 34, { size: 9.5, weight: 700, color: C.muted, spacing: 1 });
  put(ctx, rupees(row.installation_cost), M + 28, y + 74, { size: 36, weight: 800, color: C.forest, maxW: CW - 56 });
  y += heroH + 14;

  const cols = 3;
  const mGap = 12;
  const mW = (CW - mGap * (cols - 1)) / cols;
  const mH = 74;
  const payback = row.payback_text ?? (row.payback_years !== null && row.payback_years !== undefined ? formatPayback(Math.round(row.payback_years * 12)) : dash);
  const metrics: [string, string, boolean?][] = [
    ['MONTHLY SAVING', rupees(row.monthly_saving)],
    ['ANNUAL SAVING', rupees(row.annual_saving)],
    ['PAYBACK PERIOD', payback, true],
    ['ANNUAL EB BILL', rupees(row.annual_eb_bill)],
    ['MONTHLY AVERAGE BILL', rupees(row.monthly_average_bill)],
    ['MONTHLY FIXED CHARGES', rupees(row.monthly_fixed_charges)],
  ];
  metrics.forEach(([label, value, pill], i) => {
    const mx = M + (i % cols) * (mW + mGap);
    const my = y + Math.floor(i / cols) * (mH + mGap);
    box(ctx, mx, my, mW, mH, { r: 10, fill: C.white, stroke: C.line });
    put(ctx, label, mx + 16, my + 28, { size: 8.5, weight: 600, color: C.muted, spacing: 0.8, maxW: mW - 32 });
    if (pill) {
      const size = 12.5;
      const pw = Math.min(width(ctx, value, size, 700) + 28, mW - 32);
      box(ctx, mx + 16, my + 38, pw, 26, { r: 13, fill: C.green });
      put(ctx, value, mx + 16 + pw / 2, my + 56, { size, weight: 700, color: C.white, align: 'center', maxW: pw - 20 });
    } else {
      put(ctx, value, mx + 16, my + 58, { size: 19, weight: 700, color: C.slate, maxW: mW - 32 });
    }
  });
  y += mH * 2 + mGap + 36;

  // ── 4. Energy consumption ───────────────────────────────────
  heading(ctx, 'ENERGY CONSUMPTION & BI-MONTHLY BREAKDOWN', y);
  y += 24;
  const stripH = 54;
  box(ctx, M, y, CW, stripH, { r: 10, fill: C.card, stroke: C.line });
  const halfW = CW / 2;
  const strip = (label: string, value: string, unit: string, x: number) => {
    put(ctx, label, x + 18, y + 22, { size: 8.5, weight: 600, color: C.muted, spacing: 0.8 });
    const vw = put(ctx, value, x + 18, y + 43, { size: 17, weight: 700, color: C.forest, maxW: halfW - 100 });
    if (value !== dash) put(ctx, unit, x + 18 + vw + 6, y + 43, { size: 10.5, weight: 600, color: C.muted });
  };
  strip('ANNUAL UNITS', numFmt(row.total_units, 0), 'kWh', M);
  strip('AVERAGE DAILY UNITS', numFmt(row.average_daily_units ?? row.total_units / 365, 1), 'units / day', M + halfW);
  ctx.strokeStyle = C.line; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(M + halfW, y + 10); ctx.lineTo(M + halfW, y + stripH - 10); ctx.stroke();
  y += stripH + 26;

  const table = (title: string, prefix: string, values: (number | null | undefined)[], fmt: (n: number | null | undefined) => string) => {
    put(ctx, title, M, y, { size: 9, weight: 700, color: C.forest, spacing: 1 });
    y += 10;
    const headH = 26;
    const rowH = 36;
    const cw = CW / 6;
    box(ctx, M, y, CW, headH + rowH, { r: 8, fill: C.white, stroke: C.line });
    ctx.save();
    roundRect(ctx, M, y, CW, headH + rowH, 8); ctx.clip();
    ctx.fillStyle = C.forest; ctx.fillRect(M, y, CW, headH);
    ctx.restore();
    for (let i = 0; i < 6; i++) {
      const cx = M + i * cw + cw / 2;
      put(ctx, `${prefix}${i + 1}`, cx, y + 17.5, { size: 10, weight: 700, color: C.white, align: 'center', spacing: 0.6 });
      put(ctx, fmt(values[i]), cx, y + headH + 23, { size: 13, weight: 600, align: 'center', maxW: cw - 14 });
      if (i > 0) { ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(M + i * cw, y + headH); ctx.lineTo(M + i * cw, y + headH + rowH); ctx.stroke(); }
    }
    y += headH + rowH + 26;
  };
  table('BI-MONTHLY READINGS (kWh)', 'R', row.readings ?? [], n => numFmt(n, 1));
  table('BI-MONTHLY EB BILLS (₹)', 'B', row.eb_bills ?? [], n => (n === null || n === undefined ? dash : rupees(n)));

  put(ctx, 'This quotation is an estimate based on the consumption and electricity bill data provided.', W / 2, 1123 - 96 - 14,
    { size: 8.5, weight: 500, color: C.muted, align: 'center', maxW: CW });

  // ── 5. Footer ───────────────────────────────────────────────
  const fh = 72;
  ctx.fillStyle = C.forest; ctx.fillRect(0, H - fh, W, fh);
  ctx.fillStyle = C.gold; ctx.fillRect(0, H - fh, W, 2.5);
  const items: [string[], string][] = [[ICONS.phone, COMPANY.phone], [ICONS.mail, COMPANY.email], [ICONS.pin, COMPANY.location]];
  const iconS = 14;
  const iconGap = 7;
  let fs = 10.5;
  const total = (s: number) => items.reduce((sum, [, t]) => sum + iconS + iconGap + width(ctx, t, s, 500), 0);
  while (total(fs) > CW - 40 && fs > 8) fs -= 0.25;
  const free = (CW - total(fs)) / (items.length - 1);
  let fx = M;
  const fy = H - fh / 2 + 3.8 + 1;
  for (const [paths, label] of items) {
    icon(ctx, paths, fx, fy - 11.5, iconS, C.green);
    put(ctx, label, fx + iconS + iconGap, fy, { size: fs, weight: 500, color: C.white });
    fx += iconS + iconGap + width(ctx, label, fs, 500) + free;
  }

  const blob: Blob = await new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('Quotation export failed'))), 'image/png'));
  const bytes = setPngDpi(new Uint8Array(await blob.arrayBuffer()), 288); // 3× of 96 CSS px/in
  return new Blob([bytes as BlobPart], { type: 'image/png' });
}
