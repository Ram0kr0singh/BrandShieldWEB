// frontend/src/scripts/seed_brands.ts
/**
 * Seed the BrandShield backend with a set of popular brands.
 *
 * This script uses the existing `api` client (frontend/src/api.ts) to create
 * brands that are missing from the database. It is safe to run repeatedly –
 * existing brands are detected by their slug and are skipped.
 *
 * Run with:
 *   npx ts-node ./frontend/src/scripts/seed_brands.ts
 *
 * Make sure the FastAPI backend is running on the configured VITE_API_BASE_URL
 * (default http://localhost:8001) before executing.
 */

import { api } from "../api";

// ---------------------------------------------------------------------------
// 1️⃣ Desired brands – you can extend this list with more entries.
// ---------------------------------------------------------------------------

type BrandInfo = {
  name: string;
  official_domain?: string;
  logo_url?: string;
};

const BRANDS: BrandInfo[] = [
  { name: "Microsoft", official_domain: "microsoft.com" },
  { name: "Amazon", official_domain: "amazon.com" },
  { name: "Netflix", official_domain: "netflix.com" },
  { name: "Meta", official_domain: "meta.com" },
  { name: "Facebook", official_domain: "facebook.com" },
  { name: "Instagram", official_domain: "instagram.com" },
  { name: "X", official_domain: "twitter.com" }, // X / Twitter
  { name: "YouTube", official_domain: "youtube.com" },
  { name: "PayPal", official_domain: "paypal.com" },
  { name: "WhatsApp", official_domain: "whatsapp.com" },
];

// ---------------------------------------------------------------------------
// 2️⃣ Helper – generate the same slug that the UI uses for brand IDs.
// ---------------------------------------------------------------------------
function slugFor(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// 3️⃣ Main – create any missing brands.
// ---------------------------------------------------------------------------
(async () => {
  try {
    // Load existing brands from the backend.
    const existing = await api.brands();
    const existingSlugs = new Set(existing.map((b) => slugFor(b.name)));

    for (const info of BRANDS) {
      const slug = slugFor(info.name);
      if (existingSlugs.has(slug)) {
        console.log(`✅ Brand "${info.name}" already exists – skipping`);
        continue;
      }

      const payload = {
        name: info.name,
        description: null,
        official_domain: info.official_domain ?? null,
        logo_url: info.logo_url ?? null,
        slug,
      } as const;

      console.log(`🚀 Creating brand "${info.name}" (slug=${slug}) …`);
      await api.createBrand(payload);
      console.log("   → created");
    }

    console.log("🎉 Seed complete.");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
})();

