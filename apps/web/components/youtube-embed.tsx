import { cn } from "@/lib/utils";

interface YouTubeEmbedProps {
  /** YouTube video ID (e.g. from youtu.be/ID or youtube.com/watch?v=ID) */
  videoId: string;
  /** Optional title for accessibility */
  title?: string;
  className?: string;
}

export function YouTubeEmbed({ videoId, title, className }: YouTubeEmbedProps) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  return (
    <div
      className={cn(
        "aspect-video w-full overflow-hidden rounded-lg",
        className,
      )}
    >
      <iframe
        src={embedUrl}
        title={title ?? "YouTube video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
