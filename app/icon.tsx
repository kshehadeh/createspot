import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 40 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="12" r="4" fill="black" />
          <circle cx="20" cy="12" r="4" fill="black" />
          <circle cx="32" cy="12" r="4" fill="black" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}

