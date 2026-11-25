import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Mail, MapPin, Phone, Printer, X } from 'lucide-react';
import type { CalculatorSubmission } from '../../lib/enquiries';
import { calculateFinancials, formatPayback, formatRupees } from './solarFinancials';

const dash = '—';
const rs = (n: number | null | undefined) => (n === null || n === undefined ? dash : formatRupees(n));
const kw = (n: number | null | undefined) => (n === null || n === undefined ? dash : `${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kWp`);
const longDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const A4_W = 794; // px @96dpi
const A4_H = 1123;

const safeName = (s: string) => s.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'Customer';

/** Uses stored financials; falls back to recomputing from the saved bills for older rows. */
function figures(r: CalculatorSubmission) {
  const f = r.eb_bills
    ? calculateFinancials({ bills: r.eb_bills.map(String), fixedCharges: String(r.monthly_fixed_charges ?? 0), installationCost: String(r.installation_cost ?? 0) })
    : null;
  return {
    annualBill: r.annual_eb_bill ?? f?.annualBill ?? null,
    monthlyAvg: r.monthly_average_bill ?? f?.monthlyAverage ?? null,
    monthlySaving: r.monthly_saving ?? f?.monthlySavings ?? null,
    annualSaving: r.annual_saving ?? f?.annualSavings ?? null,
    payback: r.payback_text ?? (f ? formatPayback(f.paybackMonths) : null) ?? (r.payback_years !== null ? `${r.payback_years} years` : null),
  };
}

