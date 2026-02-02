import { ImageResponse } from "next/og";
import { LOGO_BASE_PATHS, LOGO_HIGHLIGHT_PATHS } from "@/lib/logo-paths";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// CreateSpot logo paths (from shared constants)
const basePaths = LOGO_BASE_PATHS;
const highlightPaths = LOGO_HIGHLIGHT_PATHS;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        gap: "40px",
        padding: "80px",
      }}
    >
      {/* CreateSpot Logo SVG */}
      <svg
        width="240"
        height="262"
        viewBox="0 0 729 796"
        style={{
          display: "block",
        }}
      >
        <g>
          {basePaths.map((d, i) => (
            <path key={`base-${i}`} fill="#ffffff" stroke="none" d={d} />
          ))}
        </g>
        <g>
          {highlightPaths.map((d, i) => (
            <path key={`highlight-${i}`} fill="#000000" stroke="none" d={d} />
          ))}
        </g>
      </svg>

      {/* Title */}
      <div
        style={{
          fontSize: "96px",
          fontWeight: "bold",
          color: "#ffffff",
          textAlign: "center",
          letterSpacing: "-0.02em",
        }}
      >
        Create Spot
      </div>
    </div>,
    {
      ...size,
    },
  );
}
