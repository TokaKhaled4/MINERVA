import SendButtonIcon from "../assets/Email Send.svg";
import UploadButtonIcon from "../assets/Upload.svg";
import { useState, useRef } from "react";
import "./ChatBox.css";

const API_BASE = "https://intervocalically-paleozoologic-elicia.ngrok-free.dev";

export interface SlideResult {
  slide_id?: string;
  path?: string;
  image_path?: string;
  score?: number;
  similarity?: number;
  start_time?: string;
  end_time?: string;
  message?: string;
  [key: string]: unknown;
}

type ChatBoxProps = {
  onSend?: (text: string) => void;
  onUploadStart?: (jobId: string) => void;
  onStatusUpdate?: (status: string, message: string, progress?: number) => void;
  onUploadDone?: () => void;
  onUploadError?: (error: string) => void;
  onVideoSelected?: (url: string) => void;
  onImageSearchResult?: (results: SlideResult[], previewUrl: string) => void;
  onImageSearchError?: (error: string) => void;
};

export default function ChatBox({
  onSend,
  onUploadStart,
  onStatusUpdate,
  onUploadDone,
  onUploadError,
  onVideoSelected,
  onImageSearchResult,
  onImageSearchError,
}: ChatBoxProps) {
  const [message, setMessage]     = useState("");
  const [showMenu, setShowMenu]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searching, setSearching] = useState(false);

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const imageInputRef  = useRef<HTMLInputElement>(null);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const objectUrlRef   = useRef<string | null>(null);

  // ── Polling /status ───────────────────────────────────────────────────────
  const startPolling = () => {
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API_BASE}/status`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        const data = await res.json();

        onStatusUpdate?.(data.status, data.message ?? "");

        if (data.status === "done") {
          clearInterval(pollRef.current!);
          setUploading(false);
          onUploadDone?.();
        } else if (data.status === "error") {
          clearInterval(pollRef.current!);
          setUploading(false);
          onUploadError?.(data.message ?? "Unknown processing error");
        }
      } catch {
        clearInterval(pollRef.current!);
        setUploading(false);
        onUploadError?.("Lost connection to server while polling status.");
      }
    }, 3000);
  };

  // ── Video upload handler (XHR for progress events) ────────────────────────
  const handleVideoUpload = (file: File) => {
    setShowMenu(false);
    setUploading(true);

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    onVideoSelected?.(localUrl);

    // Signal upload started immediately
    onStatusUpdate?.("uploading", "Uploading video…", 0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    // ── Progress ──────────────────────────────────────────────────────────
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onStatusUpdate?.("uploading", "Uploading video…", pct);
      }
    });

    // ── Load (server responded) ───────────────────────────────────────────
    xhr.addEventListener("load", () => {
      if (xhr.status === 409) {
        setUploading(false);
        onUploadError?.("A video is already being processed. Please wait.");
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        let detail = `Upload failed (${xhr.status})`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err?.detail) detail = err.detail;
        } catch { /* ignore */ }
        setUploading(false);
        onUploadError?.(detail);
        return;
      }

      try {
        const data = JSON.parse(xhr.responseText);
        onUploadStart?.(data.job_id);
        // Switch to processing phase and start polling
        onStatusUpdate?.("processing", "Processing…");
        startPolling();
      } catch {
        setUploading(false);
        onUploadError?.("Unexpected server response.");
      }
    });

    // ── Network error ─────────────────────────────────────────────────────
    xhr.addEventListener("error", () => {
      setUploading(false);
      onUploadError?.("Network error during upload.");
    });

    xhr.open("POST", `${API_BASE}/upload_video`);
    xhr.setRequestHeader("ngrok-skip-browser-warning", "true");
    xhr.send(formData);
  };

  // ── Image search handler ──────────────────────────────────────────────────
  const handleImageSearch = async (file: File) => {
    setShowMenu(false);
    setSearching(true);

    const previewUrl = URL.createObjectURL(file);
    const formData   = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/search_by_image`, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
        body: formData,
      });

      if (res.status === 425)
        throw new Error("Please wait for the video to finish processing first.");

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { detail?: string }).detail ?? `Image search failed (${res.status})`
        );
      }

      const data = await res.json();
      onImageSearchResult?.(data.image ?? [], previewUrl);
    } catch (err: unknown) {
      URL.revokeObjectURL(previewUrl);
      onImageSearchError?.((err as Error).message ?? "Image search failed");
    } finally {
      setSearching(false);
    }
  };

  const openVideoPicker = () => fileInputRef.current?.click();
  const openImagePicker = () => imageInputRef.current?.click();

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) handleVideoUpload(file);
    e.target.value = "";
  };

  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageSearch(file);
    e.target.value = "";
  };

  const handleSend = () => {
    const query = message.trim();
    if (!query) return;
    onSend?.(query);
    setMessage("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    setMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const isDisabled = uploading || searching;

  return (
    <div className="chat-container">
      {/* Hidden video file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Hidden image file picker */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageChange}
      />

      <div className="chatbox">
        <button
          type="button"
          className="chatbox-upload"
          aria-label="Upload file"
          disabled={isDisabled}
          onClick={() => setShowMenu((prev) => !prev)}
        >
          {searching ? (
            <span className="upload-spinner" />
          ) : (
            <img src={UploadButtonIcon} className="UploadIcon" alt="Upload" />
          )}
        </button>

        {showMenu && !isDisabled && (
          <div className="upload-menu">
            <button onClick={openVideoPicker}>Upload Video</button>
            <button onClick={openImagePicker}>Upload Image</button>
          </div>
        )}

        <textarea
          className="chat-input"
          placeholder="Chat with Minerva or upload a video for processing..."
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button
          disabled={!message.trim()}
          type="button"
          className="chatbox-send"
          onClick={handleSend}
          aria-label="Send message"
        >
          <img src={SendButtonIcon} className="SendIcon" alt="Send" />
        </button>
      </div>
    </div>
  );
}