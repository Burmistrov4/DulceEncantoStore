// Diagnóstico: conecta a Chrome headless por CDP y lista los elementos cuyo
// borde derecho supera el ancho del viewport (culpables del scroll horizontal).
// Uso: node scripts/diagnose-overflow.mjs [url] [width]
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const { spawn } = await import("node:child_process");
const port = 9223;
const url = process.argv[2] || "http://localhost:3000/";
const width = Number(process.argv[3] || 390);

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--window-size=${width},900`,
  "--no-first-run",
  "--user-data-dir=C:/Users/Loro/AppData/Local/Temp/chrome-cdp-profile",
  "about:blank",
], { stdio: "ignore" });

async function getTarget() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* chrome aún arrancando */ }
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

await new Promise((r) => (ws.onopen = r));
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: true });
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 6000));

const { result } = await send("Runtime.evaluate", {
  expression: `(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [];
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width > 0) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className).slice(0, 90),
          right: Math.round(r.right),
          width: Math.round(r.width),
          text: (el.textContent || '').trim().slice(0, 40),
        });
      }
    }
    return JSON.stringify({
      vw,
      scrollW: document.documentElement.scrollWidth,
      bodyScrollW: document.body.scrollWidth,
      count: offenders.length,
      offenders: offenders.slice(0, 25),
    }, null, 1);
  })()`,
  returnByValue: true,
});
console.log(result.value);
ws.close();
chrome.kill();
process.exit(0);
