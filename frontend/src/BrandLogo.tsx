import React, { useState, useEffect } from "react";
import type { Brand } from "./api";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/** Normalize domain: converts demo domains like "samsung.demo.example" into real domains like "samsung.com" */
export function resolveRealDomain(domain?: string | null, name?: string): string {
  if (!domain && !name) return "";
  let d = (domain || "").trim().toLowerCase();

  // Strip protocols or trailing paths
  d = d.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];

  // Map known demo domains to real canonical domains
  if (d.endsWith(".demo.example")) {
    const brandPrefix = d.replace(".demo.example", "");
    return `${brandPrefix}.com`;
  }

  if (!d && name) {
    const n = name.trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9]/g, "");
    if (n) return `${n}.com`;
  }

  return d;
}

/** Built-in high-quality vector SVGs for top popular brands */
export function getPopularBrandSvg(name?: string, size = 28): React.ReactNode | null {
  if (!name) return null;
  const n = name.trim().toLowerCase().replace(/^@/, "");

  if (n.includes("samsung")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#034EA2" />
        <ellipse cx="20" cy="20" rx="16" ry="11" fill="none" stroke="#FFFFFF" strokeWidth="1.5" transform="rotate(-12 20 20)" />
        <text x="20" y="24" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="7.5" letterSpacing="0.8">
          SAMSUNG
        </text>
      </svg>
    );
  }

  if (n.includes("apple")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#1C1C1E" stroke="#3A3A3C" strokeWidth="1" />
        <path
          d="M26.2 24.3c-.6 1.3-1.4 2.5-2.5 2.5-1.1 0-1.5-.7-2.8-.7-1.3 0-1.8.7-2.8.7-1.1 0-2-1.2-2.7-2.3-1.5-2.2-2.6-6.2-1-8.9.8-1.3 2.1-2.2 3.5-2.2 1.1 0 2.2.8 2.8.8.7 0 2-.9 3.3-.8.6 0 2.2.2 3.2 1.7-.1.1-1.9 1.1-1.9 3.3 0 2.6 2.3 3.5 2.4 3.5-.1.3-.4 1.3-1.5 2.4zm-2.4-11.4c.5-.7.9-1.6.8-2.6-.8 0-1.8.6-2.3 1.2-.5.6-.9 1.5-.8 2.5.9.1 1.8-.4 2.3-1.1z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (n.includes("nike")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#111111" stroke="#333333" strokeWidth="1" />
        <path
          d="M31.2 12.8c-2.4 3.2-6.5 7.8-11.5 11.5-3 2.2-5.9 3.3-7.8 3.3-.5 0-.9-.1-1.1-.3-.4-.2-.6-.6-.6-1.1 0-.8.7-2.1 2.1-3.9 3-3.8 8.2-9 15.4-12.1 1.1-.5 2.1-.7 3.1-.7.3 0 .6 0 .8.1.5.1.7.5.6 1.2z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (n.includes("spotify")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#1DB954" />
        <path
          d="M25.7 16.3c-2.8-1.7-7.4-1.8-10.1-1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.1-.9 8.2-.8 11.4 1.2.4.2.5.7.3 1.1-.2.4-.7.5-1.1.2zm.9 3.2c-.3.4-.8.5-1.2.3-2.3-1.4-5.9-1.9-8.7-1-.5.1-.9-.2-1-.7-.1-.5.2-.9.7-1 3.2-.9 7.2-.4 9.9 1.2.4.2.5.8.3 1.2zm-1 3.4c-.2.3-.6.4-.9.2-2-1.2-4.6-1.5-7.7-.8-.4.1-.7-.2-.8-.5-.1-.4.2-.7.5-.8 3.4-.8 6.3-.4 8.6 1 .3.2.4.6.3.9z"
          fill="#000000"
        />
      </svg>
    );
  }

  if (n.includes("adidas")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#111111" stroke="#333333" strokeWidth="1" />
        <path d="M12 25.5l2.8-4.8 2.5 1.5-2.8 4.8H12z" fill="#FFFFFF" />
        <path d="M17.5 25.5l4.2-7.3 2.5 1.4-4.2 7.4h-2.5z" fill="#FFFFFF" />
        <path d="M24 25.5l5.5-9.6 2.5 1.4-5.5 9.7H24z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (n.includes("zomato")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#E23744" />
        <text x="20" y="25" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui, sans-serif" fontWeight="900" fontStyle="italic" fontSize="11" letterSpacing="-0.5">
          zomato
        </text>
      </svg>
    );
  }

  if (n.includes("google")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
        <path d="M28.8 20.2c0-.7-.1-1.4-.2-2H20v3.8h5c-.2 1.2-.9 2.2-1.9 2.8v2.3h3.1c1.8-1.7 2.8-4.2 2.8-6.9z" fill="#4285F4" />
        <path d="M20 29c2.5 0 4.6-.8 6.1-2.3l-3.1-2.3c-.8.6-1.9.9-3 .9-2.3 0-4.3-1.6-5-3.7H11.8v2.4C13.4 26.9 16.5 29 20 29z" fill="#34A853" />
        <path d="M15 21.6c-.2-.6-.3-1.1-.3-1.6 0-.6.1-1.2.3-1.6v-2.4h-3.2c-.7 1.3-1 2.7-1 4s.4 2.8 1 4l3.2-2.4z" fill="#FBBC05" />
        <path d="M20 14.8c1.4 0 2.6.5 3.5 1.4l2.7-2.7C24.6 12.1 22.5 11.3 20 11.3c-3.5 0-6.6 2.1-8.2 5.1l3.2 2.4c.7-2.1 2.7-3.7 5-3.7z" fill="#EA4335" />
      </svg>
    );
  }

  if (n.includes("microsoft")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#1C1C1E" stroke="#333333" strokeWidth="1" />
        <rect x="12" y="12" width="7" height="7" fill="#F25022" />
        <rect x="21" y="12" width="7" height="7" fill="#7FBA00" />
        <rect x="12" y="21" width="7" height="7" fill="#00A4EF" />
        <rect x="21" y="21" width="7" height="7" fill="#FFB900" />
      </svg>
    );
  }

  if (n.includes("amazon")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#131921" stroke="#232F3E" strokeWidth="1" />
        <text x="20" y="19" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="10" letterSpacing="-0.5">amazon</text>
        <path d="M12 24c4.5 3 11.5 3 16 0" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" fill="none" />
        <polygon points="27,24 29,22.5 28.5,25.5" fill="#FF9900" />
      </svg>
    );
  }

  if (n.includes("netflix")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#141414" stroke="#2A1010" strokeWidth="1" />
        <path d="M14 10h4v20h-4z" fill="#B81D24" />
        <path d="M22 10h4v20h-4z" fill="#B81D24" />
        <path d="M14 10l8 20h4L18 10h-4z" fill="#E50914" />
      </svg>
    );
  }

  if (n.includes("meta")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#080809" stroke="#2A2A32" strokeWidth="1" />
        <path d="M15.5 16.5c-2.3 0-4 1.8-4 4s1.7 4 4 4c2.2 0 3.7-2 4.5-3.3.8 1.3 2.3 3.3 4.5 3.3 2.3 0 4-1.8 4-4s-1.7-4-4-4c-2.2 0-3.7 2-4.5 3.3-.8-1.3-2.3-3.3-4.5-3.3z" stroke="#0081FB" strokeWidth="2.5" fill="none" />
      </svg>
    );
  }

  if (n.includes("facebook")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#1877F2" />
        <path d="M22 21h3l.5-4h-3.5v-2.5c0-1.1.3-1.8 1.9-1.8H26V9.1c-.7-.1-1.8-.1-3.2-.1-3.2 0-5.3 1.9-5.3 5.5V17h-3.5v4H17.5v11h4.5V21z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (n.includes("instagram")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill="url(#ig-grad)" />
        <rect x="12" y="12" width="16" height="16" rx="4.5" fill="none" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="20" cy="20" r="4" fill="none" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="24.5" cy="15.5" r="1" fill="#FFFFFF" />
      </svg>
    );
  }

  if (n === "x" || n.includes("twitter")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#000000" stroke="#333333" strokeWidth="1" />
        <path d="M26.5 12h2.5l-5.5 6.3 6.5 8.7h-5.1l-4-5.2-4.6 5.2h-2.5l5.9-6.7L12.5 12h5.2l3.6 4.8L26.5 12zm-.9 13.5h1.4L16.4 13.4H15l10.6 12.1z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (n.includes("youtube")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#FF0000" />
        <polygon points="16,14 27,20 16,26" fill="#FFFFFF" />
      </svg>
    );
  }

  if (n.includes("paypal")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#003087" />
        <path d="M16 11h7c2.8 0 4.5 1.5 4 4.2-.6 3.2-2.8 4.8-5.5 4.8h-2.5l-1.5 8h-4l3-17z" fill="#0079C1" />
        <path d="M19 14h6.5c2.5 0 4 1.3 3.5 3.7-.5 2.8-2.4 4.3-4.8 4.3h-2.2l-1.4 7H17l2.5-15z" fill="#00457C" opacity="0.6" />
      </svg>
    );
  }

  if (n.includes("whatsapp")) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="#25D366" />
        <path d="M20 11a9 9 0 0 0-7.8 13.5L11 29l4.7-1.2A9 9 0 1 0 20 11zm4.8 12.8c-.2.6-1.2 1.1-1.6 1.1-.4 0-1 .2-3.2-.7-2.7-1.2-4.5-4-4.6-4.2-.1-.2-1.1-1.5-1.1-2.9 0-1.4.7-2.1 1-2.4.3-.3.6-.4.9-.4.2 0 .4 0 .6.1.2 0 .5-.1.7.5.3.6.9 2.2 1 2.4.1.2.1.4 0 .6-.1.2-.2.3-.4.5l-.5.6c-.2.2-.3.4-.1.7.3.5 1.2 2 2.6 3.2 1.8 1.6 3.3 2.1 3.8 2.3.4.2.7.2.9-.1.3-.3 1.2-1.4 1.5-1.9.3-.5.6-.4 1-.3.4.2 2.7 1.3 3.1 1.5.5.3.8.4.9.6.1.3.1 1.6-.1 2.2z" fill="#FFFFFF" />
      </svg>
    );
  }

  return null;
}

