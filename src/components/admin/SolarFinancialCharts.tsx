import { useId, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { formatPayback, formatRupees, moneyValue } from './solarFinancials';
import type { FinancialResult } from './solarFinancials';

/**
 * Solar Financial Analytics — presentational only. All numbers come from
 * calculateFinancials() (passed in as `fin`); nothing is recalculated here
 * except chart geometry. Dependency-free inline SVG.
 */
interface Props {
  bills: string[];
  fixedCharges: string;
  installationCost: string;
  fin: FinancialResult;
}

type Tab = 'trend' | 'compare' | 'recovery';
const TABS: { id: Tab; label: string }[] = [
  { id: 'trend', label: 'Bill Trend' },
  { id: 'compare', label: 'Savings Comparison' },
  { id: 'recovery', label: 'Investment Recovery' },
];

const W = 640, H = 300, PL = 64, PR = 16, PT = 24, PB = 44;
const IW = W - PL - PR, IH = H - PT - PB;

/** Compact Indian axis label: ₹12k, ₹1.6L, ₹2.5Cr. */
function axisLabel(n: number): string {
  const a = Math.abs(n);
  const f = (v: number) => String(Math.round(v * 10) / 10);
  if (a >= 1e7) return `₹${f(n / 1e7)}Cr`;
  if (a >= 1e5) return `₹${f(n / 1e5)}L`;
  if (a >= 1e3) return `₹${f(n / 1e3)}k`;
  return `₹${Math.round(n)}`;
}

/** Round the axis max up to a "nice" number so ticks are tidy. */
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

function Grid({ max }: { max: number }) {
  return (
    <g className="ad-fc-grid">
      {[0, 1, 2, 3, 4].map(i => {
        const y = PT + IH - (IH * i) / 4;
        return (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} />
            <text x={PL - 8} y={y + 4} textAnchor="end">{axisLabel((max * i) / 4)}</text>
          </g>
        );
      })}
    </g>
  );
}

