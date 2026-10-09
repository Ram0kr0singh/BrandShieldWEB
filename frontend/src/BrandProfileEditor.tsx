import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { ApiError, api, type AppInput, type AssetInput, type Brand, type BrandAsset, type BrandInput, type OfficialApp, type OfficialSocial, type SocialInput } from "./api";
import BrandLogo from "./BrandLogo";

type BrandForm = Omit<BrandInput, "slug">;
type Pending<T> = { key: string; value: T };
type SocialForm = { platform: string; handle: string; profile_url: string; display_name: string };
type AppForm = { platform: string; app_name: string; package_identifier: string; store_url: string; developer_name: string };
type AssetForm = { asset_type: string; value: string; label: string };
type Errors = Record<string, string>;

const emptyBrand: BrandForm = { name: "", description: "", official_domain: "", logo_url: "" };
const emptySocial: SocialForm = { platform: "INSTAGRAM", handle: "", profile_url: "", display_name: "" };
const emptyApp: AppForm = { platform: "GOOGLE_PLAY", app_name: "", package_identifier: "", store_url: "", developer_name: "" };
const emptyAsset: AssetForm = { asset_type: "OTHER", value: "", label: "" };
const socialPlatforms = ["INSTAGRAM", "FACEBOOK", "X", "LINKEDIN", "YOUTUBE", "TIKTOK", "OTHER"];
const appPlatforms = ["GOOGLE_PLAY", "APPLE_APP_STORE", "OTHER"];
const assetTypes = ["LOGO", "DOMAIN", "SOCIAL_ACCOUNT", "MOBILE_APP", "OTHER"];

function validDomain(value: string): boolean {
  if (!value || value.length > 253) return false;
  const labels = value.toLowerCase().replace(/\.$/, "").split(".");
  return labels.length >= 2 && labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
}

function validUrl(value: string): boolean {
  if (value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:")
      && !!parsed.hostname
      && !parsed.username
      && !parsed.password
      && !/\s/.test(value);
  } catch {
    return false;
  }
}

function validLogoReference(value: string): boolean {
  return value.startsWith("/static/logos/") || validUrl(value);
}

function validHandle(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/.test(value.trim().replace(/^@/, ""));
}

function validPackage(value: string, platform: string): boolean {
  const id = value.trim();
  return (platform === "APPLE_APP_STORE" && /^\d+$/.test(id))
    || /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(id);
}

function slugFor(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "The request could not be completed. Check your connection and try again.";
  if (error.status === 409) return typeof error.detail === "string"
    ? `${error.detail} Choose a different value or remove the existing record.`
    : "A matching official identity already exists. Choose a different value or remove the duplicate.";
  if (error.status === 422 && Array.isArray(error.detail)) {
    return error.detail.map(item => {
      const issue = item as { loc?: unknown[]; msg?: string };
      const field = issue.loc?.at(-1);
      const message = issue.msg?.replace(/^Value error,\s*/, "") ?? "is invalid";
      return `${String(field ?? "Input")}: ${message}`;
    }).join(" · ");
  }
  if (typeof error.detail === "string") return error.detail;
  return `The server could not save this profile (HTTP ${error.status}).`;
}

function Field({ label, value, onChange, error, placeholder, multiline = false, type = "text" }: {
  label: string; value: string; onChange: (value: string) => void; error?: string; placeholder?: string; multiline?: boolean; type?: string;
}) {
  const control = multiline
    ? <textarea value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-label={label} />
    : <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-label={label} />;
  return <label className="profile-field">{label}{control}{error && <span className="field-error">{error}</span>}</label>;
}

