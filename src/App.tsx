import React, { useState, useEffect } from 'react';
import LogoIntro from './components/LogoIntro';
import Navbar from './components/Navbar';
import WhatsAppWidget from './components/WhatsAppWidget';
import type { NavSection } from './components/Navbar';
import HomePage from './components/home/HomePage';
import AboutPage from './components/about/AboutPage';
import ServicesPage from './components/services/ServicesPage';
import ProductsPage from './components/products/ProductsPage';
import CalculatorPage from './components/calculator/CalculatorPage';
import ContactPage from './components/contact/ContactPage';
import QuotePage from './components/quote/QuotePage';
import LegalPage from './components/legal/LegalPage';
import { PRIVACY_POLICY, TERMS_AND_CONDITIONS } from './components/legal/legalData';
import { applyPageMeta } from './lib/seo';
import { SECTION_ANCHORS } from './components/home/homeData';

const SESSION_KEY = 'enkay_intro_shown';

type Route = 'home' | 'about' | 'services' | 'products' | 'calculator' | 'contact' | 'quote' | 'privacy' | 'terms';

// Navbar sections that are separate pages, with their URLs.
const PAGE_PATHS: Partial<Record<NavSection, string>> = { about: '/about', services: '/services', products: '/products', calculator: '/calculator', contact: '/contact', quote: '/get-a-quote', privacy: '/privacy-policy', terms: '/terms-and-conditions' };

// Sections that only exist on the homepage — navigating to them from another page returns home first.
const HOME_ONLY: NavSection[] = [];

const routeFromPath = (): Route => {
  const path = window.location.pathname.replace(/\/+$/, '');
  const match = Object.entries(PAGE_PATHS).find(([, p]) => p === path);
  return (match?.[0] as Route | undefined) ?? 'home';
};

function hasSeenIntroThisSession(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === 'true'; }
  catch { return false; }
}
function markIntroSeen(): void {
  try { sessionStorage.setItem(SESSION_KEY, 'true'); }
  catch { /* noop */ }
}

export default function App() {
  // null = determining | true = show intro | false = skip to site
  const [showIntro,   setShowIntro]   = useState<boolean | null>(null);
  // Navbar fades in after intro completes
  const [navVisible,  setNavVisible]  = useState(false);
  const [activePage,  setActivePage]  = useState<NavSection>(routeFromPath);
  const [route,       setRoute]       = useState<Route>(routeFromPath);
  const [quoteOpen,   setQuoteOpen]   = useState(false);

  // Determine first-visit after mount (avoids SSR/hydration mismatch)
  useEffect(() => {
    // No intro video on mobile viewports
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile || hasSeenIntroThisSession()) {
      setShowIntro(false);
      // Already seen intro → navbar visible immediately
      setNavVisible(true);
    } else {
      setShowIntro(true);
    }
  }, []);

  // Keep the view in sync with browser back/forward
  useEffect(() => {
    const onPop = () => {
      const next = routeFromPath();
      setRoute(next);
      setActivePage(next);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Per-page title, description and canonical URL for search engines
  useEffect(() => { applyPageMeta(route); }, [route]);

  // ── Intro → Navbar handoff ─────────────────────────────────────────────
  const handleIntroComplete = () => {
    markIntroSeen();
    setShowIntro(false);
    // Small delay lets intro overlay finish its own fade-out before navbar rises
    setTimeout(() => setNavVisible(true), 120);
  };

  // ── Navigation ─────────────────────────────────────────────────────────
  const handleNavigate = (section: NavSection, anchorId?: string) => {
    setActivePage(section);
    const target = anchorId ?? SECTION_ANCHORS[section];

    // About Us, Services, Products, the Calculator, Contact and the legal pages are their own pages
    const pagePath = PAGE_PATHS[section];
    if (pagePath) {
      const next = section as Route;
      if (route !== next) window.history.pushState({}, '', pagePath);
      setRoute(next);
      window.scrollTo({ top: 0, behavior: route === next ? 'smooth' : 'auto' });
      return;
    }

    // Leaving a sub-page for a homepage section
    const needsHome = route !== 'home' && (section === 'home' || HOME_ONLY.includes(section));
    if (needsHome) {
      window.history.pushState({}, '', '/');
      setRoute('home');
      window.scrollTo({ top: 0 });
    }

    if (target) {
      setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
      }, needsHome ? 150 : 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (showIntro === null) return null;

  return (
    <>
      {/* ── Logo intro (first visit only) ── */}
      {showIntro && <LogoIntro onComplete={handleIntroComplete} />}

      {/* ── Navbar — fades in after intro ── */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        onQuoteClick={() => handleNavigate('quote')}
        visible={navVisible}
      />

      {/* ── Page body placeholder (padded below navbar) ── */}
      <main
        style={{
          paddingTop: 'var(--enkay-nav-offset)', // topbar(36, desktop only) + mainbar(88)
          minHeight: '100vh',
          opacity: navVisible ? 1 : 0,
          transition: 'opacity 0.5s ease 0.15s',
        }}
      >
        {route === 'about' ? (
          <AboutPage
            onNavigate={handleNavigate}
            quoteOpen={quoteOpen}
            onQuoteOpen={() => setQuoteOpen(true)}
            onQuoteClose={() => setQuoteOpen(false)}
          />
        ) : route === 'services' ? (
          <ServicesPage
            onNavigate={handleNavigate}
            quoteOpen={quoteOpen}
            onQuoteOpen={() => setQuoteOpen(true)}
            onQuoteClose={() => setQuoteOpen(false)}
          />
        ) : route === 'products' ? (
          <ProductsPage
            onNavigate={handleNavigate}
            quoteOpen={quoteOpen}
            onQuoteOpen={() => setQuoteOpen(true)}
            onQuoteClose={() => setQuoteOpen(false)}
          />
        ) : route === 'calculator' ? (
          <CalculatorPage
            onNavigate={handleNavigate}
            quoteOpen={quoteOpen}
            onQuoteOpen={() => setQuoteOpen(true)}
            onQuoteClose={() => setQuoteOpen(false)}
          />
        ) : route === 'quote' ? (
          <QuotePage
            onNavigate={handleNavigate}
            quoteOpen={quoteOpen}
            onQuoteOpen={() => setQuoteOpen(true)}
            onQuoteClose={() => setQuoteOpen(false)}
          />
        ) : route === 'privacy' || route === 'terms' ? (
          <LegalPage
            key={route}
            doc={route === 'privacy' ? PRIVACY_POLICY : TERMS_AND_CONDITIONS}
            related={route === 'privacy' ? { label: 'Terms & Conditions', section: 'terms' } : { label: 'Privacy Policy', section: 'privacy' }}
            onNavigate={handleNavigate}
            quoteOpen={quoteOpen}
            onQuoteOpen={() => setQuoteOpen(true)}
            onQuoteClose={() => setQuoteOpen(false)}
          />
        ) : route === 'contact' ? (
          <ContactPage
            onNavigate={handleNavigate}
            quoteOpen={quoteOpen}
            onQuoteOpen={() => setQuoteOpen(true)}
            onQuoteClose={() => setQuoteOpen(false)}
          />
        ) : (
          <HomePage
            onNavigate={handleNavigate}
            quoteOpen={quoteOpen}
            onQuoteOpen={() => setQuoteOpen(true)}
            onQuoteClose={() => setQuoteOpen(false)}
          />
        )}
      </main>

      {/* ── Floating WhatsApp chat — appears with the navbar ── */}
      <WhatsAppWidget visible={navVisible} />
    </>
  );
}
