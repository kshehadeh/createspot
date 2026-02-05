declare module "gifenc" {
  type Palette = number[][];

  export function quantize(
    rgba: Uint8Array,
    maxColors: number,
    opts?: Record<string, unknown>,
  ): Palette;

  export function applyPalette(
    rgba: Uint8Array,
    palette: Palette,
    format?: string,
  ): Uint8Array;

  export function GIFEncoder(opts?: {
    initialCapacity?: number;
    auto?: boolean;
  }): {
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      opts?: { palette?: Palette; delay?: number },
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array;
  };
}
