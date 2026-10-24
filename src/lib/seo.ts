export const SITE_URL = 'https://enkayrenewablesenergy.com';

interface PageMeta { path: string; title: string; description: string }

// Per-page <title>, description and canonical URL — keyword-targeted for local solar searches.
export const PAGE_META: Record<string, PageMeta> = {
  home: {
    path: '/',
    title: 'ENKAY Renewables Energy | Solar Panel Installation Company in Chennai, Tamil Nadu',
    description: 'ENKAY Renewables Energy is a solar EPC company in Chennai offering rooftop solar panel installation, on-grid, off-grid and hybrid solar systems, solar inverters and batteries for homes, businesses and industries across Tamil Nadu.',
  },
  about: {
    path: '/about',
    title: 'About Us | ENKAY Renewables Energy – Trusted Solar Company in Chennai',
    description: 'Learn about ENKAY Renewables Energy, a Chennai-based solar energy company delivering reliable residential, commercial and industrial solar power solutions across Tamil Nadu.',
  },
  services: {
    path: '/services',
    title: 'Solar Services in Chennai | Rooftop, Commercial & Industrial Solar EPC – ENKAY',
    description: 'End-to-end solar services in Chennai: site survey, system design, procurement, installation, net metering and maintenance for residential rooftop, commercial and industrial solar plants.',
  },
  products: {
    path: '/products',
    title: 'Solar Products in Chennai | Solar Panels, Inverters, Batteries, Cables – ENKAY',
    description: 'Buy solar panels, on-grid and hybrid inverters, solar batteries, DC and AC cables, ACDB/DCDB and mounting structures from leading brands like Waaree, Adani and Tata in Chennai.',
  },
  calculator: {
    path: '/calculator',
    title: 'Solar Calculator | Estimate Solar Panel Cost, Savings & Subsidy – ENKAY',
    description: 'Use our free solar calculator to estimate the right rooftop solar system size, installation cost, monthly savings and payback for your home or business in Tamil Nadu.',
  },
  quote: {
    path: '/get-a-quote',
    title: 'Get a Free Solar Quote in Chennai | ENKAY Renewables Energy',
    description: 'Request a free, no-obligation quote for rooftop, commercial or industrial solar installation in Chennai and across Tamil Nadu.',
  },
  contact: {
    path: '/contact',
    title: 'Contact ENKAY Renewables Energy | Solar Company in Aminjikarai, Chennai',
    description: 'Contact ENKAY Renewables Energy in Aminjikarai, Chennai for solar panel installation, solar products and free site consultation. Call +91 63850 82822.',
  },
  privacy: {
    path: '/privacy-policy',
    title: 'Privacy Policy | ENKAY Renewables Energy',
    description: 'How ENKAY Renewables Energy collects, uses and protects your personal information.',
  },
  terms: {
    path: '/terms-and-conditions',
    title: 'Terms & Conditions | ENKAY Renewables Energy',
    description: 'Terms and conditions for using the ENKAY Renewables Energy website and services.',
  },
};

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function applyPageMeta(route: string) {
  const meta = PAGE_META[route] ?? PAGE_META.home;
  const url = SITE_URL + meta.path;
  document.title = meta.title;
  setMeta('name', 'description', meta.description);
  setMeta('property', 'og:title', meta.title);
  setMeta('property', 'og:description', meta.description);
  setMeta('property', 'og:url', url);
  setMeta('name', 'twitter:title', meta.title);
  setMeta('name', 'twitter:description', meta.description);
  document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', url);
}
