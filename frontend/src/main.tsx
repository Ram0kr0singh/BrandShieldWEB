import { Component, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, AppWindow, Eye, Radar, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, type AnalystAnalysis, type Brand, type BrandAsset, type Detection, type Investigation, type OfficialApp, type OfficialSocial, type Overview, type Threat } from "./api";
import BrandProfileEditor from "./BrandProfileEditor";
import CheckName from "./CheckName";
import SourceStatus, { SourceStatusNotice } from "./SourceStatus";
import AppSidebar from "./AppSidebar";
import PerimeterVisualization from "./PerimeterVisualization";
import BrandLogo from "./BrandLogo";
import "./styles.css";
import "./check.css";
const colors:Record<string,string>={CRITICAL:"#e4574a",HIGH:"#e4574a",MEDIUM:"#d9ae5f",LOW:"#79a6d2",SAFE:"#86b8a4"};
const Badge=({v}:{v:string})=>{const norm=v.toLowerCase().replaceAll(" ","_").replaceAll("-","_");const colorClass=norm.includes("draft")?"draft":norm;return <span className={`badge ${colorClass}`}>{v.replaceAll("_"," ")}</span>;};
function Shell({children}:{children:React.ReactNode}){return <div className="shell aegis-shell"><AppSidebar/><main className="content">{children}</main></div>}
const Loading=({children}:{children:React.ReactNode})=><div className="loader">{children}</div>;
function Table({items,open}:{items:Threat[];open:(id:string)=>void}){return <section className="tablecard"><h2>Recent threats</h2><p>Prioritized from persisted detection evidence.</p>{items.length?<table><thead><tr><th>Candidate</th><th>Source</th><th>Threat type</th><th>Risk</th><th>Severity</th><th>Status</th></tr></thead><tbody>{items.map(t=><tr key={t.id} onClick={()=>open(t.id)}><td>{t.name}</td><td>{t.source}</td><td>{t.threat_type?.replaceAll("_"," ")}</td><td>{t.risk_score.toFixed(2)}</td><td><Badge v={t.severity}/></td><td><Badge v={t.status}/></td></tr>)}</tbody></table>:<div className="empty">No threats detected. No suspicious candidates were identified for this protected brand.</div>}</section>}
function formatTransformation(transformations: any[] | undefined, official: string, candidate: string) {
  if (!transformations || transformations.length === 0) return "No transformation recorded";
  return transformations.map((t: any) => {
    if (t.type === "CHARACTER_SUBSTITUTION") {
      const candBase = candidate.split(" ")[0];
      return `${official} → ${candBase} (${t.from} → ${t.to})`;
    }
    if (t.type === "ADDED_WORDS" && t.tokens) {
      return `Added words: ${t.tokens.join(", ")}`;
    }
    if (t.type === "SPACING_VARIATION") {
      return "Spacing variation";
    }
    if (t.type === "HOMOGLYPH_SUBSTITUTION") return `Homoglyph: ${t.from} → ${t.to} (${(t.code_points||[]).join(", ")})`;
    if (t.type === "CHARACTER_TRANSPOSITION") return `Transposed characters: ${t.from} → ${t.to}`;
    if (t.type === "REPEATED_CHARS") return `Repeated character: ${t.character}`;
    if (t.type === "CHARACTER_OMISSION") return `Omitted character: ${t.character}`;
    if (t.type === "CHARACTER_INSERTION") return `Inserted character: ${t.character}`;
    return JSON.stringify(t);
  }).join(" · ");
}
function timeAgo(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return dateStr;
  }
}
function OverviewPage(){
  const [brands,setBrands]=useState<Brand[]>([]),[id,setId]=useState(""),[data,setData]=useState<Overview|null>(null),[detections,setDetections]=useState<Detection[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false),[scanWarnings,setScanWarnings]=useState<import("./api").SourceWarning[]>([]),nav=useNavigate();
  const [sourceOpen, setSourceOpen] = useState(false);
  const [allDetections, setAllDetections] = useState<Detection[]>([]);
  const [detectionsLoaded, setDetectionsLoaded] = useState(false);

  /** Aggregate multiple overviews into a single combined Overview for "All Brands" mode */
  const aggregateOverviews = (ovs: Overview[]): Overview => {
    const totals = ovs.reduce((acc, o) => ({
      detected_threats: acc.detected_threats + (o.summary.detected_threats ?? 0),
      high_risk:        acc.high_risk        + (o.summary.high_risk        ?? 0),
      lookalikes:       acc.lookalikes       + (o.summary.lookalikes       ?? 0),
      total_candidates: acc.total_candidates + (o.summary.total_candidates ?? 0),
    }), { detected_threats:0, high_risk:0, lookalikes:0, total_candidates:0 });

    // Merge source distributions
    const srcMap: Record<string,number> = {};
    for (const o of ovs) {
      if (Array.isArray(o.source_distribution)) {
        for (const s of o.source_distribution) srcMap[s.source] = (srcMap[s.source]??0) + s.count;
      }
    }
    const source_distribution = Object.entries(srcMap).map(([source,count]) => ({ source, count }));

    // Latest scan across all brands
    const scans = ovs.map(o => o.last_scan).filter(Boolean) as {completed_at:string|null;candidate_count:number}[];
    const totalCandidatesAnalyzed = scans.reduce((sum, s) => sum + (s.candidate_count ?? 0), 0);
    const latestCompletedAt = scans.sort((a,b) => new Date(b.completed_at??0).getTime() - new Date(a.completed_at??0).getTime())[0]?.completed_at ?? null;
    const last_scan = latestCompletedAt ? { completed_at: latestCompletedAt, candidate_count: totalCandidatesAnalyzed } : null;

    const recent_threats = ovs.flatMap(o => o.recent_threats ?? []).sort((a,b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());

    return {
      brand: { id: "", name: "All Brands" },
      summary: totals,
      risk_distribution: [],
      source_distribution,
      threat_type_distribution: [],
      recent_threats,
      last_scan
    };
  };

  const load=useCallback(async(x:string)=>{
    setError("");
    setData(null);
    try{
      if(x === ""){
        // All Brands: aggregate every brand's overview + show all detections
        const [allBrands, dets] = await Promise.all([api.brands(), api.detections().catch(()=>[])]);
        const ovResults = await Promise.allSettled(allBrands.map(b => api.overview(b.id)));
        const validOvs = ovResults.filter((r): r is PromiseFulfilledResult<Overview> => r.status==="fulfilled").map(r => r.value);
        if(validOvs.length > 0) setData(aggregateOverviews(validOvs));
        setDetections(dets);
        setAllDetections(dets);
        setDetectionsLoaded(true);
      } else {
        const [ov, dets] = await Promise.all([api.overview(x), api.detections().catch(() => [])]);
        setData(ov);
        setDetections(dets.filter(d => !d.brand_id || d.brand_id === x));
        setAllDetections(dets);
        setDetectionsLoaded(true);
      }
    }catch{
      setError("Unable to load dashboard data.");
    }
  },[]);

  const init=useCallback(async()=>{
    setError("");
    try{
      const b=await api.brands();
      setBrands(b);
      setId(""); // Default: All Brands
      await load("");
    }catch{
      setError("Unable to load protected brands.");
    }
  },[load]);

  // Build a Set of brand_id values that appear in at least one detection
  // NOTE: must be before any early returns (Rules of Hooks)
  const brandsWithData = useMemo(() => {
    if (!detectionsLoaded) return null;
    const set = new Set<string>();
    for (const d of allDetections) {
      if (d.brand_id) set.add(d.brand_id);
    }
    return set;
  }, [allDetections, detectionsLoaded]);

  const filteredBrands = useMemo(() => {
    if (!brandsWithData) return brands;
    return brands.filter(b => brandsWithData.has(b.id));
  }, [brands, brandsWithData]);

  // If the currently selected brand id is not in brandsWithData, auto-select the first brand that is
  useEffect(() => {
    if (id && brandsWithData && !brandsWithData.has(id)) {
      const firstValid = filteredBrands[0]?.id || "";
      setId(firstValid);
      setScanWarnings([]);
      void load(firstValid);
    }
  }, [id, brandsWithData, filteredBrands, load]);

  useEffect(()=>{void init()},[init]);
  const scan=async()=>{
    setBusy(true);
    setScanWarnings([]);
    try{
      if(!id){
        // Scan all brands
        const allWarnings: import("./api").SourceWarning[] = [];
        for(const b of brands){
          try{
            const result=await api.scan(b.id);
            if(Array.isArray(result?.source_warnings)){
              allWarnings.push(...result.source_warnings);
            }
          }catch{}
        }
        setScanWarnings(allWarnings);
        await load("");
      } else {
        const result=await api.scan(id);
        setScanWarnings(Array.isArray(result?.source_warnings)?result.source_warnings:[]);
        await load(id);
      }
    }catch{
      setError("Scan could not be completed.");
    }finally{
      setBusy(false);
    }
  };
  if(error)return <Loading>{error} <button type="button" onClick={()=> (id && brands.length ? load(id) : init())}>Retry</button></Loading>;
  if(!data)return <Loading>Loading dashboard...</Loading>;


  const isAllBrands = !id;
  const currentBrand = brands.find(b=>b.id===id);
  const brandName = isAllBrands ? "All Brands" : (currentBrand?.name || data.brand?.name || "Protected Brand");
  const metrics=[["Detected threats",data.summary.detected_threats,AlertTriangle],["High risk",data.summary.high_risk,AlertTriangle],["Look-alikes",data.summary.lookalikes,Radar],["Candidates monitored",data.summary.total_candidates,Users]];

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const socialDist = data.source_distribution.find(s=>s.source==="Social Media")?.count ?? 0;
  const appDist = data.source_distribution.find(s=>s.source==="App Store")?.count ?? 0;

  const socialDets = detections.filter(d=>d.candidate.source==="Social Media");
  const appDets = detections.filter(d=>d.candidate.source==="App Store");
  const socialCrit = socialDets.filter(d=>d.severity==="CRITICAL"||d.severity==="HIGH").length;
  const appCrit = appDets.filter(d=>d.severity==="CRITICAL"||d.severity==="HIGH").length;

  const socialCount = socialDets.length > 0 ? socialDets.length : socialDist;
  const appCount    = appDets.length    > 0 ? appDets.length    : appDist;
  const maxSource   = Math.max(socialCount, appCount, 1);
  const socialPct   = Math.round((socialCount / maxSource) * 100);
  const appPct      = Math.round((appCount    / maxSource) * 100);

  const snapshotRows = [
    { label: "Social Media", icon: "SM", total: socialDets.length || socialDist, critical: socialCrit },
    { label: "App Store", icon: "AS", total: appDets.length || appDist, critical: appCrit },
  ];

  const recentList = detections.length ? detections.slice(0, 5) : data.recent_threats.slice(0, 5);

  return <>
    <header className="overview-header">
      <div>
        <div className="overview-eyebrow-active">
          <span className="pulse-dot" aria-hidden="true" />
          {!isAllBrands && currentBrand && (
            <BrandLogo brand={currentBrand} name={currentBrand.name} domain={currentBrand.official_domain} logoUrl={currentBrand.logo_url} size={22} />
          )}
          <span>PROTECTION ACTIVE · {brandName.toUpperCase()}</span>
        </div>
        <h1>Digital Perimeter Briefing</h1>
        <p className="overview-date">{todayStr}</p>
      </div>
      <div className="actions">
        <label>Protected brand
          <select value={id} onChange={e=>{setId(e.target.value);setScanWarnings([]);load(e.target.value)}}>
            <option value="">All Brands</option>
            {filteredBrands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <button type="button" className="primary" onClick={scan} disabled={busy}>
          <RefreshCw size={16} className={busy?"spin":""}/>
          {busy?"Scanning...":"Scan now"}
        </button>
      </div>
    </header>

    {/* QA Selectors: Source status strip, scan warnings */}
    <SourceStatus showControls/>
    {scanWarnings.length>0&&<div className="scan-source-warning" role="status">Scan completed using stored observations. Degraded sources: {scanWarnings.map(source=>source.name).join(", ")}.</div>}
    <div className="scanline">{data.last_scan?`Last scan completed ${data.last_scan.completed_at?new Date(data.last_scan.completed_at).toLocaleString():"recently"} · ${data.last_scan.candidate_count} candidates analyzed`:"No monitoring run recorded yet. Run a scan to establish the latest monitoring snapshot."}</div>
    <section className="metrics">{metrics.map(([label,value,Icon])=>{const I=Icon as typeof AlertTriangle;return <article className="metric" key={label as string}><I/><span>{label as string}</span><strong>{value as number}</strong></article>})}</section>

    {/* Upper Section (55% / 45%) */}
    <div className="overview-top-grid">
      <div className="active-threats-card">
        <div>
          <h2 className="active-threats-header">ACTIVE THREATS</h2>
          <div className="threat-count-row">
            <span className="threat-count-big">{data.summary.detected_threats}</span>
            <div className="threat-breakdown-lines">
              <span className="threat-breakdown-line critical">▲ {data.summary.high_risk} critical</span>
              <span className="threat-breakdown-line suspicious">▲ {Math.max(0, data.summary.detected_threats - data.summary.high_risk)} suspicious</span>
            </div>
          </div>
        </div>

        <div className="source-bars">
          <div className="source-bar-item">
            <div className="source-bar-header">
              <span>Social Media</span>
              <span>{socialCount}</span>
            </div>
            <div className="source-bar-track">
              <div className="source-bar-fill social" style={{ width: `${socialPct}%` }} />
            </div>
          </div>
          <div className="source-bar-item">
            <div className="source-bar-header">
              <span>App Store</span>
              <span>{appCount}</span>
            </div>
            <div className="source-bar-track">
              <div className="source-bar-fill apps" style={{ width: `${appPct}%` }} />
            </div>
          </div>
        </div>

        <div className="overview-legend-row">
          <div className="legend-dot-item"><span className="legend-dot social" /><span>Social</span></div>
          <div className="legend-dot-item"><span className="legend-dot apps" /><span>App Stores</span></div>
          <div className="legend-dot-item"><span className="legend-dot web" /><span>Web (not monitored)</span></div>
          <div className="legend-dot-item"><span className="legend-dot darkweb" /><span>Dark Web (not monitored)</span></div>
        </div>
      </div>

      <PerimeterVisualization brandName={brandName} overview={data} detections={detections} onSelectThreat={x=>nav(`/threats/${x}`)}/>
    </div>

    {/* Lower Section (50% / 50%) */}
    <div className="overview-bottom-grid">
      <div className="snapshot-card">
        <div className="card-title-row">
          <h3>THREAT SURFACE SNAPSHOT</h3>
        </div>
        <table className="snapshot-table">
          <tbody>
            {snapshotRows.map(row => (
              <tr key={row.label}>
                <td className="snapshot-platform-cell">
                  <span className="platform-pill-icon">{row.icon}</span>
                  <span>{row.label}</span>
                </td>
                <td>
                  {row.critical > 0 && <span className="critical-chip">{row.critical} critical</span>}
                </td>
                <td className="snapshot-count">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ledger-card">
        <div className="card-title-row">
          <h3>RECENT INTELLIGENCE</h3>
          <Link to="/threats" className="all-link">ALL →</Link>
        </div>
        <div className="ledger-list">
          {recentList.map((item: any) => {
            const candName = item.candidate?.name || item.name;
            const score = Math.round(item.risk_score);
            const sev = (item.severity || "SAFE").toLowerCase();
            const timeStr = timeAgo(item.detected_at);
            return (
              <div key={item.id} className="ledger-item" onClick={() => nav(`/threats/${item.id}`)}>
                <div className="ledger-left">
                  <span className="platform-pill-icon">{(item.candidate?.source || item.source) === "App Store" ? "AS" : "SM"}</span>
                  <div className="ledger-info">
                    <span className="ledger-name">{candName}</span>
                    <span className="ledger-time">{timeStr}</span>
                  </div>
                </div>
                <span className={`score-circle-pill ${sev}`}>{score}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    <Table items={data.recent_threats} open={x=>nav(`/threats/${x}`)}/>
  </>;
}
function BrandProfile(){return <BrandProfileEditor/>}
function List({ mode }: { mode: string }) {
  const [all, setAll] = useState<Detection[] | null>(null);
  const [error, setError] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const nav = useNavigate();

  const load = useCallback(() => {
    setError("");
    api.detections()
      .then(setAll)
      .catch(() => setError("Unable to load monitoring data. Check the API connection and retry."));
  }, []);

  useEffect(load, [load]);

  const stageCounts = useMemo(() => {
    if (!all) return { ALL: 0, NEW: 0, INVESTIGATING: 0, CONFIRMED_THREAT: 0, FALSE_POSITIVE: 0, DISMISSED: 0 };
    return {
      ALL: all.length,
      NEW: all.filter(x => x.status === "NEW").length,
      INVESTIGATING: all.filter(x => x.status === "INVESTIGATING").length,
      CONFIRMED_THREAT: all.filter(x => x.status === "CONFIRMED_THREAT").length,
      FALSE_POSITIVE: all.filter(x => x.status === "FALSE_POSITIVE").length,
      DISMISSED: all.filter(x => x.status === "DISMISSED").length,
    };
  }, [all]);

  if (error) return <Loading>{error} <button onClick={load}>Retry</button></Loading>;
  if (!all) return <Loading>Loading monitoring data...</Loading>;

  let d = all;
  if (mode === "social") {
    d = all.filter(x => x.candidate.source === "Social Media");
  } else if (mode === "apps") {
    d = all.filter(x => x.candidate.source === "App Store");
  } else if (mode === "look") {
    d = all.filter(x => x.evidence.some(e => e.signal_type === "LOOKALIKE_NAME" && e.details?.detected === true));
  }

  d = d.filter(x =>
    (severity === "ALL" || x.severity === severity) &&
    (source === "ALL" || x.candidate.source === source) &&
    (status === "ALL" || x.status === status)
  );

  const pipelineStages: { id: string; label: string; count: number }[] = [
    { id: "ALL", label: "ALL", count: stageCounts.ALL },
    { id: "NEW", label: "NEW", count: stageCounts.NEW },
    { id: "INVESTIGATING", label: "INVESTIGATING", count: stageCounts.INVESTIGATING },
    { id: "CONFIRMED_THREAT", label: "CONFIRMED THREAT", count: stageCounts.CONFIRMED_THREAT },
    { id: "FALSE_POSITIVE", label: "FALSE POSITIVE", count: stageCounts.FALSE_POSITIVE },
    { id: "DISMISSED", label: "DISMISSED", count: stageCounts.DISMISSED },
  ];

  return (
    <>
      <header>
        <div>
          <p className="eyebrow">
            {mode === "social" ? "03 · SOCIAL MEDIA" : mode === "apps" ? "04 · APP STORES" : mode === "look" ? "06 · LOOK-ALIKE DETECTION" : "05 · THREATS"}
          </p>
          <h1>
            {mode === "social" ? "Social media monitoring" : mode === "apps" ? "App store monitoring" : mode === "look" ? "Look-alike detection" : "Threats"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            {mode === "look" ? "Algorithmic character and homoglyph mutations detected" : `Showing ${d.length} detection candidates prioritized from persisted evidence`}
          </p>
        </div>

        {mode !== "look" && (
          <div className="filters">
            <select value={severity} onChange={e => setSeverity(e.target.value)}>
              <option value="ALL">All severities</option>
              {["HIGH", "MEDIUM", "LOW", "SAFE"].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            {mode === "all" && (
              <>
                <select value={source} onChange={e => setSource(e.target.value)}>
                  <option value="ALL">All sources</option>
                  <option value="Social Media">Social Media</option>
                  <option value="App Store">App Store</option>
                </select>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="ALL">All investigation states</option>
                  {["NEW", "INVESTIGATING", "CONFIRMED_THREAT", "FALSE_POSITIVE", "DISMISSED"].map(x => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        )}
      </header>

      {mode === "all" && (
        <div className="status-pipeline-rail">
          {pipelineStages.map((stage, idx) => (
            <div key={stage.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                className={`status-node-btn ${status === stage.id ? "active" : ""}`}
                onClick={() => setStatus(status === stage.id && stage.id !== "ALL" ? "ALL" : stage.id)}
              >
                <span className={`status-node-dot ${stage.count > 0 ? "has-count" : ""}`} />
                <span>{stage.label}</span>
                <span className="status-node-count">{stage.count}</span>
              </button>
              {idx < pipelineStages.length - 1 && <span className="status-rail-separator">→</span>}
            </div>
          ))}
        </div>
      )}

      {mode === "look" ? (
        <section className="lookgrid">
          {d.map(x => {
            const e = x.evidence.find(v => v.signal_type === "LOOKALIKE_NAME");
            const officialName = String(e?.details?.official_name || "Nike");
            return (
              <article className="look" key={x.id}>
                <p>OFFICIAL</p>
                <strong>{officialName}</strong>
                <p>CANDIDATE</p>
                <strong>{x.candidate.name}</strong>
                <p>TRANSFORMATION</p>
                <span>{formatTransformation(e?.details?.transformations as any[], officialName, x.candidate.name)}</span>
                <div>
                  <Badge v={x.severity} /> <span className="score" style={{ fontSize: 16 }}>{x.risk_score.toFixed(2)}</span>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <Table
          items={d.map(x => ({ ...x, name: x.candidate.name, source: x.candidate.source, publisher: x.candidate.publisher }))}
          open={x => nav(`/threats/${x}`)}
        />
      )}
    </>
  );
}
function Detail() {
  const { id } = useParams();
  const [d, setD] = useState<Detection | null>(null);
  const [inv, setInv] = useState<Investigation | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [officialSocial, setOfficialSocial] = useState<OfficialSocial[]>([]);
  const [officialApps, setOfficialApps] = useState<OfficialApp[]>([]);
  const [analysis, setAnalysis] = useState<AnalystAnalysis | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const analysisRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setError("");
    Promise.all([api.detection(id), api.investigation(id)])
      .then(([detection, state]) => {
        setD(detection);
        setInv(state);
        if (detection.brand_id) {
          api.brand(detection.brand_id).then(setBrand).catch(() => {});
          api.brandSocial(detection.brand_id).then(setOfficialSocial).catch(() => {});
          api.brandApps(detection.brand_id).then(setOfficialApps).catch(() => {});
        }
      })
      .catch(() => setError("Unable to load investigation data. Check the API connection and retry."));
  }, [id]);

  useEffect(load, [load]);

  const mutate = async (action: () => Promise<Investigation>) => {
    setBusy(true);
    setError("");
    try {
      setInv(await action());
      await load();
    } catch {
      setError("The requested investigation update could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const runAnalysis = async () => {
    if (!d) return;
    setAnalyzing(true);
    setError("");
    try {
      const result = await api.analyze(d.id);
      setAnalysis(result);
      // Scroll to the report after React renders it
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          analysisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    } catch {
      setError("AI Analyst could not generate an evidence-grounded explanation.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!d || !inv) return <Loading>{error || "Loading threat..."}{error && <> <button onClick={load}>Retry</button></>}</Loading>;

  const statuses = ["NEW", "INVESTIGATING", "CONFIRMED_THREAT", "FALSE_POSITIVE", "DISMISSED"];
  const draftType = d.candidate.source === "App Store" ? "APP_STORE" : "SOCIAL_PLATFORM";
  const publisherEvidence = d.evidence.find(e => e.signal_type === "PUBLISHER_MISMATCH");
  const officialPublishers = Array.isArray(publisherEvidence?.details?.official_developers) ? publisherEvidence.details.official_developers.join(", ") : null;

  // Gauge Arc calculations
  const scoreVal = Math.round(d.risk_score);
  const sevKey = d.severity?.toUpperCase() || "SAFE";
  const sevColor = sevKey === "HIGH" || sevKey === "CRITICAL" ? "#e4574a" : sevKey === "MEDIUM" ? "#d9ae5f" : "#86b8a4";
  const circumference = 2 * Math.PI * 24; // ~150.8
  const strokeOffset = circumference * (1 - Math.min(100, Math.max(0, d.risk_score)) / 100);

  // Official identity resolution
  const isApp = d.candidate.source === "App Store";
  const matchedOfficialApp = officialApps[0];
  const matchedOfficialSocial = officialSocial[0];
  const officialName = isApp ? (matchedOfficialApp?.app_name || brand?.name || "Official App") : (matchedOfficialSocial?.handle ? `@${matchedOfficialSocial.handle}` : brand?.name || "@official");
  const officialSub = isApp ? (matchedOfficialApp?.package_identifier || brand?.name || "App Store") : (brand?.name || "Verified Social");
  const officialInitial = (brand?.name || "B").charAt(0).toUpperCase();
  const suspectInitial = (d.candidate.name || "S").charAt(0).toUpperCase();

  // Logo resolution from LOGO_SIMILARITY evidence
  const logoEvidence = d.evidence.find(e => e.signal_type === "LOGO_SIMILARITY");
  const officialLogoPath = (logoEvidence?.details as any)?.official_logo || brand?.logo_url || null;
  const candidateLogoPath = (logoEvidence?.details as any)?.candidate_logo || (d.candidate as any)?.avatar_url || null;

  // Similarity Signals
  const simSignals = d.evidence.filter(e => e.available !== false);

  return (
    <>
      {/* Top Header */}
      <div className="detail-top-header">
        <div>
          <Link to="/threats" className="detail-back-link">← Back to threats</Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
            <span className="eyebrow" style={{ margin: 0 }}>THREAT INVESTIGATION</span>
            <Badge v={inv.status} />
          </div>
          <h1 className="detail-title">{d.candidate.name}</h1>
          <p className="detail-subtitle">
            {d.candidate.source}
            {d.candidate.publisher ? ` · Publisher: ${d.candidate.publisher}` : ""}
            {officialPublishers ? ` · Official publisher: ${officialPublishers}` : ""}
          </p>
        </div>

        {/* Score Gauge Card */}
        <div className="detail-score-gauge-card">
          <svg className="score-arc-svg" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="var(--bg-elevated)" strokeWidth="4" />
            <circle
              cx="30"
              cy="30"
              r="24"
              fill="none"
              stroke={sevColor}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              transform="rotate(-90 30 30)"
            />
            <text x="30" y="36" textAnchor="middle" className="score-arc-val">{scoreVal}</text>
          </svg>
          <div className="score-gauge-info">
            <span className={`score-gauge-severity ${d.severity.toLowerCase()}`}>
              {d.severity === "HIGH" ? "Critical Threat" : d.severity === "MEDIUM" ? "Medium Threat" : d.severity === "LOW" ? "Low Risk" : "Safe / Baseline"}
            </span>
            <span className="score-gauge-meta">{d.confidence ? `${Math.round(d.confidence)}% confidence` : "100% confidence"}</span>
            <span className="score-gauge-meta">Opened: {timeAgo(d.detected_at)}</span>
          </div>
        </div>
      </div>

      {error && <div className="scanline">{error}</div>}

      {/* IDENTITY SPECIMENS */}
      <div className="identity-specimens-card">
        <div className="specimens-header">IDENTITY SPECIMENS</div>
        <div className="specimens-grid">
          {/* Official Specimen */}
          <div className="specimen-col">
            <span className="specimen-type-label official">OFFICIAL IDENTITY</span>
            <div className="specimen-entity">
              <div className="specimen-avatar official">
                <BrandLogo
                  brand={brand}
                  name={brand?.name || officialName}
                  domain={brand?.official_domain}
                  logoUrl={officialLogoPath}
                  fallbackInitial={officialInitial}
                  size={44}
                />
              </div>
              <div className="specimen-details">
                <div className="specimen-main-name">
                  <span>{officialName}</span>
                  <span className="verified-tag">✓ VERIFIED</span>
                </div>
                <span className="specimen-sub-info">{officialSub}</span>
                <span className="platform-pill-icon">{isApp ? "AS" : "SM"}</span>
              </div>
            </div>
          </div>

          <div className="specimen-vs">vs</div>

          {/* Suspect Specimen */}
          <div className="specimen-col">
            <span className="specimen-type-label suspect">SUSPECT IDENTITY</span>
            <div className="specimen-entity">
              <div className="specimen-avatar suspect">
                <BrandLogo
                  name={d.candidate.name}
                  logoUrl={candidateLogoPath}
                  fallbackInitial={suspectInitial}
                  isSuspect
                  size={44}
                />
              </div>
              <div className="specimen-details">
                <div className="specimen-main-name">
                  <span>{d.candidate.name}</span>
                </div>
                <span className="specimen-sub-info">{d.candidate.publisher ? `Publisher: ${d.candidate.publisher}` : d.candidate.source}</span>
                <span className="platform-pill-icon">{isApp ? "AS" : "SM"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Middle Section: SIMILARITY ANALYSIS & THREAT DNA */}
      <div className="detail-analysis-grid">
        {/* Left: SIMILARITY ANALYSIS */}
        <div className="similarity-analysis-card">
          <div className="card-section-title">SIMILARITY ANALYSIS</div>
          <div className="card-section-sub">Evidence signal breakdowns and heuristics</div>
          <div className="sim-signals-list">
            {simSignals.map(e => {
              const score = e.score !== null && e.score !== undefined ? Math.round(e.score) : null;
              const fillClass = (score ?? 0) >= 70 ? "" : (score ?? 0) >= 40 ? "moderate" : "safe";
              const isLogoSim = e.signal_type === "LOGO_SIMILARITY";
              const notCounted = isLogoSim && ((e.details as any)?.counted === false || (e.score !== null && e.score < 70));
              const detailsStr = Object.entries(e.details)
                .filter(([k]) => k !== "counted")
                .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
                .join(" · ");

              return (
                <div className="sim-signal-item" key={e.signal_type}>
                  <div className="sim-signal-header">
                    <span className="sim-signal-name">{e.signal_type.replaceAll("_", " ")}</span>
                    <span className="sim-signal-score">{score !== null ? score : "—"}</span>
                  </div>
                  <div className="sim-signal-track">
                    <div
                      className={`sim-signal-fill ${fillClass}`}
                      style={{ width: `${score !== null ? Math.min(100, Math.max(0, score)) : 0}%` }}
                    />
                  </div>
                  {notCounted && <div className="sim-signal-not-counted">Not counted as evidence</div>}
                  {detailsStr && <div className="sim-signal-desc">{detailsStr}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: THREAT DNA */}
        <div className="threat-dna-card">
          <div className="card-section-title">THREAT DNA</div>
          <div className="card-section-sub">Signal fingerprint — {d.evidence.length} detection vectors</div>
          <div className="dna-bars-wrapper">
            <div className="dna-bars-container">
              {d.evidence.map((ev, i) => {
                const s = ev.score;
                const h = s !== null && s !== undefined ? Math.max(8, Math.round((s / 100) * 80)) : 6;
                const bg = s === null || s === undefined || s === 0 ? "#383844" : s >= 70 ? "#e4574a" : s >= 40 ? "#d9ae5f" : "#79a6d2";
                return (
                  <div
                    key={ev.signal_type || i}
                    className="dna-bar-item"
                    style={{ height: `${h}px`, backgroundColor: bg }}
                    title={`${ev.signal_type.replaceAll("_", " ")}: ${s !== null ? s : "N/A"}`}
                  />
                );
              })}
            </div>
            <div className="dna-legend">
              <div className="dna-legend-item"><span className="dna-legend-dot" style={{ backgroundColor: "#383844" }} /><span>None</span></div>
              <div className="dna-legend-item"><span className="dna-legend-dot" style={{ backgroundColor: "#79a6d2" }} /><span>Low</span></div>
              <div className="dna-legend-item"><span className="dna-legend-dot" style={{ backgroundColor: "#d9ae5f" }} /><span>Medium</span></div>
              <div className="dna-legend-item"><span className="dna-legend-dot" style={{ backgroundColor: "#e4574a" }} /><span>Critical</span></div>
            </div>
          </div>
        </div>
      </div>


      {/* Analyst Action & Raw Evidence Lower Grid */}
      <div className="detail-lower-grid">
        {/* Left: Analyst Action */}
        <div className="analyst-action-card">
          <div className="card-section-title">ANALYST ACTIONS</div>
          <div className="card-section-sub">Current investigation decision &amp; workflows</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 10px" }}>
            Current status: <Badge v={inv.status} />
          </p>
          <div className="action-form-row">
            <select
              aria-label="Investigation status"
              value={inv.status}
              disabled={busy}
              onChange={e => mutate(() => api.status(d.id, e.target.value))}
            >
              {statuses.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            <textarea
              value={note}
              maxLength={4000}
              placeholder="Add an investigation note…"
              onChange={e => setNote(e.target.value)}
            />
            <div className="action-buttons-row">
              <button disabled={busy || !note.trim()} onClick={() => mutate(async () => { const r = await api.note(d.id, note); setNote(""); return r; })}>
                Add note
              </button>
              <button className="primary" disabled={busy} onClick={() => mutate(async () => { await api.draft(d.id, draftType); return api.investigation(d.id); })}>
                Generate {draftType.replaceAll("_", " ")} draft
              </button>
              <button className="analyst-button" disabled={analyzing} onClick={runAnalysis}>
                {analyzing ? "Analyzing evidence…" : "AI Analyst"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Persisted Evidence Dossier */}
        <div className="evidence-dossier-card">
          <div className="card-section-title">EVIDENCE DOSSIER</div>
          <div className="card-section-sub">Persisted detection signals &amp; raw details</div>
          {d.evidence.map(e => (
            <div className="evidence" key={e.signal_type}>
              <strong>{e.signal_type.replaceAll("_", " ")}</strong>
              <span>{e.available ? "Available" : "Unavailable"}</span>
              <span>{e.score !== null && e.score !== undefined ? e.score.toFixed(2) : "—"}</span>
              <p>{Object.entries(e.details).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" · ")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analyst Explanation — rendered BELOW Analyst Actions */}
      {analysis && (
        <div className="analyst-assessment-card" ref={analysisRef}>
          <div className="assessment-meta-row">
            <span className="eyebrow" style={{ margin: 0 }}>
              AI ANALYST · {analysis.provider.replaceAll("_", " ")} · {analysis.confidence} · {new Date(analysis.generated_at).toLocaleString()}
            </span>
            <span className="intel-badge">AEGIS INTEL</span>
          </div>
          <div className="assessment-body">
            <div className="assessment-section">
              <h4>Analyst Summary</h4>
              <p>{analysis.summary}</p>
            </div>
            <div className="assessment-section">
              <h4>Why It Was Flagged</h4>
              <p>{analysis.risk_rationale}</p>
            </div>
            {analysis.key_evidence.length > 0 && (
              <div className="assessment-section">
                <h4>Key Evidence</h4>
                <ul className="assessment-list">
                  {analysis.key_evidence.map(x => (
                    <li key={x.signal_type}>
                      <strong>{x.summary}</strong> {x.score !== null ? `(${x.score.toFixed(2)})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.uncertainties.length > 0 && (
              <div className="assessment-section">
                <h4>Uncertainties</h4>
                <ul className="assessment-list">
                  {analysis.uncertainties.map((u, i) => <li key={i}>{u}</li>)}
                </ul>
              </div>
            )}
            {analysis.recommended_actions.length > 0 && (
              <div className="assessment-section">
                <h4>Recommended Analyst Actions</h4>
                <ol className="assessment-list">
                  {analysis.recommended_actions.map((act, i) => <li key={i}>{act}</li>)}
                </ol>
              </div>
            )}
            <p className="notice">This explanation does not change the authoritative score, severity, evidence, or investigation decision.</p>
          </div>
        </div>
      )}

      {/* Workspace Activity & Remediation Drafts */}
      <section className="workspace">
        <article>
          <h2>Activity history</h2>
          {inv.activity.length ? (
            inv.activity.map(x => (
              <div className="timeline" key={x.id}>
                <strong>{x.event_type.replaceAll("_", " ")}</strong>
                <span>{x.previous_value && `${x.previous_value} → `}{x.new_value}</span>
                <p>{new Date(x.created_at).toLocaleString()} · {x.actor}</p>
              </div>
            ))
          ) : (
            <p className="empty">No investigation activity yet.</p>
          )}

          <h2 style={{ marginTop: 20 }}>Notes</h2>
          {inv.notes.length ? (
            inv.notes.map(x => (
              <div className="timeline" key={x.id}>
                <strong>{x.content}</strong>
                <p>{new Date(x.created_at).toLocaleString()} · {x.actor}</p>
              </div>
            ))
          ) : (
            <p className="empty">No analyst notes yet.</p>
          )}
        </article>

        <article>
          <h2>Remediation drafts</h2>
          {inv.drafts.length ? (
            inv.drafts.map(x => (
              <div className="draft" key={x.id}>
                <Badge v="DRAFT ONLY - NOT SENT" />
                <p>{x.draft_type.replaceAll("_", " ")} · {new Date(x.created_at).toLocaleString()}</p>
                <pre>{x.content}</pre>
                <button onClick={() => navigator.clipboard?.writeText(x.content)}>Copy draft</button>
              </div>
            ))
          ) : (
            <p className="empty">No remediation draft has been generated. Drafts are local templates and are never sent.</p>
          )}
        </article>
      </section>
    </>
  );
}
class ViewErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(_error:Error,_info:ErrorInfo){}render(){if(this.state.failed)return <section className="view-error" role="alert"><h1>Something went wrong in this view</h1><p>You can retry this view, reload the application, or return to the dashboard.</p><div><button type="button" onClick={()=>this.setState({failed:false})}>Retry</button><button type="button" onClick={()=>window.location.reload()}>Reload</button><Link to="/">Dashboard</Link></div></section>;return this.props.children;}}
function RoutedContent(){return <ViewErrorBoundary><Routes><Route path="/" element={<OverviewPage/>}/><Route path="/profile" element={<BrandProfile/>}/><Route path="/social" element={<SocialPage/>}/><Route path="/apps" element={<AppsPage/>}/><Route path="/threats" element={<List mode="all"/>}/><Route path="/lookalikes" element={<List mode="look"/>}/><Route path="/check" element={<CheckName/>}/><Route path="/threats/:id" element={<Detail/>}/><Route path="*" element={<OverviewPage/>}/></Routes></ViewErrorBoundary>}
function App(){return <Shell><RoutedContent/></Shell>};createRoot(document.getElementById("root")!).render(<BrowserRouter><App/></BrowserRouter>);
function SocialPage(){return <><SourceStatusNotice kind="SOCIAL"/><List mode="social"/></>}
function AppsPage(){return <><SourceStatusNotice kind="APP"/><List mode="apps"/></>}
