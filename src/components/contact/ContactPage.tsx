import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight, ChevronDown, Leaf, Lock, Mail, MapPin, MessageCircle, MessageSquare, Navigation, Phone, Send,
  Settings, ShieldCheck, Sprout, Tag, User, Users,
} from 'lucide-react';
import type { NavSection } from '../Navbar';
import SiteFooter from '../home/SiteFooter';
import QuoteModal from '../home/QuoteModal';
import Reveal from '../Reveal';
import { COMPANY_INFO } from '../../data/solarData';
import { CONTACT_SUBJECTS, validateContact } from './contactLogic';
import type { ContactErrors, ContactValues } from './contactLogic';
import { submitContact } from '../../lib/enquiries';
import '../home/home.css';
import './contact.css';

interface Props {
  onNavigate: (section: NavSection, anchorId?: string) => void;
  quoteOpen: boolean;
  onQuoteOpen: () => void;
  onQuoteClose: () => void;
}

const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Aminjikarai%2C%20Chennai%2C%20Tamil%20Nadu';
const MAP_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7772.8990318274355!2d80.21925983980266!3d13.070672999015274!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a526685d94f22f9%3A0x4b0e36475dddf085!2sAminjikarai%2C%20Chennai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1792868298329!5m2!1sen!2sin';
const WHATSAPP_URL = `https://wa.me/${COMPANY_INFO.phoneRaw.replace(/\D/g, '')}`;

const CHIPS = [
  { icon: ShieldCheck, text: 'Reliable Support' },
  { icon: Users, text: 'Expert Guidance' },
  { icon: Settings, text: 'Custom Solutions' },
];

const CARDS = [
  { icon: Phone, title: 'Call Us', main: COMPANY_INFO.phone, sub: 'Mon–Sat, 9:00 AM–6:00 PM', href: `tel:${COMPANY_INFO.phoneRaw}` },
  { icon: Mail, title: 'Email Us', main: COMPANY_INFO.email, sub: "We'll respond within 24 hours.", href: `mailto:${COMPANY_INFO.email}` },
  { icon: MapPin, title: 'Our Office', main: 'Aminjikarai, Chennai', sub: 'Tamil Nadu, India', href: MAP_URL, external: true },
  { icon: MessageCircle, title: 'WhatsApp', main: COMPANY_INFO.phone, sub: 'Chat with us directly.', href: WHATSAPP_URL, external: true, wa: true },
];

const TRUST = [
  { icon: Leaf, title: 'Clean Energy', text: 'A cleaner, greener tomorrow with solar power.' },
  { icon: ShieldCheck, title: 'Trusted Partner', text: 'Authorized dealer for leading solar brands.' },
  { icon: Users, title: 'Expert Team', text: 'Expert installation and professional support.' },
  { icon: Sprout, title: 'Sustainable Future', text: 'Renewable energy for a better world.' },
];

const EMPTY: ContactValues = { name: '', email: '', phone: '', subject: '', message: '' };
const ORDER: (keyof ContactValues)[] = ['name', 'email', 'phone', 'subject', 'message'];

