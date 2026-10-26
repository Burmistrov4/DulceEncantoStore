// Diagnóstico del auto-avance del carrusel: carga la página en un navegador
// real (CDP), espera y comprueba si el scroll del carrusel avanza solo.
// Uso: node scripts/diagnose-carousel.mjs
import { spawn } from "node:child_process";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9227;

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${PORT}`,
  "--window-size=1280,900", "--no-first-run",
  "--user-data-dir=C:/Users/Loro/AppData/Local/Temp/chrome-cdp-carousel",
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

  const snapshot = `(() => {
    const sc = document.querySelector('#disponible-hoy [role="group"][aria-label^="Fotos"]');
    if (!sc) return JSON.stringify({ error: "scroller no encontrado" });
    return JSON.stringify({
      scrollLeft: Math.round(sc.scrollLeft),
      scrollWidth: sc.scrollWidth,
      clientWidth: sc.clientWidth,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  })()`;

  const read = async () => {
    const { result } = await send("Runtime.evaluate", { expression: snapshot, returnByValue: true });
    return result.value;
  };

  console.log("t=5s :", await read());
  // mover el cursor lejos del carrusel para asegurar que no esté "pausado"
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 30, y: 880 });
  await new Promise((r) => setTimeout(r, 12000));
  console.log("t=17s:", await read());
  await new Promise((r) => setTimeout(r, 10000));
  console.log("t=27s:", await read());
} catch (e) {
  console.error("✖", e.message);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
}
