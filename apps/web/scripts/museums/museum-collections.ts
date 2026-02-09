import type { ArtworkResult, SearchOptions } from "@/lib/museums/types";
import { Museum } from "./museum";
import { ArtInstituteChicagoMuseum } from "./adapters/art-institute-chicago";
import { ClevelandMuseum } from "./adapters/cleveland";
import { NationalGalleryOfArtMuseum } from "./adapters/national-gallery-of-art";

export class MuseumCollections {
  private museumMap = new Map<string, Museum>();

  constructor(museums?: Museum[]) {
    (
      museums ?? [
        new ClevelandMuseum(),
        new ArtInstituteChicagoMuseum(),
        new NationalGalleryOfArtMuseum(),
      ]
    ).forEach((museum) => this.registerMuseum(museum));
  }

  get museums() {
    return Array.from(this.museumMap.values());
  }

  registerMuseum(museum: Museum) {
    this.museumMap.set(museum.id, museum);
  }

  /**
   * Returns the data source description for each museum (e.g. SQLite path).
   */
  getDataSources(
    options: SearchOptions,
  ): { museumId: string; name: string; dataSource: string }[] {
    const selectedMuseums = options.museums?.length
      ? options.museums
          .map((museumId) => this.museumMap.get(museumId))
          .filter((museum): museum is Museum => Boolean(museum))
      : this.museums;
    if (selectedMuseums.length === 0) return [];
    const scopedOptions = { ...options, limit: options.limit ?? 25 };
    return selectedMuseums.map((museum) => ({
      museumId: museum.id,
      name: museum.name,
      dataSource: museum.getDataSource(scopedOptions),
    }));
  }

  /**
   * Optional progress callbacks for search (e.g. to log which museum is being searched).
   */
  searchProgress?: {
    onMuseumStart?(museumId: string, name: string): void;
    onMuseumComplete?(
      museumId: string,
      name: string,
      resultCount: number,
    ): void;
  };

  async search(options: SearchOptions): Promise<ArtworkResult[]> {
    const selectedMuseums = options.museums?.length
      ? options.museums
          .map((museumId) => this.museumMap.get(museumId))
          .filter((museum): museum is Museum => Boolean(museum))
      : this.museums;

    if (selectedMuseums.length === 0) return [];

    // Each museum gets the full limit (not divided among museums)
    const scopedOptions = { ...options, limit: options.limit ?? 25 };

    const progress = this.searchProgress;

    const results = await Promise.allSettled(
      selectedMuseums.map(async (museum) => {
        progress?.onMuseumStart?.(museum.id, museum.name);
        const value = await museum.search(scopedOptions);
        progress?.onMuseumComplete?.(museum.id, museum.name, value.length);
        return value;
      }),
    );

    // Return all results without limiting the aggregated set
    const combined = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
    return combined;
  }

  async getById(globalId: string): Promise<ArtworkResult | null> {
    const [museumId, ...rest] = globalId.split(":");
    if (!museumId || rest.length === 0) return null;
    const museum = this.museumMap.get(museumId);
    if (!museum) return null;
    return museum.getById(rest.join(":"));
  }
}
