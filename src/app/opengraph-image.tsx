// File: src/app/opengraph-image.tsx
// Purpose: Default 1200×630 social preview image, generated at build time (no image asset to maintain).
import { ImageResponse } from "next/og";

export const alt = "LaunchLayer — Find the right AI tool for any task";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #0a5f4e 0%, #0e7c66 45%, #0b8bb0 100%)", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 36, fontWeight: 700 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>L</div>
          LaunchLayer
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Find the right AI</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>for the job.</div>
          <div style={{ marginTop: 28, fontSize: 30, opacity: 0.9 }}>No pay-to-rank · No login walls · Free listings</div>
        </div>
      </div>
    ),
    size,
  );
}
