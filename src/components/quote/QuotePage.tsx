import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight, AlertTriangle, BadgeIndianRupee, Building2, Calculator, Check, ClipboardList, FileText, Home, Info, Leaf,
  Lock, Mail, MapPin, MessageSquare, Phone, Receipt, Send, Settings, ShieldCheck, Sprout, Sun, Timer, User, Users, Zap,
} from 'lucide-react';
import type { NavSection } from '../Navbar';
import SiteFooter from '../home/SiteFooter';
import QuoteModal from '../home/QuoteModal';
import CountUp from '../calculator/CountUp';
import Reveal from '../Reveal';

import { COMPANY_INFO } from '../../data/solarData';
import { QUOTE_BENEFITS, SUBSIDIES, TERMS } from './quoteData';
import { EMPTY_QUOTE, validateQuote } from './quoteLogic';
import type { QuoteErrors, QuoteProjectType, QuoteValues } from './quoteLogic';
import { submitQuote } from '../../lib/enquiries';
import '../home/home.css';
import './quote.css';
import '../calculator/calculator.css';

interface Props {
  onNavigate: (section: NavSection, anchorId?: string) => void;
  quoteOpen: boolean;
  onQuoteOpen: () => void;
  onQuoteClose: () => void;
}

const CHIPS = [
  { icon: Settings, text: 'Customised Solutions' },
  { icon: BadgeIndianRupee, text: 'Competitive Pricing' },
  { icon: Timer, text: 'Fast Response' },
];

const TRUST = [
  { icon: Leaf, title: 'Clean Energy', text: 'A cleaner, greener tomorrow with solar power.' },
  { icon: ShieldCheck, title: 'Trusted Partner', text: 'Authorized dealer for leading solar brands.' },
  { icon: Users, title: 'Expert Team', text: 'Expert installation and professional support.' },
  { icon: Sprout, title: 'Sustainable Future', text: 'Renewable energy for a better world.' },
];

const ORDER: (keyof QuoteValues)[] = ['name', 'email', 'phone', 'capacity', 'location', 'bill', 'details'];

const fmtInr0 = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

const STEPS = [
  { icon: Receipt,    title: '1. Share your bill',          text: 'Enter your average monthly electricity bill and location.',   tone: '' },
  { icon: Calculator, title: '2. Explore your estimate',    text: 'See estimated savings based on the assumptions you provide.', tone: '' },
  { icon: FileText,   title: '3. Get a personalized quote', text: 'Our team prepares a detailed quotation for your site.',       tone: 'is-yellow' },
];


