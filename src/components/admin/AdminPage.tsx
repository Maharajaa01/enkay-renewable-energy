import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Calculator, ChevronDown, Download, Eye, EyeOff, FileText, Inbox, Lock, LogOut, MapPin, Mail, MessageSquare, Phone, Pencil, Plus, QrCode, RefreshCw, Search, Sun, Trash2, User,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ENQUIRY_STATUSES, deleteEnquiries, deleteEnquiry, listCalculationsFor, listEnquiries, setEnquiryStatus } from '../../lib/enquiries';
import type { CalculatorSubmission, ContactMessage, EnquiryStatus, EnquiryTable, QuoteRequest } from '../../lib/enquiries';
import { CONTACT_URL, buildQrPng, buildQrSvg, logoToDataUri, saveBlob } from '../../lib/contactQr';
import AdminCalculator, { prefillFromContact, prefillFromQuote, prefillFromSaved } from './AdminCalculator';
import type { CalcPrefill } from './AdminCalculator';
import './admin.css';

type Row = QuoteRequest | ContactMessage | CalculatorSubmission;

// Supabase Auth signs in by email, so each admin username maps to its account email.
const ADMIN_USERS: Record<string, string> = {
  administrator: 'administrator@enkayrenewable.in',
};

const LOGIN_PATH = '/admin';
const PAGES: { path: string; table: EnquiryTable; label: string; icon: typeof FileText }[] = [
  { path: '/admin/get-a-quote', table: 'quote_requests', label: 'Get a Quote', icon: FileText },
  { path: '/admin/contact-us', table: 'contact_messages', label: 'Contact Us', icon: MessageSquare },
  { path: '/admin/calculator', table: 'calculator_submissions', label: 'Calculator', icon: Calculator },
];

const QR_PATH = '/admin/qr-code';
const NAV_ITEMS: { path: string; label: string; icon: typeof FileText }[] = [
  ...PAGES,
  { path: QR_PATH, label: 'QR Code', icon: QrCode },
];

const currentPath = () => window.location.pathname.replace(/\/+$/, '') || '/';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

const isQuote = (r: Row): r is QuoteRequest => 'details' in r;
const isCalc = (r: Row): r is CalculatorSubmission => 'total_units' in r;

