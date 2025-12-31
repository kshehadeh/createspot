interface TextThumbnailProps {
  text: string;
  className?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function TextThumbnail({ text, className = "" }: TextThumbnailProps) {
  const plainText = stripHtml(text);

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-zinc-100 p-3 dark:bg-zinc-800 ${className}`}
    >
      <p className="line-clamp-6 text-center text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        {plainText.slice(0, 200)}
        {plainText.length > 200 && "..."}
      </p>
    </div>
  );
}
