import { useState } from "react";
import type { TopicGroup } from "../Flashcard.types";

const BASE_URL ="https://intervocalically-paleozoologic-elicia.ngrok-free.dev";

export interface GenerateQuizButtonProps {
  onGenerated: (data: TopicGroup[]) => void;
}

export default function GenerateQuizButton({
  onGenerated,
}: GenerateQuizButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/flashcards`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Accept: "application/json",
        },
      });

      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json"))
        throw new Error(
          "Server returned HTML instead of JSON. Check your VITE_API_URL."
        );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.detail ?? `Quiz fetch failed (${res.status})`
        );
      }

      const data: TopicGroup[] = await res.json();
      if (!data?.length)
        throw new Error(
          "No quiz data returned. Make sure a video has been processed first."
        );

      onGenerated(data);
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError(
          "Cannot reach the server. Check your VITE_API_URL or ngrok tunnel."
        );
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qz-btn-wrapper">
      <button
        className={`qz-btn ${loading ? "qz-btn--loading" : ""}`}
        onClick={handleGenerate}
        disabled={loading}
      >
        <span className="qz-btn__icon">
          {loading ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            </svg>
          )}
        </span>
        <span className="qz-btn__label">
          {loading ? "Processing…" : "Generate Quiz"}
        </span>
      </button>

      {error && <p className="qz-btn-error">⚠ {error}</p>}

      <style>{`
        .qz-btn-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .qz-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 28px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 0 0 0 rgba(216,99,99,0);
          white-space: nowrap;
        }

        .qz-btn:hover:not(:disabled) {
          background: #D86363;
          box-shadow: 0 4px 20px rgba(216,99,99,0.35);
          transform: translateY(-1px);
        }

        .qz-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .qz-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .qz-btn__icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .qz-btn__icon svg {
          width: 100%;
          height: 100%;
        }

        .qz-btn--loading .qz-btn__icon svg {
          animation: qz-spin 1s linear infinite;
        }

        @keyframes qz-spin { to { transform: rotate(360deg); } }

        .qz-btn-error {
          font-size: 0.82rem;
          color: #c0392b;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
