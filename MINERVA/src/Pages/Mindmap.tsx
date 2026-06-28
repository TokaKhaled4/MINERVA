import { useState, useRef, useEffect, useCallback } from "react";
import GenerationButton, { type MindmapData, type MindmapTopic } from "../Components/GenerationButton";
import "./Mindmap.css";

/* ── Palette ── */
const ROOT_FILL   = "#202020";
const ROOT_TEXT   = "#FFFCFC";
const ROOT_STROKE = "#EB5951";

const TOPIC_FILLS  = ["#EB5951", "#DA7373", "#D86363", "#B15757", "#F29393", "#8A3A3A"];
const TOPIC_TEXT   = "#FFFCFC";
const KW_FILLS     = ["#FFEFEA", "#F1ACAB", "#FFEFEA", "#F1ACAB", "#FFEFEA", "#F1ACAB"];
const KW_STROKES   = ["#F29393", "#DA7373", "#F29393", "#DA7373", "#F29393", "#DA7373"];
const KW_TEXT_CLR  = "#202020";
const LINE_COLORS  = ["#EB5951", "#DA7373", "#D86363", "#B15757", "#F29393", "#8A3A3A"];

/* ── Layout constants ── */
const SVG_W        = 1400;
const ROOT_X       = 110;
const ROOT_Y_RATIO = 0.5;
const TOPIC_X      = 420;
const KW_X         = 790;
const ROW_H        = 52;
const TOPIC_NODE_W = 180;
const TOPIC_NODE_H = 44;
const TOPIC_RX     = 22;
const ROOT_W       = 130;
const ROOT_H       = 50;
const ROOT_RX      = 25;
const KW_H         = 34;
const KW_RX        = 17;

/* Toggle button dims */
const BTN_R        = 13;
const BTN_OFFSET   = 18;

/* Focus opacity */
const DIM_OPACITY    = 0.15;
const FOCUS_OPACITY  = 1;

