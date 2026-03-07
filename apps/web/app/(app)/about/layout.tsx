import { AboutSidebar } from "@/components/about-sidebar";
import { AboutMobileNav } from "@/components/about-mobile-nav";

interface AboutLayoutProps {
  children: React.ReactNode;
}

export default function AboutLayout({ children }: AboutLayoutProps) {
  return (
    <div className="flex flex-1">
      <AboutSidebar />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
      <AboutMobileNav />
    </div>
  );
}
