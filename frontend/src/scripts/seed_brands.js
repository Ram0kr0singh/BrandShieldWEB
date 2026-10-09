// seed_brands.js
/**
 * Simple Node script that seeds a set of popular brands into the BrandShield backend.
 * It uses the same REST endpoints that the frontend `api.ts` client uses.
 * Run with: node ./frontend/src/scripts/seed_brands.js
 */

const BASE_URL = process.env.VITE_API_BASE_URL || "http://localhost:8001";

const brands = [
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Facebook", domain: "facebook.com" },
  { name: "Instagram", domain: "instagram.com" },
  { name: "X", domain: "twitter.com" }, // X / Twitter
  { name: "YouTube", domain: "youtube.com" },
  { name: "PayPal", domain: "paypal.com" },
  { name: "WhatsApp", domain: "whatsapp.com" },
];

function slugFor(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchJson(url, options = {}) {
  const resp = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${txt}`);
  }
  return resp.json();
}

(async () => {
  try {
    console.log("Fetching existing brands …");
    const existing = await fetchJson(`${BASE_URL}/api/brands`);
    const existingSlugs = new Set(existing.map((b) => slugFor(b.name)));

    for (const { name, domain } of brands) {
      const slug = slugFor(name);
      if (existingSlugs.has(slug)) {
        console.log(`✅ ${name} already exists – skipping`);
        continue;
      }
      const payload = {
        name,
        description: null,
        official_domain: domain,
        logo_url: null,
        slug,
      };
      console.log(`🚀 Creating ${name} …`);
      await fetchJson(`${BASE_URL}/api/brands`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log(`   → created ${name}`);
    }
    console.log("✅ Seed complete.");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
})();