interface Point { x: number; y: number }

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function hBezier(x1: number, y1: number, x2: number, y2: number): string {
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

interface KwItem   { text: string; y: number }
interface BuiltTopic {
  topic:    MindmapTopic;
  index:    number;
  topicY:   number;
  keywords: KwItem[];
  totalH:   number;
  nodeW:    number;
  nodeH:    number;
  color: { fill: string; line: string; kwFill: string; kwStroke: string };
}

function buildLayout(
  topics: MindmapTopic[],
  collapsed: Set<number>,
): { nodes: BuiltTopic[]; svgH: number } {
  const TOPIC_PAD = 28;
  const LAYOUT_PAD = 60;
  let cursor = LAYOUT_PAD;

  const nodes: BuiltTopic[] = topics.map((topic, i) => {
    const kws    = topic.keywords;
    const isOpen = !collapsed.has(i);
    const kwRows = isOpen ? kws.length : 0;
    const totalH = Math.max(TOPIC_NODE_H + 16, isOpen ? kwRows * ROW_H : TOPIC_NODE_H + 16);
    const topicY = cursor + totalH / 2;
    const keywords: KwItem[] = isOpen
      ? kws.map((kw, j) => ({
          text: kw,
          y: cursor + ROW_H / 2 + j * ROW_H + (totalH - kwRows * ROW_H) / 2,
        }))
      : [];

    const lines = wrapText(topic.topic, 18);
    const nodeW = Math.max(TOPIC_NODE_W, lines.reduce((m, l) => Math.max(m, l.length * 7), 0) + 28);
    const nodeH = lines.length > 1 ? TOPIC_NODE_H + (lines.length - 1) * 14 : TOPIC_NODE_H;

    cursor += totalH + TOPIC_PAD;
    return {
      topic, index: i, topicY, keywords, totalH, nodeW, nodeH,
      color: {
        fill:     TOPIC_FILLS[i % TOPIC_FILLS.length],
        line:     LINE_COLORS[i % LINE_COLORS.length],
        kwFill:   KW_FILLS[i % KW_FILLS.length],
        kwStroke: KW_STROKES[i % KW_STROKES.length],
      },
    };
  });

  return { nodes, svgH: Math.max(500, cursor + LAYOUT_PAD) };
}

function SvgText({
  x, y, lines, fontSize, fontWeight = "600", fill,
}: {
  x: number; y: number; lines: string[];
  fontSize: number; fontWeight?: string; fill: string;
}) {
  const lh     = fontSize * 1.3;
  const totalH = (lines.length - 1) * lh;
  return (
    <text
      className="mm-svg-text"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={fontSize}
      fontWeight={fontWeight}
      fill={fill}
    >
      {lines.map((l, i) => (
        <tspan key={i} x={x} y={y - totalH / 2 + i * lh}>{l}</tspan>
      ))}
    </text>
  );
}

function Chevron({ cx, cy, dir, color }: { cx: number; cy: number; dir: "right" | "left"; color: string }) {
  const s = 5;
  const pts = dir === "right"
    ? `${cx - s},${cy - s} ${cx + s},${cy} ${cx - s},${cy + s}`
    : `${cx + s},${cy - s} ${cx - s},${cy} ${cx + s},${cy + s}`;
  return (
    <polyline
      className="mm-chevron"
      points={pts}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function ToggleBtn({
  x, y, open, fill, onToggle,
}: {
  x: number; y: number; open: boolean; fill: string; onToggle: () => void;
}) {
  return (
    <g
      className="mm-toggle-btn"
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
    >
      <circle cx={x} cy={y} r={BTN_R} fill={fill} stroke="#FFFCFC" strokeWidth="1.5" />
      <Chevron cx={x} cy={y} dir={open ? "left" : "right"} color="#FFFCFC" />
    </g>
  );
}

function EmptyState() {
  return (
    <div className="mm-empty">
      <svg className="mm-empty-icon" viewBox="0 0 200 120" fill="none">
        <rect x="10" y="45" width="50" height="30" rx="15"
          fill="#202020" stroke="#EB5951" strokeWidth="2"/>
        <text x="35" y="60" textAnchor="middle" dominantBaseline="central"
          fontSize="9" fill="#FFFCFC" fontWeight="700">Lecture</text>
        {[25, 60, 95].map((ty, i) => (
          <g key={i}>
            <path d={hBezier(60, 60, 100, ty)} stroke={LINE_COLORS[i]} strokeWidth="1.5" fill="none" opacity="0.6"/>
            <rect x="100" y={ty - 12} width="50" height="24" rx="12"
              fill={TOPIC_FILLS[i]} opacity="0.7"/>
            <path d={hBezier(150, ty, 185, ty)} stroke={LINE_COLORS[i]} strokeWidth="1" fill="none" strokeDasharray="3 2" opacity="0.5"/>
            <rect x="155" y={ty - 9} width="38" height="18" rx="9"
              fill={KW_FILLS[i]} stroke={KW_STROKES[i]} strokeWidth="1"/>
          </g>
        ))}
      </svg>
      <p className="mm-empty-label">
        Click <strong>Generate Mind Map</strong> to visualise your lecture.
      </p>
    </div>
  );
}

/* ── Main SVG mind map ── */
function MindMapSVG({ data, svgRef }: { data: MindmapData; svgRef: React.RefObject<SVGSVGElement | null> }) {
  const [collapsed, setCollapsed]       = useState<Set<number>>(new Set());
  const [closing, setClosing]           = useState<Set<number>>(new Set());
  // focusedTopic: index of the focused topic node, or null for no focus
  const [focusedTopic, setFocusedTopic] = useState<number | null>(null);

  const ANIM_MS = 260;

  const { nodes, svgH } = buildLayout(data.data, collapsed);
  const rootY = svgH * ROOT_Y_RATIO;

  const dragging = useRef(false);
  const lastPos  = useRef<Point>({ x: 0, y: 0 });
  const [tf, setTf] = useState({ x: 0, y: 0, scale: 1 });
  const centred  = useRef(false);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const centre = (width: number, height: number) => {
      if (!width || !height || centred.current) return;
      const scale   = Math.min(width / SVG_W, height / svgH, 1);
      const offsetX = (width  - SVG_W * scale) / 2;
      const offsetY = (height - svgH  * scale) / 2;
      setTf({ x: offsetX, y: offsetY, scale });
      centred.current = true;
    };
    const rect = el.getBoundingClientRect();
    centre(rect.width, rect.height);
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      centre(width, height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [svgRef, svgH]);

  const toggleCollapse = useCallback((i: number) => {
    setCollapsed(prev => {
      if (prev.has(i)) {
        // Expanding: remove from collapsed immediately, CSS enter anim plays
        const next = new Set(prev);
        next.delete(i);
        return next;
      } else {
        // Collapsing: play exit anim first, then add to collapsed
        setClosing(c => { const s = new Set(c); s.add(i); return s; });
        setTimeout(() => {
          setCollapsed(p => { const s = new Set(p); s.add(i); return s; });
          setClosing(c => { const s = new Set(c); s.delete(i); return s; });
        }, ANIM_MS);
        return prev;
      }
    });
  }, []);

  // Click a topic node to focus it; click again (or click root) to clear focus
  const handleTopicClick = useCallback((i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDragged.current) return;
    setFocusedTopic(prev => (prev === i ? null : i));
  }, []);

  const handleRootClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDragged.current) return;
    setFocusedTopic(null);
  }, []);

  // Click on SVG background clears focus
  const handleSvgClick = useCallback(() => {
    if (hasDragged.current) return;
    setFocusedTopic(null);
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setTf(t => ({
      ...t,
      scale: Math.min(3, Math.max(0.25, t.scale * (e.deltaY > 0 ? 0.92 : 1.09))),
    }));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel, svgRef]);

  const hasDragged = useRef(false);

  const onMD = (e: React.MouseEvent) => {
    dragging.current = true;
    hasDragged.current = false;
    lastPos.current  = { x: e.clientX, y: e.clientY };
  };
  const onMM = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true;
    setTf(t => ({
      ...t,
      x: t.x + dx,
      y: t.y + dy,
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMU = () => { dragging.current = false; };

  // Helper: get opacity for a given topic index
  const topicOpacity = (i: number) => {
    if (focusedTopic === null) return FOCUS_OPACITY;
    return focusedTopic === i ? FOCUS_OPACITY : DIM_OPACITY;
  };

  // Root dims when any topic is focused
  const rootOpacity = focusedTopic === null ? FOCUS_OPACITY : DIM_OPACITY;

  return (
    <div
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
      onMouseDown={onMD}
      onMouseMove={onMM}
      onMouseUp={onMU}
      onMouseLeave={onMU}
    >
    <svg
      ref={svgRef}
      className="mm-svg"
      viewBox={`0 0 ${SVG_W} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      onClick={handleSvgClick}
    >
      <rect className="mm-export-bg" x="0" y="0" width={SVG_W} height={svgH} fill="#ffffff"/>

      <g transform={`translate(${tf.x},${tf.y}) scale(${tf.scale})`}>

        {/* ── Root → Topic lines ── */}
        {nodes.map(n => (
          <path
            key={`rl-${n.index}`}
            d={hBezier(ROOT_X + ROOT_W / 2, rootY, TOPIC_X - n.nodeW / 2, n.topicY)}
            stroke={n.color.line}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            opacity={focusedTopic === null ? 0.7 : focusedTopic === n.index ? 0.9 : DIM_OPACITY}
            style={{ transition: "opacity 0.25s ease" }}
          />
        ))}

        {/* ── Topic → Keyword lines ── */}
        {nodes.map(n =>
          (!collapsed.has(n.index) || closing.has(n.index)) && n.keywords.map((kw, j) => {
            const isClosing = closing.has(n.index);
            const animClass = isClosing ? "mm-kw-exit" : "mm-kw-enter";
            const delay = `${j * 30}ms`;
            return (
              <path
                key={`kl-${n.index}-${j}`}
                className={animClass}
                d={hBezier(TOPIC_X + n.nodeW / 2, n.topicY, KW_X - 60, kw.y)}
                stroke={n.color.line}
                strokeWidth={1.2}
                fill="none"
                strokeLinecap="round"
                strokeDasharray="5 3"
                opacity={focusedTopic === null ? 0.5 : focusedTopic === n.index ? 0.8 : DIM_OPACITY}
                style={{ transformOrigin: `${TOPIC_X}px ${n.topicY}px`, animationDelay: delay }}
              />
            );
          })
        )}

        {/* ── Keyword pills ── */}
        {nodes.map(n =>
          (!collapsed.has(n.index) || closing.has(n.index)) && n.keywords.map((kw, j) => {
            const lines = wrapText(kw.text, 16);
            const w = Math.max(90, lines.reduce((m, l) => Math.max(m, l.length * 7.2), 0) + 24);
            const h = lines.length > 1 ? KW_H + (lines.length - 1) * 14 : KW_H;
            const isClosing = closing.has(n.index);
            const animClass = isClosing ? "mm-kw-exit" : "mm-kw-enter";
            const delay = `${j * 30}ms`;
            return (
              <g
                key={`kw-${n.index}-${j}`}
                className={animClass}
                opacity={topicOpacity(n.index)}
                style={{ transformOrigin: `${TOPIC_X}px ${n.topicY}px`, animationDelay: delay }}
              >
                <rect
                  x={KW_X - w / 2} y={kw.y - h / 2}
                  width={w} height={h} rx={KW_RX}
                  fill={n.color.kwFill}
                  stroke={n.color.kwStroke}
                  strokeWidth="1.4"
                />
                <SvgText
                  x={KW_X} y={kw.y}
                  lines={lines} fontSize={11} fontWeight="600"
                  fill={KW_TEXT_CLR}
                />
              </g>
            );
          })
        )}

        {/* ── Topic nodes + toggle buttons ── */}
        {nodes.map(n => {
          const isOpen = !collapsed.has(n.index);
          const btnX = TOPIC_X + n.nodeW / 2 + BTN_OFFSET + BTN_R;
          const btnY = n.topicY;

          return (
            <g
              key={`topic-${n.index}`}
              opacity={topicOpacity(n.index)}
              style={{ transition: "opacity 0.25s ease", cursor: "pointer" }}
              onClick={(e) => handleTopicClick(n.index, e)}
            >
              <rect
                x={TOPIC_X - n.nodeW / 2} y={n.topicY - n.nodeH / 2}
                width={n.nodeW} height={n.nodeH} rx={TOPIC_RX}
                fill={n.color.fill}
              />
              <SvgText
                x={TOPIC_X} y={n.topicY}
                lines={wrapText(n.topic.topic, 18)}
                fontSize={12.5} fontWeight="700"
                fill={TOPIC_TEXT}
              />
              <ToggleBtn
                x={btnX}
                y={btnY}
                open={isOpen}
                fill={n.color.fill}
                onToggle={() => toggleCollapse(n.index)}
              />
            </g>
          );
        })}

        {/* ── Root node ── */}
        <g
          opacity={rootOpacity}
          style={{ transition: "opacity 0.25s ease", cursor: "pointer" }}
          onClick={handleRootClick}
        >
          <rect
            x={ROOT_X - ROOT_W / 2} y={rootY - ROOT_H / 2}
            width={ROOT_W} height={ROOT_H} rx={ROOT_RX}
            fill={ROOT_FILL} stroke={ROOT_STROKE} strokeWidth="2.5"
          />
          <SvgText
            x={ROOT_X} y={rootY}
            lines={["Lecture"]} fontSize={15} fontWeight="800"
            fill={ROOT_TEXT}
          />
        </g>

      </g>
    </svg>
    </div>
  );
}

/* ── Download SVG as PNG ── */
function downloadPng(svgEl: SVGSVGElement) {
  const serializer = new XMLSerializer();

  // Show white background
  const bg = svgEl.querySelector(".mm-export-bg") as SVGRectElement | null;
  if (bg) bg.style.display = "block";

  // Reset the pan/zoom transform to identity so the full diagram exports
  const innerG = svgEl.querySelector("g") as SVGGElement | null;
  const originalTransform = innerG?.getAttribute("transform") ?? "";
  innerG?.setAttribute("transform", "translate(0,0) scale(1)");

  // Expand viewBox to ensure keywords on the right aren't clipped
  const vb = svgEl.viewBox.baseVal;
  const exportW = 1200;
  const exportH = vb.height;
  svgEl.setAttribute("viewBox", `0 0 ${exportW} ${exportH}`);
  if (bg) {
    bg.setAttribute("width", String(exportW));
    bg.setAttribute("height", String(exportH));
  }

  const svgStr = serializer.serializeToString(svgEl);

  // Restore everything
  svgEl.setAttribute("viewBox", `0 0 ${vb.width} ${vb.height}`);
  innerG?.setAttribute("transform", originalTransform);
  if (bg) bg.style.display = "none";
  if (bg) {
    bg.setAttribute("width", String(vb.width));
    bg.setAttribute("height", String(vb.height));
  }

  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();
  img.onload = () => {
    const scale  = 2;
    const canvas = document.createElement("canvas");
    canvas.width  = exportW * scale;
    canvas.height = exportH * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, exportW, exportH);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    link.download = "mindmap.png";
    link.href     = canvas.toDataURL("image/png");
    link.click();
  };
  img.src = url;
}

/* ── Page ── */
export default function Mindmap() {
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  return (
  <div className="mm-page">
    <div className="mm-page-header">
      <h1 className="mm-page-title">Mind Map</h1>
    </div>

    {!mindmapData && <EmptyState />}

    {mindmapData && (
      <div className="mm-canvas">
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: "6px" }}>
          <button
            className="mm-download-btn"
            onClick={() => svgRef.current && downloadPng(svgRef.current)}
            title="Download as PNG"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3v10M6 9l4 4 4-4"/>
              <path d="M3 15h14"/>
            </svg>
          </button>
        </div>
        <p className="mm-hint">Scroll to zoom · Drag to pan · Click node to focus · Click ▶ to expand/collapse</p>
        <MindMapSVG data={mindmapData} svgRef={svgRef} />
      </div>
    )}

    <div className="mm-gen-button">
      <GenerationButton onGenerated={setMindmapData} />
    </div>
  </div>
);
}