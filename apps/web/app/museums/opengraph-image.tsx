import { prisma } from "@/lib/prisma";
import {
  createOgLogoOnlyResponse,
  createOgSplitImageResponse,
  fetchImageAsPngDataUrlForOg,
  OG_IMAGE_CONTENT_TYPE as contentType,
  OG_IMAGE_SIZE as size,
} from "@/lib/og-image";

export const dynamic = "force-dynamic";
export { size, contentType };

export default async function MuseumsOpenGraphImage() {
  const artwork = await prisma.museumArtwork.findFirst({
    orderBy: { curatedAt: "desc" },
    select: { imageUrl: true },
  });

  if (!artwork?.imageUrl) {
    return createOgLogoOnlyResponse();
  }

  const imageDataUrl = await fetchImageAsPngDataUrlForOg(artwork.imageUrl, {
    width: size.width / 2,
    height: size.height,
  });

  if (!imageDataUrl) {
    return createOgLogoOnlyResponse();
  }

  return createOgSplitImageResponse(imageDataUrl);
}
