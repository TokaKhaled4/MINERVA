import React, { useState, useEffect } from "react";
import "./Sidebar.css";
import type { TopicSummary } from "../App";

const API_BASE = "https://intervocalically-paleozoologic-elicia.ngrok-free.dev";

export interface Topic {
  topic: string;
  first_timestamp: number;
  last_timestamp: number;
  segment: string;
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  uploadStatus?: string;
  uploadMessage?: string;
  uploadProgress?: number | null;
  videoUrl?: string | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  topics?: Topic[];
  topicSummaries?: TopicSummary[];
  onTopicClick?: (topic: Topic, index: number) => void;
  activeTopicIndex?: number | null;
  seekTo?: (startSec: number, endSec?: number) => void;
  highlightEnd?: number | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// STATUS CONFIG — maps each status key to label + colour class
const STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; cls: string }
> = {
  uploading:   { label: "Uploading video…",        icon: "⬆️", cls: "status-uploading"   },
  processing:  { label: "Processing…",             icon: "⚙️", cls: "status-processing"  },
  done:        { label: "Ready",                   icon: "✅", cls: "status-done"        },
  error:       { label: "Error",                   icon: "❌", cls: "status-error"       },
};

function FigureSlide({
  path,
  index,
  onSeek,
  startSec,
  endSec,
}: {
  path: string;
  index: number;
  onSeek?: (start: number, end?: number) => void;
  startSec?: number;
  endSec?: number;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  const rawUrl = `${API_BASE}/slide_image?path=${encodeURIComponent(path)}`;

  useEffect(() => {
    let revoked = false;
    fetch(rawUrl, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        if (!revoked) setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!revoked) setErrored(true);
      });
    return () => {
      revoked = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [rawUrl]);

  return (
    <div className="summary-figure-card">
      {errored ? (
        <div className="summary-figure-fallback">Image unavailable</div>
      ) : blobUrl ? (
        <img src={blobUrl} alt={`Figure ${index + 1}`} className="summary-figure-img" />
      ) : (
        <div className="summary-figure-skeleton" />
      )}
      {startSec !== undefined && (
        <button
          className="summary-figure-timestamp"
          onClick={() => onSeek?.(startSec, endSec)}
          title="Jump to this slide in the video"
        >
          ▶ {formatTime(startSec)}{endSec !== undefined ? ` – ${formatTime(endSec)}` : ""}
        </button>
      )}
    </div>
  );
}

function TopicSummaryPanel({
  summary,
  seekTo,
}: {
  summary: TopicSummary;
  seekTo?: (start: number, end?: number) => void;
}) {
  const startSec = summary.first_timestamp ?? undefined;
  const endSec   = summary.last_timestamp  ?? undefined;

  return (
    <div className="topic-summary-panel">
      {/* ── Transcript summary ── */}
      {summary.transcript_summary_ar && (
        <div className="summary-section">
          <div className="summary-section-label">📝 Transcript Summary</div>
          <p className="summary-text rtl-text">{summary.transcript_summary_ar}</p>
        </div>
      )}

      {/* ── Slide summary ── */}
      {summary.combined_slide_summary_en && (
        <div className="summary-section">
          <div className="summary-section-label">🖥 Slide Summary</div>
          <p className="summary-text">{summary.combined_slide_summary_en}</p>
        </div>
      )}

      {/* ── Key slides / figures ── */}
      {summary.slides_with_figures.length > 0 && (
        <div className="summary-section">
          <div className="summary-section-label">🖼 Key Slides</div>
          <div className="summary-figures-grid">
            {summary.slides_with_figures.map((path, i) => (
              <FigureSlide
                key={i}
                path={path}
                index={i}
                onSeek={seekTo}
                startSec={startSec}
                endSec={endSec}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Timestamp jump button ── */}
      {startSec !== undefined && (
        <button
          className="summary-jump-btn"
          onClick={() => seekTo?.(startSec, endSec)}
        >
          ▶ Jump to {formatTime(startSec)}
          {endSec !== undefined ? ` – ${formatTime(endSec)}` : ""}
        </button>
      )}
    </div>
  );
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  uploadStatus,
  uploadMessage,
  uploadProgress,
  videoUrl,
  videoRef,
  topics = [],
  topicSummaries = [],
  onTopicClick,
  activeTopicIndex,
  seekTo,
  highlightEnd,
}: SidebarProps) {
  const cfg = uploadStatus ? STATUS_CONFIG[uploadStatus] : null;
  const isSpinning = uploadStatus === "uploading" || uploadStatus === "processing";

  return (
    <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      {/* ── Header ── */}
      <div className="sidebar-header">
        <button
          className="sidebar-hamburger"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          onClick={() => setSidebarOpen?.(!sidebarOpen)}
        >
          <span /><span /><span />
        </button>
        <div className="sidebar-title">Minerva</div>
      </div>

      <div className="sidebar-content">
        {/* ── Upload status ── */}
        <div className="uploading">
          <h4>Upload Status</h4>
        </div>

        {cfg ? (
          <div className={`upload-progress ${uploadStatus === "done" ? "done" : ""} ${uploadStatus === "error" ? "error" : ""}`}>
            <div className="upload-progress-row">
              <span className="upload-progress-label">
                {uploadMessage || cfg.label}
              </span>
              {uploadProgress != null && uploadStatus !== "done" && uploadStatus !== "error" && (
                <span className="upload-progress-pct">{uploadProgress}%</span>
              )}
              {uploadStatus === "done" && (
                <span className="upload-progress-pct">100%</span>
              )}
              {uploadStatus === "error" && (
                <span className="upload-progress-pct">–</span>
              )}
            </div>
            <div className="upload-track">
              <div
                className={`upload-fill${
                  uploadStatus === "uploading" && uploadProgress == null ? " indeterminate" :
                  uploadStatus === "processing" ? " indeterminate" : ""
                }`}
                style={{
                  width:
                    uploadStatus === "done" ? "100%" :
                    uploadStatus === "error" ? `${uploadProgress ?? 38}%` :
                    uploadProgress != null   ? `${uploadProgress}%` : undefined,
                }}
              />
            </div>
          </div>
        ) : (
          <p className="progress-label">No upload in progress</p>
        )}

        {/* ── Video player ── */}
        {videoUrl && (
          <div className="video-preview">
            <h4>Uploaded Video</h4>
            <video ref={videoRef} src={videoUrl} controls className="sidebar-video" />
            {highlightEnd !== null && highlightEnd !== undefined && (
              <div className="video-chapter-badge">
                ⏱ Playing until {formatTime(highlightEnd)}
              </div>
            )}
          </div>
        )}

        {/* ── Topics list ── */}
        {topics.length > 0 && (
          <div className="topics-section">
            <h4>Extracted Topics</h4>
            <ul className="topics-list">
              {topics.map((topic, i) => {
                const isActive = activeTopicIndex === i;

                return (
                  <li key={i} className={`topic-item ${isActive ? "active" : ""}`}>
                    {/* Topic header row — click sends summary to chat */}
                    <div
                      className="topic-header"
                      onClick={() => onTopicClick?.(topic, i)}
                    >
                      <span className="topic-index">#{i + 1}</span>
                      <span className="topic-name">{topic.topic}</span>
                      <span className="topic-arrow">{isActive ? "▲" : "▼"}</span>
                    </div>

                    {/* Timestamp row — click to seek video */}
                    <div
                      className="topic-timestamp"
                      title="Click to jump to this section in the video"
                      onClick={(e) => {
                        e.stopPropagation();
                        seekTo?.(topic.first_timestamp, topic.last_timestamp);
                      }}
                    >
                      ▶ {formatTime(topic.first_timestamp)} – {formatTime(topic.last_timestamp)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}