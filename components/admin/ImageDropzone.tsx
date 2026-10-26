"use client";

import { useEffect, useRef, useState } from "react";

// ---------- Recortador con lienzo: arrastrar para mover, slider para zoom ----------
function CropModal({ file, onCancel, onDone }: { file: File; onCancel: () => void; onDone: (blob: Blob) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const dragRef = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);

  const W = 480;
  const H = 360; // proporción 4:3, igual que el catálogo

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
      requestAnimationFrame(() => draw());
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  function draw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#F5E8D3";
    ctx.fillRect(0, 0, W, H);
    const s = Math.max(W / img.width, H / img.height) * zoomRef.current;
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, W / 2 - dw / 2 + posRef.current.x, H / 2 - dh / 2 + posRef.current.y, dw, dh);
  }

  function clampPos() {
    const img = imgRef.current;
    if (!img) return;
    const s = Math.max(W / img.width, H / img.height) * zoomRef.current;
    const maxX = Math.max(0, (img.width * s - W) / 2);
    const maxY = Math.max(0, (img.height * s - H) / 2);
    posRef.current.x = Math.min(maxX, Math.max(-maxX, posRef.current.x));
    posRef.current.y = Math.min(maxY, Math.max(-maxY, posRef.current.y));
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY, x: posRef.current.x, y: posRef.current.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    posRef.current.x = dragRef.current.x + (e.clientX - dragRef.current.px);
    posRef.current.y = dragRef.current.y + (e.clientY - dragRef.current.py);
    clampPos();
    draw();
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onZoom = (v: number) => {
    zoomRef.current = v;
    setZoom(v);
    clampPos();
    draw();
  };

  const confirm = () => {
    const img = imgRef.current;
    if (!img) return;
    // Exporta a 1200×900 .webp (compresión automática)
    const out = document.createElement("canvas");
    out.width = 1200;
    out.height = 900;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    const k = 1200 / W;
    ctx.scale(k, k);
    const s = Math.max(W / img.width, H / img.height) * zoomRef.current;
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, W / 2 - dw / 2 + posRef.current.x, H / 2 - dh / 2 + posRef.current.y, dw, dh);
    out.toBlob((blob) => blob && onDone(blob), "image/webp", 0.85);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-choco/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-cream p-5 shadow-pop">
        <h3 className="font-display text-lg font-black">Recorta la foto 📸</h3>
        <p className="mt-1 text-xs text-choco/60">
          Arrastra para acomodar y usa el zoom. Se guarda optimizada en .webp (1200×900).
        </p>
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="mt-4 w-full cursor-grab touch-none rounded-2xl bg-cream-deep ring-1 ring-choco/10 active:cursor-grabbing"
          style={{ aspectRatio: "4 / 3" }}
        />
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs font-black text-choco/60">ZOOM</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => onZoom(Number(e.target.value))}
            className="flex-1 accent-caramel"
            aria-label="Zoom de la foto"
          />
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-full bg-choco/10 px-4 py-2.5 font-bold text-choco/70 hover:bg-choco/20">
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={!ready}
            className="flex-1 rounded-full bg-caramel px-4 py-2.5 font-bold text-cream hover:bg-caramel-deep disabled:opacity-50"
          >
            {ready ? "Usar esta foto ✓" : "Cargando…"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Zona de arrastre + vista previa ----------
export default function ImageDropzone({ value, onChange }: { value: string; onChange: (path: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const accept = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Solo se aceptan imágenes (JPG, PNG, WebP).");
      return;
    }
    setError("");
    setPending(f);
  };

  const onCropped = async (blob: Blob) => {
    setPending(null);
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "producto.webp", { type: "image/webp" }));
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo subir la foto");
      onChange(json.path as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-choco/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Foto del producto" className="h-20 w-28 rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-choco/10 px-4 py-2 text-sm font-bold hover:bg-choco/20"
          >
            Cambiar foto
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            accept(e.dataTransfer.files?.[0]);
          }}
          className={`grid w-full place-items-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
            over ? "border-caramel bg-caramel/10" : "border-choco/20 bg-white/60 hover:border-caramel/50"
          }`}
        >
          <span className="text-3xl" aria-hidden="true">🖼️</span>
          <span className="mt-2 text-sm font-bold">Arrastra una foto o haz clic</span>
          <span className="mt-0.5 text-xs text-choco/50">JPG · PNG · WebP — se recorta y comprime a .webp solo</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {busy && <p className="mt-2 text-xs font-bold text-caramel">Optimizando y subiendo…</p>}
      {error && <p className="mt-2 text-xs font-bold text-berry">{error}</p>}

      {pending && <CropModal file={pending} onCancel={() => setPending(null)} onDone={onCropped} />}
    </div>
  );
}
