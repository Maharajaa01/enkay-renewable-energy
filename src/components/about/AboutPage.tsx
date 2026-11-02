import { useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BadgeCheck, Check, Eye, Lightbulb, MapPin, ShieldCheck, Sun, Target, Workflow } from 'lucide-react';
import type { NavSection } from '../Navbar';
import SiteFooter from '../home/SiteFooter';
import QuoteModal from '../home/QuoteModal';
import TrustedBrands from '../home/TrustedBrands';
import Reveal from '../Reveal';
import { ABOUT_BADGES, ABOUT_IMAGES, PARTNER_BRANDS, WHY_LIST } from './aboutData';
import '../home/home.css';
import './about.css';

interface AboutPageProps {
  onNavigate: (section: NavSection, anchorId?: string) => void;
  quoteOpen: boolean;
  onQuoteOpen: () => void;
  onQuoteClose: () => void;
}

const BADGE_ICONS = [BadgeCheck, ShieldCheck, Workflow];

export default function AboutPage({ onNavigate, quoteOpen, onQuoteOpen, onQuoteClose }: AboutPageProps) {
  const openQuote = useCallback(() => onNavigate('quote'), [onNavigate]);
  const reduce = useReducedMotion();

  return (
    <div className="hp ab">
      {/* ── Hero ── */}
      <section className="ab-hero" aria-labelledby="ab-hero-title">
        <motion.img
          className="ab-hero-img"
          src={ABOUT_IMAGES.hero}
          alt="Aerial view of a large solar farm"
          fetchPriority="high"
          initial={reduce ? false : { scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
        <div className="ab-wrap ab-hero-inner">
          <Reveal className="hp-eyebrow" from="left" delay={0.1}>About ENKAY</Reveal>
          <Reveal as="h1" id="ab-hero-title" delay={0.25}>Powering a Sustainable Tomorrow</Reveal>
          <Reveal as="p" delay={0.4}>
            A trusted and authorized dealer for leading solar brands, delivering turnkey solar PV solutions for
            residential, industrial and commercial applications.
          </Reveal>
          <ul className="ab-badges">
            {ABOUT_BADGES.map((b, i) => {
              const Icon = BADGE_ICONS[i];
              return <Reveal as="li" key={b} delay={0.55 + i * 0.12} from="up"><Icon size={22} />{b}</Reveal>;
            })}
          </ul>
        </div>
      </section>

      {/* ── Who we are ── */}
      <section className="ab-who ab-wrap" aria-labelledby="ab-who-title">
        <Reveal className="ab-who-media" from="left">
          <span className="ab-dash" aria-hidden="true" />
          <img src={ABOUT_IMAGES.who} alt="ENKAY engineer overlooking a solar installation" loading="lazy" />
          <motion.div
            className="ab-who-card"
            initial={reduce ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: 'spring', stiffness: 80, damping: 14, delay: 0.5 }}
          >
            <span className="ab-ico-green"><MapPin size={26} /></span>
            <h3>Based in Chennai, Tamil Nadu</h3>
            <p>Serving residential, industrial and commercial solar power plant applications.</p>
          </motion.div>
        </Reveal>
        <div className="ab-who-copy">
          <Reveal className="hp-eyebrow" from="right" delay={0.1}>Who We Are</Reveal>
          <Reveal as="h2" id="ab-who-title" from="right" delay={0.2}>Your trusted solar partner in Tamil Nadu</Reveal>
          <Reveal from="right" delay={0.3}><blockquote className="ab-quote">
            ENKAY Renewables Energy is a trusted and authorized dealer for leading solar brands including Rayzon Solar,
            Waaree Energies Pvt. Ltd., VSole Energy, Adani Solar and Sungrow Energy. We are also associated with leading
            solar on-grid and off-grid inverter manufacturers in Tamil Nadu for residential, industrial and commercial
            solar power plant applications.
          </blockquote></Reveal>
          <Reveal as="p" className="ab-lead" from="right" delay={0.4}>
            We specialize in the design, installation, and maintenance of high-quality rooftop solar systems for
            residential, commercial, and industrial sectors — backed by expert installation and after-sales support.
          </Reveal>
          <ul className="ab-pills">
            {PARTNER_BRANDS.map((b, i) => <Reveal as="li" key={b} delay={0.5 + i * 0.1}><Sun size={16} />{b}</Reveal>)}
          </ul>
        </div>
      </section>

      {/* ── Why choose ── */}
      <section className="ab-wrap ab-why-sec" aria-labelledby="ab-why-title">
        <Reveal className="ab-why" scale={0.97}>
          <div className="ab-why-list">
            <Reveal as="h2" id="ab-why-title" from="left" delay={0.2}>Why Choose Enkay?</Reveal>
            <ul>
              {WHY_LIST.map((t, i) => (
                <Reveal as="li" key={t} from="left" delay={0.3 + i * 0.12}><span className="ab-check"><Check size={18} strokeWidth={3} /></span>{t}</Reveal>
              ))}
            </ul>
          </div>
          <div className="ab-why-media">
            <img src={ABOUT_IMAGES.why} alt="Hands holding a young plant in sunlit soil" loading="lazy" />
            <p>Clean Energy for a Better Tomorrow</p>
          </div>
        </Reveal>
      </section>

      {/* ── Vision & mission ── */}
      <section className="ab-wrap ab-vm" aria-label="Vision and mission">
        <Reveal className="ab-vm-item" delay={0.1}><article className="ab-vm-card">
          <span className="ab-ico-green"><Eye size={26} /></span>
          <div>
            <h3>Our Vision</h3>
            <p>To harness the power of nature for the sustainable development of our society and create a pollution-free future.</p>
          </div>
        </article></Reveal>
        <Reveal className="ab-vm-item" delay={0.3}><article className="ab-vm-card">
          <span className="ab-ico-yellow"><Target size={26} /></span>
          <div>
            <h3>Our Mission</h3>
            <p>
              To make solar energy accessible and affordable for every home and business by providing reliable,
              cost-effective, and high-quality solar solutions that reduce electricity bills and promote energy independence.
            </p>
          </div>
        </article></Reveal>
      </section>

      {/* ── Tagline ── */}
      <section className="ab-wrap ab-tag-sec" aria-label="Our tagline">
        <Reveal className="ab-tag" from="left" style={{ backgroundImage: `url(${ABOUT_IMAGES.tagline})` }}>
          <Lightbulb size={46} strokeWidth={1.6} />
          <div>
            <span>Our Tagline</span>
            <strong>Powering Tomorrow with Solar Today.</strong>
          </div>
        </Reveal>
      </section>

      {/* ── Premium brands (shared with Home) ── */}
      <Reveal className="ab-brands">
        <TrustedBrands title="Premium Quality Brands" />
      </Reveal>

      <SiteFooter onNavigate={onNavigate} onQuote={openQuote} />
      <QuoteModal open={quoteOpen} onClose={onQuoteClose} />
    </div>
  );
}