export default function SolarFinancialCharts({ bills, fixedCharges, installationCost, fin }: Props) {
  const [tab, setTab] = useState<Tab>('compare');
  const [hover, setHover] = useState<string | null>(null);
  const uid = useId();

  const billValues = bills.map(moneyValue);
  const fixed = moneyValue(fixedCharges);
  const cost = moneyValue(installationCost);

  // ── Bar helper (shared by the two bar charts) ──
  const bars = (items: { key: string; label: string; value: number; cls: string }[]) => {
    const max = niceMax(Math.max(...items.map(i => i.value), 0));
    const slot = IW / items.length;
    const bw = Math.min(slot * 0.56, 72);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="ad-fc-svg" role="img"
        aria-label={items.map(i => `${i.label}: ${formatRupees(i.value)}`).join(', ')}>
        <Grid max={max} />
        {items.map((it, i) => {
          const h = Math.max((Math.max(it.value, 0) / max) * IH, 0);
          const x = PL + slot * i + (slot - bw) / 2;
          const y = PT + IH - h;
          return (
            <g key={it.key} tabIndex={0} className="ad-fc-bargroup"
              onMouseEnter={() => setHover(it.key)} onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(it.key)} onBlur={() => setHover(null)}>
              <title>{`${it.label}: ${formatRupees(it.value)}`}</title>
              <rect x={PL + slot * i} y={PT} width={slot} height={IH} fill="transparent" />
              <rect className={`ad-fc-bar ${it.cls}${hover === it.key ? ' is-hover' : ''}`} x={x} y={y} width={bw} height={h} rx={6} />
              <text className="ad-fc-val" x={x + bw / 2} y={Math.max(y - 6, 12)} textAnchor="middle">{axisLabel(it.value)}</text>
              <text className="ad-fc-xl" x={x + bw / 2} y={H - PB + 20} textAnchor="middle">{it.label}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  const readout = (items: { key: string; label: string; value: number }[]) => {
    const it = items.find(i => i.key === hover);
    return <p className="ad-fc-readout" aria-live="polite">{it ? <>{it.label}: <b>{formatRupees(it.value)}</b></> : 'Hover or focus a bar to see the exact amount.'}</p>;
  };

  // ── Tab 1: bill trend ──
  const trendItems = billValues.map((v, i) => ({ key: `b${i}`, label: `Bill ${i + 1}`, value: v, cls: 'is-c2' }));

  // ── Tab 2: comparison ──
  const compareItems = [
    { key: 'avg', label: 'Monthly Average Bill', value: fin.monthlyAverage, cls: 'is-c1' },
    { key: 'fixed', label: 'Monthly Fixed Charges', value: fixed, cls: 'is-c3' },
    { key: 'sav', label: 'Monthly Savings', value: fin.monthlySavings, cls: 'is-c2' },
  ];

  // ── Tab 3: recovery ──
  const recovery = () => {
    if (fin.paybackYears === null || cost <= 0 || fin.monthlySavings <= 0) {
      return <p className="ad-fc-empty">Enter a Solar Installation Cost and EB bills that exceed the fixed charges to see the investment recovery timeline.</p>;
    }
    const beMonths = fin.paybackYears * 12;
    const span = Math.max(12, Math.ceil((beMonths * 1.3) / 6) * 6);
    const end = fin.monthlySavings * span;
    const max = niceMax(Math.max(cost, end) * 1.05);
    const sx = (m: number) => PL + (m / span) * IW;
    const sy = (v: number) => PT + IH - (v / max) * IH;
    const ticks = 6;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="ad-fc-svg" role="img"
        aria-label={`Cumulative savings reach the ${formatRupees(cost)} investment after ${formatPayback(fin.paybackMonths)}.`}>
        <defs>
          <linearGradient id={`${uid}-area`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#16A34A" stopOpacity=".28" />
            <stop offset="1" stopColor="#16A34A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <Grid max={max} />
        <polygon fill={`url(#${uid}-area)`} points={`${sx(0)},${sy(0)} ${sx(span)},${sy(end)} ${sx(span)},${sy(0)}`} />
        <line className="ad-fc-ref" x1={PL} x2={W - PR} y1={sy(cost)} y2={sy(cost)} />
        <text className="ad-fc-reflabel" x={W - PR - 4} y={sy(cost) - 6} textAnchor="end">Investment {formatRupees(cost)}</text>
        <line className="ad-fc-line" x1={sx(0)} y1={sy(0)} x2={sx(span)} y2={sy(end)} />
        <line className="ad-fc-be-drop" x1={sx(beMonths)} x2={sx(beMonths)} y1={sy(cost)} y2={sy(0)} />
        <circle className="ad-fc-be" cx={sx(beMonths)} cy={sy(cost)} r={7}>
          <title>{`Break-even: ${formatPayback(fin.paybackMonths)}`}</title>
        </circle>
        <text className="ad-fc-belabel" x={Math.min(Math.max(sx(beMonths), PL + 60), W - PR - 60)} y={sy(cost) + 26} textAnchor="middle">Break-even · {formatPayback(fin.paybackMonths)}</text>
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const m = Math.round((span * i) / ticks);
          return <text key={i} className="ad-fc-xl" x={sx(m)} y={H - PB + 20} textAnchor="middle">{m === 0 ? '0' : m % 12 === 0 ? `${m / 12}y` : `${m}m`}</text>;
        })}
      </svg>
    );
  };

  return (
    <section className="ad-fc" aria-label="Solar Financial Analytics">
      <h4 className="ad-fc-title"><BarChart3 size={15} aria-hidden="true" />Solar Financial Analytics</h4>
      <div className="ad-fc-tabs" role="tablist" aria-label="Financial charts">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" id={`${uid}-t-${t.id}`} aria-selected={tab === t.id} aria-controls={`${uid}-p`}
            className={`ad-fc-tab${tab === t.id ? ' is-active' : ''}`} onClick={() => { setTab(t.id); setHover(null); }}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="ad-fc-panel" role="tabpanel" id={`${uid}-p`} aria-labelledby={`${uid}-t-${tab}`} key={tab}>
        {tab === 'trend' && <>{bars(trendItems)}{readout(trendItems)}</>}
        {tab === 'compare' && (
          <>
            {bars(compareItems)}
            {readout(compareItems)}
          </>
        )}
        {tab === 'recovery' && (
          <>
            {recovery()}
            {fin.paybackMonths !== null && <p className="ad-fc-payback">Payback duration: <b>{formatPayback(fin.paybackMonths)}</b></p>}
          </>
        )}
      </div>
    </section>
  );
}
