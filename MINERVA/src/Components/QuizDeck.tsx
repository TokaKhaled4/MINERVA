import { useState } from "react";
import type { TopicGroup, MultipleChoiceCard } from "../Flashcard.types";

const TOPIC_PALETTES = [
  { from: "#EB5951", to: "#C0392B" },
  { from: "#DA7373", to: "#B15757" },
  { from: "#8A3A3A", to: "#5a1a1a" },
  { from: "#D86363", to: "#C04444" },
  { from: "#c0392b", to: "#922b21" },
  { from: "#202020", to: "#0a0a0a" },
];

const OPTION_LABELS = ["A", "B", "C", "D"];

// ─── Navigator — owns index + per-card answer state, no remounts ──────────────
function QuizNavigator({ groups }: { groups: TopicGroup[] }) {
  const allCards: { card: MultipleChoiceCard; palette: (typeof TOPIC_PALETTES)[number] }[] = [];
  groups.forEach((g, gi) => {
    const palette = TOPIC_PALETTES[gi % TOPIC_PALETTES.length];
    g.flashcards.forEach((c) => {
      if (c.type === "multiple_choice")
        allCards.push({ card: c as MultipleChoiceCard, palette });
    });
  });

  const total = allCards.length;

  // Store selected answer per card index so navigating back shows previous answer
  const [index, setIndex]     = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  if (total === 0) return <QuizEmptyState />;

  const { card, palette } = allCards[index];
  const selected  = answers[index] ?? null;
  const answered  = selected !== null;

  const select = (opt: string) => {
    if (answered) return;
    setAnswers((prev) => ({ ...prev, [index]: opt }));
  };

  const goTo = (next: number) => {
    if (next < 0 || next >= total) return;
    setIndex(next);
  };

  const getState = (opt: string) => {
    if (!answered) return "idle";
    if (opt === card.correct_answer) return "correct";
    if (opt === selected) return "wrong";
    return "dim";
  };

  return (
    <>
      <div className="qzn-root">
        {/* progress bar */}
        <div className="qzc-progress-track">
          <div
            className="qzc-progress-fill"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        {/* counter */}
        <p className="qzc-counter">
          <span className="qzc-cur">{index + 1}</span>
          <span className="qzc-sep"> / </span>
          <span className="qzc-tot">{total}</span>
        </p>

        {/* question card — single persistent element */}
        <div
          className="qzc-card"
          style={{ background: `linear-gradient(145deg, ${palette.from}, ${palette.to})` }}
        >
          <div className="qzc-noise" />
          <p className="qzc-question">{card.question}</p>
        </div>

        {/* options */}
        <ul className="qzc-options">
          {card.options.map((opt, i) => {
            const state = getState(opt);
            return (
              <li key={i}>
                <button
                  className={`qzc-option qzc-option--${state}`}
                  onClick={() => select(opt)}
                  disabled={answered}
                  aria-label={`Option ${OPTION_LABELS[i]}: ${opt}`}
                >
                  <span className="qzc-opt-label">{OPTION_LABELS[i]}</span>
                  <span className="qzc-opt-text">{opt}</span>
                  {state === "correct" && <span className="qzc-opt-icon">✓</span>}
                  {state === "wrong"   && <span className="qzc-opt-icon qzc-opt-icon--x">✗</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {/* feedback */}
        {answered && (
          <p className={`qzc-feedback ${selected === card.correct_answer ? "qzc-feedback--ok" : "qzc-feedback--err"}`}>
            {selected === card.correct_answer
              ? "Correct!"
              : `Answer: "${card.correct_answer}"`}
          </p>
        )}

        {/* nav controls */}
        <div className="qzn-controls">
          <button className="qzn-arrow" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous">←</button>
          <div className="qzn-dots">
            {allCards.map((_, i) => (
              <button
                key={i}
                className={`qzn-dot ${i === index ? "active" : ""} ${answers[i] !== undefined ? (answers[i] === allCards[i].card.correct_answer ? "correct" : "wrong") : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Question ${i + 1}`}
              />
            ))}
          </div>
          <button className="qzn-arrow" onClick={() => goTo(index + 1)} disabled={index === total - 1} aria-label="Next">→</button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');

        .qzn-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 540px;
          margin: 0 auto;
          gap: 10px;
          padding: 0 16px;
        }

        /* progress */
        .qzc-progress-track {
          width: 100%;
          height: 3px;
          background: #e8e8e8;
          border-radius: 99px;
          overflow: hidden;
        }
        .qzc-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #EB5951, #DA7373);
          border-radius: 99px;
          transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
        }

        /* counter */
        .qzc-counter {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #888;
          margin: 0;
          align-self: flex-start;
        }
        .qzc-cur { color: #EB5951; font-weight: 600; }

        /* question card */
        .qzc-card {
          width: 100%;
          border-radius: 14px;
          padding: 20px 24px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.12);
          position: relative;
          overflow: hidden;
        }
        .qzc-noise {
          position: absolute; inset: 0; border-radius: 14px;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; opacity: 0.13;
        }
        .qzc-question {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(0.88rem, 2vw, 1.02rem);
          line-height: 1.6;
          color: #fff;
          margin: 0;
          position: relative; z-index: 1;
          text-shadow: 0 1px 4px rgba(0,0,0,0.18);
        }

        /* options */
        .qzc-options {
          list-style: none; padding: 0; margin: 0;
          width: 100%;
          display: flex; flex-direction: column; gap: 7px;
        }
        .qzc-option {
          width: 100%;
          display: flex; align-items: center; gap: 10px;
          padding: 9px 14px;
          border-radius: 9px;
          border: 1.5px solid #e0e0e0;
          background: #fff;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.84rem;
          line-height: 1.4;
          color: #222;
          text-align: left;
          transition: border-color 0.15s, background 0.15s, color 0.15s, transform 0.1s;
        }
        .qzc-option:hover:not(:disabled) {
          border-color: #EB5951;
          background: rgba(235,89,81,0.04);
          transform: translateX(3px);
        }
        .qzc-option:disabled { cursor: default; }
        .qzc-option--correct { border-color: #27ae60 !important; background: rgba(39,174,96,0.08) !important; color: #1a7a40 !important; }
        .qzc-option--wrong   { border-color: #e74c3c !important; background: rgba(231,76,60,0.08) !important; color: #c0392b !important; }
        .qzc-option--dim     { border-color: #efefef !important; background: #fafafa !important; color: #bbb !important; }

        .qzc-opt-label {
          font-size: 0.64rem; font-weight: 700; letter-spacing: 0.08em;
          color: #bbb; flex-shrink: 0; width: 16px; text-align: center;
        }
        .qzc-option--correct .qzc-opt-label { color: #27ae60; }
        .qzc-option--wrong   .qzc-opt-label { color: #e74c3c; }
        .qzc-opt-text { flex: 1; }
        .qzc-opt-icon { font-size: 0.85rem; flex-shrink: 0; color: #27ae60; font-weight: 700; }
        .qzc-opt-icon--x { color: #e74c3c; }

        /* feedback */
        .qzc-feedback {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          margin: 0; padding: 7px 12px;
          border-radius: 7px;
          width: 100%; text-align: center;
          animation: qzc-in 0.22s ease;
        }
        .qzc-feedback--ok  { background: rgba(39,174,96,0.09);  color: #1a7a40; border: 1px solid rgba(39,174,96,0.22); }
        .qzc-feedback--err { background: rgba(231,76,60,0.07); color: #c0392b; border: 1px solid rgba(231,76,60,0.18); }
        @keyframes qzc-in { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }

        /* nav */
        .qzn-controls { display: flex; align-items: center; gap: 12px; padding-top: 4px; }
        .qzn-arrow {
          width: 32px; height: 32px; border-radius: 50%;
          border: 1.5px solid #252525; background: transparent; color: #666;
          font-size: 0.9rem; cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Sans', sans-serif; flex-shrink: 0;
        }
        .qzn-arrow:hover:not(:disabled) { border-color: #EB5951; color: #EB5951; background: rgba(235,89,81,0.08); }
        .qzn-arrow:disabled { opacity: 0.15; cursor: not-allowed; }

        .qzn-dots { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; max-width: 240px; }
        .qzn-dot {
          width: 6px; height: 6px; border-radius: 50%; border: none;
          background: #ddd; cursor: pointer; padding: 0;
          transition: background 0.15s, transform 0.15s;
        }
        .qzn-dot.active  { background: #EB5951; transform: scale(1.5); }
        .qzn-dot.correct { background: #27ae60; }
        .qzn-dot.wrong   { background: #e74c3c; }
        .qzn-dot.active.correct { background: #27ae60; transform: scale(1.5); }
        .qzn-dot.active.wrong   { background: #e74c3c; transform: scale(1.5); }
        .qzn-dot:hover:not(.active) { background: #bbb; }
      `}</style>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function QuizEmptyState() {
  return (
    <>
      <div className="qze-empty">
        <div className="qze-icon">
          <svg viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="15" width="140" height="80" rx="12" fill="#1a1a1a" stroke="#EB5951" strokeWidth="1.5" opacity="0.35"/>
            <rect x="4"  y="8"  width="140" height="80" rx="12" fill="#111" stroke="#EB5951" strokeWidth="1.5"/>
            <rect x="18" y="26" width="80" height="6" rx="3" fill="#EB5951" opacity="0.55"/>
            <rect x="18" y="42" width="8" height="8" rx="4" fill="#DA7373" opacity="0.5"/>
            <rect x="32" y="44" width="60" height="4" rx="2" fill="#fff" opacity="0.12"/>
            <rect x="18" y="56" width="8" height="8" rx="4" fill="#DA7373" opacity="0.5"/>
            <rect x="32" y="58" width="50" height="4" rx="2" fill="#fff" opacity="0.12"/>
            <rect x="18" y="70" width="8" height="8" rx="4" fill="#DA7373" opacity="0.5"/>
            <rect x="32" y="72" width="70" height="4" rx="2" fill="#fff" opacity="0.12"/>
          </svg>
        </div>
        <p className="qze-title">No quiz yet</p>
        <p className="qze-sub">Upload a lecture and click <strong>Generate Quiz</strong></p>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');
        .qze-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:40px 20px; opacity:0.75; }
        .qze-icon { width:100px; }
        .qze-title { font-family:'DM Serif Display',Georgia,serif; font-size:1.15rem; color:#ccc; margin:0; }
        .qze-sub { font-family:'DM Sans',sans-serif; font-size:0.83rem; color:#888; margin:0; text-align:center; }
        .qze-sub strong { color:#EB5951; }
      `}</style>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function QuizDeck({ data }: { data: TopicGroup[] }) {
  const total = data.reduce(
    (s, t) => s + t.flashcards.filter((c) => c.type === "multiple_choice").length, 0
  );
  if (total === 0) return <QuizEmptyState />;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"100%" }}>
      <QuizNavigator groups={data} />
    </div>
  );
}