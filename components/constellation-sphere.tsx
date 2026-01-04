"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

interface ConstellationItem {
  id: string;
  imageUrl: string | null;
  text: string | null;
  title: string | null;
  promptWord: string | null;
}

interface ConstellationPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  opacity: number;
  item: ConstellationItem;
}

interface ConstellationSphereProps {
  items: ConstellationItem[];
  className?: string;
}

const BASE_RADIUS = 230;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function hashToUnit(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

export function ConstellationSphere({
  items,
  className,
}: ConstellationSphereProps) {
  const sphereRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef({ x: -12, y: 24 });
  const velocityRef = useRef({ x: 0.06, y: 0.08 });
  const dragRef = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    moved: false,
  });

  const points = useMemo<ConstellationPoint[]>(() => {
    if (items.length === 0) {
      return [];
    }

    return items.map((item, index) => {
      const base = hashToUnit(item.id);
      const t = (index + 0.5) / items.length;
      const y = 1 - 2 * t;
      const radius = Math.sqrt(1 - y * y);
      const phi = index * GOLDEN_ANGLE + base * Math.PI * 0.6;
      const drift = 0.7 + base * 0.6;
      const distance = BASE_RADIUS * drift;
      const x = Math.cos(phi) * radius * distance;
      const z = Math.sin(phi) * radius * distance;
      const opacity = 0.55 + base * 0.4;

      return {
        id: item.id,
        x,
        y: y * distance,
        z,
        opacity,
        item,
      };
    });
  }, [items]);

  useEffect(() => {
    const sphere = sphereRef.current;
    if (!sphere) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      velocityRef.current = { x: 0, y: 0 };
    }

    let animationFrame = 0;

    const animate = () => {
      const { isDragging } = dragRef.current;
      const rotation = rotationRef.current;
      const velocity = velocityRef.current;

      if (!isDragging) {
        rotation.x += velocity.x;
        rotation.y += velocity.y;
        velocity.x *= 0.98;
        velocity.y *= 0.98;
      }

      sphere.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
      animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragRef.current.isDragging) {
        return;
      }

      const deltaX = event.clientX - dragRef.current.lastX;
      const deltaY = event.clientY - dragRef.current.lastY;
      const deltaTime = event.timeStamp - dragRef.current.lastTime || 16;

      if (Math.abs(deltaX) + Math.abs(deltaY) > 2) {
        dragRef.current.moved = true;
      }

      rotationRef.current.x -= deltaY * 0.25;
      rotationRef.current.y += deltaX * 0.25;

      velocityRef.current.x = (-deltaY / deltaTime) * 3;
      velocityRef.current.y = (deltaX / deltaTime) * 3;

      dragRef.current.lastX = event.clientX;
      dragRef.current.lastY = event.clientY;
      dragRef.current.lastTime = event.timeStamp;

      event.preventDefault();
    };

    const handlePointerUp = () => {
      dragRef.current.isDragging = false;
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  if (points.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative mx-auto flex h-[420px] max-w-5xl items-center justify-center sm:h-[520px] ${className ?? ""}`}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_top,_rgba(255,214,165,0.35),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(148,187,255,0.25),_transparent_60%)] opacity-80 dark:opacity-60" />
      <div className="absolute inset-0 rounded-[36px] border border-zinc-200/60 bg-white/70 shadow-[0_50px_120px_-60px_rgba(17,24,39,0.6)] backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/70" />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.9)]" />
      <div
        className="relative h-full w-full cursor-grab touch-none select-none"
        style={{ perspective: "1200px", touchAction: "none" }}
        onPointerDownCapture={(event) => {
          event.preventDefault();
          dragRef.current.isDragging = true;
          dragRef.current.lastX = event.clientX;
          dragRef.current.lastY = event.clientY;
          dragRef.current.lastTime = event.timeStamp;
          dragRef.current.moved = false;
          velocityRef.current = { x: 0, y: 0 };
        }}
      >
        <div
          ref={sphereRef}
          className="absolute left-1/2 top-1/2 h-0 w-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {points.map((point) => {
            const displayText = point.item.text
              ? stripHtml(point.item.text).slice(0, 70)
              : "";
            const promptWord = point.item.promptWord?.trim() ?? "";
            const captionText = point.item.title?.trim() || promptWord;
            return (
              <Link
                key={point.id}
                href={`/s/${point.id}`}
                className="group absolute rounded-2xl border border-white/40 bg-white/90 p-2 shadow-lg shadow-zinc-900/10 backdrop-blur-md transition-shadow duration-300 hover:shadow-xl dark:border-zinc-700/60 dark:bg-zinc-900/90"
                draggable={false}
                style={{
                  transform: `translate3d(${point.x}px, ${point.y}px, ${point.z}px) translate(-50%, -50%)`,
                  opacity: point.opacity,
                  width: point.item.imageUrl ? "140px" : "160px",
                }}
                onDragStart={(event) => event.preventDefault()}
                onClick={(event) => {
                  if (dragRef.current.moved) {
                    event.preventDefault();
                  }
                }}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  {point.item.imageUrl ? (
                    <Image
                      src={point.item.imageUrl}
                      alt={point.item.title || "Creative work"}
                      draggable={false}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="140px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 px-4 text-center text-xs font-medium text-zinc-600 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-300">
                      {displayText || "Untitled submission"}
                    </div>
                  )}
                </div>
                <div
                  className={`mt-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ${
                    captionText ? "justify-between" : "justify-end"
                  }`}
                >
                  {captionText ? <span className="truncate">{captionText}</span> : null}
                  <span className="text-amber-500">View</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
