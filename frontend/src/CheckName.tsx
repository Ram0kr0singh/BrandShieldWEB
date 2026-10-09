import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, X } from "lucide-react";
import { ApiError, api, type Brand, type NameAnalysis } from "./api";
import { presetsForBrand, type CheckPreset } from "./checkPresets";

type BatchResult = {
  key: string;
  preset: CheckPreset;
  result: NameAnalysis | null;
  error?: string;
};

type RecentCheck = {
  key: string;
  brandName: string;
  label: string;
  result: NameAnalysis;
};

function describeTransformations(result: NameAnalysis): string {
  if (!result.transformations.length) return "—";
  return result.transformations.map(item => {
    const type = String(item.type ?? "").replaceAll("_", " ").toLowerCase();
    if (item.type === "HOMOGLYPH_SUBSTITUTION") return `Homoglyph ${String(item.from)} → ${String(item.to)}`;
    if (item.type === "CHARACTER_SUBSTITUTION") return `Character substitution ${String(item.from)} → ${String(item.to)}`;
    if (item.type === "CHARACTER_TRANSPOSITION") return "Transposed characters";
    if (item.type === "REPEATED_CHARS") return "Repeated character";
    if (item.type === "CHARACTER_OMISSION") return "Omitted character";
    if (item.type === "SPACING_VARIATION") return "Spacing variation";
    if (item.type === "ADDED_WORDS") return `Added word(s): ${Array.isArray(item.tokens) ? item.tokens.join(", ") : ""}`;
    return type || "Transformation";
  }).join(" · ");
}

function nonAsciiPoints(candidate: string): string[] {
  return Array.from(candidate)
    .filter(character => character.codePointAt(0)! > 127)
    .map(character => `${character} (U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")})`);
}

function apiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (Array.isArray(error.detail)) return error.detail.map(item => {
      const issue = item as { loc?: unknown[]; msg?: string };
      return `${String(issue.loc?.at(-1) ?? "Input")}: ${issue.msg ?? "is invalid"}`;
    }).join(" · ");
    if (typeof error.detail === "string") return error.detail;
  }
  return error instanceof Error ? error.message : "The name check could not be completed.";
}