const num = (n: number | null, unit = '') => (n === null ? null : `${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })}${unit}`);
const money2 = (n: number | null) => (n === null ? null : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
const rupees = (n: number | null) => (n === null ? null : `₹${Math.round(n).toLocaleString('en-IN')}`);

// Website calculator runs are anonymous, so the location stands in for a name.
const rowTitle = (r: Row) => (isCalc(r) ? r.customer_name ?? r.location : r.name);
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const TABLE_INFO: Record<EnquiryTable, { intro: string; cols: [string, string, string] }> = {
  quote_requests: { intro: 'Quote requests submitted from the website.', cols: ['Name', 'Contact', 'Project'] },
  contact_messages: { intro: 'Messages submitted through the Contact Us form.', cols: ['Name', 'Contact', 'Subject'] },
  calculator_submissions: { intro: 'Website calculator estimates, and calculations saved for customers by the team.', cols: ['Customer', 'Contact', 'System & savings'] },
};

// ── Login ────────────────────────────────────────────────────────────────
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const email = ADMIN_USERS[username.trim().toLowerCase()];
    if (!email) { setError('Invalid username or password.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message === 'Invalid login credentials' ? 'Invalid username or password.' : error.message);
  };

  return (
    <div className="ad-login">
      <div>
      <form className="ad-card ad-login-card" onSubmit={submit}>
        <img className="ad-brand-logo" src="/assets/enkay-logo.png" alt="ENKAY Renewables Energy" />
        <h1>Administrator Login</h1>
        <p>ENKAY Renewables Energy — sign in to manage enquiries.</p>
        <label>Username
          <span className="ad-field"><User size={16} aria-hidden="true" />
            <input required autoComplete="username" placeholder="Administrator" value={username} onChange={e => setUsername(e.target.value)} />
          </span>
        </label>
        <label>Password
          <span className="ad-field"><Lock size={16} aria-hidden="true" />
            <input type={show ? 'text' : 'password'} required autoComplete="current-password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" className="ad-icon" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </span>
        </label>
        {error && <p className="ad-err" role="alert">{error}</p>}
        <button className="ad-btn is-primary" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
      </form>
      <p className="ad-login-foot">© {new Date().getFullYear()} ENKAY Renewables Energy · Admin access only</p>
      </div>
    </div>
  );
}

// ── Detail fields shown when a row is expanded ───────────────────────────
function Details({ row }: { row: Row }) {
  const items: [string, string | null][] = isCalc(row)
    ? [
        ...(row.source === 'admin' ? [
          ['Customer', row.customer_name],
          ['Phone', row.customer_phone],
          ['Email', row.customer_email],
          ['Linked enquiry', row.quote_request_id !== null ? `Get a Quote #${row.quote_request_id}` : row.contact_message_id !== null ? `Contact Us #${row.contact_message_id}` : 'None'],
        ] as [string, string | null][] : []),
        ['Source', row.source === 'admin' ? 'Saved by admin' : 'Website visitor'],
        ['Project type', cap(row.project_type)],
        ['Location', row.location],
        ['Monthly bill', rupees(row.monthly_bill)],
        ['Annual units', num(row.total_units, ' kWh')],
        ['Average daily units', num(row.average_daily_units, ' units / day')],
        ['Calculated size', num(row.calculated_kw, ' kWp')],
        ['System size', `${num(row.capacity_kwp, ' kWp')} (${row.capacity_provided ? 'entered' : 'recommended'})`],
        ['Recommended size', num(row.recommended_kw, ' kWp')],
        ['Annual EB bill', rupees(row.annual_eb_bill)],
        ['Monthly average bill', money2(row.monthly_average_bill)],
        ['Monthly fixed charges', rupees(row.monthly_fixed_charges)],
        ['Solar installation cost', rupees(row.installation_cost)],
        ['Monthly saving', money2(row.monthly_saving)],
        ['Annual saving', rupees(row.annual_saving)],
        ['Payback', row.payback_text ?? num(row.payback_years, ' years')],
        ['Bi-monthly readings', row.readings.map((u, i) => `R${i + 1}: ${u ?? '—'}`).join('  ·  ')],
        ...(row.eb_bills ? [['Bi-monthly EB bills', row.eb_bills.map((b, i) => `B${i + 1}: ${rupees(b)}`).join('  ·  ')] as [string, string | null]] : []),
      ]
    : isQuote(row)
    ? [
        ['Source', row.source === 'quote_page' ? 'Get a Quote page' : 'Quick quote popup'],
        ['Project type', row.project_type && cap(row.project_type)],
        ['Capacity', row.capacity],
        ['Location', row.location],
        ['Monthly bill / requirement', row.bill],
        ['Details', row.details],
      ]
    : [['Subject', row.subject], ['Message', row.message]];
  return (
    <dl className="ad-details">
      {items.map(([k, v]) => (
        <div key={k} className={k === 'Details' || k === 'Message' || k === 'Bi-monthly readings' || k === 'Bi-monthly EB bills' ? 'is-wide' : ''}><dt>{k}</dt><dd>{v || '—'}</dd></div>
      ))}
    </dl>
  );
}

// ── Calculations saved against one enquiry ───────────────────────────────
function LinkedCalcs({ col, id, version, onNew }: { col: 'quote_request_id' | 'contact_message_id'; id: number; version: number; onNew: () => void }) {
  const [calcs, setCalcs] = useState<CalculatorSubmission[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setCalcs(null);
    setError('');
    listCalculationsFor(col === 'quote_request_id' ? { quote_request_id: id } : { contact_message_id: id })
      .then(c => { if (live) setCalcs(c); })
      .catch(ex => { if (live) setError((ex as Error).message); });
    return () => { live = false; };
  }, [col, id, version]);

  return (
    <div className="ad-lc">
      <div className="ad-lc-hd">
        <h4><Calculator size={15} aria-hidden="true" />Solar calculations</h4>
        <button className="ad-btn is-xs" onClick={onNew}><Plus size={14} aria-hidden="true" />New calculation</button>
      </div>
      {error ? <p className="ad-err">{error}</p>
        : !calcs ? <p className="ad-hint">Loading…</p>
        : !calcs.length ? <p className="ad-hint">No calculations yet. Call the customer, then add one with their requirement.</p>
        : (
          <ul>
            {calcs.map(c => (
              <li key={c.id}>
                <span className="ad-lc-date">{fmtDate(c.created_at)}</span>
                <b>{num(c.capacity_kwp, ' kWp')}</b>
                <span>{rupees(c.monthly_bill)}/mo bill</span>
                {c.monthly_saving !== null && <span>{rupees(c.monthly_saving)}/mo saving</span>}
                {c.payback_years !== null && <span>{num(c.payback_years)} yr payback</span>}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

function toCsv(rows: Row[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map(r => cols.map(c => esc((r as unknown as Record<string, unknown>)[c])).join(','))].join('\n');
}

// ── One list page (Get a Quote or Contact Us) ────────────────────────────
function ListPage({ table, label }: { table: EnquiryTable; label: string }) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | 'all'>('all');
  const [open, setOpen] = useState<number | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  // Open calculator dialog (with its customer), and a counter that refreshes linked-calculation lists after a save.
  const [calc, setCalc] = useState<CalcPrefill | null>(null);
  const [calcVersion, setCalcVersion] = useState(0);
  // Id of the saved calculation being edited (calculator list only).
  const [editId, setEditId] = useState<number | undefined>();
  const isCalcPage = table === 'calculator_submissions';
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3500); return () => clearTimeout(t); }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setData(await listEnquiries<Row>(table)); }
    catch (ex) { setError((ex as Error).message); }
    finally { setLoading(false); }
  }, [table]);

  useEffect(() => { setData([]); setOpen(null); setConfirmDel(null); setSelected(new Set()); setBulkConfirm(false); load(); }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter(r =>
      (statusFilter === 'all' || r.status === statusFilter) &&
      (!q || Object.values(r).some(v => typeof v === 'string' && v.toLowerCase().includes(q))));
  }, [data, query, statusFilter]);

  // Pagination (calculator list only). Clamping covers deleting the last row of the last page.
  useEffect(() => { setPage(1); }, [query, statusFilter, pageSize]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleRows = isCalcPage ? rows.slice(pageStart, pageStart + pageSize) : rows;

  const selectedInView = visibleRows.filter(r => selected.has(r.id)).length;
  const allSelected = visibleRows.length > 0 && selectedInView === visibleRows.length;
  const toggleAll = () => setSelected(prev => {
    const n = new Set(prev);
    visibleRows.forEach(r => (allSelected ? n.delete(r.id) : n.add(r.id)));
    return n;
  });
  const toggleOne = (id: number) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const counts = ENQUIRY_STATUSES.map(s => [s, data.filter(r => r.status === s).length] as const);

  const patch = (id: number, next: { status: EnquiryStatus } | null) =>
    setData(d => (next ? d.map(r => (r.id === id ? { ...r, ...next } : r)) : d.filter(r => r.id !== id)));

  const changeStatus = async (id: number, status: EnquiryStatus) => {
    const prev = data.find(r => r.id === id)?.status;
    patch(id, { status });
    try { await setEnquiryStatus(table, id, status); }
    catch (ex) { if (prev) patch(id, { status: prev }); setError((ex as Error).message); }
  };

  const remove = async (id: number) => {
    setConfirmDel(null);
    try { await deleteEnquiry(table, id); patch(id, null); }
    catch (ex) { setError((ex as Error).message); }
  };

  // Only ids that still exist in the list count, so a stale selection can't inflate the number.
  const selectedIds = isCalcPage ? data.filter(r => selected.has(r.id)).map(r => r.id) : [];
  useEffect(() => { if (!selectedIds.length) setBulkConfirm(false); }, [selectedIds.length]);

  const bulkDelete = async () => {
    const ids = selectedIds;
    setBulkBusy(true);
    setError('');
    try {
      const removed = new Set(await deleteEnquiries(table, ids));
      setData(d => d.filter(r => !removed.has(r.id)));
      setSelected(new Set());
      setOpen(null);
      setBulkConfirm(false);
      if (removed.size === ids.length) setToast(`${removed.size} calculation${removed.size === 1 ? '' : 's'} deleted.`);
      else setError(`Only ${removed.size} of ${ids.length} could be deleted. Please sign in again and retry.`);
    } catch (ex) { setError((ex as Error).message); }
    finally { setBulkBusy(false); }
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${table}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>{label} List</h1>
          <p>{TABLE_INFO[table].intro}</p>
        </div>
        <div className="ad-counts">
          {selectedIds.length > 0 && (
            bulkConfirm ? (
              <span className="ad-confirm ad-bulk-confirm" role="alertdialog" aria-label="Confirm delete">
                Delete {selectedIds.length} selected calculation{selectedIds.length === 1 ? '' : 's'}?
                <button className="ad-btn is-danger is-xs" onClick={bulkDelete} disabled={bulkBusy}>{bulkBusy ? 'Deleting…' : 'Yes'}</button>
                <button className="ad-btn is-xs" onClick={() => setBulkConfirm(false)} disabled={bulkBusy}>No</button>
              </span>
            ) : (
              <button className="ad-btn is-danger ad-bulk-del" onClick={() => setBulkConfirm(true)} aria-label={`Delete ${selectedIds.length} selected`}>
                <Trash2 size={16} aria-hidden="true" />Delete ({selectedIds.length})
              </button>
            )
          )}
          <span><b>{data.length}</b>Total</span>
          {counts.map(([s, n]) => <span key={s} className={`is-${s}`}><b>{n}</b>{cap(s)}</span>)}
        </div>
      </div>

      <section className="ad-card ad-panel">
        <div className="ad-toolbar">
          {isCalcPage && (
            <button className="ad-btn is-primary ad-new" onClick={() => { setEditId(undefined); setCalc({}); }}><Plus size={16} aria-hidden="true" />New calculation</button>
          )}
          <label className="ad-search"><Search size={16} aria-hidden="true" />
            <input type="search" placeholder={isCalcPage ? 'Search customer, phone, location…' : 'Search name, email, phone…'} value={query} onChange={e => setQuery(e.target.value)} aria-label="Search" />
          </label>
          <div className="ad-tools">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as EnquiryStatus | 'all')} aria-label="Filter by status">
              <option value="all">All statuses</option>
              {ENQUIRY_STATUSES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
            </select>
            <button className="ad-btn" onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? 'is-spin' : ''} aria-hidden="true" />Refresh</button>
            <button className="ad-btn" onClick={exportCsv} disabled={!rows.length}><Download size={16} aria-hidden="true" />CSV</button>
          </div>
        </div>

        {error && <p className="ad-err" role="alert">{error}</p>}

        {!loading && !rows.length ? (
          <div className="ad-empty"><Inbox size={36} aria-hidden="true" /><p>{data.length ? 'No entries match your filters.' : 'No submissions yet.'}</p></div>
        ) : (
          <div className={`ad-table-wrap${isCalcPage ? " ad-is-calc" : ""}`}>
            <table className="ad-table">
              <thead>
                {isCalcPage ? (
                  <tr>
                    <th className="ad-col-sel">
                      <input type="checkbox" className="ad-check" aria-label="Select all"
                        checked={allSelected} ref={el => { if (el) el.indeterminate = selectedInView > 0 && !allSelected; }}
                        onChange={toggleAll} />
                    </th>
                    <th className="ad-col-sno">S.No</th>
                    <th>Customer</th>
                    <th>Location</th>
                    <th>Contact</th>
                    <th>System &amp; savings</th>
                    <th className="ad-nowrap">Date</th>
                    <th className="ad-nowrap">Status</th>
                    <th className="ad-nowrap ad-th-action">Action</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Date</th>
                    {TABLE_INFO[table].cols.map(c => <th key={c}>{c}</th>)}
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                )}
              </thead>
              <tbody>
                {visibleRows.map((r, idx) => (
                  <RowView
                    key={r.id}
                    row={r}
                    index={pageStart + idx + 1}
                    selected={selected.has(r.id)}
                    onSelect={() => toggleOne(r.id)}
                    expanded={open === r.id}
                    confirming={confirmDel === r.id}
                    onToggle={() => setOpen(o => (o === r.id ? null : r.id))}
                    onStatus={s => changeStatus(r.id, s)}
                    onAskDelete={() => setConfirmDel(r.id)}
                    onCancelDelete={() => setConfirmDel(null)}
                    onDelete={() => remove(r.id)}
                    onEdit={isCalcPage ? () => { setEditId(r.id); setCalc(prefillFromSaved(r as CalculatorSubmission)); } : undefined}
                    onCalculate={isCalcPage ? undefined : () => setCalc(isQuote(r) ? prefillFromQuote(r) : prefillFromContact(r as ContactMessage))}
                    calcVersion={calcVersion}
                  />
                ))}
              </tbody>
            </table>
            {loading && <p className="ad-loading">Loading…</p>}
          </div>
        )}

        {isCalcPage && (
          <div className="ad-pager">
            <div className="ad-pager-l">
              <label className="ad-pager-size">Rows per page:
                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} aria-label="Rows per page">
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <span className="ad-pager-range">
                {rows.length ? `Showing ${pageStart + 1}–${pageStart + visibleRows.length} of ${rows.length}` : 'Showing 0 of 0'}
              </span>
            </div>
            <div className="ad-pager-r">
              <button type="button" className="ad-btn" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>Prev</button>
              <span className="ad-pager-page">Page {currentPage} of {totalPages}</span>
              <button type="button" className="ad-btn" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>Next</button>
            </div>
          </div>
        )}
      </section>

      {toast && <div className="ad-toast" role="status">{toast}</div>}

      {calc && (
        <AdminCalculator
          prefill={calc}
          editId={editId}
          onClose={() => { setCalc(null); setEditId(undefined); }}
          onSaved={() => { setToast(editId !== undefined ? 'Calculation updated successfully.' : 'Calculation saved successfully.'); if (isCalcPage) load(); else setCalcVersion(v => v + 1); }}
        />
      )}
    </>
  );
}