function Sheet({ r }: { r: CalculatorSubmission }) {
  const fin = figures(r);
  const name = r.customer_name ?? 'Website visitor';
  const rows: [string, string][] = [
    ['Total annual consumption', `${Math.round(r.total_units).toLocaleString('en-IN')} units`],
    ['Average daily consumption', r.average_daily_units !== null ? `${r.average_daily_units.toLocaleString('en-IN', { maximumFractionDigits: 1 })} units / day` : dash],
    ['Calculated solar capacity', kw(r.calculated_kw)],
    ['Recommended solar capacity', kw(r.recommended_kw)],
    ['Proposed system size', `${kw(r.capacity_kwp)}${r.capacity_provided ? ' (as entered)' : ''}`],
  ];
  const fRows: [string, string][] = [
    ['Annual EB bill', rs(fin.annualBill)],
    ['Monthly average bill', rs(fin.monthlyAvg)],
    ['Monthly fixed charges', rs(r.monthly_fixed_charges)],
    ['Monthly savings', rs(fin.monthlySaving)],
    ['Annual savings', rs(fin.annualSaving)],
    ['Solar installation cost', rs(r.installation_cost)],
  ];
  return (
    <div className="pp-sheet" style={{ width: A4_W, minHeight: A4_H }}>
      <div className="pp-wm" aria-hidden="true"><img src="/enkay-icon.png" alt="" /></div>
      <div className="pp-accent" aria-hidden="true"><i /><i /></div>
      <header className="pp-head">
        <div className="pp-head-row">
          <div className="pp-head-l">
            <img className="pp-logo" src="/enkay-logo.png" alt="ENKAY Renewables Energy" />
            <p className="pp-tag"><span>Capture the Sun,</span> <b>Power Your Future</b></p>
          </div>
          <div className="pp-head-r">
            <h1>SOLAR PROPOSAL</h1>
            <p><span>Date:</span> <b>{shortDate(r.created_at)}</b><em>•</em><span>Ref:</span> <b>CALC-{String(r.id).padStart(5, '0')}</b></p>
          </div>
        </div>
        <ul className="pp-contact">
          <li><i><Phone size={12} aria-hidden="true" /></i>+91 63850 82822</li>
          <li><i><Mail size={12} aria-hidden="true" /></i>support@enkayrenewablesenergy.com</li>
          <li><i><MapPin size={12} aria-hidden="true" /></i>Aminjikarai, Chennai, Tamil Nadu, India</li>
        </ul>
      </header>

      <section className="pp-sec">
        <h2>Customer details</h2>
        <table className="pp-kv"><tbody>
          <tr><th>Name</th><td>{name}</td><th>Project type</th><td>{r.project_type === 'commercial' ? 'Commercial' : 'Residential'}</td></tr>
          <tr><th>Phone</th><td>{r.customer_phone || dash}</td><th>Location</th><td>{r.location || dash}</td></tr>
          <tr><th>Email</th><td colSpan={3}>{r.customer_email || dash}</td></tr>
        </tbody></table>
      </section>

      <section className="pp-sec">
        <h2>Recommended solar system</h2>
        <div className="pp-hero"><span>Recommended capacity</span><b>{kw(r.recommended_kw)}</b></div>
        <table className="pp-list"><tbody>{rows.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
      </section>

      <section className="pp-sec pp-nobreak">
        <h2>Meter readings &amp; EB bills</h2>
        <table className="pp-grid">
          <thead><tr><th>Period</th>{[1, 2, 3, 4, 5, 6].map(n => <th key={n}>{n}</th>)}</tr></thead>
          <tbody>
            <tr><th>Months</th>{[1, 2, 3, 4, 5, 6].map(n => <td key={n}>{n * 2 - 1}–{n * 2}</td>)}</tr>
            <tr><th>Units</th>{[0, 1, 2, 3, 4, 5].map(i => <td key={i}>{r.readings[i] ?? dash}</td>)}</tr>
            <tr><th>EB bill</th>{[0, 1, 2, 3, 4, 5].map(i => <td key={i}>{r.eb_bills ? rs(r.eb_bills[i]) : dash}</td>)}</tr>
          </tbody>
        </table>
      </section>

      <section className="pp-sec pp-nobreak">
        <h2>Financial summary</h2>
        <table className="pp-list"><tbody>{fRows.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
        <div className="pp-hero is-light"><span>Investment payback period</span><b>{fin.payback ?? 'Not applicable'}</b></div>
      </section>

      <footer className="pp-foot">
        Estimates are based only on the values provided and are not a guarantee of savings or subsidy approval. Actual results depend on site conditions, tariff and scheme requirements.
      </footer>
    </div>
  );
}

export default function ProposalPreview({ row, onClose }: { row: CalculatorSubmission; onClose: () => void }) {
  const sheetWrap = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const name = row.customer_name ?? 'Website visitor';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function downloadPdf() {
    const el = sheetWrap.current?.querySelector<HTMLElement>('.pp-sheet');
    if (!el) return;
    setBusy(true); setErr('');
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const scale = 2;
      const canvas = await html2canvas(el, { scale, backgroundColor: '#ffffff', useCORS: true, width: A4_W, windowWidth: A4_W });
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      // Fit the whole capture onto ONE A4 page: scale to the tighter of width/height, then centre.
      const margin = 0;
      const availW = pageW - margin * 2, availH = pageH - margin * 2;
      const ratio = Math.min(availW / canvas.width, availH / canvas.height);
      const w = canvas.width * ratio, h = canvas.height * ratio;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', (pageW - w) / 2, margin, w, h);
      pdf.save(`${safeName(name)}-Solar-Proposal.pdf`);
    } catch (e) {
      console.error('PDF export failed', e);
      setErr('Could not generate the PDF. Please try again or use Print.');
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="pp-portal">
      <div className="pp-bg" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="pp-title">
          <header className="pp-bar">
            <h2 id="pp-title">Proposal Preview</h2>
            <div className="pp-actions">
              <button type="button" className="ad-btn" onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Print</button>
              <button type="button" className="ad-btn is-primary" onClick={downloadPdf} disabled={busy}><Download size={16} aria-hidden="true" />{busy ? 'Preparing…' : 'Download PDF'}</button>
              <button type="button" className="ad-icon" onClick={onClose} aria-label="Close preview"><X size={18} aria-hidden="true" /></button>
            </div>
          </header>
          {err && <p className="ad-err pp-err" role="alert">{err}</p>}
          <div className="pp-scroll">
            <div className="pp-stage" ref={sheetWrap}><Sheet r={row} /></div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
