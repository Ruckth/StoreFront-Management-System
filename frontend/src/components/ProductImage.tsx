import { useState } from "react";
import { cn } from "../lib/utils";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
};

export function ProductImage({
  src,
  alt,
  className,
  fallbackClassName,
}: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = Boolean(src && failedSrc === src);

  if (!src || hasError) {
    return (
      <div
        aria-hidden={alt ? undefined : "true"}
        aria-label={alt || undefined}
        className={cn(className, fallbackClassName ?? "catalog-card-placeholder")}
        role={alt ? "img" : undefined}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src ?? null)}
    />
  );
}
