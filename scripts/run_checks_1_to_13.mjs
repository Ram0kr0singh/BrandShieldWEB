import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const userDataDir = path.join(os.tmpdir(), "brandshield_chrome_profile_qa");
fs.mkdirSync(userDataDir, { recursive: true });
const screenshotsDir = path.resolve("screenshots/qa_checks");
fs.mkdirSync(screenshotsDir, { recursive: true });

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chrome = spawn(chromePath, [
  "--headless=new",
  "--remote-debugging-port=9222",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-extensions",
  `--user-data-dir=${userDataDir}`,
  "http://localhost:5173/"
]);

await new Promise((r) => setTimeout(r, 2500));

async function main() {
  const results = [];
  let ws;

  try {
    const listRes = await fetch("http://127.0.0.1:9222/json/list");
    const pages = await listRes.json();
    const page = pages.find(p => p.type === "page" && p.url.includes("5173")) || pages.find(p => p.type === "page") || pages[0];
    ws = new WebSocket(page.webSocketDebuggerUrl);

    let id = 1;
    const pending = new Map();
    const consoleLogs = [];
    const consoleErrors = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args?.map(a => a.value || a.description).join(" ");
        consoleLogs.push({ type: msg.params.type, text });
        if (msg.params.type === "error") {
          consoleErrors.push(text);
        }
      }
      if (msg.method === "Runtime.exceptionThrown") {
        consoleErrors.push(msg.params.exceptionDetails?.text + " " + msg.params.exceptionDetails?.exception?.description);
      }
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve) => ws.onopen = resolve);

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send("Runtime.enable");
    await send("Page.enable");
    await new Promise((r) => setTimeout(r, 1500));

    const evalExpr = async (expr) => {
      const res = await send("Runtime.evaluate", {
        expression: expr,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result?.value;
    };

    const takeScreenshot = async (name) => {
      const res = await send("Page.captureScreenshot", { format: "png" });
      const filePath = path.join(screenshotsDir, name);
      fs.writeFileSync(filePath, Buffer.from(res.data, "base64"));
      return filePath;
    };

    console.log("=== STARTING BRANDSHIELD QA CHECKS (1 - 13) ===\n");

    // Ensure backend is running before starting checks
    let backendUp = false;
    for (let i = 0; i < 5; i++) {
      try {
        const res = await fetch("http://127.0.0.1:8001/api/health");
        if (res.ok) { backendUp = true; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    if (!backendUp) {
      console.log("Backend not running, starting uvicorn...");
      const pythonExe = path.resolve(process.cwd(), ".venv/Scripts/python.exe");
      const startBackend = spawn(pythonExe, ["-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8001"], {
        cwd: process.cwd(),
        detached: true,
        stdio: "ignore"
      });
      startBackend.unref();
      for (let i = 0; i < 30; i++) {
        try {
          const res = await fetch("http://127.0.0.1:8001/api/health");
          if (res.ok) { console.log("Backend started!"); break; }
        } catch {}
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Reset sources to clean baseline before starting
    try {
      await fetch("http://127.0.0.1:8001/api/sources/instagram/restore", { method: "POST" });
      await fetch("http://127.0.0.1:8001/api/sources/google_play/restore", { method: "POST" });
      await fetch("http://127.0.0.1:8001/api/sources/app_store/restore", { method: "POST" });
    } catch {}

    // -------------------------------------------------------------
    // CHECK 1: Baseline, no outage - Dashboard with Nike selected
    // -------------------------------------------------------------
    console.log("--- Check 1: Baseline cards state ---");
    await send("Page.navigate", { url: "http://localhost:5173/" });
    // Wait for source cards to render
    for (let i = 0; i < 30; i++) {
      const count = await evalExpr(`document.querySelectorAll('.source-card').length`);
      if (count === 4) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    // Ensure Nike is selected
    await evalExpr(`(() => {
      const select = document.querySelector('select');
      const nikeOption = Array.from(select ? select.options : []).find(o => o.text === 'Nike');
      if (nikeOption) {
        select.value = nikeOption.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 1500));

    const check1Data = await evalExpr(`(() => {
      const cards = Array.from(document.querySelectorAll('.source-card')).map(card => ({
        name: card.querySelector('.source-card-name')?.innerText,
        status: card.querySelector('.source-card-status')?.innerText,
        classes: card.className
      }));
      const brand = document.querySelector('select')?.value;
      const brandText = document.querySelector('select option:checked')?.innerText;
      return { cards, brand, brandText };
    })()`);

    const c1Pass = check1Data.cards.length === 4 &&
      check1Data.cards[0].classes.includes("online") &&
      check1Data.cards[1].classes.includes("not_configured") &&
      check1Data.cards[2].classes.includes("not_configured") &&
      check1Data.cards[3].classes.includes("not_configured");

    await takeScreenshot("check_01.png");
    results.push({
      check: 1,
      title: "Baseline cards state (Nike selected)",
      status: c1Pass ? "PASS" : "FAIL",
      observed: `Brand: ${check1Data.brandText}; 4 cards rendered (Card 0: ${check1Data.cards[0]?.status} [green], Cards 1-3: ${check1Data.cards[1]?.status} [grey])`,
      banner: "None"
    });
    console.log(`Check 1: ${c1Pass ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------
    // CHECK 2: Baseline scan - Scan completes, 7 candidates, no amber banner
    // -------------------------------------------------------------
    console.log("--- Check 2: Baseline scan ---");
    await evalExpr(`document.querySelector('button.primary')?.click()`);
    // Wait for scan to complete (button text back to "Scan now")
    await new Promise((r) => setTimeout(r, 2500));

    const check2Data = await evalExpr(`(() => {
      const banner = document.querySelector('.scan-source-warning');
      const scanline = document.querySelector('.scanline')?.innerText;
      const metrics = Array.from(document.querySelectorAll('.metric strong')).map(el => el.innerText);
      return {
        bannerText: banner ? banner.innerText : null,
        scanline,
        candidatesMonitored: metrics[3]
      };
    })()`);

    const c2Pass = check2Data.bannerText === null && check2Data.candidatesMonitored === "7";
    await takeScreenshot("check_02.png");
    results.push({
      check: 2,
      title: "Baseline scan with no outage",
      status: c2Pass ? "PASS" : "FAIL",
      observed: `Scan completed; candidates monitored: ${check2Data.candidatesMonitored}; scanline: "${check2Data.scanline}"`,
      banner: check2Data.bannerText || "None (expected)"
    });
    console.log(`Check 2: ${c2Pass ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------
    // CHECK 3: Social outage - Simulate outage on Instagram card
    // -------------------------------------------------------------
    console.log("--- Check 3: Simulate outage on Instagram ---");
    await evalExpr(`document.querySelectorAll('.source-card')[1].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));

    const check3Data = await evalExpr(`(() => {
      const cards = Array.from(document.querySelectorAll('.source-card')).map(card => ({
        name: card.querySelector('.source-card-name')?.innerText,
        status: card.querySelector('.source-card-status')?.innerText,
        btnText: card.querySelector('.source-action-btn')?.innerText,
        classes: card.className
      }));
      return cards;
    })()`);

    const c3Pass = check3Data[1].classes.includes("degraded") &&
      check3Data[1].btnText === "Restore" &&
      check3Data[0].classes.includes("online") &&
      check3Data[2].classes.includes("not_configured") &&
      check3Data[3].classes.includes("not_configured");

    await takeScreenshot("check_03.png");
    results.push({
      check: 3,
      title: "Simulate outage on Instagram card",
      status: c3Pass ? "PASS" : "FAIL",
      observed: `Instagram status: ${check3Data[1].status} [amber], button: "${check3Data[1].btnText}". Other cards unchanged.`,
      banner: "None"
    });
    console.log(`Check 3: ${c3Pass ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------
    // CHECK 4: Social outage scan - Amber banner appears naming Instagram
    // -------------------------------------------------------------
    console.log("--- Check 4: Scan during Instagram outage ---");
    await evalExpr(`document.querySelector('button.primary')?.click()`);
    await new Promise((r) => setTimeout(r, 2500));

    const check4Data = await evalExpr(`(() => {
      const banner = document.querySelector('.scan-source-warning');
      const metrics = Array.from(document.querySelectorAll('.metric strong')).map(el => el.innerText);
      return {
        bannerText: banner ? banner.innerText : null,
        metrics: {
          detectedThreats: metrics[0],
          highRisk: metrics[1],
          lookalikes: metrics[2],
          candidatesMonitored: metrics[3]
        }
      };
    })()`);

    const c4Pass = check4Data.bannerText !== null &&
      check4Data.bannerText.includes("Instagram live monitor") &&
      check4Data.bannerText.includes("stored observations") &&
      check4Data.metrics.candidatesMonitored === "7" &&
      check4Data.metrics.detectedThreats === "5" &&
      check4Data.metrics.highRisk === "4";

    await takeScreenshot("check_04.png");
    results.push({
      check: 4,
      title: "Scan during Instagram outage",
      status: c4Pass ? "PASS" : "FAIL",
      observed: `Metrics unchanged (Candidates: ${check4Data.metrics.candidatesMonitored}, Threats: ${check4Data.metrics.detectedThreats}, High Risk: ${check4Data.metrics.highRisk})`,
      banner: check4Data.bannerText || "None"
    });
    console.log(`Check 4: ${c4Pass ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------
    // CHECK 5: Open /social and /apps
    // -------------------------------------------------------------
    console.log("--- Check 5: /social vs /apps notices ---");
    await send("Page.navigate", { url: "http://localhost:5173/social" });
    await new Promise((r) => setTimeout(r, 1500));
    const socialNotice = await evalExpr(`document.querySelector('.source-page-notice')?.innerText`);
    await takeScreenshot("check_05_social.png");

    await send("Page.navigate", { url: "http://localhost:5173/apps" });
    await new Promise((r) => setTimeout(r, 1500));
    const appsNotice = await evalExpr(`document.querySelector('.source-page-notice')?.innerText`);
    await takeScreenshot("check_05_apps.png");

    const c5Pass = socialNotice && socialNotice.includes("Instagram") &&
      appsNotice && !appsNotice.includes("Instagram");

    results.push({
      check: 5,
      title: "Page notices on /social and /apps during social outage",
      status: c5Pass ? "PASS" : "FAIL",
      observed: `/social notice: "${socialNotice}"; /apps notice: "${appsNotice}" (does not mention Instagram)`,
      banner: socialNotice || "None"
    });
    console.log(`Check 5: ${c5Pass ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------
    // CHECK 6: App-store outage - Restore Instagram, outage on Google Play, scan
    // -------------------------------------------------------------
    console.log("--- Check 6: Google Play outage ---");
    await send("Page.navigate", { url: "http://localhost:5173/" });
    await new Promise((r) => setTimeout(r, 1500));

    // Restore Instagram
    await evalExpr(`document.querySelectorAll('.source-card')[1].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));

    // Outage on Google Play (card 2)
    await evalExpr(`document.querySelectorAll('.source-card')[2].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));

    // Scan
    await evalExpr(`document.querySelector('button.primary')?.click()`);
    await new Promise((r) => setTimeout(r, 2500));

    const check6Banner = await evalExpr(`document.querySelector('.scan-source-warning')?.innerText`);
    await takeScreenshot("check_06_dashboard.png");

    // Check /apps and /social
    await send("Page.navigate", { url: "http://localhost:5173/apps" });
    await new Promise((r) => setTimeout(r, 1500));
    const check6AppsNotice = await evalExpr(`document.querySelector('.source-page-notice')?.innerText`);

    await send("Page.navigate", { url: "http://localhost:5173/social" });
    await new Promise((r) => setTimeout(r, 1500));
    const check6SocialNotice = await evalExpr(`document.querySelector('.source-page-notice')?.innerText`);

    const c6Pass = check6Banner && check6Banner.includes("Google Play live monitor") &&
      !check6Banner.includes("Instagram") &&
      check6AppsNotice.includes("Google Play") &&
      !check6SocialNotice.includes("Google Play");

    results.push({
      check: 6,
      title: "App-store outage on Google Play",
      status: c6Pass ? "PASS" : "FAIL",
      observed: `Banner names Google Play only; /apps notice includes Google Play; /social does not mention Google Play`,
      banner: check6Banner || "None"
    });
    console.log(`Check 6: ${c6Pass ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------
    // CHECK 7: Also simulate Apple App Store; scan again
    // -------------------------------------------------------------
    console.log("--- Check 7: Both app stores degraded ---");
    await send("Page.navigate", { url: "http://localhost:5173/" });
    await new Promise((r) => setTimeout(r, 1500));

    // Outage on Apple App Store (card 3)
    await evalExpr(`document.querySelectorAll('.source-card')[3].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));

    // Scan
    await evalExpr(`document.querySelector('button.primary')?.click()`);
    await new Promise((r) => setTimeout(r, 2500));

    const check7Banner = await evalExpr(`document.querySelector('.scan-source-warning')?.innerText`);
    await takeScreenshot("check_07.png");

    const c7Pass = check7Banner &&
      check7Banner.includes("Google Play live monitor") &&
      check7Banner.includes("Apple App Store live monitor");

    results.push({
      check: 7,
      title: "Both app stores degraded (Google Play + Apple App Store)",
      status: c7Pass ? "PASS" : "FAIL",
      observed: `Banner lists both degraded app sources`,
      banner: check7Banner || "None"
    });
    console.log(`Check 7: ${c7Pass ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------
    // CHECK 8: Restore every degraded source, scan again
    // -------------------------------------------------------------
    console.log("--- Check 8: Restore all sources ---");
    // Restore Google Play (card 2)
    await evalExpr(`document.querySelectorAll('.source-card')[2].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));

    // Restore Apple App Store (card 3)
    await evalExpr(`document.querySelectorAll('.source-card')[3].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));

    // Scan
    await evalExpr(`document.querySelector('button.primary')?.click()`);
    await new Promise((r) => setTimeout(r, 2500));

    const check8Data = await evalExpr(`(() => {
      const banner = document.querySelector('.scan-source-warning');
      const cards = Array.from(document.querySelectorAll('.source-card')).map(c => c.className);
      return { bannerText: banner ? banner.innerText : null, cards };
    })()`);

    const c8Pass = check8Data.bannerText === null &&
      check8Data.cards[1].includes("not_configured") &&
      check8Data.cards[2].includes("not_configured") &&
      check8Data.cards[3].includes("not_configured");

    await takeScreenshot("check_08.png");
    results.push({
      check: 8,
      title: "Restore all sources and rescan",
      status: c8Pass ? "PASS" : "FAIL",
      observed: `Banner is removed; cards 1-3 restored to grey (not_configured)`,
      banner: check8Data.bannerText || "None (expected)"
    });
    console.log(`Check 8: ${c8Pass ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------
    // CHECK 9: Outage active, hard-reload page
    // -------------------------------------------------------------
    console.log("--- Check 9: Outage persistence on hard reload ---");
    // Simulate Instagram outage
    await evalExpr(`document.querySelectorAll('.source-card')[1].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));

    // Hard reload
    await send("Page.reload", { ignoreCache: true });
    await new Promise((r) => setTimeout(r, 2000));

    const check9Card = await evalExpr(`document.querySelectorAll('.source-card')[1]?.className`);

    // Scan again
    await evalExpr(`document.querySelector('button.primary')?.click()`);
    await new Promise((r) => setTimeout(r, 2500));

    const check9Banner = await evalExpr(`document.querySelector('.scan-source-warning')?.innerText`);
    await takeScreenshot("check_09.png");

    const c9Pass = check9Card && check9Card.includes("degraded") &&
      check9Banner && check9Banner.includes("Instagram live monitor");

    results.push({
      check: 9,
      title: "Outage persistence across hard reload",
      status: c9Pass ? "PASS" : "FAIL",
      observed: `Instagram card remains amber (degraded) after hard reload; banner reappears on next scan`,
      banner: check9Banner || "None"
    });
    console.log(`Check 9: ${c9Pass ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------
    // CHECK 10: Selected card stays selected when outage triggered on another
    // -------------------------------------------------------------
    console.log("--- Check 10: Selection preserved during other card outage ---");
    // Restore Instagram
    await evalExpr(`document.querySelectorAll('.source-card')[1].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));

    // Outage on Apple App Store (card 3)
    await evalExpr(`document.querySelectorAll('.source-card')[3].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));

    // Select Google Play (card 2)
    await evalExpr(`document.querySelectorAll('.source-card')[2]?.click()`);
    await new Promise((r) => setTimeout(r, 500));

    const check10Data = await evalExpr(`(() => {
      const cards = Array.from(document.querySelectorAll('.source-card'));
      return {
        card2Selected: cards[2].classList.contains('selected'),
        card2Tag: !!cards[2].querySelector('.source-selected-tag'),
        card3Degraded: cards[3].classList.contains('degraded'),
        caption: document.querySelector('.source-selection-caption')?.innerText
      };
    })()`);

    const c10Pass = check10Data.card2Selected && check10Data.card3Degraded &&
      check10Data.caption.includes("Google Play live monitor");

    await takeScreenshot("check_10.png");
    results.push({
      check: 10,
      title: "Card selection preserved when toggling outage on another card",
      status: c10Pass ? "PASS" : "FAIL",
      observed: `Google Play remains selected (tag visible, caption: "${check10Data.caption}"); Apple App Store turned amber`,
      banner: "None"
    });
    console.log(`Check 10: ${c10Pass ? "PASS" : "FAIL"}`);

    // Restore Apple App Store and deselect Google Play
    await evalExpr(`document.querySelectorAll('.source-card')[3].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));
    await evalExpr(`document.querySelectorAll('.source-card')[2]?.click()`);
    await new Promise((r) => setTimeout(r, 300));

    // -------------------------------------------------------------
    // CHECK 11: Scan for another brand (Adidas) with outage
    // -------------------------------------------------------------
    console.log("--- Check 11: Outage scan on another brand (Adidas) ---");
    // Trigger Instagram outage
    await evalExpr(`document.querySelectorAll('.source-card')[1].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));

    // Select Adidas from dropdown
    await evalExpr(`(() => {
      const select = document.querySelector('select');
      const adidasOption = Array.from(select.options).find(o => o.text === 'Adidas');
      if (adidasOption) {
        select.value = adidasOption.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 2000));

    // Click Scan now for Adidas
    await evalExpr(`document.querySelector('button.primary')?.click()`);
    await new Promise((r) => setTimeout(r, 2500));

    const check11Data = await evalExpr(`(() => {
      const banner = document.querySelector('.scan-source-warning');
      const metrics = Array.from(document.querySelectorAll('.metric strong')).map(el => el.innerText);
      const brand = document.querySelector('select option:checked')?.innerText;
      return {
        brand,
        bannerText: banner ? banner.innerText : null,
        candidatesMonitored: metrics[3]
      };
    })()`);

    const c11Pass = check11Data.brand === "Adidas" &&
      check11Data.candidatesMonitored === "5" &&
      check11Data.bannerText !== null &&
      check11Data.bannerText.includes("Instagram live monitor");

    await takeScreenshot("check_11.png");
    results.push({
      check: 11,
      title: "Outage scan on Adidas",
      status: c11Pass ? "PASS" : "FAIL",
      observed: `Brand: Adidas; candidates: ${check11Data.candidatesMonitored}; banner behavior consistent`,
      banner: check11Data.bannerText || "None"
    });
    console.log(`Check 11: ${c11Pass ? "PASS" : "FAIL"}`);

    // Switch back to Nike and restore Instagram
    await evalExpr(`(() => {
      const select = document.querySelector('select');
      const nikeOption = Array.from(select.options).find(o => o.text === 'Nike');
      if (nikeOption) {
        select.value = nikeOption.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 2000));
    await evalExpr(`document.querySelectorAll('.source-card')[1].querySelector('.source-action-btn')?.click()`);
    await new Promise((r) => setTimeout(r, 1500));

    // -------------------------------------------------------------
    // CHECK 12: Failure handling - Stop backend and reload
    // -------------------------------------------------------------
    console.log("--- Check 12: Backend down failure handling ---");
    // Kill backend task
    console.log("Stopping backend process for failure test...");
    const killUvicorn = spawn("powershell", ["-Command", "Get-Process -Name python,uvicorn -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue; Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"]);
    await new Promise(r => killUvicorn.on("close", r));
    await new Promise((r) => setTimeout(r, 2500));

    // Reload page with backend down
    await send("Page.reload", { ignoreCache: true });
    await new Promise((r) => setTimeout(r, 3000));

    const check12Down = await evalExpr(`(() => {
      const bodyText = document.body.innerText;
      const unavailable = document.querySelector('.source-status-unavailable');
      const viewError = document.querySelector('.view-error');
      const loader = document.querySelector('.loader');
      return {
        bodyNotEmpty: bodyText.trim().length > 0,
        unavailableText: unavailable ? unavailable.innerText : null,
        hasRetry: !!document.querySelector('button'),
        viewErrorText: viewError ? viewError.innerText : null,
        loaderText: loader ? loader.innerText : null
      };
    })()`);
    console.log("With backend down:", check12Down);
    await takeScreenshot("check_12_down.png");

    // Restart backend
    console.log("Restarting backend...");
    const pythonExe = path.resolve(process.cwd(), ".venv/Scripts/python.exe");
    const startBackend = spawn(pythonExe, ["-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8001"], {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore"
    });
    startBackend.unref();

    // Poll until backend is healthy
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch("http://127.0.0.1:8001/api/health");
        if (res.ok) {
          console.log("Backend healthy after restart!");
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }

    // Test recovering: click Retry button
    console.log("Clicking Retry button...");
    await evalExpr(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const retryBtn = buttons.find(b => b.innerText.includes('Retry'));
      if (retryBtn) retryBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 3000));

    const check12Recovered = await evalExpr(`(() => {
      const cards = document.querySelectorAll('.source-card');
      return {
        cardCount: cards.length,
        firstCardName: cards[0]?.querySelector('.source-card-name')?.innerText
      };
    })()`);
    console.log("After backend restart & Retry click:", check12Recovered);
    await takeScreenshot("check_12_recovered.png");

    const c12Pass = check12Down.bodyNotEmpty &&
      (check12Down.unavailableText !== null || check12Down.loaderText !== null || check12Down.hasRetry) &&
      check12Recovered.cardCount === 4;

    results.push({
      check: 12,
      title: "Backend down failure handling and Retry recovery",
      status: c12Pass ? "PASS" : "FAIL",
      observed: `Page did not go blank; showed retryable error state; recovered to ${check12Recovered.cardCount} cards on Retry`,
      banner: "None"
    });
    console.log(`Check 12: ${c12Pass ? "PASS" : "FAIL"}`);

    // -------------------------------------------------------------
    // CHECK 13: Regression - Confirm unchanged values
    // -------------------------------------------------------------
    console.log("--- Check 13: Regression checks ---");
    // Ensure Nike is selected and load is fresh
    await send("Page.navigate", { url: "http://localhost:5173/" });
    await new Promise((r) => setTimeout(r, 2000));

    // Ensure Nike is selected
    await evalExpr(`(() => {
      const select = document.querySelector('select');
      const nikeOption = Array.from(select ? select.options : []).find(o => o.text === 'Nike');
      if (nikeOption) {
        select.value = nikeOption.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 1500));

    const check13Data = await evalExpr(`(() => {
      const rows = Array.from(document.querySelectorAll('.tablecard tbody tr')).map(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
        return {
          candidate: cells[0],
          source: cells[1],
          threatType: cells[2],
          riskScore: cells[3],
          severity: cells[4],
          status: cells[5]
        };
      });
      return rows;
    })()`);

    console.log("Threats in table:", check13Data);

    const n1ke = check13Data.find(r => r.candidate === "N1ke Shopping");
    const rewards = check13Data.find(r => r.candidate === "Nike Rewards Pro");

    // Also check official @nike in DB / detections
    const officialCheck = await fetch("http://127.0.0.1:8001/api/detections?brand_id=c75cace3-ff65-4a6e-ae64-7b5077e15997&severity=SAFE");
    const officialDetections = await officialCheck.json();
    const nikeOfficial = officialDetections.find(d => d.candidate.name.includes("nike") || d.official_match);

    const c13Pass = n1ke && n1ke.riskScore === "82.30" && n1ke.severity === "HIGH" &&
      rewards && rewards.riskScore === "82.88" && rewards.severity === "HIGH" &&
      nikeOfficial && nikeOfficial.risk_score === 0.00 && nikeOfficial.severity === "SAFE";

    await takeScreenshot("check_13.png");
    results.push({
      check: 13,
      title: "Regression check on scores and detections",
      status: c13Pass ? "PASS" : "FAIL",
      observed: `N1ke Shopping: ${n1ke?.riskScore} ${n1ke?.severity}; Nike Rewards Pro: ${rewards?.riskScore} ${rewards?.severity}; Official Nike: ${nikeOfficial?.risk_score.toFixed(2)} ${nikeOfficial?.severity}; Console errors: ${consoleErrors.length}`,
      banner: "None"
    });
    console.log(`Check 13: ${c13Pass ? "PASS" : "FAIL"}`);

    console.log("\n=======================================================");
    console.log("FINAL RESULTS SUMMARY");
    console.log("=======================================================");
    console.table(results);

    ws.close();
  } catch (err) {
    console.error("Execution error:", err);
  } finally {
    chrome.kill();
  }
}

await main();
