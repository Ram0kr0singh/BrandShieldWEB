import { useMemo, useState, useCallback, useRef } from "react";
import type { Overview, Detection } from "./api";

interface PerimeterVisualizationProps {
  brandName: string;
  overview: Overview;
  detections?: Detection[];
  onSelectThreat?: (id: string) => void;
}

interface PlotNode {
  id: string;
  name: string;
  source: string;
  severity: string;
  score: number;
  x: number;
  y: number;
  color: string;
  isCritical: boolean;
  baseR: number;
  initials: string;
}

type FilterMode = "ALL" | "SOCIAL" | "APPS" | "CRITICAL";

const FILTERS: { id: FilterMode; label: string }[] = [
  { id: "ALL",      label: "ALL" },
  { id: "SOCIAL",   label: "SOCIAL" },
  { id: "APPS",     label: "APPS" },
  { id: "CRITICAL", label: "CRITICAL" },
];

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "#e4574a",
  HIGH:     "#e4574a",
  MEDIUM:   "#d9ae5f",
  LOW:      "#d9ae5f",
  SAFE:     "#6b6963",
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.replace(/[@.]/g, " ").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? parts[0]?.[1] ?? "").toUpperCase();
}

/** Deterministic scatter position — Social on left half, Apps on right half.
 *  Y-band by severity: critical=center, suspicious=mid, safe=edges. */
function scatterPos(id: string, source: string, severity: string): { x: number; y: number } {
  const h = hashStr(id);
  const isSocial = source === "Social Media";
  const isCrit   = severity === "CRITICAL" || severity === "HIGH";
  const isSusp   = severity === "MEDIUM"   || severity === "LOW";

  // X: social left [55..195], apps right [305..445]
  const xBase   = isSocial ? 125 : 375;
  const xRadius = 70;
  const x = xBase + ((h % (xRadius * 2 + 1)) - xRadius);

  // Y bands
  let y: number;
  if (isCrit) {
    y = 185 + ((h >> 4) % 70) - 35;          // 150-255 (center)
  } else if (isSusp) {
    const top = ((h >> 8) & 1) === 0;
    y = top
      ? 95  + ((h >> 4) % 60)                 // 95-155
      : 285 + ((h >> 4) % 60);                // 285-345
  } else {
    const top = ((h >> 8) & 1) === 0;
    y = top
      ? 28  + ((h >> 4) % 50)                 // 28-78
      : 355 + ((h >> 4) % 50);                // 355-405
  }

  return {
    x: Math.max(35, Math.min(465, x)),
    y: Math.max(22, Math.min(415, y)),
  };
}