interface RowViewProps {
  row: Row;
  index: number;
  selected: boolean;
  onSelect: () => void;
  expanded: boolean;
  confirming: boolean;
  onToggle: () => void;
  onStatus: (s: EnquiryStatus) => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  /** Opens the calculator for this enquiry's customer (enquiry lists only). */
  onCalculate?: () => void;
  /** Opens the saved calculation for editing (calculator list only). */
  onEdit?: () => void;
  calcVersion: number;
}

function RowView({ row, index, selected, onSelect, expanded, confirming, onToggle, onStatus, onAskDelete, onCancelDelete, onDelete, onCalculate, onEdit, calcVersion }: RowViewProps) {
  const summary = isCalc(row)
    ? num(row.capacity_kwp, ' kWp')
    : isQuote(row)
    ? [row.project_type && cap(row.project_type), row.capacity, row.location].filter(Boolean).join(' · ') || row.details || '—'
    : row.subject;
  const title = isCalc(row) ? row.customer_name ?? 'Website visitor' : rowTitle(row);
  return (
    <>
      <tr className={`${expanded ? 'is-open' : ''}${row.status === 'new' ? ' is-new' : ''}${isCalc(row) ? ' is-calc-row' : ''}${selected ? ' is-selected' : ''}`}
        onClick={isCalc(row) ? e => { if (!(e.target as HTMLElement).closest('input, select, button, a, label')) onToggle(); } : undefined}
        aria-expanded={isCalc(row) ? expanded : undefined}>
        {isCalc(row) && (
          <>
            <td className="ad-col-sel"><input type="checkbox" className="ad-check" checked={selected} onChange={onSelect} onClick={e => e.stopPropagation()} aria-label={`Select ${title}`} /></td>
            <td className="ad-col-sno">{index}</td>
          </>
        )}
        {!isCalc(row) && <td className="ad-date">{fmtDate(row.created_at)}</td>}
        <td className="ad-name"><b>{title}</b></td>
        {isCalc(row) && (
          <td className="ad-loc">{row.location ? <><MapPin size={13} aria-hidden="true" />{row.location}</> : '—'}</td>
        )}
        <td className="ad-contact">
          {isCalc(row) ? (
            <>
              {row.customer_phone ? <a href={telHref(row.customer_phone)}><Phone size={13} aria-hidden="true" />{row.customer_phone}</a> : <span>—</span>}
            </>
          ) : (
            <>
              <a href={telHref(row.phone)}><Phone size={13} aria-hidden="true" />{row.phone}</a>
              {row.email && <a href={`mailto:${row.email}`}><Mail size={13} aria-hidden="true" />{row.email}</a>}
            </>
          )}
        </td>
        <td className="ad-summary">{summary}</td>
        {isCalc(row) && <td className="ad-date ad-nowrap">{fmtDate(row.created_at)}</td>}
        <td className="ad-st ad-nowrap">
          <select className={`ad-status is-${row.status}`} value={row.status} onChange={e => onStatus(e.target.value as EnquiryStatus)} aria-label={`Status for ${title}`}>
            {ENQUIRY_STATUSES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
          </select>
        </td>
        <td className="ad-actions">
          {confirming ? (
            <span className="ad-confirm">
              Delete?
              <button className="ad-btn is-danger is-xs" onClick={onDelete}>Yes</button>
              <button className="ad-btn is-xs" onClick={onCancelDelete}>No</button>
            </span>
          ) : (
            <>
              {onEdit && (
                <button className="ad-icon is-edit" onClick={onEdit} aria-label={`Edit calculation for ${title}`} title="Edit"><Pencil size={16} aria-hidden="true" /></button>
              )}
              {onCalculate && (
                <button className="ad-icon is-calc" onClick={onCalculate} aria-label={`Solar calculation for ${title}`} title="Solar calculation"><Calculator size={16} aria-hidden="true" /></button>
              )}
              {!isCalc(row) && <button className="ad-icon" onClick={onToggle} aria-expanded={expanded} aria-label={expanded ? 'Hide details' : 'Show details'}>
                <ChevronDown size={18} className={expanded ? 'is-flip' : ''} aria-hidden="true" />
              </button>}
              {!isCalc(row) && <button className="ad-icon is-danger" onClick={onAskDelete} aria-label={`Delete entry from ${title}`}><Trash2 size={16} aria-hidden="true" /></button>}
            </>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="ad-detail-row">
          <td colSpan={isCalc(row) ? 9 : 6}>
            <Details row={row} />
            {onCalculate && <LinkedCalcs col={isQuote(row) ? 'quote_request_id' : 'contact_message_id'} id={row.id} version={calcVersion} onNew={onCalculate} />}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Contact Us QR code (download for print / marketing) ──────────────────
function QrPanel() {
  const [svg, setSvg] = useState('');
  const [busy, setBusy] = useState<'' | 'png' | 'svg'>('');
  const [error, setError] = useState('');

  useEffect(() => {
    logoToDataUri().then(d => setSvg(buildQrSvg(d))).catch(() => setError('Could not load the ENKAY logo for the QR code.'));
  }, []);

  const download = async (kind: 'png' | 'svg') => {
    if (!svg) return;
    setBusy(kind); setError('');
    try {
      if (kind === 'svg') saveBlob(new Blob([svg], { type: 'image/svg+xml' }), 'enkay-contact-us-qr.svg');
      else saveBlob(await buildQrPng(svg), 'enkay-contact-us-qr.png');
    } catch {
      setError('Download failed. Please try again.');
    } finally { setBusy(''); }
  };

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Contact Us QR Code</h1>
          <p>Customers who scan this with their phone camera open the public Contact Us page.</p>
        </div>
      </div>
      <div className="ad-card ad-qr">
        <div className="ad-qr-preview">
          {svg ? <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt="ENKAY Contact Us QR code" /> : <p className="ad-loading">{error || 'Preparing QR code…'}</p>}
        </div>
        <div className="ad-qr-side">
          <h2>Download</h2>
          <p>Links to <a href={CONTACT_URL} target="_blank" rel="noreferrer">{CONTACT_URL}</a></p>
          <ul>
            <li><strong>PNG</strong> – 3000 × 3420 px at 300 DPI (about 25 cm wide). Ready for brochures, banners and visiting cards.</li>
            <li><strong>SVG</strong> – vector file that scales to any size without losing sharpness. Best for large banners and printers.</li>
          </ul>
          <div className="ad-qr-actions">
            <button className="ad-btn is-primary" disabled={!svg || !!busy} onClick={() => download('png')}><Download size={16} aria-hidden="true" />{busy === 'png' ? 'Preparing…' : 'Download PNG'}</button>
            <button className="ad-btn is-primary" disabled={!svg || !!busy} onClick={() => download('svg')}><Download size={16} aria-hidden="true" />{busy === 'svg' ? 'Preparing…' : 'Download SVG'}</button>
          </div>
          {error && svg && <p className="ad-qr-error" role="alert">{error}</p>}
          <p className="ad-qr-tip">Tip: keep at least 2 cm printed size and print on a light background.</p>
        </div>
      </div>
    </>
  );
}

// ── Page shell: auth gate + admin routes ─────────────────────────────────
export default function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [path, setPath] = useState(currentPath);

  const go = useCallback((to: string, replace = false) => {
    if (currentPath() !== to) window.history[replace ? 'replaceState' : 'pushState']({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    const onPop = () => setPath(currentPath());
    window.addEventListener('popstate', onPop);
    // Back/forward cache can restore a stale admin DOM after logout – force a fresh auth check.
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) window.location.reload(); };
    window.addEventListener('pageshow', onShow);
    return () => { sub.subscription.unsubscribe(); window.removeEventListener('popstate', onPop); window.removeEventListener('pageshow', onShow); };
  }, []);

  // A row in public.admins is visible only to that admin (RLS), so finding one confirms access.
  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  const page = PAGES.find(p => p.path === path);
  const isQr = path === QR_PATH;
  const authed = !!session && isAdmin === true;

  // Logged out → login page; logged in on /admin (or unknown sub-path) → first list page.
  useEffect(() => {
    if (session === undefined || (session && isAdmin === null)) return;
    if (!authed && path !== LOGIN_PATH) go(LOGIN_PATH, true);
    else if (authed && !page && !isQr) go(PAGES[0].path, true);
  }, [session, isAdmin, authed, path, page, isQr, go]);

  useEffect(() => {
    document.title = `${authed && page ? `${page.label} List` : authed && isQr ? 'Contact Us QR Code' : 'Administrator Login'} · ENKAY Admin`;
  }, [authed, page, isQr]);

  if (session === undefined || (session && isAdmin === null)) return <div className="ad-login"><p className="ad-loading">Loading…</p></div>;
  if (!session) return <Login />;
  if (!isAdmin) {
    return (
      <div className="ad-login">
        <div className="ad-card ad-login-card">
          <span className="ad-logo"><Lock size={24} aria-hidden="true" /></span>
          <h1>Access denied</h1>
          <p>This account is not an administrator.</p>
          <button className="ad-btn" onClick={() => supabase.auth.signOut()}><LogOut size={16} aria-hidden="true" />Sign out</button>
        </div>
      </div>
    );
  }
  if (!page && !isQr) return <div className="ad-login"><p className="ad-loading">Loading…</p></div>;

  return (
    <div className="ad">
      <header className="ad-top">
        <div className="ad-brand"><span className="ad-logo is-sm"><Sun size={18} aria-hidden="true" /></span>ENKAY Admin</div>
        <nav className="ad-nav" aria-label="Admin pages">
          {NAV_ITEMS.map(({ path: p, label, icon: Icon }) => (
            <a key={p} href={p} className={p === path ? 'is-on' : ''} aria-current={p === path ? 'page' : undefined}
              onClick={e => { e.preventDefault(); go(p); }}>
              <Icon size={16} aria-hidden="true" />{label}
            </a>
          ))}
        </nav>
        <div className="ad-user">
          <span><User size={15} aria-hidden="true" />{(session.user.user_metadata?.username as string) || 'Administrator'}</span>
          <button className="ad-btn" onClick={async () => { await supabase.auth.signOut(); window.location.replace('/'); }}>
            <LogOut size={16} aria-hidden="true" />Logout
          </button>
        </div>
      </header>

      <main className="ad-main">
        {page ? <ListPage key={page.table} table={page.table} label={page.label} /> : <QrPanel />}
      </main>
    </div>
  );
}
