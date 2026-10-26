// Captura la página con el cursor posicionado sobre una tarjeta del catálogo
// para verificar visualmente el efecto spotlight + tilt. Uso: node scripts/capture-hover.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9232;

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${PORT}`,
  "--window-size=1280,900", "--no-first-run",
  "--user-data-dir=C:/Users/Loro/AppData/Local/Temp/chrome-cdp-hover",
  "about:blank",
], { stdio: "ignore" });

async function getTarget() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const page = (await res.json()).find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* arrancando */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Sin conexión CDP");
}

const ws = new WebSocket(await getTarget());
let id = 0;
const pending = new Map();
const send = (method, params) => new Promise((resolve, reject) => {
  const mid = ++id;
  pending.set(mid, { resolve, reject });
  ws.send(JSON.stringify({ id: mid, method, params }));
});
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
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await new Promise((r) => setTimeout(r, 5000));
  await send("Runtime.evaluate", {
    expression: "document.querySelector('#menu').scrollIntoView()",
  });
  await new Promise((r) => setTimeout(r, 600));
  // mover el cursor sobre la zona de tarjetas (centro-izquierda)
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 660, y: 480 });
  await new Promise((r) => setTimeout(r, 700));
  const res = await send("Page.captureScreenshot", { format: "png" });
  const data = res?.result?.data ?? res?.data;
  if (!data) {
    console.error("Respuesta:", JSON.stringify(res).slice(0, 200));
    throw new Error("Sin datos de captura");
  }
  fs.writeFileSync("C:/Users/Loro/AppData/Local/Temp/shots/spotlight-catalogo.png", Buffer.from(data, "base64"));
  console.log("✔ captura con cursor guardada");
} catch (e) {
  console.error("✖", e.message);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
}
