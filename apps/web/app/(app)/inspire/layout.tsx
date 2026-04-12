import { InspireSidebar } from "@/components/inspire-sidebar";
import { InspireMobileNav } from "@/components/inspire-mobile-nav";

interface InspireLayoutProps {
  children: React.ReactNode;
}

export default function InspireLayout({ children }: InspireLayoutProps) {
  return (
    <div className="flex flex-1 gap-5">
      <InspireSidebar />
      <div className="flex-1 min-w-0 pb-16 md:pb-0 md:pr-6 lg:pr-12">
        {children}
      </div>
      <InspireMobileNav />
    </div>
  );
}
