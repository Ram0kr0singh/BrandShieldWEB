import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const userDataDir = path.join(os.tmpdir(), "brandshield_chrome_profile_screenshots");
fs.mkdirSync(userDataDir, { recursive: true });
const screenshotsDir = path.resolve("screenshots");
fs.mkdirSync(screenshotsDir, { recursive: true });

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chrome = spawn(chromePath, [
  "--headless=new",
  "--remote-debugging-port=9223",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-extensions",
  `--user-data-dir=${userDataDir}`,
  "http://127.0.0.1:5173/"
]);

await new Promise((r) => setTimeout(r, 2500));

async function main() {
  let ws;
  try {
    const listRes = await fetch("http://127.0.0.1:9223/json/list");
    const pages = await listRes.json();
    const page = pages.find(p => p.type === "page" && p.url.includes("5173")) || pages.find(p => p.type === "page") || pages[0];
    ws = new WebSocket(page.webSocketDebuggerUrl);

    let id = 1;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
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
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    const capture = async (url, filename) => {
      console.log(`Navigating to ${url}...`);
      await send("Page.navigate", { url });
      await new Promise(r => setTimeout(r, 2000));
      const res = await send("Page.captureScreenshot", { format: "png" });
      const filePath = path.join(screenshotsDir, filename);
      fs.writeFileSync(filePath, Buffer.from(res.data, "base64"));
      console.log(`Saved screenshot: ${filename}`);
    };

    await capture("http://127.0.0.1:5173/", "aegis_01_dashboard.png");
    await capture("http://127.0.0.1:5173/profile", "aegis_02_profile.png");
    await capture("http://127.0.0.1:5173/social", "aegis_03_social.png");
    await capture("http://127.0.0.1:5173/apps", "aegis_04_apps.png");
    await capture("http://127.0.0.1:5173/threats", "aegis_05_threats.png");

    // For threat detail, fetch the first threat ID
    const threatsRes = await fetch("http://127.0.0.1:8001/api/detections?limit=1");
    const threats = await threatsRes.json();
    const threatId = threats[0]?.id;
    if (threatId) {
      await capture(`http://127.0.0.1:5173/threats/${threatId}`, "aegis_06_detail.png");
    }

    await capture("http://127.0.0.1:5173/lookalikes", "aegis_07_lookalikes.png");
    await capture("http://127.0.0.1:5173/check", "aegis_08_check.png");

    console.log("All AEGIS screenshots captured successfully!");
    ws.close();
  } catch (err) {
    console.error("Error capturing screenshots:", err);
  } finally {
    chrome.kill();
  }
}

await main();