export default function CheckName() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [candidate, setCandidate] = useState("");
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [recent, setRecent] = useState<RecentCheck[]>([]);
  const [selected, setSelected] = useState<{ result: NameAnalysis; label: string; expected?: boolean } | null>(null);
  const [selectedPresetKeys, setSelectedPresetKeys] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const brand = brands.find(item => item.id === brandId);
  const presets = useMemo(() => brand ? presetsForBrand(brand.name) : { shouldFlag: [], shouldNotFlag: [] }, [brand?.name]);
  const allPresets = useMemo(() => [...presets.shouldFlag, ...presets.shouldNotFlag], [presets]);
  const presetKey = (preset: CheckPreset) => `${preset.expected ? "flag" : "clear"}:${preset.candidate}`;
  const selectedPresets = allPresets.filter(preset => selectedPresetKeys.has(presetKey(preset)));
  const passedCount = batchResults.filter(row => row.result !== null && row.result.detected === row.preset.expected).length;
  const failedRequests = batchResults.filter(row => !row.result).length;

  useEffect(() => {
    setSelectedPresetKeys(new Set(allPresets.map(presetKey)));
  }, [brand?.name]);

  useEffect(() => {
    api.brands().then(items => {
      setBrands(items);
      const initial = items.find(item => item.name.toLowerCase() === "nike") ?? items[0];
      if (initial) setBrandId(initial.id);
    }).catch(error => setError(apiError(error))).finally(() => setBrandsLoading(false));
  }, []);

  const remember = (result: NameAnalysis, label: string) => {
    setRecent(current => [
      { key: crypto.randomUUID(), brandName: result.official_name, label, result },
      ...current,
    ].slice(0, 10));
    setSelected({ result, label });
  };

  const runSingle = async (value = candidate, label = value.trim()) => {
    if (!brand || !value.trim()) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.analyzeName(brand.name, value.trim());
      remember(result, label);
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setBusy(false);
    }
  };

  const runAll = async () => {
    if (!brand || selectedPresets.length === 0) return;
    setBusy(true);
    setError("");
    setBatchResults([]);
    setSelected(null);
    const presetsToRun = selectedPresets;
    const results = new Array<BatchResult>(presetsToRun.length);
    let nextIndex = 0;
    const worker = async () => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= presetsToRun.length) return;
        const preset = presetsToRun[index];
        try {
          const result = await api.analyzeName(brand.name, preset.candidate);
          results[index] = { key: `${index}-${preset.candidate}`, preset, result };
        } catch (requestError) {
          results[index] = { key: `${index}-${preset.candidate}`, preset, result: null, error: apiError(requestError) };
        }
      }
    };
    try {
      await Promise.all(Array.from({ length: Math.min(4, presetsToRun.length) }, () => worker()));
      setBatchResults(results);
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setBusy(false);
    }
  };

  const chooseBrand = (id: string) => {
    setBrandId(id);
    setBatchResults([]);
    setSelected(null);
    setError("");
  };

  const togglePreset = (preset: CheckPreset) => {
    const key = presetKey(preset);
    setSelectedPresetKeys(current => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setCandidate(preset.candidate);
  };

  const setPresetSelection = (enabled: boolean) => {
    setSelectedPresetKeys(enabled ? new Set(allPresets.map(presetKey)) : new Set());
  };

  if (brandsLoading) return <div className="loader">Loading protected brands...</div>;
  if (!brands.length) return <div className="loader">{error || "No protected brands are available."}</div>;

  return <div className="check-page">
    <header><div><p className="eyebrow">07 · CHECK ANY NAME</p><h1>Check any name</h1>
      <p>Compare names with the selected brand without creating a candidate or database record.</p></div></header>

    <section className="check-panel">
      <div className="check-fields">
        <label>Protected brand<select value={brandId} disabled={busy} onChange={event => chooseBrand(event.target.value)}>
          {brands.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label>Candidate name<input value={candidate} placeholder="Enter a name to check" onChange={event => setCandidate(event.target.value)}
          onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void runSingle(); } }}/></label>
        <button type="button" className="primary" disabled={busy || !candidate.trim() || !brandId} onClick={() => void runSingle()}>
          {busy ? "Checking..." : "Check name"}
        </button>
        <button type="button" disabled={busy || selectedPresets.length === 0} onClick={() => void runAll()}>
          {busy ? "Running examples..." : `Run selected ${selectedPresets.length} examples`}
        </button>
      </div>
      {error && <div className="form-message error" role="alert">{error}</div>}
      <p className="notice">Similarity alone is not proof of maliciousness. The engine's actual verdict is shown for every example.</p>
    </section>

    <section className="preset-grid">
      <article><h2>Should flag</h2><div>{presets.shouldFlag.map(item => {
        const active = selectedPresetKeys.has(presetKey(item));
        return <button type="button" key={`${item.candidate}-${item.label ?? ""}`} disabled={busy}
          className={`preset-toggle ${active ? "selected" : "unselected"}`} aria-pressed={active}
          onClick={() => togglePreset(item)}>
          <span className="preset-state" aria-hidden="true">{active ? "✓" : "+"}</span>{item.label ?? item.candidate}
        </button>;
      })}</div></article>
      <article><h2>Should NOT flag</h2><div>{presets.shouldNotFlag.map(item => {
        const active = selectedPresetKeys.has(presetKey(item));
        return <button type="button" key={item.candidate} disabled={busy}
          className={`preset-toggle ${active ? "selected" : "unselected"}`} aria-pressed={active}
          onClick={() => togglePreset(item)}>
          <span className="preset-state" aria-hidden="true">{active ? "✓" : "+"}</span>{item.candidate}
        </button>;
      })}</div></article>
    </section>
    <div className="preset-selection-tools">
      <span>{selectedPresets.length} of {allPresets.length} examples selected for batch check</span>
      <button type="button" disabled={busy || selectedPresets.length === allPresets.length} onClick={() => setPresetSelection(true)}>Select all</button>
      <button type="button" disabled={busy || selectedPresets.length === 0} onClick={() => setPresetSelection(false)}>Clear selection</button>
    </div>

    {batchResults.length > 0 && <section className="check-batch">
      <h2>{brand?.name} example results</h2>
      <p className={passedCount === batchResults.length && failedRequests === 0 ? "batch-summary pass" : "batch-summary fail"}>
        {passedCount}/{batchResults.length} behave as expected{failedRequests ? ` · ${failedRequests} request${failedRequests === 1 ? "" : "s"} failed` : ""}
      </p>
      <div className="tablecard batch-table-wrap"><table><thead><tr>
        <th>Candidate</th><th>Expected</th><th>Actual verdict</th><th>Similarity</th><th>Transformation</th><th>Result</th>
      </tr></thead><tbody>{batchResults.map(row => {
        const passed = row.result !== null && row.result.detected === row.preset.expected;
        return <tr key={row.key} className="batch-row" onClick={() => row.result && setSelected({
          result: row.result, label: row.preset.label ?? row.preset.candidate, expected: row.preset.expected,
        })}>
          <td>{row.preset.label ?? row.preset.candidate}</td>
          <td>{row.preset.expected ? "Flag" : "Not flag"}</td>
          <td>{row.result ? row.result.detected ? "Flagged" : "Not flagged" : "Request failed"}</td>
          <td>{row.result ? `${row.result.similarity.toFixed(2)}%` : "—"}</td>
          <td title={row.result ? describeTransformations(row.result) : row.error}>{row.result ? describeTransformations(row.result) : row.error}</td>
          <td>{row.result ? passed ? <span className="check-pass"><Check size={16}/>Pass</span> : <span className="check-fail"><X size={16}/>Fail</span> : <span className="check-fail"><CircleAlert size={16}/>Error</span>}</td>
        </tr>;
      })}</tbody></table></div>
    </section>}

    {selected && <section className="check-result">
      <div className={`verdict ${selected.result.detected ? "detected" : "clear"}`}>
        {selected.result.detected ? "LOOK-ALIKE DETECTED" : "NOT A LOOK-ALIKE"}
        {selected.expected !== undefined && ` · EXPECTED ${selected.expected ? "FLAG" : "NOT FLAG"}`}
      </div>
      <div className="comparison">
        <article><p>Official</p><strong>{selected.result.official_name}</strong></article>
        <article><p>Candidate</p><strong>{selected.result.candidate_name}</strong></article>
        <article><p>Normalized candidate</p><strong>{selected.result.normalized_candidate}</strong></article>
        <article><p>Similarity</p><strong>{selected.result.similarity.toFixed(2)}%</strong></article>
      </div>
      {nonAsciiPoints(selected.result.candidate_name).length > 0 && <p className="codepoint-note">
        Non-ASCII code point{nonAsciiPoints(selected.result.candidate_name).length > 1 ? "s" : ""}: {nonAsciiPoints(selected.result.candidate_name).join(", ")}
      </p>}
      <article className="transformations"><h2>Transformations</h2>{selected.result.transformations.length
        ? <div>{selected.result.transformations.map((item, index) => <span key={index}>{describeTransformations({ ...selected.result, transformations: [item] })}</span>)}</div>
        : <p className="empty">No look-alike transformation was recorded.</p>}</article>
    </section>}

    <section className="recent-checks">
      <h2>Recent checks</h2>
      {recent.length ? <ul>{recent.map(item => <li key={item.key}>
        <button type="button" onClick={() => setSelected({ result: item.result, label: item.label })}>
          <span><strong>{item.label}</strong><small>{item.brandName} · {item.result.similarity.toFixed(2)}% similarity</small></span>
          <span className={item.result.detected ? "check-fail" : "check-pass"}>{item.result.detected ? "Flagged" : "Not flagged"}</span>
        </button>
      </li>)}</ul> : <p className="empty">Individual checks you run will appear here (up to 10).</p>}
    </section>
  </div>;
}
