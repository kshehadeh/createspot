import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
        background: "linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)",
        gap: "40px",
        padding: "80px",
      }}
    >
      {/* Logo/Icon area - three circles matching the logo design */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "#000000",
          }}
        />
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "#000000",
          }}
        />
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "#000000",
          }}
        />
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: "96px",
          fontWeight: "bold",
          color: "#000000",
          textAlign: "center",
          letterSpacing: "-0.02em",
        }}
      >
        Create Spot
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "36px",
          color: "#52525b",
          textAlign: "center",
          maxWidth: "900px",
          lineHeight: "1.4",
        }}
      >
        A creative community for artists and writers to share their work, build
        portfolios, and participate in weekly creative prompts.
      </div>
    </div>,
    {
      ...size,
    },
  );
}
