import { permanentRedirect } from "next/navigation";

/** Old path; favorites live on the home feed under the Favorites tab. */
export default function InspireFavoritesRedirectPage() {
  permanentRedirect("/?tab=favorites");
}
