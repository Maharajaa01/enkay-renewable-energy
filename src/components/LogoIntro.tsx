import React, { useEffect, useRef, useState, useCallback } from 'react';

interface LogoIntroProps {
  onComplete: () => void;
}

type IntroPhase =
  | 'entering'   // fading in overlay
  | 'playing'    // video running
  | 'exiting'    // fading out
  | 'done';      // unmounted

const FADE_IN_MS  = 500;
const FADE_OUT_MS = 700;
const FALLBACK_MS = 15000; // absolute bail-out safety timer

export default function LogoIntro({ onComplete }: LogoIntroProps) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const fallbackRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase]             = useState<IntroPhase>('entering');
  const [skipVisible, setSkipVisible] = useState(false);

  // ── begin graceful exit ─────────────────────────────────────────────────
  const beginExit = useCallback(() => {
    if (fallbackRef.current) clearTimeout(fallbackRef.current);
    setPhase('exiting');
    setTimeout(() => {
      setPhase('done');
      onComplete();
    }, FADE_OUT_MS);
  }, [onComplete]);

  // ── mount: lock scroll, advance phases, set fallback ───────────────────
  useEffect(() => {
    // Lock html & body to prevent any mobile bounce or layout shift
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlHeight   = html.style.height;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyHeight   = document.body.style.height;
    const prevBodyMargin   = document.body.style.margin;
    const prevBodyPadding  = document.body.style.padding;

    html.style.overflow          = 'hidden';
    html.style.height            = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.height   = '100%';
    document.body.style.margin   = '0';
    document.body.style.padding  = '0';

    // Advance to 'playing' after fade-in completes
    const fadeTimer = setTimeout(() => setPhase('playing'), FADE_IN_MS);
    // Show skip button after 2s
    const skipTimer = setTimeout(() => setSkipVisible(true), 2000);
    // Absolute fallback in case media fails
    fallbackRef.current = setTimeout(beginExit, FALLBACK_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(skipTimer);
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
      html.style.overflow          = prevHtmlOverflow;
      html.style.height            = prevHtmlHeight;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.height   = prevBodyHeight;
      document.body.style.margin   = prevBodyMargin;
      document.body.style.padding  = prevBodyPadding;
    };
  }, [beginExit]);

  // ── Trigger video.play() with strict mobile autoplay compliance ────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const video = videoRef.current;
    if (!video) {
      beginExit();
      return;
    }

    // Ensure audio policy compliance for mobile browsers (iOS Safari & Android)
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked or interrupted -> exit gracefully to site
        beginExit();
      });
    }
  }, [phase, beginExit]);

  if (phase === 'done') return null;

  const opacity      = phase === 'exiting' ? 0 : phase === 'entering' ? 0 : 1;
  const transitionMs = phase === 'entering' ? FADE_IN_MS : FADE_OUT_MS;

  return (
    <div
      role="dialog"
      aria-label="ENKAY Renewables Energy — Introduction"
      aria-modal="true"
      className="enkay-intro-overlay"
      style={{
        opacity,
        transition: `opacity ${transitionMs}ms ease`,
        willChange: 'opacity',
      }}
    >
      {/* ── Responsive Video Wrapper (Flex Centered, 100dvh safe) ── */}
      <div className="enkay-intro-video-wrapper">
        {phase !== 'entering' && (
          <video
            ref={videoRef}
            className="enkay-intro-video"
            autoPlay
            muted
            playsInline
            disablePictureInPicture
            preload="auto"
            onEnded={beginExit}
            onError={beginExit}
            aria-hidden="true"
          >
            <source src="/assets/enkay-logo-intro-silent.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      {/* ── Subtle ambient glow accent ── */}
      <div aria-hidden="true" className="enkay-intro-ambient" />

      {/* ── Skip button with mobile-friendly touch target & safe area ── */}
      {skipVisible && phase !== 'exiting' && (
        <button
          type="button"
          onClick={beginExit}
          aria-label="Skip intro"
          className="enkay-intro-skip-btn"
        >
          Skip ›
        </button>
      )}
    </div>
  );
}
