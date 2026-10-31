import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Calculator, ChevronDown, Download, Eye, EyeOff, FileText, Inbox, Lock, LogOut, Mail, MessageSquare, Phone, Plus, RefreshCw, Search, Sun, Trash2, User,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ENQUIRY_STATUSES, deleteEnquiry, listCalculationsFor, listEnquiries, setEnquiryStatus } from '../../lib/enquiries';
import type { CalculatorSubmission, ContactMessage, EnquiryStatus, EnquiryTable, QuoteRequest } from '../../lib/enquiries';
import AdminCalculator, { prefillFromContact, prefillFromQuote } from './AdminCalculator';
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

const currentPath = () => window.location.pathname.replace(/\/+$/, '') || '/';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

const isQuote = (r: Row): r is QuoteRequest => 'details' in r;
const isCalc = (r: Row): r is CalculatorSubmission => 'total_units' in r;

const num = (n: number | null, unit = '') => (n === null ? null : `${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })}${unit}`);
const rupees = (n: number | null) => (n === null ? null : `₹${Math.round(n).toLocaleString('en-IN')}`);

// Website calculator runs are anonymous, so the location stands in for a name.
const rowTitle = (r: Row) => (isCalc(r) ? r.customer_name ?? r.location : r.name);
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const TABLE_INFO: Record<EnquiryTable, { intro: string; cols: [string, string, string] }> = {
  quote_requests: { intro: 'Quote requests submitted from the website.', cols: ['Name', 'Contact', 'Project'] },
  contact_messages: { intro: 'Messages submitted through the Contact Us form.', cols: ['Name', 'Contact', 'Subject'] },
  calculator_submissions: { intro: 'Website calculator estimates, and calculations saved for customers by the team.', cols: ['Customer / location', 'Contact & usage', 'System & savings'] },
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
        <p>ENKAY Renewable Energy — sign in to manage enquiries.</p>
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
      <p className="ad-login-foot">© {new Date().getFullYear()} ENKAY Renewable Energy · Admin access only</p>
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
        ['System size', `${num(row.capacity_kwp, ' kWp')} (${row.capacity_provided ? 'entered' : 'recommended'})`],
        ['Recommended size', num(row.recommended_kw, ' kWp')],
        ['Tariff', row.tariff === null ? null : `₹${row.tariff} / unit`],
        ['Units per kWp / month', num(row.units_per_kwp)],
        ['Cost per kWp', rupees(row.cost_per_kwp)],
        ['Monthly saving', rupees(row.monthly_saving)],
        ['Annual saving', rupees(row.annual_saving)],
        ['Payback', num(row.payback_years, ' years')],
        ['Bi-monthly readings', row.readings.map((u, i) => `R${i + 1}: ${u ?? '—'}`).join('  ·  ')],
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
        <div key={k} className={k === 'Details' || k === 'Message' || k === 'Bi-monthly readings' ? 'is-wide' : ''}><dt>{k}</dt><dd>{v || '—'}</dd></div>
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
  const isCalcPage = table === 'calculator_submissions';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setData(await listEnquiries<Row>(table)); }
    catch (ex) { setError((ex as Error).message); }
    finally { setLoading(false); }
  }, [table]);

  useEffect(() => { setData([]); setOpen(null); setConfirmDel(null); load(); }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter(r =>
      (statusFilter === 'all' || r.status === statusFilter) &&
      (!q || Object.values(r).some(v => typeof v === 'string' && v.toLowerCase().includes(q))));
  }, [data, query, statusFilter]);

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
          <span><b>{data.length}</b>Total</span>
          {counts.map(([s, n]) => <span key={s} className={`is-${s}`}><b>{n}</b>{cap(s)}</span>)}
        </div>
      </div>

      <section className="ad-card ad-panel">
        <div className="ad-toolbar">
          {isCalcPage && (
            <button className="ad-btn is-primary ad-new" onClick={() => setCalc({})}><Plus size={16} aria-hidden="true" />New calculation</button>
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
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Date</th>
                  {TABLE_INFO[table].cols.map(c => <th key={c}>{c}</th>)}
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <RowView
                    key={r.id}
                    row={r}
                    expanded={open === r.id}
                    confirming={confirmDel === r.id}
                    onToggle={() => setOpen(o => (o === r.id ? null : r.id))}
                    onStatus={s => changeStatus(r.id, s)}
                    onAskDelete={() => setConfirmDel(r.id)}
                    onCancelDelete={() => setConfirmDel(null)}
                    onDelete={() => remove(r.id)}
                    onCalculate={isCalcPage ? undefined : () => setCalc(isQuote(r) ? prefillFromQuote(r) : prefillFromContact(r as ContactMessage))}
                    calcVersion={calcVersion}
                  />
                ))}
              </tbody>
            </table>
            {loading && <p className="ad-loading">Loading…</p>}
          </div>
        )}
      </section>

      {calc && (
        <AdminCalculator
          prefill={calc}
          onClose={() => setCalc(null)}
          onSaved={() => (isCalcPage ? load() : setCalcVersion(v => v + 1))}
        />
      )}
    </>
  );
}

