import { Suspense } from "react";

interface CreatorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ creatorid: string }>;
}

export default function CreatorLayout({ children }: CreatorLayoutProps) {
  return (
    <Suspense fallback={<div className="flex flex-1" />}>{children}</Suspense>
  );
}
