interface TextThumbnailProps {
  text: string;
  className?: string;
  fadeBottom?: boolean;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function TextThumbnail({
  text,
  className = "",
  fadeBottom = false,
}: TextThumbnailProps) {
  const plainText = stripHtml(text);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-zinc-100 p-3 dark:bg-zinc-800 ${className}`}
    >
      <p className="line-clamp-6 text-center text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        {plainText.slice(0, 200)}
        {plainText.length > 200 && "..."}
      </p>
      {fadeBottom && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-zinc-100 dark:from-zinc-800" />
      )}
    </div>
  );
}
