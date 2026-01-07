"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

interface ExpandableImageProps {
  imageUrl: string;
  alt: string;
  className?: string;
}

export function ExpandableImage({
  imageUrl,
  alt,
  className = "",
}: ExpandableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        className="h-full w-full object-contain"
      />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-9 w-9 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
            aria-label="Expand image"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] max-h-[95vh] border-none bg-black/95 p-0">
          <div className="flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative max-h-[90vh] max-w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={alt}
                className="max-h-[90vh] max-w-full object-contain"
              />
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
