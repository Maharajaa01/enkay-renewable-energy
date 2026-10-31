import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Calculator, Link2, Search, X } from 'lucide-react';
import { EMPTY_INPUTS, READING_LABELS, calculate, inr, oneDecimal, validate } from '../calculator/calculatorLogic';
import type { CalcErrors, CalcInputs, ProjectType } from '../calculator/calculatorLogic';
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

const INPUT_ORDER = ['bill', 'location', 'capacity', 'tariff', 'unitsPerKwp', 'costPerKwp'] as const;

function Field({ id, label, error, children, wide }: { id: string; label: string; error?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`ad-f${wide ? ' is-wide' : ''}`} htmlFor={id}>
      <span>{label}</span>
      {children}
      {error && <small className="ad-ferr" id={`${id}-err`}>{error}</small>}
    </label>
  );
}

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

  const linked = customer.quoteRequestId !== null || customer.contactMessageId !== null;
  const errors: CalcErrors = tried ? validate(inputs) : {};
  const custErrors: CustomerErrors = tried ? validateCustomer(customer) : {};
  // Live estimate as soon as the inputs are valid, so the admin can talk the customer through it.
  const result = useMemo(() => (Object.keys(validate(inputs)).length ? null : calculate(inputs)), [inputs]);

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

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const digits = q.replace(/\D/g, '');
    return leads.filter(l => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      || (digits.length >= 3 && l.phone.replace(/\D/g, '').includes(digits))).slice(0, 6);
  }, [leads, query]);

  const set = <K extends keyof CalcInputs>(key: K, value: CalcInputs[K]) => setInputs(p => ({ ...p, [key]: value }));
  const setCust = (key: 'name' | 'phone' | 'email', value: string) => setCustomer(c => ({ ...c, [key]: value }));

  const pick = (l: Lead) => {
    setCustomer(l.prefill.customer!);
    // Only fill requirement fields the admin hasn't typed yet.
    setInputs(p => {
      const next = { ...p };
      for (const [k, v] of Object.entries(l.prefill.inputs ?? {}) as [keyof CalcInputs, string][]) {
        if (v && (k === 'projectType' || !String(p[k]).trim())) (next[k] as string) = v;
      }
      return next;
    });
    setQuery('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    setSaveError('');
    const ce = validateCustomer(customer);
    const ie = validate(inputs);
    const firstId = ce.name ? 'ac-name' : ce.phone ? 'ac-phone'
      : ie.readings ? `ac-reading-${ie.readings.findIndex(Boolean)}`
      : INPUT_ORDER.filter(k => k in ie).map(k => `ac-${k}`)[0];
    if (firstId) { document.getElementById(firstId)?.focus(); return; }
    setBusy(true);
    try {
      await saveAdminCalculation(inputs, calculate(inputs), customer);
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
                <Field id="ac-location" label="Location *" error={errors.location}>
                  <input className="ad-in" {...aria('ac-location', errors.location)} value={inputs.location} onChange={e => set('location', e.target.value)} />
                </Field>
                <Field id="ac-bill" label="Monthly bill (₹) *" error={errors.bill}>
                  <input className="ad-in" {...aria('ac-bill', errors.bill)} inputMode="decimal" value={inputs.bill} onChange={e => set('bill', e.target.value)} />
                </Field>
              </div>
              <p className="ad-sub">Bi-monthly meter readings (units) *</p>
              <div className="ad-grid is-3">
                {READING_LABELS.map((label, idx) => (
                  <Field key={label} id={`ac-reading-${idx}`} label={`Reading ${idx + 1}`} error={errors.readings?.[idx]}>
                    <input className="ad-in" {...aria(`ac-reading-${idx}`, errors.readings?.[idx])} inputMode="decimal" placeholder="Units"
                      value={inputs.readings[idx]} onChange={e => set('readings', inputs.readings.map((r, j) => (j === idx ? e.target.value : r)))} />
                  </Field>
                ))}
              </div>
            </section>

            {/* ── Assumptions ── */}
            <section className="ad-fs">
              <h3>System &amp; assumptions</h3>
              <div className="ad-grid">
                <Field id="ac-capacity" label="Capacity (kWp) — blank = recommended" error={errors.capacity} wide>
                  <input className="ad-in" {...aria('ac-capacity', errors.capacity)} inputMode="decimal" value={inputs.capacity} onChange={e => set('capacity', e.target.value)} />
                </Field>
                <Field id="ac-tariff" label="Tariff (₹ / unit)" error={errors.tariff}>
                  <input className="ad-in" {...aria('ac-tariff', errors.tariff)} inputMode="decimal" value={inputs.tariff} onChange={e => set('tariff', e.target.value)} />
                </Field>
                <Field id="ac-unitsPerKwp" label="Units / kWp / month" error={errors.unitsPerKwp}>
                  <input className="ad-in" {...aria('ac-unitsPerKwp', errors.unitsPerKwp)} inputMode="decimal" value={inputs.unitsPerKwp} onChange={e => set('unitsPerKwp', e.target.value)} />
                </Field>
                <Field id="ac-costPerKwp" label="Cost per kWp (₹)" error={errors.costPerKwp} wide>
                  <input className="ad-in" {...aria('ac-costPerKwp', errors.costPerKwp)} inputMode="decimal" value={inputs.costPerKwp} onChange={e => set('costPerKwp', e.target.value)} />
                </Field>
              </div>
            </section>
          </div>

          {/* ── Live estimate ── */}
          <aside className="ad-res" aria-live="polite">
            <h3>Estimate</h3>
            {result ? (
              <>
                <div className="ad-res-hero">
                  <span>Monthly saving</span>
                  <b>{result.monthlySaving === null ? '—' : inr(result.monthlySaving)}</b>
                  {result.monthlySaving === null && <small>Enter tariff and units / kWp / month to see savings.</small>}
                </div>
                <dl>
                  <div><dt>System size</dt><dd>{oneDecimal(result.capacityKwp)} kWp{result.capacityProvided ? '' : ' (recommended)'}</dd></div>
                  <div><dt>Recommended size</dt><dd>{oneDecimal(result.recommendedKw)} kWp</dd></div>
                  <div><dt>Annual usage</dt><dd>{Math.round(result.totalUnits).toLocaleString('en-IN')} kWh</dd></div>
                  <div><dt>Daily usage</dt><dd>{oneDecimal(result.dailyUnits)} kWh</dd></div>
                  <div><dt>Annual saving</dt><dd>{result.annualSaving === null ? '—' : inr(result.annualSaving)}</dd></div>
                  <div><dt>Bill with solar</dt><dd>{result.billWithSolar === null ? '—' : `${inr(result.billWithSolar)} / month`}</dd></div>
                  <div><dt>Payback</dt><dd>{result.paybackYears === null ? '—' : `${oneDecimal(result.paybackYears)} years`}</dd></div>
                </dl>
                {result.capped && <p className="ad-hint">Generation exceeds usage — saving is capped at the current bill.</p>}
              </>
            ) : (
              <p className="ad-hint">Fill in the location, monthly bill and at least one meter reading to see the estimate.</p>
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
