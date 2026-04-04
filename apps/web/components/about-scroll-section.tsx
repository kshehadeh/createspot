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
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
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
