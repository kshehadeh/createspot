"use client";

import type { PropsWithChildren } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AboutScrollSectionProps extends PropsWithChildren {
  id?: string;
  className?: string;
}

export function AboutScrollSection({
  id,
  className,
  children,
}: AboutScrollSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={cn("scroll-mt-24", className)}
      initial={shouldReduceMotion ? "visible" : "hidden"}
      whileInView="visible"
      // "some" + root margin: strict fractional thresholds (e.g. 0.2) often fail to
      // fire on mobile for very tall sections (features grid), leaving content opacity 0.
      viewport={{
        once: true,
        amount: "some",
        margin: "0px 0px 48px 0px",
      }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.45,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.section>
  );
}
