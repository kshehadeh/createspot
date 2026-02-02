import { ImageResponse } from "next/og";
import { LOGO_BASE_PATHS, LOGO_HIGHLIGHT_PATHS } from "@/lib/logo-paths";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const runtime = "edge";

// CreateSpot logo paths (from shared constants)
const basePaths = LOGO_BASE_PATHS;
const highlightPaths = LOGO_HIGHLIGHT_PATHS;

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 729 796"
        style={{
          display: "block",
        }}
      >
        <g>
          {basePaths.map((d, i) => (
            <path key={`base-${i}`} fill="#000000" stroke="none" d={d} />
          ))}
        </g>
        <g>
          {highlightPaths.map((d, i) => (
            <path key={`highlight-${i}`} fill="#ffffff" stroke="none" d={d} />
          ))}
        </g>
      </svg>
    </div>,
    {
      ...size,
    },
  );
}
