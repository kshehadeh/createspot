/**
 * Type declarations for bun:sqlite (Bun built-in).
 * Used by museum data loaders and NGA adapter; runtime requires Bun.
 */
declare module "bun:sqlite" {
  export interface Statement {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
  }

  export class Database {
    constructor(filename: string, options?: { readonly?: boolean });
    exec(sql: string): void;
    query(sql: string): Statement;
    prepare(sql: string): Statement;
    transaction<F extends (...args: any[]) => any>(fn: F): F;
    close(): void;
  }
}