export default function BrandProfileEditor() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [profile, setProfile] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandForm>(emptyBrand);
  const [social, setSocial] = useState<OfficialSocial[]>([]);
  const [apps, setApps] = useState<OfficialApp[]>([]);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [newSocial, setNewSocial] = useState<SocialForm>(emptySocial);
  const [newApp, setNewApp] = useState<AppForm>(emptyApp);
  const [newAsset, setNewAsset] = useState<AssetForm>(emptyAsset);
  const [pendingSocial, setPendingSocial] = useState<Pending<SocialInput>[]>([]);
  const [pendingApps, setPendingApps] = useState<Pending<AppInput>[]>([]);
  const [pendingAssets, setPendingAssets] = useState<Pending<AssetInput>[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [scanFailed, setScanFailed] = useState(false);

  const load = useCallback(async (id: string, useProfile: boolean) => {
    setLoading(true);
    setErrors({});
    setMessage("");
    setProfile(null);
    try {
      const [brand, accounts, officialApps, officialAssets] = await Promise.all([
        api.brand(id), api.brandSocial(id), api.brandApps(id), api.brandAssets(id),
      ]);
      setProfile(brand);
      setSocial(accounts);
      setApps(officialApps);
      setAssets(officialAssets);
      if (useProfile) {
        setForm({
          name: brand.name,
          description: brand.description ?? "",
          official_domain: brand.official_domain ?? "",
          logo_url: brand.logo_url ?? "",
        });
      }
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.brands().then(items => {
      setBrands(items);
      const first = items.find(item => item.name.toLowerCase() === "nike") ?? items[0];
      if (first) {
        setBrandId(first.id);
        void load(first.id, true);
      } else {
        setCreating(true);
        setLoading(false);
      }
    }).catch(error => {
      setMessage(errorMessage(error));
      setLoading(false);
    });
  }, [load]);

  const resetPending = () => {
    setPendingSocial([]);
    setPendingApps([]);
    setPendingAssets([]);
    setNewSocial(emptySocial);
    setNewApp(emptyApp);
    setNewAsset(emptyAsset);
  };

  const hasUnsavedChanges = creating || !profile
    || form.name !== profile.name
    || (form.description ?? "") !== (profile.description ?? "")
    || (form.official_domain ?? "") !== (profile.official_domain ?? "")
    || (form.logo_url ?? "") !== (profile.logo_url ?? "")
    || pendingSocial.length > 0
    || pendingApps.length > 0
    || pendingAssets.length > 0
    || JSON.stringify(newSocial) !== JSON.stringify(emptySocial)
    || JSON.stringify(newApp) !== JSON.stringify(emptyApp)
    || JSON.stringify(newAsset) !== JSON.stringify(emptyAsset);

  const startNewBrand = () => {
    setCreating(true);
    setBrandId("");
    setProfile(null);
    setForm(emptyBrand);
    setErrors({});
    setMessage("");
    setScanMessage("");
    resetPending();
  };

  const updateForm = (field: keyof BrandForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: "" }));
  };

  const addSocial = () => {
    const handle = newSocial.handle.trim().replace(/^@/, "");
    const nextErrors: Errors = {};
    if (!validHandle(handle)) nextErrors.social_handle = "Use letters, numbers, dots, underscores, or hyphens.";
    if (!validUrl(newSocial.profile_url.trim())) nextErrors.social_url = "Enter a complete http:// or https:// URL.";
    if (handle.length > 255) nextErrors.social_handle = "Handle must be 255 characters or fewer.";
    if (social.some(item => item.platform === newSocial.platform && item.handle.toLowerCase() === handle.toLowerCase())
      || pendingSocial.some(item => item.value.platform === newSocial.platform && item.value.handle.toLowerCase() === handle.toLowerCase())) {
      nextErrors.social_handle = "This platform and handle are already listed.";
    }
    setErrors(current => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length) return;
    setErrors(current => ({ ...current, social_handle: "", social_url: "" }));
    setPendingSocial(current => [...current, { key: crypto.randomUUID(), value: {
      platform: newSocial.platform,
      handle,
      profile_url: newSocial.profile_url.trim(),
      display_name: newSocial.display_name.trim() || null,
    } }]);
    setNewSocial(emptySocial);
  };

  const addApp = () => {
    const packageId = newApp.package_identifier.trim();
    const nextErrors: Errors = {};
    if (!newApp.app_name.trim()) nextErrors.app_name = "Enter the official app name.";
    else if (newApp.app_name.trim().length > 255) nextErrors.app_name = "App name must be 255 characters or fewer.";
    if (!validPackage(packageId, newApp.platform)) nextErrors.package_identifier = "Use a reverse-domain ID (for example com.example.app) or a numeric Apple App Store ID.";
    if (packageId.length > 255) nextErrors.package_identifier = "Package ID must be 255 characters or fewer.";
    if (!validUrl(newApp.store_url.trim())) nextErrors.store_url = "Enter a complete http:// or https:// URL.";
    if (!newApp.developer_name.trim()) nextErrors.developer_name = "Enter the official publisher name.";
    else if (newApp.developer_name.trim().length > 255) nextErrors.developer_name = "Publisher name must be 255 characters or fewer.";
    if (apps.some(item => item.platform === newApp.platform && item.package_identifier.toLowerCase() === packageId.toLowerCase())
      || pendingApps.some(item => item.value.platform === newApp.platform && item.value.package_identifier.toLowerCase() === packageId.toLowerCase())) {
      nextErrors.package_identifier = "This platform and package ID are already listed.";
    }
    setErrors(current => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length) return;
    setErrors(current => ({ ...current, app_name: "", package_identifier: "", store_url: "", developer_name: "" }));
    setPendingApps(current => [...current, { key: crypto.randomUUID(), value: {
      platform: newApp.platform,
      app_name: newApp.app_name.trim(),
      package_identifier: packageId,
      store_url: newApp.store_url.trim(),
      developer_name: newApp.developer_name.trim(),
    } }]);
    setNewApp(emptyApp);
  };

  const addAsset = () => {
    const value = newAsset.value.trim();
    const nextErrors: Errors = {};
    if (!value) nextErrors.asset_value = "Enter the official asset value.";
    else if (value.length > 2048) nextErrors.asset_value = "Asset value must be 2,048 characters or fewer.";
    else if (newAsset.asset_type === "DOMAIN" && !validDomain(value)) nextErrors.asset_value = "Enter a hostname only, such as example.com.";
    else if (["LOGO", "SOCIAL_ACCOUNT", "MOBILE_APP"].includes(newAsset.asset_type) && !validUrl(value)) {
      nextErrors.asset_value = "Enter a complete http:// or https:// URL for this asset type.";
    }
    if (assets.some(item => item.asset_type === newAsset.asset_type && item.value.toLowerCase() === value.toLowerCase())
      || pendingAssets.some(item => item.value.asset_type === newAsset.asset_type && item.value.value.toLowerCase() === value.toLowerCase())) {
      nextErrors.asset_value = "This asset type and value are already listed.";
    }
    if (newAsset.label.trim().length > 255) nextErrors.asset_label = "Asset label must be 255 characters or fewer.";
    setErrors(current => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length) return;
    setErrors(current => ({ ...current, asset_value: "", asset_label: "" }));
    setPendingAssets(current => [...current, { key: crypto.randomUUID(), value: {
      asset_type: newAsset.asset_type,
      value,
      label: newAsset.label.trim() || null,
    } }]);
    setNewAsset(emptyAsset);
  };

  const validateBrand = (): Errors => {
    const nextErrors: Errors = {};
    if (!form.name.trim()) nextErrors.name = "Enter the brand or organization name.";
    else if (form.name.trim().length > 160) nextErrors.name = "Name must be 160 characters or fewer.";
    const domain = (form.official_domain ?? "").trim();
    if (domain && !validDomain(domain)) nextErrors.official_domain = "Enter a hostname only, such as example.com—no scheme or path.";
    if (domain && brands.some(item => item.id !== brandId
      && item.official_domain?.toLowerCase().replace(/\.$/, "") === domain.toLowerCase().replace(/\.$/, ""))) {
      nextErrors.official_domain = "This official domain is already registered.";
    }
    const logo = (form.logo_url ?? "").trim();
    if (logo && !validLogoReference(logo)) nextErrors.logo_url = "Upload a PNG/JPEG or enter a complete http:// or https:// URL.";
    if (creating && !slugFor(form.name)) nextErrors.name = "Use a name containing at least one letter or number.";
    if (creating && slugFor(form.name).length > 160) nextErrors.name = "The generated brand ID must be 160 characters or fewer.";
    if (creating && brands.some(item => item.slug === slugFor(form.name))) nextErrors.name = "This generated brand ID is already in use.";
    return nextErrors;
  };

  const save = async () => {
    if (!creating && (!profile || loading)) {
      setMessage("Wait for the selected brand profile to finish loading before saving.");
      return;
    }
    const fieldErrors = validateBrand();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;
    setBusy(true);
    setMessage("");
    try {
      const payload = {
        name: form.name.trim(),
        description: (form.description ?? "").trim() || null,
        official_domain: (form.official_domain ?? "").trim().toLowerCase() || null,
        logo_url: (form.logo_url ?? "").trim() || null,
      };
      let savedBrand: Brand;
      if (creating) {
        savedBrand = await api.createBrand({ ...payload, slug: slugFor(form.name) });
        setCreating(false);
        setBrandId(savedBrand.id);
        setBrands(current => [...current, savedBrand].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        if (!brandId) throw new Error("Select or create a brand before saving.");
        savedBrand = await api.updateBrand(brandId, payload);
        setBrands(current => current.map(item => item.id === savedBrand.id ? savedBrand : item));
      }
      setProfile(savedBrand);
      const tasks: { kind: "social" | "app" | "asset"; key: string; promise: Promise<unknown> }[] = [
        ...pendingSocial.map(item => ({ kind: "social" as const, key: item.key, promise: api.createSocial(savedBrand.id, item.value) })),
        ...pendingApps.map(item => ({ kind: "app" as const, key: item.key, promise: api.createApp(savedBrand.id, item.value) })),
        ...pendingAssets.map(item => ({ kind: "asset" as const, key: item.key, promise: api.createAsset(savedBrand.id, item.value) })),
      ];
      const results = await Promise.allSettled(tasks.map(task => task.promise));
      const failed: string[] = [];
      const succeeded: Record<string, string[]> = { social: [], app: [], asset: [] };
      results.forEach((result, index) => {
        const task = tasks[index];
        if (result.status === "fulfilled") succeeded[task.kind].push(task.key);
        else failed.push(`${task.kind}: ${errorMessage(result.reason)}`);
      });
      setPendingSocial(current => current.filter(item => !succeeded.social.includes(item.key)));
      setPendingApps(current => current.filter(item => !succeeded.app.includes(item.key)));
      setPendingAssets(current => current.filter(item => !succeeded.asset.includes(item.key)));
      await load(savedBrand.id, false);
      if (failed.length) setMessage(`Brand details saved. Some official records still need attention: ${failed.join(" · ")}`);
      else setMessage("Brand profile saved.");
      setScanMessage("");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    if (creating || !brandId) {
      setMessage("Create the brand before uploading its local logo.");
      return;
    }
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setErrors(current => ({ ...current, logo_url: "Choose a PNG or JPEG image no larger than 2 MB." }));
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const saved = await api.uploadLogo(brandId, file);
      setProfile(saved);
      setForm(current => ({ ...current, logo_url: saved.logo_url ?? "" }));
      setBrands(current => current.map(item => item.id === saved.id ? saved : item));
      setErrors(current => ({ ...current, logo_url: "" }));
      setMessage("Local logo uploaded. Future scans compare only local /static/logos files.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (kind: "social" | "app" | "asset", recordId: string) => {
    if (!brandId) return;
    setMessage("");
    try {
      if (kind === "social") await api.deleteSocial(brandId, recordId);
      else if (kind === "app") await api.deleteApp(brandId, recordId);
      else await api.deleteAsset(brandId, recordId);
      await load(brandId, false);
      setMessage("Official record removed.");
    } catch (error) {
      setMessage(errorMessage(error));
    }
  };

  const scan = async () => {
    if (!brandId || creating) return;
    if (hasUnsavedChanges) {
      setScanMessage("Save brand details and pending records before scanning.");
      setScanFailed(true);
      return;
    }
    setScanning(true);
    setScanMessage("");
    setScanFailed(false);
    try {
      const result = await api.scan(brandId);
      setScanMessage(`First scan completed: ${result.candidate_count} candidates analyzed.`);
    } catch (error) {
      setScanMessage(errorMessage(error));
      setScanFailed(true);
    } finally {
      setScanning(false);
    }
  };

  if (loading && !profile && !creating) return <div className="loader">Loading protected identity...</div>;
  return <div className="brand-profile-page">
    <header>
      <div><p className="eyebrow">02 · PROTECTED BRANDS</p><h1>Identity Registry</h1>
        <p>The verified identities against which all threat comparisons are made.</p></div>
      <div className="profile-actions">
        {brands.length > 0 && <label>Protected brand<select value={creating ? "" : brandId} onChange={event => {
          const selected = event.target.value;
          if (!selected) return;
          setCreating(false);
          setBrandId(selected);
          resetPending();
          setScanMessage("");
          void load(selected, true);
        }}>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>}
        {!creating && brandId && (() => { const cb = brands.find(b => b.id === brandId); return cb ? <BrandLogo brand={cb} name={cb.name} domain={cb.official_domain} logoUrl={cb.logo_url} size={32} /> : null; })()}
        <button type="button" onClick={startNewBrand}><Plus size={16}/>New brand</button>
      </div>
    </header>
    <div className="profile-intro"><ShieldCheck size={20}/><div><strong>Official identity baseline</strong>
      <p>Records saved here are compared with candidate observations. Similarity alone is not a threat verdict.</p></div></div>

    <section className="setup-panel">
      <div className="setup-heading"><div><h2>{creating ? "Set up brand" : "Edit brand details"}</h2><p>Domain must be a hostname only. URLs must begin with http:// or https://.</p></div>
        <button className="primary" type="button" onClick={save} disabled={busy || (loading && !creating)}><ShieldCheck size={16}/>{busy ? "Saving..." : creating ? "Create brand and save records" : "Save profile"}</button></div>
      <div className="setup-fields">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <BrandLogo brand={form} name={form.name} domain={form.official_domain} logoUrl={form.logo_url} size={46} />
          <div style={{ flex: 1 }}>
            <Field label="Brand / organization name" value={form.name} onChange={value => updateForm("name", value)} error={errors.name} placeholder="Example Organization"/>
          </div>
        </div>
        <Field label="Official domain" value={form.official_domain ?? ""} onChange={value => updateForm("official_domain", value)} error={errors.official_domain} placeholder="example.com"/>
        <div className="profile-field"><Field label="Logo URL" value={form.logo_url ?? ""} onChange={value => updateForm("logo_url", value)} error={errors.logo_url} placeholder="/static/logos/brand-logo.png"/>
          {!creating && <label className="logo-upload">Upload local PNG/JPEG<input type="file" accept="image/png,image/jpeg" onChange={event => { void uploadLogo(event.target.files?.[0]); event.currentTarget.value = ""; }} disabled={busy}/></label>}</div>
        <Field label="Description" value={form.description ?? ""} onChange={value => updateForm("description", value)} multiline placeholder="Describe the legitimate organization and its public presence"/>
      </div>

      <div className="setup-section">
        <h3>Official social accounts</h3>
        <div className="entry-grid">
          <label className="profile-field">Platform<select value={newSocial.platform} onChange={event => setNewSocial({ ...newSocial, platform: event.target.value })}>{socialPlatforms.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
          <Field label="Handle" value={newSocial.handle} onChange={value => setNewSocial({ ...newSocial, handle: value })} error={errors.social_handle} placeholder="@official_handle"/>
          <Field label="Profile URL" value={newSocial.profile_url} onChange={value => setNewSocial({ ...newSocial, profile_url: value })} error={errors.social_url} placeholder="https://social.example/official"/>
          <Field label="Display name (optional)" value={newSocial.display_name} onChange={value => setNewSocial({ ...newSocial, display_name: value })} placeholder="Official profile name"/>
          <button type="button" onClick={addSocial}><Plus size={15}/>Add account</button>
        </div>
        <RecordList>
          {social.map(item => <Record key={item.id} title={`${item.platform.replaceAll("_", " ")} · @${item.handle}`} detail={item.profile_url} onRemove={() => void remove("social", item.id)}/>)}
          {pendingSocial.map(item => <Record key={item.key} title={`${item.value.platform.replaceAll("_", " ")} · @${item.value.handle}`} detail={item.value.profile_url} pending onRemove={() => setPendingSocial(current => current.filter(value => value.key !== item.key))}/>)}
        </RecordList>
      </div>

      <div className="setup-section">
        <h3>Official apps</h3>
        <div className="entry-grid">
          <label className="profile-field">Platform<select value={newApp.platform} onChange={event => setNewApp({ ...newApp, platform: event.target.value })}>{appPlatforms.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
          <Field label="App name" value={newApp.app_name} onChange={value => setNewApp({ ...newApp, app_name: value })} error={errors.app_name} placeholder="Official app"/>
          <Field label="Package / App Store ID" value={newApp.package_identifier} onChange={value => setNewApp({ ...newApp, package_identifier: value })} error={errors.package_identifier} placeholder="com.example.app"/>
          <Field label="Store URL" value={newApp.store_url} onChange={value => setNewApp({ ...newApp, store_url: value })} error={errors.store_url} placeholder="https://store.example/app"/>
          <Field label="Publisher" value={newApp.developer_name} onChange={value => setNewApp({ ...newApp, developer_name: value })} error={errors.developer_name} placeholder="Official publisher"/>
          <button type="button" onClick={addApp}><Plus size={15}/>Add app</button>
        </div>
        <RecordList>
          {apps.map(item => <Record key={item.id} title={`${item.app_name} · ${item.platform.replaceAll("_", " ")}`} detail={`${item.package_identifier} · ${item.developer_name}`} onRemove={() => void remove("app", item.id)}/>)}
          {pendingApps.map(item => <Record key={item.key} title={`${item.value.app_name} · ${item.value.platform.replaceAll("_", " ")}`} detail={`${item.value.package_identifier} · ${item.value.developer_name}`} pending onRemove={() => setPendingApps(current => current.filter(value => value.key !== item.key))}/>)}
        </RecordList>
      </div>

      <div className="setup-section">
        <h3>Additional official assets</h3>
        <div className="entry-grid">
          <label className="profile-field">Asset type<select value={newAsset.asset_type} onChange={event => setNewAsset({ ...newAsset, asset_type: event.target.value })}>{assetTypes.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
          <Field label="Asset value" value={newAsset.value} onChange={value => setNewAsset({ ...newAsset, value })} error={errors.asset_value} placeholder="Official URL, identifier, or registered mark"/>
          <Field label="Label (optional)" value={newAsset.label} onChange={value => setNewAsset({ ...newAsset, label: value })} error={errors.asset_label} placeholder="What this asset identifies"/>
          <button type="button" onClick={addAsset}><Plus size={15}/>Add asset</button>
        </div>
        <RecordList>
          {assets.map(item => <Record key={item.id} title={item.asset_type.replaceAll("_", " ")} detail={item.label ? `${item.label} · ${item.value}` : item.value} onRemove={() => void remove("asset", item.id)}/>)}
          {pendingAssets.map(item => <Record key={item.key} title={item.value.asset_type.replaceAll("_", " ")} detail={item.value.label ? `${item.value.label} · ${item.value.value}` : item.value.value} pending onRemove={() => setPendingAssets(current => current.filter(value => value.key !== item.key))}/>)}
        </RecordList>
      </div>
      {message && <div className={message === "Brand profile saved." || message === "Official record removed." ? "form-message success" : "form-message error"} role="status">{message}</div>}
      {!creating && profile && <div className="first-scan"><div><strong>Profile saved?</strong><p>Run the existing deterministic monitor against this brand's candidate records.</p></div>
        <button className="primary" type="button" onClick={scan} disabled={scanning || hasUnsavedChanges}><RefreshCw size={16} className={scanning ? "spin" : ""}/>{scanning ? "Scanning..." : hasUnsavedChanges ? "Save changes first" : "Run first scan"}</button>
        {scanMessage && <span className={scanFailed ? "scan-failure" : ""} role="status">{scanMessage}</span>}</div>}
    </section>
  </div>;
}

function RecordList({ children }: { children: React.ReactNode }) {
  return <div className="record-list">{children}</div>;
}

function Record({ title, detail, onRemove, pending = false }: { title: string; detail: string; onRemove: () => void; pending?: boolean }) {
  return <div className="setup-record"><div><strong>{title}</strong><span>{detail}{pending ? " · Not saved yet" : ""}</span></div>
    <button type="button" className="icon-button" aria-label={`Remove ${title}`} onClick={onRemove}><Trash2 size={15}/></button></div>;
}