export default function PerimeterVisualization({
  brandName,
  overview,
  detections = [],
  onSelectThreat,
}: PerimeterVisualizationProps) {
  const CX = 250, CY = 218;

  const [filter,  setFilter]  = useState<FilterMode>("ALL");
  const [hovered, setHovered] = useState<string | null>(null);
  const [clicked, setClicked] = useState<string | null>(null);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleHide = useCallback(() => {
    hideTimerRef.current = setTimeout(() => setHovered(null), 250);
  }, []);
  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
  }, []);

  const handleClick = useCallback((node: PlotNode) => {
    setClicked(node.id);
    setTimeout(() => setClicked(null), 600);
    onSelectThreat?.(node.id);
  }, [onSelectThreat]);

  const rawItems = useMemo(() => {
    if (detections.length > 0) {
      return detections.map(d => ({
        id: d.id,
        name: d.candidate.name,
        source: d.candidate.source,
        severity: d.severity,
        score: d.risk_score,
      }));
    }
    return overview.recent_threats.map(t => ({
      id: t.id,
      name: t.name,
      source: t.source,
      severity: t.severity,
      score: t.risk_score,
    }));
  }, [detections, overview.recent_threats]);

  const allNodes = useMemo<PlotNode[]>(() =>
    rawItems.map(item => {
      const pos = scatterPos(item.id, item.source, item.severity);
      const isCrit = item.severity === "CRITICAL" || item.severity === "HIGH";
      return {
        id:         item.id,
        name:       item.name,
        source:     item.source,
        severity:   item.severity,
        score:      item.score,
        x:          pos.x,
        y:          pos.y,
        color:      SEV_COLOR[item.severity] ?? "#6b6963",
        isCritical: isCrit,
        baseR:      isCrit ? 7 : item.severity === "MEDIUM" || item.severity === "LOW" ? 5 : 3.5,
        initials:   initials(item.name),
      };
    }),
  [rawItems]);

  const visibleSet = useMemo<Set<string>>(() => {
    const pass = allNodes.filter(n => {
      if (filter === "ALL")      return true;
      if (filter === "SOCIAL")   return n.source === "Social Media";
      if (filter === "APPS")     return n.source === "App Store";
      if (filter === "CRITICAL") return n.isCritical;
      return true;
    });
    return new Set(pass.map(n => n.id));
  }, [allNodes, filter]);

  const hov = hovered ? allNodes.find(n => n.id === hovered) : null;

  // Tooltip placement — keep inside viewBox 500×440
  const TW = 218, TH = 90;
  const tpX = hov ? Math.max(4, Math.min(496 - TW, hov.x - TW / 2)) : 0;
  const tpY = hov
    ? (hov.y + hov.baseR + 14 + TH > 440 ? hov.y - TH - 14 : hov.y + hov.baseR + 14)
    : 0;

  const critCount  = overview.summary.high_risk;
  const suspCount  = Math.max(0, overview.summary.detected_threats - overview.summary.high_risk);
  const monCount   = overview.summary.total_candidates;

  return (
    <div className="perimeter-briefing-card perimeter-scatter-mode">

      {/* ── Filter tabs ── */}
      <div className="perim-filter-tabs" role="group" aria-label="Filter threat nodes">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`perim-filter-tab${filter === f.id ? " active" : ""}`}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── SVG canvas ── */}
      <svg
        viewBox="0 0 500 440"
        className="perimeter-svg-canvas"
        role="img"
        aria-label={`Threat perimeter for ${brandName}: ${critCount} critical, ${suspCount} suspicious, ${monCount} monitored`}
      >
        <defs>
          <radialGradient id="scCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#86b8a4" stopOpacity="0"   />
          </radialGradient>
          <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glowStrong" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Faint connection lines: every node → brand center */}
        {allNodes.map(n => (
          <line
            key={`ln-${n.id}`}
            x1={CX} y1={CY} x2={n.x} y2={n.y}
            stroke={n.color}
            strokeWidth="0.6"
            opacity={visibleSet.has(n.id) ? (hovered && hovered !== n.id ? 0.06 : 0.15) : 0.03}
            style={{ transition: "opacity 0.3s" }}
          />
        ))}

        {/* Axis labels */}
        <text x="28" y={CY} className="perim-arc-tag" textAnchor="start" dominantBaseline="middle">SOCIAL</text>
        <text x="472" y={CY} className="perim-arc-tag" textAnchor="end"   dominantBaseline="middle">APPS</text>

        {/* Center brand node */}
        <g className="perim-center-core">
          <circle cx={CX} cy={CY} r="18" fill="rgba(255,255,255,0.03)" className="core-pulse" />
          <circle cx={CX} cy={CY} r="5"  fill="#ffffff" filter="url(#glow)" />
          <text x={CX} y={CY + 18} textAnchor="middle" className="perim-center-brand-name">
            {brandName}
          </text>
        </g>

        {/* Threat nodes */}
        {allNodes.map(node => {
          const isHov  = hovered === node.id;
          const isDim  = !visibleSet.has(node.id);
          const isClk  = clicked  === node.id;
          const hovR   = node.baseR * 1.75;
          const r      = isHov ? hovR : node.baseR;

          return (
            <g
              key={node.id}
              style={{
                cursor: "pointer",
                opacity: isDim ? 0.12 : 1,
                transition: "opacity 0.3s ease",
              }}
              onClick={() => handleClick(node)}
              onMouseEnter={() => { cancelHide(); setHovered(node.id); }}
              onMouseLeave={scheduleHide}
            >
              {/* Obsidian-style outer halo — faint large glow */}
              <circle
                cx={node.x} cy={node.y}
                r={isHov ? hovR + 16 : node.baseR + 7}
                fill={node.color}
                opacity={isHov ? 0.18 : 0.07}
                style={{ transition: "r 0.2s ease, opacity 0.2s ease" }}
              />
              {/* Mid glow ring */}
              <circle
                cx={node.x} cy={node.y}
                r={isHov ? hovR + 7 : node.baseR + 2}
                fill={node.color}
                opacity={isHov ? 0.32 : 0.14}
                style={{ transition: "r 0.2s ease, opacity 0.2s ease" }}
              />
              {/* Main dot — critical ones blink when idle */}
              <circle
                cx={node.x} cy={node.y}
                r={r}
                fill={node.color}
                stroke={isHov ? "#ffffff" : "rgba(0,0,0,0.55)"}
                strokeWidth={isHov ? 1.8 : 1}
                filter={isHov ? "url(#glowStrong)" : undefined}
                className={node.isCritical && !isHov ? "dot-critical-blink" : undefined}
                style={{ transition: "r 0.18s ease, stroke-width 0.18s ease" }}
              />
              {/* Click ripple */}
              {isClk && (
                <circle
                  cx={node.x} cy={node.y}
                  r={node.baseR}
                  fill="none"
                  stroke={node.color}
                  strokeWidth="1.5"
                  className="click-ripple"
                />
              )}
            </g>
          );
        })}

        {/* ── Tooltip ── */}
        {hov && (
          <g
            className="perim-tooltip-group"
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
          >
            {/* Shadow */}
            <rect x={tpX + 2} y={tpY + 2} width={TW} height={TH} rx="6" fill="rgba(0,0,0,0.55)" />
            {/* Card bg */}
            <rect x={tpX} y={tpY} width={TW} height={TH} rx="6"
              fill="#0e0e14"
              stroke={SEV_COLOR[hov.severity] ?? "#555"}
              strokeWidth="1"
            />
            {/* Left accent bar */}
            <rect x={tpX} y={tpY + 10} width="3" height={TH - 20} rx="1.5"
              fill={SEV_COLOR[hov.severity] ?? "#555"} />
            {/* Icon circle */}
            <circle cx={tpX + 22} cy={tpY + 26} r="12"
              fill={SEV_COLOR[hov.severity] ?? "#555"} opacity="0.22" />
            <text x={tpX + 22} y={tpY + 26}
              textAnchor="middle" dominantBaseline="central"
              className="tooltip-chip-text" style={{ fontSize: "9px" }}>
              {hov.initials}
            </text>
            {/* Name */}
            <text x={tpX + 40} y={tpY + 21} className="tooltip-name-text">
              {hov.name.length > 24 ? hov.name.slice(0, 23) + "…" : hov.name}
            </text>
            {/* Source · Score */}
            <text x={tpX + 40} y={tpY + 36} className="tooltip-source-text">
              {hov.source === "Social Media" ? "Social" : "App Store"} · {hov.score.toFixed(2)}
            </text>
            {/* Severity badge */}
            <rect x={tpX + 8} y={tpY + TH - 26} width={58} height={16} rx="3"
              fill={SEV_COLOR[hov.severity] ?? "#555"} opacity="0.22" />
            <text x={tpX + 37} y={tpY + TH - 18}
              textAnchor="middle" dominantBaseline="central"
              className="tooltip-chip-text">
              {hov.severity}
            </text>
            {/* Investigate link */}
            <text
              x={tpX + TW - 10} y={tpY + TH - 18}
              textAnchor="end" dominantBaseline="central"
              className="tooltip-investigate-text"
              style={{ cursor: "pointer" }}
              onClick={() => { cancelHide(); setHovered(null); onSelectThreat?.(hov.id); }}
            >
              INVESTIGATE →
            </text>
          </g>
        )}
      </svg>

      {/* ── Legend ── */}
      <div className="perim-legend-inline">
        <div className="perim-legend-item"><span className="perim-legend-dot" style={{ background: "#e4574a" }} />Critical</div>
        <div className="perim-legend-item"><span className="perim-legend-dot" style={{ background: "#d9ae5f" }} />Suspicious</div>
        <div className="perim-legend-item"><span className="perim-legend-dot" style={{ background: "#6b6963" }} />Monitored</div>
      </div>
    </div>
  );
}
