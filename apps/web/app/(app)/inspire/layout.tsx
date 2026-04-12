interface InspireLayoutProps {
  children: React.ReactNode;
}

export default function InspireLayout({ children }: InspireLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col md:pr-6 lg:pr-12">
      {children}
    </div>
  );
}
