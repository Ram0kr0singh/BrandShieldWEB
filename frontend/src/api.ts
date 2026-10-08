const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
export class ApiError extends Error { constructor(public status: number, public detail: unknown) { super(typeof detail === "string" ? detail : `Request failed (${status})`); } }
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${base}/api${path}`, init);
  if (!r.ok) {
    let detail: unknown;
    try { detail = (await r.json()).detail; } catch { detail = undefined; }
    throw new ApiError(r.status, detail);
  }
  if (r.status === 204) return undefined as T;
  return r.json() as Promise<T>;
}
export type Brand = { id: string; name: string; slug?: string; description?: string|null; official_domain?: string|null; logo_url?: string|null; status?: string };
export type OfficialSocial = { id:string; platform:string; handle:string; display_name?:string|null; verified:boolean; profile_url:string };
export type OfficialApp = { id:string; platform:string; app_name:string; developer_name:string; package_identifier:string; store_url:string };
export type BrandAsset = { id:string; asset_type:string; value:string; label?:string|null };
export type BrandInput = { name:string; slug:string; description:string|null; official_domain:string|null; logo_url:string|null };
export type SocialInput = { platform:string; handle:string; profile_url:string; display_name:string|null };
export type AppInput = { platform:string; app_name:string; package_identifier:string; store_url:string; developer_name:string };
export type AssetInput = { asset_type:string; value:string; label:string|null };
export type SourceWarning = { id:string; name:string; status:string; message:string };
export type SourceStatus = SourceWarning & { kind:"SOCIAL"|"APP"|"DEMO"; last_checked_at:string|null; last_success_at:string|null; simulated:boolean };
export type MonitoringRun = { id:string; brand_id:string; status:string; candidate_count:number; social_candidate_count:number; app_candidate_count:number; completed_at:string|null; source_warnings?:SourceWarning[]|null };
export type Threat = { id:string; name:string; source:string; publisher?:string|null; threat_type:string|null; risk_score:number; severity:string; status:string; detected_at:string };
export type Overview = { brand:Brand; summary:Record<string,number>; risk_distribution:{severity:string;count:number}[]; source_distribution:{source:string;count:number}[]; threat_type_distribution:{threat_type:string;count:number}[]; recent_threats:Threat[]; last_scan:{completed_at:string|null;candidate_count:number}|null };
export type Detection = { id:string; brand_id?:string; risk_score:number; severity:string; threat_type:string|null; status:string; confidence?:number; detected_at:string; candidate:{name:string;source:string;publisher?:string|null}; evidence:{signal_type:string;available:boolean;score:number|null;details:Record<string,unknown>}[] };
export type Note={id:string;content:string;actor:string;created_at:string}; export type Activity={id:string;event_type:string;previous_value:string|null;new_value:string|null;details:Record<string,unknown>;actor:string;created_at:string}; export type Draft={id:string;draft_type:string;content:string;evidence_summary:string[];created_at:string}; export type Investigation={detection_id:string;status:string;notes:Note[];activity:Activity[];drafts:Draft[]};
export type AnalystAnalysis={summary:string;risk_rationale:string;key_evidence:{signal_type:string;summary:string;score:number|null;details:Record<string,unknown>}[];uncertainties:string[];recommended_actions:string[];confidence:string;source_facts:{risk_score:number;severity:string;candidate_name:string;[key:string]:unknown};generated_at:string;provider:string};
export type NameAnalysis={official_name:string;candidate_name:string;normalized_official:string;normalized_candidate:string;similarity:number;detected:boolean;transformations:Record<string,unknown>[]};
const post=<T>(path:string,body:unknown)=>request<T>(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
export const api = {
  brands:()=>request<Brand[]>("/brands"),
  brand:(id:string)=>request<Brand>(`/brands/${id}`),
  createBrand:(payload:BrandInput)=>post<Brand>("/brands",payload),
  updateBrand:(id:string,payload:Omit<BrandInput,"slug">)=>request<Brand>(`/brands/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),
  uploadLogo:(id:string,file:File)=>{ const form=new FormData(); form.append("file",file); return request<Brand>(`/brands/${id}/logo`,{method:"POST",body:form}); },
  brandSocial:(id:string)=>request<OfficialSocial[]>(`/brands/${id}/social-accounts`),
  createSocial:(id:string,payload:SocialInput)=>post<OfficialSocial>(`/brands/${id}/social-accounts`,payload),
  deleteSocial:(id:string,accountId:string)=>request<void>(`/brands/${id}/social-accounts/${accountId}`,{method:"DELETE"}),
  brandApps:(id:string)=>request<OfficialApp[]>(`/brands/${id}/apps`),
  createApp:(id:string,payload:AppInput)=>post<OfficialApp>(`/brands/${id}/apps`,payload),
  deleteApp:(id:string,appId:string)=>request<void>(`/brands/${id}/apps/${appId}`,{method:"DELETE"}),
  brandAssets:(id:string)=>request<BrandAsset[]>(`/brands/${id}/assets`),
  createAsset:(id:string,payload:AssetInput)=>post<BrandAsset>(`/brands/${id}/assets`,payload),
  deleteAsset:(id:string,assetId:string)=>request<void>(`/brands/${id}/assets/${assetId}`,{method:"DELETE"}),
  overview:(id:string)=>request<Overview>(`/dashboard/overview?brand_id=${id}`),
  scan:(id:string)=>post<MonitoringRun>("/monitoring/scan",{brand_id:id}),
  sourceStatus:()=>request<SourceStatus[]>("/sources/status"),
  simulateSourceOutage:(id:string)=>post<SourceStatus & {simulated:true}>(`/sources/${id}/simulate-outage`,{}),
  restoreSource:(id:string)=>post<SourceStatus & {simulated:true}>(`/sources/${id}/restore`,{}),
  detections:()=>request<Detection[]>("/detections"),
  detection:(id:string)=>request<Detection>(`/detections/${id}`),
  investigation:(id:string)=>request<Investigation>(`/detections/${id}/investigation`),
  status:(id:string,status:string)=>post<Investigation>(`/detections/${id}/status`,{status}),
  note:(id:string,content:string)=>post<Investigation>(`/detections/${id}/notes`,{content}),
  draft:(id:string,draft_type:string)=>post<Draft>(`/detections/${id}/remediation-drafts`,{draft_type}),
  analyzeName:(official_name:string,candidate_name:string)=>post<NameAnalysis>("/analyze/name",{official_name,candidate_name}),
  analyze:(id:string)=>post<AnalystAnalysis>(`/detections/${id}/analyze`,{})
};
