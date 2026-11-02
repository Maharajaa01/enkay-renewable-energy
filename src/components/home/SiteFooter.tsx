import { ArrowRight, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Sun, Youtube } from 'lucide-react';
import type { NavSection } from '../Navbar';
import { COMPANY_INFO } from '../../data/solarData';
import { FOOTER_LINKS } from './homeData';

interface Props {
  onNavigate: (section: NavSection, anchorId?: string) => void;
  onQuote: () => void;
}

export default function SiteFooter({ onNavigate, onQuote }: Props) {
  return (
    <footer id="contact" className="hp-footer">
      <div className="hp-wrap hp-footer-grid">
        <div className="hp-footer-brand">
          <img src="/assets/home/footer-logo.png" alt="ENKAY Renewables Energy" width={200} height={58} />
          <p>Authorized dealer for leading solar brands, delivering turnkey solar solutions from concept to commissioning for homes, industries and businesses.</p>
          <div className="hp-tagline"><Sun size={18} /> Powering Today, Sustaining Tomorrow</div>
        </div>

        <nav aria-label="Quick links">
          <h4>Quick Links</h4>
          <ul className="hp-qlinks">
            {FOOTER_LINKS.map(l => (
              <li key={l.label}>
                <button onClick={() => (l.quote ? onQuote() : onNavigate(l.section!))}>{l.label}</button>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h4>Contact Information</h4>
          <ul className="hp-contact">
            <li><span className="hp-contact-ico"><Phone size={16} /></span><div><small>Phone</small><a href={`tel:${COMPANY_INFO.phoneRaw}`}>{COMPANY_INFO.phone}</a></div></li>
            <li><span className="hp-contact-ico"><Mail size={16} /></span><div><small>Email</small><a href={`mailto:${COMPANY_INFO.email}`}>{COMPANY_INFO.email}</a></div></li>
            <li><span className="hp-contact-ico"><MapPin size={16} /></span><div><small>Location</small><span className="v">Aminjikarai, Chennai,<br />Tamil Nadu, India</span></div></li>
          </ul>
        </div>

        <div className="hp-follow">
          <h4>Follow Us</h4>
          <p>Stay connected with ENKAY Renewables Energy.</p>
          <div className="hp-social">
            <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
            <a href="#" aria-label="YouTube"><Youtube size={18} /></a>
          </div>
          <button className="hp-btn hp-btn-yellow hp-btn-sm" onClick={onQuote}><Sun size={16} /> Get a Quote <ArrowRight size={15} /></button>
        </div>
      </div>

      <div className="hp-footer-bar">
        <div className="hp-wrap">
          <span>Copyright © 2026 ENKAY Renewables Energy. All rights reserved.</span>
          <nav aria-label="Legal">
            <a href="/privacy-policy" onClick={e => { e.preventDefault(); onNavigate('privacy'); }}>Privacy Policy</a><i />
            <a href="/terms-and-conditions" onClick={e => { e.preventDefault(); onNavigate('terms'); }}>Terms &amp; Conditions</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
