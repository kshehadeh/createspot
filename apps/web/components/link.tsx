"use client";

import NextLink from "next/link";
import { forwardRef } from "react";
import type { ComponentProps } from "react";

/**
 * App Link wrapper. Defaults prefetch={false} to disable Next.js link prefetching.
 * Pass prefetch={true} to opt in for specific links.
 */
const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(
  function Link({ prefetch = true, ...props }, ref) {
    return <NextLink ref={ref} prefetch={prefetch} {...props} />;
  },
);

export default Link;
