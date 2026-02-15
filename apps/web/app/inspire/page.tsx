import { redirect } from "next/navigation";
import { getRoute } from "@/lib/routes";

export default function InspirePage() {
  redirect(getRoute("exhibition").path);
}
