import { useState } from "react";
import type { QACard, QATopicGroup } from "../Flashcard.types";

const TOPIC_PALETTES = [
  { from: "#EB5951", to: "#C0392B", correct: "#a8ff78" },
  { from: "#DA7373", to: "#B15757", correct: "#a8ff78" },
  { from: "#8A3A3A", to: "#5a1a1a", correct: "#a8ff78" },
  { from: "#D86363", to: "#C04444", correct: "#a8ff78" },
  { from: "#c0392b", to: "#922b21", correct: "#a8ff78" },
  { from: "#202020", to: "#0a0a0a", correct: "#a8ff78" },
];

// ─── Navigator — owns BOTH index and flip state; card never remounts ──────────
function CardNavigator({ groups }: { groups: QATopicGroup[] }) {
  const allCards: { card: QACard; palette: (typeof TOPIC_PALETTES)[number] }[] = [];
  groups.forEach((g, gi) => {
    const palette = TOPIC_PALETTES[gi % TOPIC_PALETTES.length];
    g.flashcards.forEach((c) => allCards.push({ card: c, palette }));
  });

  const total                     = allCards.length;
  const [index, setIndex]         = useState(0);
  const [flipped, setFlipped]     = useState(false);
  // When true the CSS transition is suppressed so we can snap back to front
  const [noAnim, setNoAnim]       = useState(false);

  const goTo = (next: number) => {
    if (next === index || next < 0 || next >= total) return;
    if (flipped) {
      // 1) kill transition
      setNoAnim(true);
      // 2) snap to front
      setFlipped(false);
      // 3) after one paint, re-enable transition & change card
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setNoAnim(false);
          setIndex(next);
        });
      });
    } else {
      setIndex(next);
    }
  };

  const { card, palette } = allCards[index];

  // Only fill_blank cards contain a literal blank (____) to split on.
  // short_answer cards are full questions with no blank — render them as
  // plain question text instead of forcing a fake blank line.
  const hasBlank = card.type === "fill_blank" && /_{2,}/.test(card.question);
  const parts    = hasBlank ? card.question.split(/_{2,}/) : [card.question];
  const before   = parts[0] ?? "";
  const after    = parts[1] ?? "";

  return (
    <>
      <div className="fc3-wrap">
        {/* counter */}
        <p className="fc3-counter">
          <span className="fc3-cur">{index + 1}</span>
          <span className="fc3-sep"> / </span>
          <span className="fc3-tot">{total}</span>
        </p>

        {/* card scene — single persistent element, never remounts */}
        <div
          className="fc3-scene"
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
          aria-label={flipped ? "Flip to question" : "Flip to answer"}
        >
          <div
            className="fc3-card"
            style={{
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: noAnim
                ? "none"
                : "transform 0.55s cubic-bezier(0.45,0.05,0.55,0.95), box-shadow 0.25s ease",
            }}
          >
            {/* FRONT */}
            <div
              className="fc3-face fc3-front"
              style={{ background: `linear-gradient(145deg, ${palette.from}, ${palette.to})` }}
            >
              <div className="fc3-noise" />
              <p className="fc3-question">
                {before}
                {hasBlank && <span className="fc3-blank">_______</span>}
                {after}
              </p>
              <span className="fc3-hint">tap to reveal</span>
            </div>

            {/* BACK */}
            <div className="fc3-face fc3-back">
              <div className="fc3-noise" />
              <p className="fc3-answer" style={{ color: palette.correct }}>
                {card.correct_answer}
              </p>
              <span className="fc3-hint" style={{ color: "#555" }}>tap to flip back</span>
            </div>
          </div>
        </div>

        {/* controls */}
        <div className="fc3-controls">
          <button
            className="fc3-arrow"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous"
          >←</button>

          <div className="fc3-dots">
            {allCards.map((_, i) => (
              <button
                key={i}
                className={`fc3-dot ${i === index ? "active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Card ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="fc3-arrow"
            onClick={() => goTo(index + 1)}
            disabled={index === total - 1}
            aria-label="Next"
          >→</button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');

        .fc3-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 20px 16px;
          width: 100%;
        }

        /* counter */
        .fc3-counter {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #555;
          margin: 0;
        }
        .fc3-cur  { color: #EB5951; font-weight: 600; }

        /* scene */
        .fc3-scene {
          width: 480px;
          max-width: 88vw;
          height: 200px;
          perspective: 1000px;
          cursor: pointer;
          outline: none;
        }
        .fc3-scene:focus-visible .fc3-card {
          box-shadow: 0 0 0 3px rgba(235,89,81,0.5), 0 16px 40px rgba(0,0,0,0.5);
        }

        /* card */
        .fc3-card {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          border-radius: 14px;
          box-shadow: 0 14px 40px rgba(0,0,0,0.36), 0 3px 10px rgba(0,0,0,0.26);
        }

        /* faces */
        .fc3-face {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 32px;
          overflow: hidden;
        }

        .fc3-back {
          transform: rotateY(180deg);
          background: linear-gradient(145deg, #111, #1c1c1c) !important;
          border: 1px solid #242424;
        }

        /* noise */
        .fc3-noise {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.14;
        }

        /* text */
        .fc3-question {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(0.88rem, 2vw, 1.04rem);
          line-height: 1.65;
          color: #fff;
          text-align: center;
          margin: 0;
          position: relative;
          z-index: 1;
          text-shadow: 0 1px 5px rgba(0,0,0,0.2);
        }

        .fc3-blank {
          display: inline-block;
          border-bottom: 2px solid rgba(255,255,255,0.6);
          min-width: 68px;
          margin: 0 4px;
          color: transparent;
          vertical-align: bottom;
          line-height: 1;
        }

        .fc3-answer {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(1.4rem, 3.5vw, 2rem);
          font-style: italic;
          text-align: center;
          margin: 0;
          position: relative;
          z-index: 1;
          animation: fc3-glow 2.2s ease-in-out infinite alternate;
        }

        @keyframes fc3-glow {
          from { text-shadow: 0 0 14px currentColor; }
          to   { text-shadow: 0 0 40px currentColor, 0 0 65px currentColor; }
        }

        .fc3-hint {
          position: absolute;
          bottom: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          z-index: 1;
        }

        /* controls */
        .fc3-controls {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .fc3-arrow {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid #252525;
          background: transparent;
          color: #666;
          font-size: 0.95rem;
          cursor: pointer;
          transition: border-color 0.18s, color 0.18s, background 0.18s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          flex-shrink: 0;
        }
        .fc3-arrow:hover:not(:disabled) {
          border-color: #EB5951;
          color: #EB5951;
          background: rgba(235,89,81,0.08);
        }
        .fc3-arrow:disabled { opacity: 0.16; cursor: not-allowed; }

        .fc3-dots {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 240px;
        }
        .fc3-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          border: none;
          background: #2a2a2a;
          cursor: pointer;
          padding: 0;
          transition: background 0.18s, transform 0.18s;
        }
        .fc3-dot.active { background: #EB5951; transform: scale(1.5); }
        .fc3-dot:hover:not(.active) { background: #444; }
      `}</style>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function FlashcardEmptyState() {
  return (
    <>
      <div className="fc3-empty">
        <div className="fc3-empty-icon">
          <svg viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="120" height="72" rx="12" fill="#1a1a1a" stroke="#EB5951" strokeWidth="1.5" opacity="0.4"/>
            <rect x="12" y="14" width="120" height="72" rx="12" fill="#1a1a1a" stroke="#DA7373" strokeWidth="1.5" opacity="0.6"/>
            <rect x="4"  y="8"  width="120" height="72" rx="12" fill="#111"    stroke="#EB5951" strokeWidth="1.5"/>
            <rect x="16" y="26" width="60" height="6" rx="3" fill="#EB5951" opacity="0.6"/>
            <rect x="16" y="40" width="90" height="4" rx="2" fill="#fff" opacity="0.1"/>
            <rect x="16" y="52" width="75" height="4" rx="2" fill="#fff" opacity="0.1"/>
            <rect x="16" y="64" width="50" height="4" rx="2" fill="#fff" opacity="0.08"/>
          </svg>
        </div>
        <p className="fc3-empty-title">No flashcards yet</p>
        <p className="fc3-empty-sub">Upload a lecture and click <strong>Generate Flashcards</strong></p>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');
        .fc3-empty { display:flex; flex-direction:column; align-items:center; gap:12px; padding:50px 20px; opacity:0.7; }
        .fc3-empty-icon { width:110px; }
        .fc3-empty-title { font-family:'DM Serif Display',Georgia,serif; font-size:1.15rem; color:#ccc; margin:0; }
        .fc3-empty-sub { font-family:'DM Sans',sans-serif; font-size:0.83rem; color:#555; margin:0; text-align:center; }
        .fc3-empty-sub strong { color:#EB5951; }
      `}</style>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function FlashcardDeck({ data }: { data: QATopicGroup[] }) {
  const total = data.reduce((s, t) => s + t.flashcards.length, 0);
  if (total === 0) return <FlashcardEmptyState />;
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
      minHeight: "45vh",
      justifyContent: "center",
    }}>
      <CardNavigator groups={data} />
    </div>
  );
}