export default function QuotePage({ onNavigate, quoteOpen, onQuoteOpen, onQuoteClose }: Props) {
  const openQuote = useCallback(() => onNavigate('quote'), [onNavigate]);
  const [values, setValues] = useState<QuoteValues>(EMPTY_QUOTE);
  const [errors, setErrors] = useState<QuoteErrors>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'sent' | 'failed' | null>(null);
  const reduce = useReducedMotion();

  const set = <K extends keyof QuoteValues>(key: K, value: QuoteValues[K]) => {
    setValues(p => ({ ...p, [key]: value }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }));
    setResult(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const found = validateQuote(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setResult(null);
      const first = ORDER.find(k => found[k]);
      if (first) document.getElementById(`qt-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await submitQuote(values);
      setValues(EMPTY_QUOTE);
      setResult('sent');
    } catch (ex) {
      console.error('Quote submit failed', ex);
      setResult('failed');
    } finally {
      setBusy(false);
    }
  };

  const a11y = (k: keyof QuoteValues) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `qt-${k}-err` : undefined,
  });
  const err = (k: keyof QuoteValues) => errors[k] && <p className="qt-error" id={`qt-${k}-err`} role="alert">{errors[k]}</p>;

  return (
    <div className="hp qt">
      {/* ── Hero ── */}
      <section className="qt-hero" aria-labelledby="qt-title">
        <motion.img
          className="qt-hero-img"
          src="/assets/quote/hero.jpg"
          alt=""
          fetchPriority="high"
          initial={reduce ? false : { scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
        <div className="hp-wrap qt-hero-inner">
          <Reveal className="qt-eyebrow" from="left" delay={0.1}>Solar Solutions</Reveal>
          <Reveal as="h1" id="qt-title" delay={0.25}>Get a Quote</Reveal>
          <Reveal as="p" delay={0.4}>Ready to switch to clean, renewable energy? Fill out the form below and get a personalized quote for your solar installation. Our team will get back to you with the best solution for your needs.</Reveal>
          <ul className="qt-chips">
            {CHIPS.map(({ icon: Icon, text }, i) => <Reveal as="li" key={text} delay={0.55 + i * 0.12}><Icon size={22} aria-hidden="true" />{text}</Reveal>)}
          </ul>
        </div>
      </section>

      {/* ── Request a quote ── */}
      <section className="qt-request" aria-label="Request a quote">
        <div className="hp-wrap qt-request-grid">
          <Reveal from="left" delay={0.1}>
          <form className="qt-form" onSubmit={submit} noValidate>
            <header>
              <span className="qt-badge"><FileText size={24} aria-hidden="true" /></span>
              <div>
                <h2>Request a Quote</h2>
                <p>Tell us about your solar needs and we'll provide you with a detailed quotation based on your requirements.</p>
              </div>
            </header>

            <div className="qt-sec"><span>Your Details</span><i /></div>

            <div className="qt-field">
              <label htmlFor="qt-name">Your Name <b aria-hidden="true">*</b></label>
              <div className="qt-input"><User size={18} aria-hidden="true" />
                <input id="qt-name" autoComplete="name" required placeholder="Enter your full name" value={values.name} onChange={e => set('name', e.target.value)} {...a11y('name')} />
              </div>
              {err('name')}
            </div>

            <div className="qt-row">
              <div className="qt-field">
                <label htmlFor="qt-email">Email Address <b aria-hidden="true">*</b></label>
                <div className="qt-input"><Mail size={18} aria-hidden="true" />
                  <input id="qt-email" type="email" autoComplete="email" required placeholder="you@example.com" value={values.email} onChange={e => set('email', e.target.value)} {...a11y('email')} />
                </div>
                {err('email')}
              </div>
              <div className="qt-field">
                <label htmlFor="qt-phone">Phone Number <b aria-hidden="true">*</b></label>
                <div className="qt-input"><Phone size={18} aria-hidden="true" />
                  <input id="qt-phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+91 XXXXX XXXXX" value={values.phone} onChange={e => set('phone', e.target.value)} {...a11y('phone')} />
                </div>
                {err('phone')}
              </div>
            </div>

            <div className="qt-sec"><span>Project Details</span><i /></div>

            <div className="qt-field">
              <span className="qt-label" id="qt-type-label">Project Type <b aria-hidden="true">*</b></span>
              <div className="qt-seg" role="radiogroup" aria-labelledby="qt-type-label">
                {([['residential', 'Residential', Home], ['commercial', 'Commercial', Building2]] as [QuoteProjectType, string, typeof Home][])
                  .map(([val, text, Icon]) => (
                    <button key={val} type="button" role="radio" aria-checked={values.projectType === val}
                      className={values.projectType === val ? 'is-on' : ''} onClick={() => set('projectType', val)}>
                      <Icon size={16} aria-hidden="true" />{text}
                    </button>
                  ))}
              </div>
            </div>

            <div className="qt-row">
              <div className="qt-field">
                <label htmlFor="qt-capacity">Solar System Capacity (kWp)</label>
                <div className="qt-input"><Sun size={18} aria-hidden="true" />
                  <input id="qt-capacity" autoComplete="off" placeholder="e.g. 3 kWp or 5 kWp" value={values.capacity} onChange={e => set('capacity', e.target.value)} {...a11y('capacity')} />
                </div>
                {err('capacity')}
              </div>
              <div className="qt-field">
                <label htmlFor="qt-location">Location of Installation <b aria-hidden="true">*</b></label>
                <div className="qt-input"><MapPin size={18} aria-hidden="true" />
                  <input id="qt-location" autoComplete="street-address" required placeholder="Your full address or area" value={values.location} onChange={e => set('location', e.target.value)} {...a11y('location')} />
                </div>
                {err('location')}
              </div>
            </div>

            <div className="qt-field">
              <label htmlFor="qt-bill">Monthly Electricity Bill / Energy Requirement</label>
              <div className="qt-input"><Zap size={18} aria-hidden="true" />
                <input id="qt-bill" autoComplete="off" placeholder="e.g. ₹2,000 – ₹5,000 or approx. units per month" value={values.bill} onChange={e => set('bill', e.target.value)} {...a11y('bill')} />
              </div>
              {err('bill')}
            </div>

            <div className="qt-field">
              <label htmlFor="qt-details">Additional Details</label>
              <div className="qt-input is-area"><MessageSquare size={18} aria-hidden="true" />
                <textarea id="qt-details" placeholder="Tell us more about your project (optional)" value={values.details} onChange={e => set('details', e.target.value)} {...a11y('details')} />
              </div>
              {err('details')}
            </div>

            <button type="submit" className="qt-send" disabled={busy} aria-busy={busy}>
              <Send size={20} aria-hidden="true" />{busy ? 'Sending…' : 'Request a Quote'}{!busy && <ArrowRight size={20} aria-hidden="true" />}
            </button>

            <div className="qt-status" role="status" aria-live="polite">
              {result === 'sent' && (
                <p className="is-ok">Thank you! Your quote request has been received. Our team will contact you shortly with a personalised quotation.</p>
              )}
              {result === 'failed' && (
                <p>
                  Sorry, we couldn't send your request right now. Please try again, or email us at <a href={`mailto:${COMPANY_INFO.email}`}>{COMPANY_INFO.email}</a> or call <a href={`tel:${COMPANY_INFO.phoneRaw}`}>{COMPANY_INFO.phone}</a>.
                </p>
              )}
            </div>

            <p className="qt-privacy"><Lock size={16} aria-hidden="true" />Fields marked * are required. Your information is safe with us.</p>
          </form>
          </Reveal>

          <Reveal from="right" delay={0.25}>
          <aside className="qt-side">
            <img className="qt-side-img" src="/assets/quote/side.jpg" alt="Solar installers fitting rooftop panels" loading="lazy" />
            <div className="qt-why">
              <h3>Why Choose ENKAY?</h3>
              <ul>
                {QUOTE_BENEFITS.map((b, i) => <Reveal as="li" key={b} from="right" delay={0.4 + i * 0.1}><span><Check size={14} strokeWidth={3} aria-hidden="true" /></span>{b}</Reveal>)}
              </ul>
              <div className="qt-promo">
                <div className="qt-promo-top">
                  <span className="qt-badge is-round"><Leaf size={22} aria-hidden="true" /></span>
                  <div>
                    <h4>Power Your Home With Clean Energy</h4>
                    <p>Save on electricity bills and contribute to a greener planet.</p>
                  </div>
                </div>
                <img src="/assets/quote/illustration.svg" alt="" aria-hidden="true" />
                <em>Switch to Solar. Save for Tomorrow.</em>
              </div>
            </div>
          </aside>
          </Reveal>
        </div>
      </section>

      {/* ── Subsidy Information ── */}
      <section className="sc-sub" aria-labelledby="qt-sub-title">
        <div className="hp-wrap">
          <div className="sc-sub-grid">
            <Reveal className="sc-sub-intro" from="left">
              <div className="sc-eyebrow">Subsidy Information</div>
              <h2 id="qt-sub-title">Solar subsidy eligibility</h2>
              <p>Client-provided subsidy figures for eligible residential rooftop solar installations. Our team can guide you through the application process.</p>
            </Reveal>
            {SUBSIDIES.map((s, i) => (
              <Reveal key={s.who[0]} className="sc-sub-item" delay={0.15 + i * 0.15}>
                <article className="sc-sub-card">
                  <small>{s.who.join(' ')}</small>
                  <h3>{s.who[0] === 'PM Surya Ghar: Muft Bijli' ? 'PM Surya Ghar: Muft Bijli Yojana' : 'State Government Subsidy'}</h3>
                  <div className="sc-amt"><CountUp value={parseInt(s.amount.replace(/\D/g, ''), 10)} format={fmtInr0} duration={1.4} onView /></div>
                  <p>Subsidy eligibility</p>
                  <span className="sc-tag"><Info size={14} aria-hidden="true" />Subject to scheme eligibility</span>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="sc-note" role="note" delay={0.2}>
            <AlertTriangle size={20} aria-hidden="true" />
            <p><b>Please note:</b> These are client-provided subsidy figures and not an unconditional guarantee. Actual subsidy approval and amount depend on the applicable scheme requirements. Please verify your eligibility under the applicable scheme.</p>
          </Reveal>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="sc-steps" aria-label="How it works">
        <div className="hp-wrap sc-steps-grid">
          {STEPS.map(({ icon: Icon, title, text, tone }, i) => (
            <Reveal key={title} className="sc-step-item" delay={i * 0.15}>
              <article className="sc-step">
                <span className={`sc-badge is-soft ${tone}`}><Icon size={24} /></span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Commercial bid & terms ── */}
      <section className="qt-bid-sec" aria-labelledby="qt-bid-title">
        <div className="hp-wrap">
          <Reveal className="qt-bid-head">
            <div className="qt-eyebrow is-center">Price Summary</div>
            <h2 id="qt-bid-title">Commercial Bid &amp; Terms</h2>
            <p>Quotation for a Solar Power Plant System on the roof of the residence.</p>
          </Reveal>


          <Reveal as="section" className="qt-terms" aria-labelledby="qt-terms-title">
            <header>
              <h3 id="qt-terms-title"><ClipboardList size={26} aria-hidden="true" />Terms &amp; Conditions</h3>
              <span className="qt-tag">Applicable terms</span>
            </header>
            <ol>
              {TERMS.map((t, i) => (
                <Reveal as="li" key={t.title} delay={(i % 2) * 0.1 + Math.floor(i / 2) * 0.08}>
                  <b>{i + 1}</b>
                  <div><h4>{t.title}</h4><p>{t.text}</p></div>
                </Reveal>
              ))}
            </ol>
          </Reveal>

          <Reveal as="p" className="qt-thanks"><Sun size={26} aria-hidden="true" /><span>“Thanking you and assuring you of our best services always.”</span><Sun size={26} aria-hidden="true" /></Reveal>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="qt-trust" aria-label="Why choose ENKAY">
        <div className="hp-wrap qt-trust-grid">
          {TRUST.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="article" key={title} delay={i * 0.12}>
              <span><Icon size={34} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} onQuote={openQuote} />
      <QuoteModal open={quoteOpen} topic="" onClose={onQuoteClose} />
    </div>
  );
}
