import "./Chat.css";
import { useState, useRef, useEffect } from "react";
import ChatBox from "../Components/ChatBox";
import type { SlideResult } from "../Components/ChatBox";
import { useOutletContext } from "react-router-dom";
import type { UploadContext, Topic, TopicSummary } from "../App";

const API_BASE = "https://intervocalically-paleozoologic-elicia.ngrok-free.dev";

type Route = "Topic" | "RAG" | "Image" | "Hybrid" | "ImageSearch";

interface ChatResponse {
  route: Route;
  text: string | null;
  image: SlideResult[] | null;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  text?: string;
  images?: SlideResult[];
  route?: Route;
  topicIndex?: number;
  uploadedImagePreview?: string;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function getImageUrl(slide: SlideResult): string | null {
  const p =
    slide.path ??
    slide.image_path ??
    ((slide as Record<string, unknown>)["img_path"] as string | undefined);
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `${API_BASE}/slide_image?path=${encodeURIComponent(p)}`;
}

function timeStrToSec(t: string): number {
  const parts = t.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TIMESTAMP_RE = /\[(\d{2}:\d{2}:\d{2})\s*→\s*(\d{2}:\d{2}:\d{2})\]/g;

interface TextChunk {
  type: "text" | "timestamp";
  value: string;
  start?: number;
  end?: number;
}

function parseTextWithTimestamps(text: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TIMESTAMP_RE.lastIndex = 0;
  while ((match = TIMESTAMP_RE.exec(text)) !== null) {
    if (match.index > lastIndex)
      chunks.push({ type: "text", value: text.slice(lastIndex, match.index) });
    chunks.push({
      type: "timestamp",
      value: match[0],
      start: timeStrToSec(match[1]),
      end: timeStrToSec(match[2]),
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length)
    chunks.push({ type: "text", value: text.slice(lastIndex) });
  return chunks;
}

function SlideImage({
  slide,
  index,
  onSeek,
  hideTsChip,
}: {
  slide: SlideResult;
  index: number;
  onSeek?: (start: number, end?: number) => void;
  hideTsChip?: boolean;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  const rawUrl = getImageUrl(slide);
  const startSec = slide.start_time ? timeStrToSec(slide.start_time) : undefined;
  const endSec   = slide.end_time   ? timeStrToSec(slide.end_time)   : undefined;

  useEffect(() => {
    if (!rawUrl) return;
    let revoked = false;
    fetch(rawUrl, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        if (revoked) return;
        setBlobUrl(URL.createObjectURL(blob));
      })
      .catch((e) => {
        console.error("Slide image fetch failed:", rawUrl, e);
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
    <div className="slide-card">
      {errored || !rawUrl ? (
        <div className="image-fallback">Image unavailable</div>
      ) : blobUrl ? (
        <img src={blobUrl} alt={`Slide ${index + 1}`} className="message-slide-img" />
      ) : (
        <div className="image-skeleton" />
      )}
      {startSec !== undefined && !hideTsChip && (
        <button
          className="timestamp-chip slide-timestamp"
          title="Jump to this slide in the video"
          onClick={() => onSeek?.(startSec, endSec)}
        >
          ▶ {formatTime(startSec)}
          {endSec !== undefined ? ` – ${formatTime(endSec)}` : ""}
        </button>
      )}
    </div>
  );
}

function ImageSearchResult({
  msg,
  onSeek,
}: {
  msg: Message;
  onSeek?: (start: number, end?: number) => void;
}) {
  const noMatch = msg.images?.length === 1 && msg.images[0].message != null;

  if (noMatch) {
    return (
      <div className="message-bubble message-assistant">
        <p className="message-text">This slide does not appear to exist in the video.</p>
      </div>
    );
  }

  return (
    <div className="message-bubble message-assistant">
      <p className="message-text">
        {msg.images?.map((slide, i) => {
          const startSec = slide.start_time ? timeStrToSec(slide.start_time) : undefined;
          const endSec   = slide.end_time   ? timeStrToSec(slide.end_time)   : undefined;
          const hasTime  = startSec !== undefined;
          return (
            <span key={i}>
              {i > 0 && "  "}
              {hasTime ? (
                <>
                  This slide appears in the video at{" "}
                  <button
                    className="timestamp-chip"
                    title="Jump to this moment in the video"
                    onClick={() => onSeek?.(startSec!, endSec)}
                  >
                    ▶ {formatTime(startSec!)}
                    {endSec !== undefined ? ` – ${formatTime(endSec)}` : ""}
                  </button>
                </>
              ) : (
                "This slide was found in the video but has no timestamp."
              )}
            </span>
          );
        })}
      </p>
    </div>
  );
}

function MessageBubble({
  msg,
  onDismissTopic,
  onSeek,
}: {
  msg: Message;
  onDismissTopic?: (i: number) => void;
  onSeek?: (start: number, end?: number) => void;
}) {
  if (msg.role === "user")
    return (
      <div className="message-bubble message-user">
        <p className="message-text">{msg.text}</p>
      </div>
    );

  if (msg.role === "error")
    return (
      <div className="message-bubble message-assistant message-error">
        <p className="message-text">⚠️ {msg.text}</p>
      </div>
    );

  if (msg.route === "ImageSearch")
    return <ImageSearchResult msg={msg} onSeek={onSeek} />;

  const badgeClass = msg.route === "Topic" ? "route-badge route-topic" : "";

  return (
    <div className="message-bubble message-assistant">
      <div className="message-bubble-header">
        {msg.route && <span className={badgeClass}>{msg.route}</span>}
        {msg.topicIndex !== undefined && (
          <button
            className="topic-dismiss"
            onClick={() => onDismissTopic?.(msg.topicIndex!)}
          >
            ✕
          </button>
        )}
      </div>

      {msg.text && (
        <div className="message-text">
          {msg.text.split("\n").map((line, i) => {
            const isArabic = /[\u0600-\u06FF]/.test(line);
            const chunks = parseTextWithTimestamps(line);
            return (
              <p
                key={i}
                className={isArabic ? "message-line rtl-text" : "message-line"}
                style={{ margin: "0 0 4px" }}
              >
                {chunks.map((chunk, j) =>
                  chunk.type === "timestamp" ? (
                    msg.route === "Topic" ? (
                      <span key={j} />
                    ) : (
                      <button
                        key={j}
                        className="timestamp-chip"
                        title="Jump to this moment in the video"
                        onClick={() => onSeek?.(chunk.start!, chunk.end)}
                      >
                        ▶ {formatTime(chunk.start!)} – {formatTime(chunk.end!)}
                      </button>
                    )
                  ) : (
                    <span key={j}>{chunk.value}</span>
                  )
                )}
              </p>
            );
          })}
        </div>
      )}

      {msg.images && msg.images.length > 0 && (
        <div className="message-images">
          {msg.images.map((slide, i) => (
            <SlideImage key={i} slide={slide} index={i} onSeek={onSeek} hideTsChip={msg.route === "Topic"} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Feather logo (inline SVG, extracted from feather_art.svg) ──
function FeatherLogo({ size = 120 }: { size?: number }) {
  return (
    <svg style={{ opacity: 0.35 }}
      width={size}
      height={size}
      viewBox="306 85 252 210"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <path
          style={{ fill: "#ffaaaa" }}
          d="M 478.82535,259.19735 C 414.06034,245.8944 331.64933,193.2984 322.97286,169.58146 c 0,0 1.75734,-6.79109 2.75759,-8.97496 0.13474,-0.29418 -7.14383,-4.81181 -7.21023,-5.20216 -13.63883,-80.184031 25.45487,-51.25696 33.68802,-44.50662 1.64024,1.34483 8.47637,7.87258 15.71389,15.97845 0.35764,0.40055 -1.44231,7.27013 -1.51639,7.32333 0,0 7.05315,-1.17895 7.13226,-1.14121 18.72788,8.93364 36.40518,31.51199 58.26533,46.27875 0.2156,0.14564 0.84436,7.12715 0.84436,7.12715 0,0 5.07682,-1.32908 5.71211,-0.78455 12.0602,10.33731 42.28097,40.84577 55.34942,40.84577 z"
        />
        <path style={{ fill: "#ffd5d5" }} d="m 485.88348,238.50618 c 0,0 -9.52664,2.96584 -12.51186,10.31088 -3.28754,8.08884 -1.81955,11.12115 -1.81955,11.12115 z" />
        <path style={{ fill: "#ffd5d5" }} d="m 480.81108,245.72637 c 0,0 -8.57061,12.94175 -15.19199,20.78742 -0.23438,-0.42481 18.5266,-11.29197 16.76611,-3.2651 0.10657,7.09632 -1.10108,8.58949 -1.10108,8.58949 0,0 3.5477,-3.11714 6.01317,-6.27554 4.41807,-5.65975 11.3227,-20.60114 11.3227,-20.60114 l -9.98437,-8.66785 z" />
        <path style={{ fill: "#ffd5d5" }} d="m 484.09684,237.63029 c 0,0 3.9871,-15.00157 5.45766,-25.16201 -0.47328,0.10679 3.85683,21.35106 8.69027,14.70517 5.37722,-4.6319 4.83887,-5.55977 4.83887,-5.55977 0,0 0.76143,6.48112 0.0366,10.42176 -1.29885,7.06153 -7.77113,19.41979 -7.77113,19.41979 l -16.52891,-1.19055 z" />
        <path style={{ fill: "#ffd5d5" }} d="m 483.6133,244.88699 c 0,0 -4.41841,-8.94598 -1.15513,-16.17178 3.59373,-7.95754 6.80242,-8.98432 6.80242,-8.98432 z" />
        <path style={{ fill: "#ffd5d5" }} d="m 483.9984,216.08855 c 0,0 1.54284,3.72097 1.08906,7.89571 -0.45377,4.17475 3.53946,-2.26888 3.53946,-2.26888 z" />
        <path style={{ fill: "#ffd5d5" }} d="m 466.06126,260.83763 c 0,0 3.42505,-2.12015 5.49404,-5.77441 2.069,-3.65427 1.54889,3.90852 1.54889,3.90852 z" />
        <path style={{ fill: "#ffd5d5" }} d="m 492.98318,228.15901 c 0,0 2.99493,-4.35626 2.08738,-7.35118 0,0.0908 1.72435,6.80665 1.17981,8.16798 -0.54453,1.36133 -3.26719,-0.8168 -3.26719,-0.8168 z" />
        <path style={{ fill: "#ffd5d5" }} d="m 481.17456,241.5458 c 0,0 -1.41296,-5.09412 -4.2908,-6.32345 0.0696,0.0584 6.32318,3.05309 7.01624,4.34515 0.69307,1.29205 -2.72544,1.9783 -2.72544,1.9783 z" />
        <path style={{ fill: "#ffd5d5" }} d="m 480.79695,259.8177 c 0,0 -2.72679,4.52893 -5.82884,4.94182 0.0827,-0.0376 6.91017,-1.24634 7.92422,-2.30533 1.01406,-1.05897 -2.09538,-2.63649 -2.09538,-2.63649 z" />
        <path style={{ fill: "#ffd5d5" }} d="m 494.26614,252.33115 3.08034,-6.54572 50.18386,24.00097 4.36381,9.24102 z" />
        <path style={{ fill: "#ff8080" }} d="m 316.58785,141.32615 12.62343,1.52459 -6.67406,-6.16068 15.53004,3.59373 -4.49216,-4.62051 9.88275,2.95199 -0.89843,-13.60483 4.49216,6.80242 7.70085,-18.48204 10.39615,10.39615 -5.90399,13.21979 2.82365,-3.97878 -7.18746,21.56238 -36.47404,0.36813 z" />
        <path style={{ fill: "#ff8080" }} d="m 335.75701,186.23219 c 0,0 15.91508,13.47648 16.55682,13.60483 0.64174,0.12835 11.55127,-7.70085 11.55127,-7.70085 l -2.56695,3.97877 6.54572,-4.74885 -1.54016,3.46538 14.75995,-10.13945 -1.15512,-2.05356 6.93076,-0.77009 3.33704,-13.98987 -1.92522,2.31025 10.0111,-19.12377 -11.74379,-9.69024 -1.98938,6.22486 -0.77009,-3.01617 -2.11773,14.1824 -1.476,-2.6953 -3.65793,15.145 -3.31958,-5.31163 1.33019,8.26363 -15.23009,2.1462 5.9249,1.44753 -15.21451,3.42967 7.06445,1.96092 z" />
        <path style={{ fill: "#ff8080" }} d="m 384.53051,220.98934 15.70069,8.80327 7.7142,-8.98478 -0.36302,5.71758 11.07215,-10.07384 -2.08737,5.80834 15.97294,-9.80159 2.49578,-14.65699 -4.49239,1.99662 7.45329,-14.36204 -5.34323,1.021 -0.84403,-7.24569 -1.74921,8.11192 -2.70803,-6.80454 -3.32335,13.51086 -3.17755,-6.25333 -3.21859,13.73963 -15.06982,7.93443 6.41093,0.74994 -16.17824,5.96093 4.37561,2.4147 z" />
        <path style={{ fill: "#ff8080" }} d="m 433.90144,245.22102 c 16.60823,6.08061 16.60823,5.80834 16.60823,5.80834 l 2.17813,-7.26043 1.08906,2.63191 2.99493,-11.52593 1.99662,4.17475 0.99831,-9.25705 6.71589,-5.17306 -5.26381,0.36302 8.71252,-7.16967 -3.44871,-0.36302 4.53777,-3.17644 -10.61838,-8.62177 -5.35456,14.2486 -1.45209,-8.89403 -2.72266,14.70238 -9.71082,7.44194 4.99154,-1.54284 z" />
        <path style={{ fill: "#ff5555" }} d="m 326.45393,118.41456 -4.98838,-11.49088 4.24344,7.35149 -4.13822,-11.1767 9.02454,15.35631 -1.65252,-6.04051 7.5155,13.28337 -1.69292,-6.40903 6.72379,10.84413 -1.46763,-5.41663 9.51022,16.06619 -2.23701,-4.99375 10.55165,14.93565 -1.22531,-3.20561 3.8045,4.94163 -1.29439,-4.36765 4.94906,7.41024 -0.12013,-4.81763 5.83856,11.80503 3.01383,-1.2098 2.86717,5.95903 6.53035,-0.49122 1.39213,6.32317 4.06059,-0.69671 0.38687,2.46642 6.48957,5.31981 -1.54902,2.2317 5.48677,3.61727 2.49312,3.80168 3.89907,-2.17071 0.1715,-3.06539 4.23449,8.17879 -0.83359,-4.31328 5.61578,8.60593 -1.41023,-3.82954 11.41242,7.6843 -2.41025,-6.04276 10.99162,13.63351 -2.68229,-5.33512 5.82258,6.87435 -2.40488,-4.3992 12.77908,12.93018 -3.31248,-6.30036 5.40601,7.32654 -1.27154,-3.36161 2.83585,4.34376 -0.50534,-2.75015 3.24072,4.31657 -0.54298,-2.29686 3.01809,4.14588 0.30128,-1.77018 5.04733,7.50967 -1.66156,-4.79374 7.34015,9.55657 -1.22213,-4.23989 4.46657,5.6661 -0.90436,-2.9355 4.0792,5.05576 -1.12968,-3.92789 4.8598,6.06394 c 0,0 0.34061,2.31043 0.92719,3.94149 0.58665,1.6311 -2.78694,-3.36594 -2.78694,-3.36594 l -2.21254,0.54623 -1.12437,-2.28439 -2.90647,0.0624 -0.45326,-2.80667 -4.62065,-2.8187 0.13336,-1.17557 -1.98456,2.36045 -0.75663,-3.71432 -3.07707,-0.16476 -0.16419,-2.29576 -5.75988,-3.64374 0.12486,-1.78489 -1.31083,2.65991 -0.84062,-3.41703 -2.3167,0.6592 -0.64136,-2.39633 -1.24392,1.14399 -0.75132,-2.07076 -5.8619,-0.85284 0.74707,-3.28495 -5.05476,-1.72898 0.23484,-2.1104 -7.44638,-2.01926 -0.27632,-4.64805 -5.40175,-1.97087 0.21466,-2.29465 -10.03725,-2.57967 0.74072,-1.21636 -5.8368,-0.62642 0.58595,-3.15749 -5.5303,2.70438 0.0935,-3.40017 -6.82322,-5.31675 -3.55989,-3.74368 -1.66483,-2.73376 -0.8438,-2.38274 -6.39112,-0.89686 -0.73328,-4.56439 -5.4538,-1.9143 -0.41659,0.45218 2.69395,4.91009 -8.46449,-11.84093 1.50268,4.1415 -5.93203,-8.40482 -1.85124,1.1848 -1.03408,-4.65021 -4.88739,-0.46751 -0.36347,-3.31647 -4.78857,-2.2241 0.42294,-2.52076 -8.31568,-6.22979 1.29011,-0.98808 -6.09464,-6.16669 0.83316,-0.90437 -9.17755,-6.11894 1.0882,-2.83055 -8.95755,-6.77005 z" />
      </g>
    </svg>
  );
}

function Chat() {
  const {
    setUploadStatus,
    setUploadMessage,
    setUploadProgress,
    setVideoUrl,
    setTopics,
    setTopicSummaries,
    onTopicClick,
    activeTopicIndex,
    seekTo,
  } = useOutletContext<UploadContext>();

  const [messages, setMessages]     = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  useEffect(() => {
    if (activeTopicIndex === null) {
      return;
    }

    Promise.all([
      fetch(`${API_BASE}/topics`, { headers: { "ngrok-skip-browser-warning": "true" } }).then((r) => r.json()),
      fetch(`${API_BASE}/summaries`, { headers: { "ngrok-skip-browser-warning": "true" } }).then((r) => r.json()),
    ])
      .then(([topics, summaries]: [Topic[], TopicSummary[]]) => {
        const topic   = topics[activeTopicIndex];
        const summary = summaries[activeTopicIndex];
        if (!topic) return;

        const lines: string[] = [`📌 ${topic.topic}`];
        if (summary?.transcript_summary_ar) {
          lines.push("", "📝 Transcript Summary:", summary.transcript_summary_ar);
        }
        if (summary?.combined_slide_summary_en) {
          lines.push("", "🖥 Slide Summary:", summary.combined_slide_summary_en);
        }

        const chatText = lines.join("\n");

        const figureImages: SlideResult[] = (summary?.slides_with_figures ?? []).map(
          (path, idx) => ({
            slide_id: String(idx),
            image_path: path,
            start_time: topic.first_timestamp
              ? new Date(topic.first_timestamp * 1000).toISOString().slice(11, 19)
              : undefined,
            end_time: topic.last_timestamp
              ? new Date(topic.last_timestamp * 1000).toISOString().slice(11, 19)
              : undefined,
          })
        );

        setMessages((prev) => [
          ...prev.filter((m) => m.topicIndex !== activeTopicIndex),
          {
            id: uid(),
            role: "assistant",
            route: "Topic",
            topicIndex: activeTopicIndex,
            text: chatText,
            images: figureImages.length > 0 ? figureImages : undefined,
          },
        ]);
      })
      .catch(() => {});
  }, [activeTopicIndex]);

  const handleDismissTopic = (index: number) => {
    setMessages((prev) => prev.filter((m) => m.topicIndex !== index));
    onTopicClick({} as Topic, index);
  };

  const handleSend = async (query: string) => {
    setMessages((prev) => [...prev, { id: uid(), role: "user", text: query }]);
    setIsThinking(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ query }),
      });
      if (res.status === 425) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { detail?: string }).detail ?? "Video not ready yet."
        );
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { detail?: string }).detail ?? `Request failed (${res.status})`
        );
      }
      const data: ChatResponse = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          text:
            data.text
              ?.replace(/^(RAG|Image|Hybrid|Topic)\s*\n?/, "")
              .trim() ?? undefined,
          images: data.image ?? undefined,
        },
      ]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "error",
          text: (err as Error).message ?? "Something went wrong.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleUploadDone = () => {
    setUploadStatus("done");
    setUploadMessage("Upload complete!");

    fetch(`${API_BASE}/topics`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((r) => r.json())
      .then((data: Topic[]) => setTopics(data))
      .catch(() => {});

    fetch(`${API_BASE}/summaries`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((r) => r.json())
      .then((data: TopicSummary[]) => setTopicSummaries(data))
      .catch(() => {});
  };

  const handleImageSearchResult = (
    results: SlideResult[],
    previewUrl: string
  ) => {
    URL.revokeObjectURL(previewUrl);
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        route: "ImageSearch",
        images: results,
      },
    ]);
  };

  const handleImageSearchError = (error: string) => {
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "error", text: error },
    ]);
  };

  return (
    <div className="chat">
      <div className="messages-thread" ref={threadRef}>
        {messages.length === 0 && (
          <div className="thread-empty">
            <FeatherLogo size={100} />
            <p>Upload a lecture video, then ask Minerva anything about it.</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            onDismissTopic={handleDismissTopic}
            onSeek={seekTo}
          />
        ))}

        {isThinking && (
          <div className="message-bubble message-assistant">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      <div className="chatbox-wrapper">
        <div className="chatbox-background" />
        <div className="chat-container">
          <ChatBox
            onSend={handleSend}
            onVideoSelected={setVideoUrl}
            onStatusUpdate={(status, message, progress) => {
              setUploadStatus(status);
              setUploadMessage(message);
              // Forward progress percentage to the sidebar
              if (progress !== undefined) setUploadProgress(progress);
            }}
            onUploadDone={handleUploadDone}
            onUploadError={(err) => {
              setUploadStatus("error");
              setUploadMessage(err);
            }}
            onImageSearchResult={handleImageSearchResult}
            onImageSearchError={handleImageSearchError}
          />
        </div>
      </div>
    </div>
  );
}

export default Chat;