interface BrandLogoProps {
  brand?: Brand | { name?: string; logo_url?: string | null; official_domain?: string | null } | null;
  name?: string;
  logoUrl?: string | null;
  domain?: string | null;
  size?: number;
  className?: string;
  fallbackInitial?: string;
  isSuspect?: boolean;
}

/**
 * Universal BrandLogo Component
 * 1. Resolves crisp official vector SVGs for top popular brands
 * 2. Resolves local backend static logo assets (/static/logos/...)
 * 3. Fetches live, high-resolution logos directly from the brand's official website using real domain
 * 4. Gracefully falls back to stylized lettermark on error
 */
export default function BrandLogo({
  brand,
  name,
  logoUrl,
  domain,
  size = 40,
  className = "",
  fallbackInitial,
  isSuspect = false,
}: BrandLogoProps) {
  const brandName = name || brand?.name || "";
  const initial = fallbackInitial || brandName.replace(/^@/, "").charAt(0).toUpperCase() || (isSuspect ? "S" : "B");
  const rawDomain = domain || brand?.official_domain || "";
  const rawLogo = logoUrl || brand?.logo_url || null;

  // Build candidate URL list in priority order
  const resolvedLogoUrl = rawLogo && !rawLogo.includes(".demo.example")
    ? rawLogo.startsWith("/static/")
      ? `${apiBase}${rawLogo}`
      : rawLogo
    : null;

  const realDomain = resolveRealDomain(rawDomain, brandName);
  const siteFaviconUrl = realDomain ? `https://www.google.com/s2/favicons?domain=${realDomain}&sz=128` : null;

  // Sources to attempt in order
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [failedAll, setFailedAll] = useState(false);

  // Build source candidates
  const sources: string[] = [];
  if (resolvedLogoUrl) sources.push(resolvedLogoUrl);
  if (siteFaviconUrl) sources.push(siteFaviconUrl);
  if (realDomain) {
    sources.push(`https://icons.duckduckgo.com/ip3/${realDomain}.ico`);
    sources.push(`https://unavatar.io/${realDomain}?fallback=false`);
  }

  const currentSrc = sources[attemptIndex] ?? null;

  useEffect(() => {
    setAttemptIndex(0);
    setFailedAll(false);
  }, [resolvedLogoUrl, siteFaviconUrl]);

  const handleImgError = () => {
    if (attemptIndex + 1 < sources.length) {
      setAttemptIndex(attemptIndex + 1);
    } else {
      setFailedAll(true);
    }
  };

  // If not suspect and it's a popular brand, we have an instant, authentic SVG available
  const popularSvg = !isSuspect ? getPopularBrandSvg(brandName, size) : null;

  // If popular SVG is available, prefer it for guaranteed zero-latency pixel-perfect rendering
  if (popularSvg) {
    return (
      <span
        className={`brand-logo-container popular ${className}`}
        style={{ width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        title={brandName}
      >
        {popularSvg}
      </span>
    );
  }

  // Otherwise, attempt image sources (custom logo or site-fetched icon)
  if (currentSrc && !failedAll) {
    return (
      <span
        className={`brand-logo-container img-mode ${isSuspect ? "suspect" : "official"} ${className}`}
        style={{
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          background: isSuspect ? "rgba(228, 87, 74, 0.12)" : "rgba(255, 255, 255, 0.06)",
        }}
        title={brandName}
      >
        <img
          src={currentSrc}
          alt={brandName}
          onError={handleImgError}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
        />
      </span>
    );
  }

  // Fallback initial
  return (
    <span
      className={`brand-logo-container initial-fallback ${isSuspect ? "suspect" : "official"} ${className}`}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        flexShrink: 0,
        background: isSuspect ? "rgba(228, 87, 74, 0.15)" : "rgba(134, 184, 164, 0.15)",
        color: isSuspect ? "#e4574a" : "#86b8a4",
        border: `1px solid ${isSuspect ? "rgba(228, 87, 74, 0.5)" : "rgba(134, 184, 164, 0.5)"}`,
      }}
      title={brandName}
    >
      {initial}
    </span>
  );
}

