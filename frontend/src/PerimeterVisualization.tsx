import { useMemo } from "react";
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
  radius: number;
  color: string;
  isCritical: boolean;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export default function PerimeterVisualization({
  brandName,
  overview,
  detections = [],
  onSelectThreat,
}: PerimeterVisualizationProps) {
  const center = 250;
  const rCritical = 75;
  const rSuspicious = 135;
  const rSafe = 185;

  const rawItems = useMemo(() => {
    if (detections.length > 0) {
      return detections.map((d) => ({
        id: d.id,
        name: d.candidate.name,
        source: d.candidate.source,
        severity: d.severity,
        score: d.risk_score,
        officialMatch: (d as any).official_match ?? (d.severity === "SAFE" && d.risk_score === 0),
      }));
    }
    return overview.recent_threats.map((t) => ({
      id: t.id,
      name: t.name,
      source: t.source,
      severity: t.severity,
      score: t.risk_score,
      officialMatch: t.severity === "SAFE" && t.risk_score === 0,
    }));
  }, [detections, overview.recent_threats]);

  // Counts from real data
  const critCount = overview.summary.high_risk;
  const suspCount = Math.max(0, overview.summary.detected_threats - overview.summary.high_risk);
  const monitoredCount = overview.summary.total_candidates;

  const threatNodes = useMemo<PlotNode[]>(() => {
    const buckets: Record<string, typeof rawItems> = {
      crit_social: [],
      crit_apps: [],
      susp_social: [],
      susp_apps: [],
      safe_social: [],
      safe_apps: [],
    };

    rawItems.forEach((item) => {
      const isCrit = item.severity === "CRITICAL" || item.severity === "HIGH";
      const isSusp = item.severity === "MEDIUM" || item.severity === "LOW";
      const band = isCrit ? "crit" : isSusp ? "susp" : "safe";
      const isSocial = item.source === "Social Media";
      const bucketKey = `${band}_${isSocial ? "social" : "apps"}`;
      buckets[bucketKey]?.push(item);
    });

    const nodes: PlotNode[] = [];

    // Left arc for Social: 100° to 260° (span 160°)
    // Right arc for App: -80° to 80° (span 160°)
    const placeBucket = (
      items: typeof rawItems,
      ringRadius: number,
      minAngleDeg: number,
      maxAngleDeg: number,
      bandColor: (it: (typeof rawItems)[0]) => string,
      isCrit: boolean
    ) => {
      if (!items.length) return;
      const sorted = [...items].sort((a, b) => hashString(a.id) - hashString(b.id));
      const count = sorted.length;
      const angleSpan = maxAngleDeg - minAngleDeg;

      sorted.forEach((item, index) => {
        const fraction = count === 1 ? 0.5 : (index + 0.5) / count;
        const angleDeg = minAngleDeg + fraction * angleSpan;
        const angleRad = (angleDeg * Math.PI) / 180;

        const x = center + ringRadius * Math.cos(angleRad);
        const y = center + ringRadius * Math.sin(angleRad);

        nodes.push({
          id: item.id,
          name: item.name,
          source: item.source,
          severity: item.severity,
          score: item.score,
          x,
          y,
          radius: ringRadius,
          color: bandColor(item),
          isCritical: isCrit,
        });
      });
    };

    const getSafeColor = (it: (typeof rawItems)[0]) => {
      if (it.severity === "SAFE" && it.score === 0) return "#6b6963";
      return "#86b8a4";
    };

    placeBucket(buckets.crit_social, rCritical, 110, 250, () => "#e4574a", true);
    placeBucket(buckets.crit_apps, rCritical, -70, 70, () => "#e4574a", true);
    placeBucket(buckets.susp_social, rSuspicious, 105, 255, () => "#d9ae5f", false);
    placeBucket(buckets.susp_apps, rSuspicious, -75, 75, () => "#d9ae5f", false);
    placeBucket(buckets.safe_social, rSafe, 100, 260, getSafeColor, false);
    placeBucket(buckets.safe_apps, rSafe, -80, 80, getSafeColor, false);

    return nodes;
  }, [rawItems]);

  return (
    <div className="perimeter-briefing-card" aria-label="Digital Perimeter Visualization">
      <svg
        viewBox="0 0 500 500"
        className="perimeter-svg-canvas"
        role="img"
        aria-label={`Threat perimeter for ${brandName}: ${critCount} critical, ${suspCount} suspicious, ${monitoredCount} monitored`}
      >
        <desc>
          Concentric orbital radar mapping threat vectors for protected identity {brandName}.
          Critical vector r=75, Suspicious horizon r=135, Safe perimeter r=185.
        </desc>

        <defs>
          <radialGradient id="perimCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#86b8a4" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#86b8a4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="perimCritGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e4574a" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#e4574a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Radial Fill */}
        <circle cx={center} cy={center} r={rSafe} fill="none" stroke="#1c1c22" strokeWidth="0.8" />
        <circle cx={center} cy={center} r={rCritical} fill="url(#perimCritGlow)" />
        <circle cx={center} cy={center} r="35" fill="url(#perimCoreGlow)" />

        {/* Concentric Rings */}
        {/* r=185 Safe perimeter - dashed, faint with orbit-spin animation */}
        <circle
          cx={center}
          cy={center}
          r={rSafe}
          fill="none"
          stroke="#262630"
          strokeWidth="1"
          strokeDasharray="4 6"
          className="perimeter-ring-safe orbit-spin"
        />

        {/* r=135 Suspicious horizon - medium/low */}
        <circle
          cx={center}
          cy={center}
          r={rSuspicious}
          fill="none"
          stroke="#202028"
          strokeWidth="1.2"
        />

        {/* r=75 Critical vector - critical/high */}
        <circle
          cx={center}
          cy={center}
          r={rCritical}
          fill="none"
          stroke="rgba(228, 87, 74, 0.4)"
          strokeWidth="1.2"
          strokeDasharray="5 3"
        />

        {/* Axis Crosshairs */}
        <line x1={center} y1="40" x2={center} y2="460" stroke="#16161d" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="40" y1={center} x2="460" y2={center} stroke="#16161d" strokeWidth="1" strokeDasharray="2 4" />

        {/* Surface Labels */}
        <text x="35" y={center} className="perim-arc-tag" textAnchor="start" dominantBaseline="middle">
          SOCIAL
        </text>
        <text x="465" y={center} className="perim-arc-tag" textAnchor="end" dominantBaseline="middle">
          APPS
        </text>

        {/* Protected Brand Center Node */}
        <g className="perim-center-core">
          <circle cx={center} cy={center} r="5" fill="#ffffff" />
          <text
            x={center}
            y={center + 20}
            textAnchor="middle"
            className="perim-center-brand-name"
          >
            {brandName}
          </text>
        </g>

        {/* Threat Nodes */}
        {threatNodes.map((node) => (
          <g
            key={node.id}
            className={`perim-node-item ${node.isCritical ? "is-critical" : ""}`}
            onClick={() => onSelectThreat?.(node.id)}
            style={{ cursor: onSelectThreat ? "pointer" : "default" }}
          >
            <title>
              {node.name} — {node.source} ({node.severity}, Risk: {node.score.toFixed(2)})
            </title>
            {node.isCritical && (
              <circle
                cx={node.x}
                cy={node.y}
                r="10"
                fill="rgba(228, 87, 74, 0.28)"
                className="pulse-critical"
              />
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.isCritical ? 5.5 : 4}
              fill={node.color}
              stroke="#060607"
              strokeWidth="1.5"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
