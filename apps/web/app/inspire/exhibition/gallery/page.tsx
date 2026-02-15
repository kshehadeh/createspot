import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function GalleryPage() {
  // Redirect old /exhibition/gallery to /exhibition/gallery/grid
  redirect("/inspire/exhibition/gallery/grid");
}
