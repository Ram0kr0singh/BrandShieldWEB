import { spawn } from "node:child_process";

const chrome = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
  "--headless=new",
  "--remote-debugging-port=9222",
  "--no-sandbox",
  "--disable-gpu",
  "http://127.0.0.1:5173/"
]);

await new Promise(r => setTimeout(r, 2000));
const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
console.log("Targets in /json/list:", list);
const target = list.find(p => p.type === "page" && p.url.includes("5173")) || list.find(p => p.type === "page") || list[0];
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

const errors = [];
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    errors.push(msg.params.args?.map(a => a.value || a.description).join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    errors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
  }
};
ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
ws.send(JSON.stringify({ id: 2, method: "Page.enable" }));

await new Promise(r => setTimeout(r, 2500));

let id = 10;
const evalExpr = (expr) => new Promise(res => {
  const reqId = id++;
  const handler = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id === reqId) {
      ws.removeEventListener("message", handler);
      res(msg.result?.result?.value);
    }
  };
  ws.addEventListener("message", handler);
  ws.send(JSON.stringify({ id: reqId, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true } }));
});

console.log("Console errors:", errors);
console.log("URL:", await evalExpr("window.location.href"));
console.log("Root innerHTML:", await evalExpr("document.getElementById('root')?.innerHTML"));
console.log("Body innerHTML:", await evalExpr("document.body?.innerHTML"));
console.log("Body text:", await evalExpr("document.body.innerText"));
console.log("Cards count:", await evalExpr("document.querySelectorAll('.source-card').length"));

chrome.kill();
process.exit(0);
