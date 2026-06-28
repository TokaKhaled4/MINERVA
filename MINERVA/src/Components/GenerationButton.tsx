import { useState } from "react";

interface GenerationButtonProps {
  onGenerated: (data: MindmapData) => void;
}

export interface MindmapTopic {
  topic: string;
  content: string;
  keywords: string[];
  time_range: string;
  slides: unknown[];
}

export interface MindmapData {
  metadata: { title: string; date: string };
  data: MindmapTopic[];
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "https://intervocalically-paleozoologic-elicia.ngrok-free.dev";

export default function GenerationButton({ onGenerated }: GenerationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/mindmap`, {
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Accept": "application/json",
        },
      });

      // If ngrok intercepts, it returns HTML — catch it before JSON.parse blows up
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          "Server returned HTML instead of JSON. " +
          "Make sure VITE_API_URL is set to your ngrok tunnel URL and the tunnel is active."
        );
      }

      if (!res.ok) {
        let detail = `Server error ${res.status}`;
        try {
          const body = await res.json();
          if (body?.detail) detail = body.detail;
        } catch { /* ignore */ }
        throw new Error(detail);
      }

      const data: MindmapData = await res.json();

      if (!data?.data?.length) {
        throw new Error("No mind-map data returned. Make sure a video has been processed first.");
      }

      onGenerated(data);
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError("Cannot reach the server. Check your VITE_API_URL or ngrok tunnel.");
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gen-btn-wrapper">
      <button
        className={`gen-btn ${loading ? "gen-btn--loading" : ""}`}
        onClick={handleGenerate}
        disabled={loading}
      >
        <span className="gen-btn__icon">
          {loading ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" strokeLinecap="round"/>
            </svg>
          )}
        </span>
        <span className="gen-btn__label">
          {loading ? "Generating…" : "Generate Mind Map"}
        </span>
      </button>

      {error && (
        <p className="gen-btn-error">⚠ {error}</p>
      )}

      <style>{`
        .gen-btn-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .gen-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 28px;
          background: #000;
          color: #fff;
          border: 2px solid #D86363;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 0 0 0 rgba(216,99,99,0);
        }

        .gen-btn:hover:not(:disabled) {
          background: #D86363;
          box-shadow: 0 4px 20px rgba(216,99,99,0.35);
          transform: translateY(-1px);
        }

        .gen-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .gen-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .gen-btn__icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .gen-btn--loading .gen-btn__icon svg {
          animation: spin-slow 1s linear infinite;
        }

        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }

        .gen-btn-error {
          font-size: 0.82rem;
          color: #c0392b;
          margin: 0;
        }
      `}</style>
    </div>
  );
}