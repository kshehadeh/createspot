import { redirect } from "next/navigation";

export default function GalleryPage() {
  // Redirect old /exhibition/gallery to /exhibition/gallery/grid
  redirect("/inspire/exhibition/gallery/grid");
}
