import React, { useState, useEffect, useRef } from 'react';
import { COMPANY_INFO } from '../data/solarData';

// ─── Types ─────────────────────────────────────────────────────────────────
export type NavSection = 'home' | 'about' | 'services' | 'products' | 'contact' | 'quote' | 'privacy' | 'terms';

interface NavbarProps {
  activePage?: NavSection;
  onNavigate?: (section: NavSection, anchorId?: string) => void;
  onQuoteClick?: () => void;
  /** Fade-in the navbar (used for intro→navbar handoff) */
  visible?: boolean;
}

// ─── Top announcement bar ──────────────────────────────────────────────────
function TopBar() {
  return (
    <div
      className="enkay-topbar"
      style={{
        width: '100%',
        background: '#1d3a1d',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        minHeight: 36,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(1rem, 4vw, 2.5rem)',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}
    >
      {/* Left: tagline chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <span style={{ color: '#f5b800', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontFamily: 'Manrope, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <span style={{ fontSize: '0.85rem' }}>☀️</span> Solar Power
        </span>
        <Dot />
        <span style={tagStyle}>Progress</span>
        <Dot />
        <span style={tagStyle}>Reliable</span>
      </div>

      {/* Right: contact chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.75rem,2vw,1.5rem)', flexWrap: 'wrap' }}>
        <a href={`tel:${COMPANY_INFO.phoneRaw}`} style={contactLinkStyle}>
          <span style={{ fontSize: '0.78rem' }}>📞</span>
          {COMPANY_INFO.phone}
        </a>
        <a href={`mailto:${COMPANY_INFO.email}`} style={contactLinkStyle}>
          <span style={{ fontSize: '0.78rem' }}>✉️</span>
          {COMPANY_INFO.email}
        </a>
        <span style={{ ...contactLinkStyle, cursor: 'default', textDecoration: 'none' }}>
          <span style={{ fontSize: '0.78rem' }}>📍</span>
          Aminjikarai, Chennai
        </span>
      </div>
    </div>
  );
}

const tagStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.85)',
  fontSize: '0.72rem',
  fontWeight: 700,
  fontFamily: 'Manrope, sans-serif',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const contactLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  color: 'rgba(255,255,255,0.82)',
  textDecoration: 'none',
  fontSize: '0.72rem',
  fontFamily: 'Manrope, sans-serif',
  fontWeight: 600,
  letterSpacing: '0.02em',
  transition: 'color 0.2s',
  whiteSpace: 'nowrap',
};

const drawerLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#2d2d2d',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontFamily: 'Manrope, sans-serif',
  fontWeight: 600,
};

function Dot() {
  return <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.5rem', lineHeight: 1 }}>●</span>;
}

// ─── Logo block ────────────────────────────────────────────────────────────
function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="ENKAY Renewables Energy – Home"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        lineHeight: 0,          // remove any inline-block baseline gap
      }}
    >
      <img
        src="/assets/enkay-logo.png"
        alt="ENKAY Renewables Energy"
        style={{
          /* Desktop: 68 px tall — keeps the EK emblem + wordmark sharp */
          height: 68,
          width: 'auto',
          maxWidth: 260,
          objectFit: 'contain',
          objectPosition: 'left center',
          display: 'block',
          flexShrink: 0,
          /* GPU-composited for pixel-crisp rendering */
          imageRendering: 'auto',
          transform: 'translateZ(0)',
        }}
        loading="eager"
        decoding="async"
      />
    </button>
  );
}

// ─── Nav links definition ──────────────────────────────────────────────────
const NAV_ITEMS: { id: NavSection; label: string; anchor?: string; hasDropdown?: boolean }[] = [
  { id: 'home',       label: 'Home' },
  { id: 'about',      label: 'About Us' },
  { id: 'services',   label: 'Services & Solutions' },
  { id: 'products',   label: 'Products & Brands' },
  { id: 'contact',    label: 'Contact Us' },
];

// ─── Desktop nav link ──────────────────────────────────────────────────────
function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: typeof NAV_ITEMS[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (isActive) {
    return (
      <button
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(245,184,0,0.1)',
          border: '1.5px solid #f5b800',
          borderRadius: 999,
          padding: '0.32rem 0.85rem',
          cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 700,
          fontSize: '0.855rem',
          color: '#1a3c1a',
          whiteSpace: 'nowrap',
          letterSpacing: '0.01em',
          transition: 'background 0.2s',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f5b800', flexShrink: 0, display: 'inline-block' }} />
        {item.label}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'Manrope, sans-serif',
        fontWeight: 600,
        fontSize: '0.855rem',
        color: hovered ? '#1a6b1a' : '#2d2d2d',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        padding: '0.32rem 0.3rem',
        transition: 'color 0.2s',
      }}
    >
      {item.label}
      {item.hasDropdown && (
        <svg width="11" height="7" viewBox="0 0 11 7" fill="none" style={{ marginTop: 1, flexShrink: 0, opacity: 0.6 }}>
          <path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

// ─── Get a Quote CTA ───────────────────────────────────────────────────────
function QuoteButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Get a Quote"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        background: hovered ? '#145214' : '#1d6b1d',
        border: 'none',
        borderRadius: 999,
        padding: '0.6rem 1.35rem',
        cursor: 'pointer',
        fontFamily: 'Manrope, sans-serif',
        fontWeight: 800,
        fontSize: '0.875rem',
        color: '#fff',
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
        boxShadow: hovered
          ? '0 6px 22px rgba(29,107,29,0.55)'
          : '0 4px 16px rgba(29,107,29,0.35)',
        transition: 'background 0.2s, box-shadow 0.2s, transform 0.18s',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '0.95rem' }}>☀️</span>
      Get a Quote
      <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>→</span>
    </button>
  );
}

