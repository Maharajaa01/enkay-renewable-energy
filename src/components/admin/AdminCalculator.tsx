import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Calculator, Link2, Search, X, Zap } from 'lucide-react';
import { EMPTY_INPUTS, READING_LABELS, calculate, parseNum, recommendedCapacityKw, calculatedCapacityKw, totalAnnualUnits } from '../calculator/calculatorLogic';
import type { CalcInputs, ProjectType } from '../calculator/calculatorLogic';
import { listEnquiries, saveAdminCalculation } from '../../lib/enquiries';
import type { CalcCustomer, ContactMessage, QuoteRequest } from '../../lib/enquiries';

/** What the calculator opens with: the customer (and their enquiry) plus any requirement already known. */
export interface CalcPrefill {
  customer?: CalcCustomer;
  inputs?: Partial<CalcInputs>;
}

const NO_CUSTOMER: CalcCustomer = { name: '', phone: '', email: '', quoteRequestId: null, contactMessageId: null };

// Quote fields are free text ("5 kW", "₹4,500"), so pull out the first number for the calculator.
const firstNumber = (s: string | null) => s?.replace(/,/g, '').match(/\d+(\.\d+)?/)?.[0] ?? '';

export const prefillFromQuote = (q: QuoteRequest): CalcPrefill => ({
  customer: { name: q.name, phone: q.phone, email: q.email ?? '', quoteRequestId: q.id, contactMessageId: null },
  inputs: {
    ...(q.project_type ? { projectType: q.project_type } : {}),
    location: q.location ?? '',
    bill: firstNumber(q.bill),
    capacity: firstNumber(q.capacity),
  },
});

export const prefillFromContact = (c: ContactMessage): CalcPrefill => ({
  customer: { name: c.name, phone: c.phone, email: c.email, quoteRequestId: null, contactMessageId: c.id },
});

interface Lead { key: string; kind: 'Quote' | 'Contact'; name: string; phone: string; email: string; prefill: CalcPrefill }

type CustomerErrors = Partial<Record<'name' | 'phone', string>>;
const validateCustomer = (c: CalcCustomer): CustomerErrors => ({
  ...(c.name.trim() ? {} : { name: 'Enter the customer name.' }),
  ...(c.phone.replace(/\D/g, '').length >= 6 ? {} : { phone: 'Enter a valid phone number.' }),
});

function Field({ id, label, error, children, wide }: { id: string; label: string; error?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`ad-f${wide ? ' is-wide' : ''}`} htmlFor={id}>
      <span>{label}</span>
      {children}
      {error && <small className="ad-ferr" id={`${id}-err`}>{error}</small>}
    </label>
  );
}

/** Client's formula: Daily ÷ (4.5 × 0.8), rounded UP to next 0.5 kW. */
interface SolarCalcResult {
  totalUnits: number;
  dailyUnits: number;
  calculatedKw: number;
  recommendedKw: number;
}

function calcSolarCapacity(readings: string[]): SolarCalcResult | null {
  const nums = readings.map(r => parseNum(r));
  if (nums.some(n => isNaN(n) || n < 0)) return null;
  const totalUnits = totalAnnualUnits(nums);
  const dailyUnits = totalUnits / 365;
  const calculatedKw = calculatedCapacityKw(totalUnits);
  const recommendedKw = recommendedCapacityKw(calculatedKw);
  return { totalUnits, dailyUnits, calculatedKw, recommendedKw };
}

const fmt1 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const fmt2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

interface Props {
  prefill?: CalcPrefill;
  onClose: () => void;
  onSaved: () => void;
}

