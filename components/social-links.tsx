import { normalizeUrl, getUrlHostname } from "@/lib/utils";
import { SiInstagram, SiX } from "@icons-pack/react-simple-icons";
import { Globe, Linkedin } from "lucide-react";

interface SocialLinksProps {
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  website?: string | null;
  variant?: "default" | "minimal";
}

export function SocialLinks({
  instagram,
  twitter,
  linkedin,
  website,
  variant = "default",
}: SocialLinksProps) {
  const isMinimal = variant === "minimal";
  const iconSize = isMinimal ? "h-3 w-3" : "h-4 w-4";
  const linkClassName = isMinimal
    ? "text-muted-foreground transition-colors hover:text-foreground"
    : "flex items-center justify-center rounded-lg bg-muted p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";
  const containerClassName = isMinimal
    ? "flex flex-wrap items-center gap-2"
    : "flex flex-wrap items-center gap-2 ml-auto";

  return (
    <div className={containerClassName}>
      {instagram && (
        <a
          href={`https://instagram.com/${instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          title={`@${instagram}`}
        >
          <SiInstagram className={iconSize} />
        </a>
      )}

      {twitter && (
        <a
          href={`https://x.com/${twitter}`}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          title={`@${twitter}`}
        >
          <SiX className={iconSize} />
        </a>
      )}

      {linkedin && (
        <a
          href={`https://linkedin.com/in/${linkedin}`}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          title={linkedin}
        >
          <Linkedin className={iconSize} />
        </a>
      )}

      {website &&
        (() => {
          try {
            const normalizedUrl = normalizeUrl(website);
            if (!normalizedUrl) return null;
            // Use normalized URL for hostname extraction to ensure it works
            const hostname = getUrlHostname(normalizedUrl);
            return (
              <a
                href={normalizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
                title={hostname}
              >
                <Globe className={iconSize} />
              </a>
            );
          } catch {
            // Gracefully handle any errors - don't render the link if URL is invalid
            return null;
          }
        })()}
    </div>
  );
}
