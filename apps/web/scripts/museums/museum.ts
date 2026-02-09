import type { ArtworkResult, SearchOptions } from "@/lib/museums/types";

export abstract class Museum {
  abstract readonly id: string;
  abstract readonly name: string;

  abstract search(options: SearchOptions): Promise<ArtworkResult[]>;
  abstract getById(localId: string): Promise<ArtworkResult | null>;
  /** Human-readable data source description (e.g. SQLite database path). */
  abstract getDataSource(options: SearchOptions): string;

  /** Default path to raw source data (directory or file) for loadDataIntoSqlite. */
  abstract getDefaultSourcePath(): string;
  /** Path where loadDataIntoSqlite writes the SQLite database. */
  abstract getProcessedDbPath(): string;
  /** Load raw source data into the processed SQLite database. */
  abstract loadDataIntoSqlite(sourcePath: string): Promise<void>;

  protected createGlobalId(localId: string) {
    return `${this.id}:${localId}`;
  }

  protected withDefaults(options: SearchOptions) {
    return {
      limit: options.limit ?? 25,
      page: options.page ?? 0,
      publicDomainOnly: options.publicDomainOnly ?? false,
      hasImageOnly: options.hasImageOnly ?? true,
    };
  }
}