interface RowViewProps {
  row: Row;
  expanded: boolean;
  confirming: boolean;
  onToggle: () => void;
  onStatus: (s: EnquiryStatus) => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  /** Opens the calculator for this enquiry's customer (enquiry lists only). */
  onCalculate?: () => void;
  calcVersion: number;
}

function RowView({ row, expanded, confirming, onToggle, onStatus, onAskDelete, onCancelDelete, onDelete, onCalculate, calcVersion }: RowViewProps) {
  const summary = isCalc(row)
    ? [num(row.capacity_kwp, ' kWp'), row.monthly_saving !== null && `${rupees(row.monthly_saving)}/mo saving`, row.payback_years !== null && `${num(row.payback_years)} yr payback`].filter(Boolean).join(' · ')
    : isQuote(row)
    ? [row.project_type && cap(row.project_type), row.capacity, row.location].filter(Boolean).join(' · ') || row.details || '—'
    : row.subject;
  const title = rowTitle(row);
  return (
    <>
      <tr className={`${expanded ? 'is-open' : ''}${row.status === 'new' ? ' is-new' : ''}`}>
        <td className="ad-date">{fmtDate(row.created_at)}</td>
        <td className="ad-name"><b>{title}</b></td>
        <td className="ad-contact">
          {isCalc(row) ? (
            <>
              {row.customer_phone && <a href={telHref(row.customer_phone)}><Phone size={13} aria-hidden="true" />{row.customer_phone}</a>}
              <span>{rupees(row.monthly_bill)} / month bill</span>
              <span>{cap(row.project_type)} · {num(row.total_units, ' kWh')} / yr</span>
            </>
          ) : (
            <>
              <a href={telHref(row.phone)}><Phone size={13} aria-hidden="true" />{row.phone}</a>
              {row.email && <a href={`mailto:${row.email}`}><Mail size={13} aria-hidden="true" />{row.email}</a>}
            </>
          )}
        </td>
        <td className="ad-summary">{summary}</td>
        <td className="ad-st">
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
              {onCalculate && (
                <button className="ad-icon is-calc" onClick={onCalculate} aria-label={`Solar calculation for ${title}`} title="Solar calculation"><Calculator size={16} aria-hidden="true" /></button>
              )}
              <button className="ad-icon" onClick={onToggle} aria-expanded={expanded} aria-label={expanded ? 'Hide details' : 'Show details'}>
                <ChevronDown size={18} className={expanded ? 'is-flip' : ''} aria-hidden="true" />
              </button>
              <button className="ad-icon is-danger" onClick={onAskDelete} aria-label={`Delete entry from ${title}`}><Trash2 size={16} aria-hidden="true" /></button>
            </>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="ad-detail-row">
          <td colSpan={6}>
            <Details row={row} />
            {onCalculate && <LinkedCalcs col={isQuote(row) ? 'quote_request_id' : 'contact_message_id'} id={row.id} version={calcVersion} onNew={onCalculate} />}
          </td>
        </tr>
      )}
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
    return () => { sub.subscription.unsubscribe(); window.removeEventListener('popstate', onPop); };
  }, []);

  // A row in public.admins is visible only to that admin (RLS), so finding one confirms access.
  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  const page = PAGES.find(p => p.path === path);
  const authed = !!session && isAdmin === true;

  // Logged out → login page; logged in on /admin (or unknown sub-path) → first list page.
  useEffect(() => {
    if (session === undefined || (session && isAdmin === null)) return;
    if (!authed && path !== LOGIN_PATH) go(LOGIN_PATH, true);
    else if (authed && !page) go(PAGES[0].path, true);
  }, [session, isAdmin, authed, path, page, go]);

  useEffect(() => {
    document.title = `${authed && page ? `${page.label} List` : 'Administrator Login'} · ENKAY Admin`;
  }, [authed, page]);

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
  if (!page) return <div className="ad-login"><p className="ad-loading">Loading…</p></div>;

  return (
    <div className="ad">
      <header className="ad-top">
        <div className="ad-brand"><span className="ad-logo is-sm"><Sun size={18} aria-hidden="true" /></span>ENKAY Admin</div>
        <nav className="ad-nav" aria-label="Admin pages">
          {PAGES.map(({ path: p, label, icon: Icon }) => (
            <a key={p} href={p} className={p === path ? 'is-on' : ''} aria-current={p === path ? 'page' : undefined}
              onClick={e => { e.preventDefault(); go(p); }}>
              <Icon size={16} aria-hidden="true" />{label}
            </a>
          ))}
        </nav>
        <div className="ad-user">
          <span><User size={15} aria-hidden="true" />{(session.user.user_metadata?.username as string) || 'Administrator'}</span>
          <button className="ad-btn" onClick={async () => { await supabase.auth.signOut(); go(LOGIN_PATH, true); }}>
            <LogOut size={16} aria-hidden="true" />Logout
          </button>
        </div>
      </header>

      <main className="ad-main">
        <ListPage key={page.table} table={page.table} label={page.label} />
      </main>
    </div>
  );
}
