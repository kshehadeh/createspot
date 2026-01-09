import type { Metadata } from "next";
import { PageLayout } from "@/components/page-layout";
import { GlobalMap } from "./global-map";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Global Exhibition | Create Spot",
  description:
    "Explore artists from around the world on an interactive map. Discover creative work from the Create Spot community across the globe.",
  openGraph: {
    title: "Global Exhibition | Create Spot",
    description:
      "Explore artists from around the world on an interactive map. Discover creative work from the Create Spot community across the globe.",
    type: "website",
  },
};

export default async function GlobalExhibitionPage() {
  return (
    <PageLayout maxWidth="max-w-none" className="w-full" withPadding={false}>
      <GlobalMap />
    </PageLayout>
  );
}
