// Captura móvil real vía CDP: emula un teléfono (390×844, DSF 2, viewport meta)
// y guarda un PNG de página completa. Uso: node scripts/capture-mobile.mjs [url] [out]
import { spawn } from "node:child_process";
import fs from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9226;
const url = process.argv[2] || "http://localhost:3000/";
const out = process.argv[3] || "C:/Users/Loro/AppData/Local/Temp/shots/movil-cdp.png";

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${PORT}`,
  "--window-size=800,900",
  "--no-first-run",
  "--user-data-dir=C:/Users/Loro/AppData/Local/Temp/chrome-cdp-capture",
  "about:blank",
], { stdio: "ignore" });

async function getTarget() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* chrome arrancando */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("No se pudo conectar a Chrome CDP");
}

const wsUrl = await getTarget();
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();

function send(method, params) {
  return new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
};

try {
  await new Promise((r) => (ws.onopen = r));
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send("Page.navigate", { url });
  await new Promise((r) => setTimeout(r, 7000));
  const res = await send("Page.captureScreenshot", { format: "png" });
  const data = res?.result?.data ?? res?.data;
  if (!data) {
    console.error("Respuesta cruda:", JSON.stringify(res).slice(0, 300));
    throw new Error("captureScreenshot no devolvió datos");
  }
  fs.writeFileSync(out, Buffer.from(data, "base64"));
  console.log(`✔ Captura móvil guardada: ${out}`);
} catch (e) {
  console.error("✖ Error:", e.message);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
}
