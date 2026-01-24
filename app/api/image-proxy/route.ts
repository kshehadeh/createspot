import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route to fetch images from R2/external sources to avoid CORS issues
 * GET /api/image-proxy?url=<encoded-image-url>
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  try {
    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl);

    // Validate URL is from allowed domains (R2 public URL)
    const allowedDomains = [
      process.env.R2_PUBLIC_URL,
      // Allow any R2 domain as fallback
      ...(process.env.R2_PUBLIC_URL
        ? []
        : ["*.r2.cloudflarestorage.com", "*.r2.dev"]),
    ].filter(Boolean);

    const urlObj = new URL(decodedUrl);
    const isAllowed = allowedDomains.some((domain) => {
      if (!domain) return false;
      // Support wildcard domains
      if (domain.startsWith("*.")) {
        const baseDomain = domain.slice(2);
        return urlObj.hostname.endsWith(baseDomain);
      }
      return (
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Image URL not allowed" },
        { status: 403 },
      );
    }

    // Fetch the image
    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent": "CreateSpot-ImageProxy/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status },
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 },
    );
  }
}
