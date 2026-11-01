import { ArrowRight, BadgeCheck, House, Landmark, LayoutGrid, Sun, Workflow } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { HERO_PILLS, STEPS } from './homeData';

const PILL_ICONS = [BadgeCheck, House, Landmark];
const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero({ onQuote, onExplore }: { onQuote: () => void; onExplore: () => void }) {
  const reduce = useReducedMotion();
  /** Load-in entrance (hero is above the fold, so it animates on mount rather than on scroll). */
  const enter = (delay: number, x = 0, y = 28) => ({
    initial: reduce ? false as const : { opacity: 0, x, y },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <section className="hp-hero" aria-labelledby="hp-hero-title">
      <div className="hp-hero-bg">
        <motion.img
          src="/assets/home/hero.jpg"
          alt="Solar panels installed on a brick house roof"
          fetchPriority="high"
          initial={reduce ? false : { scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: 'easeOut' }}
        />
      </div>
      <div className="hp-wrap">
        <div className="hp-hero-copy">
          <motion.div className="hp-eyebrow is-lime" {...enter(0.1, -30, 0)}>Green Energy for a Brighter Tomorrow</motion.div>
          <h1 id="hp-hero-title">
            <motion.span className="hp-h1-line" {...enter(0.25)}>Capture the Sun,</motion.span>
            <motion.span className="hp-h1-line hp-h1-accent" {...enter(0.4)}>Power Your Future</motion.span>
          </h1>
          <motion.p {...enter(0.55)}>
            ENKAY Renewables Energy provides end-to-end solar solutions for homes, industries and businesses.
            We deliver high-quality solar products, trusted brands and expert installation services.
          </motion.p>
          <div className="hp-hero-actions">
            <motion.div {...enter(0.7)}>
              <button className="hp-btn hp-btn-yellow hp-btn-glow" onClick={onQuote}><Sun size={20} /> Get a Quote <ArrowRight size={18} /></button>
            </motion.div>
            <motion.div {...enter(0.8)}>
              <button className="hp-btn hp-btn-ghost" onClick={onExplore}><LayoutGrid size={20} /> Explore Our Solutions</button>
            </motion.div>
          </div>
          <ul className="hp-pills">
            {HERO_PILLS.map((p, i) => {
              const Icon = PILL_ICONS[i];
              return (
                <motion.li key={p} className="hp-pill" {...enter(0.95 + i * 0.12, 0, 20)}>
                  <Icon size={18} />{p}
                </motion.li>
              );
            })}
          </ul>
        </div>

        <motion.aside className="hp-steps-card" aria-label="Turnkey process" {...enter(0.9, 60, 0)}>
          <div className="hp-steps-head">
            <span className="hp-steps-ico"><Workflow size={24} /></span>
            <div>
              <h3>Turnkey Solar Solutions</h3>
              <p>Concept to Commissioning</p>
            </div>
          </div>
          <ol className="hp-steps">
            {STEPS.map((s, i) => (
              <li key={s} className={`hp-step${i === STEPS.length - 1 ? ' is-last' : ''}`} style={{ '--i': i } as React.CSSProperties}>
                <span className="hp-step-dot">{i + 1}</span>
                <span className="hp-step-label">{s}</span>
              </li>
            ))}
          </ol>
        </motion.aside>
      </div>
    </section>
  );
}