export default function AdminCalculator({ prefill, onClose, onSaved }: Props) {
  const [inputs, setInputs] = useState<CalcInputs>({ ...EMPTY_INPUTS, ...prefill?.inputs });
  const [customer, setCustomer] = useState<CalcCustomer>(prefill?.customer ?? NO_CUSTOMER);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);

  // Solar capacity result — only set when user clicks "Calculate Solar Capacity"
  const [calcResult, setCalcResult] = useState<SolarCalcResult | null>(null);
  const [calcError, setCalcError] = useState('');
  // Track readings snapshot at time of calculation to detect stale results
  const [calcReadings, setCalcReadings] = useState<string[]>([]);
  const isStale = calcResult !== null && inputs.readings.some((r, i) => r !== calcReadings[i]);

  const linked = customer.quoteRequestId !== null || customer.contactMessageId !== null;
  const custErrors: CustomerErrors = tried ? validateCustomer(customer) : {};

  // Escape closes, and the page behind doesn't scroll while the dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  // Enquiries the admin can attach this calculation to.
  useEffect(() => {
    if (prefill?.customer) return;
    Promise.all([listEnquiries<QuoteRequest>('quote_requests'), listEnquiries<ContactMessage>('contact_messages')])
      .then(([quotes, contacts]) => setLeads([
        ...quotes.map(q => ({ key: `q${q.id}`, kind: 'Quote' as const, name: q.name, phone: q.phone, email: q.email ?? '', prefill: prefillFromQuote(q) })),
        ...contacts.map(c => ({ key: `c${c.id}`, kind: 'Contact' as const, name: c.name, phone: c.phone, email: c.email, prefill: prefillFromContact(c) })),
      ]))
      .catch(err => console.error('Could not load enquiries', err));
  }, [prefill?.customer]);

  const matches = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const digits = q.replace(/\D/g, '');
    return leads.filter(l => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      || (digits.length >= 3 && l.phone.replace(/\D/g, '').includes(digits))).slice(0, 6);
  })();

  const set = <K extends keyof CalcInputs>(key: K, value: CalcInputs[K]) => setInputs(p => ({ ...p, [key]: value }));
  const setCust = (key: 'name' | 'phone' | 'email', value: string) => setCustomer(c => ({ ...c, [key]: value }));

  const pick = (l: Lead) => {
    setCustomer(l.prefill.customer!);
    setInputs(p => {
      const next = { ...p };
      for (const [k, v] of Object.entries(l.prefill.inputs ?? {}) as [keyof CalcInputs, string][]) {
        if (v && (k === 'projectType' || !String(p[k]).trim())) (next[k] as string) = v;
      }
      return next;
    });
    setQuery('');
  };

  const handleCalculate = () => {
    setCalcError('');
    // Validate: all 6 readings required and must be valid non-negative numbers
    const hasEmpty = inputs.readings.some(r => r.trim() === '');
    if (hasEmpty) {
      setCalcResult(null);
      setCalcError('Please enter all six meter readings before calculating.');
      return;
    }
    const hasInvalid = inputs.readings.some(r => {
      const v = parseNum(r);
      return isNaN(v) || v < 0;
    });
    if (hasInvalid) {
      setCalcResult(null);
      setCalcError('Please enter valid non-negative numbers for all six readings.');
      return;
    }
    const result = calcSolarCapacity(inputs.readings);
    if (!result) {
      setCalcResult(null);
      setCalcError('Could not calculate. Please check your readings.');
      return;
    }
    setCalcResult(result);
    setCalcReadings([...inputs.readings]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    setSaveError('');
    const ce = validateCustomer(customer);
    // For save: validate customer + at least readings filled
    const readingsEmpty = inputs.readings.every(r => r.trim() === '');
    const readingsInvalid = inputs.readings.some(r => r.trim() !== '' && (isNaN(parseNum(r)) || parseNum(r) < 0));
    if (ce.name || ce.phone || readingsEmpty || readingsInvalid) {
      if (ce.name) { document.getElementById('ac-name')?.focus(); return; }
      if (ce.phone) { document.getElementById('ac-phone')?.focus(); return; }
      if (readingsEmpty || readingsInvalid) { document.getElementById('ac-reading-0')?.focus(); return; }
    }
    setBusy(true);
    try {
      // Build a minimal CalcInputs for save — use calculated capacity from new formula
      const solarResult = calcSolarCapacity(inputs.readings);
      const saveInputs: CalcInputs = {
        ...EMPTY_INPUTS,
        ...inputs,
        // Store recommended capacity so it propagates correctly
        capacity: solarResult ? String(solarResult.recommendedKw) : inputs.capacity,
      };
      await saveAdminCalculation(saveInputs, calculate(saveInputs), customer);
      onSaved();
      onClose();
    } catch (ex) {
      setSaveError((ex as Error).message);
      setBusy(false);
    }
  };

  const aria = (id: string, err?: string) => ({ id, 'aria-invalid': err ? true : undefined, 'aria-describedby': err ? `${id}-err` : undefined });

  return (
    <div className="ad-modal-bg" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="ad-modal" role="dialog" aria-modal="true" aria-labelledby="ac-title" onSubmit={submit} noValidate>
        <header className="ad-modal-hd">
          <h2 id="ac-title"><Calculator size={20} aria-hidden="true" />Solar calculation</h2>
          <button ref={closeRef} type="button" className="ad-icon" onClick={onClose} aria-label="Close"><X size={20} aria-hidden="true" /></button>
        </header>

        <div className="ad-modal-body">
          {/* ── LEFT: Customer + Readings ── */}
          <div className="ad-calc-form">
            {/* ── Customer ── */}
            <section className="ad-fs">
              <h3>Customer</h3>
              {linked ? (
                <p className="ad-link-chip">
                  <Link2 size={15} aria-hidden="true" />
                  <span>Linked to {customer.quoteRequestId !== null ? `quote request #${customer.quoteRequestId}` : `contact message #${customer.contactMessageId}`}</span>
                  {!prefill?.customer && (
                    <button type="button" className="ad-icon" onClick={() => setCustomer(NO_CUSTOMER)} aria-label="Remove link"><X size={15} aria-hidden="true" /></button>
                  )}
                </p>
              ) : (
                <div className="ad-pick">
                  <label className="ad-search"><Search size={16} aria-hidden="true" />
                    <input type="search" placeholder="Find an enquiry by name, phone or email…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Find an enquiry" />
                  </label>
                  {matches.length > 0 && (
                    <ul className="ad-pick-list">
                      {matches.map(l => (
                        <li key={l.key}>
                          <button type="button" onClick={() => pick(l)}>
                            <b>{l.name}</b><span>{l.phone}{l.email && ` · ${l.email}`}</span><em>{l.kind}</em>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {query.trim() && !matches.length && <p className="ad-hint">No matching enquiry — enter the customer's details below.</p>}
                </div>
              )}
              <div className="ad-grid">
                <Field id="ac-name" label="Name *" error={custErrors.name}>
                  <input className="ad-in" {...aria('ac-name', custErrors.name)} autoComplete="off" value={customer.name} onChange={e => setCust('name', e.target.value)} />
                </Field>
                <Field id="ac-phone" label="Phone *" error={custErrors.phone}>
                  <input className="ad-in" {...aria('ac-phone', custErrors.phone)} type="tel" inputMode="tel" autoComplete="off" value={customer.phone} onChange={e => setCust('phone', e.target.value)} />
                </Field>
                <Field id="ac-email" label="Email" wide>
                  <input className="ad-in" id="ac-email" type="email" autoComplete="off" value={customer.email} onChange={e => setCust('email', e.target.value)} />
                </Field>
              </div>
            </section>

            {/* ── Requirement ── */}
            <section className="ad-fs">
              <h3>Requirement</h3>
              <div className="ad-seg" role="radiogroup" aria-label="Project type">
                {(['residential', 'commercial'] as ProjectType[]).map(t => (
                  <button key={t} type="button" role="radio" aria-checked={inputs.projectType === t}
                    className={inputs.projectType === t ? 'is-on' : ''} onClick={() => set('projectType', t)}>
                    {t === 'residential' ? 'Residential' : 'Commercial'}
                  </button>
                ))}
              </div>
              <div className="ad-grid">
                <Field id="ac-location" label="Location" error={tried && !inputs.location.trim() ? 'Enter location.' : undefined}>
                  <input className="ad-in" id="ac-location" value={inputs.location} onChange={e => set('location', e.target.value)} />
                </Field>
                <Field id="ac-bill" label="Monthly bill (₹)">
                  <input className="ad-in" id="ac-bill" inputMode="decimal" value={inputs.bill} onChange={e => set('bill', e.target.value)} />
                </Field>
              </div>
            </section>

            {/* ── Meter Readings ── */}
            <section className="ad-fs">
              <h3>Bi-monthly meter readings (units)</h3>
              <div className="ad-grid is-3">
                {READING_LABELS.map((_, idx) => (
                  <Field key={idx} id={`ac-reading-${idx}`} label={`Reading ${idx + 1}`}>
                    <input
                      className="ad-in"
                      id={`ac-reading-${idx}`}
                      inputMode="decimal"
                      placeholder="Units"
                      value={inputs.readings[idx]}
                      onChange={e => set('readings', inputs.readings.map((r, j) => (j === idx ? e.target.value : r)))}
                    />
                  </Field>
                ))}
              </div>
              <p className="ad-hint" style={{ fontSize: '12px', marginTop: '2px' }}>
                Six bi-monthly readings covering 12 months (Reading 1: months 1–2, Reading 6: months 11–12).
              </p>
            </section>
          </div>

          {/* ── RIGHT: Calculate Button + Results ── */}
          <aside className="ad-solar-panel" aria-live="polite">
            <button
              type="button"
              className="ad-calc-btn"
              onClick={handleCalculate}
            >
              <Zap size={18} aria-hidden="true" />
              Calculate Solar Capacity
            </button>

            {calcError && (
              <p className="ad-calc-val-err" role="alert">{calcError}</p>
            )}

            {!calcResult && !calcError && (
              <div className="ad-solar-hint">
                <p>Enter all six meter readings and click <strong>Calculate Solar Capacity</strong> to see your recommended solar system size.</p>
              </div>
            )}

            {calcResult && (
              <div className={`ad-solar-result${isStale ? ' is-stale' : ''}`}>
                {isStale && (
                  <p className="ad-solar-stale-msg">⚠ Readings changed — click Calculate to update.</p>
                )}

                {/* Hero: Recommended Capacity */}
                <div className="ad-solar-hero">
                  <span className="ad-solar-hero-label">Recommended Solar Capacity</span>
                  <div className="ad-solar-hero-value">
                    {fmt1(calcResult.recommendedKw)}
                    <span className="ad-solar-hero-unit">kW</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="ad-solar-breakdown">
                  <h4 className="ad-solar-breakdown-title">Calculation Breakdown</h4>
                  <dl className="ad-solar-dl">
                    <div>
                      <dt>Total Annual Consumption</dt>
                      <dd>{Math.round(calcResult.totalUnits).toLocaleString('en-IN')} Units</dd>
                    </div>
                    <div>
                      <dt>Average Daily Consumption</dt>
                      <dd>{fmt1(calcResult.dailyUnits)} Units / day</dd>
                    </div>
                    <div>
                      <dt>Calculated Solar Capacity</dt>
                      <dd>{fmt2(calcResult.calculatedKw)} kW</dd>
                    </div>
                    <div className="is-highlight">
                      <dt>Recommended Solar Capacity</dt>
                      <dd><strong>{fmt1(calcResult.recommendedKw)} kW</strong></dd>
                    </div>
                  </dl>
                  <p className="ad-solar-formula-note">
                    Formula: Daily ÷ (4.5 × 0.8), rounded up to next 0.5 kW
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>

        <footer className="ad-modal-ft">
          {saveError && <p className="ad-err" role="alert">{saveError}</p>}
          <button type="button" className="ad-btn" onClick={onClose}>Cancel</button>
          <button className="ad-btn is-primary" disabled={busy}>{busy ? 'Saving…' : 'Save calculation'}</button>
        </footer>
      </form>
    </div>
  );
}
