import { ImageResponse } from "next/og";

export const alt = "Dulce Encanto — Postres artesanales en Valencia, Carabobo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2A1810 0%, #4E2E1E 60%, #9A4519 100%)",
          color: "#FBF3E4",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: "rgba(233,162,59,0.22)",
            top: -140,
            right: -120,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: 9999,
            background: "rgba(217,51,63,0.18)",
            bottom: -110,
            left: -80,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: "#E9A23B",
            }}
          />
          <span style={{ fontSize: 30, letterSpacing: 8, fontWeight: 700, textTransform: "uppercase" }}>
            Postres Artesanales
          </span>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: "#E9A23B",
            }}
          />
        </div>
        <div style={{ fontSize: 110, fontWeight: 800, fontFamily: "Georgia, serif" }}>
          Dulce Encanto
        </div>
        <div style={{ fontSize: 40, marginTop: 16, color: "#F5E8D3" }}>
          Yogur griego · Quesillo · Torta de pan
        </div>
        <div
          style={{
            marginTop: 34,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 28,
            background: "rgba(251,243,228,0.12)",
            border: "1px solid rgba(251,243,228,0.4)",
            borderRadius: 9999,
            padding: "12px 34px",
          }}
        >
          Valencia · Carabobo — Pide por WhatsApp
        </div>
      </div>
    ),
    { ...size }
  );
}