export default function ContactPage({ onNavigate, quoteOpen, onQuoteOpen, onQuoteClose }: Props) {
  const openQuote = useCallback(() => onNavigate('quote'), [onNavigate]);
  const [values, setValues] = useState<ContactValues>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'sent' | 'failed' | null>(null);
  const reduce = useReducedMotion();

  const set = (key: keyof ContactValues, value: string) => {
    setValues(p => ({ ...p, [key]: value }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }));
    setResult(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const found = validateContact(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setResult(null);
      const first = ORDER.find(k => found[k]);
      if (first) document.getElementById(`ct-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await submitContact(values);
      setValues(EMPTY);
      setResult('sent');
    } catch (ex) {
      console.error('Contact submit failed', ex);
      setResult('failed');
    } finally {
      setBusy(false);
    }
  };

  const a11y = (k: keyof ContactValues) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `ct-${k}-err` : undefined,
  });
  const err = (k: keyof ContactValues) => errors[k] && <p className="ct-error" id={`ct-${k}-err`} role="alert">{errors[k]}</p>;

  return (
    <div className="hp ct">
      {/* ── Hero ── */}
      <section className="ct-hero" aria-labelledby="ct-title">
        <motion.img
          className="ct-hero-img"
          src="/assets/contact/hero.jpg"
          alt=""
          fetchPriority="high"
          initial={reduce ? false : { scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
        <div className="hp-wrap ct-hero-inner">
          <Reveal className="ct-eyebrow" from="left" delay={0.1}>Get in Touch</Reveal>
          <Reveal as="h1" id="ct-title" delay={0.25}>Contact Us</Reveal>
          <Reveal as="p" delay={0.4}>We're here to help! Whether you have a question, need support, or want to discuss your solar project, feel free to reach out to us. Our team will be happy to assist you.</Reveal>
          <ul className="ct-chips">
            {CHIPS.map(({ icon: Icon, text }, i) => <Reveal as="li" key={text} delay={0.55 + i * 0.12}><Icon size={22} aria-hidden="true" />{text}</Reveal>)}
          </ul>
        </div>
      </section>

      {/* ── Contact channels + form ── */}
      <section className="ct-main" aria-labelledby="ct-git">
        <div className="hp-wrap ct-grid">
          <div className="ct-left">
            <Reveal from="left">
              <h2 id="ct-git">Get in Touch</h2>
              <p className="ct-sub">Reach us through any of the channels below.</p>
            </Reveal>

            <div className="ct-cards">
              {CARDS.map(({ icon: Icon, title, main, sub, href, external, wa }, i) => (
                <Reveal key={title} from="left" delay={0.1 + i * 0.1}>
                <a className="ct-card" href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  <span className={`ct-ic${wa ? ' is-wa' : ''}`}><Icon size={22} aria-hidden="true" /></span>
                  <span className="ct-card-txt">
                    <h3>{title}</h3>
                    <b>{main}</b>
                    <small>{sub}</small>
                  </span>
                </a>
                </Reveal>
              ))}
            </div>

            <Reveal className="ct-map" scale={0.96} delay={0.2}>
              <iframe
                src={MAP_EMBED_URL}
                title="Map showing the ENKAY Renewables Energy office in Aminjikarai, Chennai"
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
              <a className="ct-map-open" href={MAP_URL} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" />Open in Google Maps</a>
            </Reveal>
          </div>

          <Reveal from="right" delay={0.15}>
          <form className="ct-form" onSubmit={submit} noValidate>
            <header>
              <span className="ct-badge"><Send size={24} aria-hidden="true" /></span>
              <div>
                <h2>Send us a Message</h2>
                <p>Fill out the form below and we'll get back to you as soon as possible.</p>
              </div>
            </header>

            <div className="ct-row">
              <div className="ct-field">
                <label htmlFor="ct-name">Your Name <b aria-hidden="true">*</b></label>
                <div className="ct-input"><User size={18} aria-hidden="true" />
                  <input id="ct-name" autoComplete="name" required placeholder="Enter your full name" value={values.name} onChange={e => set('name', e.target.value)} {...a11y('name')} />
                </div>
                {err('name')}
              </div>
              <div className="ct-field">
                <label htmlFor="ct-email">Email Address <b aria-hidden="true">*</b></label>
                <div className="ct-input"><Mail size={18} aria-hidden="true" />
                  <input id="ct-email" type="email" autoComplete="email" required placeholder="you@example.com" value={values.email} onChange={e => set('email', e.target.value)} {...a11y('email')} />
                </div>
                {err('email')}
              </div>
            </div>

            <div className="ct-row">
              <div className="ct-field">
                <label htmlFor="ct-phone">Phone Number <b aria-hidden="true">*</b></label>
                <div className="ct-input"><Phone size={18} aria-hidden="true" />
                  <input id="ct-phone" type="tel" autoComplete="tel" inputMode="tel" required placeholder="+91 XXXXX XXXXX" value={values.phone} onChange={e => set('phone', e.target.value)} {...a11y('phone')} />
                </div>
                {err('phone')}
              </div>
              <div className="ct-field">
                <label htmlFor="ct-subject">Subject <b aria-hidden="true">*</b></label>
                <div className={`ct-input${values.subject ? '' : ' is-empty'}`}><Tag size={18} aria-hidden="true" />
                  <select id="ct-subject" required value={values.subject} onChange={e => set('subject', e.target.value)} {...a11y('subject')}>
                    <option value="">Select a subject</option>
                    {CONTACT_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={18} aria-hidden="true" />
                </div>
                {err('subject')}
              </div>
            </div>

            <div className="ct-field">
              <label htmlFor="ct-message">Your Message <b aria-hidden="true">*</b></label>
              <div className="ct-input is-area"><MessageSquare size={18} aria-hidden="true" />
                <textarea id="ct-message" required placeholder="Type your message here..." value={values.message} onChange={e => set('message', e.target.value)} {...a11y('message')} />
              </div>
              {err('message')}
            </div>

            <button type="submit" className="ct-send" disabled={busy} aria-busy={busy}>
              <Send size={20} aria-hidden="true" />{busy ? 'Sending…' : 'Send Message'}{!busy && <ArrowRight size={20} aria-hidden="true" />}
            </button>

            <div className="ct-status" role="status" aria-live="polite">
              {result === 'sent' && (
                <p className="is-ok">Thank you! Your message has been sent. Our team will get back to you within 24 hours.</p>
              )}
              {result === 'failed' && (
                <p>
                  Sorry, we couldn't send your message right now. Please try again, or email us at <a href={`mailto:${COMPANY_INFO.email}`}>{COMPANY_INFO.email}</a> or call <a href={`tel:${COMPANY_INFO.phoneRaw}`}>{COMPANY_INFO.phone}</a>.
                </p>
              )}
            </div>

            <p className="ct-privacy"><Lock size={16} aria-hidden="true" />Fields marked * are required. Your information is safe with us.</p>
          </form>
          </Reveal>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="ct-trust" aria-label="Why contact ENKAY">
        <div className="hp-wrap ct-trust-grid">
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
