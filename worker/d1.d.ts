// Minimal ambient types for the Cloudflare D1 binding, covering only the prepared-statement calls
// this Worker uses. The full runtime is provided by the Workers platform. Kept small and local in
// the same spirit as gsi.d.ts, so we do not pull in @cloudflare/workers-types (which would also
// redefine the DOM globals this project relies on).

interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