// ─── Hamburger icon ────────────────────────────────────────────────────────
function HamburgerButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, padding: 8, flexShrink: 0 }}
    >
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            display: 'block',
            width: 24,
            height: 2.5,
            background: '#1a3c1a',
            borderRadius: 2,
            transition: 'transform 0.25s ease, opacity 0.2s ease',
            transform:
              open
                ? i === 0 ? 'translateY(7.5px) rotate(45deg)'
                : i === 2 ? 'translateY(-7.5px) rotate(-45deg)'
                : 'scaleX(0)'
                : 'none',
            opacity: open && i === 1 ? 0 : 1,
          }}
        />
      ))}
    </button>
  );
}

// ─── Main Navbar ───────────────────────────────────────────────────────────
export default function Navbar({ activePage = 'home', onNavigate, onQuoteClick, visible = true }: NavbarProps) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Shadow / border on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleNav = (item: typeof NAV_ITEMS[0]) => {
    setMobileOpen(false);
    onNavigate?.(item.id, item.anchor);
  };

  const handleQuote = () => {
    setMobileOpen(false);
    onQuoteClick?.();
  };

  return (
    <nav
      ref={navRef}
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9000,
        width: '100%',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 0.55s ease, transform 0.55s ease',
        pointerEvents: visible ? 'auto' : 'none',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.1)' : 'none',
        transition2: 'box-shadow 0.3s ease',
      } as React.CSSProperties}
    >
      {/* ── Top bar ── */}
      <TopBar />

      {/* ── Main bar ── */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '2px solid #2e7d2e',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '0 clamp(1rem, 3vw, 2rem)',
            height: 88,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Logo */}
          <Logo onClick={() => handleNav(NAV_ITEMS[0])} />

          {/* Desktop nav links */}
          <div
            className="enkay-nav-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(0.5rem, 1.8vw, 1.5rem)',
              flexWrap: 'nowrap',
            }}
          >
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.id}
                item={item}
                isActive={activePage === item.id}
                onClick={() => handleNav(item)}
              />
            ))}
          </div>

          {/* Divider + CTA */}
          <div className="enkay-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
            <div style={{ width: 1, height: 36, background: 'rgba(0,0,0,0.12)' }} />
            <QuoteButton onClick={handleQuote} />
          </div>

          {/* Hamburger (mobile/tablet) */}
          <div className="enkay-nav-mobile" style={{ display: 'none' }}>
            <HamburgerButton open={mobileOpen} onClick={() => setMobileOpen(v => !v)} />
          </div>
        </div>

        {/* ── Mobile dropdown menu ── */}
        <div
          aria-hidden={!mobileOpen}
          style={{
            overflow: 'hidden',
            maxHeight: mobileOpen ? 'calc(100dvh - 90px)' : 0,
            overflowY: mobileOpen ? 'auto' : 'hidden',
            transition: 'max-height 0.35s ease',
            background: '#fff',
            borderTop: mobileOpen ? '1px solid rgba(46,125,46,0.2)' : 'none',
          }}
        >
          <div style={{ padding: '1rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                style={{
                  background: activePage === item.id ? 'rgba(245,184,0,0.08)' : 'none',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: activePage === item.id ? 700 : 600,
                  fontSize: '0.95rem',
                  color: activePage === item.id ? '#1a6b1a' : '#2d2d2d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {activePage === item.id && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f5b800', flexShrink: 0, display: 'inline-block' }} />
                )}
                {item.label}
                {item.hasDropdown && <span style={{ marginLeft: 'auto', opacity: 0.4, fontSize: '0.75rem' }}>▾</span>}
              </button>
            ))}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <button
                onClick={handleQuote}
                style={{
                  width: '100%',
                  background: '#1d6b1d',
                  border: 'none',
                  borderRadius: 999,
                  padding: '0.85rem',
                  cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                ☀️ Get a Quote →
              </button>
            </div>

            {/* Contact & Info */}
            <div style={{ marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1d6b1d' }}>Contact &amp; Info</span>
              <a href={`tel:${COMPANY_INFO.phoneRaw}`} style={drawerLinkStyle}><span>📞</span>{COMPANY_INFO.phone}</a>
              <a href={`mailto:${COMPANY_INFO.email}`} style={{ ...drawerLinkStyle, wordBreak: 'break-all' }}><span>✉️</span>{COMPANY_INFO.email}</a>
              <span style={drawerLinkStyle}><span>📍</span>Aminjikarai, Chennai</span>
              <span style={{ marginTop: 4, padding: '0.6rem 0.8rem', background: '#1d3a1d', borderRadius: 8, color: '#f5b800', fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.08em', textAlign: 'center' }}>SOLAR POWER • PROGRESS • RELIABLE</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
