import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { api, sourceStatusWithMock, type SourceStatus as SourceStatusRecord } from "./api";
import "./source-status.css";

type SourceKind = "SOCIAL" | "APP";

const statusLabels: Record<string, string> = {
  ONLINE: "Online",
  DEGRADED: "Degraded",
  NOT_CONFIGURED: "Not configured",
};

function formatTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : "Never";
}

export function SourceStatusNotice({ kind }: { kind: SourceKind }) {
  const [sources, setSources] = useState<SourceStatusRecord[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    sourceStatusWithMock().then(value => {
      if (active) setSources(Array.isArray(value) ? value : []);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, []);

  if (failed) return <div className="source-page-notice unavailable">Source status unavailable.</div>;
  if (!sources) return <div className="source-page-notice">Checking source status...</div>;
  const relevant = (sources ?? []).filter(source => source?.kind === kind);
  if (relevant.length === 0) return null;
  const unavailable = relevant.filter(source => source.status !== "ONLINE");
  return <div className={`source-page-notice ${unavailable.length ? "source-warning" : ""}`}>
    {unavailable.length
      ? `Live ${kind === "SOCIAL" ? "social" : "app-store"} collection is not enabled. Showing stored observations (${unavailable.map(source => (source?.name ?? "Unnamed source").replace(" live monitor", "")).join(", ")}).`
      : `Live ${kind === "SOCIAL" ? "social" : "app-store"} sources are online.`}
  </div>;
}

export default function SourceStatus({ showControls = true }: { showControls?: boolean }) {
  const [sources, setSources] = useState<SourceStatusRecord[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busySourceId, setBusySourceId] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setSelectedId(null);
    setActionErrors({});
    try {
      const response = await sourceStatusWithMock();
      setSources(Array.isArray(response) ? response : []);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = async (source: SourceStatusRecord) => {
    const sid = source?.id;
    if (!sid) return;
    setBusySourceId(sid);
    setActionErrors(prev => ({ ...prev, [sid]: "" }));
    try {
      let updated: SourceStatusRecord;
      if (source.status === "DEGRADED" && source.simulated) {
        updated = await api.restoreSource(sid);
      } else {
        updated = await api.simulateSourceOutage(sid);
      }
      setSources(prev => (prev ?? []).map(s => (s.id === sid ? { ...s, ...updated } : s)));
      await refresh();
    } catch (err) {
      setActionErrors(prev => ({
        ...prev,
        [sid]: err instanceof Error ? err.message : "Source control failed."
      }));
    } finally {
      setBusySourceId(null);
    }
  };

  const handleCardClick = (id: string) => {
    setSelectedId(prev => (prev === id ? null : id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick(id);
    }
  };

  const [collapsed, setCollapsed] = useState(false);
  const selectedSource = sources?.find(s => s?.id === selectedId) ?? null;

  return (
    <section className={`source-status ${collapsed ? "is-collapsed" : ""}`} aria-label="Data source status">
      <div className="source-status-heading">
        <div
          className="source-title-block"
          onClick={() => setCollapsed(prev => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCollapsed(prev => !prev); } }}
          aria-expanded={!collapsed}
          style={{ cursor: "pointer" }}
        >
          <div className="source-title-row">
            <strong>Source status</strong>
            <span className="source-summary-pill">
              {sources?.filter(s => s?.status === "ONLINE").length ?? 1} Online · {sources?.length ?? 4} Monitored
            </span>
          </div>
          <span>Live collectors are planned, not implemented. Analysis uses stored observations only.</span>
        </div>
        <div className="source-heading-actions">
          <button
            type="button"
            className="source-collapse-toggle"
            onClick={() => setCollapsed(prev => !prev)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand data source monitors" : "Collapse data source monitors"}
          >
            <ChevronDown size={14} className={`source-chevron ${collapsed ? "is-collapsed" : ""}`} />
            <span>{collapsed ? "Expand" : "Collapse"}</span>
          </button>
          <button
            type="button"
            className="source-refresh"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {failed ? (
        <div className="source-status-unavailable" role="status">
          Source status unavailable.
          <button type="button" onClick={() => void refresh()} disabled={refreshing}>
            Retry
          </button>
        </div>
      ) : !sources ? (
        <p className="source-status-loading">Loading source status...</p>
      ) : (
        <div className={`source-collapsible-body ${collapsed ? "collapsed" : "expanded"}`}>
          <div className="source-chip-list">
            {(sources ?? []).map(source => {
              const statusKey = (source?.status ?? "NOT_CONFIGURED").toLowerCase();
              const isSelected = selectedId === source?.id;
              const isDegraded = source?.status === "DEGRADED";
              const isWorking = busySourceId === source?.id;
              const statusLabel = statusLabels[source?.status ?? "NOT_CONFIGURED"] ?? "Unavailable";

              return (
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${source?.name ?? "Source"}, ${statusLabel}`}
                  className={`source-card ${statusKey} ${isSelected ? "selected" : ""}`}
                  key={source?.id ?? source?.name ?? "unknown-source"}
                  onClick={() => handleCardClick(source.id)}
                  onKeyDown={(e) => handleKeyDown(e, source.id)}
                >
                  <div className="source-card-header">
                    <div className="source-card-title">
                      <span className={`source-dot ${statusKey}`} aria-hidden="true" />
                      <span className="source-card-name">{source?.name ?? "Unnamed source"}</span>
                    </div>
                    <div className="source-card-badges">
                      <span className="source-card-status">{statusLabel}</span>
                      {source?.simulated && <span className="source-demo-tag">simulated</span>}
                      {isSelected && <span className="source-selected-tag">Selected</span>}
                    </div>
                  </div>

                  <div className="source-card-message">
                    {source?.message ?? "No source detail available."}
                  </div>

                  <div className="source-card-time">
                    Last successful connection: {formatTime(source?.last_success_at ?? null)}
                  </div>

                  {showControls && source?.kind !== "DEMO" && (
                    <div className="source-card-actions">
                      <button
                        type="button"
                        className="source-action-btn"
                        disabled={isWorking}
                        aria-label={`${isDegraded ? "Restore" : "Simulate outage for"} ${source?.name ?? "source"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggle(source);
                        }}
                      >
                        {isWorking ? "Working..." : isDegraded ? "Restore" : "Simulate outage"}
                      </button>
                      <span className="source-demo-tag">demo only</span>
                      {actionErrors[source.id] && (
                        <p className="source-card-error" role="alert">
                          {actionErrors[source.id]}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="source-selection-caption" aria-live="polite">
            {selectedSource ? `Selected: ${selectedSource.name}` : "No source selected"}
          </div>
        </div>
      )}
    </section>
  );
}
