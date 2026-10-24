import { COMPANY_INFO } from '../data/solarData';
import './whatsapp-widget.css';

const MESSAGE = "Hi ENKAY, I'd like to know more about solar solutions.";
const WHATSAPP_URL = `https://wa.me/${COMPANY_INFO.phoneRaw.replace(/\D/g, '')}?text=${encodeURIComponent(MESSAGE)}`;

/** Floating "Chat on WhatsApp" button, pinned to the bottom-right of every page. */
export default function WhatsAppWidget({ visible = true }: { visible?: boolean }) {
  return (
    <a
      className={`wa-fab${visible ? ' is-visible' : ''}`}
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with ENKAY on WhatsApp"
      tabIndex={visible ? undefined : -1}
    >
      <span className="wa-fab-label" aria-hidden="true">
        <b>Need help?</b> Chat with us
      </span>
      <span className="wa-fab-btn">
        <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16.04 3C9.03 3 3.33 8.7 3.33 15.7c0 2.24.59 4.43 1.7 6.36L3.2 28.8l6.92-1.81a12.66 12.66 0 0 0 5.92 1.5h.01c7 0 12.7-5.7 12.7-12.7 0-3.39-1.32-6.58-3.72-8.98A12.62 12.62 0 0 0 16.04 3Zm0 23.35h-.01c-1.9 0-3.75-.51-5.37-1.47l-.39-.23-4.1 1.08 1.1-4-.26-.41a10.5 10.5 0 0 1-1.62-5.62c0-5.82 4.74-10.56 10.57-10.56 2.82 0 5.47 1.1 7.46 3.1a10.5 10.5 0 0 1 3.09 7.47c0 5.82-4.74 10.56-10.47 10.56Zm5.79-7.9c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.76-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.08 1.3 3.29c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.46.21 2.01.13.61-.09 1.88-.77 2.15-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37Z"
          />
        </svg>
      </span>
    </a>
  );
}
