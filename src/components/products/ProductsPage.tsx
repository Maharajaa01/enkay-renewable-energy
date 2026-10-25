import { useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, BadgeCheck, ShieldCheck, Sun } from 'lucide-react';
import type { NavSection } from '../Navbar';
import SiteFooter from '../home/SiteFooter';
import Reveal from '../Reveal';
import QuoteModal from '../home/QuoteModal';
import {
  CATEGORIES, PRODUCTS_CTA_BG, PRODUCTS_HERO_IMAGE,
} from './productsData';
import '../home/home.css';
import './products.css';

interface ProductsPageProps {
  onNavigate: (section: NavSection, anchorId?: string) => void;
  quoteOpen: boolean;
  onQuoteOpen: () => void;
  onQuoteClose: () => void;
}

export default function ProductsPage({ onNavigate, quoteOpen, onQuoteOpen, onQuoteClose }: ProductsPageProps) {
  const openQuote = useCallback(() => onNavigate('quote'), [onNavigate]);
  const reduce = useReducedMotion();

  return (
    <div className="hp pb">
      {/* ── Hero ── */}
      <section className="pb-hero" aria-labelledby="pb-hero-title">
        <motion.img
          className="pb-hero-img"
          src={PRODUCTS_HERO_IMAGE}
          alt="Solar panels"
          fetchPriority="high"
          initial={reduce ? false : { scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
        <span className="pb-sun" aria-hidden="true" />
        <span className="pb-sheen" aria-hidden="true" />
        <div className="hp-wrap pb-hero-inner">
          <Reveal className="hp-eyebrow is-lime" from="left" delay={0.1}>Our Products</Reveal>
          <Reveal as="h1" id="pb-hero-title" delay={0.25}>Leading Brands. Quality Solar Solutions.</Reveal>
          <Reveal as="p" delay={0.4}>We are an authorized dealer for trusted solar brands in India, offering solar products for residential, industrial and commercial applications.</Reveal>
          <ul className="pb-hero-list">
            <Reveal as="li" delay={0.55}><BadgeCheck size={22} />Authorized Dealer</Reveal>
            <Reveal as="li" delay={0.67}><ShieldCheck size={22} />TUV &amp; ETL Certified Modules</Reveal>
          </ul>
        </div>
      </section>

      {/* ── Product categories ── */}
      <section className="pb-cats" aria-labelledby="pb-cats-title">
        <div className="hp-wrap">
          <Reveal className="pb-head">
            <div className="hp-eyebrow is-center">Product Categories</div>
            <h2 id="pb-cats-title">Everything your solar plant needs</h2>
            <p>Quality components for residential, industrial and commercial solar power plants.</p>
          </Reveal>
          <div className="pb-cat-grid">
            {CATEGORIES.map(({ icon: Icon, img, title, side }, i) => (
              <Reveal key={title} className="pb-cat-item" delay={(i % 4) * 0.1}>
              <article className={side ? `pb-cat is-${side}` : 'pb-cat'}>
                <img src={img} alt={title} loading="lazy" />
                <div className="pb-cat-body">
                  <span className="pb-ico"><Icon size={22} /></span>
                  <h3>{title}</h3>
                </div>
              </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specifications ── */}
      {/* <section className="pb-specs" aria-labelledby="pb-specs-title">
        <div className="hp-wrap">
          <div className="pb-head">
            <div className="hp-eyebrow is-center">Specifications</div>
            <h2 id="pb-specs-title">Panel range, certifications &amp; inverter options</h2>
          </div>
          <div className="pb-spec-grid">
            <article className="pb-spec">
              <span className="pb-spec-ico"><LayoutGrid size={26} /></span>
              <h3>Solar PV Modules</h3>
              <div className="pb-range">{MODULE_SPEC.range} <small>{MODULE_SPEC.unit}</small></div>
              <p>{MODULE_SPEC.text}</p>
              <dl>{MODULE_SPEC.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            </article>

            <article className="pb-spec is-dark">
              <span className="pb-spec-ico is-yellow"><ShieldCheck size={26} /></span>
              <h3>Certifications</h3>
              <p>{CERT_SPEC.note}</p>
              <dl>{CERT_SPEC.rows.map(([k, v]) => <div key={k + v}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
              <div className="pb-badges">
                <span><ShieldCheck size={16} />{CERT_SPEC.badges[0]}</span>
                <span><Medal size={16} />{CERT_SPEC.badges[1]}</span>
              </div>
            </article>

            <article className="pb-spec">
              <span className="pb-spec-ico"><PlugZap size={26} /></span>
              <h3>Inverter Options</h3>
              <dl className="is-tight">{INVERTER_SPEC.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            </article>
          </div>
        </div>
      </section> */}
      {/* ── CTA ── */}
      <section className="pb-cta-sec" aria-labelledby="pb-cta-title">
        <div className="hp-wrap">
          <Reveal className="pb-cta" scale={0.96} style={{ backgroundImage: `url(${PRODUCTS_CTA_BG})` }}>
            <div className="pb-cta-copy">
              <div className="hp-eyebrow is-lime">Need a product recommendation?</div>
              <h2 id="pb-cta-title">Get the right components for your plant</h2>
              <p>Our team will help you choose quality products from trusted brands for your solar project.</p>
            </div>
            <button className="hp-btn hp-btn-yellow" onClick={openQuote}><Sun size={20} /> Get a Quote <ArrowRight size={18} /></button>
          </Reveal>
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} onQuote={openQuote} />
      <QuoteModal open={quoteOpen} topic="" onClose={onQuoteClose} />
    </div>
  );
}
