import { ExpandableImage } from "@/components/expandable-image";

interface SubmissionImageProps {
  imageUrl: string;
  alt: string;
  tags?: string[];
  /** Height classes for the container. Defaults to submission detail heights. */
  heightClasses?: string;
  /** Additional wrapper classes */
  className?: string;
}

export function SubmissionImage({
  imageUrl,
  alt,
  tags = [],
  heightClasses = "h-[65vh] sm:h-[72vh] md:h-[80vh]",
  className = "",
}: SubmissionImageProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-xl ${heightClasses} ${className}`}>
      <ExpandableImage
        imageUrl={imageUrl}
        alt={alt}
        objectFit="cover"
        className="h-full w-full"
      />
      {/* Tags overlay */}
      {tags.length > 0 && (
        <div className="absolute bottom-2 right-2 flex flex-col gap-1.5">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
